import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { BaseAgent, ContextoProyecto } from './base-agent'; // Ajusta la ruta
import { MemoryAgent } from './memory-agent'; // Suponemos que existe
import { DashboardAgent } from './dashboard-agent'; // Pa’ reportes

interface ArchitecturalDecision {
  id: string;
  title: string;
  status: 'proposed' | 'accepted' | 'rejected' | 'deprecated';
  context: string;
  decision: string;
  consequences: string;
  alternatives?: string[];
  date: string;
}

interface ArchitecturalBlueprint {
  projectName: string;
  description: string;
  folderStructure: Record<string, string>;
  components: Array<{
    name: string;
    responsibility: string;
    dependencies: string[];
  }>;
  dataFlow: Array<{
    from: string;
    to: string;
    description: string;
  }>;
  decisions: ArchitecturalDecision[];
  technologies: Record<string, string>;
  diagram?: string; // Código Mermaid
}

export class ArchitectAgent extends BaseAgent {
  private blueprintsDir: string;
  private decisionsDir: string;
  private currentBlueprint: ArchitecturalBlueprint | null = null;
  private memoryAgent: MemoryAgent;
  private dashboardAgent: DashboardAgent;

  constructor(userId: string) {
    super(userId);
    this.agentName = 'ArchitectAgent';
    this.blueprintsDir = join(process.cwd(), 'context', 'blueprints');
    this.decisionsDir = join(process.cwd(), 'context', 'decisions');
    this.memoryAgent = new MemoryAgent();
    this.dashboardAgent = new DashboardAgent();

    this.ensureDirectoryExists(this.blueprintsDir);
    this.ensureDirectoryExists(this.decisionsDir);
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
    }
  }

  // Ejecuta el agente
  async run(contexto: ContextoProyecto, prompt: string): Promise<void> {
    if (contexto.licencia === 'Community' && prompt.includes('complex')) {
      throw new Error('Community Edition no soporta proyectos complejos');
    }

    await this.registrarActividad(contexto, 'iniciando ArchitectAgent', { prompt });

    // Leer contexto relevante
    const coreContext = this.readContext('core.md');
    const rulesContext = this.readContext('rules.md');
    const technologiesContext = this.readContext('technologies.md');
    const previousDecisions = await this.getPreviousDecisions();

    const fullPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Reglas Arquitectónicas
    ${rulesContext}
    
    # Tecnologías Disponibles
    ${technologiesContext}
    
    # Decisiones Previas
    ${JSON.stringify(previousDecisions, null, 2)}
    
    # Contexto Actual
    ${JSON.stringify(contexto, null, 2)}
    
    # Tarea
    Diseña la arquitectura para el proyecto "${prompt}" con base en el contexto.
    Genera un blueprint que incluya:
    1. Estructura de carpetas
    2. Componentes y responsabilidades
    3. Flujo de datos
    4. Decisiones arquitectónicas
    5. Tecnologías recomendadas
    6. Diagrama en Mermaid

    Formato: JSON con la estructura:
    {
      "projectName": "Nombre",
      "description": "Descripción",
      "folderStructure": { "carpeta": "Propósito" },
      "components": [{ "name": "Nombre", "responsibility": "Responsabilidad", "dependencies": ["Dep"] }],
      "dataFlow": [{ "from": "Origen", "to": "Destino", "description": "Flujo" }],
      "decisions": [{ "id": "ADR-001", "title": "Título", "status": "accepted", "context": "Contexto", "decision": "Decisión", "consequences": "Consecuencias", "date": "2025-04-11T00:00:00.000Z" }],
      "technologies": { "frontend": "Tech", "backend": "Tech", "database": "Tech" },
      "diagram": "Código Mermaid"
    }
    `;

    const result = await this.ejecutarPrompt(contexto, fullPrompt);
    await this.processArchitecturalBlueprint(contexto, result, prompt);
    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      blueprint: this.currentBlueprint,
      estado: 'arquitectura diseñada',
    });
  }

  private async processArchitecturalBlueprint(contexto: ContextoProyecto, result: string, prompt: string): Promise<void> {
    const blueprint = JSON.parse(result) as ArchitecturalBlueprint;
    this.currentBlueprint = blueprint;

    // Guardar blueprint
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const blueprintPath = join(this.blueprintsDir, `blueprint-${timestamp}.json`);
    writeFileSync(blueprintPath, JSON.stringify(blueprint, null, 2), 'utf-8');

    // Guardar decisiones
    await this.saveArchitecturalDecisions(contexto, blueprint.decisions);

    // Actualizar contexto
    contexto.modulos = blueprint.components.map(c => c.name);
    contexto.tags.push(...Object.values(blueprint.technologies));
    await this.guardarContexto(contexto, join(process.cwd(), 'context', `${contexto.id}-context.json`));

    await this.registrarActividad(contexto, 'blueprint procesado', { blueprintPath });
  }

  private async saveArchitecturalDecisions(contexto: ContextoProyecto, decisions: ArchitecturalDecision[]): Promise<void> {
    for (const decision of decisions) {
      const decisionPath = join(this.decisionsDir, `${decision.id}.md`);
      const content = `# ${decision.title}\n\n## Status\n${decision.status}\n\n## Context\n${decision.context}\n\n## Decision\n${decision.decision}\n\n## Consequences\n${decision.consequences}\n\n## Date\n${decision.date}`;
      writeFileSync(decisionPath, content, 'utf-8');
      await this.memoryAgent.store(
        { decision: decision.title, details: decision },
        { tipo: 'decision', proyectoId: contexto.id }
      );
    }
  }

  private async getPreviousDecisions(): Promise<ArchitecturalDecision[]> {
    const decisions: ArchitecturalDecision[] = [];
    const storedDecisions = await this.memoryAgent.buscar<ArchitecturalDecision>({
      tipo: 'decision',
    });

    return storedDecisions.map(d => d.details);
  }

  // Auto-mejora
  async proponerMejora(contexto: ContextoProyecto): Promise<string | null> {
    const decisionesPrevias = await this.getPreviousDecisions();

    // Si una decisión es frecuentemente rechazada, propone eliminarla
    const decisionesRechazadas = decisionesPrevias.filter(d => d.status === 'rejected');
    const patrones: { decision: string; frecuencia: number }[] = [];
    for (const d of decisionesRechazadas) {
      const existing = patrones.find(p => p.decision === d.decision);
      if (existing) {
        existing.frecuencia++;
      } else {
        patrones.push({ decision: d.decision, frecuencia: 1 });
      }
    }

    const decisionProblematica = patrones.find(p => p.frecuencia > 2);
    if (decisionProblematica) {
      await this.registrarActividad(contexto, 'mejora propuesta', { decision: decisionProblematica.decision, accion: 'eliminar' });
      return `Eliminando decisión problemática: ${decisionProblematica.decision}`;
    }

    // Si el diagrama es muy complejo, simplifica
    if (this.currentBlueprint && this.currentBlueprint.components.length > 10) {
      const prompt = `Simplifica el blueprint ${JSON.stringify(this.currentBlueprint)} reduciendo componentes. Formato: JSON.`;
      const result = await this.ejecutarPrompt(contexto, prompt);
      this.currentBlueprint = JSON.parse(result);
      await this.registrarActividad(contexto, 'mejora propuesta', { accion: 'simplificar blueprint' });
      return 'Blueprint simplificado pa’ reducir complejidad';
    }

    return null;
  }

  private readContext(file: string): string {
    const filePath = join(process.cwd(), 'context', file);
    return existsSync(filePath) ? readFileSync(filePath, 'utf-8') : '';
  }
}