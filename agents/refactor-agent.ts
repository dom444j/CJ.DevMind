import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';

export class RefactorAgent extends BaseAgent {
  constructor() {
    super('Refactor Agent');
  }
  
  async run(task: string): Promise<void> {
    // Leer contexto
    const context = this.readContext('core.md');
    const rules = this.readContext('rules.md');
    
    console.log("📚 Cargando contexto...");
    console.log(context.slice(0, 300) + "...");
    console.log("🛠️ Ejecutando tarea:", task);
    
    // Preparar el prompt para el LLM
    const fullPrompt = `
    # Contexto del Proyecto
    ${context}
    
    # Reglas Arquitectónicas
    ${rules}
    
    # Tarea de Refactorización
    Actúa como el Refactor Agent de CJ.DevMind. Tu tarea es analizar y refactorizar 
    el código según las reglas del proyecto. La tarea específica es:
    
    ${task}
    
    Proporciona un plan detallado de refactorización que incluya:
    1. Archivos que deben modificarse
    2. Cambios específicos a realizar
    3. Justificación de los cambios
    `;
    
    // En modo real, consultaríamos al LLM
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      const result = await this.queryLLM(fullPrompt);
      console.log(result);
    } else {
      // Modo simulación para desarrollo
      console.log("🔍 Explorando para refactorización...");
      if (task.includes("dashboard")) {
        console.log("🔍 Explorando dashboard para componentes duplicados...");
        // Aquí podrías listar archivos, buscar duplicados, etc.
      }
      console.log("✅ Refactorización completada (simulada)");
    }
  }
}

// Función auxiliar para mantener compatibilidad
export async function runRefactorAgent(task: string): Promise<void> {
  const agent = new RefactorAgent();
  await agent.run(task);
}
