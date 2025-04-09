import { BaseAgent } from './base-agent';
import { ArchitectAgent } from './architect-agent';
import { VisionAgent } from './vision-agent';
import { RefactorAgent } from './refactor-agent';
import { DocAgent } from './doc-agent';
import fs from 'fs';
import path from 'path';

/**
 * Orchestrator Agent - Coordina el trabajo entre todos los agentes
 * 
 * Este agente es responsable de:
 * 1. Descomponer proyectos complejos en tareas específicas
 * 2. Asignar tareas a los agentes especializados
 * 3. Gestionar dependencias entre tareas
 * 4. Resolver conflictos entre agentes
 * 5. Mantener una visión global del progreso
 */
export class OrchestratorAgent extends BaseAgent {
  private agents: Map<string, BaseAgent>;
  private taskQueue: Array<{id: string, type: string, description: string, dependencies: string[], status: string}>;
  private projectPath: string;
  
  constructor() {
    super('Orchestrator Agent');
    
    // Inicializar agentes disponibles
    this.agents = new Map();
    this.agents.set('vision', new VisionAgent());
    this.agents.set('architect', new ArchitectAgent());
    this.agents.set('refactor', new RefactorAgent());
    this.agents.set('doc', new DocAgent());
    
    // Inicializar cola de tareas
    this.taskQueue = [];
    
    // Directorio del proyecto actual
    this.projectPath = process.cwd();
  }
  
  /**
   * Ejecuta el Orchestrator Agent para coordinar un proyecto completo
   * @param projectDescription Descripción del proyecto a coordinar
   */
  async run(projectDescription: string): Promise<void> {
    console.log(`🔄 Orchestrator Agent iniciando coordinación para: "${projectDescription}"`);
    
    // Leer contexto relevante
    const coreContext = this.readContext('core.md');
    const rulesContext = this.readContext('rules.md');
    const modulesContext = this.readContext('modules.md');
    
    // Crear plan de proyecto con LLM
    const planPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Reglas Arquitectónicas
    ${rulesContext}
    
    # Módulos Disponibles
    ${modulesContext}
    
    # Tarea de Orchestrator Agent
    Actúa como el Orchestrator Agent de CJ.DevMind. Tu tarea es crear un plan detallado para el siguiente proyecto:
    
    "${projectDescription}"
    
    Proporciona:
    1. Desglose del proyecto en tareas específicas
    2. Asignación de cada tarea al agente más adecuado (vision, architect, refactor, doc)
    3. Dependencias entre tareas (qué debe completarse antes)
    4. Timeline estimado para completar el proyecto
    5. Puntos de decisión que requieren intervención humana
    
    Formatea tu respuesta como JSON con la siguiente estructura:
    {
      "projectName": "Nombre del proyecto",
      "description": "Descripción detallada",
      "tasks": [
        {
          "id": "task-1",
          "type": "vision|architect|refactor|doc",
          "description": "Descripción de la tarea",
          "dependencies": ["id-de-tarea-previa"],
          "estimatedTime": "2h"
        }
      ],
      "humanDecisionPoints": [
        {
          "afterTask": "task-id",
          "description": "Qué debe decidir el humano"
        }
      ]
    }
    `;
    
    // En modo real, consultaríamos al LLM
    let projectPlan;
    
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      try {
        const result = await this.queryLLM(planPrompt);
        projectPlan = JSON.parse(result);
        
        // Guardar el plan en el directorio de contexto
        const planPath = path.join(this.contextPath, 'project-plan.json');
        fs.writeFileSync(planPath, JSON.stringify(projectPlan, null, 2), 'utf-8');
        console.log(`✅ Plan de proyecto guardado en ${planPath}`);
      } catch (error) {
        console.error('❌ Error generando plan de proyecto:', error);
        return;
      }
    } else {
      // Modo simulado para desarrollo
      console.log('🧪 Ejecutando en modo simulado');
      
      // Plan simulado
      projectPlan = {
        projectName: `Proyecto: ${projectDescription.slice(0, 30)}...`,
        description: `Implementación completa de ${projectDescription}`,
        tasks: [
          {
            id: "task-1",
            type: "vision",
            description: "Definir requisitos detallados del proyecto",
            dependencies: [],
            estimatedTime: "1h"
          },
          {
            id: "task-2",
            type: "architect",
            description: "Diseñar arquitectura global del sistema",
            dependencies: ["task-1"],
            estimatedTime: "2h"
          },
          {
            id: "task-3",
            type: "refactor",
            description: "Preparar estructura base de carpetas",
            dependencies: ["task-2"],
            estimatedTime: "1h"
          },
          {
            id: "task-4",
            type: "doc",
            description: "Documentar arquitectura inicial",
            dependencies: ["task-2", "task-3"],
            estimatedTime: "1h"
          }
        ],
        humanDecisionPoints: [
          {
            afterTask: "task-2",
            description: "Revisar y aprobar la arquitectura propuesta"
          }
        ]
      };
      
      // Guardar el plan simulado
      const planPath = path.join(this.contextPath, 'project-plan.json');
      fs.writeFileSync(planPath, JSON.stringify(projectPlan, null, 2), 'utf-8');
      console.log(`✅ Plan de proyecto simulado guardado en ${planPath}`);
    }
    
    // Cargar tareas en la cola
    this.taskQueue = projectPlan.tasks.map(task => ({
      ...task,
      status: 'pending'
    }));
    
    // Mostrar plan de proyecto
    console.log('\n📋 Plan de Proyecto:\n');
    console.log(`Nombre: ${projectPlan.projectName}`);
    console.log(`Descripción: ${projectPlan.description}`);
    console.log('\nTareas:');
    projectPlan.tasks.forEach(task => {
      console.log(`- [${task.type}] ${task.description} (${task.estimatedTime})`);
      if (task.dependencies.length > 0) {
        console.log(`  Dependencias: ${task.dependencies.join(', ')}`);
      }
    });
    
    console.log('\nPuntos de Decisión Humana:');
    projectPlan.humanDecisionPoints.forEach(point => {
      console.log(`- Después de: ${point.afterTask}`);
      console.log(`  ${point.description}`);
    });
    
    // Preguntar si se desea ejecutar el plan
    console.log('\n⚠️ Este es un plan simulado. En una implementación completa, se ejecutarían las tareas automáticamente.');
    console.log('Para ejecutar manualmente, usa los comandos específicos de cada agente:');
    console.log('- cj vision "descripción"');
    console.log('- cj architect "descripción"');
    console.log('- cj refactor "tarea"');
    console.log('- cj doc "ruta/al/módulo"');
  }
  
  /**
   * Ejecuta la siguiente tarea disponible en la cola
   * @returns Resultado de la tarea
   */
  private async executeNextTask(): Promise<boolean> {
    // Encontrar tareas sin dependencias pendientes
    const availableTasks = this.taskQueue.filter(task => {
      if (task.status !== 'pending') return false;
      
      // Verificar que todas las dependencias estén completadas
      return task.dependencies.every(depId => {
        const depTask = this.taskQueue.find(t => t.id === depId);
        return depTask && depTask.status === 'completed';
      });
    });
    
    if (availableTasks.length === 0) {
      console.log('✅ No hay más tareas disponibles para ejecutar');
      return false;
    }
    
    // Tomar la primera tarea disponible
    const task = availableTasks[0];
    console.log(`🔄 Ejecutando tarea: ${task.description} [${task.type}]`);
    
    // Marcar como en progreso
    task.status = 'in-progress';
    
    try {
      // Obtener el agente correspondiente
      const agent = this.agents.get(task.type);
      
      if (!agent) {
        throw new Error(`Agente no encontrado para el tipo: ${task.type}`);
      }
      
      // Ejecutar la tarea con el agente
      await agent.run(task.description);
      
      // Marcar como completada
      task.status = 'completed';
      console.log(`✅ Tarea completada: ${task.description}`);
      
      return true;
    } catch (error) {
      // Marcar como fallida
      task.status = 'failed';
      console.error(`❌ Error en tarea ${task.id}:`, error);
      return false;
    }
  }
}

// Función auxiliar para mantener compatibilidad con código existente
export async function orchestratorAgent(projectDescription: string): Promise<string> {
  const agent = new OrchestratorAgent();
  await agent.run(projectDescription);
  return "Ejecutado con éxito";
}