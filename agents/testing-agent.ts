import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';

/**
 * Testing Agent - Genera pruebas automatizadas para el código
 * 
 * Este agente es responsable de:
 * 1. Analizar el código fuente para entender su estructura y funcionalidad
 * 2. Generar pruebas unitarias para funciones y clases
 * 3. Generar pruebas de integración para módulos
 * 4. Generar pruebas end-to-end para flujos completos
 * 5. Configurar herramientas de testing (Jest, Mocha, Cypress, etc.)
 */
export class TestingAgent extends BaseAgent {
  constructor() {
    super('Testing Agent');
  }
  
  /**
   * Ejecuta el Testing Agent para generar pruebas automatizadas
   * @param testSpec Especificación de las pruebas a generar
   */
  async run(testSpec: string): Promise<void> {
    console.log(`🧪 Testing Agent generando pruebas para: "${testSpec}"`);
    
    // Leer contexto relevante
    const coreContext = this.readContext('core.md');
    const rulesContext = this.readContext('rules.md');
    
    // Determinar el tipo de pruebas a generar
    const testType = this.determineTestType(testSpec);
    
    // Analizar el código fuente si se proporciona una ruta
    let sourceCode = '';
    if (fs.existsSync(testSpec)) {
      try {
        sourceCode = fs.readFileSync(testSpec, 'utf-8');
      } catch (error) {
        console.warn(`⚠️ No se pudo leer el archivo: ${testSpec}`);
      }
    }
    
    // Crear prompt para el LLM
    const testPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Reglas Arquitectónicas
    ${rulesContext}
    
    # Tarea de Testing Agent
    Actúa como el Testing Agent de CJ.DevMind. Tu tarea es generar pruebas automatizadas basadas en la siguiente especificación:
    
    "${testSpec}"
    
    Tipo de pruebas: ${testType}
    
    ${sourceCode ? '# Código Fuente a Probar\n```\n' + sourceCode + '\n```\n' : ''}
    
    Genera:
    1. Configuración del entorno de pruebas
    2. Pruebas ${testType === 'unit' ? 'unitarias' : testType === 'integration' ? 'de integración' : 'end-to-end'}
    3. Mocks y stubs necesarios
    4. Casos de prueba para escenarios positivos y negativos
    
    Las pruebas deben seguir las mejores prácticas, ser mantenibles, y proporcionar una buena cobertura del código.
    `;
    
    // En modo real, consultaríamos al LLM
    let testConfig, testCases, mocksCode;
    
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      try {
        const result = await this.queryLLM(testPrompt);
        
        // Extraer las diferentes partes de la respuesta
        testConfig = this.extractCodeBlock(result, 'config');
        testCases = this.extractCodeBlock(result, 'test');
        mocksCode = this.extractCodeBlock(result, 'mock');
        
        // Guardar los archivos generados
        this.saveTestFiles(testSpec, testType, testConfig, testCases, mocksCode);
      } catch (error) {
        console.error('❌ Error generando pruebas:', error);
        return;
      }
    } else {
      // Modo simulado para desarrollo
      console.log('🧪 Ejecutando en modo simulado');
      
      // Generar archivos simulados
      testConfig = this.generateSimulatedTestConfig(testType);
      testCases = this.generateSimulatedTestCases(testSpec, testType);
      mocksCode = this.generateSimulatedMocks(testType);
      
      // Guardar los archivos simulados
      this.saveTestFiles(testSpec, testType, testConfig, testCases, mocksCode);
    }
    
    // Mostrar resultado
    console.log('\n✅ Pruebas generadas con éxito:');
    console.log('- jest.config.js');
    console.log('- __tests__/');
    console.log('- __mocks__/');
  }
  
  /**
   * Determina el tipo de pruebas basado en la especificación
   */
  private determineTestType(testSpec: string): 'unit' | 'integration' | 'e2e' {
    const unitKeywords = ['unitaria', 'unit', 'función', 'function', 'clase', 'class', 'componente', 'component'];
    const integrationKeywords = ['integración', 'integration', 'módulo', 'module', 'servicio', 'service', 'api'];
    const e2eKeywords = ['e2e', 'end-to-end', 'flujo', 'flow', 'usuario', 'user', 'interfaz', 'ui', 'cypress'];
    
    const lowerSpec = testSpec.toLowerCase();
    
    // Contar ocurrencias de palabras clave
    const unitCount = unitKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    const integrationCount = integrationKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    const e2eCount = e2eKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    
    // Determinar el tipo basado en la mayor cantidad de palabras clave
    if (e2eCount > unitCount && e2eCount > integrationCount) {
      return 'e2e';
    } else if (integrationCount > unitCount) {
      return 'integration';
    } else {
      return 'unit';
    }
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
   * Guarda los archivos de pruebas
   */
  private saveTestFiles(
    testSpec: string,
    testType: 'unit' | 'integration' | 'e2e',
    testConfig: string,
    testCases: string,
    mocksCode: string
  ): void {
    // Crear directorios si no existen
    const testsDir = path.join(process.cwd(), '__tests__');
    const mocksDir = path.join(process.cwd(), '__mocks__');
    
    [testsDir, mocksDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Determinar nombres de archivo
    let testFileName, mockFileName;
    
    if (fs.existsSync(testSpec)) {
      // Si es un archivo, usar su nombre para los archivos de prueba
      const baseName = path.basename(testSpec, path.extname(testSpec));
      testFileName = `${baseName}.test.js`;
      mockFileName = `${baseName}.mock.js`;
    } else {
      // Si es una descripción, usar un nombre genérico
      testFileName = `${testType}-tests.test.js`;
      mockFileName = `${testType}-mocks.js`;
    }
    
    // Guardar archivos
    fs.writeFileSync(path.join(process.cwd(), 'jest.config.js'), testConfig, 'utf-8');
    fs.writeFileSync(path.join(testsDir, testFileName), testCases, 'utf-8');
    
    if (mocksCode) {
      fs.writeFileSync(path.join(mocksDir, mockFileName), mocksCode, 'utf-8');
    }
  }
  
  /**
   * Genera configuración de pruebas simulada
   */
  private generateSimulatedTestConfig(testType: 'unit' | 'integration' | 'e2e'): string {
    return `// Jest configuration
module.exports = {
  // Directorio raíz donde Jest debería buscar archivos
  rootDir: '.',
  
  // Extensiones de archivo que Jest debería buscar
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  
  // Patrón para encontrar archivos de prueba
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  
  // Transformaciones para archivos
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  
  // Directorios que Jest debería ignorar
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  
  // Configuración de cobertura
  collectCoverage: true,
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.{js,ts}',
    '!src/setupTests.{js,ts}',
  ],
  
  // Umbral de cobertura
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Configuración específica para el tipo de prueba
  ${testType === 'unit' ? `
  // Configuración para pruebas unitarias
  testEnvironment: 'node',
  ` : testType === 'integration' ? `
  // Configuración para pruebas de integración
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  ` : `
  // Configuración para pruebas e2e
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '@testing-library/jest-dom/extend-expect'],
  `}
  
  // Configuración de mocks
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  
  // Tiempo máximo de ejecución para cada prueba
  testTimeout: ${testType === 'e2e' ? 30000 : 5000},
  
  // Mostrar mensajes de diagnóstico detallados
  verbose: true,
};
`;
  }
  
  /**
   * Genera casos de prueba simulados
   */
  private generateSimulatedTestCases(testSpec: string, testType: 'unit' | 'integration' | 'e2e'): string {
    if (testType === 'unit') {
      return `// Pruebas unitarias para: ${testSpec}
const { sum, subtract, multiply, divide } = require('../src/math');

describe('Funciones matemáticas', () => {
  describe('sum', () => {
    test('debería sumar dos números positivos correctamente', () => {
      expect(sum(2, 3)).toBe(5);
    });
    
    test('debería manejar números negativos', () => {
      expect(sum(-2, 3)).toBe(1);
      expect(sum(2, -3)).toBe(-1);
      expect(sum(-2, -3)).toBe(-5);
    });
    
    test('debería manejar cero', () => {
      expect(sum(0, 3)).toBe(3);
      expect(sum(2, 0)).toBe(2);
      expect(sum(0, 0)).toBe(0);
    });
    
    test('debería manejar números decimales', () => {
      expect(sum(2.5, 3.5)).toBeCloseTo(6);
    });
  });
  
  describe('subtract', () => {
    test('debería restar dos números positivos correctamente', () => {
      expect(subtract(5, 3)).toBe(2);
    });
    
    test('debería manejar números negativos', () => {
      expect(subtract(-2, 3)).toBe(-5);
      expect(subtract(2, -3)).toBe(5);
      expect(subtract(-2, -3)).toBe(1);
    });
    
    test('debería manejar cero', () => {
      expect(subtract(0, 3)).toBe(-3);
      expect(subtract(2, 0)).toBe(2);
      expect(subtract(0, 0)).toBe(0);
    });
  });
  
  describe('multiply', () => {
    test('debería multiplicar dos números positivos correctamente', () => {
      expect(multiply(2, 3)).toBe(6);
    });
    
    test('debería manejar números negativos', () => {
      expect(multiply(-2, 3)).toBe(-6);
      expect(multiply(2, -3)).toBe(-6);
      expect(multiply(-2, -3)).toBe(6);
    });
    
    test('debería manejar cero', () => {
      expect(multiply(0, 3)).toBe(0);
      expect(multiply(2, 0)).toBe(0);
      expect(multiply(0, 0)).toBe(0);
    });
  });
  
  describe('divide', () => {
    test('debería dividir dos números positivos correctamente', () => {
      expect(divide(6, 3)).toBe(2);
    });
    
    test('debería manejar números negativos', () => {
      expect(divide(-6, 3)).toBe(-2);
      expect(divide(6, -3)).toBe(-2);
      expect(divide(-6, -3)).toBe(2);
    });
    
    test('debería lanzar error al dividir por cero', () => {
      expect(() => divide(2, 0)).toThrow('División por cero no permitida');
    });
    
    test('debería manejar cero en el numerador', () => {
      expect(divide(0, 3)).toBe(0);
    });
  });
});
`;
    } else if (testType === 'integration') {
      return `// Pruebas de integración para: ${testSpec}
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User');

// Configuración de la base de datos de prueba
beforeAll(async () => {
  const url = process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/test_db';
  await mongoose.connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  });
});

// Limpiar la base de datos después de cada prueba
afterEach(async () => {
  await User.deleteMany();
});

// Cerrar la conexión después de todas las pruebas
afterAll(async () => {
  await mongoose.connection.close();
});

describe('API de Usuarios', () => {
  describe('POST /api/users', () => {
    test('debería crear un nuevo usuario', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(201);
      
      // Verificar la respuesta
      expect(response.body).toHaveProperty('_id');
      expect(response.body.name).toBe(userData.name);
      expect(response.body.email).toBe(userData.email);
      expect(response.body).not.toHaveProperty('password');
      
      // Verificar que el usuario se guardó en la base de datos
      const user = await User.findOne({ email: userData.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(userData.name);
    });
    
    test('debería devolver error si falta información requerida', async () => {
      const userData = {
        name: 'Test User',
        // Falta el email
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      
      // Verificar que no se creó el usuario
      const userCount = await User.countDocuments();
      expect(userCount).toBe(0);
    });
    
    test('debería devolver error si el email ya existe', async () => {
      // Crear un usuario primero
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123'
      });
      
      // Intentar crear otro usuario con el mismo email
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/api/users')
        .send(userData)
        .expect(400);
      
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('email');
      
      // Verificar que solo existe un usuario
      const userCount = await User.countDocuments();
      expect(userCount).toBe(1);
    });
  });
  
  describe('GET /api/users', () => {
    test('debería obtener todos los usuarios', async () => {
      // Crear algunos usuarios de prueba
      const users = [
        { name: 'User 1', email: 'user1@example.com', password: 'password123' },
        { name: 'User 2', email: 'user2@example.com', password: 'password123' }
      ];
      
      await User.insertMany(users);
      
      const response = await request(app)
        .get('/api/users')
        .expect(200);
      
      expect(response.body).toBeInstanceOf(Array);
      expect(response.body.length).toBe(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0]).not.toHaveProperty('password');
    });
  });
  
  describe('GET /api/users/:id', () => {
    test('debería obtener un usuario por ID', async () => {
      // Crear un usuario de prueba
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      const response = await request(app)
        .get(\`/api/users/\${user._id}\`)
        .expect(200);
      
      expect(response.body).toHaveProperty('_id', user._id.toString());
      expect(response.body.name).toBe(user.name);
      expect(response.body.email).toBe(user.email);
      expect(response.body).not.toHaveProperty('password');
    });
    
    test('debería devolver 404 si el usuario no existe', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(\`/api/users/\${nonExistentId}\`)
        .expect(404);
    });
  });
  
  describe('PUT /api/users/:id', () => {
    test('debería actualizar un usuario existente', async () => {
      // Crear un usuario de prueba
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      const updatedData = {
        name: 'Updated Name',
        email: 'updated@example.com'
      };
      
      const response = await request(app)
        .put(\`/api/users/\${user._id}\`)
        .send(updatedData)
        .expect(200);
      
      expect(response.body).toHaveProperty('_id', user._id.toString());
      expect(response.body.name).toBe(updatedData.name);
      expect(response.body.email).toBe(updatedData.email);
      
      // Verificar que el usuario se actualizó en la base de datos
      const updatedUser = await User.findById(user._id);
      expect(updatedUser.name).toBe(updatedData.name);
      expect(updatedUser.email).toBe(updatedData.email);
    });
  });
  
  describe('DELETE /api/users/:id', () => {
    test('debería eliminar un usuario existente', async () => {
      // Crear un usuario de prueba
      const user = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123'
      });
      
      await request(app)
        .delete(\`/api/users/\${user._id}\`)
        .expect(204);
      
      // Verificar que el usuario fue eliminado
      const deletedUser = await User.findById(user._id);
      expect(deletedUser).toBeNull();
    });
  });
});
`;
    } else {
      return `// Pruebas end-to-end para: ${testSpec}
import { test, expect } from '@playwright/test';

// Pruebas de flujo de usuario
test.describe('Flujo de usuario completo', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de inicio
    await page.goto('http://localhost:3000');
  });
  
  test('debería permitir a un usuario registrarse, iniciar sesión y actualizar su perfil', async ({ page }) => {
    // 1. Registro de usuario
    await test.step('Registro de usuario', async () => {
      // Navegar a la página de registro
      await page.click('text=Registrarse');
      
      // Verificar que estamos en la página de registro
      expect(page.url()).toContain('/register');
      
      // Completar el formulario de registro
      await page.fill('input[name="name"]', 'Test User');
      await page.fill('input[name="email"]', \`test\${Date.now()}@example.com\`);
      await page.fill('input[name="password"]', 'Password123!');
      await page.fill('input[name="confirmPassword"]', 'Password123!');
      
      // Enviar el formulario
      await page.click('button[type="submit"]');
      
      // Verificar que el registro fue exitoso
      await page.waitForSelector('text=Registro exitoso');
      expect(await page.isVisible('text=Registro exitoso')).toBeTruthy();
    });
    
    // 2. Inicio de sesión
    await test.step('Inicio de sesión', async () => {
      // Navegar a la página de inicio de sesión
      await page.click('text=Iniciar sesión');
      
      // Verificar que estamos en la página de inicio de sesión
      expect(page.url()).toContain('/login');
      
      // Completar el formulario de inicio de sesión
      await page.fill('input[name="email"]', \`test\${Date.now()}@example.com\`);
      await page.fill('input[name="password"]', 'Password123!');
      
      // Enviar el formulario
      await page.click('button[type="submit"]');
      
      // Verificar que el inicio de sesión fue exitoso
      await page.waitForSelector('text=Bienvenido');
      expect(await page.isVisible('text=Bienvenido')).toBeTruthy();
    });
    
    // 3. Actualización de perfil
    await test.step('Actualización de perfil', async () => {
      // Navegar al perfil
      await page.click('text=Perfil');
      
      // Verificar que estamos en la página de perfil
      expect(page.url()).toContain('/profile');
      
      // Actualizar información del perfil
      await page.fill('input[name="name"]', 'Updated User Name');
      
      // Guardar cambios
      await page.click('button:has-text("Guardar cambios")');
      
      // Verificar que la actualización fue exitosa
      await page.waitForSelector('text=Perfil actualizado');
      expect(await page.isVisible('text=Perfil actualizado')).toBeTruthy();
      
      // Verificar que el nombre se actualizó
      const nameValue = await page.inputValue('input[name="name"]');
      expect(nameValue).toBe('Updated User Name');
    });
    
    // 4. Cierre de sesión
    await test.step('Cierre de sesión', async () => {
      // Cerrar sesión
      await page.click('text=Cerrar sesión');
      
      // Verificar que el cierre de sesión fue exitoso
      await page.waitForSelector('text=Iniciar sesión');
      expect(await page.isVisible('text=Iniciar sesión')).toBeTruthy();
      
      // Verificar que estamos en la página de inicio
      expect(page.url()).toBe('http://localhost:3000/');
    });
  });
  
  test('debería mostrar errores de validación en el formulario de registro', async ({ page }) => {
    // Navegar a la página de registro
    await page.click('text=Registrarse');
    
    // Enviar el formulario vacío
    await page.click('button[type="submit"]');
    
    // Verificar que se muestran los errores de validación
    expect(await page.isVisible('text=El nombre es requerido')).toBeTruthy();
    expect(await page.isVisible('text=El email es requerido')).toBeTruthy();
    expect(await page.isVisible('text=La contraseña es requerida')).toBeTruthy();
    
    // Completar solo el campo de nombre
    await page.fill('input[name="name"]', 'Test User');
    await page.click('button[type="submit"]');
    
    // Verificar que se siguen mostrando algunos errores
    expect(await page.isVisible('text=El email es requerido')).toBeTruthy();
    expect(await page.isVisible('text=La contraseña es requerida')).toBeTruthy();
    
    // Completar con un email inválido
    await page.fill('input[name="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    
    // Verificar que se muestra el error de email inválido
    expect(await page.isVisible('text=Email inválido')).toBeTruthy();
  });
  
  test('debería mostrar error al iniciar sesión con credenciales incorrectas', async ({ page }) => {
    // Navegar a la página de inicio de sesión
    await page.click('text=Iniciar sesión');
    
    // Completar el formulario con credenciales incorrectas
    await page.fill('input[name="email"]', 'nonexistent@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    
    // Enviar el formulario
    await page.click('button[type="submit"]');
    
    // Verificar que se muestra el error
    await page.waitForSelector('text=Credenciales inválidas');
    expect(await page.isVisible('text=Credenciales inválidas')).toBeTruthy();
  });
});

test.describe('Navegación y elementos de la interfaz', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });
  
  test('debería tener un encabezado con logo y navegación', async ({ page }) => {
    // Verificar que el encabezado está presente
    expect(await page.isVisible('header')).toBeTruthy();
    
    // Verificar que el logo está presente
    expect(await page.isVisible('img[alt="Logo"]')).toBeTruthy();
    
    // Verificar que los enlaces de navegación están presentes
    expect(await page.isVisible('text=Inicio')).toBeTruthy();
    expect(await page.isVisible('text=Acerca de')).toBeTruthy();
    expect(await page.isVisible('text=Contacto')).toBeTruthy();
  });
  
  test('debería tener un pie de página con información de contacto', async ({ page }) => {
    // Verificar que el pie de página está presente
    expect(await page.isVisible('footer')).toBeTruthy();
    
    // Verificar que la información de contacto está presente
    expect(await page.isVisible('text=Contacto')).toBeTruthy();
    expect(await page.isVisible('text=info@example.com')).toBeTruthy();
  });
  
  test('debería navegar correctamente entre páginas', async ({ page }) => {
    // Navegar a la página "Acerca de"
    await page.click('text=Acerca de');
    expect(page.url()).toContain('/about');
    
    // Navegar a la página "Contacto"
    await page.click('text=Contacto');
    expect(page.url()).toContain('/contact');
    
    // Volver a la página de inicio
    await page.click('text=Inicio');
    expect(page.url()).toBe('http://localhost:3000/');
  });
});
`;
    }
  }
  
    /**
   * Genera mocks simulados
   */
  private generateSimulatedMocks(testType: 'unit' | 'integration' | 'e2e'): string {
    if (testType === 'unit') {
      return `// Mocks para pruebas unitarias
jest.mock('../src/services/apiService');
const apiService = require('../src/services/apiService');

// Mock para la función fetchData
apiService.fetchData.mockImplementation(() => {
  return Promise.resolve({
    id: 1,
    name: 'Producto de prueba',
    price: 99.99,
    description: 'Este es un producto de prueba para las pruebas unitarias'
  });
});

// Mock para la función saveData
apiService.saveData.mockImplementation((data) => {
  return Promise.resolve({
    success: true,
    id: 1,
    ...data
  });
});

// Mock para la función deleteData
apiService.deleteData.mockImplementation((id) => {
  return Promise.resolve({
    success: true,
    message: \`Elemento con ID \${id} eliminado correctamente\`
  });
});

// Mock para simular errores
export const mockApiError = () => {
  apiService.fetchData.mockImplementation(() => {
    return Promise.reject(new Error('Error al obtener datos'));
  });
  
  apiService.saveData.mockImplementation(() => {
    return Promise.reject(new Error('Error al guardar datos'));
  });
  
  apiService.deleteData.mockImplementation(() => {
    return Promise.reject(new Error('Error al eliminar datos'));
  });
};

// Función para resetear todos los mocks
export const resetMocks = () => {
  apiService.fetchData.mockReset();
  apiService.saveData.mockReset();
  apiService.deleteData.mockReset();
};
`;
    } else if (testType === 'integration') {
      return `// Mocks para pruebas de integración
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Configurar base de datos en memoria para pruebas
module.exports.setupDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  
  const mongooseOpts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  };
  
  await mongoose.connect(uri, mongooseOpts);
};

// Cerrar conexión y servidor
module.exports.teardownDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};

// Limpiar todas las colecciones
module.exports.clearDB = async () => {
  const collections = mongoose.connection.collections;
  
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
};

// Datos de prueba para usuarios
module.exports.userTestData = [
  {
    name: 'Usuario Administrador',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin'
  },
  {
    name: 'Usuario Regular',
    email: 'user@example.com',
    password: 'User123!',
    role: 'user'
  }
];

// Datos de prueba para productos
module.exports.productTestData = [
  {
    name: 'Producto 1',
    description: 'Descripción del producto 1',
    price: 19.99,
    stock: 100
  },
  {
    name: 'Producto 2',
    description: 'Descripción del producto 2',
    price: 29.99,
    stock: 50
  }
];

// Mock para JWT
module.exports.generateTestToken = (userId, role = 'user') => {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '1h' }
  );
};
`;
    } else {
      return `// Mocks para pruebas end-to-end
// Este archivo configura interceptores para Playwright

// Función para configurar los mocks en la página
async function setupMocks(page) {
  // Interceptar peticiones de API
  await page.route('**/api/users', async (route) => {
    const method = route.request().method();
    
    if (method === 'GET') {
      // Mock para obtener usuarios
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            name: 'Usuario de Prueba',
            email: 'test@example.com',
            role: 'user'
          },
          {
            id: 2,
            name: 'Administrador',
            email: 'admin@example.com',
            role: 'admin'
          }
        ])
      });
    } else if (method === 'POST') {
      // Mock para crear usuario
      const requestBody = JSON.parse(await route.request().postData());
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 3,
          ...requestBody,
          createdAt: new Date().toISOString()
        })
      });
    }
  });
  
  // Interceptar peticiones de autenticación
  await page.route('**/api/auth/login', async (route) => {
    const requestBody = JSON.parse(await route.request().postData());
    
    // Simular credenciales correctas
    if (requestBody.email === 'test@example.com' && requestBody.password === 'Password123!') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-jwt-token',
          user: {
            id: 1,
            name: 'Usuario de Prueba',
            email: 'test@example.com',
            role: 'user'
          }
        })
      });
    } else {
      // Simular credenciales incorrectas
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Credenciales inválidas'
        })
      });
    }
  });
  
  // Interceptar peticiones de productos
  await page.route('**/api/products', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 1,
          name: 'Producto 1',
          price: 19.99,
          description: 'Descripción del producto 1',
          image: 'https://via.placeholder.com/150'
        },
        {
          id: 2,
          name: 'Producto 2',
          price: 29.99,
          description: 'Descripción del producto 2',
          image: 'https://via.placeholder.com/150'
        }
      ])
    });
  });
  
  // Configurar localStorage para simular sesión iniciada
  await page.evaluate(() => {
    localStorage.setItem('token', 'mock-jwt-token');
    localStorage.setItem('user', JSON.stringify({
      id: 1,
      name: 'Usuario de Prueba',
      email: 'test@example.com',
      role: 'user'
    }));
  });
}

module.exports = { setupMocks };
`;
    }
  }
}

// Función auxiliar para mantener compatibilidad con código existente
export async function testingAgent(testSpec: string): Promise<string> {
  const agent = new TestingAgent();
  await agent.run(testSpec);
  return "Ejecutado con éxito";
}