import { readFileSync } from 'fs';
import { join } from 'path';
import { Configuration, OpenAIApi } from 'openai';
import { devmindConfig } from '../devmind.config';

// Configuración del cliente LLM
const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

/**
 * Clase base para todos los agentes de CJ.DevMind
 */
export abstract class BaseAgent {
  protected name: string;
  protected contextPath: string;
  
  constructor(name: string) {
    this.name = name;
    this.contextPath = join(__dirname, '..', 'context');
  }
  
  /**
   * Lee un archivo de contexto
   */
  protected readContext(filename: string): string {
    const path = join(this.contextPath, filename);
    try {
      return readFileSync(path, 'utf-8');
    } catch (error) {
      console.error(`Error leyendo ${path}:`, error);
      return '';
    }
  }
  
  /**
   * Ejecuta una consulta al LLM configurado
   */
  protected async queryLLM(prompt: string): Promise<string> {
    console.log(`🧠 ${this.name} consultando al LLM...`);
    
    try {
      // Usar el proveedor configurado en devmindConfig
      if (devmindConfig.llmProvider === 'openai') {
        const response = await openai.createChatCompletion({
          model: 'gpt-4',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 2000
        });
        
        return response.data.choices[0].message?.content || 'Error generando respuesta';
      } else {
        // Aquí se pueden agregar otros proveedores (Claude, Mistral, etc.)
        throw new Error(`Proveedor LLM no soportado: ${devmindConfig.llmProvider}`);
      }
    } catch (error) {
      console.error('Error consultando al LLM:', error);
      return 'Error consultando al LLM. Verifica tu configuración y API key.';
    }
  }
  
  /**
   * Método abstracto que cada agente debe implementar
   */
  abstract run(input: string): Promise<void>;
}