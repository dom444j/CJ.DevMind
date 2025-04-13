import { BaseAgent, AgentEventType } from './base-agent';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface ReviewResult {
  issues: ReviewIssue[];
  suggestions: ReviewSuggestion[];
  isApproved: boolean;
  score: number;
  summary: string;
}

interface ReviewIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  line?: number;
  column?: number;
  code?: string;
  recommendation: string;
}

interface ReviewSuggestion {
  type: 'performance' | 'security' | 'accessibility' | 'maintainability' | 'style';
  description: string;
  line?: number;
  column?: number;
  code?: string;
  suggestedCode?: string;
  benefit: string;
}

interface CodeReviewOptions {
  strictMode?: boolean;
  checkAccessibility?: boolean;
  checkSecurity?: boolean;
  checkPerformance?: boolean;
  ignorePatterns?: string[];
  customRules?: any[];
}

export class CodeReviewAgent extends BaseAgent {
  private reviewHistory: Map<string, ReviewResult[]>;
  private defaultOptions: CodeReviewOptions;
  private securityPatterns: RegExp[];
  private accessibilityPatterns: RegExp[];
  private performancePatterns: RegExp[];
  private styleGuides: Map<string, any>;
  private lastReviewTimestamp: Map<string, number>;

  constructor() {
    super('Code Review Agent');
    this.reviewHistory = new Map<string, ReviewResult[]>();
    this.lastReviewTimestamp = new Map<string, number>();
    this.defaultOptions = {
      strictMode: false,
      checkAccessibility: true,
      checkSecurity: true,
      checkPerformance: true,
      ignorePatterns: ['node_modules', 'dist', 'build', '.git'],
      customRules: []
    };
    
    // Patrones de seguridad comunes
    this.securityPatterns = [
      /eval\s*\(/g,
      /document\.write\s*\(/g,
      /innerHTML\s*=/g,
      /localStorage\s*\./g,
      /sessionStorage\s*\./g,
      /password\s*=\s*["'][\w\d]+["']/g,
      /api[kK]ey\s*=\s*["'][\w\d]+["']/g,
      /secret\s*=\s*["'][\w\d]+["']/g
    ];
    
    // Patrones de accesibilidad
    this.accessibilityPatterns = [
      /<img\s+(?![^>]*alt=)[^>]*>/g,
      /<button\s+(?![^>]*aria-)[^>]*>/g,
      /<div\s+(?:[^>]*role=["']button["'][^>]*(?!aria-pressed)|[^>]*onclick[^>]*(?!role=))[^>]*>/g,
      /<a\s+(?![^>]*href=)[^>]*>/g
    ];
    
    // Patrones de rendimiento
    this.performancePatterns = [
      /setTimeout\s*\(\s*function\s*\(\)\s*{\s*for\s*\(/g,
      /\.map\s*\(.*\.filter\s*\(/g,
      /new\s+Array\s*\(\s*\d+\s*\)/g,
      /document\.querySelectorAll\s*\([^)]+\)/g
    ];
    
    // Guías de estilo por lenguaje
    this.styleGuides = new Map<string, any>();
    this.initializeStyleGuides();
    
    this.registerEventHandlers();
  }

  private initializeStyleGuides(): void {
    // JavaScript/TypeScript
    this.styleGuides.set('js', {
      indentation: 2,
      maxLineLength: 100,
      preferConst: true,
      noVar: true,
      semicolons: true,
      quotes: 'single',
      trailingComma: true
    });
    
    // React
    this.styleGuides.set('jsx', {
      componentNaming: 'PascalCase',
      propsNaming: 'camelCase',
      stateNaming: 'camelCase',
      requirePropTypes: true,
      maxPropsPerLine: 3,
      destructureProps: true
    });
    
    // CSS/SCSS
    this.styleGuides.set('css', {
      indentation: 2,
      classCasing: 'kebab-case',
      colorFormat: 'hex',
      propertyOrder: ['display', 'position', 'top', 'right', 'bottom', 'left', 'width', 'height']
    });
    
    // HTML
    this.styleGuides.set('html', {
      indentation: 2,
      selfClosingTags: true,
      quoteStyle: 'double',
      attributeOrder: ['id', 'class', 'name', 'data-*', 'src', 'href']
    });
    
    // Python
    this.styleGuides.set('py', {
      indentation: 4,
      maxLineLength: 79,
      docstringStyle: 'google',
      importOrder: ['standard', 'third-party', 'first-party', 'local']
    });
  }

  private registerEventHandlers(): void {
    // Escuchar solicitudes de revisión de código
    this.listenForEvent(AgentEventType.CODE_REVIEW_REQUESTED, async (message) => {
      this.log(`🔍 Solicitud de revisión de código recibida de ${message.from}`);
      try {
        const options = message.content.options || this.defaultOptions;
        const reviewResult = await this.reviewCode(
          message.content.code, 
          message.content.filePath,
          options
        );
        
        // Guardar en historial
        this.saveReviewToHistory(message.content.filePath, reviewResult);
        
        // Enviar resultado
        this.sendEvent(AgentEventType.CODE_REVIEW_COMPLETED, {
          reviewResult,
          timestamp: new Date().toISOString(),
          filePath: message.content.filePath
        }, message.from);
        
        // Si hay problemas críticos, notificar al SecurityAgent
        if (reviewResult.issues.some(issue => issue.severity === 'critical')) {
          this.sendEvent(AgentEventType.SECURITY_ALERT, {
            source: 'CodeReviewAgent',
            issues: reviewResult.issues.filter(issue => issue.severity === 'critical'),
            filePath: message.content.filePath,
            timestamp: new Date().toISOString()
          }, 'SecurityAgent');
        }
        
        // Si hay sugerencias de rendimiento, notificar al PerformanceAgent
        if (reviewResult.suggestions.some(suggestion => suggestion.type === 'performance')) {
          this.sendEvent(AgentEventType.PERFORMANCE_OPTIMIZATION_SUGGESTED, {
            source: 'CodeReviewAgent',
            suggestions: reviewResult.suggestions.filter(suggestion => suggestion.type === 'performance'),
            filePath: message.content.filePath,
            timestamp: new Date().toISOString()
          }, 'PerformanceAgent');
        }
      } catch (error) {
        this.log(`❌ Error en revisión de código: ${error.message}`, 'error');
        this.sendEvent(AgentEventType.CODE_REVIEW_ERROR, {
          error: error.message,
          timestamp: new Date().toISOString(),
          filePath: message.content.filePath
        }, message.from);
      }
    });
    
    // Escuchar solicitudes de historial de revisiones
    this.listenForEvent(AgentEventType.CODE_REVIEW_HISTORY_REQUESTED, (message) => {
      this.log(`📊 Solicitud de historial de revisiones para ${message.content.filePath}`);
      const filePath = message.content.filePath;
      const history = this.reviewHistory.get(filePath) || [];
      
      this.sendEvent(AgentEventType.CODE_REVIEW_HISTORY_PROVIDED, {
        filePath,
        history,
        timestamp: new Date().toISOString()
      }, message.from);
    });
    
    // Escuchar solicitudes de comparación de revisiones
    this.listenForEvent(AgentEventType.CODE_REVIEW_COMPARISON_REQUESTED, async (message) => {
      this.log(`🔄 Solicitud de comparación de revisiones para ${message.content.filePath}`);
      const filePath = message.content.filePath;
      const history = this.reviewHistory.get(filePath) || [];
      
      if (history.length < 2) {
        this.sendEvent(AgentEventType.CODE_REVIEW_ERROR, {
          error: "No hay suficientes revisiones para comparar",
          timestamp: new Date().toISOString(),
          filePath
        }, message.from);
        return;
      }
      
      const comparison = this.compareReviews(
        history[history.length - 2], 
        history[history.length - 1]
      );
      
      this.sendEvent(AgentEventType.CODE_REVIEW_COMPARISON_PROVIDED, {
        filePath,
        comparison,
        timestamp: new Date().toISOString()
      }, message.from);
    });
  }

  async reviewCode(
    code: string, 
    filePath: string, 
    options: CodeReviewOptions = this.defaultOptions
  ): Promise<ReviewResult> {
    this.log(`🔍 Revisando código en: ${filePath}`);
    
    // Verificar si el archivo existe
    if (filePath && !code && fs.existsSync(filePath)) {
      code = fs.readFileSync(filePath, 'utf-8');
    }
    
    if (!code) {
      throw new Error(`No se pudo obtener el código para revisar en ${filePath}`);
    }
    
    const issues: ReviewIssue[] = [];
    const suggestions: ReviewSuggestion[] = [];
    
    // Determinar el tipo de archivo
    const fileExtension = path.extname(filePath).toLowerCase().substring(1);
    const fileType = this.getFileType(fileExtension);
    
    // Aplicar reglas específicas según el tipo de archivo
    await this.applyLanguageSpecificRules(code, fileType, issues, suggestions);
    
    // Verificar patrones de seguridad si está habilitado
    if (options.checkSecurity) {
      this.checkSecurityIssues(code, issues);
    }
    
    // Verificar patrones de accesibilidad si está habilitado
    if (options.checkAccessibility) {
      this.checkAccessibilityIssues(code, fileType, issues, suggestions);
    }
    
    // Verificar patrones de rendimiento si está habilitado
    if (options.checkPerformance) {
      this.checkPerformanceIssues(code, fileType, issues, suggestions);
    }
    
    // Aplicar reglas de estilo según el tipo de archivo
    this.applyStyleGuides(code, fileType, issues, suggestions);
    
    // Aplicar reglas personalizadas si existen
    if (options.customRules && options.customRules.length > 0) {
      this.applyCustomRules(code, options.customRules, issues, suggestions);
    }
    
    // Calcular puntuación de la revisión (0-100)
    const score = this.calculateReviewScore(issues, suggestions);
    
    // Determinar si el código es aprobado
    // En modo estricto, cualquier problema crítico o de alta severidad rechaza el código
    const isApproved = options.strictMode 
      ? !issues.some(issue => ['critical', 'high'].includes(issue.severity))
      : !issues.some(issue => issue.severity === 'critical');
    
    // Generar resumen
    const summary = this.generateReviewSummary(issues, suggestions, score, isApproved);
    
    this.log(`🔍 Revisión completada: ${isApproved ? 'Aprobado' : 'Problemas encontrados'} - Puntuación: ${score}/100`);
    
    return { 
      issues, 
      suggestions, 
      isApproved, 
      score,
      summary
    };
  }

  private getFileType(extension: string): string {
    const jsExtensions = ['js', 'jsx', 'ts', 'tsx'];
    const cssExtensions = ['css', 'scss', 'sass', 'less'];
    const htmlExtensions = ['html', 'htm', 'xhtml'];
    const pythonExtensions = ['py', 'pyw'];
    
    if (jsExtensions.includes(extension)) {
      return extension === 'jsx' || extension === 'tsx' ? 'jsx' : 'js';
    } else if (cssExtensions.includes(extension)) {
      return 'css';
    } else if (htmlExtensions.includes(extension)) {
      return 'html';
    } else if (pythonExtensions.includes(extension)) {
      return 'py';
    }
    
    return extension;
  }

  private async applyLanguageSpecificRules(
    code: string, 
    fileType: string, 
    issues: ReviewIssue[], 
    suggestions: ReviewSuggestion[]
  ): Promise<void> {
    // JavaScript/TypeScript específico
    if (fileType === 'js' || fileType === 'jsx') {
      // Verificar uso de 'any' en TypeScript
      if (code.includes('any')) {
        issues.push({
          severity: 'medium',
          description: 'Uso de tipo "any" detectado',
          recommendation: 'Utiliza tipos más específicos para mejorar la seguridad de tipos'
        });
      }
      
      // Verificar uso de var
      if (/\bvar\s+/.test(code)) {
        issues.push({
          severity: 'low',
          description: 'Uso de "var" detectado',
          recommendation: 'Utiliza "const" para variables que no cambian o "let" para variables que sí cambian'
        });
      }
      
      // Verificar console.log en producción
      if (/console\.log\s*\(/.test(code)) {
        suggestions.push({
          type: 'maintainability',
          description: 'Uso de console.log detectado',
          benefit: 'Elimina los console.log en código de producción para evitar fugas de información'
        });
      }
      
      // Verificar componentes React sin memo
      if (fileType === 'jsx' && /function\s+\w+\s*\(\s*props\s*\)/.test(code) && !code.includes('React.memo')) {
        suggestions.push({
          type: 'performance',
          description: 'Componente funcional sin React.memo',
          benefit: 'Utiliza React.memo para evitar renderizados innecesarios en componentes funcionales'
        });
      }
      
      // Verificar props en React
      if (fileType === 'jsx' && code.includes('Props') && !code.includes('interface')) {
        issues.push({
          severity: 'medium',
          description: 'Falta definición de interfaz para las props del componente',
          recommendation: 'Define una interfaz para las props para mejorar la seguridad de tipos'
        });
      }
      
      // Verificar useCallback en manejadores de eventos
      if (fileType === 'jsx' && code.includes('onClick') && !code.includes('useCallback')) {
        suggestions.push({
          type: 'performance',
          description: 'Manejador de eventos sin useCallback',
          benefit: 'Utiliza useCallback para evitar recrear funciones en cada renderizado'
        });
      }
    }
    
    // HTML específico
    if (fileType === 'html') {
      // Verificar doctype
      if (!code.includes('<!DOCTYPE html>')) {
        issues.push({
          severity: 'medium',
          description: 'Falta declaración DOCTYPE',
          recommendation: 'Añade <!DOCTYPE html> al inicio del documento'
        });
      }
      
      // Verificar charset
      if (!code.includes('<meta charset="')) {
        issues.push({
          severity: 'low',
          description: 'Falta declaración de charset',
          recommendation: 'Añade <meta charset="UTF-8"> en la sección head'
        });
      }
      
      // Verificar viewport
      if (!code.includes('<meta name="viewport"')) {
        suggestions.push({
          type: 'maintainability',
          description: 'Falta meta tag de viewport',
          benefit: 'Añade <meta name="viewport" content="width=device-width, initial-scale=1.0"> para mejorar la responsividad'
        });
      }
    }
    
    // CSS específico
    if (fileType === 'css') {
      // Verificar !important
      if (code.includes('!important')) {
        issues.push({
          severity: 'low',
          description: 'Uso de !important detectado',
          recommendation: 'Evita usar !important, mejora la especificidad de tus selectores'
        });
      }
      
      // Verificar unidades absolutas
      if (/\b\d+px\b/.test(code)) {
        suggestions.push({
          type: 'maintainability',
          description: 'Uso de unidades absolutas (px)',
          benefit: 'Considera usar unidades relativas (rem, em, %) para mejorar la accesibilidad y responsividad'
        });
      }
      
      // Verificar vendor prefixes
      if (/-webkit-|-moz-|-ms-|-o-/.test(code)) {
        suggestions.push({
          type: 'maintainability',
          description: 'Uso manual de vendor prefixes',
          benefit: 'Considera usar autoprefixer o PostCSS para gestionar automáticamente los vendor prefixes'
        });
      }
    }
    
    // Python específico
    if (fileType === 'py') {
      // Verificar imports
      if (code.includes('import *')) {
        issues.push({
          severity: 'medium',
          description: 'Uso de import * detectado',
          recommendation: 'Importa solo los módulos necesarios para evitar conflictos de nombres'
        });
      }
      
      // Verificar docstrings
      if (!/"""\s*[\s\S]*?\s*"""/.test(code) && /def\s+\w+\s*\(/.test(code)) {
        suggestions.push({
          type: 'maintainability',
          description: 'Funciones sin docstrings',
          benefit: 'Añade docstrings a tus funciones para mejorar la documentación'
        });
      }
    }
  }

  private checkSecurityIssues(code: string, issues: ReviewIssue[]): void {
    // Verificar patrones de seguridad
    for (const pattern of this.securityPatterns) {
      const matches = code.match(pattern);
      if (matches) {
        issues.push({
          severity: 'critical',
          description: `Posible problema de seguridad: ${pattern.toString().replace(/\/g$/, '')}`,
          recommendation: 'Revisa este código para evitar vulnerabilidades de seguridad'
        });
      }
    }
    
    // Verificar inyección SQL
    if (/SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\s*\+\s*['"]/.test(code)) {
      issues.push({
        severity: 'critical',
        description: 'Posible vulnerabilidad de inyección SQL',
        recommendation: 'Utiliza consultas parametrizadas o ORM para prevenir inyección SQL'
      });
    }
    
    // Verificar XSS
    if (/innerHTML\s*=|document\.write\s*\(/.test(code)) {
      issues.push({
        severity: 'high',
        description: 'Posible vulnerabilidad XSS',
        recommendation: 'Utiliza textContent en lugar de innerHTML o sanitiza el HTML antes de insertarlo'
      });
    }
    
    // Verificar CSRF
    if (/fetch\s*\(\s*['"][^'"]+['"]\s*,\s*{\s*method\s*:\s*['"]POST['"]/.test(code) && !code.includes('X-CSRF-Token')) {
      issues.push({
        severity: 'high',
        description: 'Posible vulnerabilidad CSRF en petición POST',
        recommendation: 'Incluye tokens CSRF en tus peticiones POST'
      });
    }
  }

  private checkAccessibilityIssues(
    code: string, 
    fileType: string, 
    issues: ReviewIssue[], 
    suggestions: ReviewSuggestion[]
  ): void {
    // Solo aplicar a HTML y JSX
    if (fileType !== 'html' && fileType !== 'jsx') {
      return;
    }
    
    // Verificar atributos ARIA
    if (!code.includes('aria-')) {
      suggestions.push({
        type: 'accessibility',
        description: 'No se detectaron atributos ARIA',
        benefit: 'Añade atributos ARIA para mejorar la accesibilidad'
      });
    }
    
    // Verificar alt en imágenes
    if (/<img\s+(?![^>]*alt=)[^>]*>/g.test(code)) {
      issues.push({
        severity: 'high',
        description: 'Imágenes sin atributo alt',
        recommendation: 'Añade atributos alt descriptivos a todas las imágenes'
      });
    }
    
    // Verificar contraste de colores (simplificado)
    if (/#[0-9a-f]{3,6}\s*[,;]/gi.test(code)) {
      suggestions.push({
        type: 'accessibility',
        description: 'Verifica el contraste de colores',
        benefit: 'Asegúrate de que el contraste entre texto y fondo cumple con WCAG 2.1 AA (4.5:1 para texto normal, 3:1 para texto grande)'
      });
    }
    
    // Verificar tabindex
    if (/tabindex\s*=\s*["']-1["']/g.test(code)) {
      suggestions.push({
        type: 'accessibility',
        description: 'Uso de tabindex="-1"',
        benefit: 'Revisa el uso de tabindex="-1" para asegurarte de que no excluye elementos importantes de la navegación por teclado'
      });
    }
    
    // Verificar etiquetas de formulario
    if (/<input\s+[^>]*>/g.test(code) && !/<label\s+[^>]*>/g.test(code)) {
      issues.push({
        severity: 'medium',
        description: 'Posibles inputs sin etiquetas asociadas',
        recommendation: 'Asocia cada input con una etiqueta label usando el atributo for'
      });
    }
  }

  private checkPerformanceIssues(
    code: string, 
    fileType: string, 
    issues: ReviewIssue[], 
    suggestions: ReviewSuggestion[]
  ): void {
    // Verificar patrones de rendimiento generales
    for (const pattern of this.performancePatterns) {
      const matches = code.match(pattern);
      if (matches) {
        suggestions.push({
          type: 'performance',
          description: `Posible problema de rendimiento: ${pattern.toString().replace(/\/g$/, '')}`,
          benefit: 'Optimiza este código para mejorar el rendimiento'
        });
      }
    }
    
    // JavaScript/React específico
    if (fileType === 'js' || fileType === 'jsx') {
      // Verificar múltiples re-renderizados en React
      if (fileType === 'jsx' && code.includes('useState') && /setInterval\s*\(\s*\(\)\s*=>\s*set\w+\s*\(/.test(code)) {
        issues.push({
          severity: 'medium',
          description: 'Posibles re-renderizados frecuentes con setInterval y useState',
          recommendation: 'Usa useRef para almacenar valores que no necesitan causar re-renderizados'
        });
      }
      
      // Verificar listas sin key en React
      if (fileType === 'jsx' && /\.map\s*\(\s*\([^)]*\)\s*=>\s*</.test(code) && !code.includes('key={')) {
        issues.push({
          severity: 'medium',
          description: 'Posibles elementos de lista sin prop key',
          recommendation: 'Añade una prop key única a cada elemento en listas renderizadas con map()'
        });
      }
      
      // Verificar event listeners sin cleanup
      if (code.includes('addEventListener') && !code.includes('removeEventListener')) {
        suggestions.push({
          type: 'performance',
          description: 'Event listeners sin cleanup',
          benefit: 'Asegúrate de eliminar los event listeners para evitar memory leaks'
        });
      }
    }
    
    // CSS específico
    if (fileType === 'css') {
      // Verificar selectores universales
      if (/\*\s*{/.test(code)) {
        suggestions.push({
          type: 'performance',
          description: 'Uso de selector universal (*)',
          benefit: 'Evita usar el selector universal (*) ya que puede afectar el rendimiento'
        });
      }
      
      // Verificar selectores anidados profundos
      const deepNesting = code.match(/[^{]*{[^{]*{[^{]*{[^{]*{[^{]*{/);
      if (deepNesting) {
        suggestions.push({
          type: 'performance',
          description: 'Selectores CSS anidados profundamente',
          benefit: 'Reduce la profundidad de anidación de selectores CSS para mejorar el rendimiento'
        });
      }
    }
  }

  private applyStyleGuides(
    code: string, 
    fileType: string, 
    issues: ReviewIssue[], 
    suggestions: ReviewSuggestion[]
  ): void {
    const styleGuide = this.styleGuides.get(fileType);
    if (!styleGuide) {
      return;
    }
    
    // JavaScript/TypeScript
    if (fileType === 'js' || fileType === 'jsx') {
      // Verificar uso de punto y coma
      if (styleGuide.semicolons && !/;\s*$/.test(code.split('\n').filter(line => !line.trim().startsWith('//') && line.trim().length > 0).join(''))) {
        suggestions.push({
          type: 'style',
          description: 'Falta de punto y coma al final de las sentencias',
          benefit: 'Añade punto y coma al final de las sentencias para mantener consistencia'
        });
      }
      
      // Verificar estilo de comillas
      const quoteStyle = styleGuide.quotes === 'single' ? "'" : '"';
      const oppositeQuoteStyle = styleGuide.quotes === 'single' ? '"' : "'";
      if (code.includes(oppositeQuoteStyle)) {
        suggestions.push({
          type: 'style',
          description: `Uso inconsistente de comillas (se prefiere ${quoteStyle})`,
          benefit: 'Mantén un estilo de comillas consistente en todo el código'
        });
      }
      
      // Verificar longitud de línea
      const lines = code.split('\n');
      const longLines = lines.filter(line => line.length > styleGuide.maxLineLength);
      if (longLines.length > 0) {
        suggestions.push({
          type: 'style',
          description: `Líneas que exceden la longitud máxima recomendada (${styleGuide.maxLineLength} caracteres)`,
          benefit: 'Mantén las líneas por debajo de la longitud máxima para mejorar la legibilidad'
        });
      }
    }
    
    // React específico
    if (fileType === 'jsx') {
      // Verificar nomenclatura de componentes
      if (!/^[A-Z]/.test(path.basename(fileType, path.extname(fileType)))) {
        issues.push({
          severity: 'low',
          description: 'Nombre de archivo de componente no comienza con mayúscula',
          recommendation: 'Usa PascalCase para nombres de componentes React'
        });
      }
      
      // Verificar destructuring de props
      if (code.includes('props.') && styleGuide.destructureProps) {
        suggestions.push({
          type: 'style',
          description: 'Props no destructuradas',
          benefit: 'Usa destructuring para las props para mejorar la legibilidad'
        });
      }
    }
  }

  private applyCustomRules(
    code: string, 
    customRules: any[], 
    issues: ReviewIssue[], 
    suggestions: ReviewSuggestion[]
  ): void {
    for (const rule of customRules) {
      try {
        const pattern = new RegExp(rule.pattern, 'g');
        const matches = code.match(pattern);
        
        if (matches) {
          if (rule.severity) {
            issues.push({
              severity: rule.severity,
              description: rule.description,
              recommendation: rule.recommendation
            });
          } else {
            suggestions.push({
              type: rule.type || 'maintainability',
              description: rule.description,
              benefit: rule.benefit
            });
          }
        }
      } catch (error) {
        this.log(`❌ Error al aplicar regla personalizada: ${error.message}`, 'error');
      }
    }
  }

  private calculateReviewScore(issues: ReviewIssue[], suggestions: ReviewSuggestion[]): number {
    // Puntuación base
    let score = 100;
    
    // Restar puntos por problemas
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    }
    
    // Restar puntos por sugerencias (menos impacto)
    score -= suggestions.length * 1;
    
    // Asegurar que la puntuación esté entre 0 y 100
    return Math.max(0, Math.min(100, score));
  }

  private generateReviewSummary(
    issues: ReviewIssue[],
    suggestions: ReviewSuggestion[],
    score: number,
    isApproved: boolean
  ): string {
    // Contar problemas por severidad
    const criticalCount = issues.filter(issue => issue.severity === 'critical').length;
    const highCount = issues.filter(issue => issue.severity === 'high').length;
    const mediumCount = issues.filter(issue => issue.severity === 'medium').length;
    const lowCount = issues.filter(issue => issue.severity === 'low').length;
    
    // Contar sugerencias por tipo
    const performanceCount = suggestions.filter(s => s.type === 'performance').length;
    const securityCount = suggestions.filter(s => s.type === 'security').length;
    const accessibilityCount = suggestions.filter(s => s.type === 'accessibility').length;
    const maintainabilityCount = suggestions.filter(s => s.type === 'maintainability').length;
    const styleCount = suggestions.filter(s => s.type === 'style').length;
    
    // Generar resumen
    let summary = `# Resumen de Revisión de Código\n\n`;
    summary += `## Estado: ${isApproved ? '✅ APROBADO' : '❌ RECHAZADO'}\n\n`;
    summary += `## Puntuación: ${score}/100\n\n`;
    
    summary += `## Problemas Encontrados (${issues.length})\n`;
    if (issues.length > 0) {
      summary += `- Críticos: ${criticalCount}\n`;
      summary += `- Altos: ${highCount}\n`;
      summary += `- Medios: ${mediumCount}\n`;
      summary += `- Bajos: ${lowCount}\n\n`;
      
      // Detallar problemas críticos y altos
      if (criticalCount > 0 || highCount > 0) {
        summary += `### Problemas Críticos y Altos\n`;
        issues
          .filter(issue => ['critical', 'high'].includes(issue.severity))
          .forEach(issue => {
            summary += `- **${issue.severity.toUpperCase()}**: ${issue.description}\n`;
            summary += `  - Recomendación: ${issue.recommendation}\n`;
          });
        summary += `\n`;
      }
    } else {
      summary += `- No se encontraron problemas. ¡Excelente trabajo!\n\n`;
    }
    
    summary += `## Sugerencias de Mejora (${suggestions.length})\n`;
    if (suggestions.length > 0) {
      summary += `- Rendimiento: ${performanceCount}\n`;
      summary += `- Seguridad: ${securityCount}\n`;
      summary += `- Accesibilidad: ${accessibilityCount}\n`;
      summary += `- Mantenibilidad: ${maintainabilityCount}\n`;
      summary += `- Estilo: ${styleCount}\n\n`;
      
      // Detallar algunas sugerencias importantes
      if (suggestions.length > 0) {
        summary += `### Sugerencias Destacadas\n`;
        suggestions
          .slice(0, 5) // Mostrar solo las 5 primeras sugerencias
          .forEach(suggestion => {
            summary += `- **${suggestion.type.toUpperCase()}**: ${suggestion.description}\n`;
            summary += `  - Beneficio: ${suggestion.benefit}\n`;
          });
        
        if (suggestions.length > 5) {
          summary += `\n*Y ${suggestions.length - 5} sugerencias más...*\n`;
        }
      }
    } else {
      summary += `- No hay sugerencias adicionales.\n\n`;
    }
    
    // Añadir conclusión
    if (isApproved) {
      if (score >= 90) {
        summary += `\n## Conclusión\nEl código es de alta calidad y cumple con los estándares requeridos. ¡Excelente trabajo!`;
      } else {
        summary += `\n## Conclusión\nEl código es aceptable, pero hay margen de mejora. Considera implementar las sugerencias para mejorar la calidad.`;
      }
    } else {
      summary += `\n## Conclusión\nEl código no cumple con los estándares mínimos requeridos. Por favor, corrige los problemas críticos y altos antes de continuar.`;
    }
    
    return summary;
  }

  private compareReviews(
    oldReview: ReviewResult, 
    newReview: ReviewResult
  ): any {
    // Calcular diferencias en problemas
    const oldIssueCount = oldReview.issues.length;
    const newIssueCount = newReview.issues.length;
    const issuesDiff = newIssueCount - oldIssueCount;
    
    // Calcular diferencias en sugerencias
    const oldSuggestionCount = oldReview.suggestions.length;
    const newSuggestionCount = newReview.suggestions.length;
    const suggestionsDiff = newSuggestionCount - oldSuggestionCount;
    
    // Calcular diferencia en puntuación
    const scoreDiff = newReview.score - oldReview.score;
    
    // Identificar problemas resueltos
    const resolvedIssues = oldReview.issues.filter(oldIssue => 
      !newReview.issues.some(newIssue => 
        newIssue.description === oldIssue.description
      )
    );
    
    // Identificar nuevos problemas
    const newIssues = newReview.issues.filter(newIssue => 
      !oldReview.issues.some(oldIssue => 
        oldIssue.description === newIssue.description
      )
    );
    
    // Identificar sugerencias implementadas
    const implementedSuggestions = oldReview.suggestions.filter(oldSuggestion => 
      !newReview.suggestions.some(newSuggestion => 
        newSuggestion.description === oldSuggestion.description
      )
    );
    
    // Identificar nuevas sugerencias
    const newSuggestions = newReview.suggestions.filter(newSuggestion => 
      !oldReview.suggestions.some(oldSuggestion => 
        oldSuggestion.description === newSuggestion.description
      )
    );
    
    // Generar resumen de comparación
    return {
      scoreDiff,
      issuesDiff,
      suggestionsDiff,
      resolvedIssues,
      newIssues,
      implementedSuggestions,
      newSuggestions,
      oldScore: oldReview.score,
      newScore: newReview.score,
      oldApproved: oldReview.isApproved,
      newApproved: newReview.isApproved,
      summary: this.generateComparisonSummary(
        scoreDiff, 
        issuesDiff, 
        suggestionsDiff, 
        resolvedIssues, 
        newIssues, 
        implementedSuggestions, 
        newSuggestions,
        oldReview.isApproved,
        newReview.isApproved
      )
    };
  }

  private generateComparisonSummary(
    scoreDiff: number,
    issuesDiff: number,
    suggestionsDiff: number,
    resolvedIssues: ReviewIssue[],
    newIssues: ReviewIssue[],
    implementedSuggestions: ReviewSuggestion[],
    newSuggestions: ReviewSuggestion[],
    oldApproved: boolean,
    newApproved: boolean
  ): string {
    let summary = `# Comparación de Revisiones\n\n`;
    
    // Cambio en puntuación
    summary += `## Cambio en Puntuación: ${scoreDiff > 0 ? '+' : ''}${scoreDiff} puntos\n\n`;
    
    // Cambio en estado de aprobación
    if (!oldApproved && newApproved) {
      summary += `## Estado: ✅ MEJORADO (Ahora Aprobado)\n\n`;
    } else if (oldApproved && !newApproved) {
      summary += `## Estado: ❌ DEGRADADO (Ahora Rechazado)\n\n`;
    } else if (newApproved) {
      summary += `## Estado: ✅ APROBADO (Sin cambios)\n\n`;
    } else {
      summary += `## Estado: ❌ RECHAZADO (Sin cambios)\n\n`;
    }
    
    // Resumen de cambios
    summary += `## Resumen de Cambios\n`;
    summary += `- Problemas: ${issuesDiff > 0 ? '+' : ''}${issuesDiff}\n`;
    summary += `- Sugerencias: ${suggestionsDiff > 0 ? '+' : ''}${suggestionsDiff}\n`;
    summary += `- Problemas resueltos: ${resolvedIssues.length}\n`;
    summary += `- Nuevos problemas: ${newIssues.length}\n`;
    summary += `- Sugerencias implementadas: ${implementedSuggestions.length}\n`;
    summary += `- Nuevas sugerencias: ${newSuggestions.length}\n\n`;
    
    // Detallar problemas resueltos
    if (resolvedIssues.length > 0) {
      summary += `## Problemas Resueltos\n`;
      resolvedIssues.forEach(issue => {
        summary += `- **${issue.severity.toUpperCase()}**: ${issue.description}\n`;
      });
      summary += `\n`;
    }
    
    // Detallar nuevos problemas
    if (newIssues.length > 0) {
      summary += `## Nuevos Problemas\n`;
      newIssues.forEach(issue => {
        summary += `- **${issue.severity.toUpperCase()}**: ${issue.description}\n`;
        summary += `  - Recomendación: ${issue.recommendation}\n`;
      });
      summary += `\n`;
    }
    
    // Detallar sugerencias implementadas
    if (implementedSuggestions.length > 0) {
      summary += `## Sugerencias Implementadas\n`;
      implementedSuggestions.forEach(suggestion => {
        summary += `- **${suggestion.type.toUpperCase()}**: ${suggestion.description}\n`;
      });
      summary += `\n`;
    }
    
    // Conclusión
    if (scoreDiff > 0) {
      summary += `## Conclusión\nLa calidad del código ha mejorado. ¡Buen trabajo!`;
    } else if (scoreDiff < 0) {
      summary += `## Conclusión\nLa calidad del código ha disminuido. Revisa los nuevos problemas.`;
    } else {
      summary += `## Conclusión\nLa calidad del código se mantiene igual.`;
    }
    
    return summary;
  }

  private saveReviewToHistory(filePath: string, reviewResult: ReviewResult): void {
    // Obtener historial existente o crear uno nuevo
    const history = this.reviewHistory.get(filePath) || [];
    
    // Añadir nueva revisión al historial
    history.push(reviewResult);
    
    // Limitar el historial a las últimas 10 revisiones para evitar consumo excesivo de memoria
    if (history.length > 10) {
      history.shift(); // Eliminar la revisión más antigua
    }
    
    // Actualizar historial
    this.reviewHistory.set(filePath, history);
    
    // Actualizar timestamp de última revisión
    this.lastReviewTimestamp.set(filePath, Date.now());
    
    this.log(`📊 Historial de revisiones actualizado para ${filePath}`);
  }

  async analyzeCodeQuality(
    projectPath: string, 
    options: CodeReviewOptions = this.defaultOptions
  ): Promise<{ 
    overallScore: number, 
    fileScores: Map<string, number>,
    summary: string,
    criticalIssues: ReviewIssue[],
    recommendations: string[]
  }> {
    this.log(`🔍 Analizando calidad de código en: ${projectPath}`);
    
    // Verificar si el directorio existe
    if (!fs.existsSync(projectPath)) {
      throw new Error(`El directorio ${projectPath} no existe`);
    }
    
    const fileScores = new Map<string, number>();
    const allIssues: ReviewIssue[] = [];
    const allSuggestions: ReviewSuggestion[] = [];
    const criticalIssues: ReviewIssue[] = [];
    const recommendations: string[] = [];
    
    // Obtener todos los archivos del proyecto (excluyendo patrones ignorados)
    const files = this.getProjectFiles(projectPath, options.ignorePatterns || []);
    
    // Revisar cada archivo
    for (const file of files) {
      try {
        const code = fs.readFileSync(file, 'utf-8');
        const reviewResult = await this.reviewCode(code, file, options);
        
        // Guardar puntuación
        fileScores.set(file, reviewResult.score);
        
        // Acumular problemas y sugerencias
        allIssues.push(...reviewResult.issues);
        allSuggestions.push(...reviewResult.suggestions);
        
        // Acumular problemas críticos
        criticalIssues.push(...reviewResult.issues.filter(issue => issue.severity === 'critical'));
        
        // Guardar en historial
        this.saveReviewToHistory(file, reviewResult);
      } catch (error) {
        this.log(`❌ Error al revisar ${file}: ${error.message}`, 'error');
      }
    }
    
    // Calcular puntuación general
    const overallScore = this.calculateOverallScore(fileScores);
    
    // Generar recomendaciones generales
    this.generateProjectRecommendations(allIssues, allSuggestions, recommendations);
    
    // Generar resumen del proyecto
    const summary = this.generateProjectSummary(
      overallScore, 
      fileScores, 
      allIssues, 
      allSuggestions, 
      criticalIssues, 
      recommendations
    );
    
    this.log(`🔍 Análisis de calidad completado: Puntuación general ${overallScore}/100`);
    
    return {
      overallScore,
      fileScores,
      summary,
      criticalIssues,
      recommendations
    };
  }

  private getProjectFiles(projectPath: string, ignorePatterns: string[]): string[] {
    const files: string[] = [];
    
    // Función recursiva para recorrer directorios
    const traverseDirectory = (dirPath: string) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        // Verificar si el archivo/directorio debe ser ignorado
        if (ignorePatterns.some(pattern => fullPath.includes(pattern))) {
          continue;
        }
        
        if (entry.isDirectory()) {
          traverseDirectory(fullPath);
        } else {
          // Solo incluir archivos de código
          const extension = path.extname(entry.name).toLowerCase().substring(1);
          if (this.isCodeFile(extension)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    traverseDirectory(projectPath);
    return files;
  }

  private isCodeFile(extension: string): boolean {
    const codeExtensions = [
      // JavaScript/TypeScript
      'js', 'jsx', 'ts', 'tsx',
      // HTML/CSS
      'html', 'htm', 'css', 'scss', 'sass', 'less',
      // Python
      'py', 'pyw',
      // Java
      'java',
      // C/C++
      'c', 'cpp', 'h', 'hpp',
      // C#
      'cs',
      // PHP
      'php',
      // Ruby
      'rb',
      // Go
      'go',
      // Swift
      'swift',
      // Kotlin
      'kt',
      // Rust
      'rs'
    ];
    
    return codeExtensions.includes(extension);
  }

  private calculateOverallScore(fileScores: Map<string, number>): number {
    if (fileScores.size === 0) {
      return 0;
    }
    
    let totalScore = 0;
    for (const score of fileScores.values()) {
      totalScore += score;
    }
    
    return Math.round(totalScore / fileScores.size);
  }

  private generateProjectRecommendations(
    allIssues: ReviewIssue[], 
    allSuggestions: ReviewSuggestion[],
    recommendations: string[]
  ): void {
    // Analizar patrones comunes en los problemas
    const issuePatterns = new Map<string, number>();
    for (const issue of allIssues) {
      const count = issuePatterns.get(issue.description) || 0;
      issuePatterns.set(issue.description, count + 1);
    }
    
    // Analizar patrones comunes en las sugerencias
    const suggestionPatterns = new Map<string, number>();
    for (const suggestion of allSuggestions) {
      const count = suggestionPatterns.get(suggestion.description) || 0;
      suggestionPatterns.set(suggestion.description, count + 1);
    }
    
    // Generar recomendaciones basadas en los problemas más comunes
    const sortedIssues = [...issuePatterns.entries()].sort((a, b) => b[1] - a[1]);
    for (const [description, count] of sortedIssues.slice(0, 5)) {
      const issue = allIssues.find(i => i.description === description);
      if (issue) {
        recommendations.push(`Corregir problema común (${count} ocurrencias): ${description}. ${issue.recommendation}`);
      }
    }
    
    // Generar recomendaciones basadas en las sugerencias más comunes
    const sortedSuggestions = [...suggestionPatterns.entries()].sort((a, b) => b[1] - a[1]);
    for (const [description, count] of sortedSuggestions.slice(0, 5)) {
      const suggestion = allSuggestions.find(s => s.description === description);
      if (suggestion) {
        recommendations.push(`Implementar mejora común (${count} ocurrencias): ${description}. ${suggestion.benefit}`);
      }
    }
    
    // Añadir recomendaciones generales basadas en categorías de problemas
    if (allIssues.some(issue => issue.severity === 'critical')) {
      recommendations.push('Priorizar la corrección de problemas críticos antes de continuar con el desarrollo.');
    }
    
    if (allSuggestions.filter(s => s.type === 'security').length > 0) {
      recommendations.push('Realizar una revisión de seguridad exhaustiva, posiblemente con herramientas especializadas.');
    }
    
    if (allSuggestions.filter(s => s.type === 'performance').length > 0) {
      recommendations.push('Considerar una auditoría de rendimiento para identificar y corregir cuellos de botella.');
    }
    
    if (allSuggestions.filter(s => s.type === 'accessibility').length > 0) {
      recommendations.push('Mejorar la accesibilidad del proyecto siguiendo las pautas WCAG 2.1 AA.');
    }
  }

  private generateProjectSummary(
    overallScore: number,
    fileScores: Map<string, number>,
    allIssues: ReviewIssue[],
    allSuggestions: ReviewSuggestion[],
    criticalIssues: ReviewIssue[],
    recommendations: string[]
  ): string {
    // Contar problemas por severidad
    const criticalCount = allIssues.filter(issue => issue.severity === 'critical').length;
    const highCount = allIssues.filter(issue => issue.severity === 'high').length;
    const mediumCount = allIssues.filter(issue => issue.severity === 'medium').length;
    const lowCount = allIssues.filter(issue => issue.severity === 'low').length;
    
    // Contar sugerencias por tipo
    const performanceCount = allSuggestions.filter(s => s.type === 'performance').length;
    const securityCount = allSuggestions.filter(s => s.type === 'security').length;
    const accessibilityCount = allSuggestions.filter(s => s.type === 'accessibility').length;
    const maintainabilityCount = allSuggestions.filter(s => s.type === 'maintainability').length;
    const styleCount = allSuggestions.filter(s => s.type === 'style').length;
    
    // Identificar archivos con peor puntuación
    const sortedFiles = [...fileScores.entries()].sort((a, b) => a[1] - b[1]);
    const worstFiles = sortedFiles.slice(0, 5);
    
    // Generar resumen
    let summary = `# Resumen de Calidad del Proyecto\n\n`;
    summary += `## Puntuación General: ${overallScore}/100\n\n`;
    
    // Calificación cualitativa
    let qualitativeRating = '';
    if (overallScore >= 90) {
      qualitativeRating = 'Excelente';
    } else if (overallScore >= 80) {
      qualitativeRating = 'Bueno';
    } else if (overallScore >= 70) {
      qualitativeRating = 'Aceptable';
    } else if (overallScore >= 60) {
      qualitativeRating = 'Necesita Mejoras';
    } else {
      qualitativeRating = 'Problemático';
    }
    
    summary += `## Calificación: ${qualitativeRating}\n\n`;
    
    // Estadísticas generales
    summary += `## Estadísticas\n`;
    summary += `- Archivos analizados: ${fileScores.size}\n`;
    summary += `- Total de problemas: ${allIssues.length}\n`;
    summary += `- Total de sugerencias: ${allSuggestions.length}\n\n`;
    
    // Desglose de problemas
    summary += `## Problemas por Severidad\n`;
    summary += `- Críticos: ${criticalCount}\n`;
    summary += `- Altos: ${highCount}\n`;
    summary += `- Medios: ${mediumCount}\n`;
    summary += `- Bajos: ${lowCount}\n\n`;
    
    // Desglose de sugerencias
    summary += `## Sugerencias por Tipo\n`;
    summary += `- Rendimiento: ${performanceCount}\n`;
    summary += `- Seguridad: ${securityCount}\n`;
    summary += `- Accesibilidad: ${accessibilityCount}\n`;
    summary += `- Mantenibilidad: ${maintainabilityCount}\n`;
    summary += `- Estilo: ${styleCount}\n\n`;
    
    // Archivos con peor puntuación
    if (worstFiles.length > 0) {
      summary += `## Archivos que Requieren Atención\n`;
      worstFiles.forEach(([file, score]) => {
        summary += `- ${path.basename(file)}: ${score}/100\n`;
      });
      summary += `\n`;
    }
    
    // Problemas críticos
    if (criticalIssues.length > 0) {
      summary += `## Problemas Críticos\n`;
      criticalIssues.slice(0, 10).forEach(issue => {
        summary += `- ${issue.description}\n`;
        summary += `  - Recomendación: ${issue.recommendation}\n`;
      });
      
      if (criticalIssues.length > 10) {
        summary += `\n*Y ${criticalIssues.length - 10} problemas críticos más...*\n`;
      }
      
      summary += `\n`;
    }
    
    // Recomendaciones
    if (recommendations.length > 0) {
      summary += `## Recomendaciones Principales\n`;
      recommendations.forEach(recommendation => {
        summary += `- ${recommendation}\n`;
      });
      summary += `\n`;
    }
    
    // Conclusión
    summary += `## Conclusión\n`;
    if (overallScore >= 80) {
      summary += `El proyecto tiene una buena calidad de código en general. Continúa con las buenas prácticas y considera implementar las sugerencias para mejorar aún más.`;
    } else if (overallScore >= 60) {
      summary += `El proyecto tiene una calidad de código aceptable, pero hay áreas que necesitan mejoras. Prioriza los problemas críticos y de alta severidad.`;
    } else {
      summary += `El proyecto tiene problemas significativos de calidad de código. Es recomendable abordar los problemas críticos y altos antes de continuar con el desarrollo.`;
    }
    
    return summary;
  }

  async suggestCodeImprovements(
    code: string,
    filePath: string,
    options: {
      focus?: 'performance' | 'security' | 'accessibility' | 'maintainability' | 'style' | 'all',
      maxSuggestions?: number
    } = {}
  ): Promise<{
    originalCode: string,
    improvedCode: string,
    improvements: string[],
    summary: string
  }> {
    this.log(`💡 Generando sugerencias de mejora para: ${filePath}`);
    
    // Valores por defecto
    const focus = options.focus || 'all';
    const maxSuggestions = options.maxSuggestions || 5;
    
    // Realizar revisión de código
    const reviewResult = await this.reviewCode(code, filePath);
    
    // Filtrar sugerencias según el enfoque
    let filteredSuggestions = reviewResult.suggestions;
    if (focus !== 'all') {
      filteredSuggestions = reviewResult.suggestions.filter(s => s.type === focus);
    }
    
    // Limitar número de sugerencias
    filteredSuggestions = filteredSuggestions.slice(0, maxSuggestions);
    
    // Generar código mejorado y lista de mejoras
    const { improvedCode, improvements } = this.applyImprovements(code, filteredSuggestions);
    
    // Generar resumen
    const summary = this.generateImprovementsSummary(
      reviewResult.score,
      filteredSuggestions,
      improvements
    );
    
    return {
      originalCode: code,
      improvedCode,
      improvements,
      summary
    };
  }

  private applyImprovements(
    code: string,
    suggestions: ReviewSuggestion[]
  ): { improvedCode: string, improvements: string[] } {
    // En un escenario real, aquí implementaríamos la lógica para aplicar
    // automáticamente las mejoras al código. Para simplificar, solo generamos
    // descripciones de las mejoras que se podrían aplicar.
    
    const improvements: string[] = [];
    let improvedCode = code;
    
    for (const suggestion of suggestions) {
      // Generar descripción de la mejora
      const improvement = `${suggestion.description}: ${suggestion.benefit}`;
      improvements.push(improvement);
      
      // Si hay código sugerido, aplicarlo
      if (suggestion.suggestedCode && suggestion.code) {
        improvedCode = improvedCode.replace(suggestion.code, suggestion.suggestedCode);
      }
    }
    
    return { improvedCode, improvements };
  }

  private generateImprovementsSummary(
    originalScore: number,
    suggestions: ReviewSuggestion[],
    improvements: string[]
  ): string {
    // Estimar nueva puntuación (simplificado)
    const estimatedScoreImprovement = Math.min(10, suggestions.length * 2);
    const estimatedNewScore = Math.min(100, originalScore + estimatedScoreImprovement);
    
    let summary = `# Sugerencias de Mejora de Código\n\n`;
    summary += `## Puntuación Original: ${originalScore}/100\n`;
    summary += `## Puntuación Estimada Después de Mejoras: ${estimatedNewScore}/100\n\n`;
    
    summary += `## Mejoras Sugeridas (${improvements.length})\n`;
    improvements.forEach((improvement, index) => {
      summary += `${index + 1}. ${improvement}\n`;
    });
    
    summary += `\n## Impacto Estimado\n`;
    summary += `- Mejora de puntuación: +${estimatedScoreImprovement} puntos\n`;
    
    // Categorizar impacto
    const performanceCount = suggestions.filter(s => s.type === 'performance').length;
    const securityCount = suggestions.filter(s => s.type === 'security').length;
    const accessibilityCount = suggestions.filter(s => s.type === 'accessibility').length;
    const maintainabilityCount = suggestions.filter(s => s.type === 'maintainability').length;
    const styleCount = suggestions.filter(s => s.type === 'style').length;
    
    if (performanceCount > 0) {
      summary += `- Rendimiento: Mejora potencial en tiempo de ejecución y uso de recursos\n`;
    }
    
    if (securityCount > 0) {
      summary += `- Seguridad: Reducción de vulnerabilidades potenciales\n`;
    }
    
    if (accessibilityCount > 0) {
      summary += `- Accesibilidad: Mejor experiencia para usuarios con discapacidades\n`;
    }
    
    if (maintainabilityCount > 0) {
      summary += `- Mantenibilidad: Código más fácil de entender y modificar\n`;
    }
    
    if (styleCount > 0) {
      summary += `- Estilo: Mayor consistencia y legibilidad del código\n`;
    }
    
    return summary;
  }

  // Método para integrarse con otros agentes
  async integrateWithOtherAgents(): Promise<void> {
    // Registrar eventos para colaborar con otros agentes
    
    // Colaboración con TestAgent
    this.listenForEvent(AgentEventType.TEST_COMPLETED, async (data) => {
      if (data && data.filePath) {
        this.log(`📝 Recibida notificación de pruebas completadas para: ${data.filePath}`);
        
        // Verificar si el archivo necesita revisión después de las pruebas
        const lastReviewTime = this.lastReviewTimestamp.get(data.filePath) || 0;
        const timeSinceLastReview = Date.now() - lastReviewTime;
        
        // Si han pasado más de 30 minutos desde la última revisión, revisar el archivo
        if (timeSinceLastReview > 30 * 60 * 1000) {
          try {
            const code = fs.readFileSync(data.filePath, 'utf-8');
            const reviewResult = await this.reviewCode(code, data.filePath);
            
            // Guardar en historial
            this.saveReviewToHistory(data.filePath, reviewResult);
            
            // Notificar si hay problemas críticos
            if (reviewResult.issues.some(issue => issue.severity === 'critical')) {
              this.emitEvent(AgentEventType.CRITICAL_ISSUE_FOUND, {
                filePath: data.filePath,
                issues: reviewResult.issues.filter(issue => issue.severity === 'critical')
              });
            }
          } catch (error) {
            this.log(`❌ Error al revisar ${data.filePath} después de pruebas: ${error.message}`, 'error');
          }
        }
      }
    });
    
    // Colaboración con StyleAgent
    this.listenForEvent(AgentEventType.STYLE_UPDATED, async (data) => {
      if (data && data.filePath) {
        this.log(`🎨 Recibida notificación de estilo actualizado para: ${data.filePath}`);
        
        // Revisar el archivo después de cambios de estilo
        try {
          const code = fs.readFileSync(data.filePath, 'utf-8');
          const reviewResult = await this.reviewCode(code, data.filePath, {
            // Enfocarse en aspectos de estilo y mantenibilidad
            checkAccessibility: true,
            checkSecurity: false,
            checkPerformance: false
          });
          
          // Guardar en historial
          this.saveReviewToHistory(data.filePath, reviewResult);
          
          // Notificar al StyleAgent si hay sugerencias de estilo
          const styleSuggestions = reviewResult.suggestions.filter(s => s.type === 'style');
          if (styleSuggestions.length > 0) {
            this.emitEvent(AgentEventType.STYLE_SUGGESTIONS, {
              filePath: data.filePath,
              suggestions: styleSuggestions
            });
          }
        } catch (error) {
          this.log(`❌ Error al revisar estilo en ${data.filePath}: ${error.message}`, 'error');
        }
      }
    });
    
    // Colaboración con SelfImprovementAgent
    this.listenForEvent(AgentEventType.IMPROVEMENT_REQUESTED, async (data) => {
      if (data && data.agentType === 'CodeReviewAgent') {
        this.log(`🔄 Recibida solicitud de mejora para CodeReviewAgent`);
        
        // Recopilar estadísticas de revisiones para análisis
        const reviewStats = this.generateReviewStatistics();
        
        // Enviar estadísticas al SelfImprovementAgent
        this.emitEvent(AgentEventType.AGENT_STATISTICS, {
          agentType: 'CodeReviewAgent',
          statistics: reviewStats
        });
      }
    });
    
    // Colaboración con ArchitectAgent
    this.listenForEvent(AgentEventType.ARCHITECTURE_UPDATED, async (data) => {
      if (data && data.projectPath) {
        this.log(`🏗️ Recibida notificación de arquitectura actualizada para: ${data.projectPath}`);
        
        // Realizar análisis de calidad del proyecto completo
        try {
          const analysisResult = await this.analyzeCodeQuality(data.projectPath);
          
          // Enviar resultados al ArchitectAgent
          this.emitEvent(AgentEventType.CODE_QUALITY_REPORT, {
            projectPath: data.projectPath,
            qualityScore: analysisResult.overallScore,
            criticalIssues: analysisResult.criticalIssues,
            recommendations: analysisResult.recommendations
          });
        } catch (error) {
          this.log(`❌ Error al analizar calidad después de actualización de arquitectura: ${error.message}`, 'error');
        }
      }
    });
  }

  private generateReviewStatistics(): any {
    // Generar estadísticas de revisiones para el SelfImprovementAgent
    const totalReviews = Array.from(this.reviewHistory.values()).reduce((sum, reviews) => sum + reviews.length, 0);
    const totalFiles = this.reviewHistory.size;
    
    // Calcular promedio de puntuación
    let totalScore = 0;
    let reviewCount = 0;
    
    for (const reviews of this.reviewHistory.values()) {
      for (const review of reviews) {
        totalScore += review.score;
        reviewCount++;
      }
    }
    
    const averageScore = reviewCount > 0 ? totalScore / reviewCount : 0;
    
    // Contar problemas por severidad
    const issuesBySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    // Contar sugerencias por tipo
    const suggestionsByType = {
      performance: 0,
      security: 0,
      accessibility: 0,
      maintainability: 0,
      style: 0
    };
    
    for (const reviews of this.reviewHistory.values()) {
      for (const review of reviews) {
        // Contar problemas
        for (const issue of review.issues) {
          issuesBySeverity[issue.severity]++;
        }
        
        // Contar sugerencias
        for (const suggestion of review.suggestions) {
          suggestionsByType[suggestion.type]++;
        }
      }
    }
    
    // Calcular tiempo promedio entre revisiones
    const reviewIntervals: number[] = [];
    for (const [filePath, reviews] of this.reviewHistory.entries()) {
      if (reviews.length >= 2) {
        for (let i = 1; i < reviews.length; i++) {
          const interval = this.lastReviewTimestamp.get(filePath) || 0;
          if (interval > 0) {
            reviewIntervals.push(interval);
          }
        }
      }
    }
    
    const averageInterval = reviewIntervals.length > 0 
      ? reviewIntervals.reduce((sum, interval) => sum + interval, 0) / reviewIntervals.length 
      : 0;
    
    return {
      totalReviews,
      totalFiles,
      averageScore,
      issuesBySeverity,
      suggestionsByType,
      averageIntervalMinutes: averageInterval / (60 * 1000)
    };
  }

  async generateBestPracticesGuide(
    language: string,
    framework?: string
  ): Promise<string> {
    this.log(`📚 Generando guía de mejores prácticas para ${language}${framework ? ` con ${framework}` : ''}`);
    
    // Obtener mejores prácticas para el lenguaje y framework
    const bestPractices = await this.getBestPractices(language, framework);
    
    // Generar guía en formato Markdown
    let guide = `# Guía de Mejores Prácticas: ${language}${framework ? ` con ${framework}` : ''}\n\n`;
    
    guide += `## Introducción\n\n`;
    guide += `Esta guía proporciona recomendaciones y mejores prácticas para el desarrollo con ${language}${framework ? ` utilizando ${framework}` : ''}. `;
    guide += `Seguir estas prácticas ayudará a mejorar la calidad del código, reducir errores, y facilitar el mantenimiento.\n\n`;
    
    // Sección de prácticas generales
    guide += `## Prácticas Generales\n\n`;
    for (const practice of bestPractices.general) {
      guide += `### ${practice.title}\n\n`;
      guide += `${practice.description}\n\n`;
      
      if (practice.example) {
        guide += `**Ejemplo:**\n\n`;
        guide += `\`\`\`${language}\n${practice.example}\n\`\`\`\n\n`;
      }
      
      if (practice.antiPattern) {
        guide += `**Anti-patrón:**\n\n`;
        guide += `\`\`\`${language}\n${practice.antiPattern}\n\`\`\`\n\n`;
      }
    }
    
    // Sección de seguridad
    guide += `## Seguridad\n\n`;
    for (const practice of bestPractices.security) {
      guide += `### ${practice.title}\n\n`;
      guide += `${practice.description}\n\n`;
      
      if (practice.example) {
        guide += `**Ejemplo:**\n\n`;
        guide += `\`\`\`${language}\n${practice.example}\n\`\`\`\n\n`;
      }
      
      if (practice.antiPattern) {
        guide += `**Anti-patrón:**\n\n`;
        guide += `\`\`\`${language}\n${practice.antiPattern}\n\`\`\`\n\n`;
      }
    }
    
    // Sección de rendimiento
    guide += `## Rendimiento\n\n`;
    for (const practice of bestPractices.performance) {
      guide += `### ${practice.title}\n\n`;
      guide += `${practice.description}\n\n`;
      
      if (practice.example) {
        guide += `**Ejemplo:**\n\n`;
        guide += `\`\`\`${language}\n${practice.example}\n\`\`\`\n\n`;
      }
      
      if (practice.antiPattern) {
        guide += `**Anti-patrón:**\n\n`;
        guide += `\`\`\`${language}\n${practice.antiPattern}\n\`\`\`\n\n`;
      }
    }
    
    // Sección específica del framework (si aplica)
    if (framework && bestPractices.framework) {
      guide += `## Prácticas Específicas de ${framework}\n\n`;
      for (const practice of bestPractices.framework) {
        guide += `### ${practice.title}\n\n`;
        guide += `${practice.description}\n\n`;
        
        if (practice.example) {
          guide += `**Ejemplo:**\n\n`;
          guide += `\`\`\`${language}\n${practice.example}\n\`\`\`\n\n`;
        }
        
        if (practice.antiPattern) {
          guide += `**Anti-patrón:**\n\n`;
          guide += `\`\`\`${language}\n${practice.antiPattern}\n\`\`\`\n\n`;
        }
      }
    }
    
    // Sección de herramientas recomendadas
    guide += `## Herramientas Recomendadas\n\n`;
    for (const tool of bestPractices.tools) {
      guide += `### ${tool.name}\n\n`;
      guide += `${tool.description}\n\n`;
      guide += `- **Instalación**: ${tool.installation}\n`;
      guide += `- **Uso básico**: ${tool.usage}\n\n`;
    }
    
    // Sección de recursos adicionales
    guide += `## Recursos Adicionales\n\n`;
    for (const resource of bestPractices.resources) {
      guide += `- [${resource.title}](${resource.url}) - ${resource.description}\n`;
    }
    
    return guide;
  }

  private async getBestPractices(
    language: string,
    framework?: string
  ): Promise<any> {
    // En una implementación real, esto podría consultar una base de datos o API
    // Para simplificar, devolvemos datos de ejemplo basados en el lenguaje
    
    // Prácticas generales para cualquier lenguaje
    const generalPractices = [
      {
        title: "Nombres descriptivos",
        description: "Utiliza nombres de variables, funciones y clases que describan claramente su propósito.",
        example: "const userAccountBalance = 100; // Bueno\nconst uab = 100; // Malo",
        antiPattern: "const x = 100; // ¿Qué es x?"
      },
      {
        title: "Funciones pequeñas y con un solo propósito",
        description: "Cada función debe hacer una sola cosa y hacerla bien.",
        example: "function validateEmail(email) {\n  // Lógica de validación\n}",
        antiPattern: "function processUser(user) {\n  // Validar email\n  // Actualizar base de datos\n  // Enviar notificación\n  // Generar reporte\n}"
      },
      {
        title: "Comentarios significativos",
        description: "Escribe comentarios que expliquen el porqué, no el qué.",
        example: "// Aplicamos un retraso para evitar sobrecargar la API\nsetTimeout(fetchData, 1000);",
        antiPattern: "// Esperar 1 segundo\nsetTimeout(fetchData, 1000);"
      }
    ];
    
    // Prácticas de seguridad para cualquier lenguaje
    const securityPractices = [
      {
        title: "Validación de entrada",
        description: "Siempre valida y sanitiza todas las entradas del usuario.",
        example: "const userInput = sanitizeInput(req.body.input);",
        antiPattern: "const query = `SELECT * FROM users WHERE id = ${req.params.id}`;"
      },
      {
        title: "Gestión segura de secretos",
        description: "Nunca incluyas secretos o credenciales directamente en el código.",
        example: "const apiKey = process.env.API_KEY;",
        antiPattern: "const apiKey = 'abc123secretkey';"
      }
    ];
    
    // Prácticas de rendimiento para cualquier lenguaje
    const performancePractices = [
      {
        title: "Optimización de bucles",
        description: "Minimiza el trabajo dentro de bucles y evita operaciones costosas.",
        example: "const len = array.length;\nfor (let i = 0; i < len; i++) {\n  // Operaciones\n}",
        antiPattern: "for (let i = 0; i < array.length; i++) {\n  // array.length se evalúa en cada iteración\n}"
      },
      {
        title: "Caché de resultados",
        description: "Almacena en caché los resultados de operaciones costosas.",
        example: "const memoizedFn = memoize(expensiveFunction);",
        antiPattern: "function process() {\n  return expensiveFunction(); // Llamada repetida sin caché\n}"
      }
    ];
    
    // Herramientas recomendadas para cualquier lenguaje
    const generalTools = [
      {
        name: "ESLint",
        description: "Herramienta de análisis estático para identificar patrones problemáticos.",
        installation: "npm install eslint --save-dev",
        usage: "npx eslint yourfile.js"
      },
      {
        name: "Prettier",
        description: "Formateador de código opinado para mantener consistencia.",
        installation: "npm install prettier --save-dev",
        usage: "npx prettier --write ."
      }
    ];
    
    // Recursos generales
    const generalResources = [
      {
        title: "Clean Code",
        url: "https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882",
        description: "Libro de Robert C. Martin sobre principios de código limpio."
      },
      {
        title: "OWASP Top Ten",
        url: "https://owasp.org/www-project-top-ten/",
        description: "Lista de los diez riesgos de seguridad más críticos en aplicaciones web."
      }
    ];
    
    // Prácticas específicas según el lenguaje
    let languageSpecificPractices = [];
    let frameworkSpecificPractices = [];
    let languageSpecificTools = [];
    let languageSpecificResources = [];
    
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        languageSpecificPractices = [
          {
            title: "Usar const y let, evitar var",
            description: "Prefiere const para variables que no cambian y let para las que sí. Evita var por su comportamiento de ámbito.",
            example: "const PI = 3.14;\nlet count = 0;",
            antiPattern: "var x = 10; // Evitar var"
          },
          {
            title: "Promesas sobre callbacks",
            description: "Usa Promesas o async/await en lugar de callbacks anidados.",
            example: "async function fetchData() {\n  const result = await api.get('/data');\n  return result;\n}",
            antiPattern: "function fetchData(callback) {\n  api.get('/data', function(err, result) {\n    if (err) return callback(err);\n    callback(null, result);\n  });\n}"
          }
        ];
        
        languageSpecificTools = [
          {
            name: "TypeScript",
            description: "Superset de JavaScript que añade tipado estático.",
            installation: "npm install typescript --save-dev",
            usage: "npx tsc yourfile.ts"
          },
          {
            name: "Jest",
            description: "Framework de pruebas con enfoque en simplicidad.",
            installation: "npm install jest --save-dev",
            usage: "npx jest"
          }
        ];
        
        languageSpecificResources = [
          {
            title: "JavaScript.info",
            url: "https://javascript.info/",
            description: "Tutorial moderno de JavaScript."
          },
          {
            title: "MDN Web Docs",
            url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
            description: "Documentación completa de JavaScript."
          }
        ];
        
        // Prácticas específicas del framework (si se proporciona)
        if (framework) {
          switch (framework.toLowerCase()) {
            case 'react':
              frameworkSpecificPractices = [
                {
                  title: "Componentes funcionales y hooks",
                  description: "Prefiere componentes funcionales con hooks sobre componentes de clase.",
                  example: "function Counter() {\n  const [count, setCount] = useState(0);\n  return <button onClick={() => setCount(count + 1)}>{count}</button>;\n}",
                  antiPattern: "class Counter extends React.Component {\n  state = { count: 0 };\n  render() {\n    return <button onClick={() => this.setState({ count: this.state.count + 1 })}>{this.state.count}</button>;\n  }\n}"
                },
                {
                  title: "Memoización para optimizar renderizado",
                  description: "Usa React.memo, useMemo y useCallback para evitar renderizados innecesarios.",
                  example: "const MemoizedComponent = React.memo(ExpensiveComponent);\nconst memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);\nconst memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);",
                  antiPattern: "// Recreando funciones en cada renderizado\nreturn <Button onClick={() => doSomething(a, b)} />;"
                }
              ];
              break;
            
            case 'vue':
              frameworkSpecificPractices = [
                {
                  title: "Composition API",
                  description: "Prefiere Composition API sobre Options API para mejor reutilización y organización.",
                  example: "import { ref, computed } from 'vue';\n\nexport default {\n  setup() {\n    const count = ref(0);\n    const doubled = computed(() => count.value * 2);\n    \n    function increment() {\n      count.value++;\n    }\n    \n    return { count, doubled, increment };\n  }\n};",
                  antiPattern: "export default {\n  data() {\n    return {\n      count: 0\n    };\n  },\n  computed: {\n    doubled() {\n      return this.count * 2;\n    }\n  },\n  methods: {\n    increment() {\n      this.count++;\n    }\n  }\n};"
                }
              ];
              break;
            
            case 'angular':
              frameworkSpecificPractices = [
                {
                  title: "OnPush Change Detection",
                  description: "Usa OnPush para mejorar el rendimiento limitando la detección de cambios.",
                  example: "@Component({\n  selector: 'app-item',\n  template: '...',\n  changeDetection: ChangeDetectionStrategy.OnPush\n})\nexport class ItemComponent {}",
                  antiPattern: "// Usando la estrategia de detección de cambios por defecto\n@Component({\n  selector: 'app-item',\n  template: '...'\n})\nexport class ItemComponent {}"
                }
              ];
              break;
          }
        }
        break;
      
      case 'typescript':
      case 'ts':
        languageSpecificPractices = [
          {
            title: "Usar tipos explícitos",
            description: "Define tipos explícitos para mejorar la legibilidad y el mantenimiento.",
            example: "function greet(name: string): string {\n  return `Hello, ${name}`;\n}",
            antiPattern: "function greet(name) {\n  return `Hello, ${name}`;\n}"
          },
          {
            title: "Interfaces sobre tipos",
            description: "Prefiere interfaces para definir objetos y contratos de API.",
            example: "interface User {\n  id: number;\n  name: string;\n  email: string;\n}",
            antiPattern: "type User = {\n  id: number;\n  name: string;\n  email: string;\n};"
          }
        ];
        
        languageSpecificTools = [
          {
            name: "TSLint",
            description: "Linter específico para TypeScript (aunque ESLint ahora es recomendado).",
            installation: "npm install tslint --save-dev",
            usage: "npx tslint -c tslint.json 'src/**/*.ts'"
          }
        ];
        
        languageSpecificResources = [
          {
            title: "TypeScript Handbook",
            url: "https://www.typescriptlang.org/docs/handbook/intro.html",
            description: "Guía oficial de TypeScript."
          }
        ];
        break;
      
      // Añadir más lenguajes según sea necesario
    }
    
    return {
      general: [...generalPractices, ...languageSpecificPractices],
      security: securityPractices,
      performance: performancePractices,
      framework: frameworkSpecificPractices,
      tools: [...generalTools, ...languageSpecificTools],
      resources: [...generalResources, ...languageSpecificResources]
    };
  }

  async compareCodeVersions(
    oldCode: string,
    newCode: string,
    filePath: string
  ): Promise<{
    diff: string,
    qualityChange: {
      oldScore: number,
      newScore: number,
      scoreDiff: number,
      summary: string
    }
  }> {
    this.log(`🔄 Comparando versiones de código para: ${filePath}`);
    
    // Revisar ambas versiones del código
    const oldReview = await this.reviewCode(oldCode, filePath);
    const newReview = await this.reviewCode(newCode, filePath);
    
    // Generar comparación
    const comparison = this.compareReviews(oldReview, newReview);
    
    // Generar diff visual (simplificado)
    const diff = this.generateDiff(oldCode, newCode);
    
    return {
      diff,
      qualityChange: {
        oldScore: oldReview.score,
        newScore: newReview.score,
        scoreDiff: newReview.score - oldReview.score,
        summary: comparison.summary
      }
    };
  }

  private generateDiff(oldCode: string, newCode: string): string {
    // En una implementación real, usaríamos una biblioteca como 'diff' o 'jsdiff'
    // Para simplificar, creamos un diff básico línea por línea
    
    const oldLines = oldCode.split('\n');
    const newLines = newCode.split('\n');
    
    let diff = '';
    
    // Encontrar líneas añadidas, eliminadas o modificadas
    const maxLines = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const oldLine = i < oldLines.length ? oldLines[i] : null;
      const newLine = i < newLines.length ? newLines[i] : null;
      
      if (oldLine === null) {
        // Línea añadida
        diff += `+ ${newLine}\n`;
      } else if (newLine === null) {
        // Línea eliminada
        diff += `- ${oldLine}\n`;
      } else if (oldLine !== newLine) {
        // Línea modificada
        diff += `- ${oldLine}\n`;
        diff += `+ ${newLine}\n`;
      } else {
        // Línea sin cambios
        diff += `  ${oldLine}\n`;
      }
    }
    
    return diff;
  }

  async generateCodeReviewChecklist(
    language: string,
    framework?: string
  ): Promise<string> {
    this.log(`📋 Generando checklist de revisión para ${language}${framework ? ` con ${framework}` : ''}`);
    
    // Obtener criterios de revisión para el lenguaje y framework
    const criteria = await this.getReviewCriteria(language, framework);
    
    // Generar checklist en formato Markdown
    let checklist = `# Checklist de Revisión de Código: ${language}${framework ? ` con ${framework}` : ''}\n\n`;
    
    checklist += `## Instrucciones\n\n`;
    checklist += `Utiliza esta checklist durante las revisiones de código para asegurar que se cumplen los estándares de calidad. `;
    checklist += `Marca cada ítem como completado solo cuando estés seguro de que se cumple el criterio.\n\n`;
    
    // Sección de calidad general
    checklist += `## Calidad General\n\n`;
    for (const item of criteria.general) {
      checklist += `- [ ] **${item.title}**: ${item.description}\n`;
      if (item.questions && item.questions.length > 0) {
        for (const question of item.questions) {
          checklist += `  - [ ] ${question}\n`;
        }
      }
      checklist += `\n`;
    }
    
    // Sección de seguridad
    checklist += `## Seguridad\n\n`;
    for (const item of criteria.security) {
      checklist += `- [ ] **${item.title}**: ${item.description}\n`;
      if (item.questions && item.questions.length > 0) {
        for (const question of item.questions) {
          checklist += `  - [ ] ${question}\n`;
        }
      }
      checklist += `\n`;
    }
    
    // Sección de rendimiento
    checklist += `## Rendimiento\n\n`;
    for (const item of criteria.performance) {
      checklist += `- [ ] **${item.title}**: ${item.description}\n`;
      if (item.questions && item.questions.length > 0) {
        for (const question of item.questions) {
          checklist += `  - [ ] ${question}\n`;
        }
      }
      checklist += `\n`;
    }
    
    // Sección de mantenibilidad
    checklist += `## Mantenibilidad\n\n`;
    for (const item of criteria.maintainability) {
      checklist += `- [ ] **${item.title}**: ${item.description}\n`;
      if (item.questions && item.questions.length > 0) {
        for (const question of item.questions) {
          checklist += `  - [ ] ${question}\n`;
        }
      }
      checklist += `\n`;
    }
    
    // Sección específica del framework (si aplica)
    if (framework && criteria.framework) {
      checklist += `## Criterios Específicos de ${framework}\n\n`;
      for (const item of criteria.framework) {
        checklist += `- [ ] **${item.title}**: ${item.description}\n`;
        if (item.questions && item.questions.length > 0) {
          for (const question of item.questions) {
            checklist += `  - [ ] ${question}\n`;
          }
        }
        checklist += `\n`;
      }
    }
    
    // Sección de accesibilidad
    checklist += `## Accesibilidad\n\n`;
    for (const item of criteria.accessibility) {
      checklist += `- [ ] **${item.title}**: ${item.description}\n`;
      if (item.questions && item.questions.length > 0) {
        for (const question of item.questions) {
          checklist += `  - [ ] ${question}\n`;
        }
      }
      checklist += `\n`;
    }
    
    // Sección de documentación
    checklist += `## Documentación\n\n`;
    for (const item of criteria.documentation) {
      checklist += `- [ ] **${item.title}**: ${item.description}\n`;
      if (item.questions && item.questions.length > 0) {
        for (const question of item.questions) {
          checklist += `  - [ ] ${question}\n`;
        }
      }
      checklist += `\n`;
    }
    
    // Sección de pruebas
    checklist += `## Pruebas\n\n`;
    for (const item of criteria.testing) {
      checklist += `- [ ] **${item.title}**: ${item.description}\n`;
      if (item.questions && item.questions.length > 0) {
        for (const question of item.questions) {
          checklist += `  - [ ] ${question}\n`;
        }
      }
      checklist += `\n`;
    }
    
    // Sección de notas finales
    checklist += `## Notas Finales\n\n`;
    checklist += `- **Puntuación mínima requerida**: ${criteria.minimumScore || 70}/100\n`;
    checklist += `- **Revisado por**: [Nombre del revisor]\n`;
    checklist += `- **Fecha de revisión**: [Fecha]\n\n`;
    checklist += `### Comentarios adicionales\n\n`;
    checklist += `[Añadir comentarios adicionales aquí]\n\n`;
    
    return checklist;
  }

  private async getReviewCriteria(
    language: string,
    framework?: string
  ): Promise<any> {
    // En una implementación real, esto podría consultar una base de datos o API
    // Para simplificar, devolvemos criterios de ejemplo basados en el lenguaje
    
    // Criterios generales para cualquier lenguaje
    const generalCriteria = [
      {
        title: "Legibilidad del código",
        description: "El código debe ser fácil de leer y entender.",
        questions: [
          "¿Los nombres de variables, funciones y clases son descriptivos?",
          "¿El código está bien formateado y con indentación consistente?",
          "¿Se evitan abreviaturas confusas o nombres crípticos?"
        ]
      },
      {
        title: "Modularidad",
        description: "El código debe estar organizado en módulos con responsabilidades claras.",
        questions: [
          "¿Cada función o clase tiene una responsabilidad única?",
          "¿Se evita la duplicación de código?",
          "¿Las dependencias entre módulos son claras y mínimas?"
        ]
      },
      {
        title: "Comentarios y documentación",
        description: "El código debe incluir comentarios útiles y documentación cuando sea necesario.",
        questions: [
          "¿Los comentarios explican el 'por qué' en lugar del 'qué'?",
          "¿Las funciones y clases públicas están documentadas?",
          "¿Se evitan comentarios obsoletos o redundantes?"
        ]
      }
    ];
    
    // Criterios de seguridad para cualquier lenguaje
    const securityCriteria = [
      {
        title: "Validación de entrada",
        description: "Todas las entradas deben ser validadas antes de su uso.",
        questions: [
          "¿Se validan todas las entradas del usuario?",
          "¿Se sanitizan las entradas para prevenir inyecciones?",
          "¿Se manejan correctamente los casos extremos y valores inesperados?"
        ]
      },
      {
        title: "Gestión de secretos",
        description: "Los secretos y credenciales deben manejarse de forma segura.",
        questions: [
          "¿Se evita incluir secretos directamente en el código?",
          "¿Se utilizan variables de entorno o servicios de gestión de secretos?",
          "¿Se evita exponer información sensible en logs o mensajes de error?"
        ]
      },
      {
        title: "Control de acceso",
        description: "El acceso a recursos y funcionalidades debe estar controlado.",
        questions: [
          "¿Se implementan mecanismos de autenticación cuando es necesario?",
          "¿Se verifican los permisos antes de realizar operaciones sensibles?",
          "¿Se aplica el principio de mínimo privilegio?"
        ]
      }
    ];
    
    // Criterios de rendimiento para cualquier lenguaje
    const performanceCriteria = [
      {
        title: "Eficiencia algorítmica",
        description: "Los algoritmos deben ser eficientes en tiempo y espacio.",
        questions: [
          "¿Se utilizan estructuras de datos apropiadas?",
          "¿Se evitan operaciones redundantes o innecesarias?",
          "¿Se considera la complejidad temporal y espacial?"
        ]
      },
      {
        title: "Optimización de recursos",
        description: "El uso de recursos (memoria, CPU, red) debe ser optimizado.",
        questions: [
          "¿Se liberan recursos cuando ya no son necesarios?",
          "¿Se evitan fugas de memoria?",
          "¿Se minimiza el uso de red y operaciones de E/S?"
        ]
      },
      {
        title: "Escalabilidad",
        description: "El código debe poder escalar con el aumento de carga o datos.",
        questions: [
          "¿Se evitan cuellos de botella?",
          "¿Se considera el comportamiento con grandes volúmenes de datos?",
          "¿Se implementan mecanismos de caché cuando es apropiado?"
        ]
      }
    ];
    
    // Criterios de mantenibilidad para cualquier lenguaje
    const maintainabilityCriteria = [
      {
        title: "Principios SOLID",
        description: "El código debe seguir los principios SOLID.",
        questions: [
          "¿Cada clase tiene una única responsabilidad?",
          "¿Las clases están abiertas para extensión pero cerradas para modificación?",
          "¿Se favorece la composición sobre la herencia?"
        ]
      },
      {
        title: "Gestión de errores",
        description: "Los errores deben ser manejados de forma consistente y robusta.",
        questions: [
          "¿Se capturan y manejan las excepciones apropiadamente?",
          "¿Los mensajes de error son informativos?",
          "¿Se evita suprimir errores sin manejarlos?"
        ]
      },
      {
        title: "Pruebas",
        description: "El código debe ser testeable y tener pruebas adecuadas.",
        questions: [
          "¿Existen pruebas unitarias para la funcionalidad crítica?",
          "¿Las pruebas son independientes entre sí?",
          "¿Se considera la cobertura de pruebas?"
        ]
      }
    ];
    
    // Criterios de accesibilidad para cualquier lenguaje
    const accessibilityCriteria = [
      {
        title: "Semántica HTML",
        description: "El HTML debe ser semántico y estructurado correctamente.",
        questions: [
          "¿Se utilizan elementos HTML semánticos apropiados?",
          "¿La estructura del documento es lógica y jerárquica?",
          "¿Se utilizan atributos ARIA cuando es necesario?"
        ]
      },
      {
        title: "Contraste y color",
        description: "Los colores deben tener suficiente contraste y no depender solo del color para transmitir información.",
        questions: [
          "¿El contraste de texto cumple con WCAG 2.1 AA?",
          "¿Se evita depender solo del color para transmitir información?",
          "¿Hay modos alternativos (como modo oscuro) disponibles?"
        ]
      },
      {
        title: "Navegación por teclado",
        description: "La aplicación debe ser navegable y operable mediante teclado.",
        questions: [
          "¿Todos los elementos interactivos son accesibles por teclado?",
          "¿El orden de tabulación es lógico?",
          "¿Los elementos focusables tienen indicadores visuales de foco?"
        ]
      }
    ];
    
    // Criterios de documentación para cualquier lenguaje
    const documentationCriteria = [
      {
        title: "Documentación de API",
        description: "Las APIs públicas deben estar documentadas.",
        questions: [
          "¿Cada función, método y clase pública tiene documentación?",
          "¿Se documentan los parámetros, valores de retorno y excepciones?",
          "¿La documentación incluye ejemplos de uso?"
        ]
      },
      {
        title: "Comentarios en el código",
        description: "El código debe incluir comentarios útiles cuando sea necesario.",
        questions: [
          "¿Los comentarios explican el 'por qué' en lugar del 'qué'?",
          "¿Se documentan decisiones de diseño importantes?",
          "¿Se evitan comentarios obsoletos o redundantes?"
        ]
      },
      {
        title: "README y documentación de proyecto",
        description: "El proyecto debe incluir documentación general.",
        questions: [
          "¿Existe un README con instrucciones de instalación y uso?",
          "¿Se documentan las dependencias y requisitos?",
          "¿Se incluye información sobre cómo contribuir al proyecto?"
        ]
      }
    ];
    
    // Criterios de pruebas para cualquier lenguaje
    const testingCriteria = [
      {
        title: "Pruebas unitarias",
        description: "Deben existir pruebas unitarias para la funcionalidad crítica.",
        questions: [
          "¿Las pruebas unitarias cubren los casos de uso principales?",
          "¿Las pruebas son independientes entre sí?",
          "¿Se utilizan mocks o stubs cuando es apropiado?"
        ]
      },
      {
        title: "Pruebas de integración",
        description: "Deben existir pruebas de integración para verificar la interacción entre componentes.",
        questions: [
          "¿Las pruebas de integración verifican la interacción entre componentes?",
          "¿Se prueban los flujos de trabajo completos?",
          "¿Se consideran escenarios de error y casos límite?"
        ]
      },
      {
        title: "Cobertura de pruebas",
        description: "La cobertura de pruebas debe ser adecuada.",
        questions: [
          "¿La cobertura de pruebas es suficiente para el código crítico?",
          "¿Se priorizan las pruebas para código complejo o propenso a errores?",
          "¿Se monitorea y mantiene la cobertura de pruebas?"
        ]
      }
    ];
    
    // Criterios específicos según el lenguaje
    let languageSpecificCriteria = [];
    let frameworkSpecificCriteria = [];
    
    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        languageSpecificCriteria = [
          {
            title: "Uso de características modernas",
            description: "Utilizar características modernas de JavaScript cuando sea apropiado.",
            questions: [
              "¿Se utilizan características de ES6+ cuando es apropiado?",
              "¿Se evita el uso de var en favor de let y const?",
              "¿Se utilizan funciones de flecha, desestructuración, y otras características modernas?"
            ]
          },
          {
            title: "Gestión de asincronía",
            description: "Manejar operaciones asíncronas de forma clara y consistente.",
            questions: [
              "¿Se utilizan Promesas o async/await en lugar de callbacks anidados?",
              "¿Se manejan adecuadamente los errores en operaciones asíncronas?",
              "¿Se evita el 'callback hell'?"
            ]
          },
          {
            title: "Tipado",
            description: "Considerar el uso de tipado estático o JSDoc para mejorar la robustez.",
            questions: [
              "¿Se utiliza TypeScript o JSDoc para añadir tipado?",
              "¿Los tipos son precisos y útiles?",
              "¿Se evitan tipos any o unknown innecesarios?"
            ]
          }
        ];
        
        // Criterios específicos del framework (si se proporciona)
        if (framework) {
          switch (framework.toLowerCase()) {
            case 'react':
              frameworkSpecificCriteria = [
                {
                  title: "Componentes funcionales",
                  description: "Preferir componentes funcionales con hooks sobre componentes de clase.",
                  questions: [
                    "¿Se utilizan componentes funcionales con hooks?",
                    "¿Se evita el uso innecesario de componentes de clase?",
                    "¿Los hooks siguen las reglas de hooks de React?"
                  ]
                },
                {
                  title: "Gestión de estado",
                  description: "Gestionar el estado de forma eficiente y predecible.",
                  questions: [
                    "¿Se utiliza useState para estado local simple?",
                    "¿Se utiliza useReducer para estado complejo?",
                    "¿Se considera el uso de Context o bibliotecas de gestión de estado para estado global?"
                  ]
                },
                {
                  title: "Optimización de renderizado",
                  description: "Optimizar el renderizado para evitar renderizados innecesarios.",
                  questions: [
                    "¿Se utiliza React.memo para componentes puros?",
                    "¿Se utilizan useMemo y useCallback para evitar recreaciones innecesarias?",
                    "¿Se evitan renderizados innecesarios?"
                  ]
                }
              ];
              break;
            
            case 'vue':
              frameworkSpecificCriteria = [
                {
                  title: "Composition API",
                  description: "Considerar el uso de Composition API para mejor reutilización y organización.",
                  questions: [
                    "¿Se utiliza Composition API para componentes complejos?",
                    "¿Se organizan las funcionalidades en composables reutilizables?",
                    "¿Se mantiene la coherencia en el uso de Options API o Composition API?"
                  ]
                },
                {
                  title: "Gestión de estado",
                  description: "Gestionar el estado de forma eficiente y predecible.",
                  questions: [
                    "¿Se utiliza ref y reactive apropiadamente?",
                    "¿Se considera el uso de Pinia o Vuex para estado global?",
                    "¿Se evita la mutación directa del estado?"
                  ]
                },
                {
                  title: "Directivas y slots",
                  description: "Utilizar directivas y slots de forma efectiva.",
                  questions: [
                    "¿Se utilizan directivas personalizadas cuando es apropiado?",
                    "¿Se utilizan slots para componentes flexibles y reutilizables?",
                    "¿Se nombran los slots de forma descriptiva?"
                  ]
                }
              ];
              break;
            
            case 'angular':
              frameworkSpecificCriteria = [
                {
                  title: "Detección de cambios",
                  description: "Optimizar la detección de cambios para mejorar el rendimiento.",
                  questions: [
                    "¿Se utiliza OnPush para componentes puros?",
                    "¿Se evitan operaciones costosas en los ciclos de detección de cambios?",
                    "¿Se utilizan observables de forma eficiente?"
                  ]
                },
                {
                  title: "Módulos y lazy loading",
                  description: "Organizar la aplicación en módulos con lazy loading cuando sea apropiado.",
                  questions: [
                    "¿La aplicación está organizada en módulos coherentes?",
                    "¿Se utiliza lazy loading para módulos grandes o raramente utilizados?",
                    "¿Se evita la importación circular entre módulos?"
                  ]
                },
                {
                  title: "Servicios e inyección de dependencias",
                  description: "Utilizar servicios e inyección de dependencias de forma efectiva.",
                  questions: [
                    "¿Los servicios tienen responsabilidades claras y únicas?",
                    "¿Se utiliza el ámbito de inyección apropiado (root, module, component)?",
                    "¿Se consideran servicios singleton vs. servicios con estado?"
                  ]
                }
              ];
              break;
          }
        }
        break;
      
      case 'typescript':
      case 'ts':
        languageSpecificCriteria = [
          {
            title: "Uso de tipos",
            description: "Utilizar tipos de forma efectiva para mejorar la robustez y legibilidad.",
            questions: [
              "¿Se utilizan tipos explícitos cuando es necesario?",
              "¿Se evitan tipos any o unknown innecesarios?",
              "¿Se utilizan interfaces para definir contratos y tipos para alias?"
            ]
          },
          {
            title: "Genéricos",
            description: "Utilizar genéricos para crear componentes reutilizables y tipados.",
            questions: [
              "¿Se utilizan genéricos para funciones y clases reutilizables?",
              "¿Los genéricos tienen restricciones apropiadas?",
              "¿Se evita la complejidad innecesaria en los genéricos?"
            ]
          },
          {
            title: "Configuración del compilador",
            description: "Configurar el compilador de TypeScript de forma apropiada.",
            questions: [
              "¿El tsconfig.json está configurado adecuadamente?",
              "¿Se utilizan opciones estrictas cuando es posible?",
              "¿Se consideran las opciones de compatibilidad con JavaScript?"
            ]
          }
        ];
        break;
      
      case 'python':
        languageSpecificCriteria = [
          {
            title: "Estilo PEP 8",
            description: "Seguir las convenciones de estilo PEP 8.",
            questions: [
              "¿El código sigue las convenciones de nombrado de PEP 8?",
              "¿La indentación y espaciado son consistentes?",
              "¿Se utilizan docstrings para documentar módulos, clases y funciones?"
            ]
          },
          {
            title: "Tipado con anotaciones",
            description: "Utilizar anotaciones de tipo para mejorar la robustez y documentación.",
            questions: [
              "¿Se utilizan anotaciones de tipo para parámetros y valores de retorno?",
              "¿Se utiliza mypy u otra herramienta para verificar tipos?",
              "¿Se consideran tipos opcionales y uniones cuando es apropiado?"
            ]
          },
          {
            title: "Gestión de recursos",
            description: "Gestionar recursos de forma segura y eficiente.",
            questions: [
              "¿Se utilizan bloques with para recursos como archivos?",
              "¿Se evitan patrones que pueden causar fugas de memoria?",
              "¿Se consideran generadores para procesar grandes conjuntos de datos?"
            ]
          }
        ];
        break;
      
      // Añadir más lenguajes según sea necesario
    }
    
    return {
      general: generalCriteria,
      security: securityCriteria,
      performance: performanceCriteria,
      maintainability: maintainabilityCriteria,
      framework: frameworkSpecificCriteria,
      accessibility: accessibilityCriteria,
      documentation: documentationCriteria,
      testing: testingCriteria,
      minimumScore: 70
    };
  }

  private compareReviews(
    oldReview: ReviewResult,
    newReview: ReviewResult
  ): {
    summary: string,
    issuesFixed: ReviewIssue[],
    issuesAdded: ReviewIssue[],
    suggestionsImplemented: ReviewSuggestion[],
    suggestionsAdded: ReviewSuggestion[]
  } {
    // Identificar problemas resueltos
    const issuesFixed = oldReview.issues.filter(oldIssue => 
      !newReview.issues.some(newIssue => 
        newIssue.description === oldIssue.description
      )
    );
    
    // Identificar nuevos problemas
    const issuesAdded = newReview.issues.filter(newIssue => 
      !oldReview.issues.some(oldIssue => 
        oldIssue.description === newIssue.description
      )
    );
    
    // Identificar sugerencias implementadas
    const suggestionsImplemented = oldReview.suggestions.filter(oldSuggestion => 
      !newReview.suggestions.some(newSuggestion => 
        newSuggestion.description === oldSuggestion.description
      )
    );
    
    // Identificar nuevas sugerencias
    const suggestionsAdded = newReview.suggestions.filter(newSuggestion => 
      !oldReview.suggestions.some(oldSuggestion => 
        oldSuggestion.description === newSuggestion.description
      )
    );
    
    // Generar resumen
    let summary = '';
    
    if (newReview.score > oldReview.score) {
      summary += `✅ La calidad del código ha mejorado (${oldReview.score} → ${newReview.score}, +${(newReview.score - oldReview.score).toFixed(1)}). `;
    } else if (newReview.score < oldReview.score) {
      summary += `⚠️ La calidad del código ha disminuido (${oldReview.score} → ${newReview.score}, ${(newReview.score - oldReview.score).toFixed(1)}). `;
    } else {
      summary += `ℹ️ La puntuación de calidad se mantiene igual (${newReview.score}). `;
    }
    
    if (issuesFixed.length > 0) {
      summary += `Se han resuelto ${issuesFixed.length} problemas. `;
    }
    
    if (issuesAdded.length > 0) {
      summary += `Se han introducido ${issuesAdded.length} nuevos problemas. `;
    }
    
    if (suggestionsImplemented.length > 0) {
      summary += `Se han implementado ${suggestionsImplemented.length} sugerencias. `;
    }
    
    if (suggestionsAdded.length > 0) {
      summary += `Se han añadido ${suggestionsAdded.length} nuevas sugerencias. `;
    }
    
    return {
      summary,
      issuesFixed,
      issuesAdded,
      suggestionsImplemented,
      suggestionsAdded
    };
  }

  async analyzeCodeQuality(
    projectPath: string
  ): Promise<{
    overallScore: number,
    fileScores: Map<string, number>,
    criticalIssues: ReviewIssue[],
    recommendations: string[]
  }> {
    this.log(`🔍 Analizando calidad del código en: ${projectPath}`);
    
    // Obtener todos los archivos de código en el proyecto
    const files = this.getCodeFiles(projectPath);
    
    // Revisar cada archivo
    const fileScores = new Map<string, number>();
    const allIssues: ReviewIssue[] = [];
    const allSuggestions: ReviewSuggestion[] = [];
    
    for (const file of files) {
      try {
        const code = fs.readFileSync(file, 'utf-8');
        const reviewResult = await this.reviewCode(code, file);
        
        fileScores.set(file, reviewResult.score);
        allIssues.push(...reviewResult.issues);
        allSuggestions.push(...reviewResult.suggestions);
      } catch (error) {
        this.log(`❌ Error al analizar ${file}: ${error.message}`, 'error');
      }
    }
    
    // Calcular puntuación general
    let totalScore = 0;
    for (const score of fileScores.values()) {
      totalScore += score;
    }
    const overallScore = fileScores.size > 0 ? totalScore / fileScores.size : 0;
    
    // Identificar problemas críticos
    const criticalIssues = allIssues.filter(issue => issue.severity === 'critical');
    
    // Generar recomendaciones
    const recommendations = this.generateRecommendations(allIssues, allSuggestions);
    
    return {
      overallScore,
      fileScores,
      criticalIssues,
      recommendations
    };
  }

  private getCodeFiles(projectPath: string): string[] {
    // En una implementación real, esto buscaría recursivamente todos los archivos de código
    // Para simplificar, usamos una implementación básica
    
    const codeExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.cs', '.go', '.rb', '.php'];
    const files: string[] = [];
    
    const readDirRecursive = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Ignorar directorios comunes que no contienen código fuente
          if (!['node_modules', 'dist', 'build', 'vendor', '.git'].includes(entry.name)) {
            readDirRecursive(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (codeExtensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    readDirRecursive(projectPath);
    return files;
  }

  private reviewJavaScript(
    code: string,
    result: ReviewResult,
    options: CodeReviewOptions
  ): void {
    // Revisar patrones comunes en JavaScript/TypeScript
    
    // Verificar uso de var (preferir let/const)
    const varRegex = /\bvar\b\s+/g;
    const varMatches = code.match(varRegex);
    if (varMatches && varMatches.length > 0) {
      result.issues.push({
        severity: 'low',
        description: 'Uso de "var" en lugar de "let" o "const"',
        recommendation: 'Reemplazar "var" por "const" para variables que no cambian, o "let" para variables que sí cambian.'
      });
    }
    
    // Verificar funciones muy largas
    const functionRegex = /function\s+\w+\s*\([^)]*\)\s*\{([\s\S]*?)\}/g;
    let match;
    while ((match = functionRegex.exec(code)) !== null) {
      const functionBody = match[1];
      const lines = functionBody.split('\n').length;
      
      if (lines > 50) {
        result.issues.push({
          severity: 'medium',
          description: `Función demasiado larga (${lines} líneas)`,
          line: this.getLineNumber(code, match.index),
          recommendation: 'Considerar dividir la función en funciones más pequeñas con responsabilidades únicas.'
        });
      }
    }
    
    // Verificar uso de console.log en producción
    const consoleRegex = /console\.(log|debug|info|warn|error)/g;
    const consoleMatches = code.match(consoleRegex);
    if (consoleMatches && consoleMatches.length > 0) {
      result.issues.push({
        severity: 'low',
        description: `Uso de console.* (${consoleMatches.length} ocurrencias)`,
        recommendation: 'Eliminar o reemplazar console.* con un sistema de logging apropiado para producción.'
      });
    }
    
    // Verificar manejo de errores en promesas
    if (code.includes('new Promise') && !code.includes('.catch') && !code.includes('try') && !code.includes('await')) {
      result.issues.push({
        severity: 'high',
        description: 'Promesas sin manejo de errores',
        recommendation: 'Añadir .catch() a las promesas o usar try/catch con async/await para manejar errores.'
      });
    }
    
    // Verificar posibles memory leaks en event listeners
    if ((code.includes('addEventListener') || code.includes('on(')) && !code.includes('removeEventListener') && !code.includes('off(')) {
      result.issues.push({
        severity: 'medium',
        description: 'Posible memory leak: event listeners sin removeEventListener',
        recommendation: 'Asegurarse de eliminar los event listeners cuando ya no sean necesarios.'
      });
    }
    
    // Añadir sugerencias de mejora
    if (code.includes('for (') && !code.includes('forEach') && !code.includes('map(') && !code.includes('filter(')) {
      result.suggestions.push({
        type: 'style',
        description: 'Considerar usar métodos de array (forEach, map, filter) en lugar de bucles for tradicionales',
        benefit: 'Mejora la legibilidad y reduce la posibilidad de errores.'
      });
    }
    
    // Verificar uso de any en TypeScript
    if (code.includes(': any') || code.includes('<any>')) {
      result.issues.push({
        severity: 'low',
        description: 'Uso de tipo "any" en TypeScript',
        recommendation: 'Especificar tipos más precisos para mejorar la seguridad de tipos y la documentación.'
      });
    }
  }
  
  private reviewPython(
    code: string,
    result: ReviewResult,
    options: CodeReviewOptions
  ): void {
    // Revisar patrones comunes en Python
    
    // Verificar funciones muy largas
    const functionRegex = /def\s+\w+\s*\([^)]*\):\s*([\s\S]*?)(?=\n\S|$)/g;
    let match;
    while ((match = functionRegex.exec(code)) !== null) {
      const functionBody = match[1];
      const lines = functionBody.split('\n').length;
      
      if (lines > 50) {
        result.issues.push({
          severity: 'medium',
          description: `Función demasiado larga (${lines} líneas)`,
          line: this.getLineNumber(code, match.index),
          recommendation: 'Considerar dividir la función en funciones más pequeñas con responsabilidades únicas.'
        });
      }
    }
    
    // Verificar uso de print en producción
    const printRegex = /\bprint\s*\(/g;
    const printMatches = code.match(printRegex);
    if (printMatches && printMatches.length > 0) {
      result.issues.push({
        severity: 'low',
        description: `Uso de print() (${printMatches.length} ocurrencias)`,
        recommendation: 'Reemplazar print() con un sistema de logging apropiado para producción.'
      });
    }
    
    // Verificar manejo de excepciones demasiado genérico
    if (code.includes('except:') || code.includes('except Exception:')) {
      result.issues.push({
        severity: 'medium',
        description: 'Manejo de excepciones demasiado genérico',
        recommendation: 'Especificar los tipos de excepciones que se esperan capturar para evitar ocultar errores inesperados.'
      });
    }
    
    // Verificar uso de recursos sin with
    if (code.includes('open(') && !code.includes('with open(')) {
      result.issues.push({
        severity: 'medium',
        description: 'Uso de open() sin with',
        recommendation: 'Usar "with open()" para asegurar que los archivos se cierren correctamente, incluso si ocurren excepciones.'
      });
    }
    
    // Añadir sugerencias de mejora
    if (code.includes('for ') && !code.includes('list comprehension') && !code.includes('[') && !code.includes(']')) {
      result.suggestions.push({
        type: 'style',
        description: 'Considerar usar list comprehensions en lugar de bucles for tradicionales cuando sea apropiado',
        benefit: 'Mejora la legibilidad y puede ser más eficiente.'
      });
    }
    
    // Verificar uso de tipado en Python 3.6+
    if (!code.includes(': ') && !code.includes('->')) {
      result.suggestions.push({
        type: 'maintainability',
        description: 'Considerar añadir anotaciones de tipo para mejorar la documentación y permitir verificación estática',
        benefit: 'Mejora la robustez del código y facilita el mantenimiento.'
      });
    }
  }
  
  private reviewJava(
    code: string,
    result: ReviewResult,
    options: CodeReviewOptions
  ): void {
    // Revisar patrones comunes en Java
    
    // Verificar métodos muy largos
    const methodRegex = /(?:public|private|protected)\s+(?:static\s+)?(?:\w+)\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*?)\}/g;
    let match;
    while ((match = methodRegex.exec(code)) !== null) {
      const methodName = match[1];
      const methodBody = match[2];
      const lines = methodBody.split('\n').length;
      
      if (lines > 50) {
        result.issues.push({
          severity: 'medium',
          description: `Método ${methodName} demasiado largo (${lines} líneas)`,
          line: this.getLineNumber(code, match.index),
          recommendation: 'Considerar dividir el método en métodos más pequeños con responsabilidades únicas.'
        });
      }
    }
    
    // Verificar manejo de excepciones
    if (code.includes('catch (Exception ') || code.includes('catch(Exception ')) {
      result.issues.push({
        severity: 'medium',
        description: 'Manejo de excepciones demasiado genérico',
        recommendation: 'Especificar los tipos de excepciones que se esperan capturar para evitar ocultar errores inesperados.'
      });
    }
    
    // Verificar cierre de recursos en Java < 7
    if (code.includes('new FileInputStream') && !code.includes('try-with-resources') && !code.includes('try (')) {
      result.issues.push({
        severity: 'medium',
        description: 'Recursos no cerrados automáticamente',
        recommendation: 'Usar try-with-resources para asegurar que los recursos se cierren correctamente.'
      });
    }
    
    // Verificar uso de System.out.println en producción
    const printRegex = /System\.out\.println/g;
    const printMatches = code.match(printRegex);
    if (printMatches && printMatches.length > 0) {
      result.issues.push({
        severity: 'low',
        description: `Uso de System.out.println (${printMatches.length} ocurrencias)`,
        recommendation: 'Reemplazar System.out.println con un sistema de logging apropiado para producción.'
      });
    }
    
    // Añadir sugerencias de mejora
    if (code.includes('for (') && !code.includes('forEach') && !code.includes('stream()')) {
      result.suggestions.push({
        type: 'style',
        description: 'Considerar usar Stream API o forEach en lugar de bucles for tradicionales cuando sea apropiado',
        benefit: 'Mejora la legibilidad y puede facilitar operaciones paralelas.'
      });
    }
    
    // Verificar uso de Optional para valores nulos
    if (code.includes('null') && !code.includes('Optional')) {
      result.suggestions.push({
        type: 'maintainability',
        description: 'Considerar usar Optional para valores que pueden ser nulos',
        benefit: 'Hace explícito que un valor puede ser nulo y fuerza a manejar ese caso.'
      });
    }
  }
  
  private reviewCSharp(
    code: string,
    result: ReviewResult,
    options: CodeReviewOptions
  ): void {
    // Revisar patrones comunes en C#
    
    // Verificar métodos muy largos
    const methodRegex = /(?:public|private|protected|internal)\s+(?:static\s+)?(?:\w+)\s+(\w+)\s*\([^)]*\)\s*\{([\s\S]*?)\}/g;
    let match;
    while ((match = methodRegex.exec(code)) !== null) {
      const methodName = match[1];
      const methodBody = match[2];
      const lines = methodBody.split('\n').length;
      
      if (lines > 50) {
        result.issues.push({
          severity: 'medium',
          description: `Método ${methodName} demasiado largo (${lines} líneas)`,
          line: this.getLineNumber(code, match.index),
          recommendation: 'Considerar dividir el método en métodos más pequeños con responsabilidades únicas.'
        });
      }
    }
    
    // Verificar manejo de excepciones
    if (code.includes('catch (Exception ') || code.includes('catch(Exception ')) {
      result.issues.push({
        severity: 'medium',
        description: 'Manejo de excepciones demasiado genérico',
        recommendation: 'Especificar los tipos de excepciones que se esperan capturar para evitar ocultar errores inesperados.'
      });
    }
    
    // Verificar uso de recursos sin using
    if ((code.includes('new FileStream') || code.includes('new StreamReader')) && !code.includes('using (')) {
      result.issues.push({
        severity: 'medium',
        description: 'Recursos no dispuestos correctamente',
        recommendation: 'Usar bloques using para asegurar que los recursos se liberen correctamente.'
      });
    }
    
    // Verificar uso de Console.WriteLine en producción
    const printRegex = /Console\.WriteLine/g;
    const printMatches = code.match(printRegex);
    if (printMatches && printMatches.length > 0) {
      result.issues.push({
        severity: 'low',
        description: `Uso de Console.WriteLine (${printMatches.length} ocurrencias)`,
        recommendation: 'Reemplazar Console.WriteLine con un sistema de logging apropiado para producción.'
      });
    }
    
    // Añadir sugerencias de mejora
    if (code.includes('for (') && !code.includes('foreach') && !code.includes('LINQ')) {
      result.suggestions.push({
        type: 'style',
        description: 'Considerar usar LINQ o foreach en lugar de bucles for tradicionales cuando sea apropiado',
        benefit: 'Mejora la legibilidad y reduce la posibilidad de errores.'
      });
    }
    
    // Verificar uso de propiedades automáticas
    if (code.includes('get {') && code.includes('set {') && !code.includes('{ get; set; }')) {
      result.suggestions.push({
        type: 'style',
        description: 'Considerar usar propiedades automáticas cuando no se requiera lógica adicional',
        benefit: 'Reduce la cantidad de código y mejora la legibilidad.'
      });
    }
  }
  
  private reviewGeneric(
    code: string,
    result: ReviewResult,
    options: CodeReviewOptions
  ): void {
    // Revisar patrones genéricos aplicables a cualquier lenguaje
    
    // Verificar líneas muy largas
    const lines = code.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.length > 100) {
        result.issues.push({
          severity: 'low',
          description: `Línea ${i + 1} demasiado larga (${line.length} caracteres)`,
          line: i + 1,
          recommendation: 'Dividir la línea para mejorar la legibilidad.'
        });
      }
    }
    
    // Verificar comentarios TODO sin resolver
    const todoRegex = /\/\/\s*TODO|#\s*TODO|\/\*\s*TODO/g;
    const todoMatches = code.match(todoRegex);
    if (todoMatches && todoMatches.length > 0) {
      result.issues.push({
        severity: 'low',
        description: `TODOs sin resolver (${todoMatches.length} ocurrencias)`,
        recommendation: 'Resolver los TODOs pendientes o convertirlos en tareas en el sistema de seguimiento.'
      });
    }
    
    // Verificar bloques de código duplicados (simplificado)
    const codeBlocks = new Map<string, number[]>();
    for (let i = 0; i < lines.length - 5; i++) {
      const block = lines.slice(i, i + 5).join('\n');
      if (block.trim().length > 0) {
        if (!codeBlocks.has(block)) {
          codeBlocks.set(block, [i + 1]);
        } else {
          codeBlocks.get(block).push(i + 1);
        }
      }
    }
    
    for (const [block, lineNumbers] of codeBlocks.entries()) {
      if (lineNumbers.length > 1) {
        result.issues.push({
          severity: 'medium',
          description: `Código potencialmente duplicado en líneas ${lineNumbers.join(', ')}`,
          recommendation: 'Refactorizar el código duplicado en una función o método reutilizable.'
        });
        break; // Solo reportar un caso para evitar spam
      }
    }
    
    // Verificar indentación inconsistente
    let spacesIndent = 0;
    let tabsIndent = 0;
    
    for (const line of lines) {
      if (line.startsWith('    ')) {
        spacesIndent++;
      } else if (line.startsWith('\t')) {
        tabsIndent++;
      }
    }
    
    if (spacesIndent > 0 && tabsIndent > 0) {
      result.issues.push({
        severity: 'low',
        description: 'Indentación inconsistente (mezcla de espacios y tabs)',
        recommendation: 'Usar consistentemente espacios o tabs para la indentación.'
      });
    }
  }
  
  private reviewSecurity(
    code: string,
    result: ReviewResult,
    language: string
  ): void {
    // Revisar patrones de seguridad comunes
    
    // Verificar inyección SQL
    if (code.includes('SELECT') && code.includes('FROM') && 
        (code.includes('${') || code.includes("'+") || code.includes("'+") || 
         code.includes('format(') || code.includes('f"') || code.includes('%s'))) {
      result.issues.push({
        severity: 'critical',
        description: 'Posible vulnerabilidad de inyección SQL',
        recommendation: 'Usar consultas parametrizadas o ORM para prevenir inyección SQL.'
      });
    }
    
    // Verificar XSS
    if ((code.includes('innerHTML') || code.includes('dangerouslySetInnerHTML') || 
         code.includes('document.write')) && 
        (code.includes('${') || code.includes("'+") || code.includes("'+") || 
         code.includes('format(') || code.includes('f"') || code.includes('%s'))) {
      result.issues.push({
        severity: 'critical',
        description: 'Posible vulnerabilidad XSS (Cross-Site Scripting)',
        recommendation: 'Usar métodos seguros como textContent o escapar el HTML antes de insertarlo.'
      });
    }
    
    // Verificar credenciales hardcodeadas
    const credentialRegex = /(?:password|api[_-]?key|secret|token|credentials).*?[=:]\s*['"][^'"]+['"]/gi;
    const credentialMatches = code.match(credentialRegex);
    if (credentialMatches && credentialMatches.length > 0) {
      result.issues.push({
        severity: 'critical',
        description: 'Credenciales hardcodeadas detectadas',
        recommendation: 'Mover las credenciales a variables de entorno o almacenes seguros.'
      });
    }
    
    // Verificar CSRF
    if ((code.includes('fetch(') || code.includes('axios.') || code.includes('http.') || 
         code.includes('$.ajax')) && !code.includes('csrf') && !code.includes('xsrf')) {
      result.suggestions.push({
        type: 'security',
        description: 'Considerar protección CSRF para peticiones HTTP',
        benefit: 'Previene ataques Cross-Site Request Forgery.'
      });
    }
    
    // Verificar deserialización insegura
    if (code.includes('JSON.parse(') || code.includes('eval(') || 
        code.includes('unserialize(') || code.includes('pickle.loads(')) {
      result.suggestions.push({
        type: 'security',
        description: 'Verificar que los datos deserializados provienen de fuentes confiables',
        benefit: 'Previene ataques de deserialización insegura.'
      });
    }
    
    // Verificar permisos de archivos (solo para ciertos lenguajes)
    if ((language === 'python' || language === 'javascript' || language === 'typescript') && 
        (code.includes('chmod') || code.includes('fs.chmod') || code.includes('os.chmod'))) {
      result.suggestions.push({
        type: 'security',
        description: 'Verificar que los permisos de archivos sean los mínimos necesarios',
        benefit: 'Reduce la superficie de ataque en caso de compromiso.'
      });
    }
  }
  
  private reviewAccessibility(
    code: string,
    result: ReviewResult,
    language: string
  ): void {
    // Revisar patrones de accesibilidad comunes
    
    // Solo aplicar a código frontend (HTML, JSX, TSX)
    if (!(code.includes('<div') || code.includes('<span') || code.includes('<button') || 
          code.includes('<a') || code.includes('<img'))) {
      return;
    }
    
    // Verificar atributos alt en imágenes
    const imgRegex = /<img(?![^>]*alt=)[^>]*>/g;
    const imgMatches = code.match(imgRegex);
    if (imgMatches && imgMatches.length > 0) {
      result.issues.push({
        severity: 'medium',
        description: 'Imágenes sin atributo alt',
        recommendation: 'Añadir atributos alt descriptivos a todas las imágenes para mejorar la accesibilidad.'
      });
    }
    
    // Verificar roles ARIA
    if ((code.includes('role=') || code.includes('aria-')) && 
        !(code.includes('aria-label') || code.includes('aria-labelledby'))) {
      result.suggestions.push({
        type: 'accessibility',
        description: 'Considerar añadir aria-label o aria-labelledby a elementos con roles ARIA',
        benefit: 'Mejora la accesibilidad para usuarios de lectores de pantalla.'
      });
    }
    
    // Verificar contraste de colores (simplificado)
    const colorRegex = /color:\s*['"]?#([0-9a-f]{3}|[0-9a-f]{6})['"]?/gi;
    const bgColorRegex = /background(?:-color)?:\s*['"]?#([0-9a-f]{3}|[0-9a-f]{6})['"]?/gi;
    
    if ((code.match(colorRegex) || []).length > 0 && (code.match(bgColorRegex) || []).length > 0) {
      result.suggestions.push({
        type: 'accessibility',
        description: 'Verificar que el contraste de colores cumple con WCAG 2.1 AA (relación mínima de 4.5:1)',
        benefit: 'Mejora la legibilidad para usuarios con baja visión.'
      });
    }
    
    // Verificar navegación por teclado
    if (code.includes('onClick') || code.includes('onPress') || code.includes('on-click')) {
      if (!code.includes('onKeyDown') && !code.includes('onKeyPress') && 
          !code.includes('on-key-down') && !code.includes('on-key-press')) {
        result.suggestions.push({
          type: 'accessibility',
          description: 'Considerar añadir soporte para navegación por teclado',
          benefit: 'Mejora la accesibilidad para usuarios que no pueden usar el ratón.'
        });
      }
    }
    
    // Verificar etiquetas en formularios
    if ((code.includes('<input') || code.includes('<select') || code.includes('<textarea')) && 
        !code.includes('<label')) {
      result.issues.push({
        severity: 'medium',
        description: 'Campos de formulario sin etiquetas',
        recommendation: 'Añadir etiquetas <label> a todos los campos de formulario para mejorar la accesibilidad.'
      });
    }
    
    // Verificar encabezados jerárquicos
    const headings = [];
    const headingRegex = /<h([1-6])[^>]*>/g;
    let match;
    
    while ((match = headingRegex.exec(code)) !== null) {
      headings.push(parseInt(match[1]));
    }
    
    if (headings.length > 0) {
      // Verificar si hay saltos en la jerarquía (por ejemplo, de h1 a h3 sin h2)
      for (let i = 1; i < headings.length; i++) {
        if (headings[i] > headings[i-1] + 1) {
          result.issues.push({
            severity: 'low',
            description: `Salto en la jerarquía de encabezados (de h${headings[i-1]} a h${headings[i]})`,
            recommendation: 'Mantener una jerarquía de encabezados secuencial para mejorar la accesibilidad.'
          });
          break;
        }
      }
    }
  }
  
  private reviewPerformance(
    code: string,
    result: ReviewResult,
    language: string
  ): void {
    // Revisar patrones de rendimiento comunes
    
    // Verificar bucles anidados (complejidad O(n²) o peor)
    const forRegex = /for\s*\(/g;
    const forMatches = code.match(forRegex) || [];
    
    if (forMatches.length >= 2) {
      // Buscar bucles anidados (simplificado)
      const lines = code.split('\n');
      let forCount = 0;
      let maxNesting = 0;
      
      for (const line of lines) {
        if (line.includes('for (') || line.includes('for(')) {
          forCount++;
          maxNesting = Math.max(maxNesting, forCount);
        } else if (line.includes('}') && forCount > 0) {
          forCount--;
        }
      }
      
      if (maxNesting >= 3) {
        result.issues.push({
          severity: 'high',
          description: `Bucles triplemente anidados detectados (complejidad O(n³))`,
          recommendation: 'Considerar algoritmos más eficientes o estructuras de datos alternativas.'
        });
      } else if (maxNesting >= 2) {
        result.issues.push({
          severity: 'medium',
          description: `Bucles doblemente anidados detectados (complejidad O(n²))`,
          recommendation: 'Evaluar si se puede optimizar usando mapas, conjuntos o algoritmos más eficientes.'
        });
      }
    }
    
    // Verificar operaciones costosas en bucles
    if ((code.includes('for (') || code.includes('while (')) && 
        (code.includes('.filter(') || code.includes('.map(') || code.includes('.find(') || 
         code.includes('.indexOf(') || code.includes('.includes('))) {
      result.issues.push({
        severity: 'medium',
        description: 'Operaciones costosas dentro de bucles',
        recommendation: 'Mover operaciones costosas fuera de los bucles cuando sea posible.'
      });
    }
    
    // Verificar creación de objetos grandes en bucles
    if ((code.includes('for (') || code.includes('while (')) && 
        (code.includes('new ') || code.includes('{') || code.includes('['))) {
      result.suggestions.push({
        type: 'performance',
        description: 'Posible creación de objetos dentro de bucles',
        benefit: 'Reducir la creación de objetos en bucles puede mejorar el rendimiento y reducir la presión sobre el garbage collector.'
      });
    }
    
    // Verificar uso de recursión sin memoización
    if (code.includes('function') && code.match(/\w+\s*\([^)]*\)[^{]*\{[^}]*\1\s*\(/)) {
      if (!code.includes('memo') && !code.includes('cache')) {
        result.suggestions.push({
          type: 'performance',
          description: 'Función recursiva sin memoización detectada',
          benefit: 'Implementar memoización puede evitar cálculos redundantes en funciones recursivas.'
        });
      }
    }
    
    // Verificar uso eficiente de selectores CSS (solo para código frontend)
    if (code.includes('querySelector') || code.includes('getElementById') || 
        code.includes('getElementsByClassName')) {
      if (code.includes('for (') && (code.includes('querySelector') || code.includes('getElementById'))) {
        result.issues.push({
          severity: 'medium',
          description: 'Operaciones DOM costosas dentro de bucles',
          recommendation: 'Cachear los resultados de querySelector o getElementById fuera de los bucles.'
        });
      }
    }
    
    // Verificar uso de timers sin limpieza
    if ((code.includes('setTimeout') || code.includes('setInterval')) && 
        !(code.includes('clearTimeout') || code.includes('clearInterval'))) {
      result.suggestions.push({
        type: 'performance',
        description: 'Timers sin código de limpieza',
        benefit: 'Limpiar timers cuando ya no son necesarios previene memory leaks.'
      });
    }
    
    // Sugerencias específicas por lenguaje
    switch (language) {
      case 'javascript':
      case 'typescript':
        // Verificar uso de async/await sin Promise.all para operaciones paralelas
        if (code.includes('async') && code.includes('await') && 
            code.match(/await.*\n.*await/)) {
          result.suggestions.push({
            type: 'performance',
            description: 'Múltiples operaciones await secuenciales',
            benefit: 'Usar Promise.all para operaciones independientes puede mejorar el rendimiento.'
          });
        }
        break;
        
      case 'python':
        // Verificar uso de list comprehensions vs. append en bucles
        if (code.includes('append') && code.includes('for ') && 
            !code.includes('[') && !code.includes(']')) {
          result.suggestions.push({
            type: 'performance',
            description: 'Uso de append en bucles en lugar de list comprehensions',
            benefit: 'Las list comprehensions suelen ser más rápidas y más legibles.'
          });
        }
        break;
    }
  }
  
  private calculateScore(result: ReviewResult): void {
    // Calcular puntuación basada en problemas y sugerencias
    let score = 100;
    
    // Restar puntos por problemas según su severidad
    for (const issue of result.issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 15;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    }
    
    // Restar puntos por cantidad de sugerencias (menos impacto que los problemas)
    score -= Math.min(10, result.suggestions.length);
    
    // Asegurar que la puntuación no sea negativa
    score = Math.max(0, score);
    
    // Determinar si el código es aprobado basado en la puntuación y problemas críticos
    const hasCriticalIssues = result.issues.some(issue => issue.severity === 'critical');
    result.isApproved = score >= 70 && !hasCriticalIssues;
    
    // Asignar la puntuación al resultado
    result.score = score;
    
    // Generar resumen basado en la puntuación
    if (score >= 90) {
      result.summary = 'Excelente calidad de código. Pocos o ningún problema detectado.';
    } else if (score >= 70) {
      result.summary = 'Buena calidad de código. Algunos problemas menores detectados.';
    } else if (score >= 50) {
      result.summary = 'Calidad de código aceptable. Varios problemas detectados que deberían ser corregidos.';
    } else {
      result.summary = 'Calidad de código deficiente. Numerosos problemas detectados que requieren atención inmediata.';
    }
  }
  
  private getLineNumber(code: string, position: number): number {
    // Calcular el número de línea basado en la posición en el código
    const lines = code.substring(0, position).split('\n');
    return lines.length;
  }
  
  private detectLanguage(filePath: string, code: string): string {
    // Detectar el lenguaje basado en la extensión del archivo
    const extension = path.extname(filePath).toLowerCase();
    
    switch (extension) {
      case '.js':
        return 'javascript';
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.py':
        return 'python';
      case '.java':
        return 'java';
      case '.cs':
        return 'csharp';
      case '.html':
      case '.htm':
        return 'html';
      case '.css':
        return 'css';
      case '.scss':
      case '.sass':
        return 'sass';
      case '.jsx':
        return 'jsx';
      case '.php':
        return 'php';
      case '.rb':
        return 'ruby';
      case '.go':
        return 'go';
      case '.swift':
        return 'swift';
      case '.kt':
      case '.kts':
        return 'kotlin';
      case '.rs':
        return 'rust';
      case '.c':
      case '.cpp':
      case '.cc':
      case '.h':
      case '.hpp':
        return 'cpp';
      default:
        // Intentar detectar por contenido si la extensión no es reconocida
        if (code.includes('import React') || code.includes('from "react"')) {
          return 'javascript';
        } else if (code.includes('def ') && code.includes(':') && code.includes('import ')) {
          return 'python';
        } else if (code.includes('public class ') || code.includes('private class ')) {
          return 'java';
        } else if (code.includes('using System;') || code.includes('namespace ')) {
          return 'csharp';
        } else if (code.includes('<html>') || code.includes('<!DOCTYPE html>')) {
          return 'html';
        } else if (code.includes('<?php')) {
          return 'php';
        } else {
          return 'generic';
        }
    }
  }
  
  private formatReviewResult(result: ReviewResult, filePath: string): string {
    // Formatear el resultado de la revisión para presentación
    let formattedResult = `# Revisión de Código: ${path.basename(filePath)}\n\n`;
    
    // Añadir resumen y puntuación
    formattedResult += `## Resumen\n\n`;
    formattedResult += `**Puntuación**: ${result.score}/100\n\n`;
    formattedResult += `**Estado**: ${result.isApproved ? '✅ Aprobado' : '❌ No Aprobado'}\n\n`;
    formattedResult += `**Evaluación**: ${result.summary}\n\n`;
    
    // Añadir problemas encontrados
    if (result.issues.length > 0) {
      formattedResult += `## Problemas Detectados (${result.issues.length})\n\n`;
      
      // Agrupar problemas por severidad
      const issuesBySeverity = {
        critical: result.issues.filter(issue => issue.severity === 'critical'),
        high: result.issues.filter(issue => issue.severity === 'high'),
        medium: result.issues.filter(issue => issue.severity === 'medium'),
        low: result.issues.filter(issue => issue.severity === 'low')
      };
      
      // Mostrar problemas críticos primero
      if (issuesBySeverity.critical.length > 0) {
        formattedResult += `### Críticos ⚠️\n\n`;
        for (const issue of issuesBySeverity.critical) {
          formattedResult += this.formatIssue(issue);
        }
      }
      
      // Mostrar problemas altos
      if (issuesBySeverity.high.length > 0) {
        formattedResult += `### Altos 🔴\n\n`;
        for (const issue of issuesBySeverity.high) {
          formattedResult += this.formatIssue(issue);
        }
      }
      
      // Mostrar problemas medios
      if (issuesBySeverity.medium.length > 0) {
        formattedResult += `### Medios 🟠\n\n`;
        for (const issue of issuesBySeverity.medium) {
          formattedResult += this.formatIssue(issue);
        }
      }
      
      // Mostrar problemas bajos
      if (issuesBySeverity.low.length > 0) {
        formattedResult += `### Bajos 🟡\n\n`;
        for (const issue of issuesBySeverity.low) {
          formattedResult += this.formatIssue(issue);
        }
      }
    }
    
    // Añadir sugerencias
    if (result.suggestions.length > 0) {
      formattedResult += `## Sugerencias de Mejora (${result.suggestions.length})\n\n`;
      
      // Agrupar sugerencias por tipo
      const suggestionsByType = {
        performance: result.suggestions.filter(suggestion => suggestion.type === 'performance'),
        security: result.suggestions.filter(suggestion => suggestion.type === 'security'),
        accessibility: result.suggestions.filter(suggestion => suggestion.type === 'accessibility'),
        maintainability: result.suggestions.filter(suggestion => suggestion.type === 'maintainability'),
        style: result.suggestions.filter(suggestion => suggestion.type === 'style')
      };
      
      // Mostrar sugerencias de seguridad primero
      if (suggestionsByType.security.length > 0) {
        formattedResult += `### Seguridad 🔒\n\n`;
        for (const suggestion of suggestionsByType.security) {
          formattedResult += this.formatSuggestion(suggestion);
        }
      }
      
      // Mostrar sugerencias de rendimiento
      if (suggestionsByType.performance.length > 0) {
        formattedResult += `### Rendimiento ⚡\n\n`;
        for (const suggestion of suggestionsByType.performance) {
          formattedResult += this.formatSuggestion(suggestion);
        }
      }
      
      // Mostrar sugerencias de accesibilidad
      if (suggestionsByType.accessibility.length > 0) {
        formattedResult += `### Accesibilidad ♿\n\n`;
        for (const suggestion of suggestionsByType.accessibility) {
          formattedResult += this.formatSuggestion(suggestion);
        }
      }
      
      // Mostrar sugerencias de mantenibilidad
      if (suggestionsByType.maintainability.length > 0) {
        formattedResult += `### Mantenibilidad 🔧\n\n`;
        for (const suggestion of suggestionsByType.maintainability) {
          formattedResult += this.formatSuggestion(suggestion);
        }
      }
      
      // Mostrar sugerencias de estilo
      if (suggestionsByType.style.length > 0) {
        formattedResult += `### Estilo 🎨\n\n`;
        for (const suggestion of suggestionsByType.style) {
          formattedResult += this.formatSuggestion(suggestion);
        }
      }
    }
    
    // Añadir recomendaciones generales
    formattedResult += `## Recomendaciones Generales\n\n`;
    
    if (result.score < 50) {
      formattedResult += `- Considerar una refactorización significativa del código.\n`;
      formattedResult += `- Priorizar la resolución de problemas críticos y de alta severidad.\n`;
      formattedResult += `- Implementar revisiones de código más frecuentes.\n`;
    } else if (result.score < 70) {
      formattedResult += `- Abordar los problemas identificados antes de continuar con nuevas funcionalidades.\n`;
      formattedResult += `- Considerar la implementación de pruebas automatizadas para prevenir regresiones.\n`;
    } else if (result.score < 90) {
      formattedResult += `- Resolver los problemas menores para mejorar la calidad general del código.\n`;
      formattedResult += `- Considerar las sugerencias para optimizar el rendimiento y la mantenibilidad.\n`;
    } else {
      formattedResult += `- Mantener el alto estándar de calidad en futuras implementaciones.\n`;
      formattedResult += `- Considerar las sugerencias para perfeccionar aún más el código.\n`;
    }
    
    return formattedResult;
  }
  
  private formatIssue(issue: ReviewIssue): string {
    // Formatear un problema para presentación
    let formattedIssue = `#### ${issue.description}\n\n`;
    
    if (issue.line) {
      formattedIssue += `**Línea**: ${issue.line}\n\n`;
    }
    
    if (issue.code) {
      formattedIssue += `**Código**:\n\`\`\`\n${issue.code}\n\`\`\`\n\n`;
    }
    
    formattedIssue += `**Recomendación**: ${issue.recommendation}\n\n`;
    
    return formattedIssue;
  }
  
  private formatSuggestion(suggestion: ReviewSuggestion): string {
    // Formatear una sugerencia para presentación
    let formattedSuggestion = `#### ${suggestion.description}\n\n`;
    
    if (suggestion.line) {
      formattedSuggestion += `**Línea**: ${suggestion.line}\n\n`;
    }
    
    if (suggestion.code) {
      formattedSuggestion += `**Código Actual**:\n\`\`\`\n${suggestion.code}\n\`\`\`\n\n`;
    }
    
    if (suggestion.suggestedCode) {
      formattedSuggestion += `**Código Sugerido**:\n\`\`\`\n${suggestion.suggestedCode}\n\`\`\`\n\n`;
    }
    
    formattedSuggestion += `**Beneficio**: ${suggestion.benefit}\n\n`;
    
    return formattedSuggestion;
  }
  
  private async saveReviewHistory(filePath: string, result: ReviewResult): Promise<void> {
    // Guardar el historial de revisiones para análisis futuro
    if (!this.reviewHistory.has(filePath)) {
      this.reviewHistory.set(filePath, []);
    }
    
    this.reviewHistory.get(filePath).push(result);
    
    // Limitar el historial a las últimas 10 revisiones por archivo
    if (this.reviewHistory.get(filePath).length > 10) {
      this.reviewHistory.get(filePath).shift();
    }
    
    // Emitir evento para que otros agentes puedan reaccionar
    this.emit(AgentEventType.TASK_COMPLETED, {
      agentId: this.id,
      taskType: 'code-review',
      result: {
        filePath,
        score: result.score,
        isApproved: result.isApproved,
        issueCount: result.issues.length,
        suggestionCount: result.suggestions.length
      }
    });
    
    // Si hay problemas críticos, notificar al SelfImprovementAgent
    const criticalIssues = result.issues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      this.emit(AgentEventType.ALERT, {
        agentId: this.id,
        severity: 'high',
        message: `Se encontraron ${criticalIssues.length} problemas críticos en ${path.basename(filePath)}`,
        details: criticalIssues.map(issue => issue.description).join(', '),
        targetAgentId: 'self-improvement-agent'
      });
    }
  }
  
  private async getReviewHistory(filePath: string): Promise<ReviewResult[]> {
    // Obtener el historial de revisiones para un archivo
    return this.reviewHistory.get(filePath) || [];
  }
  
  private async analyzeReviewTrends(filePath: string): Promise<any> {
    // Analizar tendencias en las revisiones para un archivo
    const history = await this.getReviewHistory(filePath);
    
    if (history.length < 2) {
      return {
        hasEnoughData: false,
        message: 'No hay suficientes revisiones para analizar tendencias.'
      };
    }
    
    // Calcular tendencias de puntuación
    const scores = history.map(result => result.score);
    const latestScore = scores[scores.length - 1];
    const previousScore = scores[scores.length - 2];
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Calcular tendencias de problemas
    const issueCounts = history.map(result => result.issues.length);
    const latestIssueCount = issueCounts[issueCounts.length - 1];
    const previousIssueCount = issueCounts[issueCounts.length - 2];
    const averageIssueCount = issueCounts.reduce((sum, count) => sum + count, 0) / issueCounts.length;
    
    // Determinar si hay mejora o deterioro
    const scoreChange = latestScore - previousScore;
    const issueChange = previousIssueCount - latestIssueCount; // Invertido para que positivo sea mejora
    
    // Calcular tendencia general
    const isImproving = scoreChange > 0 && issueChange >= 0;
    const isDeterioring = scoreChange < 0 && issueChange <= 0;
    
    return {
      hasEnoughData: true,
      scoreChange,
      issueChange,
      latestScore,
      averageScore,
      latestIssueCount,
      averageIssueCount,
      isImproving,
      isDeterioring,
      message: isImproving 
        ? 'La calidad del código está mejorando.' 
        : isDeterioring 
          ? 'La calidad del código está deteriorándose.' 
          : 'La calidad del código se mantiene estable.'
    };
  }
  
  private async generateRecommendations(filePath: string, result: ReviewResult): Promise<string[]> {
    // Generar recomendaciones basadas en los problemas y sugerencias
    const recommendations: string[] = [];
    
    // Recomendar herramientas basadas en los problemas encontrados
    const hasStyleIssues = result.issues.some(issue => 
      issue.description.includes('indentación') || 
      issue.description.includes('formato') ||
      issue.description.includes('estilo')
    );
    
    if (hasStyleIssues) {
      recommendations.push('Considerar la implementación de un linter (como ESLint, Pylint, etc.) y un formateador de código (como Prettier).');
    }
    
    const hasSecurityIssues = result.issues.some(issue => 
      issue.severity === 'critical' && 
      (issue.description.includes('seguridad') || 
       issue.description.includes('inyección') ||
       issue.description.includes('XSS') ||
       issue.description.includes('credenciales'))
    );
    
    if (hasSecurityIssues) {
      recommendations.push('Implementar análisis de seguridad estático (SAST) como parte del proceso de CI/CD.');
    }
    
    const hasPerformanceIssues = result.issues.some(issue => 
      issue.description.includes('rendimiento') || 
      issue.description.includes('bucles anidados') ||
      issue.description.includes('complejidad')
    );
    
    if (hasPerformanceIssues) {
      recommendations.push('Considerar el uso de herramientas de perfilado para identificar cuellos de botella de rendimiento.');
    }
    
    // Recomendar revisiones de código más frecuentes si hay muchos problemas
    if (result.issues.length > 10) {
      recommendations.push('Implementar revisiones de código más frecuentes para detectar problemas temprano.');
    }
    
    // Recomendar pruebas automatizadas si hay problemas críticos o de alta severidad
    const hasCriticalOrHighIssues = result.issues.some(issue => 
      issue.severity === 'critical' || issue.severity === 'high'
    );
    
    if (hasCriticalOrHighIssues) {
      recommendations.push('Aumentar la cobertura de pruebas automatizadas, especialmente en áreas críticas.');
    }
    
    // Recomendar refactorización si la puntuación es baja
    if (result.score < 50) {
      recommendations.push('Considerar una refactorización significativa del código para abordar los problemas fundamentales.');
    }
    
    // Añadir recomendaciones basadas en el análisis de tendencias
    const trends = await this.analyzeReviewTrends(filePath);
    if (trends.hasEnoughData) {
      if (trends.isDeterioring) {
        recommendations.push('La calidad del código está deteriorándose. Considerar una revisión más exhaustiva y posiblemente pausar nuevas funcionalidades hasta resolver los problemas existentes.');
      }
    }
    
    return recommendations;
  }
  
  public async compareReviews(filePath: string, beforeId: string, afterId: string): Promise<any> {
    // Comparar dos revisiones para ver mejoras o deterioros
    const history = await this.getReviewHistory(filePath);
    
    // Buscar revisiones por ID o usar las últimas dos si no se especifican
    let beforeReview: ReviewResult;
    let afterReview: ReviewResult;
    
    if (beforeId && afterId) {
      beforeReview = history.find(review => review.id === beforeId);
      afterReview = history.find(review => review.id === afterId);
      
      if (!beforeReview || !afterReview) {
        throw new Error('No se encontraron las revisiones especificadas.');
      }
    } else if (history.length >= 2) {
      afterReview = history[history.length - 1];
      beforeReview = history[history.length - 2];
    } else {
      throw new Error('No hay suficientes revisiones para comparar.');
    }
    
    // Calcular diferencias
    const scoreDiff = afterReview.score - beforeReview.score;
    const issueDiff = beforeReview.issues.length - afterReview.issues.length;
    const suggestionDiff = beforeReview.suggestions.length - afterReview.suggestions.length;
    
    // Identificar problemas resueltos y nuevos
    const resolvedIssues = beforeReview.issues.filter(beforeIssue => 
      !afterReview.issues.some(afterIssue => 
        afterIssue.description === beforeIssue.description
      )
    );
    
    const newIssues = afterReview.issues.filter(afterIssue => 
      !beforeReview.issues.some(beforeIssue => 
        beforeIssue.description === afterIssue.description
      )
    );
    
    return {
      beforeScore: beforeReview.score,
      afterScore: afterReview.score,
      scoreDiff,
      issueDiff,
      suggestionDiff,
      resolvedIssues,
      newIssues,
      isImproved: scoreDiff > 0,
      summary: scoreDiff > 0 
        ? `La calidad del código ha mejorado en ${scoreDiff.toFixed(1)} puntos.` 
        : scoreDiff < 0 
          ? `La calidad del código ha empeorado en ${Math.abs(scoreDiff).toFixed(1)} puntos.` 
          : 'La calidad del código se mantiene igual.'
    };
  }
  
  public async generateReport(filePath: string, options: { includeHistory?: boolean } = {}): Promise<string> {
    // Generar un informe completo de revisión de código
    const history = await this.getReviewHistory(filePath);
    
    if (history.length === 0) {
      return 'No hay revisiones disponibles para este archivo.';
    }
    
    const latestReview = history[history.length - 1];
    let report = this.formatReviewResult(latestReview, filePath);
    
    // Añadir recomendaciones
    const recommendations = await this.generateRecommendations(filePath, latestReview);
    if (recommendations.length > 0) {
      report += `## Recomendaciones Adicionales\n\n`;
      for (const recommendation of recommendations) {
        report += `- ${recommendation}\n`;
      }
      report += `\n`;
    }
    
    // Añadir análisis de tendencias si hay suficientes datos
    if (history.length >= 2) {
      const trends = await this.analyzeReviewTrends(filePath);
      if (trends.hasEnoughData) {
        report += `## Análisis de Tendencias\n\n`;
        report += `- **Cambio de puntuación**: ${trends.scoreChange > 0 ? '+' : ''}${trends.scoreChange.toFixed(1)} puntos\n`;
        report += `- **Cambio en problemas**: ${trends.issueChange > 0 ? '-' : '+'}${Math.abs(trends.issueChange)} problemas\n`;
        report += `- **Tendencia general**: ${trends.message}\n\n`;
      }
    }
    
    // Incluir historial si se solicita
    if (options.includeHistory && history.length > 1) {
      report += `## Historial de Revisiones\n\n`;
      report += `| Fecha | Puntuación | Problemas | Sugerencias | Estado |\n`;
      report += `|-------|------------|-----------|-------------|--------|\n`;
      
      for (const review of history) {
        const date = new Date(review.timestamp || Date.now()).toLocaleDateString();
        report += `| ${date} | ${review.score} | ${review.issues.length} | ${review.suggestions.length} | ${review.isApproved ? '✅' : '❌'} |\n`;
      }
      report += `\n`;
    }
    
    return report;
  }
}