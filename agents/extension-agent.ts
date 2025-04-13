import { BaseAgent, ContextoProyecto } from '../base-agent'; // Ajusta la ruta
import { MemoryAgent } from '../memory-agent';
import { DashboardAgent } from '../dashboard-agent';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface Extension {
  id: string;
  type: 'module' | 'integration' | 'configuration';
  name: string;
  description: string;
  code?: string; // Código generado (ej. nuevo scraper)
  config?: Record<string, any>; // Configuración (ej. API keys)
  dependencies?: string[]; // Dependencias (ej. otros módulos)
  status: 'proposed' | 'implemented' | 'failed';
  timestamp: string;
}

export class ExtensionAgent extends BaseAgent {
  private extensionsDir: string;
  private memoryAgent: MemoryAgent;
  private dashboardAgent: DashboardAgent;
  private currentExtension: Extension | null = null;

  constructor(userId: string) {
    super(userId);
    this.agentName = 'ExtensionAgent';
    this.extensionsDir = join(process.cwd(), 'context', 'extensions');
    this.memoryAgent = new MemoryAgent();
    this.dashboardAgent = new DashboardAgent();

    // Crear directorio si no existe
    if (!existsSync(this.extensionsDir)) {
      mkdirSync(this.extensionsDir, { recursive: true });
    }
  }

  // Método principal para ejecutar ExtensionAgent
  async run(contexto: ContextoProyecto, spec: string): Promise<void> {
    if (contexto.licencia === 'Community' && spec.includes('advanced')) {
      throw new Error('Community Edition no soporta extensiones avanzadas');
    }

    await this.registrarActividad(contexto, 'iniciando ExtensionAgent', { spec });

    if (spec.startsWith('propose:')) {
      const extensionIdea = spec.substring('propose:'.length).trim();
      await this.proposeExtension(contexto, extensionIdea);
    } else if (spec.startsWith('implement:')) {
      const extensionId = spec.substring('implement:'.length).trim();
      await this.implementExtension(contexto, extensionId);
    } else if (spec.startsWith('evaluate:')) {
      const extensionId = spec.substring('evaluate:'.length).trim();
      await this.evaluateExtension(contexto, extensionId);
    } else {
      throw new Error('Especificación no válida. Usa propose:, implement:, o evaluate:');
    }
  }

  // Propone una nueva extensión
  private async proposeExtension(contexto: ContextoProyecto, idea: string): Promise<void> {
    const prompt = `
    # Tarea de ExtensionAgent
    Propón una extensión para el proyecto "${contexto.nombre}" basada en la idea: "${idea}".
    Contexto: ${JSON.stringify(contexto, null, 2)}

    Genera una extensión con:
    1. Tipo (module, integration, configuration)
    2. Nombre y descripción
    3. Código necesario (si aplica, en TypeScript)
    4. Configuración requerida (si aplica)
    5. Dependencias (si aplica)

    Formato: JSON con la estructura:
    {
      "id": "ext-001",
      "type": "module",
      "name": "Nombre",
      "description": "Descripción",
      "code": "Código TypeScript (si aplica)",
      "config": { "key": "value" },
      "dependencies": ["módulo1"],
      "status": "proposed",
      "timestamp": "2025-04-11T00:00:00.000Z"
    }
    `;

    const result = await this.ejecutarPrompt(contexto, prompt);
    const extension = JSON.parse(result) as Extension;
    this.currentExtension = extension;

    // Guardar la extensión
    const extensionPath = join(this.extensionsDir, `${extension.id}.json`);
    writeFileSync(extensionPath, JSON.stringify(extension, null, 2), 'utf-8');

    await this.memoryAgent.store(
      { extensionId: extension.id, details: extension },
      { tipo: 'extension', proyectoId: contexto.id }
    );

    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      extension: extension,
      estado: 'extensión propuesta',
    });

    await this.registrarActividad(contexto, 'extensión propuesta', { extensionId: extension.id });
  }

  // Implementa una extensión propuesta
  private async implementExtension(contexto: ContextoProyecto, extensionId: string): Promise<void> {
    const storedExtension = await this.memoryAgent.buscar<Extension>({
      tipo: 'extension',
      proyectoId: contexto.id,
      extensionId,
    });

    if (!storedExtension.length) {
      throw new Error(`Extensión ${extensionId} no encontrada`);
    }

    const extension = storedExtension[0].details;
    if (extension.status !== 'proposed') {
      throw new Error(`Extensión ${extensionId} no está en estado 'proposed'`);
    }

    // Generar código de implementación si no existe
    if (!extension.code) {
      const prompt = `
      Genera el código de implementación para la extensión:
      ${JSON.stringify(extension, null, 2)}
      Contexto: ${JSON.stringify(contexto, null, 2)}

      Formato: Código TypeScript.
      `;
      extension.code = await this.ejecutarPrompt(contexto, prompt);
    }

    // Guardar el código en el sistema de archivos
    if (extension.type === 'module') {
      const modulePath = join(process.cwd(), 'src', 'modules', `${extension.name.toLowerCase()}.ts`);
      writeFileSync(modulePath, extension.code, 'utf-8');
      contexto.modulos.push(extension.name);
    } else if (extension.type === 'integration') {
      const integrationPath = join(process.cwd(), 'src', 'integrations', `${extension.name.toLowerCase()}.ts`);
      writeFileSync(integrationPath, extension.code, 'utf-8');
      contexto.integraciones = contexto.integraciones || [];
      contexto.integraciones.push(extension.name);
    } else if (extension.type === 'configuration') {
      const configPath = join(process.cwd(), 'config', `${extension.name.toLowerCase()}.json`);
      writeFileSync(configPath, JSON.stringify(extension.config, null, 2), 'utf-8');
    }

    // Actualizar estado
    extension.status = 'implemented';
    const extensionPath = join(this.extensionsDir, `${extension.id}.json`);
    writeFileSync(extensionPath, JSON.stringify(extension, null, 2), 'utf-8');

    await this.memoryAgent.store(
      { extensionId: extension.id, details: extension },
      { tipo: 'extension', proyectoId: contexto.id }
    );

    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      extension: extension,
      estado: 'extensión implementada',
    });

    await this.registrarActividad(contexto, 'extensión implementada', { extensionId });
  }

  // Evalúa una extensión propuesta
  private async evaluateExtension(contexto: ContextoProyecto, extensionId: string): Promise<void> {
    const storedExtension = await this.memoryAgent.buscar<Extension>({
      tipo: 'extension',
      proyectoId: contexto.id,
      extensionId,
    });

    if (!storedExtension.length) {
      throw new Error(`Extensión ${extensionId} no encontrada`);
    }

    const extension = storedExtension[0].details;

    const prompt = `
    Evalúa la extensión propuesta:
    ${JSON.stringify(extension, null, 2)}
    Contexto: ${JSON.stringify(contexto, null, 2)}

    Analiza:
    1. Viabilidad técnica (1-10)
    2. Impacto en el sistema (1-10)
    3. Recursos necesarios
    4. Riesgos potenciales
    5. Recomendaciones

    Formato: Markdown.
    `;

    const evaluation = await this.ejecutarPrompt(contexto, prompt);
    const evaluationPath = join(this.extensionsDir, `${extension.id}-evaluation.md`);
    writeFileSync(evaluationPath, evaluation, 'utf-8');

    await this.dashboardAgent.actualizarWebview({
      proyectoId: contexto.id,
      evaluacion: evaluation,
      estado: 'extensión evaluada',
    });

    await this.registrarActividad(contexto, 'extensión evaluada', { extensionId, evaluationPath });
  }

  // Auto-mejora
  async proponerMejora(contexto: ContextoProyecto): Promise<string | null> {
    const extensiones = await this.memoryAgent.buscar<Extension>({ tipo: 'extension', proyectoId: contexto.id });
    const fallidas = extensiones.filter(e => e.details.status === 'failed');

    if (fallidas.length > 2) {
      const tiposFrecuentes = fallidas.reduce((acc, e) => {
        acc[e.details.type] = (acc[e.details.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const tipoProblematico = Object.entries(tiposFrecuentes).find(([, count]) => count > 1);
      if (tipoProblematico) {
        const [tipo] = tipoProblematico;
        await this.registrarActividad(contexto, 'mejora propuesta', { tipo, accion: 'revisar' });
        return `Revisar extensiones de tipo "${tipo}" por alta tasa de fallos`;
      }
    }

    // Si hay muchas extensiones similares exitosas, sugerir una plantilla
    const exitosas = extensiones.filter(e => e.details.status === 'implemented');
    const nombresFrecuentes = exitosas.reduce((acc, e) => {
      acc[e.details.name] = (acc[e.details.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const nombreComun = Object.entries(nombresFrecuentes).find(([, count]) => count > 2);
    if (nombreComun) {
      const [nombre] = nombreComun;
      const plantilla = exitosas.find(e => e.details.name === nombre)!.details;
      await this.memoryAgent.store(
        { plantilla: nombre, details: plantilla },
        { tipo: 'plantilla', proyectoId: contexto.id }
      );
      return `Creando plantilla para extensiones "${nombre}"`;
    }

    return null;
  }
}