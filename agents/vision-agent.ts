import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode'; // Pa’ interacción con VS Code
import { BaseAgent, ContextoProyecto } from './base-agent'; // Ajusta la ruta
import { MemoryAgent } from './memory-agent'; // Suponemos que existe
import { DashboardAgent } from './dashboard-agent'; // Pa’ reportes

interface SocraticQuestion {
  id: string;
  question: string;
  options: string[];
  defaultOption: string;
  dominio: string; // Ej. "trading", "general"
}

interface Blueprint {
  idea: string;
  modules: string[];
  requirements: {
    functional: string[];
    nonFunctional: string[];
  };
  architectureDiagram: string;
  roadmap: { phase: string; duration: string }[];
  technologies: string[];
  resources: { role: string; count: number }[];
  estimatedTime: string;
}

export class VisionAgent extends BaseAgent {
  private memoryAgent: MemoryAgent;
  private dashboardAgent: DashboardAgent;
  private interactiveMode: boolean = false;
  private answers: Record<string, string> = {};
  private currentBlueprint: Blueprint | null = null;
  private socraticQuestions: SocraticQuestion[] = [
    // General
    { id: 'scale', question: '¿Cuál es la escala esperada del proyecto?', options: ['Pequeña (100s usuarios)', 'Media (1000s usuarios)', 'Grande (10,000+ usuarios)'], defaultOption: 'Media (1000s usuarios)', dominio: 'general' },
    { id: 'complexity', question: '¿Qué nivel de complejidad tiene el proyecto?', options: ['Simple', 'Moderado', 'Complejo'], defaultOption: 'Moderado', dominio: 'general' },
    { id: 'security', question: '¿Qué nivel de seguridad requiere?', options: ['Básico', 'Estándar', 'Alto'], defaultOption: 'Estándar', dominio: 'general' },
    { id: 'integrations', question: '¿Requiere integración con sistemas externos?', options: ['No', 'Algunas APIs', 'Múltiples sistemas'], defaultOption: 'Algunas APIs', dominio: 'general' },
    { id: 'deployment', question: '¿Dónde se desplegará?', options: ['Nube pública', 'On-premise', 'Híbrido'], defaultOption: 'Nube pública', dominio: 'general' },
    // Trading
    { id: 'dataSources', question: '¿Qué fuentes de datos necesitas?', options: ['Binance', 'Twitter/X', 'Ambas'], defaultOption: 'Ambas', dominio: 'trading' },
    { id: 'strategies', question: '¿Qué estrategias de trading implementarás?', options: ['Scalping', 'Swing', 'Ambas'], defaultOption: 'Ambas', dominio: 'trading' },
    { id: 'indicators', question: '¿Qué indicadores técnicos usarás?', options: ['RSI', 'MACD', 'Ambos'], defaultOption: 'Ambos', dominio: 'trading' },
    { id: 'risk', question: '¿Qué nivel de gestión de riesgos necesitas?', options: ['Básico', 'Avanzado'], defaultOption: 'Avanzado', dominio: 'trading' },
  ];

  constructor(userId: string) {
    super(userId);
    this.agentName = 'VisionAgent';
    this.memoryAgent = new MemoryAgent();
    this.dashboardAgent = new DashboardAgent();
  }

  // Método principal para ejecutar el VisionAgent
  async run(contexto: ContextoProyecto, spec: string): Promise<void> {
    if (contexto.licencia === 'Community' && spec.includes('interactive')) {
      throw new Error('Community Edition no soporta modo interactivo');
    }

    await this.registrarActividad(contexto, 'iniciando VisionAgent', { spec });

    if (spec.startsWith('interactive:')) {
      this.interactiveMode = true;
      const idea = spec.substring('interactive:'.length).trim();
      await this.runInteractiveQuestionnaire(contexto, idea);
    } else if (spec.startsWith('evaluate:')) {
      const ideaToEvaluate = spec.substring('evaluate:'.length).trim();
      await this.evaluateViability(contexto, ideaToEvaluate);
    } else if (spec.startsWith('estimate:')) {
      const projectToEstimate = spec.substring('estimate:'.length).trim();
      await this.estimateResources(contexto, projectToEstimate);
    } else if (spec.startsWith('refine:')) {
      const feedback = spec.substring('refine:'.length).trim();
      await this.refineBlueprint(contexto, feedback);
    } else if (spec.startsWith('compare:')) {
      const ideasToCompare = spec.substring('compare:'.length).trim();
      await this.compareIdeas(contexto, ideasToCompare);
    } else {
      await this.generateBlueprint(contexto, spec);
    }
  }

  // Cuestionario interactivo
  private async runInteractiveQuestionnaire(contexto: ContextoProyecto, initialIdea: string): Promise<void> {
    const questions = this.getSocraticQuestions(contexto.tags.includes('trading') ? 'trading' : 'general');
    this.answers = {};

    // Inicializar respuestas
    questions.forEach(q => {
      this.answers[q.id] = q.defaultOption;
    });

    // Recolectar respuestas
    for (const q of questions) {
      const respuesta = await vscode.window.showQuickPick(q.options, {
        placeHolder: q.question,
      });
      this.answers[q.id] = respuesta || q.defaultOption;
      await this.memoryAgent.store(
        { pregunta: q.question, respuesta: this.answers[q.id] },
        { tipo: 'respuesta', proyectoId: contexto.id }
      );
    }

    await this.generateBlueprintFromAnswers(contexto, initialIdea);
    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      blueprint: this.currentBlueprint,
      estado: 'blueprint generado',
    });
  }

  // Genera blueprint basado en la idea
  private async generateBlueprint(contexto: ContextoProyecto, initialIdea: string): Promise<void> {
    const questions = this.getSocraticQuestions(contexto.tags.includes('trading') ? 'trading' : 'general');
    this.answers = {};
    questions.forEach(q => this.answers[q.id] = q.defaultOption);

    // Usa respuestas del contexto si están disponibles
    const respuestasPrevias = await this.memoryAgent.buscar<{ pregunta: string; respuesta: string }>({
      tipo: 'respuesta',
      proyectoId: contexto.id,
    });

    for (const q of questions) {
      const respuesta = respuestasPrevias.find(r => r.pregunta === q.question);
      if (respuesta) this.answers[q.id] = respuesta.respuesta;
    }

    await this.generateBlueprintFromAnswers(contexto, initialIdea);
    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      blueprint: this.currentBlueprint,
      estado: 'blueprint generado',
    });
  }

  // Genera blueprint basado en respuestas
  private async generateBlueprintFromAnswers(contexto: ContextoProyecto, initialIdea: string): Promise<void> {
    const prompt = `
    # Tarea de VisionAgent
    Genera un blueprint técnico para el proyecto "${initialIdea}" con base en:
    - Idea: ${initialIdea}
    - Respuestas: ${JSON.stringify(this.answers)}
    - Contexto: ${JSON.stringify(contexto)}

    Incluye:
    1. Módulos necesarios
    2. Requisitos funcionales y no funcionales
    3. Diagrama de arquitectura (ASCII)
    4. Roadmap con fases
    5. Tecnologías recomendadas
    6. Estimación de recursos y tiempos

    Formato: JSON estructurado.
    `;

    const response = await this.ejecutarPrompt(contexto, prompt);
    this.currentBlueprint = JSON.parse(response) as Blueprint;
    contexto.idea = initialIdea;
    contexto.modulos = this.currentBlueprint.modules;

    await this.registrarActividad(contexto, 'blueprint generado', { blueprint: this.currentBlueprint });
    await this.guardarContexto(contexto, path.join(process.cwd(), 'context', `${contexto.id}-blueprint.json`));
  }

  // Evalúa viabilidad
  private async evaluateViability(contexto: ContextoProyecto, idea: string): Promise<void> {
    const prompt = `
    Evalúa la viabilidad técnica de la idea "${idea}" para el proyecto ${contexto.nombre}.
    Incluye:
    1. Viabilidad (1-10)
    2. Desafíos técnicos
    3. Tecnologías existentes
    4. Brechas tecnológicas
    5. Complejidad (1-10)
    6. Recomendaciones

    Formato: Markdown.
    `;

    const response = await this.ejecutarPrompt(contexto, prompt);
    const evaluationPath = path.join(process.cwd(), 'context', `${contexto.id}-viability.md`);
    fs.writeFileSync(evaluationPath, response, 'utf-8');

    await this.registrarActividad(contexto, 'viabilidad evaluada', { idea, evaluationPath });
    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      viabilidad: response,
      estado: 'viabilidad evaluada',
    });
  }

  // Estima recursos
  private async estimateResources(contexto: ContextoProyecto, project: string): Promise<void> {
    if (!this.currentBlueprint) {
      throw new Error('No hay blueprint para estimar recursos');
    }

    const prompt = `
    Estima recursos para el proyecto "${project}" con blueprint ${JSON.stringify(this.currentBlueprint)}.
    Incluye:
    1. Recursos humanos
    2. Tiempo por fase
    3. Infraestructura
    4. Costos
    5. Factores de riesgo
    6. Recomendaciones

    Formato: Markdown con tablas.
    `;

    const response = await this.ejecutarPrompt(contexto, prompt);
    const estimationPath = path.join(process.cwd(), 'context', `${contexto.id}-resources.md`);
    fs.writeFileSync(estimationPath, response, 'utf-8');

    await this.registrarActividad(contexto, 'recursos estimados', { project, estimationPath });
    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      estimacion: response,
      estado: 'recursos estimados',
    });
  }

  // Refina blueprint
  private async refineBlueprint(contexto: ContextoProyecto, feedback: string): Promise<void> {
    if (!this.currentBlueprint) {
      throw new Error('No hay blueprint para refinar');
    }

    const prompt = `
    Refina el blueprint ${JSON.stringify(this.currentBlueprint)} con el feedback: "${feedback}".
    Mantén la estructura pero ajusta según el feedback.
    Formato: JSON.
    `;

    const response = await this.ejecutarPrompt(contexto, prompt);
    this.currentBlueprint = JSON.parse(response) as Blueprint;

    await this.registrarActividad(contexto, 'blueprint refinado', { feedback, blueprint: this.currentBlueprint });
    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      blueprint: this.currentBlueprint,
      estado: 'blueprint refinado',
    });
  }

  // Compara ideas
  private async compareIdeas(contexto: ContextoProyecto, ideas: string): Promise<void> {
    const ideaList = ideas.split('|').map(idea => idea.trim());
    const prompt = `
    Compara las ideas: ${ideaList.join(' vs ')}.
    Incluye:
    1. Viabilidad técnica
    2. Ventajas/desventajas
    3. Recursos
    4. Escalabilidad
    5. Riesgos
    6. Recomendación

    Formato: Markdown con tablas.
    `;

    const response = await this.ejecutarPrompt(contexto, prompt);
    const comparisonPath = path.join(process.cwd(), 'context', `${contexto.id}-comparison.md`);
    fs.writeFileSync(comparisonPath, response, 'utf-8');

    await this.registrarActividad(contexto, 'ideas comparadas', { ideas: ideaList, comparisonPath });
    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      comparacion: response,
      estado: 'ideas comparadas',
    });
  }

  // Auto-mejora
  async proponerMejora(contexto: ContextoProyecto): Promise<string | null> {
    const respuestasPrevias = await this.memoryAgent.buscar<{ pregunta: string; respuesta: string }>({
      tipo: 'respuesta',
      proyectoId: contexto.id,
    });

    // Si muchas respuestas son las mismas, sugiere usarlas por default
    const patrones: { pregunta: string; respuesta: string; frecuencia: number }[] = [];
    for (const q of this.socraticQuestions) {
      const respuestas = respuestasPrevias.filter(r => r.pregunta === q.question);
      const respuestaComun = this.encontrarRespuestaComun(respuestas);
      if (respuestaComun) {
        patrones.push({
          pregunta: q.question,
          respuesta: respuestaComun,
          frecuencia: respuestas.filter(r => r.respuesta === respuestaComun).length,
        });
      }
    }

    const patron = patrones.find(p => p.frecuencia > 3);
    if (patron) {
      this.socraticQuestions = this.socraticQuestions.map(q => {
        if (q.question === patron.pregunta) {
          return { ...q, defaultOption: patron.respuesta };
        }
        return q;
      });
      await this.registrarActividad(contexto, 'mejora propuesta', { patron });
      return `Pregunta optimizada: ${patron.pregunta} con default ${patron.respuesta}`;
    }

    // Si el blueprint usa muchos tokens, optimiza el prompt
    if (contexto.metricas.tokensUsados > 5000) {
      const nuevoModelo = this.config.modelo === 'GPT-4' ? 'GPT-3.5' : 'Mistral';
      this.config.modelo = nuevoModelo;
      await this.registrarActividad(contexto, 'mejora propuesta', { nuevoModelo });
      return `Cambiando a ${nuevoModelo} pa’ optimizar créditos`;
    }

    return null;
  }

  private encontrarRespuestaComun(respuestas: { pregunta: string; respuesta: string }[]): string | null {
    const conteo: Record<string, number> = {};
    let maxFrecuencia = 0;
    let respuestaComun: string | null = null;

    for (const r of respuestas) {
      conteo[r.respuesta] = (conteo[r.respuesta] || 0) + 1;
      if (conteo[r.respuesta] > maxFrecuencia) {
        maxFrecuencia = conteo[r.respuesta];
        respuestaComun = r.respuesta;
      }
    }

    return respuestaComun;
  }

  private getSocraticQuestions(dominio: string): SocraticQuestion[] {
    return this.socraticQuestions.filter(q => q.dominio === dominio || q.dominio === 'general');
  }
}