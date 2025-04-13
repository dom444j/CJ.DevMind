import { BaseAgent, AgentEventType, ContextoProyecto } from './base-agent';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import * as vscode from 'vscode'; // Para integración con VS Code

// Importaciones de agentes relacionados
import { StyleAgent } from './style-agent';
import { TestAgent } from './test-agent';
import { CodeReviewAgent } from './code-review-agent';

// Interfaces para tipado
interface ComponentConfig {
  name: string;
  library: string;
  styling: string;
  outputDir: string;
  features: string[];
  framework?: string;
  accessibility?: string;
  responsive?: boolean;
  darkMode?: boolean;
  i18n?: boolean;
}

interface ComponentResult {
  name: string;
  files: {
    component: string;
    storybook?: string;
    test?: string;
    docs?: string;
    styles?: string;
  };
  path: string;
  framework: string;
}

/**
 * Component Agent - Crea componentes en múltiples frameworks basados en el sistema de diseño
 * 
 * Este agente es responsable de:
 * 1. Generar componentes en múltiples frameworks (React, Vue, Angular, Svelte)
 * 2. Implementar lógica de interacción y estados
 * 3. Asegurar accesibilidad (WCAG AA) y responsividad
 * 4. Crear historias de Storybook para documentación visual
 * 5. Generar pruebas para los componentes
 * 6. Implementar variantes y temas según el sistema de diseño
 * 7. Optimizar rendimiento con memoización cuando sea necesario
 * 8. Generar documentación de uso y API del componente
 * 9. Aplicar estilos consistentes basados en el sistema de diseño (con StyleAgent)
 * 10. Generar estados (hover, focus, disabled) para componentes interactivos
 */
export class ComponentAgent extends BaseAgent {
  private designSystem: any = {};
  private componentLibrary: string = 'react';
  private stylingMethod: string = 'tailwind';
  private componentsDir: string = '';
  private lastGeneratedComponents: string[] = [];
  private styleAgent: StyleAgent | null = null;
  private testAgent: TestAgent | null = null;
  private codeReviewAgent: CodeReviewAgent | null = null;
  private supportedFrameworks: string[] = ['react', 'vue', 'angular', 'svelte'];
  private accessibilityLevel: string = 'AA'; // WCAG nivel AA por defecto
  
  constructor(userId: string) {
    super(userId);
    this.agentName = 'ComponentAgent';
    this.registerEventHandlers();
    
    // Inicializar agentes relacionados si la licencia lo permite
    this.initializeRelatedAgents();
  }
  
  /**
   * Inicializa agentes relacionados según la licencia
   */
  private initializeRelatedAgents(): void {
    try {
      // Estos agentes solo están disponibles en licencias Professional y Enterprise
      if (this.licenseType !== 'Community') {
        this.styleAgent = new StyleAgent(this.userId);
        this.testAgent = new TestAgent(this.userId);
        this.codeReviewAgent = new CodeReviewAgent(this.userId);
        this.log('🔄 Agentes relacionados inicializados correctamente');
      } else {
        this.log('ℹ️ Agentes relacionados no disponibles en licencia Community');
      }
    } catch (error) {
      this.log(`❌ Error inicializando agentes relacionados: ${error.message}`, 'error');
    }
  }
  
  /**
   * Registra manejadores de eventos para comunicación con otros agentes
   */
  private registerEventHandlers(): void {
    // Escuchar actualizaciones del sistema de diseño
    this.listenForEvent(AgentEventType.DESIGN_SYSTEM_UPDATED, (message) => {
      this.log(`🎨 Sistema de diseño actualizado por ${message.from}`);
      this.designSystem = message.content.designSystem;
    });
    
    // Escuchar solicitudes de componentes
    this.listenForEvent(AgentEventType.COMPONENT_REQUESTED, async (message) => {
      this.log(`🧩 Solicitud de componente recibida de ${message.from}: "${message.content.spec}"`);
      
      try {
        // Crear contexto del proyecto
        const contexto: ContextoProyecto = {
          id: message.content.projectId || 'default',
          nombre: message.content.projectName || 'Proyecto sin nombre',
          licencia: this.licenseType,
          usuario: this.userId,
          timestamp: new Date().toISOString(),
          directorio: message.content.projectDir || process.cwd()
        };
        
        // Generar el componente
        const componentResult = await this.run(contexto, message.content.spec);
        
        // Enviar respuesta al agente solicitante
        this.sendEvent(AgentEventType.COMPONENT_CREATED, {
          componentName: componentResult.name,
          path: componentResult.path,
          files: componentResult.files,
          framework: componentResult.framework,
          timestamp: new Date().toISOString()
        }, message.from);
      } catch (error) {
        this.log(`❌ Error generando componente: ${error.message}`, 'error');
        
        // Enviar error al agente solicitante
        this.sendEvent(AgentEventType.COMPONENT_ERROR, {
          error: error.message,
          spec: message.content.spec,
          timestamp: new Date().toISOString()
        }, message.from);
      }
    });
    
    // Escuchar solicitudes de estilo (desde StyleAgent)
    this.listenForEvent(AgentEventType.STYLE_APPLIED, (message) => {
      this.log(`💅 Estilos aplicados por ${message.from} al componente ${message.content.componentName}`);
      // Actualizar el componente con los nuevos estilos si es necesario
      if (message.content.componentName && this.lastGeneratedComponents.includes(message.content.componentName)) {
        this.updateComponentStyles(message.content.componentName, message.content.styles);
      }
    });
  }
  
  /**
   * Ejecuta el Component Agent para crear componentes
   * @param contexto Contexto del proyecto
   * @param componentSpec Especificación del componente a crear
   * @returns Resultado del componente generado
   */
  async run(contexto: ContextoProyecto, componentSpec: string): Promise<ComponentResult> {
    await this.registrarActividad(contexto, 'iniciando ComponentAgent', { componentSpec });
    this.log(`🧩 Component Agent creando componente: "${componentSpec}"`);
    
    try {
      // Analizar la especificación para extraer configuración
      const config = await this.analyzeComponentSpec(contexto, componentSpec);
      
      // Actualizar configuración del agente
      this.componentLibrary = config.library || this.componentLibrary;
      this.stylingMethod = config.styling || this.stylingMethod;
      this.accessibilityLevel = config.accessibility || this.accessibilityLevel;
      
      // Validar que el framework esté soportado
      if (!this.supportedFrameworks.includes(this.componentLibrary)) {
        throw new Error(`Framework no soportado: ${this.componentLibrary}. Frameworks disponibles: ${this.supportedFrameworks.join(', ')}`);
      }
      
      // Cargar sistema de diseño si no está ya cargado
      if (Object.keys(this.designSystem).length === 0) {
        await this.loadDesignSystem(contexto);
      }
      
      // Extraer nombre del componente de la especificación
      const componentName = config.name || await this.extractComponentName(contexto, componentSpec);
      
      // Determinar directorio de componentes
      this.componentsDir = config.outputDir || path.join(contexto.directorio, 'components');
      
      // Crear directorio si no existe
      if (!fs.existsSync(this.componentsDir)) {
        fs.mkdirSync(this.componentsDir, { recursive: true });
      }
      
      // Generar componente según el framework seleccionado
      const result = await this.generateComponent(contexto, componentName, componentSpec, config);
      
      // Solicitar estilos al StyleAgent si está disponible
      if (this.styleAgent && contexto.licencia !== 'Community') {
        await this.requestStyles(contexto, componentName, config);
      }
      
      // Solicitar pruebas al TestAgent si está disponible
      if (this.testAgent && contexto.licencia !== 'Community') {
        await this.requestTests(contexto, componentName, config);
      }
      
      // Solicitar revisión de código al CodeReviewAgent si está disponible
      if (this.codeReviewAgent && contexto.licencia !== 'Community') {
        await this.requestCodeReview(contexto, componentName, result.files.component);
      }
      
      // Registrar componente generado
      this.lastGeneratedComponents.push(componentName);
      
      // Notificar a otros agentes sobre el nuevo componente
      this.notifyComponentCreated(contexto, componentName, result);
      
      // Mostrar resultado
      this.log('\n✅ Componente generado con éxito:');
      Object.entries(result.files).forEach(([type, file]) => {
        if (file) this.log(`- ${componentName}.${this.getFileExtension(type, this.componentLibrary)}`);
      });
      
      await this.registrarActividad(contexto, 'componente generado', { 
        componentName, 
        framework: this.componentLibrary,
        files: Object.keys(result.files).length
      });
      
      return {
        name: componentName,
        files: result.files,
        path: path.join(this.componentsDir, `${componentName}.${this.getFileExtension('component', this.componentLibrary)}`),
        framework: this.componentLibrary
      };
    } catch (error) {
      this.log('❌ Error generando componente:', 'error');
      this.log(error.message, 'error');
      await this.registrarActividad(contexto, 'error generando componente', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Analiza la especificación del componente para extraer configuración
   * @param contexto Contexto del proyecto
   * @param componentSpec Especificación del componente
   */
  private async analyzeComponentSpec(contexto: ContextoProyecto, componentSpec: string): Promise<ComponentConfig> {
    await this.registrarActividad(contexto, 'analizando especificación', { componentSpec });
    this.log('🔍 Analizando especificación del componente...');
    
    // Configuración por defecto
    const config: ComponentConfig = {
      name: '',
      library: 'react',
      styling: 'tailwind',
      outputDir: path.join(contexto.directorio, 'components'),
      features: [],
      accessibility: 'AA',
      responsive: true,
      darkMode: false,
      i18n: false
    };
    
    // Buscar opciones específicas en la especificación
    if (componentSpec.includes('framework:') || componentSpec.includes('library:')) {
      const match = componentSpec.match(/(?:framework|library):\s*([a-zA-Z0-9-]+)/);
      if (match) config.library = match[1].toLowerCase();
    }
    
    if (componentSpec.includes('styling:')) {
      const match = componentSpec.match(/styling:\s*([a-zA-Z0-9-]+)/);
      if (match) config.styling = match[1].toLowerCase();
    }
    
    if (componentSpec.includes('output:')) {
      const match = componentSpec.match(/output:\s*([a-zA-Z0-9-/\\]+)/);
      if (match) config.outputDir = path.resolve(match[1]);
    }
    
    if (componentSpec.includes('name:')) {
      const match = componentSpec.match(/name:\s*([a-zA-Z0-9]+)/);
      if (match) config.name = match[1];
    }
    
    if (componentSpec.includes('accessibility:')) {
      const match = componentSpec.match(/accessibility:\s*([A-]+)/);
      if (match) config.accessibility = match[1];
    }
    
    // Detectar características solicitadas
    const featureKeywords = [
      'accesible', 'responsive', 'animated', 'themed', 
      'dark-mode', 'i18n', 'form', 'validation', 'memoized'
    ];
    
    for (const keyword of featureKeywords) {
      if (componentSpec.toLowerCase().includes(keyword)) {
        config.features.push(keyword);
        
        // Configurar opciones específicas basadas en características
        if (keyword === 'dark-mode') config.darkMode = true;
        if (keyword === 'i18n') config.i18n = true;
        if (keyword === 'responsive') config.responsive = true;
      }
    }
    
    // Si no se especificó un nombre, intentar extraerlo de la especificación
    if (!config.name) {
      config.name = await this.extractComponentName(contexto, componentSpec);
    }
    
    this.log(`📊 Configuración analizada: ${JSON.stringify(config)}`);
    return config;
  }
  
  /**
   * Extrae el nombre del componente de la especificación
   * @param contexto Contexto del proyecto
   * @param componentSpec Especificación del componente
   */
  private async extractComponentName(contexto: ContextoProyecto, componentSpec: string): Promise<string> {
    // Intentar usar LLM para extraer un nombre más inteligente
    const namePrompt = `
    Extrae un nombre apropiado en PascalCase para un componente ${this.componentLibrary} basado en esta especificación:
    "${componentSpec}"
    
    Responde solo con el nombre, sin explicaciones ni formato adicional.
    `;
    
    try {
      const suggestedName = await this.ejecutarPrompt(contexto, namePrompt);
      // Limpiar la respuesta para obtener solo el nombre
      const cleanName = suggestedName.trim().replace(/[^a-zA-Z0-9]/g, '');
      
      // Verificar que sea un nombre válido en PascalCase
      if (/^[A-Z][a-zA-Z0-9]*$/.test(cleanName)) {
        return cleanName;
      }
    } catch (error) {
      this.log('⚠️ Error al extraer nombre con LLM, usando método alternativo', 'warning');
    }
    
    // Método alternativo: extraer el primer sustantivo que podría ser un nombre de componente
    const words = componentSpec.split(' ');
    let componentName = '';
    
    // Lista de palabras comunes para componentes
    const componentKeywords = [
      'Button', 'Card', 'Modal', 'Form', 'Input', 'Select', 'Checkbox',
      'Radio', 'Toggle', 'Dropdown', 'Menu', 'Nav', 'Tab', 'Panel',
      'Alert', 'Toast', 'Notification', 'Badge', 'Avatar', 'Icon',
      'Spinner', 'Loader', 'Progress', 'Slider', 'Switch', 'Tooltip'
    ];
    
    // Primero buscar palabras clave comunes de componentes
    for (const word of words) {
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      const pascalWord = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
      
      if (componentKeywords.includes(pascalWord)) {
        componentName = pascalWord;
        break;
      }
    }
    
    // Si no se encontró una palabra clave, buscar cualquier sustantivo
    if (!componentName) {
      for (const word of words) {
        const cleanWord = word.replace(/[^a-zA-Z]/g, '');
        if (cleanWord && cleanWord.length > 2) {
          // Convertir a PascalCase
          componentName = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1).toLowerCase();
          break;
        }
      }
    }
    
    // Si no se encontró un nombre adecuado, usar un nombre genérico
    return componentName || 'CustomComponent';
  }
  
  /**
   * Carga el sistema de diseño desde el contexto o crea uno básico
   * @param contexto Contexto del proyecto
   */
  private async loadDesignSystem(contexto: ContextoProyecto): Promise<void> {
    try {
      // Intentar cargar desde el contexto
      const designSystemPath = path.join(contexto.directorio, 'design-system.json');
      
      if (fs.existsSync(designSystemPath)) {
        const designSystemContent = fs.readFileSync(designSystemPath, 'utf-8');
        this.designSystem = JSON.parse(designSystemContent);
        this.log('🎨 Sistema de diseño cargado desde archivo local');
        return;
      }
      
      // Si no existe, solicitar al StyleAgent si está disponible
      if (this.styleAgent && contexto.licencia !== 'Community') {
        this.log('🔄 Solicitando sistema de diseño a StyleAgent...');
        await this.styleAgent.run(contexto, 'generate-design-system');
        return;
      }
      
      // Si no hay StyleAgent, crear un sistema de diseño básico
      this.designSystem = {
        colors: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#8B5CF6',
          neutral: '#6B7280',
          error: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
        },
        typography: {
          fontFamily: 'sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
          },
          fontWeight: {
            normal: '400',
            medium: '500',
            bold: '700',
          },
        },
        spacing: {
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
        },
        borderRadius: {
          sm: '0.125rem',
          md: '0.25rem',
          lg: '0.5rem',
          full: '9999px',
        },
      };
      
      this.log('🎨 Sistema de diseño básico creado');
    } catch (error) {
      this.log(`⚠️ Error cargando sistema de diseño: ${error.message}`, 'warning');
      // Crear sistema de diseño básico en caso de error
      this.designSystem = {
        colors: { primary: '#3B82F6' },
        typography: { fontFamily: 'sans-serif' },
        spacing: { md: '1rem' },
        borderRadius: { md: '0.25rem' },
      };
    }
  }
  
  /**
   * Genera un componente según el framework seleccionado
   * @param contexto Contexto del proyecto
   * @param componentName Nombre del componente
   * @param componentSpec Especificación del componente
   * @param config Configuración del componente
   */
  private async generateComponent(
    contexto: ContextoProyecto, 
    componentName: string, 
    componentSpec: string, 
    config: ComponentConfig
  ): Promise<ComponentResult> {
    await this.registrarActividad(contexto, 'generando componente', { 
      componentName, 
      framework: config.library 
    });
    
    // Crear prompt para el LLM según el framework
    const componentPrompt = this.createComponentPrompt(componentName, componentSpec, config);
    
    // Consultar al LLM
    const result = await this.ejecutarPrompt(contexto, componentPrompt);
    
    // Extraer código de los diferentes archivos
    const componentCode = this.extractCodeBlock(result, this.getFileExtension('component', config.library), 'Component');
    const storybookCode = this.extractCodeBlock(result, this.getFileExtension('storybook', config.library), 'Storybook');
    const testCode = this.extractCodeBlock(result, this.getFileExtension('test', config.library), 'Test');
    const docsCode = this.extractCodeBlock(result, 'md', 'Docs');
    const stylesCode = this.extractCodeBlock(result, this.getFileExtension('styles', config.library), 'Styles');
    
    // Guardar los archivos
    const files = await this.saveComponentFiles(
      contexto,
      componentName, 
      componentCode, 
      storybookCode, 
      testCode, 
      docsCode,
      stylesCode,
      config.library
    );
    
    return {
      name: componentName,
      files,
      path: path.join(this.componentsDir, `${componentName}.${this.getFileExtension('component', config.library)}`),
      framework: config.library
    };
  }
  
  /**
   * Crea el prompt para el LLM según el framework
   * @param componentName Nombre del componente
   * @param componentSpec Especificación del componente
   * @param config Configuración del componente
   */
  private createComponentPrompt(componentName: string, componentSpec: string, config: ComponentConfig): string {
    const frameworkSpecificInstructions = this.getFrameworkSpecificInstructions(config.library);
    const accessibilityRequirements = this.getAccessibilityRequirements(config.accessibility);
    const designSystemJson = JSON.stringify(this.designSystem, null, 2);
    
    return `
    # Tarea de Component Agent
    Actúa como el Component Agent de CJ.DevMind. Tu tarea es crear un componente ${config.library} basado en el sistema de diseño proporcionado.
    
    ## Especificación del componente
    "${componentSpec}"
    
    ## Configuración
    - Nombre: ${componentName}
    - Framework: ${config.library}
    - Método de Estilizado: ${config.styling}
    - Nivel de Accesibilidad: ${config.accessibility}
    - Características: ${config.features.join(', ') || 'Ninguna específica'}
    - Soporte para Modo Oscuro: ${config.darkMode ? 'Sí' : 'No'}
    - Soporte para i18n: ${config.i18n ? 'Sí' : 'No'}
    - Responsivo: ${config.responsive ? 'Sí' : 'No'}
    
    ## Sistema de Diseño
    \`\`\`json
    ${designSystemJson}
    \`\`\`
    
    ## Instrucciones específicas para ${config.library}
    ${frameworkSpecificInstructions}
    
    ## Requisitos de Accesibilidad (WCAG ${config.accessibility})
    ${accessibilityRequirements}
    
    ## Archivos a generar
    
    1. Componente ${config.library} (${componentName}.${this.getFileExtension('component', config.library)}):
       - Componente con TypeScript
       - Estilos usando ${config.styling} según el sistema de diseño
       - Props tipadas con interfaces
       - Manejo de estados necesarios
       - Implementación de accesibilidad (ARIA, keyboard navigation)
       - Optimización de rendimiento cuando sea apropiado
       - Estados interactivos (hover, focus, disabled) para componentes interactivos
    
    2. Historia de Storybook (${componentName}.${this.getFileExtension('storybook', config.library)}):
       - Configuración de Storybook con controles para todas las props
       - Ejemplos de todas las variantes y estados
       - Documentación de uso en Storybook
    
    3. Pruebas (${componentName}.${this.getFileExtension('test', config.library)}):
       - Pruebas de renderizado
       - Pruebas de interacción
       - Pruebas de accesibilidad básicas
       - Pruebas de diferentes props y estados
    
    4. Documentación (${componentName}.md):
       - Descripción del componente
       - API de props con tipos y valores por defecto
       - Ejemplos de uso
       - Consideraciones de accesibilidad
       - Notas de implementación
    
    5. Estilos (${componentName}.${this.getFileExtension('styles', config.library)}):
       - Estilos específicos del componente
       - Variables de tema para modo claro/oscuro si aplica
       - Estilos responsivos
    
    El componente debe seguir las mejores prácticas de ${config.library}, ser reutilizable y seguir el sistema de diseño proporcionado.
    
    Responde con bloques de código claramente separados para cada archivo.
    `;
  }
  
  /**
   * Obtiene instrucciones específicas según el framework
   * @param framework Framework seleccionado
   */
  private getFrameworkSpecificInstructions(framework: string): string {
    switch (framework.toLowerCase()) {
      case 'react':
        return `
        - Usa componentes funcionales con React Hooks
        - Implementa memoización con React.memo cuando sea apropiado
        - Usa TypeScript para tipar props y estados
        - Implementa forwardRef para componentes que necesiten referencias
        - Usa Context API para temas si es necesario
        - Implementa patrones de composición cuando sea apropiado
        `;
      case 'vue':
        return `
        - Usa la Composition API de Vue 3
        - Implementa <script setup> con TypeScript
        - Define props y emits con sus tipos
        - Usa provide/inject para temas si es necesario
        - Implementa slots para contenido personalizable
        - Usa directivas v-model cuando sea apropiado
        `;
      case 'angular':
        return `
        - Usa decoradores @Component, @Input, @Output
        - Implementa OnInit, OnDestroy y otros lifecycle hooks cuando sea necesario
        - Usa ViewChild para referencias a elementos
        - Implementa ControlValueAccessor para componentes de formulario
        - Usa ChangeDetectionStrategy.OnPush cuando sea apropiado
        - Implementa ng-content para contenido proyectado
        `;
      case 'svelte':
        return `
        - Usa la sintaxis reactiva de Svelte
        - Implementa export let para props
        - Usa stores para estado compartido si es necesario
        - Implementa slots para contenido personalizable
        - Usa directivas de transición cuando sea apropiado
        - Implementa acciones para comportamientos reutilizables
        `;
      default:
        return `
        - Usa las mejores prácticas del framework
        - Implementa tipado fuerte con TypeScript
        - Asegura la reutilización y composición
        - Optimiza el rendimiento cuando sea apropiado
        `;
    }
  }
  
  /**
   * Obtiene requisitos de accesibilidad según el nivel WCAG
   * @param level Nivel de accesibilidad (A, AA, AAA)
   */
  private getAccessibilityRequirements(level: string): string {
    const baseRequirements = `
    - Asegura que todos los elementos interactivos sean accesibles por teclado
    - Usa roles ARIA apropiados
    - Proporciona textos alternativos para imágenes
    - Asegura contraste suficiente entre texto y fondo
    - Implementa manejo de focus visible
    `;
    
    switch (level) {
      case 'A':
        return baseRequirements;
      case 'AA':
        return `
        ${baseRequirements}
        - Asegura que el componente sea usable con zoom de hasta 200%
        - Implementa estados de hover, focus, active y disabled visibles
        - Asegura que el componente funcione con lectores de pantalla
        - Proporciona feedback para acciones del usuario
        `;
      case 'AAA':
        return `
        ${baseRequirements}
        - Asegura que el componente sea usable con zoom de hasta 200%
        - Implementa estados de hover, focus, active y disabled visibles
        - Asegura que el componente funcione con lectores de pantalla
        - Proporciona feedback para acciones del usuario
        - Implementa atajos de teclado personalizables
        - Asegura que el componente sea usable con control por voz
        - Proporciona múltiples formas de navegación
        - Implementa ayuda contextual y prevención de errores
        `;
      default:
        return baseRequirements;
    }
  }
  
  /**
   * Extrae bloques de código de la respuesta del LLM
   * @param text Texto de respuesta
   * @param extension Extensión del archivo
   * @param type Tipo de archivo
   */
  private extractCodeBlock(text: string, extension: string, type: string): string {
    // Crear un patrón que incluya varias posibilidades de lenguaje
    const languageOptions = [
      extension,
      'typescript', 'javascript', 'tsx', 'jsx', 'vue', 'svelte', 'html', 'css',
      'scss', 'less', 'markdown', 'md', 'angular', 'ng'
    ].join('|');
    
    const regex = new RegExp(`\`\`\`(?:${languageOptions})([\\s\\S]*?)\`\`\``, 'g');
    const matches = [...text.matchAll(regex)];
    
    // Buscar el bloque que corresponde al tipo
    for (const match of matches) {
      const code = match[1].trim();
      
      // Identificar el tipo de archivo por su contenido
      if (type === 'Component' && this.isComponentCode(code, extension)) {
        return code;
      } else if (type === 'Storybook' && code.includes('stories') || code.includes('Story')) {
        return code;
      } else if (type === 'Test' && (code.includes('test') || code.includes('spec') || code.includes('describe') || code.includes('it('))) {
        return code;
      } else if (      type === 'Docs' && (code.includes('# ') || code.includes('## ')) {
        return code;
      } else if (type === 'Styles' && (code.includes('style') || code.includes('css') || code.includes('@media'))) {
        return code;
      }
    }
    
    // Si no se encontró un bloque específico, buscar cualquier bloque que coincida con la extensión
    for (const match of matches) {
      if (match[0].includes(extension)) {
        return match[1].trim();
      }
    }
    
    // Si no se encontró ningún bloque, devolver el primer bloque
    return matches.length > 0 ? matches[0][1].trim() : '';
  }
  
  /**
   * Verifica si un bloque de código es un componente
   * @param code Código a verificar
   * @param extension Extensión del archivo
   */
  private isComponentCode(code: string, extension: string): boolean {
    // Verificar si es un componente React
    if (extension === 'tsx' || extension === 'jsx') {
      return (
        (code.includes('export') && code.includes('function')) ||
        code.includes('React.') ||
        code.includes('import React') ||
        code.includes('const') && code.includes('=') && code.includes('=>') ||
        code.includes('props') ||
        code.includes('useState') ||
        code.includes('useEffect')
      );
    }
    
    // Verificar si es un componente Vue
    if (extension === 'vue') {
      return (
        code.includes('<template>') ||
        code.includes('<script>') ||
        code.includes('defineComponent') ||
        code.includes('setup(')
      );
    }
    
    // Verificar si es un componente Angular
    if (extension === 'ts' && code.includes('@Component')) {
      return true;
    }
    
    // Verificar si es un componente Svelte
    if (extension === 'svelte') {
      return (
        code.includes('<script>') ||
        code.includes('export let') ||
        code.includes('{#if') ||
        code.includes('{#each')
      );
    }
    
    // Verificación genérica
    return (
      code.includes('export') ||
      code.includes('component') ||
      code.includes('class') ||
      code.includes('function') ||
      code.includes('const') && code.includes('=')
    );
  }
  
  /**
   * Guarda los archivos del componente
   * @param contexto Contexto del proyecto
   * @param componentName Nombre del componente
   * @param componentCode Código del componente
   * @param storybookCode Código de Storybook
   * @param testCode Código de pruebas
   * @param docsCode Código de documentación
   * @param stylesCode Código de estilos
   * @param framework Framework del componente
   */
  private async saveComponentFiles(
    contexto: ContextoProyecto,
    componentName: string,
    componentCode: string,
    storybookCode: string | null,
    testCode: string | null,
    docsCode: string | null,
    stylesCode: string | null,
    framework: string
  ): Promise<ComponentResult['files']> {
    const files: ComponentResult['files'] = {
      component: componentCode
    };
    
    // Crear directorios si no existen
    const componentDir = path.join(this.componentsDir, componentName);
    if (!fs.existsSync(componentDir)) {
      fs.mkdirSync(componentDir, { recursive: true });
    }
    
    // Guardar archivo principal del componente
    const componentFilePath = path.join(componentDir, `${componentName}.${this.getFileExtension('component', framework)}`);
    fs.writeFileSync(componentFilePath, componentCode);
    this.log(`💾 Componente guardado en: ${componentFilePath}`);
    
    // Guardar archivo de Storybook si existe
    if (storybookCode) {
      const storybookFilePath = path.join(componentDir, `${componentName}.stories.${this.getFileExtension('storybook', framework)}`);
      fs.writeFileSync(storybookFilePath, storybookCode);
      this.log(`📚 Historia de Storybook guardada en: ${storybookFilePath}`);
      files.storybook = storybookCode;
    }
    
    // Guardar archivo de pruebas si existe
    if (testCode) {
      const testFilePath = path.join(componentDir, `${componentName}.test.${this.getFileExtension('test', framework)}`);
      fs.writeFileSync(testFilePath, testCode);
      this.log(`🧪 Pruebas guardadas en: ${testFilePath}`);
      files.test = testCode;
    }
    
    // Guardar archivo de documentación si existe
    if (docsCode) {
      const docsFilePath = path.join(componentDir, `${componentName}.md`);
      fs.writeFileSync(docsFilePath, docsCode);
      this.log(`📝 Documentación guardada en: ${docsFilePath}`);
      files.docs = docsCode;
    }
    
    // Guardar archivo de estilos si existe
    if (stylesCode) {
      const stylesFilePath = path.join(componentDir, `${componentName}.${this.getFileExtension('styles', framework)}`);
      fs.writeFileSync(stylesFilePath, stylesCode);
      this.log(`💅 Estilos guardados en: ${stylesFilePath}`);
      files.styles = stylesCode;
    }
    
    // Registrar actividad
    await this.registrarActividad(contexto, 'archivos guardados', { 
      componentName, 
      framework,
      files: Object.keys(files).length
    });
    
    return files;
  }
  
  /**
   * Obtiene la extensión de archivo según el tipo y framework
   * @param type Tipo de archivo
   * @param framework Framework del componente
   */
  private getFileExtension(type: string, framework: string): string {
    const extensions: Record<string, Record<string, string>> = {
      component: {
        react: 'tsx',
        vue: 'vue',
        angular: 'ts',
        svelte: 'svelte',
        default: 'tsx'
      },
      storybook: {
        react: 'tsx',
        vue: 'ts',
        angular: 'ts',
        svelte: 'js',
        default: 'tsx'
      },
      test: {
        react: 'tsx',
        vue: 'spec.ts',
        angular: 'spec.ts',
        svelte: 'spec.js',
        default: 'tsx'
      },
      styles: {
        react: this.stylingMethod === 'css-modules' ? 'module.css' : 'css',
        vue: 'css',
        angular: 'scss',
        svelte: 'css',
        default: 'css'
      }
    };
    
    return extensions[type]?.[framework] || extensions[type]?.default || 'txt';
  }
  
  /**
   * Solicita estilos al StyleAgent
   * @param contexto Contexto del proyecto
   * @param componentName Nombre del componente
   * @param config Configuración del componente
   */
  private async requestStyles(contexto: ContextoProyecto, componentName: string, config: ComponentConfig): Promise<void> {
    if (!this.styleAgent) return;
    
    this.log(`🎨 Solicitando estilos para ${componentName} a StyleAgent...`);
    
    try {
      // Crear especificación para StyleAgent
      const styleSpec = `
      Genera estilos para el componente ${componentName} con las siguientes características:
      - Framework: ${config.library}
      - Método de estilizado: ${config.styling}
      - Características: ${config.features.join(', ')}
      - Soporte para modo oscuro: ${config.darkMode ? 'Sí' : 'No'}
      - Responsivo: ${config.responsive ? 'Sí' : 'No'}
      - Accesibilidad: WCAG ${config.accessibility}
      `;
      
      // Enviar evento al StyleAgent
      this.sendEvent(AgentEventType.STYLE_REQUESTED, {
        componentName,
        spec: styleSpec,
        framework: config.library,
        styling: config.styling,
        features: config.features,
        darkMode: config.darkMode,
        responsive: config.responsive,
        timestamp: new Date().toISOString()
      }, 'StyleAgent');
      
      this.log(`✅ Solicitud de estilos enviada a StyleAgent`);
    } catch (error) {
      this.log(`⚠️ Error solicitando estilos: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Solicita pruebas al TestAgent
   * @param contexto Contexto del proyecto
   * @param componentName Nombre del componente
   * @param config Configuración del componente
   */
  private async requestTests(contexto: ContextoProyecto, componentName: string, config: ComponentConfig): Promise<void> {
    if (!this.testAgent) return;
    
    this.log(`🧪 Solicitando pruebas para ${componentName} a TestAgent...`);
    
    try {
      // Crear especificación para TestAgent
      const testSpec = `
      Genera pruebas para el componente ${componentName} con las siguientes características:
      - Framework: ${config.library}
      - Características: ${config.features.join(', ')}
      - Accesibilidad: WCAG ${config.accessibility}
      
      Incluye pruebas de:
      - Renderizado básico
      - Interacción de usuario
      - Accesibilidad
      - Responsividad
      - Estados (si aplica)
      - Props y configuraciones
      `;
      
      // Enviar evento al TestAgent
      this.sendEvent(AgentEventType.TEST_REQUESTED, {
        componentName,
        spec: testSpec,
        framework: config.library,
        features: config.features,
        timestamp: new Date().toISOString()
      }, 'TestAgent');
      
      this.log(`✅ Solicitud de pruebas enviada a TestAgent`);
    } catch (error) {
      this.log(`⚠️ Error solicitando pruebas: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Solicita revisión de código al CodeReviewAgent
   * @param contexto Contexto del proyecto
   * @param componentName Nombre del componente
   * @param code Código del componente
   */
  private async requestCodeReview(contexto: ContextoProyecto, componentName: string, code: string): Promise<void> {
    if (!this.codeReviewAgent) return;
    
    this.log(`🔍 Solicitando revisión de código para ${componentName} a CodeReviewAgent...`);
    
    try {
      // Enviar evento al CodeReviewAgent
      this.sendEvent(AgentEventType.CODE_REVIEW_REQUESTED, {
        componentName,
        code,
        framework: this.componentLibrary,
        timestamp: new Date().toISOString()
      }, 'CodeReviewAgent');
      
      this.log(`✅ Solicitud de revisión de código enviada a CodeReviewAgent`);
    } catch (error) {
      this.log(`⚠️ Error solicitando revisión de código: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Actualiza los estilos de un componente
   * @param componentName Nombre del componente
   * @param styles Estilos a aplicar
   */
  private updateComponentStyles(componentName: string, styles: string): void {
    try {
      const componentDir = path.join(this.componentsDir, componentName);
      const stylesFilePath = path.join(componentDir, `${componentName}.${this.getFileExtension('styles', this.componentLibrary)}`);
      
      // Verificar si el archivo existe
      if (fs.existsSync(stylesFilePath)) {
        // Actualizar archivo de estilos
        fs.writeFileSync(stylesFilePath, styles);
        this.log(`✅ Estilos actualizados para ${componentName}`);
      } else {
        // Crear archivo de estilos
        fs.writeFileSync(stylesFilePath, styles);
        this.log(`✅ Archivo de estilos creado para ${componentName}`);
      }
    } catch (error) {
      this.log(`❌ Error actualizando estilos: ${error.message}`, 'error');
    }
  }
  
  /**
   * Notifica a otros agentes sobre la creación de un componente
   * @param contexto Contexto del proyecto
   * @param componentName Nombre del componente
   * @param result Resultado del componente
   */
  private notifyComponentCreated(contexto: ContextoProyecto, componentName: string, result: ComponentResult): void {
    try {
      // Notificar a OrchestratorAgent
      this.sendEvent(AgentEventType.COMPONENT_CREATED, {
        componentName,
        path: path.join(this.componentsDir, componentName),
        files: Object.keys(result.files),
        framework: this.componentLibrary,
        timestamp: new Date().toISOString()
      }, 'OrchestratorAgent');
      
      // Notificar a FrontendSyncAgent si existe
      this.sendEvent(AgentEventType.COMPONENT_CREATED, {
        componentName,
        path: path.join(this.componentsDir, componentName),
        files: Object.keys(result.files),
        framework: this.componentLibrary,
        timestamp: new Date().toISOString()
      }, 'FrontendSyncAgent');
      
      // Notificar a UIDesignAgent si existe
      this.sendEvent(AgentEventType.COMPONENT_CREATED, {
        componentName,
        path: path.join(this.componentsDir, componentName),
        files: Object.keys(result.files),
        framework: this.componentLibrary,
        timestamp: new Date().toISOString()
      }, 'UIDesignAgent');
      
      this.log(`📢 Notificación de componente creado enviada a otros agentes`);
    } catch (error) {
      this.log(`⚠️ Error notificando a otros agentes: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Genera un componente a partir de un diseño visual (imagen)
   * @param contexto Contexto del proyecto
   * @param imagePath Ruta de la imagen
   * @param componentName Nombre del componente (opcional)
   */
  async generateFromImage(contexto: ContextoProyecto, imagePath: string, componentName?: string): Promise<ComponentResult> {
    await this.registrarActividad(contexto, 'generando componente desde imagen', { imagePath });
    this.log(`🖼️ Generando componente desde imagen: ${imagePath}`);
    
    try {
      // Verificar que la imagen existe
      if (!fs.existsSync(imagePath)) {
        throw new Error(`La imagen no existe en la ruta: ${imagePath}`);
      }
      
      // Solicitar análisis de la imagen a VisionAgent
      this.log(`🔍 Solicitando análisis de imagen a VisionAgent...`);
      
      // Enviar evento a VisionAgent
      this.sendEvent(AgentEventType.VISION_ANALYSIS_REQUESTED, {
        imagePath,
        type: 'component',
        timestamp: new Date().toISOString()
      }, 'VisionAgent');
      
      // Simular respuesta de VisionAgent (en una implementación real, esperaríamos la respuesta)
      const imageAnalysisPrompt = `
      Analiza la imagen en ${imagePath} y genera una especificación detallada para un componente ${this.componentLibrary}.
      Describe:
      - Estructura del componente
      - Elementos visuales (botones, textos, imágenes, etc.)
      - Colores y estilos
      - Posibles interacciones
      - Consideraciones de accesibilidad
      
      Responde con una especificación completa que pueda ser usada para generar el componente.
      `;
      
      const imageAnalysis = await this.ejecutarPrompt(contexto, imageAnalysisPrompt);
      
      // Generar componente a partir del análisis
      const componentSpec = `
      Componente basado en imagen: ${path.basename(imagePath)}
      
      ${imageAnalysis}
      
      Framework: ${this.componentLibrary}
      Styling: ${this.stylingMethod}
      ${componentName ? `name: ${componentName}` : ''}
      `;
      
      // Usar el método run para generar el componente
      return await this.run(contexto, componentSpec);
    } catch (error) {
      this.log(`❌ Error generando componente desde imagen: ${error.message}`, 'error');
      await this.registrarActividad(contexto, 'error generando componente desde imagen', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Genera un componente a partir de un sketch o wireframe
   * @param contexto Contexto del proyecto
   * @param sketchPath Ruta del sketch
   * @param componentName Nombre del componente (opcional)
   */
  async generateFromSketch(contexto: ContextoProyecto, sketchPath: string, componentName?: string): Promise<ComponentResult> {
    await this.registrarActividad(contexto, 'generando componente desde sketch', { sketchPath });
    this.log(`🖌️ Generando componente desde sketch: ${sketchPath}`);
    
    // Reutilizar la lógica de generateFromImage
    return this.generateFromImage(contexto, sketchPath, componentName);
  }
  
  /**
   * Actualiza un componente existente
   * @param contexto Contexto del proyecto
   * @param componentName Nombre del componente
   * @param updateSpec Especificación de la actualización
   */
  async updateComponent(contexto: ContextoProyecto, componentName: string, updateSpec: string): Promise<ComponentResult> {
    await this.registrarActividad(contexto, 'actualizando componente', { componentName, updateSpec });
    this.log(`🔄 Actualizando componente: ${componentName}`);
    
    try {
      // Verificar que el componente existe
      const componentDir = path.join(this.componentsDir, componentName);
      const componentFilePath = path.join(componentDir, `${componentName}.${this.getFileExtension('component', this.componentLibrary)}`);
      
      if (!fs.existsSync(componentFilePath)) {
        throw new Error(`El componente no existe: ${componentName}`);
      }
      
      // Leer el componente existente
      const existingComponent = fs.readFileSync(componentFilePath, 'utf-8');
      
      // Crear prompt para actualizar el componente
      const updatePrompt = `
      Actualiza el siguiente componente ${this.componentLibrary} según esta especificación:
      
      Especificación de actualización:
      "${updateSpec}"
      
      Componente existente:
      \`\`\`${this.getFileExtension('component', this.componentLibrary)}
      ${existingComponent}
      \`\`\`
      
      Responde con el componente actualizado, manteniendo la estructura y funcionalidad existente, pero aplicando los cambios solicitados.
      `;
      
      // Consultar al LLM
      const updatedComponentCode = await this.ejecutarPrompt(contexto, updatePrompt);
      
      // Extraer código del componente actualizado
      const componentCode = this.extractCodeBlock(updatedComponentCode, this.getFileExtension('component', this.componentLibrary), 'Component');
      
      // Guardar componente actualizado
      fs.writeFileSync(componentFilePath, componentCode);
      
      // Verificar si hay archivos relacionados que también deben actualizarse
      const files: ComponentResult['files'] = {
        component: componentCode
      };
      
      // Actualizar Storybook si existe
      const storybookFilePath = path.join(componentDir, `${componentName}.stories.${this.getFileExtension('storybook', this.componentLibrary)}`);
      if (fs.existsSync(storybookFilePath)) {
        const existingStorybook = fs.readFileSync(storybookFilePath, 'utf-8');
        
        const updateStorybookPrompt = `
        Actualiza la historia de Storybook para el componente ${componentName} según esta especificación:
        
        Especificación de actualización:
        "${updateSpec}"
        
        Historia existente:
        \`\`\`${this.getFileExtension('storybook', this.componentLibrary)}
        ${existingStorybook}
        \`\`\`
        
        Componente actualizado:
        \`\`\`${this.getFileExtension('component', this.componentLibrary)}
        ${componentCode}
        \`\`\`
        
        Responde con la historia de Storybook actualizada.
        `;
        
        const updatedStorybookCode = await this.ejecutarPrompt(contexto, updateStorybookPrompt);
        const storybookCode = this.extractCodeBlock(updatedStorybookCode, this.getFileExtension('storybook', this.componentLibrary), 'Storybook');
        
        fs.writeFileSync(storybookFilePath, storybookCode);
        files.storybook = storybookCode;
      }
      
      // Actualizar pruebas si existen
      const testFilePath = path.join(componentDir, `${componentName}.test.${this.getFileExtension('test', this.componentLibrary)}`);
      if (fs.existsSync(testFilePath)) {
        const existingTest = fs.readFileSync(testFilePath, 'utf-8');
        
        const updateTestPrompt = `
        Actualiza las pruebas para el componente ${componentName} según esta especificación:
        
        Especificación de actualización:
        "${updateSpec}"
        
        Pruebas existentes:
        \`\`\`${this.getFileExtension('test', this.componentLibrary)}
        ${existingTest}
        \`\`\`
        
        Componente actualizado:
        \`\`\`${this.getFileExtension('component', this.componentLibrary)}
        ${componentCode}
        \`\`\`
        
        Responde con las pruebas actualizadas.
        `;
        
        const updatedTestCode = await this.ejecutarPrompt(contexto, updateTestPrompt);
        const testCode = this.extractCodeBlock(updatedTestCode, this.getFileExtension('test', this.componentLibrary), 'Test');
        
        fs.writeFileSync(testFilePath, testCode);
        files.test = testCode;
      }
      
      // Actualizar documentación si existe
      const docsFilePath = path.join(componentDir, `${componentName}.md`);
      if (fs.existsSync(docsFilePath)) {
        const existingDocs = fs.readFileSync(docsFilePath, 'utf-8');
        
        const updateDocsPrompt = `
        Actualiza la documentación para el componente ${componentName} según esta especificación:
        
        Especificación de actualización:
        "${updateSpec}"
        
        Documentación existente:
        \`\`\`md
        ${existingDocs}
        \`\`\`
        
        Componente actualizado:
        \`\`\`${this.getFileExtension('component', this.componentLibrary)}
        ${componentCode}
        \`\`\`
        
        Responde con la documentación actualizada.
        `;
        
        const updatedDocsCode = await this.ejecutarPrompt(contexto, updateDocsPrompt);
        const docsCode = this.extractCodeBlock(updatedDocsCode, 'md', 'Docs');
        
        fs.writeFileSync(docsFilePath, docsCode);
        files.docs = docsCode;
      }
      
      // Solicitar revisión de código al CodeReviewAgent si está disponible
      if (this.codeReviewAgent && contexto.licencia !== 'Community') {
        await this.requestCodeReview(contexto, componentName, componentCode);
      }
      
      // Notificar a otros agentes sobre la actualización
      this.notifyComponentUpdated(contexto, componentName, files);
      
      this.log(`✅ Componente ${componentName} actualizado con éxito`);
      
      return {
        name: componentName,
        files,
        path: componentFilePath,
        framework: this.componentLibrary
      };
    } catch (error) {
      this.log(`❌ Error actualizando componente: ${error.message}`, 'error');
      await this.registrarActividad(contexto, 'error actualizando componente', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Notifica a otros agentes sobre la actualización de un componente
   * @param contexto Contexto del proyecto
   * @param componentName Nombre del componente
   * @param files Archivos actualizados
   */
  private notifyComponentUpdated(contexto: ContextoProyecto, componentName: string, files: ComponentResult['files']): void {
    try {
      // Notificar a OrchestratorAgent
      this.sendEvent(AgentEventType.COMPONENT_UPDATED, {
        componentName,
        path: path.join(this.componentsDir, componentName),
        files: Object.keys(files),
        framework: this.componentLibrary,
        timestamp: new Date().toISOString()
      }, 'OrchestratorAgent');
      
      // Notificar a FrontendSyncAgent si existe
      this.sendEvent(AgentEventType.COMPONENT_UPDATED, {
        componentName,
        path: path.join(this.componentsDir, componentName),
        files: Object.keys(files),
        framework: this.componentLibrary,
        timestamp: new Date().toISOString()
      }, 'FrontendSyncAgent');
      
      this.log(`📢 Notificación de componente actualizado enviada a otros agentes`);
    } catch (error) {
      this.log(`⚠️ Error notificando a otros agentes: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Genera una biblioteca de componentes
   * @param contexto Contexto del proyecto
   * @param spec Especificación de la biblioteca
   */
  async generateComponentLibrary(contexto: ContextoProyecto, spec: string): Promise<string[]> {
    await this.registrarActividad(contexto, 'generando biblioteca de componentes', { spec });
    this.log(`📚 Generando biblioteca de componentes según especificación: "${spec}"`);
    
    try {
      // Analizar la especificación para extraer componentes
      const libraryPrompt = `
      Analiza la siguiente especificación para una biblioteca de componentes:
      "${spec}"
      
      Genera una lista de componentes que deberían incluirse en esta biblioteca.
      Para cada componente, proporciona:
      1. Nombre del componente (en PascalCase)
      2. Breve descripción
      3. Características principales
      
      Responde en formato JSON con la siguiente estructura:
      {
        "components": [
          {
            "name": "ComponentName",
            "description": "Breve descripción",
            "features": ["característica1", "característica2"]
          }
        ]
      }
      `;
      
      const libraryAnalysis = await this.ejecutarPrompt(contexto, libraryPrompt);
      
      // Extraer lista de componentes
      const librarySpec = JSON.parse(libraryAnalysis);
      const components = librarySpec.components || [];
      
      if (components.length === 0) {
        throw new Error('No se pudieron identificar componentes en la especificación');
      }
      
      this.log(`🔍 Se identificaron ${components.length} componentes para la biblioteca`);
      
      // Generar cada componente
      const generatedComponents: string[] = [];
      
      for (const component of components) {
        this.log(`🧩 Generando componente: ${component.name}`);
        
        // Crear especificación para el componente
        const componentSpec = `
        Componente: ${component.name}
        Descripción: ${component.description}
        Características: ${component.features.join(', ')}
        Framework: ${this.componentLibrary}
        Styling: ${this.stylingMethod}
        `;
        
        try {
          // Generar el componente
          const result = await this.run(contexto, componentSpec);
          generatedComponents.push(result.name);
          
          // Esperar un poco entre componentes para no sobrecargar el sistema
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          this.log(`⚠️ Error generando componente ${component.name}: ${error.message}`, 'warning');
        }
      }
      
      // Generar índice de la biblioteca
      await this.generateLibraryIndex(contexto, generatedComponents);
      
      this.log(`✅ Biblioteca de componentes generada con éxito: ${generatedComponents.length} componentes`);
      return generatedComponents;
    } catch (error) {
      this.log(`❌ Error generando biblioteca de componentes: ${error.message}`, 'error');
      await this.registrarActividad(contexto, 'error generando biblioteca de componentes', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Genera un archivo índice para la biblioteca de componentes
   * @param contexto Contexto del proyecto
   * @param components Lista de componentes
   */
  private async generateLibraryIndex(contexto: ContextoProyecto, components: string[]): Promise<void> {
    try {
      // Crear prompt para generar el índice
      const indexPrompt = `
      Genera un archivo índice para una biblioteca de componentes ${this.componentLibrary} con los siguientes componentes:
      ${components.join(', ')}
      
      El archivo debe exportar todos los componentes y proporcionar una estructura clara para importarlos.
      `;
      
      const indexCode = await this.ejecutarPrompt(contexto, indexPrompt);
      
      // Extraer código del índice
      const code = this.extractCodeBlock(indexCode, this.getFileExtension('component', this.componentLibrary), 'Component');
      
      // Guardar archivo índice
            const indexFilePath = path.join(this.componentsDir, 'index.ts');
      fs.writeFileSync(indexFilePath, code);
      
      this.log(`📝 Índice de biblioteca generado en: ${indexFilePath}`);
    } catch (error) {
      this.log(`❌ Error generando índice de biblioteca: ${error.message}`, 'error');
    }
  }
  
  /**
   * Analiza un componente existente
   * @param contexto Contexto del proyecto
   * @param componentPath Ruta del componente
   */
  async analyzeComponent(contexto: ContextoProyecto, componentPath: string): Promise<any> {
    await this.registrarActividad(contexto, 'analizando componente', { componentPath });
    this.log(`🔍 Analizando componente: ${componentPath}`);
    
    try {
      // Verificar que el componente existe
      if (!fs.existsSync(componentPath)) {
        throw new Error(`El componente no existe en la ruta: ${componentPath}`);
      }
      
      // Leer el archivo del componente
      const componentCode = fs.readFileSync(componentPath, 'utf-8');
      const componentName = path.basename(componentPath, path.extname(componentPath));
      const extension = path.extname(componentPath).substring(1);
      
      // Crear prompt para analizar el componente
      const analysisPrompt = `
      Analiza el siguiente componente y proporciona información detallada sobre su estructura, funcionalidad y posibles mejoras:
      
      \`\`\`${extension}
      ${componentCode}
      \`\`\`
      
      Proporciona la siguiente información:
      1. Nombre y propósito del componente
      2. Props y su tipado
      3. Estados internos
      4. Efectos secundarios
      5. Funciones principales
      6. Dependencias externas
      7. Posibles problemas o bugs
      8. Sugerencias de mejora (rendimiento, accesibilidad, mantenibilidad)
      9. Complejidad estimada (baja, media, alta)
      
      Responde en formato JSON estructurado.
      `;
      
      // Consultar al LLM
      const analysisResult = await this.ejecutarPrompt(contexto, analysisPrompt);
      
      try {
        // Intentar parsear el resultado como JSON
        const analysis = JSON.parse(analysisResult);
        
        // Guardar análisis en un archivo junto al componente
        const analysisFilePath = path.join(path.dirname(componentPath), `${componentName}.analysis.json`);
        fs.writeFileSync(analysisFilePath, JSON.stringify(analysis, null, 2));
        
        this.log(`✅ Análisis completado y guardado en: ${analysisFilePath}`);
        
        // Solicitar revisión de código si está disponible
        if (this.codeReviewAgent && contexto.licencia !== 'Community') {
          await this.requestCodeReview(contexto, componentName, componentCode);
        }
        
        return analysis;
      } catch (error) {
        // Si no se puede parsear como JSON, devolver el texto plano
        this.log(`⚠️ No se pudo parsear el análisis como JSON, devolviendo texto plano`, 'warning');
        
        // Guardar análisis en formato de texto
        const analysisFilePath = path.join(path.dirname(componentPath), `${componentName}.analysis.md`);
        fs.writeFileSync(analysisFilePath, analysisResult);
        
        this.log(`✅ Análisis completado y guardado en: ${analysisFilePath}`);
        
        return { rawAnalysis: analysisResult };
      }
    } catch (error) {
      this.log(`❌ Error analizando componente: ${error.message}`, 'error');
      await this.registrarActividad(contexto, 'error analizando componente', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Genera documentación para un componente
   * @param contexto Contexto del proyecto
   * @param componentPath Ruta del componente
   */
  async generateDocs(contexto: ContextoProyecto, componentPath: string): Promise<string> {
    await this.registrarActividad(contexto, 'generando documentación', { componentPath });
    this.log(`📝 Generando documentación para: ${componentPath}`);
    
    try {
      // Verificar que el componente existe
      if (!fs.existsSync(componentPath)) {
        throw new Error(`El componente no existe en la ruta: ${componentPath}`);
      }
      
      // Leer el archivo del componente
      const componentCode = fs.readFileSync(componentPath, 'utf-8');
      const componentName = path.basename(componentPath, path.extname(componentPath));
      const extension = path.extname(componentPath).substring(1);
      
      // Crear prompt para generar documentación
      const docsPrompt = `
      Genera documentación completa para el siguiente componente:
      
      \`\`\`${extension}
      ${componentCode}
      \`\`\`
      
      La documentación debe incluir:
      1. Descripción general del componente
      2. API detallada (props, eventos, métodos)
      3. Ejemplos de uso
      4. Consideraciones de accesibilidad
      5. Notas sobre rendimiento
      6. Compatibilidad con diferentes dispositivos/navegadores
      7. Dependencias
      
      Formatea la documentación en Markdown.
      `;
      
      // Consultar al LLM
      const docsResult = await this.ejecutarPrompt(contexto, docsPrompt);
      
      // Guardar documentación en un archivo
      const docsFilePath = path.join(path.dirname(componentPath), `${componentName}.md`);
      fs.writeFileSync(docsFilePath, docsResult);
      
      this.log(`✅ Documentación generada y guardada en: ${docsFilePath}`);
      
      return docsFilePath;
    } catch (error) {
      this.log(`❌ Error generando documentación: ${error.message}`, 'error');
      await this.registrarActividad(contexto, 'error generando documentación', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Genera una historia de Storybook para un componente
   * @param contexto Contexto del proyecto
   * @param componentPath Ruta del componente
   */
  async generateStorybook(contexto: ContextoProyecto, componentPath: string): Promise<string> {
    await this.registrarActividad(contexto, 'generando storybook', { componentPath });
    this.log(`📚 Generando historia de Storybook para: ${componentPath}`);
    
    try {
      // Verificar que el componente existe
      if (!fs.existsSync(componentPath)) {
        throw new Error(`El componente no existe en la ruta: ${componentPath}`);
      }
      
      // Leer el archivo del componente
      const componentCode = fs.readFileSync(componentPath, 'utf-8');
      const componentName = path.basename(componentPath, path.extname(componentPath));
      const extension = path.extname(componentPath).substring(1);
      const framework = this.detectFramework(extension, componentCode);
      
      // Crear prompt para generar historia de Storybook
      const storybookPrompt = `
      Genera una historia de Storybook completa para el siguiente componente ${framework}:
      
      \`\`\`${extension}
      ${componentCode}
      \`\`\`
      
      La historia debe incluir:
      1. Metadata (título, componente, tags)
      2. Historia principal (default)
      3. Variantes para diferentes props y estados
      4. Controles para interactuar con el componente
      5. Documentación integrada
      6. Ejemplos de uso en diferentes contextos
      
      Usa la sintaxis más reciente de Storybook (CSF - Component Story Format).
      `;
      
      // Consultar al LLM
      const storybookResult = await this.ejecutarPrompt(contexto, storybookPrompt);
      
      // Extraer código de la historia
      const storybookCode = this.extractCodeBlock(storybookResult, this.getFileExtension('storybook', framework), 'Storybook');
      
      // Guardar historia en un archivo
      const storybookFilePath = path.join(path.dirname(componentPath), `${componentName}.stories.${this.getFileExtension('storybook', framework)}`);
      fs.writeFileSync(storybookFilePath, storybookCode);
      
      this.log(`✅ Historia de Storybook generada y guardada en: ${storybookFilePath}`);
      
      return storybookFilePath;
    } catch (error) {
      this.log(`❌ Error generando historia de Storybook: ${error.message}`, 'error');
      await this.registrarActividad(contexto, 'error generando storybook', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Detecta el framework utilizado en un componente
   * @param extension Extensión del archivo
   * @param code Código del componente
   */
  private detectFramework(extension: string, code: string): string {
    // Detectar por extensión
    if (extension === 'vue') return 'vue';
    if (extension === 'svelte') return 'svelte';
    
    // Detectar React
    if (
      code.includes('import React') ||
      code.includes('React.') ||
      code.includes('useState') ||
      code.includes('useEffect') ||
      code.includes('props') && (extension === 'jsx' || extension === 'tsx')
    ) {
      return 'react';
    }
    
    // Detectar Angular
    if (
      code.includes('@Component') ||
      code.includes('@Input') ||
      code.includes('@Output') ||
      code.includes('ngOnInit')
    ) {
      return 'angular';
    }
    
    // Por defecto, asumir React
    return 'react';
  }
  
  /**
   * Genera pruebas para un componente
   * @param contexto Contexto del proyecto
   * @param componentPath Ruta del componente
   */
  async generateTests(contexto: ContextoProyecto, componentPath: string): Promise<string> {
    await this.registrarActividad(contexto, 'generando pruebas', { componentPath });
    this.log(`🧪 Generando pruebas para: ${componentPath}`);
    
    try {
      // Verificar que el componente existe
      if (!fs.existsSync(componentPath)) {
        throw new Error(`El componente no existe en la ruta: ${componentPath}`);
      }
      
      // Leer el archivo del componente
      const componentCode = fs.readFileSync(componentPath, 'utf-8');
      const componentName = path.basename(componentPath, path.extname(componentPath));
      const extension = path.extname(componentPath).substring(1);
      const framework = this.detectFramework(extension, componentCode);
      
      // Si TestAgent está disponible, solicitar pruebas
      if (this.testAgent && contexto.licencia !== 'Community') {
        this.log(`🔄 Solicitando pruebas a TestAgent...`);
        await this.requestTests(contexto, componentName, {
          name: componentName,
          library: framework,
          styling: this.stylingMethod,
          outputDir: this.componentsDir,
          features: [],
          accessibility: 'AA',
          responsive: true,
          darkMode: false
        });
        
        // Simular respuesta de TestAgent (en una implementación real, esperaríamos la respuesta)
        this.log(`⏳ Esperando respuesta de TestAgent...`);
      }
      
      // Crear prompt para generar pruebas
      const testsPrompt = `
      Genera pruebas completas para el siguiente componente ${framework}:
      
      \`\`\`${extension}
      ${componentCode}
      \`\`\`
      
      Las pruebas deben incluir:
      1. Renderizado básico
      2. Pruebas de props
      3. Pruebas de eventos y callbacks
      4. Pruebas de estados
      5. Pruebas de accesibilidad
      6. Pruebas de snapshots
      
      Usa ${framework === 'react' ? 'React Testing Library y Jest' : framework === 'vue' ? 'Vue Test Utils y Jest' : framework === 'angular' ? 'TestBed' : 'el framework de pruebas adecuado'}.
      `;
      
      // Consultar al LLM
      const testsResult = await this.ejecutarPrompt(contexto, testsPrompt);
      
      // Extraer código de las pruebas
      const testsCode = this.extractCodeBlock(testsResult, this.getFileExtension('test', framework), 'Test');
      
      // Guardar pruebas en un archivo
      const testsFilePath = path.join(path.dirname(componentPath), `${componentName}.test.${this.getFileExtension('test', framework)}`);
      fs.writeFileSync(testsFilePath, testsCode);
      
      this.log(`✅ Pruebas generadas y guardadas en: ${testsFilePath}`);
      
      return testsFilePath;
    } catch (error) {
      this.log(`❌ Error generando pruebas: ${error.message}`, 'error');
      await this.registrarActividad(contexto, 'error generando pruebas', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Genera estilos para un componente
   * @param contexto Contexto del proyecto
   * @param componentPath Ruta del componente
   */
  async generateStyles(contexto: ContextoProyecto, componentPath: string): Promise<string> {
    await this.registrarActividad(contexto, 'generando estilos', { componentPath });
    this.log(`💅 Generando estilos para: ${componentPath}`);
    
    try {
      // Verificar que el componente existe
      if (!fs.existsSync(componentPath)) {
        throw new Error(`El componente no existe en la ruta: ${componentPath}`);
      }
      
      // Leer el archivo del componente
      const componentCode = fs.readFileSync(componentPath, 'utf-8');
      const componentName = path.basename(componentPath, path.extname(componentPath));
      const extension = path.extname(componentPath).substring(1);
      const framework = this.detectFramework(extension, componentCode);
      
      // Si StyleAgent está disponible, solicitar estilos
      if (this.styleAgent && contexto.licencia !== 'Community') {
        this.log(`🔄 Solicitando estilos a StyleAgent...`);
        await this.requestStyles(contexto, componentName, {
          name: componentName,
          library: framework,
          styling: this.stylingMethod,
          outputDir: this.componentsDir,
          features: [],
          accessibility: 'AA',
          responsive: true,
          darkMode: false
        });
        
        // Simular respuesta de StyleAgent (en una implementación real, esperaríamos la respuesta)
        this.log(`⏳ Esperando respuesta de StyleAgent...`);
      }
      
      // Crear prompt para generar estilos
      const stylesPrompt = `
      Genera estilos completos para el siguiente componente ${framework}:
      
      \`\`\`${extension}
      ${componentCode}
      \`\`\`
      
      Usa el método de estilizado: ${this.stylingMethod}
      
      Los estilos deben:
      1. Ser responsivos
      2. Seguir buenas prácticas de CSS
      3. Usar variables para colores y tamaños
      4. Incluir soporte para modo oscuro si es apropiado
      5. Seguir principios de accesibilidad
      6. Ser optimizados para rendimiento
      
      ${this.stylingMethod === 'css-modules' ? 'Usa CSS Modules con clases locales.' : 
        this.stylingMethod === 'styled-components' ? 'Usa styled-components con componentes estilizados.' : 
        this.stylingMethod === 'tailwind' ? 'Usa clases de Tailwind CSS.' : 
        this.stylingMethod === 'scss' ? 'Usa SCSS con anidamiento y variables.' : 
        'Usa CSS estándar.'}
      `;
      
      // Consultar al LLM
      const stylesResult = await this.ejecutarPrompt(contexto, stylesPrompt);
      
      // Extraer código de los estilos
      const stylesCode = this.extractCodeBlock(stylesResult, this.getFileExtension('styles', framework), 'Styles');
      
      // Guardar estilos en un archivo
      const stylesFilePath = path.join(path.dirname(componentPath), `${componentName}.${this.getFileExtension('styles', framework)}`);
      fs.writeFileSync(stylesFilePath, stylesCode);
      
      this.log(`✅ Estilos generados y guardados en: ${stylesFilePath}`);
      
      return stylesFilePath;
    } catch (error) {
      this.log(`❌ Error generando estilos: ${error.message}`, 'error');
      await this.registrarActividad(contexto, 'error generando estilos', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Migra un componente de un framework a otro
   * @param contexto Contexto del proyecto
   * @param componentPath Ruta del componente
   * @param targetFramework Framework destino
   */
  async migrateComponent(contexto: ContextoProyecto, componentPath: string, targetFramework: string): Promise<string> {
    await this.registrarActividad(contexto, 'migrando componente', { componentPath, targetFramework });
    this.log(`🔄 Migrando componente de ${path.extname(componentPath).substring(1)} a ${targetFramework}: ${componentPath}`);
    
    try {
      // Verificar que el componente existe
      if (!fs.existsSync(componentPath)) {
        throw new Error(`El componente no existe en la ruta: ${componentPath}`);
      }
      
      // Leer el archivo del componente
      const componentCode = fs.readFileSync(componentPath, 'utf-8');
      const componentName = path.basename(componentPath, path.extname(componentPath));
      const sourceExtension = path.extname(componentPath).substring(1);
      const sourceFramework = this.detectFramework(sourceExtension, componentCode);
      
      // Verificar que el framework destino es válido
      const validFrameworks = ['react', 'vue', 'angular', 'svelte'];
      if (!validFrameworks.includes(targetFramework.toLowerCase())) {
        throw new Error(`Framework destino no válido: ${targetFramework}. Debe ser uno de: ${validFrameworks.join(', ')}`);
      }
      
      // Crear prompt para migrar el componente
      const migrationPrompt = `
      Migra el siguiente componente de ${sourceFramework} a ${targetFramework}:
      
      \`\`\`${sourceExtension}
      ${componentCode}
      \`\`\`
      
      Asegúrate de:
      1. Mantener toda la funcionalidad
      2. Adaptar los ciclos de vida y hooks
      3. Convertir los props/inputs correctamente
      4. Adaptar los eventos y callbacks
      5. Convertir los estilos al formato adecuado
      6. Seguir las mejores prácticas de ${targetFramework}
      
      Responde con el código completo del componente migrado.
      `;
      
      // Consultar al LLM
      const migrationResult = await this.ejecutarPrompt(contexto, migrationPrompt);
      
      // Extraer código del componente migrado
      const targetExtension = this.getFileExtension('component', targetFramework);
      const migratedCode = this.extractCodeBlock(migrationResult, targetExtension, 'Component');
      
      // Guardar componente migrado en un archivo
      const migratedFilePath = path.join(path.dirname(componentPath), `${componentName}.${targetExtension}`);
      fs.writeFileSync(migratedFilePath, migratedCode);
      
      this.log(`✅ Componente migrado y guardado en: ${migratedFilePath}`);
      
      // Generar archivos complementarios (estilos, pruebas, documentación)
      this.log(`🔄 Generando archivos complementarios para el componente migrado...`);
      
      try {
        await this.generateStyles(contexto, migratedFilePath);
        await this.generateTests(contexto, migratedFilePath);
        await this.generateDocs(contexto, migratedFilePath);
        await this.generateStorybook(contexto, migratedFilePath);
      } catch (error) {
        this.log(`⚠️ Error generando archivos complementarios: ${error.message}`, 'warning');
      }
      
      return migratedFilePath;
    } catch (error) {
      this.log(`❌ Error migrando componente: ${error.message}`, 'error');
      await this.registrarActividad(contexto, 'error migrando componente', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Optimiza un componente para mejorar rendimiento, accesibilidad, etc.
   * @param contexto Contexto del proyecto
   * @param componentPath Ruta del componente
   * @param optimizationGoals Objetivos de optimización (rendimiento, accesibilidad, etc.)
   */
  async optimizeComponent(contexto: ContextoProyecto, componentPath: string, optimizationGoals: string[]): Promise<string> {
    await this.registrarActividad(contexto, 'optimizando componente', { componentPath, optimizationGoals });
    this.log(`⚡ Optimizando componente para: ${optimizationGoals.join(', ')}`);
    
    try {
      // Verificar que el componente existe
      if (!fs.existsSync(componentPath)) {
        throw new Error(`El componente no existe en la ruta: ${componentPath}`);
      }
      
      // Leer el archivo del componente
      const componentCode = fs.readFileSync(componentPath, 'utf-8');
      const componentName = path.basename(componentPath, path.extname(componentPath));
      const extension = path.extname(componentPath).substring(1);
      const framework = this.detectFramework(extension, componentCode);
      
      // Crear prompt para optimizar el componente
      const optimizationPrompt = `
      Optimiza el siguiente componente ${framework} para mejorar: ${optimizationGoals.join(', ')}
      
      \`\`\`${extension}
      ${componentCode}
      \`\`\`
      
      Aplica las siguientes optimizaciones según los objetivos:
      
      ${optimizationGoals.includes('rendimiento') ? `
      - Rendimiento:
        * Usa React.memo o useMemo donde sea apropiado
        * Evita re-renderizados innecesarios
        * Optimiza loops y operaciones costosas
        * Implementa lazy loading para recursos pesados
      ` : ''}
      
      ${optimizationGoals.includes('accesibilidad') ? `
      - Accesibilidad:
        * Añade atributos ARIA apropiados
        * Asegura un orden de tabulación lógico
        * Mejora el contraste de colores
        * Añade textos alternativos para imágenes
        * Implementa manejo de teclado
      ` : ''}
      
      ${optimizationGoals.includes('mantenibilidad') ? `
      - Mantenibilidad:
        * Refactoriza código duplicado
        * Mejora nombres de variables y funciones
        * Añade comentarios explicativos
        * Divide componentes grandes en subcomponentes
        * Implementa patrones de diseño apropiados
      ` : ''}
      
      ${optimizationGoals.includes('seo') ? `
      - SEO:
        * Añade metadatos apropiados
        * Mejora la estructura semántica
        * Optimiza para motores de búsqueda
        * Implementa schema.org donde sea apropiado
      ` : ''}
      
      Responde con el código optimizado y una explicación de los cambios realizados.
      `;
      
      // Consultar al LLM
      const optimizationResult = await this.ejecutarPrompt(contexto, optimizationPrompt);
      
      // Extraer código del componente optimizado
      const optimizedCode = this.extractCodeBlock(optimizationResult, extension, 'Component');
      
      // Guardar componente optimizado
      const optimizedFilePath = path.join(path.dirname(componentPath), `${componentName}.optimized.${extension}`);
      fs.writeFileSync(optimizedFilePath, optimizedCode);
      
      // Extraer explicación de los cambios
      const explanation = optimizationResult.replace(new RegExp(`\`\`\`${extension}[\\s\\S]*?\`\`\``, 'g'), '').trim();
      const explanationFilePath = path.join(path.dirname(componentPath), `${componentName}.optimization.md`);
      fs.writeFileSync(explanationFilePath, explanation);
      
      this.log(`✅ Componente optimizado y guardado en: ${optimizedFilePath}`);
      this.log(`📝 Explicación guardada en: ${explanationFilePath}`);
      
      // Solicitar revisión de código si está disponible
      if (this.codeReviewAgent && contexto.licencia !== 'Community') {
        await this.requestCodeReview(contexto, `${componentName}.optimized`, optimizedCode);
      }
      
      return optimizedFilePath;
    } catch (error) {
      this.log(`❌ Error optimizando componente: ${error.message}`, 'error');
      await this.registrarActividad(contexto, 'error optimizando componente', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Genera un componente a partir de un diseño de Figma
   * @param contexto Contexto del proyecto
   * @param figmaUrl URL del diseño de Figma
   * @param componentName Nombre del componente (opcional)
   */
  async generateFromFigma(contexto: ContextoProyecto, figmaUrl: string, componentName?: string): Promise<ComponentResult> {
    await this.registrarActividad(contexto, 'generando componente desde Figma', { figmaUrl });
    this.log(`🎨 Generando componente desde Figma: ${figmaUrl}`);
    
    try {
      // Verificar que la URL de Figma es válida
      if (!figmaUrl.includes('figma.com')) {
        throw new Error(`URL de Figma no válida: ${figmaUrl}`);
      }
      
      // Solicitar análisis del diseño a UIDesignAgent
      this.log(`🔍 Solicitando análisis de diseño a UIDesignAgent...`);
      
      // Enviar evento a UIDesignAgent
      this.sendEvent(AgentEventType.UI_DESIGN_ANALYSIS_REQUESTED, {
        figmaUrl,
        type: 'component',
        timestamp: new Date().toISOString()
      }, 'UIDesignAgent');
      
      // Simular respuesta de UIDesignAgent (en una implementación real, esperaríamos la respuesta)
      const figmaAnalysisPrompt = `
      Analiza el diseño de Figma en ${figmaUrl} y genera una especificación detallada para un componente ${this.componentLibrary}.
      Describe:
      - Estructura del componente
      - Elementos visuales (botones, textos, imágenes, etc.)
      - Colores y estilos
      - Espaciado y alineación
      - Tipografía
      - Estados (hover, active, disabled)
      - Responsividad
      - Animaciones (si aplica)
      
      Responde con una especificación completa que pueda ser usada para generar el componente.
      `;
      
      const figmaAnalysis = await this.ejecutarPrompt(contexto, figmaAnalysisPrompt);
      
      // Generar componente a partir del análisis
      const componentSpec = `
      Componente basado en diseño de Figma: ${figmaUrl}
      
      ${figmaAnalysis}
      
      Framework: ${this.componentLibrary}
      Styling: ${this.stylingMethod}
      ${componentName ? `name: ${componentName}` : ''}
      `;
      
      // Usar el método run para generar el componente
      return await this.run(contexto, componentSpec);
    } catch (error) {
      this.log(`❌ Error generando componente desde Figma: ${error.message}`, 'error');
      await this.registrarActividad(contexto, 'error generando componente desde Figma', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Maneja eventos de otros agentes
   * @param event Evento recibido
   */
  async handleEvent(event: any): Promise<void> {
    this.log(`📨 Evento recibido: ${event.type}`);
    
    try {
      switch (event.type) {
        case AgentEventType.STYLE_UPDATED:
          // Actualizar estilos de un componente
          if (event.data && event.data.componentName && event.data.styles) {
            this.updateComponentStyles(event.data.componentName, event.data.styles);
          }
          break;
          
        case AgentEventType.TEST_COMPLETED:
          // Notificar sobre pruebas completadas
          if (event.data && event.data.componentName) {
            this.log(`✅ Pruebas completadas para ${event.data.componentName}`);
          }
          break;
          
        case AgentEventType.CODE_REVIEW_COMPLETED:
          // Notificar sobre revisión de código completada
          if (event.data && event.data.componentName && event.data.feedback) {
            this.log(`🔍 Revisión de código completada para ${event.data.componentName}`);
            
            // Guardar feedback en un archivo
            const componentDir = path.join(this.componentsDir, event.data.componentName);
            const feedbackFilePath = path.join(componentDir, `${event.data.componentName}.review.md`);
            fs.writeFileSync(feedbackFilePath, event.data.feedback);
            
            this.log(`📝 Feedback de revisión guardado en: ${feedbackFilePath}`);
          }
          break;
          
        case AgentEventType.FIGMA_ANALYSIS_COMPLETED:
          // Notificar sobre análisis de Figma completado
          if (event.data && event.data.figmaUrl && event.data.analysis) {
            this.log(`🎨 Análisis de Figma completado para: ${event.data.figmaUrl}`);
            
            // Guardar análisis en un archivo
            const analysisDir = path.join(this.componentsDir, 'figma-analysis');
            if (!fs.existsSync(analysisDir)) {
              fs.mkdirSync(analysisDir, { recursive: true });
            }
            
            const analysisFilePath = path.join(analysisDir, `${new Date().toISOString().replace(/:/g, '-')}.json`);
            fs.writeFileSync(analysisFilePath, JSON.stringify(event.data.analysis, null, 2));
            
            this.log(`📝 Análisis de Figma guardado en: ${analysisFilePath}`);
          }
          break;
          
        case AgentEventType.COMPONENT_REQUESTED:
          // Procesar solicitud de componente
          if (event.data && event.data.spec) {
            this.log(`🔄 Solicitud de componente recibida: ${event.data.spec.name || 'Sin nombre'}`);
            
            // Crear contexto para la solicitud
            const contexto: ContextoProyecto = {
              nombre: event.data.projectName || 'Proyecto sin nombre',
              descripcion: event.data.projectDescription || 'Sin descripción',
              licencia: event.data.license || 'Community',
              version: event.data.version || '1.0.0',
              autor: event.data.author || 'Usuario',
              fecha: new Date().toISOString(),
              id: event.data.id || `component-${Date.now()}`,
              tipo: 'component',
              estado: 'activo'
            };
            
            // Generar componente
            this.run(contexto, event.data.spec)
              .then(result => {
                this.log(`✅ Componente generado: ${result.name}`);
                
                // Enviar evento de componente generado
                this.sendEvent(AgentEventType.COMPONENT_GENERATED, {
                  name: result.name,
                  files: result.files,
                  path: result.path,
                  framework: result.framework,
                  timestamp: new Date().toISOString()
                }, event.source || 'unknown');
              })
              .catch(error => {
                this.log(`❌ Error generando componente: ${error.message}`, 'error');
                
                // Enviar evento de error
                this.sendEvent(AgentEventType.COMPONENT_GENERATION_ERROR, {
                  error: error.message,
                  spec: event.data.spec,
                  timestamp: new Date().toISOString()
                }, event.source || 'unknown');
              });
          }
          break;
          
        default:
          this.log(`⚠️ Evento no manejado: ${event.type}`, 'warning');
      }
    } catch (error) {
      this.log(`❌ Error manejando evento: ${error.message}`, 'error');
    }
  }
  
  /**
   * Actualiza los estilos de un componente
   * @param componentName Nombre del componente
   * @param styles Estilos actualizados
   */
  private updateComponentStyles(componentName: string, styles: string): void {
    try {
      // Buscar el componente
      const componentDir = path.join(this.componentsDir, componentName);
      if (!fs.existsSync(componentDir)) {
        throw new Error(`Directorio del componente no encontrado: ${componentDir}`);
      }
      
      // Determinar el archivo de estilos
      const stylesFiles = fs.readdirSync(componentDir).filter(file => 
        file.startsWith(componentName) && 
        (file.endsWith('.css') || file.endsWith('.scss') || file.endsWith('.less') || 
         file.endsWith('.styled.ts') || file.endsWith('.styled.js') || 
         file.endsWith('.module.css') || file.endsWith('.module.scss'))
      );
      
      if (stylesFiles.length === 0) {
        // No se encontró archivo de estilos, crear uno nuevo
        const extension = this.getStyleExtension();
        const stylesFilePath = path.join(componentDir, `${componentName}.${extension}`);
        fs.writeFileSync(stylesFilePath, styles);
        this.log(`✅ Archivo de estilos creado: ${stylesFilePath}`);
      } else {
        // Actualizar el primer archivo de estilos encontrado
        const stylesFilePath = path.join(componentDir, stylesFiles[0]);
        fs.writeFileSync(stylesFilePath, styles);
        this.log(`✅ Estilos actualizados en: ${stylesFilePath}`);
      }
    } catch (error) {
      this.log(`❌ Error actualizando estilos: ${error.message}`, 'error');
    }
  }
  
  /**
   * Obtiene la extensión de archivo para estilos según el método de estilizado
   */
  private getStyleExtension(): string {
    switch (this.stylingMethod) {
      case 'css-modules':
        return 'module.css';
      case 'scss':
        return 'scss';
      case 'less':
        return 'less';
      case 'styled-components':
        return 'styled.ts';
      case 'tailwind':
        return 'css';
      default:
        return 'css';
    }
  }
  
  /**
   * Solicita una revisión de código al CodeReviewAgent
   * @param contexto Contexto del proyecto
   * @param componentName Nombre del componente
   * @param code Código del componente
   */
  private async requestCodeReview(contexto: ContextoProyecto, componentName: string, code: string): Promise<void> {
    if (!this.codeReviewAgent) {
      this.log(`⚠️ CodeReviewAgent no disponible`, 'warning');
      return;
    }
    
    try {
      this.log(`🔍 Solicitando revisión de código para: ${componentName}`);
      
      // Enviar evento a CodeReviewAgent
      this.sendEvent(AgentEventType.CODE_REVIEW_REQUESTED, {
        componentName,
        code,
        language: this.componentLibrary,
        timestamp: new Date().toISOString()
      }, 'CodeReviewAgent');
      
      // En una implementación real, esperaríamos la respuesta del CodeReviewAgent
      this.log(`⏳ Esperando respuesta de CodeReviewAgent...`);
    } catch (error) {
      this.log(`❌ Error solicitando revisión de código: ${error.message}`, 'error');
    }
  }
  
  /**
   * Solicita pruebas al TestAgent
   * @param contexto Contexto del proyecto
   * @param componentName Nombre del componente
   * @param config Configuración del componente
   */
  private async requestTests(contexto: ContextoProyecto, componentName: string, config: ComponentConfig): Promise<void> {
    if (!this.testAgent) {
      this.log(`⚠️ TestAgent no disponible`, 'warning');
      return;
    }
    
    try {
      this.log(`🧪 Solicitando pruebas para: ${componentName}`);
      
      // Enviar evento a TestAgent
      this.sendEvent(AgentEventType.TEST_REQUESTED, {
        componentName,
        config,
        timestamp: new Date().toISOString()
      }, 'TestAgent');
      
      // En una implementación real, esperaríamos la respuesta del TestAgent
      this.log(`⏳ Esperando respuesta de TestAgent...`);
    } catch (error) {
      this.log(`❌ Error solicitando pruebas: ${error.message}`, 'error');
    }
  }
  
  /**
   * Solicita estilos al StyleAgent
   * @param contexto Contexto del proyecto
   * @param componentName Nombre del componente
   * @param config Configuración del componente
   */
  private async requestStyles(contexto: ContextoProyecto, componentName: string, config: ComponentConfig): Promise<void> {
    if (!this.styleAgent) {
      this.log(`⚠️ StyleAgent no disponible`, 'warning');
      return;
    }
    
    try {
      this.log(`💅 Solicitando estilos para: ${componentName}`);
      
      // Enviar evento a StyleAgent
      this.sendEvent(AgentEventType.STYLE_REQUESTED, {
        componentName,
        config,
        timestamp: new Date().toISOString()
      }, 'StyleAgent');
      
      // En una implementación real, esperaríamos la respuesta del StyleAgent
      this.log(`⏳ Esperando respuesta de StyleAgent...`);
    } catch (error) {
      this.log(`❌ Error solicitando estilos: ${error.message}`, 'error');
    }
  }
  
  /**
   * Extrae un bloque de código de un texto
   * @param text Texto que contiene el bloque de código
   * @param extension Extensión del archivo
   * @param type Tipo de código (Component, Test, Styles, etc.)
   */
  private extractCodeBlock(text: string, extension: string, type: string): string {
    try {
      // Buscar bloques de código con la extensión especificada
      const regex = new RegExp(`\`\`\`(?:${extension})?\\s*([\\s\\S]*?)\\s*\`\`\``, 'g');
      const matches = [...text.matchAll(regex)];
      
      if (matches.length > 0) {
        // Devolver el primer bloque de código encontrado
        return matches[0][1].trim();
      }
      
      // Si no se encuentra un bloque con la extensión específica, buscar cualquier bloque de código
      const genericRegex = /```(?:\w+)?\s*([\s\S]*?)\s*```/g;
      const genericMatches = [...text.matchAll(genericRegex)];
      
      if (genericMatches.length > 0) {
        // Devolver el primer bloque de código genérico
        return genericMatches[0][1].trim();
      }
      
      // Si no se encuentra ningún bloque de código, devolver el texto completo
      this.log(`⚠️ No se encontró bloque de código para ${type}, usando texto completo`, 'warning');
      return text.trim();
    } catch (error) {
      this.log(`❌ Error extrayendo bloque de código: ${error.message}`, 'error');
      return text.trim();
    }
  }
  
  /**
   * Obtiene la extensión de archivo según el tipo y framework
   * @param type Tipo de archivo (component, test, styles, storybook)
   * @param framework Framework utilizado
   */
  private getFileExtension(type: string, framework: string): string {
    const frameworkLower = framework.toLowerCase();
    
    switch (type) {
      case 'component':
        if (frameworkLower === 'react') return 'tsx';
        if (frameworkLower === 'vue') return 'vue';
        if (frameworkLower === 'angular') return 'component.ts';
        if (frameworkLower === 'svelte') return 'svelte';
        return 'js';
        
      case 'test':
        if (frameworkLower === 'react') return 'test.tsx';
        if (frameworkLower === 'vue') return 'spec.js';
        if (frameworkLower === 'angular') return 'spec.ts';
        if (frameworkLower === 'svelte') return 'test.js';
        return 'test.js';
        
      case 'styles':
        if (this.stylingMethod === 'css-modules') return 'module.css';
        if (this.stylingMethod === 'scss') return 'scss';
        if (this.stylingMethod === 'less') return 'less';
        if (this.stylingMethod === 'styled-components') return 'styled.ts';
        return 'css';
        
      case 'storybook':
        if (frameworkLower === 'react') return 'stories.tsx';
        if (frameworkLower === 'vue') return 'stories.js';
        if (frameworkLower === 'angular') return 'stories.ts';
        if (frameworkLower === 'svelte') return 'stories.js';
        return 'stories.js';
        
      default:
        return 'js';
    }
  }
  
  /**
   * Registra una actividad en el historial
   * @param contexto Contexto del proyecto
   * @param tipo Tipo de actividad
   * @param datos Datos adicionales
   */
  private async registrarActividad(contexto: ContextoProyecto, tipo: string, datos: any = {}): Promise<void> {
    try {
      const actividad = {
        agente: 'ComponentAgent',
        tipo,
        datos,
        timestamp: new Date().toISOString(),
        contexto: {
          id: contexto.id,
          nombre: contexto.nombre,
          tipo: contexto.tipo
        }
      };
      
      // Guardar actividad en el historial
      const historialDir = path.join(this.componentsDir, '../historial');
      if (!fs.existsSync(historialDir)) {
        fs.mkdirSync(historialDir, { recursive: true });
      }
      
      const historialFilePath = path.join(historialDir, `${contexto.id}.json`);
      
      let historial = [];
      if (fs.existsSync(historialFilePath)) {
        historial = JSON.parse(fs.readFileSync(historialFilePath, 'utf-8'));
      }
      
      historial.push(actividad);
      fs.writeFileSync(historialFilePath, JSON.stringify(historial, null, 2));
    } catch (error) {
      this.log(`❌ Error registrando actividad: ${error.message}`, 'error');
    }
  }
  
  /**
   * Envía un evento a otro agente
   * @param type Tipo de evento
   * @param data Datos del evento
   * @param target Agente destino
   */
  private sendEvent(type: AgentEventType, data: any, target: string): void {
    try {
      const event = {
        type,
        data,
        source: 'ComponentAgent',
        timestamp: new Date().toISOString()
      };
      
      // En una implementación real, aquí se enviaría el evento al agente destino
      this.log(`📤 Enviando evento ${type} a ${target}`);
      
      // Emitir evento para que lo reciba el agente destino
      this.emit('event', event, target);
    } catch (error) {
      this.log(`❌ Error enviando evento: ${error.message}`, 'error');
    }
  }
  
  /**
   * Integra el componente con VS Code
   * @param componentPath Ruta del componente
   */
  private integrateWithVSCode(componentPath: string): void {
    try {
      // Verificar que estamos en un entorno VS Code
      if (typeof vscode === 'undefined') {
        return;
      }
      
      // Abrir el archivo del componente en el editor
      vscode.window.showTextDocument(vscode.Uri.file(componentPath));
      
      // Mostrar notificación
      vscode.window.showInformationMessage(`Componente generado: ${path.basename(componentPath)}`);
    } catch (error) {
      this.log(`❌ Error integrando con VS Code: ${error.message}`, 'error');
    }
  }
}

// Exportar el agente
export { ComponentAgent, ComponentConfig, ComponentResult };