import { BaseAgent } from './base-agent';
import * as fs from 'fs';
import * as path from 'path';

/**
 * API Agent - Diseña y genera APIs RESTful
 * 
 * Este agente es responsable de:
 * 1. Diseñar endpoints RESTful basados en requisitos
 * 2. Generar controladores y rutas para Express/Node.js
 * 3. Implementar validación de datos y manejo de errores
 * 4. Documentar la API con OpenAPI/Swagger
 * 5. Generar pruebas para los endpoints
 * 6. Implementar autenticación y autorización
 * 7. Optimizar rendimiento y seguridad de la API
 */
export class APIAgent extends BaseAgent {
  private apiSpec: string;
  private outputDir: string;
  private swaggerSpec: any;
  private controllers: Map<string, string> = new Map();
  private routes: Map<string, string> = new Map();
  private models: Map<string, string> = new Map();
  private middlewares: Map<string, string> = new Map();
  private tests: Map<string, string> = new Map();

  constructor() {
    super('API Agent');
    this.outputDir = path.join(process.cwd(), 'src', 'api');
  }

  /**
   * Ejecuta el API Agent para diseñar y generar una API
   * @param apiSpec Especificación de la API a crear
   */
  async run(apiSpec: string): Promise<void> {
    this.log(`🔌 API Agent diseñando API para: "${apiSpec}"`);
    this.apiSpec = apiSpec;
    this.updateAgentStatus('working', 'Analizando especificación de API');

    try {
      // Leer contexto relevante
      const coreContext: string = this.readContext('core.md');
      const rulesContext: string = this.readContext('rules.md');

      // Crear prompt para el LLM
      const apiPrompt: string = `
      # Contexto del Proyecto
      ${coreContext}
      
      # Reglas Arquitectónicas
      ${rulesContext}
      
      # Tarea de API Agent
      Actúa como el API Agent de CJ.DevMind. Tu tarea es diseñar y generar una API RESTful basada en la siguiente especificación:
      
      "${apiSpec}"
      
      Genera:
      1. Diseño de endpoints RESTful (rutas, métodos HTTP, parámetros)
      2. Controladores para Express/Node.js
      3. Middleware para validación de datos y manejo de errores
      4. Documentación OpenAPI/Swagger
      5. Pruebas para los endpoints principales
      
      Responde con un objeto JSON que contenga:
      {
        "swagger": {/* Especificación OpenAPI/Swagger */},
        "controllers": {/* Código de los controladores */},
        "routes": {/* Código de las rutas */},
        "models": {/* Modelos/Schemas */},
        "middlewares": {/* Middleware de validación y error */},
        "tests": {/* Pruebas para los endpoints */}
      }
      `;

      // Consultar al LLM
      this.updateAgentStatus('working', 'Consultando LLM para diseño de API');
      const response = await this.queryLLM(apiPrompt);
      
      // Extraer la respuesta JSON
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/\{[\s\S]*\}/);
                        
      if (!jsonMatch) {
        throw new Error('No se pudo extraer la respuesta JSON del LLM');
      }
      
      const apiDesign = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      // Guardar la especificación Swagger
      this.swaggerSpec = apiDesign.swagger;
      
      // Procesar y guardar los componentes de la API
      await this.processAPIComponents(apiDesign);
      
      // Generar archivos adicionales (server.js, index.js, etc.)
      await this.generateAdditionalFiles();
      
      this.log('✅ API generada con éxito');
      this.updateAgentStatus('idle', 'API generada con éxito');
      
      // Notificar a otros agentes
      this.sendEvent('API_GENERATED', {
        apiSpec: this.apiSpec,
        endpoints: Object.keys(this.swaggerSpec.paths),
        outputDir: this.outputDir
      });
      
    } catch (error) {
      this.log(`❌ Error generando API: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error generando API: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lee un archivo de contexto
   */
  private readContext(filename: string): string {
    try {
      const contextPath = path.join(process.cwd(), 'context', filename);
      return fs.existsSync(contextPath) ? fs.readFileSync(contextPath, 'utf-8') : '';
    } catch (error) {
      this.log(`⚠️ No se pudo leer el contexto ${filename}: ${error.message}`, 'warning');
      return '';
    }
  }

  /**
   * Procesa y guarda los componentes de la API
   */
  private async processAPIComponents(apiDesign: any): Promise<void> {
    // Crear directorios necesarios
    this.createDirectories();
    
    // Guardar especificación Swagger
    this.saveSwaggerSpec();
    
    // Guardar controladores
    for (const [name, code] of Object.entries(apiDesign.controllers)) {
      this.controllers.set(name, code as string);
      this.saveFile('controllers', `${name}.js`, code as string);
    }
    
    // Guardar rutas
    for (const [name, code] of Object.entries(apiDesign.routes)) {
      this.routes.set(name, code as string);
      this.saveFile('routes', `${name}.js`, code as string);
    }
    
    // Guardar modelos
    for (const [name, code] of Object.entries(apiDesign.models)) {
      this.models.set(name, code as string);
      this.saveFile('models', `${name}.js`, code as string);
    }
    
    // Guardar middlewares
    for (const [name, code] of Object.entries(apiDesign.middlewares)) {
      this.middlewares.set(name, code as string);
      this.saveFile('middlewares', `${name}.js`, code as string);
    }
    
    // Guardar pruebas
    for (const [name, code] of Object.entries(apiDesign.tests)) {
      this.tests.set(name, code as string);
      this.saveFile('tests', `${name}.test.js`, code as string);
    }
  }

  /**
   * Crea los directorios necesarios para la API
   */
  private createDirectories(): void {
    const dirs = [
      this.outputDir,
      path.join(this.outputDir, 'controllers'),
      path.join(this.outputDir, 'routes'),
      path.join(this.outputDir, 'models'),
      path.join(this.outputDir, 'middlewares'),
      path.join(this.outputDir, 'tests'),
      path.join(this.outputDir, 'docs')
    ];
    
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.log(`📁 Creado directorio: ${dir}`);
      }
    }
  }

  /**
   * Guarda la especificación Swagger
   */
  private saveSwaggerSpec(): void {
    const swaggerPath = path.join(this.outputDir, 'docs', 'swagger.json');
    fs.writeFileSync(swaggerPath, JSON.stringify(this.swaggerSpec, null, 2), 'utf-8');
    this.log(`📄 Guardada especificación Swagger: ${swaggerPath}`);
  }

  /**
   * Guarda un archivo en el directorio correspondiente
   */
  private saveFile(dir: string, filename: string, content: string): void {
    const filePath = path.join(this.outputDir, dir, filename);
    fs.writeFileSync(filePath, content, 'utf-8');
    this.log(`📄 Guardado archivo: ${filePath}`);
  }

  /**
   * Genera archivos adicionales necesarios para la API
   */
  private async generateAdditionalFiles(): Promise<void> {
    // Generar server.js
    const serverCode = this.generateServerCode();
    this.saveFile('', 'server.js', serverCode);
    
    // Generar index.js
    const indexCode = this.generateIndexCode();
    this.saveFile('', 'index.js', indexCode);
    
    // Generar config.js
    const configCode = this.generateConfigCode();
    this.saveFile('', 'config.js', configCode);
    
    // Generar README.md
    const readmeContent = this.generateReadme();
    this.saveFile('', 'README.md', readmeContent);
    
    // Generar package.json
    const packageJson = this.generatePackageJson();
    this.saveFile('', 'package.json', packageJson);
  }

  /**
   * Genera el código para server.js
   */
  private generateServerCode(): string {
    return `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');
const errorHandler = require('./middlewares/errorHandler');

// Importar rutas
${Array.from(this.routes.keys()).map(route => `const ${route}Routes = require('./routes/${route}');`).join('\n')}

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Rutas
${Array.from(this.routes.keys()).map(route => `app.use('/api/${route}', ${route}Routes);`).join('\n')}

// Manejo de errores
app.use(errorHandler);

// Ruta 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

module.exports = app;
`;
  }

  /**
   * Genera el código para index.js
   */
  private generateIndexCode(): string {
    return `const app = require('./server');
const config = require('./config');
const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
})
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    
    // Iniciar servidor
    const server = app.listen(config.port, () => {
      console.log(\`🚀 Servidor iniciado en puerto \${config.port}\`);
      console.log(\`📚 Documentación API: http://localhost:\${config.port}/api-docs\`);
    });
    
    // Manejo de cierre graceful
    process.on('SIGTERM', () => {
      console.log('👋 Cerrando servidor...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('💤 Servidor cerrado');
          process.exit(0);
        });
      });
    });
  })
  .catch(err => {
    console.error(\`❌ Error conectando a MongoDB: \${err.message}\`);
    process.exit(1);
  });
`;
  }

  /**
   * Genera el código para config.js
   */
  private generateConfigCode(): string {
    return `require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/api',
  jwtSecret: process.env.JWT_SECRET || 'secret',
  jwtExpiration: process.env.JWT_EXPIRATION || '1d',
  environment: process.env.NODE_ENV || 'development',
  
  // Variables para entorno de prueba
  mongoURITest: process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/api_test'
};
`;
  }

  /**
   * Genera el README.md para la API
   */
  private generateReadme(): string {
    return `# API RESTful

## Descripción
${this.swaggerSpec.info.description || 'API RESTful generada por CJ.DevMind API Agent'}

## Instalación

\`\`\`bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar servidor en desarrollo
npm run dev

# Iniciar servidor en producción
npm start
\`\`\`

## Documentación
La documentación de la API está disponible en [http://localhost:5000/api-docs](http://localhost:5000/api-docs) cuando el servidor está en ejecución.

## Endpoints Principales

${Object.entries(this.swaggerSpec.paths).map(([path, methods]) => {
  const methodsInfo = Object.entries(methods as any).map(([method, info]) => 
    `- \`${method.toUpperCase()}\`: ${(info as any).summary || 'Sin descripción'}`
  ).join('\n');
  return `### ${path}\n${methodsInfo}`;
}).join('\n\n')}

## Pruebas
\`\`\`bash
# Ejecutar pruebas
npm test

# Ejecutar pruebas con cobertura
npm run test:coverage
\`\`\`

## Tecnologías
- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- Jest (pruebas)
- Swagger/OpenAPI (documentación)

## Licencia
MIT
`;
  }

  /**
   * Genera el package.json para la API
   */
  private generatePackageJson(): string {
    return `{
  "name": "api-restful",
  "version": "1.0.0",
  "description": "${this.swaggerSpec.info.description || 'API RESTful generada por CJ.DevMind API Agent'}",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint ."
  },
  "keywords": [
    "api",
    "restful",
    "express",
    "mongodb",
    "nodejs"
  ],
  "author": "CJ.DevMind",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^10.0.0",
    "express": "^4.17.1",
    "express-validator": "^6.12.1",
    "helmet": "^4.6.0",
    "jsonwebtoken": "^8.5.1",
    "mongoose": "^5.13.7",
    "morgan": "^1.10.0",
    "swagger-ui-express": "^4.1.6"
  },
  "devDependencies": {
    "eslint": "^7.32.0",
    "jest": "^27.0.6",
    "nodemon": "^2.0.12",
    "supertest": "^6.1.6"
  },
  "jest": {
    "testEnvironment": "node",
    "coveragePathIgnorePatterns": [
      "/node_modules/"
    ]
  }
}
`;
  }

  /**
   * Genera una especificación OpenAPI/Swagger
   */
  async generateSwaggerSpec(apiDescription: string): Promise<string> {
    this.log(`📝 Generando especificación OpenAPI para: "${apiDescription}"`);
    this.updateAgentStatus('working', 'Generando especificación OpenAPI');
    
    try {
      const prompt = `
      # Tarea: Generación de Especificación OpenAPI/Swagger
      
      Genera una especificación OpenAPI/Swagger 3.0 completa para la siguiente API:
      
      "${apiDescription}"
      
      La especificación debe incluir:
      1. Información básica (título, versión, descripción)
      2. Servidores (desarrollo, producción)
      3. Rutas completas con métodos HTTP, parámetros, cuerpos de solicitud y respuestas
      4. Esquemas de datos
      5. Componentes de seguridad (JWT)
      6. Ejemplos de solicitudes y respuestas
      
      Responde con el JSON completo de la especificación OpenAPI.
      `;
      
      const response = await this.queryLLM(prompt);
      
      // Extraer el JSON de la respuesta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/\{[\s\S]*\}/);
                        
      if (!jsonMatch) {
        throw new Error('No se pudo extraer la especificación OpenAPI del LLM');
      }
      
      const swaggerSpec = jsonMatch[1] || jsonMatch[0];
      
      this.log('✅ Especificación OpenAPI generada con éxito');
      this.updateAgentStatus('idle');
      
      return swaggerSpec;
    } catch (error) {
      this.log(`❌ Error generando especificación OpenAPI: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error generando especificación OpenAPI: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera controladores para Express/Node.js
   */
  async generateControllers(swaggerSpec: string): Promise<Map<string, string>> {
    this.log('🎮 Generando controladores');
    this.updateAgentStatus('working', 'Generando controladores');
    
    try {
      const prompt = `
      # Tarea: Generación de Controladores Express
      
      Basado en la siguiente especificación OpenAPI/Swagger:
      
      \`\`\`json
      ${swaggerSpec}
      \`\`\`
      
      Genera controladores Express/Node.js para todas las rutas definidas. Cada controlador debe:
      1. Implementar la lógica de negocio correspondiente
      2. Manejar errores adecuadamente
      3. Validar datos de entrada
      4. Devolver respuestas según la especificación
      5. Usar async/await para operaciones asíncronas
      6. Incluir comentarios explicativos
      
      Agrupa los controladores por recurso (por ejemplo, userController, authController, etc.).
      
      Responde con un objeto JSON donde las claves son los nombres de los controladores y los valores son el código completo.
      `;
      
      const response = await this.queryLLM(prompt);
      
      // Extraer el JSON de la respuesta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/\{[\s\S]*\}/);
                        
      if (!jsonMatch) {
        throw new Error('No se pudo extraer los controladores del LLM');
      }
      
      const controllers = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      const controllersMap = new Map<string, string>();
      
      for (const [name, code] of Object.entries(controllers)) {
        controllersMap.set(name, code as string);
      }
      
      this.log('✅ Controladores generados con éxito');
      this.updateAgentStatus('idle');
      
      return controllersMap;
    } catch (error) {
      this.log(`❌ Error generando controladores: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error generando controladores: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera rutas para Express/Node.js
   */
  async generateRoutes(swaggerSpec: string, controllers: Map<string, string>): Promise<Map<string, string>> {
    this.log('🛣️ Generando rutas');
    this.updateAgentStatus('working', 'Generando rutas');
    
    try {
      const controllersInfo = Array.from(controllers.entries())
        .map(([name, code]) => {
          const functions = code.match(/exports\.(\w+)/g) || [];
          return {
            name,
            functions: functions.map(f => f.replace('exports.', ''))
          };
        });
      
      const prompt = `
      # Tarea: Generación de Rutas Express
      
      Basado en la siguiente especificación OpenAPI/Swagger:
      
      \`\`\`json
      ${swaggerSpec}
      \`\`\`
      
      Y los siguientes controladores:
      
      \`\`\`json
      ${JSON.stringify(controllersInfo, null, 2)}
      \`\`\`
      
      Genera archivos de rutas Express/Node.js para todos los recursos. Cada archivo de rutas debe:
      1. Importar el controlador correspondiente
      2. Definir todas las rutas según la especificación
      3. Aplicar middleware de validación cuando sea necesario
      4. Aplicar middleware de autenticación/autorización cuando sea necesario
      5. Usar el enrutador de Express (express.Router())
      6. Incluir comentarios explicativos
      
      Responde con un objeto JSON donde las claves son los nombres de los archivos de rutas y los valores son el código completo.
      `;
      
      const response = await this.queryLLM(prompt);
      
      // Extraer el JSON de la respuesta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/\{[\s\S]*\}/);
                        
      if (!jsonMatch) {
        throw new Error('No se pudo extraer las rutas del LLM');
      }
      
      const routes = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      const routesMap = new Map<string, string>();
      
      for (const [name, code] of Object.entries(routes)) {
        routesMap.set(name, code as string);
      }
      
      this.log('✅ Rutas generadas con éxito');
      this.updateAgentStatus('idle');
      
      return routesMap;
    } catch (error) {
      this.log(`❌ Error generando rutas: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error generando rutas: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera modelos/schemas para MongoDB/Mongoose
   */
  async generateModels(swaggerSpec: string): Promise<Map<string, string>> {
    this.log('📊 Generando modelos');
    this.updateAgentStatus('working', 'Generando modelos');
    
    try {
      const prompt = `
      # Tarea: Generación de Modelos Mongoose
      
      Basado en la siguiente especificación OpenAPI/Swagger:
      
      \`\`\`json
      ${swaggerSpec}
      \`\`\`
      
      Genera modelos Mongoose para todos los esquemas definidos. Cada modelo debe:
      1. Definir el esquema con todos los campos y tipos correspondientes
      2. Incluir validaciones según la especificación
      3. Definir índices para campos frecuentemente consultados
      4. Implementar hooks pre/post cuando sea necesario (por ejemplo, hashear contraseñas)
      5. Definir métodos estáticos y de instancia útiles
      6. Incluir comentarios explicativos
      
      Responde con un objeto JSON donde las claves son los nombres de los modelos y los valores son el código completo.
      `;
      
      const response = await this.queryLLM(prompt);
      
      // Extraer el JSON de la respuesta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/\{[\s\S]*\}/);
                        
      if (!jsonMatch) {
        throw new Error('No se pudo extraer los modelos del LLM');
      }
      
      const models = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      const modelsMap = new Map<string, string>();
      
      for (const [name, code] of Object.entries(models)) {
        modelsMap.set(name, code as string);
      }
      
      this.log('✅ Modelos generados con éxito');
      this.updateAgentStatus('idle');
      
      return modelsMap;
    } catch (error) {
      this.log(`❌ Error generando modelos: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error generando modelos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera middleware para validación y manejo de errores
   */
  async generateMiddlewares(swaggerSpec: string): Promise<Map<string, string>> {
    this.log('🔄 Generando middlewares');
    this.updateAgentStatus('working', 'Generando middlewares');
    
    try {
      const prompt = `
      # Tarea: Generación de Middlewares Express
      
      Basado en la siguiente especificación OpenAPI/Swagger:
      
      \`\`\`json
      ${swaggerSpec}
      \`\`\`
      
      Genera los siguientes middlewares para Express/Node.js:
      
      1. **authMiddleware.js**: Para autenticación JWT
         - Verificar token
         - Decodificar y adjuntar usuario a req.user
         - Middleware para roles específicos
      
      2. **validationMiddleware.js**: Para validación de datos
         - Usar express-validator
         - Validaciones específicas para cada ruta según la especificación
      
      3. **errorHandler.js**: Para manejo centralizado de errores
         - Capturar errores de diferentes tipos
         - Formatear respuestas de error
         - Logging de errores
      
      4. **rateLimiter.js**: Para limitar peticiones
         - Configuración básica de rate limiting
      
      Cada middleware debe incluir comentarios explicativos.
      
      Responde con un objeto JSON donde las claves son los nombres de los middlewares y los valores son el código completo.
      `;
      
      const response = await this.queryLLM(prompt);
      
      // Extraer el JSON de la respuesta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/\{[\s\S]*\}/);
                        
      if (!jsonMatch) {
        throw new Error('No se pudo extraer los middlewares del LLM');
      }
      
      const middlewares = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      const middlewaresMap = new Map<string, string>();
      
      for (const [name, code] of Object.entries(middlewares)) {
        middlewaresMap.set(name, code as string);
      }
      
      this.log('✅ Middlewares generados con éxito');
      this.updateAgentStatus('idle');
      
      return middlewaresMap;
    } catch (error) {
      this.log(`❌ Error generando middlewares: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error generando middlewares: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera pruebas para los endpoints
   */
  async generateTests(swaggerSpec: string): Promise<Map<string, string>> {
    this.log('🧪 Generando pruebas');
    this.updateAgentStatus('working', 'Generando pruebas');
    
    try {
      const prompt = `
      # Tarea: Generación de Pruebas para API
      
      Basado en la siguiente especificación OpenAPI/Swagger:
      
      \`\`\`json
      ${swaggerSpec}
      \`\`\`
      
      Genera pruebas Jest con Supertest para los endpoints principales. Las pruebas deben:
      
      1. Probar todos los métodos HTTP (GET, POST, PUT, DELETE)
      2. Verificar respuestas exitosas y errores
      3. Probar validaciones de datos
      4. Probar autenticación y autorización
      5. Usar mocks cuando sea necesario
      6. Incluir setup y teardown adecuados
      7. Agrupar pruebas por recurso
      
      Responde con un objeto JSON donde las claves son los nombres de los archivos de prueba y los valores son el código completo.
      `;
      
      const response = await this.queryLLM(prompt);
      
      // Extraer el JSON de la respuesta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/\{[\s\S]*\}/);
                        
      if (!jsonMatch) {
        throw new Error('No se pudo extraer las pruebas del LLM');
      }
      
      const tests = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      const testsMap = new Map<string, string>();
      
      for (const [name, code] of Object.entries(tests)) {
        testsMap.set(name, code as string);
      }
      
      this.log('✅ Pruebas generadas con éxito');
      this.updateAgentStatus('idle');
      
      return testsMap;
    } catch (error) {
      this.log(`❌ Error generando pruebas: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error generando pruebas: ${error.message}`);
      throw error;
    }
  }

    /**
   * Analiza la seguridad de la API generada
   */
    async analyzeAPISecurity(): Promise<string> {
      this.log('🔒 Analizando seguridad de la API');
      this.updateAgentStatus('working', 'Analizando seguridad de la API');
      
      try {
        const prompt = `
        # Tarea: Análisis de Seguridad de API
        
        Analiza la siguiente especificación OpenAPI/Swagger para identificar posibles problemas de seguridad:
        
        \`\`\`json
        ${JSON.stringify(this.swaggerSpec, null, 2)}
        \`\`\`
        
        Evalúa los siguientes aspectos:
        1. Autenticación y autorización
        2. Validación de datos de entrada
        3. Protección contra ataques comunes (CSRF, XSS, inyección SQL, etc.)
        4. Manejo de información sensible
        5. Rate limiting y protección contra DoS
        6. CORS y políticas de seguridad
        7. Encriptación de datos
        
        Para cada problema identificado, proporciona:
        - Descripción del problema
        - Nivel de severidad (Alto, Medio, Bajo)
        - Recomendación para solucionarlo
        
        Responde con un informe estructurado en formato JSON.
        `;
        
        const response = await this.queryLLM(prompt);
        
        // Extraer el JSON de la respuesta
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/\{[\s\S]*\}/);
                          
        if (!jsonMatch) {
          throw new Error('No se pudo extraer el análisis de seguridad del LLM');
        }
        
        const securityAnalysis = jsonMatch[1] || jsonMatch[0];
        
        // Guardar el análisis de seguridad
        const securityReportPath = path.join(this.outputDir, 'docs', 'security-report.json');
        fs.writeFileSync(securityReportPath, securityAnalysis, 'utf-8');
        
        this.log('✅ Análisis de seguridad completado');
        this.updateAgentStatus('idle');
        
        // Notificar al SecurityAgent si está disponible
        this.sendEvent('API_SECURITY_ANALYSIS', {
          apiSpec: this.apiSpec,
          securityReport: securityReportPath
        });
        
        return securityAnalysis;
      } catch (error) {
        this.log(`❌ Error analizando seguridad: ${error.message}`, 'error');
        this.updateAgentStatus('error', `Error analizando seguridad: ${error.message}`);
        throw error;
      }
    }
  
    /**
     * Genera documentación detallada para la API
     */
    async generateAPIDocumentation(): Promise<string> {
      this.log('📚 Generando documentación detallada para la API');
      this.updateAgentStatus('working', 'Generando documentación detallada');
      
      try {
        const prompt = `
        # Tarea: Generación de Documentación de API
        
        Basado en la siguiente especificación OpenAPI/Swagger:
        
        \`\`\`json
        ${JSON.stringify(this.swaggerSpec, null, 2)}
        \`\`\`
        
        Genera documentación detallada para la API que incluya:
        
        1. Introducción y visión general
        2. Guía de inicio rápido
        3. Autenticación y autorización
        4. Endpoints detallados con:
           - Descripción
           - Parámetros
           - Cuerpo de solicitud
           - Respuestas
           - Ejemplos de uso (curl, JavaScript, Python)
        5. Modelos de datos
        6. Códigos de error y solución de problemas
        7. Limitaciones y rate limiting
        8. Mejores prácticas
        9. Changelog y versionado
        
        Formatea la documentación en Markdown para facilitar su lectura y conversión a otros formatos.
        `;
        
        const response = await this.queryLLM(prompt);
        
        // Extraer la documentación en Markdown
        const markdownMatch = response.match(/```markdown\n([\s\S]*?)\n```/) || 
                             response.match(/^([\s\S]*)$/);
                             
        if (!markdownMatch) {
          throw new Error('No se pudo extraer la documentación del LLM');
        }
        
        const documentation = markdownMatch[1] || markdownMatch[0];
        
        // Guardar la documentación
        const docsPath = path.join(this.outputDir, 'docs', 'api-documentation.md');
        fs.writeFileSync(docsPath, documentation, 'utf-8');
        
        this.log('✅ Documentación generada con éxito');
        this.updateAgentStatus('idle');
        
        // Notificar al DocumentationAgent si está disponible
        this.sendEvent('API_DOCUMENTATION_GENERATED', {
          apiSpec: this.apiSpec,
          documentationPath: docsPath
        });
        
        return documentation;
      } catch (error) {
        this.log(`❌ Error generando documentación: ${error.message}`, 'error');
        this.updateAgentStatus('error', `Error generando documentación: ${error.message}`);
        throw error;
      }
    }
  
    /**
     * Genera un plan de pruebas de carga para la API
     */
    async generateLoadTestPlan(): Promise<string> {
      this.log('🔄 Generando plan de pruebas de carga');
      this.updateAgentStatus('working', 'Generando plan de pruebas de carga');
      
      try {
        const prompt = `
        # Tarea: Generación de Plan de Pruebas de Carga
        
        Basado en la siguiente especificación OpenAPI/Swagger:
        
        \`\`\`json
        ${JSON.stringify(this.swaggerSpec, null, 2)}
        \`\`\`
        
        Genera un plan de pruebas de carga para la API que incluya:
        
        1. Escenarios de prueba:
           - Carga normal
           - Carga pico
           - Prueba de estrés
           - Prueba de resistencia
        
        2. Métricas a monitorear:
           - Tiempo de respuesta
           - Throughput
           - Tasa de error
           - Uso de recursos (CPU, memoria, red)
        
        3. Herramientas recomendadas:
           - k6, JMeter, Locust, o Artillery
        
        4. Scripts de prueba para los endpoints principales
        
        5. Umbrales de aceptación:
           - Tiempos de respuesta máximos
           - Tasas de error máximas
        
        6. Plan de ejecución:
           - Frecuencia
           - Duración
           - Entornos
        
        Formatea el plan en Markdown y proporciona ejemplos de scripts para la herramienta recomendada.
        `;
        
        const response = await this.queryLLM(prompt);
        
        // Extraer el plan en Markdown
        const markdownMatch = response.match(/```markdown\n([\s\S]*?)\n```/) || 
                             response.match(/^([\s\S]*)$/);
                             
        if (!markdownMatch) {
          throw new Error('No se pudo extraer el plan de pruebas de carga del LLM');
        }
        
        const loadTestPlan = markdownMatch[1] || markdownMatch[0];
        
        // Guardar el plan de pruebas de carga
        const loadTestPlanPath = path.join(this.outputDir, 'docs', 'load-test-plan.md');
        fs.writeFileSync(loadTestPlanPath, loadTestPlan, 'utf-8');
        
        this.log('✅ Plan de pruebas de carga generado con éxito');
        this.updateAgentStatus('idle');
        
        // Notificar al TestAgent si está disponible
        this.sendEvent('API_LOAD_TEST_PLAN_GENERATED', {
          apiSpec: this.apiSpec,
          loadTestPlanPath: loadTestPlanPath
        });
        
        return loadTestPlan;
      } catch (error) {
        this.log(`❌ Error generando plan de pruebas de carga: ${error.message}`, 'error');
        this.updateAgentStatus('error', `Error generando plan de pruebas de carga: ${error.message}`);
        throw error;
      }
    }
  
    /**
     * Genera un Dockerfile y configuración Docker Compose para la API
     */
    async generateDockerConfig(): Promise<void> {
      this.log('🐳 Generando configuración Docker');
      this.updateAgentStatus('working', 'Generando configuración Docker');
      
      try {
        // Generar Dockerfile
        const dockerfile = `FROM node:16-alpine
  
  WORKDIR /app
  
  COPY package*.json ./
  
  RUN npm install --production
  
  COPY . .
  
  EXPOSE 5000
  
  CMD ["node", "index.js"]
  `;
        
        // Generar docker-compose.yml
        const dockerCompose = `version: '3'
  
  services:
    api:
      build: .
      ports:
        - "5000:5000"
      environment:
        - NODE_ENV=production
        - PORT=5000
        - MONGO_URI=mongodb://mongo:27017/api
        - JWT_SECRET=your_jwt_secret
      depends_on:
        - mongo
      restart: unless-stopped
      volumes:
        - ./logs:/app/logs
  
    mongo:
      image: mongo:5
      ports:
        - "27017:27017"
      volumes:
        - mongo-data:/data/db
      restart: unless-stopped
  
  volumes:
    mongo-data:
  `;
        
        // Generar .dockerignore
        const dockerignore = `node_modules
  npm-debug.log
  .git
  .gitignore
  .env
  .env.*
  logs
  *.log
  `;
        
        // Guardar los archivos
        this.saveFile('', 'Dockerfile', dockerfile);
        this.saveFile('', 'docker-compose.yml', dockerCompose);
        this.saveFile('', '.dockerignore', dockerignore);
        
        // Generar README para Docker
        const dockerReadme = `# Configuración Docker para la API
  
  ## Requisitos
  - Docker
  - Docker Compose
  
  ## Instrucciones
  
  ### Desarrollo
  \`\`\`bash
  # Construir y ejecutar los contenedores
  docker-compose up -d
  
  # Ver logs
  docker-compose logs -f
  \`\`\`
  
  ### Producción
  \`\`\`bash
  # Construir y ejecutar los contenedores en modo producción
  docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
  
  # Ver logs
  docker-compose logs -f
  \`\`\`
  
  ### Comandos útiles
  \`\`\`bash
  # Detener los contenedores
  docker-compose down
  
  # Reconstruir los contenedores
  docker-compose up -d --build
  
  # Ejecutar comandos dentro del contenedor
  docker-compose exec api npm run test
  \`\`\`
  `;
        
        this.saveFile('docs', 'docker-readme.md', dockerReadme);
        
        this.log('✅ Configuración Docker generada con éxito');
        this.updateAgentStatus('idle');
        
        // Notificar al DevOpsAgent si está disponible
        this.sendEvent('API_DOCKER_CONFIG_GENERATED', {
          apiSpec: this.apiSpec,
          dockerfilePath: path.join(this.outputDir, 'Dockerfile'),
          dockerComposePath: path.join(this.outputDir, 'docker-compose.yml')
        });
      } catch (error) {
        this.log(`❌ Error generando configuración Docker: ${error.message}`, 'error');
        this.updateAgentStatus('error', `Error generando configuración Docker: ${error.message}`);
        throw error;
      }
    }
  
    /**
     * Genera un archivo .env.example para la API
     */
    private generateEnvExample(): void {
      const envExample = `# Configuración del servidor
  PORT=5000
  NODE_ENV=development
  
  # Base de datos
  MONGO_URI=mongodb://localhost:27017/api
  MONGO_URI_TEST=mongodb://localhost:27017/api_test
  
  # JWT
  JWT_SECRET=your_jwt_secret_here
  JWT_EXPIRATION=1d
  
  # Logging
  LOG_LEVEL=info
  
  # Cors
  CORS_ORIGIN=*
  
  # Rate Limiting
  RATE_LIMIT_WINDOW_MS=900000
  RATE_LIMIT_MAX=100
  
  # Swagger
  SWAGGER_ENABLED=true
  `;
      
      this.saveFile('', '.env.example', envExample);
      this.log('📄 Generado archivo .env.example');
    }
  
    /**
     * Genera un archivo .gitignore para la API
     */
    private generateGitignore(): void {
      const gitignore = `# Dependencias
  node_modules/
  npm-debug.log
  yarn-debug.log
  yarn-error.log
  
  # Entorno
  .env
  .env.local
  .env.development.local
  .env.test.local
  .env.production.local
  
  # Logs
  logs/
  *.log
  
  # Cobertura de pruebas
  coverage/
  
  # Producción
  dist/
  build/
  
  # Misc
  .DS_Store
  .idea/
  .vscode/
  *.swp
  *.swo
  `;
      
      this.saveFile('', '.gitignore', gitignore);
      this.log('📄 Generado archivo .gitignore');
    }
  
    /**
     * Genera un archivo .eslintrc.js para la API
     */
    private generateEslintConfig(): void {
      const eslintConfig = `module.exports = {
    env: {
      node: true,
      es2021: true,
      jest: true,
    },
    extends: [
      'eslint:recommended',
    ],
    parserOptions: {
      ecmaVersion: 12,
      sourceType: 'module',
    },
    rules: {
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
      'indent': ['error', 2],
      'linebreak-style': ['error', 'unix'],
      'quotes': ['error', 'single'],
      'semi': ['error', 'always'],
      'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
    },
  };
  `;
      
      this.saveFile('', '.eslintrc.js', eslintConfig);
      this.log('📄 Generado archivo .eslintrc.js');
    }
  
    /**
     * Genera un archivo jest.config.js para la API
     */
    private generateJestConfig(): void {
      const jestConfig = `module.exports = {
    testEnvironment: 'node',
    verbose: true,
    collectCoverage: true,
    coverageDirectory: 'coverage',
    coveragePathIgnorePatterns: [
      '/node_modules/',
      '/tests/',
    ],
    testMatch: [
      '**/tests/**/*.test.js',
      '**/tests/**/*.spec.js',
    ],
    testPathIgnorePatterns: [
      '/node_modules/',
    ],
    setupFilesAfterEnv: [
      './tests/setup.js',
    ],
  };
  `;
      
      this.saveFile('', 'jest.config.js', jestConfig);
      this.log('📄 Generado archivo jest.config.js');
      
      // Generar archivo de configuración de pruebas
      const testSetup = `// Configuración para pruebas
  require('dotenv').config({ path: '.env.test' });
  const mongoose = require('mongoose');
  const { MongoMemoryServer } = require('mongodb-memory-server');
  
  let mongoServer;
  
  // Configurar conexión a MongoDB en memoria para pruebas
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
  });
  
  // Limpiar todas las colecciones después de cada prueba
  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });
  
  // Cerrar conexión y servidor después de todas las pruebas
  afterAll(async () => {
    await mongoose.connection.close();
    await mongoServer.stop();
  });
  
  // Silenciar logs durante las pruebas
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  `;
      
      this.saveFile('tests', 'setup.js', testSetup);
      this.log('📄 Generado archivo tests/setup.js');
    }
  
    /**
     * Genera un archivo nodemon.json para la API
     */
    private generateNodemonConfig(): void {
      const nodemonConfig = `{
    "watch": [
      "index.js",
      "server.js",
      "config.js",
      "controllers/**/*.js",
      "routes/**/*.js",
      "models/**/*.js",
      "middlewares/**/*.js"
    ],
    "ext": "js,json",
    "ignore": [
      "node_modules/",
      "tests/",
      "docs/",
      "coverage/"
    ],
    "env": {
      "NODE_ENV": "development"
    }
  }
  `;
      
      this.saveFile('', 'nodemon.json', nodemonConfig);
      this.log('📄 Generado archivo nodemon.json');
    }
  
    /**
     * Genera un archivo de configuración para CI/CD
     */
    private generateCIConfig(): void {
      // GitHub Actions workflow
      const githubWorkflow = `name: API CI/CD
  
  on:
    push:
      branches: [ main, develop ]
    pull_request:
      branches: [ main, develop ]
  
  jobs:
    test:
      runs-on: ubuntu-latest
      
      strategy:
        matrix:
          node-version: [14.x, 16.x]
          
      steps:
      - uses: actions/checkout@v2
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v2
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      
    build:
      needs: test
      runs-on: ubuntu-latest
      if: github.event_name == 'push' && (github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop')
      
      steps:
      - uses: actions/checkout@v2
      - name: Use Node.js 16.x
        uses: actions/setup-node@v2
        with:
          node-version: 16.x
          cache: 'npm'
      - run: npm ci
      - name: Build Docker image
        run: docker build -t api-restful:${{ github.sha }} .
      - name: Save Docker image
        run: docker save api-restful:${{ github.sha }} > api-restful.tar
      - name: Upload Docker image
        uses: actions/upload-artifact@v2
        with:
          name: docker-image
          path: api-restful.tar
          
    deploy-dev:
      needs: build
      runs-on: ubuntu-latest
      if: github.event_name == 'push' && github.ref == 'refs/heads/develop'
      
      steps:
      - uses: actions/checkout@v2
      - name: Download Docker image
        uses: actions/download-artifact@v2
        with:
          name: docker-image
      - name: Load Docker image
        run: docker load < api-restful.tar
      - name: Deploy to development
        run: echo "Deploying to development environment"
        # Aquí irían los comandos para desplegar en el entorno de desarrollo
        
    deploy-prod:
      needs: build
      runs-on: ubuntu-latest
      if: github.event_name == 'push' && github.ref == 'refs/heads/main'
      
      steps:
      - uses: actions/checkout@v2
      - name: Download Docker image
        uses: actions/download-artifact@v2
        with:
          name: docker-image
      - name: Load Docker image
        run: docker load < api-restful.tar
      - name: Deploy to production
        run: echo "Deploying to production environment"
        # Aquí irían los comandos para desplegar en el entorno de producción
  `;
      
      // Crear directorio para GitHub Actions
      const githubDir = path.join(this.outputDir, '.github', 'workflows');
      if (!fs.existsSync(githubDir)) {
        fs.mkdirSync(githubDir, { recursive: true });
      }
      
      fs.writeFileSync(path.join(githubDir, 'ci-cd.yml'), githubWorkflow, 'utf-8');
      this.log('📄 Generado archivo .github/workflows/ci-cd.yml');
    }
  
    /**
     * Genera un archivo de configuración para Postman
     */
    private generatePostmanCollection(): void {
      this.log('📬 Generando colección Postman');
      
      try {
        // Crear colección Postman basada en la especificación Swagger
        const postmanCollection = {
          info: {
            name: `${this.swaggerSpec.info.title || 'API'} Collection`,
            description: this.swaggerSpec.info.description || 'API Collection generated by CJ.DevMind API Agent',
            schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
          },
          item: []
        };
        
        // Convertir paths de Swagger a items de Postman
        for (const [path, methods] of Object.entries(this.swaggerSpec.paths)) {
          const folder = {
            name: path,
            item: []
          };
          
          for (const [method, details] of Object.entries(methods as any)) {
            const request = {
              name: (details as any).summary || `${method.toUpperCase()} ${path}`,
              request: {
                method: method.toUpperCase(),
                header: [
                  {
                    key: "Content-Type",
                    value: "application/json"
                  }
                ],
                url: {
                  raw: `{{baseUrl}}${path}`,
                  host: ["{{baseUrl}}"],
                  path: path.split('/').filter(p => p)
                },
                description: (details as any).description || "",
                body: method !== 'get' && method !== 'delete' ? {
                  mode: "raw",
                  raw: JSON.stringify(this.generateSampleRequestBody(details as any), null, 2),
                  options: {
                    raw: {
                      language: "json"
                    }
                  }
                } : undefined
              }
            };
            
            folder.item.push(request);
          }
          
          postmanCollection.item.push(folder);
        }
        
        // Añadir variables de entorno
        const postmanEnvironment = {
          id: "environment-id",
          name: `${this.swaggerSpec.info.title || 'API'} Environment`,
          values: [
            {
              key: "baseUrl",
              value: "http://localhost:5000/api",
              enabled: true
            },
            {
              key: "token",
              value: "",
              enabled: true
            }
          ]
        };
        
        // Guardar colección y entorno
        const postmanDir = path.join(this.outputDir, 'docs', 'postman');
        if (!fs.existsSync(postmanDir)) {
          fs.mkdirSync(postmanDir, { recursive: true });
        }
        
        fs.writeFileSync(
          path.join(postmanDir, 'collection.json'), 
          JSON.stringify(postmanCollection, null, 2), 
          'utf-8'
        );
        
        fs.writeFileSync(
          path.join(postmanDir, 'environment.json'), 
          JSON.stringify(postmanEnvironment, null, 2), 
          'utf-8'
        );
        
        this.log('✅ Colección Postman generada con éxito');
      } catch (error) {
        this.log(`⚠️ Error generando colección Postman: ${error.message}`, 'warning');
      }
    }
  
    /**
     * Genera un cuerpo de solicitud de ejemplo basado en la especificación
     */
    private generateSampleRequestBody(details: any): any {
      if (!details.requestBody || !details.requestBody.content || !details.requestBody.content['application/json']) {
        return {};
      }
      
      const schema = details.requestBody.content['application/json'].schema;
      return this.generateSampleFromSchema(schema);
    }
  
    /**
     * Genera un objeto de ejemplo basado en un esquema
     */
    private generateSampleFromSchema(schema: any): any {
      if (!schema) return {};
      
      // Si hay un ejemplo, usarlo
      if (schema.example) return schema.example;
      
      // Si es una referencia, buscar el esquema
      if (schema.$ref) {
        const refPath = schema.$ref.split('/');
        const refName = refPath[refPath.length - 1];
        const refSchema = this.swaggerSpec.components.schemas[refName];
        return this.generateSampleFromSchema(refSchema);
      }
      
      // Si es un objeto
      if (schema.type === 'object' || schema.properties) {
        const result = {};
        for (const [prop, propSchema] of Object.entries(schema.properties || {})) {
          result[prop] = this.generateSampleFromSchema(propSchema);
        }
        return result;
      }
      
      // Si es un array
      if (schema.type === 'array' && schema.items) {
        return [this.generateSampleFromSchema(schema.items)];
      }
      
      // Valores por defecto según el tipo
      switch (schema.type) {
        case 'string':
          return schema.format === 'date-time' ? new Date().toISOString() : 
                 schema.format === 'email' ? 'user@example.com' : 
                 schema.format === 'uuid' ? '00000000-0000-0000-0000-000000000000' : 
                 'string';
        case 'number':
        case 'integer':
          return 0;
        case 'boolean':
          return false;
        default:
          return null;
      }
    }
  
    /**
     * Genera un archivo de configuración para Insomnia
     */
    private generateInsomniaConfig(): void {
      this.log('🔄 Generando configuración Insomnia');
      
      try {
        // Crear configuración Insomnia basada en la especificación Swagger
        const insomniaConfig = {
          _type: "export",
          __export_format: 4,
          __export_date: new Date().toISOString(),
          __export_source: "cj.devmind.api-agent",
          resources: [
            {
              _id: "req_root",
              parentId: "wrk_root",
              modified: new Date().getTime(),
              created: new Date().getTime(),
              name: this.swaggerSpec.info.title || 'API',
              description: this.swaggerSpec.info.description || '',
              _type: "request_group"
            },
            {
              _id: "wrk_root",
              parentId: null,
              modified: new Date().getTime(),
              created: new Date().getTime(),
              name: `${this.swaggerSpec.info.title || 'API'} Workspace`,
              description: "",
              scope: "collection",
              _type: "workspace"
            },
            {
              _id: "env_base",
              parentId: "wrk_root",
              modified: new Date().getTime(),
              created: new Date().getTime(),
              name: "Base Environment",
              data: {
                base_url: "http://localhost:5000/api",
                token: ""
              },
              dataPropertyOrder: {
                "&": ["base_url", "token"]
              },
              color: null,
              isPrivate: false,
              metaSortKey: 1,
              _type: "environment"
            }
          ]
        };
        
        // Convertir paths de Swagger a recursos de Insomnia
        let requestCount = 0;
        for (const [path, methods] of Object.entries(this.swaggerSpec.paths)) {
          for (const [method, details] of Object.entries(methods as any)) {
            const requestId = `req_${requestCount++}`;
            
            const request = {
              _id: requestId,
              parentId: "req_root",
              modified: new Date().getTime(),
              created: new Date().getTime(),
              url: "{{ base_url }}{{ path }}",
              name: (details as any).summary || `${method.toUpperCase()} ${path}`,
              description: (details as any).description || "",
              method: method.toUpperCase(),
              body: {
                mimeType: "application/json",
                text: method !== 'get' && method !== 'delete' ? 
                  JSON.stringify(this.generateSampleRequestBody(details as any), null, 2) : ""
              },
              parameters: [],
              headers: [
                {
                  name: "Content-Type",
                  value: "application/json",
                  id: "pair_1"
                }
              ],
              authentication: {
                type: "bearer",
                token: "{{ token }}"
              },
              metaSortKey: requestCount,
              isPrivate: false,
              settingStoreCookies: true,
              settingSendCookies: true,
              settingDisableRenderRequestBody: false,
              settingEncodeUrl: true,
              settingRebuildPath: true,
              settingFollowRedirects: "global",
              _type: "request"
            };
            
            // Añadir parámetros de ruta
            if ((details as any).parameters) {
              for (const param of (details as any).parameters) {
                if (param.in === 'path') {
                  request.url = request.url.replace(`{${param.name}}`, `{{ ${param.name} }}`);
                }
              }
            }
            
            insomniaConfig.resources.push(request);
          }
        }
        
        // Guardar la configuración de Insomnia
        const insomniaDir = path.join(this.outputDir, 'docs', 'insomnia');
        if (!fs.existsSync(insomniaDir)) {
          fs.mkdirSync(insomniaDir, { recursive: true });
        }
        
        fs.writeFileSync(
          path.join(insomniaDir, 'insomnia-config.json'), 
          JSON.stringify(insomniaConfig, null, 2), 
          'utf-8'
        );
        
        this.log('✅ Configuración Insomnia generada con éxito');
      } catch (error) {
        this.log(`⚠️ Error generando configuración Insomnia: ${error.message}`, 'warning');
      }
    }

  /**
   * Genera un archivo README.md para la API
   */
  private generateReadme(): void {
    this.log('📝 Generando README.md');
    
    try {
      const readme = `# ${this.swaggerSpec.info.title || 'API RESTful'}

${this.swaggerSpec.info.description || 'API RESTful generada por CJ.DevMind API Agent'}

## Características

- Arquitectura RESTful
- Documentación OpenAPI/Swagger
- Validación de datos con Joi
- Autenticación JWT
- Manejo de errores centralizado
- Logging estructurado
- Tests unitarios y de integración
- Docker y Docker Compose
- CI/CD con GitHub Actions

## Requisitos

- Node.js >= 14.x
- MongoDB >= 4.x
- npm o yarn

## Instalación

\`\`\`bash
# Clonar el repositorio
git clone <url-del-repositorio>

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Iniciar en desarrollo
npm run dev
\`\`\`

## Estructura del Proyecto

\`\`\`
src/
├── controllers/    # Controladores de la API
├── models/         # Modelos de datos
├── routes/         # Definición de rutas
├── middlewares/    # Middlewares personalizados
├── utils/          # Utilidades y helpers
├── config/         # Configuraciones
├── services/       # Servicios de negocio
├── validations/    # Esquemas de validación
└── index.js        # Punto de entrada

tests/              # Tests unitarios y de integración
docs/               # Documentación adicional
\`\`\`

## Endpoints

La documentación completa de los endpoints está disponible en:

- Swagger UI: \`http://localhost:5000/api-docs\`
- Archivo OpenAPI: \`docs/openapi.json\`

## Docker

\`\`\`bash
# Construir y ejecutar con Docker Compose
docker-compose up -d

# Ver logs
docker-compose logs -f
\`\`\`

## Tests

\`\`\`bash
# Ejecutar todos los tests
npm test

# Ejecutar tests con coverage
npm run test:coverage
\`\`\`

## Licencia

MIT
`;
      
      this.saveFile('', 'README.md', readme);
      this.log('✅ README.md generado con éxito');
    } catch (error) {
      this.log(`⚠️ Error generando README.md: ${error.message}`, 'warning');
    }
  }

  /**
   * Genera un archivo package.json para la API
   */
  private generatePackageJson(): void {
    this.log('📦 Generando package.json');
    
    try {
      const packageJson = {
        name: this.swaggerSpec.info.title?.toLowerCase().replace(/\s+/g, '-') || 'api-restful',
        version: this.swaggerSpec.info.version || '1.0.0',
        description: this.swaggerSpec.info.description || 'API RESTful generada por CJ.DevMind API Agent',
        main: 'index.js',
        scripts: {
          start: 'node index.js',
          dev: 'nodemon index.js',
          test: 'jest',
          'test:coverage': 'jest --coverage',
          lint: 'eslint .',
          'lint:fix': 'eslint . --fix'
        },
        keywords: [
          'api',
          'restful',
          'express',
          'mongodb',
          'swagger',
          'openapi'
        ],
        author: 'CJ.DevMind',
        license: 'MIT',
        dependencies: {
          'express': '^4.17.1',
          'mongoose': '^5.13.7',
          'dotenv': '^10.0.0',
          'cors': '^2.8.5',
          'helmet': '^4.6.0',
          'joi': '^17.4.2',
          'jsonwebtoken': '^8.5.1',
          'bcryptjs': '^2.4.3',
          'morgan': '^1.10.0',
          'winston': '^3.3.3',
          'swagger-ui-express': '^4.1.6',
          'express-rate-limit': '^5.3.0',
          'compression': '^1.7.4',
          'express-async-errors': '^3.1.1'
        },
        devDependencies: {
          'nodemon': '^2.0.12',
          'jest': '^27.0.6',
          'supertest': '^6.1.6',
          'eslint': '^7.32.0',
          'mongodb-memory-server': '^7.3.6'
        }
      };
      
      this.saveFile('', 'package.json', JSON.stringify(packageJson, null, 2));
      this.log('✅ package.json generado con éxito');
    } catch (error) {
      this.log(`⚠️ Error generando package.json: ${error.message}`, 'warning');
    }
  }

  /**
   * Genera un archivo de configuración para la API
   */
  private generateConfigFile(): void {
    this.log('⚙️ Generando archivo de configuración');
    
    try {
      const configFile = `const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

const config = {
  // Servidor
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  
  // Base de datos
  db: {
    uri: process.env.MONGO_URI || 'mongodb://localhost:27017/api',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    },
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
    expiresIn: process.env.JWT_EXPIRATION || '1d',
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    dir: path.join(__dirname, '../logs'),
  },
  
  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // límite de solicitudes por IP
  },
  
  // Swagger
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
  },
};

module.exports = config;
`;
      
      this.saveFile('config', 'config.js', configFile);
      this.log('✅ Archivo de configuración generado con éxito');
    } catch (error) {
      this.log(`⚠️ Error generando archivo de configuración: ${error.message}`, 'warning');
    }
  }

  /**
   * Genera un archivo de utilidades para la API
   */
  private generateUtilsFiles(): void {
    this.log('🔧 Generando archivos de utilidades');
    
    try {
      // Utilidad para respuestas HTTP
      const responseUtil = `/**
 * Utilidad para respuestas HTTP estandarizadas
 */

/**
 * Envía una respuesta de éxito
 * @param {Object} res - Objeto de respuesta Express
 * @param {number} statusCode - Código de estado HTTP
 * @param {*} data - Datos a enviar
 * @param {string} message - Mensaje descriptivo
 */
const success = (res, statusCode = 200, data = null, message = 'Operación exitosa') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Envía una respuesta de error
 * @param {Object} res - Objeto de respuesta Express
 * @param {number} statusCode - Código de estado HTTP
 * @param {string} message - Mensaje de error
 * @param {*} errors - Detalles del error
 */
const error = (res, statusCode = 500, message = 'Error interno del servidor', errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
};

module.exports = {
  success,
  error,
};
`;
      
      // Utilidad para logging
      const loggerUtil = `const winston = require('winston');
const path = require('path');
const config = require('../config/config');

// Crear directorio de logs si no existe
const fs = require('fs');
if (!fs.existsSync(config.logging.dir)) {
  fs.mkdirSync(config.logging.dir, { recursive: true });
}

// Configurar formato de logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Crear logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  defaultMeta: { service: 'api-service' },
  transports: [
    // Logs de consola
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => \`\${info.timestamp} \${info.level}: \${info.message}\${info.stack ? '\\n' + info.stack : ''}\`
        )
      ),
    }),
    // Logs de archivo - errores
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'error.log'),
      level: 'error',
    }),
    // Logs de archivo - todos los niveles
    new winston.transports.File({
      filename: path.join(config.logging.dir, 'combined.log'),
    }),
  ],
});

// Middleware de logging para Express
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(\`\${req.method} \${req.originalUrl} \${res.statusCode} \${duration}ms\`, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  
  next();
};

module.exports = {
  logger,
  requestLogger,
};
`;
      
      // Utilidad para validación
      const validationUtil = `const Joi = require('joi');

/**
 * Middleware para validar datos de solicitud
 * @param {Object} schema - Esquema Joi para validación
 * @param {string} property - Propiedad de la solicitud a validar (body, params, query)
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false });
    
    if (!error) {
      return next();
    }
    
    const errors = error.details.map((detail) => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors,
    });
  };
};

module.exports = {
  validate,
};
`;
      
      // Utilidad para autenticación
      const authUtil = `const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Genera un token JWT
 * @param {Object} payload - Datos a incluir en el token
 * @returns {string} Token JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

/**
 * Verifica un token JWT
 * @param {string} token - Token JWT a verificar
 * @returns {Object} Payload decodificado
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

/**
 * Middleware para verificar autenticación
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado - Token no proporcionado',
      });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado - Token inválido',
      error: error.message,
    });
  }
};

/**
 * Middleware para verificar roles
 * @param {string[]} roles - Roles permitidos
 */
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado - Usuario no autenticado',
      });
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Prohibido - No tiene permisos suficientes',
      });
    }
    
    next();
  };
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  authorize,
};
`;
      
      // Guardar archivos de utilidades
      this.saveFile('utils', 'response.js', responseUtil);
      this.saveFile('utils', 'logger.js', loggerUtil);
      this.saveFile('utils', 'validation.js', validationUtil);
      this.saveFile('utils', 'auth.js', authUtil);
      
      this.log('✅ Archivos de utilidades generados con éxito');
    } catch (error) {
      this.log(`⚠️ Error generando archivos de utilidades: ${error.message}`, 'warning');
    }
  }

  /**
   * Genera el archivo principal de la API
   */
  private generateMainFile(): void {
    this.log('🚀 Generando archivo principal');
    
    try {
      const mainFile = `require('express-async-errors');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');

const config = require('./config/config');
const { logger, requestLogger } = require('./utils/logger');
const routes = require('./routes');

// Crear aplicación Express
const app = express();

// Middleware básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(config.cors));
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    success: false,
    message: 'Demasiadas solicitudes, por favor intente más tarde',
  },
});
app.use('/api', limiter);

// Rutas
app.use('/api', routes);

// Swagger
if (config.swagger.enabled) {
  const swaggerSpec = JSON.parse(fs.readFileSync(path.join(__dirname, '../docs/openapi.json'), 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  logger.info('Swagger UI disponible en /api-docs');
}

// Middleware de manejo de errores
app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(config.env === 'development' && { stack: err.stack }),
  });
});

// Ruta no encontrada
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Conectar a MongoDB
mongoose
  .connect(config.db.uri, config.db.options)
  .then(() => {
    logger.info(\`Conectado a MongoDB en \${config.db.uri}\`);
    
    // Iniciar servidor
    const server = app.listen(config.port, () => {
      logger.info(\`Servidor iniciado en el puerto \${config.port} en modo \${config.env}\`);
    });
    
    // Manejo de cierre graceful
    const gracefulShutdown = () => {
      logger.info('Cerrando servidor...');
      server.close(() => {
        logger.info('Servidor cerrado');
        mongoose.connection.close(false, () => {
          logger.info('Conexión a MongoDB cerrada');
          process.exit(0);
        });
      });
    };
    
    // Escuchar señales de cierre
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  })
  .catch((err) => {
    logger.error(\`Error conectando a MongoDB: \${err.message}\`);
    process.exit(1);
  });

// Exportar app para testing
module.exports = app;
`;
      
      // Archivo de rutas principal
      const routesFile = `const express = require('express');
const router = express.Router();

// Importar rutas específicas
${this.generateRouteImports()}

// Ruta de estado
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Registrar rutas específicas
${this.generateRouteRegistrations()}

module.exports = router;
`;
      
      this.saveFile('', 'index.js', mainFile);
      this.saveFile('routes', 'index.js', routesFile);
      
      this.log('✅ Archivos principales generados con éxito');
    } catch (error) {
      this.log(`⚠️ Error generando archivos principales: ${error.message}`, 'warning');
    }
  }

  /**
   * Genera las importaciones de rutas basadas en la especificación Swagger
   */
  private generateRouteImports(): string {
    const tags = new Set<string>();
    
    // Extraer tags únicos de la especificación
    for (const [_, methods] of Object.entries(this.swaggerSpec.paths)) {
      for (const [__, operation] of Object.entries(methods as any)) {
        if ((operation as any).tags && (operation as any).tags.length > 0) {
          tags.add((operation as any).tags[0]);
        }
      }
    }
    
    // Si no hay tags, usar nombres predeterminados
    if (tags.size === 0) {
      return `const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');`;
    }
    
    // Generar importaciones basadas en tags
    return Array.from(tags)
      .map(tag => {
        const routeName = tag.toLowerCase().replace(/\s+/g, '-');
        return `const ${routeName}Routes = require('./${routeName}.routes');`;
      })
      .join('\n');
  }

  /**
   * Genera los registros de rutas basados en la especificación Swagger
   */
  private generateRouteRegistrations(): string {
    const tags = new Set<string>();
    
    // Extraer tags únicos de la especificación
    for (const [_, methods] of Object.entries(this.swaggerSpec.paths)) {
      for (const [__, operation] of Object.entries(methods as any)) {
        if ((operation as any).tags && (operation as any).tags.length > 0) {
          tags.add((operation as any).tags[0]);
        }
      }
    }
    
    // Si no hay tags, usar nombres predeterminados
    if (tags.size === 0) {
      return `router.use('/auth', authRoutes);
router.use('/users', userRoutes);`;
    }
    
    // Generar registros basados en tags
    return Array.from(tags)
      .map(tag => {
        const routeName = tag.toLowerCase().replace(/\s+/g, '-');
        const routePath = `/${routeName}`;
        return `router.use('${routePath}', ${routeName}Routes);`;
      })
      .join('\n');
  }

  /**
   * Genera todos los archivos necesarios para la API
   */
  async generateAllFiles(): Promise<void> {
    this.log('🏗️ Generando todos los archivos de la API');
    this.updateAgentStatus('working', 'Generando archivos de la API');
    
    try {
      // Crear directorios necesarios
      this.createDirectories();
      
      // Generar archivos de configuración
      this.generateEnvExample();
      this.generateGitignore();
      this.generateEslintConfig();
      this.generateJestConfig();
      this.generateNodemonConfig();
      this.generateCIConfig();
      
      // Generar archivos principales
      this.generatePackageJson();
      this.generateConfigFile();
      this.generateUtilsFiles();
      this.generateMainFile();
      this.generateReadme();
      
      // Generar documentación
      await this.generateAPIDocumentation();
      
      // Generar configuración Docker
      await this.generateDockerConfig();
      
      // Generar colecciones para herramientas de API
      this.generatePostmanCollection();
      this.generateInsomniaConfig();
      
      // Generar análisis de seguridad
      await this.analyzeAPISecurity();
      
      // Generar plan de pruebas de carga
      await this.generateLoadTestPlan();
      
      this.log('✅ Todos los archivos generados con éxito');
      this.updateAgentStatus('idle');
      
      return;
    } catch (error) {
      this.log(`❌ Error generando archivos: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error generando archivos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Crea los directorios necesarios para la API
   */
  private createDirectories(): void {
    this.log('📁 Creando directorios');
    
    const directories = [
      '',
      'config',
      'controllers',
      'models',
      'routes',
      'middlewares',
      'utils',
      'services',
      'validations',
      'tests',
      'docs',
      'docs/postman',
      'logs'
    ];
    
    for (const dir of directories) {
      const dirPath = path.join(this.outputDir, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    }
    
    this.log('✅ Directorios creados con éxito');
  }

  /**
   * Guarda un archivo en el directorio de salida
   */
  private saveFile(subdir: string, filename: string, content: string): void {
    const filePath = path.join(this.outputDir, subdir, filename);
    const dirPath = path.dirname(filePath);
    
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    fs.writeFileSync(filePath, content, 'utf-8');
    this.log(`📄 Guardado archivo: ${path.join(subdir, filename)}`);
  }

  /**
   * Lee un archivo de contexto
   */
  private readContext(filename: string): string {
    try {
      const contextPath = path.join(process.cwd(), 'context', filename);
      if (fs.existsSync(contextPath)) {
        return fs.readFileSync(contextPath, 'utf-8');
      }
      return '';
    } catch (error) {
      this.log(`⚠️ Error leyendo contexto ${filename}: ${error.message}`, 'warning');
      return '';
    }
  }
}