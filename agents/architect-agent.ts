import { readFileSync } from 'fs';
import { join } from 'path';
import { Configuration, OpenAIApi } from 'openai';
import { BaseAgent } from './base-agent';

// Configuración básica
const config = {
  contextPath: join(__dirname, '../context'),
  llmProvider: 'openai',
  apiKey: process.env.OPENAI_API_KEY
};

// Cliente OpenAI
const openai = new OpenAIApi(
  new Configuration({ apiKey: config.apiKey })
);

// Función para leer archivos de contexto
function readContext(filename: string): string {
  const path = join(config.contextPath, filename);
  try {
    return readFileSync(path, 'utf-8');
  } catch (error) {
    console.error(`Error leyendo ${path}:`, error);
    return '';
  }
}

// Architect Agent
export class ArchitectAgent extends BaseAgent {
  constructor() {
    super('Architect Agent');
  }
  
  async run(prompt: string): Promise<void> {
    // Leer contexto relevante
    const coreContext = this.readContext('core.md');
    const rulesContext = this.readContext('rules.md');
    
    // Crear prompt completo con contexto
    const fullPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Reglas Arquitectónicas
    ${rulesContext}
    
    # Tarea Actual
    Actúa como el Architect Agent de CJ.DevMind. Tu tarea es diseñar la estructura arquitectónica 
    basada en los requisitos proporcionados. Genera un blueprint detallado que incluya:
    
    1. Estructura de carpetas
    2. Componentes principales
    3. Relaciones entre módulos
    4. Decisiones arquitectónicas clave
    
    # Requisito del Usuario
    ${prompt}
    `;
    
    // Consultar al LLM
    const result = await this.queryLLM(fullPrompt);
    
    // Mostrar resultado
    console.log('\n🏗️ Blueprint Arquitectónico:\n');
    console.log(result);
  }
}

// Función auxiliar para mantener compatibilidad con código existente
export async function architectAgent(prompt: string): Promise<string> {
  const agent = new ArchitectAgent();
  await agent.run(prompt);
  return "Ejecutado con éxito"; // Para mantener la firma de la función
}