import { BaseAgent, ContextoProyecto } from './base-agent'; // Ajusta la ruta
import { MemoryAgent } from './memory-agent';
import { DashboardAgent } from './dashboard-agent';
import { QuestionAgent } from './question-agent';
import { VisionAgent } from './vision-agent';
import { ArchitectAgent } from './architect-agent';
import { IntegrationAgent } from './integration-agent';
import { LogicAgent } from './logic-agent';
import { DatabaseAgent } from './database-agent';
import { APIAgent } from './api-agent';
import { AnalyticsAgent } from './analytics-agent';
// Importación de agentes nuevos
import { StyleAgent } from './style-agent';
import { TestAgent } from './test-agent';
import { SelfImprovementAgent } from './self-improvement-agent';
import { CodeReviewAgent } from './code-review-agent';
import { ComponentAgent } from './component-agent';
import { UIDesignAgent } from './ui-design-agent';
import { LayoutAgent } from './layout-agent';
import { FrontendSyncAgent } from './frontend-sync-agent';
import { SecurityAgent } from './security-agent';
import { PerformanceAgent } from './performance-agent';
import { RefactorAgent } from './refactor-agent';
import { DevOpsAgent } from './devops-agent';
import { MonitorAgent } from './monitor-agent';
import { DocAgent } from './doc-agent';
import { BusinessAgent } from './business-agent';
import { MarketAgent } from './market-agent';
import { LaunchAgent } from './launch-agent';
import { ExtensionAgent } from './extension-agent';
import { RiskManagementAgent } from './risk-management-agent';
import { NewsAnalysisAgent } from './news-analysis-agent';
import { AlertAgent } from './alert-agent';

interface ProjectState {
  id: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  created: string;
  lastUpdated: string;
  currentStep: number;
  totalSteps: number;
  agentProgress: Record<string, number>;
  overallProgress: number;
  lastError?: { agent: string; timestamp: string; message: string; context?: string };
}

interface WorkflowStep {
  id: number;
  agentType: string;
  input: string;
  status: 'queued' | 'started' | 'completed' | 'failed';
  timestamp: string;
  output?: string;
  error?: string;
}

interface WorkflowPlan {
  steps: {
    id: string;
    agent: string;
    input: string;
    description: string;
    dependsOn?: string | string[];
    priority: number;
  }[];
}

interface QueuedExecution {
  agentType: string;
  input: string;
  priority: number;
  resolve: (value: string) => void;
  reject: (error: Error) => void;
}

interface DependencyGraph {
  dependencies: number[][]; // Para cada paso, lista de pasos de los que depende
  dependents: number[][];  // Para cada paso, lista de pasos que dependen de él
}

export class OrchestratorAgent extends BaseAgent {
  private projectState: ProjectState;
  private workflowHistory: WorkflowStep[] = [];
  private agentRegistry: Record<string, any>;
  private parallelExecutionLimit: number = 3;
  private activeExecutions: number = 0;
  private executionQueue: QueuedExecution[] = [];
  private memoryAgent: MemoryAgent;
  private dashboardAgent: DashboardAgent;
  private selfImprovementAgent: SelfImprovementAgent;

  constructor(userId: string) {
    super(userId);
    this.agentName = 'OrchestratorAgent';
    this.projectState = this.loadProjectState();
    this.memoryAgent = new MemoryAgent();
    this.dashboardAgent = new DashboardAgent();
    this.selfImprovementAgent = new SelfImprovementAgent(this.userId);

    // Registro de agentes actualizado para incluir los 30 agentes especializados
    this.agentRegistry = {
      // Meta-Nivel
      'question': new QuestionAgent(this.userId),
      'vision': new VisionAgent(this.userId),
      'architect': new ArchitectAgent(this.userId),
      'extension': new ExtensionAgent(this.userId),
      
      // Frontend
      'uiDesign': new UIDesignAgent(this.userId),
      'layout': new LayoutAgent(this.userId),
      'component': new ComponentAgent(this.userId),
      'frontendSync': new FrontendSyncAgent(this.userId),
      'style': new StyleAgent(this.userId),
      
      // Backend
      'api': new APIAgent(this.userId),
      'logic': new LogicAgent(this.userId),
      'database': new DatabaseAgent(this.userId),
      'integration': new IntegrationAgent(this.userId),
      
      // Calidad
      'testing': new TestAgent(this.userId),
      'security': new SecurityAgent(this.userId),
      'performance': new PerformanceAgent(this.userId),
      'refactor': new RefactorAgent(this.userId),
      'test': new TestAgent(this.userId),
      'selfImprovement': this.selfImprovementAgent,
      'codeReview': new CodeReviewAgent(this.userId),
      
      // Infraestructura
      'devops': new DevOpsAgent(this.userId),
      'monitor': new MonitorAgent(this.userId),
      'dashboard': this.dashboardAgent,
      'analytics': new AnalyticsAgent(this.userId),
      
      // Documentación
      'doc': new DocAgent(this.userId),
      'memory': this.memoryAgent,
      
      // Negocio
      'business': new BusinessAgent(this.userId),
      'market': new MarketAgent(this.userId),
      'launch': new LaunchAgent(this.userId),
      
      // Otros
      'risk': new RiskManagementAgent(this.userId),
      'news': new NewsAnalysisAgent(this.userId),
      'alert': new AlertAgent(this.userId),
    };
  }

  async run(contexto: ContextoProyecto, description: string): Promise<void> {
    if (contexto.licencia === 'Community' && description.includes('complex')) {
      throw new Error('Community Edition no soporta proyectos complejos');
    }

    await this.registrarActividad(contexto, 'iniciando OrchestratorAgent', { description });

    try {
      this.initializeProjectState(contexto, description);
      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        estado: 'proyecto iniciado',
        descripcion: description,
      });

      // Verificar si se necesitan extensiones para este proyecto
      await this.checkForExtensions(contexto, description);

      const workflow = await this.planWorkflow(contexto, description);
      await this.executeWorkflow(contexto, workflow);
      await this.finalizeProject(contexto);
    } catch (error) {
      await this.handleProjectError(contexto, error as Error);
      throw error;
    }
  }

  // Nuevo método para verificar si se necesitan extensiones
  private async checkForExtensions(contexto: ContextoProyecto, description: string): Promise<void> {
    if (contexto.licencia === 'Community') return; // Solo disponible en licencias Professional y Enterprise
    
    const extensionAgent = this.agentRegistry['extension'] as ExtensionAgent;
    const requiredExtensions = await extensionAgent.analyzeRequirements(contexto, description);
    
    if (requiredExtensions.length > 0) {
      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        estado: 'instalando extensiones',
        detalles: requiredExtensions,
      });
      
      for (const ext of requiredExtensions) {
        await extensionAgent.installExtension(contexto, ext);
      }
    }
  }

  private initializeProjectState(contexto: ContextoProyecto, description: string): void {
    this.projectState = {
      id: contexto.id,
      description,
      status: 'in_progress',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      currentStep: 0,
      totalSteps: 0,
      agentProgress: {},
      overallProgress: 0,
    };
    contexto.nombre = description;
    this.saveProjectState(contexto);
  }

  private async planWorkflow(contexto: ContextoProyecto, description: string): Promise<WorkflowPlan> {
    const prompt = `
    Genera un plan de flujo de trabajo para el proyecto "${description}" con base en el contexto:
    ${JSON.stringify(contexto, null, 2)}

    Incluye pasos para:
    1. Recolectar requisitos (QuestionAgent)
    2. Generar blueprint (VisionAgent)
    3. Diseñar arquitectura (ArchitectAgent)
    4. Diseñar UI (UIDesignAgent)
    5. Crear estilos (StyleAgent)
    6. Implementar layouts (LayoutAgent)
    7. Crear componentes (ComponentAgent)
    8. Sincronizar frontend (FrontendSyncAgent)
    9. Implementar módulos backend (IntegrationAgent, LogicAgent, DatabaseAgent, APIAgent)
    10. Realizar pruebas (TestAgent)
    11. Revisar código (CodeReviewAgent)
    12. Optimizar rendimiento (PerformanceAgent)
    13. Verificar seguridad (SecurityAgent)
    14. Refactorizar si es necesario (RefactorAgent)
    15. Configurar infraestructura (DevOpsAgent)
    16. Monitorear (MonitorAgent)
    17. Analizar datos (AnalyticsAgent)
    18. Gestionar riesgos (RiskManagementAgent)
    19. Generar documentación (DocAgent)
    20. Preparar lanzamiento (LaunchAgent)
    21. Analizar mercado (MarketAgent)
    22. Planificar negocio (BusinessAgent)
    23. Mejorar automáticamente (SelfImprovementAgent)

    Formato: JSON con la estructura:
    {
      "steps": [
        {
          "id": "step-1",
          "agent": "agentName",
          "input": "Entrada para el agente",
          "description": "Descripción del paso",
          "dependsOn": ["step-id"],
          "priority": 1
        }
      ]
    }
    `;

    const result = await this.ejecutarPrompt(contexto, prompt);
    return JSON.parse(result) as WorkflowPlan;
  }

  private async executeWorkflow(contexto: ContextoProyecto, plan: WorkflowPlan): Promise<void> {
    const dependencyGraph = this.analyzeDependencies(plan);
    const executionGroups = this.identifyParallelSteps(dependencyGraph);

    for (let groupIndex = 0; groupIndex < executionGroups.length; groupIndex++) {
      const group = executionGroups[groupIndex];
      const groupPromises = group.map(async (stepIndex) => {
        const step = plan.steps[stepIndex];
        this.projectState.currentStep = stepIndex + 1;
        this.projectState.totalSteps = plan.steps.length;
        this.saveProjectState(contexto);

        try {
          const result = await this.executeAgentWithQueue(contexto, step.agent, step.input, step.priority);
          this.projectState.agentProgress[step.agent] = 100;
          this.calculateOverallProgress();
          this.saveProjectState(contexto);
          return result;
        } catch (error) {
          const resolved = await this.resolveConflict(contexto, step, error as Error);
          if (!resolved) throw error;
          return 'Conflict resolved';
        }
      });

      await Promise.all(groupPromises);
      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        estado: `grupo ${groupIndex + 1}/${executionGroups.length} completado`,
        progreso: this.projectState.overallProgress,
      });
    }
  }

  private async executeAgentWithQueue(contexto: ContextoProyecto, agentType: string, input: string, priority: number): Promise<string> {
    if (this.activeExecutions < this.parallelExecutionLimit) {
      this.activeExecutions++;
      try {
        return await this.executeAgent(contexto, agentType, input);
      } finally {
        this.activeExecutions--;
        this.processNextInQueue(contexto);
      }
    } else {
      return new Promise((resolve, reject) => {
        this.executionQueue.push({ agentType, input, priority, resolve, reject });
        this.executionQueue.sort((a, b) => a.priority - b.priority);
      });
    }
  }

  private async executeAgent(contexto: ContextoProyecto, agentType: string, input: string): Promise<string> {
    if (!this.agentRegistry[agentType]) throw new Error(`Agente "${agentType}" no encontrado`);

    const stepId = this.recordWorkflowStep({ agentType, input, status: 'started', timestamp: new Date().toISOString() });
    const agent = this.agentRegistry[agentType];
    await agent.run(contexto, input);

    // Añadir revisión de código automática después de pasos de implementación
    if (['component', 'api', 'logic', 'database', 'integration'].includes(agentType)) {
      await this.runCodeReview(contexto, agentType, input);
    }

    this.updateWorkflowStep(stepId, { status: 'completed', timestamp: new Date().toISOString() });
    return `${agentType} completado`;
  }

  // Nuevo método para ejecutar revisión de código
  private async runCodeReview(contexto: ContextoProyecto, agentType: string, input: string): Promise<void> {
    if (contexto.licencia === 'Community') return; // Solo disponible en licencias Professional y Enterprise
    
    const codeReviewAgent = this.agentRegistry['codeReview'] as CodeReviewAgent;
    const reviewInput = `Revisar código generado por ${agentType}: ${input}`;
    
    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      estado: `revisando código de ${agentType}`,
    });
    
    await codeReviewAgent.run(contexto, reviewInput);
  }

  private async finalizeProject(contexto: ContextoProyecto): Promise<void> {
    this.projectState.status = 'completed';
    this.projectState.lastUpdated = new Date().toISOString();
    this.saveProjectState(contexto);

    // Ejecutar mejora automática al finalizar el proyecto
    await this.runSelfImprovement(contexto);

    await this.generateFinalReport(contexto);
    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      estado: 'proyecto completado',
      progreso: 100,
    });
  }

  // Nuevo método para ejecutar mejora automática
  private async runSelfImprovement(contexto: ContextoProyecto): Promise<void> {
    if (contexto.licencia === 'Community') return; // Solo disponible en licencias Professional y Enterprise
    
    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      estado: 'optimizando para futuros proyectos',
    });
    
    await this.selfImprovementAgent.run(contexto, this.projectState.description);
  }

  async proponerMejora(contexto: ContextoProyecto): Promise<string | null> {
    // Primero consultamos al SelfImprovementAgent para sugerencias
    if (contexto.licencia !== 'Community') {
      const sugerencia = await this.selfImprovementAgent.suggestImprovement(contexto, this.projectState);
      if (sugerencia) {
        await this.registrarActividad(contexto, 'mejora propuesta por SelfImprovementAgent', { sugerencia });
        return sugerencia;
      }
    }

    // Lógica existente como fallback
    const historial = await this.memoryAgent.buscar<WorkflowStep>({ tipo: 'workflow' });
    const fallos = historial.filter(h => h.status === 'failed');

    if (fallos.length > 3) {
      const agentesFrecuentes = fallos.reduce((acc, f) => {
        acc[f.agentType] = (acc[f.agentType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const agenteProblematico = Object.entries(agentesFrecuentes).find(([, count]) => count > 2);
      if (agenteProblematico) {
        const [agente] = agenteProblematico;
        this.parallelExecutionLimit = Math.max(1, this.parallelExecutionLimit - 1);
        await this.registrarActividad(contexto, 'mejora propuesta', { agente, accion: 'reducir paralelismo' });
        return `Reduciendo paralelismo a ${this.parallelExecutionLimit} por fallos en ${agente}`;
      }
    }

    if (this.projectState.overallProgress < 50 && this.projectState.currentStep > 5) {
      const prompt = `Optimiza el flujo de trabajo para el proyecto "${this.projectState.description}". Redefine prioridades de los pasos.`;
      const nuevoPlan = await this.ejecutarPrompt(contexto, prompt);
      await this.registrarActividad(contexto, 'mejora propuesta', { accion: 'redefinir prioridades' });
      return 'Redefiniendo prioridades del flujo de trabajo';
    }

    return null;
  }

  private calculateOverallProgress(): void {
    const progressValues = Object.values(this.projectState.agentProgress);
    this.projectState.overallProgress = progressValues.length > 0
      ? Math.round(progressValues.reduce((sum, value) => sum + value, 0) / progressValues.length)
      : 0;
  }

  private loadProjectState(): ProjectState {
    return {
      id: '',
      description: '',
      status: 'not_started',
      created: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      currentStep: 0,
      totalSteps: 0,
      agentProgress: {},
      overallProgress: 0,
    };
  }

  private saveProjectState(contexto: ContextoProyecto): void {
    contexto.estado = this.projectState;
    this.guardarContexto(contexto, join(process.cwd(), 'context', `${contexto.id}-state.json`));
  }

  private recordWorkflowStep(step: Omit<WorkflowStep, 'id'>): number {
    const id = this.workflowHistory.length + 1;
    this.workflowHistory.push({ ...step, id });
    this.memoryAgent.store(step, { tipo: 'workflow', proyectoId: this.projectState.id });
    return id;
  }

  private updateWorkflowStep(id: number, updates: Partial<WorkflowStep>): void {
    const step = this.workflowHistory.find(s => s.id === id);
    if (step) Object.assign(step, updates);
  }
}