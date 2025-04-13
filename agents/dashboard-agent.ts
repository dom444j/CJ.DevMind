import { BaseAgent, AgentEventType } from './base-agent';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

/**
 * Dashboard Agent - Crea y gestiona el dashboard visual del proyecto
 * 
 * Este agente es responsable de:
 * 1. Generar un dashboard web para visualizar el estado del proyecto
 * 2. Crear visualizaciones de grafos de componentes y relaciones
 * 3. Mostrar logs en tiempo real de los agentes
 * 4. Proporcionar previsualizaciones de componentes UI
 * 5. Mantener el estado global del sistema
 */
export class DashboardAgent extends BaseAgent {
  private dashboardDir: string;
  private serverProcess: any;
  private isRunning: boolean = false;
  
  constructor() {
    super('Dashboard Agent');
    this.dashboardDir = path.join(process.cwd(), 'dashboard');
    
    // Registrar manejadores de eventos específicos para el dashboard
    this.registerDashboardEventHandlers();
  }
  
  /**
   * Registra manejadores de eventos específicos para el dashboard
   */
  private registerDashboardEventHandlers(): void {
    // Escuchar cuando se crea un nuevo recurso para actualizar el grafo
    this.listenForEvent(AgentEventType.RESOURCE_CREATED, async (message) => {
      this.log(`📊 Nuevo recurso detectado: ${message.content.path}`);
      if (this.isRunning) {
        await this.updateProjectGraph();
      }
    });
    
    // Escuchar cuando un agente inicia o completa una tarea
    this.listenForEvent(AgentEventType.TASK_STARTED, async (message) => {
      this.log(`🚀 Agente ${message.from} inició tarea: ${message.content.task}`);
      if (this.isRunning) {
        await this.updateAgentStatus();
      }
    });
    
    this.listenForEvent(AgentEventType.TASK_COMPLETED, async (message) => {
      this.log(`✅ Agente ${message.from} completó tarea: ${message.content.task}`);
      if (this.isRunning) {
        await this.updateAgentStatus();
      }
    });
  }
  
  /**
   * Escucha un tipo específico de evento
   */
  private listenForEvent(eventType: AgentEventType, handler: Function): void {
    // Implementar usando el sistema de eventos de BaseAgent
    this.on(eventType, (message) => {
      handler(message);
    });
  }
  
  /**
   * Ejecuta el Dashboard Agent para crear o actualizar el dashboard
   * @param dashboardSpec Especificación del dashboard a crear/actualizar
   */
  async run(dashboardSpec: string): Promise<void> {
    this.log(`📊 Dashboard Agent trabajando en: "${dashboardSpec}"`);
    
    // Leer contexto relevante
    const coreContext = this.readContext('core.md');
    const projectState = this.readProjectState();
    
    // Determinar la acción a realizar
    if (dashboardSpec === 'init') {
      await this.initializeDashboard();
    } else if (dashboardSpec === 'update') {
      await this.updateDashboard();
    } else if (dashboardSpec === 'start') {
      await this.startDashboard();
    } else if (dashboardSpec === 'stop') {
      await this.stopDashboard();
    } else if (dashboardSpec === 'status') {
      this.getDashboardStatus();
    } else {
      await this.customizeDashboard(dashboardSpec);
    }
    
    // Notificar a otros agentes sobre la acción realizada
    this.sendMessage('all', AgentEventType.AGENT_MESSAGE, {
      action: dashboardSpec,
      status: 'completed',
      timestamp: new Date()
    });
  }
  
  /**
   * Inicia el servidor del dashboard
   */
  private async startDashboard(): Promise<void> {
    this.log('🚀 Iniciando servidor del dashboard...');
    
    // Verificar si existe el dashboard
    if (!fs.existsSync(this.dashboardDir)) {
      this.log('⚠️ El dashboard no existe. Ejecutando inicialización...', 'warning');
      await this.initializeDashboard();
    }
    
    // Verificar si ya está en ejecución
    if (this.isRunning) {
      this.log('⚠️ El dashboard ya está en ejecución', 'warning');
      return;
    }
    
    // Iniciar el servidor
    try {
      // Crear un servidor WebSocket para comunicación en tiempo real
      this.setupWebSocketServer();
      
      // Iniciar el servidor Next.js
      this.serverProcess = exec('cd dashboard && npm run dev', (error, stdout, stderr) => {
        if (error) {
          this.log(`❌ Error al iniciar el servidor: ${error}`, 'error');
          this.isRunning = false;
          return;
        }
      });
      
      this.serverProcess.stdout.on('data', (data) => {
        this.log(`📊 Dashboard: ${data.toString().trim()}`);
      });
      
      this.serverProcess.stderr.on('data', (data) => {
        this.log(`⚠️ Dashboard Error: ${data.toString().trim()}`, 'warning');
      });
      
      this.isRunning = true;
      this.log('✅ Servidor del dashboard iniciado en http://localhost:3000');
      
      // Actualizar el estado inicial
      await this.updateProjectGraph();
      await this.updateAgentStatus();
      
      // Registrar el dashboard como recurso
      this.recordResource('dashboard', 'http://localhost:3000');
    } catch (error) {
      this.log(`❌ Error al iniciar el servidor: ${error}`, 'error');
      throw error;
    }
  }
  
  /**
   * Detiene el servidor del dashboard
   */
  private async stopDashboard(): Promise<void> {
    this.log('🛑 Deteniendo servidor del dashboard...');
    
    if (!this.isRunning) {
      this.log('⚠️ El dashboard no está en ejecución', 'warning');
      return;
    }
    
    try {
      // Detener el proceso del servidor
      if (this.serverProcess) {
        // En Windows, necesitamos usar taskkill para terminar el proceso
        exec('taskkill /pid ' + this.serverProcess.pid + ' /f /t', (error, stdout, stderr) => {
          if (error) {
            this.log(`⚠️ Error al detener el proceso: ${error}`, 'warning');
          }
          this.log('✅ Servidor del dashboard detenido');
        });
      }
      
      this.isRunning = false;
    } catch (error) {
      this.log(`❌ Error al detener el servidor: ${error}`, 'error');
      throw error;
    }
  }
  
  /**
   * Obtiene el estado actual del dashboard
   */
  private getDashboardStatus(): void {
    if (this.isRunning) {
      this.log('✅ Dashboard en ejecución: http://localhost:3000');
    } else {
      this.log('⚠️ Dashboard no está en ejecución');
    }
    
    // Verificar si existe el dashboard
    if (!fs.existsSync(this.dashboardDir)) {
      this.log('⚠️ El dashboard no está inicializado');
    } else {
      this.log('✅ Dashboard inicializado');
    }
  }
  
  /**
   * Configura un servidor WebSocket para comunicación en tiempo real
   */
  private setupWebSocketServer(): void {
    // Implementar un servidor WebSocket simple para comunicación en tiempo real
    // Esto permitirá enviar actualizaciones en tiempo real al dashboard
    
    // Generar el archivo del servidor WebSocket
    const wsServerDir = path.join(this.dashboardDir, 'server');
    if (!fs.existsSync(wsServerDir)) {
      fs.mkdirSync(wsServerDir, { recursive: true });
    }
    
    const wsServerCode = `const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Crear servidor HTTP
const server = http.createServer();

// Crear servidor WebSocket
const wss = new WebSocket.Server({ server });

// Almacenar conexiones activas
const clients = new Set();

// Manejar conexiones
wss.on('connection', (ws) => {
  console.log('Cliente conectado');
  clients.add(ws);
  
  // Enviar logs iniciales
  const logsDir = path.join(__dirname, '..', '..', 'logs');
  if (fs.existsSync(logsDir)) {
    const logFiles = fs.readdirSync(logsDir).filter(file => file.endsWith('.log'));
    
    for (const logFile of logFiles) {
      try {
        const logPath = path.join(logsDir, logFile);
        const logContent = fs.readFileSync(logPath, 'utf-8');
        const logEntries = logContent.split('\\n')
          .filter(line => line.trim())
          .map(line => {
            // Parsear la línea de log
            const match = line.match(/\\[(.*?)\\] \\[(.*?)\\] \\[(.*?)\\] (.*)/);
            if (match) {
              return {
                timestamp: match[1],
                agent: match[2],
                level: match[3].toLowerCase(),
                message: match[4]
              };
            }
            return null;
          })
          .filter(entry => entry);
        
        // Enviar los últimos 100 logs
        const recentLogs = logEntries.slice(-100);
        for (const log of recentLogs) {
          ws.send(JSON.stringify(log));
        }
      } catch (error) {
        console.error(\`Error al leer archivo de log \${logFile}:\`, error);
      }
    }
  }
  
  // Configurar vigilancia de archivos de log
  const watchLogFiles = () => {
    if (fs.existsSync(logsDir)) {
      fs.watch(logsDir, (eventType, filename) => {
        if (eventType === 'change' && filename.endsWith('.log')) {
          try {
            const logPath = path.join(logsDir, filename);
            const stats = fs.statSync(logPath);
            const fileSizeInBytes = stats.size;
            
            // Leer solo las últimas líneas añadidas
            const fileDescriptor = fs.openSync(logPath, 'r');
            const buffer = Buffer.alloc(1024); // Leer los últimos 1KB
            const bytesToRead = Math.min(1024, fileSizeInBytes);
            const position = Math.max(0, fileSizeInBytes - bytesToRead);
            
            fs.readSync(fileDescriptor, buffer, 0, bytesToRead, position);
            fs.closeSync(fileDescriptor);
            
            const content = buffer.toString('utf8');
            const lines = content.split('\\n').filter(line => line.trim());
            
            // Tomar solo la última línea completa
            if (lines.length > 0) {
              const lastLine = lines[lines.length - 1];
              const match = lastLine.match(/\\[(.*?)\\] \\[(.*?)\\] \\[(.*?)\\] (.*)/);
              
              if (match) {
                const logEntry = {
                  timestamp: match[1],
                  agent: match[2],
                  level: match[3].toLowerCase(),
                  message: match[4]
                };
                
                // Enviar a todos los clientes
                for (const client of clients) {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(logEntry));
                  }
                }
              }
            }
          } catch (error) {
            console.error(\`Error al procesar cambio en archivo de log \${filename}:\`, error);
          }
        }
      });
    }
  };
  
  watchLogFiles();
  
  // Manejar mensajes del cliente
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Mensaje recibido:', data);
      
      // Aquí se pueden implementar comandos específicos
      // Por ejemplo, solicitar actualizaciones de estado
    } catch (error) {
      console.error('Error al procesar mensaje:', error);
    }
  });
  
  // Manejar desconexión
  ws.on('close', () => {
    console.log('Cliente desconectado');
    clients.delete(ws);
  });
});

// Iniciar servidor
const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log(\`Servidor WebSocket iniciado en puerto \${PORT}\`);
});

// Función para enviar actualizaciones a todos los clientes
function broadcastUpdate(type, data) {
  const message = JSON.stringify({ type, data, timestamp: new Date() });
  
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

// Exportar para uso externo
module.exports = { broadcastUpdate };
`;
    
    fs.writeFileSync(
      path.join(wsServerDir, 'ws-server.js'),
      wsServerCode,
      'utf-8'
    );
    
    // Agregar dependencia de ws al package.json
    const packageJsonPath = path.join(this.dashboardDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        packageJson.dependencies = packageJson.dependencies || {};
        packageJson.dependencies.ws = "^8.13.0";
        
        // Agregar script para iniciar el servidor WebSocket
        packageJson.scripts = packageJson.scripts || {};
        packageJson.scripts.ws = "node server/ws-server.js";
        
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
      } catch (error) {
        this.log(`❌ Error al actualizar package.json: ${error}`, 'error');
      }
    }
    
    // Iniciar el servidor WebSocket
    exec('cd dashboard && npm install ws && node server/ws-server.js', (error, stdout, stderr) => {
      if (error) {
        this.log(`❌ Error al iniciar servidor WebSocket: ${error}`, 'error');
        return;
      }
      this.log('✅ Servidor WebSocket iniciado en puerto 3001');
    });
  }
  
  /**
   * Inicializa el dashboard por primera vez
   */
  private async initializeDashboard(): Promise<void> {
    this.log('🚀 Inicializando dashboard...');
    
    // Verificar si ya existe la estructura del dashboard
    if (fs.existsSync(this.dashboardDir)) {
      this.log('⚠️ El dashboard ya existe. Usa "update" para actualizarlo.', 'warning');
      return;
    }
    
    // Crear estructura de carpetas
    fs.mkdirSync(this.dashboardDir, { recursive: true });
    fs.mkdirSync(path.join(this.dashboardDir, 'src'), { recursive: true });
    fs.mkdirSync(path.join(this.dashboardDir, 'src', 'components'), { recursive: true });
    fs.mkdirSync(path.join(this.dashboardDir, 'src', 'pages'), { recursive: true });
    fs.mkdirSync(path.join(this.dashboardDir, 'src', 'api'), { recursive: true });
    fs.mkdirSync(path.join(this.dashboardDir, 'src', 'hooks'), { recursive: true });
    fs.mkdirSync(path.join(this.dashboardDir, 'src', 'utils'), { recursive: true });
    fs.mkdirSync(path.join(this.dashboardDir, 'src', 'context'), { recursive: true });
    
    // Generar archivos base
    this.generatePackageJson();
    this.generateNextConfig();
    this.generateTailwindConfig();
    this.generateIndexPage();
    this.generateGraphComponent();
    this.generateAgentStatusComponent();
    this.generateLogViewerComponent();
    this.generateWebSocketService();
    this.generateApiRoutes();
    this.generateSharedContextViewer();
    this.generateDecisionHistoryComponent();
    
    // Instalar dependencias
    this.log('📦 Instalando dependencias...');
    return new Promise((resolve, reject) => {
      exec('cd dashboard && npm install', (error, stdout, stderr) => {
        if (error) {
          this.log(`❌ Error al instalar dependencias: ${error}`, 'error');
          reject(error);
          return;
        }
        this.log('✅ Dashboard inicializado correctamente');
        this.log('🚀 Para iniciar el dashboard: cd dashboard && npm run dev');
        
        // Registrar el dashboard como recurso
        this.recordResource('dashboard', path.join(process.cwd(), 'dashboard'));
        
        // Notificar a otros agentes
        this.sendMessage('all', AgentEventType.RESOURCE_CREATED, {
          type: 'dashboard',
          path: path.join(process.cwd(), 'dashboard')
        });
        
        resolve();
      });
    });
  }
  
  /**
   * Actualiza el dashboard existente
   */
  private async updateDashboard(): Promise<void> {
    this.log('🔄 Actualizando dashboard...');
    
    // Verificar si existe el dashboard
    if (!fs.existsSync(this.dashboardDir)) {
      this.log('⚠️ El dashboard no existe. Usa "init" para crearlo primero.', 'warning');
      return;
    }
    
    // Actualizar componentes y datos
    await this.updateProjectGraph();
    await this.updateAgentStatus();
    await this.updateSharedContext();
    
    this.log('✅ Dashboard actualizado correctamente');
    
    // Notificar a otros agentes
    this.sendMessage('all', AgentEventType.AGENT_MESSAGE, {
      action: 'dashboard-updated',
      timestamp: new Date()
    });
  }
  
  /**
   * Personaliza el dashboard según especificaciones
   */
  private async customizeDashboard(spec: string): Promise<void> {
    this.log(`🎨 Personalizando dashboard según: "${spec}"`);
    
    // Crear prompt para el LLM
    const dashboardPrompt = `
    # Tarea de Dashboard Agent
    
    Personaliza el dashboard de CJ.DevMind según la siguiente especificación:
    
    "${spec}"
    
    Genera los componentes React necesarios, estilos Tailwind y configuraciones.
    Utiliza el sistema de comunicación entre agentes para mostrar datos en tiempo real.
    `;
    
    try {
      // Consultar al LLM
      const response = await this.queryLLM(dashboardPrompt);
      
      // Procesar la respuesta y generar archivos
      this.processLLMResponse(response);
      
      this.log('✅ Dashboard personalizado correctamente');
      
      // Registrar la decisión de personalización
      this.recordDecision(
        `Personalizar dashboard según: "${spec}"`,
        `Se generaron componentes personalizados para el dashboard según la especificación del usuario.`
      );
    } catch (error) {
      this.log(`❌ Error al personalizar el dashboard: ${error}`, 'error');
      throw error;
    }
  }
  
  /**
   * Actualiza el grafo del proyecto
   */
  private async updateProjectGraph(): Promise<void> {
    this.log('🔄 Actualizando grafo del proyecto...');
    
    // Obtener recursos del contexto compartido
    const resources = this.getSharedContext().resources || {};
    
    // Construir el grafo basado en los recursos y dependencias
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
    
    // Agregar nodos para cada tipo de recurso
    Object.entries(resources).forEach(([resourceType, paths]) => {
      paths.forEach((resourcePath) => {
        const id = `${resourceType}-${path.basename(resourcePath)}`;
        const name = path.basename(resourcePath);
        
        if (!nodeMap.has(id)) {
          nodeMap.set(id, true);
          nodes.push({
            id,
            name,
            type: resourceType,
            path: resourcePath
          });
        }
      });
    });
    
    // Agregar enlaces basados en dependencias
    const dependencies = this.getSharedContext().dependencies || {};
    Object.entries(dependencies).forEach(([source, targets]) => {
      const sourceId = source;
      
      targets.forEach((target) => {
        const targetId = target;
        
        links.push({
          source: sourceId,
          target: targetId
        });
      });
    });
    
    // Guardar el grafo en un archivo JSON
    const graphData = { nodes, links };
    const graphPath = path.join(this.dashboardDir, 'public', 'data');
    
    if (!fs.existsSync(graphPath)) {
      fs.mkdirSync(graphPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(graphPath, 'project-graph.json'),
      JSON.stringify(graphData, null, 2),
      'utf-8'
    );
    
    this.log(`✅ Grafo del proyecto actualizado con ${nodes.length} nodos y ${links.length} enlaces`);
    
    // Actualizar la API para servir el grafo
    this.updateProjectGraphApi(graphData);
  }
  
  /**
   * Actualiza la API que sirve el grafo del proyecto
   */
  private updateProjectGraphApi(graphData: any): void {
    const apiDir = path.join(this.dashboardDir, 'src', 'pages', 'api');
    
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }
    
    const projectGraphApi = `import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Leer el grafo del proyecto desde el archivo
    const graphPath = path.join(process.cwd(), 'public', 'data', 'project-graph.json');
    
    if (fs.existsSync(graphPath)) {
      const graphData = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
      res.status(200).json(graphData);
    } else {
      // Datos de ejemplo si no existe el archivo
      const graphData = ${JSON.stringify(graphData, null, 2)};
      res.status(200).json(graphData);
    }
  } catch (error) {
    console.error('Error al obtener el grafo del proyecto:', error);
    res.status(500).json({ error: 'Error al obtener el grafo del proyecto' });
  }
}
`;
    
    fs.writeFileSync(
      path.join(apiDir, 'project-graph.ts'),
      projectGraphApi,
      'utf-8'
    );
  }
  
  /**
   * Actualiza el estado de los agentes
   */
  private async updateAgentStatus(): Promise<void> {
    this.log('🔄 Actualizando estado de los agentes...');
    
    // Obtener decisiones del contexto compartido para inferir actividad de agentes
    const decisions = this.getDecisions();
    
    // Agrupar decisiones por agente
    const agentDecisions = {};
    decisions.forEach((decision) => {
      if (!agentDecisions[decision.agent]) {
        agentDecisions[decision.agent] = [];
      }
      agentDecisions[decision.agent].push(decision);
    });
    
    // Construir estado de agentes
    const agents = Object.entries(agentDecisions).map(([agentName, decisions]) => {
      const lastDecision = decisions[decisions.length - 1];
      
      return {
        id: agentName.toLowerCase().replace(/\s+/g, '-'),
        name: agentName,
        status: Date.now() - new Date(lastDecision.timestamp).getTime() < 3600000 ? 'active' : 'idle',
        lastActivity: lastDecision.timestamp,
        currentTask: lastDecision.decision,
        progress: 100 // No podemos determinar el progreso real, así que usamos 100%
      };
    });
    
    // Agregar este agente si no está en la lista
    if (!agents.some(a => a.name === 'Dashboard Agent')) {
      agents.push({
        id: 'dashboard-agent',
        name: 'Dashboard Agent',
        status: 'active',
        lastActivity: new Date().toISOString(),
        currentTask: 'Actualizando estado de agentes',
        progress: 100
      });
    }
    
    // Guardar el estado de los agentes
    const agentStatusData = { agents };
    const dataPath = path.join(this.dashboardDir, 'public', 'data');
    
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(dataPath, 'agent-status.json'),
      JSON.stringify(agentStatusData, null, 2),
      'utf-8'
    );
    
    this.log(`✅ Estado de agentes actualizado con ${agents.length} agentes`);
    
    // Actualizar la API para servir el estado de los agentes
    this.updateAgentStatusApi(agentStatusData);
  }
  
  /**
   * Actualiza la API que sirve el estado de los agentes
   */
  private updateAgentStatusApi(agentStatusData: any): void {
    const apiDir = path.join(this.dashboardDir, 'src', 'pages', 'api');
    
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }
    
    const agentStatusApi = `import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Leer el estado de los agentes desde el archivo
    const statusPath = path.join(process.cwd(), 'public', 'data', 'agent-status.json');
    
    if (fs.existsSync(statusPath)) {
      const statusData = JSON.parse(fs.readFileSync(statusPath, 'utf-8'));
      res.status(200).json(statusData);
    } else {
      // Datos de ejemplo si no existe el archivo
      const statusData = ${JSON.stringify(agentStatusData, null, 2)};
      res.status(200).json(statusData);
    }
  } catch (error) {
    console.error('Error al obtener el estado de los agentes:', error);
    res.status(500).json({ error: 'Error al obtener el estado de los agentes' });
  }
}
`;
    
    fs.writeFileSync(
      path.join(apiDir, 'agent-status.ts'),
      agentStatusApi,
      'utf-8'
    );
  }
  
  /**
   * Actualiza el contexto compartido en el dashboard
   */
  private async updateSharedContext(): Promise<void> {
    this.log('🔄 Actualizando contexto compartido...');
    
    // Obtener el contexto compartido
    const sharedContext = this.getSharedContext();
    
    // Guardar el contexto compartido
    const dataPath = path.join(this.dashboardDir, 'public', 'data');
    
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(dataPath, 'shared-context.json'),
      JSON.stringify(sharedContext, null, 2),
      'utf-8'
    );
    
    this.log('✅ Contexto compartido actualizado');
    
    // Actualizar la API para servir el contexto compartido
    this.updateSharedContextApi(sharedContext);
  }
  
  /**
   * Actualiza la API que sirve el contexto compartido
   */
  private updateSharedContextApi(sharedContext: any): void {
    const apiDir = path.join(this.dashboardDir, 'src', 'pages', 'api');
    
    if (!fs.existsSync(apiDir)) {
      fs.mkdirSync(apiDir, { recursive: true });
    }
    
    const sharedContextApi = `import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Leer el contexto compartido desde el archivo
    const contextPath = path.join(process.cwd(), 'public', 'data', 'shared-context.json');
    
    if (fs.existsSync(contextPath)) {
      const contextData = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
      res.status(200).json(contextData);
    } else {
      // Datos de ejemplo si no existe el archivo
      const contextData = ${JSON.stringify(sharedContext, null, 2)};
      res.status(200).json(contextData);
    }
  } catch (error) {
    console.error('Error al obtener el contexto compartido:', error);
    res.status(500).json({ error: 'Error al obtener el contexto compartido' });
  }
}
`;
    
    fs.writeFileSync(
      path.join(apiDir, 'shared-context.ts'),
      sharedContextApi,
      'utf-8'
    );
  }
  
  /**
   * Genera el componente para visualizar el contexto compartido
   */
  private generateSharedContextViewer(): void {
    const sharedContextComponent = `import { useState } from 'react';
import useSWR from 'swr';
import { JsonView, defaultStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

interface SharedContextData {
  projectInfo?: Record<string, any>;
  resources?: Record<string, string[]>;
  decisions?: Array<{
    agent: string;
    decision: string;
    reasoning: string;
    timestamp: Date;
  }>;
  dependencies?: Record<string, string[]>;
  knowledge?: Record<string, any>;
}

export default function SharedContextViewer() {
  const [activeTab, setActiveTab] = useState<string>('all');
  
  const { data, error, isLoading, mutate } = useSWR<SharedContextData>(
    '/api/shared-context',
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error fetching shared context');
      return res.json();
    },
    { refreshInterval: 5000 } // Actualizar cada 5 segundos
  );
  
  if (isLoading) return <div className="p-4">Cargando contexto compartido...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;
  if (!data) return <div className="p-4">No hay datos de contexto disponibles</div>;
  
  // Filtrar datos según la pestaña activa
  const getFilteredData = () => {
    if (activeTab === 'all') return data;
    
    const filteredData: Partial<SharedContextData> = {};
    filteredData[activeTab] = data[activeTab];
    return filteredData;
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Contexto Compartido</h2>
      
      <div className="flex space-x-2 mb-4 border-b">
        <button
          className={\`px-3 py-2 \${activeTab === 'all' ? 'border-b-2 border-blue-500 text-blue-500' : ''}\`}
          onClick={() => setActiveTab('all')}
        >
          Todo
        </button>
        {data.projectInfo && (
          <button
            className={\`px-3 py-2 \${activeTab === 'projectInfo' ? 'border-b-2 border-blue-500 text-blue-500' : ''}\`}
            onClick={() => setActiveTab('projectInfo')}
          >
            Información del Proyecto
          </button>
        )}
        {data.resources && (
          <button
            className={\`px-3 py-2 \${activeTab === 'resources' ? 'border-b-2 border-blue-500 text-blue-500' : ''}\`}
            onClick={() => setActiveTab('resources')}
          >
            Recursos
          </button>
        )}
        {data.decisions && (
          <button
            className={\`px-3 py-2 \${activeTab === 'decisions' ? 'border-b-2 border-blue-500 text-blue-500' : ''}\`}
            onClick={() => setActiveTab('decisions')}
          >
            Decisiones
          </button>
        )}
        {data.dependencies && (
          <button
            className={\`px-3 py-2 \${activeTab === 'dependencies' ? 'border-b-2 border-blue-500 text-blue-500' : ''}\`}
            onClick={() => setActiveTab('dependencies')}
          >
            Dependencias
          </button>
        )}
        {data.knowledge && (
          <button
            className={\`px-3 py-2 \${activeTab === 'knowledge' ? 'border-b-2 border-blue-500 text-blue-500' : ''}\`}
            onClick={() => setActiveTab('knowledge')}
          >
            Conocimiento
          </button>
        )}
      </div>
      
      <div className="overflow-auto max-h-[500px]">
        <JsonView data={getFilteredData()} style={defaultStyles} />
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => mutate()}
        >
          Actualizar
        </button>
      </div>
    </div>
  );
}
`;

    const componentsDir = path.join(this.dashboardDir, 'src', 'components');
    fs.writeFileSync(
      path.join(componentsDir, 'SharedContextViewer.tsx'),
      sharedContextComponent,
      'utf-8'
    );
  }
  
  /**
   * Genera el componente para visualizar el historial de decisiones
   */
  private generateDecisionHistoryComponent(): void {
    const decisionHistoryComponent = `import { useState } from 'react';
import useSWR from 'swr';

interface Decision {
  agent: string;
  decision: string;
  reasoning: string;
  timestamp: string;
}

export default function DecisionHistory() {
  const [filter, setFilter] = useState<string>('');
  
  const { data, error, isLoading } = useSWR<{ decisions: Decision[] }>(
    '/api/shared-context',
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error fetching decisions');
      const data = await res.json();
      return { decisions: data.decisions || [] };
    },
    { refreshInterval: 5000 } // Actualizar cada 5 segundos
  );
  
  if (isLoading) return <div className="p-4">Cargando historial de decisiones...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;
  if (!data?.decisions || data.decisions.length === 0) {
    return <div className="p-4">No hay decisiones registradas</div>;
  }
  
  // Filtrar decisiones
  const filteredDecisions = data.decisions.filter(
    (decision) =>
      decision.agent.toLowerCase().includes(filter.toLowerCase()) ||
      decision.decision.toLowerCase().includes(filter.toLowerCase()) ||
      decision.reasoning.toLowerCase().includes(filter.toLowerCase())
  );
  
  // Ordenar por fecha (más reciente primero)
  const sortedDecisions = [...filteredDecisions].sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Historial de Decisiones</h2>
      
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filtrar decisiones..."
          className="w-full p-2 border rounded"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      
      <div className="overflow-auto max-h-[500px]">
        {sortedDecisions.map((decision, index) => (
          <div key={index} className="mb-4 p-3 border rounded hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <span className="font-semibold text-blue-600">{decision.agent}</span>
              <span className="text-sm text-gray-500">
                {new Date(decision.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="mt-2 font-medium">{decision.decision}</div>
            <div className="mt-1 text-sm text-gray-700">{decision.reasoning}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;

    const componentsDir = path.join(this.dashboardDir, 'src', 'components');
    fs.writeFileSync(
      path.join(componentsDir, 'DecisionHistory.tsx'),
      decisionHistoryComponent,
      'utf-8'
    );
  }
  
  /**
   * Genera el componente para visualizar el grafo del proyecto
   */
  private generateGraphComponent(): void {
    const graphComponent = `import { useEffect, useRef } from 'react';
import useSWR from 'swr';
import * as d3 from 'd3';

interface Node {
  id: string;
  name: string;
  type: string;
  path: string;
}

interface Link {
  source: string;
  target: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export default function ProjectGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const { data, error, isLoading } = useSWR<GraphData>(
    '/api/project-graph',
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error fetching graph data');
      return res.json();
    },
    { refreshInterval: 10000 } // Actualizar cada 10 segundos
  );
  
  useEffect(() => {
    if (!data || !svgRef.current) return;
    
    // Limpiar SVG
    d3.select(svgRef.current).selectAll('*').remove();
    
    const width = 800;
    const height = 600;
    
    // Crear el contenedor SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');
    
    // Crear el grupo principal
    const g = svg.append('g');
    
    // Zoom y pan
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    svg.call(zoom as any);
    
    // Preparar los datos para D3
    const nodes = data.nodes.map(node => ({ ...node }));
    const links = data.links.map(link => {
      // Convertir strings a referencias de objetos para D3
      const source = nodes.find(n => n.id === link.source) || link.source;
      const target = nodes.find(n => n.id === link.target) || link.target;
      return { source, target };
    });
    
    // Crear la simulación de fuerzas
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(50));
    
    // Crear los enlaces
    const link = g.append('g')
      .attr('stroke', '#999')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke-width', 2);
    
    // Crear los nodos
    const node = g.append('g')
      .selectAll('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .call((d3.drag() as any)
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );
    
    // Agregar círculos a los nodos
    node.append('circle')
      .attr('r', 10)
      .attr('fill', (d: any) => {
        // Color según el tipo de recurso
        const colorMap: Record<string, string> = {
          'component': '#4299e1', // blue
          'page': '#48bb78',      // green
          'api': '#ed8936',       // orange
          'dashboard': '#9f7aea', // purple
          'default': '#a0aec0'    // gray
        };
        return colorMap[d.type] || colorMap.default;
      });
    
    // Agregar etiquetas a los nodos
    node.append('text')
      .attr('dx', 15)
      .attr('dy', 4)
      .text((d: any) => d.name)
      .attr('fill', '#2d3748')
      .style('font-size', '12px');
    
    // Agregar tooltips
    node.append('title')
      .text((d: any) => \`\${d.name}\\nTipo: \${d.type}\\nRuta: \${d.path}\`);
    
    // Actualizar posiciones en cada tick de la simulación
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      
      node.attr('transform', (d: any) => \`translate(\${d.x},\${d.y})\`);
    });
    
    // Funciones para el arrastre de nodos
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
    
    // Leyenda
    const legend = svg.append('g')
      .attr('transform', 'translate(20, 20)');
    
    const types = ['component', 'page', 'api', 'dashboard'];
    const colors = ['#4299e1', '#48bb78', '#ed8936', '#9f7aea'];
    
    types.forEach((type, i) => {
      const legendRow = legend.append('g')
        .attr('transform', \`translate(0, \${i * 20})\`);
      
      legendRow.append('rect')
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', colors[i]);
      
      legendRow.append('text')
        .attr('x', 15)
        .attr('y', 10)
        .text(type)
        .style('font-size', '12px')
        .attr('fill', '#2d3748');
    });
    
  }, [data]);
  
  if (isLoading) return <div className="p-4">Cargando grafo del proyecto...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;
  if (!data || data.nodes.length === 0) {
    return <div className="p-4">No hay datos de grafo disponibles</div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Grafo del Proyecto</h2>
      <div className="border rounded p-2 overflow-auto">
        <svg ref={svgRef} className="w-full h-[600px]"></svg>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        Nodos: {data.nodes.length} | Enlaces: {data.links.length}
      </div>
    </div>
  );
}
`;

    const componentsDir = path.join(this.dashboardDir, 'src', 'components');
    fs.writeFileSync(
      path.join(componentsDir, 'ProjectGraph.tsx'),
      graphComponent,
      'utf-8'
    );
  }
  
  /**
   * Genera el componente para visualizar el estado de los agentes
   */
  private generateAgentStatusComponent(): void {
    const agentStatusComponent = `import useSWR from 'swr';

interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'error';
  lastActivity: string;
  currentTask: string;
  progress: number;
}

export default function AgentStatus() {
  const { data, error, isLoading } = useSWR<{ agents: Agent[] }>(
    '/api/agent-status',
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error fetching agent status');
      return res.json();
    },
    { refreshInterval: 3000 } // Actualizar cada 3 segundos
  );
  
  if (isLoading) return <div className="p-4">Cargando estado de agentes...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;
  if (!data?.agents || data.agents.length === 0) {
    return <div className="p-4">No hay agentes activos</div>;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-bold mb-4">Estado de Agentes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.agents.map((agent) => (
          <div key={agent.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">{agent.name}</h3>
              <span className={
                \`px-2 py-1 rounded-full text-xs font-medium 
                \${agent.status === 'active' ? 'bg-green-100 text-green-800' : 
                  agent.status === 'idle' ? 'bg-gray-100 text-gray-800' : 
                  'bg-red-100 text-red-800'}\`
              }>
                {agent.status === 'active' ? 'Activo' : 
                 agent.status === 'idle' ? 'Inactivo' : 'Error'}
              </span>
            </div>
            
            <div className="mt-2 text-sm text-gray-600">
              <div className="mb-1">
                <span className="font-medium">Última actividad:</span>{' '}
                {new Date(agent.lastActivity).toLocaleString()}
              </div>
              <div className="mb-2">
                <span className="font-medium">Tarea actual:</span>{' '}
                {agent.currentTask || 'Ninguna'}
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: \`\${agent.progress}%\` }}
                ></div>
              </div>
              <div className="text-right text-xs mt-1">
                {agent.progress}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
`;

    const componentsDir = path.join(this.dashboardDir, 'src', 'components');
    fs.writeFileSync(
      path.join(componentsDir, 'AgentStatus.tsx'),
      agentStatusComponent,
      'utf-8'
    );
  }
  
  /**
   * Genera el componente para visualizar los logs en tiempo real
   */
  private generateLogViewerComponent(): void {
    const logViewerComponent = `import { useState, useEffect, useRef } from 'react';

interface LogEntry {
  timestamp: string;
  agent: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const [agents, setAgents] = useState<string[]>([]);
  
  const logContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Conectar al WebSocket
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:3001');
      
      ws.onopen = () => {
        console.log('Conectado al servidor WebSocket');
        setConnected(true);
      };
      
      ws.onmessage = (event) => {
        try {
          const logEntry = JSON.parse(event.data) as LogEntry;
          
          setLogs((prevLogs) => {
            // Limitar a los últimos 1000 logs para evitar problemas de rendimiento
            const newLogs = [...prevLogs, logEntry].slice(-1000);
            
            // Actualizar lista de agentes
            const agentSet = new Set(newLogs.map(log => log.agent));
            setAgents(Array.from(agentSet));
            
            return newLogs;
          });
        } catch (error) {
          console.error('Error al procesar mensaje WebSocket:', error);
        }
      };
      
      ws.onclose = () => {
        console.log('Desconectado del servidor WebSocket');
        setConnected(false);
        
        // Reconectar después de 3 segundos
        setTimeout(connectWebSocket, 3000);
      };
      
      ws.onerror = (error) => {
        console.error('Error en la conexión WebSocket:', error);
        ws.close();
      };
      
      wsRef.current = ws;
    };
    
    connectWebSocket();
    
    // Limpiar al desmontar
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);
  
  // Auto-scroll
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);
  
  // Filtrar logs
  const filteredLogs = logs.filter((log) => {
    const matchesFilter = log.message.toLowerCase().includes(filter.toLowerCase()) ||
                          log.agent.toLowerCase().includes(filter.toLowerCase());
    const matchesAgent = selectedAgent === 'all' || log.agent === selectedAgent;
    const matchesLevel = selectedLevel === 'all' || log.level === selectedLevel;
    
    return matchesFilter && matchesAgent && matchesLevel;
  });
  
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Logs en Tiempo Real</h2>
        <div className="flex items-center">
          <span className={
            \`inline-block w-3 h-3 rounded-full mr-2 \${connected ? 'bg-green-500' : 'bg-red-500'}\`
          }></span>
          <span className="text-sm">
            {connected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="flex-grow">
          <input
            type="text"
            placeholder="Filtrar logs..."
            className="w-full p-2 border rounded"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            className="p-2 border rounded"
            value={selectedAgent}
            onChange={(e) => setSelectedAgent(e.target.value)}
          >
            <option value="all">Todos los agentes</option>
            {agents.map((agent) => (
              <option key={agent} value={agent}>{agent}</option>
            ))}
          </select>
          
          <select
            className="p-2 border rounded"
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
          >
            <option value="all">Todos los niveles</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="autoScroll"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="autoScroll" className="text-sm">Auto-scroll</label>
          </div>
        </div>
      </div>
      
      <div 
        ref={logContainerRef}
        className="font-mono text-sm bg-gray-900 text-gray-100 p-4 rounded h-[400px] overflow-auto"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-gray-500 italic">No hay logs que coincidan con los filtros</div>
        ) : (
          filteredLogs.map((log, index) => (
            <div key={index} className="mb-1">
              <span className="text-gray-400">[{log.timestamp}]</span>{' '}
              <span className={
                \`font-semibold \${
                  log.level === 'error' ? 'text-red-400' : 
                  log.level === 'warning' ? 'text-yellow-400' : 
                  'text-blue-400'
                }\`
              }>
                [{log.agent}]
              </span>{' '}
              <span className={
                log.level === 'error' ? 'text-red-300' : 
                log.level === 'warning' ? 'text-yellow-300' : 
                'text-gray-100'
              }>
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
      
      <div className="mt-2 text-sm text-gray-500 flex justify-between">
        <span>Total: {filteredLogs.length} logs</span>
        <button
          className="text-blue-500 hover:underline"
          onClick={() => setLogs([])}
        >
          Limpiar logs
        </button>
      </div>
    </div>
  );
}
`;

    const componentsDir = path.join(this.dashboardDir, 'src', 'components');
    fs.writeFileSync(
      path.join(componentsDir, 'LogViewer.tsx'),
      logViewerComponent,
      'utf-8'
    );
  }
  
  /**
   * Genera el servicio WebSocket para comunicación en tiempo real
   */
  private generateWebSocketService(): void {
    const webSocketService = `import { useEffect, useState, useRef, useCallback } from 'react';

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Conectar al WebSocket
  useEffect(() => {
    const ws = new WebSocket(url);
    
    ws.onopen = () => {
      console.log('WebSocket conectado');
      setIsConnected(true);
    };
    
    ws.onclose = () => {
      console.log('WebSocket desconectado');
      setIsConnected(false);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastMessage(data);
        setMessages((prev) => [...prev, data]);
      } catch (error) {
        console.error('Error al procesar mensaje:', error);
      }
    };
    
    wsRef.current = ws;
    
    return () => {
      ws.close();
    };
  }, [url]);
  
  // Enviar mensaje
  const sendMessage = useCallback((data: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.error('WebSocket no está conectado');
    }
  }, []);
  
  return {
    isConnected,
    lastMessage,
    messages,
    sendMessage
  };
}
`;

    const hooksDir = path.join(this.dashboardDir, 'src', 'hooks');
    fs.writeFileSync(
      path.join(hooksDir, 'useWebSocket.ts'),
      webSocketService,
      'utf-8'
    );
  }
  
  /**
   * Genera las rutas API para el dashboard
   */
  private generateApiRoutes(): void {
    // Las rutas API ya se generan en los métodos específicos
    this.log('✅ Rutas API generadas');
  }
  
  /**
   * Genera la página principal del dashboard
   */
  private generateIndexPage(): void {
        const indexPage = `import { useState } from 'react';
import Head from 'next/head';
import AgentStatus from '../components/AgentStatus';
import LogViewer from '../components/LogViewer';
import ProjectGraph from '../components/ProjectGraph';
import SharedContextViewer from '../components/SharedContextViewer';
import DecisionHistory from '../components/DecisionHistory';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="min-h-screen bg-gray-100">
      <Head>
        <title>CJ.DevMind Dashboard</title>
        <meta name="description" content="Dashboard para monitoreo de agentes CJ.DevMind" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">CJ.DevMind Dashboard</h1>
          <div className="text-sm text-gray-500">
            Versión 1.0
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <nav className="flex space-x-4 border-b">
            <button
              className={\`px-4 py-2 font-medium \${activeTab === 'overview' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}\`}
              onClick={() => setActiveTab('overview')}
            >
              Vista General
            </button>
            <button
              className={\`px-4 py-2 font-medium \${activeTab === 'agents' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}\`}
              onClick={() => setActiveTab('agents')}
            >
              Agentes
            </button>
            <button
              className={\`px-4 py-2 font-medium \${activeTab === 'graph' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}\`}
              onClick={() => setActiveTab('graph')}
            >
              Grafo del Proyecto
            </button>
            <button
              className={\`px-4 py-2 font-medium \${activeTab === 'context' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}\`}
              onClick={() => setActiveTab('context')}
            >
              Contexto Compartido
            </button>
            <button
              className={\`px-4 py-2 font-medium \${activeTab === 'decisions' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}\`}
              onClick={() => setActiveTab('decisions')}
            >
              Decisiones
            </button>
            <button
              className={\`px-4 py-2 font-medium \${activeTab === 'logs' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}\`}
              onClick={() => setActiveTab('logs')}
            >
              Logs
            </button>
          </nav>
        </div>
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AgentStatus />
            <DecisionHistory />
            <LogViewer />
          </div>
        )}
        
        {activeTab === 'agents' && (
          <div>
            <AgentStatus />
          </div>
        )}
        
        {activeTab === 'graph' && (
          <div>
            <ProjectGraph />
          </div>
        )}
        
        {activeTab === 'context' && (
          <div>
            <SharedContextViewer />
          </div>
        )}
        
        {activeTab === 'decisions' && (
          <div>
            <DecisionHistory />
          </div>
        )}
        
        {activeTab === 'logs' && (
          <div>
            <LogViewer />
          </div>
        )}
      </main>
      
      <footer className="bg-white shadow-md mt-8 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          CJ.DevMind Dashboard &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
`;

    const pagesDir = path.join(this.dashboardDir, 'src', 'pages');
    fs.writeFileSync(
      path.join(pagesDir, 'index.tsx'),
      indexPage,
      'utf-8'
    );
  }
  
  /**
   * Procesa la respuesta del LLM para generar archivos
   */
  private processLLMResponse(response: string): void {
    this.log('🔍 Procesando respuesta del LLM...');
    
    // Extraer bloques de código de la respuesta
    const codeBlocks = this.extractCodeBlocks(response);
    
    // Generar archivos a partir de los bloques de código
    codeBlocks.forEach(({ language, filePath, code }) => {
      // Asegurarse de que la ruta del archivo exista
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      
      // Escribir el archivo
      fs.writeFileSync(filePath, code, 'utf-8');
      this.log(`✅ Archivo generado: ${filePath}`);
    });
  }
  
  /**
   * Extrae bloques de código de una respuesta de texto
   */
  private extractCodeBlocks(text: string): Array<{ language: string, filePath: string, code: string }> {
    const codeBlocks = [];
    const regex = /```([a-zA-Z]+)(?::(.+?))?\n([\s\S]*?)```/g;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      const language = match[1];
      const filePath = match[2] ? match[2] : '';
      const code = match[3];
      
      if (filePath) {
        // Convertir la ruta relativa a absoluta si es necesario
        const absolutePath = filePath.startsWith('/') || filePath.includes(':') 
          ? filePath 
          : path.join(this.dashboardDir, filePath);
        
        codeBlocks.push({
          language,
          filePath: absolutePath,
          code
        });
      }
    }
    
    return codeBlocks;
  }
  
  /**
   * Lee el estado actual del proyecto
   */
  private readProjectState(): any {
    // Leer el estado del proyecto desde el contexto compartido
    return this.getSharedContext();
  }
  
  /**
   * Lee un archivo de contexto
   */
  private readContext(contextFile: string): string {
    const contextPath = path.join(process.cwd(), 'context', contextFile);
    
    if (fs.existsSync(contextPath)) {
      return fs.readFileSync(contextPath, 'utf-8');
    }
    
    return '';
  }
  
  /**
   * Obtiene el estado actual del dashboard
   */
  private getDashboardStatus(): void {
    this.log('📊 Estado del Dashboard:');
    
    if (!fs.existsSync(this.dashboardDir)) {
      this.log('⚠️ El dashboard no está inicializado', 'warning');
      return;
    }
    
    this.log(`📁 Ubicación: ${this.dashboardDir}`);
    this.log(`🚀 En ejecución: ${this.isRunning ? 'Sí' : 'No'}`);
    
    // Verificar componentes
    const componentsDir = path.join(this.dashboardDir, 'src', 'components');
    if (fs.existsSync(componentsDir)) {
      const components = fs.readdirSync(componentsDir);
      this.log(`🧩 Componentes: ${components.length}`);
      components.forEach(component => {
        this.log(`  - ${component}`);
      });
    }
    
    // Verificar APIs
    const apiDir = path.join(this.dashboardDir, 'src', 'pages', 'api');
    if (fs.existsSync(apiDir)) {
      const apis = fs.readdirSync(apiDir);
      this.log(`🔌 APIs: ${apis.length}`);
      apis.forEach(api => {
        this.log(`  - ${api}`);
      });
    }
  }
  
  /**
   * Detiene el servidor del dashboard
   */
  private async stopDashboard(): Promise<void> {
    this.log('🛑 Deteniendo servidor del dashboard...');
    
    if (!this.isRunning) {
      this.log('⚠️ El dashboard no está en ejecución', 'warning');
      return;
    }
    
    // Detener el proceso del servidor
    if (this.serverProcess) {
      this.serverProcess.kill();
      this.serverProcess = null;
      this.isRunning = false;
      this.log('✅ Servidor del dashboard detenido');
    }
  }
  
  /**
   * Crea un servidor WebSocket para comunicación en tiempo real
   */
  private createWebSocketServer(): void {
    this.log('🔌 Creando servidor WebSocket...');
    
    // Crear archivo para el servidor WebSocket
    const wsServerCode = `const WebSocket = require('ws');
const http = require('http');

// Crear servidor HTTP
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('WebSocket Server for CJ.DevMind Dashboard');
});

// Crear servidor WebSocket
const wss = new WebSocket.Server({ server });

// Manejar conexiones
wss.on('connection', (ws) => {
  console.log('Cliente conectado');
  
  // Enviar mensaje de bienvenida
  ws.send(JSON.stringify({
    timestamp: new Date().toISOString(),
    agent: 'WebSocket Server',
    level: 'info',
    message: 'Conectado al servidor WebSocket'
  }));
  
  // Manejar mensajes recibidos
  ws.on('message', (message) => {
    console.log('Mensaje recibido:', message);
    
    // Reenviar mensaje a todos los clientes
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
  
  // Manejar desconexiones
  ws.on('close', () => {
    console.log('Cliente desconectado');
  });
});

// Puerto para el servidor
const PORT = process.env.WS_PORT || 3001;

// Iniciar servidor
server.listen(PORT, () => {
  console.log(\`Servidor WebSocket iniciado en puerto \${PORT}\`);
});

// Función para enviar logs a todos los clientes
function broadcastLog(logEntry) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(logEntry));
    }
  });
}

// Exportar función para enviar logs
module.exports = {
  broadcastLog
};

// Enviar logs de ejemplo cada 5 segundos
setInterval(() => {
  const agents = ['UI Agent', 'API Agent', 'Database Agent', 'Dashboard Agent'];
  const levels = ['info', 'warning', 'error'];
  const messages = [
    'Procesando solicitud',
    'Generando componente',
    'Actualizando base de datos',
    'Conexión establecida',
    'Tiempo de respuesta elevado',
    'Error al procesar solicitud'
  ];
  
  const randomAgent = agents[Math.floor(Math.random() * agents.length)];
  const randomLevel = levels[Math.floor(Math.random() * levels.length)];
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    agent: randomAgent,
    level: randomLevel,
    message: randomMessage
  };
  
  broadcastLog(logEntry);
}, 5000);
`;

    const serverDir = path.join(this.dashboardDir, 'server');
    if (!fs.existsSync(serverDir)) {
      fs.mkdirSync(serverDir, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(serverDir, 'ws-server.js'),
      wsServerCode,
      'utf-8'
    );
    
    // Actualizar package.json para incluir el servidor WebSocket
    const packageJsonPath = path.join(this.dashboardDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      // Agregar dependencia de ws
      if (!packageJson.dependencies.ws) {
        packageJson.dependencies.ws = '^8.13.0';
      }
      
      // Agregar script para iniciar el servidor WebSocket
      if (!packageJson.scripts.server) {
        packageJson.scripts.server = 'node server/ws-server.js';
      }
      
      // Agregar script para iniciar todo
      if (!packageJson.scripts.start) {
        packageJson.scripts.start = 'concurrently "npm run dev" "npm run server"';
      }
      
      // Agregar dependencia de concurrently
      if (!packageJson.dependencies.concurrently) {
        packageJson.devDependencies = packageJson.devDependencies || {};
        packageJson.devDependencies.concurrently = '^8.2.0';
      }
      
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf-8');
    }
    
    this.log('✅ Servidor WebSocket creado');
  }
}