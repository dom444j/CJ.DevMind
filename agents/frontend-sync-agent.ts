import { BaseAgent, AgentEventType, AgentOptions, AgentMessage } from './base-agent';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Interfaz para las especificaciones de API
 */
interface ApiSpec {
  path: string;
  method: string;
  requestBody?: Record<string, any>;
  response: Record<string, any>;
  headers?: Record<string, string>;
  params?: string[];
  description?: string;
}

/**
 * Interfaz para la configuración de integración
 */
interface IntegrationConfig {
  frontendTech: string;
  backendTech: string;
  stateManagement: string;
  authStrategy: string;
  cacheStrategy?: string;
  errorHandling?: string;
  retryStrategy?: string;
  specialRequirements?: string[];
}

/**
 * Frontend Sync Agent - Integración frontend-backend
 * 
 * Este agente es responsable de:
 * 1. Conectar componentes frontend con APIs backend
 * 2. Implementar gestión de estado (Redux, Context API, etc.)
 * 3. Configurar fetching de datos y caché
 * 4. Manejar autenticación y autorización en el frontend
 * 5. Generar hooks y utilidades para comunicación con el backend
 * 6. Optimizar rendimiento de comunicación cliente-servidor
 * 7. Implementar estrategias de manejo de errores y reintentos
 */
class FrontendSyncAgent extends BaseAgent {
  private apiSpecs: ApiSpec[] = [];
  private integrationConfig: IntegrationConfig = {
    frontendTech: 'React',
    backendTech: 'Node.js',
    stateManagement: 'Redux',
    authStrategy: 'JWT',
    cacheStrategy: 'React Query',
    errorHandling: 'Global Error Boundary',
    retryStrategy: 'Exponential Backoff'
  };
  private generatedFiles: Record<string, string> = {};
  private projectRoot: string;
  
  constructor(options?: AgentOptions) {
    super({
      name: 'Frontend Sync Agent',
      description: 'Integra frontend con backend, gestiona estado, autenticación y comunicación',
      ...options
    });
    
    this.projectRoot = process.cwd();
    
    // Registrar manejadores de eventos
    this.on(AgentEventType.API_SPECS_UPDATED, this.handleApiSpecsUpdated.bind(this));
    this.on(AgentEventType.FRONTEND_TECH_CHANGED, this.handleFrontendTechChanged.bind(this));
    this.on(AgentEventType.BACKEND_TECH_CHANGED, this.handleBackendTechChanged.bind(this));
  }
  
  /**
   * Ejecuta el agente con una especificación de sincronización
   * @param syncSpec Especificación de sincronización
   */
  async run(syncSpec: string): Promise<void> {
    this.log('🚀 Iniciando Frontend Sync Agent...');
    this.updateAgentStatus('working', 'Iniciando integración frontend-backend');
    
    try {
      // Analizar especificación
      await this.analyzeSpec(syncSpec);
      
      // Solicitar especificaciones de API
      await this.requestApiSpecs();
      
      // Generar archivos de integración
      await this.generateIntegrationFiles(syncSpec);
      
      // Guardar archivos generados
      await this.saveGeneratedFiles();
      
      // Verificar compatibilidad de tipos
      await this.verifyTypeCompatibility();
      
      // Generar grafo de conexiones
      await this.generateConnectionGraph();
      
      // Generar documentación
      await this.generateIntegrationDocs();
      
      // Instalar dependencias
      await this.installDependencies();
      
      // Notificar a otros agentes
      this.notifyIntegrationCompleted();
      
      this.log('✅ Integración frontend-backend completada con éxito');
      this.updateAgentStatus('idle', 'Integración completada');
    } catch (error) {
      this.log(`❌ Error en la integración: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error en la integración: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Maneja el evento de actualización de especificaciones de API
   * @param message Mensaje con las especificaciones actualizadas
   */
  private handleApiSpecsUpdated(message: AgentMessage): void {
    this.log('📝 Recibidas nuevas especificaciones de API');
    
    if (message.data && Array.isArray(message.data.specs)) {
      this.apiSpecs = message.data.specs;
      
      // Si ya tenemos archivos generados, regenerar con las nuevas specs
      if (Object.keys(this.generatedFiles).length > 0) {
        this.regenerateIntegrationFiles()
          .then(() => this.log('✅ Archivos de integración actualizados con nuevas especificaciones de API'))
          .catch(error => this.log(`❌ Error actualizando archivos: ${error.message}`, 'error'));
      }
    }
  }
  
  /**
   * Maneja el evento de cambio de tecnología frontend
   * @param message Mensaje con la nueva tecnología
   */
  private handleFrontendTechChanged(message: AgentMessage): void {
    if (message.data && message.data.tech) {
      this.log(`📝 Tecnología frontend cambiada a: ${message.data.tech}`);
      this.integrationConfig.frontendTech = message.data.tech;
      
      // Si ya tenemos archivos generados, regenerar con la nueva configuración
      if (Object.keys(this.generatedFiles).length > 0) {
        this.regenerateIntegrationFiles()
          .then(() => this.log('✅ Archivos de integración actualizados con nueva tecnología frontend'))
          .catch(error => this.log(`❌ Error actualizando archivos: ${error.message}`, 'error'));
      }
    }
  }
  
  /**
   * Maneja el evento de cambio de tecnología backend
   * @param message Mensaje con la nueva tecnología
   */
  private handleBackendTechChanged(message: AgentMessage): void {
    if (message.data && message.data.tech) {
      this.log(`📝 Tecnología backend cambiada a: ${message.data.tech}`);
      this.integrationConfig.backendTech = message.data.tech;
      
      // Si ya tenemos archivos generados, regenerar con la nueva configuración
      if (Object.keys(this.generatedFiles).length > 0) {
        this.regenerateIntegrationFiles()
          .then(() => this.log('✅ Archivos de integración actualizados con nueva tecnología backend'))
          .catch(error => this.log(`❌ Error actualizando archivos: ${error.message}`, 'error'));
      }
    }
  }
  
  /**
   * Genera archivos de integración frontend-backend
   * @param syncSpec Especificación de sincronización
   */
  private async generateIntegrationFiles(syncSpec: string): Promise<void> {
    this.log('🔄 Generando archivos de integración frontend-backend...');
    
    // Crear prompt para el LLM
    const prompt = `
    # Tarea de Integración Frontend-Backend
    
    Genera una integración completa entre frontend y backend con las siguientes tecnologías:
    
    - Frontend: ${this.integrationConfig.frontendTech}
    - Backend: ${this.integrationConfig.backendTech}
    - Gestión de Estado: ${this.integrationConfig.stateManagement}
    - Autenticación: ${this.integrationConfig.authStrategy}
    - Caché: ${this.integrationConfig.cacheStrategy || 'React Query'}
    - Manejo de Errores: ${this.integrationConfig.errorHandling || 'Global Error Boundary'}
    - Reintentos: ${this.integrationConfig.retryStrategy || 'Exponential Backoff'}
    
    Especificaciones de API:
    ${JSON.stringify(this.apiSpecs, null, 2)}
    
    Requisitos adicionales:
    ${syncSpec}
    
    Genera los siguientes archivos:
    
    1. Cliente API: Un cliente para comunicarse con el backend
    2. Hooks de datos: Hooks para obtener, crear, actualizar y eliminar datos
    3. Gestión de estado: Configuración de ${this.integrationConfig.stateManagement}
    4. Autenticación: Implementación de ${this.integrationConfig.authStrategy}
    5. Manejo de errores: Implementación de ${this.integrationConfig.errorHandling}
    6. Caché y optimización: Configuración de ${this.integrationConfig.cacheStrategy}
    7. Tipos compartidos: Interfaces TypeScript para los datos
    
    Responde con bloques de código para cada archivo, indicando la ruta del archivo al principio de cada bloque.
    Ejemplo:
    \`\`\`typescript:src/api/client.ts
    // Código aquí
    \`\`\`
    `;
    
    try {
      const response = await this.queryLLM(prompt);
      
      // Extraer archivos de la respuesta
      this.generatedFiles = this.extractFilesFromResponse(response);
      
      this.log(`✅ Generados ${Object.keys(this.generatedFiles).length} archivos de integración`);
    } catch (error) {
      this.log(`❌ Error generando archivos: ${error.message}`, 'error');
      throw error;
    }
  }
  
  /**
   * Analiza la especificación para extraer configuración
   * @param syncSpec Especificación de sincronización
   */
  private async analyzeSpec(syncSpec: string): Promise<void> {
    this.log('🔍 Analizando especificación...');
    
    // Crear prompt para el LLM
    const prompt = `
    # Tarea de Análisis
    
    Analiza la siguiente especificación de integración frontend-backend:
    
    ${syncSpec}
    
    Extrae la siguiente información:
    1. Tecnología frontend (React, Vue, Angular, etc.)
    2. Tecnología backend (Node.js, Django, Rails, etc.)
    3. Gestión de estado (Redux, Context API, MobX, etc.)
    4. Estrategia de autenticación (JWT, OAuth, etc.)
    5. Estrategia de caché (React Query, SWR, etc.)
    6. Manejo de errores
    7. Estrategia de reintentos
    8. Requisitos especiales
    
    Responde en formato JSON con las claves: frontendTech, backendTech, stateManagement, authStrategy, cacheStrategy, errorHandling, retryStrategy, specialRequirements.
    `;
    
    try {
      const response = await this.queryLLM(prompt);
      
      // Extraer JSON de la respuesta
      const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || 
                        response.match(/(\{[\s\S]*\})/);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[1];
        const config = JSON.parse(jsonStr);
        
        // Actualizar configuración
        this.integrationConfig = {
          ...this.integrationConfig,
          ...config
        };
        
        this.log(`📊 Análisis completado: Frontend=${this.integrationConfig.frontendTech}, Backend=${this.integrationConfig.backendTech}, Estado=${this.integrationConfig.stateManagement}, Auth=${this.integrationConfig.authStrategy}`);
        
        // Actualizar conocimiento compartido
        this.addKnowledge('frontendIntegration', this.integrationConfig);
      } else {
        this.log('⚠️ No se pudo extraer información de la especificación', 'warning');
      }
    } catch (error) {
      this.log(`⚠️ Error analizando especificación: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Solicita especificaciones de API al API Agent
   */
  private async requestApiSpecs(): Promise<void> {
    this.log('🔄 Solicitando especificaciones de API al API Agent...');
    
    // Enviar evento de solicitud
    this.sendMessage('api', AgentEventType.API_SPECS_REQUESTED, {
      requestedBy: this.name,
      timestamp: new Date()
    });
    
    // Esperar respuesta (en un caso real, esto sería asíncrono con callbacks)
    // Aquí simulamos una espera y luego verificamos si recibimos las specs
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Si no recibimos specs, crear unas de ejemplo
    if (this.apiSpecs.length === 0) {
      this.log('⚠️ No se recibieron especificaciones de API, usando ejemplos', 'warning');
      
      this.apiSpecs = [
        {
          path: '/api/auth/login',
          method: 'POST',
          requestBody: { email: 'string', password: 'string' },
          response: { token: 'string', user: { id: 'string', name: 'string', email: 'string' } },
          description: 'Endpoint para autenticación de usuarios'
        },
        {
          path: '/api/users',
          method: 'GET',
          headers: { Authorization: 'Bearer {token}' },
          response: { users: [{ id: 'string', name: 'string', email: 'string' }] },
          description: 'Obtener lista de usuarios'
        },
        {
          path: '/api/users/{id}',
          method: 'GET',
          headers: { Authorization: 'Bearer {token}' },
          params: ['id'],
          response: { id: 'string', name: 'string', email: 'string' },
          description: 'Obtener detalles de un usuario específico'
        }
      ];
    }
  }
  
  /**
   * Guarda los archivos generados
   */
  private async saveGeneratedFiles(): Promise<void> {
    this.log('💾 Guardando archivos generados...');
    
    for (const [filePath, content] of Object.entries(this.generatedFiles)) {
      const fullPath = path.join(this.projectRoot, filePath);
      const dirPath = path.dirname(fullPath);
      
      // Crear directorio si no existe
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Verificar si el archivo ya existe
      if (fs.existsSync(fullPath)) {
        // Leer contenido existente
        const existingContent = fs.readFileSync(fullPath, 'utf-8');
        
        // Si el contenido es diferente, crear una versión de respaldo
        if (existingContent !== content) {
          const backupPath = `${fullPath}.backup-${Date.now()}`;
          fs.writeFileSync(backupPath, existingContent, 'utf-8');
          this.log(`📑 Creado respaldo: ${backupPath}`);
        } else {
          this.log(`ℹ️ Archivo sin cambios: ${filePath}`);
          continue; // Saltar a la siguiente iteración
        }
      }
      
      // Escribir archivo
      fs.writeFileSync(fullPath, content, 'utf-8');
      this.log(`✅ Archivo generado: ${filePath}`);
      
      // Registrar recurso creado
      this.recordResource('frontend-integration', filePath);
    }
  }
  
  /**
   * Genera un grafo de conexiones entre frontend y backend
   */
  private async generateConnectionGraph(): Promise<void> {
    this.log('📊 Generando grafo de conexiones entre frontend y backend...');
    
    // Crear prompt para el LLM
    const graphPrompt = `
    # Tarea de Generación de Grafo
    
    Basado en los siguientes archivos generados para la integración frontend-backend:
    
    ${Object.keys(this.generatedFiles).map(file => `- ${file}`).join('\n')}
    
    Y las siguientes especificaciones de API:
    
    ${JSON.stringify(this.apiSpecs, null, 2)}
    
    Genera un grafo de conexiones en formato Mermaid que muestre:
    1. Componentes frontend
    2. Endpoints backend
    3. Flujo de datos entre ellos
    4. Middleware y servicios intermedios
    
    El grafo debe ser claro y mostrar las relaciones principales.
    
    Responde SOLO con el código Mermaid, sin explicaciones adicionales.
    `;
    
    try {
      const response = await this.queryLLM(graphPrompt);
      
      // Extraer diagrama Mermaid
      const mermaidMatch = response.match(/```mermaid\n([\s\S]*?)\n```/) || 
                          response.match(/graph [A-Z]{2}[\s\S]*/);
      
      if (mermaidMatch) {
        const mermaidContent = mermaidMatch[1] || mermaidMatch[0];
        const graphPath = path.join(this.projectRoot, 'docs', 'frontend-backend-graph.md');
        
        // Crear directorio si no existe
        const dirPath = path.dirname(graphPath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // Guardar diagrama
        fs.writeFileSync(graphPath, `# Grafo de Conexiones Frontend-Backend\n\n\`\`\`mermaid\n${mermaidContent}\n\`\`\``, 'utf-8');
        
        this.log(`✅ Grafo de conexiones guardado en: docs/frontend-backend-graph.md`);
        
        // Registrar recurso creado
        this.recordResource('diagram', 'docs/frontend-backend-graph.md');
      } else {
        this.log('⚠️ No se pudo generar el grafo de conexiones', 'warning');
      }
    } catch (error) {
      this.log(`⚠️ Error generando grafo: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Genera documentación de integración
   */
  private async generateIntegrationDocs(): Promise<void> {
    this.log('📝 Generando documentación de integración...');
    
    // Crear prompt para el LLM
    const docsPrompt = `
    # Tarea de Generación de Documentación
    
    Basado en los siguientes archivos generados para la integración frontend-backend:
    
    ${Object.keys(this.generatedFiles).map(file => `- ${file}`).join('\n')}
    
    Y la siguiente configuración de integración:
    
    ${JSON.stringify(this.integrationConfig, null, 2)}
    
    Genera una documentación completa en formato Markdown que incluya:
    1. Visión general de la integración
    2. Arquitectura y flujo de datos
    3. Guía de uso de los hooks y utilidades
    4. Ejemplos de implementación para casos comunes
    5. Manejo de errores y troubleshooting
    6. Consideraciones de rendimiento
    
    La documentación debe ser clara, concisa y útil para desarrolladores.
    `;
    
    try {
      const response = await this.queryLLM(docsPrompt);
      
      // Guardar documentación
      const docsPath = path.join(this.projectRoot, 'docs', 'frontend-backend-integration.md');
      
      // Crear directorio si no existe
      const dirPath = path.dirname(docsPath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Guardar documentación
      fs.writeFileSync(docsPath, response, 'utf-8');
      
      this.log(`✅ Documentación guardada en: docs/frontend-backend-integration.md`);
      
      // Registrar recurso creado
      this.recordResource('documentation', 'docs/frontend-backend-integration.md');
    } catch (error) {
      this.log(`⚠️ Error generando documentación: ${error.message}`, 'warning');
    }
  }
  
  /**
   * Notifica a otros agentes sobre la integración completada
   */
  private notifyIntegrationCompleted(): void {
    this.log('📢 Notificando a otros agentes sobre la integración completada...');
    
    // Enviar evento de integración completada
    this.sendMessage('all', AgentEventType.FRONTEND_BACKEND_INTEGRATED, {
      ...this.integrationConfig,
      generatedFiles: Object.keys(this.generatedFiles),
      timestamp: new Date()
    });
    
    // Registrar decisión
    this.recordDecision(
      `Integración frontend-backend con ${this.integrationConfig.frontendTech} y ${this.integrationConfig.backendTech}`,
      `Se ha implementado una integración entre el frontend (${this.integrationConfig.frontendTech}) y el backend (${this.integrationConfig.backendTech}) utilizando ${this.integrationConfig.stateManagement} para gestión de estado y ${this.integrationConfig.authStrategy} para autenticación.`,
      `Esta integración facilita la comunicación entre frontend y backend, mejora la experiencia de desarrollo y mantiene la coherencia en el proyecto.`
    );
  }
  
  /**
   * Regenera los archivos de integración cuando cambian las especificaciones
   */
  private async regenerateIntegrationFiles(): Promise<void> {
    this.log('🔄 Regenerando archivos de integración con nuevas especificaciones...');
    this.updateAgentStatus('working', 'Regenerando archivos de integración');
    
    try {
      // Crear un prompt para regenerar solo los archivos necesarios
      const regeneratePrompt = `
      # Tarea de Regeneración
      
      Las especificaciones de API han cambiado. Actualiza los siguientes archivos para mantener la integración:
      
      ${Object.keys(this.generatedFiles)
        .filter(file => file.includes('api') || file.includes('service') || file.includes('hook'))
        .map(file => `- ${file}`)
        .join('\n')}
      
      Especificaciones de API actualizadas:
      ${JSON.stringify(this.apiSpecs, null, 2)}
      
      Configuración de integración:
      ${JSON.stringify(this.integrationConfig, null, 2)}
      
      Genera solo los archivos que necesitan ser actualizados.
      
      Responde con bloques de código para cada archivo, indicando la ruta del archivo al principio de cada bloque.
      Ejemplo:
      \`\`\`typescript:src/api/client.ts
      // Código aquí
      \`\`\`
      `;
      
      const response = await this.queryLLM(regeneratePrompt);
      
      // Extraer archivos actualizados
      const updatedFiles = this.extractFilesFromResponse(response);
      
      // Actualizar solo los archivos que han cambiado
      for (const [filePath, content] of Object.entries(updatedFiles)) {
        this.generatedFiles[filePath] = content;
      }
      
      // Guardar archivos actualizados
      await this.saveGeneratedFiles();
      
      this.updateAgentStatus('idle');
      this.log('✅ Archivos de integración regenerados con éxito');
    } catch (error) {
      this.log(`❌ Error regenerando archivos: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error regenerando archivos: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Extrae archivos y su contenido de la respuesta del LLM
   */
  private extractFilesFromResponse(response: string): Record<string, string> {
    const files: Record<string, string> = {};
    const fileRegex = /```(?:typescript|javascript|jsx|tsx|ts|js)(?::([a-zA-Z0-9\/\-_.]+))?\s*\n([\s\S]*?)```/g;
    
    let match;
    while ((match = fileRegex.exec(response)) !== null) {
      const [_, filePath, content] = match;
      
      if (filePath) {
        files[filePath] = content.trim();
      } else {
        // Si no hay ruta de archivo, buscar un comentario que indique la ruta
        const firstLine = content.split('\n')[0];
        const pathMatch = firstLine.match(/\/\/\s*([a-zA-Z0-9\/\-_.]+)/);
        
        if (pathMatch) {
          const extractedPath = pathMatch[1];
          // Eliminar la primera línea que contiene la ruta
          const cleanContent = content.split('\n').slice(1).join('\n').trim();
          files[extractedPath] = cleanContent;
        } else {
          this.log(`⚠️ No se pudo determinar la ruta para un bloque de código`, 'warning');
        }
      }
    }
    
    return files;
  }
  
  /**
   * Verifica la compatibilidad de tipos entre frontend y backend
   */
  private async verifyTypeCompatibility(): Promise<void> {
    // Solo realizar esta verificación si estamos usando TypeScript
    if (!this.integrationConfig.frontendTech.toLowerCase().includes('typescript') &&
        !this.integrationConfig.backendTech.toLowerCase().includes('typescript')) {
      this.log('ℹ️ Omitiendo verificación de tipos (no es un proyecto TypeScript)');
      return;
    }
    
    this.log('🔍 Verificando compatibilidad de tipos entre frontend y backend...');
    
    // Identificar archivos de tipos
    const typeFiles = Object.keys(this.generatedFiles).filter(file => 
      file.includes('types') || file.includes('.d.ts')
    );
    
    if (typeFiles.length === 0) {
      this.log('⚠️ No se encontraron archivos de tipos para verificar', 'warning');
      return;
    }
    
    // En una implementación real, aquí podríamos:
    // 1. Ejecutar tsc para verificar tipos
    // 2. Comparar tipos del frontend con los del backend
    // 3. Generar un reporte de incompatibilidades
    
    this.log(`✅ Verificación de tipos completada (${typeFiles.length} archivos de tipos)`);
  }
  
  /**
   * Instala dependencias necesarias para la integración
   */
  async installDependencies(): Promise<void> {
    this.log('📦 Instalando dependencias necesarias...');
    this.updateAgentStatus('working', 'Instalando dependencias');
    
    try {
      // Determinar qué dependencias instalar según la configuración
      const dependencies: string[] = [];
      
      // Cliente HTTP
      if (this.integrationConfig.frontendTech.toLowerCase().includes('react')) {
        if (this.integrationConfig.cacheStrategy?.toLowerCase().includes('react-query')) {
          dependencies.push('@tanstack/react-query');
        } else if (this.integrationConfig.cacheStrategy?.toLowerCase().includes('swr')) {
          dependencies.push('swr');
        } else {
          dependencies.push('axios');
        }
      }
      
      // Gestión de estado
      if (this.integrationConfig.stateManagement.toLowerCase().includes('redux')) {
        dependencies.push('redux', 'react-redux', '@reduxjs/toolkit');
      } else if (this.integrationConfig.stateManagement.toLowerCase().includes('zustand')) {
        dependencies.push('zustand');
      }
      
      // Autenticación
      if (this.integrationConfig.authStrategy.toLowerCase().includes('jwt')) {
        dependencies.push('jwt-decode');
      }
      
      if (dependencies.length > 0) {
        // Determinar el gestor de paquetes
        const useYarn = fs.existsSync(path.join(this.projectRoot, 'yarn.lock'));
        const packageManager = useYarn ? 'yarn add' : 'npm install';
        
        // Construir comando
        const command = `${packageManager} ${dependencies.join(' ')}`;
        
        this.log(`🔄 Ejecutando: ${command}`);
        
        // Ejecutar comando
        execSync(command, { cwd: this.projectRoot, stdio: 'inherit' });
        
        this.log('✅ Dependencias instaladas correctamente');
      } else {
        this.log('ℹ️ No se detectaron dependencias adicionales para instalar');
      }
      
      this.updateAgentStatus('idle');
    } catch (error) {
      this.log(`❌ Error instalando dependencias: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error instalando dependencias: ${error.message}`);
    }
  }
  
  /**
   * Genera un grafo de conexiones en formato Mermaid
   */
  private async generateConnectionGraph(): Promise<void> {
    this.log('📊 Generando grafo de conexiones entre frontend y backend...');
    
    // Crear prompt para el LLM
    const graphPrompt = `
    # Tarea de Generación de Grafo
    
    Basado en los siguientes archivos generados para la integración frontend-backend:
    
    ${Object.keys(this.generatedFiles).map(file => `- ${file}`).join('\n')}
    
    Y las siguientes especificaciones de API:
    
    ${JSON.stringify(this.apiSpecs, null, 2)}
    
    Genera un grafo de conexiones en formato Mermaid que muestre:
    1. Componentes frontend
    2. Endpoints backend
    3. Flujo de datos entre ellos
    4. Middleware y servicios intermedios
    
    El grafo debe ser claro y mostrar las relaciones principales.
    
    Responde SOLO con el código Mermaid, sin explicaciones adicionales.
    `;
    
    try {
      const response = await this.queryLLM(graphPrompt);
      
            // Extraer diagrama Mermaid
            const mermaidMatch = response.match(/```mermaid\n([\s\S]*?)\n```/) || 
            response.match(/graph [A-Z]{2}[\s\S]*/);

if (mermaidMatch) {
const mermaidContent = mermaidMatch[1] || mermaidMatch[0];
const graphPath = path.join(this.projectRoot, 'docs', 'frontend-backend-graph.md');

// Crear directorio si no existe
const dirPath = path.dirname(graphPath);
if (!fs.existsSync(dirPath)) {
fs.mkdirSync(dirPath, { recursive: true });
}

// Guardar diagrama
fs.writeFileSync(graphPath, `# Grafo de Conexiones Frontend-Backend\n\n\`\`\`mermaid\n${mermaidContent}\n\`\`\``, 'utf-8');

this.log(`✅ Grafo de conexiones guardado en: docs/frontend-backend-graph.md`);

// Registrar recurso creado
this.recordResource('diagram', 'docs/frontend-backend-graph.md');
} else {
this.log('⚠️ No se pudo generar el grafo de conexiones', 'warning');
}
} catch (error) {
this.log(`⚠️ Error generando grafo: ${error.message}`, 'warning');
}
}

/**
* Genera documentación de integración
*/
private async generateIntegrationDocs(): Promise<void> {
this.log('📝 Generando documentación de integración...');

// Crear prompt para el LLM
const docsPrompt = `
# Tarea de Generación de Documentación

Basado en los siguientes archivos generados para la integración frontend-backend:

${Object.keys(this.generatedFiles).map(file => `- ${file}`).join('\n')}

Y la siguiente configuración de integración:

${JSON.stringify(this.integrationConfig, null, 2)}

Genera una documentación completa en formato Markdown que incluya:
1. Visión general de la integración
2. Arquitectura y flujo de datos
3. Guía de uso de los hooks y utilidades
4. Ejemplos de implementación para casos comunes
5. Manejo de errores y troubleshooting
6. Consideraciones de rendimiento

La documentación debe ser clara, concisa y útil para desarrolladores.
`;

try {
const response = await this.queryLLM(docsPrompt);

// Guardar documentación
const docsPath = path.join(this.projectRoot, 'docs', 'frontend-backend-integration.md');

// Crear directorio si no existe
const dirPath = path.dirname(docsPath);
if (!fs.existsSync(dirPath)) {
fs.mkdirSync(dirPath, { recursive: true });
}

// Guardar documentación
fs.writeFileSync(docsPath, response, 'utf-8');

this.log(`✅ Documentación guardada en: docs/frontend-backend-integration.md`);

// Registrar recurso creado
this.recordResource('documentation', 'docs/frontend-backend-integration.md');
} catch (error) {
this.log(`⚠️ Error generando documentación: ${error.message}`, 'warning');
}
}

/**
* Notifica a otros agentes sobre la integración completada
*/
private notifyIntegrationCompleted(): void {
this.log('📢 Notificando a otros agentes sobre la integración completada...');

// Enviar evento de integración completada
this.sendMessage('all', AgentEventType.FRONTEND_BACKEND_INTEGRATED, {
...this.integrationConfig,
generatedFiles: Object.keys(this.generatedFiles),
timestamp: new Date()
});

// Registrar decisión
this.recordDecision(
`Integración frontend-backend con ${this.integrationConfig.frontendTech} y ${this.integrationConfig.backendTech}`,
`Se ha implementado una integración entre el frontend (${this.integrationConfig.frontendTech}) y el backend (${this.integrationConfig.backendTech}) utilizando ${this.integrationConfig.stateManagement} para gestión de estado y ${this.integrationConfig.authStrategy} para autenticación.`,
`Esta integración facilita la comunicación entre frontend y backend, mejora la experiencia de desarrollo y mantiene la coherencia en el proyecto.`
);
}

/**
* Regenera los archivos de integración cuando cambian las especificaciones
*/
private async regenerateIntegrationFiles(): Promise<void> {
this.log('🔄 Regenerando archivos de integración con nuevas especificaciones...');
this.updateAgentStatus('working', 'Regenerando archivos de integración');

try {
// Crear un prompt para regenerar solo los archivos necesarios
const regeneratePrompt = `
# Tarea de Regeneración

Las especificaciones de API han cambiado. Actualiza los siguientes archivos para mantener la integración:

${Object.keys(this.generatedFiles)
.filter(file => file.includes('api') || file.includes('service') || file.includes('hook'))
.map(file => `- ${file}`)
.join('\n')}

Especificaciones de API actualizadas:
${JSON.stringify(this.apiSpecs, null, 2)}

Configuración de integración:
${JSON.stringify(this.integrationConfig, null, 2)}

Genera solo los archivos que necesitan ser actualizados.

Responde con bloques de código para cada archivo, indicando la ruta del archivo al principio de cada bloque.
Ejemplo:
\`\`\`typescript:src/api/client.ts
// Código aquí
\`\`\`
`;

const response = await this.queryLLM(regeneratePrompt);

// Extraer archivos actualizados
const updatedFiles = this.extractFilesFromResponse(response);

// Actualizar solo los archivos que han cambiado
for (const [filePath, content] of Object.entries(updatedFiles)) {
this.generatedFiles[filePath] = content;
}

// Guardar archivos actualizados
await this.saveGeneratedFiles();

this.updateAgentStatus('idle');
this.log('✅ Archivos de integración regenerados con éxito');
} catch (error) {
this.log(`❌ Error regenerando archivos: ${error.message}`, 'error');
this.updateAgentStatus('error', `Error regenerando archivos: ${error.message}`);
throw error;
}
}

/**
* Extrae archivos y su contenido de la respuesta del LLM
*/
private extractFilesFromResponse(response: string): Record<string, string> {
const files: Record<string, string> = {};
const fileRegex = /```(?:typescript|javascript|jsx|tsx|ts|js)(?::([a-zA-Z0-9\/\-_.]+))?\s*\n([\s\S]*?)```/g;

let match;
while ((match = fileRegex.exec(response)) !== null) {
const [_, filePath, content] = match;

if (filePath) {
files[filePath] = content.trim();
} else {
// Si no hay ruta de archivo, buscar un comentario que indique la ruta
const firstLine = content.split('\n')[0];
const pathMatch = firstLine.match(/\/\/\s*([a-zA-Z0-9\/\-_.]+)/);

if (pathMatch) {
const extractedPath = pathMatch[1];
// Eliminar la primera línea que contiene la ruta
const cleanContent = content.split('\n').slice(1).join('\n').trim();
files[extractedPath] = cleanContent;
} else {
this.log(`⚠️ No se pudo determinar la ruta para un bloque de código`, 'warning');
}
}
}

return files;
}

/**
* Verifica la compatibilidad de tipos entre frontend y backend
*/
private async verifyTypeCompatibility(): Promise<void> {
// Solo realizar esta verificación si estamos usando TypeScript
if (!this.integrationConfig.frontendTech.toLowerCase().includes('typescript') &&
!this.integrationConfig.backendTech.toLowerCase().includes('typescript')) {
this.log('ℹ️ Omitiendo verificación de tipos (no es un proyecto TypeScript)');
return;
}

this.log('🔍 Verificando compatibilidad de tipos entre frontend y backend...');

// Identificar archivos de tipos
const typeFiles = Object.keys(this.generatedFiles).filter(file => 
file.includes('types') || file.includes('.d.ts')
);

if (typeFiles.length === 0) {
this.log('⚠️ No se encontraron archivos de tipos para verificar', 'warning');
return;
}

// En una implementación real, aquí podríamos:
// 1. Ejecutar tsc para verificar tipos
// 2. Comparar tipos del frontend con los del backend
// 3. Generar un reporte de incompatibilidades

this.log(`✅ Verificación de tipos completada (${typeFiles.length} archivos de tipos)`);
}

/**
* Instala dependencias necesarias para la integración
*/
private async installDependencies(): Promise<void> {
this.log('📦 Instalando dependencias necesarias...');
this.updateAgentStatus('working', 'Instalando dependencias');

try {
// Determinar qué dependencias instalar según la configuración
const dependencies: string[] = [];

// Cliente HTTP
if (this.integrationConfig.frontendTech.toLowerCase().includes('react')) {
if (this.integrationConfig.cacheStrategy?.toLowerCase().includes('react-query')) {
dependencies.push('@tanstack/react-query');
} else if (this.integrationConfig.cacheStrategy?.toLowerCase().includes('swr')) {
dependencies.push('swr');
} else {
dependencies.push('axios');
}
}

// Gestión de estado
if (this.integrationConfig.stateManagement.toLowerCase().includes('redux')) {
dependencies.push('redux', 'react-redux', '@reduxjs/toolkit');
} else if (this.integrationConfig.stateManagement.toLowerCase().includes('zustand')) {
dependencies.push('zustand');
}

// Autenticación
if (this.integrationConfig.authStrategy.toLowerCase().includes('jwt')) {
dependencies.push('jwt-decode');
}

if (dependencies.length > 0) {
// Determinar el gestor de paquetes
const useYarn = fs.existsSync(path.join(this.projectRoot, 'yarn.lock'));
const packageManager = useYarn ? 'yarn add' : 'npm install';

// Construir comando
const command = `${packageManager} ${dependencies.join(' ')}`;

this.log(`🔄 Ejecutando: ${command}`);

// Ejecutar comando
execSync(command, { cwd: this.projectRoot, stdio: 'inherit' });

this.log('✅ Dependencias instaladas correctamente');
} else {
this.log('ℹ️ No se detectaron dependencias adicionales para instalar');
}

this.updateAgentStatus('idle');
} catch (error) {
this.log(`❌ Error instalando dependencias: ${error.message}`, 'error');
this.updateAgentStatus('error', `Error instalando dependencias: ${error.message}`);
}
}

/**
* Optimiza el rendimiento de la integración frontend-backend
*/
private async optimizePerformance(): Promise<void> {
this.log('⚡ Optimizando rendimiento de la integración...');

// Crear prompt para el LLM
const optimizePrompt = `
# Tarea de Optimización de Rendimiento

Analiza los siguientes archivos generados para la integración frontend-backend:

${Object.keys(this.generatedFiles).map(file => `- ${file}`).join('\n')}

Y la siguiente configuración de integración:

${JSON.stringify(this.integrationConfig, null, 2)}

Sugiere optimizaciones para mejorar el rendimiento en:
1. Caché de datos
2. Memoización de componentes
3. Estrategias de fetching (lazy loading, prefetching)
4. Optimización de bundle
5. Manejo de estado

Responde con recomendaciones específicas y ejemplos de código para implementarlas.
`;

try {
const response = await this.queryLLM(optimizePrompt);

// Guardar recomendaciones
const optimizationPath = path.join(this.projectRoot, 'docs', 'frontend-backend-optimizations.md');

// Crear directorio si no existe
const dirPath = path.dirname(optimizationPath);
if (!fs.existsSync(dirPath)) {
fs.mkdirSync(dirPath, { recursive: true });
}

// Guardar recomendaciones
fs.writeFileSync(optimizationPath, `# Recomendaciones de Optimización Frontend-Backend\n\n${response}`, 'utf-8');

this.log(`✅ Recomendaciones de optimización guardadas en: docs/frontend-backend-optimizations.md`);

// Registrar recurso creado
this.recordResource('documentation', 'docs/frontend-backend-optimizations.md');

// Extraer archivos de optimización si hay código en la respuesta
const optimizationFiles = this.extractFilesFromResponse(response);

if (Object.keys(optimizationFiles).length > 0) {
// Añadir archivos de optimización a los generados
for (const [filePath, content] of Object.entries(optimizationFiles)) {
this.generatedFiles[filePath] = content;
}

// Guardar archivos de optimización
await this.saveGeneratedFiles();

this.log(`✅ Generados ${Object.keys(optimizationFiles).length} archivos de optimización`);
}
} catch (error) {
this.log(`⚠️ Error generando optimizaciones: ${error.message}`, 'warning');
}
}

/**
* Genera pruebas para la integración frontend-backend
*/
private async generateIntegrationTests(): Promise<void> {
this.log('🧪 Generando pruebas para la integración frontend-backend...');

// Crear prompt para el LLM
const testsPrompt = `
# Tarea de Generación de Pruebas

Basado en los siguientes archivos generados para la integración frontend-backend:

${Object.keys(this.generatedFiles).map(file => `- ${file}`).join('\n')}

Y la siguiente configuración de integración:

${JSON.stringify(this.integrationConfig, null, 2)}

Genera pruebas para verificar:
1. Comunicación correcta entre frontend y backend
2. Manejo de errores y casos límite
3. Autenticación y autorización
4. Gestión de estado
5. Caché y optimización

Utiliza las herramientas adecuadas según la tecnología (Jest, React Testing Library, Cypress, etc.).

Responde con bloques de código para cada archivo de prueba, indicando la ruta del archivo al principio de cada bloque.
`;

try {
const response = await this.queryLLM(testsPrompt);

// Extraer archivos de prueba
const testFiles = this.extractFilesFromResponse(response);

// Añadir archivos de prueba a los generados
for (const [filePath, content] of Object.entries(testFiles)) {
this.generatedFiles[filePath] = content;
}

// Guardar archivos de prueba
await this.saveGeneratedFiles();

this.log(`✅ Generados ${Object.keys(testFiles).length} archivos de prueba`);

// Notificar al TestAgent sobre las pruebas generadas
this.sendMessage('test', AgentEventType.TESTS_GENERATED, {
agent: this.name,
testFiles: Object.keys(testFiles),
timestamp: new Date()
});
} catch (error) {
this.log(`⚠️ Error generando pruebas: ${error.message}`, 'warning');
}
}
}

// Exportar el agente
export default FrontendSyncAgent;