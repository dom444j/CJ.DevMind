import { BaseAgent, AgentEventType } from './base-agent';
import fs from 'fs';
import path from 'path';
import { LLMService } from '../services/llm-service';
import { MemoryService } from '../services/memory-service';
import { AnalyticsService } from '../services/analytics-service';
import { CodeAnalysisService } from '../services/code-analysis-service';

/**
 * Interfaz para las métricas de rendimiento de un agente
 */
interface AgentPerformanceMetrics {
  agentName: string;
  responseTime: number[];
  tokenUsage: number[];
  successRate: number;
  errorRate: number;
  userFeedbackScore: number;
  lastOptimized: string;
  optimizationHistory: OptimizationRecord[];
}

/**
 * Interfaz para un registro de optimización
 */
interface OptimizationRecord {
  timestamp: string;
  type: 'prompt' | 'code' | 'configuration';
  description: string;
  improvement: {
    before: {
      metric: string;
      value: number;
    };
    after: {
      metric: string;
      value: number;
    };
  };
}

/**
 * Interfaz para las metas de mejora
 */
interface ImprovementGoals {
  performance?: boolean;
  readability?: boolean;
  errorHandling?: boolean;
  tokenEfficiency?: boolean;
  responseTime?: boolean;
  userExperience?: boolean;
  codeQuality?: boolean;
  testCoverage?: boolean;
}

/**
 * Interfaz para las sugerencias de mejora
 */
interface ImprovementSuggestion {
  type: 'prompt' | 'code' | 'configuration';
  description: string;
  currentImplementation: string;
  suggestedImplementation: string;
  expectedImprovement: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
}

/**
 * Interfaz para el resultado de una optimización
 */
interface OptimizationResult {
  agentName: string;
  timestamp: string;
  improvements: ImprovementSuggestion[];
  appliedChanges: {
    file: string;
    changes: {
      before: string;
      after: string;
      lineStart: number;
      lineEnd: number;
    }[];
  }[];
  metrics: {
    before: Record<string, number>;
    predicted: Record<string, number>;
  };
}

/**
 * Agente responsable de mejorar automáticamente el código y los prompts de otros agentes
 */
export class SelfImprovementAgent extends BaseAgent {
  private llmService: LLMService;
  private memoryService: MemoryService;
  private analyticsService: AnalyticsService;
  private codeAnalysisService: CodeAnalysisService;
  private agentMetrics: Map<string, AgentPerformanceMetrics>;
  private optimizationThreshold: number = 0.15; // 15% de mejora potencial para activar optimización
  private optimizationCooldown: number = 24 * 60 * 60 * 1000; // 24 horas entre optimizaciones
  private metricsHistoryLimit: number = 100; // Número máximo de métricas a almacenar por agente

  constructor() {
    super('Self Improvement Agent');
    this.llmService = new LLMService();
    this.memoryService = new MemoryService();
    this.analyticsService = new AnalyticsService();
    this.codeAnalysisService = new CodeAnalysisService();
    this.agentMetrics = new Map<string, AgentPerformanceMetrics>();
    this.registerEventHandlers();
    this.loadAgentMetrics();
  }

  private registerEventHandlers(): void {
    // Escuchar solicitudes de auto-mejora
    this.listenForEvent(AgentEventType.SELF_IMPROVEMENT_REQUESTED, async (message) => {
      this.log(`🛠️ Solicitud de auto-mejora recibida de ${message.from}`);
      try {
        const improvedCode = await this.improveAgentCode(
          message.content.agentCode, 
          message.content.improvementGoals,
          message.from
        );
        this.sendEvent(AgentEventType.SELF_IMPROVEMENT_COMPLETED, {
          improvedCode,
          timestamp: new Date().toISOString(),
        }, message.from);
      } catch (error) {
        this.log(`❌ Error en auto-mejora: ${error.message}`, 'error');
        this.sendEvent(AgentEventType.SELF_IMPROVEMENT_ERROR, {
          error: error.message,
          timestamp: new Date().toISOString(),
        }, message.from);
      }
    });

    // Escuchar métricas de rendimiento de agentes
    this.listenForEvent(AgentEventType.AGENT_METRICS_UPDATED, async (message) => {
      this.log(`📊 Métricas recibidas de ${message.from}`);
      await this.updateAgentMetrics(message.from, message.content);
      
      // Verificar si es necesario optimizar el agente
      if (this.shouldOptimizeAgent(message.from)) {
        this.log(`🔄 Iniciando optimización automática para ${message.from}`);
        this.sendEvent(AgentEventType.SELF_IMPROVEMENT_REQUESTED, {
          agentCode: await this.getAgentCode(message.from),
          improvementGoals: this.determineImprovementGoals(message.from),
        }, message.from);
      }
    });

    // Escuchar feedback del usuario sobre agentes
    this.listenForEvent(AgentEventType.USER_FEEDBACK_RECEIVED, async (message) => {
      this.log(`👤 Feedback de usuario recibido para ${message.content.agentName}`);
      await this.updateAgentFeedback(
        message.content.agentName, 
        message.content.feedbackScore,
        message.content.comments
      );
    });

    // Escuchar solicitudes de análisis de rendimiento
    this.listenForEvent(AgentEventType.PERFORMANCE_ANALYSIS_REQUESTED, async (message) => {
      this.log(`🔍 Análisis de rendimiento solicitado para ${message.content.agentName}`);
      const analysis = await this.analyzeAgentPerformance(message.content.agentName);
      this.sendEvent(AgentEventType.PERFORMANCE_ANALYSIS_COMPLETED, {
        analysis,
        timestamp: new Date().toISOString(),
      }, message.from);
    });
  }

  /**
   * Mejora el código de un agente según los objetivos especificados
   */
  async improveAgentCode(
    agentCode: string, 
    improvementGoals: string[] | ImprovementGoals,
    agentName: string
  ): Promise<string> {
    this.log(`🛠️ Mejorando código del agente ${agentName} con objetivos: ${
      Array.isArray(improvementGoals) ? improvementGoals.join(', ') : Object.keys(improvementGoals).filter(key => improvementGoals[key]).join(', ')
    }`);

    // Convertir array de objetivos a objeto ImprovementGoals si es necesario
    const goals: ImprovementGoals = Array.isArray(improvementGoals) 
      ? this.convertGoalsArrayToObject(improvementGoals)
      : improvementGoals;

    // Analizar el código actual
    const codeAnalysis = await this.codeAnalysisService.analyzeCode(agentCode);
    
    // Obtener historial de ejecución del agente
    const executionHistory = await this.memoryService.getAgentExecutionHistory(agentName);
    
    // Obtener métricas de rendimiento
    const metrics = this.agentMetrics.get(agentName) || this.createDefaultMetrics(agentName);

    // Generar sugerencias de mejora
    const suggestions = await this.generateImprovementSuggestions(
      agentCode,
      codeAnalysis,
      executionHistory,
      metrics,
      goals
    );

    // Aplicar mejoras según los objetivos y sugerencias
    let improvedCode = agentCode;
    const appliedChanges = [];

    for (const suggestion of suggestions) {
      if (suggestion.confidence >= 0.7) { // Solo aplicar sugerencias con alta confianza
        const beforeCode = improvedCode;
        improvedCode = this.applySuggestion(improvedCode, suggestion);
        
        if (beforeCode !== improvedCode) {
          appliedChanges.push({
            type: suggestion.type,
            description: suggestion.description,
            expectedImprovement: suggestion.expectedImprovement
          });
        }
      }
    }

    // Registrar la optimización
    if (appliedChanges.length > 0) {
      await this.recordOptimization(agentName, appliedChanges, goals);
    }

    return improvedCode;
  }

  /**
   * Convierte un array de objetivos a un objeto ImprovementGoals
   */
  private convertGoalsArrayToObject(goals: string[]): ImprovementGoals {
    const result: ImprovementGoals = {};
    
    for (const goal of goals) {
      switch (goal.toLowerCase()) {
        case 'performance':
          result.performance = true;
          break;
        case 'readability':
          result.readability = true;
          break;
        case 'error-handling':
        case 'errorhandling':
          result.errorHandling = true;
          break;
        case 'token-efficiency':
        case 'tokenefficiency':
          result.tokenEfficiency = true;
          break;
        case 'response-time':
        case 'responsetime':
          result.responseTime = true;
          break;
        case 'user-experience':
        case 'userexperience':
          result.userExperience = true;
          break;
        case 'code-quality':
        case 'codequality':
          result.codeQuality = true;
          break;
        case 'test-coverage':
        case 'testcoverage':
          result.testCoverage = true;
          break;
      }
    }
    
    return result;
  }

  /**
   * Genera sugerencias de mejora basadas en el análisis del código y las métricas
   */
  private async generateImprovementSuggestions(
    code: string,
    codeAnalysis: any,
    executionHistory: any[],
    metrics: AgentPerformanceMetrics,
    goals: ImprovementGoals
  ): Promise<ImprovementSuggestion[]> {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Preparar el prompt para el LLM
    const prompt = this.buildImprovementPrompt(code, codeAnalysis, executionHistory, metrics, goals);
    
    // Obtener sugerencias del LLM
    const response = await this.llmService.getCompletion(prompt, {
      temperature: 0.2,
      max_tokens: 2000,
      model: 'gpt-4'
    });
    
    try {
      // Parsear la respuesta del LLM
      const parsedResponse = JSON.parse(response);
      
      if (Array.isArray(parsedResponse.suggestions)) {
        return parsedResponse.suggestions;
      }
    } catch (error) {
      this.log(`❌ Error al parsear sugerencias: ${error.message}`, 'error');
      
      // Intentar extraer sugerencias con un enfoque más flexible
      return this.extractSuggestionsFromText(response);
    }
    
    return suggestions;
  }

  /**
   * Construye el prompt para solicitar mejoras al LLM
   */
  private buildImprovementPrompt(
    code: string,
    codeAnalysis: any,
    executionHistory: any[],
    metrics: AgentPerformanceMetrics,
    goals: ImprovementGoals
  ): string {
    return `
# Solicitud de Mejora de Código de Agente

## Código Actual
\`\`\`typescript
${code}
\`\`\`

## Análisis del Código
${JSON.stringify(codeAnalysis, null, 2)}

## Historial de Ejecución (Últimos 5 eventos)
${JSON.stringify(executionHistory.slice(-5), null, 2)}

## Métricas de Rendimiento
${JSON.stringify(metrics, null, 2)}

## Objetivos de Mejora
${JSON.stringify(goals, null, 2)}

## Instrucciones
Analiza el código proporcionado y genera sugerencias de mejora basadas en los objetivos especificados.
Para cada sugerencia, proporciona:
1. Tipo de mejora (prompt, code, configuration)
2. Descripción de la mejora
3. Implementación actual
4. Implementación sugerida
5. Mejora esperada
6. Nivel de confianza (0-1)
7. Prioridad (low, medium, high)

Responde en formato JSON con la siguiente estructura:
\`\`\`json
{
  "suggestions": [
    {
      "type": "code",
      "description": "Descripción de la mejora",
      "currentImplementation": "Código actual",
      "suggestedImplementation": "Código mejorado",
      "expectedImprovement": "Descripción de la mejora esperada",
      "confidence": 0.85,
      "priority": "high"
    }
  ]
}
\`\`\`
`;
  }

  /**
   * Extrae sugerencias de mejora de una respuesta de texto no estructurada
   */
  private extractSuggestionsFromText(text: string): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];
    
    // Buscar patrones que parezcan sugerencias
    const suggestionBlocks = text.split(/(?=Sugerencia|Suggestion|Mejora|Improvement \d+:)/gi);
    
    for (const block of suggestionBlocks) {
      if (!block.trim()) continue;
      
      const suggestion: Partial<ImprovementSuggestion> = {
        type: 'code', // Valor por defecto
        confidence: 0.7, // Valor por defecto
        priority: 'medium' // Valor por defecto
      };
      
      // Extraer tipo
      const typeMatch = block.match(/Tipo|Type:?\s*(\w+)/i);
      if (typeMatch && ['prompt', 'code', 'configuration'].includes(typeMatch[1].toLowerCase())) {
        suggestion.type = typeMatch[1].toLowerCase() as 'prompt' | 'code' | 'configuration';
      }
      
      // Extraer descripción
      const descMatch = block.match(/Descripción|Description:?\s*([^\n]+)/i);
      if (descMatch) {
        suggestion.description = descMatch[1].trim();
      }
      
      // Extraer implementación actual
      const currentMatch = block.match(/Implementación actual|Current implementation:?\s*```(?:\w+)?\s*([\s\S]*?)```/i);
      if (currentMatch) {
        suggestion.currentImplementation = currentMatch[1].trim();
      }
      
      // Extraer implementación sugerida
      const suggestedMatch = block.match(/Implementación sugerida|Suggested implementation:?\s*```(?:\w+)?\s*([\s\S]*?)```/i);
      if (suggestedMatch) {
        suggestion.suggestedImplementation = suggestedMatch[1].trim();
      }
      
      // Extraer mejora esperada
      const expectedMatch = block.match(/Mejora esperada|Expected improvement:?\s*([^\n]+)/i);
      if (expectedMatch) {
        suggestion.expectedImprovement = expectedMatch[1].trim();
      }
      
      // Extraer confianza
      const confMatch = block.match(/Confianza|Confidence:?\s*(0\.\d+|\d+(\.\d+)?)/i);
      if (confMatch) {
        suggestion.confidence = parseFloat(confMatch[1]);
      }
      
      // Extraer prioridad
      const prioMatch = block.match(/Prioridad|Priority:?\s*(low|medium|high)/i);
      if (prioMatch) {
        suggestion.priority = prioMatch[1].toLowerCase() as 'low' | 'medium' | 'high';
      }
      
      // Añadir sugerencia si tiene los campos mínimos necesarios
      if (suggestion.description && suggestion.suggestedImplementation) {
        suggestions.push(suggestion as ImprovementSuggestion);
      }
    }
    
    return suggestions;
  }

    /**
   * Aplica una sugerencia de mejora al código
   */
    private applySuggestion(code: string, suggestion: ImprovementSuggestion): string {
      if (!suggestion.currentImplementation || !suggestion.suggestedImplementation) {
        return code;
      }
      
      // Escapar caracteres especiales para la expresión regular
      const escapedCurrent = suggestion.currentImplementation
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\n/g, '\\n');
      
      try {
        // Crear una expresión regular para encontrar la implementación actual
        const regex = new RegExp(escapedCurrent, 'g');
        
        // Reemplazar la implementación actual con la sugerida
        return code.replace(regex, suggestion.suggestedImplementation);
      } catch (error) {
        this.log(`❌ Error al aplicar sugerencia: ${error.message}`, 'error');
        
        // Si falla la expresión regular, intentar un enfoque más simple
        return code.replace(suggestion.currentImplementation, suggestion.suggestedImplementation);
      }
    }
  
    /**
     * Registra una optimización realizada
     */
    private async recordOptimization(
      agentName: string, 
      appliedChanges: any[], 
      goals: ImprovementGoals
    ): Promise<void> {
      const metrics = this.agentMetrics.get(agentName) || this.createDefaultMetrics(agentName);
      
      // Crear registro de optimización
      const optimizationRecord: OptimizationRecord = {
        timestamp: new Date().toISOString(),
        type: appliedChanges[0]?.type || 'code',
        description: `Optimización automática con ${appliedChanges.length} cambios aplicados`,
        improvement: {
          before: {
            metric: 'successRate',
            value: metrics.successRate
          },
          after: {
            metric: 'successRate',
            value: metrics.successRate * 1.1 // Estimación de mejora del 10%
          }
        }
      };
      
      // Actualizar métricas del agente
      metrics.lastOptimized = new Date().toISOString();
      metrics.optimizationHistory.push(optimizationRecord);
      
      // Limitar el historial de optimizaciones a las 10 más recientes
      if (metrics.optimizationHistory.length > 10) {
        metrics.optimizationHistory = metrics.optimizationHistory.slice(-10);
      }
      
      // Guardar métricas actualizadas
      this.agentMetrics.set(agentName, metrics);
      await this.saveAgentMetrics();
      
      // Registrar la optimización en el sistema de memoria
      await this.memoryService.storeOptimizationRecord(agentName, optimizationRecord);
      
      this.log(`✅ Optimización registrada para ${agentName}: ${appliedChanges.length} cambios aplicados`);
    }
  
    /**
     * Actualiza las métricas de un agente
     */
    private async updateAgentMetrics(agentName: string, newMetrics: any): Promise<void> {
      const metrics = this.agentMetrics.get(agentName) || this.createDefaultMetrics(agentName);
      
      // Actualizar métricas de tiempo de respuesta
      if (newMetrics.responseTime !== undefined) {
        metrics.responseTime.push(newMetrics.responseTime);
        // Limitar el historial de tiempos de respuesta
        if (metrics.responseTime.length > this.metricsHistoryLimit) {
          metrics.responseTime = metrics.responseTime.slice(-this.metricsHistoryLimit);
        }
      }
      
      // Actualizar métricas de uso de tokens
      if (newMetrics.tokenUsage !== undefined) {
        metrics.tokenUsage.push(newMetrics.tokenUsage);
        // Limitar el historial de uso de tokens
        if (metrics.tokenUsage.length > this.metricsHistoryLimit) {
          metrics.tokenUsage = metrics.tokenUsage.slice(-this.metricsHistoryLimit);
        }
      }
      
      // Actualizar tasa de éxito
      if (newMetrics.successRate !== undefined) {
        metrics.successRate = newMetrics.successRate;
      }
      
      // Actualizar tasa de error
      if (newMetrics.errorRate !== undefined) {
        metrics.errorRate = newMetrics.errorRate;
      }
      
      // Guardar métricas actualizadas
      this.agentMetrics.set(agentName, metrics);
      await this.saveAgentMetrics();
      
      this.log(`📊 Métricas actualizadas para ${agentName}`);
    }
  
    /**
     * Actualiza el feedback del usuario para un agente
     */
    private async updateAgentFeedback(
      agentName: string, 
      feedbackScore: number,
      comments?: string
    ): Promise<void> {
      const metrics = this.agentMetrics.get(agentName) || this.createDefaultMetrics(agentName);
      
      // Actualizar puntuación de feedback
      metrics.userFeedbackScore = feedbackScore;
      
      // Guardar métricas actualizadas
      this.agentMetrics.set(agentName, metrics);
      await this.saveAgentMetrics();
      
      // Registrar feedback en el sistema de memoria
      await this.memoryService.storeUserFeedback(agentName, {
        timestamp: new Date().toISOString(),
        score: feedbackScore,
        comments: comments || ''
      });
      
      this.log(`👤 Feedback actualizado para ${agentName}: ${feedbackScore}/5`);
      
      // Si el feedback es bajo, considerar una optimización inmediata
      if (feedbackScore < 3) {
        this.log(`⚠️ Feedback bajo detectado para ${agentName}, considerando optimización inmediata`);
        
        // Verificar si el agente no ha sido optimizado recientemente
        if (this.canOptimizeAgent(agentName)) {
          this.log(`🔄 Iniciando optimización automática para ${agentName} debido a feedback bajo`);
          this.sendEvent(AgentEventType.SELF_IMPROVEMENT_REQUESTED, {
            agentCode: await this.getAgentCode(agentName),
            improvementGoals: {
              userExperience: true,
              errorHandling: true,
              readability: true
            },
          }, agentName);
        }
      }
    }
  
    /**
     * Analiza el rendimiento de un agente
     */
    private async analyzeAgentPerformance(agentName: string): Promise<any> {
      const metrics = this.agentMetrics.get(agentName) || this.createDefaultMetrics(agentName);
      
      // Calcular métricas promedio
      const avgResponseTime = metrics.responseTime.length > 0
        ? metrics.responseTime.reduce((sum, time) => sum + time, 0) / metrics.responseTime.length
        : 0;
      
      const avgTokenUsage = metrics.tokenUsage.length > 0
        ? metrics.tokenUsage.reduce((sum, tokens) => sum + tokens, 0) / metrics.tokenUsage.length
        : 0;
      
      // Identificar tendencias
      const responseTimeTrend = this.calculateTrend(metrics.responseTime);
      const tokenUsageTrend = this.calculateTrend(metrics.tokenUsage);
      
      // Obtener historial de ejecución
      const executionHistory = await this.memoryService.getAgentExecutionHistory(agentName);
      
      // Analizar patrones de error
      const errorPatterns = this.analyzeErrorPatterns(executionHistory);
      
      // Generar recomendaciones
      const recommendations = await this.generateRecommendations(
        agentName,
        {
          avgResponseTime,
          avgTokenUsage,
          responseTimeTrend,
          tokenUsageTrend,
          successRate: metrics.successRate,
          errorRate: metrics.errorRate,
          userFeedbackScore: metrics.userFeedbackScore,
          errorPatterns
        }
      );
      
      return {
        agentName,
        metrics: {
          avgResponseTime,
          avgTokenUsage,
          successRate: metrics.successRate,
          errorRate: metrics.errorRate,
          userFeedbackScore: metrics.userFeedbackScore,
          lastOptimized: metrics.lastOptimized
        },
        trends: {
          responseTime: responseTimeTrend,
          tokenUsage: tokenUsageTrend
        },
        errorPatterns,
        recommendations,
        timestamp: new Date().toISOString()
      };
    }
  
    /**
     * Calcula la tendencia de una serie de métricas
     */
    private calculateTrend(data: number[]): 'increasing' | 'decreasing' | 'stable' {
      if (data.length < 5) {
        return 'stable'; // No hay suficientes datos para determinar una tendencia
      }
      
      // Tomar los últimos 5 valores
      const recentData = data.slice(-5);
      
      // Calcular la pendiente de la línea de tendencia
      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumXX = 0;
      
      for (let i = 0; i < recentData.length; i++) {
        sumX += i;
        sumY += recentData[i];
        sumXY += i * recentData[i];
        sumXX += i * i;
      }
      
      const n = recentData.length;
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      
      // Determinar la tendencia basada en la pendiente
      if (slope > 0.05) {
        return 'increasing';
      } else if (slope < -0.05) {
        return 'decreasing';
      } else {
        return 'stable';
      }
    }
  
    /**
     * Analiza patrones de error en el historial de ejecución
     */
    private analyzeErrorPatterns(executionHistory: any[]): any[] {
      const errorPatterns = [];
      const errorMap = new Map<string, number>();
      
      // Contar ocurrencias de cada tipo de error
      for (const event of executionHistory) {
        if (event.type === 'error' && event.content && event.content.error) {
          const errorMessage = event.content.error;
          const count = errorMap.get(errorMessage) || 0;
          errorMap.set(errorMessage, count + 1);
        }
      }
      
      // Convertir el mapa a un array de patrones
      for (const [errorMessage, count] of errorMap.entries()) {
        errorPatterns.push({
          message: errorMessage,
          count,
          frequency: count / executionHistory.length
        });
      }
      
      // Ordenar por frecuencia descendente
      return errorPatterns.sort((a, b) => b.frequency - a.frequency);
    }
  
    /**
     * Genera recomendaciones basadas en el análisis de rendimiento
     */
    private async generateRecommendations(
      agentName: string,
      analysis: any
    ): Promise<string[]> {
      const recommendations = [];
      
      // Recomendaciones basadas en tiempo de respuesta
      if (analysis.responseTimeTrend === 'increasing') {
        recommendations.push('Optimizar el tiempo de respuesta implementando caché para operaciones frecuentes');
      }
      
      // Recomendaciones basadas en uso de tokens
      if (analysis.avgTokenUsage > 2000) {
        recommendations.push('Reducir el uso de tokens optimizando los prompts y respuestas');
      }
      
      // Recomendaciones basadas en tasa de error
      if (analysis.errorRate > 0.1) {
        recommendations.push('Mejorar el manejo de errores para reducir la tasa de fallos');
      }
      
      // Recomendaciones basadas en feedback del usuario
      if (analysis.userFeedbackScore < 4) {
        recommendations.push('Mejorar la experiencia del usuario con mensajes más claros y respuestas más precisas');
      }
      
      // Recomendaciones basadas en patrones de error
      if (analysis.errorPatterns.length > 0) {
        const topError = analysis.errorPatterns[0];
        recommendations.push(`Abordar el error más común: "${topError.message}" (${Math.round(topError.frequency * 100)}% de las ejecuciones)`);
      }
      
      // Si no hay recomendaciones específicas, añadir una general
      if (recommendations.length === 0) {
        recommendations.push('El agente está funcionando correctamente, no se requieren optimizaciones inmediatas');
      }
      
      return recommendations;
    }
  
    /**
     * Verifica si un agente debe ser optimizado
     */
    private shouldOptimizeAgent(agentName: string): boolean {
      const metrics = this.agentMetrics.get(agentName);
      
      if (!metrics) {
        return false; // No hay métricas disponibles
      }
      
      // Verificar si el agente puede ser optimizado (cooldown)
      if (!this.canOptimizeAgent(agentName)) {
        return false;
      }
      
      // Criterios para optimización automática
      const highErrorRate = metrics.errorRate > 0.15; // Más del 15% de errores
      const lowSuccessRate = metrics.successRate < 0.8; // Menos del 80% de éxito
      const lowFeedback = metrics.userFeedbackScore < 3.5; // Feedback menor a 3.5/5
      
      // Verificar tendencias
      const responseTimeTrend = this.calculateTrend(metrics.responseTime);
      const increasingResponseTime = responseTimeTrend === 'increasing';
      
      // Decidir si optimizar basado en los criterios
      return highErrorRate || lowSuccessRate || lowFeedback || increasingResponseTime;
    }
  
    /**
     * Verifica si un agente puede ser optimizado (cooldown)
     */
    private canOptimizeAgent(agentName: string): boolean {
      const metrics = this.agentMetrics.get(agentName);
      
      if (!metrics || !metrics.lastOptimized) {
        return true; // Nunca ha sido optimizado
      }
      
      // Verificar si ha pasado suficiente tiempo desde la última optimización
      const lastOptimized = new Date(metrics.lastOptimized).getTime();
      const now = Date.now();
      
      return now - lastOptimized > this.optimizationCooldown;
    }
  
    /**
     * Determina los objetivos de mejora para un agente
     */
    private determineImprovementGoals(agentName: string): ImprovementGoals {
      const metrics = this.agentMetrics.get(agentName);
      const goals: ImprovementGoals = {};
      
      if (!metrics) {
        // Si no hay métricas, establecer objetivos generales
        return {
          performance: true,
          errorHandling: true,
          readability: true
        };
      }
      
      // Determinar objetivos basados en métricas
      if (metrics.errorRate > 0.1) {
        goals.errorHandling = true;
      }
      
      if (this.calculateTrend(metrics.responseTime) === 'increasing') {
        goals.responseTime = true;
        goals.performance = true;
      }
      
      if (this.calculateTrend(metrics.tokenUsage) === 'increasing') {
        goals.tokenEfficiency = true;
      }
      
      if (metrics.userFeedbackScore < 4) {
        goals.userExperience = true;
        goals.readability = true;
      }
      
      // Si no se determinaron objetivos específicos, establecer objetivos generales
      if (Object.keys(goals).length === 0) {
        goals.performance = true;
        goals.readability = true;
      }
      
      return goals;
    }
  
    /**
     * Obtiene el código de un agente
     */
    private async getAgentCode(agentName: string): Promise<string> {
      try {
        // Construir la ruta del archivo del agente
        const agentFileName = this.convertAgentNameToFileName(agentName);
        const agentFilePath = path.join(__dirname, agentFileName);
        
        // Verificar si el archivo existe
        if (!fs.existsSync(agentFilePath)) {
          throw new Error(`Archivo del agente no encontrado: ${agentFilePath}`);
        }
        
        // Leer el contenido del archivo
        return fs.readFileSync(agentFilePath, 'utf-8');
      } catch (error) {
        this.log(`❌ Error al obtener código del agente ${agentName}: ${error.message}`, 'error');
        throw error;
      }
    }
  
    /**
     * Convierte el nombre de un agente a nombre de archivo
     */
    private convertAgentNameToFileName(agentName: string): string {
      // Eliminar "Agent" del final si existe
      let baseName = agentName.endsWith('Agent') 
        ? agentName.substring(0, agentName.length - 5) 
        : agentName;
      
      // Convertir a kebab-case
      const fileName = baseName
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .toLowerCase();
      
      return `${fileName}-agent.ts`;
    }
  
    /**
     * Carga las métricas de los agentes desde el almacenamiento
     */
    private async loadAgentMetrics(): Promise<void> {
      try {
        const metricsPath = path.join(__dirname, '../data/agent-metrics.json');
        
        // Verificar si el archivo existe
        if (fs.existsSync(metricsPath)) {
          const metricsData = JSON.parse(fs.readFileSync(metricsPath, 'utf-8'));
          
          // Convertir el objeto a un Map
          this.agentMetrics = new Map(Object.entries(metricsData));
          this.log(`📊 Métricas de agentes cargadas: ${this.agentMetrics.size} agentes`);
        } else {
          this.log(`ℹ️ No se encontraron métricas de agentes, se inicializará un nuevo registro`);
          this.agentMetrics = new Map();
        }
      } catch (error) {
        this.log(`❌ Error al cargar métricas de agentes: ${error.message}`, 'error');
        this.agentMetrics = new Map();
      }
    }
  
    /**
     * Guarda las métricas de los agentes en el almacenamiento
     */
    private async saveAgentMetrics(): Promise<void> {
      try {
        const metricsPath = path.join(__dirname, '../data/agent-metrics.json');
        
        // Crear directorio si no existe
        const dir = path.dirname(metricsPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // Convertir el Map a un objeto para guardarlo como JSON
        const metricsData = Object.fromEntries(this.agentMetrics);
        
        // Guardar en el archivo
        fs.writeFileSync(metricsPath, JSON.stringify(metricsData, null, 2), 'utf-8');
        this.log(`💾 Métricas de agentes guardadas: ${this.agentMetrics.size} agentes`);
      } catch (error) {
        this.log(`❌ Error al guardar métricas de agentes: ${error.message}`, 'error');
      }
    }
  
    /**
     * Crea métricas por defecto para un agente
     */
    private createDefaultMetrics(agentName: string): AgentPerformanceMetrics {
      return {
        agentName,
        responseTime: [],
        tokenUsage: [],
        successRate: 1.0,
        errorRate: 0.0,
        userFeedbackScore: 5.0,
        lastOptimized: '',
        optimizationHistory: []
      };
    }
  
    /**
     * Optimiza el rendimiento del código
     */
    public optimizePerformance(code: string): string {
      // Identificar patrones que pueden optimizarse
      let optimizedCode = code;
      
      // Optimizar bucles
      optimizedCode = optimizedCode.replace(
        /for\s*\(\s*let\s+i\s*=\s*0\s*;\s*i\s*<\s*(\w+)\.length\s*;\s*i\+\+\s*\)/g,
        (match, array) => `for (let i = 0, len = ${array}.length; i < len; i++)`
      );
      
      // Añadir memoización a funciones
      optimizedCode = optimizedCode.replace(
        /private\s+(\w+)\s*\(\s*([^)]*)\s*\)\s*:\s*(\w+)\s*{/g,
        (match, funcName, params, returnType) => {
          // Solo aplicar a funciones que no sean void
          if (returnType !== 'void') {
            return `private ${funcName}(${params}): ${returnType} {
      // Optimizado para mejor rendimiento con memoización
      const cacheKey = \`${funcName}_\${JSON.stringify(arguments)}\`;
      if (this._cache && this._cache[cacheKey] !== undefined) {
        return this._cache[cacheKey];
      }
      
      if (!this._cache) this._cache = {};`;
          }
          return match;
        }
      );
      
      // Añadir cierre de memoización
      optimizedCode = optimizedCode.replace(
        /return\s+([^;]+);(?!\s*}\s*\/\/\s*Fin de memoización)/g,
        (match, returnValue) => {
          // Solo aplicar si hay _cache definido
          if (optimizedCode.includes('this._cache')) {
            return `const result = ${returnValue};
      this._cache[cacheKey] = result;
      return result; // Fin de memoización`;
          }
          return match;
        }
      );
      
      return optimizedCode;
    }
  
    /**
     * Mejora la legibilidad del código
     */
    public improveReadability(code: string): string {
      let readableCode = code;
      
      // Añadir comentarios JSDoc a métodos
      readableCode = readableCode.replace(
        /(?<!\/\*\*[\s\S]*?\*\/\s*)(?:public|private|protected)\s+(\w+)\s*\(\s*([^)]*)\s*\)\s*:\s*(\w+)/g,
        (match, funcName, params, returnType) => {
          // Evitar duplicar comentarios
          if (!match.includes('/**')) {
            const paramsList = params.split(',').filter(p => p.trim());
            const paramsDoc = paramsList.map(p => {
              const [paramName] = p.trim().split(':');
              return ` * @param ${paramName.trim()} Descripción de ${paramName.trim()}`;
            }).join('\n');
            
            return `/**
   * ${this.generateMethodDescription(funcName)}
  ${paramsList.length > 0 ? paramsDoc : ''}
   * @returns ${returnType !== 'void' ? 'Descripción del valor de retorno' : 'No retorna valor'}
   */
  ${match}`;
          }
          return match;
        }
      );
      
      // Mejorar formato de código
      readableCode = readableCode.replace(/{\n\s*\n/g, '{\n');
      readableCode = readableCode.replace(/\n\s*\n}/g, '\n}');
      
      // Añadir separadores para secciones principales
      readableCode = readableCode.replace(
        /(?:\/\/\s*)?(?:private|public|protected)\s+methods/gi,
        '// ==================== MÉTODOS ====================\n// Private methods'
      );
      
      return readableCode;
    }
  
    /**
     * Genera una descripción para un método basada en su nombre
     */
    private generateMethodDescription(methodName: string): string {
      // Convertir camelCase a palabras separadas
      const words = methodName.replace(/([A-Z])/g, ' $1').toLowerCase();
      
      // Capitalizar primera letra
      const description = words.charAt(0).toUpperCase() + words.slice(1);
      
      return description;
    }
  
    /**
     * Mejora el manejo de errores en el código
     */
    public improveErrorHandling(code: string): string {
      let saferCode = code;
      
      // Añadir try-catch a métodos async
      saferCode = saferCode.replace(
        /async\s+(\w+)\s*\(\s*([^)]*)\s*\)\s*:\s*Promise<([^>]+)>\s*{(?!\s*try\s*{)/g,
        (match, funcName, params, returnType) => {
          return `async ${funcName}(${params}): Promise<${returnType}> {
      try {`;
        }
      );
      
      // Añadir catch al final de métodos async que se modificaron
      saferCode = saferCode.replace(
        /}(\s*\/\/\s*fin de método async\s*)?$/g,
        (match) => {
          if (saferCode.includes('try {') && !saferCode.includes('catch (error)')) {
            return `    } catch (error) {
        this.log(\`❌ Error en ${match.includes('fin de método') ? match.match(/fin de método (\w+)/)[1] : 'método'}: \${error.message}\`, 'error');
        throw error;
      }
  }`;
          }
          return match;
        }
      );
      
      // Mejorar validación de parámetros
      saferCode = saferCode.replace(
        /(\w+)\s*\(\s*([^)]+)\s*\)\s*:\s*(\w+)\s*{/g,
        (match, funcName, params, returnType) => {
          const paramsList = params.split(',').filter(p => p.trim());
          
          if (paramsList.length > 0) {
            const validations = paramsList.map(p => {
              const [paramName, paramType] = p.trim().split(':');
              const trimmedName = paramName.trim();
              
              if (paramType && paramType.includes('string')) {
                return `    if (${trimmedName} === undefined || ${trimmedName} === null) {
        throw new Error(\`El parámetro ${trimmedName} es requerido\`);
      }`;
              } else if (paramType && paramType.includes('number')) {
                return `    if (${trimmedName} === undefined || ${trimmedName} === null || isNaN(${trimmedName})) {
        throw new Error(\`El parámetro ${trimmedName} debe ser un número válido\`);
      }`;
              } else if (paramType && paramType.includes('[]')) {
                return `    if (!Array.isArray(${trimmedName})) {
        throw new Error(\`El parámetro ${trimmedName} debe ser un array\`);
      }`;
              }
              return '';
            }).filter(v => v).join('\n');
            
            if (validations) {
              return `${match}\n${validations}\n`;
            }
          }
          
          return match;
        }
      );
      
      return saferCode;
    }
  
    /**
     * Mejora la eficiencia de tokens en los prompts
     */
    public improveTokenEfficiency(code: string): string {
      let efficientCode = code;
      
      // Optimizar prompts largos
      efficientCode = efficientCode.replace(
        /const\s+prompt\s*=\s*`([^`]+)`/g,
        (match, promptContent) => {
          // Reducir espacios en blanco excesivos
          let optimizedPrompt = promptContent.replace(/\n\s*\n\s*\n/g, '\n\n');
          
          // Reducir repeticiones de instrucciones
          const instructions = [
            'Analiza', 'Evalúa', 'Considera', 'Examina', 'Revisa',
            'Analyze', 'Evaluate', 'Consider', 'Examine', 'Review'
          ];
          
          for (const instruction of instructions) {
            const regex = new RegExp(`${instruction}[^.!?]*`, 'gi');
            const matches = optimizedPrompt.match(regex);
            
            if (matches && matches.length > 2) {
              // Mantener solo la primera ocurrencia
              for (let i = 1; i < matches.length; i++) {
                optimizedPrompt = optimizedPrompt.replace(matches[i], '');
              }
            }
          }
          
          return `const prompt = \`${optimizedPrompt}\``;
        }
      );
      
      return efficientCode;
    }
  
    /**
     * Mejora el tiempo de respuesta del agente
     */
    public improveResponseTime(code: string): string {
      let fasterCode = code;
      
      // Añadir caché para operaciones costosas
      if (!fasterCode.includes('private responseCache')) {
        fasterCode = fasterCode.replace(
          /export class (\w+) extends BaseAgent {/,
          `export class $1 extends BaseAgent {
    private responseCache: Map<string, { response: any, timestamp: number }> = new Map();
    private cacheTTL: number = 5 * 60 * 1000; // 5 minutos
  `
        );
      }
      
      // Añadir método de caché
      if (!fasterCode.includes('private getCachedResponse')) {
        fasterCode = fasterCode.replace(
          /constructor\([^)]*\) {[^}]+}/,
          (match) => {
            return `${match}
            
    /**
     * Obtiene una respuesta cacheada o ejecuta la función para obtenerla
     * @param cacheKey Clave para identificar la respuesta en caché
     * @param fetchFunction Función para obtener la respuesta si no está en caché
     * @returns La respuesta cacheada o recién obtenida
     */
    private async getCachedResponse<T>(cacheKey: string, fetchFunction: () => Promise<T>): Promise<T> {
            const cached = this.responseCache.get(cacheKey);
      
      // Verificar si hay una respuesta en caché válida
      if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
        this.log(`🔄 Usando respuesta en caché para: ${cacheKey}`);
        return cached.response;
      }
      
      // Si no hay caché o expiró, obtener la respuesta
      const response = await fetchFunction();
      
      // Guardar en caché
      this.responseCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      });
      
      return response;
    }`;
        }
      );
    }
    
    // Aplicar optimizaciones a métodos async
    fasterCode = fasterCode.replace(
      /async\s+(\w+)\s*\(\s*([^)]*)\s*\)\s*:\s*Promise<([^>]+)>\s*{(?!\s*return\s+this\.getCachedResponse)/g,
      (match, funcName, params, returnType) => {
        // Evitar aplicar a métodos que ya usan caché
        if (match.includes('getCachedResponse')) {
          return match;
        }
        
        // Generar una clave de caché basada en el nombre del método y parámetros
        const paramsList = params.split(',').map(p => p.trim().split(':')[0].trim()).filter(p => p);
        const cacheKeyParams = paramsList.length > 0 
          ? `${paramsList.join('_')}_${paramsList.map(p => `\${${p}}`).join('_')}` 
          : '';
        
        return `async ${funcName}(${params}): Promise<${returnType}> {
      // Optimizado para mejor tiempo de respuesta con caché
      const cacheKey = \`${funcName}${cacheKeyParams ? '_' + cacheKeyParams : ''}\`;
      
      return this.getCachedResponse(cacheKey, async () => {`;
      }
    );
    
    // Cerrar los métodos que se modificaron para usar caché
    fasterCode = fasterCode.replace(
      /}(\s*\/\/\s*fin de método async\s*)?$/g,
      (match) => {
        if (fasterCode.includes('return this.getCachedResponse(') && !fasterCode.includes('});')) {
          return `      });
    }`;
        }
        return match;
      }
    );
    
    return fasterCode;
  }

  /**
   * Mejora la experiencia del usuario en el código
   */
  public improveUserExperience(code: string): string {
    let enhancedCode = code;
    
    // Mejorar mensajes de error
    enhancedCode = enhancedCode.replace(
      /throw new Error\("([^"]+)"\)/g,
      'throw new Error(`🚫 $1. Por favor, verifica los parámetros e intenta nuevamente.`)'
    );
    
    // Mejorar mensajes de log
    enhancedCode = enhancedCode.replace(
      /this\.log\("([^"]+)"/g,
      'this.log(`✅ $1`'
    );
    
    // Añadir mensajes de progreso
    enhancedCode = enhancedCode.replace(
      /async\s+(\w+)\s*\(\s*([^)]*)\s*\)\s*:\s*Promise<([^>]+)>\s*{/g,
      (match, funcName, params, returnType) => {
        return `async ${funcName}(${params}): Promise<${returnType}> {
      this.log(\`🔄 Iniciando ${funcName}...\`);`;
      }
    );
    
    // Añadir mensajes de finalización
    enhancedCode = enhancedCode.replace(
      /return\s+([^;]+);(?!\s*}\s*\/\/\s*Fin)/g,
      (match, returnValue) => {
        // Evitar duplicar mensajes
        if (!match.includes('this.log(`✅')) {
          return `this.log(\`✅ Operación completada con éxito\`);
      return ${returnValue};`;
        }
        return match;
      }
    );
    
    return enhancedCode;
  }

  /**
   * Ejecuta un análisis periódico de todos los agentes
   */
  private async runPeriodicAnalysis(): Promise<void> {
    try {
      this.log(`🔄 Iniciando análisis periódico de agentes...`);
      
      // Obtener lista de agentes
      const agentNames = await this.getRegisteredAgents();
      
      // Analizar cada agente
      for (const agentName of agentNames) {
        // Verificar si el agente debe ser optimizado
        if (this.shouldOptimizeAgent(agentName)) {
          this.log(`🔍 El agente ${agentName} requiere optimización`);
          
          // Determinar objetivos de mejora
          const improvementGoals = this.determineImprovementGoals(agentName);
          
          // Obtener código del agente
          const agentCode = await this.getAgentCode(agentName);
          
          // Solicitar mejoras
          this.sendEvent(AgentEventType.SELF_IMPROVEMENT_REQUESTED, {
            agentCode,
            improvementGoals
          }, agentName);
        } else {
          this.log(`✅ El agente ${agentName} está funcionando correctamente`);
        }
      }
      
      this.log(`✅ Análisis periódico completado`);
    } catch (error) {
      this.log(`❌ Error en análisis periódico: ${error.message}`, 'error');
    }
  }

  /**
   * Obtiene la lista de agentes registrados
   */
  private async getRegisteredAgents(): Promise<string[]> {
    try {
      // Obtener lista de archivos en el directorio de agentes
      const files = fs.readdirSync(__dirname);
      
      // Filtrar archivos de agentes
      const agentFiles = files.filter(file => 
        file.endsWith('-agent.ts') || file.endsWith('-agent.js')
      );
      
      // Convertir nombres de archivo a nombres de agentes
      const agentNames = agentFiles.map(file => {
        // Eliminar extensión
        const baseName = file.replace(/\.(ts|js)$/, '');
        
        // Eliminar "-agent" y convertir a PascalCase
        return baseName
          .replace(/-agent$/, '')
          .split('-')
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join('') + 'Agent';
      });
      
      return agentNames;
    } catch (error) {
      this.log(`❌ Error al obtener agentes registrados: ${error.message}`, 'error');
      return [];
    }
  }

  /**
   * Genera un informe de optimización
   */
  private async generateOptimizationReport(
    agentName: string,
    appliedChanges: any[],
    metrics: any
  ): Promise<string> {
    // Crear informe en formato Markdown
    const report = `# Informe de Optimización: ${agentName}

## Resumen
- **Fecha:** ${new Date().toLocaleString()}
- **Agente:** ${agentName}
- **Cambios aplicados:** ${appliedChanges.length}
- **Métricas antes de la optimización:**
  - Tiempo de respuesta: ${metrics.before.avgResponseTime.toFixed(2)}ms
  - Uso de tokens: ${metrics.before.avgTokenUsage.toFixed(2)}
  - Tasa de éxito: ${(metrics.before.successRate * 100).toFixed(2)}%
  - Tasa de error: ${(metrics.before.errorRate * 100).toFixed(2)}%
  - Feedback del usuario: ${metrics.before.userFeedbackScore.toFixed(1)}/5

## Cambios Aplicados
${appliedChanges.map((change, index) => `
### Cambio ${index + 1}: ${change.type}
\`\`\`diff
${change.diff}
\`\`\`
**Justificación:** ${change.justification}
`).join('\n')}

## Impacto Esperado
- **Mejora en tiempo de respuesta:** ${((metrics.before.avgResponseTime - metrics.after.avgResponseTime) / metrics.before.avgResponseTime * 100).toFixed(2)}%
- **Reducción en uso de tokens:** ${((metrics.before.avgTokenUsage - metrics.after.avgTokenUsage) / metrics.before.avgTokenUsage * 100).toFixed(2)}%
- **Mejora en tasa de éxito:** ${((metrics.after.successRate - metrics.before.successRate) * 100).toFixed(2)} puntos porcentuales
- **Reducción en tasa de error:** ${((metrics.before.errorRate - metrics.after.errorRate) * 100).toFixed(2)} puntos porcentuales

## Recomendaciones Adicionales
${this.generateAdditionalRecommendations(agentName, metrics)}

---
*Generado por SelfImprovementAgent*
`;
    
    return report;
  }

  /**
   * Genera recomendaciones adicionales para un agente
   */
  private generateAdditionalRecommendations(agentName: string, metrics: any): string {
    const recommendations = [];
    
    // Recomendaciones basadas en métricas
    if (metrics.after.avgResponseTime > 1000) {
      recommendations.push('- Considerar implementar más optimizaciones de caché para reducir el tiempo de respuesta.');
    }
    
    if (metrics.after.avgTokenUsage > 2000) {
      recommendations.push('- Optimizar prompts para reducir el uso de tokens.');
    }
    
    if (metrics.after.errorRate > 0.05) {
      recommendations.push('- Implementar validaciones adicionales para reducir la tasa de error.');
    }
    
    if (metrics.after.userFeedbackScore < 4.5) {
      recommendations.push('- Mejorar la experiencia del usuario con mensajes más claros y respuestas más precisas.');
    }
    
    // Si no hay recomendaciones específicas
    if (recommendations.length === 0) {
      recommendations.push('- El agente está funcionando correctamente después de las optimizaciones. Continuar monitoreando su rendimiento.');
    }
    
    return recommendations.join('\n');
  }

  /**
   * Genera un diff entre dos versiones de código
   */
  private generateDiff(original: string, modified: string): string {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    
    let diff = '';
    
    // Implementación simple de diff
    let i = 0, j = 0;
    while (i < originalLines.length || j < modifiedLines.length) {
      if (i < originalLines.length && j < modifiedLines.length && originalLines[i] === modifiedLines[j]) {
        // Líneas iguales
        diff += `  ${originalLines[i]}\n`;
        i++;
        j++;
      } else {
        // Buscar próxima coincidencia
        let foundMatch = false;
        
        // Buscar en las próximas 5 líneas
        for (let k = 1; k <= 5; k++) {
          if (i + k < originalLines.length && j < modifiedLines.length && originalLines[i + k] === modifiedLines[j]) {
            // Encontró coincidencia en original
            for (let l = 0; l < k; l++) {
              diff += `- ${originalLines[i + l]}\n`;
            }
            i += k;
            foundMatch = true;
            break;
          } else if (i < originalLines.length && j + k < modifiedLines.length && originalLines[i] === modifiedLines[j + k]) {
            // Encontró coincidencia en modificado
            for (let l = 0; l < k; l++) {
              diff += `+ ${modifiedLines[j + l]}\n`;
            }
            j += k;
            foundMatch = true;
            break;
          }
        }
        
        if (!foundMatch) {
          // No encontró coincidencia, avanzar una línea
          if (i < originalLines.length) {
            diff += `- ${originalLines[i]}\n`;
            i++;
          }
          if (j < modifiedLines.length) {
            diff += `+ ${modifiedLines[j]}\n`;
            j++;
          }
        }
      }
    }
    
    return diff;
  }

  /**
   * Notifica al usuario sobre optimizaciones realizadas
   */
  private async notifyUserAboutOptimizations(
    agentName: string,
    appliedChanges: any[],
    report: string
  ): Promise<void> {
    try {
      // Guardar informe en archivo
      const reportPath = path.join(__dirname, '../reports', `${agentName.toLowerCase()}-optimization-report.md`);
      
      // Crear directorio si no existe
      const dir = path.dirname(reportPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Guardar informe
      fs.writeFileSync(reportPath, report, 'utf-8');
      
      // Notificar al usuario
      this.log(`✅ Optimización completada para ${agentName}: ${appliedChanges.length} cambios aplicados`);
      this.log(`📝 Informe guardado en: ${reportPath}`);
      
      // Enviar evento de notificación
      this.sendEvent(AgentEventType.NOTIFICATION, {
        title: `Optimización de ${agentName}`,
        message: `Se han aplicado ${appliedChanges.length} mejoras al agente ${agentName}. Ver informe para detalles.`,
        type: 'info',
        actions: [
          {
            label: 'Ver Informe',
            action: 'openFile',
            params: { path: reportPath }
          }
        ]
      });
    } catch (error) {
      this.log(`❌ Error al notificar optimizaciones: ${error.message}`, 'error');
    }
  }

  /**
   * Actualiza el código de un agente
   */
  private async updateAgentCode(agentName: string, newCode: string): Promise<boolean> {
    try {
      // Construir la ruta del archivo del agente
      const agentFileName = this.convertAgentNameToFileName(agentName);
      const agentFilePath = path.join(__dirname, agentFileName);
      
      // Verificar si el archivo existe
      if (!fs.existsSync(agentFilePath)) {
        throw new Error(`Archivo del agente no encontrado: ${agentFilePath}`);
      }
      
      // Hacer backup del código original
      const backupPath = path.join(__dirname, '../backups', `${agentFileName}.backup-${Date.now()}`);
      
      // Crear directorio de backups si no existe
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Guardar backup
      fs.copyFileSync(agentFilePath, backupPath);
      
      // Actualizar el archivo
      fs.writeFileSync(agentFilePath, newCode, 'utf-8');
      
      this.log(`✅ Código del agente ${agentName} actualizado. Backup guardado en: ${backupPath}`);
      return true;
    } catch (error) {
      this.log(`❌ Error al actualizar código del agente ${agentName}: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Revierte cambios en el código de un agente
   */
  private async revertAgentCode(agentName: string): Promise<boolean> {
    try {
      // Construir la ruta del archivo del agente
      const agentFileName = this.convertAgentNameToFileName(agentName);
      const agentFilePath = path.join(__dirname, agentFileName);
      
      // Buscar el backup más reciente
      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        throw new Error(`Directorio de backups no encontrado: ${backupDir}`);
      }
      
      // Obtener archivos de backup para este agente
      const backupFiles = fs.readdirSync(backupDir)
        .filter(file => file.startsWith(agentFileName))
        .sort()
        .reverse(); // Ordenar por nombre (que incluye timestamp) en orden descendente
      
      if (backupFiles.length === 0) {
        throw new Error(`No se encontraron backups para el agente ${agentName}`);
      }
      
      // Obtener el backup más reciente
      const latestBackup = path.join(backupDir, backupFiles[0]);
      
      // Restaurar desde el backup
      fs.copyFileSync(latestBackup, agentFilePath);
      
      this.log(`✅ Código del agente ${agentName} revertido a la versión: ${backupFiles[0]}`);
      return true;
    } catch (error) {
      this.log(`❌ Error al revertir código del agente ${agentName}: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Verifica si una optimización fue exitosa
   */
  private async verifyOptimization(agentName: string): Promise<boolean> {
    try {
      // Obtener métricas actuales
      const metrics = this.agentMetrics.get(agentName);
      if (!metrics) {
        return false;
      }
      
      // Verificar si hay errores recientes
      const recentErrors = await this.memoryService.getRecentErrors(agentName, 5);
      
      // Si hay errores después de la optimización, considerar fallida
      if (recentErrors.length > 0) {
        const lastOptimized = new Date(metrics.lastOptimized).getTime();
        
        for (const error of recentErrors) {
          const errorTime = new Date(error.timestamp).getTime();
          
          if (errorTime > lastOptimized) {
            this.log(`❌ Errores detectados después de la optimización de ${agentName}`);
            return false;
          }
        }
      }
      
      return true;
    } catch (error) {
      this.log(`❌ Error al verificar optimización: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Genera un informe de rendimiento del sistema
   */
  public async generateSystemPerformanceReport(): Promise<string> {
    try {
      this.log(`🔄 Generando informe de rendimiento del sistema...`);
      
      // Obtener lista de agentes
      const agentNames = await this.getRegisteredAgents();
      
      // Recopilar métricas de todos los agentes
      const agentMetrics = [];
      
      for (const agentName of agentNames) {
        const metrics = this.agentMetrics.get(agentName);
        
        if (metrics) {
          // Calcular métricas promedio
          const avgResponseTime = metrics.responseTime.length > 0
            ? metrics.responseTime.reduce((sum, time) => sum + time, 0) / metrics.responseTime.length
            : 0;
          
          const avgTokenUsage = metrics.tokenUsage.length > 0
            ? metrics.tokenUsage.reduce((sum, tokens) => sum + tokens, 0) / metrics.tokenUsage.length
            : 0;
          
          agentMetrics.push({
            agentName,
            avgResponseTime,
            avgTokenUsage,
            successRate: metrics.successRate,
            errorRate: metrics.errorRate,
            userFeedbackScore: metrics.userFeedbackScore,
            lastOptimized: metrics.lastOptimized,
            optimizationCount: metrics.optimizationHistory.length
          });
        }
      }
      
      // Ordenar agentes por tasa de error (descendente)
      agentMetrics.sort((a, b) => b.errorRate - a.errorRate);
      
      // Crear informe en formato Markdown
      const report = `# Informe de Rendimiento del Sistema

## Resumen
- **Fecha:** ${new Date().toLocaleString()}
- **Agentes analizados:** ${agentMetrics.length}
- **Agentes optimizados:** ${agentMetrics.filter(m => m.optimizationCount > 0).length}

## Métricas por Agente

| Agente | Tiempo Resp. | Uso Tokens | Tasa Éxito | Tasa Error | Feedback | Última Optimización |
|--------|--------------|------------|------------|------------|----------|---------------------|
${agentMetrics.map(m => `| ${m.agentName} | ${m.avgResponseTime.toFixed(2)}ms | ${m.avgTokenUsage.toFixed(2)} | ${(m.successRate * 100).toFixed(2)}% | ${(m.errorRate * 100).toFixed(2)}% | ${m.userFeedbackScore.toFixed(1)}/5 | ${m.lastOptimized ? new Date(m.lastOptimized).toLocaleString() : 'Nunca'} |`).join('\n')}

## Agentes que Requieren Atención

${agentMetrics.filter(m => m.errorRate > 0.1 || m.successRate < 0.8 || m.userFeedbackScore < 3.5)
  .map(m => `### ${m.agentName}
- **Tasa de error:** ${(m.errorRate * 100).toFixed(2)}%
- **Tasa de éxito:** ${(m.successRate * 100).toFixed(2)}%
- **Feedback del usuario:** ${m.userFeedbackScore.toFixed(1)}/5
- **Recomendación:** ${this.getAgentRecommendation(m)}
`).join('\n')}

## Tendencias del Sistema

${this.generateSystemTrends(agentMetrics)}

---
*Generado por SelfImprovementAgent*
`;
      
      // Guardar informe en archivo
      const reportPath = path.join(__dirname, '../reports', `system-performance-report.md`);
      
      // Crear directorio si no existe
      const dir = path.dirname(reportPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Guardar informe
      fs.writeFileSync(reportPath, report, 'utf-8');
      
      this.log(`✅ Informe de rendimiento del sistema generado: ${reportPath}`);
      
      return reportPath;
    } catch (error) {
      this.log(`❌ Error al generar informe de rendimiento: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Obtiene una recomendación para un agente
   */
  private getAgentRecommendation(metrics: any): string {
    if (metrics.errorRate > 0.2) {
      return 'Optimización urgente para reducir errores';
    } else if (metrics.successRate < 0.7) {
      return 'Mejorar la lógica de procesamiento para aumentar tasa de éxito';
    } else if (metrics.userFeedbackScore < 3) {
      return 'Mejorar la experiencia del usuario y claridad de respuestas';
    } else if (metrics.avgResponseTime > 2000) {
      return 'Optimizar tiempo de respuesta implementando caché';
    } else if (metrics.avgTokenUsage > 3000) {
      return 'Reducir uso de tokens optimizando prompts';
    } else if (!metrics.lastOptimized) {
      return 'Realizar primera optimización para establecer línea base';
    } else {
      return 'Monitorear rendimiento y optimizar si los indicadores empeoran';
    }
  }

  /**
   * Genera tendencias del sistema
   */
  private generateSystemTrends(agentMetrics: any[]): string {
    // Calcular métricas promedio del sistema
    const avgResponseTime = agentMetrics.reduce((sum, m) => sum + m.avgResponseTime, 0) / agentMetrics.length;
    const avgTokenUsage = agentMetrics.reduce((sum, m) => sum + m.avgTokenUsage, 0) / agentMetrics.length;
    const avgSuccessRate = agentMetrics.reduce((sum, m) => sum + m.successRate, 0) / agentMetrics.length;
    const avgErrorRate = agentMetrics.reduce((sum, m) => sum + m.errorRate, 0) / agentMetrics.length;
    const avgFeedbackScore = agentMetrics.reduce((sum, m) => sum + m.userFeedbackScore, 0) / agentMetrics.length;
    
    return `### Métricas Promedio del Sistema
- **Tiempo de respuesta promedio:** ${avgResponseTime.toFixed(2)}ms
- **Uso de tokens promedio:** ${avgTokenUsage.toFixed(2)}
- **Tasa de éxito promedio:** ${(avgSuccessRate * 100).toFixed(2)}%
- **Tasa de error promedio:** ${(avgErrorRate * 100).toFixed(2)}%
- **Feedback del usuario promedio:** ${avgFeedbackScore.toFixed(1)}/5

### Análisis de Tendencias
${this.generateTrendAnalysis(agentMetrics)}`;
  }

  /**
   * Genera análisis de tendencias
   */
  private generateTrendAnalysis(agentMetrics: any[]): string {
    const trends = [];
    
    // Analizar tendencias de error
    const highErrorAgents = agentMetrics.filter(m => m.errorRate > 0.1).length;
    if (highErrorAgents > 0) {
      trends.push(`- **${highErrorAgents} agentes** tienen tasas de error superiores al 10%, lo que indica posibles problemas de estabilidad.`);
    }
    
    // Analizar tendencias de rendimiento
    const slowAgents = agentMetrics.filter(m => m.avgResponseTime > 1500).length;
    if (slowAgents > 0) {
      trends.push(`- **${slowAgents} agentes** tienen tiempos de respuesta superiores a 1500ms, lo que puede afectar la experiencia del usuario.`);
    }
    
    // Analizar tendencias de optimización
    const neverOptimized = agentMetrics.filter(m => !m.lastOptimized).length;
    if (neverOptimized > 0) {
      trends.push(`- **${neverOptimized} agentes** nunca han sido optimizados, lo que representa una oportunidad de mejora.`);
    }
    
    // Analizar tendencias de feedback
    const lowFeedbackAgents = agentMetrics.filter(m => m.userFeedbackScore < 4).length;
    if (lowFeedbackAgents > 0) {
      trends.push(`- **${lowFeedbackAgents} agentes** tienen puntuaciones de feedback por debajo de 4/5, lo que indica áreas de mejora en la experiencia del usuario.`);
    }
    
    // Si no hay tendencias específicas
    if (trends.length === 0) {
      trends.push('- El sistema está funcionando correctamente en general, sin tendencias negativas significativas.');
    }
    
    return trends.join('\n');
  }
}

export default SelfImprovementAgent;