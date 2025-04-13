import { BaseAgent, ContextoProyecto, AgentEventType } from './base-agent'; // Ajusta la ruta
import { MemoryAgent } from './memory-agent';
import { DashboardAgent } from './dashboard-agent';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * UI Design Agent - Crea sistemas de diseño coherentes
 * 
 * Este agente es responsable de:
 * 1. Definir paletas de colores y tipografía
 * 2. Diseñar componentes base UI
 * 3. Crear variables Tailwind personalizadas
 * 4. Asegurar accesibilidad (WCAG AA)
 * 5. Generar ejemplos visuales de implementación
 * 6. Comunicarse con otros agentes para mantener consistencia
 * 7. Generar componentes React/Vue basados en el sistema de diseño
 */
export class UIDesignAgent extends BaseAgent {
  private designSystem: Record<string, any> = {};
  private designMode: string = 'default';
  private memoryAgent: MemoryAgent;
  private dashboardAgent: DashboardAgent;

  constructor(userId: string) {
    super(userId);
    this.agentName = 'UIDesignAgent';
    this.memoryAgent = new MemoryAgent();
    this.dashboardAgent = new DashboardAgent();
    this.registerDesignEventHandlers();
  }

  /**
   * Método principal para ejecutar el UI Design Agent
   * @param contexto Contexto del proyecto
   * @param spec Especificación o comando a ejecutar
   */
  async run(contexto: ContextoProyecto, spec: string): Promise<void> {
    if (contexto.licencia === 'Community' && spec.includes('advanced')) {
      throw new Error('Community Edition no soporta diseños avanzados');
    }

    await this.registrarActividad(contexto, 'iniciando UIDesignAgent', { spec });

    try {
      if (spec.startsWith('mode:')) {
        const [_, mode, description] = spec.match(/mode:(\w+)\s+(.+)/) || [];
        if (mode && description) {
          this.designMode = mode;
          await this.createDesignSystem(contexto, description);
        } else {
          throw new Error('Formato inválido. Use "mode:MODE DESCRIPCIÓN"');
        }
      } else if (spec.startsWith('component:')) {
        const componentSpec = spec.substring('component:'.length).trim();
        await this.generateComponent(contexto, componentSpec);
      } else if (spec.startsWith('theme:')) {
        const themeSpec = spec.substring('theme:'.length).trim();
        await this.generateTheme(contexto, themeSpec);
      } else if (spec.startsWith('export:')) {
        const exportFormat = spec.substring('export:'.length).trim();
        await this.exportDesignSystem(contexto, exportFormat);
      } else if (spec.startsWith('load:')) {
        const designFile = spec.substring('load:'.length).trim();
        await this.loadDesignSystem(contexto, designFile);
      } else {
        await this.createDesignSystem(contexto, spec);
      }
    } catch (error) {
      await this.registrarActividad(contexto, 'error en UIDesignAgent', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Registra manejadores de eventos específicos
   */
  private registerDesignEventHandlers(): void {
    this.listenForEvent(AgentEventType.DESIGN_INFO_REQUESTED, async (message) => {
      await this.registrarActividad(null, `información de diseño solicitada por ${message.from}`, {});

      if (Object.keys(this.designSystem).length === 0) {
        await this.loadCurrentDesignSystem(null);
      }

      this.sendEvent(AgentEventType.DESIGN_INFO_PROVIDED, {
        designSystem: this.designSystem,
        timestamp: new Date().toISOString(),
      }, message.from);
    });

    this.listenForEvent(AgentEventType.DESIGN_UPDATED, async (message) => {
      await this.registrarActividad(null, `diseño actualizado por ${message.from}`, { component: message.content.component || 'sistema completo' });

      if (message.content.designSystem) {
        this.designSystem = message.content.designSystem;
        await this.saveDesignSystem(null);
      }
    });
  }

  /**
   * Crea un sistema de diseño completo
   * @param contexto Contexto del proyecto
   * @param projectDescription Descripción del proyecto/módulo
   */
  private async createDesignSystem(contexto: ContextoProyecto, projectDescription: string): Promise<void> {
    await this.registrarActividad(contexto, `creando sistema de diseño para: "${projectDescription}"`, {});

    const coreContext = this.readContext('core.md');
    const rulesContext = this.readContext('rules.md');

    let designPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Reglas Arquitectónicas
    ${rulesContext}
    
    # Tarea de UI Design Agent
    Actúa como el UI Design Agent de CJ.DevMind. Tu tarea es crear un sistema de diseño coherente para:
    
    "${projectDescription}"
    `;

    if (this.designMode === 'minimal') {
      designPrompt += `
      Genera un sistema de diseño minimalista con:
      1. Paleta de colores reducida (máximo 3 colores primarios)
      2. Tipografía simple (1-2 fuentes)
      3. Componentes esenciales con estilo minimalista
      4. Variables Tailwind personalizadas
      `;
    } else if (this.designMode === 'corporate') {
      designPrompt += `
      Genera un sistema de diseño corporativo con:
      1. Paleta de colores profesional (azules, grises)
      2. Tipografía serif para títulos, sans-serif para cuerpo
      3. Componentes con aspecto formal y profesional
      4. Variables Tailwind personalizadas
      `;
    } else if (this.designMode === 'creative') {
      designPrompt += `
      Genera un sistema de diseño creativo con:
      1. Paleta de colores vibrante y diversa
      2. Tipografía distintiva y expresiva
      3. Componentes con formas y animaciones únicas
      4. Variables Tailwind personalizadas
      `;
    } else {
      designPrompt += `
      Genera:
      1. Paleta de colores con códigos hexadecimales
      2. Tipografía y escala de tamaños
      3. Componentes base (botones, inputs, cards, etc.)
      4. Variables Tailwind personalizadas
      5. Ejemplos visuales de componentes clave
      `;
    }

    designPrompt += `
    Asegúrate de que el diseño sea accesible (WCAG AA) y responsive. Justifica tus decisiones de diseño en términos de usabilidad, consistencia y alineación con la identidad del proyecto.
    
    Además, proporciona la configuración en formato JSON para uso programático, con la siguiente estructura:
    \`\`\`json
    {
      "colors": {
        "primary": "#hexcode",
        "secondary": "#hexcode",
        ...
      },
      "typography": {
        "fontFamily": {
          "heading": "...",
          "body": "..."
        },
        "fontSize": {
          "xs": "...",
          ...
        }
      },
      "components": {
        "button": {
          "primary": "...",
          "secondary": "..."
        },
        ...
      }
    }
    \`\`\`
    
    Formatea tu respuesta en Markdown estructurado, incluyendo el JSON al final.
    `;

    let designSystem;
    let designSystemJson = {};

    try {
      designSystem = await this.ejecutarPrompt(contexto, designPrompt);
      const jsonMatch = designSystem.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        designSystemJson = JSON.parse(jsonMatch[1]);
        this.designSystem = designSystemJson;
      }

      await this.saveDesignSystem(contexto, designSystem);
      await this.generateTailwindConfig(contexto, designSystem);

      if (designSystemJson.components) {
        await this.generateBaseComponents(contexto, designSystemJson);
      }

      await this.memoryAgent.store(
        { designSystem: designSystemJson, description: projectDescription },
        { tipo: 'design', proyectoId: contexto.id }
      );

      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        estado: 'sistema de diseño creado',
        designSystem: designSystemJson,
      });

      this.sendEvent(AgentEventType.DESIGN_CREATED, {
        designSystem: this.designSystem,
        projectDescription,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      await this.registrarActividad(contexto, 'error creando sistema de diseño', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Genera un componente específico basado en el sistema de diseño
   * @param contexto Contexto del proyecto
   * @param componentSpec Especificación del componente
   */
  private async generateComponent(contexto: ContextoProyecto, componentSpec: string): Promise<void> {
    await this.registrarActividad(contexto, `generando componente: "${componentSpec}"`, {});

    if (Object.keys(this.designSystem).length === 0) {
      await this.loadCurrentDesignSystem(contexto);
    }

    let framework = 'react';
    let componentName = componentSpec;

    if (componentSpec.includes(':')) {
      const [fw, name] = componentSpec.split(':', 2);
      framework = fw.toLowerCase();
      componentName = name.trim();
    }

    const componentPrompt = `
    # Sistema de Diseño
    ${JSON.stringify(this.designSystem, null, 2)}
    
    # Tarea de Generación de Componente
    Actúa como el UI Design Agent de CJ.DevMind. Tu tarea es crear un componente de ${framework} llamado "${componentName}" que siga el sistema de diseño proporcionado.
    
    El componente debe:
    1. Seguir las convenciones de estilo del sistema de diseño
    2. Ser accesible (WCAG AA)
    3. Ser responsive
    4. Incluir estados (hover, focus, disabled, etc. si aplica)
    5. Estar bien documentado con JSDoc/TSDoc
    
    Proporciona:
    1. El código del componente
    2. Un ejemplo de uso
    3. Documentación de props/API
    
    Usa Tailwind CSS para los estilos.
    `;

    try {
      const componentResult = await this.ejecutarPrompt(contexto, componentPrompt);
      const codeBlocks = this.extractCodeBlocks(componentResult);

      if (codeBlocks.length === 0) {
        throw new Error('No se encontraron bloques de código en la respuesta');
      }

      let fileExtension = '.tsx';
      if (framework === 'vue') fileExtension = '.vue';
      else if (framework === 'angular') fileExtension = '.component.ts';
      else if (framework === 'svelte') fileExtension = '.svelte';

      const componentsDir = path.join(process.cwd(), 'components');
      if (!fs.existsSync(componentsDir)) {
        fs.mkdirSync(componentsDir, { recursive: true });
      }

      const componentPath = path.join(componentsDir, `${this.pascalCase(componentName)}${fileExtension}`);
      fs.writeFileSync(componentPath, codeBlocks[0].code, 'utf-8');

      if (codeBlocks.length > 1) {
        const examplePath = path.join(componentsDir, `${this.pascalCase(componentName)}Example${fileExtension}`);
        fs.writeFileSync(examplePath, codeBlocks[1].code, 'utf-8');
      }

      const docsPath = path.join(componentsDir, `${this.pascalCase(componentName)}.md`);
      fs.writeFileSync(docsPath, componentResult, 'utf-8');

      await this.memoryAgent.store(
        { componentName, framework, path: componentPath },
        { tipo: 'component', proyectoId: contexto.id }
      );

      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        estado: 'componente generado',
        component: { name: componentName, path: componentPath },
      });

      this.sendEvent(AgentEventType.COMPONENT_CREATED, {
        componentName: this.pascalCase(componentName),
        framework,
        path: componentPath,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      await this.registrarActividad(contexto, 'error generando componente', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Genera un tema completo basado en una descripción
   * @param contexto Contexto del proyecto
   * @param themeSpec Especificación del tema
   */
  private async generateTheme(contexto: ContextoProyecto, themeSpec: string): Promise<void> {
    await this.registrarActividad(contexto, `generando tema: "${themeSpec}"`, {});

    let themeType = 'light';
    let themeDescription = themeSpec;

    if (themeSpec.startsWith('dark:')) {
      themeType = 'dark';
      themeDescription = themeSpec.substring('dark:'.length).trim();
    } else if (themeSpec.startsWith('light:')) {
      themeDescription = themeSpec.substring('light:'.length).trim();
    }

    const coreContext = this.readContext('core.md');

    const themePrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Tarea de Generación de Tema
    Actúa como el UI Design Agent de CJ.DevMind. Tu tarea es crear un tema ${themeType} basado en la siguiente descripción:
    
    "${themeDescription}"
    
    Genera:
    1. Paleta de colores completa con códigos hexadecimales
    2. Variables CSS para el tema
    3. Configuración Tailwind para el tema
    
    El tema debe ser accesible (WCAG AA) y coherente.
    
    Proporciona el resultado en formato JSON con la siguiente estructura:
    \`\`\`json
    {
      "name": "Nombre del tema",
      "type": "${themeType}",
      "colors": {
        "primary": "#hexcode",
        "secondary": "#hexcode",
        ...
      },
      "cssVariables": {
        "--color-primary": "var(--color-primary-${themeType}, #hexcode)",
        ...
      },
      "tailwind": {
        "theme": {
          "extend": {
            "colors": {
              ...
            }
          }
        }
      }
    }
    \`\`\`
    
    Además, proporciona una explicación de las decisiones de diseño tomadas.
    `;

    try {
      const themeResult = await this.ejecutarPrompt(contexto, themePrompt);
      const jsonMatch = themeResult.match(/```json\n([\s\S]*?)\n```/);
      let themeData = {};

      if (jsonMatch && jsonMatch[1]) {
        themeData = JSON.parse(jsonMatch[1]);
      }

      const themesDir = path.join(process.cwd(), 'context', 'frontend', 'themes');
      if (!fs.existsSync(themesDir)) {
        fs.mkdirSync(themesDir, { recursive: true });
      }

      const themeName = themeData.name ? this.kebabCase(themeData.name) : `${themeType}-theme-${new Date().getTime()}`;
      const themePath = path.join(themesDir, `${themeName}.json`);
      fs.writeFileSync(themePath, JSON.stringify(themeData, null, 2), 'utf-8');

      const themeDocsPath = path.join(themesDir, `${themeName}.md`);
      fs.writeFileSync(themeDocsPath, themeResult, 'utf-8');

      if (themeData.cssVariables) {
        const cssContent = `
/* Tema: ${themeData.name || themeName} */
:root {
${Object.entries(themeData.cssVariables).map(([key, value]) => `  ${key}: ${value};`).join('\n')}
}
        `.trim();
        const cssPath = path.join(themesDir, `${themeName}.css`);
        fs.writeFileSync(cssPath, cssContent, 'utf-8');
      }

      await this.memoryAgent.store(
        { themeName, themeType, themeData },
        { tipo: 'theme', proyectoId: contexto.id }
      );

      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        estado: 'tema generado',
        theme: { name: themeName, type: themeType },
      });

      this.sendEvent(AgentEventType.THEME_CREATED, {
        themeName,
        themeType,
        themePath,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      await this.registrarActividad(contexto, 'error generando tema', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Exporta el sistema de diseño a diferentes formatos
   * @param contexto Contexto del proyecto
   * @param exportFormat Formato de exportación
   */
  private async exportDesignSystem(contexto: ContextoProyecto, exportFormat: string): Promise<void> {
    await this.registrarActividad(contexto, `exportando sistema de diseño a formato: ${exportFormat}`, {});

    if (Object.keys(this.designSystem).length === 0) {
      await this.loadCurrentDesignSystem(contexto);
    }

    const exportDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    switch (exportFormat.toLowerCase()) {
      case 'css':
        await this.exportToCSS(contexto, exportDir);
        break;
      case 'scss':
        await this.exportToSCSS(contexto, exportDir);
        break;
      case 'figma':
        await this.exportToFigma(contexto, exportDir);
        break;
      case 'storybook':
        await this.exportToStorybook(contexto, exportDir);
        break;
      default:
        throw new Error(`Formato de exportación no soportado: ${exportFormat}`);
    }
  }

  /**
   * Exporta el sistema de diseño a variables CSS
   * @param contexto Contexto del proyecto
   * @param exportDir Directorio de exportación
   */
  private async exportToCSS(contexto: ContextoProyecto, exportDir: string): Promise<void> {
    const cssPrompt = `
    # Sistema de Diseño
    ${JSON.stringify(this.designSystem, null, 2)}
    
    # Tarea de Exportación a CSS
    Convierte el sistema de diseño proporcionado a variables CSS.
    
    Incluye:
    1. Variables para colores
    2. Variables para tipografía
    3. Variables para espaciado
    4. Variables para bordes y sombras
    
    Devuelve solo el código CSS, sin explicaciones adicionales.
    `;

    try {
      const cssResult = await this.ejecutarPrompt(contexto, cssPrompt);
      const cssCode = cssResult.replace(/```css|```/g, '').trim();
      const cssPath = path.join(exportDir, 'design-system.css');
      fs.writeFileSync(cssPath, cssCode, 'utf-8');

      await this.registrarActividad(contexto, 'CSS exportado', { path: cssPath });
    } catch (error) {
      await this.registrarActividad(contexto, 'error exportando a CSS', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Exporta el sistema de diseño a variables SCSS
   * @param contexto Contexto del proyecto
   * @param exportDir Directorio de exportación
   */
  private async exportToSCSS(contexto: ContextoProyecto, exportDir: string): Promise<void> {
    const scssPrompt = `
    # Sistema de Diseño
    ${JSON.stringify(this.designSystem, null, 2)}
    
    # Tarea de Exportación a SCSS
    Convierte el sistema de diseño proporcionado a variables y mixins SCSS.
    
    Incluye:
    1. Variables para colores
    2. Variables para tipografía
    3. Variables para espaciado
    4. Mixins para componentes comunes
    5. Funciones útiles
    
    Organiza el código en archivos separados (_colors.scss, _typography.scss, etc.) y un archivo principal que los importe.
    
    Devuelve el código SCSS para cada archivo, indicando claramente el nombre del archivo antes de cada bloque de código.
    `;

    try {
      const scssResult = await this.ejecutarPrompt(contexto, scssPrompt);
      const fileRegex = /## ([_a-zA-Z0-9-]+\.scss)\s+```scss\s+([\s\S]*?)```/g;
      const scssDir = path.join(exportDir, 'scss');
      if (!fs.existsSync(scssDir)) {
        fs.mkdirSync(scssDir, { recursive: true });
      }

      let filesCreated = 0;
      let match;
      while ((match = fileRegex.exec(scssResult)) !== null) {
        const fileName = match[1];
        const fileContent = match[2].trim();
        const filePath = path.join(scssDir, fileName);
        fs.writeFileSync(filePath, fileContent, 'utf-8');
        filesCreated++;
      }

      if (filesCreated === 0) {
        const scssPath = path.join(scssDir, 'design-system.scss');
        const scssCode = scssResult.replace(/```scss|```/g, '').trim();
        fs.writeFileSync(scssPath, scssCode, 'utf-8');
      }

      await this.registrarActividad(contexto, 'SCSS exportado', { path: scssDir, files: filesCreated });
    } catch (error) {
      await this.registrarActividad(contexto, 'error exportando a SCSS', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Exporta el sistema de diseño a formato Figma (JSON para plugin)
   * @param contexto Contexto del proyecto
   * @param exportDir Directorio de exportación
   */
  private async exportToFigma(contexto: ContextoProyecto, exportDir: string): Promise<void> {
    const figmaPrompt = `
    # Sistema de Diseño
    ${JSON.stringify(this.designSystem, null, 2)}
    
    # Tarea de Exportación a Figma
    Convierte el sistema de diseño proporcionado a un formato JSON que pueda ser importado por plugins de Figma como "Tokens Studio for Figma".
    
    El formato debe seguir esta estructura:
    \`\`\`json
    {
      "global": {
        "colors": {
          "primary": { "value": "#hexcode" },
          ...
        },
        "typography": {
          "fontFamilies": {
            "heading": { "value": "Font Name" },
            ...
          },
          "fontSizes": {
            "xs": { "value": "12px" },
            ...
          },
          ...
        },
        ...
      },
      "light": {},
      "dark": {}
    }
    \`\`\`
    
    Devuelve solo el JSON, sin explicaciones adicionales.
    `;

    try {
      const figmaResult = await this.ejecutarPrompt(contexto, figmaPrompt);
      const jsonMatch = figmaResult.match(/```json\n([\s\S]*?)\n```/) || figmaResult.match(/```\n([\s\S]*?)\n```/) || [null, figmaResult];
      const figmaJson = jsonMatch[1].trim();
      const figmaPath = path.join(exportDir, 'figma-tokens.json');
      fs.writeFileSync(figmaPath, figmaJson, 'utf-8');

      const readmePath = path.join(exportDir, 'FIGMA-README.md');
      const readmeContent = `
# Instrucciones para importar tokens en Figma
1. Instala el plugin "Tokens Studio for Figma"
2. Abre tu proyecto en Figma
3. Abre el plugin desde el menú de plugins
4. Haz clic en "Import" y selecciona el archivo \`figma-tokens.json\`
5. Aplica los tokens a tu diseño
Para más información, visita: https://tokens.studio/
      `.trim();
      fs.writeFileSync(readmePath, readmeContent, 'utf-8');

      await this.registrarActividad(contexto, 'Figma tokens exportados', { path: figmaPath });
    } catch (error) {
      await this.registrarActividad(contexto, 'error exportando a Figma', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Exporta el sistema de diseño a Storybook
   * @param contexto Contexto del proyecto
   * @param exportDir Directorio de exportación
   */
  private async exportToStorybook(contexto: ContextoProyecto, exportDir: string): Promise<void> {
    try {
      const storybookDir = path.join(process.cwd(), '.storybook');
      if (!fs.existsSync(storybookDir)) {
        await this.registrarActividad(contexto, 'instalando Storybook', {});
        execSync('npx sb init --builder webpack5', { stdio: 'inherit' });
      }

      const storybookPrompt = `
      # Sistema de Diseño
      ${JSON.stringify(this.designSystem, null, 2)}
      
      # Tarea de Exportación a Storybook
      Crea historias de Storybook para los componentes básicos del sistema de diseño.
      
      Incluye:
      1. Historia para la paleta de colores
      2. Historia para la tipografía
      3. Historias para componentes básicos (botones, inputs, cards, etc.)
      
      Usa el formato CSF (Component Story Format) moderno.
      
      Devuelve el código para cada archivo de historia, indicando claramente el nombre del archivo antes de cada bloque de código.
      `;

      const storybookResult = await this.ejecutarPrompt(contexto, storybookPrompt);
      const fileRegex = /## ([a-zA-Z0-9-]+\.stories\.[jt]sx?)\s+```[jt]sx?\s+([\s\S]*?)```/g;
      const storiesDir = path.join(process.cwd(), 'stories');
      if (!fs.existsSync(storiesDir)) {
        fs.mkdirSync(storiesDir, { recursive: true });
      }

      let filesCreated = 0;
      let match;
      while ((match = fileRegex.exec(storybookResult)) !== null) {
        const fileName = match[1];
        const fileContent = match[2].trim();
        const filePath = path.join(storiesDir, fileName);
        fs.writeFileSync(filePath, fileContent, 'utf-8');
        filesCreated++;
      }

      if (filesCreated === 0) {
        const storiesPath = path.join(storiesDir, 'DesignSystem.stories.tsx');
        const storiesCode = storybookResult.replace(/```[jt]sx?|```/g, '').trim();
        fs.writeFileSync(storiesPath, storiesCode, 'utf-8');
      }

      const storybookPreviewPath = path.join(process.cwd(), '.storybook', 'preview.js');
      if (fs.existsSync(storybookPreviewPath)) {
        const previewContent = fs.readFileSync(storybookPreviewPath, 'utf-8');
        if (!previewContent.includes('import "../src/index.css"')) {
          const updatedPreview = `import "../src/index.css";\n${previewContent}`;
          fs.writeFileSync(storybookPreviewPath, updatedPreview, 'utf-8');
        }
      }

      await this.registrarActividad(contexto, 'Storybook exportado', { path: storiesDir, files: filesCreated });
    } catch (error) {
      await this.registrarActividad(contexto, 'error exportando a Storybook', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Carga un sistema de diseño desde un archivo
   * @param contexto Contexto del proyecto
   * @param designFile Ruta al archivo de sistema de diseño
   */
  private async loadDesignSystem(contexto: ContextoProyecto, designFile: string): Promise<void> {
    await this.registrarActividad(contexto, `cargando sistema de diseño desde: ${designFile}`, {});

    let filePath = designFile;
    if (!path.isAbsolute(designFile)) {
      filePath = path.join(process.cwd(), 'context', 'frontend', designFile);
      const extensions = ['.json', '.md'];
      for (const ext of extensions) {
        const pathWithExt = `${filePath}${ext}`;
        if (fs.existsSync(pathWithExt)) {
          filePath = pathWithExt;
          break;
        }
      }
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`Archivo no encontrado: ${filePath}`);
    }

    try {
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const fileExt = path.extname(filePath);

      if (fileExt === '.json') {
        this.designSystem = JSON.parse(fileContent);
      } else {
        const jsonMatch = fileContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          this.designSystem = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('No se encontró JSON en el archivo Markdown');
        }
      }

      this.sendEvent(AgentEventType.DESIGN_LOADED, {
        designSystem: this.designSystem,
        source: filePath,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      await this.registrarActividad(contexto, 'error cargando sistema de diseño', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Carga el sistema de diseño actual desde el directorio de contexto
   * @param contexto Contexto del proyecto
   */
  private async loadCurrentDesignSystem(contexto: ContextoProyecto | null): Promise<void> {
    const designSystemPath = path.join(process.cwd(), 'context', 'frontend', 'design-system.md');
    const jsonPath = path.join(process.cwd(), 'context', 'frontend', 'design-system.json');

    if (fs.existsSync(jsonPath)) {
      const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
      this.designSystem = JSON.parse(jsonContent);
      return;
    }

    if (fs.existsSync(designSystemPath)) {
      const mdContent = fs.readFileSync(designSystemPath, 'utf-8');
      const jsonMatch = mdContent.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch && jsonMatch[1]) {
        this.designSystem = JSON.parse(jsonMatch[1]);
        return;
      }
    }

    this.designSystem = {};
  }

  /**
   * Guarda el sistema de diseño en el directorio de contexto
   * @param contexto Contexto del proyecto
   * @param designSystem Contenido completo del sistema de diseño (Markdown)
   */
  private async saveDesignSystem(contexto: ContextoProyecto | null, designSystem?: string): Promise<void> {
    const frontendDir = path.join(process.cwd(), 'context', 'frontend');
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }

    const jsonPath = path.join(frontendDir, 'design-system.json');
    fs.writeFileSync(jsonPath, JSON.stringify(this.designSystem, null, 2), 'utf-8');

    if (designSystem) {
      const mdPath = path.join(frontendDir, 'design-system.md');
      fs.writeFileSync(mdPath, designSystem, 'utf-8');
    }

    if (contexto) {
      await this.guardarContexto(contexto, jsonPath);
    }
  }

  /**
   * Genera un archivo de configuración Tailwind basado en el sistema de diseño
   * @param contexto Contexto del proyecto
   * @param designSystem Contenido del sistema de diseño
   */
  private async generateTailwindConfig(contexto: ContextoProyecto, designSystem: string): Promise<void> {
    await this.registrarActividad(contexto, 'generando configuración Tailwind', {});

    const jsonMatch = designSystem.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error('No se encontró JSON en el sistema de diseño');
    }

    const designData = JSON.parse(jsonMatch[1]);
    const tailwindPrompt = `
    # Sistema de Diseño
    ${JSON.stringify(designData, null, 2)}
    
    # Tarea de Generación de Configuración Tailwind
    Genera un archivo de configuración Tailwind (tailwind.config.js) que implemente el sistema de diseño proporcionado.
    
    La configuración debe:
    1. Extender los colores con la paleta del sistema de diseño
    2. Configurar la tipografía (fontFamily, fontSize, etc.)
    3. Personalizar otros aspectos relevantes (spacing, borderRadius, etc.)
    
    Devuelve solo el código JavaScript del archivo de configuración, sin explicaciones adicionales.
    `;

    try {
      const tailwindResult = await this.ejecutarPrompt(contexto, tailwindPrompt);
      const jsCode = tailwindResult.replace(/```js|```javascript|```/g, '').trim();
      const configPath = path.join(process.cwd(), 'tailwind.config.js');
      fs.writeFileSync(configPath, jsCode, 'utf-8');

      await this.registrarActividad(contexto, 'configuración Tailwind generada', { path: configPath });
    } catch (error) {
      await this.registrarActividad(contexto, 'error generando configuración Tailwind', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Genera componentes base a partir del sistema de diseño
   * @param contexto Contexto del proyecto
   * @param designSystem Sistema de diseño en formato JSON
   */
  private async generateBaseComponents(contexto: ContextoProyecto, designSystem: Record<string, any>): Promise<void> {
    if (!designSystem.components || Object.keys(designSystem.components).length === 0) {
      await this.registrarActividad(contexto, 'no hay componentes definidos en el sistema de diseño', {});
      return;
    }

    const componentsDir = path.join(process.cwd(), 'components');
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true });
    }

    for (const componentName of Object.keys(designSystem.components)) {
      await this.generateComponent(contexto, `react:${componentName}`);
    }
  }

  /**
   * Propone mejoras basadas en el historial de diseños
   * @param contexto Contexto del proyecto
   */
  async proponerMejora(contexto: ContextoProyecto): Promise<string | null> {
    const historial = await this.memoryAgent.buscar<{ designSystem: any, description: string }>({ tipo: 'design', proyectoId: contexto.id });
    if (historial.length < 2) return null;

    const coloresFrecuentes = historial.reduce((acc, entry) => {
      const colores = entry.designSystem.colors || {};
      Object.entries(colores).forEach(([nombre, valor]) => {
        if (typeof valor === 'string') {
          acc[valor] = (acc[valor] || 0) + 1;
        }
      });
      return acc;
    }, {} as Record<string, number>);

    const colorDominante = Object.entries(coloresFrecuentes).find(([, count]) => count > 2);
    if (colorDominante) {
      const [color] = colorDominante;
      await this.registrarActividad(contexto, 'mejora propuesta', { accion: 'estandarizar color', color });
      return `Proponiendo estandarizar el color ${color} como dominante`;
    }

    const fuentesFrecuentes = historial.reduce((acc, entry) => {
      const fuentes = entry.designSystem.typography?.fontFamily || {};
      Object.values(fuentes).forEach((fuente: any) => {
        acc[fuente] = (acc[fuente] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const fuenteDominante = Object.entries(fuentesFrecuentes).find(([, count]) => count > 2);
    if (fuenteDominante) {
      const [fuente] = fuenteDominante;
      await this.registrarActividad(contexto, 'mejora propuesta', { accion: 'estandarizar fuente', fuente });
      return `Proponiendo estandarizar la fuente ${fuente} como principal`;
    }

    return null;
  }

  /**
   * Extrae bloques de código de una respuesta de texto
   */
  private extractCodeBlocks(text: string): Array<{ language: string, code: string }> {
    const codeBlocks = [];
    const regex = /```([a-zA-Z]+)?\n([\s\S]*?)```/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const language = match[1] || 'plaintext';
      const code = match[2];
      codeBlocks.push({ language, code });
    }
    return codeBlocks;
  }

  /**
   * Lee un archivo de contexto
   */
  private readContext(contextFile: string): string {
    const contextPath = path.join(process.cwd(), 'context', contextFile);
    if (fs.existsSync(contextPath)) {
      return fs.readFileSync(contextPath, 'utf-8');
    }
    return '';
  }

  /**
   * Convierte un string a formato PascalCase
   */
  private pascalCase(str: string): string {
    return str
      .split(/[-_\s]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Convierte un string a formato kebab-case
   */
  private kebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }
}