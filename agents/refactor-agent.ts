import { BaseAgent, AgentEventType } from './base-agent';
import fs from 'fs';
import path from 'path';
import glob from 'glob';
import { exec } from 'child_process';

/**
 * Refactor Agent - Analiza y refactoriza código existente
 * 
 * Este agente es responsable de:
 * 1. Analizar código existente para identificar problemas y patrones
 * 2. Aplicar mejores prácticas y patrones de diseño
 * 3. Mejorar la legibilidad y mantenibilidad del código
 * 4. Optimizar el rendimiento mediante refactorizaciones
 * 5. Estandarizar la estructura del código en todo el proyecto
 * 6. Implementar patrones de diseño específicos
 * 7. Mejorar la accesibilidad del código
 * 8. Colaborar con el CodeReviewAgent para validar refactorizaciones
 */
export class RefactorAgent extends BaseAgent {
  private codebasePath: string;
  private dryRun: boolean = false;
  private metricsEnabled: boolean = true;
  
  /**
   * Constructor del Refactor Agent
   */
  constructor() {
    super('Refactor Agent');
    this.codebasePath = process.cwd();
    this.registerRefactorEventHandlers();
  }
  
  /**
   * Ejecuta el agente con un comando específico
   */
  public async run(spec: string): Promise<void> {
    this.log(`🔄 Ejecutando Refactor Agent con: ${spec}`);
    
    // Cargar contexto del proyecto
    const coreContext = await this.loadContext('core');
    const rulesContext = await this.loadContext('rules');
    
    // Determinar el tipo de operación
    if (spec.startsWith('analyze:')) {
      const targetPath = spec.substring('analyze:'.length).trim();
      await this.analyzeCode(targetPath, coreContext, rulesContext);
    } else if (spec.startsWith('apply:')) {
      const refactorSpec = spec.substring('apply:'.length).trim();
      await this.applyRefactoring(refactorSpec, coreContext, rulesContext);
    } else if (spec.startsWith('dry-run:')) {
      this.dryRun = true;
      const refactorSpec = spec.substring('dry-run:'.length).trim();
      await this.applyRefactoring(refactorSpec, coreContext, rulesContext);
    } else if (spec.startsWith('standardize:')) {
      const pattern = spec.substring('standardize:'.length).trim();
      await this.standardizeCode(pattern, coreContext, rulesContext);
    } else if (spec.startsWith('pattern:')) {
      const patternSpec = spec.substring('pattern:'.length).trim();
      await this.implementPattern(patternSpec, coreContext, rulesContext);
    } else if (spec.startsWith('accessibility:')) {
      const accessibilitySpec = spec.substring('accessibility:'.length).trim();
      await this.improveAccessibility(accessibilitySpec, coreContext, rulesContext);
    } else if (spec.startsWith('metrics:')) {
      const metricsSpec = spec.substring('metrics:'.length).trim();
      await this.calculateMetrics(metricsSpec, coreContext, rulesContext);
    } else if (spec.startsWith('review:')) {
      const reviewSpec = spec.substring('review:'.length).trim();
      await this.requestCodeReview(reviewSpec);
    } else {
      // Modo por defecto: analizar y sugerir
      await this.analyzeAndSuggest(spec, coreContext, rulesContext);
    }
  }
  
  /**
   * Registra manejadores de eventos específicos
   */
  private registerRefactorEventHandlers(): void {
    // Escuchar cuando se crea un nuevo recurso para posible refactorización
    this.listenForEvent(AgentEventType.RESOURCE_CREATED, async (message) => {
      this.log(`📝 Nuevo recurso detectado: ${message.content.path}`);
      // No hacer nada automáticamente, solo registrar
    });
    
    // Escuchar cuando se solicita una refactorización
    this.listenForEvent(AgentEventType.REFACTOR_REQUESTED, async (message) => {
      this.log(`🔄 Refactorización solicitada por ${message.from}: ${message.content.target}`);
      
      // Ejecutar la refactorización
      await this.run(`analyze:${message.content.target}`);
      
      // Notificar al solicitante
      this.sendEvent(AgentEventType.REFACTOR_COMPLETED, {
        target: message.content.target,
        timestamp: new Date().toISOString(),
        changes: 'Análisis completado'
      }, message.from);
    });
    
    // Escuchar cuando se completa una revisión de código
    this.listenForEvent(AgentEventType.CODE_REVIEW_COMPLETED, async (message) => {
      if (message.content.requestedBy === this.name) {
        this.log(`📋 Revisión de código completada para: ${message.content.target}`);
        
        // Aplicar sugerencias si están aprobadas
        if (message.content.status === 'approved') {
          this.log('✅ Revisión aprobada, aplicando sugerencias...');
          await this.applySuggestions(message.content.target, message.content.suggestions);
        } else {
          this.log('⚠️ Revisión rechazada o con comentarios. Revisar manualmente.');
        }
      }
    });
  }
  
  /**
   * Analiza el código y genera un informe
   */
  private async analyzeCode(targetPath: string, coreContext: string, rulesContext: string): Promise<void> {
    this.log(`🔍 Analizando código en: ${targetPath}`);
    
    // Verificar que la ruta existe
    const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(this.codebasePath, targetPath);
    
    if (!fs.existsSync(fullPath)) {
      this.log(`❌ Ruta no encontrada: ${fullPath}`, 'error');
      return;
    }
    
    // Determinar si es un archivo o directorio
    const isDirectory = fs.statSync(fullPath).isDirectory();
    
    // Obtener archivos a analizar
    const filesToAnalyze: string[] = [];
    
    if (isDirectory) {
      // Buscar archivos TypeScript/JavaScript en el directorio
      const files = glob.sync('**/*.{ts,tsx,js,jsx,html,css,scss}', { cwd: fullPath, absolute: true });
      filesToAnalyze.push(...files);
    } else {
      filesToAnalyze.push(fullPath);
    }
    
    if (filesToAnalyze.length === 0) {
      this.log('⚠️ No se encontraron archivos para analizar', 'warning');
      return;
    }
    
    this.log(`📊 Analizando ${filesToAnalyze.length} archivos...`);
    
    // Leer el contenido de los archivos
    const fileContents: Record<string, string> = {};
    filesToAnalyze.forEach(file => {
      try {
        fileContents[file] = fs.readFileSync(file, 'utf-8');
      } catch (error) {
        this.log(`⚠️ Error al leer archivo ${file}: ${error}`, 'warning');
      }
    });
    
    // Crear prompt para el LLM
    const analysisPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Reglas Arquitectónicas
    ${rulesContext}
    
    # Tarea de Análisis de Código
    Actúa como el Refactor Agent de CJ.DevMind. Tu tarea es analizar el siguiente código y proporcionar recomendaciones de refactorización.
    
    ## Archivos a Analizar
    ${Object.entries(fileContents).map(([file, content]) => `
    ### ${path.basename(file)}
    \`\`\`${path.extname(file).substring(1)}
    ${content}
    \`\`\`
    `).join('\n')}
    
    ## Instrucciones
    1. Identifica problemas en el código (duplicación, complejidad, violaciones de principios SOLID, etc.)
    2. Sugiere refactorizaciones específicas con ejemplos de código
    3. Prioriza las refactorizaciones por impacto y facilidad de implementación
    4. Considera las reglas arquitectónicas del proyecto
    5. Evalúa posibles mejoras de accesibilidad cuando sea aplicable
    6. Identifica oportunidades para implementar patrones de diseño
    7. Sugiere métricas para evaluar el impacto de las refactorizaciones
    
    Estructura tu respuesta en formato Markdown con las siguientes secciones:
    1. Resumen del análisis
    2. Problemas identificados (por archivo)
    3. Recomendaciones de refactorización (por archivo)
    4. Patrones de diseño recomendados
    5. Consideraciones de accesibilidad
    6. Métricas de evaluación
    7. Plan de implementación
    `;
    
    try {
      // Consultar al LLM
      const analysisResult = await this.queryLLM(analysisPrompt);
      
      // Guardar el análisis
      const analysisPath = path.join(this.contextPath, 'refactoring-analysis.md');
      fs.writeFileSync(analysisPath, analysisResult, 'utf-8');
      
      this.log('✅ Análisis completado y guardado en context/refactoring-analysis.md');
      this.log('📋 Resumen del análisis:');
      this.log(analysisResult.substring(0, 500) + '...');
      
      // Notificar a otros agentes
      this.sendEvent(AgentEventType.CODE_ANALYZED, {
        target: targetPath,
        analysisPath,
        timestamp: new Date().toISOString()
      });
      
      // Sugerir revisión de código
      this.log('💡 Puedes solicitar una revisión de código con: refactor-agent run "review:' + targetPath + '"');
      
    } catch (error) {
      this.log(`❌ Error al analizar el código: ${error}`, 'error');
      throw error;
    }
  }
  
  /**
   * Aplica refactorizaciones específicas
   */
  private async applyRefactoring(refactorSpec: string, coreContext: string, rulesContext: string): Promise<void> {
    this.log(`🔧 Aplicando refactorización: ${refactorSpec}`);
    
    // Determinar si es un archivo específico o una refactorización general
    let targetPath: string;
    let refactoringType: string;
    
    if (refactorSpec.includes(':')) {
      const [type, path] = refactorSpec.split(':', 2);
      refactoringType = type.trim();
      targetPath = path.trim();
    } else {
      // Si no se especifica un tipo, asumir que es una ruta
      refactoringType = 'general';
      targetPath = refactorSpec;
    }
    
    // Verificar que la ruta existe
    const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(this.codebasePath, targetPath);
    
    if (!fs.existsSync(fullPath)) {
      this.log(`❌ Ruta no encontrada: ${fullPath}`, 'error');
      return;
    }
    
    // Leer el archivo o archivos
    let fileContents: Record<string, string> = {};
    
    if (fs.statSync(fullPath).isDirectory()) {
      // Es un directorio, buscar archivos según el tipo de refactorización
      let pattern = '**/*.{ts,tsx,js,jsx}';
      
      if (refactoringType === 'react') {
        pattern = '**/*.{tsx,jsx}';
      } else if (refactoringType === 'api') {
        pattern = '**/api/**/*.{ts,js}';
      } else if (refactoringType === 'model') {
        pattern = '**/models/**/*.{ts,js}';
      } else if (refactoringType === 'accessibility') {
        pattern = '**/*.{tsx,jsx,html,css,scss}';
      }
      
      const files = glob.sync(pattern, { cwd: fullPath, absolute: true });
      
      files.forEach(file => {
        try {
          fileContents[file] = fs.readFileSync(file, 'utf-8');
        } catch (error) {
          this.log(`⚠️ Error al leer archivo ${file}: ${error}`, 'warning');
        }
      });
      
      if (Object.keys(fileContents).length === 0) {
        this.log('⚠️ No se encontraron archivos para refactorizar', 'warning');
        return;
      }
    } else {
      // Es un archivo individual
      fileContents[fullPath] = fs.readFileSync(fullPath, 'utf-8');
    }
    
    // Crear prompt para el LLM según el tipo de refactorización
    let refactoringPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Reglas Arquitectónicas
    ${rulesContext}
    
    # Tarea de Refactorización de Código
    Actúa como el Refactor Agent de CJ.DevMind. Tu tarea es refactorizar el siguiente código.
    `;
    
    // Añadir instrucciones específicas según el tipo de refactorización
    if (refactoringType === 'solid') {
      refactoringPrompt += `
      ## Tipo de Refactorización: Principios SOLID
      Aplica los principios SOLID al siguiente código:
      - Single Responsibility Principle: Cada clase debe tener una única responsabilidad
      - Open/Closed Principle: Las entidades deben estar abiertas para extensión pero cerradas para modificación
      - Liskov Substitution Principle: Los objetos de una superclase deben poder ser reemplazados por objetos de una subclase sin afectar la funcionalidad
      - Interface Segregation Principle: Muchas interfaces específicas son mejores que una interfaz general
      - Dependency Inversion Principle: Depender de abstracciones, no de implementaciones concretas
      `;
    } else if (refactoringType === 'performance') {
      refactoringPrompt += `
      ## Tipo de Refactorización: Optimización de Rendimiento
      Optimiza el rendimiento del siguiente código:
      - Reduce la complejidad algorítmica
      - Minimiza operaciones costosas
      - Optimiza el uso de memoria
      - Evita cálculos redundantes
      - Mejora la eficiencia de bucles y operaciones
      - Implementa técnicas de memoización y caché cuando sea apropiado
      - Optimiza las operaciones asíncronas y promesas
      `;
    } else if (refactoringType === 'clean') {
      refactoringPrompt += `
      ## Tipo de Refactorización: Clean Code
      Aplica principios de Clean Code al siguiente código:
      - Nombres significativos para variables, funciones y clases
      - Funciones pequeñas y con un solo propósito
      - Comentarios solo cuando son necesarios
      - Formato consistente
      - Manejo adecuado de errores
      - Eliminación de código duplicado
      - Organización lógica de código
      `;
    } else if (refactoringType === 'accessibility') {
      refactoringPrompt += `
      ## Tipo de Refactorización: Accesibilidad
      Mejora la accesibilidad del siguiente código:
      - Añade atributos ARIA apropiados
      - Asegura un orden de tabulación lógico
      - Implementa etiquetas y descripciones adecuadas
      - Mejora el contraste y la legibilidad
      - Asegura compatibilidad con lectores de pantalla
      - Implementa navegación por teclado
      - Sigue las pautas WCAG 2.1 nivel AA
      `;
    } else if (refactoringType === 'patterns') {
      refactoringPrompt += `
      ## Tipo de Refactorización: Patrones de Diseño
      Aplica patrones de diseño apropiados al siguiente código:
      - Identifica oportunidades para aplicar patrones creacionales (Factory, Singleton, Builder)
      - Implementa patrones estructurales cuando sea apropiado (Adapter, Decorator, Composite)
      - Utiliza patrones de comportamiento para mejorar la interacción (Observer, Strategy, Command)
      - Refactoriza hacia arquitecturas como MVC, MVVM o Flux/Redux cuando sea beneficioso
      `;
    } else {
      refactoringPrompt += `
      ## Tipo de Refactorización: General
      Mejora la calidad general del siguiente código:
      - Aplica patrones de diseño apropiados
      - Mejora la legibilidad y mantenibilidad
      - Reduce la complejidad
      - Elimina código duplicado
      - Optimiza el rendimiento cuando sea posible
      - Mejora la estructura y organización
      - Implementa mejores prácticas específicas del lenguaje
      `;
    }
    
    // Añadir los archivos a refactorizar
    refactoringPrompt += `
    ## Archivos a Refactorizar
    ${Object.entries(fileContents).map(([file, content]) => `
    ### ${path.basename(file)}
    \`\`\`${path.extname(file).substring(1)}
    ${content}
    \`\`\`
    `).join('\n')}
    
    ## Instrucciones
    1. Proporciona la versión refactorizada de cada archivo
    2. Explica los cambios realizados y por qué mejoran el código
    3. Mantén la funcionalidad original intacta
    4. Incluye métricas de mejora esperadas (cuando sea posible)
    
    Para cada archivo, proporciona el código refactorizado en un bloque de código con el formato:
    \`\`\`${path.extname(Object.keys(fileContents)[0]).substring(1)}:RUTA_COMPLETA_AL_ARCHIVO
    // Código refactorizado
    \`\`\`
    `;
    
    try {
      // Consultar al LLM
      const refactoringResult = await this.queryLLM(refactoringPrompt);
      
      // Extraer bloques de código de la respuesta
      const codeBlocks = this.extractCodeBlocks(refactoringResult);
      
      if (codeBlocks.length === 0) {
        this.log('⚠️ No se encontraron bloques de código en la respuesta', 'warning');
        
        // Guardar la respuesta completa para referencia
        const resultPath = path.join(this.contextPath, 'refactoring-result.md');
        fs.writeFileSync(resultPath, refactoringResult, 'utf-8');
        this.log(`📝 Respuesta guardada en ${resultPath}`);
        return;
      }
      
      // Aplicar los cambios
      const changes: string[] = [];
      
      for (const { filePath, code } of codeBlocks) {
        const originalFile = Object.keys(fileContents).find(f => 
          f === filePath || path.basename(f) === path.basename(filePath)
        );
        
        if (!originalFile) {
          this.log(`⚠️ No se encontró el archivo original para ${filePath}`, 'warning');
          continue;
        }
        
        // En modo dry-run, solo mostrar los cambios
        if (this.dryRun) {
          this.log(`🔍 Cambios propuestos para ${originalFile}:`);
          this.log('-------------------------------------------');
          this.log(code.substring(0, 500) + (code.length > 500 ? '...' : ''));
          this.log('-------------------------------------------');
          changes.push(originalFile);
        } else {
          // Aplicar los cambios al archivo
          fs.writeFileSync(originalFile, code, 'utf-8');
          this.log(`✅ Archivo refactorizado: ${originalFile}`);
          changes.push(originalFile);
        }
      }
      
      // Guardar el informe completo
      const reportPath = path.join(this.contextPath, 'refactoring-report.md');
      fs.writeFileSync(reportPath, refactoringResult, 'utf-8');
      
      // Notificar a otros agentes
      this.sendEvent(AgentEventType.CODE_REFACTORED, {
        target: targetPath,
        type: refactoringType,
        changes,
        dryRun: this.dryRun,
        reportPath,
        timestamp: new Date().toISOString()
      });
      
      // Solicitar revisión de código si está disponible
      this.sendEvent(AgentEventType.CODE_REVIEW_REQUESTED, {
        target: targetPath,
        changes,
        reportPath,
        timestamp: new Date().toISOString(),
        requestedBy: this.name
      });
      
      if (this.dryRun) {
        this.log('✅ Simulación de refactorización completada. Revisa los cambios propuestos.');
      } else {
        this.log('✅ Refactorización completada. Archivos actualizados.');
        this.log('💡 Se ha solicitado una revisión de código para validar los cambios.');
      }
      
      // Resetear el modo dry-run
      this.dryRun = false;
      
    } catch (error) {
      this.log(`❌ Error al aplicar la refactorización: ${error}`, 'error');
      throw error;
    }
  }
  
  /**
   * Estandariza el código según un patrón específico
   */
  private async standardizeCode(pattern: string, coreContext: string, rulesContext: string): Promise<void> {
    this.log(`📐 Estandarizando código según patrón: ${pattern}`);
    
    // Determinar los archivos a estandarizar
    let filesToStandardize: string[] = [];
    
    if (pattern.includes('*')) {
      // Es un patrón glob
      filesToStandardize = glob.sync(pattern, { cwd: this.codebasePath, absolute: true });
    } else if (fs.existsSync(pattern)) {
      // Es una ruta específica
      const fullPath = path.isAbsolute(pattern) ? pattern : path.join(this.codebasePath, pattern);
      
      if (fs.statSync(fullPath).isDirectory()) {
        // Es un directorio, buscar todos los archivos TypeScript/JavaScript
        filesToStandardize = glob.sync('**/*.{ts,tsx,js,jsx}', { cwd: fullPath, absolute: true });
      } else {
        // Es un archivo individual
        filesToStandardize = [fullPath];
      }
    } else {
      this.log(`❌ Patrón o ruta no válida: ${pattern}`, 'error');
      return;
    }
    
    if (filesToStandardize.length === 0) {
      this.log('⚠️ No se encontraron archivos para estandarizar', 'warning');
      return;
    }
    
    this.log(`📊 Estandarizando ${filesToStandardize.length} archivos...`);
    
    // Agrupar archivos por tipo para procesarlos en lotes
    const filesByType: Record<string, string[]> = {};
    
    filesToStandardize.forEach(file => {
      const ext = path.extname(file);
      if (!filesByType[ext]) {
        filesByType[ext] = [];
      }
      filesByType[ext].push(file);
    });
    
    // Procesar cada tipo de archivo
    for (const [fileType, files] of Object.entries(filesByType)) {
      this.log(`🔄 Procesando ${files.length} archivos ${fileType}...`);
      
      // Procesar en lotes para no sobrecargar al LLM
      const batchSize = 5;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await this.standardizeBatch(batch, fileType, coreContext, rulesContext);
      }
    }
    
    this.log('✅ Estandarización completada');
    
    // Notificar a otros agentes
    this.sendEvent(AgentEventType.CODE_STANDARDIZED, {
      pattern,
      count: filesToStandardize.length,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Estandariza un lote de archivos del mismo tipo
   */
  private async standardizeBatch(files: string[], fileType: string, coreContext: string, rulesContext: string): Promise<void> {
    // Leer el contenido de los archivos
    const fileContents: Record<string, string> = {};
    files.forEach(file => {
      try {
        fileContents[file] = fs.readFileSync(file, 'utf-8');
      } catch (error) {
        this.log(`⚠️ Error al leer archivo ${file}: ${error}`, 'warning');
      }
    });
    
    // Crear prompt para el LLM
    const standardizationPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Reglas Arquitectónicas
    ${rulesContext}
    
    # Tarea de Estandarización de Código
    Actúa como el Refactor Agent de CJ.DevMind. Tu tarea es estandarizar el siguiente código para que siga un formato y estructura consistentes.
    
    ## Archivos a Estandarizar
    ${Object.entries(fileContents).map(([file, content]) => `
    ### ${path.basename(file)}
    \`\`\`${fileType.substring(1)}
    ${content}
    \`\`\`
    `).join('\n')}
    
    ## Reglas de Estandarización
    1. Estructura consistente de importaciones (primero librerías externas, luego internas)
    2. Formato consistente (indentación, espacios, líneas en blanco)
    3. Convenciones de nomenclatura consistentes
    4. Documentación de clases y métodos con formato JSDoc
    5. Organización consistente de métodos (públicos primero, luego protegidos, luego privados)
    6. Manejo de errores consistente
    7. Uso consistente de tipos y interfaces en TypeScript
    8. Patrones de diseño consistentes
    9. Formato de comentarios uniforme
    
    Para cada archivo, proporciona el código estandarizado en un bloque de código con el formato:
    \`\`\`${fileType.substring(1)}:RUTA_COMPLETA_AL_ARCHIVO
    // Código estandarizado
    \`\`\`
    `;
    
    try {
      // Consultar al LLM
      const standardizationResult = await this.queryLLM(standardizationPrompt);
      
            // Extraer bloques de código de la respuesta
            const codeBlocks = this.extractCodeBlocks(refactoringResult);
      
            if (codeBlocks.length === 0) {
              this.log('⚠️ No se encontraron bloques de código en la respuesta', 'warning');
              
              // Guardar la respuesta completa para referencia
              const resultPath = path.join(this.contextPath, 'refactoring-result.md');
              fs.writeFileSync(resultPath, refactoringResult, 'utf-8');
              this.log(`📝 Respuesta guardada en ${resultPath}`);
              return;
            }
            
            // Aplicar los cambios
            const changes: string[] = [];
            
            for (const { filePath, code } of codeBlocks) {
              const originalFile = Object.keys(fileContents).find(f => 
                f === filePath || path.basename(f) === path.basename(filePath)
              );
              
              if (!originalFile) {
                this.log(`⚠️ No se encontró el archivo original para ${filePath}`, 'warning');
                continue;
              }
              
              // En modo dry-run, solo mostrar los cambios
              if (this.dryRun) {
                this.log(`🔍 Cambios propuestos para ${originalFile}:`);
                this.log('-------------------------------------------');
                this.log(code.substring(0, 500) + (code.length > 500 ? '...' : ''));
                this.log('-------------------------------------------');
                changes.push(originalFile);
              } else {
                // Aplicar los cambios al archivo
                fs.writeFileSync(originalFile, code, 'utf-8');
                this.log(`✅ Archivo refactorizado: ${originalFile}`);
                changes.push(originalFile);
              }
            }
            
            // Guardar el informe completo
            const reportPath = path.join(this.contextPath, 'refactoring-report.md');
            fs.writeFileSync(reportPath, refactoringResult, 'utf-8');
            
            // Notificar a otros agentes
            this.sendEvent(AgentEventType.CODE_REFACTORED, {
              target: targetPath,
              type: refactoringType,
              changes,
              dryRun: this.dryRun,
              reportPath,
              timestamp: new Date().toISOString()
            });
            
            // Solicitar revisión de código si está disponible
            this.sendEvent(AgentEventType.CODE_REVIEW_REQUESTED, {
              target: targetPath,
              changes,
              reportPath,
              timestamp: new Date().toISOString(),
              requestedBy: this.name
            });
            
            if (this.dryRun) {
              this.log('✅ Simulación de refactorización completada. Revisa los cambios propuestos.');
            } else {
              this.log('✅ Refactorización completada. Archivos actualizados.');
              this.log('💡 Se ha solicitado una revisión de código para validar los cambios.');
            }
            
            // Resetear el modo dry-run
            this.dryRun = false;
            
          } catch (error) {
            this.log(`❌ Error al aplicar la refactorización: ${error}`, 'error');
            throw error;
          }
        }
        
        /**
         * Implementa un patrón de diseño específico
         */
        private async implementPattern(patternSpec: string, coreContext: string, rulesContext: string): Promise<void> {
          this.log(`🧩 Implementando patrón de diseño: ${patternSpec}`);
          
          // Determinar el tipo de patrón y la ruta objetivo
          let patternType: string;
          let targetPath: string;
          
          if (patternSpec.includes(':')) {
            const [type, path] = patternSpec.split(':', 2);
            patternType = type.trim();
            targetPath = path.trim();
          } else {
            // Si no se especifica un tipo, asumir que es un patrón general
            patternType = 'general';
            targetPath = patternSpec;
          }
          
          // Verificar que la ruta existe
          const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(this.codebasePath, targetPath);
          
          if (!fs.existsSync(fullPath)) {
            this.log(`❌ Ruta no encontrada: ${fullPath}`, 'error');
            return;
          }
          
          // Leer el archivo o archivos
          let fileContents: Record<string, string> = {};
          
          if (fs.statSync(fullPath).isDirectory()) {
            // Es un directorio, buscar archivos según el tipo de patrón
            let pattern = '**/*.{ts,tsx,js,jsx}';
            
            if (patternType === 'react') {
              pattern = '**/*.{tsx,jsx}';
            } else if (patternType === 'api') {
              pattern = '**/api/**/*.{ts,js}';
            } else if (patternType === 'model') {
              pattern = '**/models/**/*.{ts,js}';
            }
            
            const files = glob.sync(pattern, { cwd: fullPath, absolute: true });
            
            files.forEach(file => {
              try {
                fileContents[file] = fs.readFileSync(file, 'utf-8');
              } catch (error) {
                this.log(`⚠️ Error al leer archivo ${file}: ${error}`, 'warning');
              }
            });
            
            if (Object.keys(fileContents).length === 0) {
              this.log('⚠️ No se encontraron archivos para aplicar el patrón', 'warning');
              return;
            }
          } else {
            // Es un archivo individual
            fileContents[fullPath] = fs.readFileSync(fullPath, 'utf-8');
          }
          
          // Crear prompt para el LLM según el tipo de patrón
          let patternPrompt = `
          # Contexto del Proyecto
          ${coreContext}
          
          # Reglas Arquitectónicas
          ${rulesContext}
          
          # Tarea de Implementación de Patrón de Diseño
          Actúa como el Refactor Agent de CJ.DevMind. Tu tarea es implementar un patrón de diseño en el siguiente código.
          `;
          
          // Añadir instrucciones específicas según el tipo de patrón
          if (patternType === 'factory') {
            patternPrompt += `
            ## Tipo de Patrón: Factory
            Implementa el patrón Factory en el siguiente código:
            - Crea una clase Factory que encapsule la creación de objetos
            - Usa métodos estáticos o de instancia para crear objetos
            - Permite la extensibilidad para nuevos tipos de objetos
            - Oculta la lógica de creación de objetos
            - Considera usar Factory Method o Abstract Factory según sea apropiado
            `;
          } else if (patternType === 'singleton') {
            patternPrompt += `
            ## Tipo de Patrón: Singleton
            Implementa el patrón Singleton en el siguiente código:
            - Asegura que solo exista una instancia de la clase
            - Proporciona un punto de acceso global a esa instancia
            - Implementa inicialización perezosa (lazy initialization)
            - Considera la seguridad en entornos multihilo si es relevante
            - Usa una implementación moderna y segura del patrón
            `;
          } else if (patternType === 'observer') {
            patternPrompt += `
            ## Tipo de Patrón: Observer
            Implementa el patrón Observer en el siguiente código:
            - Define una dependencia uno-a-muchos entre objetos
            - Cuando un objeto cambia de estado, todos sus dependientes son notificados
            - Implementa interfaces o clases abstractas para Subject y Observer
            - Permite añadir y eliminar observadores dinámicamente
            - Considera usar eventos o callbacks para la notificación
            `;
          } else if (patternType === 'strategy') {
            patternPrompt += `
            ## Tipo de Patrón: Strategy
            Implementa el patrón Strategy en el siguiente código:
            - Define una familia de algoritmos encapsulados
            - Hace los algoritmos intercambiables
            - Permite que el algoritmo varíe independientemente de los clientes que lo usan
            - Usa composición en lugar de herencia
            - Considera usar funciones o clases para las estrategias
            `;
          } else if (patternType === 'decorator') {
            patternPrompt += `
            ## Tipo de Patrón: Decorator
            Implementa el patrón Decorator en el siguiente código:
            - Añade responsabilidades a objetos dinámicamente
            - Proporciona una alternativa flexible a la herencia
            - Sigue el principio de responsabilidad única
            - Permite combinar comportamientos
            - Considera usar composición y delegación
            `;
          } else if (patternType === 'mvc' || patternType === 'mvvm') {
            patternPrompt += `
            ## Tipo de Patrón: ${patternType.toUpperCase()}
            Implementa el patrón ${patternType.toUpperCase()} en el siguiente código:
            - Separa la lógica de negocio de la interfaz de usuario
            - Define claramente las responsabilidades de cada componente
            - Implementa el flujo de datos y eventos apropiado
            - Asegura que los componentes sean testables
            - Considera la reactividad y la actualización de la UI
            `;
          } else {
            patternPrompt += `
            ## Tipo de Patrón: General
            Analiza el código y determina qué patrón de diseño sería más apropiado implementar. Considera:
            - Patrones creacionales (Factory, Builder, Singleton, Prototype)
            - Patrones estructurales (Adapter, Bridge, Composite, Decorator, Facade, Proxy)
            - Patrones de comportamiento (Chain of Responsibility, Command, Iterator, Observer, Strategy, Template Method)
            - Patrones arquitectónicos (MVC, MVVM, MVP, Clean Architecture, Hexagonal)
            
            Implementa el patrón que mejor se adapte al código y explica por qué lo elegiste.
            `;
          }
          
          // Añadir los archivos a refactorizar
          patternPrompt += `
          ## Archivos a Refactorizar
          ${Object.entries(fileContents).map(([file, content]) => `
          ### ${path.basename(file)}
          \`\`\`${path.extname(file).substring(1)}
          ${content}
          \`\`\`
          `).join('\n')}
          
          ## Instrucciones
          1. Implementa el patrón de diseño en el código
          2. Proporciona la versión refactorizada de cada archivo
          3. Explica cómo se ha implementado el patrón y sus beneficios
          4. Mantén la funcionalidad original intacta
          5. Considera crear nuevos archivos si es necesario para una mejor organización
          
          Para cada archivo, proporciona el código refactorizado en un bloque de código con el formato:
          \`\`\`${path.extname(Object.keys(fileContents)[0]).substring(1)}:RUTA_COMPLETA_AL_ARCHIVO
          // Código refactorizado
          \`\`\`
          
          Si necesitas crear nuevos archivos, indica la ruta completa y el contenido:
          \`\`\`${path.extname(Object.keys(fileContents)[0]).substring(1)}:RUTA_COMPLETA_AL_NUEVO_ARCHIVO
          // Código del nuevo archivo
          \`\`\`
          `;
          
          try {
            // Consultar al LLM
            const patternResult = await this.queryLLM(patternPrompt);
            
            // Extraer bloques de código de la respuesta
            const codeBlocks = this.extractCodeBlocks(patternResult);
            
            if (codeBlocks.length === 0) {
              this.log('⚠️ No se encontraron bloques de código en la respuesta', 'warning');
              
              // Guardar la respuesta completa para referencia
              const resultPath = path.join(this.contextPath, 'pattern-implementation-result.md');
              fs.writeFileSync(resultPath, patternResult, 'utf-8');
              this.log(`📝 Respuesta guardada en ${resultPath}`);
              return;
            }
            
            // Aplicar los cambios
            const changes: string[] = [];
            
            for (const { filePath, code } of codeBlocks) {
              // Determinar si es un archivo existente o nuevo
              const isExistingFile = Object.keys(fileContents).some(f => 
                f === filePath || path.basename(f) === path.basename(filePath)
              );
              
              // Crear directorio si no existe
              const directory = path.dirname(filePath);
              if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory, { recursive: true });
                this.log(`📁 Creado directorio: ${directory}`);
              }
              
              // Guardar el archivo
              fs.writeFileSync(filePath, code, 'utf-8');
              
              if (isExistingFile) {
                this.log(`✅ Archivo actualizado: ${filePath}`);
              } else {
                this.log(`✅ Archivo creado: ${filePath}`);
              }
              
              changes.push(filePath);
            }
            
            // Guardar el informe completo
            const reportPath = path.join(this.contextPath, 'pattern-implementation-report.md');
            fs.writeFileSync(reportPath, patternResult, 'utf-8');
            
            // Notificar a otros agentes
            this.sendEvent(AgentEventType.CODE_REFACTORED, {
              target: targetPath,
              type: `pattern:${patternType}`,
              changes,
              reportPath,
              timestamp: new Date().toISOString()
            });
            
            // Solicitar revisión de código
            this.sendEvent(AgentEventType.CODE_REVIEW_REQUESTED, {
              target: targetPath,
              changes,
              reportPath,
              timestamp: new Date().toISOString(),
              requestedBy: this.name
            });
            
            this.log('✅ Implementación de patrón completada. Archivos actualizados.');
            this.log('💡 Se ha solicitado una revisión de código para validar los cambios.');
            
          } catch (error) {
            this.log(`❌ Error al implementar el patrón: ${error}`, 'error');
            throw error;
          }
        }
        
        /**
         * Mejora la accesibilidad del código
         */
        private async improveAccessibility(accessibilitySpec: string, coreContext: string, rulesContext: string): Promise<void> {
          this.log(`♿ Mejorando accesibilidad: ${accessibilitySpec}`);
          
          // Determinar la ruta objetivo
          let targetPath = accessibilitySpec;
          
          // Verificar que la ruta existe
          const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(this.codebasePath, targetPath);
          
          if (!fs.existsSync(fullPath)) {
            this.log(`❌ Ruta no encontrada: ${fullPath}`, 'error');
            return;
          }
          
          // Leer el archivo o archivos
          let fileContents: Record<string, string> = {};
          
          if (fs.statSync(fullPath).isDirectory()) {
            // Es un directorio, buscar archivos relevantes para accesibilidad
            const pattern = '**/*.{tsx,jsx,html,css,scss}';
            const files = glob.sync(pattern, { cwd: fullPath, absolute: true });
            
            files.forEach(file => {
              try {
                fileContents[file] = fs.readFileSync(file, 'utf-8');
              } catch (error) {
                this.log(`⚠️ Error al leer archivo ${file}: ${error}`, 'warning');
              }
            });
            
            if (Object.keys(fileContents).length === 0) {
              this.log('⚠️ No se encontraron archivos para mejorar accesibilidad', 'warning');
              return;
            }
          } else {
            // Es un archivo individual
            fileContents[fullPath] = fs.readFileSync(fullPath, 'utf-8');
          }
          
          // Crear prompt para el LLM
          const accessibilityPrompt = `
          # Contexto del Proyecto
          ${coreContext}
          
          # Reglas Arquitectónicas
          ${rulesContext}
          
          # Tarea de Mejora de Accesibilidad
          Actúa como el Refactor Agent de CJ.DevMind. Tu tarea es mejorar la accesibilidad del siguiente código para cumplir con las pautas WCAG 2.1 nivel AA.
          
          ## Archivos a Mejorar
          ${Object.entries(fileContents).map(([file, content]) => `
          ### ${path.basename(file)}
          \`\`\`${path.extname(file).substring(1)}
          ${content}
          \`\`\`
          `).join('\n')}
          
          ## Instrucciones
          1. Mejora la accesibilidad del código siguiendo las pautas WCAG 2.1 nivel AA
          2. Implementa las siguientes mejoras:
             - Añade atributos ARIA apropiados
             - Asegura un orden de tabulación lógico
             - Implementa etiquetas y descripciones adecuadas
             - Mejora el contraste y la legibilidad
             - Asegura compatibilidad con lectores de pantalla
             - Implementa navegación por teclado
             - Añade textos alternativos para imágenes
             - Asegura que los formularios sean accesibles
             - Implementa mensajes de error claros
             - Asegura que los componentes interactivos sean identificables
          3. Proporciona la versión mejorada de cada archivo
          4. Explica las mejoras realizadas y cómo benefician a la accesibilidad
          
          Para cada archivo, proporciona el código mejorado en un bloque de código con el formato:
          \`\`\`${path.extname(Object.keys(fileContents)[0]).substring(1)}:RUTA_COMPLETA_AL_ARCHIVO
          // Código mejorado
          \`\`\`
          `;
          
          try {
            // Consultar al LLM
            const accessibilityResult = await this.queryLLM(accessibilityPrompt);
            
            // Extraer bloques de código de la respuesta
            const codeBlocks = this.extractCodeBlocks(accessibilityResult);
            
            if (codeBlocks.length === 0) {
              this.log('⚠️ No se encontraron bloques de código en la respuesta', 'warning');
              
              // Guardar la respuesta completa para referencia
              const resultPath = path.join(this.contextPath, 'accessibility-improvement-result.md');
              fs.writeFileSync(resultPath, accessibilityResult, 'utf-8');
              this.log(`📝 Respuesta guardada en ${resultPath}`);
              return;
            }
            
            // Aplicar los cambios
            const changes: string[] = [];
            
            for (const { filePath, code } of codeBlocks) {
              const originalFile = Object.keys(fileContents).find(f => 
                f === filePath || path.basename(f) === path.basename(filePath)
              );
              
              if (!originalFile) {
                this.log(`⚠️ No se encontró el archivo original para ${filePath}`, 'warning');
                continue;
              }
              
              // Aplicar los cambios al archivo
              fs.writeFileSync(originalFile, code, 'utf-8');
              this.log(`✅ Archivo mejorado para accesibilidad: ${originalFile}`);
              changes.push(originalFile);
            }
            
            // Guardar el informe completo
            const reportPath = path.join(this.contextPath, 'accessibility-improvement-report.md');
            fs.writeFileSync(reportPath, accessibilityResult, 'utf-8');
            
            // Notificar a otros agentes
            this.sendEvent(AgentEventType.CODE_REFACTORED, {
              target: targetPath,
              type: 'accessibility',
              changes,
              reportPath,
              timestamp: new Date().toISOString()
            });
            
            // Solicitar revisión de código
            this.sendEvent(AgentEventType.CODE_REVIEW_REQUESTED, {
              target: targetPath,
              changes,
              reportPath,
              timestamp: new Date().toISOString(),
              requestedBy: this.name
            });
            
            this.log('✅ Mejoras de accesibilidad completadas. Archivos actualizados.');
            this.log('💡 Se ha solicitado una revisión de código para validar los cambios.');
            
          } catch (error) {
            this.log(`❌ Error al mejorar la accesibilidad: ${error}`, 'error');
            throw error;
          }
        }
        
        /**
         * Calcula métricas de código
         */
        private async calculateMetrics(metricsSpec: string, coreContext: string, rulesContext: string): Promise<void> {
          this.log(`📊 Calculando métricas para: ${metricsSpec}`);
          
          if (!this.metricsEnabled) {
            this.log('⚠️ Las métricas están desactivadas. Actívalas con "metrics:enable"', 'warning');
            return;
          }
          
          // Verificar si es un comando especial
          if (metricsSpec === 'enable') {
            this.metricsEnabled = true;
            this.log('✅ Métricas activadas');
            return;
          } else if (metricsSpec === 'disable') {
            this.metricsEnabled = false;
            this.log('✅ Métricas desactivadas');
            return;
          }
          
          // Determinar la ruta objetivo
          let targetPath = metricsSpec;
          
          // Verificar que la ruta existe
          const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(this.codebasePath, targetPath);
          
          if (!fs.existsSync(fullPath)) {
            this.log(`❌ Ruta no encontrada: ${fullPath}`, 'error');
            return;
          }
          
          // Determinar si es un archivo o directorio
          const isDirectory = fs.statSync(fullPath).isDirectory();
          
          // Obtener archivos a analizar
          const filesToAnalyze: string[] = [];
          
          if (isDirectory) {
            // Buscar archivos TypeScript/JavaScript en el directorio
            const files = glob.sync('**/*.{ts,tsx,js,jsx}', { cwd: fullPath, absolute: true });
            filesToAnalyze.push(...files);
          } else {
            filesToAnalyze.push(fullPath);
          }
          
          if (filesToAnalyze.length === 0) {
            this.log('⚠️ No se encontraron archivos para analizar', 'warning');
            return;
          }
          
          this.log(`📊 Analizando ${filesToAnalyze.length} archivos...`);
          
          // Leer el contenido de los archivos
          const fileContents: Record<string, string> = {};
          filesToAnalyze.forEach(file => {
            try {
              fileContents[file] = fs.readFileSync(file, 'utf-8');
            } catch (error) {
              this.log(`⚠️ Error al leer archivo ${file}: ${error}`, 'warning');
            }
          });
          
          // Crear prompt para el LLM
          const metricsPrompt = `
          # Contexto del Proyecto
          ${coreContext}
          
          # Reglas Arquitectónicas
          ${rulesContext}
          
          # Tarea de Cálculo de Métricas de Código
          Actúa como el Refactor Agent de CJ.DevMind. Tu tarea es analizar el siguiente código y calcular métricas de calidad.
          
          ## Archivos a Analizar
          ${Object.entries(fileContents).map(([file, content]) => `
          ### ${path.basename(file)}
          \`\`\`${path.extname(file).substring(1)}
          ${content}
          \`\`\`
          `).join('\n')}
          
          ## Instrucciones
          1. Calcula las siguientes métricas para cada archivo:
             - Complejidad ciclomática
             - Líneas de código (LOC)
             - Líneas de código efectivas (sin comentarios ni líneas en blanco)
             - Número de funciones/métodos
             - Longitud promedio de funciones/métodos
             - Número de clases
             - Número de importaciones
             - Deuda técnica estimada (en horas)
             - Índice de mantenibilidad (0-100)
             - Duplicación de código (porcentaje)
             - Violaciones de principios SOLID
             - Problemas de accesibilidad (si aplica)
          2. Proporciona un resumen general de las métricas
          3. Identifica áreas problemáticas y sugiere mejoras
          4. Calcula un puntaje general de calidad (0-100)
          
          Estructura tu respuesta en formato Markdown con las siguientes secciones:
          1. Resumen Ejecutivo
          2. Métricas por Archivo
          3. Áreas Problemáticas
          4. Recomendaciones de Mejora
          5. Puntaje General de Calidad
          `;
          
          try {
            // Consultar al LLM
            const metricsResult = await this.queryLLM(metricsPrompt);
            
            // Guardar el resultado
            const metricsPath = path.join(this.contextPath, 'code-metrics.md');
            fs.writeFileSync(metricsPath, metricsResult, 'utf-8');
            
            this.log('✅ Métricas calculadas y guardadas en context/code-metrics.md');
            this.log('📋 Resumen de métricas:');
            this.log(metricsResult.substring(0, 500) + '...');
            
            // Notificar a otros agentes
            this.sendEvent(AgentEventType.METRICS_CALCULATED, {
              target: targetPath,
              metricsPath,
              timestamp: new Date().toISOString()
            });
            
          } catch (error) {
            this.log(`❌ Error al calcular métricas: ${error}`, 'error');
            throw error;
          }
        }
        
        /**
         * Solicita una revisión de código
         */
        private async requestCodeReview(reviewSpec: string): Promise<void> {
          this.log(`📋 Solicitando revisión de código para: ${reviewSpec}`);
          
          // Determinar la ruta objetivo
          let targetPath = reviewSpec;
          
          // Verificar que la ruta existe
          const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(this.codebasePath, targetPath);
          
          if (!fs.existsSync(fullPath)) {
            this.log(`❌ Ruta no encontrada: ${fullPath}`, 'error');
            return;
          }
          
          // Notificar a otros agentes
          this.sendEvent(AgentEventType.CODE_REVIEW_REQUESTED, {
            target: targetPath,
            timestamp: new Date().toISOString(),
            requestedBy: this.name
          });
          
          this.log('✅ Solicitud de revisión de código enviada.');
          this.log('💡 El CodeReviewAgent procesará la solicitud y te notificará cuando esté completa.');
        }
        
        /**
         * Aplica sugerencias de revisión de código
         */
        private async applySuggestions(targetPath: string, suggestions: any[]): Promise<void> {
          this.log(`🔧 Aplicando sugerencias de revisión para: ${targetPath}`);
          
          if (!suggestions || suggestions.length === 0) {
            this.log('⚠️ No hay sugerencias para aplicar', 'warning');
            return;
          }
          
          // Verificar que la ruta existe
          const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(this.codebasePath, targetPath);
          
          if (!fs.existsSync(fullPath)) {
            this.log(`❌ Ruta no encontrada: ${fullPath}`, 'error');
            return;
          }
          
          // Aplicar cada sugerencia
          const changes: string[] = [];
          
          for (const suggestion of suggestions) {
            if (!suggestion.file || !suggestion.changes) {
              this.log(`⚠️ Sugerencia inválida: ${JSON.stringify(suggestion)}`, 'warning');
              continue;
            }
            
            const filePath = path.isAbsolute(suggestion.file) ? suggestion.file : path.join(this.codebasePath, suggestion.file);
            
            if (!fs.existsSync(filePath)) {
              this.log(`⚠️ Archivo no encontrado: ${filePath}`, 'warning');
              continue;
            }
            
            try {
              // Leer el archivo
              let content = fs.readFileSync(filePath, 'utf-8');
              
              // Aplicar los cambios
              if (suggestion.type === 'replace') {
                // Reemplazar todo el contenido
                content = suggestion.changes;
              } else if (suggestion.type === 'line') {
                // Reemplazar líneas específicas
                const lines = content.split('\n');
                
                for (const change of suggestion.changes) {
                  if (change.line >= 1 && change.line <= lines.length) {
                    lines[change.line - 1] = change.content;
                  }
                }
                
                content = lines.join('\n');
              } else if (suggestion.type === 'range') {
                // Reemplazar un rango de líneas
                const lines = content.split('\n');
                
                for (const change of suggestion.changes) {
                  if (change.start >= 1 && change.end <= lines.length) {
                    const newLines = change.content.split('\n');
                    lines.splice(change.start - 1, change.end - change.start + 1, ...newLines);
                  }
                }
                
                content = lines.join('\n');
              } else {
                // Tipo de cambio desconocido, usar como reemplazo completo
                this.log(`⚠️ Tipo de cambio desconocido: ${suggestion.type}, usando reemplazo completo`, 'warning');
                content = suggestion.changes;
              }
              
              // Guardar los cambios
              fs.writeFileSync(filePath, content, 'utf-8');
              this.log(`✅ Cambios aplicados a ${filePath}`);
              changes.push(filePath);
              
            } catch (error) {
              this.log(`❌ Error al aplicar cambios a ${filePath}: ${error}`, 'error');
            }
          }
          
          if (changes.length > 0) {
            this.log(`✅ Se aplicaron ${changes.length} sugerencias de revisión`);
            
            // Notificar a otros agentes
            this.sendEvent(AgentEventType.CODE_UPDATED, {
              target: targetPath,
              changes,
              source: 'code_review',
              timestamp: new Date().toISOString()
            });
          } else {
            this.log('⚠️ No se aplicó ninguna sugerencia', 'warning');
          }
        }
        
        /**
         * Optimiza el rendimiento del código
         */
        private async optimizePerformance(optimizationSpec: string, coreContext: string, rulesContext: string): Promise<void> {
          this.log(`⚡ Optimizando rendimiento para: ${optimizationSpec}`);
          
          // Determinar la ruta objetivo
          let targetPath = optimizationSpec;
          
          // Verificar que la ruta existe
          const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(this.codebasePath, targetPath);
          
          if (!fs.existsSync(fullPath)) {
            this.log(`❌ Ruta no encontrada: ${fullPath}`, 'error');
            return;
          }
          
          // Leer el archivo o archivos
          let fileContents: Record<string, string> = {};
          
          if (fs.statSync(fullPath).isDirectory()) {
            // Es un directorio, buscar archivos relevantes
            const pattern = '**/*.{ts,tsx,js,jsx}';
            const files = glob.sync(pattern, { cwd: fullPath, absolute: true });
            
            files.forEach(file => {
              try {
                fileContents[file] = fs.readFileSync(file, 'utf-8');
              } catch (error) {
                this.log(`⚠️ Error al leer archivo ${file}: ${error}`, 'warning');
              }
            });
            
            if (Object.keys(fileContents).length === 0) {
              this.log('⚠️ No se encontraron archivos para optimizar', 'warning');
              return;
            }
          } else {
            // Es un archivo individual
            fileContents[fullPath] = fs.readFileSync(fullPath, 'utf-8');
          }
          
          // Crear prompt para el LLM
          const optimizationPrompt = `
          # Contexto del Proyecto
          ${coreContext}
          
          # Reglas Arquitectónicas
          ${rulesContext}
          
          # Tarea de Optimización de Rendimiento
          Actúa como el Refactor Agent de CJ.DevMind. Tu tarea es optimizar el rendimiento del siguiente código sin cambiar su funcionalidad.
          
          ## Archivos a Optimizar
          ${Object.entries(fileContents).map(([file, content]) => `
          ### ${path.basename(file)}
          \`\`\`${path.extname(file).substring(1)}
          ${content}
          \`\`\`
          `).join('\n')}
          
          ## Instrucciones
          1. Optimiza el rendimiento del código sin cambiar su funcionalidad
          2. Implementa las siguientes optimizaciones:
             - Reduce la complejidad algorítmica (O(n²) → O(n log n) → O(n))
             - Minimiza las operaciones costosas (I/O, red, DOM)
             - Implementa memoización para cálculos repetitivos
             - Optimiza bucles y recursión
             - Reduce la creación de objetos innecesarios
             - Implementa lazy loading donde sea apropiado
             - Optimiza consultas a bases de datos
             - Reduce el tamaño del bundle (tree-shaking, code-splitting)
             - Implementa paralelización donde sea posible
             - Optimiza el uso de memoria
          3. Proporciona la versión optimizada de cada archivo
          4. Explica las optimizaciones realizadas y su impacto en el rendimiento
          
          Para cada archivo, proporciona el código optimizado en un bloque de código con el formato:
          \`\`\`${path.extname(Object.keys(fileContents)[0]).substring(1)}:RUTA_COMPLETA_AL_ARCHIVO
          // Código optimizado
          \`\`\`
          `;
          
          try {
            // Consultar al LLM
            const optimizationResult = await this.queryLLM(optimizationPrompt);
            
            // Extraer bloques de código de la respuesta
            const codeBlocks = this.extractCodeBlocks(optimizationResult);
            
            if (codeBlocks.length === 0) {
              this.log('⚠️ No se encontraron bloques de código en la respuesta', 'warning');
              
              // Guardar la respuesta completa para referencia
              const resultPath = path.join(this.contextPath, 'performance-optimization-result.md');
              fs.writeFileSync(resultPath, optimizationResult, 'utf-8');
              this.log(`📝 Respuesta guardada en ${resultPath}`);
              return;
            }
            
            // Aplicar los cambios
            const changes: string[] = [];
            
            for (const { filePath, code } of codeBlocks) {
              const originalFile = Object.keys(fileContents).find(f => 
                f === filePath || path.basename(f) === path.basename(filePath)
              );
              
              if (!originalFile) {
                this.log(`⚠️ No se encontró el archivo original para ${filePath}`, 'warning');
                continue;
              }
              
              // Aplicar los cambios al archivo
              fs.writeFileSync(originalFile, code, 'utf-8');
              this.log(`✅ Archivo optimizado: ${originalFile}`);
              changes.push(originalFile);
            }
            
            // Guardar el informe completo
            const reportPath = path.join(this.contextPath, 'performance-optimization-report.md');
            fs.writeFileSync(reportPath, optimizationResult, 'utf-8');
            
            // Notificar a otros agentes
            this.sendEvent(AgentEventType.CODE_REFACTORED, {
              target: targetPath,
              type: 'performance',
              changes,
              reportPath,
              timestamp: new Date().toISOString()
            });
            
            // Solicitar revisión de código
            this.sendEvent(AgentEventType.CODE_REVIEW_REQUESTED, {
              target: targetPath,
              changes,
              reportPath,
              timestamp: new Date().toISOString(),
              requestedBy: this.name
            });
            
            this.log('✅ Optimización de rendimiento completada. Archivos actualizados.');
            this.log('💡 Se ha solicitado una revisión de código para validar los cambios.');
            
          } catch (error) {
            this.log(`❌ Error al optimizar el rendimiento: ${error}`, 'error');
            throw error;
          }
        }
        
        /**
         * Estandariza el código según las convenciones del proyecto
         */
        private async standardizeCode(standardizationSpec: string, coreContext: string, rulesContext: string): Promise<void> {
          this.log(`📏 Estandarizando código para: ${standardizationSpec}`);
          
          // Determinar la ruta objetivo
          let targetPath = standardizationSpec;
          
          // Verificar que la ruta existe
          const fullPath = path.isAbsolute(targetPath) ? targetPath : path.join(this.codebasePath, targetPath);
          
          if (!fs.existsSync(fullPath)) {
            this.log(`❌ Ruta no encontrada: ${fullPath}`, 'error');
            return;
          }
          
          // Leer el archivo o archivos
          let fileContents: Record<string, string> = {};
          
          if (fs.statSync(fullPath).isDirectory()) {
            // Es un directorio, buscar archivos relevantes
            const pattern = '**/*.{ts,tsx,js,jsx,css,scss,html}';
            const files = glob.sync(pattern, { cwd: fullPath, absolute: true });
            
            files.forEach(file => {
              try {
                fileContents[file] = fs.readFileSync(file, 'utf-8');
              } catch (error) {
                this.log(`⚠️ Error al leer archivo ${file}: ${error}`, 'warning');
              }
            });
            
            if (Object.keys(fileContents).length === 0) {
              this.log('⚠️ No se encontraron archivos para estandarizar', 'warning');
              return;
            }
          } else {
            // Es un archivo individual
            fileContents[fullPath] = fs.readFileSync(fullPath, 'utf-8');
          }
          
          // Crear prompt para el LLM
          const standardizationPrompt = `
          # Contexto del Proyecto
          ${coreContext}
          
          # Reglas Arquitectónicas
          ${rulesContext}
          
          # Tarea de Estandarización de Código
          Actúa como el Refactor Agent de CJ.DevMind. Tu tarea es estandarizar el siguiente código según las convenciones del proyecto.
          
          ## Archivos a Estandarizar
          ${Object.entries(fileContents).map(([file, content]) => `
          ### ${path.basename(file)}
          \`\`\`${path.extname(file).substring(1)}
          ${content}
          \`\`\`
          `).join('\n')}
          
          ## Instrucciones
          1. Estandariza el código según las siguientes convenciones:
             - Nomenclatura consistente (camelCase para variables y funciones, PascalCase para clases e interfaces)
             - Indentación y espaciado uniforme (2 espacios)
             - Uso consistente de comillas (simples para strings)
             - Formato de comentarios estandarizado (JSDoc para funciones y clases)
             - Organización de imports (agrupados por tipo, ordenados alfabéticamente)
             - Estructura de archivos consistente (imports, constantes, tipos, funciones, exports)
             - Uso de tipos explícitos en TypeScript
             - Manejo de errores estandarizado
             - Patrones de diseño consistentes
             - Estilo CSS/SCSS consistente (BEM o similar)
          2. Proporciona la versión estandarizada de cada archivo
          3. Explica los cambios realizados y cómo mejoran la consistencia del código
          
          Para cada archivo, proporciona el código estandarizado en un bloque de código con el formato:
          \`\`\`${path.extname(Object.keys(fileContents)[0]).substring(1)}:RUTA_COMPLETA_AL_ARCHIVO
          // Código estandarizado
          \`\`\`
          `;
          
          try {
            // Consultar al LLM
            const standardizationResult = await this.queryLLM(standardizationPrompt);
            
            // Extraer bloques de código de la respuesta
            const codeBlocks = this.extractCodeBlocks(standardizationResult);
            
            if (codeBlocks.length === 0) {
              this.log('⚠️ No se encontraron bloques de código en la respuesta', 'warning');
              
              // Guardar la respuesta completa para referencia
              const resultPath = path.join(this.contextPath, 'code-standardization-result.md');
              fs.writeFileSync(resultPath, standardizationResult, 'utf-8');
              this.log(`📝 Respuesta guardada en ${resultPath}`);
              return;
            }
            
            // Aplicar los cambios
            const changes: string[] = [];
            
            for (const { filePath, code } of codeBlocks) {
              const originalFile = Object.keys(fileContents).find(f => 
                f === filePath || path.basename(f) === path.basename(filePath)
              );
              
              if (!originalFile) {
                this.log(`⚠️ No se encontró el archivo original para ${filePath}`, 'warning');
                continue;
              }
              
              // Aplicar los cambios al archivo
              fs.writeFileSync(originalFile, code, 'utf-8');
              this.log(`✅ Archivo estandarizado: ${originalFile}`);
              changes.push(originalFile);
            }
            
            // Guardar el informe completo
            const reportPath = path.join(this.contextPath, 'code-standardization-report.md');
            fs.writeFileSync(reportPath, standardizationResult, 'utf-8');
            
            // Notificar a otros agentes
            this.sendEvent(AgentEventType.CODE_REFACTORED, {
              target: targetPath,
              type: 'standardization',
              changes,
              reportPath,
              timestamp: new Date().toISOString()
            });
            
            // Solicitar revisión de código
            this.sendEvent(AgentEventType.CODE_REVIEW_REQUESTED, {
              target: targetPath,
              changes,
              reportPath,
              timestamp: new Date().toISOString(),
              requestedBy: this.name
            });
            
            this.log('✅ Estandarización de código completada. Archivos actualizados.');
            this.log('💡 Se ha solicitado una revisión de código para validar los cambios.');
            
          } catch (error) {
            this.log(`❌ Error al estandarizar el código: ${error}`, 'error');
            throw error;
          }
        }
        
        /**
         * Extrae bloques de código de una respuesta
         */
        private extractCodeBlocks(text: string): Array<{ filePath: string; code: string }> {
          const codeBlocks: Array<{ filePath: string; code: string }> = [];
          
          // Expresión regular para encontrar bloques de código con ruta de archivo
          // Formato: ```lenguaje:ruta%2Fal%2Farchivo
          // código
          // ```
          const regex = /```(?:\w+)?(?::([^\n]+))?\n([\s\S]*?)```/g;
          
          let match;
          while ((match = regex.exec(text)) !== null) {
            const [, filePath, code] = match;
            
            if (filePath && code) {
              codeBlocks.push({
                filePath: filePath.trim(),
                code: code.trim()
              });
            }
          }
          
          return codeBlocks;
        }
        
        /**
         * Consulta al LLM con un prompt
         */
        private async queryLLM(prompt: string): Promise<string> {
          try {
            // Aquí se implementaría la lógica para consultar al LLM
            // Por ahora, simulamos una respuesta
            
            // En una implementación real, se usaría la API del LLM
            // Por ejemplo:
            // const response = await fetch('https://api.openai.com/v1/chat/completions', {
            //   method: 'POST',
            //   headers: {
            //     'Content-Type': 'application/json',
            //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            //   },
            //   body: JSON.stringify({
            //     model: 'gpt-4',
            //     messages: [
            //       { role: 'system', content: 'Eres un asistente experto en refactorización de código.' },
            //       { role: 'user', content: prompt }
            //     ],
            //     temperature: 0.2
            //   })
            // });
            // const data = await response.json();
            // return data.choices[0].message.content;
            
            // Simulación de respuesta
            return `Análisis completado. Aquí están los cambios sugeridos:
            
            \`\`\`typescript:${path.join(this.codebasePath, 'example.ts')}
            // Código refactorizado de ejemplo
            function optimizedFunction() {
              console.log('Este es un ejemplo de código refactorizado');
            }
            \`\`\`
            
            Explicación de los cambios:
            1. Se ha mejorado la eficiencia del algoritmo
            2. Se ha reducido la complejidad ciclomática
            3. Se ha mejorado la legibilidad del código
            `;
          } catch (error) {
            this.log(`❌ Error al consultar al LLM: ${error}`, 'error');
            throw error;
          }
        }
        
        /**
         * Registra manejadores de eventos para refactorización
         */
        private registerRefactorEventHandlers(): void {
          // Manejar solicitudes de refactorización
          this.on(AgentEventType.REFACTOR_REQUESTED, async (data: any) => {
            try {
              this.log(`📥 Recibida solicitud de refactorización: ${JSON.stringify(data)}`);
              
              const { target, type } = data;
              
              if (!target) {
                this.log('❌ Falta el objetivo de refactorización', 'error');
                return;
              }
              
              // Cargar contexto del proyecto
              const coreContext = await this.loadContext('core');
              const rulesContext = await this.loadContext('rules');
              
              // Ejecutar la refactorización según el tipo
              if (type === 'pattern') {
                await this.implementPattern(target, coreContext, rulesContext);
              } else if (type === 'accessibility') {
                await this.improveAccessibility(target, coreContext, rulesContext);
              } else if (type === 'performance') {
                await this.optimizePerformance(target, coreContext, rulesContext);
              } else if (type === 'standardize') {
                await this.standardizeCode(target, coreContext, rulesContext);
              } else {
                // Refactorización general
                await this.refactorCode(target, type || 'general', coreContext, rulesContext);
              }
              
            } catch (error) {
              this.log(`❌ Error al procesar solicitud de refactorización: ${error}`, 'error');
            }
          });
          
          // Manejar sugerencias de revisión de código
          this.on(AgentEventType.CODE_REVIEW_COMPLETED, async (data: any) => {
            try {
              this.log(`📥 Recibida revisión de código: ${JSON.stringify(data)}`);
              
              const { target, suggestions, applySuggestions } = data;
              
              if (!target) {
                this.log('❌ Falta el objetivo de la revisión', 'error');
                return;
              }
              
              // Si se solicita aplicar sugerencias automáticamente
              if (applySuggestions && suggestions && suggestions.length > 0) {
                await this.applySuggestions(target, suggestions);
              } else {
                this.log('ℹ️ Revisión recibida, pero no se solicitó aplicar sugerencias automáticamente');
              }
              
            } catch (error) {
              this.log(`❌ Error al procesar revisión de código: ${error}`, 'error');
            }
          });
          
          // Manejar solicitudes de métricas
          this.on(AgentEventType.METRICS_REQUESTED, async (data: any) => {
            try {
              this.log(`📥 Recibida solicitud de métricas: ${JSON.stringify(data)}`);
              
              const { target } = data;
              
              if (!target) {
                this.log('❌ Falta el objetivo para calcular métricas', 'error');
                return;
              }
              
              // Cargar contexto del proyecto
              const coreContext = await this.loadContext('core');
              const rulesContext = await this.loadContext('rules');
              
              // Calcular métricas
              await this.calculateMetrics(target, coreContext, rulesContext);
              
            } catch (error) {
              this.log(`❌ Error al procesar solicitud de métricas: ${error}`, 'error');
            }
          });
        }
        
        /**
         * Carga un archivo de contexto
         */
        private async loadContext(contextType: string): Promise<string> {
          try {
            const contextPath = path.join(this.contextPath, `${contextType}.md`);
            
            if (fs.existsSync(contextPath)) {
              return fs.readFileSync(contextPath, 'utf-8');
            } else {
              this.log(`⚠️ Archivo de contexto no encontrado: ${contextPath}`, 'warning');
              return `# ${contextType.charAt(0).toUpperCase() + contextType.slice(1)} Context\n\nNo hay información disponible.`;
            }
          } catch (error) {
            this.log(`❌ Error al cargar contexto ${contextType}: ${error}`, 'error');
            return `# ${contextType.charAt(0).toUpperCase() + contextType.slice(1)} Context\n\nError al cargar información.`;
          }
        }
        
        /**
         * Activa o desactiva el modo dry-run
         */
        public setDryRun(enabled: boolean): void {
          this.dryRun = enabled;
          this.log(`🔧 Modo dry-run ${enabled ? 'activado' : 'desactivado'}`);
        }
        
        /**
         * Establece la ruta base del código
         */
        public setCodebasePath(path: string): void {
          if (fs.existsSync(path)) {
            this.codebasePath = path;
            this.log(`📁 Ruta base del código establecida: ${path}`);
          } else {
            this.log(`❌ Ruta no encontrada: ${path}`, 'error');
          }
        }
      }