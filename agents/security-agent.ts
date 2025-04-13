import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';
import { AgentEvent } from '../types/agent-event';

/**
 * Security Agent - Analiza y mejora la seguridad del código
 * 
 * Este agente es responsable de:
 * 1. Analizar el código en busca de vulnerabilidades de seguridad
 * 2. Proponer correcciones para problemas de seguridad
 * 3. Implementar mejores prácticas de seguridad
 * 4. Generar configuraciones seguras para autenticación y autorización
 * 5. Revisar dependencias en busca de vulnerabilidades conocidas
 * 6. Integrar con herramientas de análisis de seguridad
 * 7. Validar entradas y sanitizar datos
 * 8. Proteger contra ataques comunes (XSS, CSRF, inyección SQL, etc.)
 */
export class SecurityAgent extends BaseAgent {
  private securityRules: Map<string, any>;
  private vulnerabilityPatterns: Map<string, RegExp[]>;
  private securityTools: Map<string, Function>;
  
  constructor() {
    super('Security Agent');
    this.initializeSecurityRules();
    this.initializeVulnerabilityPatterns();
    this.initializeSecurityTools();
  }
  
  /**
   * Inicializa las reglas de seguridad para diferentes tipos de aplicaciones
   */
  private initializeSecurityRules(): void {
    this.securityRules = new Map();
    
    // Reglas para aplicaciones web
    this.securityRules.set('web', {
      headers: {
        'Content-Security-Policy': "default-src 'self'; script-src 'self' https://trusted-cdn.com",
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
      },
      cookies: {
        secure: true,
        httpOnly: true,
        sameSite: 'strict'
      },
      authentication: {
        passwordMinLength: 12,
        requireMixedCase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        maxLoginAttempts: 5,
        lockoutDuration: 15 // minutos
      }
    });
    
    // Reglas para APIs
    this.securityRules.set('api', {
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100 // solicitudes por ventana
      },
      cors: {
        allowedOrigins: ['https://*.midominio.com'],
        allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        exposedHeaders: ['X-Total-Count'],
        maxAge: 86400, // 24 horas
        credentials: true
      },
      jwt: {
        expiresIn: '1h',
        refreshExpiresIn: '7d',
        algorithm: 'HS256'
      }
    });
    
    // Reglas para aplicaciones móviles
    this.securityRules.set('mobile', {
      storage: {
        sensitiveData: 'encrypted',
        encryptionAlgorithm: 'AES-256',
        useSecureKeystore: true
      },
      network: {
        certificatePinning: true,
        validateSSL: true,
        useHttps: true
      },
      authentication: {
        biometricWhenAvailable: true,
        sessionTimeout: 30, // minutos
        requireReauthForSensitive: true
      }
    });
    
    // Reglas para bases de datos
    this.securityRules.set('database', {
      connection: {
        useSSL: true,
        validateServerCertificate: true,
        connectionTimeout: 30 // segundos
      },
      queries: {
        usePreparedStatements: true,
        validateInputs: true,
        limitResults: true,
        defaultResultLimit: 1000
      },
      credentials: {
        rotationPeriod: 90, // días
        minPasswordLength: 16,
        requireComplexPassword: true
      }
    });
  }
  
  /**
   * Inicializa patrones para detectar vulnerabilidades comunes
   */
  private initializeVulnerabilityPatterns(): void {
    this.vulnerabilityPatterns = new Map();
    
    // Patrones para detectar inyección SQL
    this.vulnerabilityPatterns.set('sqlInjection', [
      /execute\s*\(\s*["'`].*?\$\{.*?["'`]\s*\)/i,
      /query\s*\(\s*["'`].*?\$\{.*?["'`]\s*\)/i,
      /SELECT\s+.*?\s+FROM\s+.*?\s+WHERE\s+.*?=\s*["'`].*?\$\{.*?["'`]/i
    ]);
    
    // Patrones para detectar XSS
    this.vulnerabilityPatterns.set('xss', [
      /innerHTML\s*=\s*.*?\$\{.*?\}/i,
      /document\.write\s*\(\s*.*?\$\{.*?\}\s*\)/i,
      /eval\s*\(\s*.*?\$\{.*?\}\s*\)/i,
      /dangerouslySetInnerHTML\s*=\s*\{\s*__html\s*:\s*.*?\$\{.*?\}\s*\}/i
    ]);
    
    // Patrones para detectar inyección de comandos
    this.vulnerabilityPatterns.set('commandInjection', [
      /exec\s*\(\s*["'`].*?\$\{.*?["'`]\s*\)/i,
      /spawn\s*\(\s*["'`].*?\$\{.*?["'`]\s*\)/i,
      /execSync\s*\(\s*["'`].*?\$\{.*?["'`]\s*\)/i
    ]);
    
    // Patrones para detectar path traversal
    this.vulnerabilityPatterns.set('pathTraversal', [
      /fs\.readFile\s*\(\s*["'`].*?\$\{.*?["'`]\s*\)/i,
      /fs\.writeFile\s*\(\s*["'`].*?\$\{.*?["'`]\s*\)/i,
      /path\.join\s*\(\s*.*?,\s*.*?\$\{.*?\}\s*\)/i
    ]);
    
    // Patrones para detectar secretos hardcodeados
    this.vulnerabilityPatterns.set('hardcodedSecrets', [
      /const\s+.*?(api|secret|key|password|token).*?\s*=\s*["'`][A-Za-z0-9+\/=]{32,}["'`]/i,
      /const\s+.*?(api|secret|key|password|token).*?\s*=\s*["'`][0-9a-f]{32,}["'`]/i
    ]);
  }
  
  /**
   * Inicializa herramientas de seguridad
   */
  private initializeSecurityTools(): void {
    this.securityTools = new Map();
    
    // Herramienta para generar configuraciones de seguridad
    this.securityTools.set('generateConfig', this.generateSecurityConfig.bind(this));
    
    // Herramienta para analizar código en busca de vulnerabilidades
    this.securityTools.set('analyzeCode', this.analyzeCodeForVulnerabilities.bind(this));
    
    // Herramienta para generar middleware de seguridad
    this.securityTools.set('generateMiddleware', this.generateSecurityMiddleware.bind(this));
    
    // Herramienta para verificar dependencias
    this.securityTools.set('checkDependencies', this.checkDependenciesForVulnerabilities.bind(this));
    
    // Herramienta para generar políticas de seguridad
    this.securityTools.set('generatePolicy', this.generateSecurityPolicy.bind(this));
  }
  
  /**
   * Ejecuta el Security Agent para analizar y mejorar la seguridad
   * @param securitySpec Especificación o ruta del código a analizar
   */
  async run(securitySpec: string): Promise<void> {
    console.log(`🔒 Security Agent analizando seguridad para: "${securitySpec}"`);
    
    // Leer contexto relevante
    const coreContext = this.readContext('core.md');
    const rulesContext = this.readContext('rules.md');
    
    // Determinar el tipo de análisis de seguridad
    const securityType = this.determineSecurityType(securitySpec);
    
    // Analizar el código fuente si se proporciona una ruta
    let sourceCode = '';
    if (fs.existsSync(securitySpec)) {
      try {
        sourceCode = fs.readFileSync(securitySpec, 'utf-8');
      } catch (error) {
        console.warn(`⚠️ No se pudo leer el archivo: ${securitySpec}`);
      }
    }
    
    // Crear prompt para el LLM
    const securityPrompt = `
    # Contexto del Proyecto
    ${coreContext.substring(0, 500)}...
    
    # Reglas de Seguridad
    ${rulesContext.substring(0, 500)}...
    
    # Tarea de Seguridad
    Analiza el siguiente código y proporciona recomendaciones de seguridad para el tipo: ${securityType}
    
    \`\`\`
    ${sourceCode.substring(0, 2000)}
    \`\`\`
    
    Proporciona:
    1. Vulnerabilidades identificadas
    2. Correcciones recomendadas
    3. Mejores prácticas a implementar
    4. Configuración de seguridad recomendada
    `;
    
    // Enviar prompt al LLM y procesar respuesta
    try {
      const response = await this.sendToLLM(securityPrompt);
      
      // Procesar la respuesta
      const securityAnalysis = this.processSecurityResponse(response, securityType);
      
      // Generar informe de seguridad
      const securityReport = this.generateSecurityReport(securityAnalysis, securitySpec);
      
      // Guardar informe
      const reportPath = path.join(process.cwd(), 'security-reports', `${path.basename(securitySpec)}.security.md`);
      this.ensureDirectoryExists(path.dirname(reportPath));
      fs.writeFileSync(reportPath, securityReport, 'utf-8');
      
      console.log(`✅ Informe de seguridad generado en: ${reportPath}`);
      
      // Generar código de configuración de seguridad si se solicita
      if (securitySpec.includes('--generate-config')) {
        const configCode = this.generateSecurityConfig(securityType);
        const configPath = path.join(process.cwd(), 'security-config', `${securityType}-security.js`);
        this.ensureDirectoryExists(path.dirname(configPath));
        fs.writeFileSync(configPath, configCode, 'utf-8');
        console.log(`✅ Configuración de seguridad generada en: ${configPath}`);
      }
    } catch (error) {
      console.error(`❌ Error al analizar seguridad: ${error.message}`);
    }
  }
  
  /**
   * Determina el tipo de análisis de seguridad basado en la especificación
   */
  private determineSecurityType(securitySpec: string): string {
    if (securitySpec.includes('--web') || securitySpec.includes('frontend') || securitySpec.endsWith('.html') || securitySpec.endsWith('.jsx') || securitySpec.endsWith('.tsx')) {
      return 'web';
    } else if (securitySpec.includes('--api') || securitySpec.includes('backend') || securitySpec.includes('server') || securitySpec.endsWith('.api.js') || securitySpec.endsWith('.controller.js')) {
      return 'api';
    } else if (securitySpec.includes('--mobile') || securitySpec.includes('android') || securitySpec.includes('ios') || securitySpec.endsWith('.kt') || securitySpec.endsWith('.swift')) {
      return 'mobile';
    } else if (securitySpec.includes('--database') || securitySpec.includes('db') || securitySpec.endsWith('.sql') || securitySpec.includes('repository')) {
      return 'database';
    } else if (securitySpec.includes('--code') || securitySpec.includes('dependencies')) {
      return 'code';
    } else {
      // Por defecto, asumimos que es código general
      return 'code';
    }
  }
  
  /**
   * Procesa la respuesta del LLM para extraer información de seguridad
   */
  private processSecurityResponse(response: string, securityType: string): any {
    // Aquí se procesaría la respuesta del LLM para extraer información estructurada
    // En una implementación real, se analizaría el texto para identificar vulnerabilidades, etc.
    
    // Ejemplo simplificado
    const vulnerabilities = [];
    const recommendations = [];
    
    // Buscar vulnerabilidades en la respuesta
    if (response.includes('inyección SQL') || response.includes('SQL injection')) {
      vulnerabilities.push({
        type: 'SQL Injection',
        severity: 'Alta',
        description: 'Se encontraron posibles puntos de inyección SQL en el código.'
      });
      
      recommendations.push({
        vulnerability: 'SQL Injection',
        solution: 'Utilizar consultas parametrizadas o ORM para todas las operaciones de base de datos.'
      });
    }
    
    if (response.includes('XSS') || response.includes('Cross-site scripting')) {
      vulnerabilities.push({
        type: 'Cross-Site Scripting (XSS)',
        severity: 'Alta',
        description: 'Se encontraron posibles vulnerabilidades XSS en el código.'
      });
      
      recommendations.push({
        vulnerability: 'Cross-Site Scripting (XSS)',
        solution: 'Sanitizar todas las entradas de usuario y utilizar escape de HTML para contenido dinámico.'
      });
    }
    
    // Extraer mejores prácticas mencionadas
    const bestPractices = [];
    if (response.includes('HTTPS') || response.includes('TLS')) {
      bestPractices.push('Utilizar HTTPS para todas las comunicaciones');
    }
    if (response.includes('autenticación') || response.includes('authentication')) {
      bestPractices.push('Implementar autenticación robusta con múltiples factores cuando sea posible');
    }
    if (response.includes('autorización') || response.includes('authorization')) {
      bestPractices.push('Implementar control de acceso basado en roles (RBAC)');
    }
    
    return {
      vulnerabilities,
      recommendations,
      bestPractices,
      securityType
    };
  }
  
  /**
   * Genera un informe de seguridad basado en el análisis
   */
  private generateSecurityReport(securityAnalysis: any, securitySpec: string): string {
    const { vulnerabilities, recommendations, bestPractices, securityType } = securityAnalysis;
    
    let report = `# Informe de Seguridad: ${securitySpec}\n\n`;
    report += `## Resumen\n\n`;
    report += `Este informe presenta un análisis de seguridad para el código en \`${securitySpec}\` (tipo: ${securityType}).\n\n`;
    
    report += `## Vulnerabilidades Identificadas\n\n`;
    if (vulnerabilities.length === 0) {
      report += `No se identificaron vulnerabilidades significativas.\n\n`;
    } else {
      vulnerabilities.forEach((vuln, index) => {
        report += `### ${index + 1}. ${vuln.type} (Severidad: ${vuln.severity})\n\n`;
        report += `${vuln.description}\n\n`;
      });
    }
    
    report += `## Recomendaciones\n\n`;
    if (recommendations.length === 0) {
      report += `No hay recomendaciones específicas.\n\n`;
    } else {
      recommendations.forEach((rec, index) => {
        report += `### ${index + 1}. Para ${rec.vulnerability}\n\n`;
        report += `${rec.solution}\n\n`;
      });
    }
    
    report += `## Mejores Prácticas\n\n`;
    if (bestPractices.length === 0) {
      report += `No hay mejores prácticas específicas para este código.\n\n`;
    } else {
      bestPractices.forEach((practice, index) => {
        report += `${index + 1}. ${practice}\n`;
      });
    }
    
    report += `\n## Configuración de Seguridad Recomendada\n\n`;
    report += `Para implementar las recomendaciones de seguridad, considere utilizar la siguiente configuración:\n\n`;
    report += `\`\`\`javascript\n`;
    report += `// Ejemplo de configuración de seguridad para ${securityType}\n`;
    report += this.generateSecurityConfigSnippet(securityType);
    report += `\`\`\`\n\n`;
    
    report += `## Próximos Pasos\n\n`;
    report += `1. Revisar y aplicar las recomendaciones de seguridad\n`;
    report += `2. Implementar las mejores prácticas sugeridas\n`;
    report += `3. Considerar una auditoría de seguridad más exhaustiva\n`;
    report += `4. Establecer un proceso de revisión de seguridad continua\n\n`;
    
    report += `---\n\n`;
    report += `Informe generado por CJ.DevMind Security Agent el ${new Date().toISOString().split('T')[0]}\n`;
    
    return report;
  }
  
  /**
   * Genera un fragmento de configuración de seguridad basado en el tipo
   */
  private generateSecurityConfigSnippet(securityType: string): string {
    if (securityType === 'web') {
      return `// Configuración de seguridad para aplicaciones web
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

module.exports = function(app) {
  // Configuración de Helmet para cabeceras HTTP seguras
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://trusted-cdn.com"],
        styleSrc: ["'self'", "https://trusted-cdn.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://api.midominio.com"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: 'deny' }
  }));
  
  // Configuración segura de cookies
  app.use(cookieParser());
  app.use((req, res, next) => {
    res.cookie = function(name, value, options) {
      const secureOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        ...options
      };
      return res.cookie(name, value, secureOptions);
    };
    next();
  });
  
  // Limitación de tasa de solicitudes
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 solicitudes por ventana
    message: 'Demasiadas solicitudes, por favor intente de nuevo más tarde.'
  });
  app.use(limiter);
  
  return app;
};`;
    } else if (securityType === 'api') {
      return `// Configuración de seguridad para APIs
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

module.exports = function(app) {
  // Protección básica con Helmet
  app.use(helmet());
  
  // Configuración de CORS
  const allowedOrigins = [
    'https://app.midominio.com',
    'https://admin.midominio.com'
  ];
  
  app.use(cors({
    origin: function(origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400 // 24 horas
  }));
  
  // Limitación de tasa de solicitudes
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 solicitudes por ventana
    message: 'Demasiadas solicitudes, por favor intente de nuevo más tarde.'
  });
  app.use('/api/', apiLimiter);
  
  // Middleware de verificación de JWT
  const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  };
  
  // Middleware de autorización basada en roles
  const authorize = (roles = []) => {
    if (typeof roles === 'string') {
      roles = [roles];
    }
    
    return [
      verifyToken,
      (req, res, next) => {
        if (roles.length && !roles.includes(req.user.role)) {
          return res.status(403).json({ message: 'No autorizado' });
        }
        next();
      }
    ];
  };
  
  // Validadores comunes
  const validators = {
    id: body('id').isInt().toInt(),
    email: body('email').isEmail().normalizeEmail(),
    password: body('password').isLength({ min: 8 }).trim(),
    
    validate: (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  };
  
  return {
    verifyToken,
    authorize,
    validators
  };
};`;
    } else {
      return `// Configuración de seguridad general para código
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Utilidades de seguridad para código
 */
module.exports = {
  /**
   * Genera una clave segura
   * @param {number} length - Longitud de la clave
   * @returns {string} - Clave generada
   */
  generateSecureKey: (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
  },
  
  /**
   * Encripta datos sensibles
   * @param {string} data - Datos a encriptar
   * @param {string} key - Clave de encriptación
   * @returns {string} - Datos encriptados
   */
  encryptData: (data, key) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  },
  
  /**
   * Desencripta datos
   * @param {string} encryptedData - Datos encriptados
   * @param {string} key - Clave de encriptación
   * @returns {string} - Datos desencriptados
   */
  decryptData: (encryptedData, key) => {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },
  
  /**
   * Sanitiza entradas para prevenir inyecciones
   * @param {string} input - Entrada a sanitizar
   * @returns {string} - Entrada sanitizada
   */
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[&<>"']/g, (char) => {
        const entities = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return entities[char];
      });
  },
  
  /**
   * Verifica dependencias en busca de vulnerabilidades
   * @returns {Promise<object>} - Resultado del análisis
   */
  checkDependencies: async () => {
    try {
      const { execSync } = require('child_process');
      const result = execSync('npm audit --json').toString();
      return JSON.parse(result);
    } catch (error) {
      console.error('Error al verificar dependencias:', error);
      return { error: error.message };
    }
  }
};`;
    }
  }
  
  /**
   * Analiza código en busca de vulnerabilidades
   */
  public analyzeCodeForVulnerabilities(sourceCode: string, language: string = 'javascript'): any {
    const vulnerabilities = [];
    
    // Verificar cada tipo de vulnerabilidad
    for (const [vulnType, patterns] of this.vulnerabilityPatterns.entries()) {
      for (const pattern of patterns) {
        const matches = sourceCode.match(pattern);
        if (matches) {
          vulnerabilities.push({
            type: vulnType,
            matches: matches.length,
            lines: this.findMatchingLines(sourceCode, pattern)
          });
          break; // Encontramos al menos una ocurrencia de este tipo
        }
      }
    }
    
    // Análisis específico por lenguaje
    if (language === 'javascript' || language === 'typescript') {
      // Verificar uso de eval
      if (/eval\s*\(/.test(sourceCode)) {
        vulnerabilities.push({
          type: 'unsafeEval',
          description: 'Uso de eval() puede permitir ejecución de código malicioso',
          severity: 'alta'
        });
      }
      
      // Verificar uso de innerHTML
      if (/\.innerHTML\s*=/.test(sourceCode)) {
        vulnerabilities.push({
          type: 'unsafeDOM',
          description: 'Uso de innerHTML puede permitir ataques XSS',
          severity: 'media'
        });
      }
    } else if (language === 'python') {
      // Verificar uso de exec
      if (/exec\s*\(/.test(sourceCode)) {
        vulnerabilities.push({
          type: 'unsafeExec',
          description: 'Uso de exec() puede permitir ejecución de código malicioso',
          severity: 'alta'
        });
      }
    }
    
    return {
      vulnerabilitiesFound: vulnerabilities.length > 0,
      vulnerabilities,
      recommendations: this.generateRecommendations(vulnerabilities)
    };
  }
  
  /**
   * Encuentra las líneas donde ocurren los patrones
   */
  private findMatchingLines(sourceCode: string, pattern: RegExp): number[] {
    const lines = sourceCode.split('\n');
    const matchingLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        matchingLines.push(i + 1); // +1 porque las líneas empiezan en 1, no en 0
      }
    }
    
    return matchingLines;
  }
  
  /**
   * Genera recomendaciones basadas en las vulnerabilidades encontradas
   */
  private generateRecommendations(vulnerabilities: any[]): string[] {
    const recommendations = [];
    
    for (const vuln of vulnerabilities) {
      switch (vuln.type) {
        case 'sqlInjection':
          recommendations.push('Utiliza consultas parametrizadas o un ORM para prevenir inyección SQL');
          recommendations.push('Valida y sanitiza todas las entradas de usuario antes de usarlas en consultas');
          break;
        case 'xss':
          recommendations.push('Utiliza bibliotecas de sanitización como DOMPurify para limpiar datos antes de insertarlos en el DOM');
          recommendations.push('Implementa una Content Security Policy (CSP) estricta');
          recommendations.push('Utiliza el atributo textContent en lugar de innerHTML cuando sea posible');
          break;
        case 'commandInjection':
          recommendations.push('Evita usar exec, spawn o similares con entradas de usuario');
          recommendations.push('Si es necesario, utiliza listas blancas para validar comandos y argumentos');
          recommendations.push('Considera alternativas más seguras como APIs específicas para la funcionalidad requerida');
          break;
        case 'pathTraversal':
          recommendations.push('Normaliza y valida todas las rutas de archivo antes de usarlas');
          recommendations.push('Utiliza path.resolve() para obtener rutas absolutas y verificar que estén dentro de directorios permitidos');
          recommendations.push('Implementa listas blancas para directorios accesibles');
          break;
        case 'hardcodedSecrets':
          recommendations.push('Utiliza variables de entorno o servicios de gestión de secretos para almacenar credenciales');
          recommendations.push('Implementa rotación periódica de credenciales');
          recommendations.push('Considera usar herramientas como Vault o AWS Secrets Manager');
          break;
        case 'unsafeEval':
          recommendations.push('Evita completamente el uso de eval() y Function()');
          recommendations.push('Utiliza alternativas más seguras como JSON.parse() para datos JSON');
          recommendations.push('Si es absolutamente necesario, implementa una sandbox estricta');
          break;
        case 'unsafeDOM':
          recommendations.push('Utiliza métodos más seguros como textContent en lugar de innerHTML');
          recommendations.push('Implementa una Content Security Policy (CSP) estricta');
          recommendations.push('Sanitiza todas las entradas de usuario con DOMPurify o similar');
          break;
        default:
          recommendations.push(`Revisa y refactoriza el código relacionado con ${vuln.type}`);
      }
    }
    
    return recommendations;
  }
  
  /**
   * Genera configuraciones de seguridad para diferentes tipos de aplicaciones
   */
  public generateSecurityConfig(applicationType: string): string {
    const securityRules = this.securityRules.get(applicationType) || this.securityRules.get('web');
    
    let configCode = '';
    
    switch (applicationType) {
      case 'web':
        configCode = `// Configuración de seguridad para aplicaciones web
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const sanitize = require('sanitize-html');

/**
 * Configura middleware de seguridad para aplicaciones web
 * @param {Express} app - Instancia de Express
 * @returns {Express} - Instancia de Express configurada con seguridad
 */
module.exports = function setupSecurity(app) {
  // Configuración de Helmet para cabeceras HTTP seguras
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "${securityRules.headers['Content-Security-Policy'].split(';')[1].split(' ')[2]}"],
        styleSrc: ["'self'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'", "https://api.midominio.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: '${securityRules.headers['Referrer-Policy']}' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    frameguard: { action: '${securityRules.headers['X-Frame-Options']}' }
  }));
  
  // Protección CSRF
  app.use(csrf({ cookie: true }));
  
  // Middleware para incluir token CSRF en las vistas
  app.use(function(req, res, next) {
    res.locals.csrfToken = req.csrfToken();
    next();
  });
  
  // Configuración segura de cookies
  app.use(cookieParser());
  app.use((req, res, next) => {
    res.cookie = function(name, value, options) {
      const secureOptions = {
        httpOnly: ${securityRules.cookies.httpOnly},
        secure: process.env.NODE_ENV === 'production',
        sameSite: '${securityRules.cookies.sameSite}',
        ...options
      };
      return res.cookie(name, value, secureOptions);
    };
    next();
  });
  
  // Limitación de tasa de solicitudes
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 solicitudes por ventana
    message: 'Demasiadas solicitudes, por favor intente de nuevo más tarde.'
  });
  app.use(limiter);
  
  // Middleware de sanitización
  app.use((req, res, next) => {
    if (req.body) {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitize(req.body[key], {
            allowedTags: [],
            allowedAttributes: {}
          });
        }
      }
    }
    next();
  });
  
  // Middleware para validación de contraseñas
  app.use('/api/auth', (req, res, next) => {
    if (req.path === '/register' || req.path === '/change-password') {
      const password = req.body.password;
      if (password && typeof password === 'string') {
        // Validar longitud mínima
        if (password.length < ${securityRules.authentication.passwordMinLength}) {
          return res.status(400).json({ 
            error: 'La contraseña debe tener al menos ${securityRules.authentication.passwordMinLength} caracteres' 
          });
        }
        
        // Validar requisitos de complejidad
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        if (${securityRules.authentication.requireMixedCase} && (!hasUpperCase || !hasLowerCase)) {
          return res.status(400).json({ 
            error: 'La contraseña debe incluir mayúsculas y minúsculas' 
          });
        }
        
        if (${securityRules.authentication.requireNumbers} && !hasNumbers) {
          return res.status(400).json({ 
            error: 'La contraseña debe incluir al menos un número' 
          });
        }
        
        if (${securityRules.authentication.requireSpecialChars} && !hasSpecialChars) {
          return res.status(400).json({ 
            error: 'La contraseña debe incluir al menos un carácter especial' 
          });
        }
      }
    }
    next();
  });
  
  return app;
};`;
        break;
        
      case 'api':
        configCode = `// Configuración de seguridad para APIs
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

/**
 * Configura middleware de seguridad para APIs
 * @param {Express} app - Instancia de Express
 * @returns {Object} - Objeto con middlewares y utilidades de seguridad
 */
module.exports = function setupApiSecurity(app) {
  // Protección básica con Helmet
  app.use(helmet());
  
  // Configuración de CORS
  const allowedOrigins = ${JSON.stringify(securityRules.cors.allowedOrigins)};
  
  app.use(cors({
    origin: function(origin, callback) {
      if (!origin || allowedOrigins.some(pattern => {
        // Soporte para patrones con comodín (*)
        if (pattern.includes('*')) {
          const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
          return regex.test(origin);
        }
        return origin === pattern;
      })) {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    methods: ${JSON.stringify(securityRules.cors.allowedMethods)},
    allowedHeaders: ${JSON.stringify(securityRules.cors.allowedHeaders)},
    exposedHeaders: ${JSON.stringify(securityRules.cors.exposedHeaders || [])},
    credentials: ${securityRules.cors.credentials},
    maxAge: ${securityRules.cors.maxAge} // 24 horas
  }));
  
  // Limitación de tasa de solicitudes
  const apiLimiter = rateLimit({
    windowMs: ${securityRules.rateLimiting.windowMs}, // 15 minutos
    max: ${securityRules.rateLimiting.max}, // solicitudes por ventana
    message: 'Demasiadas solicitudes, por favor intente de nuevo más tarde.'
  });
  app.use('/api/', apiLimiter);
  
  // Middleware de verificación de JWT
  const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No autorizado' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['${securityRules.jwt.algorithm}']
      });
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Token inválido' });
    }
  };
  
  // Middleware de autorización basada en roles
  const authorize = (roles = []) => {
    if (typeof roles === 'string') {
      roles = [roles];
    }
    
    return [
      verifyToken,
      (req, res, next) => {
        if (roles.length && !roles.includes(req.user.role)) {
          return res.status(403).json({ message: 'No autorizado' });
        }
        next();
      }
    ];
  };
  
  // Generador de tokens JWT
  const generateToken = (user) => {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '${securityRules.jwt.expiresIn}'
    });
    
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '${securityRules.jwt.refreshExpiresIn}'
    });
    
    return {
      accessToken,
      refreshToken
    };
  };
  
  // Validadores comunes
  const validators = {
    id: body('id').isInt().toInt(),
    email: body('email').isEmail().normalizeEmail(),
    password: body('password').isLength({ min: 8 }).trim(),
    
    validate: (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  };
  
  return {
    verifyToken,
    authorize,
    validators,
    generateToken
  };
};`;
        break;
        
      case 'mobile':
        configCode = `// Configuración de seguridad para aplicaciones móviles
/**
 * Configuración de seguridad para aplicaciones móviles
 * Implementa buenas prácticas de seguridad para apps nativas
 */
module.exports = {
  /**
   * Configuración para almacenamiento seguro
   */
  storage: {
    /**
     * Configura el almacenamiento seguro para datos sensibles
     * @param {Object} options - Opciones de configuración
     * @returns {Object} - Utilidades de almacenamiento seguro
     */
    configureSecureStorage: (options = {}) => {
      const defaultOptions = {
        sensitiveData: '${securityRules.storage.sensitiveData}',
        encryptionAlgorithm: '${securityRules.storage.encryptionAlgorithm}',
        useSecureKeystore: ${securityRules.storage.useSecureKeystore}
      };
      
      const config = { ...defaultOptions, ...options };
      
      return {
        /**
         * Guarda datos sensibles de forma segura
         * @param {string} key - Clave para los datos
         * @param {any} value - Valor a guardar
         * @returns {Promise<void>}
         */
        saveSecure: async (key, value) => {
          // Implementación específica para la plataforma
          console.log(\`Guardando \${key} de forma segura usando \${config.encryptionAlgorithm}\`);
        },
        
        /**
         * Recupera datos sensibles
         * @param {string} key - Clave para los datos
         * @returns {Promise<any>} - Datos recuperados
         */
        getSecure: async (key) => {
          // Implementación específica para la plataforma
          console.log(\`Recuperando \${key} de forma segura\`);
          return null;
        },
        
        /**
         * Elimina datos sensibles
         * @param {string} key - Clave para los datos
         * @returns {Promise<void>}
         */
        removeSecure: async (key) => {
          // Implementación específica para la plataforma
          console.log(\`Eliminando \${key} de forma segura\`);
        }
      };
    }
  },
  
  /**
   * Configuración para comunicaciones de red seguras
   */
  network: {
    /**
     * Configura cliente HTTP seguro
     * @param {Object} options - Opciones de configuración
     * @returns {Object} - Cliente HTTP seguro
     */
    configureSecureClient: (options = {}) => {
      const defaultOptions = {
        certificatePinning: ${securityRules.network.certificatePinning},
        validateSSL: ${securityRules.network.validateSSL},
        useHttps: ${securityRules.network.useHttps},
        timeout: 30000 // 30 segundos
      };
      
      const config = { ...defaultOptions, ...options };
      
      return {
        /**
         * Realiza una petición HTTP segura
         * @param {string} url - URL de la petición
         * @param {Object} options - Opciones de la petición
         * @returns {Promise<Object>} - Respuesta de la petición
         */
        request: async (url, options = {}) => {
          // Verificar HTTPS
          if (config.useHttps && !url.startsWith('https://')) {
            throw new Error('Solo se permiten conexiones HTTPS');
          }
          
          // Implementación específica para la plataforma
          console.log(\`Realizando petición segura a \${url}\`);
          return { status: 200, data: {} };
        }
      };
    }
  },
  
  /**
   * Configuración para autenticación segura
   */
  authentication: {
    /**
     * Configura autenticación segura
     * @param {Object} options - Opciones de configuración
     * @returns {Object} - Utilidades de autenticación segura
     */
    configureAuth: (options = {}) => {
      const defaultOptions = {
        biometricWhenAvailable: ${securityRules.authentication.biometricWhenAvailable},
        sessionTimeout: ${securityRules.authentication.sessionTimeout}, // minutos
        requireReauthForSensitive: ${securityRules.authentication.requireReauthForSensitive}
      };
      
      const config = { ...defaultOptions, ...options };
      
      return {
        /**
         * Inicia sesión de forma segura
         * @param {Object} credentials - Credenciales de usuario
         * @returns {Promise<Object>} - Información de sesión
         */
        login: async (credentials) => {
          // Implementación específica para la plataforma
          console.log('Iniciando sesión de forma segura');
          return { token: 'secure-token', expiresAt: Date.now() + (config.sessionTimeout * 60 * 1000) };
        },
        
        /**
         * Verifica si se requiere reautenticación
         * @param {string} action - Acción a realizar
         * @returns {Promise<boolean>} - True si se requiere reautenticación
         */
        requiresReauth: async (action) => {
          if (config.requireReauthForSensitive && ['payment', 'deleteAccount', 'changePassword'].includes(action)) {
            return true;
          }
          return false;
        }
      };
    }
  }
};`;
        break;
        
      case 'database':
        configCode = `// Configuración de seguridad para bases de datos
/**
 * Configuración de seguridad para conexiones y operaciones de base de datos
 */
module.exports = {
  /**
   * Configura conexión segura a base de datos
   * @param {Object} options - Opciones de configuración
   * @returns {Object} - Configuración de conexión segura
   */
  configureSecureConnection: (options = {}) => {
    const defaultOptions = {
      useSSL: ${securityRules.connection.useSSL},
      validateServerCertificate: ${securityRules.connection.validateServerCertificate},
      connectionTimeout: ${securityRules.connection.connectionTimeout} // segundos
    };
    
    return { ...defaultOptions, ...options };
  },
  
  /**
   * Configura operaciones seguras de base de datos
   * @returns {Object} - Utilidades para operaciones seguras
   */
  secureOperations: () => {
    return {
      /**
       * Crea una consulta parametrizada segura
       * @param {string} query - Consulta SQL con placeholders
       * @param {Array} params - Parámetros para la consulta
       * @returns {Object} - Consulta parametrizada segura
       */
      prepareQuery: (query, params = []) => {
        // Validar que la consulta use placeholders
        if (params.length > 0 && !query.includes('?') && !query.includes('$')) {
          throw new Error('La consulta debe usar placeholders para parámetros');
        }
        
        return {
          query,
          params,
          usePreparedStatement: ${securityRules.queries.usePreparedStatements}
        };
      },
      
      /**
       * Valida y sanitiza entradas para consultas
       * @param {any} input - Entrada a validar
       * @param {string} type - Tipo esperado
       * @returns {any} - Entrada validada y sanitizada
       */
      validateInput: (input, type) => {
        if (!${securityRules.queries.validateInputs}) {
          return input;
        }
        
        switch (type) {
          case 'string':
            if (typeof input !== 'string') {
              throw new Error('Se esperaba una cadena de texto');
            }
            // Sanitizar cadena
            return input.replace(/[\\\\'"]/g, '\\\\$&');
            
          case 'number':
            if (typeof input !== 'number' && isNaN(Number(input))) {
              throw new Error('Se esperaba un número');
            }
            return Number(input);
            
          case 'boolean':
            return Boolean(input);
            
          case 'date':
            const date = new Date(input);
            if (isNaN(date.getTime())) {
              throw new Error('Se esperaba una fecha válida');
            }
            return date;
            
          default:
            return input;
        }
      },
      
      /**
       * Limita los resultados de una consulta
       * @param {Object} queryOptions - Opciones de consulta
       * @returns {Object} - Opciones de consulta con límite
       */
      limitResults: (queryOptions) => {
        if (!${securityRules.queries.limitResults}) {
          return queryOptions;
        }
        
        const limit = queryOptions.limit || ${securityRules.queries.defaultResultLimit};
        return {
          ...queryOptions,
          limit: Math.min(limit, ${securityRules.queries.defaultResultLimit})
        };
      }
    };
  },
  
  /**
   * Gestión segura de credenciales de base de datos
   */
  credentialManager: {
    /**
     * Genera una contraseña segura para base de datos
     * @returns {string} - Contraseña segura
     */
    generateSecurePassword: () => {
      const crypto = require('crypto');
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~\`|}{[]:;?><,./-=';
      let password = '';
      
      // Generar contraseña aleatoria
      for (let i = 0; i < ${securityRules.credentials.minPasswordLength}; i++) {
        const randomIndex = crypto.randomInt(0, chars.length);
        password += chars.charAt(randomIndex);
      }
      
      return password;
    },
    
    /**
     * Verifica si una contraseña cumple con los requisitos de seguridad
     * @param {string} password - Contraseña a verificar
     * @returns {boolean} - True si la contraseña es segura
     */
    isPasswordSecure: (password) => {
      if (typeof password !== 'string') return false;
      
      // Verificar longitud mínima
      if (password.length < ${securityRules.credentials.minPasswordLength}) return false;
      
      if (${securityRules.credentials.requireComplexPassword}) {
        // Verificar complejidad
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /[0-9]/.test(password);
        const hasSpecialChars = /[!@#$%^&*()_+~\`|}{[]:;?><,./-=]/.test(password);
        
        return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChars;
      }
      
      return true;
    }
  }
};`;
        break;
        
      default:
        configCode = `// Configuración de seguridad general para código
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Utilidades de seguridad para código
 */
module.exports = {
  /**
   * Genera una clave segura
   * @param {number} length - Longitud de la clave
   * @returns {string} - Clave generada
   */
  generateSecureKey: (length = 32) => {
    return crypto.randomBytes(length).toString('hex');
  },
  
  /**
   * Encripta datos sensibles
   * @param {string} data - Datos a encriptar
   * @param {string} key - Clave de encriptación
   * @returns {string} - Datos encriptados
   */
  encryptData: (data, key) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  },
  
  /**
   * Desencripta datos
   * @param {string} encryptedData - Datos encriptados
   * @param {string} key - Clave de encriptación
   * @returns {string} - Datos desencriptados
   */
  decryptData: (encryptedData, key) => {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  },
  
  /**
   * Sanitiza entradas para prevenir inyecciones
   * @param {string} input - Entrada a sanitizar
   * @returns {string} - Entrada sanitizada
   */
  sanitizeInput: (input) => {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[&<>"']/g, (char) => {
        const entities = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return entities[char];
      });
  },
  
  /**
   * Verifica dependencias en busca de vulnerabilidades
   * @returns {Promise<object>} - Resultado del análisis
   */
  checkDependencies: async () => {
    try {
      const { execSync } = require('child_process');
      const result = execSync('npm audit --json').toString();
      return JSON.parse(result);
    } catch (error) {
      console.error('Error al verificar dependencias:', error);
      return { error: error.message };
    }
  }
};`;
    }
    
    return configCode;
  }
  
  /**
   * Genera middleware de seguridad para diferentes frameworks
   */
  public generateSecurityMiddleware(framework: string): string {
    let middleware = '';
    
    switch (framework.toLowerCase()) {
      case 'express':
        middleware = `// Middleware de seguridad para Express
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const csrf = require('csurf');
const sanitize = require('sanitize-html');

/**
 * Configura middleware de seguridad para Express
 * @param {Express} app - Instancia de Express
 * @returns {Express} - Instancia de Express configurada con seguridad
 */
module.exports = function(app) {
  // Protección de cabeceras HTTP
  app.use(helmet());
  
  // Configuración de CORS
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  }));
  
  // Protección CSRF para rutas no API
  app.use((req, res, next) => {
    if (!req.path.startsWith('/api/')) {
      return csrf({ cookie: true })(req, res, next);
    }
    next();
  });
  
  // Limitación de tasa de solicitudes
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 solicitudes por ventana
    message: 'Demasiadas solicitudes, por favor intente de nuevo más tarde.'
  });
  app.use('/api/', apiLimiter);
  
  // Middleware de sanitización
  app.use((req, res, next) => {
    if (req.body) {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitize(req.body[key], {
            allowedTags: [],
            allowedAttributes: {}
          });
        }
      }
    }
    next();
  });
  
  // Middleware de validación de entrada
  app.use((req, res, next) => {
    const originalSend = res.send;
    res.send = function(body) {
      // Sanitizar respuestas HTML
      if (typeof body === 'string' && res.get('Content-Type')?.includes('text/html')) {
        body = sanitize(body, {
          allowedTags: sanitize.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3']),
          allowedAttributes: {
            'a': ['href', 'name', 'target'],
            'img': ['src', 'alt', 'title', 'width', 'height']
          }
        });
      }
      return originalSend.call(this, body);
    };
    next();
  });
  
  return app;
};`;
        break;
        
      case 'nestjs':
        middleware = `// Middleware de seguridad para NestJS
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import * as cors from 'cors';
import * as sanitize from 'sanitize-html';

/**
 * Middleware de seguridad para NestJS
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(private configService: ConfigService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Aplicar Helmet para cabeceras de seguridad
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://trusted-cdn.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"]
        }
      },
      xssFilter: true,
      noSniff: true,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      frameguard: { action: 'deny' }
    })(req, res, next);
  }
}

/**
 * Módulo de seguridad para NestJS
 */
@Module({
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
  exports: [],
  controllers: []
})
export class SecurityModule {
  static forRoot(options?: any): DynamicModule {
    return {
      module: SecurityModule,
      providers: [
        {
          provide: 'SECURITY_OPTIONS',
          useValue: options || {}
        }
      ],
      exports: []
    };
  }

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecurityMiddleware)
      .forRoutes('*');
  }
}

/**
 * Middleware de seguridad para Fastify
 */
export function configureFastifySecurity(fastify: any, options: any = {}) {
  // Registrar plugins de seguridad
  fastify.register(require('fastify-helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://trusted-cdn.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    }
  });

  // Registrar CORS
  fastify.register(require('fastify-cors'), {
    origin: options.allowedOrigins || '*',
    methods: options.allowedMethods || ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    credentials: options.credentials || true
  });

  // Registrar rate limiting
  fastify.register(require('fastify-rate-limit'), {
    max: options.maxRequests || 100,
    timeWindow: options.timeWindow || '15 minutes'
  });

  // Hook para sanitización de entrada
  fastify.addHook('preValidation', async (request, reply) => {
    if (request.body && typeof request.body === 'object') {
      for (const key in request.body) {
        if (typeof request.body[key] === 'string') {
          request.body[key] = sanitizeInput(request.body[key]);
        }
      }
    }
    return;
  });

  // Función de sanitización
  function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[&<>"']/g, (char) => {
        const entities = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return entities[char];
      });
  }

  return fastify;
}

/**
 * Middleware de seguridad para Koa
 */
export function configureKoaSecurity(app: any, options: any = {}) {
  // Helmet para cabeceras de seguridad
  app.use(require('koa-helmet')({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://trusted-cdn.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"]
      }
    }
  }));

  // CORS
  app.use(require('@koa/cors')({
    origin: options.allowedOrigins || '*',
    allowMethods: options.allowedMethods || ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
    credentials: options.credentials || true
  }));

  // Rate limiting
  app.use(require('koa-ratelimit')({
    driver: 'memory',
    db: new Map(),
    duration: options.duration || 60000, // 1 minuto
    max: options.maxRequests || 100,
    errorMessage: 'Demasiadas solicitudes, por favor intente de nuevo más tarde.'
  }));

  // Middleware de sanitización
  app.use(async (ctx, next) => {
    if (ctx.request.body) {
      for (const key in ctx.request.body) {
        if (typeof ctx.request.body[key] === 'string') {
          ctx.request.body[key] = sanitizeInput(ctx.request.body[key]);
        }
      }
    }
    await next();
  });

  // Función de sanitización
  function sanitizeInput(input: string): string {
    if (typeof input !== 'string') return input;
    return input
      .replace(/[&<>"']/g, (char) => {
        const entities = {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;'
        };
        return entities[char];
      });
  }

  return app;
}

/**
 * Genera configuraciones de seguridad para aplicaciones React
 */
public generateReactSecurityConfig(): string {
  return `// Configuración de seguridad para React
import { useState, useEffect, createContext, useContext } from 'react';
import DOMPurify from 'dompurify';

/**
 * Contexto de seguridad para React
 */
const SecurityContext = createContext({
  sanitize: (content) => content,
  validateInput: (input, type) => input,
  secureLocalStorage: {
    getItem: (key) => null,
    setItem: (key, value) => {},
    removeItem: (key) => {}
  }
});

/**
 * Proveedor de seguridad para React
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} - Proveedor de seguridad
 */
export const SecurityProvider = ({ children }) => {
  // Función para sanitizar contenido HTML
  const sanitize = (content) => {
    if (typeof content !== 'string') return content;
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target', 'rel']
    });
  };

  // Función para validar entradas
  const validateInput = (input, type) => {
    switch (type) {
      case 'email':
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
        return emailRegex.test(input) ? input : '';
      case 'url':
        try {
          const url = new URL(input);
          return url.protocol === 'http:' || url.protocol === 'https:' ? input : '';
        } catch {
          return '';
        }
      case 'number':
        return isNaN(Number(input)) ? 0 : Number(input);
      case 'text':
        return typeof input === 'string' ? input.trim() : '';
      default:
        return input;
    }
  };

  // Almacenamiento local seguro
  const secureLocalStorage = {
    // Obtener elemento con verificación de integridad
    getItem: (key) => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const [data, hash] = item.split('|');
        const calculatedHash = btoa(encodeURIComponent(data)).slice(0, 10);
        
        // Verificar integridad
        if (hash !== calculatedHash) {
          console.warn('Posible manipulación de datos detectada');
          localStorage.removeItem(key);
          return null;
        }
        
        return JSON.parse(decodeURIComponent(atob(data)));
      } catch (error) {
        console.error('Error al recuperar datos:', error);
        return null;
      }
    },
    
    // Guardar elemento con hash de integridad
    setItem: (key, value) => {
      try {
        const data = btoa(encodeURIComponent(JSON.stringify(value)));
        const hash = data.slice(0, 10);
        localStorage.setItem(key, \`\${data}|\${hash}\`);
      } catch (error) {
        console.error('Error al guardar datos:', error);
      }
    },
    
    // Eliminar elemento
    removeItem: (key) => {
      localStorage.removeItem(key);
    }
  };

  const securityValue = {
    sanitize,
    validateInput,
    secureLocalStorage
  };

  return (
    <SecurityContext.Provider value={securityValue}>
      {children}
    </SecurityContext.Provider>
  );
};

/**
 * Hook para usar el contexto de seguridad
 * @returns {Object} - Funciones de seguridad
 */
export const useSecurity = () => useContext(SecurityContext);

/**
 * HOC para proteger rutas que requieren autenticación
 * @param {Component} Component - Componente a proteger
 * @returns {Component} - Componente protegido
 */
export const withAuthentication = (Component) => {
  return (props) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { secureLocalStorage } = useSecurity();

    useEffect(() => {
      // Verificar autenticación
      const checkAuth = async () => {
        const token = secureLocalStorage.getItem('authToken');
        
        if (!token) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        try {
          // Verificar token con el servidor
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': \`Bearer \${token}\`
            }
          });
          
          if (response.ok) {
            setIsAuthenticated(true);
          } else {
            // Token inválido, eliminar
            secureLocalStorage.removeItem('authToken');
            setIsAuthenticated(false);
          }
        } catch (error) {
          console.error('Error al verificar autenticación:', error);
          setIsAuthenticated(false);
        } finally {
          setIsLoading(false);
        }
      };
      
      checkAuth();
    }, []);

    if (isLoading) {
      return <div>Cargando...</div>;
    }

    if (!isAuthenticated) {
      // Redirigir a login
      window.location.href = '/login';
      return null;
    }

    return <Component {...props} />;
  };
};

/**
 * Componente para renderizar HTML sanitizado
 * @param {Object} props - Propiedades del componente
 * @returns {JSX.Element} - Componente de HTML sanitizado
 */
export const SanitizedHTML = ({ html, ...props }) => {
  const { sanitize } = useSecurity();
  return <div dangerouslySetInnerHTML={{ __html: sanitize(html) }} {...props} />;
};

/**
 * Hook para validar formularios con seguridad
 * @param {Object} initialValues - Valores iniciales del formulario
 * @param {Function} validate - Función de validación
 * @returns {Object} - Estado y funciones del formulario
 */
export const useSecureForm = (initialValues, validate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const { validateInput } = useSecurity();

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Validar y sanitizar entrada según el tipo
    const inputType = type === 'email' ? 'email' : 
                      type === 'url' ? 'url' : 
                      type === 'number' ? 'number' : 'text';
    
    const sanitizedValue = validateInput(value, inputType);
    
    setValues({
      ...values,
      [name]: sanitizedValue
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({
      ...touched,
      [name]: true
    });
  };

  const handleSubmit = (callback) => (e) => {
    e.preventDefault();
    
    // Validar todos los campos
    const validationErrors = validate(values);
    setErrors(validationErrors);
    
    // Marcar todos los campos como tocados
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setTouched(allTouched);
    
    // Si no hay errores, ejecutar callback
    if (Object.keys(validationErrors).length === 0) {
      callback(values);
    }
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit
  };
};
`;
}

/**
 * Genera configuraciones de seguridad para aplicaciones Vue
 */
public generateVueSecurityConfig(): string {
  return `// Configuración de seguridad para Vue
import { reactive, provide, inject, readonly } from 'vue';
import DOMPurify from 'dompurify';

/**
 * Clave para el proveedor de seguridad
 */
const SecuritySymbol = Symbol();

/**
 * Proveedor de seguridad para Vue
 * @param {Object} app - Instancia de la aplicación Vue
 * @returns {Object} - Funciones de seguridad
 */
export function createSecurityProvider(app) {
  // Estado de seguridad
  const state = reactive({
    isAuthenticated: false,
    user: null,
    permissions: []
  });

  // Función para sanitizar contenido HTML
  const sanitize = (content) => {
    if (typeof content !== 'string') return content;
    return DOMPurify.sanitize(content, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target', 'rel']
    });
  };

  // Función para validar entradas
  const validateInput = (input, type) => {
    switch (type) {
      case 'email':
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
        return emailRegex.test(input) ? input : '';
      case 'url':
        try {
          const url = new URL(input);
          return url.protocol === 'http:' || url.protocol === 'https:' ? input : '';
        } catch {
          return '';
        }
      case 'number':
        return isNaN(Number(input)) ? 0 : Number(input);
      case 'text':
        return typeof input === 'string' ? input.trim() : '';
      default:
        return input;
    }
  };

  // Almacenamiento local seguro
  const secureLocalStorage = {
    // Obtener elemento con verificación de integridad
    getItem: (key) => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const [data, hash] = item.split('|');
        const calculatedHash = btoa(encodeURIComponent(data)).slice(0, 10);
        
        // Verificar integridad
        if (hash !== calculatedHash) {
          console.warn('Posible manipulación de datos detectada');
          localStorage.removeItem(key);
          return null;
        }
        
        return JSON.parse(decodeURIComponent(atob(data)));
      } catch (error) {
        console.error('Error al recuperar datos:', error);
        return null;
      }
    },
    
    // Guardar elemento con hash de integridad
    setItem: (key, value) => {
      try {
        const data = btoa(encodeURIComponent(JSON.stringify(value)));
        const hash = data.slice(0, 10);
        localStorage.setItem(key, \`\${data}|\${hash}\`);
      } catch (error) {
        console.error('Error al guardar datos:', error);
      }
    },
    
    // Eliminar elemento
    removeItem: (key) => {
      localStorage.removeItem(key);
    }
  };

  // Verificar autenticación
  const checkAuth = async () => {
    const token = secureLocalStorage.getItem('authToken');
    
    if (!token) {
      state.isAuthenticated = false;
      state.user = null;
      state.permissions = [];
      return false;
    }
    
    try {
      // Verificar token con el servidor
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${token}\`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        state.isAuthenticated = true;
        state.user = data.user;
        state.permissions = data.permissions || [];
        return true;
      } else {
        // Token inválido, eliminar
        secureLocalStorage.removeItem('authToken');
        state.isAuthenticated = false;
        state.user = null;
        state.permissions = [];
        return false;
      }
    } catch (error) {
      console.error('Error al verificar autenticación:', error);
      state.isAuthenticated = false;
      state.user = null;
      state.permissions = [];
      return false;
    }
  };

  // Verificar permiso
  const hasPermission = (permission) => {
    return state.permissions.includes(permission);
  };

  // Directiva para sanitizar HTML
  const vSanitize = {
    mounted(el, binding) {
      el.innerHTML = sanitize(binding.value);
    },
    updated(el, binding) {
      el.innerHTML = sanitize(binding.value);
    }
  };

  // Registrar directiva
  if (app) {
    app.directive('sanitize', vSanitize);
  }

  // Crear proveedor
  const security = {
    state: readonly(state),
    sanitize,
    validateInput,
    secureLocalStorage,
    checkAuth,
    hasPermission
  };

  // Proporcionar a la aplicación
  if (app) {
    app.provide(SecuritySymbol, security);
  }

  return security;
}

/**
 * Hook para usar el proveedor de seguridad
 * @returns {Object} - Funciones de seguridad
 */
export function useSecurity() {
  const security = inject(SecuritySymbol);
  if (!security) {
    throw new Error('useSecurity debe usarse dentro de un componente con SecurityProvider');
  }
  return security;
}

/**
 * Plugin de seguridad para Vue
 */
export const SecurityPlugin = {
  install(app) {
    const security = createSecurityProvider(app);
    
    // Agregar a la instancia global
    app.config.globalProperties.$security = security;
  }
};

/**
 * Componente para renderizar HTML sanitizado
 */
export const SanitizedHTML = {
  props: {
    html: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const { sanitize } = useSecurity();
    return { sanitizedHtml: sanitize(props.html) };
  },
  template: \`<div v-html="sanitizedHtml"></div>\`
};
`;
}

/**
 * Genera configuraciones de seguridad para aplicaciones Angular
 */
public generateAngularSecurityConfig(): string {
  return `// Configuración de seguridad para Angular
import { Injectable, NgModule, Pipe, PipeTransform } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Servicio de seguridad para Angular
 */
@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Sanitiza contenido HTML
   * @param {string} content - Contenido a sanitizar
   * @returns {SafeHtml} - Contenido sanitizado
   */
  sanitize(content: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(content);
  }

  /**
   * Valida entradas según su tipo
   * @param {any} input - Entrada a validar
   * @param {string} type - Tipo de entrada
   * @returns {any} - Entrada validada
   */
  validateInput(input: any, type: string): any {
    switch (type) {
      case 'email':
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
        return emailRegex.test(input) ? input : '';
      case 'url':
        try {
          const url = new URL(input);
          return url.protocol === 'http:' || url.protocol === 'https:' ? input : '';
        } catch {
          return '';
        }
      case 'number':
        return isNaN(Number(input)) ? 0 : Number(input);
      case 'text':
        return typeof input === 'string' ? input.trim() : '';
      default:
        return input;
    }
  }

  /**
   * Almacenamiento local seguro
   */
  secureLocalStorage = {
    // Obtener elemento con verificación de integridad
    getItem: (key: string): any => {
      try {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const [data, hash] = item.split('|');
        const calculatedHash = btoa(encodeURIComponent(data)).slice(0, 10);
        
        // Verificar integridad
        if (hash !== calculatedHash) {
          console.warn('Posible manipulación de datos detectada');
          localStorage.removeItem(key);
          return null;
        }
        
        return JSON.parse(decodeURIComponent(atob(data)));
      } catch (error) {
        console.error('Error al recuperar datos:', error);
        return null;
      }
    },
    
    // Guardar elemento con hash de integridad
    setItem: (key: string, value: any): void => {
      try {
        const data = btoa(encodeURIComponent(JSON.stringify(value)));
        const hash = data.slice(0, 10);
        localStorage.setItem(key, \`\${data}|\${hash}\`);
      } catch (error) {
        console.error('Error al guardar datos:', error);
      }
    },
    
    // Eliminar elemento
    removeItem: (key: string): void => {
      localStorage.removeItem(key);
    }
  };

  /**
   * Verifica si una URL es segura
   * @param {string} url - URL a verificar
   * @returns {boolean} - True si la URL es segura
   */
  isUrlSafe(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return (
        parsedUrl.protocol === 'http:' || 
        parsedUrl.protocol === 'https:' || 
        parsedUrl.protocol === 'mailto:' || 
        parsedUrl.protocol === 'tel:'
      );
    } catch {
      return false;
    }
  }
}

/**
 * Interceptor para agregar cabeceras de seguridad
 */
@Injectable()
export class SecurityInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Agregar cabeceras de seguridad
    const secureRequest = request.clone({
      setHeaders: {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
      }
    });

    return next.handle(secureRequest);
  }
}

/**
 * Pipe para sanitizar HTML
 */
@Pipe({
  name: 'sanitizeHtml'
})
export class SanitizeHtmlPipe implements PipeTransform {
  constructor(private securityService: SecurityService) {}

  transform(value: string): SafeHtml {
    return this.securityService.sanitize(value);
  }
}

/**
 * Módulo de seguridad para Angular
 */
@NgModule({
  declarations: [
    SanitizeHtmlPipe
  ],
  exports: [
    SanitizeHtmlPipe
  ],
  providers: [
    SecurityService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: SecurityInterceptor,
      multi: true
    }
  ]
})
export class SecurityModule {}

/**
 * Guardia para proteger rutas que requieren autenticación
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private securityService: SecurityService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    const token = this.securityService.secureLocalStorage.getItem('authToken');
    
    if (!token) {
      return this.router.parseUrl('/login');
    }
    
    // Verificar permisos si se especifican
    const requiredPermission = route.data['permission'];
    if (requiredPermission) {
      const userPermissions = this.securityService.secureLocalStorage.getItem('permissions') || [];
      if (!userPermissions.includes(requiredPermission)) {
        return this.router.parseUrl('/unauthorized');
      }
    }
    
    return true;
  }
}
`;
}
}