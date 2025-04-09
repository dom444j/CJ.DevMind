import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';

/**
 * Security Agent - Analiza y mejora la seguridad del código
 * 
 * Este agente es responsable de:
 * 1. Analizar el código en busca de vulnerabilidades de seguridad
 * 2. Proponer correcciones para problemas de seguridad
 * 3. Implementar mejores prácticas de seguridad
 * 4. Generar configuraciones seguras para autenticación y autorización
 * 5. Revisar dependencias en busca de vulnerabilidades conocidas
 */
export class SecurityAgent extends BaseAgent {
  constructor() {
    super('Security Agent');
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
    ${coreContext}
    
    # Reglas Arquitectónicas
    ${rulesContext}
    
    # Tarea de Security Agent
    Actúa como el Security Agent de CJ.DevMind. Tu tarea es analizar y mejorar la seguridad basada en la siguiente especificación:
    
    "${securitySpec}"
    
    Tipo de análisis: ${securityType}
    
    ${sourceCode ? '# Código Fuente a Analizar\n```\n' + sourceCode + '\n```\n' : ''}
    
    Genera:
    1. Análisis de vulnerabilidades de seguridad
    2. Correcciones recomendadas para problemas encontrados
    3. Configuraciones seguras para ${securityType === 'auth' ? 'autenticación y autorización' : securityType === 'api' ? 'APIs y endpoints' : 'código y dependencias'}
    4. Mejores prácticas de seguridad a implementar
    
    El análisis debe ser exhaustivo, identificando tanto vulnerabilidades comunes como específicas del contexto.
    `;
    
    // En modo real, consultaríamos al LLM
    let securityAnalysis, securityFixes, securityConfig;
    
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      try {
        const result = await this.queryLLM(securityPrompt);
        
        // Extraer las diferentes partes de la respuesta
        securityAnalysis = this.extractSection(result, 'Análisis de Vulnerabilidades');
        securityFixes = this.extractSection(result, 'Correcciones Recomendadas');
        securityConfig = this.extractCodeBlock(result, 'config');
        
        // Guardar los archivos generados
        this.saveSecurityFiles(securitySpec, securityType, securityAnalysis, securityFixes, securityConfig);
      } catch (error) {
        console.error('❌ Error analizando seguridad:', error);
        return;
      }
    } else {
      // Modo simulado para desarrollo
      console.log('🧪 Ejecutando en modo simulado');
      
      // Generar archivos simulados
      securityAnalysis = this.generateSimulatedSecurityAnalysis(securitySpec, securityType);
      securityFixes = this.generateSimulatedSecurityFixes(securityType);
      securityConfig = this.generateSimulatedSecurityConfig(securityType);
      
      // Guardar los archivos simulados
      this.saveSecurityFiles(securitySpec, securityType, securityAnalysis, securityFixes, securityConfig);
    }
    
    // Mostrar resultado
    console.log('\n✅ Análisis de seguridad completado con éxito:');
    console.log('- security-analysis.md');
    console.log('- security-fixes.md');
    console.log('- security-config.js');
  }
  
  /**
   * Determina el tipo de análisis de seguridad basado en la especificación
   */
  private determineSecurityType(securitySpec: string): 'auth' | 'api' | 'code' {
    const authKeywords = ['autenticación', 'authentication', 'autorización', 'authorization', 'login', 'jwt', 'oauth', 'permisos', 'permissions'];
    const apiKeywords = ['api', 'endpoint', 'rest', 'graphql', 'http', 'https', 'servicio', 'service', 'microservicio', 'microservice'];
    const codeKeywords = ['código', 'code', 'dependencias', 'dependencies', 'vulnerabilidad', 'vulnerability', 'inyección', 'injection', 'xss', 'csrf'];
    
    const lowerSpec = securitySpec.toLowerCase();
    
    // Contar ocurrencias de palabras clave
    const authCount = authKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    const apiCount = apiKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    const codeCount = codeKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    
    // Determinar el tipo basado en la mayor cantidad de palabras clave
    if (authCount > apiCount && authCount > codeCount) {
      return 'auth';
    } else if (apiCount > codeCount) {
      return 'api';
    } else {
      return 'code';
    }
  }
  
  /**
   * Extrae una sección específica de la respuesta del LLM
   */
  private extractSection(text: string, sectionTitle: string): string {
    const regex = new RegExp(`## ${sectionTitle}([\\s\\S]*?)(?:## |$)`, 'i');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }
  
  /**
   * Extrae bloques de código de la respuesta del LLM
   */
  private extractCodeBlock(text: string, type: string): string {
    const regex = /```(?:js|javascript|typescript|ts)([^`]+)```/g;
    const matches = [...text.matchAll(regex)];
    
    // Buscar el bloque que corresponde al tipo
    for (const match of matches) {
      const code = match[1].trim();
      if (code.includes(type) || code.includes(type.replace('s', ''))) {
        return code;
      }
    }
    
    // Si no se encuentra un bloque específico, devolver el primero
    return matches.length > 0 ? matches[0][1].trim() : '';
  }
  
  /**
   * Guarda los archivos de análisis de seguridad
   */
  private saveSecurityFiles(
    securitySpec: string,
    securityType: 'auth' | 'api' | 'code',
    securityAnalysis: string,
    securityFixes: string,
    securityConfig: string
  ): void {
    // Crear directorio si no existe
    const securityDir = path.join(process.cwd(), 'security');
    
    if (!fs.existsSync(securityDir)) {
      fs.mkdirSync(securityDir, { recursive: true });
    }
    
    // Guardar archivos
    fs.writeFileSync(path.join(securityDir, 'security-analysis.md'), 
      `# Análisis de Seguridad: ${securitySpec}\n\n${securityAnalysis}`, 'utf-8');
    
    fs.writeFileSync(path.join(securityDir, 'security-fixes.md'), 
      `# Correcciones de Seguridad Recomendadas\n\n${securityFixes}`, 'utf-8');
    
    fs.writeFileSync(path.join(securityDir, 'security-config.js'), securityConfig, 'utf-8');
  }
  
  /**
   * Genera análisis de seguridad simulado
   */
  private generateSimulatedSecurityAnalysis(securitySpec: string, securityType: 'auth' | 'api' | 'code'): string {
    if (securityType === 'auth') {
      return `## Vulnerabilidades en el Sistema de Autenticación

### 1. Almacenamiento Inseguro de Contraseñas
**Severidad: Alta**

El sistema está almacenando contraseñas utilizando hash MD5, que es considerado inseguro para almacenamiento de contraseñas. MD5 es vulnerable a ataques de fuerza bruta y existen tablas rainbow que pueden revertir hashes MD5 comunes.

### 2. Ausencia de Protección Contra Fuerza Bruta
**Severidad: Media**

No se detecta ningún mecanismo para limitar intentos fallidos de inicio de sesión, lo que hace al sistema vulnerable a ataques de fuerza bruta.

### 3. Tokens JWT Sin Expiración
**Severidad: Alta**

Los tokens JWT generados no incluyen un tiempo de expiración (claim "exp"), lo que significa que son válidos indefinidamente una vez emitidos.

### 4. Ausencia de Validación de Entrada
**Severidad: Media**

Los datos de entrada del usuario no son validados adecuadamente antes de procesarlos, lo que podría permitir inyecciones.

### 5. Información Sensible en Logs
**Severidad: Media**

Se están registrando datos sensibles como emails y tokens en los logs del sistema, lo que podría exponer información confidencial.

## Vulnerabilidades en el Sistema de Autorización

### 1. Control de Acceso Insuficiente
**Severidad: Alta**

No se verifica adecuadamente los roles y permisos de los usuarios antes de permitir acceso a funcionalidades sensibles.

### 2. Ausencia de CSRF Protection
**Severidad: Media**

No se implementa protección contra Cross-Site Request Forgery (CSRF), lo que podría permitir a atacantes ejecutar acciones no autorizadas en nombre de usuarios autenticados.

### 3. Permisos Excesivos
**Severidad: Media**

Algunos roles tienen permisos excesivos que violan el principio de privilegio mínimo.`;
    } else if (securityType === 'api') {
      return `## Vulnerabilidades en la API

### 1. Ausencia de Rate Limiting
**Severidad: Media**

La API no implementa limitación de tasa (rate limiting), lo que la hace vulnerable a ataques de denegación de servicio (DoS).

### 2. Exposición de Información Sensible
**Severidad: Alta**

Algunos endpoints devuelven información sensible como contraseñas hasheadas, claves API internas y datos personales sin filtrar adecuadamente.

### 3. Inyección SQL en Parámetros de Consulta
**Severidad: Crítica**

Se detectaron posibles puntos de inyección SQL en los parámetros de consulta, especialmente en los endpoints de búsqueda y filtrado.

### 4. Ausencia de Validación de Entrada
**Severidad: Alta**

Varios endpoints aceptan datos de entrada sin validación adecuada, lo que podría permitir ataques de inyección.

### 5. Headers de Seguridad Faltantes
**Severidad: Media**

La API no establece headers de seguridad importantes como:
- Content-Security-Policy
- X-Content-Type-Options
- X-Frame-Options
- Strict-Transport-Security

### 6. Manejo Inseguro de CORS
**Severidad: Media**

La configuración CORS permite solicitudes desde cualquier origen (Access-Control-Allow-Origin: *), lo que podría facilitar ataques de tipo Cross-Site.

## Vulnerabilidades en los Endpoints

### 1. Endpoint de Autenticación Inseguro
**Severidad: Alta**

El endpoint de login (/api/auth/login) no implementa protección contra ataques de fuerza bruta y no requiere HTTPS.

### 2. Exposición de Datos en Endpoint de Usuarios
**Severidad: Media**

El endpoint GET /api/users devuelve información sensible de todos los usuarios sin requerir autorización adecuada.

### 3. Endpoint de Carga de Archivos Sin Restricciones
**Severidad: Alta**

El endpoint para carga de archivos (/api/upload) no valida adecuadamente el tipo y tamaño de los archivos, permitiendo potencialmente la carga de archivos maliciosos.`;
    } else {
      return `## Vulnerabilidades en el Código

### 1. Inyección de Código
**Severidad: Crítica**

Se detectó uso de eval() con entrada de usuario sin sanitizar, lo que permite la ejecución de código arbitrario:

\`\`\`javascript
// En línea 45:
eval('return ' + userInput);
\`\`\`

### 2. Cross-Site Scripting (XSS)
**Severidad: Alta**

Se encontraron múltiples instancias donde el contenido proporcionado por el usuario se inserta directamente en el DOM sin sanitización:

\`\`\`javascript
// En línea 78:
element.innerHTML = data.userMessage;
\`\`\`

### 3. Uso de Funciones Criptográficas Débiles
**Severidad: Alta**

El código utiliza algoritmos criptográficos obsoletos y vulnerables:

\`\`\`javascript
// En línea 112:
const hash = crypto.createHash('md5').update(password).digest('hex');
\`\`\`

### 4. Manejo Inseguro de Secretos
**Severidad: Alta**

Credenciales y claves API codificadas directamente en el código:

\`\`\`javascript
// En línea 156:
const API_KEY = 'sk_live_51HG8h2KFJfMsQ7QFfGzL';
\`\`\`

### 5. Gestión Insegura de Sesiones
**Severidad: Media**

Las sesiones no tienen tiempo de expiración y utilizan identificadores predecibles.

## Vulnerabilidades en Dependencias

### 1. Dependencias Desactualizadas
**Severidad: Alta**

Se detectaron múltiples dependencias con vulnerabilidades conocidas:

- **express**: v4.16.1 - Vulnerable a ataques de denegación de servicio
- **lodash**: v4.17.15 - Vulnerable a prototype pollution (CVE-2020-8203)
- **axios**: v0.19.2 - Vulnerable a SSRF (CVE-2020-28168)

### 2. Dependencias No Utilizadas
**Severidad: Baja**

Se encontraron dependencias instaladas pero no utilizadas en el código, aumentando la superficie de ataque:

- **moment**: v2.24.0
- **jquery**: v3.4.1`;
    }
  }
  
  /**
   * Genera correcciones de seguridad simuladas
   */
  private generateSimulatedSecurityFixes(securityType: 'auth' | 'api' | 'code'): string {
    if (securityType === 'auth') {
      return `## Correcciones para el Sistema de Autenticación

### 1. Implementar Almacenamiento Seguro de Contraseñas

Reemplazar MD5 con un algoritmo seguro como bcrypt, Argon2 o PBKDF2:

\`\`\`javascript
// Antes:
const hash = crypto.createHash('md5').update(password).digest('hex');

// Después:
const bcrypt = require('bcrypt');
const saltRounds = 12;
const hash = await bcrypt.hash(password, saltRounds);

// Verificación:
const isMatch = await bcrypt.compare(password, storedHash);
\`\`\`

### 2. Implementar Protección Contra Fuerza Bruta

Añadir limitación de intentos de inicio de sesión:

\`\`\`javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos
  message: 'Demasiados intentos de inicio de sesión, inténtelo de nuevo después de 15 minutos'
});

app.use('/api/auth/login', loginLimiter);
\`\`\`

### 3. Añadir Expiración a Tokens JWT

Configurar tiempo de expiración para tokens JWT:

\`\`\`javascript
// Antes:
const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);

// Después:
const token = jwt.sign(
  { id: user.id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '1h' } // Token expira en 1 hora
);
\`\`\`

### 4. Implementar Validación de Entrada

Utilizar una biblioteca de validación como Joi o express-validator:

\`\`\`javascript
const { body, validationResult } = require('express-validator');

app.post('/api/auth/login',
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Continuar con la lógica de autenticación
  }
);
\`\`\`

### 5. Eliminar Información Sensible de Logs

Implementar filtrado de datos sensibles en logs:

\`\`\`javascript
// Antes:
console.log(`Usuario inició sesión: ${email}, token: ${token}`);

// Después:
console.log(`Usuario inició sesión: ${email.substring(0, 3)}***@${email.split('@')[1]}`);
// No loguear tokens
\`\`\`

## Correcciones para el Sistema de Autorización

### 1. Implementar Control de Acceso Basado en Roles (RBAC)

\`\`\`javascript
// Middleware de autorización
const authorize = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    
    if (requiredRole && req.user.role !== requiredRole) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    next();
  };
};

// Uso:
app.get('/api/admin/users', authorize('admin'), (req, res) => {
  // Solo administradores pueden acceder
});
\`\`\`

### 2. Implementar Protección CSRF

\`\`\`javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

// Aplicar a rutas que manejan datos sensibles
app.post('/api/user/update', csrfProtection, (req, res) => {
  // Lógica de actualización
});

// En el frontend, incluir el token CSRF en formularios
app.get('/profile', csrfProtection, (req, res) => {
  res.render('profile', { csrfToken: req.csrfToken() });
});
\`\`\`

### 3. Aplicar Principio de Privilegio Mínimo

Revisar y ajustar permisos para cada rol:

\`\`\`javascript
const permissions = {
  admin: ['read:all', 'write:all', 'delete:all'],
  manager: ['read:all', 'write:own', 'delete:own'],
  user: ['read:own', 'write:own']
};

// Verificar permiso específico
const checkPermission = (user, permission) => {
  return permissions[user.role].includes(permission);
};
\`\`\``;
    } else if (securityType === 'api') {
      return `## Correcciones para la API

### 1. Implementar Rate Limiting

Añadir limitación de tasa para proteger contra ataques DoS:

\`\`\`javascript
const rateLimit = require('express-rate-limit');

// Limitar todas las solicitudes a la API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 solicitudes por ventana
  message: 'Demasiadas solicitudes, inténtelo de nuevo después de 15 minutos'
});

// Aplicar a todas las rutas de la API
app.use('/api/', apiLimiter);

// Limites más estrictos para rutas sensibles
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 intentos
  message: 'Demasiados intentos, inténtelo de nuevo después de 1 hora'
});

app.use('/api/auth/', authLimiter);
\`\`\`

### 2. Filtrar Información Sensible

Implementar transformación de datos antes de enviarlos al cliente:

\`\`\`javascript
// Middleware para filtrar datos sensibles
const sanitizeUser = (user) => {
  const { password, resetToken, ...safeUser } = user;
  return safeUser;
};

app.get('/api/users/:id', (req, res) => {
  const user = getUserById(req.params.id);
  res.json(sanitizeUser(user));
});

// Para colecciones
app.get('/api/users', (req, res) => {
  const users = getAllUsers();
  res.json(users.map(sanitizeUser));
});
\`\`\`

### 3. Prevenir Inyección SQL

Utilizar consultas parametrizadas o un ORM:

\`\`\`javascript
// Antes (vulnerable):
const query = \`SELECT * FROM users WHERE email = '\${req.query.email}'\`;

// Después (con consultas parametrizadas):
const query = 'SELECT * FROM users WHERE email = ?';
db.query(query, [req.query.email], (err, results) => {
  // Manejar resultados
});

// O mejor aún, usar un ORM como Sequelize:
const user = await User.findOne({ where: { email: req.query.email } });
\`\`\`

### 4. Implementar Validación de Entrada

Utilizar una biblioteca de validación como Joi o express-validator:

\`\`\`javascript
const { body, param, query, validationResult } = require('express-validator');

app.post('/api/users',
  body('email').isEmail().normalizeEmail(),
  body('name').trim().isLength({ min: 2, max: 50 }),
  body('age').optional().isInt({ min: 18, max: 120 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Continuar con la lógica
  }
);

app.get('/api/products',
  query('category').optional().isAlphanumeric(),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    // Continuar con la lógica
  }
);
\`\`\`

### 5. Añadir Headers de Seguridad

Utilizar helmet para configurar headers de seguridad:

\`\`\`javascript
const helmet = require('helmet');

// Aplicar helmet a la aplicación
app.use(helmet());

// Configuración personalizada
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "trusted-cdn.com"],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 año
      includeSubDomains: true,
      preload: true
    }
  })
);
\`\`\`

### 6. Configurar CORS Adecuadamente

Restringir CORS a orígenes específicos:

\`\`\`javascript
const cors = require('cors');

// Configuración básica
app.use(cors({
  origin: 'https://miapp.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Configuración avanzada con lista de orígenes permitidos
const allowedOrigins = [
  'https://miapp.com',
  'https://admin.miapp.com',
  'https://api.miapp.com'
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
  allowedHeaders: ['Content-Type', 'Authorization']
}));
\`\`\``;
    } else {
      return `## Correcciones para el Código

### 1. Eliminar Uso de eval()

Reemplazar eval() con alternativas seguras:

\`\`\`javascript
// Antes (vulnerable):
eval('return ' + userInput);

// Después (seguro):
// Para expresiones matemáticas
const math = require('mathjs');
const result = math.evaluate(userInput);

// Para JSON
try {
  const data = JSON.parse(userInput);
} catch (error) {
  console.error('JSON inválido');
}
\`\`\`

### 2. Prevenir Cross-Site Scripting (XSS)

Sanitizar contenido antes de insertarlo en el DOM:

\`\`\`javascript
// Antes (vulnerable):
element.innerHTML = data.userMessage;

// Después (seguro):
const DOMPurify = require('dompurify');
element.innerHTML = DOMPurify.sanitize(data.userMessage);

// O mejor aún, evitar innerHTML:
element.textContent = data.userMessage;
\`\`\`

### 3. Actualizar Funciones Criptográficas

Reemplazar algoritmos débiles con alternativas seguras:

\`\`\`javascript
// Antes (vulnerable):
const hash = crypto.createHash('md5').update(password).digest('hex');

// Después (seguro):
const bcrypt = require('bcrypt');
const saltRounds = 12;
const hash = await bcrypt.hash(password, saltRounds);

// Para verificación:
const isValid = await bcrypt.compare(password, storedHash);
\`\`\`

### 4. Gestionar Secretos de Forma Segura

Mover secretos a variables de entorno:

\`\`\`javascript
// Antes (vulnerable):
const API_KEY = 'sk_live_51HG8h2KFJfMsQ7QFfGzL';

// Después (seguro):
// En .env
// API_KEY=sk_live_51HG8h2KFJfMsQ7QFfGzL

// En el código
require('dotenv').config();
const API_KEY = process.env.API_KEY;

// Verificar que existe
if (!API_KEY) {
  throw new Error('API_KEY no configurada en variables de entorno');
}
\`\`\`

### 5. Mejorar Gestión de Sesiones

Implementar configuración segura de sesiones:

\`\`\`javascript
const session = require('express-session');

app.use(session({
  secret: process.env.SESSION_SECRET,
  name: 'sessionId', // Cambiar el nombre por defecto
  cookie: {
    httpOnly: true, // No accesible desde JavaScript
    secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
    sameSite: 'strict', // Protección CSRF
    maxAge: 3600000 // Expiración: 1 hora
  },
  resave: false,
  saveUninitialized: false
}));
\`\`\`

## Correcciones para Dependencias

### 1. Actualizar Dependencias Vulnerables

Actualizar a versiones seguras:

\`\`\`bash
# Verificar vulnerabilidades
npm audit

# Actualizar dependencias
npm update express lodash axios

# Actualizar a versiones específicas
npm install express@4.17.1 lodash@4.17.21 axios@0.21.1
\`\`\`

### 2. Eliminar Dependencias No Utilizadas

Remover dependencias innecesarias:

\`\`\`bash
npm uninstall moment jquery
\`\`\`

### 3. Implementar Verificación Continua de Dependencias

Añadir herramientas de seguridad al flujo de CI/CD:

\`\`\`javascript
// En package.json
{
  "scripts": {
    "security-check": "npm audit && snyk test"
  }
}
\`\`\``;
    }
  }
  
  /**
   * Genera configuración de seguridad simulada
   */
  private generateSimulatedSecurityConfig(securityType: 'auth' | 'api' | 'code'): string {
    if (securityType === 'auth') {
      return `// Configuración de Seguridad para Autenticación y Autorización

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const helmet = require('helmet');

/**
 * Configuración de seguridad para Express
 * @param {Express} app - Instancia de Express
 */
module.exports = function configureAuthSecurity(app) {
  // 1. Protección básica con Helmet
  app.use(helmet());
  
  // 2. Configuración de Rate Limiting
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // 5 intentos
    message: 'Demasiados intentos de inicio de sesión, inténtelo de nuevo después de 15 minutos'
  });
  
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/auth/register', rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 3, // 3 intentos
    message: 'Demasiados intentos de registro, inténtelo de nuevo después de 1 hora'
  }));
  
  // 3. Protección CSRF para rutas que no son API
  const csrfProtection = csrf({ cookie: true });
  app.use('/auth', csrfProtection);
  app.use('/profile', csrfProtection);
  
  // 4. Middleware de verificación JWT
  const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No se proporcionó token de autenticación' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expirado' });
      }
      return res.status(401).json({ message: 'Token inválido' });
    }
  };
  
  // 5. Middleware de autorización basada en roles
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
  
  // 6. Funciones de hash y verificación de contraseñas
  const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  };
  
  const verifyPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
  };
  
  // 7. Generación de tokens JWT
  const generateToken = (user) => {
    return jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  };
  
  const generateRefreshToken = (user) => {
    return jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
  };
  
  // Exponer funciones y middlewares
  return {
    verifyToken,
    authorize,
    hashPassword,
    verifyPassword,
    generateToken,
    generateRefreshToken
  };
};`;
    } else if (securityType === 'api') {
      return `// Configuración de Seguridad para APIs y Endpoints

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { body, param, query, validationResult } = require('express-validator');
const xss = require('xss-clean');
const hpp = require('hpp');

/**
 * Configuración de seguridad para APIs
 * @param {Express} app - Instancia de Express
 */
module.exports = function configureApiSecurity(app) {
  // 1. Protección básica con Helmet
  app.use(helmet());
  
  // 2. Configuración de CORS
  const allowedOrigins = [
    'https://miapp.com',
    'https://admin.miapp.com',
    'https://api.miapp.com'
  ];
  
  app.use(cors({
    origin: function(origin, callback) {
      // Permitir solicitudes sin origen (como aplicaciones móviles o curl)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('No permitido por CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400 // 24 horas
  }));
  
  // 3. Limitar tasa de solicitudes (Rate Limiting)
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 solicitudes por ventana
    message: 'Demasiadas solicitudes desde esta IP, inténtelo de nuevo después de 15 minutos'
  });
  
  // Aplicar a todas las rutas de la API
  app.use('/api/', apiLimiter);
  
  // Limites más estrictos para rutas sensibles
  const sensitiveLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 solicitudes por hora
    message: 'Demasiadas solicitudes para operaciones sensibles, inténtelo de nuevo después de 1 hora'
  });
  
  app.use('/api/admin/', sensitiveLimiter);
  app.use('/api/user/password', sensitiveLimiter);
  
  // 4. Prevenir ataques XSS
  app.use(xss());
  
  // 5. Prevenir HTTP Parameter Pollution
  app.use(hpp());
  
  // 6. Validadores comunes para rutas
  const validators = {
    id: param('id').isInt().toInt(),
    email: body('email').isEmail().normalizeEmail(),
    password: body('password').isLength({ min: 8 }).trim(),
    name: body('name').trim().isLength({ min: 2, max: 50 }),
    page: query('page').optional().isInt({ min: 1 }).toInt(),
    limit: query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    search: query('search').optional().trim().escape(),
    
    // Validador para archivos
    fileUpload: (req, res, next) => {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: 'No se subió ningún archivo' });
      }
      
      const file = req.files.file;
      
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.status(400).json({ message: 'Tipo de archivo no permitido' });
      }
      
      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({ message: 'El archivo excede el tamaño máximo permitido (5MB)' });
      }
      
      next();
    },
    
    // Validador genérico
    validate: (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    }
  };
  
  // 7. Sanitización de datos de respuesta
  const sanitizers = {
    user: (user) => {
      if (!user) return null;
      const { password, resetToken, ...safeUser } = user;
      return safeUser;
    },
    
    error: (error) => {
      // Evitar exponer detalles internos en errores
      console.error(error); // Log interno
      return {
        message: 'Ha ocurrido un error en el servidor',
        code: error.code || 'INTERNAL_ERROR'
      };
    }
  };
  
  // Exponer funciones y middlewares
  return {
    validators,
    sanitizers
  };
};`;
    } else {
      return `// Configuración de Seguridad para Código y Dependencias

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const DOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

/**
 * Configuración y utilidades de seguridad para código
 */
module.exports = {
  /**
   * Sanitiza contenido HTML para prevenir XSS
   * @param {string} html - Contenido HTML a sanitizar
   * @returns {string} - HTML sanitizado
   */
  sanitizeHTML: (html) => {
    const window = new JSDOM('').window;
    const purify = DOMPurify(window);
    return purify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'target', 'class', 'id', 'style'],
      FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'object', 'embed', 'link'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover']
    });
  },
  
  /**
   * Valida y sanitiza JSON para prevenir inyecciones
   * @param {string} jsonString - String JSON a validar
   * @returns {object|null} - Objeto JSON o null si es inválido
   */
  safeJSONParse: (jsonString) => {
    try {
      // Primero verificar que es un JSON válido
      const parsed = JSON.parse(jsonString);
      
      // Función recursiva para sanitizar valores
      const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        Object.keys(obj).forEach(key => {
          // Sanitizar claves (opcional)
          const sanitizedKey = key.replace(/[<>]/g, '');
          
          // Sanitizar valores
          if (typeof obj[key] === 'string') {
            obj[key] = obj[key].replace(/[<>]/g, '');
          } else if (typeof obj[key] === 'object') {
            obj[key] = sanitizeObject(obj[key]);
          }
          
          // Si la clave cambió, actualizar
          if (sanitizedKey !== key) {
            obj[sanitizedKey] = obj[key];
            delete obj[key];
          }
        });
        
        return obj;
      };
      
      return sanitizeObject(parsed);
    } catch (error) {
      console.error('Error al parsear JSON:', error);
      return null;
    }
  },
  
  /**
   * Verifica dependencias en busca de vulnerabilidades
   * @returns {Promise<object>} - Resultado del análisis
   */
  checkDependencies: async () => {
    try {
      // Ejecutar npm audit
      const auditResult = execSync('npm audit --json').toString();
      const parsedAudit = JSON.parse(auditResult);
      
      // Verificar dependencias no utilizadas
      const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Analizar código para encontrar imports/requires
      const usedDependencies = new Set();
      const sourceDir = path.join(process.cwd(), 'src');
      
      const findDependencies = (dir) => {
        const files = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const file of files) {
          const filePath = path.join(dir, file.name);
          
          if (file.isDirectory()) {
            findDependencies(filePath);
          } else if (file.name.match(/\.(js|jsx|ts|tsx)$/)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            
            // Buscar imports
            const importMatches = content.matchAll(/import.*?from ['"](.*?)['"]/g);
            for (const match of importMatches) {
              const dep = match[1].split('/')[0];
              if (!dep.startsWith('.') && !dep.startsWith('@')) {
                usedDependencies.add(dep);
              }
            }
            
            // Buscar requires
            const requireMatches = content.matchAll(/require\(['"](.*?)['"]\)/g);
            for (const match of requireMatches) {
              const dep = match[1].split('/')[0];
              if (!dep.startsWith('.') && !dep.startsWith('@')) {
                usedDependencies.add(dep);
              }
            }
          }
        }
      };
      
      if (fs.existsSync(sourceDir)) {
        findDependencies(sourceDir);
      }
      
      // Encontrar dependencias no utilizadas
      const unusedDependencies = Object.keys(dependencies).filter(dep => !usedDependencies.has(dep));
      
      return {
        vulnerabilities: parsedAudit.vulnerabilities || {},
        unusedDependencies
      };
    } catch (error) {
      console.error('Error al verificar dependencias:', error);
      return {
        error: error.message,
        vulnerabilities: {},
        unusedDependencies: []
      };
    }
  },
  
  /**
   * Genera un archivo .env.example seguro
   * @param {string} envPath - Ruta al archivo .env
   */
  generateEnvExample: (envPath = '.env') => {
    try {
      if (!fs.existsSync(envPath)) {
        console.warn(`Archivo ${envPath} no encontrado`);
        return;
      }
      
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');
      let exampleContent = '# Environment Variables Example\n\n';
      
      for (const line of lines) {
        if (line.trim() === '' || line.startsWith('#')) {
          exampleContent += line + '\n';
          continue;
        }
        
        const [key] = line.split('=');
        if (key) {
          exampleContent += `${key.trim()}=your_${key.trim().toLowerCase()}_here\n`;
        }
      }
      
      fs.writeFileSync('.env.example', exampleContent, 'utf-8');
      console.log('✅ Archivo .env.example generado correctamente');
    } catch (error) {
      console.error('Error al generar .env.example:', error);
    }
  },
  
  /**
   * Verifica si hay secretos hardcodeados en el código
   * @param {string} dir - Directorio a analizar
   * @returns {Array} - Lista de archivos con posibles secretos
   */
  findHardcodedSecrets: (dir = 'src') => {
    const results = [];
    const patterns = [
      /(['"])(?:api|jwt|token|secret|password|auth|key).*?\1\s*[:=]\s*(['"])(?!process\.env)[^\2]+\2/i,
      /const\s+(?:API_KEY|SECRET|PASSWORD|TOKEN|AUTH)\s*=\s*(['"])(?!process\.env)[^\1]+\1/i
    ];
    
    const scanFile = (filePath) => {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        for (const pattern of patterns) {
          if (pattern.test(line)) {
            results.push({
              file: filePath,
              line: i + 1,
              content: line.trim()
            });
            break;
          }
        }
      }
    };
    
    const scanDir = (directory) => {
      const entries = fs.readdirSync(directory, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);
        
        if (entry.isDirectory()) {
          if (!entry.name.startsWith('node_modules') && !entry.name.startsWith('.')) {
            scanDir(fullPath);
          }
        } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
          scanFile(fullPath);
        }
      }
    };
    
    if (fs.existsSync(dir)) {
      scanDir(dir);
    }
    
    return results;
  }
};`;
    }
  }
  
  /**
   * Función auxiliar para mantener compatibilidad con código existente
   */
  private readContext(contextFile: string): string {
    try {
      const contextPath = path.join(process.cwd(), 'context', contextFile);
      if (fs.existsSync(contextPath)) {
        return fs.readFileSync(contextPath, 'utf-8');
      }
      return `[Contexto ${contextFile} no encontrado]`;
    } catch (error) {
      console.warn(`⚠️ No se pudo leer el contexto: ${contextFile}`);
      return `[Error leyendo contexto ${contextFile}]`;
    }
  }
}

// Función auxiliar para mantener compatibilidad con código existente
export async function securityAgent(securitySpec: string): Promise<string> {
  const agent = new SecurityAgent();
  await agent.run(securitySpec);
  return "Ejecutado con éxito";
}