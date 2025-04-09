import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';

/**
 * Frontend Sync Agent - Integración frontend-backend
 * 
 * Este agente es responsable de:
 * 1. Conectar componentes frontend con APIs backend
 * 2. Implementar gestión de estado (Redux, Context API, etc.)
 * 3. Configurar fetching de datos y caché
 * 4. Manejar autenticación y autorización en el frontend
 * 5. Generar hooks y utilidades para comunicación con el backend
 */
export class FrontendSyncAgent extends BaseAgent {
  constructor() {
    super('Frontend Sync Agent');
  }
  
  /**
   * Ejecuta el Frontend Sync Agent para integrar frontend y backend
   * @param syncSpec Especificación de la integración
   */
  async run(syncSpec: string): Promise<void> {
    console.log(`🔄 Frontend Sync Agent integrando frontend-backend para: "${syncSpec}"`);
    
    // Leer contexto relevante
    const coreContext = this.readContext('core.md');
    const frontendContext = this.readContext('frontend.md');
    const backendContext = this.readContext('backend.md');
    
    // Crear prompt para el LLM
    const syncPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Contexto Frontend
    ${frontendContext}
    
    # Contexto Backend
    ${backendContext}
    
    # Tarea de Frontend Sync Agent
    Actúa como el Frontend Sync Agent de CJ.DevMind. Tu tarea es integrar el frontend con el backend basado en la siguiente especificación:
    
    "${syncSpec}"
    
    Genera:
    1. Configuración de cliente HTTP (Axios, Fetch API, etc.)
    2. Hooks personalizados para consumir APIs
    3. Gestión de estado (Redux, Context API, etc.)
    4. Manejo de autenticación en el frontend
    5. Estrategias de caché y optimización de peticiones
    6. Manejo de errores y estados de carga
    
    La integración debe ser coherente con la arquitectura del proyecto y seguir las mejores prácticas.
    `;
    
    try {
      // Consultar al LLM
      const response = await this.queryLLM(syncPrompt);
      
      // Analizar la respuesta para extraer código y configuraciones
      const files = this.extractFilesFromResponse(response);
      
      // Guardar archivos generados
      for (const [filePath, content] of Object.entries(files)) {
        const fullPath = path.join(process.cwd(), filePath);
        const dirPath = path.dirname(fullPath);
        
        // Crear directorio si no existe
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        
        // Escribir archivo
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`✅ Archivo generado: ${filePath}`);
      }
      
      // Generar grafo de conexiones
      console.log('📊 Generando grafo de conexiones entre frontend y backend...');
      
      console.log('✅ Integración frontend-backend completada con éxito');
    } catch (error) {
      console.error('❌ Error al integrar frontend-backend:', error);
      throw error;
    }
  }
  
  /**
   * Extrae archivos y su contenido de la respuesta del LLM
   */
  private extractFilesFromResponse(response: string): Record<string, string> {
    const files: Record<string, string> = {};
    const fileRegex = /```(?:typescript|javascript|jsx|tsx)\s*(?:\/\/\s*)?([a-zA-Z0-9\/\-_.]+)\s*\n([\s\S]*?)```/g;
    
    let match;
    while ((match = fileRegex.exec(response)) !== null) {
      const [_, filePath, content] = match;
      files[filePath] = content.trim();
    }
    
    return files;
  }
}