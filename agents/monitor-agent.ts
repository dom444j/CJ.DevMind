import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

/**
 * Monitor Agent - Configura la supervisión del sistema en producción
 * 
 * Este agente es responsable de:
 * 1. Configurar sistemas de monitoreo (Prometheus, Grafana, ELK, etc.)
 * 2. Definir métricas clave y dashboards de observabilidad
 * 3. Establecer umbrales y reglas de alerta
 * 4. Configurar notificaciones para incidentes
 * 5. Generar scripts de instalación y configuración
 */
export class MonitorAgent extends BaseAgent {
  constructor() {
    super('Monitor Agent');
  }

  /**
   * Ejecuta el agente de monitoreo
   * @param spec Especificación del sistema de monitoreo a configurar
   */
  async run(spec: string): Promise<void> {
    console.log('📊 Iniciando Monitor Agent...');
    console.log('📋 Especificación recibida:', spec);

    try {
      // Determinar el tipo de operación
      if (spec.startsWith('metrics:')) {
        const metricsSpec = spec.substring(8).trim();
        await this.defineMetrics(metricsSpec);
      } else if (spec.startsWith('dashboard:')) {
        const dashboardSpec = spec.substring(10).trim();
        await this.configureDashboard(dashboardSpec);
      } else if (spec.startsWith('alerts:')) {
        const alertsSpec = spec.substring(7).trim();
        await this.configureAlerts(alertsSpec);
      } else if (spec.startsWith('install:')) {
        const installSpec = spec.substring(8).trim();
        await this.generateInstallationScripts(installSpec);
      } else {
        // Operación por defecto: configuración completa
        await this.configureMonitoring(spec);
      }
      
      console.log('✅ Sistema de monitoreo configurado con éxito');
    } catch (error) {
      console.error('❌ Error al configurar el sistema de monitoreo:', error);
      throw error;
    }
  }
  
  /**
   * Define métricas clave para monitorear
   * @param spec Especificación de las métricas
   */
  private async defineMetrics(spec: string): Promise<void> {
    console.log(`📈 Definiendo métricas para: "${spec}"`);
    
    // Crear directorio para métricas si no existe
    const metricsDir = path.join(process.cwd(), 'monitoring', 'metrics');
    if (!fs.existsSync(metricsDir)) {
      fs.mkdirSync(metricsDir, { recursive: true });
    }
    
    // Crear prompt para el LLM
    const metricsPrompt = `
    # Tarea de Monitor Agent
    
    Define métricas clave para monitorear el siguiente sistema:
    
    "${spec}"
    
    Proporciona:
    1. Lista de métricas clave con descripciones
    2. Tipo de cada métrica (contador, gauge, histograma, etc.)
    3. Unidades de medida
    4. Frecuencia de recolección recomendada
    5. Configuración para Prometheus (si aplica)
    
    Estructura tu respuesta en formato JSON.
    `;
    
    try {
      // Consultar al LLM
      const response = await this.queryLLM(metricsPrompt);
      
            // Extraer el JSON de la respuesta
            const jsonMatch = response.match(/```(?:json)\n([\s\S]*?)\n```/) || 
            response.match(/```\n([\s\S]*?)\n```/) ||
            response.match(/{[\s\S]*?}/);

if (!jsonMatch) {
throw new Error('No se pudo extraer la definición de métricas de la respuesta del LLM');
}

const metrics = JSON.parse(jsonMatch[1] || jsonMatch[0]);

// Generar nombre de archivo basado en la especificación
const fileName = `${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-metrics.json`;
const filePath = path.join(metricsDir, fileName);

// Guardar las métricas
fs.writeFileSync(filePath, JSON.stringify(metrics, null, 2), 'utf-8');

// Generar configuración de Prometheus si está disponible
if (metrics.prometheusConfig) {
const prometheusDir = path.join(process.cwd(), 'monitoring', 'prometheus');
if (!fs.existsSync(prometheusDir)) {
fs.mkdirSync(prometheusDir, { recursive: true });
}

const prometheusPath = path.join(prometheusDir, `${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.yml`);
fs.writeFileSync(prometheusPath, metrics.prometheusConfig, 'utf-8');
console.log(`✅ Configuración de Prometheus generada: ${prometheusPath}`);
}

// Generar documentación de métricas
const docsDir = path.join(process.cwd(), 'monitoring', 'docs');
if (!fs.existsSync(docsDir)) {
fs.mkdirSync(docsDir, { recursive: true });
}

// Crear prompt para documentación
const docsPrompt = `
# Tarea de Monitor Agent

Genera documentación detallada para las siguientes métricas:

${JSON.stringify(metrics, null, 2)}

La documentación debe incluir:
1. Descripción de cada métrica
2. Cómo interpretar los valores
3. Ejemplos de uso en consultas y dashboards
4. Recomendaciones para umbrales de alerta

Formato: Markdown
`;

// Consultar al LLM para documentación
const docsResponse = await this.queryLLM(docsPrompt);

// Guardar la documentación
const docsPath = path.join(docsDir, `${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-metrics.md`);
fs.writeFileSync(docsPath, docsResponse, 'utf-8');

console.log(`✅ Métricas definidas: ${filePath}`);
console.log(`📝 Documentación guardada: ${docsPath}`);
} catch (error) {
console.error('❌ Error al definir métricas:', error);
throw error;
}
}

/**
* Configura un dashboard de monitoreo
* @param spec Especificación del dashboard
*/
private async configureDashboard(spec: string): Promise<void> {
console.log(`📊 Configurando dashboard para: "${spec}"`);

// Crear directorio para dashboards si no existe
const dashboardsDir = path.join(process.cwd(), 'monitoring', 'dashboards');
if (!fs.existsSync(dashboardsDir)) {
fs.mkdirSync(dashboardsDir, { recursive: true });
}

// Crear prompt para el LLM
const dashboardPrompt = `
# Tarea de Monitor Agent

Diseña un dashboard de monitoreo para el siguiente sistema:

"${spec}"

Proporciona:
1. Paneles recomendados con sus métricas
2. Disposición y organización visual
3. Configuración JSON para Grafana
4. Variables y filtros recomendados

El dashboard debe ser completo y proporcionar una visión clara del estado del sistema.
`;

try {
// Consultar al LLM
const response = await this.queryLLM(dashboardPrompt);

// Extraer la configuración JSON de Grafana
const jsonMatch = response.match(/```(?:json)\n([\s\S]*?)\n```/) || 
            response.match(/```\n([\s\S]*?)\n```/) ||
            response.match(/{[\s\S]*?}/);

if (jsonMatch) {
const dashboardConfig = jsonMatch[1] || jsonMatch[0];

// Generar nombre de archivo basado en la especificación
const fileName = `${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-dashboard.json`;
const filePath = path.join(dashboardsDir, fileName);

// Guardar la configuración del dashboard
fs.writeFileSync(filePath, dashboardConfig, 'utf-8');
console.log(`✅ Configuración de dashboard guardada: ${filePath}`);
}

// Extraer la descripción y recomendaciones
const description = response.replace(/```[\s\S]*?```/g, '').trim();

// Guardar la descripción
const descPath = path.join(dashboardsDir, `${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-dashboard.md`);
fs.writeFileSync(descPath, description, 'utf-8');

// Generar una imagen de previsualización del dashboard (simulada)
const previewDir = path.join(process.cwd(), 'monitoring', 'previews');
if (!fs.existsSync(previewDir)) {
fs.mkdirSync(previewDir, { recursive: true });
}

// Crear prompt para generar una representación visual
const previewPrompt = `
# Tarea de Monitor Agent

Genera una representación visual en ASCII art del siguiente dashboard:

"${spec}"

La representación debe mostrar la disposición de los paneles y gráficos principales.
`;

// Consultar al LLM para la previsualización
const previewResponse = await this.queryLLM(previewPrompt);

// Extraer el ASCII art
const asciiMatch = previewResponse.match(/```(?:ascii|text)\n([\s\S]*?)\n```/) || 
             previewResponse.match(/```\n([\s\S]*?)\n```/);

if (asciiMatch) {
const asciiArt = asciiMatch[1] || asciiMatch[0];

// Guardar la previsualización
const previewPath = path.join(previewDir, `${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-preview.txt`);
fs.writeFileSync(previewPath, asciiArt, 'utf-8');
console.log(`🖼️ Previsualización generada: ${previewPath}`);
}

console.log(`📝 Descripción del dashboard guardada: ${descPath}`);
} catch (error) {
console.error('❌ Error al configurar dashboard:', error);
throw error;
}
}

/**
* Configura reglas de alerta
* @param spec Especificación de las alertas
*/
private async configureAlerts(spec: string): Promise<void> {
console.log(`🚨 Configurando alertas para: "${spec}"`);

// Crear directorio para alertas si no existe
const alertsDir = path.join(process.cwd(), 'monitoring', 'alerts');
if (!fs.existsSync(alertsDir)) {
fs.mkdirSync(alertsDir, { recursive: true });
}

// Crear prompt para el LLM
const alertsPrompt = `
# Tarea de Monitor Agent

Define reglas de alerta para el siguiente sistema:

"${spec}"

Proporciona:
1. Lista de alertas con descripciones
2. Condiciones de activación (expresiones)
3. Niveles de severidad
4. Acciones recomendadas
5. Configuración para Alertmanager (si aplica)

Las alertas deben cubrir escenarios críticos y proporcionar información accionable.
`;

try {
// Consultar al LLM
const response = await this.queryLLM(alertsPrompt);

// Extraer el JSON de la respuesta
const jsonMatch = response.match(/```(?:json|yaml|yml)\n([\s\S]*?)\n```/) || 
            response.match(/```\n([\s\S]*?)\n```/) ||
            response.match(/{[\s\S]*?}/);

if (jsonMatch) {
const alertsConfig = jsonMatch[1] || jsonMatch[0];

// Determinar el formato (JSON o YAML)
const isYaml = alertsConfig.trim().startsWith('-') || 
           alertsConfig.includes(':') && !alertsConfig.includes('{');

// Generar nombre de archivo basado en la especificación
const extension = isYaml ? 'yml' : 'json';
const fileName = `${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-alerts.${extension}`;
const filePath = path.join(alertsDir, fileName);

// Guardar la configuración de alertas
fs.writeFileSync(filePath, alertsConfig, 'utf-8');
console.log(`✅ Configuración de alertas guardada: ${filePath}`);
}

// Extraer la documentación
const documentation = response.replace(/```[\s\S]*?```/g, '').trim();

// Guardar la documentación
const docPath = path.join(alertsDir, `${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-alerts.md`);
fs.writeFileSync(docPath, documentation, 'utf-8');

// Generar plantillas de notificación
await this.generateNotificationTemplates(spec, alertsDir);

console.log(`📝 Documentación de alertas guardada: ${docPath}`);
} catch (error) {
console.error('❌ Error al configurar alertas:', error);
throw error;
}
}

/**
* Genera plantillas de notificación para alertas
* @param spec Especificación del sistema
* @param alertsDir Directorio de alertas
*/
private async generateNotificationTemplates(spec: string, alertsDir: string): Promise<void> {
console.log(`📧 Generando plantillas de notificación para: "${spec}"`);

// Crear directorio para plantillas si no existe
const templatesDir = path.join(alertsDir, 'templates');
if (!fs.existsSync(templatesDir)) {
fs.mkdirSync(templatesDir, { recursive: true });
}

// Crear prompt para el LLM
const templatesPrompt = `
# Tarea de Monitor Agent

Genera plantillas de notificación para alertas del siguiente sistema:

"${spec}"

Proporciona plantillas para:
1. Correo electrónico
2. Slack/Teams
3. SMS
4. Webhook (JSON)

Las plantillas deben ser claras, informativas y accionables.
`;

try {
// Consultar al LLM
const response = await this.queryLLM(templatesPrompt);

// Extraer las diferentes plantillas
const emailMatch = response.match(/```(?:html|email)\n([\s\S]*?)\n```/);
const slackMatch = response.match(/```(?:json|slack)\n([\s\S]*?)\n```/);
const smsMatch = response.match(/```(?:text|sms)\n([\s\S]*?)\n```/);
const webhookMatch = response.match(/```(?:json|webhook)\n([\s\S]*?)\n```/);

// Guardar plantilla de correo
if (emailMatch) {
const emailTemplate = emailMatch[1];
const emailPath = path.join(templatesDir, 'email.html');
fs.writeFileSync(emailPath, emailTemplate, 'utf-8');
console.log(`✅ Plantilla de correo guardada: ${emailPath}`);
}

// Guardar plantilla de Slack/Teams
if (slackMatch) {
const slackTemplate = slackMatch[1];
const slackPath = path.join(templatesDir, 'slack.json');
fs.writeFileSync(slackPath, slackTemplate, 'utf-8');
console.log(`✅ Plantilla de Slack guardada: ${slackPath}`);
}

// Guardar plantilla de SMS
if (smsMatch) {
const smsTemplate = smsMatch[1];
const smsPath = path.join(templatesDir, 'sms.txt');
fs.writeFileSync(smsPath, smsTemplate, 'utf-8');
console.log(`✅ Plantilla de SMS guardada: ${smsPath}`);
}

// Guardar plantilla de Webhook
if (webhookMatch) {
const webhookTemplate = webhookMatch[1];
const webhookPath = path.join(templatesDir, 'webhook.json');
fs.writeFileSync(webhookPath, webhookTemplate, 'utf-8');
console.log(`✅ Plantilla de Webhook guardada: ${webhookPath}`);
}
} catch (error) {
console.error('❌ Error al generar plantillas de notificación:', error);
// No lanzar error para no interrumpir el flujo principal
console.log('⚠️ Continuando sin plantillas de notificación');
}
}

/**
* Genera scripts de instalación y configuración
* @param spec Especificación del sistema de monitoreo
*/
private async generateInstallationScripts(spec: string): Promise<void> {
console.log(`🔧 Generando scripts de instalación para: "${spec}"`);

// Crear directorio para scripts si no existe
const scriptsDir = path.join(process.cwd(), 'monitoring', 'scripts');
if (!fs.existsSync(scriptsDir)) {
fs.mkdirSync(scriptsDir, { recursive: true });
}

// Determinar el tipo de sistema de monitoreo
let system = 'generic';
if (spec.toLowerCase().includes('prometheus')) {
system = 'prometheus';
} else if (spec.toLowerCase().includes('grafana')) {
system = 'grafana';
} else if (spec.toLowerCase().includes('elk') || spec.toLowerCase().includes('elastic')) {
system = 'elk';
} else if (spec.toLowerCase().includes('datadog')) {
system = 'datadog';
} else if (spec.toLowerCase().includes('newrelic')) {
system = 'newrelic';
}

// Crear prompt para el LLM
const scriptsPrompt = `
# Tarea de Monitor Agent

Genera scripts de instalación y configuración para el siguiente sistema de monitoreo:

"${spec}" (Tipo: ${system})

Proporciona scripts para:
1. Instalación en entorno de desarrollo (Docker)
2. Instalación en entorno de producción
3. Configuración inicial
4. Integración con la aplicación

Los scripts deben ser detallados, incluir comentarios y manejar errores.
Proporciona versiones para Windows y Linux.
`;

try {
// Consultar al LLM
const response = await this.queryLLM(scriptsPrompt);

// Extraer los scripts
const dockerMatch = response.match(/```(?:docker|dockerfile)\n([\s\S]*?)\n```/);
const bashMatch = response.match(/```(?:bash|sh)\n([\s\S]*?)\n```/);
const powershellMatch = response.match(/```(?:powershell|ps1)\n([\s\S]*?)\n```/);
const yamlMatch = response.match(/```(?:yaml|yml)\n([\s\S]*?)\n```/);

// Guardar Dockerfile
if (dockerMatch) {
const dockerfile = dockerMatch[1];
const dockerfilePath = path.join(scriptsDir, `${system}-Dockerfile`);
fs.writeFileSync(dockerfilePath, dockerfile, 'utf-8');
console.log(`✅ Dockerfile guardado: ${dockerfilePath}`);
}

// Guardar script Bash
if (bashMatch) {
const bashScript = bashMatch[1];
const bashPath = path.join(scriptsDir, `install-${system}.sh`);
fs.writeFileSync(bashPath, bashScript, 'utf-8');
console.log(`✅ Script Bash guardado: ${bashPath}`);
}

// Guardar script PowerShell
if (powershellMatch) {
const psScript = powershellMatch[1];
const psPath = path.join(scriptsDir, `install-${system}.ps1`);
fs.writeFileSync(psPath, psScript, 'utf-8');
console.log(`✅ Script PowerShell guardado: ${psPath}`);
}

// Guardar configuración YAML
if (yamlMatch) {
const yamlConfig = yamlMatch[1];
const yamlPath = path.join(scriptsDir, `${system}-config.yml`);
fs.writeFileSync(yamlPath, yamlConfig, 'utf-8');
console.log(`✅ Configuración YAML guardada: ${yamlPath}`);
}

// Generar docker-compose.yml
const composePrompt = `
# Tarea de Monitor Agent

Genera un archivo docker-compose.yml para el siguiente sistema de monitoreo:

"${spec}" (Tipo: ${system})

El archivo debe incluir todos los servicios necesarios y estar bien configurado.
`;

const composeResponse = await this.queryLLM(composePrompt);
const composeMatch = composeResponse.match(/```(?:yaml|yml|docker-compose)\n([\s\S]*?)\n```/) || 
               composeResponse.match(/```\n([\s\S]*?)\n```/);

if (composeMatch) {
const composeConfig = composeMatch[1];
const composePath = path.join(scriptsDir, 'docker-compose.yml');
fs.writeFileSync(composePath, composeConfig, 'utf-8');
console.log(`✅ Docker Compose guardado: ${composePath}`);
}

// Generar README con instrucciones
const readmePrompt = `
# Tarea de Monitor Agent

Genera un README con instrucciones detalladas para instalar y configurar el siguiente sistema de monitoreo:

"${spec}" (Tipo: ${system})

Incluye:
1. Requisitos previos
2. Pasos de instalación
3. Configuración inicial
4. Verificación del funcionamiento
5. Solución de problemas comunes

Formato: Markdown
`;

const readmeResponse = await this.queryLLM(readmePrompt);
const readmePath = path.join(scriptsDir, 'README.md');
fs.writeFileSync(readmePath, readmeResponse, 'utf-8');

console.log(`📝 Instrucciones guardadas: ${readmePath}`);
} catch (error) {
console.error('❌ Error al generar scripts de instalación:', error);
throw error;
}
}

/**
* Configura un sistema de monitoreo completo
* @param spec Especificación del sistema
*/
private async configureMonitoring(spec: string): Promise<void> {
console.log(`🔍 Analizando requisitos de monitoreo para: "${spec}"`);

try {
// Crear directorio principal si no existe
const monitoringDir = path.join(process.cwd(), 'monitoring');
if (!fs.existsSync(monitoringDir)) {
fs.mkdirSync(monitoringDir, { recursive: true });
}

// Crear prompt para análisis
const analysisPrompt = `
# Tarea de Monitor Agent

Analiza los requisitos de monitoreo para el siguiente sistema:

"${spec}"

Proporciona:
1. Sistemas de monitoreo recomendados
2. Métricas clave a recolectar
3. Dashboards necesarios
4. Alertas críticas
5. Estrategia de implementación

Estructura tu respuesta en formato JSON.
`;

// Consultar al LLM
const analysisResponse = await this.queryLLM(analysisPrompt);

// Extraer el JSON de la respuesta
const jsonMatch = analysisResponse.match(/```(?:json)\n([\s\S]*?)\n```/) || 
            analysisResponse.match(/```\n([\s\S]*?)\n```/) ||
            analysisResponse.match(/{[\s\S]*?}/);

if (!jsonMatch) {
throw new Error('No se pudo extraer el análisis de la respuesta del LLM');
}

const analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);

// Guardar el análisis
const analysisPath = path.join(monitoringDir, 'monitoring-analysis.json');
fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), 'utf-8');

console.log('✅ Análisis de monitoreo completado');

// Implementar cada componente del sistema de monitoreo
if (analysis.metrics) {
await this.defineMetrics(`${spec} - Métricas`);
}

if (analysis.dashboards) {
for (const dashboard of analysis.dashboards) {
await this.configureDashboard(`${dashboard.name}: ${dashboard.description}`);
}
}

if (analysis.alerts) {
await this.configureAlerts(`${spec} - Alertas`);
}

// Generar scripts de instalación
await this.generateInstallationScripts(`${spec} - ${analysis.recommendedSystem || 'Sistema completo'}`);

// Generar documentación completa
await this.generateMonitoringDocumentation(spec, analysis);

console.log('✅ Sistema de monitoreo configurado con éxito');
} catch (error) {
console.error('❌ Error al configurar sistema de monitoreo:', error);
throw error;
}
}

/**
* Genera documentación completa del sistema de monitoreo
* @param spec Especificación del sistema
* @param analysis Análisis del sistema
*/
private async generateMonitoringDocumentation(spec: string, analysis: any): Promise<void> {
console.log(`📚 Generando documentación de monitoreo para: "${spec}"`);

// Crear directorio para documentación si no existe
const docsDir = path.join(process.cwd(), 'monitoring', 'docs');
if (!fs.existsSync(docsDir)) {
fs.mkdirSync(docsDir, { recursive: true });
}

// Crear prompt para el LLM
const docsPrompt = `
# Tarea de Monitor Agent

Genera documentación completa para el sistema de monitoreo:

"${spec}"

Basado en el siguiente análisis:
${JSON.stringify(analysis, null, 2)}

La documentación debe incluir:
1. Visión general del sistema de monitoreo
2. Arquitectura y componentes
3. Guía de instalación y configuración
4. Descripción de métricas y dashboards
5. Procedimientos de respuesta a alertas
6. Mejores prácticas y recomendaciones

Formato: Markdown
`;

try {
// Consultar al LLM
const response = await this.queryLLM(docsPrompt);

// Guardar la documentación principal
const mainDocPath = path.join(docsDir, 'monitoring-guide.md');
fs.writeFileSync(mainDocPath, response, 'utf-8');

// Generar índice de documentación
const indexPrompt = `
# Tarea de Monitor Agent

Genera un índice para la documentación del sistema de monitoreo:

"${spec}"

El índice debe listar todos los documentos y recursos disponibles.
`;

const indexResponse = await this.queryLLM(indexPrompt);
const indexPath = path.join(docsDir, 'index.md');
fs.writeFileSync(indexPath, indexResponse, 'utf-8');

console.log(`✅ Documentación principal guardada: ${mainDocPath}`);
console.log(`✅ Índice de documentación guardado: ${indexPath}`);
} catch (error) {
console.error('❌ Error al generar documentación:', error);
// No lanzar error para no interrumpir el flujo principal
console.log('⚠️ Continuando sin documentación completa');
}
}
}

// Función auxiliar para mantener compatibilidad con código existente
export async function monitorAgent(spec: string): Promise<string> {
const agent = new MonitorAgent();
await agent.run(spec);
return "Monitor Agent ejecutado con éxito";
}