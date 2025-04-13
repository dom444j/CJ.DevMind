import { BaseAgent, ContextoProyecto, AgentEventType } from './base-agent';
import { MemoryAgent } from './memory-agent';
import { DashboardAgent } from './dashboard-agent';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import sharp from 'sharp';

/**
 * Interfaz para las especificaciones de wireframe
 */
interface WireframeSpec {
  name: string;
  description: string;
  viewportSize: {
    width: number;
    height: number;
  };
  elements: Array<{
    type: string;
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    content?: string;
    properties?: Record<string, any>;
  }>;
}

/**
 * Interfaz para las rutas de navegación
 */
interface NavigationRoute {
  path: string;
  name: string;
  component: string;
  children?: NavigationRoute[];
  meta?: Record<string, any>;
}

/**
 * Layout Agent - Estructura la navegación y organización espacial de interfaces
 * 
 * Este agente es responsable de:
 * 1. Diseñar la estructura de navegación de la aplicación
 * 2. Crear wireframes para las diferentes vistas
 * 3. Definir la organización espacial de componentes
 * 4. Implementar sistemas de layout responsivos
 * 5. Generar código HTML/CSS para estructuras de layout
 * 6. Exportar recursos a formatos como PNG/PDF
 */
export class LayoutAgent extends BaseAgent {
  private wireframesDir: string;
  private diagramsDir: string;
  private layoutsDir: string;
  private navigationDir: string;
  private projectRoot: string;
  private memoryAgent: MemoryAgent;
  private dashboardAgent: DashboardAgent;

  constructor(userId: string) {
    super(userId);
    this.agentName = 'LayoutAgent';
    this.projectRoot = process.cwd();

    // Inicializar directorios
    this.wireframesDir = path.join(this.projectRoot, 'wireframes');
    this.diagramsDir = path.join(this.projectRoot, 'wireframes', 'diagrams');
    this.layoutsDir = path.join(this.projectRoot, 'src', 'layouts');
    this.navigationDir = path.join(this.projectRoot, 'src', 'navigation');

    // Crear directorios si no existen
    this.ensureDirectoryExists(this.wireframesDir);
    this.ensureDirectoryExists(this.diagramsDir);
    this.ensureDirectoryExists(this.layoutsDir);
    this.ensureDirectoryExists(this.navigationDir);

    this.memoryAgent = new MemoryAgent();
    this.dashboardAgent = new DashboardAgent();

    this.log('🏗️ Layout Agent inicializado');
  }

  /**
   * Asegura que un directorio exista
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Ejecuta el agente de layout
   * @param contexto Contexto del proyecto
   * @param spec Especificación del layout a generar
   */
  async run(contexto: ContextoProyecto, spec: string): Promise<void> {
    if (contexto.licencia === 'Community' && spec.includes('advanced')) {
      throw new Error('Community Edition no soporta layouts avanzados');
    }

    await this.registrarActividad(contexto, 'iniciando LayoutAgent', { spec });

    try {
      if (spec.startsWith('wireframe:')) {
        const wireframeSpec = spec.substring(10).trim();
        await this.generateWireframe(contexto, wireframeSpec);
      } else if (spec.startsWith('navigation:')) {
        const navSpec = spec.substring(11).trim();
        await this.generateNavigation(contexto, navSpec);
      } else if (spec.startsWith('responsive:')) {
        const responsiveSpec = spec.substring(11).trim();
        await this.generateResponsiveLayout(contexto, responsiveSpec);
      } else if (spec.startsWith('prototype:')) {
        const prototypeSpec = spec.substring(10).trim();
        await this.generatePrototype(contexto, prototypeSpec);
      } else {
        await this.generateLayout(contexto, spec);
      }

      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        estado: 'layout completado',
        spec,
      });

      this.log('✅ Layout Agent completado con éxito');
    } catch (error) {
      await this.registrarActividad(contexto, 'error en LayoutAgent', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Genera un wireframe basado en la especificación
   * @param contexto Contexto del proyecto
   * @param spec Especificación del wireframe
   */
  private async generateWireframe(contexto: ContextoProyecto, spec: string): Promise<void> {
    await this.registrarActividad(contexto, 'generando wireframe', { spec });

    const designContext = this.readContext('design.md') || 'No design context available.';
    const brandContext = this.readContext('brand.md') || 'No brand context available.';

    const wireframePrompt = `
    # Contexto de Diseño
    ${designContext}
    
    # Contexto de Marca
    ${brandContext}
    
    # Tarea de Layout Agent
    
    Genera un wireframe para la siguiente vista:
    
    "${spec}"
    
    Crea un archivo SVG que represente el wireframe con elementos básicos (rectángulos, textos, etc.).
    Incluye anotaciones para explicar cada elemento.
    
    Formato de respuesta:
    \`\`\`svg
    <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <!-- Elementos del wireframe -->
    </svg>
    \`\`\`
    
    También proporciona una descripción detallada de los elementos y su propósito.
    
    Adicionalmente, proporciona una especificación estructurada del wireframe en formato JSON:
    \`\`\`json
    {
      "name": "Nombre del wireframe",
      "description": "Descripción del wireframe",
      "viewportSize": {
        "width": 1200,
        "height": 800
      },
      "elements": [
        {
          "type": "container|text|button|image|input|etc",
          "id": "identificador-único",
          "x": 0,
          "y": 0,
          "width": 100,
          "height": 50,
          "content": "Contenido si aplica",
          "properties": {
            "propiedad": "valor"
          }
        }
      ]
    }
    \`\`\`
    `;

    try {
      const response = await this.ejecutarPrompt(contexto, wireframePrompt);

      const svgMatch = response.match(/```svg\n([\s\S]*?)\n```/) || response.match(/<svg[\s\S]*?<\/svg>/);
      if (!svgMatch) {
        throw new Error('No se pudo extraer el wireframe SVG de la respuesta del LLM');
      }
      const svgContent = svgMatch[1] || svgMatch[0];

      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/);
      let wireframeSpecObj: WireframeSpec | null = null;
      if (jsonMatch) {
        wireframeSpecObj = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }

      const fileName = wireframeSpecObj?.name
        ? wireframeSpecObj.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : `wireframe-${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
      const filePath = path.join(this.wireframesDir, `${fileName}.svg`);

      fs.writeFileSync(filePath, svgContent, 'utf-8');

      const descriptionMatch = response.match(/```svg[\s\S]*?```\s*([\s\S]*?)(?=```json|$)/);
      let description = descriptionMatch?.[1]?.trim() || wireframeSpecObj?.description || `Wireframe generado para: ${spec}`;

      const descFilePath = path.join(this.wireframesDir, `${fileName}.md`);
      fs.writeFileSync(descFilePath, description, 'utf-8');

      if (wireframeSpecObj) {
        const jsonFilePath = path.join(this.wireframesDir, `${fileName}.json`);
        fs.writeFileSync(jsonFilePath, JSON.stringify(wireframeSpecObj, null, 2), 'utf-8');
        await this.guardarContexto(contexto, jsonFilePath);
        await this.memoryAgent.store(
          { wireframe: wireframeSpecObj, spec },
          { tipo: 'wireframe', proyectoId: contexto.id }
        );
      }

      await this.generateHTMLWireframe(contexto, spec, svgContent, description, wireframeSpecObj);

      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        estado: 'wireframe generado',
        wireframe: { name: fileName, path: filePath },
      });

      this.sendEvent(AgentEventType.RESOURCE_CREATED, {
        type: 'wireframe',
        path: filePath,
        name: fileName,
        description: description.substring(0, 100) + (description.length > 100 ? '...' : ''),
      });

      this.log(`✅ Wireframe generado: ${filePath}`);
    } catch (error) {
      await this.registrarActividad(contexto, 'error generando wireframe', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Genera una versión HTML interactiva del wireframe
   * @param contexto Contexto del proyecto
   * @param spec Especificación del wireframe
   * @param svgContent Contenido SVG del wireframe
   * @param description Descripción del wireframe
   * @param wireframeSpec Especificación estructurada del wireframe
   */
  private async generateHTMLWireframe(
    contexto: ContextoProyecto,
    spec: string,
    svgContent: string,
    description: string,
    wireframeSpec: WireframeSpec | null
  ): Promise<void> {
    const htmlWireframesDir = path.join(this.wireframesDir, 'html');
    this.ensureDirectoryExists(htmlWireframesDir);

    const fileName = wireframeSpec?.name
      ? wireframeSpec.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : `wireframe-${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
    const filePath = path.join(htmlWireframesDir, `${fileName}.html`);

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Wireframe: ${wireframeSpec?.name || spec}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; background-color: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); overflow: hidden; }
    header { background-color: #0284c7; color: white; padding: 20px; }
    h1 { margin: 0; }
    .wireframe-container { padding: 20px; overflow: auto; }
    .description { padding: 20px; background-color: #f0f9ff; border-top: 1px solid #e0f2fe; }
    .wireframe-svg { width: 100%; height: auto; border: 1px solid #e0e0e0; background-color: white; }
    .annotation { display: none; position: absolute; background-color: #0ea5e9; color: white; padding: 8px 12px; border-radius: 4px; font-size: 14px; max-width: 300px; z-index: 100; }
    .annotation::after { content: ''; position: absolute; bottom: -8px; left: 50%; transform: translateX(-50%); border-width: 8px 8px 0; border-style: solid; border-color: #0ea5e9 transparent transparent; }
    .element-list { margin-top: 20px; padding: 20px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; }
    .element-list h2 { margin-top: 0; }
    .element-item { padding: 8px; margin-bottom: 8px; border-left: 3px solid #0ea5e9; background-color: #f0f9ff; }
    .tabs { display: flex; border-bottom: 1px solid #e2e8f0; }
    .tab { padding: 10px 20px; cursor: pointer; border-bottom: 2px solid transparent; }
    .tab.active { border-bottom-color: #0ea5e9; font-weight: bold; }
    .tab-content { display: none; padding: 20px; }
    .tab-content.active { display: block; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Wireframe: ${wireframeSpec?.name || spec}</h1>
    </header>
    
    <div class="tabs">
      <div class="tab active" data-tab="preview">Vista Previa</div>
      <div class="tab" data-tab="description">Descripción</div>
      ${wireframeSpec ? '<div class="tab" data-tab="elements">Elementos</div>' : ''}
      ${wireframeSpec ? '<div class="tab" data-tab="json">JSON</div>' : ''}
    </div>
    
    <div class="tab-content active" id="preview">
      <div class="wireframe-container">
        ${svgContent}
      </div>
    </div>
    
    <div class="tab-content" id="description">
      <div class="description">
        <h2>Descripción</h2>
        <div>${description.replace(/\n/g, '<br>')}</div>
      </div>
    </div>
    
    ${wireframeSpec ? `
    <div class="tab-content" id="elements">
      <div class="element-list">
        <h2>Elementos (${wireframeSpec.elements.length})</h2>
        ${wireframeSpec.elements.map(el => `
          <div class="element-item">
            <strong>${el.type}</strong> (ID: ${el.id})<br>
            Posición: (${el.x}, ${el.y}) - Tamaño: ${el.width}x${el.height}<br>
            ${el.content ? `Contenido: ${el.content}<br>` : ''}
            ${el.properties ? `Propiedades: ${JSON.stringify(el.properties)}<br>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    ${wireframeSpec ? `
    <div class="tab-content" id="json">
      <pre>${JSON.stringify(wireframeSpec, null, 2)}</pre>
    </div>
    ` : ''}
  </div>
  
  <div id="annotation" class="annotation"></div>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const annotation = document.getElementById('annotation');
      const svgElements = document.querySelectorAll('svg *');
      
      svgElements.forEach(element => {
        const title = element.getAttribute('title') || '';
        if (title) {
          element.style.cursor = 'pointer';
          element.addEventListener('mouseover', function(e) {
            annotation.textContent = title;
            annotation.style.display = 'block';
            annotation.style.left = (e.pageX - 150) + 'px';
            annotation.style.top = (e.pageY - 50) + 'px';
          });
          element.addEventListener('mouseout', function() {
            annotation.style.display = 'none';
          });
        }
      });
      
      const tabs = document.querySelectorAll('.tab');
      tabs.forEach(tab => {
        tab.addEventListener('click', function() {
          tabs.forEach(t => t.classList.remove('active'));
          document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
          this.classList.add('active');
          const tabId = this.getAttribute('data-tab');
          document.getElementById(tabId).classList.add('active');
        });
      });
    });
  </script>
</body>
</html>`;

    fs.writeFileSync(filePath, htmlContent, 'utf-8');
    await this.guardarContexto(contexto, filePath);

    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      estado: 'wireframe HTML generado',
      wireframeHtml: { name: fileName, path: filePath },
    });

    this.log(`✅ Wireframe HTML generado: ${filePath}`);
  }

  /**
   * Genera una estructura de navegación basada en la especificación
   * @param contexto Contexto del proyecto
   * @param spec Especificación de la navegación
   */
  private async generateNavigation(contexto: ContextoProyecto, spec: string): Promise<void> {
    await this.registrarActividad(contexto, 'generando estructura de navegación', { spec });

    const architectureContext = this.readContext('architecture.md') || 'No architecture context available.';
    const routingContext = this.readContext('routing.md') || 'No routing context available.';

    const navigationPrompt = `
    # Contexto de Arquitectura
    ${architectureContext}
    
    # Contexto de Enrutamiento
    ${routingContext}
    
    # Tarea de Layout Agent
    
    Diseña una estructura de navegación para:
    
    "${spec}"
    
    Incluye:
    1. Mapa de navegación (rutas y jerarquía)
    2. Componentes de navegación (menús, barras, etc.)
    3. Transiciones entre vistas
    
    Formato de respuesta:
    \`\`\`json
    {
      "routes": [
        {
          "path": "/ruta",
          "name": "Nombre",
          "component": "Componente",
          "children": [],
          "meta": {
            "requiresAuth": false,
            "icon": "icon-name",
            "title": "Título de la página"
          }
        }
      ],
      "components": [
        {
          "name": "Nombre",
          "type": "Tipo",
          "description": "Descripción"
        }
      ],
      "transitions": [
        {
          "from": "RutaOrigen",
          "to": "RutaDestino",
          "type": "fade|slide|etc",
          "duration": 300
        }
      ]
    }
    \`\`\`
    
    También proporciona el código React para implementar la navegación.
    `;

    try {
      const response = await this.ejecutarPrompt(contexto, navigationPrompt);

      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/{[\s\S]*?}/);
      if (!jsonMatch) {
        throw new Error('No se pudo extraer la estructura de navegación de la respuesta del LLM');
      }
      const navigationStructure = JSON.parse(jsonMatch[1] || jsonMatch[0]);

      const structurePath = path.join(this.navigationDir, 'navigation-structure.json');
      fs.writeFileSync(structurePath, JSON.stringify(navigationStructure, null, 2), 'utf-8');
      await this.guardarContexto(contexto, structurePath);

      const reactCodeMatch = response.match(/```(?:jsx|tsx|js|ts)\n([\s\S]*?)\n```/);
      if (reactCodeMatch && reactCodeMatch[1]) {
        const reactCodePath = path.join(this.navigationDir, 'Navigation.tsx');
        fs.writeFileSync(reactCodePath, reactCodeMatch[1], 'utf-8');
        await this.guardarContexto(contexto, reactCodePath);
      }

      await this.generateNavigationDiagram(contexto, navigationStructure, spec);

      await this.memoryAgent.store(
        { navigation: navigationStructure, spec },
        { tipo: 'navigation', proyectoId: contexto.id }
      );

      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        estado: 'estructura de navegación generada',
        navigation: { path: structurePath },
      });

      this.sendEvent(AgentEventType.RESOURCE_CREATED, {
        type: 'navigation',
        path: structurePath,
        structure: navigationStructure,
      });

      this.log(`✅ Estructura de navegación generada: ${structurePath}`);
    } catch (error) {
      await this.registrarActividad(contexto, 'error generando estructura de navegación', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Genera un diagrama visual de la estructura de navegación
   * @param contexto Contexto del proyecto
   * @param navigationStructure Estructura de navegación
   * @param spec Especificación de la navegación
   */
  private async generateNavigationDiagram(contexto: ContextoProyecto, navigationStructure: any, spec: string): Promise<void> {
    await this.registrarActividad(contexto, 'generando diagrama de navegación', { spec });

    const diagramPrompt = `
    # Tarea de Layout Agent
    
    Genera un diagrama Mermaid que represente la siguiente estructura de navegación:
    
    ${JSON.stringify(navigationStructure, null, 2)}
    
    El diagrama debe mostrar las rutas, jerarquías y relaciones entre las vistas.
    
    Formato de respuesta:
    \`\`\`mermaid
    graph TD
      A[Página Principal] --> B[Página Secundaria]
      A --> C[Otra Página]
      B --> D[Página Detalle]
    \`\`\`
    
    Usa la sintaxis de Mermaid para diagramas de flujo.
    Responde SOLO con el código Mermaid, sin explicaciones adicionales.
    `;

    try {
      const response = await this.ejecutarPrompt(contexto, diagramPrompt);
      const mermaidMatch = response.match(/```mermaid\n([\s\S]*?)\n```/) || response.match(/graph [A-Z]{2}[\s\S]*/);
      if (!mermaidMatch) {
        throw new Error('No se pudo extraer el diagrama Mermaid de la respuesta del LLM');
      }
      const mermaidContent = mermaidMatch[1] || mermaidMatch[0];

      const fileName = `navigation-${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.md`;
      const filePath = path.join(this.diagramsDir, fileName);

      fs.writeFileSync(filePath, `# Diagrama de Navegación: ${spec}\n\n\`\`\`mermaid\n${mermaidContent}\n\`\`\``, 'utf-8');
      await this.guardarContexto(contexto, filePath);

      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        estado: 'diagrama de navegación generado',
        diagram: { path: filePath },
      });

      this.log(`✅ Diagrama de navegación generado: ${filePath}`);
    } catch (error) {
      await this.registrarActividad(contexto, 'error generando diagrama de navegación', { error: (error as Error).message });
      this.log('⚠️ Continuando sin diagrama de navegación');
    }
  }

  /**
   * Genera un layout responsivo basado en la especificación
   * @param contexto Contexto del proyecto
   * @param spec Especificación del layout responsivo
   */
  private async generateResponsiveLayout(contexto: ContextoProyecto, spec: string): Promise<void> {
    await this.registrarActividad(contexto, 'generando layout responsivo', { spec });

    const responsiveContext = this.readContext('responsive.md') || 'No responsive context available.';
    const cssContext = this.readContext('css.md') || 'No CSS context available.';

    const responsivePrompt = `
    # Contexto de Diseño Responsivo
    ${responsiveContext}
    
    # Contexto de CSS
    ${cssContext}
    
    # Tarea de Layout Agent
    
    Diseña un sistema de layout responsivo para:
    
    "${spec}"
    
    Incluye:
    1. Estructura de grid/flexbox
    2. Breakpoints para diferentes dispositivos
    3. Estrategias de adaptación de contenido
    4. Variables CSS para facilitar la personalización
    
    Proporciona el código CSS/SCSS y los componentes React necesarios.
    
    Para CSS/SCSS, usa este formato:
    \`\`\`scss
    // Código SCSS aquí
    \`\`\`
    
    Para React, usa este formato:
    \`\`\`tsx
    // Código React aquí
    \`\`\`
    
    También proporciona documentación sobre cómo usar el sistema responsivo.
    `;

    try {
      const response = await this.ejecutarPrompt(contexto, responsivePrompt);

      const layoutName = spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const specificLayoutDir = path.join(this.layoutsDir, layoutName);
      this.ensureDirectoryExists(specificLayoutDir);

      const cssMatch = response.match(/```(?:css|scss)\n([\s\S]*?)\n```/);
      if (cssMatch && cssMatch[1]) {
        const cssPath = path.join(specificLayoutDir, `styles.scss`);
        fs.writeFileSync(cssPath, cssMatch[1], 'utf-8');
        await this.guardarContexto(contexto, cssPath);
      }

      const reactMatch = response.match(/```(?:jsx|tsx)\n([\s\S]*?)\n```/);
      if (reactMatch && reactMatch[1]) {
        const reactPath = path.join(specificLayoutDir, `ResponsiveLayout.tsx`);
        fs.writeFileSync(reactPath, reactMatch[1], 'utf-8');
        await this.guardarContexto(contexto, reactPath);
      }

      const docsPath = path.join(specificLayoutDir, `README.md`);
      let documentation = response.replace(/```[\s\S]*?```/g, '').trim() || `# Sistema de Layout Responsivo para ${spec}\n\n## Descripción\nSistema de layout responsivo generado por Layout Agent.\n\n## Uso\nImporta los componentes y estilos en tu aplicación React.`;
      fs.writeFileSync(docsPath, documentation, 'utf-8');
      await this.guardarContexto(contexto, docsPath);

      await this.memoryAgent.store(
        { layout: { name: layoutName, spec }, responsive: true },
        { tipo: 'layout', proyectoId: contexto.id }
      );

      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        estado: 'layout responsivo generado',
        layout: { name: layoutName, path: specificLayoutDir },
      });

      this.sendEvent(AgentEventType.RESOURCE_CREATED, {
        type: 'responsive-layout',
        path: specificLayoutDir,
        name: layoutName,
        description: `Layout responsivo para: ${spec}`,
      });

      this.log(`✅ Layout responsivo generado en: ${specificLayoutDir}`);
    } catch (error) {
      await this.registrarActividad(contexto, 'error generando layout responsivo', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Genera un layout completo (wireframe + navegación + layout responsivo)
   * @param contexto Contexto del proyecto
   * @param spec Especificación del layout completo
   */
  private async generateLayout(contexto: ContextoProyecto, spec: string): Promise<void> {
    await this.registrarActividad(contexto, 'generando layout completo', { spec });

    try {
      const layoutComponents = await this.analyzeLayoutSpec(contexto, spec);

      if (layoutComponents.wireframes && layoutComponents.wireframes.length > 0) {
        for (const wireframe of layoutComponents.wireframes) {
          await this.generateWireframe(contexto, wireframe);
        }
      } else {
        await this.generateWireframe(contexto, `Vista principal para: ${spec}`);
      }

      await this.generateNavigation(contexto, spec);
      await this.generateResponsiveLayout(contexto, spec);
      await this.generateLayoutComponents(contexto, spec, layoutComponents);
      await this.generateLayoutDocumentation(contexto, spec, layoutComponents);

      this.log('✅ Layout completo generado con éxito');
    } catch (error) {
      await this.registrarActividad(contexto, 'error generando layout completo', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Analiza la especificación del layout para extraer componentes
   * @param contexto Contexto del proyecto
   * @param spec Especificación del layout
   */
  private async analyzeLayoutSpec(contexto: ContextoProyecto, spec: string): Promise<any> {
    await this.registrarActividad(contexto, 'analizando especificación del layout', { spec });

    const analysisPrompt = `
    # Tarea de Layout Agent
    
    Analiza la siguiente especificación de layout:
    
    "${spec}"
    
    Extrae los siguientes componentes:
    1. Wireframes necesarios (lista de vistas)
    2. Estructura de navegación
    3. Componentes de layout principales
    4. Requisitos de diseño responsivo
    
    Formato de respuesta:
    \`\`\`json
    {
      "wireframes": ["Vista 1", "Vista 2", ...],
      "navigation": {
        "type": "drawer|tabs|bottom-nav|etc",
        "routes": ["Ruta 1", "Ruta 2", ...]
      },
      "components": ["Componente 1", "Componente 2", ...],
      "responsive": {
        "breakpoints": ["mobile", "tablet", "desktop"],
        "layouts": ["Tipo de layout 1", "Tipo de layout 2", ...]
      }
    }
    \`\`\`
    
    Responde SOLO con el JSON, sin explicaciones adicionales.
    `;

    try {
      const response = await this.ejecutarPrompt(contexto, analysisPrompt);
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || response.match(/{[\s\S]*?}/);
      if (!jsonMatch) {
        throw new Error('No se pudo extraer el análisis de la especificación del layout');
      }
      const layoutComponents = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      return layoutComponents;
    } catch (error) {
      await this.registrarActividad(contexto, 'error analizando especificación', { error: (error as Error).message });
      return {
        wireframes: [`Vista principal para: ${spec}`],
        navigation: { type: 'drawer', routes: ['Inicio', 'Detalles', 'Configuración'] },
        components: ['Header', 'Footer', 'Sidebar', 'MainContent'],
        responsive: { breakpoints: ['mobile', 'tablet', 'desktop'], layouts: ['flex', 'grid'] },
      };
    }
  }

  /**
   * Genera componentes de layout adicionales
   * @param contexto Contexto del proyecto
   * @param spec Especificación del layout
   * @param layoutComponents Componentes del layout
   */
  private async generateLayoutComponents(contexto: ContextoProyecto, spec: string, layoutComponents: any): Promise<void> {
    await this.registrarActividad(contexto, 'generando componentes de layout adicionales', { spec });

    if (!layoutComponents.components || layoutComponents.components.length === 0) {
      this.log('ℹ️ No se especificaron componentes adicionales');
      return;
    }

    const componentsDir = path.join(this.layoutsDir, 'components');
    this.ensureDirectoryExists(componentsDir);

    const componentsPrompt = `
    # Tarea de Layout Agent
    
    Genera los siguientes componentes de layout para:
    
    "${spec}"
    
    Componentes a generar:
    ${layoutComponents.components.map((comp: string) => `- ${comp}`).join('\n')}
    
    Para cada componente, proporciona:
    1. Código React (TSX)
    2. Estilos (SCSS)
    3. Breve descripción de su propósito y uso
    
    Formato de respuesta para cada componente:
    
    ## Componente: [Nombre]
    
    [Descripción]
    
    \`\`\`tsx
    // Código React aquí
    \`\`\`
    
    \`\`\`scss
    // Código SCSS aquí
    \`\`\`
    `;

    try {
      const response = await this.ejecutarPrompt(contexto, componentsPrompt);
      const componentSections = response.split(/## Componente: /);

      for (let i = 1; i < componentSections.length; i++) {
        const section = componentSections[i];
        const nameMatch = section.match(/^([^\n]+)/);
        if (!nameMatch) continue;

        const componentName = nameMatch[1].trim();
        const sanitizedName = componentName.replace(/[^a-zA-Z0-9]/g, '');

        const descriptionMatch = section.match(/^[^\n]+\n\n([^`]+)/);
        const description = descriptionMatch ? descriptionMatch[1].trim() : '';

        const tsxMatch = section.match(/```tsx\n([\s\S]*?)\n```/);
        if (tsxMatch && tsxMatch[1]) {
          const tsxPath = path.join(componentsDir, `${sanitizedName}.tsx`);
          fs.writeFileSync(tsxPath, tsxMatch[1], 'utf-8');
          await this.guardarContexto(contexto, tsxPath);
        }

        const scssMatch = section.match(/```scss\n([\s\S]*?)\n```/);
        if (scssMatch && scssMatch[1]) {
          const scssPath = path.join(componentsDir, `${sanitizedName}.scss`);
          fs.writeFileSync(scssPath, scssMatch[1], 'utf-8');
          await this.guardarContexto(contexto, scssPath);
        }

        if (description) {
          const readmePath = path.join(componentsDir, `${sanitizedName}.md`);
          fs.writeFileSync(readmePath, `# ${componentName}\n\n${description}`, 'utf-8');
          await this.guardarContexto(contexto, readmePath);
        }
      }

      await this.generateComponentsIndex(contexto, componentsDir);

      this.log(`✅ Componentes de layout generados en: ${componentsDir}`);
    } catch (error) {
      await this.registrarActividad(contexto, 'error generando componentes', { error: (error as Error).message });
      this.log('⚠️ Continuando sin componentes adicionales');
    }
  }

  /**
   * Genera un índice para los componentes de layout
   * @param contexto Contexto del proyecto
   * @param componentsDir Directorio de componentes
   */
  private async generateComponentsIndex(contexto: ContextoProyecto, componentsDir: string): Promise<void> {
    await this.registrarActividad(contexto, 'generando índice de componentes', {});

    try {
      const files = fs.readdirSync(componentsDir)
        .filter(file => file.endsWith('.tsx'))
        .map(file => path.basename(file, '.tsx'));

      if (files.length === 0) {
        this.log('ℹ️ No se encontraron componentes para indexar');
        return;
      }

      const indexContent = `// Índice de componentes de layout
// Generado automáticamente por Layout Agent

${files.map(file => `import ${file} from './${file}';`).join('\n')}

export {
${files.map(file => `  ${file},`).join('\n')}
};
`;

      const indexPath = path.join(componentsDir, 'index.ts');
      fs.writeFileSync(indexPath, indexContent, 'utf-8');
      await this.guardarContexto(contexto, indexPath);

      this.log(`✅ Índice de componentes generado: ${indexPath}`);
    } catch (error) {
      await this.registrarActividad(contexto, 'error generando índice', { error: (error as Error).message });
      this.log('⚠️ Continuando sin índice');
    }
  }

  /**
   * Genera documentación completa del layout
   * @param contexto Contexto del proyecto
   * @param spec Especificación del layout
   * @param layoutComponents Componentes del layout
   */
  private async generateLayoutDocumentation(contexto: ContextoProyecto, spec: string, layoutComponents: any): Promise<void> {
    await this.registrarActividad(contexto, 'generando documentación del layout', { spec });

    const docsDir = path.join(this.projectRoot, 'docs', 'layout');
    this.ensureDirectoryExists(docsDir);

    const docsPrompt = `
    # Tarea de Layout Agent
    
    Genera documentación completa para el layout:
    
    "${spec}"
    
    Con los siguientes componentes:
    ${JSON.stringify(layoutComponents, null, 2)}
    
    La documentación debe incluir:
    1. Visión general del sistema de layout
    2. Estructura de navegación y flujo de usuario
    3. Componentes principales y su propósito
    4. Estrategia responsiva
    5. Guía de uso para desarrolladores
    6. Consideraciones de accesibilidad
    7. Mejores prácticas
    
    Formato: Markdown
    `;

    try {
      const response = await this.ejecutarPrompt(contexto, docsPrompt);

      const docsPath = path.join(docsDir, 'README.md');
      fs.writeFileSync(docsPath, response, 'utf-8');
      await this.guardarContexto(contexto, docsPath);

      await this.generateLayoutDiagram(contexto, spec, layoutComponents, docsDir);

      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        estado: 'documentación del layout generada',
        docs: { path: docsPath },
      });

      this.sendEvent(AgentEventType.RESOURCE_CREATED, {
        type: 'layout-documentation',
        path: docsPath,
        description: `Documentación del layout para: ${spec}`,
      });

      this.log(`✅ Documentación del layout generada: ${docsPath}`);
    } catch (error) {
      await this.registrarActividad(contexto, 'error generando documentación', { error: (error as Error).message });
      this.log('⚠️ Continuando sin documentación');
    }
  }

  /**
   * Genera un diagrama visual del layout
   * @param contexto Contexto del proyecto
   * @param spec Especificación del layout
   * @param layoutComponents Componentes del layout
   * @param docsDir Directorio de documentación
   */
  private async generateLayoutDiagram(contexto: ContextoProyecto, spec: string, layoutComponents: any, docsDir: string): Promise<void> {
    await this.registrarActividad(contexto, 'generando diagrama del layout', { spec });

    const diagramPrompt = `
    # Tarea de Layout Agent
    
    Genera un diagrama Mermaid que represente la estructura del layout:
    
    "${spec}"
    
    Con los siguientes componentes:
    ${JSON.stringify(layoutComponents, null, 2)}
    
    El diagrama debe mostrar:
    1. Jerarquía de componentes
    2. Relaciones entre componentes
    3. Flujo de navegación
    
    Formato de respuesta:
    \`\`\`mermaid
    graph TD
      A[Componente A] --> B[Componente B]
      A --> C[Componente C]
      B --> D[Componente D]
    \`\`\`
    
    Usa la sintaxis de Mermaid para diagramas de flujo.
    Responde SOLO con el código Mermaid, sin explicaciones adicionales.
    `;

    try {
      const response = await this.ejecutarPrompt(contexto, diagramPrompt);
      const mermaidMatch = response.match(/```mermaid\n([\s\S]*?)\n```/) || response.match(/graph [A-Z]{2}[\s\S]*/);
      if (!mermaidMatch) {
        throw new Error('No se pudo extraer el diagrama Mermaid de la respuesta del LLM');
      }
      const mermaidContent = mermaidMatch[1] || mermaidMatch[0];

      const diagramPath = path.join(docsDir, 'layout-diagram.md');
      fs.writeFileSync(diagramPath, `# Diagrama de Layout: ${spec}\n\n\`\`\`mermaid\n${mermaidContent}\n\`\`\``, 'utf-8');
      await this.guardarContexto(contexto, diagramPath);

      this.log(`✅ Diagrama del layout generado: ${diagramPath}`);
    } catch (error) {
      await this.registrarActividad(contexto, 'error generando diagrama', { error: (error as Error).message });
      this.log('⚠️ Continuando sin diagrama');
    }
  }

  /**
   * Exporta los recursos generados a formatos específicos
   * @param contexto Contexto del proyecto
   * @param format Formato de exportación ('pdf', 'png', etc.)
   */
  async exportResources(contexto: ContextoProyecto, format: string = 'png'): Promise<void> {
    await this.registrarActividad(contexto, `exportando recursos a formato ${format}`, {});

    try {
      if (format === 'png' && fs.existsSync(this.wireframesDir)) {
        const svgFiles = fs.readdirSync(this.wireframesDir)
          .filter(file => file.endsWith('.svg'));

        if (svgFiles.length > 0) {
          this.log(`🔄 Exportando ${svgFiles.length} wireframes a PNG...`);
          const exportDir = path.join(this.wireframesDir, 'exports');
          this.ensureDirectoryExists(exportDir);

          for (const svgFile of svgFiles) {
            const svgPath = path.join(this.wireframesDir, svgFile);
            const pngPath = path.join(exportDir, svgFile.replace('.svg', '.png'));
            await sharp(svgPath).png().toFile(pngPath);
            this.log(`✅ Exportado: ${pngPath}`);
          }

          await this.guardarContexto(contexto, exportDir);
        } else {
          this.log('ℹ️ No se encontraron wireframes SVG para exportar');
        }
      }

      if (format === 'pdf') {
        this.log('ℹ️ Exportación a PDF simulada (se requiere implementación real con puppeteer o similar)');
      }

      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        estado: `recursos exportados a ${format}`,
      });

      this.log(`✅ Exportación a ${format} completada`);
    } catch (error) {
      await this.registrarActividad(contexto, 'error exportando recursos', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Genera un prototipo interactivo basado en los wireframes
   * @param contexto Contexto del proyecto
   * @param spec Especificación del prototipo
   */
  async generatePrototype(contexto: ContextoProyecto, spec: string): Promise<void> {
    await this.registrarActividad(contexto, 'generando prototipo interactivo', { spec });

    const prototypeDir = path.join(this.projectRoot, 'prototype');
    this.ensureDirectoryExists(prototypeDir);

    const wireframeFiles = fs.existsSync(this.wireframesDir)
      ? fs.readdirSync(this.wireframesDir).filter(file => file.endsWith('.json'))
      : [];

    if (wireframeFiles.length === 0) {
      this.log('⚠️ No se encontraron wireframes para generar el prototipo', 'warning');
      return;
    }

    const navStructurePath = path.join(this.navigationDir, 'navigation-structure.json');
    let navigationStructure = null;
    if (fs.existsSync(navStructurePath)) {
      navigationStructure = JSON.parse(fs.readFileSync(navStructurePath, 'utf-8'));
    }

    const prototypePrompt = `
    # Tarea de Layout Agent
    
    Genera un prototipo interactivo HTML/CSS/JS basado en:
    
    "${spec}"
    
    Wireframes disponibles:
    ${wireframeFiles.map(file => `- ${file}`).join('\n')}
    
    ${navigationStructure ? `Estructura de navegación:\n${JSON.stringify(navigationStructure, null, 2)}` : ''}
    
    El prototipo debe incluir:
    1. Navegación entre pantallas
    2. Interacciones básicas (clicks, formularios)
    3. Transiciones y animaciones simples
    4. Responsive design
    
    Proporciona el código HTML, CSS y JavaScript necesario.
    `;

    try {
      const response = await this.ejecutarPrompt(contexto, prototypePrompt);

      const htmlMatch = response.match(/```html\n([\s\S]*?)\n```/);
      if (htmlMatch && htmlMatch[1]) {
        const htmlPath = path.join(prototypeDir, 'index.html');
        fs.writeFileSync(htmlPath, htmlMatch[1], 'utf-8');
        await this.guardarContexto(contexto, htmlPath);
      }

      const cssMatch = response.match(/```css\n([\s\S]*?)\n```/);
      if (cssMatch && cssMatch[1]) {
        const cssPath = path.join(prototypeDir, 'styles.css');
        fs.writeFileSync(cssPath, cssMatch[1], 'utf-8');
        await this.guardarContexto(contexto, cssPath);
      }

      const jsMatch = response.match(/```(?:js|javascript)\n([\s\S]*?)\n```/);
      if (jsMatch && jsMatch[1]) {
        const jsPath = path.join(prototypeDir, 'script.js');
        fs.writeFileSync(jsPath, jsMatch[1], 'utf-8');
        await this.guardarContexto(contexto, jsPath);
      }

      const readmePath = path.join(prototypeDir, 'README.md');
      fs.writeFileSync(readmePath, `# Prototipo Interactivo: ${spec}\n\n## Descripción\nPrototipo interactivo generado por Layout Agent.\n\n## Uso\nAbre el archivo index.html en un navegador para ver el prototipo.\n\n## Wireframes Utilizados\n${wireframeFiles.map(file => `- ${file}`).join('\n')}\n\n## Estructura de Navegación\n${navigationStructure ? JSON.stringify(navigationStructure, null, 2) : 'No disponible'}`, 'utf-8');
      await this.guardarContexto(contexto, readmePath);

      await this.memoryAgent.store(
        { prototype: { spec }, wireframes: wireframeFiles },
        { tipo: 'prototype', proyectoId: contexto.id }
      );

      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        estado: 'prototipo interactivo generado',
        prototype: { path: prototypeDir },
      });

      this.sendEvent(AgentEventType.RESOURCE_CREATED, {
        type: 'prototype',
        path: prototypeDir,
        description: `Prototipo interactivo para: ${spec}`,
      });

      this.log(`✅ Prototipo interactivo generado en: ${prototypeDir}`);
    } catch (error) {
      await this.registrarActividad(contexto, 'error generando prototipo', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Propone mejoras basadas en el historial de layouts
   * @param contexto Contexto del proyecto
   */
  async proponerMejora(contexto: ContextoProyecto): Promise<string | null> {
    const historial = await this.memoryAgent.buscar<{ layout: { name: string, spec: string }, responsive: boolean }>({ tipo: 'layout', proyectoId: contexto.id });
    if (historial.length < 2) return null;

    const layoutsResponsivos = historial.filter(entry => entry.responsive).length;
    if (layoutsResponsivos / historial.length > 0.8) {
      await this.registrarActividad(contexto, 'mejora propuesta', { accion: 'estandarizar layouts responsivos' });
      return 'Proponiendo estandarizar todos los layouts como responsivos';
    }

    const componentesFrecuentes = historial.reduce((acc, entry) => {
      const spec = entry.layout.spec.toLowerCase();
      if (spec.includes('sidebar')) acc['sidebar'] = (acc['sidebar'] || 0) + 1;
      if (spec.includes('header')) acc['header'] = (acc['header'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const componenteDominante = Object.entries(componentesFrecuentes).find(([, count]) => count > 2);
    if (componenteDominante) {
      const [componente] = componenteDominante;
      await this.registrarActividad(contexto, 'mejora propuesta', { accion: 'estandarizar componente', componente });
      return `Proponiendo estandarizar el componente ${componente} en todos los layouts`;
    }

    return null;
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
}

// Función auxiliar para mantener compatibilidad con código existente
export async function layoutAgent(contexto: ContextoProyecto, spec: string): Promise<string> {
  const agent = new LayoutAgent(contexto.userId);
  await agent.run(contexto, spec);
  return "Ejecutado con éxito";
}