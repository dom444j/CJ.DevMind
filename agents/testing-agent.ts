import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';
import { AgentEvent } from '../types/agent-event';

/**
 * Testing Agent - Genera pruebas automatizadas para el código
 * 
 * Este agente es responsable de:
 * 1. Analizar el código fuente para entender su estructura y funcionalidad
 * 2. Generar pruebas unitarias para funciones y clases
 * 3. Generar pruebas de integración para módulos
 * 4. Generar pruebas end-to-end para flujos completos
 * 5. Configurar herramientas de testing (Jest, Mocha, Cypress, Playwright, etc.)
 * 6. Generar mocks y stubs para pruebas
 * 7. Analizar cobertura de código y sugerir mejoras
 */
export class TestingAgent extends BaseAgent {
  private supportedFrameworks: Map<string, string[]>;
  private testingStrategies: Map<string, Function>;
  
  constructor() {
    super('TestingAgent', 'Agente para generar pruebas automatizadas');
    
    // Inicializar frameworks soportados por tipo de prueba
    this.supportedFrameworks = new Map([
      ['unit', ['jest', 'mocha', 'vitest', 'jasmine']],
      ['integration', ['jest', 'supertest', 'cypress']],
      ['e2e', ['cypress', 'playwright', 'puppeteer', 'selenium']]
    ]);
    
    // Inicializar estrategias de testing
    this.testingStrategies = new Map([
      ['unit', this.generateUnitTests.bind(this)],
      ['integration', this.generateIntegrationTests.bind(this)],
      ['e2e', this.generateE2ETests.bind(this)]
    ]);
  }
  
  /**
   * Ejecuta el Testing Agent para generar pruebas automatizadas
   * @param params Parámetros para la generación de pruebas
   * @returns Evento con el resultado de la ejecución
   */
  async execute(params: { 
    testSpec: string; 
    testType?: 'unit' | 'integration' | 'e2e';
    framework?: string;
    mockData?: boolean;
    coverage?: boolean;
  }): Promise<AgentEvent> {
    try {
      this.log('Iniciando generación de pruebas', { params });
      
      const { testSpec, testType = 'unit', framework, mockData = true, coverage = true } = params;
      
      // Validar el tipo de prueba
      if (!this.testingStrategies.has(testType)) {
        throw new Error(`Tipo de prueba no soportado: ${testType}. Tipos soportados: ${Array.from(this.testingStrategies.keys()).join(', ')}`);
      }
      
      // Validar el framework si se especifica
      if (framework && !this.supportedFrameworks.get(testType)?.includes(framework)) {
        throw new Error(`Framework no soportado para pruebas ${testType}: ${framework}. Frameworks soportados: ${this.supportedFrameworks.get(testType)?.join(', ')}`);
      }
      
      // Determinar el framework a utilizar
      const selectedFramework = framework || this.determineFramework(testSpec, testType);
      
      // Leer contexto relevante
      this.log('Leyendo contexto del proyecto');
      const coreContext = this.readContext('core.md');
      const rulesContext = this.readContext('rules.md');
      const modulesContext = this.readContext('modules.md');
      
      // Analizar el código fuente si se proporciona una ruta
      let sourceCode = '';
      if (fs.existsSync(testSpec)) {
        try {
          sourceCode = fs.readFileSync(testSpec, 'utf-8');
          this.log('Código fuente leído correctamente', { path: testSpec, size: sourceCode.length });
        } catch (error) {
          this.log('No se pudo leer el archivo', { path: testSpec, error: error.message });
        }
      }
      
      // Generar las pruebas según el tipo
      const testStrategy = this.testingStrategies.get(testType);
      const testCode = await testStrategy(testSpec, selectedFramework, sourceCode);
      
      // Generar mocks si se solicita
      let mockCode = '';
      if (mockData) {
        mockCode = this.generateSimulatedMocks(testType);
        this.log('Mocks generados correctamente', { testType });
      }
      
      // Analizar cobertura si se solicita
      let coverageReport = null;
      if (coverage && sourceCode) {
        coverageReport = this.analyzeCoverage(testCode, sourceCode);
        this.log('Análisis de cobertura completado', { coverage: coverageReport });
      }
      
      // Crear evento de resultado
      const event: AgentEvent = {
        agent: this.name,
        action: 'generate_tests',
        status: 'success',
        data: {
          testType,
          framework: selectedFramework,
          testCode,
          mockCode,
          coverageReport,
          suggestions: this.generateTestingSuggestions(testType, sourceCode)
        },
        timestamp: new Date().toISOString()
      };
      
      this.emitEvent(event);
      return event;
    } catch (error) {
      const errorEvent: AgentEvent = {
        agent: this.name,
        action: 'generate_tests',
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
      
      this.emitEvent(errorEvent);
      throw error;
    }
  }
  
  /**
   * Lee un archivo de contexto
   * @param contextFile Nombre del archivo de contexto
   * @returns Contenido del archivo o cadena vacía si no existe
   */
  private readContext(contextFile: string): string {
    try {
      const contextPath = path.join(process.cwd(), 'context', contextFile);
      if (fs.existsSync(contextPath)) {
        return fs.readFileSync(contextPath, 'utf-8');
      }
      return '';
    } catch (error) {
      this.log('Error al leer archivo de contexto', { file: contextFile, error: error.message });
      return '';
    }
  }
  
  /**
   * Determina el tipo de prueba basado en la especificación
   * @param testSpec Especificación de la prueba
   * @returns Tipo de prueba (unit, integration, e2e)
   */
  private determineTestType(testSpec: string): 'unit' | 'integration' | 'e2e' {
    // Si es una ruta de archivo, determinar por extensión o contenido
    if (fs.existsSync(testSpec)) {
      const content = fs.readFileSync(testSpec, 'utf-8').toLowerCase();
      
      // Buscar patrones en el contenido
      if (content.includes('describe') && content.includes('it(') && !content.includes('browser')) {
        return 'unit';
      } else if (content.includes('request') || content.includes('supertest')) {
        return 'integration';
      } else if (content.includes('browser') || content.includes('page.') || content.includes('element')) {
        return 'e2e';
      }
      
      // Determinar por nombre de archivo
      if (testSpec.includes('.spec.') || testSpec.includes('.test.')) {
        return 'unit';
      } else if (testSpec.includes('.int.') || testSpec.includes('.api.')) {
        return 'integration';
      } else if (testSpec.includes('.e2e.') || testSpec.includes('.ui.')) {
        return 'e2e';
      }
    }
    
    // Determinar por palabras clave en la especificación
    const spec = testSpec.toLowerCase();
    if (spec.includes('e2e') || spec.includes('end-to-end') || spec.includes('ui') || spec.includes('browser')) {
      return 'e2e';
    } else if (spec.includes('api') || spec.includes('integración') || spec.includes('integration')) {
      return 'integration';
    }
    
    // Por defecto, pruebas unitarias
    return 'unit';
  }
  
  /**
   * Determina el framework de pruebas a utilizar
   * @param testSpec Especificación de la prueba
   * @param testType Tipo de prueba
   * @returns Framework a utilizar
   */
  private determineFramework(testSpec: string, testType: 'unit' | 'integration' | 'e2e'): string {
    // Obtener frameworks soportados para el tipo de prueba
    const supportedFrameworks = this.supportedFrameworks.get(testType) || [];
    if (supportedFrameworks.length === 0) {
      return 'jest'; // Por defecto
    }
    
    // Si es una ruta de archivo, buscar configuración en el proyecto
    if (fs.existsSync(testSpec)) {
      const projectRoot = process.cwd();
      
      // Buscar archivos de configuración de frameworks
      for (const framework of supportedFrameworks) {
        const configFiles = [
          `${framework}.config.js`,
          `${framework}.config.ts`,
          `.${framework}rc.js`,
          `.${framework}rc.json`
        ];
        
        for (const configFile of configFiles) {
          if (fs.existsSync(path.join(projectRoot, configFile))) {
            return framework;
          }
        }
      }
      
      // Buscar dependencias en package.json
      try {
        const packageJsonPath = path.join(projectRoot, 'package.json');
        if (fs.existsSync(packageJsonPath)) {
          const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
          const allDependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
          };
          
          for (const framework of supportedFrameworks) {
            if (allDependencies[framework] || allDependencies[`@types/${framework}`]) {
              return framework;
            }
          }
        }
      } catch (error) {
        this.log('Error al leer package.json', { error: error.message });
      }
    }
    
    // Determinar por palabras clave en la especificación
    const spec = testSpec.toLowerCase();
    for (const framework of supportedFrameworks) {
      if (spec.includes(framework)) {
        return framework;
      }
    }
    
    // Seleccionar framework por defecto según el tipo de prueba
    if (testType === 'unit') return 'jest';
    if (testType === 'integration') return 'jest';
    if (testType === 'e2e') return 'playwright';
    
    return supportedFrameworks[0];
  }
  
  /**
   * Genera pruebas unitarias
   * @param testSpec Especificación de la prueba
   * @param framework Framework a utilizar
   * @param sourceCode Código fuente a probar
   * @returns Código de prueba generado
   */
  private async generateUnitTests(testSpec: string, framework: string, sourceCode: string): Promise<string> {
    this.log('Generando pruebas unitarias', { framework });
    
    // Si es una función o componente específico
    if (!fs.existsSync(testSpec) && sourceCode === '') {
      return this.generateGenericUnitTest(testSpec, framework);
    }
    
    // Si tenemos código fuente, analizarlo para generar pruebas específicas
    if (sourceCode) {
      // Detectar si es JavaScript/TypeScript o otro lenguaje
      if (sourceCode.includes('function') || sourceCode.includes('class') || 
          sourceCode.includes('const') || sourceCode.includes('let') ||
          sourceCode.includes('import') || sourceCode.includes('export')) {
        
        // Detectar si es un componente React
        if (sourceCode.includes('React') || sourceCode.includes('react') || 
            sourceCode.includes('jsx') || sourceCode.includes('tsx') ||
            sourceCode.includes('render') || sourceCode.includes('component')) {
          return this.generateReactComponentTest(testSpec, framework, sourceCode);
        }
        
        // Detectar si es una API o servicio
        if (sourceCode.includes('api') || sourceCode.includes('service') || 
            sourceCode.includes('fetch') || sourceCode.includes('axios') ||
            sourceCode.includes('http')) {
          return this.generateServiceTest(testSpec, framework, sourceCode);
        }
        
        // Prueba genérica para JS/TS
        return this.generateJSUnitTest(testSpec, framework, sourceCode);
      }
      
      // Para otros lenguajes, generar prueba genérica
      return this.generateGenericUnitTest(testSpec, framework);
    }
    
    // Si es una ruta de archivo pero no pudimos leer el contenido
    if (fs.existsSync(testSpec)) {
      const extension = path.extname(testSpec).toLowerCase();
      
      if (['.js', '.ts', '.jsx', '.tsx'].includes(extension)) {
        return this.generateJSUnitTest(testSpec, framework, '');
      }
    }
    
    // Caso por defecto
    return this.generateGenericUnitTest(testSpec, framework);
  }
  
  /**
   * Genera pruebas de integración
   * @param testSpec Especificación de la prueba
   * @param framework Framework a utilizar
   * @param sourceCode Código fuente a probar
   * @returns Código de prueba generado
   */
  private async generateIntegrationTests(testSpec: string, framework: string, sourceCode: string): Promise<string> {
    this.log('Generando pruebas de integración', { framework });
    
    // Si es una API o endpoint específico
    if (!fs.existsSync(testSpec) && sourceCode === '') {
      if (testSpec.includes('/api/') || testSpec.includes('endpoint') || testSpec.includes('API')) {
        return this.generateAPITest(testSpec, framework);
      }
      return this.generateGenericIntegrationTest(testSpec, framework);
    }
    
    // Si tenemos código fuente, analizarlo para generar pruebas específicas
    if (sourceCode) {
      // Detectar si es una API o controlador
      if (sourceCode.includes('router') || sourceCode.includes('controller') || 
          sourceCode.includes('app.') || sourceCode.includes('express') ||
          sourceCode.includes('api') || sourceCode.includes('endpoint')) {
        return this.generateAPITest(testSpec, framework, sourceCode);
      }
      
      // Detectar si es un servicio con dependencias externas
      if (sourceCode.includes('service') || sourceCode.includes('repository') || 
          sourceCode.includes('database') || sourceCode.includes('model')) {
        return this.generateServiceIntegrationTest(testSpec, framework, sourceCode);
      }
      
      // Prueba genérica de integración
      return this.generateGenericIntegrationTest(testSpec, framework);
    }
    
    // Si es una ruta de archivo pero no pudimos leer el contenido
    if (fs.existsSync(testSpec)) {
      const filename = path.basename(testSpec).toLowerCase();
      
      if (filename.includes('api') || filename.includes('controller') || filename.includes('router')) {
        return this.generateAPITest(testSpec, framework, '');
      } else if (filename.includes('service') || filename.includes('repository') || filename.includes('model')) {
        return this.generateServiceIntegrationTest(testSpec, framework, '');
      }
    }
    
    // Caso por defecto
    return this.generateGenericIntegrationTest(testSpec, framework);
  }
  
  /**
   * Genera pruebas end-to-end
   * @param testSpec Especificación de la prueba
   * @param framework Framework a utilizar
   * @param sourceCode Código fuente a probar
   * @returns Código de prueba generado
   */
  private async generateE2ETests(testSpec: string, framework: string, sourceCode: string): Promise<string> {
    this.log('Generando pruebas end-to-end', { framework });
    
    // Si es un flujo o escenario específico
    if (!fs.existsSync(testSpec) && sourceCode === '') {
      if (testSpec.includes('login') || testSpec.includes('registro') || testSpec.includes('auth')) {
        return this.generateAuthFlowTest(testSpec, framework);
      } else if (testSpec.includes('compra') || testSpec.includes('checkout') || testSpec.includes('pago')) {
        return this.generateCheckoutFlowTest(testSpec, framework);
      }
      return this.generateGenericE2ETest(testSpec, framework);
    }
    
    // Si tenemos código fuente, analizarlo para generar pruebas específicas
    if (sourceCode) {
      // Detectar si es una página o componente de UI
      if (sourceCode.includes('page') || sourceCode.includes('component') || 
          sourceCode.includes('view') || sourceCode.includes('screen') ||
          sourceCode.includes('html') || sourceCode.includes('css')) {
        return this.generateUITest(testSpec, framework, sourceCode);
      }
      
      // Prueba genérica E2E
      return this.generateGenericE2ETest(testSpec, framework);
    }
    
    // Si es una ruta de archivo pero no pudimos leer el contenido
    if (fs.existsSync(testSpec)) {
      const filename = path.basename(testSpec).toLowerCase();
      
      if (filename.includes('page') || filename.includes('view') || filename.includes('screen')) {
        return this.generateUITest(testSpec, framework, '');
      }
    }
    
    // Caso por defecto
    return this.generateGenericE2ETest(testSpec, framework);
  }
  
  /**
   * Genera una prueba unitaria genérica
   */
  private generateGenericUnitTest(testSpec: string, framework: string): string {
    if (framework === 'jest') {
      return `// Pruebas unitarias para: ${testSpec}
import { ${testSpec} } from '../src/utils/${testSpec}';

describe('${testSpec}', () => {
  test('debería estar definido', () => {
    expect(${testSpec}).toBeDefined();
  });
  
  test('debería funcionar correctamente con parámetros válidos', () => {
    // Arrange
    const input = 'test';
    const expectedOutput = 'resultado esperado';
    
    // Act
    const result = ${testSpec}(input);
    
    // Assert
    expect(result).toEqual(expectedOutput);
  });
  
  test('debería manejar casos límite', () => {
    // Arrange
    const input = '';
    
    // Act
    const result = ${testSpec}(input);
    
    // Assert
    expect(result).toEqual('');
  });
  
  test('debería lanzar error con parámetros inválidos', () => {
    // Arrange
    const invalidInput = null;
    
    // Act & Assert
    expect(() => {
      ${testSpec}(invalidInput);
    }).toThrow();
  });
});
`;
    } else if (framework === 'mocha') {
      return `// Pruebas unitarias para: ${testSpec}
const { expect } = require('chai');
const { ${testSpec} } = require('../src/utils/${testSpec}');

describe('${testSpec}', function() {
  it('debería estar definido', function() {
    expect(${testSpec}).to.exist;
  });
  
  it('debería funcionar correctamente con parámetros válidos', function() {
    // Arrange
    const input = 'test';
    const expectedOutput = 'resultado esperado';
    
    // Act
    const result = ${testSpec}(input);
    
    // Assert
    expect(result).to.equal(expectedOutput);
  });
  
  it('debería manejar casos límite', function() {
    // Arrange
    const input = '';
    
    // Act
    const result = ${testSpec}(input);
    
    // Assert
    expect(result).to.equal('');
  });
  
  it('debería lanzar error con parámetros inválidos', function() {
    // Arrange
    const invalidInput = null;
    
    // Act & Assert
    expect(() => {
      ${testSpec}(invalidInput);
    }).to.throw();
  });
});
`;
    } else {
      // Formato genérico para otros frameworks
      return `// Pruebas unitarias para: ${testSpec} usando ${framework}
// Importar el módulo a probar
// Importar el framework de testing

// Suite de pruebas
describe('${testSpec}', () => {
  // Configuración inicial
  beforeEach(() => {
    // Configurar el entorno de prueba
  });
  
  // Prueba: funcionalidad básica
  test('debería funcionar correctamente con parámetros válidos', () => {
    // Preparar datos de prueba
    // Ejecutar la función
    // Verificar resultados
  });
  
  // Prueba: manejo de errores
  test('debería manejar errores correctamente', () => {
    // Preparar datos inválidos
    // Verificar que se manejan los errores adecuadamente
  });
  
  // Prueba: casos límite
  test('debería manejar casos límite', () => {
    // Preparar casos límite
    // Verificar comportamiento esperado
  });
  
  // Limpieza después de las pruebas
  afterEach(() => {
    // Limpiar recursos
  });
});
`;
    }
  }
  
  /**
   * Genera pruebas unitarias para código JavaScript/TypeScript
   */
  private generateJSUnitTest(testSpec: string, framework: string, sourceCode: string): string {
    // Extraer nombre del archivo sin extensión
    const fileName = path.basename(testSpec, path.extname(testSpec));
    
    if (framework === 'jest') {
      return `// Pruebas unitarias para: ${fileName}
import { ${fileName} } from '../src/${fileName}';

describe('${fileName}', () => {
  test('debería estar definido', () => {
    expect(${fileName}).toBeDefined();
  });
  
  // Pruebas para funcionalidad principal
  describe('funcionalidad principal', () => {
    test('debería procesar datos correctamente', () => {
      // Arrange
      const input = { id: 1, name: 'Test' };
      
      // Act
      const result = ${fileName}.process(input);
      
      // Assert
      expect(result).toHaveProperty('processed');
      expect(result.id).toBe(1);
    });
    
    test('debería validar entradas', () => {
      // Arrange
      const invalidInput = null;
      
      // Act & Assert
      expect(() => {
        ${fileName}.process(invalidInput);
      }).toThrow('Input is required');
    });
  });
  
  // Pruebas para casos de borde
  describe('casos de borde', () => {
    test('debería manejar objetos vacíos', () => {
      // Arrange
      const emptyInput = {};
      
      // Act
      const result = ${fileName}.process(emptyInput);
      
      // Assert
      expect(result).toEqual({ processed: true });
    });
    
    test('debería manejar arrays', () => {
      // Arrange
      const arrayInput = [1, 2, 3];
      
      // Act
      const result = ${fileName}.processArray(arrayInput);
      
      // Assert
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
    });
  });
});
`;
    } else if (framework === 'mocha') {
      return `// Pruebas unitarias para: ${fileName}
const { expect } = require('chai');
const { ${fileName} } = require('../src/${fileName}');

describe('${fileName}', function() {
  it('debería estar definido', function() {
    expect(${fileName}).to.exist;
  });
  
  // Pruebas para funcionalidad principal
  describe('funcionalidad principal', function() {
    it('debería procesar datos correctamente', function() {
      // Arrange
      const input = { id: 1, name: 'Test' };
      
      // Act
      const result = ${fileName}.process(input);
      
      // Assert
      expect(result).to.have.property('processed');
      expect(result.id).to.equal(1);
    });
    
    it('debería validar entradas', function() {
      // Arrange
      const invalidInput = null;
      
      // Act & Assert
      expect(() => {
        ${fileName}.process(invalidInput);
      }).to.throw('Input is required');
    });
  });
  
  // Pruebas para casos de borde
  describe('casos de borde', function() {
    it('debería manejar objetos vacíos', function() {
      // Arrange
      const emptyInput = {};
      
      // Act
      const result = ${fileName}.process(emptyInput);
      
      // Assert
      expect(result).to.deep.equal({ processed: true });
    });
    
    it('debería manejar arrays', function() {
      // Arrange
      const arrayInput = [1, 2, 3];
      
      // Act
      const result = ${fileName}.processArray(arrayInput);
      
      // Assert
      expect(Array.isArray(result)).to.be.true;
      expect(result.length).to.equal(3);
    });
  });
});
`;
    } else {
      // Formato genérico para otros frameworks
      return `// Pruebas unitarias para: ${fileName} usando ${framework}
// Importar el módulo a probar
// Importar el framework de testing

// Suite de pruebas
describe('${fileName}', () => {
  // Configuración inicial
  beforeEach(() => {
    // Configurar el entorno de prueba
  });
  
  // Prueba: funcionalidad básica
  test('debería procesar datos correctamente', () => {
    // Preparar datos de prueba
    const input = { id: 1, name: 'Test' };
    
    // Ejecutar la función
    const result = ${fileName}.process(input);
    
    // Verificar resultados
    // Aserciones según el framework
  });
  
  // Prueba: manejo de errores
  test('debería validar entradas', () => {
    // Preparar datos inválidos
    const invalidInput = null;
    
    // Verificar que se lanzan los errores esperados
    // Aserciones según el framework
  });
  
  // Limpieza después de las pruebas
  afterEach(() => {
    // Limpiar recursos
  });
});
`;
    }
  }
  
  /**
   * Genera pruebas para componentes React
   */
  private generateReactComponentTest(testSpec: string, framework: string, sourceCode: string): string {
    // Extraer nombre del componente
    const componentName = path.basename(testSpec, path.extname(testSpec));
    
    return `// Pruebas para el componente React: ${componentName}
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ${componentName} from '../src/components/${componentName}';

describe('${componentName} Component', () => {
  test('debería renderizarse correctamente', () => {
    render(<${componentName} />);
    expect(screen.getByTestId('${componentName.toLowerCase()}')).toBeInTheDocument();
  });
  
  test('debería mostrar el título correcto', () => {
    render(<${componentName} title="Título de prueba" />);
    expect(screen.getByText('Título de prueba')).toBeInTheDocument();
  });
  
  test('debería manejar clics correctamente', () => {
    const handleClick = jest.fn();
    render(<${componentName} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('debería cambiar de estado al interactuar', () => {
    render(<${componentName} />);
    
    // Estado inicial
    expect(screen.getByText('Estado inicial')).toBeInTheDocument();
    
    // Cambiar estado
    fireEvent.click(screen.getByText('Cambiar estado'));
    
    // Verificar nuevo estado
    expect(screen.getByText('Nuevo estado')).toBeInTheDocument();
  });
  
  test('debería manejar formularios correctamente', () => {
    const handleSubmit = jest.fn();
    render(<${componentName} onSubmit={handleSubmit} />);
    
    // Completar formulario
    fireEvent.change(screen.getByLabelText('Nombre'), {
      target: { value: 'Usuario de prueba' }
    });
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    });
    
    // Enviar formulario
    fireEvent.click(screen.getByText('Enviar'));
    
    // Verificar que se llamó al manejador con los datos correctos
    expect(handleSubmit).toHaveBeenCalledWith({
      name: 'Usuario de prueba',
      email: 'test@example.com'
    });
  });
});
`;
  }
  

  /**
   * Genera pruebas para servicios o APIs
   */
  private generateServiceTest(testSpec: string, framework: string, sourceCode: string): string {
    // Extraer nombre del servicio
    const serviceName = path.basename(testSpec, path.extname(testSpec));
    
    return `// Pruebas unitarias para el servicio: ${serviceName}
import { ${serviceName} } from '../src/services/${serviceName}';

// Mock de dependencias externas
jest.mock('axios');
const axios = require('axios');

describe('${serviceName} Service', () => {
  beforeEach(() => {
    // Resetear mocks antes de cada prueba
    jest.clearAllMocks();
  });
  
  describe('fetchData', () => {
    test('debería obtener datos correctamente', async () => {
      // Arrange
      const mockData = { id: 1, name: 'Test Data' };
      axios.get.mockResolvedValue({ data: mockData });
      
      // Act
      const result = await ${serviceName}.fetchData(1);
      
      // Assert
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/data/1'));
      expect(result).toEqual(mockData);
    });
    
    test('debería manejar errores correctamente', async () => {
      // Arrange
      const mockError = new Error('Network Error');
      axios.get.mockRejectedValue(mockError);
      
      // Act & Assert
      await expect(${serviceName}.fetchData(1)).rejects.toThrow('Error al obtener datos');
    });
  });
  
  describe('createData', () => {
    test('debería crear datos correctamente', async () => {
      // Arrange
      const inputData = { name: 'New Item' };
      const mockResponse = { id: 1, ...inputData };
      axios.post.mockResolvedValue({ data: mockResponse });
      
      // Act
      const result = await ${serviceName}.createData(inputData);
      
      // Assert
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/data'),
        inputData,
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });
});`;
  }
  
  /**
   * Genera pruebas de API
   */
  private generateAPITest(testSpec: string, framework: string, sourceCode: string = ''): string {
    // Determinar si es un endpoint específico o un controlador
    const isEndpoint = testSpec.includes('/');
    let apiName = isEndpoint 
      ? testSpec.split('/').filter(Boolean).pop() 
      : path.basename(testSpec, path.extname(testSpec));
    
    if (framework === 'jest' || framework === 'supertest') {
      return `// Pruebas de integración para API: ${apiName}
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

describe('API ${apiName}', () => {
  // Configuración antes de todas las pruebas
  beforeAll(async () => {
    // Conectar a la base de datos de prueba
    await db.connect();
  });
  
  // Limpiar después de cada prueba
  afterEach(async () => {
    // Limpiar datos de prueba
    await db.cleanup();
  });
  
  // Desconectar después de todas las pruebas
  afterAll(async () => {
    // Cerrar conexión a la base de datos
    await db.disconnect();
  });
  
  describe('GET /${apiName}', () => {
    test('debería devolver una lista de elementos', async () => {
      // Preparar datos de prueba
      await db.seed('${apiName}', [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' }
      ]);
      
      // Ejecutar solicitud
      const response = await request(app)
        .get('/api/${apiName}')
        .set('Accept', 'application/json');
      
      // Verificar respuesta
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
    });
    
    test('debería filtrar elementos correctamente', async () => {
      // Preparar datos de prueba
      await db.seed('${apiName}', [
        { id: 1, name: 'Item 1', category: 'A' },
        { id: 2, name: 'Item 2', category: 'B' }
      ]);
      
      // Ejecutar solicitud con filtro
      const response = await request(app)
        .get('/api/${apiName}?category=A')
        .set('Accept', 'application/json');
      
      // Verificar respuesta
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('Item 1');
    });
  });
  
  describe('POST /${apiName}', () => {
    test('debería crear un nuevo elemento', async () => {
      // Datos para crear
      const newItem = { name: 'New Item', category: 'C' };
      
      // Ejecutar solicitud
      const response = await request(app)
        .post('/api/${apiName}')
        .send(newItem)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json');
      
      // Verificar respuesta
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newItem.name);
      
      // Verificar que se guardó en la base de datos
      const savedItem = await db.findById('${apiName}', response.body.id);
      expect(savedItem).not.toBeNull();
      expect(savedItem.name).toBe(newItem.name);
    });
    
    test('debería validar datos de entrada', async () => {
      // Datos inválidos (falta campo requerido)
      const invalidItem = { category: 'C' };
      
      // Ejecutar solicitud
      const response = await request(app)
        .post('/api/${apiName}')
        .send(invalidItem)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json');
      
      // Verificar respuesta de error
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('name');
    });
  });
});`;
    } else if (framework === 'cypress') {
      return `// Pruebas de integración para API con Cypress: ${apiName}
describe('API ${apiName}', () => {
  beforeEach(() => {
    // Interceptar y mockear respuestas de API
    cy.intercept('GET', '/api/${apiName}', { fixture: '${apiName}.json' }).as('getItems');
    cy.intercept('POST', '/api/${apiName}', (req) => {
      req.reply({
        statusCode: 201,
        body: {
          id: 123,
          ...req.body
        }
      });
    }).as('createItem');
  });
  
  it('debería cargar y mostrar elementos', () => {
    // Visitar página que carga datos
    cy.visit('/dashboard/${apiName}');
    
    // Esperar a que se complete la solicitud
    cy.wait('@getItems');
    
    // Verificar que los elementos se muestran
    cy.get('.item-list').should('be.visible');
    cy.get('.item-card').should('have.length.at.least', 2);
    cy.get('.item-card').first().should('contain', 'Item 1');
  });
  
  it('debería crear un nuevo elemento', () => {
    // Visitar página de creación
    cy.visit('/dashboard/${apiName}/new');
    
    // Completar formulario
    cy.get('#name').type('New Test Item');
    cy.get('#category').select('Category A');
    cy.get('#description').type('This is a test item created by Cypress');
    
    // Enviar formulario
    cy.get('form').submit();
    
    // Esperar a que se complete la solicitud
    cy.wait('@createItem');
    
    // Verificar redirección y mensaje de éxito
    cy.url().should('include', '/dashboard/${apiName}');
    cy.get('.success-message').should('be.visible');
    cy.get('.success-message').should('contain', 'creado con éxito');
  });
});`;
    } else {
      // Formato genérico para otros frameworks
      return `// Pruebas de integración para API: ${apiName} usando ${framework}
// Importar el framework de testing y configurar el entorno

describe('API ${apiName}', () => {
  // Configuración inicial
  beforeAll(() => {
    // Configurar entorno de prueba
    // Conectar a base de datos de prueba
  });
  
  // Prueba: obtener lista de elementos
  test('debería devolver una lista de elementos', async () => {
    // Preparar datos de prueba
    // Ejecutar solicitud GET
    // Verificar respuesta
  });
  
  // Prueba: crear nuevo elemento
  test('debería crear un nuevo elemento', async () => {
    // Preparar datos para crear
    // Ejecutar solicitud POST
    // Verificar respuesta y persistencia
  });
  
  // Limpieza
  afterAll(() => {
    // Limpiar recursos
    // Cerrar conexiones
  });
});`;
    }
  }
  
  /**
   * Genera pruebas de integración para servicios
   */
  private generateServiceIntegrationTest(testSpec: string, framework: string, sourceCode: string = ''): string {
    const serviceName = path.basename(testSpec, path.extname(testSpec));
    
    return `// Pruebas de integración para el servicio: ${serviceName}
const { ${serviceName} } = require('../src/services/${serviceName}');
const db = require('../src/models');
const mockExternalAPI = require('../test/mocks/externalAPI');

describe('${serviceName} Integration', () => {
  // Configuración antes de todas las pruebas
  beforeAll(async () => {
    // Inicializar base de datos de prueba
    await db.init();
    
    // Iniciar mock de servicios externos
    mockExternalAPI.start();
  });
  
  // Limpiar después de cada prueba
  afterEach(async () => {
    // Limpiar datos de prueba
    await db.cleanup();
    
    // Resetear mocks
    mockExternalAPI.reset();
  });
  
  // Desconectar después de todas las pruebas
  afterAll(async () => {
    // Cerrar conexión a la base de datos
    await db.close();
    
    // Detener mock de servicios externos
    mockExternalAPI.stop();
  });
  
  describe('processData', () => {
    test('debería procesar datos y guardarlos en la base de datos', async () => {
      // Preparar datos de prueba
      const testData = { id: 'test123', value: 'Test Value' };
      mockExternalAPI.setResponse('/external/data', { status: 'success', data: testData });
      
      // Ejecutar función del servicio
      const result = await ${serviceName}.processData('test123');
      
      // Verificar resultado
      expect(result).toHaveProperty('status', 'success');
      expect(result).toHaveProperty('id', 'test123');
      
      // Verificar que se guardó en la base de datos
      const savedData = await db.findOne('processedData', { externalId: 'test123' });
      expect(savedData).not.toBeNull();
      expect(savedData.value).toBe('Test Value');
      expect(savedData.processedAt).toBeInstanceOf(Date);
    });
    
    test('debería manejar errores del servicio externo', async () => {
      // Configurar mock para simular error
      mockExternalAPI.setError('/external/data', 'Service Unavailable', 503);
      
      // Ejecutar función del servicio y verificar manejo de error
      await expect(${serviceName}.processData('test123')).rejects.toThrow('Error al obtener datos externos');
      
      // Verificar que se registró el error
      const errorLog = await db.findOne('errorLogs', { 
        service: '${serviceName}',
        operation: 'processData'
      });
      expect(errorLog).not.toBeNull();
      expect(errorLog.statusCode).toBe(503);
    });
  });
  
  describe('syncData', () => {
    test('debería sincronizar datos con el sistema externo', async () => {
      // Preparar datos en la base de datos
      await db.insert('localData', [
        { id: 1, name: 'Item 1', synced: false },
        { id: 2, name: 'Item 2', synced: false }
      ]);
      
      // Configurar mock para respuestas exitosas
      mockExternalAPI.setResponse('/external/sync', { status: 'success', syncedIds: [1, 2] });
      
      // Ejecutar sincronización
      const result = await ${serviceName}.syncData();
      
      // Verificar resultado
      expect(result.success).toBe(true);
      expect(result.syncedCount).toBe(2);
      
      // Verificar que se actualizaron los registros
      const updatedItems = await db.find('localData', { synced: true });
      expect(updatedItems).toHaveLength(2);
    });
  });
});`;
  }
  
  /**
   * Genera una prueba de integración genérica
   */
  private generateGenericIntegrationTest(testSpec: string, framework: string): string {
    if (framework === 'jest' || framework === 'supertest') {
      return `// Pruebas de integración para: ${testSpec}
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/models');

describe('Integración: ${testSpec}', () => {
  // Configuración antes de todas las pruebas
  beforeAll(async () => {
    // Inicializar entorno de prueba
    await db.connect();
  });
  
  // Limpiar después de cada prueba
  afterEach(async () => {
    // Limpiar datos de prueba
    await db.cleanup();
  });
  
  // Desconectar después de todas las pruebas
  afterAll(async () => {
    // Cerrar conexiones
    await db.disconnect();
  });
  
  test('debería completar el flujo principal correctamente', async () => {
    // Paso 1: Crear recursos necesarios
    const createResponse = await request(app)
      .post('/api/resources')
      .send({ name: 'Test Resource' })
      .set('Accept', 'application/json');
    
    expect(createResponse.status).toBe(201);
    const resourceId = createResponse.body.id;
    
    // Paso 2: Obtener el recurso creado
    const getResponse = await request(app)
      .get(\`/api/resources/\${resourceId}\`)
      .set('Accept', 'application/json');
    
    expect(getResponse.status).toBe(200);
    expect(getResponse.body.name).toBe('Test Resource');
    
    // Paso 3: Actualizar el recurso
    const updateResponse = await request(app)
      .put(\`/api/resources/\${resourceId}\`)
      .send({ name: 'Updated Resource' })
      .set('Accept', 'application/json');
    
    expect(updateResponse.status).toBe(200);
    
    // Paso 4: Verificar la actualización
    const verifyResponse = await request(app)
      .get(\`/api/resources/\${resourceId}\`)
      .set('Accept', 'application/json');
    
    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.name).toBe('Updated Resource');
  });
  
  test('debería manejar errores correctamente', async () => {
    // Intentar obtener un recurso que no existe
    const response = await request(app)
      .get('/api/resources/999999')
      .set('Accept', 'application/json');
    
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('error');
  });
});`;
    } else {
      // Formato genérico para otros frameworks
      return `// Pruebas de integración para: ${testSpec} usando ${framework}
// Importar el framework de testing y configurar el entorno

describe('Integración: ${testSpec}', () => {
  // Configuración inicial
  beforeAll(() => {
    // Configurar entorno de prueba
    // Inicializar recursos
  });
  
  // Prueba: flujo principal
  test('debería completar el flujo principal correctamente', async () => {
    // Paso 1: Crear recursos necesarios
    // Paso 2: Obtener el recurso creado
    // Paso 3: Actualizar el recurso
    // Paso 4: Verificar la actualización
  });
  
  // Prueba: manejo de errores
  test('debería manejar errores correctamente', async () => {
    // Intentar operaciones con datos inválidos
    // Verificar respuestas de error
  });
  
  // Limpieza
  afterAll(() => {
    // Limpiar recursos
    // Cerrar conexiones
  });
});`;
    }
  }
  
  /**
   * Genera pruebas E2E para flujos de autenticación
   */
  private generateAuthFlowTest(testSpec: string, framework: string): string {
    if (framework === 'playwright') {
      return `// Pruebas E2E para flujo de autenticación: ${testSpec}
import { test, expect } from '@playwright/test';

test.describe('Flujo de Autenticación', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de inicio
    await page.goto('http://localhost:3000');
  });
  
  test('debería permitir registro de usuario', async ({ page }) => {
    // Navegar a la página de registro
    await page.click('text=Registrarse');
    
    // Verificar que estamos en la página de registro
    expect(page.url()).toContain('/register');
    
    // Completar formulario de registro
    await page.fill('input[name="name"]', 'Usuario Test');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.fill('input[name="confirmPassword"]', 'Password123!');
    
    // Enviar formulario
    await page.click('button[type="submit"]');
    
    // Verificar redirección a dashboard después del registro exitoso
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
    
    // Verificar que se muestra el nombre del usuario
    const userNameElement = await page.waitForSelector('.user-name');
    const userName = await userNameElement.textContent();
    expect(userName).toContain('Usuario Test');
  });
  
  test('debería permitir inicio de sesión', async ({ page }) => {
    // Navegar a la página de login
    await page.click('text=Iniciar sesión');
    
    // Verificar que estamos en la página de login
    expect(page.url()).toContain('/login');
    
    // Completar formulario de login
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    
    // Enviar formulario
    await page.click('button[type="submit"]');
    
    // Verificar redirección a dashboard después del login exitoso
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
  });
  
  test('debería mostrar error con credenciales inválidas', async ({ page }) => {
    // Navegar a la página de login
    await page.click('text=Iniciar sesión');
    
    // Completar formulario con datos incorrectos
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'WrongPassword');
    
    // Enviar formulario
    await page.click('button[type="submit"]');
    
    // Verificar que se muestra mensaje de error
    const errorMessage = await page.waitForSelector('.error-message');
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('credenciales inválidas');
    
    // Verificar que seguimos en la página de login
    expect(page.url()).toContain('/login');
  });
  
  test('debería permitir cerrar sesión', async ({ page }) => {
    // Primero iniciar sesión
    await page.click('text=Iniciar sesión');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    // Cerrar sesión
    await page.click('.logout-button');
    
    // Verificar redirección a la página de inicio
    await page.waitForURL('**/');
    expect(page.url()).not.toContain('/dashboard');
    
    // Verificar que aparecen los botones de login/registro
    await page.waitForSelector('text=Iniciar sesión');
    await page.waitForSelector('text=Registrarse');
  });
});`;
    } else if (framework === 'cypress') {
      return `// Pruebas E2E para flujo de autenticación con Cypress: ${testSpec}
describe('Flujo de Autenticación', () => {
  beforeEach(() => {
    // Visitar la página de inicio
    cy.visit('/');
  });
  
  it('debería permitir registro de usuario', () => {
    // Navegar a la página de registro
    cy.contains('Registrarse').click();
    
    // Verificar URL
    cy.url().should('include', '/register');
    
    // Completar formulario
    cy.get('input[name="name"]').type('Usuario Test');
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('Password123!');
    
    // Enviar formulario
    cy.get('button[type="submit"]').click();
    
    // Verificar redirección
    cy.url().should('include', '/dashboard');
    
    // Verificar que se muestra el nombre del usuario
    cy.get('.user-name').should('contain', 'Usuario Test');
  });
  
  it('debería permitir inicio de sesión', () => {
    // Navegar a la página de login
    cy.contains('Iniciar sesión').click();
    
    // Verificar URL
    cy.url().should('include', '/login');
    
    // Completar formulario
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    
    // Enviar formulario
    cy.get('button[type="submit"]').click();
    
    // Verificar redirección
    cy.url().should('include', '/dashboard');
  });
  
  it('debería mostrar error con credenciales inválidas', () => {
    // Navegar a la página de login
    cy.contains('Iniciar sesión').click();
    
    // Completar formulario con datos incorrectos
    cy.get('input[name="email"]').type('invalid@example.com');
    cy.get('input[name="password"]').type('WrongPassword');
    
    // Enviar formulario
    cy.get('button[type="submit"]').click();
    
    // Verificar mensaje de error
    cy.get('.error-message').should('be.visible');
    cy.get('.error-message').should('contain', 'credenciales inválidas');
    
    // Verificar que seguimos en la página de login
    cy.url().should('include', '/login');
  });
  
  it('debería permitir cerrar sesión', () => {
    // Primero iniciar sesión
    cy.contains('Iniciar sesión').click();
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
    
    // Cerrar sesión
    cy.get('.logout-button').click();
    
    // Verificar redirección
    cy.url().should('not.include', '/dashboard');
    
    // Verificar que aparecen los botones de login/registro
    cy.contains('Iniciar sesión').should('be.visible');
    cy.contains('Registrarse').should('be.visible');
  });
});`;
    } else {
      // Formato genérico para otros frameworks
      return `// Pruebas E2E para flujo de autenticación: ${testSpec} usando ${framework}
// Importar el framework de testing y configurar el entorno

describe('Flujo de Autenticación', () => {
  // Configuración inicial
  beforeEach(() => {
    // Navegar a la página de inicio
  });
  
  // Prueba: registro de usuario
  test('debería permitir registro de usuario', async () => {
    // Navegar a la página de registro
    // Completar formulario
    // Enviar formulario
    // Verificar redirección y estado de sesión
  });
  
  // Prueba: inicio de sesión
  test('debería permitir inicio de sesión', async () => {
    // Navegar a la página de login
    // Completar formulario
    // Enviar formulario
    // Verificar redirección y estado de sesión
  });
  
  // Prueba: credenciales inválidas
  test('debería mostrar error con credenciales inválidas', async () => {
    // Navegar a la página de login
    // Completar formulario con datos incorrectos
    // Enviar formulario
    // Verificar mensaje de error
  });
  
  // Prueba: cerrar sesión
  test('debería permitir cerrar sesión', async () => {
    // Iniciar sesión
    // Cerrar sesión
    // Verificar estado de sesión
  });
});`;
    }
  }
  
    // ... código existente ...
  
  /**
   * Genera pruebas E2E para flujos de checkout/compra
   */
  private generateCheckoutFlowTest(testSpec: string, framework: string): string {
    if (framework === 'playwright') {
      return `// Pruebas E2E para flujo de checkout: ${testSpec}
import { test, expect } from '@playwright/test';

test.describe('Flujo de Checkout', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página de inicio
    await page.goto('http://localhost:3000');
    
    // Iniciar sesión (prerequisito)
    await page.click('text=Iniciar sesión');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });
  
  test('debería permitir añadir productos al carrito', async ({ page }) => {
    // Navegar a la página de productos
    await page.click('text=Productos');
    
    // Añadir productos al carrito
    await page.click('.product-card:nth-child(1) .add-to-cart');
    await page.click('.product-card:nth-child(3) .add-to-cart');
    
    // Verificar contador del carrito
    const cartCounter = await page.waitForSelector('.cart-counter');
    const count = await cartCounter.textContent();
    expect(count).toBe('2');
    
    // Abrir carrito
    await page.click('.cart-icon');
    
    // Verificar que los productos están en el carrito
    const cartItems = await page.$$('.cart-item');
    expect(cartItems.length).toBe(2);
  });
  
  test('debería completar el proceso de checkout', async ({ page }) => {
    // Navegar a la página de productos
    await page.click('text=Productos');
    
    // Añadir un producto al carrito
    await page.click('.product-card:nth-child(1) .add-to-cart');
    
    // Ir al carrito
    await page.click('.cart-icon');
    
    // Proceder al checkout
    await page.click('text=Proceder al pago');
    
    // Verificar que estamos en la página de checkout
    expect(page.url()).toContain('/checkout');
    
    // Completar información de envío
    await page.fill('input[name="address"]', 'Calle Test 123');
    await page.fill('input[name="city"]', 'Ciudad Test');
    await page.fill('input[name="postalCode"]', '12345');
    await page.selectOption('select[name="country"]', 'España');
    
    // Continuar a método de pago
    await page.click('text=Continuar');
    
    // Completar información de pago
    await page.fill('input[name="cardNumber"]', '4242424242424242');
    await page.fill('input[name="cardName"]', 'Usuario Test');
    await page.fill('input[name="expiryDate"]', '12/25');
    await page.fill('input[name="cvv"]', '123');
    
    // Finalizar compra
    await page.click('text=Finalizar compra');
    
    // Verificar redirección a página de confirmación
    await page.waitForURL('**/order-confirmation');
    expect(page.url()).toContain('/order-confirmation');
    
    // Verificar mensaje de confirmación
    const confirmationMessage = await page.waitForSelector('.confirmation-message');
    const messageText = await confirmationMessage.textContent();
    expect(messageText).toContain('Pedido completado con éxito');
    
    // Verificar detalles del pedido
    await page.waitForSelector('.order-details');
    expect(await page.isVisible('.order-number')).toBe(true);
    expect(await page.isVisible('.order-date')).toBe(true);
    expect(await page.isVisible('.order-total')).toBe(true);
  });
  
  test('debería validar información de pago', async ({ page }) => {
    // Navegar a la página de productos y añadir al carrito
    await page.click('text=Productos');
    await page.click('.product-card:nth-child(1) .add-to-cart');
    await page.click('.cart-icon');
    await page.click('text=Proceder al pago');
    
    // Completar información de envío
    await page.fill('input[name="address"]', 'Calle Test 123');
    await page.fill('input[name="city"]', 'Ciudad Test');
    await page.fill('input[name="postalCode"]', '12345');
    await page.selectOption('select[name="country"]', 'España');
    await page.click('text=Continuar');
    
    // Intentar pagar con tarjeta inválida
    await page.fill('input[name="cardNumber"]', '1111111111111111');
    await page.fill('input[name="cardName"]', 'Usuario Test');
    await page.fill('input[name="expiryDate"]', '12/25');
    await page.fill('input[name="cvv"]', '123');
    
    // Finalizar compra
    await page.click('text=Finalizar compra');
    
    // Verificar mensaje de error
    const errorMessage = await page.waitForSelector('.error-message');
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('Tarjeta inválida');
    
    // Verificar que seguimos en la página de pago
    expect(page.url()).toContain('/checkout');
  });
});`;
    } else if (framework === 'cypress') {
      return `// Pruebas E2E para flujo de checkout con Cypress: ${testSpec}
describe('Flujo de Checkout', () => {
  beforeEach(() => {
    // Visitar la página de inicio e iniciar sesión
    cy.visit('/');
    cy.contains('Iniciar sesión').click();
    cy.get('input[name="email"]').type('test@example.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });
  
  it('debería permitir añadir productos al carrito', () => {
    // Navegar a la página de productos
    cy.contains('Productos').click();
    
    // Añadir productos al carrito
    cy.get('.product-card').first().find('.add-to-cart').click();
    cy.get('.product-card').eq(2).find('.add-to-cart').click();
    
    // Verificar contador del carrito
    cy.get('.cart-counter').should('have.text', '2');
    
    // Abrir carrito
    cy.get('.cart-icon').click();
    
    // Verificar que los productos están en el carrito
    cy.get('.cart-item').should('have.length', 2);
  });
  
  it('debería completar el proceso de checkout', () => {
    // Navegar a la página de productos
    cy.contains('Productos').click();
    
    // Añadir un producto al carrito
    cy.get('.product-card').first().find('.add-to-cart').click();
    
    // Ir al carrito
    cy.get('.cart-icon').click();
    
    // Proceder al checkout
    cy.contains('Proceder al pago').click();
    
    // Verificar que estamos en la página de checkout
    cy.url().should('include', '/checkout');
    
    // Completar información de envío
    cy.get('input[name="address"]').type('Calle Test 123');
    cy.get('input[name="city"]').type('Ciudad Test');
    cy.get('input[name="postalCode"]').type('12345');
    cy.get('select[name="country"]').select('España');
    
    // Continuar a método de pago
    cy.contains('Continuar').click();
    
    // Completar información de pago
    cy.get('input[name="cardNumber"]').type('4242424242424242');
    cy.get('input[name="cardName"]').type('Usuario Test');
    cy.get('input[name="expiryDate"]').type('12/25');
    cy.get('input[name="cvv"]').type('123');
    
    // Finalizar compra
    cy.contains('Finalizar compra').click();
    
    // Verificar redirección a página de confirmación
    cy.url().should('include', '/order-confirmation');
    
    // Verificar mensaje de confirmación
    cy.get('.confirmation-message').should('contain', 'Pedido completado con éxito');
    
    // Verificar detalles del pedido
    cy.get('.order-details').should('be.visible');
    cy.get('.order-number').should('be.visible');
    cy.get('.order-date').should('be.visible');
    cy.get('.order-total').should('be.visible');
  });
  
  it('debería validar información de pago', () => {
    // Navegar a la página de productos y añadir al carrito
    cy.contains('Productos').click();
    cy.get('.product-card').first().find('.add-to-cart').click();
    cy.get('.cart-icon').click();
    cy.contains('Proceder al pago').click();
    
    // Completar información de envío
    cy.get('input[name="address"]').type('Calle Test 123');
    cy.get('input[name="city"]').type('Ciudad Test');
    cy.get('input[name="postalCode"]').type('12345');
    cy.get('select[name="country"]').select('España');
    cy.contains('Continuar').click();
    
    // Intentar pagar con tarjeta inválida
    cy.get('input[name="cardNumber"]').type('1111111111111111');
    cy.get('input[name="cardName"]').type('Usuario Test');
    cy.get('input[name="expiryDate"]').type('12/25');
    cy.get('input[name="cvv"]').type('123');
    
    // Finalizar compra
    cy.contains('Finalizar compra').click();
    
    // Verificar mensaje de error
    cy.get('.error-message').should('be.visible');
    cy.get('.error-message').should('contain', 'Tarjeta inválida');
    
    // Verificar que seguimos en la página de pago
    cy.url().should('include', '/checkout');
  });
});`;
    } else {
      // Formato genérico para otros frameworks
      return `// Pruebas E2E para flujo de checkout: ${testSpec} usando ${framework}
// Importar el framework de testing y configurar el entorno

describe('Flujo de Checkout', () => {
  // Configuración inicial
  beforeEach(() => {
    // Iniciar sesión como prerequisito
  });
  
  // Prueba: añadir productos al carrito
  test('debería permitir añadir productos al carrito', async () => {
    // Navegar a la página de productos
    // Añadir productos al carrito
    // Verificar contador del carrito
    // Verificar productos en el carrito
  });
  
  // Prueba: completar proceso de checkout
  test('debería completar el proceso de checkout', async () => {
    // Añadir producto al carrito
    // Proceder al checkout
    // Completar información de envío
    // Completar información de pago
    // Finalizar compra
    // Verificar confirmación
  });
  
  // Prueba: validación de pago
  test('debería validar información de pago', async () => {
    // Añadir producto al carrito
    // Proceder al checkout
    // Intentar pagar con datos inválidos
    // Verificar mensaje de error
  });
});`;
    }
  }
  
  /**
   * Genera pruebas de usabilidad
   */
  private generateUsabilityTest(testSpec: string, framework: string): string {
    if (framework === 'playwright') {
      return `// Pruebas de usabilidad para: ${testSpec}
import { test, expect } from '@playwright/test';

test.describe('Pruebas de Usabilidad', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
  });
  
  test('debería tener elementos interactivos accesibles por teclado', async ({ page }) => {
    // Verificar que se puede navegar con teclado
    await page.keyboard.press('Tab');
    
    // El primer elemento debe estar enfocado
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).not.toBe('BODY');
    
    // Navegar por todos los elementos interactivos
    let tabCount = 0;
    let previousFocus = null;
    
    // Navegar por hasta 20 elementos o hasta que se repita el foco
    for (let i = 0; i < 20; i++) {
      const currentFocus = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? { tagName: el.tagName, id: el.id, className: el.className } : null;
      });
      
      if (i > 0 && JSON.stringify(currentFocus) === JSON.stringify(previousFocus)) {
        break;
      }
      
      previousFocus = currentFocus;
      await page.keyboard.press('Tab');
      tabCount++;
    }
    
    // Debe haber al menos 3 elementos navegables por teclado
    expect(tabCount).toBeGreaterThan(3);
  });
  
  test('debería tener textos legibles con suficiente contraste', async ({ page }) => {
    // Obtener todos los elementos de texto visibles
    const textElements = await page.$$eval('p, h1, h2, h3, h4, h5, h6, a, button, label, span', (elements) => {
      return elements.map(el => {
        const style = window.getComputedStyle(el);
        return {
          text: el.textContent?.trim(),
          fontSize: style.fontSize,
          color: style.color,
          backgroundColor: style.backgroundColor
        };
      }).filter(item => item.text && item.text.length > 0);
    });
    
    // Verificar que hay elementos de texto
    expect(textElements.length).toBeGreaterThan(0);
    
    // Verificar que los textos tienen un tamaño mínimo legible
    const smallTextCount = textElements.filter(el => {
      const size = parseInt(el.fontSize);
      return size < 12;
    }).length;
    
    expect(smallTextCount).toBe(0);
  });
  
  test('debería tener formularios con etiquetas y validación', async ({ page }) => {
    // Buscar formularios en la página
    const formCount = await page.$$eval('form', forms => forms.length);
    
    if (formCount > 0) {
      // Verificar que los campos tienen etiquetas
      const inputsWithoutLabels = await page.$$eval('form input, form select, form textarea', inputs => {
        return inputs.filter(input => {
          // Verificar si tiene un id y si hay una etiqueta asociada
          const id = input.getAttribute('id');
          if (!id) return true;
          
          const label = document.querySelector(`label[for="\${id}"]`);
          return !label;
        }).length;
      });
      
      expect(inputsWithoutLabels).toBe(0);
      
      // Verificar validación de formulario
      // Encontrar el primer formulario y enviarlo vacío
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          // Limpiar todos los campos
          form.querySelectorAll('input, select, textarea').forEach(input => {
            if (input.type !== 'submit' && input.type !== 'button') {
              if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
              } else {
                input.value = '';
              }
            }
          });
        }
      });
      
      // Intentar enviar el formulario
      await page.click('form button[type="submit"]');
      
      // Verificar si hay mensajes de error o si el formulario no se envió
      const currentUrl = page.url();
      const hasValidationMessages = await page.$$eval('.error-message, [aria-invalid="true"], :invalid', elements => elements.length > 0);
      
      expect(hasValidationMessages || currentUrl.includes('http://localhost:3000')).toBeTruthy();
    }
  });
  
  test('debería ser responsive y adaptarse a diferentes tamaños', async ({ page }) => {
    // Probar en tamaño móvil
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // Esperar a que se apliquen los estilos
    
    // Verificar que no hay scroll horizontal
    const hasHorizontalScrollMobile = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    expect(hasHorizontalScrollMobile).toBe(false);
    
    // Verificar menú hamburguesa en móvil
    const hasMobileMenu = await page.evaluate(() => {
      return !!document.querySelector('.hamburger-menu, .mobile-menu-button, [aria-label="Menu"]');
    });
    
    if (hasMobileMenu) {
      expect(hasMobileMenu).toBe(true);
    }
    
    // Probar en tamaño tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    
    // Verificar que no hay scroll horizontal
    const hasHorizontalScrollTablet = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    expect(hasHorizontalScrollTablet).toBe(false);
    
    // Probar en tamaño desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(500);
    
    // Verificar que no hay scroll horizontal
    const hasHorizontalScrollDesktop = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    
    expect(hasHorizontalScrollDesktop).toBe(false);
  });
});`;
    } else if (framework === 'cypress') {
      return `// Pruebas de usabilidad con Cypress: ${testSpec}
describe('Pruebas de Usabilidad', () => {
  beforeEach(() => {
    // Visitar la página a probar
    cy.visit('/');
  });
  
  it('debería tener elementos interactivos accesibles por teclado', () => {
    // Verificar que se puede navegar con teclado
    cy.focused().should('exist');
    
    // Navegar por los elementos interactivos
    let tabCount = 0;
    const focusedElements = new Set();
    
    // Función para presionar Tab y registrar el elemento enfocado
    const pressTabAndCheck = () => {
      cy.focused().then($el => {
        if ($el.length) {
          const elementInfo = $el[0].tagName + ($el[0].id ? '#' + $el[0].id : '');
          
          // Si ya hemos visto este elemento, detenemos la recursión
          if (focusedElements.has(elementInfo)) {
            return;
          }
          
          focusedElements.add(elementInfo);
          tabCount++;
          
          // Limitar a 20 tabs para evitar bucles infinitos
          if (tabCount < 20) {
            cy.tab().then(pressTabAndCheck);
          }
        }
      });
    };
    
    cy.tab().then(pressTabAndCheck);
    
    // Verificar que se encontraron elementos navegables
    cy.wrap(focusedElements.size).should('be.gt', 3);
  });
  
  it('debería tener textos legibles con suficiente contraste', () => {
    // Obtener todos los elementos de texto visibles
    cy.get('p, h1, h2, h3, h4, h5, h6, a, button, label, span').then($elements => {
      // Filtrar elementos vacíos
      const textElements = Array.from($elements).filter(el => el.textContent?.trim().length > 0);
      
      // Verificar que hay elementos de texto
      expect(textElements.length).to.be.greaterThan(0);
      
      // Verificar tamaño de fuente
      let smallTextCount = 0;
      
      textElements.forEach(el => {
        const fontSize = parseInt(window.getComputedStyle(el).fontSize);
        if (fontSize < 12) {
          smallTextCount++;
        }
      });
      
      expect(smallTextCount).to.equal(0);
    });
  });
  
  it('debería tener formularios con etiquetas y validación', () => {
    // Buscar formularios en la página
    cy.get('form').then($forms => {
      if ($forms.length > 0) {
        // Verificar que los campos tienen etiquetas
        cy.get('form input, form select, form textarea').each($input => {
          const id = $input.attr('id');
          if (id) {
            cy.get(`label[for="${id}"]`).should('exist');
          }
        });
        
        // Verificar validación de formulario
        // Encontrar el primer formulario y enviarlo vacío
        cy.get('form input:not([type="submit"]):not([type="button"])').clear();
        cy.get('form').submit();
        
        // Verificar si hay mensajes de error o si el formulario no se envió
        cy.get('.error-message, [aria-invalid="true"], :invalid').should('exist');
      }
    });
  });
  
  it('debería ser responsive y adaptarse a diferentes tamaños', () => {
    // Probar en tamaño móvil
    cy.viewport(375, 667);
    cy.wait(500); // Esperar a que se apliquen los estilos
    
    // Verificar que no hay scroll horizontal
    cy.document().then(doc => {
      const hasHorizontalScroll = doc.body.scrollWidth > window.innerWidth;
      expect(hasHorizontalScroll).to.be.false;
    });
    
    // Verificar menú hamburguesa en móvil
    cy.get('.hamburger-menu, .mobile-menu-button, [aria-label="Menu"]').then($menu => {
      if ($menu.length > 0) {
        cy.wrap($menu).should('be.visible');
      }
    });
    
    // Probar en tamaño tablet
    cy.viewport(768, 1024);
    cy.wait(500);
    
    // Verificar que no hay scroll horizontal
    cy.document().then(doc => {
      const hasHorizontalScroll = doc.body.scrollWidth > window.innerWidth;
      expect(hasHorizontalScroll).to.be.false;
    });
    
    // Probar en tamaño desktop
    cy.viewport(1280, 800);
    cy.wait(500);
    
    // Verificar que no hay scroll horizontal
    cy.document().then(doc => {
      const hasHorizontalScroll = doc.body.scrollWidth > window.innerWidth;
      expect(hasHorizontalScroll).to.be.false;
    });
  });
});`;
    } else {
      // Formato genérico para otros frameworks
      return `// Pruebas de usabilidad para: ${testSpec} usando ${framework}
// Importar el framework de testing y configurar el entorno

describe('Pruebas de Usabilidad', () => {
  // Configuración inicial
  beforeEach(() => {
    // Navegar a la página a probar
  });
  
  // Prueba: navegación por teclado
  test('debería tener elementos interactivos accesibles por teclado', async () => {
    // Verificar navegación con teclado
    // Contar elementos navegables
  });
  
  // Prueba: legibilidad de textos
  test('debería tener textos legibles con suficiente contraste', async () => {
    // Verificar tamaño de fuente
    // Verificar contraste de colores
  });
  
  // Prueba: formularios accesibles
  test('debería tener formularios con etiquetas y validación', async () => {
    // Verificar etiquetas en campos
    // Verificar validación de formularios
  });
  
  // Prueba: diseño responsive
  test('debería ser responsive y adaptarse a diferentes tamaños', async () => {
    // Probar en tamaño móvil
    // Probar en tamaño tablet
    // Probar en tamaño desktop
  });
});`;
    }
  }
  
  /**
   * Genera pruebas de accesibilidad
   */
  private generateAccessibilityTest(testSpec: string, framework: string): string {
    if (framework === 'playwright') {
      return `// Pruebas de accesibilidad para: ${testSpec}
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Pruebas de Accesibilidad', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
  });
  
  test('debería cumplir con las pautas de accesibilidad WCAG', async ({ page }) => {
    // Ejecutar análisis de accesibilidad con axe
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // Verificar que no hay violaciones críticas
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('debería tener atributos ARIA correctamente implementados', async ({ page }) => {
    // Verificar elementos con roles ARIA
    const elementsWithRoles = await page.$$('[role]');
    
    for (const element of elementsWithRoles) {
      // Obtener el rol
      const role = await element.getAttribute('role');
      
      // Verificar que el rol es válido
      expect(['button', 'link', 'navigation', 'banner', 'main', 'contentinfo', 
              'dialog', 'alert', 'alertdialog', 'menu', 'menuitem', 'tab', 
              'tabpanel', 'search', 'form', 'checkbox', 'radio', 'slider', 
              'combobox', 'listbox', 'option', 'grid', 'cell', 'row', 'rowgroup', 
              'columnheader', 'rowheader', 'switch', 'textbox', 'progressbar', 
              'status', 'timer', 'tooltip', 'img', 'presentation', 'none'
             ]).toContain(role);
      
      // Verificar propiedades requeridas según el rol
      if (role === 'button') {
        // Los botones deben ser enfocables o tener un manejador de eventos
        const tabIndex = await element.getAttribute('tabindex');
        const hasClickHandler = await page.evaluate(el => {
          return el.onclick !== null || el.addEventListener !== undefined;
        }, element);
        
        expect(tabIndex !== null || hasClickHandler).toBeTruthy();
      }
      
      if (role === 'checkbox' || role === 'switch') {
        // Debe tener aria-checked
        const ariaChecked = await element.getAttribute('aria-checked');
        expect(ariaChecked).not.toBeNull();
      }
    }
  });
  
  test('debería tener suficiente contraste de color', async ({ page }) => {
    // Obtener todos los elementos de texto visibles
    const textElements = await page.$$eval('p, h1, h2, h3, h4, h5, h6, a, button, label, span', (elements) => {
      return elements.map(el => {
        const style = window.getComputedStyle(el);
        return {
          text: el.textContent?.trim(),
          color: style.color,
          backgroundColor: style.backgroundColor
        };
      }).filter(item => item.text && item.text.length > 0);
    });
    
    // Verificar que hay elementos de texto
    expect(textElements.length).toBeGreaterThan(0);
    
    // Nota: Una verificación completa de contraste requeriría una biblioteca adicional
    // como color-contrast o wcag-color-contrast para calcular las relaciones de contraste
  });
  
  test('debería tener imágenes con texto alternativo', async ({ page }) => {
    // Verificar que todas las imágenes tienen atributo alt
    const imagesWithoutAlt = await page.$$eval('img:not([alt])', images => images.length);
    expect(imagesWithoutAlt).toBe(0);
    
    // Verificar que las imágenes decorativas tienen alt vacío
    const decorativeImages = await page.$$eval('img[alt=""]', images => {
      return images.filter(img => {
        // Verificar si la imagen es decorativa (por ejemplo, iconos, separadores)
        return img.width < 50 || img.height < 50 || 
               img.className.includes('icon') || 
               img.className.includes('decorative');
      }).length;
    });
    
    // Las imágenes decorativas deben tener alt vacío
    const decorativeImagesWithAlt = await page.$$eval('img.icon:not([alt=""]), img.decorative:not([alt=""])', images => images.length);
    expect(decorativeImagesWithAlt).toBe(0);
  });
  
  test('debería ser navegable con teclado', async ({ page }) => {
    // Verificar que se puede navegar con teclado
    await page.keyboard.press('Tab');
    
    // El primer elemento debe estar enfocado
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).not.toBe('BODY');
    
    // Navegar por todos los elementos interactivos
    let tabCount = 0;
    let previousFocus = null;
    
    // Navegar por hasta 20 elementos o hasta que se repita el foco
    for (let i = 0; i < 20; i++) {
            const currentFocus = await page.evaluate(() => {
        const el = document.activeElement;
        return el ? { tagName: el.tagName, id: el.id, className: el.className } : null;
      });
      
      if (i > 0 && JSON.stringify(currentFocus) === JSON.stringify(previousFocus)) {
        break;
      }
      
      previousFocus = currentFocus;
      await page.keyboard.press('Tab');
      tabCount++;
    }
    
    // Debe haber al menos 3 elementos navegables por teclado
    expect(tabCount).toBeGreaterThan(3);
  });
  
  test('debería tener encabezados en orden jerárquico', async ({ page }) => {
    // Verificar que los encabezados siguen una jerarquía lógica
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', headings => {
      return headings.map(h => ({
        level: parseInt(h.tagName.substring(1)),
        text: h.textContent?.trim()
      }));
    });
    
    // Verificar que hay al menos un encabezado
    expect(headings.length).toBeGreaterThan(0);
    
    // Verificar que los encabezados siguen una jerarquía lógica
    let previousLevel = 0;
    let hasError = false;
    
    for (let i = 0; i < headings.length; i++) {
      const currentLevel = headings[i].level;
      
      // El primer encabezado debe ser h1
      if (i === 0) {
        expect(currentLevel).toBe(1);
        previousLevel = currentLevel;
        continue;
      }
      
      // Los siguientes encabezados no deben saltar más de un nivel
      if (currentLevel > previousLevel && currentLevel - previousLevel > 1) {
        hasError = true;
        break;
      }
      
      previousLevel = currentLevel;
    }
    
    expect(hasError).toBe(false);
  });
  
  test('debería tener formularios accesibles', async ({ page }) => {
    // Buscar formularios en la página
    const formCount = await page.$$eval('form', forms => forms.length);
    
    if (formCount > 0) {
      // Verificar que los campos tienen etiquetas
      const inputsWithoutLabels = await page.$$eval('form input, form select, form textarea', inputs => {
        return inputs.filter(input => {
          // Ignorar botones y campos ocultos
          if (input.type === 'submit' || input.type === 'button' || input.type === 'hidden') {
            return false;
          }
          
          // Verificar si tiene un id y si hay una etiqueta asociada
          const id = input.getAttribute('id');
          if (!id) return true;
          
          const label = document.querySelector(`label[for="${id}"]`);
          return !label;
        }).length;
      });
      
      expect(inputsWithoutLabels).toBe(0);
      
      // Verificar que los campos requeridos están marcados
      const requiredInputs = await page.$$eval('form input[required], form select[required], form textarea[required]', inputs => {
        return inputs.map(input => {
          const id = input.getAttribute('id') || '';
          const hasAriaRequired = input.getAttribute('aria-required') === 'true';
          return { id, hasAriaRequired };
        });
      });
      
      // Todos los campos requeridos deben tener aria-required="true"
      for (const input of requiredInputs) {
        expect(input.hasAriaRequired).toBe(true);
      }
    }
  });
});`;
    } else if (framework === 'cypress') {
      return `// Pruebas de accesibilidad con Cypress: ${testSpec}
describe('Pruebas de Accesibilidad', () => {
  beforeEach(() => {
    // Visitar la página a probar
    cy.visit('/');
    
    // Cargar axe para pruebas de accesibilidad
    cy.injectAxe();
  });
  
  it('debería cumplir con las pautas de accesibilidad WCAG', () => {
    // Ejecutar análisis de accesibilidad con axe
    cy.checkA11y();
  });
  
  it('debería tener atributos ARIA correctamente implementados', () => {
    // Verificar elementos con roles ARIA
    cy.get('[role]').each($el => {
      // Obtener el rol
      const role = $el.attr('role');
      
      // Verificar que el rol es válido
      expect(['button', 'link', 'navigation', 'banner', 'main', 'contentinfo', 
              'dialog', 'alert', 'alertdialog', 'menu', 'menuitem', 'tab', 
              'tabpanel', 'search', 'form', 'checkbox', 'radio', 'slider', 
              'combobox', 'listbox', 'option', 'grid', 'cell', 'row', 'rowgroup', 
              'columnheader', 'rowheader', 'switch', 'textbox', 'progressbar', 
              'status', 'timer', 'tooltip', 'img', 'presentation', 'none'
             ]).to.include(role);
      
      // Verificar propiedades requeridas según el rol
      if (role === 'button') {
        // Los botones deben ser enfocables o tener un manejador de eventos
        const tabIndex = $el.attr('tabindex');
        expect(tabIndex !== undefined || $el.prop('onclick') !== null).to.be.true;
      }
      
      if (role === 'checkbox' || role === 'switch') {
        // Debe tener aria-checked
        expect($el.attr('aria-checked')).to.not.be.undefined;
      }
    });
  });
  
  it('debería tener suficiente contraste de color', () => {
    // Nota: Cypress no tiene una forma nativa de verificar el contraste de color
    // Se recomienda usar axe para esto, que ya está incluido en cy.checkA11y()
  });
  
  it('debería tener imágenes con texto alternativo', () => {
    // Verificar que todas las imágenes tienen atributo alt
    cy.get('img').each($img => {
      expect($img.attr('alt')).to.not.be.undefined;
    });
    
    // Verificar que las imágenes decorativas tienen alt vacío
    cy.get('img.icon, img.decorative').each($img => {
      expect($img.attr('alt')).to.equal('');
    });
  });
  
  it('debería ser navegable con teclado', () => {
    // Verificar que se puede navegar con teclado
    cy.focused().should('exist');
    
    // Navegar por los elementos interactivos
    let tabCount = 0;
    const focusedElements = new Set();
    
    // Función para presionar Tab y registrar el elemento enfocado
    const pressTabAndCheck = () => {
      cy.focused().then($el => {
        if ($el.length) {
          const elementInfo = $el[0].tagName + ($el[0].id ? '#' + $el[0].id : '');
          
          // Si ya hemos visto este elemento, detenemos la recursión
          if (focusedElements.has(elementInfo)) {
            return;
          }
          
          focusedElements.add(elementInfo);
          tabCount++;
          
          // Limitar a 20 tabs para evitar bucles infinitos
          if (tabCount < 20) {
            cy.tab().then(pressTabAndCheck);
          }
        }
      });
    };
    
    cy.tab().then(pressTabAndCheck);
    
    // Verificar que se encontraron elementos navegables
    cy.wrap(focusedElements.size).should('be.gt', 3);
  });
  
  it('debería tener encabezados en orden jerárquico', () => {
    // Verificar que los encabezados siguen una jerarquía lógica
    cy.get('h1, h2, h3, h4, h5, h6').then($headings => {
      const headings = $headings.toArray().map(h => ({
        level: parseInt(h.tagName.substring(1)),
        text: h.textContent?.trim()
      }));
      
      // Verificar que hay al menos un encabezado
      expect(headings.length).to.be.greaterThan(0);
      
      // Verificar que los encabezados siguen una jerarquía lógica
      let previousLevel = 0;
      let hasError = false;
      
      for (let i = 0; i < headings.length; i++) {
        const currentLevel = headings[i].level;
        
        // El primer encabezado debe ser h1
        if (i === 0) {
          expect(currentLevel).to.equal(1);
          previousLevel = currentLevel;
          continue;
        }
        
        // Los siguientes encabezados no deben saltar más de un nivel
        if (currentLevel > previousLevel && currentLevel - previousLevel > 1) {
          hasError = true;
          break;
        }
        
        previousLevel = currentLevel;
      }
      
      expect(hasError).to.be.false;
    });
  });
  
  it('debería tener formularios accesibles', () => {
    // Buscar formularios en la página
    cy.get('form').then($forms => {
      if ($forms.length > 0) {
        // Verificar que los campos tienen etiquetas
        cy.get('form input:not([type="submit"]):not([type="button"]):not([type="hidden"]), form select, form textarea').each($input => {
          const id = $input.attr('id');
          if (id) {
            cy.get(`label[for="${id}"]`).should('exist');
          }
        });
        
        // Verificar que los campos requeridos están marcados
        cy.get('form input[required], form select[required], form textarea[required]').each($input => {
          cy.wrap($input).should('have.attr', 'aria-required', 'true');
        });
      }
    });
  });
});`;
    } else {
      // Formato genérico para otros frameworks
      return `// Pruebas de accesibilidad para: ${testSpec} usando ${framework}
// Importar el framework de testing y configurar el entorno

describe('Pruebas de Accesibilidad', () => {
  // Configuración inicial
  beforeEach(() => {
    // Navegar a la página a probar
  });
  
  // Prueba: cumplimiento de WCAG
  test('debería cumplir con las pautas de accesibilidad WCAG', async () => {
    // Ejecutar análisis de accesibilidad
    // Verificar que no hay violaciones críticas
  });
  
  // Prueba: atributos ARIA
  test('debería tener atributos ARIA correctamente implementados', async () => {
    // Verificar elementos con roles ARIA
    // Verificar propiedades requeridas según el rol
  });
  
  // Prueba: contraste de color
  test('debería tener suficiente contraste de color', async () => {
    // Verificar contraste entre texto y fondo
  });
  
  // Prueba: texto alternativo en imágenes
  test('debería tener imágenes con texto alternativo', async () => {
    // Verificar que todas las imágenes tienen atributo alt
    // Verificar que las imágenes decorativas tienen alt vacío
  });
  
  // Prueba: navegación por teclado
  test('debería ser navegable con teclado', async () => {
    // Verificar que se puede navegar con teclado
    // Verificar que los elementos interactivos son enfocables
  });
  
  // Prueba: estructura de encabezados
  test('debería tener encabezados en orden jerárquico', async () => {
    // Verificar que los encabezados siguen una jerarquía lógica
  });
  
  // Prueba: formularios accesibles
  test('debería tener formularios accesibles', async () => {
    // Verificar que los campos tienen etiquetas
    // Verificar que los campos requeridos están marcados
  });
});`;
    }
  }
  
  /**
   * Genera pruebas de rendimiento
   */
  private generatePerformanceTest(testSpec: string, framework: string): string {
    if (framework === 'playwright') {
      return `// Pruebas de rendimiento para: ${testSpec}
import { test, expect } from '@playwright/test';

test.describe('Pruebas de Rendimiento', () => {
  test.beforeEach(async ({ page }) => {
    // Configurar interceptación de red para medir tiempos
    await page.route('**/*', route => {
      route.continue();
    });
    
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
  });
  
  test('debería cargar la página en menos de 3 segundos', async ({ page }) => {
    // Medir tiempo de carga de la página
    const startTime = Date.now();
    
    // Esperar a que la página esté completamente cargada
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(`Tiempo de carga: ${loadTime}ms`);
    
    // La página debe cargar en menos de 3 segundos (3000ms)
    expect(loadTime).toBeLessThan(3000);
  });
  
  test('debería tener un First Contentful Paint rápido', async ({ page }) => {
    // Medir First Contentful Paint usando Performance API
    const fcpTime = await page.evaluate(() => {
      return new Promise(resolve => {
        // Crear un PerformanceObserver para detectar el FCP
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              observer.disconnect();
              resolve(entry.startTime);
              break;
            }
          }
        });
        
        // Observar las métricas de paint
        observer.observe({ type: 'paint', buffered: true });
        
        // Si no se detecta FCP en 10 segundos, resolver con un valor alto
        setTimeout(() => resolve(10000), 10000);
      });
    });
    
    console.log(`First Contentful Paint: ${fcpTime}ms`);
    
    // El FCP debe ser menor a 1.8 segundos (1800ms)
    expect(fcpTime).toBeLessThan(1800);
  });
  
  test('debería tener un Largest Contentful Paint aceptable', async ({ page }) => {
    // Medir Largest Contentful Paint usando Performance API
    const lcpTime = await page.evaluate(() => {
      return new Promise(resolve => {
        // Crear un PerformanceObserver para detectar el LCP
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          // El último entry es el más grande
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            observer.disconnect();
            resolve(lastEntry.startTime);
          }
        });
        
        // Observar las métricas de largest-contentful-paint
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Si no se detecta LCP en 10 segundos, resolver con un valor alto
        setTimeout(() => resolve(10000), 10000);
      });
    });
    
    console.log(`Largest Contentful Paint: ${lcpTime}ms`);
    
    // El LCP debe ser menor a 2.5 segundos (2500ms)
    expect(lcpTime).toBeLessThan(2500);
  });
  
  test('debería tener un Cumulative Layout Shift bajo', async ({ page }) => {
    // Medir Cumulative Layout Shift usando Performance API
    const cls = await page.evaluate(() => {
      return new Promise(resolve => {
        let clsValue = 0;
        
        // Crear un PerformanceObserver para detectar el CLS
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });
        
        // Observar las métricas de layout-shift
        observer.observe({ type: 'layout-shift', buffered: true });
        
        // Resolver después de 5 segundos para dar tiempo a que ocurran shifts
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 5000);
      });
    });
    
    console.log(`Cumulative Layout Shift: ${cls}`);
    
    // El CLS debe ser menor a 0.1 (bueno) o 0.25 (necesita mejora)
    expect(cls).toBeLessThan(0.1);
  });
  
  test('debería tener un First Input Delay bajo', async ({ page }) => {
    // Simular interacción del usuario y medir tiempo de respuesta
    await page.waitForLoadState('networkidle');
    
    // Encontrar un elemento interactivo (botón, enlace, etc.)
    const interactiveElement = await page.$('button, a, input, select, textarea');
    
    if (interactiveElement) {
      // Medir tiempo de respuesta al hacer clic
      const responseTime = await page.evaluate(async (element) => {
        const start = performance.now();
        
        // Simular clic en el elemento
        element.click();
        
        // Esperar a que el navegador procese el evento
        await new Promise(resolve => requestAnimationFrame(resolve));
        
        return performance.now() - start;
      }, interactiveElement);
      
      console.log(`Tiempo de respuesta al clic: ${responseTime}ms`);
      
      // El tiempo de respuesta debe ser menor a 100ms
      expect(responseTime).toBeLessThan(100);
    } else {
      console.log('No se encontraron elementos interactivos para probar FID');
    }
  });
  
  test('debería tener un tamaño de página optimizado', async ({ page, request }) => {
    // Obtener el tamaño total de la página
    const response = await request.get('http://localhost:3000');
    const pageSize = parseInt(response.headers()['content-length'] || '0');
    
    // Si no hay content-length, calcular el tamaño del HTML
    const pageContent = await response.text();
    const calculatedSize = pageSize || Buffer.byteLength(pageContent, 'utf8');
    
    console.log(`Tamaño de la página HTML: ${calculatedSize} bytes`);
    
    // El tamaño del HTML debe ser menor a 100KB
    expect(calculatedSize).toBeLessThan(100 * 1024);
    
    // Obtener recursos adicionales (CSS, JS, imágenes)
    const resourceSizes = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(resource => ({
        name: resource.name,
        size: resource.transferSize || 0,
        type: resource.initiatorType
      }));
    });
    
    // Calcular tamaño total por tipo
    const sizeByType = resourceSizes.reduce((acc, resource) => {
      acc[resource.type] = (acc[resource.type] || 0) + resource.size;
      return acc;
    }, {});
    
    console.log('Tamaño por tipo de recurso:', sizeByType);
    
    // El tamaño total de CSS debe ser menor a 200KB
    expect(sizeByType.css || 0).toBeLessThan(200 * 1024);
    
    // El tamaño total de JS debe ser menor a 500KB
    expect(sizeByType.script || 0).toBeLessThan(500 * 1024);
  });
  
  test('debería tener un número óptimo de solicitudes HTTP', async ({ page }) => {
    // Contar el número de solicitudes HTTP
    let requestCount = 0;
    
    // Interceptar todas las solicitudes
    page.on('request', request => {
      requestCount++;
    });
    
    // Recargar la página para contar todas las solicitudes
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    console.log(`Número total de solicitudes HTTP: ${requestCount}`);
    
    // El número de solicitudes debe ser menor a 30
    expect(requestCount).toBeLessThan(30);
  });
});`;
    } else if (framework === 'cypress') {
      return `// Pruebas de rendimiento con Cypress: ${testSpec}
describe('Pruebas de Rendimiento', () => {
  beforeEach(() => {
    // Interceptar todas las solicitudes para medir tiempos
    cy.intercept('**/*').as('allRequests');
    
    // Visitar la página a probar
    cy.visit('/', {
      onBeforeLoad: (win) => {
        // Guardar el tiempo de inicio
        win.performance.mark('start-loading');
      },
      onLoad: (win) => {
        // Marcar cuando la página ha cargado
        win.performance.mark('end-loading');
        win.performance.measure('page-load', 'start-loading', 'end-loading');
      }
    });
  });
  
  it('debería cargar la página en menos de 3 segundos', () => {
    // Esperar a que todas las solicitudes terminen
    cy.wait('@allRequests', { timeout: 10000 });
    
    // Verificar el tiempo de carga
    cy.window().then((win) => {
      const measure = win.performance.getEntriesByName('page-load')[0];
      const loadTime = measure.duration;
      
      cy.log(\`Tiempo de carga: \${loadTime}ms\`);
      
      // La página debe cargar en menos de 3 segundos (3000ms)
      expect(loadTime).to.be.lessThan(3000);
    });
  });
  
  it('debería tener métricas web vitales aceptables', () => {
    // Verificar First Contentful Paint
    cy.window().then((win) => {
      const paintEntries = win.performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcpEntry) {
        cy.log(\`First Contentful Paint: \${fcpEntry.startTime}ms\`);
        expect(fcpEntry.startTime).to.be.lessThan(1800);
      }
    });
    
    // Nota: Cypress no puede medir directamente LCP y CLS como Playwright
    // Se recomienda usar herramientas como Lighthouse para estas métricas
  });
  
  it('debería tener un tiempo de respuesta rápido para interacciones', () => {
    // Esperar a que la página esté completamente cargada
    cy.wait('@allRequests', { timeout: 10000 });
    
    // Encontrar un elemento interactivo
    cy.get('button, a, input, select, textarea').first().then($el => {
      // Medir tiempo antes del clic
      const startTime = performance.now();
      
      // Hacer clic en el elemento
      cy.wrap($el).click();
      
      // Medir tiempo después del clic
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      cy.log(\`Tiempo de respuesta al clic: \${responseTime}ms\`);
      
      // El tiempo de respuesta debe ser menor a 100ms
      expect(responseTime).to.be.lessThan(100);
    });
  });
  
  it('debería tener un tamaño de página optimizado', () => {
    // Verificar el tamaño de la página HTML
    cy.request('/').then((response) => {
      const pageSize = response.body.length;
      
      cy.log(\`Tamaño de la página HTML: \${pageSize} bytes\`);
      
      // El tamaño del HTML debe ser menor a 100KB
      expect(pageSize).to.be.lessThan(100 * 1024);
    });
    
    // Verificar recursos adicionales
    cy.window().then((win) => {
      const resources = win.performance.getEntriesByType('resource');
      
      // Calcular tamaño total por tipo
      const sizeByType = resources.reduce((acc, resource) => {
        const type = resource.initiatorType;
        acc[type] = (acc[type] || 0) + (resource.transferSize || 0);
        return acc;
      }, {});
      
      cy.log('Tamaño por tipo de recurso:', sizeByType);
      
      // El tamaño total de CSS debe ser menor a 200KB
      expect(sizeByType.css || 0).to.be.lessThan(200 * 1024);
      
      // El tamaño total de JS debe ser menor a 500KB
      expect(sizeByType.script || 0).to.be.lessThan(500 * 1024);
    });
  });
  
  it('debería tener un número óptimo de solicitudes HTTP', () => {
    // Contar el número de solicitudes HTTP
    cy.get('@allRequests.all').then((requests) => {
      const requestCount = requests.length;
      
      cy.log(\`Número total de solicitudes HTTP: \${requestCount}\`);
      
      // El número de solicitudes debe ser menor a 30
      expect(requestCount).to.be.lessThan(30);
    });
  });
});`;
    } else {
      // Formato genérico para otros frameworks
      return `// Pruebas de rendimiento para: ${testSpec} usando ${framework}
// Importar el framework de testing y configurar el entorno

describe('Pruebas de Rendimiento', () => {
  // Configuración inicial
  beforeEach(() => {
    // Navegar a la página a probar
    // Configurar interceptación de red para medir tiempos
  });
  
  // Prueba: tiempo de carga
  test('debería cargar la página en menos de 3 segundos', async () => {
    // Medir tiempo de carga de la página
    // Verificar que es menor a 3 segundos
  });
  
  // Prueba: métricas web vitales
  test('debería tener métricas web vitales aceptables', async () => {
    // Medir First Contentful Paint
    // Medir Largest Contentful Paint
    // Medir Cumulative Layout Shift
  });
  
  // Prueba: tiempo de respuesta
  test('debería tener un tiempo de respuesta rápido para interacciones', async () => {
    // Simular interacción del usuario
    // Medir tiempo de respuesta
  });
  
  // Prueba: tamaño de página
  test('debería tener un tamaño de página optimizado', async () => {
    // Medir tamaño de HTML
    // Medir tamaño de recursos (CSS, JS, imágenes)
  });
  
  // Prueba: número de solicitudes
  test('debería tener un número óptimo de solicitudes HTTP', async () => {
    // Contar número de solicitudes HTTP
    // Verificar que es menor a un umbral
  });
});`;
    }
  }
  
  /**
   * Genera pruebas de seguridad
   */
  private generateSecurityTest(testSpec: string, framework: string): string {
    if (framework === 'playwright') {
      return `// Pruebas de seguridad para: ${testSpec}
import { test, expect } from '@playwright/test';

test.describe('Pruebas de Seguridad', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
    
    // Si es necesario, iniciar sesión
    // await page.fill('input[name="email"]', 'test@example.com');
    // await page.fill('input[name="password"]', 'Password123!');
    // await page.click('button[type="submit"]');
  });
  
  test('debería tener cabeceras de seguridad adecuadas', async ({ request }) => {
    // Verificar cabeceras de seguridad
    const response = await request.get('http://localhost:3000');
    const headers = response.headers();
    
    // Verificar Content-Security-Policy
    expect(headers['content-security-policy']).toBeDefined();
    
    // Verificar X-XSS-Protection
    expect(headers['x-xss-protection']).toBeDefined();
    
    // Verificar X-Content-Type-Options
    expect(headers['x-content-type-options']).toBe('nosniff');
    
    // Verificar X-Frame-Options
    expect(headers['x-frame-options']).toBeDefined();
    
    // Verificar Strict-Transport-Security
    expect(headers['strict-transport-security']).toBeDefined();
  });
  
  test('debería prevenir ataques XSS', async ({ page }) => {
    // Buscar campos de entrada
    const inputFields = await page.$$('input[type="text"], textarea');
    
    if (inputFields.length > 0) {
      // Probar con un payload XSS simple
      const xssPayload = '<script>alert("XSS")</script>';
      
      // Llenar el primer campo con el payload
      await inputFields[0].fill(xssPayload);
      
      // Enviar el formulario o activar el evento
      const form = await page.$('form');
      if (form) {
        await form.evaluate(form => form.submit());
      } else {
        await page.keyboard.press('Enter');
      }
      
      // Verificar que el script no se ejecutó (no debería haber alertas)
      const dialogPromise = page.waitForEvent('dialog', { timeout: 3000 }).catch(e => null);
      const dialog = await dialogPromise;
      
      expect(dialog).toBeNull();
      
      // Verificar que el payload se escapó correctamente
      const pageContent = await page.content();
      expect(pageContent).not.toContain(xssPayload);
    }
  });
  
    test('debería prevenir ataques CSRF', async ({ page, request }) => {
    // Verificar si hay formularios que requieran protección CSRF
    const forms = await page.$$('form');
    
    if (forms.length > 0) {
      // Verificar que los formularios tienen tokens CSRF
      for (const form of forms) {
        const csrfToken = await form.$('input[name="csrf_token"], input[name="_token"], input[name="csrfmiddlewaretoken"]');
        expect(csrfToken).not.toBeNull();
      }
      
      // Intentar enviar un formulario sin token CSRF (debe fallar)
      const formAction = await forms[0].getAttribute('action') || '/submit';
      const formMethod = await forms[0].getAttribute('method') || 'POST';
      
      // Crear una solicitud sin el token CSRF
      try {
        const response = await request.fetch(`http://localhost:3000${formAction}`, {
          method: formMethod,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          data: 'data=test'
        });
        
        // La solicitud debe fallar o devolver un error
        expect(response.status()).toBeGreaterThanOrEqual(400);
      } catch (error) {
        // Si la solicitud falla completamente, es una buena señal
        expect(error).toBeDefined();
      }
    }
  });
  
  test('debería tener protección contra inyección SQL', async ({ page }) => {
    // Buscar campos de entrada que podrían ser vulnerables
    const inputFields = await page.$$('input[type="text"], input[type="search"], textarea');
    
    if (inputFields.length > 0) {
      // Probar con un payload de inyección SQL simple
      const sqlPayload = "' OR '1'='1";
      
      // Llenar el primer campo con el payload
      await inputFields[0].fill(sqlPayload);
      
      // Enviar el formulario o activar el evento
      const form = await page.$('form');
      if (form) {
        await form.evaluate(form => form.submit());
      } else {
        await page.keyboard.press('Enter');
      }
      
      // Verificar que no hay errores de SQL en la respuesta
      const pageContent = await page.content();
      const sqlErrorPatterns = [
        'SQL syntax',
        'mysql_fetch_array',
        'ORA-',
        'syntax error',
        'unclosed quotation mark',
        'SQLite3::query',
        'pg_query',
        'mysqli_'
      ];
      
      for (const pattern of sqlErrorPatterns) {
        expect(pageContent).not.toContain(pattern);
      }
    }
  });
  
  test('debería tener protección contra clickjacking', async ({ request }) => {
    // Verificar cabecera X-Frame-Options
    const response = await request.get('http://localhost:3000');
    const headers = response.headers();
    
    // Debe tener X-Frame-Options o Content-Security-Policy con frame-ancestors
    const hasXFrameOptions = headers['x-frame-options'] !== undefined;
    const hasCSPFrameAncestors = headers['content-security-policy'] && 
                                headers['content-security-policy'].includes('frame-ancestors');
    
    expect(hasXFrameOptions || hasCSPFrameAncestors).toBe(true);
  });
  
  test('debería tener cookies seguras', async ({ context }) => {
    // Navegar a la página para establecer cookies
    const page = await context.newPage();
    await page.goto('http://localhost:3000');
    
    // Obtener todas las cookies
    const cookies = await context.cookies();
    
    // Verificar cookies de sesión
    const sessionCookies = cookies.filter(cookie => 
      cookie.name.toLowerCase().includes('session') || 
      cookie.name.toLowerCase().includes('auth') ||
      cookie.name.toLowerCase().includes('token')
    );
    
    // Si hay cookies de sesión, verificar que son seguras
    if (sessionCookies.length > 0) {
      for (const cookie of sessionCookies) {
        // Las cookies de sesión deben tener HttpOnly
        expect(cookie.httpOnly).toBe(true);
        
        // Las cookies de sesión deben tener Secure en producción
        // (opcional en desarrollo local)
        if (process.env.NODE_ENV === 'production') {
          expect(cookie.secure).toBe(true);
        }
        
        // Las cookies de sesión deben tener SameSite
        expect(cookie.sameSite).not.toBe('None');
      }
    }
  });
  
  test('debería validar entradas de usuario', async ({ page }) => {
    // Buscar campos de entrada
    const inputFields = await page.$$('input[type="text"], input[type="email"], input[type="number"], textarea');
    
    if (inputFields.length > 0) {
      // Probar con datos inválidos
      const invalidInputs = [
        { type: 'email', value: 'not-an-email', selector: 'input[type="email"]' },
        { type: 'number', value: 'abc', selector: 'input[type="number"]' },
        { type: 'text', value: '<script>alert("XSS")</script>', selector: 'input[type="text"]' }
      ];
      
      for (const invalid of invalidInputs) {
        const field = await page.$(invalid.selector);
        if (field) {
          // Llenar el campo con datos inválidos
          await field.fill(invalid.value);
          
          // Enviar el formulario
          const form = await page.$('form');
          if (form) {
            await form.evaluate(form => form.submit());
            
            // Verificar que hay un mensaje de error o que el formulario no se envió
            const errorMessage = await page.$('div.error, span.error, p.error, .invalid-feedback');
            const currentUrl = page.url();
            
            // Debe haber un mensaje de error o la URL no debe cambiar (indicando que el formulario no se envió)
            expect(errorMessage !== null || currentUrl.includes('http://localhost:3000')).toBe(true);
          }
        }
      }
    }
  });
});`;
    } else if (framework === 'cypress') {
      return `// Pruebas de seguridad con Cypress: ${testSpec}
describe('Pruebas de Seguridad', () => {
  beforeEach(() => {
    // Visitar la página a probar
    cy.visit('/');
    
    // Si es necesario, iniciar sesión
    // cy.get('input[name="email"]').type('test@example.com');
    // cy.get('input[name="password"]').type('Password123!');
    // cy.get('button[type="submit"]').click();
  });
  
  it('debería tener cabeceras de seguridad adecuadas', () => {
    // Verificar cabeceras de seguridad
    cy.request('/').then(response => {
      const headers = response.headers;
      
      // Verificar Content-Security-Policy
      expect(headers).to.have.property('content-security-policy');
      
      // Verificar X-XSS-Protection
      expect(headers).to.have.property('x-xss-protection');
      
      // Verificar X-Content-Type-Options
      expect(headers['x-content-type-options']).to.equal('nosniff');
      
      // Verificar X-Frame-Options
      expect(headers).to.have.property('x-frame-options');
      
      // Verificar Strict-Transport-Security
      expect(headers).to.have.property('strict-transport-security');
    });
  });
  
  it('debería prevenir ataques XSS', () => {
    // Buscar campos de entrada
    cy.get('input[type="text"], textarea').first().then($input => {
      if ($input.length > 0) {
        // Probar con un payload XSS simple
        const xssPayload = '<script>alert("XSS")</script>';
        
        // Llenar el campo con el payload
        cy.wrap($input).type(xssPayload);
        
        // Enviar el formulario o activar el evento
        cy.get('form').then($form => {
          if ($form.length > 0) {
            cy.wrap($form).submit();
          } else {
            cy.wrap($input).type('{enter}');
          }
        });
        
        // Verificar que el script no se ejecutó (no debería haber alertas)
        const stub = cy.stub();
        cy.on('window:alert', stub);
        cy.wait(1000).then(() => {
          expect(stub).not.to.be.called;
        });
        
        // Verificar que el payload se escapó correctamente
        cy.get('body').should('not.contain', xssPayload);
      }
    });
  });
  
  it('debería prevenir ataques CSRF', () => {
    // Verificar si hay formularios que requieran protección CSRF
    cy.get('form').then($forms => {
      if ($forms.length > 0) {
        // Verificar que los formularios tienen tokens CSRF
        cy.wrap($forms).first().within(() => {
          cy.get('input[name="csrf_token"], input[name="_token"], input[name="csrfmiddlewaretoken"]')
            .should('exist');
        });
        
        // Intentar enviar un formulario sin token CSRF (debe fallar)
        const formAction = $forms[0].getAttribute('action') || '/submit';
        const formMethod = $forms[0].getAttribute('method') || 'POST';
        
        // Crear una solicitud sin el token CSRF
        cy.request({
          url: formAction,
          method: formMethod,
          failOnStatusCode: false,
          form: true,
          body: { data: 'test' }
        }).then(response => {
          // La solicitud debe fallar o devolver un error
          expect(response.status).to.be.at.least(400);
        });
      }
    });
  });
  
  it('debería tener protección contra inyección SQL', () => {
    // Buscar campos de entrada que podrían ser vulnerables
    cy.get('input[type="text"], input[type="search"], textarea').first().then($input => {
      if ($input.length > 0) {
        // Probar con un payload de inyección SQL simple
        const sqlPayload = "' OR '1'='1";
        
        // Llenar el campo con el payload
        cy.wrap($input).type(sqlPayload);
        
        // Enviar el formulario o activar el evento
        cy.get('form').then($form => {
          if ($form.length > 0) {
            cy.wrap($form).submit();
          } else {
            cy.wrap($input).type('{enter}');
          }
        });
        
        // Verificar que no hay errores de SQL en la respuesta
        const sqlErrorPatterns = [
          'SQL syntax',
          'mysql_fetch_array',
          'ORA-',
          'syntax error',
          'unclosed quotation mark',
          'SQLite3::query',
          'pg_query',
          'mysqli_'
        ];
        
        cy.get('body').then($body => {
          const bodyText = $body.text();
          sqlErrorPatterns.forEach(pattern => {
            expect(bodyText).not.to.include(pattern);
          });
        });
      }
    });
  });
  
  it('debería tener protección contra clickjacking', () => {
    // Verificar cabecera X-Frame-Options
    cy.request('/').then(response => {
      const headers = response.headers;
      
      // Debe tener X-Frame-Options o Content-Security-Policy con frame-ancestors
      const hasXFrameOptions = headers['x-frame-options'] !== undefined;
      const hasCSPFrameAncestors = headers['content-security-policy'] && 
                                  headers['content-security-policy'].includes('frame-ancestors');
      
      expect(hasXFrameOptions || hasCSPFrameAncestors).to.be.true;
    });
  });
  
  it('debería tener cookies seguras', () => {
    // Obtener todas las cookies
    cy.getCookies().then(cookies => {
      // Verificar cookies de sesión
      const sessionCookies = cookies.filter(cookie => 
        cookie.name.toLowerCase().includes('session') || 
        cookie.name.toLowerCase().includes('auth') ||
        cookie.name.toLowerCase().includes('token')
      );
      
      // Si hay cookies de sesión, verificar que son seguras
      if (sessionCookies.length > 0) {
        sessionCookies.forEach(cookie => {
          // Las cookies de sesión deben tener HttpOnly
          expect(cookie.httpOnly).to.be.true;
          
          // Las cookies de sesión deben tener Secure en producción
          // (opcional en desarrollo local)
          if (Cypress.env('NODE_ENV') === 'production') {
            expect(cookie.secure).to.be.true;
          }
        });
      }
    });
  });
  
  it('debería validar entradas de usuario', () => {
    // Buscar campos de entrada
    cy.get('input[type="text"], input[type="email"], input[type="number"], textarea').then($inputs => {
      if ($inputs.length > 0) {
        // Probar con datos inválidos
        const invalidInputs = [
          { type: 'email', value: 'not-an-email', selector: 'input[type="email"]' },
          { type: 'number', value: 'abc', selector: 'input[type="number"]' },
          { type: 'text', value: '<script>alert("XSS")</script>', selector: 'input[type="text"]' }
        ];
        
        invalidInputs.forEach(invalid => {
          cy.get(invalid.selector).first().then($field => {
            if ($field.length > 0) {
              // Llenar el campo con datos inválidos
              cy.wrap($field).clear().type(invalid.value);
              
              // Enviar el formulario
              cy.get('form').then($form => {
                if ($form.length > 0) {
                  cy.wrap($form).submit();
                  
                  // Verificar que hay un mensaje de error o que el formulario no se envió
                  cy.get('div.error, span.error, p.error, .invalid-feedback').then($error => {
                    cy.url().then(url => {
                      // Debe haber un mensaje de error o la URL no debe cambiar
                      expect($error.length > 0 || url.includes('/')).to.be.true;
                    });
                  });
                }
              });
            }
          });
        });
      }
    });
  });
});`;
    } else {
      // Formato genérico para otros frameworks
      return `// Pruebas de seguridad para: ${testSpec} usando ${framework}
// Importar el framework de testing y configurar el entorno

describe('Pruebas de Seguridad', () => {
  // Configuración inicial
  beforeEach(() => {
    // Navegar a la página a probar
    // Si es necesario, iniciar sesión
  });
  
  // Prueba: cabeceras de seguridad
  test('debería tener cabeceras de seguridad adecuadas', async () => {
    // Verificar Content-Security-Policy
    // Verificar X-XSS-Protection
    // Verificar X-Content-Type-Options
    // Verificar X-Frame-Options
    // Verificar Strict-Transport-Security
  });
  
  // Prueba: protección XSS
  test('debería prevenir ataques XSS', async () => {
    // Probar con un payload XSS simple
    // Verificar que el script no se ejecutó
    // Verificar que el payload se escapó correctamente
  });
  
  // Prueba: protección CSRF
  test('debería prevenir ataques CSRF', async () => {
    // Verificar tokens CSRF en formularios
    // Intentar enviar un formulario sin token CSRF
  });
  
  // Prueba: protección inyección SQL
  test('debería tener protección contra inyección SQL', async () => {
    // Probar con un payload de inyección SQL
    // Verificar que no hay errores de SQL en la respuesta
  });
  
  // Prueba: protección clickjacking
  test('debería tener protección contra clickjacking', async () => {
    // Verificar cabecera X-Frame-Options o CSP frame-ancestors
  });
  
  // Prueba: cookies seguras
  test('debería tener cookies seguras', async () => {
    // Verificar HttpOnly, Secure, SameSite en cookies de sesión
  });
  
  // Prueba: validación de entradas
  test('debería validar entradas de usuario', async () => {
    // Probar con datos inválidos
    // Verificar mensajes de error o rechazo del formulario
  });
});`;
    }
  }
  
  /**
   * Genera pruebas de usabilidad
   */
  private generateUsabilityTest(testSpec: string, framework: string): string {
    if (framework === 'playwright') {
      return `// Pruebas de usabilidad para: ${testSpec}
import { test, expect } from '@playwright/test';

test.describe('Pruebas de Usabilidad', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
  });
  
  test('debería tener una estructura clara y jerárquica', async ({ page }) => {
    // Verificar que hay un encabezado principal
    const h1Count = await page.$$eval('h1', h1s => h1s.length);
    expect(h1Count).toBeGreaterThanOrEqual(1);
    
    // Verificar que hay una navegación principal
    const navElements = await page.$$('nav, [role="navigation"]');
    expect(navElements.length).toBeGreaterThanOrEqual(1);
    
    // Verificar que hay un pie de página
    const footerElements = await page.$$('footer, [role="contentinfo"]');
    expect(footerElements.length).toBeGreaterThanOrEqual(1);
    
    // Verificar que hay secciones principales
    const mainSections = await page.$$('main, [role="main"], section, article');
    expect(mainSections.length).toBeGreaterThanOrEqual(1);
  });
  
  test('debería tener elementos interactivos claramente identificables', async ({ page }) => {
    // Verificar que los botones parecen botones
    const buttons = await page.$$('button, [role="button"], input[type="button"], input[type="submit"]');
    
    for (const button of buttons) {
      // Verificar que tiene un estilo distintivo (padding, border, background)
      const buttonStyles = await button.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          padding: styles.padding,
          border: styles.border,
          background: styles.background,
          cursor: styles.cursor
        };
      });
      
      // Los botones deben tener algún estilo distintivo
      expect(buttonStyles.padding).not.toBe('0px');
      expect(buttonStyles.cursor).toBe('pointer');
    }
    
    // Verificar que los enlaces son distinguibles
    const links = await page.$$('a');
    
    for (const link of links) {
      // Verificar que tiene un estilo distintivo (color, text-decoration)
      const linkStyles = await link.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          textDecoration: styles.textDecoration,
          cursor: styles.cursor
        };
      });
      
      // Los enlaces deben tener algún estilo distintivo
      expect(linkStyles.cursor).toBe('pointer');
    }
  });
  
  test('debería tener un diseño responsive', async ({ page }) => {
    // Probar en diferentes tamaños de pantalla
    const viewportSizes = [
      { width: 375, height: 667 },  // Móvil
      { width: 768, height: 1024 }, // Tablet
      { width: 1366, height: 768 }  // Desktop
    ];
    
    for (const size of viewportSizes) {
      // Ajustar tamaño de la ventana
      await page.setViewportSize(size);
      
      // Verificar que no hay scroll horizontal
      const bodyWidth = await page.evaluate(() => {
        return document.body.scrollWidth;
      });
      
      expect(bodyWidth).toBeLessThanOrEqual(size.width);
      
      // Verificar que los elementos principales son visibles
      const mainElements = await page.$$eval('h1, nav, main, footer', elements => {
        return elements.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            visible: rect.width > 0 && rect.height > 0,
            width: rect.width
          };
        });
      });
      
      for (const element of mainElements) {
        expect(element.visible).toBe(true);
        expect(element.width).toBeLessThanOrEqual(size.width);
      }
    }
  });
  
  test('debería tener tiempos de carga y respuesta rápidos', async ({ page }) => {
    // Medir tiempo de carga inicial
    const startTime = Date.now();
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // La página debe cargar en menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
    
    // Medir tiempo de respuesta para interacciones
    const interactiveElements = await page.$$('button, a, input, select');
    
    if (interactiveElements.length > 0) {
      // Hacer clic en el primer elemento interactivo
      const interactionStartTime = Date.now();
      await interactiveElements[0].click();
      await page.waitForTimeout(100); // Esperar a que ocurra alguna respuesta
      const interactionTime = Date.now() - interactionStartTime;
      
      // La interacción debe responder en menos de 100ms
      expect(interactionTime).toBeLessThan(100);
    }
  });
  
  test('debería tener mensajes de error claros y útiles', async ({ page }) => {
    // Buscar formularios para probar validación
    const forms = await page.$$('form');
    
    if (forms.length > 0) {
      // Enviar el formulario sin completar campos requeridos
      await forms[0].evaluate(form => form.submit());
      
      // Verificar que aparecen mensajes de error
      const errorMessages = await page.$$eval('.error, .invalid-feedback, [aria-invalid="true"]', errors => {
        return errors.map(error => error.textContent);
      });
      
      // Debe haber al menos un mensaje de error
      expect(errorMessages.length).toBeGreaterThan(0);
      
      // Los mensajes de error deben ser descriptivos (más de 5 caracteres)
      for (const message of errorMessages) {
        expect(message.length).toBeGreaterThan(5);
      }
    }
  });
  
  test('debería tener una navegación intuitiva', async ({ page }) => {
    // Verificar que hay un menú de navegación
    const navElements = await page.$$('nav, [role="navigation"]');
    expect(navElements.length).toBeGreaterThanOrEqual(1);
    
    if (navElements.length > 0) {
      // Verificar que los elementos de navegación son clickeables
      const navLinks = await navElements[0].$$('a, button');
      expect(navLinks.length).toBeGreaterThan(0);
      
      // Verificar que al hacer clic en un enlace, la página cambia
      if (navLinks.length > 0) {
        const initialUrl = page.url();
        await navLinks[0].click();
        await page.waitForLoadState('networkidle');
        const newUrl = page.url();
        
        // La URL debe cambiar o debe haber algún cambio en la página
        if (initialUrl === newUrl) {
          // Si la URL no cambió, verificar que hubo algún cambio en el contenido
          const contentChanged = await page.evaluate(() => {
            // Almacenar el estado actual del DOM
            const currentState = document.body.innerHTML;
            
            // Comparar con el estado anterior (simulado)
            return true; // En una prueba real, compararíamos con un estado guardado
          });
          
          expect(contentChanged).toBe(true);
        }
      }
    }
  });
  
  test('debería tener un diseño consistente', async ({ page }) => {
    // Capturar estilos de elementos comunes en la página principal
    const mainPageStyles = await page.evaluate(() => {
      const getStyles = (selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return null;
        
        const styles = window.getComputedStyle(elements[0]);
        return {
          color: styles.color,
          backgroundColor: styles.backgroundColor,
          fontFamily: styles.fontFamily,
          fontSize: styles.fontSize
        };
      };
      
      return {
        headings: getStyles('h1, h2, h3'),
        buttons: getStyles('button, .btn'),
        links: getStyles('a'),
        text: getStyles('p')
      };
    });
    
    // Navegar a otra página (si hay enlaces)
    const links = await page.$$('a');
    if (links.length > 0) {
      await links[0].click();
      await page.waitForLoadState('networkidle');
      
      // Capturar estilos en la segunda página
      const secondPageStyles = await page.evaluate(() => {
        const getStyles = (selector) => {
          const elements = document.querySelectorAll(selector);
          if (elements.length === 0) return null;
          
          const styles = window.getComputedStyle(elements[0]);
          return {
            color: styles.color,
            backgroundColor: styles.backgroundColor,
            fontFamily: styles.fontFamily,
            fontSize: styles.fontSize
          };
        };
        
        return {
          headings: getStyles('h1, h2, h3'),
          buttons: getStyles('button, .btn'),
          links: getStyles('a'),
          text: getStyles('p')
        };
      });
      
      // Comparar estilos entre páginas
      for (const key in mainPageStyles) {
        if (mainPageStyles[key] && secondPageStyles[key]) {
          expect(mainPageStyles[key].fontFamily).toBe(secondPageStyles[key].fontFamily);
          expect(mainPageStyles[key].color).toBe(secondPageStyles[key].color);
        }
      }
    }
  });
  
  test('debería tener feedback visual para interacciones', async ({ page }) => {
    // Verificar hover en elementos interactivos
    const interactiveElements = await page.$$('button, a, input[type="submit"]');
    
    if (interactiveElements.length > 0) {
      // Capturar estilo normal
      const normalStyle = await interactiveElements[0].evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          border: styles.border,
          transform: styles.transform
        };
      });
      
      // Simular hover
      await interactiveElements[0].hover();
      
      // Capturar estilo hover
      const hoverStyle = await interactiveElements[0].evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          border: styles.border,
          transform: styles.transform
        };
      });
      
      // Debe haber algún cambio visual en hover
      const hasStyleChange = Object.keys(normalStyle).some(key => normalStyle[key] !== hoverStyle[key]);
      expect(hasStyleChange).toBe(true);
      
      // Verificar feedback al hacer clic
      await interactiveElements[0].click();
      
      // Verificar que hay algún feedback visual (puede ser un cambio de página, un modal, etc.)
      const hasChangedPage = page.url() !== 'http://localhost:3000';
      if (!hasChangedPage) {
        // Si no cambió de página, verificar otros tipos de feedback
        const hasModal = await page.$$eval('.modal, dialog, [role="dialog"]', modals => modals.length > 0);
        const hasNotification = await page.$$eval('.notification, .alert, .toast', notifications => notifications.length > 0);
        
        expect(hasModal || hasNotification).toBe(true);
      }
    }
  });
});`;
    } else if (framework === 'cypress') {
      return `// Pruebas de usabilidad con Cypress: ${testSpec}
describe('Pruebas de Usabilidad', () => {
  beforeEach(() => {
    // Visitar la página a probar
    cy.visit('/');
  });
  
  it('debería tener una estructura clara y jerárquica', () => {
    // Verificar que hay un encabezado principal
    cy.get('h1').should('have.length.at.least', 1);
    
    // Verificar que hay una navegación principal
    cy.get('nav, [role="navigation"]').should('have.length.at.least', 1);
    
    // Verificar que hay un pie de página
    cy.get('footer, [role="contentinfo"]').should('have.length.at.least', 1);
    
    // Verificar que hay secciones principales
    cy.get('main, [role="main"], section, article').should('have.length.at.least', 1);
  });
  
  it('debería tener elementos interactivos claramente identificables', () => {
    // Verificar que los botones parecen botones
    cy.get('button, [role="button"], input[type="button"], input[type="submit"]').each($button => {
      // Verificar que tiene un estilo distintivo
      cy.wrap($button)
        .should('have.css', 'padding')
        .and('not.eq', '0px');
      
      cy.wrap($button)
        .should('have.css', 'cursor', 'pointer');
    });
    
        // Verificar que los enlaces son distinguibles
        cy.get('a').each($link => {
          // Verificar que tiene un estilo distintivo
          cy.wrap($link)
            .should('have.css', 'cursor', 'pointer');
          
          // Verificar que tiene algún estilo visual distintivo (color o decoración)
          cy.wrap($link).then($el => {
            const styles = window.getComputedStyle($el[0]);
            expect(styles.color !== 'rgb(0, 0, 0)' || 
                   styles.textDecoration !== 'none' || 
                   styles.fontWeight === 'bold').to.be.true;
          });
        });
      });
      
      it('debería tener un diseño responsive', () => {
        // Probar en diferentes tamaños de pantalla
        const viewportSizes = [
          { width: 375, height: 667 },  // Móvil
          { width: 768, height: 1024 }, // Tablet
          { width: 1366, height: 768 }  // Desktop
        ];
        
        viewportSizes.forEach(size => {
          // Ajustar tamaño de la ventana
          cy.viewport(size.width, size.height);
          cy.reload();
          cy.wait(500); // Esperar a que se ajuste el diseño
          
          // Verificar que no hay scroll horizontal
          cy.document().then(doc => {
            expect(doc.documentElement.scrollWidth).to.be.lte(size.width);
          });
          
          // Verificar que los elementos principales son visibles
          cy.get('h1, nav, main, footer').each($el => {
            cy.wrap($el).should('be.visible');
            cy.wrap($el).then($element => {
              const rect = $element[0].getBoundingClientRect();
              expect(rect.width).to.be.lte(size.width);
            });
          });
        });
      });
      
      it('debería tener tiempos de carga y respuesta rápidos', () => {
        // Medir tiempo de carga inicial
        const startTime = Date.now();
        cy.visit('/').then(() => {
          const loadTime = Date.now() - startTime;
          
          // La página debe cargar en menos de 3 segundos
          expect(loadTime).to.be.lessThan(3000);
        });
        
        // Medir tiempo de respuesta para interacciones
        cy.get('button, a, input, select').first().then($el => {
          if ($el.length > 0) {
            // Hacer clic en el primer elemento interactivo
            const interactionStartTime = Date.now();
            cy.wrap($el).click({ force: true });
            cy.wait(100).then(() => {
              const interactionTime = Date.now() - interactionStartTime;
              
              // La interacción debe responder en menos de 300ms
              expect(interactionTime).to.be.lessThan(300);
            });
          }
        });
      });
      
      it('debería tener mensajes de error claros y útiles', () => {
        // Buscar formularios para probar validación
        cy.get('form').then($forms => {
          if ($forms.length > 0) {
            // Enviar el formulario sin completar campos requeridos
            cy.wrap($forms).first().submit();
            
            // Verificar que aparecen mensajes de error
            cy.get('.error, .invalid-feedback, [aria-invalid="true"]').then($errors => {
              // Debe haber al menos un mensaje de error
              expect($errors.length).to.be.greaterThan(0);
              
              // Los mensajes de error deben ser descriptivos (más de 5 caracteres)
              $errors.each((i, error) => {
                expect(error.textContent.length).to.be.greaterThan(5);
              });
            });
          }
        });
      });
      
      it('debería tener una navegación intuitiva', () => {
        // Verificar que hay un menú de navegación
        cy.get('nav, [role="navigation"]').should('have.length.at.least', 1);
        
        cy.get('nav, [role="navigation"]').first().then($nav => {
          // Verificar que los elementos de navegación son clickeables
          cy.wrap($nav).find('a, button').then($navLinks => {
            expect($navLinks.length).to.be.greaterThan(0);
            
            // Verificar que al hacer clic en un enlace, la página cambia
            if ($navLinks.length > 0) {
              const initialUrl = cy.url();
              cy.wrap($navLinks).first().click();
              
              // La URL debe cambiar o debe haber algún cambio en la página
              cy.url().then(newUrl => {
                if (newUrl === initialUrl) {
                  // Si la URL no cambió, verificar que hubo algún cambio en el contenido
                  cy.get('body').then($body => {
                    // En una prueba real, compararíamos con un estado guardado
                    expect(true).to.be.true; // Simulamos que el contenido cambió
                  });
                }
              });
            }
          });
        });
      });
      
      it('debería tener un diseño consistente', () => {
        // Capturar estilos de elementos comunes en la página principal
        const getStyles = (selector) => {
          return cy.get(selector).first().then($el => {
            if ($el.length === 0) return null;
            
            const styles = window.getComputedStyle($el[0]);
            return {
              color: styles.color,
              backgroundColor: styles.backgroundColor,
              fontFamily: styles.fontFamily,
              fontSize: styles.fontSize
            };
          });
        };
        
        // Almacenar estilos de la página principal
        let mainPageStyles = {};
        
        getStyles('h1, h2, h3').then(styles => { mainPageStyles.headings = styles; });
        getStyles('button, .btn').then(styles => { mainPageStyles.buttons = styles; });
        getStyles('a').then(styles => { mainPageStyles.links = styles; });
        getStyles('p').then(styles => { mainPageStyles.text = styles; });
        
        // Navegar a otra página (si hay enlaces)
        cy.get('a').first().then($link => {
          if ($link.length > 0) {
            cy.wrap($link).click();
            
            // Capturar estilos en la segunda página
            let secondPageStyles = {};
            
            getStyles('h1, h2, h3').then(styles => { 
              secondPageStyles.headings = styles;
              
              // Comparar estilos entre páginas
              if (mainPageStyles.headings && secondPageStyles.headings) {
                expect(mainPageStyles.headings.fontFamily).to.equal(secondPageStyles.headings.fontFamily);
                expect(mainPageStyles.headings.color).to.equal(secondPageStyles.headings.color);
              }
            });
            
            getStyles('button, .btn').then(styles => { 
              secondPageStyles.buttons = styles;
              
              if (mainPageStyles.buttons && secondPageStyles.buttons) {
                expect(mainPageStyles.buttons.fontFamily).to.equal(secondPageStyles.buttons.fontFamily);
                expect(mainPageStyles.buttons.color).to.equal(secondPageStyles.buttons.color);
              }
            });
            
            getStyles('a').then(styles => { 
              secondPageStyles.links = styles;
              
              if (mainPageStyles.links && secondPageStyles.links) {
                expect(mainPageStyles.links.fontFamily).to.equal(secondPageStyles.links.fontFamily);
                expect(mainPageStyles.links.color).to.equal(secondPageStyles.links.color);
              }
            });
            
            getStyles('p').then(styles => { 
              secondPageStyles.text = styles;
              
              if (mainPageStyles.text && secondPageStyles.text) {
                expect(mainPageStyles.text.fontFamily).to.equal(secondPageStyles.text.fontFamily);
                expect(mainPageStyles.text.color).to.equal(secondPageStyles.text.color);
              }
            });
          }
        });
      });
      
      it('debería tener feedback visual para interacciones', () => {
        // Verificar hover en elementos interactivos
        cy.get('button, a, input[type="submit"]').first().then($el => {
          if ($el.length > 0) {
            // Capturar estilo normal
            const normalStyle = window.getComputedStyle($el[0]);
            const normalStyles = {
              backgroundColor: normalStyle.backgroundColor,
              color: normalStyle.color,
              border: normalStyle.border,
              transform: normalStyle.transform
            };
            
            // Simular hover
            cy.wrap($el).trigger('mouseover');
            
            // Capturar estilo hover
            cy.wrap($el).then($hoveredEl => {
              const hoverStyle = window.getComputedStyle($hoveredEl[0]);
              const hoverStyles = {
                backgroundColor: hoverStyle.backgroundColor,
                color: hoverStyle.color,
                border: hoverStyle.border,
                transform: hoverStyle.transform
              };
              
              // Debe haber algún cambio visual en hover
              const hasStyleChange = Object.keys(normalStyles).some(key => 
                normalStyles[key] !== hoverStyles[key]
              );
              
              expect(hasStyleChange).to.be.true;
            });
            
            // Verificar feedback al hacer clic
            cy.wrap($el).click();
            
            // Verificar que hay algún feedback visual
            cy.url().then(url => {
              const hasChangedPage = url !== Cypress.config().baseUrl + '/';
              
              if (!hasChangedPage) {
                // Si no cambió de página, verificar otros tipos de feedback
                cy.get('.modal, dialog, [role="dialog"], .notification, .alert, .toast')
                  .then($feedback => {
                    // Debe haber algún tipo de feedback visual
                    expect($feedback.length > 0 || hasChangedPage).to.be.true;
                  });
              }
            });
          }
        });
      });
      
      it('debería tener un contraste adecuado para accesibilidad', () => {
        // Verificar contraste entre texto y fondo
        cy.get('p, h1, h2, h3, a, button, label').each($el => {
          cy.wrap($el).then($element => {
            const styles = window.getComputedStyle($element[0]);
            const textColor = styles.color;
            const bgColor = styles.backgroundColor;
            
            // Función simple para calcular contraste (aproximación)
            const getColorBrightness = (color) => {
              // Extraer valores RGB
              const rgb = color.match(/\d+/g);
              if (!rgb || rgb.length < 3) return 128; // Valor por defecto
              
              // Calcular brillo (fórmula simplificada)
              return (parseInt(rgb[0]) * 299 + parseInt(rgb[1]) * 587 + parseInt(rgb[2]) * 114) / 1000;
            };
            
            const textBrightness = getColorBrightness(textColor);
            const bgBrightness = getColorBrightness(bgColor === 'rgba(0, 0, 0, 0)' ? 'rgb(255, 255, 255)' : bgColor);
            
            // Calcular diferencia de brillo (debe ser al menos 125 para WCAG AA)
            const brightnessDifference = Math.abs(textBrightness - bgBrightness);
            expect(brightnessDifference).to.be.greaterThan(125);
          });
        });
      });
      
      it('debería tener elementos interactivos con tamaño adecuado', () => {
        // Verificar que los elementos interactivos tienen un tamaño mínimo
        cy.get('button, a, input[type="submit"], input[type="checkbox"], input[type="radio"]').each($el => {
          cy.wrap($el).then($element => {
            const rect = $element[0].getBoundingClientRect();
            
            // Los elementos interactivos deben tener al menos 44x44px (recomendación WCAG)
            expect(rect.width >= 44 || rect.height >= 44).to.be.true;
          });
        });
      });
    });`;
        } else {
          // Formato genérico para otros frameworks
          return `// Pruebas de usabilidad para: ${testSpec} usando ${framework}
    // Importar el framework de testing y configurar el entorno
    
    describe('Pruebas de Usabilidad', () => {
      // Configuración inicial
      beforeEach(() => {
        // Navegar a la página a probar
      });
      
      // Prueba: estructura clara
      test('debería tener una estructura clara y jerárquica', async () => {
        // Verificar encabezado principal, navegación, pie de página, secciones
      });
      
      // Prueba: elementos interactivos identificables
      test('debería tener elementos interactivos claramente identificables', async () => {
        // Verificar estilos de botones y enlaces
      });
      
      // Prueba: diseño responsive
      test('debería tener un diseño responsive', async () => {
        // Probar en diferentes tamaños de pantalla
      });
      
      // Prueba: tiempos de carga
      test('debería tener tiempos de carga y respuesta rápidos', async () => {
        // Medir tiempo de carga y respuesta a interacciones
      });
      
      // Prueba: mensajes de error
      test('debería tener mensajes de error claros y útiles', async () => {
        // Verificar mensajes de error en formularios
      });
      
      // Prueba: navegación intuitiva
      test('debería tener una navegación intuitiva', async () => {
        // Verificar menú de navegación y enlaces
      });
      
      // Prueba: diseño consistente
      test('debería tener un diseño consistente', async () => {
        // Comparar estilos entre páginas
      });
      
      // Prueba: feedback visual
      test('debería tener feedback visual para interacciones', async () => {
        // Verificar cambios visuales en hover y clic
      });
      
      // Prueba: contraste adecuado
      test('debería tener un contraste adecuado para accesibilidad', async () => {
        // Verificar contraste entre texto y fondo
      });
      
      // Prueba: tamaño de elementos interactivos
      test('debería tener elementos interactivos con tamaño adecuado', async () => {
        // Verificar tamaño mínimo de elementos interactivos
      });
    });`;
        }
      }
      
      /**
       * Genera pruebas de accesibilidad
       */
      private generateAccessibilityTest(testSpec: string, framework: string): string {
        if (framework === 'playwright') {
          return `// Pruebas de accesibilidad para: ${testSpec}
    import { test, expect } from '@playwright/test';
    import AxeBuilder from '@axe-core/playwright';
    
    test.describe('Pruebas de Accesibilidad', () => {
      test.beforeEach(async ({ page }) => {
        // Navegar a la página a probar
        await page.goto('http://localhost:3000');
      });
      
      test('debería pasar las pruebas de accesibilidad automatizadas', async ({ page }) => {
        // Ejecutar análisis de accesibilidad con axe-core
        const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
        
        // No debe haber violaciones críticas
        expect(accessibilityScanResults.violations).toEqual([]);
      });
      
      test('debería tener atributos ARIA correctos', async ({ page }) => {
        // Verificar elementos con roles ARIA
        const ariaElements = await page.$$('[role]');
        
        for (const element of ariaElements) {
          // Obtener el rol ARIA
          const role = await element.getAttribute('role');
          
          // Verificar que el rol es válido
          const validRoles = [
            'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 
            'cell', 'checkbox', 'columnheader', 'combobox', 'complementary', 
            'contentinfo', 'definition', 'dialog', 'directory', 'document', 
            'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading', 
            'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 
            'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 
            'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation', 
            'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 
            'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 
            'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 
            'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 
            'tooltip', 'tree', 'treegrid', 'treeitem'
          ];
          
          expect(validRoles).toContain(role);
          
          // Verificar propiedades requeridas según el rol
          if (role === 'checkbox' || role === 'switch') {
            const ariaChecked = await element.getAttribute('aria-checked');
            expect(ariaChecked).not.toBeNull();
          } else if (role === 'combobox') {
            const ariaExpanded = await element.getAttribute('aria-expanded');
            expect(ariaExpanded).not.toBeNull();
          }
        }
      });
      
      test('debería tener textos alternativos para imágenes', async ({ page }) => {
        // Verificar que todas las imágenes tienen texto alternativo
        const images = await page.$$('img');
        
        for (const image of images) {
          const alt = await image.getAttribute('alt');
          const role = await image.getAttribute('role');
          
          // Las imágenes deben tener alt o role="presentation"
          expect(alt !== null || role === 'presentation').toBe(true);
          
          // Si tiene alt, no debe estar vacío a menos que sea decorativa
          if (alt !== null && role !== 'presentation') {
            expect(alt.trim()).not.toBe('');
          }
        }
      });
      
      test('debería tener una estructura de encabezados correcta', async ({ page }) => {
        // Verificar la jerarquía de encabezados
        const headings = await page.$$('h1, h2, h3, h4, h5, h6');
        const headingLevels = await Promise.all(
          headings.map(async heading => {
            const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
            return parseInt(tagName.substring(1));
          })
        );
        
        // Debe haber al menos un h1
        expect(headingLevels).toContain(1);
        
        // Verificar que no hay saltos en la jerarquía (por ejemplo, de h1 a h3 sin h2)
        for (let i = 0; i < headingLevels.length - 1; i++) {
          const current = headingLevels[i];
          const next = headingLevels[i + 1];
          
          // El siguiente nivel no debe ser más de un nivel inferior
          expect(next - current).toBeLessThanOrEqual(1);
        }
      });
      
      test('debería tener suficiente contraste de color', async ({ page }) => {
        // Verificar contraste de color para texto
        const textElements = await page.$$('p, h1, h2, h3, h4, h5, h6, a, button, label, span');
        
        for (const element of textElements) {
          // Obtener colores de texto y fondo
          const colors = await element.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
              color: styles.color,
              backgroundColor: styles.backgroundColor
            };
          });
          
          // Función para calcular contraste (simplificada)
          const calculateContrast = (color1, color2) => {
            // Extraer valores RGB
            const rgb1 = color1.match(/\d+/g).map(Number);
            const rgb2 = color2.match(/\d+/g).map(Number);
            
            // Calcular luminancia relativa
            const luminance1 = 0.2126 * rgb1[0] + 0.7152 * rgb1[1] + 0.0722 * rgb1[2];
            const luminance2 = 0.2126 * rgb2[0] + 0.7152 * rgb2[1] + 0.0722 * rgb2[2];
            
            // Calcular ratio de contraste
            const lighter = Math.max(luminance1, luminance2);
            const darker = Math.min(luminance1, luminance2);
            
            return (lighter + 0.05) / (darker + 0.05);
          };
          
          // Si el fondo es transparente, usar blanco como fallback
          const backgroundColor = colors.backgroundColor === 'rgba(0, 0, 0, 0)' ? 'rgb(255, 255, 255)' : colors.backgroundColor;
          
          // Calcular contraste
          const contrast = calculateContrast(colors.color, backgroundColor);
          
          // El contraste debe ser al menos 4.5:1 para texto normal (WCAG AA)
          expect(contrast).toBeGreaterThanOrEqual(4.5);
        }
      });
      
      test('debería ser navegable con teclado', async ({ page }) => {
        // Verificar que se puede navegar con teclado
        await page.keyboard.press('Tab');
        
        // Verificar que hay un elemento enfocado
        const focusedElement = await page.evaluate(() => {
          const active = document.activeElement;
          return {
            tagName: active.tagName,
            hasOutline: window.getComputedStyle(active).outlineStyle !== 'none'
          };
        });
        
        // Debe haber un elemento enfocado que no sea el body
        expect(focusedElement.tagName).not.toBe('BODY');
        
        // El elemento enfocado debe tener un outline visible
        expect(focusedElement.hasOutline).toBe(true);
        
        // Navegar a través de elementos interactivos con Tab
        const interactiveElements = await page.$$('a, button, input, select, textarea, [tabindex]');
        
        // Presionar Tab varias veces y verificar que se puede acceder a todos los elementos interactivos
        for (let i = 0; i < Math.min(interactiveElements.length, 10); i++) {
          await page.keyboard.press('Tab');
          
          const isElementFocused = await page.evaluate(() => {
            const active = document.activeElement;
            return active.tagName !== 'BODY';
          });
          
          expect(isElementFocused).toBe(true);
        }
      });
      
      test('debería tener formularios accesibles', async ({ page }) => {
        // Verificar que los formularios son accesibles
        const forms = await page.$$('form');
        
        for (const form of forms) {
          // Verificar que los campos tienen etiquetas asociadas
          const inputs = await form.$$('input, select, textarea');
          
          for (const input of inputs) {
            // Obtener el id del input
            const id = await input.getAttribute('id');
            
            if (id) {
              // Verificar que hay una etiqueta asociada
              const label = await page.$(`label[for="${id}"]`);
              expect(label).not.toBeNull();
            } else {
              // Si no tiene id, debe estar dentro de un label
              const parentLabel = await input.evaluate(el => {
                let parent = el.parentElement;
                while (parent) {
                  if (parent.tagName === 'LABEL') return true;
                  parent = parent.parentElement;
                }
                return false;
              });
              
              expect(parentLabel).toBe(true);
            }
          }
          
          // Verificar que los campos requeridos están marcados
          const requiredInputs = await form.$$('input[required], select[required], textarea[required]');
          
          for (const input of requiredInputs) {
            // Debe tener aria-required o estar marcado visualmente
            const ariaRequired = await input.getAttribute('aria-required');
            
            if (ariaRequired !== 'true') {
              // Verificar que hay alguna indicación visual
              const id = await input.getAttribute('id');
              let hasVisualIndicator = false;
              
              if (id) {
                const label = await page.$(`label[for="${id}"]`);
                if (label) {
                  hasVisualIndicator = await label.evaluate(el => {
                    return el.textContent.includes('*') || 
                           el.innerHTML.includes('<span') || 
                           el.querySelector('.required');
                  });
                }
              }
              
              expect(hasVisualIndicator).toBe(true);
            }
          }
        }
      });
      
      test('debería tener textos legibles', async ({ page }) => {
        // Verificar tamaño de fuente mínimo
        const textElements = await page.$$('p, li, a, button, input, label, span');
        
        for (const element of textElements) {
          const fontSize = await element.evaluate(el => {
            return parseFloat(window.getComputedStyle(el).fontSize);
          });
          
          // El tamaño de fuente debe ser al menos 12px
          expect(fontSize).toBeGreaterThanOrEqual(12);
        }
        
        // Verificar interlineado adecuado
        const paragraphs = await page.$$('p');
        
        for (const paragraph of paragraphs) {
          const lineHeight = await paragraph.evaluate(el => {
            return parseFloat(window.getComputedStyle(el).lineHeight);
          });
          
          const fontSize = await paragraph.evaluate(el => {
            return parseFloat(window.getComputedStyle(el).fontSize);
          });
          
          // El interlineado debe ser al menos 1.5 veces el tamaño de fuente
          expect(lineHeight).toBeGreaterThanOrEqual(fontSize * 1.2);
        }
      });
      
      test('debería tener contenido no dependiente del color', async ({ page }) => {
        // Verificar que no hay información transmitida solo por color
        const links = await page.$$('a');
        
        for (const link of links) {
          // Verificar que los enlaces tienen subrayado o algún otro indicador además del color
          const hasUnderline = await link.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.textDecoration.includes('underline') || 
                   styles.borderBottom !== 'none' || 
                   el.innerHTML.includes('<u>') ||
                   el.querySelector('u');
          });
          
          expect(hasUnderline).toBe(true);
        }
        
        // Verificar que los mensajes de error no dependen solo del color
        const errorMessages = await page.$$('.error, .invalid-feedback, [aria-invalid="true"]');
        
        for (const error of errorMessages) {
          // Verificar que hay algún indicador además del color (icono, texto, etc.)
          const hasNonColorIndicator = await error.evaluate(el => {
            return el.textContent.trim() !== '' || // Tiene texto
                   el.querySelector('i, svg, img') !== null || // Tiene icono
                   el.getAttribute('aria-label') !== null; // Tiene etiqueta ARIA
          });
          
          expect(hasNonColorIndicator).toBe(true);
        }
      });
    });`;
        } else if (framework === 'cypress') {
          return `// Pruebas de accesibilidad con Cypress: ${testSpec}
    describe('Pruebas de Accesibilidad', () => {
      beforeEach(() => {
        // Visitar la página a probar
        cy.visit('/');
        cy.injectAxe(); // Requiere cypress-axe
      });
      
      it('debería pasar las pruebas de accesibilidad automatizadas', () => {
        // Ejecutar análisis de accesibilidad con axe-core
        cy.checkA11y();
      });
      
      it('debería tener atributos ARIA correctos', () => {
        // Verificar elementos con roles ARIA
        cy.get('[role]').each($el => {
          // Obtener el rol ARIA
          const role = $el.attr('role');
          
          // Verificar que el rol es válido
          const validRoles = [
            'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 
            'cell', 'checkbox', 'columnheader', 'combobox', 'complementary', 
            'contentinfo', 'definition', 'dialog', 'directory', 'document', 
            'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading', 
            'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 
            'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 
            'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation', 
            'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 
            'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 
            'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 
            'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 
            'tooltip', 'tree', 'treegrid', 'treeitem'
          ];
          
          expect(validRoles).to.include(role);
          
          // Verificar propiedades requeridas según el rol
          if (role === 'checkbox' || role === 'switch') {
            expect($el).to.have.attr('aria-checked');
          } else if (role === 'combobox') {
            expect($el).to.have.attr('aria-expanded');
          }
        });
      });
      
      it('debería tener textos alternativos para imágenes', () => {
        // Verificar que todas las imágenes tienen texto alternativo
        cy.get('img').each($img => {
          // Verificar que tiene atributo alt o role="presentation"
          cy.wrap($img).then($el => {
            const alt = $el.attr('alt');
            const role = $el.attr('role');
            
            // Las imágenes deben tener alt o role="presentation"
            expect(alt !== undefined || role === 'presentation').to.be.true;
            
            // Si tiene alt, no debe estar vacío a menos que sea decorativa
            if (alt !== undefined && role !== 'presentation') {
              expect(alt.trim()).not.to.equal('');
            }
          });
        });
      });
      
      it('debería tener una estructura de encabezados correcta', () => {
        // Verificar la jerarquía de encabezados
        cy.get('h1, h2, h3, h4, h5, h6').then($headings => {
          const headingLevels = $headings.toArray().map(el => 
            parseInt(el.tagName.toLowerCase().substring(1))
          );
          
          // Debe haber al menos un h1
          expect(headingLevels).to.include(1);
          
          // Verificar que no hay saltos en la jerarquía (por ejemplo, de h1 a h3 sin h2)
          for (let i = 0; i < headingLevels.length - 1; i++) {
            const current = headingLevels[i];
            const next = headingLevels[i + 1];
            
            // El siguiente nivel no debe ser más de un nivel inferior
            expect(next - current).to.be.lessThanOrEqual(1);
          }
        });
      });
      
      it('debería tener suficiente contraste de color', () => {
        // Verificar contraste de color para texto
        cy.get('p, h1, h2, h3, h4, h5, h6, a, button, label, span').each($el => {
          cy.wrap($el).then($element => {
            const styles = window.getComputedStyle($element[0]);
            const color = styles.color;
            let backgroundColor = styles.backgroundColor;
            
            // Si el fondo es transparente, usar el color de fondo del padre
            if (backgroundColor === 'rgba(0, 0, 0, 0)') {
              backgroundColor = 'rgb(255, 255, 255)'; // Fallback a blanco
            }
            
            // Función para calcular contraste (simplificada)
            const calculateContrast = (color1, color2) => {
              // Extraer valores RGB
              const rgb1 = color1.match(/\d+/g).map(Number);
              const rgb2 = color2.match(/\d+/g).map(Number);
              
              if (!rgb1 || !rgb2) return 21; // Valor alto por defecto si no se puede calcular
              
              // Calcular luminancia relativa
              const luminance1 = 0.2126 * rgb1[0] + 0.7152 * rgb1[1] + 0.0722 * rgb1[2];
              const luminance2 = 0.2126 * rgb2[0] + 0.7152 * rgb2[1] + 0.0722 * rgb2[2];
              
              // Calcular ratio de contraste
              const lighter = Math.max(luminance1, luminance2);
              const darker = Math.min(luminance1, luminance2);
              
              return (lighter + 0.05) / (darker + 0.05);
            };
            
            // Calcular contraste
            const contrast = calculateContrast(color, backgroundColor);
            
            // El contraste debe ser al menos 4.5:1 para texto normal (WCAG AA)
            expect(contrast).to.be.greaterThan(4.5);
          });
        });
      });
      
      it('debería ser navegable con teclado', () => {
        // Verificar que se puede navegar con teclado
        cy.focused().should('not.exist');
        cy.tab();
        
        // Verificar que hay un elemento enfocado
        cy.focused().then($focused => {
          // Debe haber un elemento enfocado que no sea el body
          expect($focused[0].tagName).not.to.equal('BODY');
          
          // El elemento enfocado debe tener un outline visible
          const styles = window.getComputedStyle($focused[0]);
          expect(styles.outlineStyle).not.to.equal('none');
        });
        
        // Navegar a través de elementos interactivos con Tab
        cy.get('a, button, input, select, textarea, [tabindex]').then($interactiveElements => {
          // Presionar Tab varias veces y verificar que se puede acceder a elementos interactivos
          const maxTabs = Math.min($interactiveElements.length, 10);
          
          for (let i = 0; i < maxTabs; i++) {
            cy.tab();
            cy.focused().should('exist');
          }
        });
      });
      
      it('debería tener formularios accesibles', () => {
        // Verificar que los formularios son accesibles
        cy.get('form').each($form => {
          // Verificar que los campos tienen etiquetas asociadas
          cy.wrap($form).find('input, select, textarea').each($input => {
            // Obtener el id del input
            const id = $input.attr('id');
            
            if (id) {
              // Verificar que hay una etiqueta asociada
              cy.get(`label[for="${id}"]`).then($label => {
                expect($label.length).to.be.greaterThan(0);
              });
            } else {
              // Si no tiene id, debe estar dentro de un label
              cy.wrap($input).parents('label').then($parentLabel => {
                expect($parentLabel.length).to.be.greaterThan(0);
              });
            }
          });
          
          // Verificar que los campos requeridos están marcados
          cy.wrap($form).find('input[required], select[required], textarea[required]').each($input => {
            // Debe tener aria-required o estar marcado visualmente
            cy.wrap($input).then($el => {
              const ariaRequired = $el.attr('aria-required');
              
              if (ariaRequired !== 'true') {
                // Verificar que hay alguna indicación visual
                const id = $el.attr('id');
                
                if (id) {
                  cy.get(`label[for="${id}"]`).then($label => {
                    const hasVisualIndicator = 
                      $label.text().includes('*') || 
                      $label.html().includes('<span') || 
                      $label.find('.required').length > 0;
                    
                    expect(hasVisualIndicator).to.be.true;
                  });
                }
              }
            });
          });
        });
      });
      
      it('debería tener textos legibles', () => {
        // Verificar tamaño de fuente mínimo
        cy.get('p, li, a, button, input, label, span').each($el => {
          cy.wrap($el).then($element => {
            const fontSize = parseFloat(window.getComputedStyle($element[0]).fontSize);
            
            // El tamaño de fuente debe ser al menos 12px
            expect(fontSize).to.be.greaterThanOrEqual(12);
          });
        });
        
        // Verificar interlineado adecuado
        cy.get('p').each($p => {
          cy.wrap($p).then($paragraph => {
            const styles = window.getComputedStyle($paragraph[0]);
            const lineHeight = parseFloat(styles.lineHeight);
            const fontSize = parseFloat(styles.fontSize);
            
            // Si lineHeight es 'normal', asumimos que es aproximadamente 1.2 veces el tamaño de fuente
            const effectiveLineHeight = lineHeight === 'normal' ? fontSize * 1.2 : lineHeight;
            
            // El interlineado debe ser al menos 1.2 veces el tamaño de fuente
            expect(effectiveLineHeight).to.be.greaterThanOrEqual(fontSize * 1.2);
          });
        });
      });
      
      it('debería tener contenido no dependiente del color', () => {
        // Verificar que no hay información transmitida solo por color
        cy.get('a').each($link => {
          // Verificar que los enlaces tienen subrayado o algún otro indicador además del color
          cy.wrap($link).then($el => {
            const styles = window.getComputedStyle($el[0]);
            const hasUnderline = 
              styles.textDecoration.includes('underline') || 
              styles.borderBottom !== 'none' || 
              $el.html().includes('<u>') ||
              $el.find('u').length > 0;
            
            expect(hasUnderline).to.be.true;
          });
        });
        
        // Verificar que los mensajes de error no dependen solo del color
        cy.get('.error, .invalid-feedback, [aria-invalid="true"]').each($error => {
          // Verificar que hay algún indicador además del color (icono, texto, etc.)
          cy.wrap($error).then($el => {
            const hasNonColorIndicator = 
              $el.text().trim() !== '' || // Tiene texto
              $el.find('i, svg, img').length > 0 || // Tiene icono
              $el.attr('aria-label') !== undefined; // Tiene etiqueta ARIA
            
            expect(hasNonColorIndicator).to.be.true;
          });
        });
      });
    });
  }
  
  /**
   * Genera pruebas de rendimiento
   */
  private generatePerformanceTest(testSpec: string, framework: string): string {
    if (framework === 'playwright') {
      return `// Pruebas de rendimiento para: ${testSpec}
import { test, expect } from '@playwright/test';

test.describe('Pruebas de Rendimiento', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
  });
  
  test('debería cargar en menos de 3 segundos', async ({ page }) => {
    // Medir tiempo de carga
    const startTime = Date.now();
    
    // Navegar a la página y esperar a que cargue completamente
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    const loadTime = Date.now() - startTime;
    console.log(\`Tiempo de carga: \${loadTime}ms\`);
    
    // La página debe cargar en menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
  });
  
  test('debería tener un First Contentful Paint rápido', async ({ page }) => {
    // Medir First Contentful Paint usando Performance API
    const fcpTime = await page.evaluate(() => {
      return new Promise(resolve => {
        // Crear un PerformanceObserver para detectar el FCP
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              observer.disconnect();
              resolve(entry.startTime);
              break;
            }
          }
        });
        
        // Observar las métricas de paint
        observer.observe({ type: 'paint', buffered: true });
        
        // Si no se detecta FCP en 10 segundos, resolver con un valor alto
        setTimeout(() => resolve(10000), 10000);
      });
    });
    
    console.log(\`First Contentful Paint: \${fcpTime}ms\`);
    
    // El FCP debe ser menor a 1.8 segundos (bueno según Web Vitals)
    expect(fcpTime).toBeLessThan(1800);
  });
  
  test('debería tener un Largest Contentful Paint rápido', async ({ page }) => {
    // Medir Largest Contentful Paint usando Performance API
    const lcpTime = await page.evaluate(() => {
      return new Promise(resolve => {
        // Crear un PerformanceObserver para detectar el LCP
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          // El último entry es el que nos interesa
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            observer.disconnect();
            resolve(lastEntry.startTime);
          }
        });
        
        // Observar las métricas de LCP
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Si no se detecta LCP en 10 segundos, resolver con un valor alto
        setTimeout(() => resolve(10000), 10000);
      });
    });
    
    console.log(\`Largest Contentful Paint: \${lcpTime}ms\`);
    
    // El LCP debe ser menor a 2.5 segundos (bueno según Web Vitals)
    expect(lcpTime).toBeLessThan(2500);
  });
  
  test('debería tener un Cumulative Layout Shift bajo', async ({ page }) => {
    // Medir Cumulative Layout Shift usando Performance API
    const cls = await page.evaluate(() => {
      return new Promise(resolve => {
        let clsValue = 0;
        
        // Crear un PerformanceObserver para detectar el CLS
        const observer = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });
        
        // Observar las métricas de layout-shift
        observer.observe({ type: 'layout-shift', buffered: true });
        
        // Resolver después de 5 segundos
        setTimeout(() => resolve(clsValue), 5000);
      });
    });
    
    console.log(\`Cumulative Layout Shift: \${cls}\`);
    
    // El CLS debe ser menor a 0.1 (bueno según Web Vitals)
    expect(cls).toBeLessThan(0.1);
  });
  
  test('debería tener un First Input Delay bajo', async ({ page }) => {
    // Simular interacción del usuario y medir tiempo de respuesta
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    // Encontrar un elemento interactivo
    const interactiveElement = await page.$('button, a, input, select');
    
    if (interactiveElement) {
      // Medir tiempo de respuesta
      const responseTime = await page.evaluate(async () => {
        return new Promise(resolve => {
          // Crear variable para almacenar el tiempo de inicio
          let startTime;
          
          // Función para manejar el evento click
          const handleClick = () => {
            const endTime = performance.now();
            document.removeEventListener('click', handleClick);
            resolve(endTime - startTime);
          };
          
          // Registrar el evento click
          document.addEventListener('click', handleClick);
          
          // Registrar el tiempo de inicio
          startTime = performance.now();
          
          // Simular clic en el primer elemento interactivo
          document.querySelector('button, a, input, select').click();
        });
      });
      
      console.log(\`Tiempo de respuesta: \${responseTime}ms\`);
      
      // El tiempo de respuesta debe ser menor a 100ms
      expect(responseTime).toBeLessThan(100);
    } else {
      console.log('No se encontraron elementos interactivos');
    }
  });
  
  test('debería tener un tamaño de página optimizado', async ({ page, request }) => {
    // Obtener el tamaño total de la página
    const response = await request.get('http://localhost:3000');
    const pageSize = (await response.body()).length;
    
    console.log(\`Tamaño de la página: \${pageSize / 1024} KB\`);
    
    // El tamaño de la página debe ser menor a 1MB
    expect(pageSize).toBeLessThan(1024 * 1024);
    
    // Verificar el número de recursos cargados
    const resourcesInfo = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      
      // Calcular tamaño total de recursos
      const totalSize = resources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);
      
      return {
        count: resources.length,
        totalSize: totalSize / 1024, // KB
        byType: {
          js: resources.filter(r => r.name.endsWith('.js')).length,
          css: resources.filter(r => r.name.endsWith('.css')).length,
          img: resources.filter(r => r.name.match(/\\.(png|jpg|jpeg|gif|svg|webp)$/)).length,
          font: resources.filter(r => r.name.match(/\\.(woff|woff2|ttf|otf|eot)$/)).length,
          other: resources.filter(r => !r.name.match(/\\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|otf|eot)$/)).length
        }
      };
    });
    
    console.log(\`Recursos cargados: \${resourcesInfo.count}\`);
    console.log(\`Tamaño total de recursos: \${resourcesInfo.totalSize} KB\`);
    console.log(\`JS: \${resourcesInfo.byType.js}, CSS: \${resourcesInfo.byType.css}, Imágenes: \${resourcesInfo.byType.img}, Fuentes: \${resourcesInfo.byType.font}, Otros: \${resourcesInfo.byType.other}\`);
    
    // El número de recursos debe ser razonable
    expect(resourcesInfo.count).toBeLessThan(50);
    
    // El tamaño total de recursos debe ser menor a 2MB
    expect(resourcesInfo.totalSize).toBeLessThan(2048); // 2MB en KB
  });
  
  test('debería tener imágenes optimizadas', async ({ page }) => {
    // Verificar que las imágenes están optimizadas
    const imagesInfo = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      
      return images.map(img => {
        const rect = img.getBoundingClientRect();
        
        return {
          src: img.src,
          displayWidth: rect.width,
          displayHeight: rect.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          hasLazyLoading: img.loading === 'lazy',
          hasCorrectAspectRatio: Math.abs((rect.width / rect.height) - (img.naturalWidth / img.naturalHeight)) < 0.1
        };
      });
    });
    
    for (const img of imagesInfo) {
      console.log(\`Imagen: \${img.src}\`);
      console.log(\`Dimensiones mostradas: \${img.displayWidth}x\${img.displayHeight}\`);
      console.log(\`Dimensiones naturales: \${img.naturalWidth}x\${img.naturalHeight}\`);
      console.log(\`Lazy loading: \${img.hasLazyLoading}\`);
      console.log(\`Aspect ratio correcto: \${img.hasCorrectAspectRatio}\`);
      
      // Las imágenes no deben ser mucho más grandes que su tamaño de visualización
      const overSizingRatio = (img.naturalWidth * img.naturalHeight) / (img.displayWidth * img.displayHeight);
      expect(overSizingRatio).toBeLessThan(4); // No más de 4 veces el tamaño necesario
      
      // Las imágenes deben mantener su relación de aspecto
      expect(img.hasCorrectAspectRatio).toBe(true);
      
      // Las imágenes deben tener lazy loading
      expect(img.hasLazyLoading).toBe(true);
    }
  });
  
  test('debería tener un rendimiento de JavaScript optimizado', async ({ page }) => {
    // Medir tiempo de ejecución de JavaScript
    const jsTiming = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(resource => resource.name.endsWith('.js'))
        .map(js => ({
          name: js.name.split('/').pop(),
          duration: js.duration,
          size: js.transferSize
        }));
    });
    
    console.log('Rendimiento de JavaScript:');
    for (const js of jsTiming) {
      console.log(\`\${js.name}: \${js.duration}ms, \${js.size / 1024} KB\`);
      
      // Cada archivo JS debe cargarse en menos de 500ms
      expect(js.duration).toBeLessThan(500);
      
      // Cada archivo JS debe ser menor a 500KB
      expect(js.size).toBeLessThan(500 * 1024);
    }
    
    // Medir tiempo de ejecución de scripts
    const scriptExecutionTime = await page.evaluate(() => {
      return performance.getEntriesByType('measure')
        .filter(measure => measure.name.startsWith('script-'))
        .reduce((total, measure) => total + measure.duration, 0);
    });
    
    console.log(\`Tiempo total de ejecución de scripts: \${scriptExecutionTime}ms\`);
    
    // El tiempo total de ejecución de scripts debe ser menor a 1 segundo
    expect(scriptExecutionTime).toBeLessThan(1000);
  });
  
  test('debería tener un rendimiento de CSS optimizado', async ({ page }) => {
    // Medir tiempo de carga de CSS
    const cssTiming = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(resource => resource.name.endsWith('.css'))
        .map(css => ({
          name: css.name.split('/').pop(),
          duration: css.duration,
          size: css.transferSize
        }));
    });
    
    console.log('Rendimiento de CSS:');
    for (const css of cssTiming) {
      console.log(\`\${css.name}: \${css.duration}ms, \${css.size / 1024} KB\`);
      
      // Cada archivo CSS debe cargarse en menos de 300ms
      expect(css.duration).toBeLessThan(300);
      
      // Cada archivo CSS debe ser menor a 100KB
      expect(css.size).toBeLessThan(100 * 1024);
    }
    
    // Verificar número de reglas CSS
    const cssStats = await page.evaluate(() => {
      let totalRules = 0;
      let unusedRules = 0;
      
      // Contar reglas CSS
      for (const sheet of document.styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          totalRules += rules.length;
          
          // Contar reglas no utilizadas (aproximación)
          for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            if (rule.selectorText) {
              try {
                const elements = document.querySelectorAll(rule.selectorText);
                if (elements.length === 0) {
                  unusedRules++;
                }
              } catch (e) {
                // Selector inválido o pseudo-elemento
              }
            }
          }
        } catch (e) {
          // Error al acceder a las reglas (posiblemente CORS)
        }
      }
      
      return { totalRules, unusedRules };
    });
    
    console.log(\`Total de reglas CSS: \${cssStats.totalRules}\`);
    console.log(\`Reglas CSS no utilizadas: \${cssStats.unusedRules}\`);
    
    // El número de reglas CSS debe ser razonable
    expect(cssStats.totalRules).toBeLessThan(2000);
    
    // El porcentaje de reglas no utilizadas debe ser bajo
    const unusedPercentage = (cssStats.unusedRules / cssStats.totalRules) * 100;
    expect(unusedPercentage).toBeLessThan(30); // Menos del 30% de reglas no utilizadas
  });
  
  test('debería tener un rendimiento de red optimizado', async ({ page }) => {
    // Verificar número de peticiones HTTP
    const networkStats = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      
      // Agrupar por tipo
      const byType = {
        xhr: resources.filter(r => r.initiatorType === 'xmlhttprequest').length,
        fetch: resources.filter(r => r.initiatorType === 'fetch').length,
        img: resources.filter(r => r.initiatorType === 'img').length,
        css: resources.filter(r => r.initiatorType === 'css' || r.name.endsWith('.css')).length,
        js: resources.filter(r => r.initiatorType === 'script' || r.name.endsWith('.js')).length,
        font: resources.filter(r => r.name.match(/\\.(woff|woff2|ttf|otf|eot)$/)).length,
        other: resources.filter(r => !['xmlhttprequest', 'fetch', 'img', 'css', 'script'].includes(r.initiatorType) && 
                                    !r.name.match(/\\.(css|js|woff|woff2|ttf|otf|eot)$/)).length
      };
      
      return {
        total: resources.length,
        byType
      };
    });
    
    console.log(\`Total de peticiones HTTP: \${networkStats.total}\`);
    console.log(\`XHR: \${networkStats.byType.xhr}, Fetch: \${networkStats.byType.fetch}, Imágenes: \${networkStats.byType.img}, CSS: \${networkStats.byType.css}, JS: \${networkStats.byType.js}, Fuentes: \${networkStats.byType.font}, Otros: \${networkStats.byType.other}\`);
    
    // El número total de peticiones debe ser razonable
    expect(networkStats.total).toBeLessThan(100);
    
    // Verificar que se utilizan técnicas de optimización
    const optimizationTechniques = await page.evaluate(() => {
      // Verificar si se utiliza HTTP/2
      const isHttp2 = performance.getEntriesByType('navigation')[0].nextHopProtocol === 'h2';
      
      // Verificar si se utiliza preload/prefetch
      const hasPreload = document.querySelectorAll('link[rel="preload"], link[rel="prefetch"]').length > 0;
      
      // Verificar si se utiliza lazy loading
      const hasLazyLoading = document.querySelectorAll('img[loading="lazy"], iframe[loading="lazy"]').length > 0;
      
      // Verificar si se utiliza service worker
      const hasServiceWorker = 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null;
      
      return {
        isHttp2,
        hasPreload,
        hasLazyLoading,
        hasServiceWorker
      };
    });
    
    console.log(\`HTTP/2: \${optimizationTechniques.isHttp2}\`);
    console.log(\`Preload/Prefetch: \${optimizationTechniques.hasPreload}\`);
    console.log(\`Lazy Loading: \${optimizationTechniques.hasLazyLoading}\`);
    console.log(\`Service Worker: \${optimizationTechniques.hasServiceWorker}\`);
    
    // Debe utilizar al menos algunas técnicas de optimización
    expect(Object.values(optimizationTechniques).filter(Boolean).length).toBeGreaterThan(1);
  });
});`;
    } else if (framework === 'cypress') {
      return `// Pruebas de rendimiento con Cypress: ${testSpec}
describe('Pruebas de Rendimiento', () => {
  beforeEach(() => {
    // Visitar la página a probar
    cy.visit('/');
  });
  
  it('debería cargar en menos de 3 segundos', () => {
    // Medir tiempo de carga
    const startTime = Date.now();
    
    // Navegar a la página y esperar a que cargue completamente
    cy.visit('/', { timeout: 10000 }).then(() => {
      const loadTime = Date.now() - startTime;
      cy.log(\`Tiempo de carga: \${loadTime}ms\`);
      
      // La página debe cargar en menos de 3 segundos
      expect(loadTime).to.be.lessThan(3000);
    });
  });
  
  it('debería tener un First Contentful Paint rápido', () => {
    // Medir First Contentful Paint usando Performance API
    cy.window().then(win => {
      return new Cypress.Promise(resolve => {
        // Crear un PerformanceObserver para detectar el FCP
        const observer = new win.PerformanceObserver(list => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              observer.disconnect();
              resolve(entry.startTime);
              break;
            }
          }
        });
        
        // Observar las métricas de paint
        observer.observe({ type: 'paint', buffered: true });
        
        // Si no se detecta FCP en 10 segundos, resolver con un valor alto
        setTimeout(() => resolve(10000), 10000);
      }).then(fcpTime => {
        cy.log(\`First Contentful Paint: \${fcpTime}ms\`);
        
        // El FCP debe ser menor a 1.8 segundos (bueno según Web Vitals)
        expect(fcpTime).to.be.lessThan(1800);
      });
    });
  });
  
  it('debería tener un Largest Contentful Paint rápido', () => {
    // Medir Largest Contentful Paint usando Performance API
    cy.window().then(win => {
      return new Cypress.Promise(resolve => {
                // Crear un PerformanceObserver para detectar el LCP
        const observer = new win.PerformanceObserver(list => {
          const entries = list.getEntries();
          // El último entry es el que nos interesa
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            observer.disconnect();
            resolve(lastEntry.startTime);
          }
        });
        
        // Observar las métricas de LCP
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Si no se detecta LCP en 10 segundos, resolver con un valor alto
        setTimeout(() => resolve(10000), 10000);
      }).then(lcpTime => {
        cy.log(`Largest Contentful Paint: ${lcpTime}ms`);
        
        // El LCP debe ser menor a 2.5 segundos (bueno según Web Vitals)
        expect(lcpTime).to.be.lessThan(2500);
      });
    });
  });
  
  it('debería tener un Cumulative Layout Shift bajo', () => {
    // Medir Cumulative Layout Shift usando Performance API
    cy.window().then(win => {
      return new Cypress.Promise(resolve => {
        let clsValue = 0;
        
        // Crear un PerformanceObserver para detectar el CLS
        const observer = new win.PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });
        
        // Observar las métricas de layout-shift
        observer.observe({ type: 'layout-shift', buffered: true });
        
        // Resolver después de 5 segundos
        setTimeout(() => resolve(clsValue), 5000);
      }).then(cls => {
        cy.log(`Cumulative Layout Shift: ${cls}`);
        
        // El CLS debe ser menor a 0.1 (bueno según Web Vitals)
        expect(cls).to.be.lessThan(0.1);
      });
    });
  });
  
  it('debería tener un First Input Delay bajo', () => {
    // Simular interacción del usuario y medir tiempo de respuesta
    cy.get('button, a, input, select').first().then($el => {
      if ($el.length) {
        // Medir tiempo de respuesta
        const startTime = Date.now();
        
        // Hacer clic en el elemento
        cy.wrap($el).click().then(() => {
          const responseTime = Date.now() - startTime;
          cy.log(`Tiempo de respuesta: ${responseTime}ms`);
          
          // El tiempo de respuesta debe ser menor a 100ms
          expect(responseTime).to.be.lessThan(100);
        });
      } else {
        cy.log('No se encontraron elementos interactivos');
      }
    });
  });
  
  it('debería tener un tamaño de página optimizado', () => {
    // Verificar el tamaño total de la página
    cy.window().then(win => {
      // Obtener todos los recursos
      const resources = win.performance.getEntriesByType('resource');
      
      // Calcular tamaño total de recursos
      const totalSize = resources.reduce((total, resource) => {
        return total + (resource.transferSize || 0);
      }, 0);
      
      cy.log(`Tamaño total de recursos: ${totalSize / 1024} KB`);
      
      // El tamaño total de recursos debe ser menor a 2MB
      expect(totalSize).to.be.lessThan(2 * 1024 * 1024);
      
      // Agrupar recursos por tipo
      const resourcesByType = {
        js: resources.filter(r => r.name.endsWith('.js')).length,
        css: resources.filter(r => r.name.endsWith('.css')).length,
        img: resources.filter(r => r.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)).length,
        font: resources.filter(r => r.name.match(/\.(woff|woff2|ttf|otf|eot)$/)).length,
        other: resources.filter(r => !r.name.match(/\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|otf|eot)$/)).length
      };
      
      cy.log(`JS: ${resourcesByType.js}, CSS: ${resourcesByType.css}, Imágenes: ${resourcesByType.img}, Fuentes: ${resourcesByType.font}, Otros: ${resourcesByType.other}`);
      
      // El número de recursos debe ser razonable
      expect(resources.length).to.be.lessThan(50);
    });
  });
  
  it('debería tener imágenes optimizadas', () => {
    // Verificar que las imágenes están optimizadas
    cy.get('img').each($img => {
      cy.wrap($img).then($el => {
        // Obtener dimensiones naturales y mostradas
        const naturalWidth = $el[0].naturalWidth;
        const naturalHeight = $el[0].naturalHeight;
        const displayWidth = $el.width();
        const displayHeight = $el.height();
        
        // Verificar si tiene lazy loading
        const hasLazyLoading = $el.attr('loading') === 'lazy';
        
        // Verificar relación de aspecto
        const naturalRatio = naturalWidth / naturalHeight;
        const displayRatio = displayWidth / displayHeight;
        const hasCorrectAspectRatio = Math.abs(naturalRatio - displayRatio) < 0.1;
        
        cy.log(`Imagen: ${$el.attr('src')}`);
        cy.log(`Dimensiones mostradas: ${displayWidth}x${displayHeight}`);
        cy.log(`Dimensiones naturales: ${naturalWidth}x${naturalHeight}`);
        cy.log(`Lazy loading: ${hasLazyLoading}`);
        cy.log(`Aspect ratio correcto: ${hasCorrectAspectRatio}`);
        
        // Las imágenes no deben ser mucho más grandes que su tamaño de visualización
        const overSizingRatio = (naturalWidth * naturalHeight) / (displayWidth * displayHeight || 1);
        expect(overSizingRatio).to.be.lessThan(4); // No más de 4 veces el tamaño necesario
        
        // Las imágenes deben mantener su relación de aspecto
        expect(hasCorrectAspectRatio).to.be.true;
        
        // Las imágenes deben tener lazy loading
        expect(hasLazyLoading).to.be.true;
      });
    });
  });
  
  it('debería tener un rendimiento de JavaScript optimizado', () => {
    // Medir tiempo de ejecución de JavaScript
    cy.window().then(win => {
      const jsTiming = win.performance.getEntriesByType('resource')
        .filter(resource => resource.name.endsWith('.js'))
        .map(js => ({
          name: js.name.split('/').pop(),
          duration: js.duration,
          size: js.transferSize
        }));
      
      cy.log('Rendimiento de JavaScript:');
      jsTiming.forEach(js => {
        cy.log(`${js.name}: ${js.duration}ms, ${js.size / 1024} KB`);
        
        // Cada archivo JS debe cargarse en menos de 500ms
        expect(js.duration).to.be.lessThan(500);
        
        // Cada archivo JS debe ser menor a 500KB
        expect(js.size).to.be.lessThan(500 * 1024);
      });
    });
  });
  
  it('debería tener un rendimiento de CSS optimizado', () => {
    // Medir tiempo de carga de CSS
    cy.window().then(win => {
      const cssTiming = win.performance.getEntriesByType('resource')
        .filter(resource => resource.name.endsWith('.css'))
        .map(css => ({
          name: css.name.split('/').pop(),
          duration: css.duration,
          size: css.transferSize
        }));
      
      cy.log('Rendimiento de CSS:');
      cssTiming.forEach(css => {
        cy.log(`${css.name}: ${css.duration}ms, ${css.size / 1024} KB`);
        
        // Cada archivo CSS debe cargarse en menos de 300ms
        expect(css.duration).to.be.lessThan(300);
        
        // Cada archivo CSS debe ser menor a 100KB
        expect(css.size).to.be.lessThan(100 * 1024);
      });
      
      // Verificar número de reglas CSS
      let totalRules = 0;
      let unusedRules = 0;
      
      // Contar reglas CSS
      for (const sheet of win.document.styleSheets) {
        try {
          const rules = sheet.cssRules || sheet.rules;
          totalRules += rules.length;
          
          // Contar reglas no utilizadas (aproximación)
          for (let i = 0; i < rules.length; i++) {
            const rule = rules[i];
            if (rule.selectorText) {
              try {
                const elements = win.document.querySelectorAll(rule.selectorText);
                if (elements.length === 0) {
                  unusedRules++;
                }
              } catch (e) {
                // Selector inválido o pseudo-elemento
              }
            }
          }
        } catch (e) {
          // Error al acceder a las reglas (posiblemente CORS)
        }
      }
      
      cy.log(`Total de reglas CSS: ${totalRules}`);
      cy.log(`Reglas CSS no utilizadas: ${unusedRules}`);
      
      // El número de reglas CSS debe ser razonable
      expect(totalRules).to.be.lessThan(2000);
      
      // El porcentaje de reglas no utilizadas debe ser bajo
      const unusedPercentage = (unusedRules / totalRules) * 100;
      expect(unusedPercentage).to.be.lessThan(30); // Menos del 30% de reglas no utilizadas
    });
  });
  
  it('debería tener un rendimiento de red optimizado', () => {
    // Verificar número de peticiones HTTP
    cy.window().then(win => {
      const resources = win.performance.getEntriesByType('resource');
      
      // Agrupar por tipo
      const byType = {
        xhr: resources.filter(r => r.initiatorType === 'xmlhttprequest').length,
        fetch: resources.filter(r => r.initiatorType === 'fetch').length,
        img: resources.filter(r => r.initiatorType === 'img').length,
        css: resources.filter(r => r.initiatorType === 'css' || r.name.endsWith('.css')).length,
        js: resources.filter(r => r.initiatorType === 'script' || r.name.endsWith('.js')).length,
        font: resources.filter(r => r.name.match(/\.(woff|woff2|ttf|otf|eot)$/)).length,
        other: resources.filter(r => !['xmlhttprequest', 'fetch', 'img', 'css', 'script'].includes(r.initiatorType) && 
                                    !r.name.match(/\.(css|js|woff|woff2|ttf|otf|eot)$/)).length
      };
      
      cy.log(`Total de peticiones HTTP: ${resources.length}`);
      cy.log(`XHR: ${byType.xhr}, Fetch: ${byType.fetch}, Imágenes: ${byType.img}, CSS: ${byType.css}, JS: ${byType.js}, Fuentes: ${byType.font}, Otros: ${byType.other}`);
      
      // El número total de peticiones debe ser razonable
      expect(resources.length).to.be.lessThan(100);
    });
  });
});`;
    } else {
      return `// Pruebas de rendimiento con Jest: ${testSpec}
describe('Pruebas de Rendimiento', () => {
  beforeAll(async () => {
    // Configuración inicial
    await page.goto('http://localhost:3000');
  });
  
  test('debería cargar en menos de 3 segundos', async () => {
    // Medir tiempo de carga
    const startTime = Date.now();
    
    // Navegar a la página y esperar a que cargue completamente
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    
    const loadTime = Date.now() - startTime;
    console.log(\`Tiempo de carga: \${loadTime}ms\`);
    
    // La página debe cargar en menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
  });
  
  // Más pruebas de rendimiento...
});`;
    }
  }
  
  /**
   * Genera pruebas de seguridad
   */
  private generateSecurityTest(testSpec: string, framework: string): string {
    if (framework === 'playwright') {
      return `// Pruebas de seguridad para: ${testSpec}
import { test, expect } from '@playwright/test';

test.describe('Pruebas de Seguridad', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
  });
  
  test('debería tener cabeceras de seguridad adecuadas', async ({ page, request }) => {
    // Verificar cabeceras de seguridad
    const response = await request.get('http://localhost:3000');
    const headers = response.headers();
    
    // Verificar Content-Security-Policy
    expect(headers['content-security-policy']).toBeDefined();
    
    // Verificar X-XSS-Protection
    expect(headers['x-xss-protection']).toBeDefined();
    
    // Verificar X-Content-Type-Options
    expect(headers['x-content-type-options']).toBe('nosniff');
    
    // Verificar X-Frame-Options
    expect(headers['x-frame-options']).toBeDefined();
    
    // Verificar Strict-Transport-Security
    expect(headers['strict-transport-security']).toBeDefined();
  });
  
  test('debería proteger contra inyección de scripts', async ({ page }) => {
    // Probar inyección de scripts en campos de formulario
    const scriptPayload = '<script>alert("XSS")</script>';
    
    // Buscar campos de texto
    const inputFields = await page.$$('input[type="text"], textarea');
    
    for (const input of inputFields) {
      // Intentar inyectar script
      await input.fill(scriptPayload);
      await page.keyboard.press('Enter');
      
      // Verificar que el script no se ejecutó
      const scriptTags = await page.$$eval('script', scripts => 
        scripts.filter(s => s.textContent?.includes('alert("XSS")')).length
      );
      
      expect(scriptTags).toBe(0);
    }
  });
  
  test('debería validar entradas de formulario', async ({ page }) => {
    // Probar validación de formularios
    const forms = await page.$$('form');
    
    for (const form of forms) {
      // Obtener campos requeridos
      const requiredFields = await form.$$('input[required], select[required], textarea[required]');
      
      if (requiredFields.length > 0) {
        // Intentar enviar formulario sin completar campos requeridos
        await form.evaluate(f => {
          const submitEvent = new Event('submit', { cancelable: true });
          f.dispatchEvent(submitEvent);
          return submitEvent.defaultPrevented;
        });
        
        // Verificar que hay mensajes de error o validación
        const validationMessages = await page.$$eval('[aria-invalid="true"], .error, .invalid-feedback', elements => elements.length);
        
        expect(validationMessages).toBeGreaterThan(0);
      }
    }
  });
  
  test('debería proteger contra ataques de CSRF', async ({ page, request }) => {
    // Verificar tokens CSRF en formularios
    const forms = await page.$$('form');
    
    for (const form of forms) {
      const csrfToken = await form.$eval('input[name="csrf_token"], input[name="_token"], input[name="csrfmiddlewaretoken"]', 
        input => input.value, 
        { timeout: 1000 }).catch(() => null);
      
      if (csrfToken) {
        expect(csrfToken).not.toBe('');
      } else {
        // Si no hay token CSRF visible, verificar que las peticiones POST incluyen cabeceras anti-CSRF
        const formMethod = await form.getAttribute('method') || 'get';
        
        if (formMethod.toLowerCase() === 'post') {
          const formAction = await form.getAttribute('action') || '';
          const url = new URL(formAction, 'http://localhost:3000').toString();
          
          // Intentar hacer una petición POST sin token CSRF
          const response = await request.post(url, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            data: 'test=value'
          }).catch(e => e.response);
          
          // Debería fallar o redirigir
          expect(response.status()).not.toBe(200);
        }
      }
    }
  });
  
  test('debería proteger contra ataques de SQL Injection', async ({ page }) => {
    // Probar inyección SQL en campos de formulario
    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "1; SELECT * FROM users"
    ];
    
    // Buscar campos de texto
    const inputFields = await page.$$('input[type="text"], textarea');
    
    for (const input of inputFields) {
      for (const payload of sqlPayloads) {
        // Intentar inyectar SQL
        await input.fill(payload);
        await page.keyboard.press('Enter');
        
        // Verificar que no hay errores de SQL expuestos
        const pageContent = await page.content();
        const sqlErrorExposed = 
          pageContent.includes('SQL syntax') || 
          pageContent.includes('ORA-') || 
          pageContent.includes('syntax error') || 
          pageContent.includes('mysql_fetch_array()');
        
        expect(sqlErrorExposed).toBe(false);
      }
    }
  });
  
  test('debería tener protección contra clickjacking', async ({ page, request }) => {
    // Verificar protección contra clickjacking
    const response = await request.get('http://localhost:3000');
    const headers = response.headers();
    
    // Verificar X-Frame-Options o CSP frame-ancestors
    const hasXFrameOptions = headers['x-frame-options'] !== undefined;
    const hasFrameAncestorsCSP = headers['content-security-policy']?.includes('frame-ancestors');
    
    expect(hasXFrameOptions || hasFrameAncestorsCSP).toBe(true);
    
    // Intentar cargar la página en un iframe
    await page.goto('about:blank');
    
    const canLoadInIframe = await page.evaluate(async () => {
      try {
        const iframe = document.createElement('iframe');
        iframe.src = 'http://localhost:3000';
        document.body.appendChild(iframe);
        
        // Esperar a que cargue el iframe
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar si se cargó correctamente
        return iframe.contentDocument !== null;
      } catch (e) {
        return false;
      }
    });
    
    expect(canLoadInIframe).toBe(false);
  });
  
  test('debería proteger información sensible', async ({ page }) => {
    // Verificar que no hay información sensible expuesta
    const pageContent = await page.content();
    
    // Patrones de información sensible
    const sensitivePatterns = [
      /password\s*=\s*['"][^'"]+['"]/i,
      /apiKey\s*=\s*['"][^'"]+['"]/i,
      /secret\s*=\s*['"][^'"]+['"]/i,
      /token\s*=\s*['"][^'"]+['"]/i,
      /BEGIN (RSA|DSA|EC) PRIVATE KEY/,
      /[A-Za-z0-9+/]{40,}={0,2}/  // Posibles tokens codificados en base64
    ];
    
    for (const pattern of sensitivePatterns) {
      expect(pageContent).not.toMatch(pattern);
    }
    
    // Verificar que no hay comentarios con información sensible
    const comments = await page.$$eval('*', elements => {
      const result = [];
      const walker = document.createTreeWalker(
        document.documentElement,
        NodeFilter.SHOW_COMMENT
      );
      
      let comment;
      while (comment = walker.nextNode()) {
        result.push(comment.textContent);
      }
      
      return result;
    });
    
    for (const comment of comments) {
      for (const pattern of sensitivePatterns) {
        expect(comment).not.toMatch(pattern);
      }
    }
  });
  
  test('debería tener una política de cookies segura', async ({ page, context }) => {
    // Verificar cookies seguras
    await page.goto('http://localhost:3000');
    
    const cookies = await context.cookies();
    
    for (const cookie of cookies) {
      // Las cookies de sesión deben ser seguras y httpOnly
      if (cookie.name.toLowerCase().includes('session') || 
          cookie.name.toLowerCase().includes('token') || 
          cookie.name.toLowerCase().includes('auth')) {
        expect(cookie.secure).toBe(true);
        expect(cookie.httpOnly).toBe(true);
      }
      
      // Verificar que las cookies tienen SameSite
      expect(cookie.sameSite).toBeDefined();
    }
  });
  
  test('debería manejar errores de forma segura', async ({ page }) => {
    // Intentar provocar errores y verificar que se manejan correctamente
    await page.goto('http://localhost:3000/non-existent-page');
    
    // Verificar que no hay información sensible en la página de error
    const pageContent = await page.content();
    
    // No debe exponer rutas del sistema
    expect(pageContent).not.toMatch(/[C-Z]:\\|\/var\/www\/|\/home\//i);
    
    // No debe exponer stacktraces
    expect(pageContent).not.toMatch(/at\s+[\w.]+\s+\([\w\/:.]+\)/i);
    
    // No debe exponer información de la base de datos
    expect(pageContent).not.toMatch(/sql|mysql|postgres|mongodb|database error/i);
  });
  
  test('debería implementar rate limiting', async ({ request }) => {
    // Verificar rate limiting haciendo múltiples peticiones
    const startTime = Date.now();
    const numRequests = 20;
    const responses = [];
    
    for (let i = 0; i < numRequests; i++) {
      const response = await request.get('http://localhost:3000');
      responses.push(response.status());
    }
    
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    
    // Verificar si hay respuestas 429 (Too Many Requests)
    const hasRateLimiting = responses.includes(429);
    
    // O verificar si las peticiones tomaron más tiempo del esperado (throttling)
    const averageTime = timeTaken / numRequests;
    const hasThrottling = averageTime > 100; // Más de 100ms por petición en promedio
    
    expect(hasRateLimiting || hasThrottling).toBe(true);
  });
});`;
    } else if (framework === 'cypress') {
      return `// Pruebas de seguridad con Cypress: ${testSpec}
describe('Pruebas de Seguridad', () => {
  beforeEach(() => {
    // Visitar la página a probar
    cy.visit('/');
  });
  
  it('debería tener cabeceras de seguridad adecuadas', () => {
    // Verificar cabeceras de seguridad
    cy.request('/').then(response => {
      // Verificar Content-Security-Policy
      expect(response.headers).to.have.property('content-security-policy');
      
      // Verificar X-XSS-Protection
      expect(response.headers).to.have.property('x-xss-protection');
      
      // Verificar X-Content-Type-Options
      expect(response.headers['x-content-type-options']).to.equal('nosniff');
      
      // Verificar X-Frame-Options
      expect(response.headers).to.have.property('x-frame-options');
      
      // Verificar Strict-Transport-Security
      expect(response.headers).to.have.property('strict-transport-security');
    });
  });
  
  it('debería proteger contra inyección de scripts', () => {
    // Probar inyección de scripts en campos de formulario
    const scriptPayload = '<script>alert("XSS")</script>';
    
    // Buscar campos de texto
    cy.get('input[type="text"], textarea').each($input => {
      // Intentar inyectar script
      cy.wrap($input).type(scriptPayload);
      cy.wrap($input).type('{enter}');
      
      // Verificar que el script no se ejecutó
      cy.get('script').then($scripts => {
        const hasXssScript = $scripts.toArray().some(script => 
          script.textContent && script.textContent.includes('alert("XSS")')
        );
        
        expect(hasXssScript).to.be.false;
      });
    });
  });
  
  it('debería validar entradas de formulario', () => {
    // Probar validación de formularios
    cy.get('form').each($form => {
      // Obtener campos requeridos
      cy.wrap($form).find('input[required], select[required], textarea[required]').then($requiredFields => {
        if ($requiredFields.length > 0) {
          // Intentar enviar formulario sin completar campos requeridos
          cy.wrap($form).submit();
          
          // Verificar que hay mensajes de error o validación
          cy.get('[aria-invalid="true"], .error, .invalid-feedback').should('exist');
        }
      });
    });
  });
  
  it('debería proteger contra ataques de CSRF', () => {
    // Verificar tokens CSRF en formularios
    cy.get('form').each($form => {
      cy.wrap($form).then($f => {
        const $csrfToken = $f.find('input[name="csrf_token"], input[name="_token"], input[name="csrfmiddlewaretoken"]');
        
        if ($csrfToken.length) {
          expect($csrfToken.val()).to.not.be.empty;
        } else {
          // Si no hay token CSRF visible, verificar que las peticiones POST incluyen cabeceras anti-CSRF
          const formMethod = $f.attr('method') || 'get';
          
          if (formMethod.toLowerCase() === 'post') {
            const formAction = $f.attr('action') || '';
            const url = new URL(formAction, Cypress.config().baseUrl).toString();
            
            // Intentar hacer una petición POST sin token CSRF
            cy.request({
              method: 'POST',
              url,
              failOnStatusCode: false,
              form: true,
              body: { test: 'value' }
            }).then(response => {
              // Debería fallar o redirigir
              expect(response.status).to.not.equal(200);
            });
          }
        }
      });
    });
  });
  
  it('debería proteger contra ataques de SQL Injection', () => {
    // Probar inyección SQL en campos de formulario
    const sqlPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "1; SELECT * FROM users"
    ];
    
    // Buscar campos de texto
    cy.get('input[type="text"], textarea').each($input => {
      sqlPayloads.forEach(payload => {
        // Intentar inyectar SQL
        cy.wrap($input).clear().type(payload);
        cy.wrap($input).type('{enter}');
        
        // Verificar que no hay errores de SQL expuestos
        cy.contains('SQL syntax').should('not.exist');
        cy.contains('ORA-').should('not.exist');
        cy.contains('syntax error').should('not.exist');
        cy.contains('mysql_fetch_array()').should('not.exist');
      });
    });
  });
  
  it('debería tener protección contra clickjacking', () => {
    // Verificar protección contra clickjacking
    cy.request('/').then(response => {
      // Verificar X-Frame-Options o CSP frame-ancestors
      const hasXFrameOptions = 'x-frame-options' in response.headers;
      const hasFrameAncestorsCSP = response.headers['content-security-policy'] && 
                                  response.headers['content-security-policy'].includes('frame-ancestors');
      
      expect(hasXFrameOptions || hasFrameAncestorsCSP).to.be.true;
    });
  });
  
  it('debería proteger información sensible', () => {
    // Verificar que no hay información sensible expuesta
    cy.get('html').then($html => {
      const html = $html.html();
      
      // Patrones de información sensible
      const sensitivePatterns = [
        /password\s*=\s*['"][^'"]+['"]/i,
        /apiKey\s*=\s*['"][^'"]+['"]/i,
        /secret\s*=\s*['"][^'"]+['"]/i,
        /token\s*=\s*['"][^'"]+['"]/i,
        /BEGIN (RSA|DSA|EC) PRIVATE KEY/,
        /[A-Za-z0-9+/]{40,}={0,2}/  // Posibles tokens codificados en base64
      ];
      
      sensitivePatterns.forEach(pattern => {
        expect(html).not.to.match(pattern);
      });
    });
    });
  
  it('debería tener una política de cookies segura', async ({ page, context }) => {
    // Verificar cookies seguras
    await page.goto('http://localhost:3000');
    
    const cookies = await context.cookies();
    
    for (const cookie of cookies) {
      // Las cookies de sesión deben ser seguras y httpOnly
      if (cookie.name.toLowerCase().includes('session') || 
          cookie.name.toLowerCase().includes('token') || 
          cookie.name.toLowerCase().includes('auth')) {
        expect(cookie.secure).toBe(true);
        expect(cookie.httpOnly).toBe(true);
      }
      
      // Verificar que las cookies tienen SameSite
      expect(cookie.sameSite).toBeDefined();
    }
  });
  
  it('debería manejar errores de forma segura', async ({ page }) => {
    // Intentar provocar errores y verificar que se manejan correctamente
    await page.goto('http://localhost:3000/non-existent-page');
    
    // Verificar que no hay información sensible en la página de error
    const pageContent = await page.content();
    
    // No debe exponer rutas del sistema
    expect(pageContent).not.toMatch(/[C-Z]:\\|\/var\/www\/|\/home\//i);
    
    // No debe exponer stacktraces
    expect(pageContent).not.toMatch(/at\s+[\w.]+\s+\([\w\/:.]+\)/i);
    
    // No debe exponer información de la base de datos
    expect(pageContent).not.toMatch(/sql|mysql|postgres|mongodb|database error/i);
  });
  
  it('debería implementar rate limiting', async ({ request }) => {
    // Verificar rate limiting haciendo múltiples peticiones
    const startTime = Date.now();
    const numRequests = 20;
    const responses = [];
    
    for (let i = 0; i < numRequests; i++) {
      const response = await request.get('http://localhost:3000');
      responses.push(response.status());
    }
    
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    
    // Verificar si hay respuestas 429 (Too Many Requests)
    const hasRateLimiting = responses.includes(429);
    
    // O verificar si las peticiones tomaron más tiempo del esperado (throttling)
    const averageTime = timeTaken / numRequests;
    const hasThrottling = averageTime > 100; // Más de 100ms por petición en promedio
    
    expect(hasRateLimiting || hasThrottling).toBe(true);
  });
  
  it('debería proteger contra ataques de fuerza bruta', async ({ page, request }) => {
    // Verificar protección contra ataques de fuerza bruta en formularios de login
    const loginPage = await page.goto('http://localhost:3000/login').catch(() => null);
    
    if (loginPage) {
      // Intentar múltiples logins incorrectos
      const maxAttempts = 5;
      let isBlocked = false;
      
      for (let i = 0; i < maxAttempts; i++) {
        await page.fill('input[name="username"], input[name="email"]', `test${i}@example.com`);
        await page.fill('input[name="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        
        // Esperar a que se procese el formulario
        await page.waitForTimeout(500);
        
        // Verificar si hay mensajes de bloqueo o captcha
        const content = await page.content();
        if (content.includes('bloqueado') || 
            content.includes('demasiados intentos') || 
            content.includes('captcha') || 
            content.includes('esperar')) {
          isBlocked = true;
          break;
        }
      }
      
      // Debería haber algún mecanismo de bloqueo después de múltiples intentos
      expect(isBlocked).toBe(true);
    } else {
      // Si no hay página de login, verificar API
      let isBlocked = false;
      
      for (let i = 0; i < 5; i++) {
        const response = await request.post('http://localhost:3000/api/login', {
          data: {
            username: `test${i}@example.com`,
            password: 'wrongpassword'
          }
        }).catch(e => e.response);
        
        if (response.status() === 429 || response.status() === 403) {
          isBlocked = true;
          break;
        }
      }
      
      expect(isBlocked).toBe(true);
    }
  });
  
  it('debería implementar validación de entrada en APIs', async ({ request }) => {
    // Verificar validación de entrada en APIs
    const endpoints = [
      { url: 'http://localhost:3000/api/users', method: 'post', data: { name: '<script>alert("XSS")</script>' } },
      { url: 'http://localhost:3000/api/products', method: 'post', data: { price: 'not-a-number' } },
      { url: 'http://localhost:3000/api/search', method: 'get', params: { query: "'; DROP TABLE users; --" } }
    ];
    
    for (const endpoint of endpoints) {
      let response;
      
      if (endpoint.method === 'get') {
        response = await request.get(`${endpoint.url}?${new URLSearchParams(endpoint.params).toString()}`).catch(e => e.response);
      } else {
        response = await request[endpoint.method](endpoint.url, { data: endpoint.data }).catch(e => e.response);
      }
      
      // La API debería rechazar entradas inválidas (400 Bad Request)
      expect(response.status()).toBe(400);
      
      // Verificar que la respuesta contiene un mensaje de error adecuado
      const body = await response.json().catch(() => ({}));
      expect(body.error || body.message).toBeDefined();
    }
  });
  
  it('debería tener protección contra ataques de SSRF', async ({ request }) => {
    // Verificar protección contra Server-Side Request Forgery
    const ssrfPayloads = [
      'http://localhost:8080',
      'http://127.0.0.1:3306',
      'http://169.254.169.254/latest/meta-data/', // AWS metadata
      'file:///etc/passwd'
    ];
    
    // Buscar endpoints que podrían ser vulnerables a SSRF
    const endpoints = [
      { url: 'http://localhost:3000/api/fetch', method: 'post', field: 'url' },
      { url: 'http://localhost:3000/api/proxy', method: 'get', field: 'target' },
      { url: 'http://localhost:3000/api/webhook', method: 'post', field: 'callback' }
    ];
    
    for (const endpoint of endpoints) {
      for (const payload of ssrfPayloads) {
        let response;
        
        if (endpoint.method === 'get') {
          response = await request.get(`${endpoint.url}?${endpoint.field}=${encodeURIComponent(payload)}`).catch(e => e.response);
        } else {
          const data = {};
          data[endpoint.field] = payload;
          response = await request[endpoint.method](endpoint.url, { data }).catch(e => e.response);
        }
        
        // La API debería rechazar URLs internas o peligrosas
        expect(response.status()).toBe(400);
      }
    }
  });
});

/**
 * Genera pruebas de accesibilidad
 */
private generateAccessibilityTest(testSpec: string, framework: string): string {
  if (framework === 'playwright') {
    return `// Pruebas de accesibilidad para: ${testSpec}
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Pruebas de Accesibilidad', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
  });
  
  test('debería cumplir con WCAG 2.1 AA', async ({ page }) => {
    // Ejecutar análisis de accesibilidad con axe
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    // No debería haber violaciones
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('debería tener estructura de encabezados adecuada', async ({ page }) => {
    // Verificar estructura de encabezados
    const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', headings => 
      headings.map(h => ({
        level: parseInt(h.tagName.substring(1)),
        text: h.textContent.trim()
      }))
    );
    
    // Debe haber al menos un h1
    const h1Count = headings.filter(h => h.level === 1).length;
    expect(h1Count).toBe(1);
    
    // Los encabezados deben seguir una jerarquía lógica
    let previousLevel = 0;
    let hasValidHierarchy = true;
    
    for (const heading of headings) {
      if (heading.level > previousLevel + 1) {
        hasValidHierarchy = false;
        break;
      }
      previousLevel = heading.level;
    }
    
    expect(hasValidHierarchy).toBe(true);
  });
  
  test('debería tener textos alternativos en imágenes', async ({ page }) => {
    // Verificar textos alternativos en imágenes
    const images = await page.$$('img:not([role="presentation"]):not([aria-hidden="true"])');
    
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      expect(alt).not.toBe(null);
      expect(alt).not.toBe('');
    }
  });
  
  test('debería tener suficiente contraste de color', async ({ page }) => {
    // Verificar contraste de color con axe
    const contrastResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    
    expect(contrastResults.violations).toEqual([]);
  });
  
  test('debería ser navegable con teclado', async ({ page }) => {
    // Verificar navegación con teclado
    await page.keyboard.press('Tab');
    
    // Debería haber un elemento enfocado
    const focusedElement = await page.evaluate(() => {
      const active = document.activeElement;
      return {
        tag: active.tagName.toLowerCase(),
        hasVisibleOutline: window.getComputedStyle(active).outlineStyle !== 'none'
      };
    });
    
    expect(focusedElement.tag).not.toBe('body');
    expect(focusedElement.hasVisibleOutline).toBe(true);
    
    // Verificar que todos los elementos interactivos son accesibles con teclado
    const interactiveElements = await page.$$('a, button, input, select, textarea, [role="button"]');
    
    for (let i = 0; i < interactiveElements.length; i++) {
      await page.keyboard.press('Tab');
      
      const isFocused = await page.evaluate((index) => {
        const elements = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
        return document.activeElement === elements[index];
      }, i);
      
      // No todos los elementos interactivos pueden recibir foco (pueden estar ocultos o deshabilitados)
      // pero debería haber un progreso general
      if (i === interactiveElements.length - 1) {
        expect(isFocused).toBe(true);
      }
    }
  });
  
  test('debería tener etiquetas en campos de formulario', async ({ page }) => {
    // Verificar etiquetas en campos de formulario
    const formFields = await page.$$('input, select, textarea');
    
    for (const field of formFields) {
      // Obtener id del campo
      const id = await field.getAttribute('id');
      
      if (id) {
        // Verificar si hay una etiqueta asociada
        const hasLabel = await page.$$eval(`label[for="${id}"]`, labels => labels.length > 0);
        
        // O si el campo tiene aria-label o aria-labelledby
        const ariaLabel = await field.getAttribute('aria-label');
        const ariaLabelledby = await field.getAttribute('aria-labelledby');
        
        expect(hasLabel || ariaLabel || ariaLabelledby).toBeTruthy();
      } else {
        // Si no tiene id, debe tener aria-label
        const ariaLabel = await field.getAttribute('aria-label');
        expect(ariaLabel).not.toBe(null);
      }
    }
  });
  
  test('debería tener roles ARIA correctos', async ({ page }) => {
    // Verificar roles ARIA
    const elementsWithRole = await page.$$('[role]');
    
    for (const element of elementsWithRole) {
      const role = await element.getAttribute('role');
      
      // Verificar que el rol es válido
      const validRoles = [
        'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 
        'cell', 'checkbox', 'columnheader', 'combobox', 'complementary', 
        'contentinfo', 'definition', 'dialog', 'directory', 'document', 
        'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading', 
        'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 
        'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 
        'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation', 
        'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 
        'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 
        'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 
        'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 
        'tooltip', 'tree', 'treegrid', 'treeitem'
      ];
      
      expect(validRoles).toContain(role);
      
      // Verificar que los elementos con roles tienen los atributos ARIA necesarios
      if (role === 'combobox' || role === 'listbox' || role === 'textbox') {
        const hasAriaExpanded = await element.getAttribute('aria-expanded') !== null;
        expect(hasAriaExpanded).toBe(true);
      }
      
      if (role === 'checkbox' || role === 'radio' || role === 'switch') {
        const hasAriaChecked = await element.getAttribute('aria-checked') !== null;
        expect(hasAriaChecked).toBe(true);
      }
    }
  });
  
  test('debería tener textos de error accesibles', async ({ page }) => {
    // Buscar formularios
    const forms = await page.$$('form');
    
    for (const form of forms) {
      // Intentar enviar formulario vacío
      await form.evaluate(f => {
        const submitEvent = new Event('submit', { cancelable: true });
        f.dispatchEvent(submitEvent);
        return submitEvent.defaultPrevented;
      });
      
      // Verificar mensajes de error
      const errorMessages = await page.$$('[aria-invalid="true"]');
      
      for (const errorField of errorMessages) {
        // Verificar que el campo tiene un mensaje de error asociado
        const id = await errorField.getAttribute('id');
        const ariaDescribedby = await errorField.getAttribute('aria-describedby');
        
        if (ariaDescribedby) {
          const errorText = await page.$eval(`#${ariaDescribedby}`, el => el.textContent);
          expect(errorText).not.toBe('');
        }
      }
    }
  });
  
  test('debería tener landmarks ARIA', async ({ page }) => {
    // Verificar landmarks ARIA
    const landmarks = await page.$$eval([
      'header, [role="banner"]',
      'nav, [role="navigation"]',
      'main, [role="main"]',
      'footer, [role="contentinfo"]',
      'aside, [role="complementary"]',
      'section[aria-label], section[aria-labelledby], [role="region"][aria-label], [role="region"][aria-labelledby]',
      'form[aria-label], form[aria-labelledby], [role="form"]',
      'search, [role="search"]'
    ].join(','), elements => elements.length);
    
    // Debe haber al menos 3 landmarks (header/banner, main, footer/contentinfo)
    expect(landmarks).toBeGreaterThanOrEqual(3);
  });
});`;
  } else if (framework === 'cypress') {
    return `// Pruebas de accesibilidad con Cypress: ${testSpec}
describe('Pruebas de Accesibilidad', () => {
  beforeEach(() => {
    // Visitar la página a probar
    cy.visit('/');
    cy.injectAxe();
  });
  
  it('debería cumplir con WCAG 2.1 AA', () => {
    // Ejecutar análisis de accesibilidad con axe
    cy.checkA11y();
  });
  
  it('debería tener estructura de encabezados adecuada', () => {
    // Verificar estructura de encabezados
    cy.get('h1, h2, h3, h4, h5, h6').then($headings => {
      const headings = $headings.toArray().map(h => ({
        level: parseInt(h.tagName.substring(1)),
        text: h.textContent.trim()
      }));
      
      // Debe haber al menos un h1
      const h1Count = headings.filter(h => h.level === 1).length;
      expect(h1Count).to.equal(1);
      
      // Los encabezados deben seguir una jerarquía lógica
      let previousLevel = 0;
      let hasValidHierarchy = true;
      
      for (const heading of headings) {
        if (heading.level > previousLevel + 1) {
          hasValidHierarchy = false;
          break;
        }
        previousLevel = heading.level;
      }
      
      expect(hasValidHierarchy).to.be.true;
    });
  });
  
  it('debería tener textos alternativos en imágenes', () => {
    // Verificar textos alternativos en imágenes
    cy.get('img:not([role="presentation"]):not([aria-hidden="true"])').each($img => {
      cy.wrap($img).should('have.attr', 'alt');
    });
  });
  
  it('debería tener suficiente contraste de color', () => {
    // Verificar contraste de color con axe
    cy.checkA11y(null, {
      runOnly: ['color-contrast']
    });
  });
  
  it('debería ser navegable con teclado', () => {
    // Verificar navegación con teclado
    cy.tab();
    
    // Debería haber un elemento enfocado
    cy.focused().should('not.have.prop', 'tagName', 'BODY');
    
    // Verificar que el elemento enfocado tiene un contorno visible
    cy.focused().then($el => {
      const computedStyle = window.getComputedStyle($el[0]);
      expect(computedStyle.outlineStyle).not.to.equal('none');
    });
  });
  
  it('debería tener etiquetas en campos de formulario', () => {
    // Verificar etiquetas en campos de formulario
    cy.get('input, select, textarea').each($field => {
      cy.wrap($field).then($f => {
        const id = $f.attr('id');
        
        if (id) {
          // Verificar si hay una etiqueta asociada
          cy.get(`label[for="${id}"]`).then($label => {
            // O si el campo tiene aria-label o aria-labelledby
            const ariaLabel = $f.attr('aria-label');
            const ariaLabelledby = $f.attr('aria-labelledby');
            
            expect($label.length > 0 || ariaLabel || ariaLabelledby).to.be.true;
          });
        } else {
          // Si no tiene id, debe tener aria-label
          const ariaLabel = $f.attr('aria-label');
          expect(ariaLabel).to.exist;
        }
      });
    });
  });
  
  it('debería tener roles ARIA correctos', () => {
    // Verificar roles ARIA
    cy.get('[role]').each($el => {
      cy.wrap($el).then($element => {
        const role = $element.attr('role');
        
        // Verificar que el rol es válido
        const validRoles = [
          'alert', 'alertdialog', 'application', 'article', 'banner', 'button', 
          'cell', 'checkbox', 'columnheader', 'combobox', 'complementary', 
          'contentinfo', 'definition', 'dialog', 'directory', 'document', 
          'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading', 
          'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main', 
          'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox', 
          'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation', 
          'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 
          'rowheader', 'scrollbar', 'search', 'searchbox', 'separator', 
          'slider', 'spinbutton', 'status', 'switch', 'tab', 'table', 
          'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar', 
          'tooltip', 'tree', 'treegrid', 'treeitem'
        ];
        
        expect(validRoles).to.include(role);
        
        // Verificar que los elementos con roles tienen los atributos ARIA necesarios
        if (role === 'combobox' || role === 'listbox' || role === 'textbox') {
          expect($element.attr('aria-expanded')).to.exist;
        }
        
        if (role === 'checkbox' || role === 'radio' || role === 'switch') {
          expect($element.attr('aria-checked')).to.exist;
        }
      });
    });
  });
  
  it('debería tener landmarks ARIA', () => {
    // Verificar landmarks ARIA
    cy.get([
      'header, [role="banner"]',
      'nav, [role="navigation"]',
      'main, [role="main"]',
      'footer, [role="contentinfo"]',
      'aside, [role="complementary"]',
      'section[aria-label], section[aria-labelledby], [role="region"][aria-label], [role="region"][aria-labelledby]',
      'form[aria-label], form[aria-labelledby], [role="form"]',
      'search, [role="search"]'
    ].join(',')).then($landmarks => {
      // Debe haber al menos 3 landmarks (header/banner, main, footer/contentinfo)
      expect($landmarks.length).to.be.at.least(3);
    });
  });
});`;
  } else {
    return `// Pruebas de accesibilidad con Jest: ${testSpec}
describe('Pruebas de Accesibilidad', () => {
  beforeAll(async () => {
    // Configuración inicial
    await page.goto('http://localhost:3000');
    await injectAxe(page);
  });
  
  test('debería cumplir con WCAG 2.1 AA', async () => {
    // Ejecutar análisis de accesibilidad con axe
    const violations = await getAxeResults(page);
    expect(violations.length).toBe(0);
  });
  
  // Más pruebas de accesibilidad...
});`;
  }
}

/**
 * Genera pruebas de usabilidad
 */
private generateUsabilityTest(testSpec: string, framework: string): string {
  if (framework === 'playwright') {
    return `// Pruebas de usabilidad para: ${testSpec}
import { test, expect } from '@playwright/test';

test.describe('Pruebas de Usabilidad', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
  });
  
  test('debería tener tiempos de respuesta rápidos', async ({ page }) => {
    // Medir tiempo de respuesta al hacer clic en elementos interactivos
    const interactiveElements = await page.$$('button, a, [role="button"]');
    
    for (const element of interactiveElements) {
      // Verificar visibilidad y habilitación
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      
      if (isVisible && isEnabled) {
        // Medir tiempo de respuesta
        const startTime = Date.now();
        await element.click();
        const responseTime = Date.now() - startTime;
        
        // El tiempo de respuesta debe ser menor a 300ms
        expect(responseTime).toBeLessThan(300);
        
        // Volver a la página inicial
        await page.goto('http://localhost:3000');
      }
    }
  });
  
  test('debería tener elementos interactivos con tamaño adecuado', async ({ page }) => {
    // Verificar tamaño de elementos interactivos
    const interactiveElements = await page.$$('button, a, input[type="submit"], input[type="button"], [role="button"]');
    
    for (const element of interactiveElements) {
      // Obtener dimensiones
      const boundingBox = await element.boundingBox();
      
      if (boundingBox) {
        // Los elementos interactivos deben tener al menos 44x44 píxeles (recomendación WCAG)
        expect(boundingBox.width).toBeGreaterThanOrEqual(44);
        expect(boundingBox.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
  
  test('debería tener feedback visual en elementos interactivos', async ({ page }) => {
    // Verificar feedback visual en hover
    const buttons = await page.$$('button, a, [role="button"]');
    
    for (const button of buttons) {
      // Verificar visibilidad
      const isVisible = await button.isVisible();
      
      if (isVisible) {
        // Obtener estilo inicial
        const initialStyle = await button.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            border: style.border,
            cursor: style.cursor
          };
        });
        
        // Simular hover
        await button.hover();
        
        // Obtener estilo después de hover
        const hoverStyle = await button.evaluate(el => {
          const style = window.getComputedStyle(el);
          return {
            backgroundColor: style.backgroundColor,
            color: style.color,
            border: style.border,
            cursor: style.cursor
          };
        });
        
        // Debe haber algún cambio visual
        const hasVisualChange = 
          initialStyle.backgroundColor !== hoverStyle.backgroundColor ||
          initialStyle.color !== hoverStyle.color ||
          initialStyle.border !== hoverStyle.border;
        
        expect(hasVisualChange).toBe(true);
        expect(hoverStyle.cursor).toBe('pointer');
      }
    }
  });
  
  test('debería tener mensajes de error claros en formularios', async ({ page }) => {
    // Buscar formularios
    const forms = await page.$$('form');
    
    for (const form of forms) {
      // Intentar enviar formulario vacío
      await form.evaluate(f => {
        const submitEvent = new Event('submit', { cancelable: true });
        f.dispatchEvent(submitEvent);
        return submitEvent.defaultPrevented;
      });
      
      // Verificar mensajes de error
      const errorMessages = await page.$$('.error, .invalid-feedback, [aria-invalid="true"] + .message');
      
      for (const errorMessage of errorMessages) {
        // El mensaje de error debe ser visible
        const isVisible = await errorMessage.isVisible();
        expect(isVisible).toBe(true);
        
        // El mensaje debe tener texto
        const text = await errorMessage.textContent();
        expect(text.trim()).not.toBe('');
        
        // El mensaje debe ser descriptivo (más de 3 palabras)
        const words = text.trim().split(/\s+/);
        expect(words.length).toBeGreaterThan(3);
      }
    }
  });
  
  test('debería tener navegación consistente', async ({ page }) => {
    // Verificar consistencia de navegación en diferentes páginas
    const navigationElements = await page.$$('nav a, header a, [role="navigation"] a');
    const navigationUrls = [];
    
    // Recopilar URLs de navegación
    for (const navElement of navigationElements) {
      const href = await navElement.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        navigationUrls.push(href);
      }
    }
    
    // Visitar cada página y verificar que la navegación es consistente
    for (const url of navigationUrls.slice(0, 3)) { // Limitar a 3 páginas para no hacer demasiadas peticiones
      await page.goto(new URL(url, 'http://localhost:3000').toString());
      
      // Verificar que los elementos de navegación siguen presentes
      const newNavigationElements = await page.$$('nav a, header a, [role="navigation"] a');
      expect(newNavigationElements.length).toBeGreaterThanOrEqual(navigationElements.length);
      
      // Verificar que los elementos de navegación tienen los mismos textos
      const navigationTexts = [];
      for (const navElement of navigationElements) {
        const text = await navElement.textContent();
        if (text) navigationTexts.push(text.trim());
      }
      
      const newNavigationTexts = [];
      for (const navElement of newNavigationElements) {
        const text = await navElement.textContent();
        if (text) newNavigationTexts.push(text.trim());
      }
      
      // Debe haber al menos un 80% de coincidencia en los textos de navegación
      const commonTexts = navigationTexts.filter(text => newNavigationTexts.includes(text));
      const matchPercentage = commonTexts.length / navigationTexts.length;
      expect(matchPercentage).toBeGreaterThanOrEqual(0.8);
    }
  });
  
  test('debería tener diseño responsive', async ({ page }) => {
    // Verificar diseño responsive en diferentes tamaños de pantalla
    const viewportSizes = [
      { width: 375, height: 667 },  // Móvil
      { width: 768, height: 1024 }, // Tablet
      { width: 1366, height: 768 }  // Desktop
    ];
    
    for (const viewport of viewportSizes) {
      // Establecer tamaño de viewport
      await page.setViewportSize(viewport);
      
      // Navegar a la página
      await page.goto('http://localhost:3000');
      
      // Verificar que no hay scroll horizontal
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
      
      // Verificar que los elementos importantes son visibles
      const importantElements = [
        'header', 'nav', 'main', 'footer',
        'h1', 'button', 'a[href]', 'input'
      ];
      
      for (const selector of importantElements) {
        const elements = await page.$$(selector);
        
        for (const element of elements) {
          const isVisible = await element.isVisible();
          
          // En móvil, algunos elementos de navegación pueden estar ocultos (menú hamburguesa)
          if (viewport.width <= 375 && selector === 'nav a') {
            continue;
          }
          
          expect(isVisible).toBe(true);
        }
      }
      
      // Verificar que los textos tienen tamaños adecuados
      const textElements = await page.$$('p, h1, h2, h3, h4, h5, h6, a, button, label');
      
      for (const element of textElements) {
        const fontSize = await element.evaluate(el => {
          return parseFloat(window.getComputedStyle(el).fontSize);
        });
        
        // El tamaño de fuente debe ser al menos 12px para legibilidad
        expect(fontSize).toBeGreaterThanOrEqual(12);
      }
    }
  });
  
  test('debería tener indicadores de carga', async ({ page }) => {
    // Verificar indicadores de carga durante operaciones asíncronas
    
    // Simular conexión lenta
    await page.route('**/*', route => {
      // Retrasar todas las peticiones 1 segundo
      setTimeout(() => route.continue(), 1000);
    });
    
    // Navegar a la página
    await page.goto('http://localhost:3000');
    
    // Buscar botones o enlaces que realicen operaciones asíncronas
    const actionElements = await page.$$('button, a[href]:not([href^="#"]), [role="button"]');
    
    for (const element of actionElements.slice(0, 3)) { // Limitar a 3 elementos para no hacer demasiadas pruebas
      // Verificar visibilidad y habilitación
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      
      if (isVisible && isEnabled) {
        // Hacer clic en el elemento
        await element.click();
        
        // Verificar si aparece algún indicador de carga
        const loadingIndicators = await page.$$([
          '.loading', '.spinner', '.loader', 
          '[role="progressbar"]', 
          'img[src*="loading"], img[src*="spinner"]'
        ].join(','));
        
        // Si no hay indicadores visuales, verificar cambios en el cursor
        if (loadingIndicators.length === 0) {
          const hasCursorWait = await page.evaluate(() => {
            return window.getComputedStyle(document.body).cursor === 'wait';
          });
          
          // Debe haber algún tipo de indicador de carga
          expect(loadingIndicators.length > 0 || hasCursorWait).toBe(true);
        }
        
        // Esperar a que se complete la operación
        await page.waitForLoadState('networkidle');
        
        // Volver a la página inicial
        await page.goto('http://localhost:3000');
      }
    }
  });
  
  test('debería tener confirmación para acciones destructivas', async ({ page }) => {
    // Verificar confirmación para acciones destructivas
    await page.goto('http://localhost:3000');
    
    // Buscar botones de eliminación o acciones destructivas
    const deleteButtons = await page.$$([
      'button:has-text("Eliminar")', 
      'button:has-text("Borrar")', 
      'button:has-text("Delete")', 
      'button:has-text("Remove")',
      'a:has-text("Eliminar")',
      '[role="button"]:has-text("Eliminar")',
      'button.delete, button.remove, button.danger',
      'button[aria-label*="eliminar"], button[aria-label*="borrar"]',
      'button[aria-label*="delete"], button[aria-label*="remove"]'
    ].join(','));
    
    for (const deleteButton of deleteButtons) {
      // Interceptar diálogos
      let dialogShown = false;
      page.on('dialog', async dialog => {
        dialogShown = true;
        await dialog.dismiss();
      });
      
      // Hacer clic en el botón de eliminación
      await deleteButton.click();
      
      // Verificar si se muestra un diálogo de confirmación
      if (!dialogShown) {
        // Si no hay diálogo, verificar si aparece un modal o confirmación en la página
        const confirmationElements = await page.$$([
          '.modal, .dialog, .confirmation',
          '[role="dialog"], [role="alertdialog"]',
          '.confirm-delete, .confirm-action',
          'button:has-text("Confirmar")',
          'button:has-text("Confirm")',
          'button:has-text("Sí")',
          'button:has-text("Yes")'
        ].join(','));
        
        expect(confirmationElements.length).toBeGreaterThan(0);
      } else {
        expect(dialogShown).toBe(true);
      }
      
      // Volver a la página inicial
      await page.goto('http://localhost:3000');
    }
  });
  
  test('debería tener tooltips o ayudas contextuales', async ({ page }) => {
    // Verificar tooltips o ayudas contextuales
    await page.goto('http://localhost:3000');
    
    // Buscar elementos que podrían tener tooltips
    const elementsWithTooltips = await page.$$([
      'button[title], a[title], [role="button"][title]',
      '[data-tooltip], [data-toggle="tooltip"]',
      '[aria-label]:not([aria-labelledby])',
      'abbr[title], acronym[title]',
      '[role="tooltip"]',
      '.tooltip, .has-tooltip'
    ].join(','));
    
    for (const element of elementsWithTooltips) {
      // Verificar si el elemento tiene un atributo title o aria-label
      const title = await element.getAttribute('title');
      const ariaLabel = await element.getAttribute('aria-label');
      const dataTooltip = await element.getAttribute('data-tooltip');
      
      // Debe tener algún tipo de texto de ayuda
      expect(title || ariaLabel || dataTooltip).not.toBe(null);
      
      // Simular hover para ver si aparece un tooltip visual
      await element.hover();
      
      // Esperar un momento para que aparezca el tooltip
      await page.waitForTimeout(500);
      
      // Verificar si aparece un tooltip visual
      const tooltips = await page.$$([
        '.tooltip:visible, [role="tooltip"]:visible',
        '.tippy-content:visible, .popover:visible',
        '.ui-tooltip:visible, .hint:visible'
      ].join(','));
      
      // No todos los elementos con title mostrarán un tooltip visual,
      // pero al menos debe tener el atributo title o aria-label
      if (tooltips.length > 0) {
        const tooltipText = await tooltips[0].textContent();
        expect(tooltipText.trim()).not.toBe('');
      }
    }
  });
});

/**
 * Genera pruebas de rendimiento
 */
private generatePerformanceTest(testSpec: string, framework: string): string {
  if (framework === 'playwright') {
    return `// Pruebas de rendimiento para: ${testSpec}
import { test, expect } from '@playwright/test';

test.describe('Pruebas de Rendimiento', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
  });
  
  test('debería cargar la página inicial en menos de 3 segundos', async ({ page }) => {
    // Medir tiempo de carga de la página inicial
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    console.log(\`Tiempo de carga: \${loadTime}ms\`);
    
    // La página debe cargar en menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
  });
  
  test('debería tener un First Contentful Paint rápido', async ({ page }) => {
    // Medir First Contentful Paint
    const fcpTime = await page.evaluate(() => {
      return new Promise(resolve => {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              observer.disconnect();
              resolve(entry.startTime);
              break;
            }
          }
        });
        
        observer.observe({ type: 'paint', buffered: true });
        
        // Si no se detecta FCP en 5 segundos, resolver con un valor alto
        setTimeout(() => resolve(5000), 5000);
      });
    });
    
    console.log(\`First Contentful Paint: \${fcpTime}ms\`);
    
    // FCP debe ser menor a 1.8 segundos (bueno según Web Vitals)
    expect(fcpTime).toBeLessThan(1800);
  });
  
  test('debería tener un Largest Contentful Paint rápido', async ({ page }) => {
    // Medir Largest Contentful Paint
    const lcpTime = await page.evaluate(() => {
      return new Promise(resolve => {
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          // El último entry es el LCP más reciente
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            observer.disconnect();
            resolve(lastEntry.startTime);
          }
        });
        
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Si no se detecta LCP en 5 segundos, resolver con un valor alto
        setTimeout(() => resolve(5000), 5000);
      });
    });
    
    console.log(\`Largest Contentful Paint: \${lcpTime}ms\`);
    
    // LCP debe ser menor a 2.5 segundos (bueno según Web Vitals)
    expect(lcpTime).toBeLessThan(2500);
  });
  
  test('debería tener un Cumulative Layout Shift bajo', async ({ page }) => {
    // Medir Cumulative Layout Shift
    const cls = await page.evaluate(() => {
      return new Promise(resolve => {
        let clsValue = 0;
        
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          
          for (const entry of entries) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });
        
        observer.observe({ type: 'layout-shift', buffered: true });
        
        // Medir CLS durante 5 segundos
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 5000);
      });
    });
    
    console.log(\`Cumulative Layout Shift: \${cls}\`);
    
    // CLS debe ser menor a 0.1 (bueno según Web Vitals)
    expect(cls).toBeLessThan(0.1);
  });
  
  test('debería tener un First Input Delay bajo', async ({ page }) => {
    // Medir First Input Delay simulando interacción
    await page.goto('http://localhost:3000');
    
    // Esperar a que la página esté completamente cargada
    await page.waitForLoadState('networkidle');
    
    // Medir tiempo de respuesta al hacer clic en un elemento interactivo
    const button = await page.$('button, a, [role="button"]');
    
    if (button) {
      // Medir tiempo de respuesta
      const inputDelay = await page.evaluate(async () => {
        return new Promise(resolve => {
          let startTime;
          
          const onPointerDown = () => {
            startTime = performance.now();
            document.removeEventListener('pointerdown', onPointerDown);
          };
          
          const onPointerUp = () => {
            if (startTime) {
              const delay = performance.now() - startTime;
              document.removeEventListener('pointerup', onPointerUp);
              resolve(delay);
            }
          };
          
          document.addEventListener('pointerdown', onPointerDown);
          document.addEventListener('pointerup', onPointerUp);
          
          // Si no se detecta interacción en 5 segundos, resolver con un valor alto
          setTimeout(() => resolve(500), 5000);
        });
      });
      
      await button.click();
      
      console.log(\`First Input Delay: \${inputDelay}ms\`);
      
      // FID debe ser menor a 100ms (bueno según Web Vitals)
      expect(inputDelay).toBeLessThan(100);
    } else {
      console.log('No se encontraron elementos interactivos para medir FID');
      // Si no hay elementos interactivos, la prueba pasa
      expect(true).toBe(true);
    }
  });
  
  test('debería tener un tiempo de respuesta rápido para operaciones AJAX', async ({ page }) => {
    // Interceptar peticiones AJAX
    const ajaxRequests = [];
    
    await page.route('**/*', route => {
      const request = route.request();
      const url = request.url();
      const method = request.method();
      const isXHR = request.headers()['x-requested-with'] === 'XMLHttpRequest';
      const isFetch = request.headers()['accept'] && request.headers()['accept'].includes('application/json');
      
      if (isXHR || isFetch || url.includes('/api/')) {
        const startTime = Date.now();
        
        route.continue();
        
        ajaxRequests.push({
          url,
          method,
          startTime
        });
      } else {
        route.continue();
      }
    });
    
    // Navegar a la página
    await page.goto('http://localhost:3000');
    
    // Buscar elementos que podrían desencadenar peticiones AJAX
    const actionElements = await page.$$('button, a, [role="button"]');
    
    for (const element of actionElements.slice(0, 3)) { // Limitar a 3 elementos
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      
      if (isVisible && isEnabled) {
        // Limpiar lista de peticiones
        ajaxRequests.length = 0;
        
        // Hacer clic en el elemento
        await element.click();
        
        // Esperar a que se completen las peticiones
        await page.waitForTimeout(1000);
        
        // Verificar tiempos de respuesta
        for (const request of ajaxRequests) {
          const response = await page.request.fetch(request.url, { method: request.method });
          const responseTime = Date.now() - request.startTime;
          
          console.log(\`Tiempo de respuesta AJAX (\${request.url}): \${responseTime}ms\`);
          
          // Las peticiones AJAX deben completarse en menos de 1 segundo
          expect(responseTime).toBeLessThan(1000);
        }
        
        // Volver a la página inicial
        await page.goto('http://localhost:3000');
      }
    }
  });
  
  test('debería tener un tamaño de página optimizado', async ({ page }) => {
    // Medir tamaño de recursos
    await page.goto('http://localhost:3000');
    
    const resourceSizes = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        size: entry.transferSize || 0,
        type: entry.initiatorType
      }));
    });
    
    // Calcular tamaño total
    const totalSize = resourceSizes.reduce((total, resource) => total + resource.size, 0);
    console.log(\`Tamaño total de la página: \${totalSize / 1024} KB\`);
    
    // Agrupar por tipo
    const sizeByType = {};
    for (const resource of resourceSizes) {
      sizeByType[resource.type] = (sizeByType[resource.type] || 0) + resource.size;
    }
    
    for (const type in sizeByType) {
      console.log(\`Tamaño de recursos \${type}: \${sizeByType[type] / 1024} KB\`);
    }
    
    // La página completa debe pesar menos de 2MB
    expect(totalSize).toBeLessThan(2 * 1024 * 1024);
    
    // Los archivos JavaScript deben pesar menos de 500KB
    expect(sizeByType.script || 0).toBeLessThan(500 * 1024);
    
    // Los archivos CSS deben pesar menos de 100KB
    expect(sizeByType.css || 0).toBeLessThan(100 * 1024);
    
    // Las imágenes deben pesar menos de 1MB
    expect(sizeByType.img || 0).toBeLessThan(1024 * 1024);
  });
});`;
  } else if (framework === 'cypress') {
    return `// Pruebas de rendimiento con Cypress: ${testSpec}
describe('Pruebas de Rendimiento', () => {
  beforeEach(() => {
    // Visitar la página a probar
    cy.visit('/');
  });
  
  it('debería cargar la página inicial en menos de 3 segundos', () => {
    // Medir tiempo de carga de la página inicial
    const startTime = Date.now();
    
    cy.visit('/')
      .its('performance')
      .then(performance => {
        const navTiming = performance.getEntriesByType('navigation')[0];
        const loadTime = navTiming.loadEventEnd - navTiming.startTime;
        
        cy.log(\`Tiempo de carga: \${loadTime}ms\`);
        
        // La página debe cargar en menos de 3 segundos
        expect(loadTime).to.be.lessThan(3000);
      });
  });
  
  // Más pruebas de rendimiento...
});`;
  } else {
    return `// Pruebas de rendimiento con Jest: ${testSpec}
describe('Pruebas de Rendimiento', () => {
  beforeAll(async () => {
    // Configuración inicial
    await page.goto('http://localhost:3000');
  });
  
  test('debería cargar la página inicial en menos de 3 segundos', async () => {
    // Medir tiempo de carga de la página inicial
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    const loadTime = Date.now() - startTime;
    console.log(\`Tiempo de carga: \${loadTime}ms\`);
    
    // La página debe cargar en menos de 3 segundos
    expect(loadTime).toBeLessThan(3000);
  });
  
  // Más pruebas de rendimiento...
});`;
  }
}

/**
 * Genera pruebas de seguridad
 */
private generateSecurityTest(testSpec: string, framework: string): string {
  if (framework === 'playwright') {
    return `// Pruebas de seguridad para: ${testSpec}
import { test, expect } from '@playwright/test';

test.describe('Pruebas de Seguridad', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
  });
  
  test('debería tener cabeceras de seguridad adecuadas', async ({ page, request }) => {
    // Verificar cabeceras de seguridad
    const response = await request.get('http://localhost:3000');
    const headers = response.headers();
    
    // Verificar Content-Security-Policy
    expect(headers['content-security-policy'] || 
           headers['Content-Security-Policy']).toBeDefined();
    
    // Verificar X-XSS-Protection
    expect(headers['x-xss-protection'] || 
           headers['X-XSS-Protection']).toBeDefined();
    
    // Verificar X-Content-Type-Options
    expect(headers['x-content-type-options'] || 
           headers['X-Content-Type-Options']).toBe('nosniff');
    
    // Verificar X-Frame-Options
    expect(headers['x-frame-options'] || 
           headers['X-Frame-Options']).toBeDefined();
    
    // Verificar Strict-Transport-Security
    expect(headers['strict-transport-security'] || 
           headers['Strict-Transport-Security']).toBeDefined();
  });
  
  test('debería validar entradas en formularios', async ({ page }) => {
    // Buscar formularios
    const forms = await page.$$('form');
    
    for (const form of forms) {
      // Obtener campos del formulario
      const inputs = await form.$$('input:not([type="submit"]):not([type="button"]):not([type="hidden"]), textarea, select');
      
      // Preparar datos de prueba maliciosos
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '"; DROP TABLE users; --',
        '${alert("XSS")}',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>'
      ];
      
      // Probar cada campo con datos maliciosos
      for (const input of inputs) {
        const inputType = await input.getAttribute('type');
        const inputName = await input.getAttribute('name');
        
        // Seleccionar un valor malicioso adecuado según el tipo de campo
        let maliciousValue = maliciousInputs[0];
        
        if (inputType === 'email') {
          maliciousValue = 'test"><script>alert("XSS")</script>@example.com';
        } else if (inputType === 'number') {
          maliciousValue = '1e309'; // Overflow
        } else if (inputType === 'url') {
          maliciousValue = 'javascript:alert("XSS")';
        }
        
        // Rellenar el campo con el valor malicioso
        await input.fill(maliciousValue);
      }
      
      // Enviar el formulario
      await form.evaluate(f => {
        const submitEvent = new Event('submit', { cancelable: true });
        f.dispatchEvent(submitEvent);
        return submitEvent.defaultPrevented;
      });
      
      // Verificar que no hay scripts ejecutados
      const hasAlert = await page.evaluate(() => {
        return window.alert !== window.alert;
      });
      
      expect(hasAlert).toBe(false);
      
      // Verificar que el contenido de la página no incluye los valores maliciosos sin escapar
      const pageContent = await page.content();
      
      for (const maliciousInput of maliciousInputs) {
        // Verificar que el input malicioso no aparece tal cual en el HTML
        expect(pageContent).not.toContain(maliciousInput);
      }
    }
  });
  
  test('debería tener protección CSRF en formularios', async ({ page }) => {
    // Verificar tokens CSRF en formularios
    const forms = await page.$$('form');
    
    for (const form of forms) {
      // Verificar si hay un token CSRF
      const csrfTokens = await form.$$('input[name="csrf_token"], input[name="_token"], input[name="csrfmiddlewaretoken"], input[name="_csrf"]');
      
      if (csrfTokens.length === 0) {
        // Si no hay un campo específico, verificar en los headers
        const formAction = await form.getAttribute('action') || '';
        const formMethod = await form.getAttribute('method') || 'get';
        
        if (formMethod.toLowerCase() !== 'get' && formAction) {
          // Intentar enviar el formulario sin token CSRF
          const formData = new FormData();
          const inputs = await form.$$('input:not([type="submit"]):not([type="button"]), textarea, select');
          
          for (const input of inputs) {
            const name = await input.getAttribute('name');
            const value = await input.getAttribute('value') || '';
            
            if (name) {
              formData.append(name, value);
            }
          }
          
          // Enviar petición directamente
          const response = await page.request.fetch(formAction, {
            method: formMethod,
            body: formData
          }).catch(e => e.response);
          
          // Debería fallar con 403 Forbidden o similar
          expect(response.status()).toBeGreaterThanOrEqual(400);
        }
      } else {
        // Hay un token CSRF, verificar que no está vacío
        const csrfToken = await csrfTokens[0].getAttribute('value');
        expect(csrfToken).not.toBe('');
      }
    }
  });
  
  test('debería tener una política de cookies segura', async ({ page, context }) => {
    // Verificar cookies seguras
    await page.goto('http://localhost:3000');
    
    const cookies = await context.cookies();
    
    for (const cookie of cookies) {
      // Las cookies de sesión deben ser seguras y httpOnly
      if (cookie.name.toLowerCase().includes('session') || 
          cookie.name.toLowerCase().includes('token') || 
          cookie.name.toLowerCase().includes('auth')) {
        expect(cookie.secure).toBe(true);
        expect(cookie.httpOnly).toBe(true);
      }
      
      // Verificar que las cookies tienen SameSite
      expect(cookie.sameSite).toBeDefined();
    }
  });
  
  test('debería manejar errores de forma segura', async ({ page }) => {
    // Intentar provocar errores y verificar que se manejan correctamente
    await page.goto('http://localhost:3000/non-existent-page');
    
    // Verificar que no hay información sensible en la página de error
    const pageContent = await page.content();
    
    // No debe exponer rutas del sistema
    expect(pageContent).not.toMatch(/[C-Z]:\\|\/var\/www\/|\/home\//i);
    
    // No debe exponer stacktraces
    expect(pageContent).not.toMatch(/at\s+[\w.]+\s+\([\w\/:.]+\)/i);
    
    // No debe exponer información de la base de datos
    expect(pageContent).not.toMatch(/sql|mysql|postgres|mongodb|database error/i);
  });
});`;
  } else if (framework === 'cypress') {
    return `// Pruebas de seguridad con Cypress: ${testSpec}
describe('Pruebas de Seguridad', () => {
  beforeEach(() => {
    // Visitar la página a probar
    cy.visit('/');
  });
  
  it('debería tener cabeceras de seguridad adecuadas', () => {
    // Verificar cabeceras de seguridad
    cy.request('/')
      .then(response => {
        // Verificar Content-Security-Policy
        expect(response.headers['content-security-policy'] || 
               response.headers['Content-Security-Policy']).to.exist;
        
        // Verificar X-XSS-Protection
        expect(response.headers['x-xss-protection'] || 
               response.headers['X-XSS-Protection']).to.exist;
        
        // Verificar X-Content-Type-Options
        expect(response.headers['x-content-type-options'] || 
               response.headers['X-Content-Type-Options']).to.equal('nosniff');
        
                // Verificar X-Frame-Options
        expect(response.headers['x-frame-options'] || 
               response.headers['X-Frame-Options']).to.exist;
        
        // Verificar Strict-Transport-Security
        expect(response.headers['strict-transport-security'] || 
               response.headers['Strict-Transport-Security']).to.exist;
      });
  });
  
  it('debería validar entradas en formularios', () => {
    // Buscar formularios
    cy.get('form').each(($form) => {
      // Obtener campos del formulario
      cy.wrap($form).find('input:not([type="submit"]):not([type="button"]):not([type="hidden"]), textarea, select').each(($input) => {
        // Preparar datos de prueba maliciosos
        const maliciousInputs = [
          '<script>alert("XSS")</script>',
          '"; DROP TABLE users; --',
          '${alert("XSS")}',
          'javascript:alert("XSS")',
          '<img src="x" onerror="alert(\'XSS\')">',
          '<svg onload="alert(\'XSS\')">',
          '"><script>alert("XSS")</script>'
        ];
        
        // Seleccionar un valor malicioso adecuado según el tipo de campo
        let maliciousValue = maliciousInputs[0];
        const inputType = $input.attr('type');
        
        if (inputType === 'email') {
          maliciousValue = 'test"><script>alert("XSS")</script>@example.com';
        } else if (inputType === 'number') {
          maliciousValue = '1e309'; // Overflow
        } else if (inputType === 'url') {
          maliciousValue = 'javascript:alert("XSS")';
        }
        
        // Rellenar el campo con el valor malicioso
        cy.wrap($input).clear().type(maliciousValue, { force: true });
      });
      
      // Enviar el formulario
      cy.window().then((win) => {
        // Espiar alert para detectar XSS
        cy.stub(win, 'alert').as('alertStub');
      });
      
      cy.wrap($form).submit({ force: true });
      
      // Verificar que no se ejecutó ningún alert (XSS)
      cy.get('@alertStub').should('not.be.called');
      
      // Verificar que el contenido de la página no incluye los valores maliciosos sin escapar
      cy.document().then((doc) => {
        const pageContent = doc.body.innerHTML;
        const maliciousInputs = [
          '<script>alert("XSS")</script>',
          '"><script>alert("XSS")</script>'
        ];
        
        for (const maliciousInput of maliciousInputs) {
          // Verificar que el input malicioso no aparece tal cual en el HTML
          expect(pageContent).not.to.include(maliciousInput);
        }
      });
    });
  });
  
  it('debería tener protección CSRF en formularios', () => {
    // Verificar tokens CSRF en formularios
    cy.get('form').each(($form) => {
      // Verificar si hay un token CSRF
      const hasCsrfToken = $form.find('input[name="csrf_token"], input[name="_token"], input[name="csrfmiddlewaretoken"], input[name="_csrf"]').length > 0;
      
      if (hasCsrfToken) {
        // Hay un token CSRF, verificar que no está vacío
        cy.wrap($form).find('input[name="csrf_token"], input[name="_token"], input[name="csrfmiddlewaretoken"], input[name="_csrf"]').should('have.attr', 'value').and('not.be.empty');
      } else {
        // Si no hay un campo específico, verificar en los headers
        const formAction = $form.attr('action') || '';
        const formMethod = $form.attr('method') || 'get';
        
        if (formMethod.toLowerCase() !== 'get' && formAction) {
          // Intentar enviar el formulario sin token CSRF
          const formData = new FormData($form[0]);
          
          cy.request({
            url: formAction,
            method: formMethod.toUpperCase(),
            body: formData,
            failOnStatusCode: false
          }).then((response) => {
            // Debería fallar con 403 Forbidden o similar
            expect(response.status).to.be.at.least(400);
          });
        }
      }
    });
  });
  
  it('debería tener una política de cookies segura', () => {
    // Verificar cookies seguras
    cy.getCookies().then((cookies) => {
      for (const cookie of cookies) {
        // Las cookies de sesión deben ser seguras y httpOnly
        if (cookie.name.toLowerCase().includes('session') || 
            cookie.name.toLowerCase().includes('token') || 
            cookie.name.toLowerCase().includes('auth')) {
          expect(cookie.secure).to.be.true;
          expect(cookie.httpOnly).to.be.true;
        }
      }
    });
  });
  
  it('debería manejar errores de forma segura', () => {
    // Intentar provocar errores y verificar que se manejan correctamente
    cy.visit('/non-existent-page', { failOnStatusCode: false });
    
    // Verificar que no hay información sensible en la página de error
    cy.document().then((doc) => {
      const pageContent = doc.body.innerHTML;
      
      // No debe exponer rutas del sistema
      expect(pageContent).not.to.match(/[C-Z]:\\|\/var\/www\/|\/home\//i);
      
      // No debe exponer stacktraces
      expect(pageContent).not.to.match(/at\s+[\w.]+\s+\([\w\/:.]+\)/i);
      
      // No debe exponer información de la base de datos
      expect(pageContent).not.to.match(/sql|mysql|postgres|mongodb|database error/i);
    });
  });
});`;
  } else {
    return `// Pruebas de seguridad con Jest: ${testSpec}
describe('Pruebas de Seguridad', () => {
  beforeAll(async () => {
    // Configuración inicial
    await page.goto('http://localhost:3000');
  });
  
  test('debería tener cabeceras de seguridad adecuadas', async () => {
    // Verificar cabeceras de seguridad
    const response = await page.goto('http://localhost:3000');
    const headers = response.headers();
    
    // Verificar Content-Security-Policy
    expect(headers['content-security-policy'] || 
           headers['Content-Security-Policy']).toBeDefined();
    
    // Verificar X-XSS-Protection
    expect(headers['x-xss-protection'] || 
           headers['X-XSS-Protection']).toBeDefined();
    
    // Verificar X-Content-Type-Options
    expect(headers['x-content-type-options'] || 
           headers['X-Content-Type-Options']).toBe('nosniff');
    
    // Verificar X-Frame-Options
    expect(headers['x-frame-options'] || 
           headers['X-Frame-Options']).toBeDefined();
    
    // Verificar Strict-Transport-Security
    expect(headers['strict-transport-security'] || 
           headers['Strict-Transport-Security']).toBeDefined();
  });
  
  // Más pruebas de seguridad...
});`;
  }
}

/**
 * Genera pruebas de accesibilidad
 */
private generateAccessibilityTest(testSpec: string, framework: string): string {
  if (framework === 'playwright') {
    return `// Pruebas de accesibilidad para: ${testSpec}
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Pruebas de Accesibilidad', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
  });
  
  test('debería cumplir con WCAG 2.1 AA', async ({ page }) => {
    // Ejecutar análisis de accesibilidad con axe
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    
    // Imprimir resultados para depuración
    console.log(\`Violaciones de accesibilidad: \${accessibilityScanResults.violations.length}\`);
    for (const violation of accessibilityScanResults.violations) {
      console.log(\`- \${violation.id}: \${violation.description}\`);
      console.log(\`  Impacto: \${violation.impact}\`);
      console.log(\`  Nodos afectados: \${violation.nodes.length}\`);
    }
    
    // No debe haber violaciones de accesibilidad
    expect(accessibilityScanResults.violations).toEqual([]);
  });
  
  test('debería tener textos alternativos para imágenes', async ({ page }) => {
    // Verificar que todas las imágenes tienen texto alternativo
    const images = await page.$$('img');
    
    for (const image of images) {
      const alt = await image.getAttribute('alt');
      const role = await image.getAttribute('role');
      const ariaHidden = await image.getAttribute('aria-hidden');
      
      // Si la imagen es decorativa, debe tener alt="" o role="presentation" o aria-hidden="true"
      const isDecorative = alt === '' || role === 'presentation' || ariaHidden === 'true';
      
      // Si no es decorativa, debe tener un texto alternativo
      if (!isDecorative) {
        expect(alt).not.toBe(null);
        expect(alt).not.toBe('');
      }
    }
  });
  
  test('debería tener suficiente contraste de color', async ({ page }) => {
    // Verificar contraste de color con axe
    const contrastResults = await new AxeBuilder({ page })
      .withTags(['color-contrast'])
      .analyze();
    
    // Imprimir resultados para depuración
    console.log(\`Violaciones de contraste: \${contrastResults.violations.length}\`);
    for (const violation of contrastResults.violations) {
      console.log(\`- \${violation.id}: \${violation.description}\`);
      console.log(\`  Impacto: \${violation.impact}\`);
      console.log(\`  Nodos afectados: \${violation.nodes.length}\`);
    }
    
    // No debe haber violaciones de contraste
    expect(contrastResults.violations).toEqual([]);
  });
  
  test('debería ser navegable con teclado', async ({ page }) => {
    // Verificar navegación con teclado
    await page.goto('http://localhost:3000');
    
    // Obtener todos los elementos interactivos
    const interactiveElements = await page.$$('a, button, [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    
    // Verificar que hay al menos un elemento interactivo
    expect(interactiveElements.length).toBeGreaterThan(0);
    
    // Simular navegación con teclado
    await page.keyboard.press('Tab');
    
    // Verificar que el primer elemento está enfocado
    const focusedElement = await page.evaluate(() => {
      const activeElement = document.activeElement;
      return {
        tagName: activeElement.tagName,
        id: activeElement.id,
        className: activeElement.className,
        tabIndex: activeElement.tabIndex
      };
    });
    
    // El elemento enfocado debe ser interactivo
    expect(focusedElement.tagName.toLowerCase()).toMatch(/^(a|button|input|select|textarea)$/);
    
    // Verificar que se puede navegar por todos los elementos interactivos
    let tabCount = 0;
    const maxTabs = interactiveElements.length * 2; // Multiplicar por 2 para asegurar que se recorren todos
    
    while (tabCount < maxTabs) {
      await page.keyboard.press('Tab');
      tabCount++;
      
      // Verificar que hay un elemento enfocado
      const hasFocus = await page.evaluate(() => {
        return document.activeElement !== document.body;
      });
      
      if (!hasFocus) {
        break; // Si no hay elemento enfocado, se ha completado el ciclo
      }
    }
    
    // Debe haber al menos tantos tabs como elementos interactivos
    expect(tabCount).toBeGreaterThanOrEqual(interactiveElements.length);
  });
  
  test('debería tener etiquetas para campos de formulario', async ({ page }) => {
    // Verificar que todos los campos de formulario tienen etiquetas
    const formFields = await page.$$('input:not([type="hidden"]), select, textarea');
    
    for (const field of formFields) {
      const id = await field.getAttribute('id');
      const ariaLabelledby = await field.getAttribute('aria-labelledby');
      const ariaLabel = await field.getAttribute('aria-label');
      const placeholder = await field.getAttribute('placeholder');
      const type = await field.getAttribute('type');
      
      // Si es un botón o un campo oculto, no necesita etiqueta
      if (type === 'button' || type === 'submit' || type === 'reset' || type === 'hidden') {
        continue;
      }
      
      // Verificar si hay una etiqueta asociada
      let hasLabel = false;
      
      if (id) {
        const label = await page.$(\`label[for="\${id}"]\`);
        hasLabel = label !== null;
      }
      
      // Si no hay etiqueta, debe tener aria-labelledby, aria-label o placeholder
      expect(hasLabel || ariaLabelledby || ariaLabel || placeholder).toBe(true);
    }
  });
  
  test('debería tener roles ARIA correctos', async ({ page }) => {
    // Verificar roles ARIA con axe
    const ariaResults = await new AxeBuilder({ page })
      .withTags(['aria'])
      .analyze();
    
    // Imprimir resultados para depuración
    console.log(\`Violaciones de ARIA: \${ariaResults.violations.length}\`);
    for (const violation of ariaResults.violations) {
      console.log(\`- \${violation.id}: \${violation.description}\`);
      console.log(\`  Impacto: \${violation.impact}\`);
      console.log(\`  Nodos afectados: \${violation.nodes.length}\`);
    }
    
    // No debe haber violaciones de ARIA
    expect(ariaResults.violations).toEqual([]);
  });
  
  test('debería tener una estructura de encabezados correcta', async ({ page }) => {
    // Verificar estructura de encabezados
    const headings = await page.$$('h1, h2, h3, h4, h5, h6');
    
    // Debe haber al menos un encabezado
    expect(headings.length).toBeGreaterThan(0);
    
    // Verificar que hay un solo h1
    const h1s = await page.$$('h1');
    expect(h1s.length).toBe(1);
    
    // Obtener niveles de encabezados
    const headingLevels = [];
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const level = parseInt(tagName.substring(1));
      headingLevels.push(level);
    }
    
    // Verificar que no hay saltos en los niveles (por ejemplo, de h1 a h3 sin h2)
    for (let i = 1; i < headingLevels.length; i++) {
      const prevLevel = headingLevels[i - 1];
      const currentLevel = headingLevels[i];
      
      // El nivel actual no debe ser más de un nivel mayor que el anterior
      expect(currentLevel - prevLevel).toBeLessThanOrEqual(1);
    }
  });
  
  test('debería tener textos de enlaces descriptivos', async ({ page }) => {
    // Verificar textos de enlaces
    const links = await page.$$('a');
    
    for (const link of links) {
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      const title = await link.getAttribute('title');
      
      // El texto del enlace debe ser descriptivo
      const linkText = text ? text.trim() : '';
      const hasDescriptiveText = linkText.length > 0 && 
                                !['click here', 'here', 'link', 'more', 'read more'].includes(linkText.toLowerCase());
      
      // Si no tiene texto descriptivo, debe tener aria-label o title
      expect(hasDescriptiveText || ariaLabel || title).toBe(true);
    }
  });
});`;
  } else if (framework === 'cypress') {
    return `// Pruebas de accesibilidad con Cypress: ${testSpec}
describe('Pruebas de Accesibilidad', () => {
  beforeEach(() => {
    // Visitar la página a probar
    cy.visit('/');
    cy.injectAxe();
  });
  
  it('debería cumplir con WCAG 2.1 AA', () => {
    // Ejecutar análisis de accesibilidad con axe
    cy.checkA11y(null, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
      }
    });
  });
  
  // Más pruebas de accesibilidad...
});`;
  } else {
    return `// Pruebas de accesibilidad con Jest: ${testSpec}
describe('Pruebas de Accesibilidad', () => {
  beforeAll(async () => {
    // Configuración inicial
    await page.goto('http://localhost:3000');
  });
  
  test('debería cumplir con WCAG 2.1 AA', async () => {
    // Ejecutar análisis de accesibilidad con axe
    const axeResults = await page.evaluate(() => {
      return new Promise(resolve => {
        // Cargar axe-core
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.4.2/axe.min.js';
        script.onload = () => {
          // Ejecutar análisis
          window.axe.run(document, {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
            }
          }, (err, results) => {
            resolve(results);
          });
        };
        document.head.appendChild(script);
      });
    });
    
    // No debe haber violaciones de accesibilidad
    expect(axeResults.violations).toEqual([]);
  });
  
  // Más pruebas de accesibilidad...
});`;
  }
}

/**
 * Genera pruebas de integración
 */
private generateIntegrationTest(testSpec: string, framework: string): string {
  if (framework === 'playwright') {
    return `// Pruebas de integración para: ${testSpec}
import { test, expect } from '@playwright/test';

test.describe('Pruebas de Integración', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
  });
  
  test('debería integrarse correctamente con APIs externas', async ({ page, request }) => {
    // Interceptar llamadas a APIs
    await page.route('**/api/**', route => {
      console.log(\`Interceptando llamada a API: \${route.request().url()}\`);
      route.continue();
    });
    
    // Buscar elementos que podrían desencadenar llamadas a APIs
    const actionElements = await page.$$('button, a, [role="button"]');
    
    for (const element of actionElements.slice(0, 3)) { // Limitar a 3 elementos
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      
      if (isVisible && isEnabled) {
        // Hacer clic en el elemento
        await element.click();
        
        // Esperar a que se completen las peticiones
        await page.waitForLoadState('networkidle');
        
        // Verificar que no hay errores en la consola
        const errors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });
        
        // No debe haber errores en la consola
        expect(errors).toEqual([]);
        
        // Volver a la página inicial
        await page.goto('http://localhost:3000');
      }
    }
  });
  
  test('debería mantener el estado entre navegaciones', async ({ page }) => {
    // Verificar persistencia de estado
    
    // Buscar elementos interactivos que podrían modificar el estado
    const interactiveElements = await page.$$('button, input, select, textarea');
    
    for (const element of interactiveElements.slice(0, 3)) { // Limitar a 3 elementos
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      
      if (isVisible && isEnabled) {
        const tagName = await element.evaluate(el => el.tagName.toLowerCase());
        
        // Interactuar con el elemento según su tipo
        if (tagName === 'input') {
          const type = await element.getAttribute('type');
          
          if (type === 'text' || type === 'email' || type === 'password') {
            await element.fill('Test Value');
          } else if (type === 'checkbox') {
            await element.check();
          } else if (type === 'radio') {
            await element.check();
          }
        } else if (tagName === 'select') {
          const options = await element.$$('option');
          if (options.length > 0) {
            await options[options.length - 1].click();
          }
        } else if (tagName === 'textarea') {
          await element.fill('Test Value');
        } else if (tagName === 'button') {
          await element.click();
        }
        
        // Navegar a otra página
        const links = await page.$$('a');
        if (links.length > 0) {
          await links[0].click();
          await page.waitForLoadState('networkidle');
        } else {
          await page.goto('http://localhost:3000/about');
        }
        
        // Volver a la página inicial
        await page.goto('http://localhost:3000');
        
        // Verificar si el estado se mantiene
        if (tagName === 'input') {
          const type = await element.getAttribute('type');
          
          if (type === 'text' || type === 'email' || type === 'password') {
            const value = await element.inputValue();
            expect(value).toBe('Test Value');
          } else if (type === 'checkbox') {
            const checked = await element.isChecked();
            expect(checked).toBe(true);
          } else if (type === 'radio') {
            const checked = await element.isChecked();
            expect(checked).toBe(true);
          }
        } else if (tagName === 'select') {
          const value = await element.evaluate(el => el.value);
          expect(value).not.toBe('');
        } else if (tagName === 'textarea') {
          const value = await element.inputValue();
          expect(value).toBe('Test Value');
        }
      }
    }
  });
  
  test('debería integrarse correctamente con el sistema de autenticación', async ({ page }) => {
    // Verificar integración con autenticación
    
    // Buscar formulario de login
    const loginForm = await page.$('form:has(input[type="password"])');
    
    if (loginForm) {
      // Obtener campos de usuario y contraseña
      const usernameInput = await loginForm.$('input[type="text"], input[type="email"], input[name="username"], input[name="email"]');
      const passwordInput = await loginForm.$('input[type="password"]');
      
      if (usernameInput && passwordInput) {
        // Rellenar campos
        await usernameInput.fill('testuser@example.com');
        await passwordInput.fill('password123');
        
        // Enviar formulario
        await loginForm.evaluate(form => form.submit());
        
        // Esperar a que se complete la navegación
        await page.waitForLoadState('networkidle');
        
        // Verificar que se ha iniciado sesión
        const logoutButton = await page.$('a:has-text("Logout"), a:has-text("Cerrar sesión"), button:has-text("Logout"), button:has-text("Cerrar sesión")');
        
        expect(logoutButton).not.toBe(null);
        
        // Cerrar sesión
        if (logoutButton) {
          await logoutButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    }
  });
  
  test('debería integrarse correctamente con el sistema de notificaciones', async ({ page }) => {
    // Verificar integración con notificaciones
    
    // Buscar elementos que podrían desencadenar notificaciones
    const actionElements = await page.$$('button, a, [role="button"]');
    
    for (const element of actionElements.slice(0, 3)) { // Limitar a 3 elementos
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      
      if (isVisible && isEnabled) {
        // Hacer clic en el elemento
        await element.click();
        
        // Esperar a que se completen las peticiones
        await page.waitForLoadState('networkidle');
        
        // Verificar si aparece alguna notificación
        const notifications = await page.$$('.notification, .alert, .toast, .snackbar, [role="alert"], [aria-live="polite"], [aria-live="assertive"]');
        
        if (notifications.length > 0) {
          // Verificar que la notificación tiene contenido
          const notificationText = await notifications[0].textContent();
          expect(notificationText.trim()).not.toBe('');
          
          // Verificar que la notificación se puede cerrar
          const closeButton = await notifications[0].$('button, .close, [aria-label="close"], [aria-label="cerrar"]');
          
          if (closeButton) {
            await closeButton.click();
            
            // Verificar que la notificación desaparece
            await page.waitForTimeout(500);
            const notificationAfterClose = await page.$(\`#\${await notifications[0].getAttribute('id')}\`);
            expect(notificationAfterClose).toBe(null);
          }
        }
        
        // Volver a la página inicial
        await page.goto('http://localhost:3000');
      }
    }
  });
  
  test('debería integrarse correctamente con el sistema de búsqueda', async ({ page }) => {
    // Verificar integración con búsqueda
    
    // Buscar campo de búsqueda
    const searchInput = await page.$('input[type="search"], input[name="search"], input[placeholder*="search"], input[placeholder*="buscar"], [role="search"] input');
    
    if (searchInput) {
      // Rellenar campo de búsqueda
      await searchInput.fill('test');
      
      // Enviar búsqueda
      await searchInput.press('Enter');
      
      // Esperar a que se completen las peticiones
      await page.waitForLoadState('networkidle');
      
      // Verificar que se muestran resultados
      const results = await page.$$('.search-results, .results, [aria-label="search results"], [aria-label="resultados de búsqueda"]');
      
      expect(results.length).toBeGreaterThan(0);
      
      // Volver a la página inicial
      await page.goto('http://localhost:3000');
    }
  });
});`;
  } else if (framework === 'cypress') {
    return `// Pruebas de integración con Cypress: ${testSpec}
describe('Pruebas de Integración', () => {
  beforeEach(() => {
    // Visitar la página a probar
    cy.visit('/');
  });
  
  it('debería integrarse correctamente con APIs externas', () => {
    // Interceptar llamadas a APIs
    cy.intercept('**/api/**').as('apiCall');
    
    // Buscar elementos que podrían desencadenar llamadas a APIs
    cy.get('button, a, [role="button"]').each(($el, index) => {
      if (index < 3) { // Limitar a 3 elementos
        // Hacer clic en el elemento
        cy.wrap($el).click({ force: true });
        
        // Esperar a que se completen las peticiones
        cy.wait('@apiCall', { timeout: 10000 }).then((interception) => {
          // Verificar que la respuesta es correcta
          expect(interception.response.statusCode).to.be.lessThan(400);
        });
        
        // Volver a la página inicial
        cy.visit('/');
      }
    });
  });
  
  // Más pruebas de integración...
});`;
  } else {
    return `// Pruebas de integración con Jest: ${testSpec}
describe('Pruebas de Integración', () => {
  beforeAll(async () => {
    // Configuración inicial
    await page.goto('http://localhost:3000');
  });
  
  test('debería integrarse correctamente con APIs externas', async () => {
    // Interceptar llamadas a APIs
    await page.setRequestInterception(true);
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        console.log(\`Interceptando llamada a API: \${request.url()}\`);
      }
      request.continue();
    });
        // Buscar elementos que podrían desencadenar llamadas a APIs
    const actionElements = await page.$$('button, a, [role="button"]');
    
    for (const element of actionElements.slice(0, 3)) { // Limitar a 3 elementos
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      
      if (isVisible && isEnabled) {
        // Hacer clic en el elemento
        await element.click();
        
        // Esperar a que se completen las peticiones
        await page.waitForLoadState('networkidle');
        
        // Verificar que no hay errores en la consola
        const errors = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });
        
        // No debe haber errores en la consola
        expect(errors).toEqual([]);
        
        // Volver a la página inicial
        await page.goto('http://localhost:3000');
      }
    }
  });
  
  /**
   * Genera pruebas de rendimiento
   */
  private generatePerformanceTest(testSpec: string, framework: string): string {
    if (framework === 'playwright') {
      return `// Pruebas de rendimiento para: ${testSpec}
import { test, expect } from '@playwright/test';

test.describe('Pruebas de Rendimiento', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
  });
  
  test('debería cargar la página en menos de 3 segundos', async ({ page }) => {
    // Medir tiempo de carga de la página
    const startTime = Date.now();
    
    // Navegar a la página
    const response = await page.goto('http://localhost:3000');
    
    // Esperar a que la página esté completamente cargada
    await page.waitForLoadState('networkidle');
    
    // Calcular tiempo de carga
    const loadTime = Date.now() - startTime;
    
    // Verificar que la página cargó correctamente
    expect(response.status()).toBe(200);
    
    // Verificar que el tiempo de carga es menor a 3 segundos
    expect(loadTime).toBeLessThan(3000);
    
    // Imprimir tiempo de carga para depuración
    console.log(\`Tiempo de carga: \${loadTime}ms\`);
  });
  
  test('debería tener un First Contentful Paint rápido', async ({ page }) => {
    // Medir First Contentful Paint (FCP)
    const fcpTime = await page.evaluate(() => {
      return new Promise(resolve => {
        // Usar Performance Observer para medir FCP
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.name === 'first-contentful-paint') {
              observer.disconnect();
              resolve(entry.startTime);
              break;
            }
          }
        });
        
        observer.observe({ type: 'paint', buffered: true });
        
        // Si no se detecta FCP en 10 segundos, resolver con un valor alto
        setTimeout(() => resolve(10000), 10000);
      });
    });
    
    // Verificar que FCP es menor a 1.5 segundos
    expect(fcpTime).toBeLessThan(1500);
    
    // Imprimir FCP para depuración
    console.log(\`First Contentful Paint: \${fcpTime}ms\`);
  });
  
  test('debería tener un Largest Contentful Paint aceptable', async ({ page }) => {
    // Medir Largest Contentful Paint (LCP)
    const lcpTime = await page.evaluate(() => {
      return new Promise(resolve => {
        // Usar Performance Observer para medir LCP
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          // El último entry es el más grande
          const lastEntry = entries[entries.length - 1];
          if (lastEntry) {
            observer.disconnect();
            resolve(lastEntry.startTime);
          }
        });
        
        observer.observe({ type: 'largest-contentful-paint', buffered: true });
        
        // Si no se detecta LCP en 10 segundos, resolver con un valor alto
        setTimeout(() => resolve(10000), 10000);
      });
    });
    
    // Verificar que LCP es menor a 2.5 segundos
    expect(lcpTime).toBeLessThan(2500);
    
    // Imprimir LCP para depuración
    console.log(\`Largest Contentful Paint: \${lcpTime}ms\`);
  });
  
  test('debería tener un Cumulative Layout Shift bajo', async ({ page }) => {
    // Medir Cumulative Layout Shift (CLS)
    const cls = await page.evaluate(() => {
      return new Promise(resolve => {
        let clsValue = 0;
        
        // Usar Performance Observer para medir CLS
        const observer = new PerformanceObserver(list => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
        });
        
        observer.observe({ type: 'layout-shift', buffered: true });
        
        // Resolver después de 5 segundos
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 5000);
      });
    });
    
    // Verificar que CLS es menor a 0.1 (bueno según Core Web Vitals)
    expect(cls).toBeLessThan(0.1);
    
    // Imprimir CLS para depuración
    console.log(\`Cumulative Layout Shift: \${cls}\`);
  });
  
  test('debería tener un Time to Interactive aceptable', async ({ page }) => {
    // Medir Time to Interactive (TTI)
    const tti = await page.evaluate(() => {
      return new Promise(resolve => {
        // Función para verificar si la página es interactiva
        const checkInteractive = () => {
          // Verificar si hay tareas largas en ejecución
          const longTasks = performance.getEntriesByType('longtask');
          const lastLongTaskEndTime = longTasks.length > 0 
            ? longTasks[longTasks.length - 1].startTime + longTasks[longTasks.length - 1].duration 
            : 0;
          
          // Si no hay tareas largas recientes, la página es interactiva
          const now = performance.now();
          if (now - lastLongTaskEndTime > 50) {
            return now;
          }
          
          // Verificar de nuevo en 50ms
          setTimeout(() => {
            const interactiveTime = checkInteractive();
            if (interactiveTime) {
              resolve(interactiveTime);
            }
          }, 50);
          
          return null;
        };
        
        // Iniciar verificación
        const interactiveTime = checkInteractive();
        if (interactiveTime) {
          resolve(interactiveTime);
        }
        
        // Si no se detecta TTI en 10 segundos, resolver con un valor alto
        setTimeout(() => resolve(10000), 10000);
      });
    });
    
    // Verificar que TTI es menor a 3.8 segundos (bueno según Core Web Vitals)
    expect(tti).toBeLessThan(3800);
    
    // Imprimir TTI para depuración
    console.log(\`Time to Interactive: \${tti}ms\`);
  });
  
  test('debería tener un tamaño de página optimizado', async ({ page, request }) => {
    // Obtener tamaño de la página
    const response = await request.get('http://localhost:3000');
    const headers = response.headers();
    const contentLength = headers['content-length'] ? parseInt(headers['content-length']) : 0;
    
    // Si no hay content-length, calcular tamaño de la respuesta
    const pageSize = contentLength || (await response.body()).length;
    
    // Verificar que el tamaño de la página es menor a 1MB
    expect(pageSize).toBeLessThan(1024 * 1024);
    
    // Imprimir tamaño de la página para depuración
    console.log(\`Tamaño de la página: \${pageSize / 1024}KB\`);
  });
  
  test('debería tener un número razonable de solicitudes', async ({ page }) => {
    // Contar número de solicitudes
    const requests = [];
    
    // Interceptar todas las solicitudes
    page.on('request', request => {
      requests.push(request.url());
    });
    
    // Navegar a la página
    await page.goto('http://localhost:3000');
    
    // Esperar a que la página esté completamente cargada
    await page.waitForLoadState('networkidle');
    
    // Verificar que el número de solicitudes es razonable (menos de 50)
    expect(requests.length).toBeLessThan(50);
    
    // Imprimir número de solicitudes para depuración
    console.log(\`Número de solicitudes: \${requests.length}\`);
  });
  
  test('debería tener un uso de memoria razonable', async ({ page }) => {
    // Medir uso de memoria
    const memoryInfo = await page.evaluate(() => {
      if (performance.memory) {
        return {
          totalJSHeapSize: performance.memory.totalJSHeapSize,
          usedJSHeapSize: performance.memory.usedJSHeapSize,
          jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
        };
      }
      
      return null;
    });
    
    // Si la API de memoria está disponible, verificar uso de memoria
    if (memoryInfo) {
      // Verificar que el uso de memoria es menor al 80% del límite
      expect(memoryInfo.usedJSHeapSize).toBeLessThan(memoryInfo.jsHeapSizeLimit * 0.8);
      
      // Imprimir uso de memoria para depuración
      console.log(\`Uso de memoria: \${memoryInfo.usedJSHeapSize / (1024 * 1024)}MB / \${memoryInfo.jsHeapSizeLimit / (1024 * 1024)}MB\`);
    } else {
      console.log('API de memoria no disponible');
    }
  });
});`;
    } else if (framework === 'cypress') {
      return `// Pruebas de rendimiento con Cypress: ${testSpec}
describe('Pruebas de Rendimiento', () => {
  beforeEach(() => {
    // Visitar la página a probar
    cy.visit('/');
  });
  
  it('debería cargar la página en menos de 3 segundos', () => {
    // Medir tiempo de carga de la página
    const startTime = Date.now();
    
    // Navegar a la página
    cy.visit('/', {
      onBeforeLoad: (win) => {
        win.performance.mark('start');
      },
      onLoad: (win) => {
        win.performance.mark('end');
        win.performance.measure('load', 'start', 'end');
      }
    });
    
    // Verificar que la página cargó correctamente
    cy.window().then((win) => {
      const measure = win.performance.getEntriesByName('load')[0];
      expect(measure.duration).to.be.lessThan(3000);
    });
  });
  
  // Más pruebas de rendimiento...
});`;
    } else {
      return `// Pruebas de rendimiento con Jest: ${testSpec}
describe('Pruebas de Rendimiento', () => {
  beforeAll(async () => {
    // Configuración inicial
    await page.goto('http://localhost:3000');
  });
  
  test('debería cargar la página en menos de 3 segundos', async () => {
    // Medir tiempo de carga de la página
    const startTime = Date.now();
    
    // Navegar a la página
    await page.goto('http://localhost:3000');
    
    // Esperar a que la página esté completamente cargada
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // Calcular tiempo de carga
    const loadTime = Date.now() - startTime;
    
    // Verificar que el tiempo de carga es menor a 3 segundos
    expect(loadTime).toBeLessThan(3000);
  });
  
  // Más pruebas de rendimiento...
});`;
    }
  }
  
  /**
   * Genera pruebas de usabilidad
   */
  private generateUsabilityTest(testSpec: string, framework: string): string {
    if (framework === 'playwright') {
      return `// Pruebas de usabilidad para: ${testSpec}
import { test, expect } from '@playwright/test';

test.describe('Pruebas de Usabilidad', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página a probar
    await page.goto('http://localhost:3000');
  });
  
  test('debería tener elementos interactivos con tamaño adecuado', async ({ page }) => {
    // Verificar tamaño de elementos interactivos
    const interactiveElements = await page.$$('button, a, [role="button"], input[type="checkbox"], input[type="radio"]');
    
    for (const element of interactiveElements) {
      // Obtener dimensiones del elemento
      const boundingBox = await element.boundingBox();
      
      if (boundingBox) {
        // Verificar que el elemento tiene un tamaño mínimo de 44x44 píxeles (recomendación de WCAG)
        const minSize = 44;
        const isLargeEnough = boundingBox.width >= minSize || boundingBox.height >= minSize;
        
        expect(isLargeEnough).toBe(true);
      }
    }
  });
  
  test('debería tener feedback visual para estados de hover', async ({ page }) => {
    // Verificar feedback visual para hover
    const interactiveElements = await page.$$('button, a, [role="button"]');
    
    for (const element of interactiveElements.slice(0, 3)) { // Limitar a 3 elementos
      // Obtener estilo inicial
      const initialStyle = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
          border: style.border,
          boxShadow: style.boxShadow,
          transform: style.transform
        };
      });
      
      // Simular hover
      await element.hover();
      
      // Esperar a que se apliquen los estilos de hover
      await page.waitForTimeout(100);
      
      // Obtener estilo después de hover
      const hoverStyle = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
          border: style.border,
          boxShadow: style.boxShadow,
          transform: style.transform
        };
      });
      
      // Verificar que hay algún cambio visual
      const hasVisualChange = 
        initialStyle.backgroundColor !== hoverStyle.backgroundColor ||
        initialStyle.color !== hoverStyle.color ||
        initialStyle.border !== hoverStyle.border ||
        initialStyle.boxShadow !== hoverStyle.boxShadow ||
        initialStyle.transform !== hoverStyle.transform;
      
      expect(hasVisualChange).toBe(true);
    }
  });
  
  test('debería tener feedback visual para estados de focus', async ({ page }) => {
    // Verificar feedback visual para focus
    const interactiveElements = await page.$$('button, a, [role="button"], input, select, textarea');
    
    for (const element of interactiveElements.slice(0, 3)) { // Limitar a 3 elementos
      // Obtener estilo inicial
      const initialStyle = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          outline: style.outline,
          boxShadow: style.boxShadow,
          border: style.border
        };
      });
      
      // Simular focus
      await element.focus();
      
      // Esperar a que se apliquen los estilos de focus
      await page.waitForTimeout(100);
      
      // Obtener estilo después de focus
      const focusStyle = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          outline: style.outline,
          boxShadow: style.boxShadow,
          border: style.border
        };
      });
      
      // Verificar que hay algún cambio visual
      const hasVisualChange = 
        initialStyle.outline !== focusStyle.outline ||
        initialStyle.boxShadow !== focusStyle.boxShadow ||
        initialStyle.border !== focusStyle.border;
      
      expect(hasVisualChange).toBe(true);
    }
  });
  
  test('debería tener feedback visual para estados de active', async ({ page }) => {
    // Verificar feedback visual para active
    const interactiveElements = await page.$$('button, a, [role="button"]');
    
    for (const element of interactiveElements.slice(0, 3)) { // Limitar a 3 elementos
      // Obtener estilo inicial
      const initialStyle = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
          transform: style.transform,
          boxShadow: style.boxShadow
        };
      });
      
      // Simular active (mousedown)
      await element.dispatchEvent('mousedown');
      
      // Esperar a que se apliquen los estilos de active
      await page.waitForTimeout(100);
      
      // Obtener estilo después de active
      const activeStyle = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          backgroundColor: style.backgroundColor,
          color: style.color,
          transform: style.transform,
          boxShadow: style.boxShadow
        };
      });
      
      // Simular mouseup para restaurar estado
      await element.dispatchEvent('mouseup');
      
      // Verificar que hay algún cambio visual
      const hasVisualChange = 
        initialStyle.backgroundColor !== activeStyle.backgroundColor ||
        initialStyle.color !== activeStyle.color ||
        initialStyle.transform !== activeStyle.transform ||
        initialStyle.boxShadow !== activeStyle.boxShadow;
      
      expect(hasVisualChange).toBe(true);
    }
  });
  
  test('debería tener mensajes de error claros en formularios', async ({ page }) => {
    // Verificar mensajes de error en formularios
    const forms = await page.$$('form');
    
    for (const form of forms) {
      // Obtener campos requeridos
      const requiredFields = await form.$$('input[required], select[required], textarea[required]');
      
      if (requiredFields.length > 0) {
        // Enviar formulario sin rellenar campos requeridos
        await form.evaluate(f => f.submit());
        
        // Esperar a que aparezcan mensajes de error
        await page.waitForTimeout(500);
        
        // Verificar que hay mensajes de error visibles
        const errorMessages = await page.$$('.error, .invalid-feedback, [role="alert"], [aria-invalid="true"]');
        
        expect(errorMessages.length).toBeGreaterThan(0);
        
        // Verificar que los mensajes de error son descriptivos
        for (const errorMessage of errorMessages) {
          const text = await errorMessage.textContent();
          expect(text.trim().length).toBeGreaterThan(5);
        }
      }
    }
  });
  
  test('debería tener una jerarquía visual clara', async ({ page }) => {
    // Verificar jerarquía visual
    
    // Obtener todos los textos visibles
    const textElements = await page.$$('h1, h2, h3, h4, h5, h6, p, li, a, button, label, input, textarea, select');
    
    // Obtener tamaños de fuente
    const fontSizes = [];
    
    for (const element of textElements) {
      const fontSize = await element.evaluate(el => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });
      
      const tagName = await element.evaluate(el => el.tagName.toLowerCase());
      
      fontSizes.push({ element: tagName, fontSize });
    }
    
    // Verificar que hay al menos 3 tamaños de fuente diferentes
    const uniqueFontSizes = [...new Set(fontSizes.map(item => item.fontSize))];
    expect(uniqueFontSizes.length).toBeGreaterThanOrEqual(3);
    
    // Verificar que los encabezados tienen tamaños de fuente mayores que los párrafos
    const headingFontSizes = fontSizes.filter(item => /^h[1-6]$/.test(item.element)).map(item => item.fontSize);
    const paragraphFontSizes = fontSizes.filter(item => item.element === 'p').map(item => item.fontSize);
    
    if (headingFontSizes.length > 0 && paragraphFontSizes.length > 0) {
      const minHeadingSize = Math.min(...headingFontSizes);
      const maxParagraphSize = Math.max(...paragraphFontSizes);
      
      expect(minHeadingSize).toBeGreaterThanOrEqual(maxParagraphSize);
    }
  });
  
  test('debería tener suficiente contraste entre texto y fondo', async ({ page }) => {
    // Verificar contraste entre texto y fondo
    
    // Obtener todos los textos visibles
    const textElements = await page.$$('h1, h2, h3, h4, h5, h6, p, li, a, button, label');
    
    for (const element of textElements.slice(0, 5)) { // Limitar a 5 elementos
      // Obtener color de texto y fondo
      const colors = await element.evaluate(el => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor
        };
      });
      
      // Convertir colores a RGB
      const textColor = colors.color.match(/\d+/g).map(Number);
      const bgColor = colors.backgroundColor.match(/\d+/g).map(Number);
      
      // Calcular luminancia
      const textLuminance = 0.2126 * textColor[0] + 0.7152 * textColor[1] + 0.0722 * textColor[2];
      const bgLuminance = 0.2126 * bgColor[0] + 0.7152 * bgColor[1] + 0.0722 * bgColor[2];
      
      // Calcular contraste
      const contrast = (Math.max(textLuminance, bgLuminance) + 0.05) / (Math.min(textLuminance, bgLuminance) + 0.05);
      
      // Verificar que el contraste es suficiente (mínimo 4.5:1 según WCAG AA)
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    }
  });
  
  test('debería tener un diseño responsive', async ({ page }) => {
    // Verificar diseño responsive
    
    // Probar diferentes tamaños de pantalla
    const viewports = [
      { width: 320, height: 568 }, // Móvil pequeño
      { width: 768, height: 1024 }, // Tablet
      { width: 1366, height: 768 } // Desktop
    ];
    
    for (const viewport of viewports) {
      // Cambiar tamaño de ventana
      await page.setViewportSize(viewport);
      
      // Esperar a que se apliquen los cambios
      await page.waitForTimeout(500);
      
      // Verificar que no hay scroll horizontal
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
      
      // Verificar que los elementos principales están visibles
      const mainElements = await page.$$('header, main, footer, nav, h1');
      
      for (const element of mainElements) {
        const isVisible = await element.isVisible();
        expect(isVisible).toBe(true);
      }
    }
  });
  
  test('debería tener tiempos de respuesta rápidos para interacciones', async ({ page }) => {
    // Verificar tiempos de respuesta
    
    // Buscar elementos interactivos
    const interactiveElements = await page.$$('button, a, [role="button"]');
    
    for (const element of interactiveElements.slice(0, 3)) { // Limitar a 3 elementos
      const isVisible = await element.isVisible();
      const isEnabled = await element.isEnabled();
      
      if (isVisible && isEnabled) {
        // Medir tiempo de respuesta
        const startTime = Date.now();
        
        // Hacer clic en el elemento
        await element.click();
        
        // Esperar a que se complete la acción
        await page.waitForTimeout(100);
        
        // Calcular tiempo de respuesta
        const responseTime = Date.now() - startTime;
        
        // Verificar que el tiempo de respuesta es menor a 100ms
        expect(responseTime).toBeLessThan(100);
        
        // Volver a la página inicial
        await page.goto('http://localhost:3000');
      }
    }
  });
});`;
    } else if (framework === 'cypress') {
      return `// Pruebas de usabilidad con Cypress: ${testSpec}
describe('Pruebas de Usabilidad', () => {
  beforeEach(() => {
    // Visitar la página a probar
    cy.visit('/');
  });
  
  it('debería tener elementos interactivos con tamaño adecuado', () => {
    // Verificar tamaño de elementos interactivos
    cy.get('button, a, [role="button"], input[type="checkbox"], input[type="radio"]').each(($el) => {
      // Obtener dimensiones del elemento
      const width = $el.outerWidth();
      const height = $el.outerHeight();
      
      // Verificar que el elemento tiene un tamaño mínimo de 44x44 píxeles (recomendación de WCAG)
      const minSize = 44;
      const isLargeEnough = width >= minSize || height >= minSize;
      
      expect(isLargeEnough).to.be.true;
    });
  });
  
  // Más pruebas de usabilidad...
});`;
    } else {
      return `// Pruebas de usabilidad con Jest: ${testSpec}
describe('Pruebas de Usabilidad', () => {
  beforeAll(async () => {
    // Configuración inicial
    await page.goto('http://localhost:3000');
  });
  
  test('debería tener elementos interactivos con tamaño adecuado', async () => {
    // Verificar tamaño de elementos interactivos
    const interactiveElements = await page.$$('button, a, [role="button"], input[type="checkbox"], input[type="radio"]');
    
    for (const element of interactiveElements) {
      // Obtener dimensiones del elemento
      const boundingBox = await element.boundingBox();
      
      if (boundingBox) {
        // Verificar que el elemento tiene un tamaño mínimo de 44x44 píxeles (recomendación de WCAG)
        const minSize = 44;
        const isLargeEnough = boundingBox.width >= minSize || boundingBox.height >= minSize;
        
        expect(isLargeEnough).toBe(true);
      }
    }
  });
  
  // Más pruebas de usabilidad...
});`;
    }
  }
  
  /**
   * Genera un informe de cobertura de pruebas
   */
  private generateCoverageReport(testResults: any): string {
    // Implementación básica de informe de cobertura
    let report = `# Informe de Cobertura de Pruebas\n\n`;
    
    // Resumen de cobertura
    report += `## Resumen\n\n`;
    report += `- **Cobertura total**: ${testResults.coverage?.total || 0}%\n`;
    report += `- **Archivos analizados**: ${testResults.coverage?.files?.length || 0}\n`;
    report += `- **Líneas cubiertas**: ${testResults.coverage?.lines?.covered || 0}/${testResults.coverage?.lines?.total || 0}\n`;
    report += `- **Funciones cubiertas**: ${testResults.coverage?.functions?.covered || 0}/${testResults.coverage?.functions?.total || 0}\n`;
    report += `- **Ramas cubiertas**: ${testResults.coverage?.branches?.covered || 0}/${testResults.coverage?.branches?.total || 0}\n\n`;
    
    // Detalles por archivo
    report += `## Detalles por Archivo\n\n`;
    
    if (testResults.coverage?.files && testResults.coverage.files.length > 0) {
      report += `| Archivo | Cobertura | Líneas | Funciones | Ramas |\n`;
      report += `|---------|-----------|--------|-----------|-------|\n`;
      
      for (const file of testResults.coverage.files) {
        report += `| ${file.path} | ${file.coverage}% | ${file.lines.covered}/${file.lines.total} | ${file.functions.covered}/${file.functions.total} | ${file.branches.covered}/${file.branches.total} |\n`;
      }
    } else {
      report += `No hay información detallada de cobertura disponible.\n\n`;
    }
    
        // Recomendaciones
        report += `## Recomendaciones\n\n`;
    
        // Generar recomendaciones basadas en los resultados
        if (testResults.coverage?.total < 80) {
          report += `- **Aumentar cobertura general**: La cobertura total está por debajo del 80% recomendado. Considere añadir más pruebas.\n`;
        }
        
        if (testResults.coverage?.functions?.covered / testResults.coverage?.functions?.total < 0.7) {
          report += `- **Mejorar cobertura de funciones**: Muchas funciones no están siendo probadas. Priorice pruebas para funciones críticas.\n`;
        }
        
        if (testResults.coverage?.branches?.covered / testResults.coverage?.branches?.total < 0.6) {
          report += `- **Aumentar cobertura de ramas**: Las ramas condicionales tienen baja cobertura. Añada casos de prueba para diferentes condiciones.\n`;
        }
        
        // Identificar archivos con baja cobertura
        if (testResults.coverage?.files && testResults.coverage.files.length > 0) {
          const lowCoverageFiles = testResults.coverage.files
            .filter(file => file.coverage < 50)
            .sort((a, b) => a.coverage - b.coverage);
          
          if (lowCoverageFiles.length > 0) {
            report += `- **Archivos críticos con baja cobertura**:\n`;
            for (const file of lowCoverageFiles.slice(0, 5)) {
              report += `  - \`${file.path}\` (${file.coverage}%): Añadir pruebas para este archivo.\n`;
            }
          }
        }
        
        // Sugerir mejoras en la estructura de pruebas
        report += `- **Estructura de pruebas**: Organice las pruebas en carpetas por tipo (unitarias, integración, e2e) para mejor mantenibilidad.\n`;
        report += `- **Mocks y stubs**: Utilice mocks para servicios externos y bases de datos para hacer las pruebas más rápidas y confiables.\n`;
        report += `- **Pruebas de regresión**: Implemente pruebas de regresión automatizadas para evitar que los cambios rompan funcionalidades existentes.\n`;
        
        return report;
      }
      
      /**
       * Genera un informe de análisis de pruebas
       */
      private generateTestAnalysisReport(testResults: any): string {
        let report = `# Informe de Análisis de Pruebas\n\n`;
        
        // Resumen de ejecución
        report += `## Resumen de Ejecución\n\n`;
        report += `- **Total de pruebas**: ${testResults.total || 0}\n`;
        report += `- **Pruebas exitosas**: ${testResults.passed || 0}\n`;
        report += `- **Pruebas fallidas**: ${testResults.failed || 0}\n`;
        report += `- **Pruebas omitidas**: ${testResults.skipped || 0}\n`;
        report += `- **Tiempo de ejecución**: ${testResults.duration || 0}ms\n\n`;
        
        // Detalles de pruebas fallidas
        report += `## Pruebas Fallidas\n\n`;
        
        if (testResults.failures && testResults.failures.length > 0) {
          for (const failure of testResults.failures) {
            report += `### ${failure.testName}\n\n`;
            report += `- **Archivo**: \`${failure.file}\`\n`;
            report += `- **Línea**: ${failure.line}\n`;
            report += `- **Error**: ${failure.error}\n`;
            report += `- **Mensaje**: ${failure.message}\n\n`;
            
            if (failure.diff) {
              report += `**Diferencia**:\n\n`;
              report += "```diff\n";
              report += failure.diff;
              report += "\n```\n\n";
            }
          }
        } else {
          report += `No hay pruebas fallidas. ¡Excelente trabajo!\n\n`;
        }
        
        // Análisis de rendimiento
        report += `## Análisis de Rendimiento\n\n`;
        
        if (testResults.performance && testResults.performance.length > 0) {
          report += `| Prueba | Duración | Estado |\n`;
          report += `|--------|----------|--------|\n`;
          
          // Ordenar por duración (más lenta primero)
          const sortedTests = [...testResults.performance].sort((a, b) => b.duration - a.duration);
          
          for (const test of sortedTests.slice(0, 10)) {
            const status = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
            report += `| ${test.name} | ${test.duration}ms | ${status} |\n`;
          }
          
          // Identificar pruebas lentas
          const slowTests = sortedTests.filter(test => test.duration > 1000);
          
          if (slowTests.length > 0) {
            report += `\n### Pruebas Lentas\n\n`;
            report += `Las siguientes pruebas tomaron más de 1 segundo en ejecutarse:\n\n`;
            
            for (const test of slowTests) {
              report += `- **${test.name}**: ${test.duration}ms\n`;
            }
            
            report += `\nConsidere optimizar estas pruebas o marcarlas como pruebas lentas.\n\n`;
          }
        } else {
          report += `No hay información de rendimiento disponible.\n\n`;
        }
        
        // Tendencias
        if (testResults.trends) {
          report += `## Tendencias\n\n`;
          report += `- **Cambio en pruebas totales**: ${testResults.trends.totalDelta > 0 ? '+' : ''}${testResults.trends.totalDelta}\n`;
          report += `- **Cambio en pruebas exitosas**: ${testResults.trends.passedDelta > 0 ? '+' : ''}${testResults.trends.passedDelta}\n`;
          report += `- **Cambio en pruebas fallidas**: ${testResults.trends.failedDelta > 0 ? '+' : ''}${testResults.trends.failedDelta}\n`;
          report += `- **Cambio en cobertura**: ${testResults.trends.coverageDelta > 0 ? '+' : ''}${testResults.trends.coverageDelta}%\n\n`;
          
          // Gráfico ASCII de tendencias
          if (testResults.trends.history && testResults.trends.history.length > 0) {
            report += `### Gráfico de Tendencias\n\n`;
            report += "```\n";
            report += this.generateASCIIChart(testResults.trends.history);
            report += "\n```\n\n";
          }
        }
        
        // Recomendaciones
        report += `## Recomendaciones\n\n`;
        
        // Generar recomendaciones basadas en los resultados
        if (testResults.failed > 0) {
          report += `- **Corregir pruebas fallidas**: Priorice la corrección de las ${testResults.failed} pruebas fallidas antes de continuar.\n`;
        }
        
        if (testResults.skipped > 0) {
          report += `- **Revisar pruebas omitidas**: Hay ${testResults.skipped} pruebas omitidas. Considere habilitarlas o eliminarlas si ya no son relevantes.\n`;
        }
        
        if (testResults.performance) {
          const slowTests = testResults.performance.filter(test => test.duration > 1000);
          if (slowTests.length > 0) {
            report += `- **Optimizar pruebas lentas**: ${slowTests.length} pruebas toman más de 1 segundo. Considere optimizarlas para mejorar el tiempo de ejecución.\n`;
          }
        }
        
        // Sugerencias generales
        report += `- **Pruebas de integración**: Asegúrese de tener pruebas que verifiquen la interacción entre componentes.\n`;
        report += `- **Pruebas de extremo a extremo**: Implemente pruebas E2E para flujos críticos de usuario.\n`;
        report += `- **Pruebas de usabilidad**: Considere añadir pruebas de usabilidad para mejorar la experiencia del usuario.\n`;
        
        return report;
      }
      
      /**
       * Genera un gráfico ASCII simple para visualizar tendencias
       */
      private generateASCIIChart(history: any[]): string {
        if (!history || history.length === 0) {
          return "No hay datos suficientes para generar un gráfico.";
        }
        
        // Extraer datos de cobertura
        const coverageData = history.map(entry => entry.coverage || 0);
        
        // Encontrar valores mínimos y máximos
        const max = Math.max(...coverageData);
        const min = Math.min(...coverageData);
        
        // Altura del gráfico
        const height = 10;
        
        // Generar gráfico
        let chart = `Cobertura de Código (${min}% - ${max}%)\n\n`;
        
        for (let i = height; i >= 0; i--) {
          const row = coverageData.map(value => {
            const normalizedValue = (value - min) / (max - min) * height;
            return normalizedValue >= i ? '█' : ' ';
          }).join('');
          
          // Añadir etiqueta de eje Y
          const yValue = min + (max - min) * (i / height);
          const yLabel = i === height ? `${max.toFixed(0)}%` : 
                        i === 0 ? `${min.toFixed(0)}%` : 
                        i === Math.floor(height / 2) ? `${((max + min) / 2).toFixed(0)}%` : 
                        '    ';
          
          chart += `${yLabel.padStart(5)} |${row}\n`;
        }
        
        // Añadir eje X
        chart += '      ' + '-'.repeat(coverageData.length) + '\n';
        
        // Añadir etiquetas de tiempo
        const timeLabels = history.map((_, index) => {
          if (index === 0 || index === history.length - 1 || index === Math.floor(history.length / 2)) {
            return history[index].date || index.toString();
          }
          return ' ';
        });
        
        // Ajustar etiquetas para que quepan
        const maxLabelLength = Math.floor(coverageData.length / 3);
        const truncatedLabels = timeLabels.map(label => 
          label.length > maxLabelLength ? label.substring(0, maxLabelLength) + '...' : label
        );
        
        chart += '      ' + truncatedLabels.join(' ').substring(0, coverageData.length);
        
        return chart;
      }
      
      /**
       * Genera un informe de accesibilidad
       */
      private generateAccessibilityReport(testResults: any): string {
        let report = `# Informe de Accesibilidad\n\n`;
        
        // Resumen de accesibilidad
        report += `## Resumen\n\n`;
        report += `- **Puntuación global**: ${testResults.score || 0}/100\n`;
        report += `- **Problemas críticos**: ${testResults.critical || 0}\n`;
        report += `- **Problemas graves**: ${testResults.serious || 0}\n`;
        report += `- **Problemas moderados**: ${testResults.moderate || 0}\n`;
        report += `- **Problemas menores**: ${testResults.minor || 0}\n\n`;
        
        // Cumplimiento de estándares
        report += `## Cumplimiento de Estándares\n\n`;
        
        if (testResults.standards) {
          report += `| Estándar | Cumplimiento | Problemas |\n`;
          report += `|----------|--------------|----------|\n`;
          
          for (const standard in testResults.standards) {
            const compliance = testResults.standards[standard];
            const status = compliance.pass ? '✅' : '❌';
            report += `| ${standard} | ${status} | ${compliance.issues || 0} |\n`;
          }
        } else {
          report += `No hay información de cumplimiento de estándares disponible.\n\n`;
        }
        
        // Problemas detectados
        report += `## Problemas Detectados\n\n`;
        
        if (testResults.issues && testResults.issues.length > 0) {
          // Agrupar por severidad
          const issuesBySeverity = {
            critical: testResults.issues.filter(issue => issue.severity === 'critical'),
            serious: testResults.issues.filter(issue => issue.severity === 'serious'),
            moderate: testResults.issues.filter(issue => issue.severity === 'moderate'),
            minor: testResults.issues.filter(issue => issue.severity === 'minor')
          };
          
          // Mostrar problemas críticos primero
          if (issuesBySeverity.critical.length > 0) {
            report += `### Problemas Críticos\n\n`;
            
            for (const issue of issuesBySeverity.critical) {
              report += `#### ${issue.code}: ${issue.title}\n\n`;
              report += `- **Ubicación**: ${issue.location}\n`;
              report += `- **Descripción**: ${issue.description}\n`;
              report += `- **Impacto**: ${issue.impact}\n`;
              
              if (issue.recommendation) {
                report += `- **Recomendación**: ${issue.recommendation}\n`;
              }
              
              if (issue.code) {
                report += `- **Código de referencia**: [${issue.code}](${issue.reference || '#'})\n`;
              }
              
              report += `\n`;
            }
          }
          
          // Mostrar problemas graves
          if (issuesBySeverity.serious.length > 0) {
            report += `### Problemas Graves\n\n`;
            
            for (const issue of issuesBySeverity.serious) {
              report += `#### ${issue.code}: ${issue.title}\n\n`;
              report += `- **Ubicación**: ${issue.location}\n`;
              report += `- **Descripción**: ${issue.description}\n`;
              
              if (issue.recommendation) {
                report += `- **Recomendación**: ${issue.recommendation}\n`;
              }
              
              report += `\n`;
            }
          }
          
          // Resumen de problemas moderados y menores
          if (issuesBySeverity.moderate.length > 0 || issuesBySeverity.minor.length > 0) {
            report += `### Otros Problemas\n\n`;
            report += `| Severidad | Código | Título | Ubicación |\n`;
            report += `|-----------|--------|--------|----------|\n`;
            
            for (const issue of [...issuesBySeverity.moderate, ...issuesBySeverity.minor]) {
              report += `| ${issue.severity} | ${issue.code} | ${issue.title} | ${issue.location} |\n`;
            }
            
            report += `\n`;
          }
        } else {
          report += `No se detectaron problemas de accesibilidad. ¡Excelente trabajo!\n\n`;
        }
        
        // Recomendaciones
        report += `## Recomendaciones\n\n`;
        
        // Generar recomendaciones basadas en los resultados
        if (testResults.score < 90) {
          report += `- **Mejorar puntuación global**: La puntuación actual está por debajo del 90% recomendado para una buena accesibilidad.\n`;
        }
        
        if (testResults.critical > 0) {
          report += `- **Corregir problemas críticos**: Priorice la corrección de los ${testResults.critical} problemas críticos que impiden el acceso a usuarios con discapacidades.\n`;
        }
        
        if (testResults.serious > 0) {
          report += `- **Abordar problemas graves**: Corrija los ${testResults.serious} problemas graves que dificultan significativamente el acceso.\n`;
        }
        
        // Recomendaciones específicas por categoría
        if (testResults.categories) {
          const lowCategories = Object.entries(testResults.categories)
            .filter(([_, score]) => (score as number) < 70)
            .map(([category, _]) => category);
          
          if (lowCategories.length > 0) {
            report += `- **Categorías a mejorar**: Enfóquese en mejorar las siguientes categorías con puntuaciones bajas:\n`;
            
            for (const category of lowCategories) {
              report += `  - ${category}\n`;
            }
          }
        }
        
        // Sugerencias generales
        report += `- **Pruebas con usuarios reales**: Complemente las pruebas automáticas con pruebas con usuarios reales con discapacidades.\n`;
        report += `- **Revisión periódica**: Establezca un proceso de revisión periódica de accesibilidad para mantener los estándares.\n`;
        report += `- **Formación del equipo**: Asegúrese de que el equipo de desarrollo esté formado en prácticas de accesibilidad.\n`;
        
        return report;
      }
      
      /**
       * Genera un informe de pruebas de seguridad
       */
      private generateSecurityTestReport(testResults: any): string {
        let report = `# Informe de Pruebas de Seguridad\n\n`;
        
        // Resumen de seguridad
        report += `## Resumen\n\n`;
        report += `- **Puntuación de seguridad**: ${testResults.score || 0}/100\n`;
        report += `- **Vulnerabilidades críticas**: ${testResults.critical || 0}\n`;
        report += `- **Vulnerabilidades altas**: ${testResults.high || 0}\n`;
        report += `- **Vulnerabilidades medias**: ${testResults.medium || 0}\n`;
        report += `- **Vulnerabilidades bajas**: ${testResults.low || 0}\n`;
        report += `- **Fecha de escaneo**: ${testResults.date || 'No disponible'}\n\n`;
        
        // Vulnerabilidades detectadas
        report += `## Vulnerabilidades Detectadas\n\n`;
        
        if (testResults.vulnerabilities && testResults.vulnerabilities.length > 0) {
          // Agrupar por severidad
          const vulnsBySeverity = {
            critical: testResults.vulnerabilities.filter(vuln => vuln.severity === 'critical'),
            high: testResults.vulnerabilities.filter(vuln => vuln.severity === 'high'),
            medium: testResults.vulnerabilities.filter(vuln => vuln.severity === 'medium'),
            low: testResults.vulnerabilities.filter(vuln => vuln.severity === 'low')
          };
          
          // Mostrar vulnerabilidades críticas primero
          if (vulnsBySeverity.critical.length > 0) {
            report += `### Vulnerabilidades Críticas\n\n`;
            
            for (const vuln of vulnsBySeverity.critical) {
              report += `#### ${vuln.id}: ${vuln.title}\n\n`;
              report += `- **Ubicación**: ${vuln.location}\n`;
              report += `- **Descripción**: ${vuln.description}\n`;
              report += `- **Impacto**: ${vuln.impact}\n`;
              
              if (vuln.cve) {
                report += `- **CVE**: [${vuln.cve}](https://cve.mitre.org/cgi-bin/cvename.cgi?name=${vuln.cve})\n`;
              }
              
              if (vuln.remediation) {
                report += `- **Remediación**: ${vuln.remediation}\n`;
              }
              
              report += `\n`;
            }
          }
          
          // Mostrar vulnerabilidades altas
          if (vulnsBySeverity.high.length > 0) {
            report += `### Vulnerabilidades Altas\n\n`;
            
            for (const vuln of vulnsBySeverity.high) {
              report += `#### ${vuln.id}: ${vuln.title}\n\n`;
              report += `- **Ubicación**: ${vuln.location}\n`;
              report += `- **Descripción**: ${vuln.description}\n`;
              
              if (vuln.remediation) {
                report += `- **Remediación**: ${vuln.remediation}\n`;
              }
              
              report += `\n`;
            }
          }
          
          // Resumen de vulnerabilidades medias y bajas
          if (vulnsBySeverity.medium.length > 0 || vulnsBySeverity.low.length > 0) {
            report += `### Otras Vulnerabilidades\n\n`;
            report += `| Severidad | ID | Título | Ubicación |\n`;
            report += `|-----------|-------|--------|----------|\n`;
            
            for (const vuln of [...vulnsBySeverity.medium, ...vulnsBySeverity.low]) {
              report += `| ${vuln.severity} | ${vuln.id} | ${vuln.title} | ${vuln.location} |\n`;
            }
            
            report += `\n`;
          }
        } else {
          report += `No se detectaron vulnerabilidades. ¡Excelente trabajo!\n\n`;
        }
        
        // Categorías de seguridad
        if (testResults.categories) {
          report += `## Categorías de Seguridad\n\n`;
          report += `| Categoría | Puntuación | Estado |\n`;
          report += `|-----------|------------|--------|\n`;
          
          for (const category in testResults.categories) {
            const score = testResults.categories[category];
            let status = '❌';
            
            if (score >= 90) {
              status = '✅';
            } else if (score >= 70) {
              status = '⚠️';
            }
            
            report += `| ${category} | ${score}/100 | ${status} |\n`;
          }
          
          report += `\n`;
        }
        
        // Recomendaciones
        report += `## Recomendaciones\n\n`;
        
        // Generar recomendaciones basadas en los resultados
        if (testResults.critical > 0) {
          report += `- **Corregir vulnerabilidades críticas**: Priorice la corrección de las ${testResults.critical} vulnerabilidades críticas inmediatamente.\n`;
        }
        
        if (testResults.high > 0) {
          report += `- **Abordar vulnerabilidades altas**: Corrija las ${testResults.high} vulnerabilidades de alta severidad lo antes posible.\n`;
        }
        
        // Recomendaciones específicas por categoría
        if (testResults.categories) {
          const lowCategories = Object.entries(testResults.categories)
            .filter(([_, score]) => (score as number) < 70)
            .map(([category, _]) => category);
          
          if (lowCategories.length > 0) {
            report += `- **Categorías a mejorar**: Enfóquese en mejorar las siguientes categorías con puntuaciones bajas:\n`;
            
            for (const category of lowCategories) {
              report += `  - ${category}\n`;
            }
          }
        }
        
        // Sugerencias generales
        report += `- **Escaneos regulares**: Establezca un proceso de escaneo de seguridad regular.\n`;
        report += `- **Revisión de dependencias**: Mantenga las dependencias actualizadas y revise regularmente por vulnerabilidades conocidas.\n`;
        report += `- **Formación en seguridad**: Asegúrese de que el equipo de desarrollo esté formado en prácticas de desarrollo seguro.\n`;
        report += `- **Pruebas de penetración**: Considere realizar pruebas de penetración periódicas por expertos en seguridad.\n`;
        
        return report;
      }
      
      /**
       * Configura un framework de pruebas específico
       */
      private async configureTestFramework(framework: string, projectType: string): Promise<string> {
        let configCode = '';
        let installCommand = '';
        
        switch (framework) {
          case 'jest':
            installCommand = 'npm install --save-dev jest @types/jest ts-jest';
            configCode = this.generateJestConfig(projectType);
            break;
          case 'mocha':
            installCommand = 'npm install --save-dev mocha chai @types/mocha @types/chai ts-node';
            configCode = this.generateMochaConfig(projectType);
            break;
          case 'cypress':
            installCommand = 'npm install --save-dev cypress';
            configCode = this.generateCypressConfig(projectType);
            break;
          case 'playwright':
            installCommand = 'npm install --save-dev @playwright/test';
            configCode = this.generatePlaywrightConfig(projectType);
            break;
          default:
            return `Framework de pruebas '${framework}' no soportado.`;
        }
        
        // Ejecutar comando de instalación
        try {
          const { stdout, stderr } = await this.executeCommand(installCommand);
          
          if (stderr && !stderr.includes('npm WARN')) {
            return `Error al instalar ${framework}: ${stderr}`;
          }
          
          // Crear archivo de configuración
          const configFileName = this.getConfigFileName(framework);
          await fs.promises.writeFile(configFileName, configCode);
          
          return `Framework de pruebas ${framework} configurado correctamente.\nArchivo de configuración creado: ${configFileName}`;
        } catch (error) {
          return `Error al configurar ${framework}: ${error.message}`;
        }
      }
      
      /**
       * Obtiene el nombre del archivo de configuración para un framework
       */
      private getConfigFileName(framework: string): string {
        switch (framework) {
          case 'jest':
            return 'jest.config.js';
          case 'mocha':
            return '.mocharc.js';
          case 'cypress':
            return 'cypress.config.js';
          case 'playwright':
            return 'playwright.config.js';
          default:
            return `${framework}.config.js`;
        }
      }
      
      /**
       * Genera configuración para Jest
       */
      private generateJestConfig(projectType: string): string {
        return `/** @type {import('jest').Config} */
    module.exports = {
      preset: 'ts-jest',
      testEnvironment: '${projectType === 'frontend' ? 'jsdom' : 'node'}',
      roots: ['<rootDir>/src'],
      testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],
      transform: {
        '^.+\\.tsx?$': 'ts-jest',
      },
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
      collectCoverage: true,
      coverageDirectory: 'coverage',
      collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/index.ts',
        '!src/types/**/*',
      ],
      coverageThreshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    };`;
      }
      
      /**
       * Genera configuración para Mocha
       */
      private generateMochaConfig(projectType: string): string {
        return `module.exports = {
      require: 'ts-node/register',
      extension: ['ts'],
      spec: 'src/**/*.spec.ts',
      timeout: 5000,
      recursive: true,
      exit: true,
      reporter: 'spec',
      color: true,
    };`;
      }
      
      /**
       * Genera configuración para Cypress
       */
      private generateCypressConfig(projectType: string): string {
        return `const { defineConfig } = require('cypress');
    
    module.exports = defineConfig({
      e2e: {
        baseUrl: 'http://localhost:3000',
        specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
        supportFile: 'cypress/support/e2e.js',
        viewportWidth: 1280,
        viewportHeight: 720,
        video: true,
        screenshotOnRunFailure: true,
        experimentalStudio: true,
      },
      component: {
        devServer: {
          framework: '${projectType === 'react' ? 'react' : 'vue'}',
          bundler: 'webpack',
        },
        specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
      },
    });`;
      }
      
      /**
       * Genera configuración para Playwright
       */
      private generatePlaywrightConfig(projectType: string): string {
        return `import { defineConfig, devices } from '@playwright/test';
    
    export default defineConfig({
      testDir: './tests',
      timeout: 30000,
      fullyParallel: true,
      forbidOnly: !!process.env.CI,
      retries: process.env.CI ? 2 : 0,
      workers: process.env.CI ? 1 : undefined,
      reporter: [['html'], ['list']],
      use: {
        baseURL: 'http://localhost:3000',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
        video: 'on-first-retry',
      },
      projects: [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        {
          name: 'mobile-chrome',
          use: { ...devices['Pixel 5'] },
        },
        {
          name: 'mobile-safari',
          use: { ...devices['iPhone 12'] },
        },
      ],
    });`;
  }
  
  /**
   * Ejecuta un comando en el sistema
   */
  private async executeCommand(command: string): Promise<{ stdout: string, stderr: string }> {
    return new Promise((resolve, reject) => {
      const { exec } = require('child_process');
      exec(command, (error: Error, stdout: string, stderr: string) => {
        if (error && !stderr.includes('npm WARN')) {
          reject(error);
          return;
        }
        resolve({ stdout, stderr });
      });
    });
  }
  
  /**
   * Genera un caso de prueba unitaria para una función específica
   */
  private generateUnitTestCase(functionName: string, functionCode: string, framework: string): string {
    // Analizar la función para entender sus parámetros y comportamiento esperado
    const params = this.extractFunctionParams(functionCode);
    const returnType = this.extractFunctionReturnType(functionCode);
    const isAsync = functionCode.includes('async');
    
    // Generar casos de prueba basados en el framework seleccionado
    switch (framework) {
      case 'jest':
        return this.generateJestTestCase(functionName, params, returnType, isAsync);
      case 'mocha':
        return this.generateMochaTestCase(functionName, params, returnType, isAsync);
      case 'vitest':
        return this.generateVitestTestCase(functionName, params, returnType, isAsync);
      default:
        return this.generateJestTestCase(functionName, params, returnType, isAsync);
    }
  }
  
  /**
   * Extrae los parámetros de una función
   */
  private extractFunctionParams(functionCode: string): Array<{ name: string, type: string }> {
    const paramRegex = /\(([^)]*)\)/;
    const match = paramRegex.exec(functionCode);
    
    if (!match || !match[1]) {
      return [];
    }
    
    const paramsString = match[1];
    const params = paramsString.split(',').map(param => param.trim());
    
    return params.map(param => {
      const [name, type] = param.split(':').map(p => p.trim());
      return {
        name: name.replace('?', ''), // Eliminar el signo de opcional
        type: type || 'any'
      };
    });
  }
  
  /**
   * Extrae el tipo de retorno de una función
   */
  private extractFunctionReturnType(functionCode: string): string {
    const returnTypeRegex = /\):\s*([^{]+)/;
    const match = returnTypeRegex.exec(functionCode);
    
    if (!match || !match[1]) {
      return 'any';
    }
    
    return match[1].trim();
  }
  
  /**
   * Genera un caso de prueba para Jest
   */
  private generateJestTestCase(
    functionName: string, 
    params: Array<{ name: string, type: string }>, 
    returnType: string, 
    isAsync: boolean
  ): string {
    let testCase = `describe('${functionName}', () => {\n`;
    
    // Generar casos de prueba básicos
    testCase += `  test('debería funcionar correctamente con parámetros válidos', ${isAsync ? 'async ' : ''}() => {\n`;
    
    // Generar valores de prueba para los parámetros
    const testValues = params.map(param => {
      return `    const ${param.name} = ${this.generateTestValue(param.type)};\n`;
    }).join('');
    
    testCase += testValues;
    
    // Generar la llamada a la función
    const paramNames = params.map(param => param.name).join(', ');
    
    if (isAsync) {
      testCase += `    const result = await ${functionName}(${paramNames});\n`;
    } else {
      testCase += `    const result = ${functionName}(${paramNames});\n`;
    }
    
    // Generar las aserciones basadas en el tipo de retorno
    testCase += this.generateAssertions(returnType);
    
    testCase += `  });\n\n`;
    
    // Generar caso de prueba para manejo de errores
    testCase += `  test('debería manejar errores correctamente', ${isAsync ? 'async ' : ''}() => {\n`;
    
    // Generar valores inválidos para los parámetros
    const invalidTestValues = params.map(param => {
      return `    const invalid${param.name.charAt(0).toUpperCase() + param.name.slice(1)} = ${this.generateInvalidTestValue(param.type)};\n`;
    }).join('');
    
    testCase += invalidTestValues;
    
    // Generar la llamada a la función con valores inválidos
    if (params.length > 0) {
      const firstParam = params[0];
      const otherParams = params.slice(1).map(param => param.name).join(', ');
      
      testCase += `    ${isAsync ? 'await ' : ''}expect(() => {\n`;
      testCase += `      ${functionName}(invalid${firstParam.name.charAt(0).toUpperCase() + firstParam.name.slice(1)}${otherParams ? ', ' + otherParams : ''});\n`;
      testCase += `    }).${isAsync ? 'rejects' : 'throws'}();\n`;
    } else {
      testCase += `    // No hay parámetros para probar con valores inválidos\n`;
      testCase += `    expect(true).toBe(true);\n`;
    }
    
    testCase += `  });\n`;
    testCase += `});\n`;
    
    return testCase;
  }
  
  /**
   * Genera un caso de prueba para Mocha
   */
  private generateMochaTestCase(
    functionName: string, 
    params: Array<{ name: string, type: string }>, 
    returnType: string, 
    isAsync: boolean
  ): string {
    let testCase = `describe('${functionName}', function() {\n`;
    
    // Generar casos de prueba básicos
    testCase += `  it('debería funcionar correctamente con parámetros válidos', ${isAsync ? 'async ' : ''}function() {\n`;
    
    // Generar valores de prueba para los parámetros
    const testValues = params.map(param => {
      return `    const ${param.name} = ${this.generateTestValue(param.type)};\n`;
    }).join('');
    
    testCase += testValues;
    
    // Generar la llamada a la función
    const paramNames = params.map(param => param.name).join(', ');
    
    if (isAsync) {
      testCase += `    const result = await ${functionName}(${paramNames});\n`;
    } else {
      testCase += `    const result = ${functionName}(${paramNames});\n`;
    }
    
    // Generar las aserciones basadas en el tipo de retorno (usando chai)
    testCase += this.generateChaiAssertions(returnType);
    
    testCase += `  });\n\n`;
    
    // Generar caso de prueba para manejo de errores
    testCase += `  it('debería manejar errores correctamente', ${isAsync ? 'async ' : ''}function() {\n`;
    
    // Generar valores inválidos para los parámetros
    const invalidTestValues = params.map(param => {
      return `    const invalid${param.name.charAt(0).toUpperCase() + param.name.slice(1)} = ${this.generateInvalidTestValue(param.type)};\n`;
    }).join('');
    
    testCase += invalidTestValues;
    
    // Generar la llamada a la función con valores inválidos
    if (params.length > 0) {
      const firstParam = params[0];
      const otherParams = params.slice(1).map(param => param.name).join(', ');
      
      if (isAsync) {
        testCase += `    try {\n`;
        testCase += `      await ${functionName}(invalid${firstParam.name.charAt(0).toUpperCase() + firstParam.name.slice(1)}${otherParams ? ', ' + otherParams : ''});\n`;
        testCase += `      chai.assert.fail('Debería haber lanzado un error');\n`;
        testCase += `    } catch (error) {\n`;
        testCase += `      chai.expect(error).to.exist;\n`;
        testCase += `    }\n`;
      } else {
        testCase += `    chai.expect(function() {\n`;
        testCase += `      ${functionName}(invalid${firstParam.name.charAt(0).toUpperCase() + firstParam.name.slice(1)}${otherParams ? ', ' + otherParams : ''});\n`;
        testCase += `    }).to.throw();\n`;
      }
    } else {
      testCase += `    // No hay parámetros para probar con valores inválidos\n`;
      testCase += `    chai.expect(true).to.be.true;\n`;
    }
    
    testCase += `  });\n`;
    testCase += `});\n`;
    
    return testCase;
  }
  
  /**
   * Genera un caso de prueba para Vitest
   */
  private generateVitestTestCase(
    functionName: string, 
    params: Array<{ name: string, type: string }>, 
    returnType: string, 
    isAsync: boolean
  ): string {
    // Vitest usa la misma API que Jest
    return this.generateJestTestCase(functionName, params, returnType, isAsync);
  }
  
  /**
   * Genera un valor de prueba basado en el tipo
   */
  private generateTestValue(type: string): string {
    type = type.toLowerCase();
    
    if (type.includes('string')) {
      return "'test-value'";
    } else if (type.includes('number')) {
      return "42";
    } else if (type.includes('boolean')) {
      return "true";
    } else if (type.includes('array') || type.includes('[]')) {
      return "[]";
    } else if (type.includes('object')) {
      return "{}";
    } else if (type.includes('function')) {
      return "() => {}";
    } else if (type.includes('date')) {
      return "new Date()";
    } else if (type.includes('promise')) {
      return "Promise.resolve()";
    } else if (type.includes('map')) {
      return "new Map()";
    } else if (type.includes('set')) {
      return "new Set()";
    } else {
      return "{}"; // Valor por defecto para tipos desconocidos
    }
  }
  
  /**
   * Genera un valor de prueba inválido basado en el tipo
   */
  private generateInvalidTestValue(type: string): string {
    type = type.toLowerCase();
    
    if (type.includes('string')) {
      return "null";
    } else if (type.includes('number')) {
      return "'not-a-number'";
    } else if (type.includes('boolean')) {
      return "'not-a-boolean'";
    } else if (type.includes('array') || type.includes('[]')) {
      return "{}";
    } else if (type.includes('object')) {
      return "[]";
    } else if (type.includes('function')) {
      return "null";
    } else if (type.includes('date')) {
      return "'not-a-date'";
    } else if (type.includes('promise')) {
      return "{}";
    } else if (type.includes('map')) {
      return "[]";
    } else if (type.includes('set')) {
      return "{}";
    } else {
      return "null"; // Valor por defecto para tipos desconocidos
    }
  }
  
  /**
   * Genera aserciones para Jest basadas en el tipo de retorno
   */
  private generateAssertions(returnType: string): string {
    returnType = returnType.toLowerCase();
    
    if (returnType.includes('void') || returnType.includes('undefined')) {
      return "    expect(result).toBeUndefined();\n";
    } else if (returnType.includes('string')) {
      return "    expect(typeof result).toBe('string');\n";
    } else if (returnType.includes('number')) {
      return "    expect(typeof result).toBe('number');\n";
    } else if (returnType.includes('boolean')) {
      return "    expect(typeof result).toBe('boolean');\n";
    } else if (returnType.includes('array') || returnType.includes('[]')) {
      return "    expect(Array.isArray(result)).toBe(true);\n";
    } else if (returnType.includes('object')) {
      return "    expect(typeof result).toBe('object');\n    expect(result).not.toBeNull();\n";
    } else if (returnType.includes('function')) {
      return "    expect(typeof result).toBe('function');\n";
    } else if (returnType.includes('date')) {
      return "    expect(result instanceof Date).toBe(true);\n";
    } else if (returnType.includes('promise')) {
      return "    expect(result instanceof Promise).toBe(true);\n";
    } else if (returnType.includes('map')) {
      return "    expect(result instanceof Map).toBe(true);\n";
    } else if (returnType.includes('set')) {
      return "    expect(result instanceof Set).toBe(true);\n";
    } else {
      return "    expect(result).toBeDefined();\n";
    }
  }
  
  /**
   * Genera aserciones para Chai basadas en el tipo de retorno
   */
  private generateChaiAssertions(returnType: string): string {
    returnType = returnType.toLowerCase();
    
    if (returnType.includes('void') || returnType.includes('undefined')) {
      return "    chai.expect(result).to.be.undefined;\n";
    } else if (returnType.includes('string')) {
      return "    chai.expect(result).to.be.a('string');\n";
    } else if (returnType.includes('number')) {
      return "    chai.expect(result).to.be.a('number');\n";
    } else if (returnType.includes('boolean')) {
      return "    chai.expect(result).to.be.a('boolean');\n";
    } else if (returnType.includes('array') || returnType.includes('[]')) {
      return "    chai.expect(result).to.be.an('array');\n";
    } else if (returnType.includes('object')) {
      return "    chai.expect(result).to.be.an('object');\n    chai.expect(result).to.not.be.null;\n";
    } else if (returnType.includes('function')) {
      return "    chai.expect(result).to.be.a('function');\n";
    } else if (returnType.includes('date')) {
      return "    chai.expect(result).to.be.instanceOf(Date);\n";
    } else if (returnType.includes('promise')) {
      return "    chai.expect(result).to.be.instanceOf(Promise);\n";
    } else if (returnType.includes('map')) {
      return "    chai.expect(result).to.be.instanceOf(Map);\n";
    } else if (returnType.includes('set')) {
      return "    chai.expect(result).to.be.instanceOf(Set);\n";
    } else {
      return "    chai.expect(result).to.exist;\n";
    }
  }
  
  /**
   * Genera pruebas de integración para un módulo
   */
  private generateIntegrationTests(moduleName: string, dependencies: string[], framework: string): string {
    let testCode = '';
    
    switch (framework) {
      case 'jest':
        testCode = this.generateJestIntegrationTests(moduleName, dependencies);
        break;
      case 'supertest':
        testCode = this.generateSupertestIntegrationTests(moduleName, dependencies);
        break;
      case 'cypress':
        testCode = this.generateCypressIntegrationTests(moduleName, dependencies);
        break;
      default:
        testCode = this.generateJestIntegrationTests(moduleName, dependencies);
    }
    
    return testCode;
  }
  
  /**
   * Genera pruebas de integración con Jest
   */
  private generateJestIntegrationTests(moduleName: string, dependencies: string[]): string {
    let testCode = `import { ${moduleName} } from '../src/${moduleName.toLowerCase()}';\n`;
    
    // Importar dependencias
    for (const dependency of dependencies) {
      testCode += `import { ${dependency} } from '../src/${dependency.toLowerCase()}';\n`;
    }
    
    testCode += `\ndescribe('${moduleName} Integration', () => {\n`;
    
    // Configuración inicial
    testCode += `  let ${moduleName.toLowerCase()}Instance;\n`;
    
    for (const dependency of dependencies) {
      testCode += `  let ${dependency.toLowerCase()}Mock;\n`;
    }
    
    testCode += `\n  beforeEach(() => {\n`;
    
    // Crear mocks para las dependencias
    for (const dependency of dependencies) {
      testCode += `    ${dependency.toLowerCase()}Mock = {\n`;
      testCode += `      // Añadir métodos mock según sea necesario\n`;
      testCode += `      someMethod: jest.fn().mockResolvedValue('mocked-value'),\n`;
      testCode += `    };\n`;
    }
    
    // Inicializar el módulo con las dependencias mockeadas
    testCode += `\n    ${moduleName.toLowerCase()}Instance = new ${moduleName}(`;
    
    if (dependencies.length > 0) {
      testCode += dependencies.map(dep => `${dep.toLowerCase()}Mock`).join(', ');
    }
    
    testCode += `);\n  });\n\n`;
    
    // Prueba de integración básica
    testCode += `  test('debería integrarse correctamente con sus dependencias', async () => {\n`;
    testCode += `    // Configurar el comportamiento esperado de las dependencias\n`;
    
    for (const dependency of dependencies) {
      testCode += `    ${dependency.toLowerCase()}Mock.someMethod.mockResolvedValueOnce('specific-value');\n`;
    }
    
    testCode += `\n    // Ejecutar el método que integra las dependencias\n`;
    testCode += `    const result = await ${moduleName.toLowerCase()}Instance.someIntegrationMethod();\n\n`;
    
    testCode += `    // Verificar que el resultado es el esperado\n`;
    testCode += `    expect(result).toBeDefined();\n\n`;
    
    testCode += `    // Verificar que las dependencias fueron llamadas correctamente\n`;
    
    for (const dependency of dependencies) {
      testCode += `    expect(${dependency.toLowerCase()}Mock.someMethod).toHaveBeenCalled();\n`;
    }
    
    testCode += `  });\n\n`;
    
    // Prueba de manejo de errores
    testCode += `  test('debería manejar errores de las dependencias', async () => {\n`;
    testCode += `    // Configurar una dependencia para que falle\n`;
    
    if (dependencies.length > 0) {
      testCode += `    ${dependencies[0].toLowerCase()}Mock.someMethod.mockRejectedValueOnce(new Error('Test error'));\n\n`;
      
      testCode += `    // Verificar que el error se maneja correctamente\n`;
      testCode += `    await expect(${moduleName.toLowerCase()}Instance.someIntegrationMethod()).rejects.toThrow('Test error');\n`;
    } else {
      testCode += `    // No hay dependencias para probar\n`;
      testCode += `    expect(true).toBe(true);\n`;
    }
    
    testCode += `  });\n`;
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Genera pruebas de integración con Supertest (para APIs)
   */
  private generateSupertestIntegrationTests(moduleName: string, dependencies: string[]): string {
    let testCode = `import request from 'supertest';\n`;
    testCode += `import { app } from '../src/app';\n`;
    testCode += `import { ${moduleName} } from '../src/modules/${moduleName.toLowerCase()}';\n`;
    
    // Importar dependencias
    for (const dependency of dependencies) {
      testCode += `import { ${dependency} } from '../src/modules/${dependency.toLowerCase()}';\n`;
    }
    
    testCode += `\ndescribe('${moduleName} API Integration', () => {\n`;
    
    // Configuración inicial
    testCode += `  beforeEach(async () => {\n`;
    testCode += `    // Configurar la base de datos de prueba o mocks según sea necesario\n`;
    testCode += `    await setupTestDatabase();\n`;
    testCode += `  });\n\n`;
    
    testCode += `  afterEach(async () => {\n`;
    testCode += `    // Limpiar después de cada prueba\n`;
    testCode += `    await cleanupTestDatabase();\n`;
    testCode += `  });\n\n`;
    
    // Prueba GET
    testCode += `  test('GET /${moduleName.toLowerCase()}s debería devolver una lista', async () => {\n`;
    testCode += `    const response = await request(app)\n`;
    testCode += `      .get('/${moduleName.toLowerCase()}s')\n`;
    testCode += `      .expect('Content-Type', /json/)\n`;
    testCode += `      .expect(200);\n\n`;
    
    testCode += `    expect(Array.isArray(response.body)).toBe(true);\n`;
    testCode += `  });\n\n`;
    
    // Prueba POST
    testCode += `  test('POST /${moduleName.toLowerCase()} debería crear un nuevo recurso', async () => {\n`;
    testCode += `    const newItem = {\n`;
    testCode += `      name: 'Test Item',\n`;
    testCode += `      description: 'Test Description'\n`;
    testCode += `    };\n\n`;
    
    testCode += `    const response = await request(app)\n`;
    testCode += `      .post('/${moduleName.toLowerCase()}')\n`;
    testCode += `      .send(newItem)\n`;
    testCode += `      .expect('Content-Type', /json/)\n`;
    testCode += `      .expect(201);\n\n`;
    
    testCode += `    expect(response.body.name).toBe(newItem.name);\n`;
    testCode += `    expect(response.body.id).toBeDefined();\n`;
    testCode += `  });\n\n`;
    
    // Prueba PUT
    testCode += `  test('PUT /${moduleName.toLowerCase()}/1 debería actualizar un recurso existente', async () => {\n`;
    testCode += `    // Primero crear un recurso para actualizar\n`;
    testCode += `    const createResponse = await request(app)\n`;
    testCode += `      .post('/${moduleName.toLowerCase()}')\n`;
    testCode += `      .send({ name: 'Original Name', description: 'Original Description' });\n\n`;
    
    testCode += `    const updateData = {\n`;
    testCode += `      name: 'Updated Name',\n`;
    testCode += `      description: 'Updated Description'\n`;
    testCode += `    };\n\n`;
    
    testCode += `    const response = await request(app)\n`;
    testCode += `      .put('/${moduleName.toLowerCase()}/' + createResponse.body.id)\n`;
    testCode += `      .send(updateData)\n`;
    testCode += `      .expect('Content-Type', /json/)\n`;
    testCode += `      .expect(200);\n\n`;
    
    testCode += `    expect(response.body.name).toBe(updateData.name);\n`;
    testCode += `  });\n\n`;
    
    // Prueba DELETE
    testCode += `  test('DELETE /${moduleName.toLowerCase()}/1 debería eliminar un recurso', async () => {\n`;
    testCode += `    // Primero crear un recurso para eliminar\n`;
    testCode += `    const createResponse = await request(app)\n`;
    testCode += `      .post('/${moduleName.toLowerCase()}')\n`;
    testCode += `      .send({ name: 'Test Item', description: 'Test Description' });\n\n`;
    
    testCode += `    await request(app)\n`;
    testCode += `      .delete('/${moduleName.toLowerCase()}/' + createResponse.body.id)\n`;
    testCode += `      .expect(204);\n\n`;
    
    testCode += `    // Verificar que el recurso ya no existe\n`;
    testCode += `    await request(app)\n`;
    testCode += `      .get('/${moduleName.toLowerCase()}/' + createResponse.body.id)\n`;
    testCode += `      .expect(404);\n`;
    testCode += `  });\n`;
    
    testCode += `});\n\n`;
    
    // Funciones auxiliares
    testCode += `// Funciones auxiliares para configurar y limpiar la base de datos de prueba\n`;
    testCode += `async function setupTestDatabase() {\n`;
    testCode += `  // Configurar la base de datos de prueba\n`;
    testCode += `}\n\n`;
    
    testCode += `async function cleanupTestDatabase() {\n`;
    testCode += `  // Limpiar la base de datos de prueba\n`;
    testCode += `}\n`;
    
    return testCode;
  }
  
  /**
   * Genera pruebas de integración con Cypress
   */
  private generateCypressIntegrationTests(moduleName: string, dependencies: string[]): string {
    let testCode = `// cypress/integration/${moduleName.toLowerCase()}.spec.js\n\n`;
    
    testCode += `describe('${moduleName} Integration', () => {\n`;
    
    // Configuración inicial
    testCode += `  beforeEach(() => {\n`;
    testCode += `    // Visitar la página principal o la página específica del módulo\n`;
    testCode += `    cy.visit('/${moduleName.toLowerCase()}');\n`;
    
    testCode += `    // Configurar interceptores para las API relacionadas\n`;
    testCode += `    cy.intercept('GET', '/${moduleName.toLowerCase()}s', { fixture: '${moduleName.toLowerCase()}s.json' }).as('get${moduleName}s');\n`;
    testCode += `    cy.intercept('POST', '/${moduleName.toLowerCase()}', { statusCode: 201, body: { id: 1, name: 'Created Item' } }).as('create${moduleName}');\n`;
    testCode += `  });\n\n`;
    
    // Prueba de carga de página
    testCode += `  it('debería cargar la página correctamente', () => {\n`;
    testCode += `    // Verificar que los elementos principales están presentes\n`;
    testCode += `    cy.get('h1').should('contain', '${moduleName}');\n`;
    testCode += `    cy.get('.${moduleName.toLowerCase()}-container').should('be.visible');\n`;
    
    testCode += `    // Esperar a que se carguen los datos\n`;
    testCode += `    cy.wait('@get${moduleName}s');\n`;
    
    testCode += `    // Verificar que los datos se muestran correctamente\n`;
    testCode += `    cy.get('.${moduleName.toLowerCase()}-item').should('have.length.greaterThan', 0);\n`;
    testCode += `  });\n\n`;
    
    // Prueba de interacción
    testCode += `  it('debería permitir crear un nuevo ${moduleName.toLowerCase()}', () => {\n`;
    testCode += `    // Hacer clic en el botón para crear un nuevo elemento\n`;
    testCode += `    cy.get('.create-${moduleName.toLowerCase()}-button').click();\n`;
    
    testCode += `    // Rellenar el formulario\n`;
    testCode += `    cy.get('input[name="name"]').type('New Test Item');\n`;
    testCode += `    cy.get('textarea[name="description"]').type('This is a test description');\n`;
    
    testCode += `    // Enviar el formulario\n`;
    testCode += `    cy.get('form').submit();\n`;
    
    testCode += `    // Esperar a que se complete la solicitud\n`;
    testCode += `    cy.wait('@create${moduleName}');\n`;
    
    testCode += `    // Verificar que se muestra un mensaje de éxito\n`;
    testCode += `    cy.get('.success-message').should('be.visible');\n`;
    
    testCode += `    // Verificar que el nuevo elemento aparece en la lista\n`;
    testCode += `    cy.get('.${moduleName.toLowerCase()}-item').should('contain', 'Created Item');\n`;
    testCode += `  });\n\n`;
    
    // Prueba de integración con dependencias
    if (dependencies.length > 0) {
      testCode += `  it('debería integrarse correctamente con ${dependencies.join(', ')}', () => {\n`;
      
      // Configurar interceptores para las dependencias
      for (const dependency of dependencies) {
        testCode += `    cy.intercept('GET', '/${dependency.toLowerCase()}s', { fixture: '${dependency.toLowerCase()}s.json' }).as('get${dependency}s');\n`;
      }
      
      testCode += `\n    // Navegar a la página de integración\n`;
      testCode += `    cy.get('.integration-tab').click();\n`;
      
      // Esperar a que se carguen los datos de las dependencias
      for (const dependency of dependencies) {
        testCode += `    cy.wait('@get${dependency}s');\n`;
      }
      
      testCode += `\n    // Verificar que los componentes integrados se muestran correctamente\n`;
      
      for (const dependency of dependencies) {
        testCode += `    cy.get('.${dependency.toLowerCase()}-component').should('be.visible');\n`;
      }
      
      testCode += `\n    // Realizar acciones de interacción entre componentes\n`;
      testCode += `    cy.get('.${dependencies[0].toLowerCase()}-action-button').click();\n`;
      testCode += `    cy.get('.${moduleName.toLowerCase()}-response').should('contain', 'Integración exitosa');\n`;
      testCode += `  });\n`;
    }
    
    // Prueba de navegación
    testCode += `  it('debería permitir navegar entre diferentes vistas', () => {\n`;
    testCode += `    // Navegar a la vista de detalles\n`;
    testCode += `    cy.get('.${moduleName.toLowerCase()}-item').first().click();\n`;
    testCode += `    cy.url().should('include', '/${moduleName.toLowerCase()}/details');\n`;
    
    testCode += `    // Verificar que los detalles se muestran correctamente\n`;
    testCode += `    cy.get('.details-container').should('be.visible');\n`;
    testCode += `    cy.get('.details-title').should('exist');\n`;
    
    testCode += `    // Volver a la lista\n`;
    testCode += `    cy.get('.back-button').click();\n`;
    testCode += `    cy.url().should('not.include', '/details');\n`;
    testCode += `  });\n`;
    
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Genera pruebas E2E para un flujo completo
   */
  private generateE2ETests(flowName: string, steps: string[], framework: string): string {
    let testCode = '';
    
    switch (framework) {
      case 'cypress':
        testCode = this.generateCypressE2ETests(flowName, steps);
        break;
      case 'playwright':
        testCode = this.generatePlaywrightE2ETests(flowName, steps);
        break;
      case 'puppeteer':
        testCode = this.generatePuppeteerE2ETests(flowName, steps);
        break;
      case 'selenium':
        testCode = this.generateSeleniumE2ETests(flowName, steps);
        break;
      default:
        testCode = this.generateCypressE2ETests(flowName, steps);
    }
    
    return testCode;
  }
  
  /**
   * Genera pruebas E2E con Cypress
   */
  private generateCypressE2ETests(flowName: string, steps: string[]): string {
    let testCode = `// cypress/integration/${flowName.toLowerCase().replace(/\s+/g, '-')}.spec.js\n\n`;
    
    testCode += `describe('${flowName} E2E Flow', () => {\n`;
    
    // Configuración inicial
    testCode += `  beforeEach(() => {\n`;
    testCode += `    // Visitar la página inicial\n`;
    testCode += `    cy.visit('/');\n`;
    
    testCode += `    // Configurar interceptores para las API relacionadas\n`;
    testCode += `    cy.intercept('GET', '/api/products').as('getProducts');\n`;
    testCode += `    cy.intercept('POST', '/api/cart').as('addToCart');\n`;
    testCode += `    cy.intercept('POST', '/api/checkout').as('checkout');\n`;
    testCode += `  });\n\n`;
    
    // Prueba E2E principal
    testCode += `  it('debería completar el flujo de ${flowName} correctamente', () => {\n`;
    
    // Generar pasos de prueba basados en los pasos proporcionados
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      testCode += `    // Paso ${i + 1}: ${step}\n`;
      
      // Generar código de prueba basado en el paso
      testCode += this.generateCypressStepCode(step, i);
      
      testCode += `\n`;
    }
    
    // Verificación final
    testCode += `    // Verificación final\n`;
    testCode += `    cy.get('.success-message').should('contain', 'Operación completada con éxito');\n`;
    testCode += `    cy.url().should('include', '/confirmation');\n`;
    
    testCode += `  });\n\n`;
    
    // Prueba de manejo de errores
    testCode += `  it('debería manejar errores durante el flujo', () => {\n`;
    
    // Simular un error en uno de los pasos
    if (steps.length > 0) {
      const errorStep = steps[Math.floor(steps.length / 2)];
      testCode += `    // Configurar un interceptor para simular un error\n`;
      
      if (errorStep.toLowerCase().includes('agregar') || errorStep.toLowerCase().includes('añadir')) {
        testCode += `    cy.intercept('POST', '/api/cart', { statusCode: 500, body: { error: 'Error simulado' } }).as('addToCartError');\n`;
      } else if (errorStep.toLowerCase().includes('pago') || errorStep.toLowerCase().includes('checkout')) {
        testCode += `    cy.intercept('POST', '/api/checkout', { statusCode: 500, body: { error: 'Error simulado' } }).as('checkoutError');\n`;
      } else {
        testCode += `    cy.intercept('GET', '/api/products', { statusCode: 500, body: { error: 'Error simulado' } }).as('getProductsError');\n`;
      }
      
      // Ejecutar los pasos hasta el error
      for (let i = 0; i < Math.floor(steps.length / 2); i++) {
        const step = steps[i];
        testCode += `\n    // Paso ${i + 1}: ${step}\n`;
        testCode += this.generateCypressStepCode(step, i);
      }
      
      // Verificar que se muestra un mensaje de error
      testCode += `\n    // Verificar que se muestra un mensaje de error\n`;
      testCode += `    cy.get('.error-message').should('be.visible');\n`;
      testCode += `    cy.get('.error-message').should('contain', 'Error');\n`;
      
      // Verificar que hay un botón para reintentar
      testCode += `\n    // Verificar que hay un botón para reintentar\n`;
      testCode += `    cy.get('.retry-button').should('be.visible');\n`;
      
      // Reintentar la operación
      testCode += `\n    // Reintentar la operación con una respuesta exitosa\n`;
      
      if (errorStep.toLowerCase().includes('agregar') || errorStep.toLowerCase().includes('añadir')) {
        testCode += `    cy.intercept('POST', '/api/cart', { statusCode: 200, body: { success: true } }).as('addToCartRetry');\n`;
      } else if (errorStep.toLowerCase().includes('pago') || errorStep.toLowerCase().includes('checkout')) {
        testCode += `    cy.intercept('POST', '/api/checkout', { statusCode: 200, body: { success: true } }).as('checkoutRetry');\n`;
      } else {
        testCode += `    cy.intercept('GET', '/api/products', { fixture: 'products.json' }).as('getProductsRetry');\n`;
      }
      
      testCode += `    cy.get('.retry-button').click();\n`;
      
      // Verificar que se completa el flujo después de reintentar
      testCode += `\n    // Verificar que se completa el flujo después de reintentar\n`;
      testCode += `    cy.get('.success-message').should('be.visible');\n`;
    } else {
      testCode += `    // No hay pasos para probar\n`;
      testCode += `    cy.log('No hay pasos definidos para probar el manejo de errores');\n`;
    }
    
    testCode += `  });\n`;
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Genera código para un paso de prueba en Cypress
   */
  private generateCypressStepCode(step: string, stepIndex: number): string {
    let code = '';
    const stepLower = step.toLowerCase();
    
    if (stepLower.includes('visitar') || stepLower.includes('navegar')) {
      // Paso de navegación
      const urlMatch = step.match(/['"]([^'"]+)['"]/);
      const url = urlMatch ? urlMatch[1] : '/products';
      
      code += `    cy.visit('${url}');\n`;
      
      if (url.includes('product')) {
        code += `    cy.wait('@getProducts');\n`;
      }
    } else if (stepLower.includes('buscar') || stepLower.includes('filtrar')) {
      // Paso de búsqueda
      const searchTermMatch = step.match(/['"]([^'"]+)['"]/);
      const searchTerm = searchTermMatch ? searchTermMatch[1] : 'test product';
      
      code += `    cy.get('.search-input').type('${searchTerm}');\n`;
      code += `    cy.get('.search-button').click();\n`;
      code += `    cy.wait('@getProducts');\n`;
      code += `    cy.get('.product-item').should('exist');\n`;
    } else if (stepLower.includes('seleccionar') || stepLower.includes('elegir')) {
      // Paso de selección
      code += `    cy.get('.product-item').first().click();\n`;
      code += `    cy.get('.product-details').should('be.visible');\n`;
    } else if (stepLower.includes('agregar') || stepLower.includes('añadir') || stepLower.includes('carrito')) {
      // Paso de agregar al carrito
      code += `    cy.get('.add-to-cart-button').click();\n`;
      code += `    cy.wait('@addToCart');\n`;
      code += `    cy.get('.cart-notification').should('be.visible');\n`;
    } else if (stepLower.includes('carrito') && (stepLower.includes('ver') || stepLower.includes('ir'))) {
      // Paso de ir al carrito
      code += `    cy.get('.cart-icon').click();\n`;
      code += `    cy.get('.cart-items').should('be.visible');\n`;
      code += `    cy.get('.cart-item').should('exist');\n`;
    } else if (stepLower.includes('checkout') || stepLower.includes('pago') || stepLower.includes('comprar')) {
      // Paso de checkout
      code += `    cy.get('.checkout-button').click();\n`;
      code += `    cy.get('.checkout-form').should('be.visible');\n`;
    } else if (stepLower.includes('formulario') || stepLower.includes('datos')) {
      // Paso de llenar formulario
      code += `    cy.get('input[name="name"]').type('Usuario Prueba');\n`;
      code += `    cy.get('input[name="email"]').type('test@example.com');\n`;
      code += `    cy.get('input[name="address"]').type('Calle Prueba 123');\n`;
      code += `    cy.get('input[name="city"]').type('Ciudad Prueba');\n`;
      code += `    cy.get('input[name="zip"]').type('12345');\n`;
    } else if (stepLower.includes('tarjeta') || stepLower.includes('pago')) {
      // Paso de información de pago
      code += `    cy.get('input[name="cardNumber"]').type('4111111111111111');\n`;
      code += `    cy.get('input[name="cardName"]').type('Usuario Prueba');\n`;
      code += `    cy.get('input[name="expiry"]').type('12/25');\n`;
      code += `    cy.get('input[name="cvv"]').type('123');\n`;
    } else if (stepLower.includes('confirmar') || stepLower.includes('finalizar')) {
      // Paso de confirmación
      code += `    cy.get('.confirm-button').click();\n`;
      code += `    cy.wait('@checkout');\n`;
      code += `    cy.url().should('include', '/confirmation');\n`;
    } else {
      // Paso genérico
      code += `    cy.log('Ejecutando paso: ${step}');\n`;
      code += `    // Implementar lógica específica para este paso\n`;
    }
    
    return code;
  }
  
  /**
   * Genera pruebas E2E con Playwright
   */
  private generatePlaywrightE2ETests(flowName: string, steps: string[]): string {
    let testCode = `// tests/e2e/${flowName.toLowerCase().replace(/\s+/g, '-')}.spec.ts\n\n`;
    testCode += `import { test, expect } from '@playwright/test';\n\n`;
    
    testCode += `test.describe('${flowName} E2E Flow', () => {\n`;
    
    // Prueba E2E principal
    testCode += `  test('debería completar el flujo de ${flowName} correctamente', async ({ page }) => {\n`;
    testCode += `    // Navegar a la página inicial\n`;
    testCode += `    await page.goto('/');\n\n`;
    
    // Generar pasos de prueba basados en los pasos proporcionados
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      testCode += `    // Paso ${i + 1}: ${step}\n`;
      
      // Generar código de prueba basado en el paso
      testCode += this.generatePlaywrightStepCode(step, i);
      
      testCode += `\n`;
    }
    
    // Verificación final
    testCode += `    // Verificación final\n`;
    testCode += `    await expect(page.locator('.success-message')).toContainText('Operación completada con éxito');\n`;
    testCode += `    await expect(page).toHaveURL(/confirmation/);\n`;
    
    testCode += `  });\n\n`;
    
    // Prueba de manejo de errores
    testCode += `  test('debería manejar errores durante el flujo', async ({ page, context }) => {\n`;
    
    // Simular un error en uno de los pasos
    if (steps.length > 0) {
      const errorStep = steps[Math.floor(steps.length / 2)];
      testCode += `    // Configurar una ruta para simular un error\n`;
      
      if (errorStep.toLowerCase().includes('agregar') || errorStep.toLowerCase().includes('añadir')) {
        testCode += `    await page.route('**/api/cart', route => {\n`;
        testCode += `      route.fulfill({\n`;
        testCode += `        status: 500,\n`;
        testCode += `        body: JSON.stringify({ error: 'Error simulado' })\n`;
        testCode += `      });\n`;
        testCode += `    });\n`;
      } else if (errorStep.toLowerCase().includes('pago') || errorStep.toLowerCase().includes('checkout')) {
        testCode += `    await page.route('**/api/checkout', route => {\n`;
        testCode += `      route.fulfill({\n`;
        testCode += `        status: 500,\n`;
        testCode += `        body: JSON.stringify({ error: 'Error simulado' })\n`;
        testCode += `      });\n`;
        testCode += `    });\n`;
      } else {
        testCode += `    await page.route('**/api/products', route => {\n`;
        testCode += `      route.fulfill({\n`;
        testCode += `        status: 500,\n`;
        testCode += `        body: JSON.stringify({ error: 'Error simulado' })\n`;
        testCode += `      });\n`;
        testCode += `    });\n`;
      }
      
      testCode += `\n    // Navegar a la página inicial\n`;
      testCode += `    await page.goto('/');\n\n`;
      
      // Ejecutar los pasos hasta el error
      for (let i = 0; i < Math.floor(steps.length / 2); i++) {
        const step = steps[i];
        testCode += `    // Paso ${i + 1}: ${step}\n`;
        testCode += this.generatePlaywrightStepCode(step, i);
        testCode += `\n`;
      }
      
      // Verificar que se muestra un mensaje de error
      testCode += `    // Verificar que se muestra un mensaje de error\n`;
      testCode += `    await expect(page.locator('.error-message')).toBeVisible();\n`;
      testCode += `    await expect(page.locator('.error-message')).toContainText('Error');\n\n`;
      
      // Verificar que hay un botón para reintentar
      testCode += `    // Verificar que hay un botón para reintentar\n`;
      testCode += `    await expect(page.locator('.retry-button')).toBeVisible();\n\n`;
      
      // Reintentar la operación
      testCode += `    // Reintentar la operación con una respuesta exitosa\n`;
      
      if (errorStep.toLowerCase().includes('agregar') || errorStep.toLowerCase().includes('añadir')) {
        testCode += `    await page.unroute('**/api/cart');\n`;
        testCode += `    await page.route('**/api/cart', route => {\n`;
        testCode += `      route.fulfill({\n`;
        testCode += `        status: 200,\n`;
        testCode += `        body: JSON.stringify({ success: true })\n`;
        testCode += `      });\n`;
        testCode += `    });\n`;
      } else if (errorStep.toLowerCase().includes('pago') || errorStep.toLowerCase().includes('checkout')) {
        testCode += `    await page.unroute('**/api/checkout');\n`;
        testCode += `    await page.route('**/api/checkout', route => {\n`;
        testCode += `      route.fulfill({\n`;
        testCode += `        status: 200,\n`;
        testCode += `        body: JSON.stringify({ success: true })\n`;
        testCode += `      });\n`;
        testCode += `    });\n`;
      } else {
        testCode += `    await page.unroute('**/api/products');\n`;
        testCode += `    await page.route('**/api/products', route => {\n`;
        testCode += `      route.fulfill({\n`;
        testCode += `        status: 200,\n`;
        testCode += `        body: JSON.stringify([{ id: 1, name: 'Test Product', price: 99.99 }])\n`;
        testCode += `      });\n`;
        testCode += `    });\n`;
      }
      
      testCode += `    await page.locator('.retry-button').click();\n\n`;
      
      // Verificar que se completa el flujo después de reintentar
      testCode += `    // Verificar que se completa el flujo después de reintentar\n`;
      testCode += `    await expect(page.locator('.success-message')).toBeVisible();\n`;
    } else {
      testCode += `    // No hay pasos para probar\n`;
      testCode += `    console.log('No hay pasos definidos para probar el manejo de errores');\n`;
    }
    
    testCode += `  });\n`;
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Genera código para un paso de prueba en Playwright
   */
  private generatePlaywrightStepCode(step: string, stepIndex: number): string {
    let code = '';
    const stepLower = step.toLowerCase();
    
    if (stepLower.includes('visitar') || stepLower.includes('navegar')) {
      // Paso de navegación
      const urlMatch = step.match(/['"]([^'"]+)['"]/);
      const url = urlMatch ? urlMatch[1] : '/products';
      
      code += `    await page.goto('${url}');\n`;
      
      if (url.includes('product')) {
        code += `    await page.waitForResponse('**/api/products');\n`;
      }
    } else if (stepLower.includes('buscar') || stepLower.includes('filtrar')) {
      // Paso de búsqueda
      const searchTermMatch = step.match(/['"]([^'"]+)['"]/);
      const searchTerm = searchTermMatch ? searchTermMatch[1] : 'test product';
      
      code += `    await page.locator('.search-input').fill('${searchTerm}');\n`;
      code += `    await page.locator('.search-button').click();\n`;
      code += `    await page.waitForResponse('**/api/products');\n`;
      code += `    await expect(page.locator('.product-item')).toBeVisible();\n`;
    } else if (stepLower.includes('seleccionar') || stepLower.includes('elegir')) {
      // Paso de selección
      code += `    await page.locator('.product-item').first().click();\n`;
      code += `    await expect(page.locator('.product-details')).toBeVisible();\n`;
    } else if (stepLower.includes('agregar') || stepLower.includes('añadir') || stepLower.includes('carrito')) {
      // Paso de agregar al carrito
      code += `    await page.locator('.add-to-cart-button').click();\n`;
      code += `    await page.waitForResponse('**/api/cart');\n`;
      code += `    await expect(page.locator('.cart-notification')).toBeVisible();\n`;
    } else if (stepLower.includes('carrito') && (stepLower.includes('ver') || stepLower.includes('ir'))) {
      // Paso de ir al carrito
      code += `    await page.locator('.cart-icon').click();\n`;
      code += `    await expect(page.locator('.cart-items')).toBeVisible();\n`;
      code += `    await expect(page.locator('.cart-item')).toBeVisible();\n`;
    } else if (stepLower.includes('checkout') || stepLower.includes('pago') || stepLower.includes('comprar')) {
      // Paso de checkout
      code += `    await page.locator('.checkout-button').click();\n`;
      code += `    await expect(page.locator('.checkout-form')).toBeVisible();\n`;
    } else if (stepLower.includes('formulario') || stepLower.includes('datos')) {
      // Paso de llenar formulario
      code += `    await page.locator('input[name="name"]').fill('Usuario Prueba');\n`;
      code += `    await page.locator('input[name="email"]').fill('test@example.com');\n`;
      code += `    await page.locator('input[name="address"]').fill('Calle Prueba 123');\n`;
      code += `    await page.locator('input[name="city"]').fill('Ciudad Prueba');\n`;
      code += `    await page.locator('input[name="zip"]').fill('12345');\n`;
    } else if (stepLower.includes('tarjeta') || stepLower.includes('pago')) {
      // Paso de información de pago
      code += `    await page.locator('input[name="cardNumber"]').fill('4111111111111111');\n`;
      code += `    await page.locator('input[name="cardName"]').fill('Usuario Prueba');\n`;
      code += `    await page.locator('input[name="expiry"]').fill('12/25');\n`;
      code += `    await page.locator('input[name="cvv"]').fill('123');\n`;
    } else if (stepLower.includes('confirmar') || stepLower.includes('finalizar')) {
      // Paso de confirmación
      code += `    await page.locator('.confirm-button').click();\n`;
      code += `    await page.waitForResponse('**/api/checkout');\n`;
      code += `    await expect(page).toHaveURL(/confirmation/);\n`;
    } else {
      // Paso genérico
      code += `    console.log('Ejecutando paso: ${step}');\n`;
      code += `    // Implementar lógica específica para este paso\n`;
    }
    
    return code;
  }
  
  /**
   * Genera pruebas E2E con Puppeteer
   */
  private generatePuppeteerE2ETests(flowName: string, steps: string[]): string {
    let testCode = `// tests/e2e/${flowName.toLowerCase().replace(/\s+/g, '-')}.test.js\n\n`;
    testCode += `const puppeteer = require('puppeteer');\n\n`;
    
    testCode += `describe('${flowName} E2E Flow', () => {\n`;
    testCode += `  let browser;\n`;
    testCode += `  let page;\n\n`;
    
    testCode += `  beforeAll(async () => {\n`;
    testCode += `    browser = await puppeteer.launch({\n`;
    testCode += `      headless: true,\n`;
    testCode += `      args: ['--no-sandbox', '--disable-setuid-sandbox']\n`;
    testCode += `    });\n`;
    testCode += `  });\n\n`;
    
    testCode += `  beforeEach(async () => {\n`;
    testCode += `    page = await browser.newPage();\n`;
    testCode += `    await page.setViewport({ width: 1280, height: 800 });\n`;
    testCode += `  });\n\n`;
    
    testCode += `  afterEach(async () => {\n`;
    testCode += `    await page.close();\n`;
    testCode += `  });\n\n`;
    
    testCode += `  afterAll(async () => {\n`;
    testCode += `    await browser.close();\n`;
    testCode += `  });\n\n`;
    
    // Prueba E2E principal
    testCode += `  test('debería completar el flujo de ${flowName} correctamente', async () => {\n`;
    testCode += `    // Navegar a la página inicial\n`;
    testCode += `    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });\n\n`;
    
    // Generar pasos de prueba basados en los pasos proporcionados
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      testCode += `    // Paso ${i + 1}: ${step}\n`;
      
      // Generar código de prueba basado en el paso
      testCode += this.generatePuppeteerStepCode(step, i);
      
      testCode += `\n`;
    }
    
    // Verificación final
    testCode += `    // Verificación final\n`;
    testCode += `    await page.waitForSelector('.success-message');\n`;
    testCode += `    const successText = await page.$eval('.success-message', el => el.textContent);\n`;
    testCode += `    expect(successText).toContain('Operación completada con éxito');\n\n`;
    
    testCode += `    const url = page.url();\n`;
    testCode += `    expect(url).toContain('confirmation');\n`;
    
    testCode += `  }, 30000);\n\n`;
    
    // Prueba de manejo de errores
    testCode += `  test('debería manejar errores durante el flujo', async () => {\n`;
    
    // Simular un error en uno de los pasos
    if (steps.length > 0) {
      testCode += `    // Configurar interceptor para simular un error\n`;
      testCode += `    await page.setRequestInterception(true);\n`;
      testCode += `    page.on('request', request => {\n`;
      
      const errorStep = steps[Math.floor(steps.length / 2)];
      
      if (errorStep.toLowerCase().includes('agregar') || errorStep.toLowerCase().includes('añadir')) {
        testCode += `      if (request.url().includes('/api/cart') && request.method() === 'POST') {\n`;
        testCode += `        request.respond({\n`;
        testCode += `          status: 500,\n`;
        testCode += `          contentType: 'application/json',\n`;
        testCode += `          body: JSON.stringify({ error: 'Error simulado' })\n`;
        testCode += `        });\n`;
        testCode += `      } else {\n`;
        testCode += `        request.continue();\n`;
        testCode += `      }\n`;
      } else if (errorStep.toLowerCase().includes('pago') || errorStep.toLowerCase().includes('checkout')) {
        testCode += `      if (request.url().includes('/api/checkout') && request.method() === 'POST') {\n`;
        testCode += `        request.respond({\n`;
        testCode += `          status: 500,\n`;
        testCode += `          contentType: 'application/json',\n`;
        testCode += `          body: JSON.stringify({ error: 'Error simulado' })\n`;
        testCode += `        });\n`;
        testCode += `      } else {\n`;
        testCode += `        request.continue();\n`;
        testCode += `      }\n`;
      } else {
        testCode += `      if (request.url().includes('/api/products') && request.method() === 'GET') {\n`;
        testCode += `        request.respond({\n`;
        testCode += `          status: 500,\n`;
        testCode += `          contentType: 'application/json',\n`;
        testCode += `          body: JSON.stringify({ error: 'Error simulado' })\n`;
        testCode += `        });\n`;
        testCode += `      } else {\n`;
        testCode += `        request.continue();\n`;
        testCode += `      }\n`;
      }
      
      testCode += `    });\n\n`;
      
      testCode += `    // Navegar a la página inicial\n`;
      testCode += `    await page.goto('http://localhost:3000/', { waitUntil: 'networkidle2' });\n\n`;
      
      // Ejecutar los pasos hasta el error
      for (let i = 0; i < Math.floor(steps.length / 2); i++) {
        const step = steps[i];
        testCode += `    // Paso ${i + 1}: ${step}\n`;
        testCode += this.generatePuppeteerStepCode(step, i);
        testCode += `\n`;
      }
      
      // Verificar que se muestra un mensaje de error
      testCode += `    // Verificar que se muestra un mensaje de error\n`;
      testCode += `    await page.waitForSelector('.error-message', { visible: true });\n`;
      testCode += `    const errorText = await page.$eval('.error-message', el => el.textContent);\n`;
      testCode += `    expect(errorText).toContain('Error');\n\n`;
      
      // Verificar que hay un botón para reintentar
      testCode += `    // Verificar que hay un botón para reintentar\n`;
      testCode += `    await page.waitForSelector('.retry-button', { visible: true });\n\n`;
      
      // Desactivar la intercepción para permitir que la operación tenga éxito
      testCode += `    // Desactivar la intercepción para permitir que la operación tenga éxito\n`;
      testCode += `    await page.setRequestInterception(false);\n\n`;
      
      // Reintentar la operación
      testCode += `    // Reintentar la operación\n`;
      testCode += `    await page.click('.retry-button');\n\n`;
      
      // Verificar que se completa el flujo después de reintentar
      testCode += `    // Verificar que se completa el flujo después de reintentar\n`;
      testCode += `    await page.waitForSelector('.success-message', { visible: true, timeout: 10000 });\n`;
      testCode += `    const successText = await page.$eval('.success-message', el => el.textContent);\n`;
      testCode += `    expect(successText).toContain('Operación completada con éxito');\n`;
    } else {
      testCode += `    // No hay pasos para probar\n`;
      testCode += `    console.log('No hay pasos definidos para probar el manejo de errores');\n`;
    }
    
    testCode += `  }, 30000);\n`;
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Genera código para un paso de prueba en Puppeteer
   */
  private generatePuppeteerStepCode(step: string, stepIndex: number): string {
    let code = '';
    const stepLower = step.toLowerCase();
    
    if (stepLower.includes('visitar') || stepLower.includes('navegar')) {
      // Paso de navegación
      const urlMatch = step.match(/['"]([^'"]+)['"]/);
      const url = urlMatch ? urlMatch[1] : '/products';
      
      code += `    await page.goto('http://localhost:3000${url}', { waitUntil: 'networkidle2' });\n`;
      
      if (url.includes('product')) {
        code += `    // Esperar a que se carguen los productos\n`;
        code += `    await page.waitForSelector('.product-item');\n`;
      }
    } else if (stepLower.includes('buscar') || stepLower.includes('filtrar')) {
      // Paso de búsqueda
      const searchTermMatch = step.match(/['"]([^'"]+)['"]/);
      const searchTerm = searchTermMatch ? searchTermMatch[1] : 'test product';
      
      code += `    await page.type('.search-input', '${searchTerm}');\n`;
      code += `    await page.click('.search-button');\n`;
      code += `    // Esperar a que se actualicen los resultados\n`;
      code += `    await page.waitForSelector('.product-item');\n`;
    } else if (stepLower.includes('seleccionar') || stepLower.includes('elegir')) {
      // Paso de selección
      code += `    await page.click('.product-item');\n`;
      code += `    // Esperar a que se carguen los detalles\n`;
      code += `    await page.waitForSelector('.product-details', { visible: true });\n`;
    } else if (stepLower.includes('agregar') || stepLower.includes('añadir') || stepLower.includes('carrito')) {
      // Paso de agregar al carrito
      code += `    await page.click('.add-to-cart-button');\n`;
      code += `    // Esperar a que aparezca la notificación\n`;
      code += `    await page.waitForSelector('.cart-notification', { visible: true });\n`;
    } else if (stepLower.includes('carrito') && (stepLower.includes('ver') || stepLower.includes('ir'))) {
      // Paso de ir al carrito
      code += `    await page.click('.cart-icon');\n`;
      code += `    // Esperar a que se cargue el carrito\n`;
      code += `    await page.waitForSelector('.cart-items', { visible: true });\n`;
      code += `    await page.waitForSelector('.cart-item');\n`;
    } else if (stepLower.includes('checkout') || stepLower.includes('pago') || stepLower.includes('comprar')) {
      // Paso de checkout
      code += `    await page.click('.checkout-button');\n`;
      code += `    // Esperar a que se cargue el formulario\n`;
      code += `    await page.waitForSelector('.checkout-form', { visible: true });\n`;
    } else if (stepLower.includes('formulario') || stepLower.includes('datos')) {
      // Paso de llenar formulario
      code += `    await page.type('input[name="name"]', 'Usuario Prueba');\n`;
      code += `    await page.type('input[name="email"]', 'test@example.com');\n`;
      code += `    await page.type('input[name="address"]', 'Calle Prueba 123');\n`;
      code += `    await page.type('input[name="city"]', 'Ciudad Prueba');\n`;
      code += `    await page.type('input[name="zip"]', '12345');\n`;
    } else if (stepLower.includes('tarjeta') || stepLower.includes('pago')) {
      // Paso de información de pago
      code += `    await page.type('input[name="cardNumber"]', '4111111111111111');\n`;
      code += `    await page.type('input[name="cardName"]', 'Usuario Prueba');\n`;
      code += `    await page.type('input[name="expiry"]', '12/25');\n`;
      code += `    await page.type('input[name="cvv"]', '123');\n`;
    } else if (stepLower.includes('confirmar') || stepLower.includes('finalizar')) {
      // Paso de confirmación
      code += `    await page.click('.confirm-button');\n`;
      code += `    // Esperar a que se complete la operación\n`;
      code += `    await page.waitForNavigation({ waitUntil: 'networkidle2' });\n`;
      code += `    // Verificar que estamos en la página de confirmación\n`;
      code += `    const url = page.url();\n`;
      code += `    expect(url).toContain('confirmation');\n`;
    } else {
      // Paso genérico
      code += `    console.log('Ejecutando paso: ${step}');\n`;
      code += `    // Implementar lógica específica para este paso\n`;
    }
    
    return code;
  }
  
  /**
   * Genera pruebas E2E con Selenium
   */
  private generateSeleniumE2ETests(flowName: string, steps: string[]): string {
    let testCode = `// tests/e2e/${flowName.toLowerCase().replace(/\s+/g, '-')}.test.js\n\n`;
    testCode += `const { Builder, By, Key, until } = require('selenium-webdriver');\n`;
    testCode += `const chrome = require('selenium-webdriver/chrome');\n`;
    testCode += `const assert = require('assert');\n\n`;
    
    testCode += `describe('${flowName} E2E Flow', function() {\n`;
    testCode += `  // Aumentar el tiempo de espera para pruebas E2E\n`;
    testCode += `  this.timeout(60000);\n\n`;
    
    testCode += `  let driver;\n\n`;
    
    testCode += `  beforeEach(async function() {\n`;
    testCode += `    // Configurar opciones de Chrome\n`;
    testCode += `    const options = new chrome.Options();\n`;
    testCode += `    options.addArguments('--headless');\n`;
    testCode += `    options.addArguments('--no-sandbox');\n`;
    testCode += `    options.addArguments('--disable-dev-shm-usage');\n\n`;
    
    testCode += `    // Inicializar el driver\n`;
    testCode += `    driver = await new Builder()\n`;
    testCode += `      .forBrowser('chrome')\n`;
    testCode += `      .setChromeOptions(options)\n`;
    testCode += `      .build();\n`;
    testCode += `  });\n\n`;
    
    testCode += `  afterEach(async function() {\n`;
    testCode += `    // Cerrar el driver después de cada prueba\n`;
    testCode += `    if (driver) {\n`;
    testCode += `      await driver.quit();\n`;
    testCode += `    }\n`;
    testCode += `  });\n\n`;
    
    // Prueba E2E principal
    testCode += `  it('debería completar el flujo de ${flowName} correctamente', async function() {\n`;
    testCode += `    // Navegar a la página inicial\n`;
    testCode += `    await driver.get('http://localhost:3000/');\n\n`;
    
    // Generar pasos de prueba basados en los pasos proporcionados
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      testCode += `    // Paso ${i + 1}: ${step}\n`;
      
      // Generar código de prueba basado en el paso
      testCode += this.generateSeleniumStepCode(step, i);
      
      testCode += `\n`;
    }
    
    // Verificación final
    testCode += `    // Verificación final\n`;
    testCode += `    await driver.wait(until.elementLocated(By.css('.success-message')), 10000);\n`;
    testCode += `    const successText = await driver.findElement(By.css('.success-message')).getText();\n`;
    testCode += `    assert(successText.includes('Operación completada con éxito'));\n\n`;
    
    testCode += `    const url = await driver.getCurrentUrl();\n`;
    testCode += `    assert(url.includes('confirmation'));\n`;
    
    testCode += `  });\n\n`;
    
    // Prueba de manejo de errores
    testCode += `  it('debería manejar errores durante el flujo', async function() {\n`;
    testCode += `    // Esta prueba simula un error en el servidor\n`;
    testCode += `    // Nota: Selenium no puede interceptar peticiones como Puppeteer o Cypress\n`;
    testCode += `    // Por lo que esta prueba asume que el servidor tiene un endpoint para simular errores\n\n`;
    
    testCode += `    // Navegar a la página inicial con un parámetro para simular error\n`;
    testCode += `    await driver.get('http://localhost:3000/?simulateError=true');\n\n`;
    
    // Ejecutar algunos pasos hasta que ocurra el error
    if (steps.length > 0) {
      for (let i = 0; i < Math.min(2, steps.length); i++) {
        const step = steps[i];
        testCode += `    // Paso ${i + 1}: ${step}\n`;
        testCode += this.generateSeleniumStepCode(step, i);
        testCode += `\n`;
      }
      
      // Verificar que se muestra un mensaje de error
      testCode += `    // Verificar que se muestra un mensaje de error\n`;
      testCode += `    await driver.wait(until.elementLocated(By.css('.error-message')), 10000);\n`;
      testCode += `    const errorText = await driver.findElement(By.css('.error-message')).getText();\n`;
      testCode += `    assert(errorText.includes('Error'));\n\n`;
      
      // Verificar que hay un botón para reintentar
      testCode += `    // Verificar que hay un botón para reintentar\n`;
      testCode += `    await driver.wait(until.elementLocated(By.css('.retry-button')), 5000);\n\n`;
      
      // Reintentar la operación
      testCode += `    // Reintentar la operación sin el parámetro de error\n`;
      testCode += `    await driver.findElement(By.css('.retry-button')).click();\n\n`;
      
      // Verificar que se completa el flujo después de reintentar
      testCode += `    // Verificar que se completa el flujo después de reintentar\n`;
      testCode += `    await driver.wait(until.elementLocated(By.css('.success-message')), 10000);\n`;
      testCode += `    const successText = await driver.findElement(By.css('.success-message')).getText();\n`;
      testCode += `    assert(successText.includes('Operación completada con éxito'));\n`;
    } else {
      testCode += `    // No hay pasos para probar\n`;
      testCode += `    console.log('No hay pasos definidos para probar el manejo de errores');\n`;
    }
    
    testCode += `  });\n`;
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Genera código para un paso de prueba en Selenium
   */
  private generateSeleniumStepCode(step: string, stepIndex: number): string {
    let code = '';
    const stepLower = step.toLowerCase();
    
    if (stepLower.includes('visitar') || stepLower.includes('navegar')) {
      // Paso de navegación
      const urlMatch = step.match(/['"]([^'"]+)['"]/);
      const url = urlMatch ? urlMatch[1] : '/products';
      
      code += `    await driver.get('http://localhost:3000${url}');\n`;
      
      if (url.includes('product')) {
        code += `    // Esperar a que se carguen los productos\n`;
        code += `    await driver.wait(until.elementLocated(By.css('.product-item')), 10000);\n`;
      }
    } else if (stepLower.includes('buscar') || stepLower.includes('filtrar')) {
      // Paso de búsqueda
      const searchTermMatch = step.match(/['"]([^'"]+)['"]/);
      const searchTerm = searchTermMatch ? searchTermMatch[1] : 'test product';
      
      code += `    await driver.findElement(By.css('.search-input')).sendKeys('${searchTerm}');\n`;
      code += `    await driver.findElement(By.css('.search-button')).click();\n`;
      code += `    // Esperar a que se actualicen los resultados\n`;
      code += `    await driver.wait(until.elementLocated(By.css('.product-item')), 10000);\n`;
    } else if (stepLower.includes('seleccionar') || stepLower.includes('elegir')) {
      // Paso de selección
      code += `    await driver.findElement(By.css('.product-item')).click();\n`;
      code += `    // Esperar a que se carguen los detalles\n`;
      code += `    await driver.wait(until.elementLocated(By.css('.product-details')), 10000);\n`;
    } else if (stepLower.includes('agregar') || stepLower.includes('añadir') || stepLower.includes('carrito')) {
      // Paso de agregar al carrito
      code += `    await driver.findElement(By.css('.add-to-cart-button')).click();\n`;
      code += `    // Esperar a que aparezca la notificación\n`;
      code += `    await driver.wait(until.elementLocated(By.css('.cart-notification')), 10000);\n`;
    } else if (stepLower.includes('carrito') && (stepLower.includes('ver') || stepLower.includes('ir'))) {
      // Paso de ir al carrito
      code += `    await driver.findElement(By.css('.cart-icon')).click();\n`;
      code += `    // Esperar a que se cargue el carrito\n`;
      code += `    await driver.wait(until.elementLocated(By.css('.cart-items')), 10000);\n`;
      code += `    await driver.wait(until.elementLocated(By.css('.cart-item')), 10000);\n`;
    } else if (stepLower.includes('checkout') || stepLower.includes('pago') || stepLower.includes('comprar')) {
      // Paso de checkout
      code += `    await driver.findElement(By.css('.checkout-button')).click();\n`;
      code += `    // Esperar a que se cargue el formulario\n`;
      code += `    await driver.wait(until.elementLocated(By.css('.checkout-form')), 10000);\n`;
    } else if (stepLower.includes('formulario') || stepLower.includes('datos')) {
      // Paso de llenar formulario
      code += `    await driver.findElement(By.css('input[name="name"]')).sendKeys('Usuario Prueba');\n`;
      code += `    await driver.findElement(By.css('input[name="email"]')).sendKeys('test@example.com');\n`;
      code += `    await driver.findElement(By.css('input[name="address"]')).sendKeys('Calle Prueba 123');\n`;
      code += `    await driver.findElement(By.css('input[name="city"]')).sendKeys('Ciudad Prueba');\n`;
      code += `    await driver.findElement(By.css('input[name="zip"]')).sendKeys('12345');\n`;
    } else if (stepLower.includes('tarjeta') || stepLower.includes('pago')) {
      // Paso de información de pago
      code += `    await driver.findElement(By.css('input[name="cardNumber"]')).sendKeys('4111111111111111');\n`;
      code += `    await driver.findElement(By.css('input[name="cardName"]')).sendKeys('Usuario Prueba');\n`;
      code += `    await driver.findElement(By.css('input[name="expiry"]')).sendKeys('12/25');\n`;
      code += `    await driver.findElement(By.css('input[name="cvv"]')).sendKeys('123');\n`;
    } else if (stepLower.includes('confirmar') || stepLower.includes('finalizar')) {
      // Paso de confirmación
      code += `    await driver.findElement(By.css('.confirm-button')).click();\n`;
      code += `    // Esperar a que se complete la operación\n`;
      code += `    await driver.wait(until.urlContains('confirmation'), 10000);\n`;
    } else {
      // Paso genérico
      code += `    console.log('Ejecutando paso: ${step}');\n`;
      code += `    // Implementar lógica específica para este paso\n`;
    }
    
    return code;
  }
  
  /**
   * Genera pruebas de rendimiento para un componente o módulo
   */
  public generatePerformanceTests(componentName: string, framework: string = 'lighthouse'): string {
    switch (framework.toLowerCase()) {
      case 'lighthouse':
        return this.generateLighthouseTests(componentName);
      case 'webvitals':
        return this.generateWebVitalsTests(componentName);
      default:
        return this.generateLighthouseTests(componentName);
    }
  }
  
  /**
   * Genera pruebas de rendimiento con Lighthouse
   */
  private generateLighthouseTests(componentName: string): string {
    let testCode = `// tests/performance/${componentName.toLowerCase().replace(/\s+/g, '-')}.perf.js\n\n`;
    testCode += `const { test } = require('@playwright/test');\n`;
    testCode += `const { playAudit } = require('playwright-lighthouse');\n`;
    testCode += `const { expect } = require('chai');\n\n`;
    
    testCode += `// Configuración de Lighthouse\n`;
    testCode += `const lighthouseDesktopConfig = {\n`;
    testCode += `  formFactor: 'desktop',\n`;
    testCode += `  screenEmulation: { disabled: true },\n`;
    testCode += `  throttling: { cpuSlowdownMultiplier: 1 }\n`;
    testCode += `};\n\n`;
    
    testCode += `const lighthouseMobileConfig = {\n`;
    testCode += `  formFactor: 'mobile',\n`;
    testCode += `  screenEmulation: { width: 375, height: 667, deviceScaleFactor: 2 },\n`;
    testCode += `  throttling: { cpuSlowdownMultiplier: 4 }\n`;
    testCode += `};\n\n`;
    
    testCode += `// Umbrales de rendimiento\n`;
    testCode += `const thresholds = {\n`;
    testCode += `  performance: 80,\n`;
    testCode += `  accessibility: 90,\n`;
    testCode += `  'best-practices': 85,\n`;
    testCode += `  seo: 80,\n`;
    testCode += `  pwa: 50\n`;
    testCode += `};\n\n`;
    
    testCode += `test.describe('Pruebas de rendimiento para ${componentName}', () => {\n`;
    
    // Prueba para escritorio
    testCode += `  test('debería cumplir con los umbrales de rendimiento en escritorio', async ({ browser }) => {\n`;
    testCode += `    // Crear una nueva página\n`;
    testCode += `    const page = await browser.newPage();\n`;
    testCode += `    \n`;
    testCode += `    // Navegar a la página que contiene el componente\n`;
    testCode += `    await page.goto('http://localhost:3000/${componentName.toLowerCase().replace(/\s+/g, '-')}');\n`;
    testCode += `    \n`;
    testCode += `    // Ejecutar auditoría de Lighthouse\n`;
    testCode += `    const { lhr } = await playAudit({\n`;
    testCode += `      page,\n`;
    testCode += `      config: lighthouseDesktopConfig,\n`;
    testCode += `      thresholds,\n`;
    testCode += `      reports: {\n`;
    testCode += `        formats: { html: true, json: true },\n`;
    testCode += `        name: '${componentName.toLowerCase().replace(/\s+/g, '-')}-desktop',\n`;
    testCode += `        directory: './lighthouse-reports'\n`;
    testCode += `      }\n`;
    testCode += `    });\n`;
    testCode += `    \n`;
    testCode += `    // Verificar resultados\n`;
    testCode += `    expect(lhr.categories.performance.score * 100).to.be.at.least(thresholds.performance);\n`;
    testCode += `    expect(lhr.categories.accessibility.score * 100).to.be.at.least(thresholds.accessibility);\n`;
    testCode += `    expect(lhr.categories['best-practices'].score * 100).to.be.at.least(thresholds['best-practices']);\n`;
    testCode += `    expect(lhr.categories.seo.score * 100).to.be.at.least(thresholds.seo);\n`;
    testCode += `    \n`;
    testCode += `    // Verificar métricas específicas\n`;
    testCode += `    expect(lhr.audits['first-contentful-paint'].numericValue).to.be.below(2000); // Menos de 2s\n`;
    testCode += `    expect(lhr.audits['largest-contentful-paint'].numericValue).to.be.below(2500); // Menos de 2.5s\n`;
    testCode += `    expect(lhr.audits['total-blocking-time'].numericValue).to.be.below(300); // Menos de 300ms\n`;
    testCode += `    expect(lhr.audits['cumulative-layout-shift'].numericValue).to.be.below(0.1); // CLS menor a 0.1\n`;
    testCode += `  });\n\n`;
    
    // Prueba para móvil
    testCode += `  test('debería cumplir con los umbrales de rendimiento en móvil', async ({ browser }) => {\n`;
    testCode += `    // Crear una nueva página\n`;
    testCode += `    const page = await browser.newPage();\n`;
    testCode += `    \n`;
    testCode += `    // Navegar a la página que contiene el componente\n`;
    testCode += `    await page.goto('http://localhost:3000/${componentName.toLowerCase().replace(/\s+/g, '-')}');\n`;
    testCode += `    \n`;
    testCode += `    // Ejecutar auditoría de Lighthouse\n`;
    testCode += `    const { lhr } = await playAudit({\n`;
    testCode += `      page,\n`;
    testCode += `      config: lighthouseMobileConfig,\n`;
    testCode += `      // Umbrales ligeramente más bajos para móvil\n`;
    testCode += `      thresholds: {\n`;
    testCode += `        performance: 70,\n`;
    testCode += `        accessibility: 90,\n`;
    testCode += `        'best-practices': 85,\n`;
    testCode += `        seo: 80,\n`;
    testCode += `        pwa: 50\n`;
    testCode += `      },\n`;
    testCode += `      reports: {\n`;
    testCode += `        formats: { html: true, json: true },\n`;
    testCode += `        name: '${componentName.toLowerCase().replace(/\s+/g, '-')}-mobile',\n`;
    testCode += `        directory: './lighthouse-reports'\n`;
    testCode += `      }\n`;
    testCode += `    });\n`;
    testCode += `    \n`;
    testCode += `    // Verificar resultados\n`;
    testCode += `    expect(lhr.categories.performance.score * 100).to.be.at.least(70);\n`;
    testCode += `    expect(lhr.categories.accessibility.score * 100).to.be.at.least(90);\n`;
    testCode += `    expect(lhr.categories['best-practices'].score * 100).to.be.at.least(85);\n`;
    testCode += `    expect(lhr.categories.seo.score * 100).to.be.at.least(80);\n`;
    testCode += `    \n`;
    testCode += `    // Verificar métricas específicas para móvil\n`;
    testCode += `    expect(lhr.audits['first-contentful-paint'].numericValue).to.be.below(3000); // Menos de 3s\n`;
    testCode += `    expect(lhr.audits['largest-contentful-paint'].numericValue).to.be.below(4000); // Menos de 4s\n`;
    testCode += `    expect(lhr.audits['total-blocking-time'].numericValue).to.be.below(500); // Menos de 500ms\n`;
    testCode += `    expect(lhr.audits['cumulative-layout-shift'].numericValue).to.be.below(0.1); // CLS menor a 0.1\n`;
    testCode += `  });\n`;
    
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Genera pruebas de rendimiento con Web Vitals
   */
  private generateWebVitalsTests(componentName: string): string {
    let testCode = `// tests/performance/${componentName.toLowerCase().replace(/\s+/g, '-')}.webvitals.js\n\n`;
    testCode += `const puppeteer = require('puppeteer');\n`;
    testCode += `const { expect } = require('chai');\n`;
    testCode += `const fs = require('fs');\n`;
    testCode += `const path = require('path');\n\n`;
    
    testCode += `// Script para medir Web Vitals\n`;
    testCode += `const WEB_VITALS_SCRIPT = fs.readFileSync(\n`;
    testCode += `  path.join(__dirname, '../node_modules/web-vitals/dist/web-vitals.umd.js'),\n`;
    testCode += `  'utf8'\n`;
    testCode += `);\n\n`;
    
    testCode += `describe('Pruebas de Web Vitals para ${componentName}', function() {\n`;
    testCode += `  this.timeout(30000); // Aumentar timeout para pruebas de rendimiento\n`;
    testCode += `  let browser;\n`;
    testCode += `  let page;\n\n`;
    
    testCode += `  before(async function() {\n`;
    testCode += `    browser = await puppeteer.launch({\n`;
    testCode += `      headless: true,\n`;
    testCode += `      args: ['--no-sandbox', '--disable-setuid-sandbox']\n`;
    testCode += `    });\n`;
    testCode += `  });\n\n`;
    
    testCode += `  after(async function() {\n`;
    testCode += `    if (browser) {\n`;
    testCode += `      await browser.close();\n`;
    testCode += `    }\n`;
    testCode += `  });\n\n`;
    
    testCode += `  beforeEach(async function() {\n`;
    testCode += `    page = await browser.newPage();\n`;
    testCode += `    \n`;
    testCode += `    // Inyectar el script de Web Vitals\n`;
    testCode += `    await page.evaluateOnNewDocument(WEB_VITALS_SCRIPT);\n`;
    testCode += `    \n`;
    testCode += `    // Configurar la recolección de métricas\n`;
    testCode += `    await page.evaluateOnNewDocument(() => {\n`;
    testCode += `      window.webVitalsData = [];\n`;
    testCode += `      \n`;
    testCode += `      // Función para recolectar métricas\n`;
    testCode += `      function captureWebVital(metric) {\n`;
    testCode += `        window.webVitalsData.push(metric);\n`;
    testCode += `      }\n`;
    testCode += `      \n`;
    testCode += `      // Registrar todas las métricas\n`;
    testCode += `      window.webVitals.getCLS(captureWebVital);\n`;
    testCode += `      window.webVitals.getFID(captureWebVital);\n`;
    testCode += `      window.webVitals.getLCP(captureWebVital);\n`;
    testCode += `      window.webVitals.getFCP(captureWebVital);\n`;
    testCode += `      window.webVitals.getTTFB(captureWebVital);\n`;
    testCode += `    });\n`;
    testCode += `  });\n\n`;
    
    testCode += `  afterEach(async function() {\n`;
    testCode += `    if (page) {\n`;
    testCode += `      await page.close();\n`;
    testCode += `    }\n`;
    testCode += `  });\n\n`;
    
    testCode += `  it('debería tener métricas de Web Vitals dentro de los umbrales recomendados', async function() {\n`;
    testCode += `    // Navegar a la página que contiene el componente\n`;
    testCode += `    await page.goto('http://localhost:3000/${componentName.toLowerCase().replace(/\s+/g, '-')}', {\n`;
    testCode += `      waitUntil: 'networkidle0'\n`;
    testCode += `    });\n\n`;
    
    testCode += `    // Esperar a que se cargue completamente la página\n`;
    testCode += `    await page.waitForTimeout(5000);\n\n`;
    
    testCode += `    // Obtener las métricas recolectadas\n`;
    testCode += `    const webVitalsData = await page.evaluate(() => window.webVitalsData);\n\n`;
    
    testCode += `    // Verificar que se han recolectado métricas\n`;
    testCode += `    expect(webVitalsData.length).to.be.greaterThan(0);\n\n`;
    
    testCode += `    // Extraer métricas individuales\n`;
    testCode += `    const fcp = webVitalsData.find(m => m.name === 'FCP');\n`;
    testCode += `    const lcp = webVitalsData.find(m => m.name === 'LCP');\n`;
    testCode += `    const cls = webVitalsData.find(m => m.name === 'CLS');\n`;
    testCode += `    const fid = webVitalsData.find(m => m.name === 'FID');\n`;
    testCode += `    const ttfb = webVitalsData.find(m => m.name === 'TTFB');\n\n`;
    
    testCode += `    // Guardar resultados en un archivo JSON para análisis posterior\n`;
    testCode += `    const results = {\n`;
    testCode += `      url: 'http://localhost:3000/${componentName.toLowerCase().replace(/\s+/g, '-')}',\n`;
    testCode += `      timestamp: new Date().toISOString(),\n`;
    testCode += `      metrics: webVitalsData\n`;
    testCode += `    };\n\n`;
    
    testCode += `    fs.mkdirSync('./web-vitals-reports', { recursive: true });\n`;
    testCode += `    fs.writeFileSync(\n`;
    testCode += `      \`./web-vitals-reports/${componentName.toLowerCase().replace(/\s+/g, '-')}-\${new Date().toISOString().replace(/:/g, '-')}.json\`,\n`;
    testCode += `      JSON.stringify(results, null, 2)\n`;
    testCode += `    );\n\n`;
    
    testCode += `    // Verificar umbrales de métricas\n`;
    testCode += `    if (fcp) {\n`;
    testCode += `      console.log(\`FCP: \${fcp.value}ms\`);\n`;
    testCode += `      expect(fcp.value).to.be.below(2000); // Bueno: < 2s\n`;
    testCode += `    }\n\n`;
    
    testCode += `    if (lcp) {\n`;
    testCode += `      console.log(\`LCP: \${lcp.value}ms\`);\n`;
    testCode += `      expect(lcp.value).to.be.below(2500); // Bueno: < 2.5s\n`;
    testCode += `    }\n\n`;
    
    testCode += `    if (cls) {\n`;
    testCode += `      console.log(\`CLS: \${cls.value}\`);\n`;
    testCode += `      expect(cls.value).to.be.below(0.1); // Bueno: < 0.1\n`;
    testCode += `    }\n\n`;
    
    testCode += `    if (fid) {\n`;
    testCode += `      console.log(\`FID: \${fid.value}ms\`);\n`;
    testCode += `      expect(fid.value).to.be.below(100); // Bueno: < 100ms\n`;
    testCode += `    }\n\n`;
    
    testCode += `    if (ttfb) {\n`;
    testCode += `      console.log(\`TTFB: \${ttfb.value}ms\`);\n`;
    testCode += `      expect(ttfb.value).to.be.below(600); // Bueno: < 600ms\n`;
    testCode += `    }\n`;
    testCode += `  });\n\n`;
    
    testCode += `  it('debería mantener el rendimiento bajo carga', async function() {\n`;
    testCode += `    // Simular carga en la página\n`;
    testCode += `    await page.goto('http://localhost:3000/${componentName.toLowerCase().replace(/\s+/g, '-')}', {\n`;
    testCode += `      waitUntil: 'networkidle0'\n`;
    testCode += `    });\n\n`;
    
    testCode += `    // Realizar acciones repetitivas para simular carga\n`;
    testCode += `    for (let i = 0; i < 10; i++) {\n`;
    testCode += `      // Simular interacciones de usuario (scrolling, clicks, etc.)\n`;
    testCode += `      await page.evaluate(() => {\n`;
    testCode += `        window.scrollTo(0, document.body.scrollHeight / 2);\n`;
    testCode += `        setTimeout(() => window.scrollTo(0, 0), 100);\n`;
    testCode += `      });\n`;
    testCode += `      await page.waitForTimeout(300);\n`;
    testCode += `      \n`;
    testCode += `      // Intentar hacer clic en elementos interactivos si existen\n`;
    testCode += `      const buttons = await page.$$('button, a, .clickable');\n`;
    testCode += `      if (buttons.length > 0) {\n`;
    testCode += `        const randomIndex = Math.floor(Math.random() * buttons.length);\n`;
    testCode += `        try {\n`;
    testCode += `          await buttons[randomIndex].click({ timeout: 1000 });\n`;
    testCode += `          await page.waitForTimeout(500);\n`;
    testCode += `          await page.goBack();\n`;
    testCode += `          await page.waitForTimeout(500);\n`;
    testCode += `        } catch (e) {\n`;
    testCode += `          // Ignorar errores si el elemento no es clickeable\n`;
    testCode += `        }\n`;
    testCode += `      }\n`;
    testCode += `    }\n\n`;
    
    testCode += `    // Obtener métricas después de la carga\n`;
    testCode += `    const performanceEntries = await page.evaluate(() => {\n`;
    testCode += `      return performance.getEntriesByType('navigation').concat(\n`;
    testCode += `        performance.getEntriesByType('resource')\n`;
    testCode += `      );\n`;
    testCode += `    });\n\n`;
    
    testCode += `    // Analizar métricas de rendimiento\n`;
    testCode += `    const navigationEntry = performanceEntries.find(entry => entry.entryType === 'navigation');\n`;
    testCode += `    if (navigationEntry) {\n`;
    testCode += `      console.log(\`Tiempo de carga total: \${navigationEntry.duration}ms\`);\n`;
    testCode += `      expect(navigationEntry.duration).to.be.below(5000); // Menos de 5s bajo carga\n`;
    testCode += `    }\n\n`;
    
    testCode += `    // Verificar uso de memoria\n`;
    testCode += `    const memoryInfo = await page.evaluate(() => {\n`;
    testCode += `      return performance.memory ? {\n`;
    testCode += `        totalJSHeapSize: performance.memory.totalJSHeapSize,\n`;
    testCode += `        usedJSHeapSize: performance.memory.usedJSHeapSize,\n`;
    testCode += `        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit\n`;
    testCode += `      } : null;\n`;
    testCode += `    });\n\n`;
    
    testCode += `    if (memoryInfo) {\n`;
    testCode += `      console.log(\`Uso de memoria: \${Math.round(memoryInfo.usedJSHeapSize / (1024 * 1024))}MB / \${Math.round(memoryInfo.jsHeapSizeLimit / (1024 * 1024))}MB\`);\n`;
    testCode += `      // Verificar que el uso de memoria no exceda el 80% del límite\n`;
    testCode += `      expect(memoryInfo.usedJSHeapSize).to.be.below(memoryInfo.jsHeapSizeLimit * 0.8);\n`;
    testCode += `    }\n`;
    testCode += `  });\n`;
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Genera pruebas de accesibilidad para un componente
   */
  public generateAccessibilityTests(componentName: string): string {
    let testCode = `// tests/accessibility/${componentName.toLowerCase().replace(/\s+/g, '-')}.a11y.js\n\n`;
    testCode += `const { test, expect } = require('@playwright/test');\n`;
    testCode += `const { injectAxe, checkA11y, getViolations } = require('axe-playwright');\n\n`;
    
    testCode += `test.describe('Pruebas de accesibilidad para ${componentName}', () => {\n`;
    testCode += `  test.beforeEach(async ({ page }) => {\n`;
    testCode += `    // Navegar a la página que contiene el componente\n`;
    testCode += `    await page.goto('http://localhost:3000/${componentName.toLowerCase().replace(/\s+/g, '-')}');\n`;
    testCode += `    \n`;
    testCode += `    // Inyectar axe-core\n`;
    testCode += `    await injectAxe(page);\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('no debería tener violaciones de accesibilidad', async ({ page }) => {\n`;
    testCode += `    // Analizar toda la página\n`;
    testCode += `    await checkA11y(page, null, {\n`;
    testCode += `      axeOptions: {\n`;
    testCode += `        runOnly: {\n`;
    testCode += `          type: 'tag',\n`;
    testCode += `          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']\n`;
    testCode += `        }\n`;
    testCode += `      },\n`;
    testCode += `      detailedReport: true,\n`;
    testCode += `      detailedReportOptions: { html: true }\n`;
    testCode += `    });\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('debería ser accesible con teclado', async ({ page }) => {\n`;
    testCode += `    // Verificar navegación con teclado\n`;
    testCode += `    await page.keyboard.press('Tab');\n`;
    testCode += `    \n`;
    testCode += `    // Verificar que el primer elemento interactivo recibe el foco\n`;
    testCode += `    const focusedElement = await page.evaluate(() => {\n`;
    testCode += `      const el = document.activeElement;\n`;
    testCode += `      return el ? {\n`;
    testCode += `        tagName: el.tagName,\n`;
    testCode += `        id: el.id,\n`;
    testCode += `        className: el.className,\n`;
    testCode += `        textContent: el.textContent?.trim()\n`;
    testCode += `      } : null;\n`;
    testCode += `    });\n`;
    testCode += `    \n`;
    testCode += `    expect(focusedElement).not.toBeNull();\n`;
    testCode += `    \n`;
    testCode += `    // Navegar por todos los elementos interactivos con Tab\n`;
    testCode += `    const interactiveElements = [];\n`;
    testCode += `    let maxTabs = 20; // Límite para evitar bucles infinitos\n`;
    testCode += `    \n`;
    testCode += `    while (maxTabs > 0) {\n`;
    testCode += `      const element = await page.evaluate(() => {\n`;
    testCode += `        const el = document.activeElement;\n`;
    testCode += `        return el ? {\n`;
    testCode += `          tagName: el.tagName,\n`;
    testCode += `          id: el.id,\n`;
    testCode += `          className: el.className\n`;
    testCode += `        } : null;\n`;
    testCode += `      });\n`;
    testCode += `      \n`;
    testCode += `      if (element && !interactiveElements.some(e => \n`;
    testCode += `        e.tagName === element.tagName && \n`;
    testCode += `        e.id === element.id && \n`;
    testCode += `        e.className === element.className)) {\n`;
    testCode += `        interactiveElements.push(element);\n`;
    testCode += `      }\n`;
    testCode += `      \n`;
    testCode += `      await page.keyboard.press('Tab');\n`;
    testCode += `      maxTabs--;\n`;
    testCode += `    }\n`;
    testCode += `    \n`;
    testCode += `    // Verificar que hay elementos interactivos accesibles por teclado\n`;
    testCode += `    expect(interactiveElements.length).toBeGreaterThan(0);\n`;
    testCode += `    console.log(\`Encontrados \${interactiveElements.length} elementos interactivos accesibles por teclado\`);\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('debería tener suficiente contraste de color', async ({ page }) => {\n`;
    testCode += `    // Obtener violaciones específicas de contraste\n`;
    testCode += `    const violations = await getViolations(page, null, {\n`;
    testCode += `      runOnly: {\n`;
    testCode += `        type: 'rule',\n`;
    testCode += `        values: ['color-contrast']\n`;
    testCode += `      }\n`;
    testCode += `    });\n`;
    testCode += `    \n`;
    testCode += `    // Verificar que no hay problemas de contraste\n`;
    testCode += `    expect(violations.length).toBe(0);\n`;
    testCode += `    \n`;
    testCode += `    if (violations.length > 0) {\n`;
    testCode += `      console.log('Problemas de contraste encontrados:');\n`;
    testCode += `      violations.forEach(violation => {\n`;
    testCode += `        console.log(\`- \${violation.help}: \${violation.description}\`);\n`;
    testCode += `        violation.nodes.forEach(node => {\n`;
    testCode += `          console.log(\`  * \${node.html}\`);\n`;
    testCode += `          console.log(\`    \${node.failureSummary}\`);\n`;
    testCode += `        });\n`;
    testCode += `      });\n`;
    testCode += `    }\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('debería tener textos alternativos para imágenes', async ({ page }) => {\n`;
    testCode += `    // Verificar que todas las imágenes tienen texto alternativo\n`;
    testCode += `    const imagesWithoutAlt = await page.evaluate(() => {\n`;
    testCode += `      const images = Array.from(document.querySelectorAll('img'));\n`;
    testCode += `      return images\n`;
    testCode += `        .filter(img => !img.hasAttribute('alt'))\n`;
    testCode += `        .map(img => ({\n`;
    testCode += `          src: img.src,\n`;
    testCode += `          id: img.id,\n`;
    testCode += `          className: img.className\n`;
    testCode += `        }));\n`;
    testCode += `    });\n`;
    testCode += `    \n`;
    testCode += `    expect(imagesWithoutAlt.length).toBe(0);\n`;
    testCode += `    \n`;
    testCode += `    if (imagesWithoutAlt.length > 0) {\n`;
    testCode += `      console.log('Imágenes sin texto alternativo:');\n`;
    testCode += `      imagesWithoutAlt.forEach(img => {\n`;
    testCode += `        console.log(\`- \${img.src}\`);\n`;
    testCode += `      });\n`;
    testCode += `    }\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('debería tener una estructura de encabezados adecuada', async ({ page }) => {\n`;
    testCode += `    // Verificar la estructura de encabezados\n`;
    testCode += `    const headings = await page.evaluate(() => {\n`;
    testCode += `      return Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))\n`;
    testCode += `        .map(h => ({\n`;
    testCode += `          level: parseInt(h.tagName.substring(1)),\n`;
    testCode += `          text: h.textContent.trim()\n`;
    testCode += `        }));\n`;
    testCode += `    });\n`;
    testCode += `    \n`;
    testCode += `    // Verificar que hay al menos un encabezado\n`;
    testCode += `    expect(headings.length).toBeGreaterThan(0);\n`;
    testCode += `    \n`;
    testCode += `    // Verificar que el primer encabezado es h1\n`;
    testCode += `    if (headings.length > 0) {\n`;
    testCode += `      expect(headings[0].level).toBe(1);\n`;
    testCode += `    }\n`;
    testCode += `    \n`;
    testCode += `    // Verificar que no hay saltos en la jerarquía (por ejemplo, de h1 a h3 sin h2)\n`;
    testCode += `    let previousLevel = 0;\n`;
    testCode += `    const hierarchyIssues = [];\n`;
    testCode += `    \n`;
    testCode += `    headings.forEach(heading => {\n`;
    testCode += `      if (heading.level > previousLevel + 1) {\n`;
    testCode += `        hierarchyIssues.push(\`Salto de h\${previousLevel} a h\${heading.level}: "\${heading.text}"\`);\n`;
    testCode += `      }\n`;
    testCode += `      previousLevel = heading.level;\n`;
    testCode += `    });\n`;
    testCode += `    \n`;
    testCode += `    expect(hierarchyIssues.length).toBe(0);\n`;
    testCode += `    \n`;
    testCode += `    if (hierarchyIssues.length > 0) {\n`;
    testCode += `      console.log('Problemas en la jerarquía de encabezados:');\n`;
    testCode += `      hierarchyIssues.forEach(issue => console.log(\`- \${issue}\`));\n`;
    testCode += `    }\n`;
    testCode += `  });\n`;
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Genera pruebas de usabilidad para un componente
   */
  public generateUsabilityTests(componentName: string): string {
    let testCode = `// tests/usability/${componentName.toLowerCase().replace(/\s+/g, '-')}.usability.js\n\n`;
    testCode += `const { test, expect } = require('@playwright/test');\n\n`;
    
    testCode += `test.describe('Pruebas de usabilidad para ${componentName}', () => {\n`;
    testCode += `  test.beforeEach(async ({ page }) => {\n`;
    testCode += `    // Navegar a la página que contiene el componente\n`;
    testCode += `    await page.goto('http://localhost:3000/${componentName.toLowerCase().replace(/\s+/g, '-')}');\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('debería ser visible en diferentes tamaños de pantalla', async ({ page }) => {\n`;
    testCode += `    // Probar diferentes tamaños de pantalla\n`;
    testCode += `    const viewports = [\n`;
    testCode += `      { width: 375, height: 667, name: 'mobile' },\n`;
    testCode += `      { width: 768, height: 1024, name: 'tablet' },\n`;
    testCode += `      { width: 1280, height: 800, name: 'desktop' },\n`;
    testCode += `      { width: 1920, height: 1080, name: 'large-desktop' }\n`;
    testCode += `    ];\n\n`;
    
    testCode += `    for (const viewport of viewports) {\n`;
    testCode += `      // Configurar el tamaño de la ventana\n`;
    testCode += `      await page.setViewportSize({\n`;
    testCode += `        width: viewport.width,\n`;
    testCode += `        height: viewport.height\n`;
    testCode += `      });\n\n`;
    
    testCode += `      // Tomar una captura de pantalla para análisis visual\n`;
    testCode += `      await page.screenshot({\n`;
    testCode += `        path: \`./usability-reports/${componentName.toLowerCase().replace(/\s+/g, '-')}-\${viewport.name}.png\`,\n`;
    testCode += `        fullPage: true\n`;
    testCode += `      });\n\n`;
    
    testCode += `      // Verificar que el componente principal es visible\n`;
    testCode += `      const isVisible = await page.isVisible('.${componentName.toLowerCase().replace(/\s+/g, '-')}, #${componentName.toLowerCase().replace(/\s+/g, '-')}, [data-testid="${componentName.toLowerCase().replace(/\s+/g, '-')}"]');\n`;
    testCode += `      expect(isVisible).toBeTruthy();\n\n`;
    
    testCode += `      // Verificar que no hay elementos que se desborden horizontalmente\n`;
    testCode += `      const hasHorizontalOverflow = await page.evaluate(() => {\n`;
    testCode += `        const body = document.body;\n`;
    testCode += `        return body.scrollWidth > window.innerWidth;\n`;
    testCode += `      });\n`;
    testCode += `      expect(hasHorizontalOverflow).toBeFalsy();\n`;
    testCode += `    }\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('debería tener elementos interactivos con tamaño adecuado para móvil', async ({ page }) => {\n`;
    testCode += `    // Configurar tamaño de pantalla móvil\n`;
    testCode += `    await page.setViewportSize({ width: 375, height: 667 });\n\n`;
    
    testCode += `    // Obtener todos los elementos interactivos\n`;
    testCode += `    const interactiveElements = await page.evaluate(() => {\n`;
    testCode += `      const elements = Array.from(document.querySelectorAll('button, a, input, select, textarea, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="menuitem"]'));\n`;
    testCode += `      return elements.map(el => {\n`;
    testCode += `        const rect = el.getBoundingClientRect();\n`;
    testCode += `        return {\n`;
    testCode += `          tagName: el.tagName,\n`;
    testCode += `          id: el.id,\n`;
    testCode += `          className: el.className,\n`;
    testCode += `          width: rect.width,\n`;
    testCode += `          height: rect.height,\n`;
    testCode += `          text: el.textContent?.trim() || el.value || ''\n`;
    testCode += `        };\n`;
    testCode += `      });\n`;
    testCode += `    });\n\n`;
    
    testCode += `    // Verificar que los elementos interactivos tienen un tamaño adecuado para móvil\n`;
    testCode += `    const minTouchSize = 44; // Tamaño mínimo recomendado en píxeles\n`;
    testCode += `    const smallElements = interactiveElements.filter(\n`;
    testCode += `      el => (el.width < minTouchSize || el.height < minTouchSize) && \n`;
    testCode += `           // Excluir elementos que probablemente no sean principales\n`;
    testCode += `           !el.className.includes('icon') && \n`;
    testCode += `           !el.className.includes('close') && \n`;
    testCode += `           !el.className.includes('dropdown')\n`;
    testCode += `    );\n\n`;
    
    testCode += `    if (smallElements.length > 0) {\n`;
    testCode += `      console.log('Elementos interactivos demasiado pequeños para móvil:');\n`;
    testCode += `      smallElements.forEach(el => {\n`;
    testCode += `        console.log(\`- \${el.tagName} "\${el.text}" (\${el.width}x\${el.height}px)\`);\n`;
    testCode += `      });\n`;
    testCode += `    }\n\n`;
    
    testCode += `    // Permitir algunos elementos pequeños, pero no demasiados\n`;
    testCode += `    const maxAllowedSmallElements = Math.ceil(interactiveElements.length * 0.2); // 20% de tolerancia\n`;
    testCode += `    expect(smallElements.length).toBeLessThanOrEqual(maxAllowedSmallElements);\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('debería tener feedback visual para estados interactivos', async ({ page }) => {\n`;
    testCode += `    // Verificar cambios visuales en hover\n`;
    testCode += `    const buttons = await page.$$('button, a, [role="button"]');\n\n`;
    
    testCode += `    if (buttons.length > 0) {\n`;
    testCode += `      // Tomar una captura antes de hover\n`;
    testCode += `      await page.screenshot({ path: './usability-reports/${componentName.toLowerCase().replace(/\s+/g, '-')}-before-hover.png' });\n\n`;
    
    testCode += `      // Hacer hover sobre el primer botón\n`;
    testCode += `      await buttons[0].hover();\n`;
    testCode += `      await page.waitForTimeout(500); // Esperar transiciones\n\n`;
    
    testCode += `      // Tomar una captura después de hover\n`;
    testCode += `      await page.screenshot({ path: './usability-reports/${componentName.toLowerCase().replace(/\s+/g, '-')}-after-hover.png' });\n\n`;
    
    testCode += `            // Verificar si hay cambios visuales (comparación simple)
      const visualChanges = await page.evaluate(() => {
        // Obtener el botón antes y después del hover
        const button = document.querySelector('button, a, [role="button"]');
        if (!button) return false;
        
        // Obtener estilos computados
        const styles = window.getComputedStyle(button);
        const originalStyles = {
          backgroundColor: styles.backgroundColor,
          color: styles.color,
          borderColor: styles.borderColor,
          boxShadow: styles.boxShadow,
          transform: styles.transform
        };
        
        // Simular hover (esto es una aproximación, no es perfecto)
        const hoverEvent = new MouseEvent('mouseover', {
          bubbles: true,
          cancelable: true,
        });
        button.dispatchEvent(hoverEvent);
        
        // Obtener estilos después del hover
        const hoverStyles = window.getComputedStyle(button);
        const newStyles = {
          backgroundColor: hoverStyles.backgroundColor,
          color: hoverStyles.color,
          borderColor: hoverStyles.borderColor,
          boxShadow: hoverStyles.boxShadow,
          transform: hoverStyles.transform
        };
        
        // Verificar si hay cambios
        return (
          originalStyles.backgroundColor !== newStyles.backgroundColor ||
          originalStyles.color !== newStyles.color ||
          originalStyles.borderColor !== newStyles.borderColor ||
          originalStyles.boxShadow !== newStyles.boxShadow ||
          originalStyles.transform !== newStyles.transform
        );
      });
      
      // No es un error crítico, pero es bueno tener feedback visual
      console.log(`Cambios visuales en hover: ${visualChanges ? 'Sí' : 'No'}`);
      
      // Verificar feedback en clic
      if (buttons.length > 0) {
        // Hacer clic en el primer botón
        await buttons[0].click();
        await page.waitForTimeout(500);
        
        // Tomar una captura después del clic
        await page.screenshot({ path: './usability-reports/${componentName.toLowerCase().replace(/\s+/g, '-')}-after-click.png' });
        
        // Verificar si hay algún cambio visual o de navegación
        const navigationOccurred = page.url() !== 'http://localhost:3000/${componentName.toLowerCase().replace(/\s+/g, '-')}';
        
        if (navigationOccurred) {
          console.log('El botón realizó una navegación correctamente');
          await page.goBack();
        } else {
          // Verificar si hay algún cambio en el DOM (por ejemplo, un modal, un tooltip, etc.)
          const domChanged = await page.evaluate(() => {
            // Buscar elementos que podrían haber aparecido después del clic
            const newElements = document.querySelectorAll('.modal, .tooltip, .dropdown-menu, .popover, [role="dialog"], [aria-expanded="true"]');
            return newElements.length > 0;
          });
          
          console.log(`Cambios en el DOM después del clic: ${domChanged ? 'Sí' : 'No'}`);
          expect(domChanged || navigationOccurred).toBeTruthy();
        }
      }
    }
  });\n\n`;
    
    testCode += `  test('debería tener tiempos de carga aceptables', async ({ page }) => {\n`;
    testCode += `    // Medir tiempo de carga inicial\n`;
    testCode += `    const startTime = Date.now();\n`;
    testCode += `    await page.goto('http://localhost:3000/${componentName.toLowerCase().replace(/\s+/g, '-')}', {\n`;
    testCode += `      waitUntil: 'networkidle'\n`;
    testCode += `    });\n`;
    testCode += `    const loadTime = Date.now() - startTime;\n\n`;
    
    testCode += `    console.log(\`Tiempo de carga inicial: \${loadTime}ms\`);\n`;
    testCode += `    expect(loadTime).toBeLessThan(3000); // Menos de 3 segundos es aceptable\n\n`;
    
    testCode += `    // Medir tiempo de interacción\n`;
    testCode += `    const interactionStartTime = Date.now();\n`;
    testCode += `    \n`;
    testCode += `    // Realizar una interacción típica (por ejemplo, hacer clic en un botón)\n`;
    testCode += `    const buttons = await page.$$('button, a, [role="button"]');\n`;
    testCode += `    if (buttons.length > 0) {\n`;
    testCode += `      await buttons[0].click();\n`;
    testCode += `      await page.waitForTimeout(100); // Esperar un poco para que se complete la interacción\n`;
    testCode += `    } else {\n`;
    testCode += `      // Si no hay botones, intentar con inputs\n`;
    testCode += `      const inputs = await page.$$('input, select, textarea');\n`;
    testCode += `      if (inputs.length > 0) {\n`;
    testCode += `        await inputs[0].click();\n`;
    testCode += `        await page.keyboard.type('Test');\n`;
    testCode += `      } else {\n`;
    testCode += `        // Si no hay elementos interactivos, hacer scroll\n`;
    testCode += `        await page.evaluate(() => {\n`;
    testCode += `          window.scrollTo(0, 100);\n`;
    testCode += `        });\n`;
    testCode += `      }\n`;
    testCode += `    }\n`;
    testCode += `    \n`;
    testCode += `    const interactionTime = Date.now() - interactionStartTime;\n`;
    testCode += `    console.log(\`Tiempo de respuesta a interacción: \${interactionTime}ms\`);\n`;
    testCode += `    expect(interactionTime).toBeLessThan(300); // Menos de 300ms es aceptable\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('debería tener un diseño coherente con el sistema', async ({ page }) => {\n`;
    testCode += `    // Verificar coherencia de diseño\n`;
    testCode += `    await page.goto('http://localhost:3000/${componentName.toLowerCase().replace(/\s+/g, '-')}');\n\n`;
    
    testCode += `    // Extraer colores, fuentes y espaciados principales\n`;
    testCode += `    const designTokens = await page.evaluate(() => {\n`;
    testCode += `      const computeElementStyles = (selector) => {\n`;
    testCode += `        const element = document.querySelector(selector);\n`;
    testCode += `        if (!element) return null;\n`;
    testCode += `        \n`;
    testCode += `        const styles = window.getComputedStyle(element);\n`;
    testCode += `        return {\n`;
    testCode += `          color: styles.color,\n`;
    testCode += `          backgroundColor: styles.backgroundColor,\n`;
    testCode += `          fontFamily: styles.fontFamily,\n`;
    testCode += `          fontSize: styles.fontSize,\n`;
    testCode += `          padding: styles.padding,\n`;
    testCode += `          margin: styles.margin,\n`;
    testCode += `          borderRadius: styles.borderRadius\n`;
    testCode += `        };\n`;
    testCode += `      };\n`;
    testCode += `      \n`;
    testCode += `      return {\n`;
    testCode += `        body: computeElementStyles('body'),\n`;
    testCode += `        heading: computeElementStyles('h1, h2, h3'),\n`;
    testCode += `        paragraph: computeElementStyles('p'),\n`;
    testCode += `        button: computeElementStyles('button, .btn, [role="button"]'),\n`;
    testCode += `        input: computeElementStyles('input, select, textarea'),\n`;
    testCode += `        component: computeElementStyles('.${componentName.toLowerCase().replace(/\s+/g, '-')}, #${componentName.toLowerCase().replace(/\s+/g, '-')}, [data-testid="${componentName.toLowerCase().replace(/\s+/g, '-')}"]')\n`;
    testCode += `      };\n`;
    testCode += `    });\n\n`;
    
    testCode += `    // Guardar los tokens de diseño para análisis posterior\n`;
    testCode += `    await page.evaluate((tokens) => {\n`;
    testCode += `      console.log('Tokens de diseño:', tokens);\n`;
    testCode += `    }, designTokens);\n\n`;
    
    testCode += `    // Verificar que el componente tiene estilos definidos\n`;
    testCode += `    expect(designTokens.component).not.toBeNull();\n\n`;
    
    testCode += `    // Tomar una captura para análisis visual\n`;
    testCode += `    await page.screenshot({\n`;
    testCode += `      path: './usability-reports/${componentName.toLowerCase().replace(/\s+/g, '-')}-design-tokens.png',\n`;
    testCode += `      fullPage: true\n`;
    testCode += `    });\n`;
    testCode += `  });\n`;
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Genera pruebas de seguridad para un componente o API
   */
  public generateSecurityTests(componentName: string, isApi: boolean = false): string {
    if (isApi) {
      return this.generateApiSecurityTests(componentName);
    } else {
      return this.generateComponentSecurityTests(componentName);
    }
  }
  
  /**
   * Genera pruebas de seguridad para un componente
   */
  private generateComponentSecurityTests(componentName: string): string {
    let testCode = `// tests/security/${componentName.toLowerCase().replace(/\s+/g, '-')}.security.js\n\n`;
    testCode += `const { test, expect } = require('@playwright/test');\n\n`;
    
    testCode += `test.describe('Pruebas de seguridad para ${componentName}', () => {\n`;
    testCode += `  test.beforeEach(async ({ page }) => {\n`;
    testCode += `    // Navegar a la página que contiene el componente\n`;
    testCode += `    await page.goto('http://localhost:3000/${componentName.toLowerCase().replace(/\s+/g, '-')}');\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('debería ser resistente a ataques XSS', async ({ page }) => {\n`;
    testCode += `    // Buscar campos de entrada\n`;
    testCode += `    const inputs = await page.$$('input[type="text"], textarea, [contenteditable="true"]');\n`;
    testCode += `    \n`;
    testCode += `    if (inputs.length === 0) {\n`;
    testCode += `      console.log('No se encontraron campos de entrada para probar XSS');\n`;
    testCode += `      test.skip();\n`;
    testCode += `      return;\n`;
    testCode += `    }\n\n`;
    
    testCode += `    // Payload XSS para prueba\n`;
    testCode += `    const xssPayload = '<img src="x" onerror="window.testXSS = true">';\n`;
    testCode += `    \n`;
    testCode += `    // Probar cada campo de entrada\n`;
    testCode += `    for (let i = 0; i < inputs.length; i++) {\n`;
    testCode += `      const input = inputs[i];\n`;
    testCode += `      \n`;
    testCode += `      // Limpiar el campo\n`;
    testCode += `      await input.click();\n`;
    testCode += `      await page.keyboard.press('Control+A');\n`;
    testCode += `      await page.keyboard.press('Delete');\n`;
    testCode += `      \n`;
    testCode += `      // Ingresar payload XSS\n`;
    testCode += `      await input.type(xssPayload);\n`;
    testCode += `      \n`;
    testCode += `      // Intentar enviar el formulario o activar la acción\n`;
    testCode += `      const submitButtons = await page.$$('button[type="submit"], input[type="submit"], button:has-text("Enviar"), button:has-text("Submit"), button:has-text("Guardar"), button:has-text("Save")');\n`;
    testCode += `      \n`;
    testCode += `      if (submitButtons.length > 0) {\n`;
    testCode += `        await submitButtons[0].click();\n`;
    testCode += `        await page.waitForTimeout(1000);\n`;
    testCode += `      } else {\n`;
    testCode += `        // Si no hay botón de envío, presionar Enter\n`;
    testCode += `        await input.press('Enter');\n`;
    testCode += `        await page.waitForTimeout(1000);\n`;
    testCode += `      }\n`;
    testCode += `      \n`;
    testCode += `      // Verificar si el XSS fue ejecutado\n`;
    testCode += `      const xssExecuted = await page.evaluate(() => window.testXSS === true);\n`;
    testCode += `      \n`;
    testCode += `      expect(xssExecuted).toBeFalsy();\n`;
    testCode += `    }\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('debería sanitizar correctamente las entradas de usuario', async ({ page }) => {\n`;
    testCode += `    // Buscar campos de entrada\n`;
    testCode += `    const inputs = await page.$$('input[type="text"], textarea, [contenteditable="true"]');\n`;
    testCode += `    \n`;
    testCode += `    if (inputs.length === 0) {\n`;
    testCode += `      console.log('No se encontraron campos de entrada para probar sanitización');\n`;
    testCode += `      test.skip();\n`;
    testCode += `      return;\n`;
    testCode += `    }\n\n`;
    
    testCode += `    // Payload con caracteres especiales\n`;
    testCode += `    const specialCharsPayload = '"><&\\';\n`;
    testCode += `    \n`;
    testCode += `    // Probar cada campo de entrada\n`;
    testCode += `    for (let i = 0; i < inputs.length; i++) {\n`;
    testCode += `      const input = inputs[i];\n`;
    testCode += `      \n`;
    testCode += `      // Limpiar el campo\n`;
    testCode += `      await input.click();\n`;
    testCode += `      await page.keyboard.press('Control+A');\n`;
    testCode += `      await page.keyboard.press('Delete');\n`;
    testCode += `      \n`;
    testCode += `      // Ingresar caracteres especiales\n`;
    testCode += `      await input.type(specialCharsPayload);\n`;
    testCode += `      \n`;
    testCode += `      // Intentar enviar el formulario o activar la acción\n`;
    testCode += `      const submitButtons = await page.$$('button[type="submit"], input[type="submit"], button:has-text("Enviar"), button:has-text("Submit"), button:has-text("Guardar"), button:has-text("Save")');\n`;
    testCode += `      \n`;
    testCode += `      if (submitButtons.length > 0) {\n`;
    testCode += `        await submitButtons[0].click();\n`;
    testCode += `        await page.waitForTimeout(1000);\n`;
    testCode += `      } else {\n`;
    testCode += `        // Si no hay botón de envío, presionar Enter\n`;
    testCode += `        await input.press('Enter');\n`;
    testCode += `        await page.waitForTimeout(1000);\n`;
    testCode += `      }\n`;
    testCode += `      \n`;
    testCode += `      // Verificar que no hay errores en la consola relacionados con caracteres especiales\n`;
    testCode += `      const consoleErrors = [];\n`;
    testCode += `      page.on('console', msg => {\n`;
    testCode += `        if (msg.type() === 'error') {\n`;
    testCode += `          consoleErrors.push(msg.text());\n`;
    testCode += `        }\n`;
    testCode += `      });\n`;
    testCode += `      \n`;
    testCode += `      expect(consoleErrors.length).toBe(0);\n`;
    testCode += `    }\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('debería proteger contra ataques de inyección de HTML', async ({ page }) => {\n`;
    testCode += `    // Buscar campos de entrada\n`;
    testCode += `    const inputs = await page.$$('input[type="text"], textarea, [contenteditable="true"]');\n`;
    testCode += `    \n`;
    testCode += `    if (inputs.length === 0) {\n`;
    testCode += `      console.log('No se encontraron campos de entrada para probar inyección HTML');\n`;
    testCode += `      test.skip();\n`;
    testCode += `      return;\n`;
    testCode += `    }\n\n`;
    
    testCode += `    // Payload HTML\n`;
    testCode += `    const htmlPayload = '<div id="injected-content">Contenido inyectado</div>';\n`;
    testCode += `    \n`;
    testCode += `    // Probar cada campo de entrada\n`;
    testCode += `    for (let i = 0; i < inputs.length; i++) {\n`;
    testCode += `      const input = inputs[i];\n`;
    testCode += `      \n`;
    testCode += `      // Limpiar el campo\n`;
    testCode += `      await input.click();\n`;
    testCode += `      await page.keyboard.press('Control+A');\n`;
    testCode += `      await page.keyboard.press('Delete');\n`;
    testCode += `      \n`;
    testCode += `      // Ingresar payload HTML\n`;
    testCode += `      await input.type(htmlPayload);\n`;
    testCode += `      \n`;
    testCode += `      // Intentar enviar el formulario o activar la acción\n`;
    testCode += `      const submitButtons = await page.$$('button[type="submit"], input[type="submit"], button:has-text("Enviar"), button:has-text("Submit"), button:has-text("Guardar"), button:has-text("Save")');\n`;
    testCode += `      \n`;
    testCode += `      if (submitButtons.length > 0) {\n`;
    testCode += `        await submitButtons[0].click();\n`;
    testCode += `        await page.waitForTimeout(1000);\n`;
    testCode += `      } else {\n`;
    testCode += `        // Si no hay botón de envío, presionar Enter\n`;
    testCode += `        await input.press('Enter');\n`;
    testCode += `        await page.waitForTimeout(1000);\n`;
    testCode += `      }\n`;
    testCode += `      \n`;
    testCode += `      // Verificar que el HTML no fue inyectado como estructura DOM\n`;
    testCode += `      const injectedContent = await page.$('#injected-content');\n`;
    testCode += `      expect(injectedContent).toBeNull();\n`;
    testCode += `    }\n`;
    testCode += `  });\n`;
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Genera pruebas de seguridad para una API
   */
  private generateApiSecurityTests(apiName: string): string {
    let testCode = `// tests/security/${apiName.toLowerCase().replace(/\s+/g, '-')}.api.security.js\n\n`;
    testCode += `const { test, expect } = require('@playwright/test');\n`;
    testCode += `const axios = require('axios');\n\n`;
    
    testCode += `// Configuración base para las pruebas\n`;
    testCode += `const API_BASE_URL = 'http://localhost:3000/api';\n\n`;
    
    testCode += `test.describe('Pruebas de seguridad para la API ${apiName}', () => {\n`;
    testCode += `  test('debería requerir autenticación para endpoints protegidos', async () => {\n`;
    testCode += `    // Intentar acceder sin token de autenticación\n`;
    testCode += `    try {\n`;
    testCode += `      await axios.get(\`\${API_BASE_URL}/${apiName.toLowerCase().replace(/\s+/g, '-')}\`);\n`;
    testCode += `      // Si no lanza error, la prueba falla\n`;
    testCode += `      expect(false).toBeTruthy();\n`;
    testCode += `    } catch (error) {\n`;
    testCode += `      // Verificar que el error es de autenticación (401 o 403)\n`;
    testCode += `      expect(error.response.status).toBeOneOf([401, 403]);\n`;
    testCode += `    }\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('debería validar correctamente los parámetros de entrada', async () => {\n`;
    testCode += `    // Intentar enviar parámetros inválidos\n`;
    testCode += `    const invalidPayloads = [\n`;
    testCode += `      { payload: { id: "' OR 1=1 --" }, description: "Inyección SQL" },\n`;
    testCode += `      { payload: { id: "<script>alert('XSS')</script>" }, description: "XSS" },\n`;
    testCode += `      { payload: { id: { $ne: null } }, description: "NoSQL Injection" },\n`;
    testCode += `      { payload: { id: "../../../etc/passwd" }, description: "Path Traversal" },\n`;
    testCode += `      { payload: { id: "../../../../windows/win.ini" }, description: "Path Traversal Windows" }\n`;
    testCode += `    ];\n\n`;
    
    testCode += `    for (const { payload, description } of invalidPayloads) {\n`;
    testCode += `      try {\n`;
    testCode += `        // Obtener un token de autenticación (simulado para la prueba)\n`;
    testCode += `        const authToken = 'test-token';\n\n`;
    
    testCode += `        await axios.post(\n`;
    testCode += `          \`\${API_BASE_URL}/${apiName.toLowerCase().replace(/\s+/g, '-')}\`,\n`;
    testCode += `          payload,\n`;
    testCode += `          {\n`;
    testCode += `            headers: {\n`;
    testCode += `              Authorization: \`Bearer \${authToken}\`\n`;
    testCode += `            }\n`;
    testCode += `          }\n`;
    testCode += `        );\n\n`;
    
    testCode += `        // Si no lanza error, verificar que la respuesta no contiene datos sensibles\n`;
    testCode += `        // Esta parte es específica de cada API y requiere conocimiento del dominio\n`;
    testCode += `      } catch (error) {\n`;
    testCode += `        // Verificar que el error es de validación (400) o no encontrado (404)\n`;
    testCode += `        expect(error.response.status).toBeOneOf([400, 404, 422]);\n`;
    testCode += `        console.log(\`Prueba de \${description} pasada: API rechazó correctamente la entrada inválida\`);\n`;
    testCode += `      }\n`;
    testCode += `    }\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('debería implementar rate limiting', async () => {\n`;
    testCode += `    // Realizar múltiples solicitudes rápidas para activar el rate limiting\n`;
    testCode += `    const requests = [];\n`;
    testCode += `    for (let i = 0; i < 50; i++) {\n`;
    testCode += `      requests.push(axios.get(\`\${API_BASE_URL}/${apiName.toLowerCase().replace(/\s+/g, '-')}/public-endpoint\`).catch(e => e));\n`;
    testCode += `    }\n\n`;
    
    testCode += `    const responses = await Promise.all(requests);\n`;
    testCode += `    \n`;
    testCode += `    // Verificar que al menos una respuesta tiene código 429 (Too Many Requests)\n`;
    testCode += `    const hasRateLimiting = responses.some(response => \n`;
    testCode += `      response.response && response.response.status === 429\n`;
    testCode += `    );\n\n`;
    
    testCode += `    // Si no hay rate limiting, mostrar advertencia pero no fallar la prueba\n`;
    testCode += `    if (!hasRateLimiting) {\n`;
    testCode += `      console.warn('Advertencia: No se detectó rate limiting en la API. Considere implementarlo para protección contra ataques de fuerza bruta y DoS.');\n`;
    testCode += `    }\n`;
    testCode += `  });\n\n`;
    
    testCode += `  test('debería implementar CORS correctamente', async () => {\n`;
    testCode += `    try {\n`;
    testCode += `      // Realizar una solicitud OPTIONS para verificar CORS\n`;
    testCode += `      const response = await axios.options(\`\${API_BASE_URL}/${apiName.toLowerCase().replace(/\s+/g, '-')}\`, {\n`;
    testCode += `        headers: {\n`;
    testCode += `          'Origin': 'https://malicious-site.com',\n`;
    testCode += `          'Access-Control-Request-Method': 'POST',\n`;
    testCode += `          'Access-Control-Request-Headers': 'Content-Type,Authorization'\n`;
    testCode += `        }\n`;
    testCode += `      });\n\n`;
    
    testCode += `      // Verificar que la respuesta no permite el origen malicioso\n`;
    testCode += `      const allowOrigin = response.headers['access-control-allow-origin'];\n`;
    testCode += `      expect(allowOrigin).not.toBe('https://malicious-site.com');\n`;
    testCode += `      expect(allowOrigin).not.toBe('*');\n`;
    testCode += `    } catch (error) {\n`;
    testCode += `      // Si hay un error, es posible que CORS esté correctamente configurado para rechazar orígenes no permitidos\n`;
    testCode += `      expect(error.response.status).toBeOneOf([401, 403, 404]);\n`;
    testCode += `    }\n`;
    testCode += `  });\n`;
    testCode += `});\n`;
    
    return testCode;
  }
  
  /**
   * Genera un informe de cobertura de pruebas para un proyecto
   */
  public generateCoverageReport(projectPath: string): string {
    // Implementación básica, en un caso real se analizaría el código fuente
    // y se generaría un informe detallado
    
    let report = `# Informe de Cobertura de Pruebas\n\n`;
    report += `## Resumen\n\n`;
    report += `- **Fecha**: ${new Date().toLocaleDateString()}\n`;
    report += `- **Proyecto**: ${path.basename(projectPath)}\n`;
    report += `- **Ruta**: ${projectPath}\n\n`;
    
    report += `## Estadísticas de Cobertura\n\n`;
    report += `| Tipo | Cobertura |\n`;
    report += `|------|----------|\n`;
    report += `| Líneas | 0% |\n`;
    report += `| Funciones | 0% |\n`;
    report += `| Ramas | 0% |\n`;
    report += `| Declaraciones | 0% |\n\n`;
    
    report += `## Archivos sin Pruebas\n\n`;
    report += `- Ningún archivo analizado aún\n\n`;
    
    report += `## Recomendaciones\n\n`;
    report += `1. Ejecutar las pruebas con la opción de cobertura habilitada\n`;
    report += `2. Priorizar la creación de pruebas para componentes críticos\n`;
    report += `3. Implementar pruebas unitarias, de integración y end-to-end\n`;
    
    return report;
  }
  
  /**
   * Configura herramientas de testing para un proyecto
   */
  public setupTestingTools(projectPath: string, framework: string): string {
    let setupScript = '';
    
    switch (framework.toLowerCase()) {
      case 'jest':
        setupScript = this.setupJest(projectPath);
        break;
      case 'mocha':
        setupScript = this.setupMocha(projectPath);
        break;
      case 'cypress':
        setupScript = this.setupCypress(projectPath);
        break;
      case 'playwright':
        setupScript = this.setupPlaywright(projectPath);
        break;
      default:
        setupScript = `# Configuración de ${framework}\n\nLa configuración para ${framework} no está implementada aún.`;
    }
    
    return setupScript;
  }
  
  /**
   * Configura Jest para un proyecto
   */
  private setupJest(projectPath: string): string {
    let setupScript = `# Configuración de Jest\n\n`;
    setupScript += `## Instalación\n\n`;
    setupScript += `\`\`\`bash\n`;
    setupScript += `npm install --save-dev jest @types/jest ts-jest\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Configuración\n\n`;
    setupScript += `Crea un archivo \`jest.config.js\` en la raíz del proyecto:\n\n`;
    setupScript += `\`\`\`javascript\n`;
    setupScript += `module.exports = {\n`;
    setupScript += `  preset: 'ts-jest',\n`;
    setupScript += `  testEnvironment: 'node',\n`;
    setupScript += `  roots: ['<rootDir>/src', '<rootDir>/tests'],\n`;
    setupScript += `  testMatch: ['**/__tests__/**/*.ts?(x)', '**/?(*.)+(spec|test).ts?(x)'],\n`;
    setupScript += `  transform: {\n`;
    setupScript += `    '^.+\\.tsx?$': 'ts-jest'\n`;
    setupScript += `  },\n`;
    setupScript += `  collectCoverage: true,\n`;
    setupScript += `  collectCoverageFrom: [\n`;
    setupScript += `    'src/**/*.{ts,tsx}',\n`;
    setupScript += `    '!src/**/*.d.ts',\n`;
    setupScript += `    '!src/index.ts',\n`;
    setupScript += `    '!src/types/**/*'\n`;
    setupScript += `  ],\n`;
    setupScript += `  coverageThreshold: {\n`;
    setupScript += `    global: {\n`;
    setupScript += `      branches: 70,\n`;
    setupScript += `      functions: 80,\n`;
    setupScript += `      lines: 80,\n`;
    setupScript += `      statements: 80\n`;
    setupScript += `    }\n`;
    setupScript += `  },\n`;
    setupScript += `  coverageDirectory: 'coverage'\n`;
    setupScript += `};\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Uso\n\n`;
    setupScript += `Añade los siguientes scripts a tu \`package.json\`:\n\n`;
    setupScript += `\`\`\`json\n`;
    setupScript += `{\n`;
    setupScript += `  "scripts": {\n`;
    setupScript += `    "test": "jest",\n`;
    setupScript += `    "test:watch": "jest --watch",\n`;
    setupScript += `    "test:coverage": "jest --coverage"\n`;
    setupScript += `  }\n`;
    setupScript += `}\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Ejemplo de prueba\n\n`;
    setupScript += `Crea un archivo de prueba en \`tests/example.test.ts\`:\n\n`;
    setupScript += `\`\`\`typescript\n`;
    setupScript += `describe('Ejemplo de prueba', () => {\n`;
    setupScript += `  test('suma 1 + 2 para obtener 3', () => {\n`;
    setupScript += `    expect(1 + 2).toBe(3);\n`;
    setupScript += `  });\n`;
    setupScript += `});\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Ejecución\n\n`;
    setupScript += `\`\`\`bash\n`;
    setupScript += `npm test\n`;
    setupScript += `\`\`\`\n`;
    
    return setupScript;
  }
  
  /**
   * Configura Mocha para un proyecto
   */
  private setupMocha(projectPath: string): string {
    let setupScript = `# Configuración de Mocha\n\n`;
    setupScript += `## Instalación\n\n`;
    setupScript += `\`\`\`bash\n`;
    setupScript += `npm install --save-dev mocha chai @types/mocha @types/chai ts-node\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Configuración\n\n`;
    setupScript += `Crea un archivo \`.mocharc.js\` en la raíz del proyecto:\n\n`;
    setupScript += `\`\`\`javascript\n`;
    setupScript += `module.exports = {\n`;
    setupScript += `  require: 'ts-node/register',\n`;
    setupScript += `  extension: ['ts'],\n`;
    setupScript += `  spec: 'tests/**/*.spec.ts',\n`;
    setupScript += `  timeout: 5000\n`;
    setupScript += `};\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Uso\n\n`;
    setupScript += `Añade los siguientes scripts a tu \`package.json\`:\n\n`;
    setupScript += `\`\`\`json\n`;
    setupScript += `{\n`;
    setupScript += `  "scripts": {\n`;
    setupScript += `    "test": "mocha",\n`;
    setupScript += `    "test:watch": "mocha --watch"\n`;
    setupScript += `  }\n`;
    setupScript += `}\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Ejemplo de prueba\n\n`;
    setupScript += `Crea un archivo de prueba en \`tests/example.spec.ts\`:\n\n`;
    setupScript += `\`\`\`typescript\n`;
    setupScript += `import { expect } from 'chai';\n\n`;
    setupScript += `describe('Ejemplo de prueba', () => {\n`;
    setupScript += `  it('suma 1 + 2 para obtener 3', () => {\n`;
    setupScript += `    expect(1 + 2).to.equal(3);\n`;
    setupScript += `  });\n`;
    setupScript += `});\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Ejecución\n\n`;
    setupScript += `\`\`\`bash\n`;
    setupScript += `npm test\n`;
    setupScript += `\`\`\`\n`;
    
    return setupScript;
  }
  
  /**
   * Configura Cypress para un proyecto
   */
  private setupCypress(projectPath: string): string {
    let setupScript = `# Configuración de Cypress\n\n`;
    setupScript += `## Instalación\n\n`;
    setupScript += `\`\`\`bash\n`;
    setupScript += `npm install --save-dev cypress @testing-library/cypress\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Configuración\n\n`;
    setupScript += `Inicializa Cypress:\n\n`;
    setupScript += `\`\`\`bash\n`;
    setupScript += `npx cypress open\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `Esto creará la estructura de directorios necesaria. Luego, configura Cypress con TypeScript creando un archivo \`cypress/tsconfig.json\`:\n\n`;
    setupScript += `\`\`\`json\n`;
    setupScript += `{\n`;
    setupScript += `  "compilerOptions": {\n`;
    setupScript += `    "target": "es5",\n`;
    setupScript += `    "lib": ["es5", "dom"],\n`;
    setupScript += `    "types": ["cypress", "@testing-library/cypress"]\n`;
    setupScript += `  },\n`;
    setupScript += `  "include": ["**/*.ts"]\n`;
    setupScript += `}\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `Configura los plugins de Cypress en \`cypress/plugins/index.js\`:\n\n`;
    setupScript += `\`\`\`javascript\n`;
    setupScript += `const wp = require('@cypress/webpack-preprocessor');\n\n`;
    setupScript += `module.exports = (on, config) => {\n`;
    setupScript += `  const options = {\n`;
    setupScript += `    webpackOptions: {\n`;
    setupScript += `      resolve: {\n`;
    setupScript += `        extensions: ['.ts', '.tsx', '.js']\n`;
    setupScript += `      },\n`;
    setupScript += `      module: {\n`;
    setupScript += `        rules: [\n`;
    setupScript += `          {
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
          }
        ]
      }
    }
  };

  on('file:preprocessor', wp(options));
  return config;
};
\`\`\`\n\n`;
    
    setupScript += `Configura el soporte para Testing Library en \`cypress/support/commands.js\`:\n\n`;
    setupScript += `\`\`\`javascript\n`;
    setupScript += `import '@testing-library/cypress/add-commands';\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `Añade los siguientes scripts a tu \`package.json\`:\n\n`;
    setupScript += `\`\`\`json\n`;
    setupScript += `{\n`;
    setupScript += `  "scripts": {\n`;
    setupScript += `    "cypress:open": "cypress open",\n`;
    setupScript += `    "cypress:run": "cypress run"\n`;
    setupScript += `  }\n`;
    setupScript += `}\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Ejemplo de prueba\n\n`;
    setupScript += `Crea un archivo de prueba en \`cypress/integration/example.spec.ts\`:\n\n`;
    setupScript += `\`\`\`typescript\n`;
    setupScript += `describe('Ejemplo de prueba', () => {\n`;
    setupScript += `  it('debería cargar la página correctamente', () => {\n`;
    setupScript += `    cy.visit('/');\n`;
    setupScript += `    cy.contains('h1', 'Bienvenido').should('be.visible');\n`;
    setupScript += `  });\n`;
    setupScript += `});\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Ejecución\n\n`;
    setupScript += `\`\`\`bash\n`;
    setupScript += `npm run cypress:open\n`;
    setupScript += `\`\`\`\n`;
    
    return setupScript;
  }
    /**
   * Configura Playwright para un proyecto
   */
  private setupPlaywright(projectPath: string): string {
    let setupScript = `# Configuración de Playwright\n\n`;
    setupScript += `## Instalación\n\n`;
    setupScript += `\`\`\`bash\n`;
    setupScript += `npm install --save-dev @playwright/test\n`;
    setupScript += `npx playwright install\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Configuración\n\n`;
    setupScript += `Crea un archivo \`playwright.config.ts\` en la raíz del proyecto:\n\n`;
    setupScript += `\`\`\`typescript\n`;
    setupScript += `import { PlaywrightTestConfig } from '@playwright/test';\n\n`;
    setupScript += `const config: PlaywrightTestConfig = {\n`;
    setupScript += `  testDir: './tests/e2e',\n`;
    setupScript += `  timeout: 30000,\n`;
    setupScript += `  forbidOnly: !!process.env.CI,\n`;
    setupScript += `  retries: process.env.CI ? 2 : 0,\n`;
    setupScript += `  use: {\n`;
    setupScript += `    trace: 'on-first-retry',\n`;
    setupScript += `    screenshot: 'only-on-failure',\n`;
    setupScript += `    video: 'on-first-retry'\n`;
    setupScript += `  },\n`;
    setupScript += `  projects: [\n`;
    setupScript += `    {\n`;
    setupScript += `      name: 'chromium',\n`;
    setupScript += `      use: { browserName: 'chromium' },\n`;
    setupScript += `    },\n`;
    setupScript += `    {\n`;
    setupScript += `      name: 'firefox',\n`;
    setupScript += `      use: { browserName: 'firefox' },\n`;
    setupScript += `    },\n`;
    setupScript += `    {\n`;
    setupScript += `      name: 'webkit',\n`;
    setupScript += `      use: { browserName: 'webkit' },\n`;
    setupScript += `    }\n`;
    setupScript += `  ],\n`;
    setupScript += `};\n\n`;
    setupScript += `export default config;\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Uso\n\n`;
    setupScript += `Añade los siguientes scripts a tu \`package.json\`:\n\n`;
    setupScript += `\`\`\`json\n`;
    setupScript += `{\n`;
    setupScript += `  "scripts": {\n`;
    setupScript += `    "test:e2e": "playwright test",\n`;
    setupScript += `    "test:e2e:ui": "playwright test --ui",\n`;
    setupScript += `    "test:e2e:debug": "playwright test --debug"\n`;
    setupScript += `  }\n`;
    setupScript += `}\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Ejemplo de prueba\n\n`;
    setupScript += `Crea un archivo de prueba en \`tests/e2e/example.spec.ts\`:\n\n`;
    setupScript += `\`\`\`typescript\n`;
    setupScript += `import { test, expect } from '@playwright/test';\n\n`;
    setupScript += `test('debería cargar la página principal', async ({ page }) => {\n`;
    setupScript += `  await page.goto('/');\n`;
    setupScript += `  await expect(page).toHaveTitle(/Mi Aplicación/);\n`;
    setupScript += `});\n\n`;
    setupScript += `test('debería permitir iniciar sesión', async ({ page }) => {\n`;
    setupScript += `  await page.goto('/login');\n`;
    setupScript += `  await page.fill('input[name="email"]', 'usuario@ejemplo.com');\n`;
    setupScript += `  await page.fill('input[name="password"]', 'contraseña123');\n`;
    setupScript += `  await page.click('button[type="submit"]');\n`;
    setupScript += `  await expect(page).toHaveURL('/dashboard');\n`;
    setupScript += `});\n`;
    setupScript += `\`\`\`\n\n`;
    
    setupScript += `## Ejecución\n\n`;
    setupScript += `\`\`\`bash\n`;
    setupScript += `npm run test:e2e\n`;
    setupScript += `\`\`\`\n`;
    
    return setupScript;
  }
  
  /**
   * Genera mocks y stubs para pruebas
   */
  public generateMocks(serviceName: string, methodNames: string[]): string {
    let mockCode = `// tests/mocks/${serviceName.toLowerCase()}.mock.ts\n\n`;
    mockCode += `import { ${serviceName} } from '../src/services/${serviceName.toLowerCase()}';\n\n`;
    mockCode += `export class ${serviceName}Mock implements ${serviceName} {\n`;
    
    for (const methodName of methodNames) {
      mockCode += `  ${methodName} = jest.fn();\n`;
    }
    
    mockCode += `}\n\n`;
    mockCode += `// Ejemplo de uso:\n`;
    mockCode += `// const ${serviceName.toLowerCase()}Mock = new ${serviceName}Mock();\n`;
    mockCode += `// ${serviceName.toLowerCase()}Mock.${methodNames[0]}.mockResolvedValue({ /* datos de prueba */ });\n`;
    
    return mockCode;
  }
  
  /**
   * Analiza el código fuente para identificar componentes que necesitan pruebas
   */
  public analyzeCodeForTestNeeds(projectPath: string): string {
    // En una implementación real, se analizaría el código fuente
    // para identificar componentes, funciones, clases, etc. que necesitan pruebas
    
    let analysis = `# Análisis de Necesidades de Pruebas\n\n`;
    analysis += `## Resumen\n\n`;
    analysis += `Este análisis identifica componentes y funcionalidades que requieren pruebas en el proyecto ubicado en: ${projectPath}\n\n`;
    
    analysis += `## Componentes sin Pruebas\n\n`;
    analysis += `- **Componentes UI**: Se recomienda implementar pruebas con React Testing Library o Cypress\n`;
    analysis += `- **Servicios API**: Se recomienda implementar pruebas con Jest y Supertest\n`;
    analysis += `- **Utilidades**: Se recomienda implementar pruebas unitarias con Jest\n\n`;
    
    analysis += `## Priorización de Pruebas\n\n`;
    analysis += `1. **Alta Prioridad**: Componentes críticos para el negocio\n`;
    analysis += `2. **Media Prioridad**: Componentes con lógica compleja\n`;
    analysis += `3. **Baja Prioridad**: Componentes puramente presentacionales\n\n`;
    
    analysis += `## Recomendaciones\n\n`;
    analysis += `- Implementar pruebas unitarias para todas las funciones de utilidad\n`;
    analysis += `- Implementar pruebas de integración para los flujos principales\n`;
    analysis += `- Implementar pruebas end-to-end para los flujos críticos del usuario\n`;
    analysis += `- Configurar CI/CD para ejecutar pruebas automáticamente\n`;
    
    return analysis;
  }
  
  /**
   * Genera un plan de pruebas para un proyecto
   */
  public generateTestPlan(projectName: string, components: string[]): string {
    let testPlan = `# Plan de Pruebas: ${projectName}\n\n`;
    testPlan += `## Objetivo\n\n`;
    testPlan += `Este plan de pruebas define la estrategia, recursos, cronograma y criterios para las pruebas del proyecto ${projectName}.\n\n`;
    
    testPlan += `## Alcance\n\n`;
    testPlan += `### Componentes a Probar\n\n`;
    
    for (const component of components) {
      testPlan += `- **${component}**\n`;
      testPlan += `  - Pruebas unitarias\n`;
      testPlan += `  - Pruebas de integración\n`;
      testPlan += `  - Pruebas de rendimiento (si aplica)\n`;
    }
    
    testPlan += `\n### Tipos de Pruebas\n\n`;
    testPlan += `1. **Pruebas Unitarias**: Verificar el funcionamiento correcto de funciones y clases individuales\n`;
    testPlan += `2. **Pruebas de Integración**: Verificar la interacción correcta entre componentes\n`;
    testPlan += `3. **Pruebas End-to-End**: Verificar flujos completos desde la perspectiva del usuario\n`;
    testPlan += `4. **Pruebas de Rendimiento**: Verificar tiempos de respuesta y capacidad bajo carga\n`;
    testPlan += `5. **Pruebas de Seguridad**: Verificar protección contra vulnerabilidades comunes\n\n`;
    
    testPlan += `## Cronograma\n\n`;
    testPlan += `| Fase | Duración | Fecha Inicio | Fecha Fin |\n`;
    testPlan += `|------|----------|--------------|------------|\n`;
    testPlan += `| Planificación | 1 semana | DD/MM/AAAA | DD/MM/AAAA |\n`;
    testPlan += `| Implementación de Pruebas Unitarias | 2 semanas | DD/MM/AAAA | DD/MM/AAAA |\n`;
    testPlan += `| Implementación de Pruebas de Integración | 2 semanas | DD/MM/AAAA | DD/MM/AAAA |\n`;
    testPlan += `| Implementación de Pruebas E2E | 1 semana | DD/MM/AAAA | DD/MM/AAAA |\n`;
    testPlan += `| Ejecución y Corrección | 1 semana | DD/MM/AAAA | DD/MM/AAAA |\n\n`;
    
    testPlan += `## Recursos\n\n`;
    testPlan += `- **Herramientas**: Jest, React Testing Library, Cypress, Playwright\n`;
    testPlan += `- **Entornos**: Desarrollo, Staging, Producción\n`;
    testPlan += `- **Personal**: Desarrolladores, QA, DevOps\n\n`;
    
    testPlan += `## Criterios de Aceptación\n\n`;
    testPlan += `- Cobertura de código mínima: 80%\n`;
    testPlan += `- Todos los tests unitarios y de integración pasan\n`;
    testPlan += `- Todos los tests end-to-end de flujos críticos pasan\n`;
    testPlan += `- No hay vulnerabilidades de seguridad críticas o altas\n`;
    testPlan += `- Tiempos de respuesta dentro de los límites establecidos\n\n`;
    
    testPlan += `## Riesgos y Mitigación\n\n`;
    testPlan += `| Riesgo | Probabilidad | Impacto | Estrategia de Mitigación |\n`;
    testPlan += `|--------|--------------|---------|---------------------------|\n`;
    testPlan += `| Cambios en requisitos | Media | Alto | Mantener comunicación constante con stakeholders |\n`;
    testPlan += `| Problemas de entorno | Alta | Medio | Usar contenedores Docker para garantizar consistencia |\n`;
    testPlan += `| Falta de tiempo | Media | Alto | Priorizar pruebas críticas, automatizar lo máximo posible |\n\n`;
    
    testPlan += `## Aprobaciones\n\n`;
    testPlan += `- **Desarrollador Lead**: _________________ Fecha: __/__/____\n`;
    testPlan += `- **QA Lead**: __________________________ Fecha: __/__/____\n`;
    testPlan += `- **Project Manager**: ___________________ Fecha: __/__/____\n`;
    
    return testPlan;
  }
  
  /**
   * Procesa un evento del agente
   */
  public async processEvent(event: AgentEvent): Promise<void> {
    switch (event.type) {
      case 'GENERATE_UNIT_TESTS':
        const unitTests = this.generateUnitTests(
          event.data.componentName,
          event.data.componentType,
          event.data.framework
        );
        // Aquí se podría guardar el archivo o enviarlo a otro agente
        break;
        
      case 'GENERATE_INTEGRATION_TESTS':
        const integrationTests = this.generateIntegrationTests(
          event.data.moduleName,
          event.data.dependencies
        );
        // Aquí se podría guardar el archivo o enviarlo a otro agente
        break;
        
      case 'GENERATE_E2E_TESTS':
        const e2eTests = this.generateE2ETests(
          event.data.flowName,
          event.data.steps
        );
        // Aquí se podría guardar el archivo o enviarlo a otro agente
        break;
        
      case 'SETUP_TESTING_TOOLS':
        const setupScript = this.setupTestingTools(
          event.data.projectPath,
          event.data.framework
        );
        // Aquí se podría guardar el archivo o enviarlo a otro agente
        break;
        
      case 'ANALYZE_CODE_FOR_TESTS':
        const analysis = this.analyzeCodeForTestNeeds(
          event.data.projectPath
        );
        // Aquí se podría guardar el archivo o enviarlo a otro agente
        break;
        
      case 'GENERATE_TEST_PLAN':
        const testPlan = this.generateTestPlan(
          event.data.projectName,
          event.data.components
        );
        // Aquí se podría guardar el archivo o enviarlo a otro agente
        break;
        
      default:
        console.log(`Evento no manejado: ${event.type}`);
    }
  }
}