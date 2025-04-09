import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';

/**
 * API Agent - Diseña y genera APIs RESTful
 * 
 * Este agente es responsable de:
 * 1. Diseñar endpoints RESTful basados en requisitos
 * 2. Generar controladores y rutas para Express/Node.js
 * 3. Implementar validación de datos y manejo de errores
 * 4. Documentar la API con OpenAPI/Swagger
 * 5. Generar pruebas para los endpoints
 */
export class APIAgent extends BaseAgent {
  constructor() {
    super('API Agent');
  }
  
  /**
   * Ejecuta el API Agent para diseñar y generar una API
   * @param apiSpec Especificación de la API a crear
   */
  async run(apiSpec: string): Promise<void> {
    console.log(`🔌 API Agent diseñando API para: "${apiSpec}"`);
    
    // Leer contexto relevante
    const coreContext = this.readContext('core.md');
    const rulesContext = this.readContext('rules.md');
    
    // Crear prompt para el LLM
    const apiPrompt = `
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
    
    La API debe seguir principios RESTful, incluir manejo adecuado de errores, y seguir las mejores prácticas de seguridad.
    `;
    
    // En modo real, consultaríamos al LLM
    let apiDesign, controllersCode, routesCode, middlewareCode, swaggerCode, testsCode;
    
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      try {
        const result = await this.queryLLM(apiPrompt);
        
        // Extraer las diferentes partes de la respuesta
        apiDesign = this.extractSection(result, 'Diseño de API');
        controllersCode = this.extractCodeBlock(result, 'controllers');
        routesCode = this.extractCodeBlock(result, 'routes');
        middlewareCode = this.extractCodeBlock(result, 'middleware');
        swaggerCode = this.extractCodeBlock(result, 'swagger');
        testsCode = this.extractCodeBlock(result, 'tests');
        
        // Guardar los archivos generados
        this.saveAPIFiles(apiSpec, apiDesign, controllersCode, routesCode, middlewareCode, swaggerCode, testsCode);
      } catch (error) {
        console.error('❌ Error generando API:', error);
        return;
      }
    } else {
      // Modo simulado para desarrollo
      console.log('🧪 Ejecutando en modo simulado');
      
      // Generar archivos simulados
      apiDesign = this.generateSimulatedAPIDesign(apiSpec);
      controllersCode = this.generateSimulatedControllers();
      routesCode = this.generateSimulatedRoutes();
      middlewareCode = this.generateSimulatedMiddleware();
      swaggerCode = this.generateSimulatedSwagger(apiSpec);
      testsCode = this.generateSimulatedTests();
      
      // Guardar los archivos simulados
      this.saveAPIFiles(apiSpec, apiDesign, controllersCode, routesCode, middlewareCode, swaggerCode, testsCode);
    }
    
    // Mostrar resultado
    console.log('\n✅ API generada con éxito:');
    console.log('- api-design.md');
    console.log('- controllers/');
    console.log('- routes/');
    console.log('- middleware/');
    console.log('- swagger.json');
    console.log('- tests/');
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
   * Guarda los archivos de la API
   */
  private saveAPIFiles(
    apiSpec: string,
    apiDesign: string,
    controllersCode: string,
    routesCode: string,
    middlewareCode: string,
    swaggerCode: string,
    testsCode: string
  ): void {
    // Crear directorios si no existen
    const apiDir = path.join(process.cwd(), 'api');
    const controllersDir = path.join(apiDir, 'controllers');
    const routesDir = path.join(apiDir, 'routes');
    const middlewareDir = path.join(apiDir, 'middleware');
    const testsDir = path.join(apiDir, 'tests');
    
    [apiDir, controllersDir, routesDir, middlewareDir, testsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Guardar archivos
    fs.writeFileSync(path.join(apiDir, 'api-design.md'), apiDesign, 'utf-8');
    fs.writeFileSync(path.join(controllersDir, 'userController.js'), controllersCode, 'utf-8');
    fs.writeFileSync(path.join(routesDir, 'userRoutes.js'), routesCode, 'utf-8');
    fs.writeFileSync(path.join(middlewareDir, 'validation.js'), middlewareCode, 'utf-8');
    fs.writeFileSync(path.join(apiDir, 'swagger.json'), swaggerCode, 'utf-8');
    fs.writeFileSync(path.join(testsDir, 'userApi.test.js'), testsCode, 'utf-8');
  }
  
  /**
   * Genera un diseño de API simulado
   */
  private generateSimulatedAPIDesign(apiSpec: string): string {
    return `# Diseño de API: ${apiSpec}

## Endpoints

### Usuarios

#### GET /api/users
- Descripción: Obtiene la lista de usuarios
- Parámetros de consulta:
  - page (opcional): Número de página
  - limit (opcional): Límites de resultados por página
- Respuesta exitosa: 200 OK
  \`\`\`json
  {
    "users": [
      {
        "id": 1,
        "name": "John Doe",
        "email": "john@example.com",
        "role": "user",
        "createdAt": "2023-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10
    }
  }
  \`\`\`

#### GET /api/users/:id
- Descripción: Obtiene un usuario por ID
- Parámetros de ruta:
  - id: ID del usuario
- Respuesta exitosa: 200 OK
  \`\`\`json
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "createdAt": "2023-01-01T00:00:00Z"
  }
  \`\`\`
- Respuesta de error: 404 Not Found
  \`\`\`json
  {
    "error": "Usuario no encontrado"
  }
  \`\`\`

#### POST /api/users
- Descripción: Crea un nuevo usuario
- Body:
  \`\`\`json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword",
    "role": "user"
  }
  \`\`\`
- Respuesta exitosa: 201 Created
  \`\`\`json
  {
    "id": 2,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "user",
    "createdAt": "2023-01-02T00:00:00Z"
  }
  \`\`\`
- Respuesta de error: 400 Bad Request
  \`\`\`json
  {
    "error": "Datos de usuario inválidos",
    "details": {
      "email": "El email ya está en uso"
    }
  }
  \`\`\`

#### PUT /api/users/:id
- Descripción: Actualiza un usuario existente
- Parámetros de ruta:
  - id: ID del usuario
- Body:
  \`\`\`json
  {
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "role": "admin"
  }
  \`\`\`
- Respuesta exitosa: 200 OK
  \`\`\`json
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "role": "admin",
    "updatedAt": "2023-01-03T00:00:00Z"
  }
  \`\`\`

#### DELETE /api/users/:id
- Descripción: Elimina un usuario
- Parámetros de ruta:
  - id: ID del usuario
- Respuesta exitosa: 204 No Content
- Respuesta de error: 404 Not Found
  \`\`\`json
  {
    "error": "Usuario no encontrado"
  }
  \`\`\`

## Autenticación

#### POST /api/auth/login
- Descripción: Inicia sesión de usuario
- Body:
  \`\`\`json
  {
    "email": "john@example.com",
    "password": "securepassword"
  }
  \`\`\`
- Respuesta exitosa: 200 OK
  \`\`\`json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "role": "user"
    }
  }
  \`\`\`
- Respuesta de error: 401 Unauthorized
  \`\`\`json
  {
    "error": "Credenciales inválidas"
  }
  \`\`\`

## Consideraciones de Seguridad

- Todas las rutas excepto /api/auth/login requieren autenticación mediante JWT
- Los tokens JWT expiran después de 24 horas
- Las contraseñas se almacenan hasheadas con bcrypt
- Se implementa rate limiting para prevenir ataques de fuerza bruta
- Se validan todos los inputs para prevenir inyecciones
`;
  }
  
  /**
   * Genera controladores simulados
   */
  private generateSimulatedControllers(): string {
    return `const User = require('../models/User');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const users = await User.find().skip(skip).limit(limit);
    const total = await User.countDocuments();
    
    res.status(200).json({
      users,
      pagination: {
        total,
        page,
        limit
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

/**
 * @desc    Create new user
 * @route   POST /api/users
 * @access  Private/Admin
 */
exports.createUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { name, email, password, role } = req.body;
  
  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (user) {
      return res.status(400).json({
        error: 'Datos de usuario inválidos',
        details: { email: 'El email ya está en uso' }
      });
    }
    
    // Create new user
    user = new User({
      name,
      email,
      password,
      role: role || 'user'
    });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    await user.save();
    
    // Remove password from response
    const response = user.toObject();
    delete response.password;
    
    res.status(201).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const { name, email, role } = req.body;
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    
    user.updatedAt = Date.now();
    
    await user.save();
    
    // Remove password from response
    const response = user.toObject();
    delete response.password;
    
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    await user.remove();
    
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { email, password } = req.body;
  
  try {
    // Check if user exists
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    
    // Generate JWT
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        
        // Remove password from response
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.status(200).json({
          token,
          user: userResponse
        });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};
`;
  }
  
  /**
   * Genera rutas simuladas
   */
  private generateSimulatedRoutes(): string {
    return `const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', [auth, admin], userController.getUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/:id', [auth, admin], userController.getUserById);

// @route   POST /api/users
// @desc    Create a new user
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    admin,
    [
      check('name', 'El nombre es requerido').not().isEmpty(),
      check('email', 'Por favor incluya un email válido').isEmail(),
      check('password', 'Por favor ingrese una contraseña con 6 o más caracteres').isLength({ min: 6 })
    ]
  ],
  userController.createUser
);

// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Private/Admin
router.put(
  '/:id',
  [
    auth,
    admin,
    [
      check('name', 'El nombre es requerido').optional(),
      check('email', 'Por favor incluya un email válido').optional().isEmail(),
      check('role', 'Rol inválido').optional().isIn(['user', 'admin'])
    ]
  ],
  userController.updateUser
);

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private/Admin
router.delete('/:id', [auth, admin], userController.deleteUser);

module.exports = router;

// Auth routes
const authRouter = express.Router();

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
authRouter.post(
  '/login',
  [
    check('email', 'Por favor incluya un email válido').isEmail(),
    check('password', 'La contraseña es requerida').exists()
  ],
  userController.login
);

module.exports.authRouter = authRouter;
`;
  }
  
  /**
   * Genera middleware simulado
   */
  private generateSimulatedMiddleware(): string {
    return `const { validationResult } = require('express-validator');

/**
 * Middleware para validar requests
 */
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

/**
 * Middleware para rate limiting
 */
exports.rateLimiter = (req, res, next) => {
  // Implementación simulada de rate limiting
  // En producción, usar una librería como express-rate-limit
  next();
};

/**
 * Middleware para sanitizar inputs
 */
exports.sanitizeInputs = (req, res, next) => {
  // Sanitizar inputs para prevenir XSS, inyección SQL, etc.
  // En producción, usar una librería como express-validator
  next();
};

/**
 * Middleware para validar IDs de MongoDB
 */
exports.validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  // Validar que el ID tenga el formato correcto de MongoDB
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  
  next();
};

/**
 * Middleware para manejo de errores
 */
exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  // Determinar el código de estado
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack
  });
};
`;
  }
  
  /**
   * Genera documentación Swagger simulada
   */
  private generateSimulatedSwagger(apiSpec: string): string {
    return `{
  "openapi": "3.0.0",
  "info": {
    "title": "${apiSpec} API",
    "description": "API RESTful para ${apiSpec}",
    "version": "1.0.0"
  },
  "servers": [
    {
      "url": "http://localhost:5000",
      "description": "Servidor de desarrollo"
    }
  ],
  "paths": {
    "/api/users": {
      "get": {
        "summary": "Obtiene todos los usuarios",
        "description": "Retorna una lista paginada de usuarios",
        "tags": ["Users"],
        "security": [{ "bearerAuth": [] }],
        "parameters": [
          {
            "in": "query",
            "name": "page",
            "schema": {
              "type": "integer",
              "default": 1
            },
            "description": "Número de página"
          },
          {
            "in": "query",
            "name": "limit",
            "schema": {
              "type": "integer",
              "default": 10
            },
            "description": "Número de resultados por página"
          }
        ],
        "responses": {
          "200": {
            "description": "Lista de usuarios",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "users": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/User"
                      }
                    },
                    "pagination": {
                      "type": "object",
                      "properties": {
                        "total": {
                          "type": "integer"
                        },
                        "page": {
                          "type": "integer"
                        },
                        "limit": {
                          "type": "integer"
                        }
                      }
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "No autorizado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Prohibido",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      },
      "post": {
        "summary": "Crea un nuevo usuario",
        "description": "Crea un nuevo usuario en el sistema",
        "tags": ["Users"],
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["name", "email", "password"],
                "properties": {
                  "name": {
                    "type": "string"
                  },
                  "email": {
                    "type": "string",
                    "format": "email"
                  },
                  "password": {
                    "type": "string",
                    "format": "password",
                    "minLength": 6
                  },
                  "role": {
                    "type": "string",
                    "enum": ["user", "admin"],
                    "default": "user"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "201": {
            "description": "Usuario creado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/User"
                }
              }
            }
          },
          "400": {
            "description": "Datos inválidos",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "401": {
            "description": "No autorizado",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          },
          "403": {
            "description": "Prohibido",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    },
    "/api/auth/login": {
      "post": {
        "summary": "Inicia sesión de usuario",
        "description": "Autentica un usuario y devuelve un token JWT",
        "tags": ["Auth"],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "required": ["email", "password"],
                "properties": {
                  "email": {
                    "type": "string",
                    "format": "email"
                  },
                  "password": {
                    "type": "string",
                    "format": "password"
                  }
                }
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Login exitoso",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "token": {
                      "type": "string"
                    },
                    "user": {
                      "$ref": "#/components/schemas/User"
                    }
                  }
                }
              }
            }
          },
          "401": {
            "description": "Credenciales inválidas",
            "content": {
              "application/json": {
                "schema": {
                  "$ref": "#/components/schemas/Error"
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "User": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "email": {
            "type": "string",
            "format": "email"
          },
          "role": {
            "type": "string",
            "enum": ["user", "admin"]
          },
          "createdAt": {
            "type": "string",
            "format": "date-time"
          },
          "updatedAt": {
            "type": "string",
            "format": "date-time"
          }
        }
      },
      "Error": {
        "type": "object",
        "properties": {
          "error": {
            "type": "string"
          },
          "details": {
            "type": "object"
          }
        }
      }
    },
    "securitySchemes": {
      "bearerAuth": {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT"
      }
    }
  }
}`;
  }
  
    /**
   * Genera pruebas simuladas
   */
  private generateSimulatedTests(): string {
    return `const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Mock data
const adminUser = {
  _id: mongoose.Types.ObjectId(),
  name: 'Admin User',
  email: 'admin@test.com',
  password: '$2a$10$XHvjKkJRhEf1dgN4NyU5.uYEXTwq/SfJ9J.uXvD6JZKqFZ8cHzk8e', // hashed 'password123'
  role: 'admin'
};

const regularUser = {
  _id: mongoose.Types.ObjectId(),
  name: 'Regular User',
  email: 'user@test.com',
  password: '$2a$10$XHvjKkJRhEf1dgN4NyU5.uYEXTwq/SfJ9J.uXvD6JZKqFZ8cHzk8e', // hashed 'password123'
  role: 'user'
};

// Setup and teardown
beforeAll(async () => {
  // Connect to test database
  await mongoose.connect(process.env.MONGO_URI_TEST, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  });
  
  // Create test users
  await User.create([adminUser, regularUser]);
});

afterAll(async () => {
  // Clean up database
  await User.deleteMany({});
  await mongoose.connection.close();
});

// Generate tokens for testing
const adminToken = jwt.sign(
  { user: { id: adminUser._id, role: adminUser.role } },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

const userToken = jwt.sign(
  { user: { id: regularUser._id, role: regularUser.role } },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

describe('User API Routes', () => {
  describe('GET /api/users', () => {
    test('should get all users if admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', \`Bearer \${adminToken}\`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.users).toBeInstanceOf(Array);
    });
    
    test('should not allow access if not admin', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', \`Bearer \${userToken}\`);
      
      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('error');
    });
    
    test('should not allow access without token', async () => {
      const res = await request(app).get('/api/users');
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });
  });
  
  describe('GET /api/users/:id', () => {
    test('should get user by ID if admin', async () => {
      const res = await request(app)
        .get(\`/api/users/\${regularUser._id}\`)
        .set('Authorization', \`Bearer \${adminToken}\`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', regularUser.name);
      expect(res.body).toHaveProperty('email', regularUser.email);
    });
    
    test('should return 404 if user not found', async () => {
      const fakeId = mongoose.Types.ObjectId();
      const res = await request(app)
        .get(\`/api/users/\${fakeId}\`)
        .set('Authorization', \`Bearer \${adminToken}\`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Usuario no encontrado');
    });
  });
  
  describe('POST /api/users', () => {
    test('should create a new user if admin', async () => {
      const newUser = {
        name: 'New Test User',
        email: 'newuser@test.com',
        password: 'password123',
        role: 'user'
      };
      
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', \`Bearer \${adminToken}\`)
        .send(newUser);
      
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('name', newUser.name);
      expect(res.body).toHaveProperty('email', newUser.email);
      expect(res.body).toHaveProperty('role', newUser.role);
      expect(res.body).not.toHaveProperty('password');
    });
    
    test('should not allow duplicate emails', async () => {
      const duplicateUser = {
        name: 'Duplicate User',
        email: 'admin@test.com', // Already exists
        password: 'password123',
        role: 'user'
      };
      
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', \`Bearer \${adminToken}\`)
        .send(duplicateUser);
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.details).toHaveProperty('email');
    });
  });
  
  describe('PUT /api/users/:id', () => {
    test('should update user if admin', async () => {
      const updatedInfo = {
        name: 'Updated User Name',
        email: 'updated@test.com'
      };
      
      const res = await request(app)
        .put(\`/api/users/\${regularUser._id}\`)
        .set('Authorization', \`Bearer \${adminToken}\`)
        .send(updatedInfo);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('name', updatedInfo.name);
      expect(res.body).toHaveProperty('email', updatedInfo.email);
    });
    
    test('should return 404 if user not found', async () => {
      const fakeId = mongoose.Types.ObjectId();
      const res = await request(app)
        .put(\`/api/users/\${fakeId}\`)
        .set('Authorization', \`Bearer \${adminToken}\`)
        .send({ name: 'Test' });
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Usuario no encontrado');
    });
  });
  
  describe('DELETE /api/users/:id', () => {
    test('should delete user if admin', async () => {
      // First create a user to delete
      const userToDelete = await User.create({
        name: 'Delete Me',
        email: 'delete@test.com',
        password: 'password123',
        role: 'user'
      });
      
      const res = await request(app)
        .delete(\`/api/users/\${userToDelete._id}\`)
        .set('Authorization', \`Bearer \${adminToken}\`);
      
      expect(res.statusCode).toBe(204);
      
      // Verify user was deleted
      const deletedUser = await User.findById(userToDelete._id);
      expect(deletedUser).toBeNull();
    });
    
    test('should return 404 if user not found', async () => {
      const fakeId = mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(\`/api/users/\${fakeId}\`)
        .set('Authorization', \`Bearer \${adminToken}\`);
      
      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty('error', 'Usuario no encontrado');
    });
  });
  
  describe('POST /api/auth/login', () => {
    test('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('name', adminUser.name);
      expect(res.body.user).toHaveProperty('email', adminUser.email);
      expect(res.body.user).not.toHaveProperty('password');
    });
    
    test('should not login with invalid email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrong@test.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Credenciales inválidas');
    });
    
    test('should not login with invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@test.com',
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Credenciales inválidas');
    });
  });
});
`;
  }
}

// Función auxiliar para mantener compatibilidad con código existente
export async function apiAgent(apiSpec: string): Promise<string> {
  const agent = new APIAgent();
  await agent.run(apiSpec);
  return "Ejecutado con éxito";
}