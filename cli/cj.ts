#!/usr/bin/env node
import { Command } from 'commander';
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

const program = new Command();

program
  .name('cj')
  .description('CJ.DevMind - Plataforma modular de desarrollo con IA')
  .version('0.1.0');

// Comando para Performance Agent
program
  .command('performance')
  .description('Analiza y optimiza el rendimiento de aplicaciones')
  .argument('<spec>', 'Especificación o ruta del código a analizar')
  .action(async (spec) => {
    console.log('⚡ CJ.DevMind - Performance Agent');
    const agent = new PerformanceAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para Security Agent
program
  .command('security')
  .description('Analiza y mejora la seguridad del código')
  .argument('<spec>', 'Especificación o ruta del código a analizar')
  .action(async (spec) => {
    console.log('🧠 CJ.DevMind - Security Agent');
    const agent = new SecurityAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para Testing Agent
program
  .command('test')
  .description('Genera pruebas automatizadas para el código')
  .argument('<spec>', 'Especificación o ruta del código a probar')
  .action(async (spec) => {
    console.log('🧠 CJ.DevMind - Testing Agent');
    const agent = new TestingAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para Database Agent
program
  .command('database')
  .description('Diseña y genera esquemas de base de datos')
  .argument('<spec>', 'Especificación de la base de datos')
  .action(async (spec) => {
    console.log('🧠 CJ.DevMind - Database Agent');
    const agent = new DatabaseAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para API Agent
program
  .command('api')
  .description('Diseña y genera APIs RESTful')
  .argument('<spec>', 'Especificación de la API')
  .action(async (spec) => {
    console.log('🧠 CJ.DevMind - API Agent');
    const agent = new APIAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para Component Agent
program
  .command('component')
  .description('Crea componentes React basados en el sistema de diseño')
  .argument('<spec>', 'Especificación del componente')
  .action(async (spec) => {
    console.log('🧠 CJ.DevMind - Component Agent');
    const agent = new ComponentAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para UI Design Agent
program
  .command('design')
  .description('Crea un sistema de diseño coherente')
  .argument('<project>', 'Descripción del proyecto/módulo')
  .action(async (project) => {
    console.log('🧠 CJ.DevMind - UI Design Agent');
    const agent = new UIDesignAgent();
    try {
      await agent.run(project);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para Orchestrator Agent
program
  .command('orchestrate')
  .description('Coordina un proyecto completo entre todos los agentes')
  .argument('<description>', 'Descripción del proyecto')
  .action(async (description) => {
    console.log('🧠 CJ.DevMind - Orchestrator Agent');
    const agent = new OrchestratorAgent();
    try {
      await agent.run(description);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para Vision Agent
program
  .command('vision')
  .description('Traduce una idea en requisitos técnicos detallados')
  .argument('<idea>', 'Idea inicial del proyecto')
  .action(async (idea) => {
    console.log('🧠 CJ.DevMind - Vision Agent');
    const agent = new VisionAgent();
    try {
      await agent.run(idea);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para Architect Agent
program
  .command('architect')
  .description('Diseña la estructura arquitectónica del proyecto')
  .argument('<prompt>', 'Descripción del proyecto')
  .action(async (prompt) => {
    console.log('🧠 CJ.DevMind - Architect Agent');
    const agent = new ArchitectAgent();
    try {
      await agent.run(prompt);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para Refactor Agent
program
  .command('refactor')
  .description('Analiza y refactoriza código existente')
  .argument('<task>', 'Tarea de refactorización')
  .action(async (task) => {
    console.log('🧠 CJ.DevMind - Refactor Agent');
    const agent = new RefactorAgent();
    try {
      await agent.run(task);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para Doc Agent
program
  .command('doc')
  .description('Genera documentación técnica para un módulo')
  .argument('<path>', 'Ruta al módulo')
  .action(async (modulePath) => {
    console.log('🧠 CJ.DevMind - Doc Agent');
    const agent = new DocAgent();
    try {
      await agent.run(modulePath);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para DevOps Agent
program
  .command('devops')
  .description('Genera configuraciones y scripts para CI/CD, Docker, IaC y monitoreo')
  .argument('<type>', 'Tipo de configuración (ci, cd, docker, iac, monitoring)')
  .action(async (type) => {
    console.log('🚀 CJ.DevMind - DevOps Agent');
    
    // Validar el tipo de configuración
    const validTypes = ['ci', 'cd', 'docker', 'iac', 'monitoring'];
    if (!validTypes.includes(type)) {
      console.error(`❌ Tipo inválido. Debe ser uno de: ${validTypes.join(', ')}`);
      process.exit(1);
    }
    
    const agent = new DevOpsAgent();
    try {
      await agent.run(type);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para Layout Agent
program
  .command('layout')
  .description('Estructura la navegación y organización espacial de la interfaz')
  .argument('<spec>', 'Especificación del layout')
  .action(async (spec) => {
    console.log('🏗️ CJ.DevMind - Layout Agent');
    const agent = new LayoutAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para Logic Agent
program
  .command('logic')
  .description('Implementa algoritmos y reglas de negocio complejas')
  .argument('<spec>', 'Especificación de la lógica de negocio')
  .action(async (spec) => {
    console.log('🧮 CJ.DevMind - Logic Agent');
    const agent = new LogicAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para Monitor Agent
program
  .command('monitor')
  .description('Configura la supervisión del sistema en producción')
  .argument('<spec>', 'Especificación de monitoreo')
  .action(async (spec) => {
    console.log('📊 CJ.DevMind - Monitor Agent');
    const agent = new MonitorAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para Question Agent
program
  .command('question')
  .description('Realiza un cuestionario inicial para definir el proyecto')
  .argument('<idea>', 'Idea inicial del proyecto')
  .action(async (idea) => {
    console.log('❓ CJ.DevMind - Question Agent');
    const agent = new QuestionAgent();
    try {
      await agent.run(idea);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

// Comando para Frontend Sync Agent
program
  .command('sync')
  .description('Integra el frontend con el backend')
  .argument('<spec>', 'Especificación de la integración')
  .action(async (spec) => {
    console.log('🔄 CJ.DevMind - Frontend Sync Agent');
    const agent = new FrontendSyncAgent();
    try {
      await agent.run(spec);
    } catch (error) {
      console.error('❌ Error:', error);
      process.exit(1);
    }
  });

program.parse(process.argv);
