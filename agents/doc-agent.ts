import { BaseAgent, AgentEventType } from './base-agent';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Doc Agent - Generador de documentación inteligente
 * 
 * Este agente es responsable de:
 * 1. Generar documentación técnica de alta calidad
 * 2. Documentar código fuente con análisis inteligente
 * 3. Crear diagramas y visualizaciones
 * 4. Mantener documentación actualizada
 * 5. Generar guías de usuario y desarrollador
 */
export class DocAgent extends BaseAgent {
  private docOutputPath: string = '';
  private projectStructure: any = {};
  private docFormat: string = 'markdown';
  private includeExamples: boolean = true;
  private includeDiagrams: boolean = true;
  private lastGeneratedDocs: Record<string, string> = {};
  
  constructor() {
    super('Doc Agent');
    this.registerEventHandlers();
  }
  
  /**
   * Registra manejadores de eventos para comunicación con otros agentes
   */
  private registerEventHandlers(): void {
    // Escuchar cuando se actualiza el código para regenerar documentación
    this.listenForEvent(AgentEventType.CODE_UPDATED, (message) => {
      this.log(`📝 Código actualizado en ${message.content.filePath}, regenerando documentación...`);
      
      if (message.content.filePath) {
        // Regenerar documentación solo para el archivo actualizado
        this.regenerateDocForFile(message.content.filePath);
      }
    });
    
    // Escuchar solicitudes de documentación
    this.listenForEvent(AgentEventType.DOC_REQUESTED, async (message) => {
      this.log(`📚 Solicitud de documentación recibida de ${message.from}`);
      
      try {
        let docContent = '';
        
        if (message.content.type === 'module') {
          // Generar documentación para un módulo específico
          docContent = await this.generateModuleDoc(message.content.path);
        } else if (message.content.type === 'file') {
          // Generar documentación para un archivo específico
          docContent = await this.generateFileDoc(message.content.path);
        } else if (message.content.type === 'api') {
          // Generar documentación de API
          docContent = await this.generateApiDoc(message.content.specs);
        }
        
        // Enviar respuesta al agente solicitante
        this.sendEvent(AgentEventType.DOC_RESPONSE, {
          content: docContent,
          format: this.docFormat,
          timestamp: new Date().toISOString()
        }, message.from);
      } catch (error) {
        this.log(`❌ Error generando documentación: ${error.message}`, 'error');
        
        // Enviar error al agente solicitante
        this.sendEvent(AgentEventType.DOC_RESPONSE, {
          error: error.message,
          timestamp: new Date().toISOString()
        }, message.from);
      }
    });
  }
  
  /**
   * Ejecuta el Doc Agent para generar documentación
   * @param spec Especificación de la documentación a generar
   */
  async run(spec: string): Promise<void> {
    this.log(`📚 Doc Agent generando documentación para: "${spec}"`);
    
    try {
      // Analizar la especificación
      const options = this.parseSpecification(spec);
      
      // Configurar opciones de documentación
      this.docFormat = options.format || 'markdown';
      this.includeExamples = options.includeExamples !== false;
      this.includeDiagrams = options.includeDiagrams !== false;
      
      // Determinar el path de salida
      this.docOutputPath = options.outputPath || path.join(process.cwd(), 'docs');
      
      // Crear directorio de salida si no existe
      if (!fs.existsSync(this.docOutputPath)) {
        fs.mkdirSync(this.docOutputPath, { recursive: true });
      }
      
      // Determinar el tipo de documentación a generar
      if (options.type === 'project') {
        await this.generateProjectDoc(options.path || process.cwd());
      } else if (options.type === 'module') {
        await this.generateModuleDoc(options.path);
      } else if (options.type === 'file') {
        await this.generateFileDoc(options.path);
      } else if (options.type === 'api') {
        await this.generateApiDoc(options.specs);
      } else {
        throw new Error(`Tipo de documentación no soportado: ${options.type}`);
      }
      
      this.log('✅ Documentación generada con éxito');
    } catch (error) {
      this.log('❌ Error generando documentación:', 'error');
      this.log(error.message, 'error');
      throw error;
    }
  }
  
  /**
   * Analiza la especificación para extraer opciones
   * @param spec Especificación de la documentación
   */
  private parseSpecification(spec: string): DocOptions {
    this.log('🔍 Analizando especificación de documentación...');
    
    // Valores por defecto
    const options: DocOptions = {
      type: 'module',
      format: 'markdown',
      includeExamples: true,
      includeDiagrams: true
    };
    
    // Si la especificación es un path simple, asumimos que es un módulo
    if (!spec.includes(':') && !spec.includes('=')) {
      options.path = spec;
      return options;
    }
    
    // Analizar opciones en formato clave=valor o clave:valor
    const parts = spec.split(/[,;]/);
    
    for (const part of parts) {
      const [key, value] = part.split(/[:=]/).map(s => s.trim());
      
      switch (key.toLowerCase()) {
        case 'type':
        case 'tipo':
          options.type = value as DocType;
          break;
        case 'path':
        case 'ruta':
          options.path = value;
          break;
        case 'format':
        case 'formato':
          options.format = value;
          break;
        case 'output':
        case 'salida':
          options.outputPath = value;
          break;
        case 'examples':
        case 'ejemplos':
          options.includeExamples = value.toLowerCase() === 'true';
          break;
        case 'diagrams':
        case 'diagramas':
          options.includeDiagrams = value.toLowerCase() === 'true';
          break;
      }
    }
    
    return options;
  }
  
  /**
   * Genera documentación para un proyecto completo
   * @param projectPath Ruta al proyecto
   */
  private async generateProjectDoc(projectPath: string): Promise<void> {
    this.log(`📂 Generando documentación para el proyecto en: ${projectPath}`);
    
    // Analizar la estructura del proyecto
    this.projectStructure = this.analyzeProjectStructure(projectPath);
    
    // Generar índice de documentación
    const indexPath = path.join(this.docOutputPath, 'index.md');
    const indexContent = await this.generateProjectIndex();
    fs.writeFileSync(indexPath, indexContent, 'utf-8');
    
    this.log(`✅ Índice de documentación generado en: ${indexPath}`);
    
    // Generar documentación para cada módulo
    for (const modulePath of this.projectStructure.modules) {
      await this.generateModuleDoc(modulePath, true);
    }
    
    // Generar diagrama de arquitectura si está habilitado
    if (this.includeDiagrams) {
      await this.generateArchitectureDiagram();
    }
    
    // Generar documentación de API si existe
    if (fs.existsSync(path.join(projectPath, 'api')) || 
        fs.existsSync(path.join(projectPath, 'src', 'api'))) {
      await this.generateApiDoc();
    }
    
    // Generar guía de usuario si está habilitado
    await this.generateUserGuide();
    
    // Generar guía de desarrollador si está habilitado
    await this.generateDeveloperGuide();
  }
  
  /**
   * Analiza la estructura del proyecto
   * @param projectPath Ruta al proyecto
   */
  private analyzeProjectStructure(projectPath: string): any {
    this.log('🔍 Analizando estructura del proyecto...');
    
    const structure: any = {
      modules: [],
      components: [],
      services: [],
      utils: [],
      tests: []
    };
    
    // Función recursiva para explorar directorios
    const exploreDir = (dirPath: string, isRoot: boolean = false) => {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        // Ignorar node_modules y directorios ocultos
        if (item.name === 'node_modules' || item.name.startsWith('.')) {
          continue;
        }
        
        if (item.isDirectory()) {
          // Categorizar directorios
          if (item.name === 'components' || item.name === 'Components') {
            structure.components.push(itemPath);
          } else if (item.name === 'services' || item.name === 'Services') {
            structure.services.push(itemPath);
          } else if (item.name === 'utils' || item.name === 'Utils' || item.name === 'helpers') {
            structure.utils.push(itemPath);
          } else if (item.name === 'tests' || item.name === 'Tests' || item.name === '__tests__') {
            structure.tests.push(itemPath);
          } else if (isRoot || item.name === 'src' || item.name === 'lib' || item.name === 'app') {
            // Considerar como módulo principal o explorar más profundo
            if (this.hasTypeScriptFiles(itemPath)) {
              structure.modules.push(itemPath);
            }
            exploreDir(itemPath);
          } else {
            // Otros directorios con archivos TypeScript se consideran módulos
            if (this.hasTypeScriptFiles(itemPath)) {
              structure.modules.push(itemPath);
            }
            exploreDir(itemPath);
          }
        }
      }
    };
    
    // Comenzar exploración
    exploreDir(projectPath, true);
    
    return structure;
  }
  
  /**
   * Verifica si un directorio contiene archivos TypeScript
   * @param dirPath Ruta al directorio
   */
  private hasTypeScriptFiles(dirPath: string): boolean {
    try {
      const files = fs.readdirSync(dirPath);
      return files.some(file => file.endsWith('.ts') || file.endsWith('.tsx'));
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Genera un índice de documentación para el proyecto
   */
  private async generateProjectIndex(): Promise<string> {
    this.log('📑 Generando índice de documentación del proyecto...');
    
    // Obtener información del package.json si existe
    let projectName = 'Proyecto';
    let projectDescription = 'Documentación del proyecto';
    
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        projectName = packageJson.name || projectName;
        projectDescription = packageJson.description || projectDescription;
      } catch (error) {
        this.log('⚠️ Error leyendo package.json', 'warning');
      }
    }
    
    // Crear prompt para el LLM
    const indexPrompt = `
    # Tarea de Generación de Índice
    
    Genera un índice de documentación para el siguiente proyecto:
    
    Nombre: ${projectName}
    Descripción: ${projectDescription}
    
    Estructura del proyecto:
    - Módulos: ${this.projectStructure.modules.length}
    - Componentes: ${this.projectStructure.components.length}
    - Servicios: ${this.projectStructure.services.length}
    - Utilidades: ${this.projectStructure.utils.length}
    - Tests: ${this.projectStructure.tests.length}
    
    El índice debe incluir:
    1. Título y descripción del proyecto
    2. Tabla de contenidos
    3. Visión general de la arquitectura
    4. Enlaces a las secciones principales de la documentación
    5. Guía rápida de inicio
    
    Formatea tu respuesta en Markdown.
    `;
    
    // En modo real, consultar al LLM
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      return await this.queryLLM(indexPrompt);
    } else {
      // Modo simulación
      return `# ${projectName}

## Documentación del Proyecto

${projectDescription}

## Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Arquitectura](#arquitectura)
3. [Módulos](#módulos)
4. [Componentes](#componentes)
5. [Servicios](#servicios)
6. [Utilidades](#utilidades)
7. [Guía de Usuario](#guía-de-usuario)
8. [Guía de Desarrollador](#guía-de-desarrollador)
9. [API Reference](#api-reference)

## Visión General

Este proyecto contiene:
- ${this.projectStructure.modules.length} módulos principales
- ${this.projectStructure.components.length} componentes
- ${this.projectStructure.services.length} servicios
- ${this.projectStructure.utils.length} utilidades
- ${this.projectStructure.tests.length} tests

## Guía Rápida

Para comenzar a trabajar con este proyecto, consulta la [Guía de Desarrollador](./developer-guide.md).

> ⚠️ Documentación generada automáticamente por Doc Agent.
`;
    }
  }
  
  /**
   * Genera documentación para un módulo específico
   * @param modulePath Ruta al módulo
   * @param isPartOfProject Indica si es parte de la documentación de proyecto
   */
  private async generateModuleDoc(modulePath: string, isPartOfProject: boolean = false): Promise<string> {
    this.log(`📘 Generando documentación para el módulo: ${modulePath}`);
    
    // Verificar que el path existe
    const fullPath = path.resolve(modulePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`El path ${fullPath} no existe`);
    }
    
    // Obtener archivos TypeScript del módulo
    const files = this.getModuleFiles(fullPath);
    if (files.length === 0) {
      this.log("⚠️ No se encontraron archivos .ts/.tsx en el módulo", 'warning');
      return '';
    }
    
    // Determinar nombre del módulo
    const moduleName = path.basename(fullPath);
    
    // Generar documentación para cada archivo
    const fileDocsPromises = files.map(async file => {
      const content = fs.readFileSync(file, "utf-8");
      const fileName = path.basename(file);
      const doc = await this.generateDocFromCode(content, fileName);
      
      // Guardar en caché para futuras referencias
      this.lastGeneratedDocs[file] = doc;
      
      return doc;
    });
    
    // Esperar a que todas las promesas se resuelvan
    const fileDocs = await Promise.all(fileDocsPromises);
    
    // Generar índice del módulo
    const moduleIndexPrompt = `
    # Tarea de Documentación de Módulo
    
    Genera un índice de documentación para el siguiente módulo:
    
    Nombre del módulo: ${moduleName}
    Archivos en el módulo: ${files.map(f => path.basename(f)).join(', ')}
    
    El índice debe incluir:
    1. Título y descripción del módulo
    2. Propósito principal
    3. Componentes/clases principales
    4. Dependencias
    5. Ejemplos de uso (si aplica)
    
    Formatea tu respuesta en Markdown.
    `;
    
    let moduleIndex = '';
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      moduleIndex = await this.queryLLM(moduleIndexPrompt);
    } else {
      moduleIndex = `# Módulo: ${moduleName}

## Descripción
Este módulo contiene ${files.length} archivos y proporciona funcionalidades clave para el proyecto.

## Archivos Principales
${files.map(f => `- [${path.basename(f)}](#${path.basename(f).toLowerCase().replace('.', '-')})`).join('\n')}

## Dependencias
Este módulo interactúa con otros componentes del sistema.

> ⚠️ Documentación generada automáticamente por Doc Agent.
`;
    }
    
    // Combinar todo el contenido
    const allDocs = [
      moduleIndex,
      ...fileDocs
    ].join("\n\n---\n\n");
    
    // Determinar ruta de salida
    const outputFileName = `${moduleName.toLowerCase()}.md`;
    const outputPath = isPartOfProject 
      ? path.join(this.docOutputPath, outputFileName)
      : path.join(fullPath, "README.generated.md");
    
    // Escribir la documentación generada
    fs.writeFileSync(outputPath, allDocs, "utf-8");
    this.log(`✅ Documentación del módulo generada en: ${outputPath}`);
    
    return allDocs;
  }
  
  /**
   * Genera documentación para un archivo específico
   * @param filePath Ruta al archivo
   */
  private async generateFileDoc(filePath: string): Promise<string> {
    this.log(`📄 Generando documentación para el archivo: ${filePath}`);
    
    // Verificar que el archivo existe
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`El archivo ${fullPath} no existe`);
    }
    
    // Verificar que es un archivo TypeScript
    if (!fullPath.endsWith('.ts') && !fullPath.endsWith('.tsx')) {
      throw new Error(`El archivo ${fullPath} no es un archivo TypeScript`);
    }
    
    // Leer contenido del archivo
    const content = fs.readFileSync(fullPath, "utf-8");
    const fileName = path.basename(fullPath);
    
    // Generar documentación
    const doc = await this.generateDocFromCode(content, fileName);
    
    // Guardar en caché para futuras referencias
    this.lastGeneratedDocs[fullPath] = doc;
    
    // Determinar ruta de salida
    const outputPath = path.join(
      path.dirname(fullPath),
      `${path.basename(fullPath, path.extname(fullPath))}.doc.md`
    );
    
    // Escribir la documentación generada
    fs.writeFileSync(outputPath, doc, "utf-8");
    this.log(`✅ Documentación del archivo generada en: ${outputPath}`);
    
    return doc;
  }
  
  /**
   * Regenera la documentación para un archivo específico
   * @param filePath Ruta al archivo
   */
  private async regenerateDocForFile(filePath: string): Promise<void> {
    this.log(`🔄 Regenerando documentación para: ${filePath}`);
    
    try {
      await this.generateFileDoc(filePath);
      
      // Si el archivo es parte de un módulo documentado, regenerar la documentación del módulo
      const modulePath = path.dirname(filePath);
      if (this.projectStructure.modules && this.projectStructure.modules.includes(modulePath)) {
        await this.generateModuleDoc(modulePath, true);
      }
      
      this.log(`✅ Documentación regenerada para: ${filePath}`);
    } catch (error) {
      this.log(`❌ Error regenerando documentación: ${error.message}`, 'error');
    }
  }
  
  /**
   * Genera documentación de API
   * @param apiSpecs Especificaciones de API (opcional)
   */
  private async generateApiDoc(apiSpecs?: any): Promise<string> {
    this.log('📡 Generando documentación de API...');
    
    let specs = apiSpecs;
    
    // Si no se proporcionaron especificaciones, intentar obtenerlas
    if (!specs) {
      // Intentar obtener especificaciones del API Agent
      try {
        this.sendEvent(AgentEventType.API_SPECS_REQUESTED, {
          requestedBy: 'doc',
          timestamp: new Date().toISOString()
        }, 'api');
        
        // En un caso real, esperaríamos la respuesta
        // Aquí simulamos especificaciones básicas
        specs = [
          {
            path: '/api/users',
            method: 'GET',
            description: 'Obtiene la lista de usuarios',
            parameters: [],
            responses: {
              '200': { description: 'Lista de usuarios obtenida con éxito' }
            }
          },
          {
            path: '/api/users/{id}',
            method: 'GET',
            description: 'Obtiene un usuario por ID',
            parameters: [
              { name: 'id', in: 'path', required: true, type: 'string' }
            ],
            responses: {
              '200': { description: 'Usuario obtenido con éxito' },
              '404': { description: 'Usuario no encontrado' }
            }
          }
        ];
      } catch (error) {
        this.log('⚠️ No se pudieron obtener especificaciones de API', 'warning');
        specs = [];
      }
    }
    
    // Crear prompt para el LLM
    const apiDocPrompt = `
    # Tarea de Documentación de API
    
    Genera documentación completa para la siguiente API:
    
    ${JSON.stringify(specs, null, 2)}
    
    La documentación debe incluir:
    1. Introducción a la API
    2. Autenticación y autorización
    3. Endpoints disponibles
    4. Parámetros y tipos de datos
    5. Ejemplos de solicitudes y respuestas
    6. Códigos de estado y manejo de errores
    7. Limitaciones y consideraciones
    
    Formatea tu respuesta en Markdown.
    `;
    
    let apiDoc = '';
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      apiDoc = await this.queryLLM(apiDocPrompt);
    } else {
      // Modo simulación
      apiDoc = `# Documentación de API

## Introducción
Esta API proporciona acceso a los recursos del sistema a través de endpoints RESTful.

## Endpoints

### GET /api/users
Obtiene la lista de usuarios.

**Respuestas:**
- \`200\`: Lista de usuarios obtenida con éxito

### GET /api/users/{id}
Obtiene un usuario por ID.

**Parámetros:**
- \`id\` (path, requerido): ID del usuario

**Respuestas:**
- \`200\`: Usuario obtenido con éxito
- \`404\`: Usuario no encontrado

## Autenticación
La API utiliza autenticación basada en tokens JWT.

> ⚠️ Documentación generada automáticamente por Doc Agent.
`;
    }
    
    // Guardar documentación de API
    const apiDocPath = path.join(this.docOutputPath, 'api-reference.md');
    fs.writeFileSync(apiDocPath, apiDoc, 'utf-8');
    
    this.log(`✅ Documentación de API generada en: ${apiDocPath}`);
    
    return apiDoc;
  }
  
  /**
   * Genera un diagrama de arquitectura
   */
  private async generateArchitectureDiagram(): Promise<void> {
    this.log('📊 Generando diagrama de arquitectura...');
    
    // Crear prompt para el LLM
    const diagramPrompt = `
    # Tarea de Generación de Diagrama
    
    Basado en la siguiente estructura de proyecto:
    
    Módulos: ${this.projectStructure.modules.map(m => path.basename(m)).join(', ')}
    Componentes: ${this.projectStructure.components.map(c => path.basename(c)).join(', ')}
    Servicios: ${this.projectStructure.services.map(s => path.basename(s)).join(', ')}
    Utilidades: ${this.projectStructure.utils.map(u => path.basename(u)).join(', ')}
    
    Genera un diagrama de arquitectura en formato Mermaid que muestre:
    1. Componentes principales
    2. Relaciones entre componentes
    3. Flujo de datos
    
    El diagrama debe ser claro y mostrar la estructura general del proyecto.
    `;
    
    try {
      let mermaidCode = '';
      
      if (process.env.DEVMIND_REAL_MODE === 'true') {
        const response = await this.queryLLM(diagramPrompt);
        
        // Extraer código Mermaid
        const mermaidMatch = response.match(/```mermaid\n([\s\S]*?)\n```/);
        if (mermaidMatch) {
          mermaidCode = mermaidMatch[1];
        } else {
          throw new Error('No se pudo extraer el código Mermaid');
        }
      } else {
        // Modo simulación
        mermaidCode = `
graph TD
    A[Frontend] --> B[API Services]
    B --> C[Backend]
    C --> D[Database]
    B --> E[External APIs]
    F[Utils] --> A
    F --> B
    F --> C
    G[Components] --> A
        `;
      }
      
      // Guardar código Mermaid
      const mermaidPath = path.join(this.docOutputPath, 'architecture.mmd');
      fs.writeFileSync(mermaidPath, mermaidCode.trim(), 'utf-8');
      
      // Guardar diagrama en Markdown
      const diagramMdPath = path.join(this.docOutputPath, 'architecture-diagram.md');
      fs.writeFileSync(diagramMdPath, `# Diagrama de Arquitectura\n\n\`\`\`mermaid\n${mermaidCode.trim()}\n\`\`\``, 'utf-8');
      
      this.log(`✅ Diagrama de arquitectura generado en: ${diagramMdPath}`);
      
      // Intentar generar imagen si hay herramientas disponibles
      this.generateDiagramImage(mermaidPath);
    } catch (error) {
      this.log(`⚠️ Error generando diagrama: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Genera una imagen a partir de un archivo Mermaid
   * @param mermaidPath Ruta al archivo Mermaid
   */
  private generateDiagramImage(mermaidPath: string): void {
    try {
      // Verificar si mmdc (Mermaid CLI) está disponible
      execSync('mmdc --version', { stdio: 'ignore' });
      
      // Generar imagen PNG
      const pngPath = mermaidPath.replace('.mmd', '.png');
      execSync(`mmdc -i "${mermaidPath}" -o "${pngPath}"`, { stdio: 'ignore' });
      
      this.log(`✅ Imagen del diagrama generada en: ${pngPath}`);
    } catch (error) {
      this.log('⚠️ Mermaid CLI no disponible, no se generó imagen', 'warning');
    }
  }
  
  /**
   * Genera una guía de usuario
   */
  private async generateUserGuide(): Promise<void> {
    this.log('📖 Generando guía de usuario...');
    
    // Crear prompt para el LLM
    const userGuidePrompt = `
    # Tarea de Generación de Guía de Usuario
    
    Genera una guía de usuario completa para el proyecto con la siguiente estructura:
    
    Módulos: ${this.projectStructure.modules.map(m => path.basename(m)).join(', ')}
    Componentes: ${this.projectStructure.components.map(c => path.basename(c)).join(', ')}
    Servicios: ${this.projectStructure.services.map(s => path.basename(s)).join(', ')}
    
    La guía debe incluir:
    1. Introducción y propósito
    2. Requisitos del sistema
    3. Instalación y configuración
    4. Primeros pasos
    5. Funcionalidades principales
    6. Preguntas frecuentes
    7. Solución de problemas
    
    Formatea tu respuesta en Markdown.
    `;
    
    try {
      let userGuide = '';
      
      if (process.env.DEVMIND_REAL_MODE === 'true') {
        userGuide = await this.queryLLM(userGuidePrompt);
      } else {
        // Modo simulación
        userGuide = `# Guía de Usuario

## Introducción
Esta guía proporciona información sobre cómo utilizar el sistema.

## Requisitos del Sistema
- Node.js 14 o superior
- Navegador moderno (Chrome, Firefox, Edge)
- Conexión a Internet

## Instalación
1. Clone el repositorio
2. Ejecute \`npm install\`
3. Configure las variables de entorno
4. Ejecute \`npm start\`

## Primeros Pasos
Siga estos pasos para comenzar a utilizar el sistema...

## Funcionalidades Principales
- Gestión de usuarios
- Procesamiento de datos
- Generación de informes

## Preguntas Frecuentes
**P: ¿Cómo puedo restablecer mi contraseña?**
R: Utilice la opción "Olvidé mi contraseña" en la pantalla de inicio de sesión.

## Solución de Problemas
Si encuentra algún problema, consulte esta sección para obtener ayuda.

> ⚠
    // Guardar documentación de usuario
    const userGuidePath = path.join(this.docOutputPath, 'user-guide.md');
    fs.writeFileSync(userGuidePath, userGuide, 'utf-8');
    
    this.log(`✅ Guía de usuario generada en: ${userGuidePath}`);
    } catch (error) {
      this.log(`⚠️ Error generando guía de usuario: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Genera una guía de desarrollador
   */
  private async generateDeveloperGuide(): Promise<void> {
    this.log('🛠️ Generando guía de desarrollador...');
    
    // Crear prompt para el LLM
    const devGuidePrompt = `
    # Tarea de Generación de Guía de Desarrollador
    
    Genera una guía de desarrollador completa para el proyecto con la siguiente estructura:
    
    Módulos: ${this.projectStructure.modules.map(m => path.basename(m)).join(', ')}
    Componentes: ${this.projectStructure.components.map(c => path.basename(c)).join(', ')}
    Servicios: ${this.projectStructure.services.map(s => path.basename(s)).join(', ')}
    
    La guía debe incluir:
    1. Configuración del entorno de desarrollo
    2. Arquitectura del proyecto
    3. Convenciones de código
    4. Flujo de trabajo de desarrollo
    5. Pruebas y calidad
    6. Despliegue
    7. Contribución al proyecto
    
    Formatea tu respuesta en Markdown.
    `;
    
    try {
      let devGuide = '';
      
      if (process.env.DEVMIND_REAL_MODE === 'true') {
        devGuide = await this.queryLLM(devGuidePrompt);
      } else {
        // Modo simulación
        devGuide = `# Guía de Desarrollador

## Configuración del Entorno
Para configurar el entorno de desarrollo:

1. Instalar Node.js (v14+)
2. Clonar el repositorio: \`git clone [url-repositorio]\`
3. Instalar dependencias: \`npm install\`
4. Configurar variables de entorno: Copiar \`.env.example\` a \`.env\`

## Arquitectura
El proyecto sigue una arquitectura modular con los siguientes componentes:

- **Frontend**: Interfaz de usuario
- **Backend**: API y lógica de negocio
- **Base de datos**: Almacenamiento persistente

## Convenciones de Código
- Usar TypeScript para todo el código
- Seguir el estilo de código definido en ESLint
- Documentar todas las funciones y clases
- Escribir pruebas unitarias para la lógica crítica

## Flujo de Trabajo
1. Crear una rama para cada característica
2. Desarrollar y probar localmente
3. Enviar un Pull Request
4. Revisión de código
5. Integración continua
6. Despliegue

## Pruebas
- Pruebas unitarias: \`npm test\`
- Pruebas de integración: \`npm run test:integration\`
- Cobertura de código: \`npm run test:coverage\`

## Despliegue
El proyecto se despliega automáticamente mediante CI/CD.

> ⚠️ Documentación generada automáticamente por Doc Agent.
`;
      }
      
      // Guardar guía de desarrollador
      const devGuidePath = path.join(this.docOutputPath, 'developer-guide.md');
      fs.writeFileSync(devGuidePath, devGuide, 'utf-8');
      
      this.log(`✅ Guía de desarrollador generada en: ${devGuidePath}`);
    } catch (error) {
      this.log(`⚠️ Error generando guía de desarrollador: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Obtiene los archivos TypeScript de un módulo
   * @param modulePath Ruta al módulo
   */
  private getModuleFiles(modulePath: string): string[] {
    this.log(`🔍 Obteniendo archivos TypeScript del módulo: ${modulePath}`);
    
    const files: string[] = [];
    
    // Función recursiva para explorar directorios
    const exploreDir = (dirPath: string) => {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item.name);
        
        // Ignorar node_modules y directorios ocultos
        if (item.name === 'node_modules' || item.name.startsWith('.')) {
          continue;
        }
        
        if (item.isDirectory()) {
          // Explorar subdirectorios
          exploreDir(itemPath);
        } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
          // Agregar archivos TypeScript
          files.push(itemPath);
        }
      }
    };
    
    // Comenzar exploración
    exploreDir(modulePath);
    
    return files;
  }
  
  /**
   * Genera documentación a partir del código fuente
   * @param code Código fuente
   * @param fileName Nombre del archivo
   */
  private async generateDocFromCode(code: string, fileName: string): Promise<string> {
    this.log(`📝 Generando documentación para el código de: ${fileName}`);
    
    // Crear prompt para el LLM
    const codeDocPrompt = `
    # Tarea de Documentación de Código
    
    Analiza el siguiente código TypeScript y genera documentación detallada:
    
    Archivo: ${fileName}
    
    \`\`\`typescript
    ${code}
    \`\`\`
    
    La documentación debe incluir:
    1. Descripción general del archivo
    2. Clases, interfaces y tipos definidos
    3. Funciones y métodos importantes
    4. Parámetros y tipos de retorno
    5. Ejemplos de uso (si es posible inferirlos)
    6. Dependencias y relaciones con otros módulos
    
    Formatea tu respuesta en Markdown.
    `;
    
    // En modo real, consultar al LLM
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      return await this.queryLLM(codeDocPrompt);
    } else {
      // Modo simulación - generar documentación básica
      
      // Extraer nombre de clase o función principal
      const classMatch = code.match(/class\s+(\w+)/);
      const functionMatch = code.match(/function\s+(\w+)/);
      const exportMatch = code.match(/export\s+(const|let|var|function|class)\s+(\w+)/);
      
      let mainEntity = '';
      if (classMatch) {
        mainEntity = `Clase \`${classMatch[1]}\``;
      } else if (functionMatch) {
        mainEntity = `Función \`${functionMatch[1]}\``;
      } else if (exportMatch) {
        mainEntity = `${exportMatch[1] === 'class' ? 'Clase' : 'Función/Variable'} \`${exportMatch[2]}\``;
      } else {
        mainEntity = 'Módulo';
      }
      
      // Contar líneas para estimar complejidad
      const lineCount = code.split('\n').length;
      const complexity = lineCount < 50 ? 'baja' : lineCount < 200 ? 'media' : 'alta';
      
      // Detectar importaciones
      const imports = code.match(/import\s+.*?from\s+['"](.+?)['"]/g) || [];
      const dependencies = imports.map(imp => {
        const match = imp.match(/from\s+['"](.+?)['"]/);
        return match ? match[1] : '';
      }).filter(Boolean);
      
      return `# ${fileName}

## Descripción General
Este archivo contiene ${mainEntity} con una complejidad ${complexity}.

## Contenido Principal
${mainEntity} implementa funcionalidades específicas para el proyecto.

${dependencies.length > 0 ? `
## Dependencias
Este archivo depende de:
${dependencies.map(dep => `- \`${dep}\``).join('\n')}
` : ''}

## Detalles de Implementación
El archivo tiene aproximadamente ${lineCount} líneas de código y define estructuras clave para el sistema.

> ⚠️ Documentación generada automáticamente por Doc Agent.
`;
    }
  }
  
  /**
   * Genera un resumen de la documentación
   */
  private async generateDocSummary(): Promise<void> {
    this.log('📋 Generando resumen de documentación...');
    
    // Crear prompt para el LLM
    const summaryPrompt = `
    # Tarea de Generación de Resumen
    
    Genera un resumen ejecutivo de la documentación generada para el proyecto con la siguiente estructura:
    
    Módulos: ${this.projectStructure.modules.length}
    Componentes: ${this.projectStructure.components.length}
    Servicios: ${this.projectStructure.services.length}
    Utilidades: ${this.projectStructure.utils.length}
    
    El resumen debe incluir:
    1. Visión general del proyecto
    2. Puntos clave de la arquitectura
    3. Componentes principales
    4. Recomendaciones para desarrolladores
    
    Formatea tu respuesta en Markdown.
    `;
    
    try {
      let summary = '';
      
      if (process.env.DEVMIND_REAL_MODE === 'true') {
        summary = await this.queryLLM(summaryPrompt);
      } else {
        // Modo simulación
        summary = `# Resumen Ejecutivo de Documentación

## Visión General
Este proyecto está compuesto por ${this.projectStructure.modules.length} módulos principales, ${this.projectStructure.components.length} componentes, ${this.projectStructure.services.length} servicios y ${this.projectStructure.utils.length} utilidades.

## Arquitectura
La arquitectura sigue un patrón modular con separación clara de responsabilidades.

## Componentes Principales
- **Módulos Core**: Implementan la lógica de negocio central
- **Componentes UI**: Proporcionan la interfaz de usuario
- **Servicios**: Gestionan la comunicación con APIs y recursos externos
- **Utilidades**: Ofrecen funciones auxiliares reutilizables

## Recomendaciones
- Revisar la guía de desarrollador para configurar el entorno
- Seguir las convenciones de código establecidas
- Consultar la documentación de API para integraciones

> ⚠️ Documentación generada automáticamente por Doc Agent.
`;
      }
      
      // Guardar resumen
      const summaryPath = path.join(this.docOutputPath, 'summary.md');
      fs.writeFileSync(summaryPath, summary, 'utf-8');
      
      this.log(`✅ Resumen de documentación generado en: ${summaryPath}`);
    } catch (error) {
      this.log(`⚠️ Error generando resumen: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Genera un glosario de términos técnicos
   */
  private async generateGlossary(): Promise<void> {
    this.log('📔 Generando glosario de términos técnicos...');
    
    // Crear prompt para el LLM
    const glossaryPrompt = `
    # Tarea de Generación de Glosario
    
    Genera un glosario de términos técnicos relevantes para el proyecto con la siguiente estructura:
    
    Módulos: ${this.projectStructure.modules.map(m => path.basename(m)).join(', ')}
    
    El glosario debe incluir:
    1. Términos técnicos específicos del dominio
    2. Acrónimos y abreviaturas
    3. Conceptos clave de la arquitectura
    4. Patrones de diseño utilizados
    
    Formatea tu respuesta en Markdown con términos ordenados alfabéticamente.
    `;
    
    try {
      let glossary = '';
      
      if (process.env.DEVMIND_REAL_MODE === 'true') {
        glossary = await this.queryLLM(glossaryPrompt);
      } else {
        // Modo simulación
        glossary = `# Glosario de Términos Técnicos

## A
- **API**: Interfaz de Programación de Aplicaciones
- **Arquitectura**: Estructura organizativa del sistema

## C
- **Componente**: Unidad modular y reutilizable
- **CI/CD**: Integración Continua / Despliegue Continuo

## D
- **Dependencia**: Módulo requerido por otro módulo
- **DOM**: Document Object Model

## F
- **Framework**: Marco de trabajo que proporciona estructura

## I
- **Interfaz**: Contrato que define métodos y propiedades

## M
- **Middleware**: Software que actúa como puente entre sistemas
- **MVC**: Modelo-Vista-Controlador (patrón de diseño)

## R
- **REST**: Transferencia de Estado Representacional
- **Repositorio**: Patrón para abstraer el acceso a datos

## S
- **Servicio**: Componente que encapsula lógica de negocio
- **SPA**: Aplicación de Página Única

## T
- **TypeScript**: Superconjunto tipado de JavaScript

> ⚠️ Glosario generado automáticamente por Doc Agent.
`;
      }
      
      // Guardar glosario
      const glossaryPath = path.join(this.docOutputPath, 'glossary.md');
      fs.writeFileSync(glossaryPath, glossary, 'utf-8');
      
      this.log(`✅ Glosario generado en: ${glossaryPath}`);
    } catch (error) {
      this.log(`⚠️ Error generando glosario: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Genera un índice de búsqueda para la documentación
   */
  private async generateSearchIndex(): Promise<void> {
    this.log('🔍 Generando índice de búsqueda para la documentación...');
    
    try {
      // Recopilar todos los archivos de documentación
      const docFiles: string[] = [];
      
      const exploreDir = (dirPath: string) => {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item.name);
          
          if (item.isDirectory()) {
            exploreDir(itemPath);
          } else if (item.isFile() && item.name.endsWith('.md')) {
            docFiles.push(itemPath);
          }
        }
      };
      
      exploreDir(this.docOutputPath);
      
      // Crear índice de búsqueda
      const searchIndex: any = {
        version: '1.0',
        created: new Date().toISOString(),
        documents: []
      };
      
      // Procesar cada archivo
      for (const filePath of docFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const relativePath = path.relative(this.docOutputPath, filePath);
        
        // Extraer título
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');
        
        // Extraer encabezados
        const headings: string[] = [];
        const headingMatches = content.matchAll(/^(##|###)\s+(.+)$/gm);
        
        for (const match of headingMatches) {
          headings.push(match[2]);
        }
        
        // Añadir al índice
        searchIndex.documents.push({
          path: relativePath,
          title,
          headings,
          content: content.substring(0, 1000) // Primeros 1000 caracteres para resumen
        });
      }
      
      // Guardar índice
      const indexPath = path.join(this.docOutputPath, 'search-index.json');
      fs.writeFileSync(indexPath, JSON.stringify(searchIndex, null, 2), 'utf-8');
      
      this.log(`✅ Índice de búsqueda generado en: ${indexPath}`);
    } catch (error) {
      this.log(`⚠️ Error generando índice de búsqueda: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Genera un sitio web de documentación
   */
  private async generateDocSite(): Promise<void> {
    this.log('🌐 Generando sitio web de documentación...');
    
    try {
      // Crear directorio para el sitio
      const sitePath = path.join(this.docOutputPath, 'site');
      if (!fs.existsSync(sitePath)) {
        fs.mkdirSync(sitePath, { recursive: true });
      }
      
      // Crear archivo HTML básico
      const indexHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documentación del Proyecto</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { background: #f4f4f4; padding: 20px; margin-bottom: 20px; }
    nav { background: #333; color: white; padding: 10px; }
    nav a { color: white; margin-right: 15px; text-decoration: none; }
    main { display: flex; }
    .sidebar { width: 250px; padding-right: 20px; }
    .content { flex: 1; }
    footer { background: #f4f4f4; padding: 20px; margin-top: 20px; text-align: center; }
    h1, h2, h3 { color: #444; }
    a { color: #0066cc; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    code { font-family: monospace; background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>Documentación del Proyecto</h1>
      <p>Generada automáticamente por Doc Agent</p>
    </div>
  </header>
  
  <nav>
    <div class="container">
      <a href="index.html">Inicio</a>
      <a href="modules.html">Módulos</a>
      <a href="api-reference.html">API</a>
      <a href="user-guide.html">Guía de Usuario</a>
      <a href="developer-guide.html">Guía de Desarrollador</a>
    </div>
  </nav>
  
  <div class="container">
    <main>
      <div class="sidebar">
        <h3>Navegación</h3>
        <ul>
          <li><a href="index.html">Inicio</a></li>
          <li><a href="modules.html">Módulos</a></li>
          <li><a href="api-reference.html">API</a></li>
          <li><a href="user-guide.html">Guía de Usuario</a></li>
          <li><a href="developer-guide.html">Guía de Desarrollador</a></li>
          <li><a href="glossary.html">Glosario</a></li>
        </ul>
      </div>
      
      <div class="content">
        <h2>Bienvenido a la Documentación</h2>
        <p>Esta documentación proporciona información detallada sobre el proyecto, su arquitectura, módulos y cómo utilizarlo.</p>
        
        <h3>Contenido Principal</h3>
        <ul>
          <li><strong>Módulos:</strong> Documentación de los módulos del proyecto</li>
          <li><strong>API:</strong> Referencia de la API</li>
          <li><strong>Guía de Usuario:</strong> Instrucciones para usuarios finales</li>
          <li><strong>Guía de Desarrollador:</strong> Información para desarrolladores</li>
        </ul>
      </div>
    </main>
  </div>
  
  <footer>
    <div class="container">
      <p>Documentación generada por Doc Agent - &copy; ${new Date().getFullYear()}</p>
    </div>
  </footer>
</body>
</html>`;
      
      // Guardar archivo HTML
      fs.writeFileSync(path.join(sitePath, 'index.html'), indexHtml, 'utf-8');
      
      this.log(`✅ Sitio web de documentación generado en: ${sitePath}`);
      
      // Sugerir comando para servir el sitio
      this.log('📌 Para ver el sitio, ejecute: npx serve ' + sitePath);
    } catch (error) {
      this.log(`⚠️ Error generando sitio web: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Verifica la calidad de la documentación generada
   */
  private async verifyDocQuality(): Promise<void> {
    this.log('🔍 Verificando calidad de la documentación...');
    
    try {
      // Recopilar todos los archivos de documentación
      const docFiles: string[] = [];
      
      const exploreDir = (dirPath: string) => {
        const items = fs.readdirSync(dirPath, { withFileTypes: true });
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item.name);
          
          if (item.isDirectory()) {
            exploreDir(itemPath);
          } else if (item.isFile() && item.name.endsWith('.md')) {
            docFiles.push(itemPath);
          }
        }
      };
      
      exploreDir(this.docOutputPath);
      
      // Estadísticas de calidad
      const stats = {
        totalFiles: docFiles.length,
        totalWords: 0,
        avgWordsPerFile: 0,
        filesWithImages: 0,
        filesWithCodeBlocks: 0,
        filesWithTables: 0,
        qualityScore: 0
      };
      
      // Analizar cada archivo
      for (const filePath of docFiles) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Contar palabras
        const words = content.split(/\s+/).filter(Boolean).length;
        stats.totalWords += words;
        
        // Verificar imágenes
        if (content.includes('![') || content.includes('<img')) {
          stats.filesWithImages++;
        }
        
        // Verificar bloques de código
        if (content.includes('```')) {
          stats.filesWithCodeBlocks++;
        }
        
        // Verificar tablas
        if (content.includes('|') && content.includes('---')) {
          stats.filesWithTables++;
        }
      }
      
      // Calcular promedios
      stats.avgWordsPerFile = Math.round(stats.totalWords / stats.totalFiles);
      
      // Calcular puntuación de calidad (simple)
      const imagesScore = (stats.filesWithImages / stats.totalFiles) * 100;
      const codeScore = (stats.filesWithCodeBlocks / stats.totalFiles) * 100;
      const tableScore = (stats.filesWithTables / stats.totalFiles) * 100;
      const wordScore = Math.min(100, (stats.avgWordsPerFile / 300) * 100);
      
      stats.qualityScore = Math.round((imagesScore + codeScore + tableScore + wordScore) / 4);
      
      // Generar informe
      const report = `# Informe de Calidad de Documentación

## Estadísticas Generales
- **Archivos totales:** ${stats.totalFiles}
- **Palabras totales:** ${stats.totalWords}
- **Promedio de palabras por archivo:** ${stats.avgWordsPerFile}
- **Archivos con imágenes:** ${stats.filesWithImages} (${Math.round((stats.filesWithImages / stats.totalFiles) * 100)}%)
- **Archivos con bloques de código:** ${stats.filesWithCodeBlocks} (${Math.round((stats.filesWithCodeBlocks / stats.totalFiles) * 100)}%)
- **Archivos con tablas:** ${stats.filesWithTables} (${Math.round((stats.filesWithTables / stats.totalFiles) * 100)}%)

## Puntuación de Calidad
- **Puntuación general:** ${stats.qualityScore}/100

## Recomendaciones
${stats.qualityScore < 50 ? '- **Mejorar la documentación:** Añadir más ejemplos, imágenes y tablas.' : ''}
${stats.avgWordsPerFile < 200 ? '- **Ampliar contenido:** Algunos archivos tienen poco contenido.' : ''}
${stats.filesWithImages / stats.totalFiles < 0.3 ? '- **Añadir más imágenes:** Las imágenes ayudan a entender conceptos complejos.' : ''}
${stats.filesWithCodeBlocks / stats.totalFiles < 0.5 ? '- **Incluir más ejemplos de código:** Los ejemplos prácticos son muy útiles.' : ''}

> ⚠️ Informe generado automáticamente por Doc Agent.
`;
      
      // Guardar informe
      const reportPath = path.join(this.docOutputPath, 'quality-report.md');
      fs.writeFileSync(reportPath, report, 'utf-8');
      
      this.log(`✅ Informe de calidad generado en: ${reportPath}`);
    } catch (error) {
      this.log(`⚠️ Error verificando calidad: ${error.message}`, 'warning');
    }
  }
}

/**
 * Tipos de documentación soportados
 */
type DocType = 'project' | 'module' | 'file' | 'api';

/**
 * Opciones de documentación
 */
interface DocOptions {
  type: DocType;
  path?: string;
  format?: string;
  outputPath?: string;
  includeExamples?: boolean;
  includeDiagrams?: boolean;
  specs?: any;
}