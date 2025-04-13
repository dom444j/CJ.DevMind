import * as vscode from 'vscode'; // Pa’ interacción con VS Code
import { ContextoProyecto, BaseAgent } from './base-agent'; // Ajusta la ruta según tu estructura
import { MemoryAgent } from './memory-agent'; // Suponemos que existe
import { DashboardAgent } from './dashboard-agent'; // Pa’ reportes

interface PreguntaDinamica {
  texto: string;
  nivel: number;
  dependeDe?: { pregunta: string; respuestaEsperada: string }; // Dependencias entre preguntas
  dominio: string; // Ej. "trading", "general"
}

interface PatronRespuesta {
  pregunta: string;
  respuestaComun: string;
  frecuencia: number;
}

export class QuestionAgent extends BaseAgent {
  private memoryAgent: MemoryAgent;
  private dashboardAgent: DashboardAgent;
  private preguntasBase: PreguntaDinamica[] = [
    // Nivel 1: Exploración inicial
    { texto: '¿Cuál es la idea principal del proyecto?', nivel: 1, dominio: 'general' },
    { texto: '¿Qué problema busca resolver?', nivel: 1, dominio: 'general' },
    { texto: '¿Quiénes serían los usuarios finales?', nivel: 1, dominio: 'general' },
    { texto: '¿Cuál sería el nombre o identificador del proyecto?', nivel: 1, dominio: 'general' },
    // Nivel 2: Definición
    { texto: '¿Cuáles son los objetivos a corto y largo plazo?', nivel: 2, dominio: 'general' },
    { texto: '¿Hay un MVP o prototipo en mente?', nivel: 2, dominio: 'general' },
    { texto: '¿Qué tecnologías o frameworks tienes en mente?', nivel: 2, dominio: 'general' },
    { texto: '¿Existen riesgos técnicos o de adopción que te preocupen?', nivel: 2, dominio: 'general' },
    // Nivel 3: Detalles
    { texto: '¿Quiénes son los stakeholders o personas clave involucradas?', nivel: 3, dominio: 'general' },
    { texto: '¿Qué métricas usarías para validar si el proyecto está bien encaminado?', nivel: 3, dominio: 'general' },
    { texto: '¿Hay algún agente o módulo que ya esté trabajando este proyecto?', nivel: 3, dominio: 'general' },
    { texto: '¿Con qué otros proyectos o ideas se relaciona este?', nivel: 3, dominio: 'general' },
    // Dominio: Trading
    { texto: '¿Qué pares de trading quieres incluir? (ej. EUR/USD, BTC/ETH)', nivel: 1, dominio: 'trading' },
    { texto: '¿Qué estrategias de trading prefieres? (ej. scalping, swing)', nivel: 1, dominio: 'trading' },
    { texto: '¿Qué fuentes de datos necesitas? (ej. Binance, Twitter/X)', nivel: 2, dominio: 'trading' },
    { texto: '¿Quieres incluir análisis de noticias o sentimiento?', nivel: 2, dominio: 'trading' },
    { texto: '¿Necesitas backtesting para las estrategias?', nivel: 3, dominio: 'trading', dependeDe: { pregunta: '¿Qué estrategias de trading prefieres?', respuestaEsperada: '.*' } },
    { texto: '¿Qué indicadores técnicos prefieres? (ej. RSI, MACD)', nivel: 3, dominio: 'trading', dependeDe: { pregunta: '¿Qué estrategias de trading prefieres?', respuestaEsperada: '.*' } },
  ];

  constructor(userId: string) {
    super(userId);
    this.agentName = 'QuestionAgent';
    this.memoryAgent = new MemoryAgent();
    this.dashboardAgent = new DashboardAgent();
  }

  // Genera preguntas dinámicas según nivel y dominio
  async generarPreguntas(contexto: ContextoProyecto, dominio: string = 'general'): Promise<string[]> {
    if (contexto.licencia === 'Community' && contexto.nivelContextual > 2) {
      throw new Error('Community Edition limita a nivel 2');
    }

    // Filtra preguntas según nivel y dominio
    const preguntasFiltradas = this.preguntasBase.filter(
      (p) => p.nivel <= contexto.nivelContextual && p.dominio === dominio
    );

    // Filtra preguntas dependientes
    const respuestasPrevias = await this.memoryAgent.buscar<{ pregunta: string; respuesta: string }>({
      tipo: 'respuesta',
      proyectoId: contexto.id,
    });

    const preguntasFinales: string[] = [];
    for (const pregunta of preguntasFiltradas) {
      if (pregunta.dependeDe) {
        const dependencia = respuestasPrevias.find((r) => r.pregunta === pregunta.dependeDe!.pregunta);
        if (dependencia && new RegExp(pregunta.dependeDe!.respuestaEsperada).test(dependencia.respuesta)) {
          preguntasFinales.push(pregunta.texto);
        }
      } else {
        preguntasFinales.push(pregunta.texto);
      }
    }

    // Usa IA pa’ generar preguntas adicionales si el contexto es avanzado
    if (contexto.metricas.claridadContexto > 50) {
      const prompt = `Genera 2 preguntas adicionales pa’ aclarar un proyecto de ${dominio} con idea: ${contexto.idea}`;
      const nuevasPreguntas = await this.ejecutarPrompt(contexto, prompt);
      preguntasFinales.push(...JSON.parse(nuevasPreguntas));
    }

    contexto.preguntas = preguntasFinales;
    await this.registrarActividad(contexto, 'preguntas generadas', { preguntas: preguntasFinales });
    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      preguntas: preguntasFinales,
      estado: 'esperando respuestas',
    });

    // Muestra preguntas en VS Code
    for (const pregunta of preguntasFinales) {
      await vscode.window.showInformationMessage(`Pregunta: ${pregunta}`);
    }

    return preguntasFinales;
  }

  // Recolecta respuestas del usuario
  async recolectarRespuestas(contexto: ContextoProyecto, preguntas: string[]): Promise<Record<string, string>> {
    const respuestas: Record<string, string> = {};
    for (const pregunta of preguntas) {
      const respuesta = await vscode.window.showInputBox({
        prompt: pregunta,
        placeHolder: 'Escribe tu respuesta aquí...',
      });
      if (respuesta) {
        respuestas[pregunta] = respuesta;
        await this.memoryAgent.store(
          { pregunta, respuesta },
          { tipo: 'respuesta', proyectoId: contexto.id }
        );
      }
    }

    await this.registrarActividad(contexto, 'respuestas recolectadas', { respuestas });
    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      respuestas,
      estado: 'respuestas recibidas',
    });

    return respuestas;
  }

  // Actualiza el contexto con las respuestas
  async actualizarContexto(contexto: ContextoProyecto, respuestas: Record<string, string>): Promise<ContextoProyecto> {
    const now = new Date().toISOString();
    contexto.ultimaActualizacion = now;

    for (const [pregunta, respuesta] of Object.entries(respuestas)) {
      if (pregunta.includes('idea')) contexto.idea = respuesta;
      if (pregunta.includes('problema')) contexto.problema = respuesta;
      if (pregunta.includes('usuario')) contexto.usuarios = respuesta;
      if (pregunta.includes('objetivo')) contexto.metas.push(respuesta);
      if (pregunta.includes('stakeholder')) contexto.stakeholders.push(respuesta);
      if (pregunta.includes('riesgo')) contexto.riesgos.push(respuesta);
      if (pregunta.includes('nombre')) contexto.nombre = respuesta;
      if (pregunta.includes('tecnologías')) contexto.tags.push(...respuesta.split(',').map(t => t.trim()));
      if (pregunta.includes('proyectos o ideas')) {
        const proyectosRelacionados = respuesta.split(',').map(p => p.trim());
        for (const proyecto of proyectosRelacionados) {
          await this.agregarRelacion(contexto, 'dependeDe', proyecto);
        }
      }
      if (pregunta.includes('pares de trading')) contexto.modulos = respuesta.split(',').map(m => m.trim());
      if (pregunta.includes('estrategias')) contexto.tags.push(...respuesta.split(',').map(t => t.trim()));
      if (pregunta.includes('fuentes')) contexto.tags.push(...respuesta.split(',').map(t => t.trim()));
      if (pregunta.includes('indicadores')) contexto.tags.push(...respuesta.split(',').map(t => t.trim()));
    }

    await this.actualizarMetricas(contexto);
    await this.registrarActividad(contexto, 'contexto actualizado con respuestas', { respuestas });
    return contexto;
  }

  // Propone mejoras basadas en patrones de respuestas
  async proponerMejora(contexto: ContextoProyecto): Promise<string | null> {
    const respuestasPrevias = await this.memoryAgent.buscar<{ pregunta: string; respuesta: string }>({
      tipo: 'respuesta',
      proyectoId: contexto.id,
    });

    // Busca patrones en respuestas
    const patrones: PatronRespuesta[] = [];
    for (const pregunta of this.preguntasBase) {
      const respuestas = respuestasPrevias.filter(r => r.pregunta === pregunta.texto);
      const respuestaComun = this.encontrarRespuestaComun(respuestas);
      if (respuestaComun) {
        patrones.push({
          pregunta: pregunta.texto,
          respuestaComun,
          frecuencia: respuestas.filter(r => r.respuesta === respuestaComun).length,
        });
      }
    }

    // Si una respuesta es muy común, sugiere incluirla por default
    const patron = patrones.find(p => p.frecuencia > 3); // Umbral: 3 proyectos
    if (patron) {
      this.preguntasBase = this.preguntasBase.map(p => {
        if (p.texto === patron.pregunta) {
          return { ...p, texto: `${p.texto} (Sugerencia: ${patron.respuestaComun})` };
        }
        return p;
      });
      await this.registrarActividad(contexto, 'mejora propuesta', { patron });
      return `Pregunta optimizada: ${patron.pregunta} con sugerencia ${patron.respuestaComun}`;
    }

    // Si hay muchas preguntas sin respuesta, reduce el número
    const preguntasSinRespuesta = respuestasPrevias.filter(r => !r.respuesta).length;
    if (preguntasSinRespuesta > 5) {
      this.preguntasBase = this.preguntasBase.slice(0, 3); // Limita a 3 preguntas
      await this.registrarActividad(contexto, 'mejora propuesta', { accion: 'reducir preguntas' });
      return 'Reduciendo preguntas pa’ mejorar engagement';
    }

    return null;
  }

  // Encuentra la respuesta más común
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
}