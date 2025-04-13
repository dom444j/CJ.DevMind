#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Importación de agentes
import { ArchitectAgent } from '../agents/architect-agent';
import { RefactorAgent } from '../agents/refactor-agent';
import { DocAgent } from '../agents/doc-agent';
import { VisionAgent } from '../agents/vision-agent';
import { OrchestratorAgent } from '../agents/orchestrator-agent';
import { UIDesignAgent } from '../agents/ui-design-agent';
import { ComponentAgent } from '../agents/component-agent';
import { APIAgent } from '../agents/api-agent';
import { DatabaseAgent } from '../agents/database-agent';
import { TestingAgent } from '../agents/testing-agent';
import { SecurityAgent } from '../agents/security-agent';
import { PerformanceAgent } from '../agents/performance-agent';
import { DevOpsAgent } from '../agents/devops-agent';
import { LayoutAgent } from '../agents/layout-agent';
import { LogicAgent } from '../agents/logic-agent';
import { MonitorAgent } from '../agents/monitor-agent';
import { QuestionAgent } from '../agents/question-agent';
import { FrontendSyncAgent } from '../agents/frontend-sync-agent';
import { DashboardAgent } from '../agents/dashboard-agent';
import { MemoryAgent } from '../agents/memory-agent';

// Leer versión del package.json
let version = '0.1.0';
try {
  const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));
  version = packageJson.version || version;
} catch (error) {
  console.warn('No se pudo leer la versión desde package.json');
}

// Crear instancia principal de Command
const program = new Command();

// Mostrar banner al inicio
console.log(
  chalk.cyan(
    figlet.textSync('CJ.DevMind', { horizontalLayout: 'full' })
  )
);

// Configuración básica del programa
program
  .name('cj')
  .description('CJ.DevMind - Plataforma modular de desarrollo con IA')
  .version(version)
  .option('-v, --verbose', 'Mostrar información detallada')
  .option('-d, --debug', 'Activar modo de depuración')
  .option('-o, --output <dir>', 'Directorio de salida para los archivos generados')
  .hook('preAction', (thisCommand, actionCommand) => {
    const options = actionCommand.opts();
    if (options.verbose) {
      console.log(chalk.blue('Modo verbose activado'));
    }
    if (options.debug) {
      console.log(chalk.yellow('Modo debug activado'));
    }
  });

// Función auxiliar para manejar errores de forma consistente
const handleAgentError = (error: any) => {
  console.error(chalk.red('❌ Error:'), error.message || error);
  if (program.opts().debug) {
    console.error(chalk.gray('Stack trace:'), error.stack);
  }
  process.exit(1);
};

// Agrupar comandos por categorías
// ===============================

// Categoría: Planificación y Diseño
const planningCommand = program.command('plan')
  .description('Comandos para planificación y diseño del proyecto');

planningCommand
  .command('vision')
  .description('Traduce una idea en requisitos técnicos detallados')
  .argument('<idea>', 'Idea inicial del proyecto')
  .action(async (idea) => {
    console.log(chalk.blue('🔍 CJ.DevMind - Vision Agent'));
    const agent = new VisionAgent();
    try {
      await agent.run(idea);
    } catch (error) {
      handleAgentError(error);
    }
  });

planningCommand
  .command('question')
  .description('Realiza un cuestionario inicial para definir el proyecto')
  .argument('<idea>', 'Idea inicial del proyecto')
  .action(async (idea) => {
    console.log(chalk.blue('❓ CJ.DevMind - Question Agent'));
    const agent = new QuestionAgent();
    try {
      await agent.run(idea);
    } catch (error) {
      handleAgentError(error);
    }
  });

planningCommand
  .command('architect')
  .description('Diseña la estructura arquitectónica del proyecto')
  .argument('<prompt>', 'Descripción del proyecto')
  .action(async (prompt) => {
    console.log(chalk.blue('🏗️ CJ.DevMind - Architect Agent'));
    const agent = new ArchitectAgent();
    try {
      await agent.run(prompt);
    } catch (error) {
      handleAgentError(error);
    }
  });

planningCommand
  .command('design')
  .description('Crea un sistema de diseño coherente')
  .argument('<project>', 'Descripción del proyecto/módulo')
  .action(async (project) => {
    console.log(chalk.blue('🎨 CJ.DevMind - UI Design Agent'));
    const agent = new UIDesignAgent();
    try {
      await agent.run(project);
    } catch (error) {
      handleAgentError(error);
    }
  });

// Categoría: Frontend
const frontendCommand = program.command('frontend')
  .description('Comandos para desarrollo frontend');

frontendCommand
  .command('component')
  .description('Crea componentes React basados en el sistema de diseño')
  .argument('<spec>', 'Especificación del componente')
  .action(async (spec) => {
    console.log(chalk.blue('🧩 CJ.DevMind - Component Agent'));
    const agent = new ComponentAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      handleAgentError(error);
    }
  });

frontendCommand
  .command('layout')
  .description('Estructura la navegación y organización espacial de la interfaz')
  .argument('<spec>', 'Especificación del layout')
  .action(async (spec) => {
    console.log(chalk.blue('🏗️ CJ.DevMind - Layout Agent'));
    const agent = new LayoutAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      handleAgentError(error);
    }
  });

frontendCommand
  .command('sync')
  .description('Integra el frontend con el backend')
  .argument('<spec>', 'Especificación de la integración')
  .action(async (spec) => {
    console.log(chalk.blue('🔄 CJ.DevMind - Frontend Sync Agent'));
    const agent = new FrontendSyncAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      handleAgentError(error);
    }
  });

// Categoría: Backend
const backendCommand = program.command('backend')
  .description('Comandos para desarrollo backend');

backendCommand
  .command('api')
  .description('Diseña y genera APIs RESTful')
  .argument('<spec>', 'Especificación de la API')
  .action(async (spec) => {
    console.log(chalk.blue('🔌 CJ.DevMind - API Agent'));
    const agent = new APIAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      handleAgentError(error);
    }
  });

backendCommand
  .command('database')
  .description('Diseña y genera esquemas de base de datos')
  .argument('<spec>', 'Especificación de la base de datos')
  .action(async (spec) => {
    console.log(chalk.blue('🗄️ CJ.DevMind - Database Agent'));
    const agent = new DatabaseAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      handleAgentError(error);
    }
  });

backendCommand
  .command('logic')
  .description('Implementa algoritmos y reglas de negocio complejas')
  .argument('<spec>', 'Especificación de la lógica de negocio')
  .action(async (spec) => {
    console.log(chalk.blue('🧮 CJ.DevMind - Logic Agent'));
    const agent = new LogicAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      handleAgentError(error);
    }
  });

// Categoría: Calidad y Seguridad
const qualityCommand = program.command('quality')
  .description('Comandos para calidad y seguridad del código');

qualityCommand
  .command('test')
  .description('Genera pruebas automatizadas para el código')
  .argument('<spec>', 'Especificación o ruta del código a probar')
  .action(async (spec) => {
    console.log(chalk.blue('🧪 CJ.DevMind - Testing Agent'));
    const agent = new TestingAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      handleAgentError(error);
    }
  });

qualityCommand
  .command('security')
  .description('Analiza y mejora la seguridad del código')
  .argument('<spec>', 'Especificación o ruta del código a analizar')
  .action(async (spec) => {
    console.log(chalk.blue('🔒 CJ.DevMind - Security Agent'));
    const agent = new SecurityAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      handleAgentError(error);
    }
  });

qualityCommand
  .command('performance')
  .description('Analiza y optimiza el rendimiento de aplicaciones')
  .argument('<spec>', 'Especificación o ruta del código a analizar')
  .action(async (spec) => {
    console.log(chalk.blue('⚡ CJ.DevMind - Performance Agent'));
    const agent = new PerformanceAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      handleAgentError(error);
    }
  });

qualityCommand
  .command('refactor')
  .description('Analiza y refactoriza código existente')
  .argument('<task>', 'Tarea de refactorización')
  .action(async (task) => {
    console.log(chalk.blue('♻️ CJ.DevMind - Refactor Agent'));
    const agent = new RefactorAgent();
    try {
      await agent.run(task);
    } catch (error) {
      handleAgentError(error);
    }
  });

// Categoría: Operaciones
const opsCommand = program.command('ops')
  .description('Comandos para operaciones y DevOps');

opsCommand
  .command('devops')
  .description('Genera configuraciones y scripts para CI/CD, Docker, IaC y monitoreo')
  .argument('<type>', 'Tipo de configuración (ci, cd, docker, iac, monitoring)')
  .action(async (type) => {
    console.log(chalk.blue('🚀 CJ.DevMind - DevOps Agent'));
    
    // Validar el tipo de configuración
    const validTypes = ['ci', 'cd', 'docker', 'iac', 'monitoring'];
    if (!validTypes.includes(type)) {
      console.error(chalk.red(`❌ Tipo inválido. Debe ser uno de: ${validTypes.join(', ')}`));
      process.exit(1);
    }
    
    const agent = new DevOpsAgent();
    try {
      await agent.run(type);
    } catch (error) {
      handleAgentError(error);
    }
  });

opsCommand
  .command('monitor')
  .description('Configura la supervisión del sistema en producción')
  .argument('<spec>', 'Especificación de monitoreo')
  .action(async (spec) => {
    console.log(chalk.blue('📊 CJ.DevMind - Monitor Agent'));
    const agent = new MonitorAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      handleAgentError(error);
    }
  });

// Categoría: Documentación y Conocimiento
const docsCommand = program.command('docs')
  .description('Comandos para documentación y gestión de conocimiento');

docsCommand
  .command('generate')
  .description('Genera documentación técnica para un módulo')
  .argument('<path>', 'Ruta al módulo')
  .action(async (modulePath) => {
    console.log(chalk.blue('📚 CJ.DevMind - Doc Agent'));
    const agent = new DocAgent();
    try {
      await agent.run(modulePath);
    } catch (error) {
      handleAgentError(error);
    }
  });

docsCommand
  .command('memory')
  .description('Gestiona el sistema de memoria y conocimiento del proyecto')
  .argument('<spec>', 'Operación (index, query, graph, search:query, record:change)')
  .action(async (spec) => {
    console.log(chalk.blue('🧠 CJ.DevMind - Memory Agent'));
    const agent = new MemoryAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      handleAgentError(error);
    }
  });

// Categoría: Sistema
const systemCommand = program.command('system')
  .description('Comandos para gestión del sistema CJ.DevMind');

systemCommand
  .command('dashboard')
  .description('Crea y gestiona el dashboard visual del proyecto')
  .argument('<action>', 'Acción a realizar (init, start, stop, status, update)')
  .option('-c, --component <name>', 'Componente específico a actualizar (con update)')
  .action(async (action, options) => {
    console.log(chalk.blue('📊 CJ.DevMind - Dashboard Agent'));
    const agent = new DashboardAgent();
    
    let spec = action;
    if (action === 'update' && options.component) {
      spec = `update:${options.component}`;
    }
    
    try {
      await agent.run(spec);
    } catch (error) {
      handleAgentError(error);
    }
  });

systemCommand
  .command('orchestrate')
  .description('Coordina un proyecto completo entre todos los agentes')
  .argument('<description>', 'Descripción del proyecto')
  .action(async (description) => {
    console.log(chalk.blue('🎭 CJ.DevMind - Orchestrator Agent'));
    const agent = new OrchestratorAgent();
    try {
      await agent.run(description);
    } catch (error) {
      handleAgentError(error);
    }
  });

// Mantener comandos de nivel superior para compatibilidad
// pero mostrar mensaje de advertencia recomendando la nueva estructura
const deprecationWarning = (command: string, newCommand: string) => {
  console.log(chalk.yellow(`⚠️ Advertencia: El comando "${command}" está obsoleto.`));
  console.log(chalk.yellow(`Por favor, use "${newCommand}" en su lugar.`));
};

// Comandos obsoletos pero mantenidos para compatibilidad
program
  .command('performance')
  .description('[Obsoleto] Use "quality performance" en su lugar')
  .argument('<spec>', 'Especificación o ruta del código a analizar')
  .action(async (spec) => {
    deprecationWarning('performance', 'quality performance');
    const agent = new PerformanceAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      handleAgentError(error);
    }
  });

program
  .command('security')
  .description('[Obsoleto] Use "quality security" en su lugar')
  .argument('<spec>', 'Especificación o ruta del código a analizar')
  .action(async (spec) => {
    deprecationWarning('security', 'quality security');
    const agent = new SecurityAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      handleAgentError(error);
    }
  });

// Añadir más comandos obsoletos siguiendo el mismo patrón...

// Comando de ayuda mejorado
program
  .command('help')
  .description('Muestra ayuda detallada sobre CJ.DevMind')
  .action(() => {
    console.log(chalk.green('\n=== CJ.DevMind - Plataforma de Desarrollo con IA ===\n'));
    console.log('CJ.DevMind es una plataforma modular que utiliza agentes de IA especializados');
    console.log('para automatizar diferentes aspectos del desarrollo de software.\n');
    
    console.log(chalk.cyan('Categorías de comandos:'));
    console.log('  plan       - Planificación y diseño del proyecto');
    console.log('  frontend   - Desarrollo frontend');
    console.log('  backend    - Desarrollo backend');
    console.log('  quality    - Calidad y seguridad del código');
    console.log('  ops        - Operaciones y DevOps');
    console.log('  docs       - Documentación y gestión de conocimiento');
    console.log('  system     - Gestión del sistema CJ.DevMind\n');
    
    console.log(chalk.cyan('Ejemplos de uso:'));
    console.log('  cj plan vision "Una aplicación de gestión de tareas"');
    console.log('  cj frontend component "Botón primario con estados hover y disabled"');
    console.log('  cj backend api "API REST para gestión de usuarios"');
    console.log('  cj quality test "src/components/Button.tsx"');
    console.log('  cj system dashboard init\n');
    
    console.log(chalk.cyan('Para más información:'));
    console.log('  cj <categoría> --help     - Muestra ayuda sobre una categoría');
    console.log('  cj <categoría> <comando> --help - Muestra ayuda sobre un comando específico\n');
  });

// Procesar argumentos
program.parse(process.argv);

// Si no se proporcionan argumentos, mostrar ayuda
if (!process.argv.slice(2).length) {
  program.outputHelp();
}