import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';

/**
 * Question Agent - Cuestionario inicial para definir el proyecto
 * 
 * Este agente es responsable de:
 * 1. Realizar un cuestionario detallado para definir los requisitos del proyecto
 * 2. Extraer información clave sobre escala, complejidad, seguridad y estilo visual
 * 3. Generar especificaciones detalladas para otros agentes
 * 4. Crear un archivo de contexto inicial con las decisiones tomadas
 */
export class QuestionAgent extends BaseAgent {
  constructor() {
    super('Question Agent');
  }
  
  /**
   * Ejecuta el Question Agent para definir los requisitos del proyecto
   * @param projectIdea Idea inicial del proyecto
   */
  async run(projectIdea: string): Promise<void> {
    console.log(`❓ Question Agent iniciando cuestionario para: "${projectIdea}"`);
    
    // Leer contexto relevante
    const coreContext = this.readContext('core.md');
    
    // Definir preguntas del cuestionario
    const questions = [
      {
        id: 'scale',
        question: '¿Cuál es la escala esperada del proyecto?',
        options: ['Pequeña (100s usuarios)', 'Media (1000s usuarios)', 'Grande (10,000+ usuarios)'],
        defaultOption: 'Media (1000s usuarios)'
      },
      {
        id: 'complexity',
        question: '¿Cuál es la complejidad del proyecto?',
        options: ['Baja (CRUD simple)', 'Media (lógica moderada)', 'Alta (algoritmos complejos)'],
        defaultOption: 'Media (lógica moderada)'
      },
      {
        id: 'security',
        question: '¿Qué nivel de seguridad requiere el proyecto?',
        options: ['Básico (autenticación simple)', 'Estándar (JWT, HTTPS)', 'Alto (MFA, cifrado, auditoría)'],
        defaultOption: 'Estándar (JWT, HTTPS)'
      },
      {
        id: 'style',
        question: '¿Qué estilo visual prefieres?',
        options: ['Minimalista', 'Corporativo', 'Creativo', 'Personalizado'],
        defaultOption: 'Corporativo'
      },
      {
        id: 'database',
        question: '¿Qué tipo de base de datos prefieres?',
        options: ['MySQL', 'PostgreSQL', 'MongoDB', 'Firebase'],
        defaultOption: 'PostgreSQL'
      }
    ];
    
    // Crear prompt para el LLM
    const questionPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Tarea de Question Agent
    Actúa como el Question Agent de CJ.DevMind. Tu tarea es realizar un cuestionario detallado para definir los requisitos del proyecto basado en la siguiente idea inicial:
    
    "${projectIdea}"
    
    Utiliza las siguientes preguntas como base, pero puedes añadir más si es necesario para entender completamente el proyecto:
    
    ${questions.map(q => `- ${q.question} (Opciones: ${q.options.join(', ')})`).join('\n')}
    
    Basado en la idea del proyecto, sugiere las respuestas más adecuadas y justifica cada elección. Luego, genera un resumen detallado de los requisitos del proyecto que pueda ser utilizado por otros agentes.
    `;
    
    try {
      // Consultar al LLM
      const response = await this.queryLLM(questionPrompt);
      
      // Guardar resultados en el contexto
      const contextPath = path.join(this.contextPath, 'project-requirements.md');
      fs.writeFileSync(contextPath, response, 'utf-8');
      
      console.log('✅ Cuestionario completado y requisitos guardados en context/project-requirements.md');
      console.log('📋 Resumen de requisitos:');
      console.log(response.substring(0, 500) + '...');
    } catch (error) {
      console.error('❌ Error al ejecutar el cuestionario:', error);
      throw error;
    }
  }
}