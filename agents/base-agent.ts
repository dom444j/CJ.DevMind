import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as vscode from 'vscode'; // Integración con VS Code
import { MemoryAgent } from './memoryAgent'; // Suponemos que existe
import { ExtensionAgent } from './extensionAgent'; // Pa’ licencias y créditos
import { DashboardAgent } from './dashboardAgent'; // Pa’ reportes
import { SecurityAgent } from './securityAgent'; // Pa’ auditorías
import { APIProxy } from './apiProxy'; // Proxy de APIs de IA
import { EventBus } from './eventBus'; // Para manejar eventos entre agentes

// Enum para los tipos de eventos de agentes
export enum AgentEventType {
  // Eventos de diseño y frontend (StyleAgent, UIDesignAgent, LayoutAgent)
  DESIGN_SYSTEM_UPDATED = 'DESIGN_SYSTEM_UPDATED',
  DESIGN_SYSTEM_REQUESTED = 'DESIGN_SYSTEM_REQUESTED',
  COMPONENT_REQUESTED = 'COMPONENT_REQUESTED',
  COMPONENT_CREATED = 'COMPONENT_CREATED',
  COMPONENT_ERROR = 'COMPONENT_ERROR',
  THEME_REQUESTED = 'THEME_REQUESTED',
  THEME_CREATED = 'THEME_CREATED',
  THEME_ERROR = 'THEME_ERROR',

  // Eventos de pruebas (TestAgent, TestingAgent)
  TEST_REQUESTED = 'TEST_REQUESTED',
  TEST_CREATED = 'TEST_CREATED',
  TEST_ERROR = 'TEST_ERROR',

  // Eventos de automejora (SelfImprovementAgent)
  SELF_IMPROVEMENT_REQUESTED = 'SELF_IMPROVEMENT_REQUESTED',
  SELF_IMPROVEMENT_COMPLETED = 'SELF_IMPROVEMENT_COMPLETED',
  SELF_IMPROVEMENT_ERROR = 'SELF_IMPROVEMENT_ERROR',

  // Eventos de revisión de código (CodeReviewAgent)
  CODE_REVIEW_REQUESTED = 'CODE_REVIEW_REQUESTED',
  CODE_REVIEW_COMPLETED = 'CODE_REVIEW_COMPLETED',
  CODE_REVIEW_ERROR = 'CODE_REVIEW_ERROR',

  // Eventos de Meta-Nivel (QuestionAgent, OrchestratorAgent)
  QUESTION_REQUESTED = 'QUESTION_REQUESTED',
  QUESTION_PROCESSED = 'QUESTION_PROCESSED',
  ORCHESTRATION_STARTED = 'ORCHESTRATION_STARTED',
  ORCHESTRATION_COMPLETED = 'ORCHESTRATION_COMPLETED',

  // Eventos de Backend (APIAgent, DatabaseAgent, LogicAgent)
  API_ENDPOINT_REQUESTED = 'API_ENDPOINT_REQUESTED',
  API_ENDPOINT_CREATED = 'API_ENDPOINT_CREATED',
  API_ENDPOINT_ERROR = 'API_ENDPOINT_ERROR',
  DATABASE_SCHEMA_REQUESTED = 'DATABASE_SCHEMA_REQUESTED',
  DATABASE_SCHEMA_CREATED = 'DATABASE_SCHEMA_CREATED',
  DATABASE_SCHEMA_ERROR = 'DATABASE_SCHEMA_ERROR',

  // Eventos de Calidad (SecurityAgent, TestingAgent)
  SECURITY_AUDIT_STARTED = 'SECURITY_AUDIT_STARTED',
  SECURITY_AUDIT_COMPLETED = 'SECURITY_AUDIT_COMPLETED',
  SECURITY_AUDIT_ERROR = 'SECURITY_AUDIT_ERROR',

  // Eventos de Infraestructura (DevOpsAgent, MonitorAgent)
  DEPLOYMENT_REQUESTED = 'DEPLOYMENT_REQUESTED',
  DEPLOYMENT_COMPLETED = 'DEPLOYMENT_COMPLETED',
  DEPLOYMENT_ERROR = 'DEPLOYMENT_ERROR',
  MONITORING_ALERT = 'MONITORING_ALERT',

  // Eventos de Documentación (DocAgent, MemoryAgent)
  DOCUMENTATION_REQUESTED = 'DOCUMENTATION_REQUESTED',
  DOCUMENTATION_CREATED = 'DOCUMENTATION_CREATED',
  DOCUMENTATION_ERROR = 'DOCUMENTATION_ERROR',
  MEMORY_STORED = 'MEMORY_STORED',
  MEMORY_RETRIEVED = 'MEMORY_RETRIEVED',

  // Eventos de Negocio (BusinessAgent, LaunchAgent, MarketAgent, GrowthAgent, AnalyticsAgent)
  ROI_CALCULATION_REQUESTED = 'ROI_CALCULATION_REQUESTED',
  ROI_CALCULATION_COMPLETED = 'ROI_CALCULATION_COMPLETED',
  LAUNCH_PLAN_REQUESTED = 'LAUNCH_PLAN_REQUESTED',
  LAUNCH_PLAN_CREATED = 'LAUNCH_PLAN_CREATED',
  MARKET_ANALYSIS_REQUESTED = 'MARKET_ANALYSIS_REQUESTED',
  MARKET_ANALYSIS_COMPLETED = 'MARKET_ANALYSIS_COMPLETED',
  GROWTH_STRATEGY_REQUESTED = 'GROWTH_STRATEGY_REQUESTED',
  GROWTH_STRATEGY_CREATED = 'GROWTH_STRATEGY_CREATED',
  ANALYTICS_REPORT_REQUESTED = 'ANALYTICS_REPORT_REQUESTED',
  ANALYTICS_REPORT_COMPLETED = 'ANALYTICS_REPORT_COMPLETED',

  // Eventos de Autoextensión (ExtensionAgent)
  EXTENSION_INSTALL_REQUESTED = 'EXTENSION_INSTALL_REQUESTED',
  EXTENSION_INSTALLED = 'EXTENSION_INSTALLED',
  EXTENSION_INSTALL_ERROR = 'EXTENSION_INSTALL_ERROR',

  // Eventos de Otros (VSCodeAgentBridge, DashboardAgent, IntegrationAgent, etc.)
  DASHBOARD_UPDATED = 'DASHBOARD_UPDATED',
  INTEGRATION_REQUESTED = 'INTEGRATION_REQUESTED',
  INTEGRATION_COMPLETED = 'INTEGRATION_COMPLETED',
  INTEGRATION_ERROR = 'INTEGRATION_ERROR',
}

// Interfaces pa’ estructura clara
export interface HistorialEntry {
  agente: string;
  fecha: string;
  accion: string;
  datos?: any;
  correlationId: string; // Pa’ trazabilidad
  eventType?: AgentEventType; // Nuevo campo para registrar el tipo de evento
}

export interface MetricasProyecto {
  claridadContexto: number; // 0-100
  completitud: number; // 0-100
  gradoExploracion: 'bajo' | 'medio' | 'alto';
  tokensUsados: number; // Pa’ APIs
  tiempoEjecucion: number; // En ms
  codeQualityScore?: number; // Nuevo: Puntuación de calidad del código (CodeReviewAgent)
  testCoverage?: number; // Nuevo: Cobertura de pruebas (TestAgent)
}

export interface ContextoProyecto {
  id: string;
  nombre: string;
  creado: string;
  ultimaActualizacion: string;
  faseActual: 'exploración' | 'definición' | 'desarrollo' | 'pruebas' | 'despliegue';
  autor: string;
  tags: string[];
  metas: string[];
  stakeholders: string[];
  riesgos: string[];
  historial: HistorialEntry[];
  relaciones: {
    dependeDe: string[];
    alimentaA: string[];
  };
  metricas: MetricasProyecto;
  preguntas: string[];
  nivelContextual: number; // 1-5
  idea?: string;
  problema?: string;
  usuarios?: string;
  modulos?: string[];
  licencia: 'Community' | 'Professional' | 'Enterprise'; // Del Modelo de Negocio
  creditosRestantes: number; // Pa’ APIs
}

// Configuración pa’ APIs
interface APIConfig {
  proveedor: 'openai' | 'anthropic' | 'local';
  modelo: string;
  maxTokens: number;
}

export class BaseAgent {
  protected userId: string;
  protected agentName: string;
  protected memoryAgent: MemoryAgent;
  protected extensionAgent: ExtensionAgent;
  protected dashboardAgent: DashboardAgent;
  protected securityAgent: SecurityAgent;
  protected apiProxy: APIProxy;
  protected eventBus: EventBus; // Nuevo: Para emitir y escuchar eventos
  protected config: APIConfig;

  constructor(userId: string) {
    this.userId = userId;
    this.agentName = 'BaseAgent';
    this.memoryAgent = new MemoryAgent(); // Inyección de dependencias
    this.extensionAgent = new ExtensionAgent();
    this.dashboardAgent = new DashboardAgent();
    this.securityAgent = new SecurityAgent();
    this.apiProxy = new APIProxy();
    this.eventBus = new EventBus(); // Inicializamos el EventBus
    this.config = this.inicializarConfig(); // Configuración inicial
  }

  // Inicializa configuración según licencia y conexión
  private inicializarConfig(): APIConfig {
    const licencia = this.extensionAgent.validarLicencia(this.userId);
    const online = this.estaOnline();

    if (licencia === 'Community' || !online) {
      return { proveedor: 'local', modelo: 'Mistral', maxTokens: 500 }; // Límite offline
    } else if (licencia === 'Professional') {
      return { proveedor: 'openai', modelo: 'GPT-3.5', maxTokens: 2000 };
    } else {
      return { proveedor: 'openai', modelo: 'GPT-4', maxTokens: 4000 }; // Enterprise
    }
  }

  // Checa conexión (simulado, en prod usaría navigator.onLine)
  private estaOnline(): boolean {
    return true; // Placeholder
  }

  // Emite un evento a través del EventBus
  protected async emitirEvento(eventType: AgentEventType, payload: any): Promise<void> {
    const eventData = {
      type: eventType,
      payload,
      timestamp: new Date().toISOString(),
      agentName: this.agentName,
      correlationId: uuidv4(),
    };
    await this.eventBus.emit(eventType, eventData);
    await this.registrarActividad(
      payload.contexto || { id: 'unknown', historial: [] },
      `Evento emitido: ${eventType}`,
      eventData
    );
  }

  // Escucha eventos específicos
  protected escucharEvento(eventType: AgentEventType, callback: (data: any) => void): void {
    this.eventBus.on(eventType, callback);
  }

  // Crea contexto inicial, alineado con dashboard y modelo de negocio
  async crearContextoInicial(nombreProyecto: string): Promise<ContextoProyecto> {
    const licencia = this.extensionAgent.validarLicencia(this.userId);
    const creditos = this.extensionAgent.obtenerCreditos(this.userId);

    if (licencia === 'Community' && nombreProyecto.length > 50) {
      throw new Error('Community Edition limita nombres a 50 caracteres');
    }

    const now = new Date().toISOString();
    const contexto: ContextoProyecto = {
      id: uuidv4(),
      nombre: nombreProyecto,
      creado: now,
      ultimaActualizacion: now,
      faseActual: 'exploración',
      autor: this.userId,
      tags: [],
      metas: [],
      stakeholders: [],
      riesgos: [],
      historial: [],
      relaciones: { dependeDe: [], alimentaA: [] },
      metricas: {
        claridadContexto: 0,
        completitud: 0,
        gradoExploracion: 'bajo',
        tokensUsados: 0,
        tiempoEjecucion: 0,
        codeQualityScore: 0, // Inicializado
        testCoverage: 0, // Inicializado
      },
      preguntas: [],
      nivelContextual: 1,
      licencia,
      creditosRestantes: creditos,
    };

    await this.registrarActividad(contexto, 'contexto creado', { nombreProyecto });
    await this.emitirEvento(AgentEventType.ORCHESTRATION_STARTED, { contexto });
    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      estado: 'iniciado',
      creditos,
    });
    return contexto;
  }

  // Registra actividad con trazabilidad y evento
  async registrarActividad(contexto: ContextoProyecto, accion: string, datos?: any, eventType?: AgentEventType): Promise<void> {
    const entry: HistorialEntry = {
      agente: this.agentName,
      fecha: new Date().toISOString(),
      accion,
      datos,
      correlationId: uuidv4(),
      eventType, // Nuevo: Registrar el tipo de evento
    };
    contexto.historial.push(entry);
    await this.memoryAgent.store(entry, { tipo: 'actividad', proyectoId: contexto.id });
    await this.emitirEvento(AgentEventType.MEMORY_STORED, { entry, contexto });
    await this.securityAgent.auditarActividad(entry); // Auditoría
  }

  // Avanza nivel contextual, con límites por licencia
  async avanzarNivel(contexto: ContextoProyecto): Promise<ContextoProyecto> {
    if (contexto.licencia === 'Community' && contexto.nivelContextual >= 2) {
      throw new Error('Community Edition limita a nivel 2');
    }
    contexto.nivelContextual = Math.min(contexto.nivelContextual + 1, 5);
    await this.registrarActividad(contexto, 'avance de nivel', { nuevoNivel: contexto.nivelContextual }, AgentEventType.ORCHESTRATION_COMPLETED);
    return contexto;
  }

  // Calcula claridad del contexto
  calcularClaridad(contexto: ContextoProyecto): number {
    let score = 0;
    if (contexto.idea) score += 20;
    if (contexto.problema) score += 20;
    if (contexto.usuarios) score += 20;
    if (contexto.metas.length > 0) score += 20;
    if (contexto.stakeholders.length > 0) score += 10;
    if (contexto.modulos?.length) score += 10;
    return Math.min(score, 100);
  }

  // Calcula completitud del contexto
  calcularCompletitud(contexto: ContextoProyecto): number {
    const camposClave: (keyof ContextoProyecto)[] = [
      'idea',
      'problema',
      'usuarios',
      'metas',
      'stakeholders',
      'riesgos',
      'modulos',
    ];
    const completados = camposClave.filter((c) => {
      const val = contexto[c];
      return val && (Array.isArray(val) ? val.length > 0 : true);
    });
    return Math.floor((completados.length / camposClave.length) * 100);
  }

  // Actualiza métricas y reporta al dashboard
  async actualizarMetricas(contexto: ContextoProyecto): Promise<ContextoProyecto> {
    const startTime = Date.now();
    contexto.metricas.claridadContexto = this.calcularClaridad(contexto);
    contexto.metricas.completitud = this.calcularCompletitud(contexto);
    contexto.metricas.gradoExploracion =
      contexto.metricas.completitud > 80 ? 'alto' :
      contexto.metricas.completitud > 40 ? 'medio' : 'bajo';
    contexto.metricas.tiempoEjecucion += Date.now() - startTime;

    await this.registrarActividad(contexto, 'actualización de métricas', contexto.metricas);
    await this.emitirEvento(AgentEventType.DASHBOARD_UPDATED, { contexto });
    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      metricas: contexto.metricas,
    });
    return contexto;
  }

  // Ejecuta prompt en API de IA, con optimización de créditos
  async ejecutarPrompt(contexto: ContextoProyecto, prompt: string): Promise<string> {
    if (contexto.licencia === 'Community' && !this.estaOnline()) {
      if (prompt.length > 500) {
        throw new Error('Community Edition limita prompts offline a 500 caracteres');
      }
    }

    if (contexto.creditosRestantes < 10) {
      await vscode.window.showErrorMessage('Créditos insuficientes. Recarga en el dashboard.');
      throw new Error('Créditos insuficientes');
    }

    const startTime = Date.now();
    await this.emitirEvento(AgentEventType.QUESTION_REQUESTED, { contexto, prompt });

    try {
      const respuesta = await this.apiProxy.ejecutar({
        proveedor: this.config.proveedor,
        modelo: this.config.modelo,
        prompt,
        maxTokens: this.config.maxTokens,
      });

      const tokensUsados = respuesta.tokens || 100; // Placeholder
      contexto.creditosRestantes -= tokensUsados / 100; // 100 tokens = 1 crédito
      contexto.metricas.tokensUsados += tokensUsados;
      contexto.metricas.tiempoEjecucion += Date.now() - startTime;

      await this.registrarActividad(
        contexto,
        'prompt ejecutado',
        { prompt, tokensUsados },
        AgentEventType.QUESTION_PROCESSED
      );
      await this.emitirEvento(AgentEventType.DASHBOARD_UPDATED, { contexto });
      await this.extensionAgent.actualizarCreditos(this.userId, contexto.creditosRestantes);
      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        creditos: contexto.creditosRestantes,
        tokensUsados,
      });

      return respuesta.resultado;
    } catch (error) {
      await this.emitirEvento(AgentEventType.COMPONENT_ERROR, { contexto, error: error.message });
      throw error;
    }
  }

  // Guarda contexto en archivo y MemoryAgent
  async guardarContexto(contexto: ContextoProyecto, ruta: string): Promise<void> {
    contexto.ultimaActualizacion = new Date().toISOString();
    fs.writeFileSync(ruta, JSON.stringify(contexto, null, 2));
    await this.memoryAgent.store(contexto, { tipo: 'contexto', proyectoId: contexto.id });
    await this.registrarActividad(
      contexto,
      'guardado en archivo',
      { ruta },
      AgentEventType.MEMORY_STORED
    );
  }

  // Carga contexto desde archivo o MemoryAgent
  async cargarContexto(ruta: string): Promise<ContextoProyecto | null> {
    if (fs.existsSync(ruta)) {
      const data = fs.readFileSync(ruta, 'utf-8');
      const contexto = JSON.parse(data) as ContextoProyecto;
      await this.registrarActividad(
        contexto,
        'contexto cargado',
        { ruta },
        AgentEventType.MEMORY_RETRIEVED
      );
      return contexto;
    }
    const fromMemory = await this.memoryAgent.recuperar<ContextoProyecto>({ tipo: 'contexto', ruta });
    if (fromMemory) {
      await this.registrarActividad(
        fromMemory,
        'contexto cargado desde memoria',
        { ruta },
        AgentEventType.MEMORY_RETRIEVED
      );
    }
    return fromMemory;
  }

  // Agrega relación entre proyectos
  async agregarRelacion(
    contexto: ContextoProyecto,
    tipo: 'dependeDe' | 'alimentaA',
    otroId: string
  ): Promise<void> {
    if (!contexto.relaciones[tipo].includes(otroId)) {
      contexto.relaciones[tipo].push(otroId);
      await this.registrarActividad(
        contexto,
        `relación añadida (${tipo})`,
        { con: otroId },
        AgentEventType.ORCHESTRATION_COMPLETED
      );
      await this.emitirEvento(AgentEventType.DASHBOARD_UPDATED, { contexto });
      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        relaciones: contexto.relaciones,
      });
    }
  }

  // Agrega tag al proyecto
  async agregarTag(contexto: ContextoProyecto, tag: string): Promise<void> {
    if (!contexto.tags.includes(tag)) {
      contexto.tags.push(tag);
      await this.registrarActividad(
        contexto,
        'tag añadido',
        { tag },
        AgentEventType.DASHBOARD_UPDATED
      );
      await this.emitirEvento(AgentEventType.DASHBOARD_UPDATED, { contexto });
      await this.dashboardAgent.actualizarWebview({
        proyectoId: contexto.id,
        tags: contexto.tags,
      });
    }
  }

  // Propone mejoras basadas en métricas (auto-mejora)
  async proponerMejora(contexto: ContextoProyecto): Promise<string | null> {
    await this.emitirEvento(AgentEventType.SELF_IMPROVEMENT_REQUESTED, { contexto });

    try {
      const historial = await this.memoryAgent.buscar<HistorialEntry>({
        tipo: 'actividad',
        proyectoId: contexto.id,
      });

      if (contexto.metricas.tokensUsados > 5000) {
        const nuevoModelo = this.config.modelo === 'GPT-4' ? 'GPT-3.5' : 'Mistral';
        this.config.modelo = nuevoModelo;
        await this.registrarActividad(
          contexto,
          'mejora propuesta',
          { nuevoModelo },
          AgentEventType.SELF_IMPROVEMENT_COMPLETED
        );
        return `Cambiando a ${nuevoModelo} pa’ optimizar créditos`;
      }

      if (contexto.metricas.tiempoEjecucion > 10000) {
        const nuevoPrompt = 'Responde en menos de 50 palabras';
        await this.registrarActividad(
          contexto,
          'mejora propuesta',
          { nuevoPrompt },
          AgentEventType.SELF_IMPROVEMENT_COMPLETED
        );
        return `Usando prompts más cortos pa’ reducir tiempo`;
      }

      if (contexto.metricas.testCoverage && contexto.metricas.testCoverage < 80) {
        await this.registrarActividad(
          contexto,
          'mejora propuesta',
          { sugerencia: 'Aumentar cobertura de pruebas' },
          AgentEventType.SELF_IMPROVEMENT_COMPLETED
        );
        return 'Sugerencia: Aumentar la cobertura de pruebas al menos al 80%';
      }

      if (contexto.metricas.codeQualityScore && contexto.metricas.codeQualityScore < 70) {
        await this.registrarActividad(
          contexto,
          'mejora propuesta',
          { sugerencia: 'Refactorizar código para mejorar calidad' },
          AgentEventType.SELF_IMPROVEMENT_COMPLETED
        );
        return 'Sugerencia: Refactorizar código para mejorar la calidad (score < 70)';
      }

      await this.emitirEvento(AgentEventType.SELF_IMPROVEMENT_COMPLETED, { contexto, sugerencia: null });
      return null;
    } catch (error) {
      await this.emitirEvento(AgentEventType.SELF_IMPROVEMENT_ERROR, { contexto, error: error.message });
      throw error;
    }
  }

  // Método para manejar eventos de revisión de código (CodeReviewAgent)
  async manejarRevisionCodigo(contexto: ContextoProyecto, codigo: string): Promise<void> {
    await this.emitirEvento(AgentEventType.CODE_REVIEW_REQUESTED, { contexto, codigo });
    // Lógica simulada para CodeReviewAgent
    try {
      const qualityScore = Math.floor(Math.random() * 100); // Simulación
      contexto.metricas.codeQualityScore = qualityScore;
      await this.registrarActividad(
        contexto,
        'revisión de código completada',
        { qualityScore },
        AgentEventType.CODE_REVIEW_COMPLETED
      );
      await this.emitirEvento(AgentEventType.CODE_REVIEW_COMPLETED, { contexto, qualityScore });
    } catch (error) {
      await this.emitirEvento(AgentEventType.CODE_REVIEW_ERROR, { contexto, error: error.message });
      throw error;
    }
  }

  // Método para manejar eventos de pruebas (TestAgent)
  async manejarPruebas(contexto: ContextoProyecto, componente: string): Promise<void> {
    await this.emitirEvento(AgentEventType.TEST_REQUESTED, { contexto, componente });
    // Lógica simulada para TestAgent
    try {
      const testCoverage = Math.floor(Math.random() * 100); // Simulación
      contexto.metricas.testCoverage = testCoverage;
      await this.registrarActividad(
        contexto,
        'pruebas completadas',
        { testCoverage },
        AgentEventType.TEST_CREATED
      );
      await this.emitirEvento(AgentEventType.TEST_CREATED, { contexto, testCoverage });
    } catch (error) {
      await this.emitirEvento(AgentEventType.TEST_ERROR, { contexto, error: error.message });
      throw error;
    }
  }

  // Método para manejar eventos de diseño (StyleAgent, UIDesignAgent)
  async manejarDiseno(contexto: ContextoProyecto, componente: string): Promise<void> {
    await this.emitirEvento(AgentEventType.COMPONENT_REQUESTED, { contexto, componente });
    try {
      // Lógica simulada para StyleAgent o UIDesignAgent
      await this.registrarActividad(
        contexto,
        'componente diseñado',
        { componente },
        AgentEventType.COMPONENT_CREATED
      );
      await this.emitirEvento(AgentEventType.COMPONENT_CREATED, { contexto, componente });
    } catch (error) {
      await this.emitirEvento(AgentEventType.COMPONENT_ERROR, { contexto, error: error.message });
      throw error;
    }
  }
}
