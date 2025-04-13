import { BaseAgent, AgentEventType } from './base-agent';
import fs from 'fs';
import path from 'path';
import glob from 'glob';

/**
 * TestAgent se encarga de generar y ejecutar pruebas automatizadas para componentes y funcionalidades
 * del sistema. Soporta pruebas unitarias, de integración, de usabilidad y de accesibilidad.
 */
export class TestAgent extends BaseAgent {
  private testsDir: string = path.join(process.cwd(), 'tests');
  private lastGeneratedTests: string[] = [];
  private testConfig: TestConfig = {
    framework: 'jest',
    coverage: true,
    includeAccessibility: true,
    includeUsability: true,
    includeIntegration: true,
    includeE2E: false
  };

  constructor() {
    super('Test Agent');
    this.registerEventHandlers();
    this.initializeTestDirectory();
  }

  private initializeTestDirectory(): void {
    if (!fs.existsSync(this.testsDir)) {
      fs.mkdirSync(this.testsDir, { recursive: true });
      this.log('📁 Directorio de pruebas creado');
    }
    
    // Crear subdirectorios para diferentes tipos de pruebas
    const testTypes = ['unit', 'integration', 'accessibility', 'usability', 'e2e'];
    testTypes.forEach(type => {
      const typeDir = path.join(this.testsDir, type);
      if (!fs.existsSync(typeDir)) {
        fs.mkdirSync(typeDir, { recursive: true });
        this.log(`📁 Directorio para pruebas de ${type} creado`);
      }
    });
  }

  private registerEventHandlers(): void {
    // Escuchar solicitudes de generación de pruebas
    this.listenForEvent(AgentEventType.TEST_REQUESTED, async (message) => {
      this.log(`🧪 Solicitud de pruebas recibida de ${message.from}: "${message.content.componentName}"`);
      try {
        const testFileName = await this.generateTests(
          message.content.componentName, 
          message.content.componentPath,
          message.content.testTypes || ['unit']
        );
        
        this.sendEvent(AgentEventType.TEST_CREATED, {
          testFileName,
          path: path.join(this.testsDir, testFileName),
          timestamp: new Date().toISOString(),
        }, message.from);
      } catch (error) {
        this.log(`❌ Error generando pruebas: ${error.message}`, 'error');
        this.sendEvent(AgentEventType.TEST_ERROR, {
          error: error.message,
          componentName: message.content.componentName,
          timestamp: new Date().toISOString(),
        }, message.from);
      }
    });

    // Escuchar solicitudes de ejecución de pruebas
    this.listenForEvent(AgentEventType.TEST_RUN_REQUESTED, async (message) => {
      this.log(`🧪 Solicitud de ejecución de pruebas recibida de ${message.from}`);
      try {
        const results = await this.runTests(message.content.testPath || this.testsDir);
        this.sendEvent(AgentEventType.TEST_RESULTS, {
          results,
          timestamp: new Date().toISOString(),
        }, message.from);
      } catch (error) {
        this.log(`❌ Error ejecutando pruebas: ${error.message}`, 'error');
        this.sendEvent(AgentEventType.TEST_ERROR, {
          error: error.message,
          timestamp: new Date().toISOString(),
        }, message.from);
      }
    });

    // Escuchar solicitudes de configuración de pruebas
    this.listenForEvent(AgentEventType.TEST_CONFIG_UPDATED, (message) => {
      this.log(`⚙️ Configuración de pruebas actualizada por ${message.from}`);
      this.updateTestConfig(message.content.config);
      this.sendEvent(AgentEventType.TEST_CONFIG_APPLIED, {
        config: this.testConfig,
        timestamp: new Date().toISOString(),
      }, message.from);
    });

    // Escuchar solicitudes de revisión de código para generar pruebas
    this.listenForEvent(AgentEventType.CODE_REVIEW_COMPLETED, async (message) => {
      if (message.content.suggestTests) {
        this.log(`📋 Solicitud de pruebas basada en revisión de código de ${message.from}`);
        try {
          const testFiles = await this.generateTestsFromReview(
            message.content.reviewedFiles,
            message.content.suggestions
          );
          
          this.sendEvent(AgentEventType.TEST_CREATED, {
            testFiles,
            timestamp: new Date().toISOString(),
          }, message.from);
        } catch (error) {
          this.log(`❌ Error generando pruebas desde revisión: ${error.message}`, 'error');
        }
      }
    });
  }

  /**
   * Actualiza la configuración de pruebas
   */
  private updateTestConfig(config: Partial<TestConfig>): void {
    this.testConfig = { ...this.testConfig, ...config };
    this.log(`⚙️ Configuración actualizada: ${JSON.stringify(this.testConfig)}`);
  }

  /**
   * Genera pruebas para un componente específico
   */
  async generateTests(
    componentName: string, 
    componentPath: string,
    testTypes: TestType[] = ['unit']
  ): Promise<string> {
    this.log(`🧪 Generando pruebas para el componente: ${componentName}`);
    this.log(`📋 Tipos de prueba solicitados: ${testTypes.join(', ')}`);

    if (!fs.existsSync(componentPath)) {
      throw new Error(`El componente no existe en la ruta: ${componentPath}`);
    }

    const componentCode = fs.readFileSync(componentPath, 'utf-8');
    const fileExtension = path.extname(componentPath);
    const isReactComponent = fileExtension === '.tsx' || fileExtension === '.jsx';
    const isTypescript = fileExtension === '.ts' || fileExtension === '.tsx';
    
    // Generar pruebas para cada tipo solicitado
    const generatedTests: Record<string, string> = {};
    
    for (const testType of testTypes) {
      let testCode: string;
      let testFileName: string;
      
      switch (testType) {
        case 'unit':
          testCode = this.generateUnitTestCode(componentName, componentCode, isReactComponent, isTypescript);
          testFileName = `${componentName}.test${isTypescript ? '.tsx' : '.jsx'}`;
          break;
        case 'integration':
          testCode = this.generateIntegrationTestCode(componentName, componentCode, isReactComponent, isTypescript);
          testFileName = `${componentName}.integration.test${isTypescript ? '.tsx' : '.jsx'}`;
          break;
        case 'accessibility':
          if (!isReactComponent) {
            this.log(`⚠️ Las pruebas de accesibilidad solo están disponibles para componentes React`, 'warning');
            continue;
          }
          testCode = this.generateAccessibilityTestCode(componentName, componentCode, isTypescript);
          testFileName = `${componentName}.a11y.test${isTypescript ? '.tsx' : '.jsx'}`;
          break;
        case 'usability':
          if (!isReactComponent) {
            this.log(`⚠️ Las pruebas de usabilidad solo están disponibles para componentes React`, 'warning');
            continue;
          }
          testCode = this.generateUsabilityTestCode(componentName, componentCode, isTypescript);
          testFileName = `${componentName}.usability.test${isTypescript ? '.tsx' : '.jsx'}`;
          break;
        case 'e2e':
          testCode = this.generateE2ETestCode(componentName, componentCode, isReactComponent, isTypescript);
          testFileName = `${componentName}.e2e.test${isTypescript ? '.ts' : '.js'}`;
          break;
        default:
          this.log(`⚠️ Tipo de prueba no soportado: ${testType}`, 'warning');
          continue;
      }
      
      // Guardar el archivo de prueba en el directorio correspondiente
      const testDir = path.join(this.testsDir, testType);
      const testPath = path.join(testDir, testFileName);
      
      fs.writeFileSync(testPath, testCode, 'utf-8');
      this.lastGeneratedTests.push(testPath);
      this.log(`✅ Pruebas de ${testType} generadas: ${testPath}`);
      
      generatedTests[testType] = testPath;
    }
    
    // Generar archivo de configuración de pruebas si no existe
    this.ensureTestConfigExists();
    
    // Devolver el nombre del archivo de prueba unitaria (para compatibilidad con versiones anteriores)
    return `unit/${componentName}.test${isTypescript ? '.tsx' : '.jsx'}`;
  }

  /**
   * Asegura que exista un archivo de configuración para las pruebas
   */
  private ensureTestConfigExists(): void {
    const configPath = path.join(this.testsDir, 'jest.config.js');
    
    if (!fs.existsSync(configPath)) {
      const configContent = `
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/tests/__mocks__/fileMock.js'
  },
  collectCoverage: ${this.testConfig.coverage},
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.{js,jsx,ts,tsx}',
    '!src/serviceWorker.{js,ts}',
    '!src/reportWebVitals.{js,ts}',
    '!src/setupTests.{js,ts}',
    '!src/**/*.stories.{js,jsx,ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70
    }
  }
};
      `;
      
      fs.writeFileSync(configPath, configContent, 'utf-8');
      this.log(`✅ Archivo de configuración de Jest creado: ${configPath}`);
      
      // Crear archivo de setup
      const setupDir = path.join(this.testsDir);
      const setupPath = path.join(setupDir, 'setup.js');
      
      if (!fs.existsSync(setupPath)) {
        const setupContent = `
// Configuración para testing-library
import '@testing-library/jest-dom';

// Configuración para pruebas de accesibilidad
import { toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

// Silenciar advertencias de consola durante las pruebas
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (args[0].includes('Warning:')) return;
    originalConsoleError(...args);
  };
  
  console.warn = (...args) => {
    if (args[0].includes('Warning:')) return;
    originalConsoleWarn(...args);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});
        `;
        
        fs.writeFileSync(setupPath, setupContent, 'utf-8');
        this.log(`✅ Archivo de setup para pruebas creado: ${setupPath}`);
      }
      
      // Crear directorio de mocks
      const mocksDir = path.join(this.testsDir, '__mocks__');
      if (!fs.existsSync(mocksDir)) {
        fs.mkdirSync(mocksDir, { recursive: true });
        
        // Crear mock para archivos estáticos
        const fileMockPath = path.join(mocksDir, 'fileMock.js');
        fs.writeFileSync(fileMockPath, 'module.exports = "test-file-stub";', 'utf-8');
        this.log(`✅ Mock para archivos estáticos creado: ${fileMockPath}`);
      }
    }
  }

  /**
   * Genera pruebas unitarias para un componente
   */
  private generateUnitTestCode(
    componentName: string, 
    componentCode: string, 
    isReactComponent: boolean,
    isTypescript: boolean
  ): string {
    // Analizar el componente para identificar props y eventos
    const propsMatch = componentCode.match(/interface \w+Props {([\s\S]*?)}/);
    const props = propsMatch ? propsMatch[1] : '';
    
    // Extraer propiedades del componente
    const propNames: string[] = [];
    const eventHandlers: string[] = [];
    
    if (props) {
      const propLines = props.split('\n');
      propLines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('//')) {
          if (trimmedLine.includes('(') && trimmedLine.includes(')')) {
            // Es un event handler
            const handlerMatch = trimmedLine.match(/(\w+)[\?]?:/);
            if (handlerMatch && handlerMatch[1]) {
              eventHandlers.push(handlerMatch[1]);
            }
          } else {
            // Es una prop normal
            const propMatch = trimmedLine.match(/(\w+)[\?]?:/);
            if (propMatch && propMatch[1]) {
              propNames.push(propMatch[1]);
            }
          }
        }
      });
    }
    
    if (isReactComponent) {
      return `
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ${isTypescript ? '{ ' : ''}${componentName}${isTypescript ? ' }' : ''} from '${this.getRelativeImportPath(componentName)}';

describe('${componentName}', () => {
  test('renders correctly with default props', () => {
    render(<${componentName} ${propNames.includes('label') ? 'label="Test ' + componentName + '"' : ''} />);
    ${propNames.includes('label') ? 
      `expect(screen.getByText('Test ${componentName}')).toBeInTheDocument();` : 
      `expect(screen.getByTestId('${componentName.toLowerCase()}')).toBeInTheDocument();`}
  });

  ${eventHandlers.length > 0 ? `
  test('handles events correctly', () => {
    ${eventHandlers.map(handler => `const ${handler} = jest.fn();`).join('\n    ')}
    render(<${componentName} ${propNames.includes('label') ? 'label="Click Me"' : ''} ${eventHandlers.map(handler => `${handler}={${handler}}`).join(' ')} />);
    ${propNames.includes('label') ? 
      `fireEvent.click(screen.getByText('Click Me'));` : 
      `fireEvent.click(screen.getByTestId('${componentName.toLowerCase()}'));`}
    ${eventHandlers.map(handler => `expect(${handler}).toHaveBeenCalledTimes(1);`).join('\n    ')}
  });` : ''}

  ${propNames.length > 0 ? `
  test('applies props correctly', () => {
    render(<${componentName} 
      ${propNames.includes('label') ? 'label="Styled"' : ''}
      ${propNames.includes('variant') ? 'variant="secondary"' : ''}
      ${propNames.includes('size') ? 'size="lg"' : ''}
      ${propNames.includes('disabled') ? 'disabled' : ''}
    />);
    const element = ${propNames.includes('label') ? 
      `screen.getByText('Styled')` : 
      `screen.getByTestId('${componentName.toLowerCase()}')`};
    ${propNames.includes('variant') ? `expect(element).toHaveClass('bg-secondary');` : ''}
    ${propNames.includes('size') ? `expect(element).toHaveClass('text-lg');` : ''}
    ${propNames.includes('disabled') ? `expect(element).toBeDisabled();` : ''}
  });` : ''}

  test('is accessible', () => {
    render(<${componentName} ${propNames.includes('label') ? 'label="Accessible"' : ''} />);
    const element = ${propNames.includes('label') ? 
      `screen.getByText('Accessible')` : 
      `screen.getByTestId('${componentName.toLowerCase()}')`};
    ${propNames.includes('disabled') ? 
      `expect(element).toHaveAttribute('aria-disabled', 'false');` : 
      `expect(element).toBeInTheDocument();`}
  });
});
`;
    } else {
      // Para archivos no-React (funciones, clases, etc.)
      return `
import ${isTypescript ? '{ ' : ''}${componentName}${isTypescript ? ' }' : ''} from '${this.getRelativeImportPath(componentName)}';

describe('${componentName}', () => {
  test('should be defined', () => {
    expect(${componentName}).toBeDefined();
  });

  test('should return expected result', () => {
    // TODO: Ajustar según la funcionalidad específica
    const result = ${componentName}();
    expect(result).toBeTruthy();
  });

  test('should handle edge cases', () => {
    // TODO: Implementar pruebas para casos límite
  });

  test('should throw error for invalid inputs', () => {
    // TODO: Implementar pruebas para entradas inválidas
    expect(() => {
      ${componentName}(null);
    }).toThrow();
  });
});
`;
    }
  }

    /**
   * Genera pruebas de integración para un componente
   */
    private generateIntegrationTestCode(
      componentName: string, 
      componentCode: string, 
      isReactComponent: boolean,
      isTypescript: boolean
    ): string {
      if (isReactComponent) {
        return `
  import React from 'react';
  import { render, screen, fireEvent, waitFor } from '@testing-library/react';
  import ${isTypescript ? '{ ' : ''}${componentName}${isTypescript ? ' }' : ''} from '${this.getRelativeImportPath(componentName)}';
  
  // Mock de componentes dependientes
  jest.mock('../components/DependentComponent', () => {
    return {
      DependentComponent: ({ onAction }) => (
        <div data-testid="mock-dependent" onClick={onAction}>
          Mocked Dependent Component
        </div>
      )
    };
  });
  
  describe('${componentName} Integration', () => {
    test('integrates with other components correctly', async () => {
      render(<${componentName} />);
      
      // Verificar que el componente principal se renderiza
      expect(screen.getByTestId('${componentName.toLowerCase()}')).toBeInTheDocument();
      
      // Verificar que el componente dependiente se renderiza
      expect(screen.getByTestId('mock-dependent')).toBeInTheDocument();
      
      // Simular interacción entre componentes
      fireEvent.click(screen.getByTestId('mock-dependent'));
      
      // Esperar a que ocurra alguna acción asíncrona
      await waitFor(() => {
        expect(screen.getByText(/resultado de la interacción/i)).toBeInTheDocument();
      });
    });
  
    test('handles data flow between components', async () => {
      render(<${componentName} initialData={{ test: 'value' }} />);
      
      // Simular entrada de datos
      fireEvent.change(screen.getByTestId('input-field'), {
        target: { value: 'new value' }
      });
      
      // Simular envío de formulario
      fireEvent.click(screen.getByText(/enviar/i));
      
      // Verificar que los datos fluyen correctamente
      await waitFor(() => {
        expect(screen.getByTestId('result-display')).toHaveTextContent('new value');
      });
    });
  
    test('handles API interactions correctly', async () => {
      // Mock de fetch o axios
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: 'mocked response' })
      });
      
      render(<${componentName} />);
      
      // Simular acción que desencadena llamada a API
      fireEvent.click(screen.getByText(/cargar datos/i));
      
      // Verificar que se muestra el estado de carga
      expect(screen.getByText(/cargando/i)).toBeInTheDocument();
      
      // Verificar que se muestran los datos cuando la llamada se completa
      await waitFor(() => {
        expect(screen.getByText(/mocked response/i)).toBeInTheDocument();
      });
      
      // Verificar que se llamó a fetch con los parámetros correctos
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/data'),
        expect.objectContaining({ method: 'GET' })
      );
    });
  });
  `;
      } else {
        // Para archivos no-React
        return `
  import ${isTypescript ? '{ ' : ''}${componentName}${isTypescript ? ' }' : ''} from '${this.getRelativeImportPath(componentName)}';
  import { dependentModule } from '../path/to/dependentModule';
  
  // Mock de módulos dependientes
  jest.mock('../path/to/dependentModule', () => ({
    dependentModule: jest.fn().mockReturnValue('mocked result')
  }));
  
  describe('${componentName} Integration', () => {
    test('integrates with other modules correctly', () => {
      const result = ${componentName}();
      
      // Verificar que se llama al módulo dependiente
      expect(dependentModule).toHaveBeenCalled();
      
      // Verificar que el resultado integra correctamente la respuesta del módulo dependiente
      expect(result).toContain('mocked result');
    });
  
    test('handles errors from dependent modules', () => {
      // Configurar el mock para simular un error
      dependentModule.mockImplementationOnce(() => {
        throw new Error('Simulated error');
      });
      
      // Verificar que el error se maneja correctamente
      expect(() => {
        ${componentName}();
      }).toThrow('Simulated error');
    });
  
    test('processes data through multiple modules', () => {
      const inputData = { test: 'value' };
      const result = ${componentName}(inputData);
      
      // Verificar que se llama al módulo dependiente con los datos correctos
      expect(dependentModule).toHaveBeenCalledWith(inputData);
      
      // Verificar que el resultado final es el esperado
      expect(result).toBe('expected final result');
    });
  });
  `;
      }
    }
  
    /**
     * Genera pruebas de accesibilidad para un componente React
     */
    private generateAccessibilityTestCode(
      componentName: string, 
      componentCode: string,
      isTypescript: boolean
    ): string {
      return `
  import React from 'react';
  import { render } from '@testing-library/react';
  import { axe, toHaveNoViolations } from 'jest-axe';
  import ${isTypescript ? '{ ' : ''}${componentName}${isTypescript ? ' }' : ''} from '${this.getRelativeImportPath(componentName)}';
  
  expect.extend(toHaveNoViolations);
  
  describe('${componentName} Accessibility', () => {
    test('should not have accessibility violations', async () => {
      const { container } = render(<${componentName} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  
    test('should have proper ARIA attributes', () => {
      const { getByRole } = render(<${componentName} />);
      
      // Verificar roles ARIA apropiados
      // Ajustar según el tipo de componente
      try {
        const element = getByRole('button');
        expect(element).toHaveAttribute('aria-pressed', 'false');
      } catch (e) {
        try {
          const element = getByRole('textbox');
          expect(element).toHaveAttribute('aria-required', 'false');
        } catch (e) {
          // Intentar otros roles comunes
        }
      }
    });
  
    test('should be keyboard navigable', () => {
      const { getByTestId } = render(<${componentName} />);
      const element = getByTestId('${componentName.toLowerCase()}');
      
      // Verificar que el elemento puede recibir foco
      element.focus();
      expect(document.activeElement).toBe(element);
    });
  
    test('should have sufficient color contrast', () => {
      // Esta prueba es más conceptual, ya que jest-axe ya verifica el contraste
      // Pero podemos añadir verificaciones específicas si es necesario
      const { getByTestId } = render(<${componentName} />);
      const element = getByTestId('${componentName.toLowerCase()}');
      
      // Verificar clases de contraste o atributos específicos
      expect(element).toHaveClass('text-contrast-high');
    });
  
    test('should have proper focus indicators', () => {
      const { getByTestId } = render(<${componentName} />);
      const element = getByTestId('${componentName.toLowerCase()}');
      
      // Verificar que el elemento tiene indicadores de foco apropiados
      element.focus();
      expect(element).toHaveClass('focus-visible');
    });
  });
  `;
    }
  
    /**
     * Genera pruebas de usabilidad para un componente React
     */
    private generateUsabilityTestCode(
      componentName: string, 
      componentCode: string,
      isTypescript: boolean
    ): string {
      return `
  import React from 'react';
  import { render, screen, fireEvent, waitFor } from '@testing-library/react';
  import userEvent from '@testing-library/user-event';
  import ${isTypescript ? '{ ' : ''}${componentName}${isTypescript ? ' }' : ''} from '${this.getRelativeImportPath(componentName)}';
  
  describe('${componentName} Usability', () => {
    test('should provide feedback on user interaction', async () => {
      render(<${componentName} />);
      const element = screen.getByTestId('${componentName.toLowerCase()}');
      
      // Verificar estado inicial
      expect(element).not.toHaveClass('active');
      
      // Simular interacción del usuario
      userEvent.click(element);
      
      // Verificar feedback visual
      expect(element).toHaveClass('active');
    });
  
    test('should handle error states gracefully', async () => {
      render(<${componentName} hasError />);
      
      // Verificar que se muestra un mensaje de error
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      
      // Verificar que se proporciona orientación al usuario
      expect(screen.getByText(/intente de nuevo/i)).toBeInTheDocument();
    });
  
    test('should provide clear instructions', () => {
      render(<${componentName} />);
      
      // Verificar que hay instrucciones visibles
      expect(screen.getByText(/instrucciones/i)).toBeInTheDocument();
    });
  
    test('should be responsive to different screen sizes', () => {
      // Esta prueba es conceptual, ya que jest no puede verificar CSS media queries
      // Pero podemos verificar clases responsivas
      render(<${componentName} />);
      const element = screen.getByTestId('${componentName.toLowerCase()}');
      
      expect(element).toHaveClass('responsive');
    });
  
    test('should handle loading states appropriately', async () => {
      render(<${componentName} isLoading />);
      
      // Verificar indicador de carga
      expect(screen.getByText(/cargando/i)).toBeInTheDocument();
      
      // Verificar que el componente principal está deshabilitado durante la carga
      const element = screen.getByTestId('${componentName.toLowerCase()}');
      expect(element).toBeDisabled();
    });
  });
  `;
    }
  
    /**
     * Genera pruebas E2E para un componente
     */
    private generateE2ETestCode(
      componentName: string, 
      componentCode: string, 
      isReactComponent: boolean,
      isTypescript: boolean
    ): string {
      if (isReactComponent) {
        return `
  import { test, expect } from '@playwright/test';
  
  test.describe('${componentName} E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
      // Navegar a la página que contiene el componente
      await page.goto('/path/to/page-with-${componentName.toLowerCase()}');
    });
  
    test('should render correctly', async ({ page }) => {
      // Verificar que el componente se renderiza
      await expect(page.locator('[data-testid="${componentName.toLowerCase()}"]')).toBeVisible();
    });
  
    test('should respond to user interactions', async ({ page }) => {
      // Interactuar con el componente
      await page.click('[data-testid="${componentName.toLowerCase()}"]');
      
      // Verificar el resultado de la interacción
      await expect(page.locator('.result-element')).toBeVisible();
      await expect(page.locator('.result-element')).toHaveText('Expected Result');
    });
  
    test('should handle form submission', async ({ page }) => {
      // Llenar un formulario
      await page.fill('[data-testid="input-field"]', 'Test Value');
      await page.click('[data-testid="submit-button"]');
      
      // Verificar que el formulario se envió correctamente
      await expect(page.locator('.success-message')).toBeVisible();
      await expect(page.locator('.success-message')).toHaveText('Form submitted successfully');
    });
  
    test('should navigate correctly', async ({ page }) => {
      // Hacer clic en un enlace o botón de navegación
      await page.click('[data-testid="nav-link"]');
      
      // Verificar que la navegación funcionó
      await expect(page).toHaveURL(/.*destination-page.*/);
    });
  });
  `;
      } else {
        // Para archivos no-React (APIs, servicios, etc.)
        return `
  import { test, expect } from '@playwright/test';
  import { rest } from 'msw';
  import { setupServer } from 'msw/node';
  
  // Configurar servidor mock para APIs
  const server = setupServer(
    rest.get('/api/${componentName.toLowerCase()}', (req, res, ctx) => {
      return res(ctx.json({ data: 'mocked response' }));
    }),
    rest.post('/api/${componentName.toLowerCase()}', (req, res, ctx) => {
      return res(ctx.status(201), ctx.json({ success: true }));
    })
  );
  
  test.beforeAll(() => server.listen());
  test.afterAll(() => server.close());
  test.afterEach(() => server.resetHandlers());
  
  test.describe('${componentName} E2E API Tests', () => {
    test('should fetch data correctly', async ({ request }) => {
      const response = await request.get('/api/${componentName.toLowerCase()}');
      const data = await response.json();
      
      expect(response.ok()).toBeTruthy();
      expect(data).toHaveProperty('data', 'mocked response');
    });
  
    test('should submit data correctly', async ({ request }) => {
      const response = await request.post('/api/${componentName.toLowerCase()}', {
        data: { test: 'value' }
      });
      const result = await response.json();
      
      expect(response.status()).toBe(201);
      expect(result).toHaveProperty('success', true);
    });
  
    test('should handle errors gracefully', async ({ request }) => {
      // Configurar servidor para simular un error
      server.use(
        rest.get('/api/${componentName.toLowerCase()}/error', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Server error' }));
        })
      );
      
      const response = await request.get('/api/${componentName.toLowerCase()}/error');
      const data = await response.json();
      
      expect(response.status()).toBe(500);
      expect(data).toHaveProperty('error', 'Server error');
    });
  });
  `;
      }
    }
  
    /**
     * Obtiene la ruta relativa para importar un componente
     */
    private getRelativeImportPath(componentName: string): string {
      // Esto es una simplificación, en un caso real habría que buscar el componente en el proyecto
      return `../components/${componentName}`;
    }
  
    /**
     * Ejecuta las pruebas generadas
     */
    async runTests(testPath: string): Promise<TestResults> {
      this.log(`🧪 Ejecutando pruebas en: ${testPath}`);
      
      // Verificar que el directorio de pruebas existe
      if (!fs.existsSync(testPath)) {
        throw new Error(`El directorio de pruebas no existe: ${testPath}`);
      }
      
      // Buscar archivos de prueba
      const testFiles = glob.sync(`${testPath}/**/*.test.{js,jsx,ts,tsx}`);
      
      if (testFiles.length === 0) {
        throw new Error(`No se encontraron archivos de prueba en: ${testPath}`);
      }
      
      this.log(`📋 Encontrados ${testFiles.length} archivos de prueba`);
      
      // En un caso real, aquí se ejecutaría Jest o el framework configurado
      // Para esta simulación, generamos resultados aleatorios
      const results: TestResults = {
        passed: 0,
        failed: 0,
        skipped: 0,
        total: 0,
        coverage: {
          statements: 0,
          branches: 0,
          functions: 0,
          lines: 0
        },
        testFiles: [],
        timestamp: new Date().toISOString()
      };
      
      // Simular resultados para cada archivo de prueba
      for (const file of testFiles) {
        const fileName = path.basename(file);
        const fileType = fileName.includes('.integration.') 
          ? 'integration' 
          : fileName.includes('.a11y.') 
            ? 'accessibility' 
            : fileName.includes('.usability.') 
              ? 'usability' 
              : fileName.includes('.e2e.') 
                ? 'e2e' 
                : 'unit';
        
        // Generar resultados aleatorios para simular pruebas
        const totalTests = Math.floor(Math.random() * 10) + 5; // Entre 5 y 14 pruebas
        const passedTests = Math.floor(Math.random() * totalTests);
        const skippedTests = Math.floor(Math.random() * (totalTests - passedTests));
        const failedTests = totalTests - passedTests - skippedTests;
        
        // Calcular cobertura aleatoria
        const statementCoverage = Math.floor(Math.random() * 30) + 70; // Entre 70% y 99%
        const branchCoverage = Math.floor(Math.random() * 30) + 70;
        const functionCoverage = Math.floor(Math.random() * 30) + 70;
        const lineCoverage = Math.floor(Math.random() * 30) + 70;
        
        // Acumular resultados
        results.passed += passedTests;
        results.failed += failedTests;
        results.skipped += skippedTests;
        results.total += totalTests;
        
        // Acumular cobertura (promedio ponderado)
        const currentTotal = results.testFiles.length;
        results.coverage.statements = (results.coverage.statements * currentTotal + statementCoverage) / (currentTotal + 1);
        results.coverage.branches = (results.coverage.branches * currentTotal + branchCoverage) / (currentTotal + 1);
        results.coverage.functions = (results.coverage.functions * currentTotal + functionCoverage) / (currentTotal + 1);
        results.coverage.lines = (results.coverage.lines * currentTotal + lineCoverage) / (currentTotal + 1);
        
        // Añadir resultados del archivo
        results.testFiles.push({
          fileName,
          path: file,
          type: fileType,
          passed: passedTests,
          failed: failedTests,
          skipped: skippedTests,
          total: totalTests,
          coverage: {
            statements: statementCoverage,
            branches: branchCoverage,
            functions: functionCoverage,
            lines: lineCoverage
          },
          duration: Math.floor(Math.random() * 1000) + 100, // Entre 100ms y 1100ms
          errors: failedTests > 0 ? this.generateRandomErrors(failedTests) : []
        });
      }
      
      // Redondear valores de cobertura
      results.coverage.statements = Math.round(results.coverage.statements);
      results.coverage.branches = Math.round(results.coverage.branches);
      results.coverage.functions = Math.round(results.coverage.functions);
      results.coverage.lines = Math.round(results.coverage.lines);
      
      // Registrar resultados
      this.log(`✅ Pruebas completadas: ${results.passed} pasadas, ${results.failed} fallidas, ${results.skipped} omitidas`);
      this.log(`📊 Cobertura: ${results.coverage.lines}% de líneas, ${results.coverage.functions}% de funciones`);
      
      return results;
    }
  
    /**
     * Genera errores aleatorios para simular fallos en las pruebas
     */
    private generateRandomErrors(count: number): TestError[] {
      const errors: TestError[] = [];
      const errorTypes = [
        'AssertionError',
        'TypeError',
        'ReferenceError',
        'SyntaxError',
        'RangeError'
      ];
      
      const errorMessages = [
        'Expected value to be truthy',
        'Cannot read property of undefined',
        'Element not found in document',
        'Expected [object Object] to equal [object Object]',
        'Timeout exceeded while waiting for element',
        'Invalid selector',
        'Failed to match text content'
      ];
      
      for (let i = 0; i < count; i++) {
        const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
        const errorMessage = errorMessages[Math.floor(Math.random() * errorMessages.length)];
        const lineNumber = Math.floor(Math.random() * 100) + 1;
        
        errors.push({
          type: errorType,
          message: errorMessage,
          location: {
            line: lineNumber,
            column: Math.floor(Math.random() * 80) + 1
          },
          stackTrace: `at Object.<anonymous> (${errorType}.test.js:${lineNumber}:10)\n    at processTicksAndRejections (node:internal/process/task_queues:95:5)`
        });
      }
      
      return errors;
    }
  
    /**
     * Genera pruebas basadas en una revisión de código
     */
    async generateTestsFromReview(
      reviewedFiles: string[],
      suggestions: CodeReviewSuggestion[]
    ): Promise<string[]> {
      this.log(`🧪 Generando pruebas basadas en revisión de código`);
      this.log(`📋 Archivos revisados: ${reviewedFiles.length}`);
      
      const generatedTestFiles: string[] = [];
      
      // Filtrar sugerencias relacionadas con pruebas
      const testSuggestions = suggestions.filter(suggestion => 
        suggestion.type === 'MISSING_TESTS' || 
        suggestion.type === 'IMPROVE_TESTABILITY' ||
        suggestion.type === 'EDGE_CASE'
      );
      
      this.log(`📋 Sugerencias de pruebas encontradas: ${testSuggestions.length}`);
      
      // Generar pruebas para cada archivo con sugerencias
      for (const file of reviewedFiles) {
        // Filtrar sugerencias para este archivo
        const fileSuggestions = testSuggestions.filter(suggestion => suggestion.file === file);
        
        if (fileSuggestions.length === 0) {
          continue;
        }
        
        this.log(`📋 Generando pruebas para: ${file} (${fileSuggestions.length} sugerencias)`);
        
        // Extraer nombre del componente del archivo
        const fileName = path.basename(file);
        const componentName = fileName.replace(/\.(jsx|tsx|js|ts)$/, '');
        
        // Determinar tipos de prueba necesarios según las sugerencias
        const testTypes: TestType[] = ['unit']; // Siempre incluir pruebas unitarias
        
        if (fileSuggestions.some(s => s.type === 'EDGE_CASE')) {
          testTypes.push('integration');
        }
        
        if (fileSuggestions.some(s => s.content.toLowerCase().includes('accesib'))) {
          testTypes.push('accessibility');
        }
        
        if (fileSuggestions.some(s => s.content.toLowerCase().includes('usabil'))) {
          testTypes.push('usability');
        }
        
        if (fileSuggestions.some(s => s.content.toLowerCase().includes('e2e') || s.content.toLowerCase().includes('end to end'))) {
          testTypes.push('e2e');
        }
        
        // Generar pruebas
        try {
          const testFileName = await this.generateTests(componentName, file, testTypes);
          generatedTestFiles.push(testFileName);
        } catch (error) {
          this.log(`❌ Error generando pruebas para ${file}: ${error.message}`, 'error');
        }
      }
      
      this.log(`✅ Pruebas generadas para ${generatedTestFiles.length} archivos`);
      return generatedTestFiles;
    }
  
    /**
     * Genera un informe de cobertura de pruebas para el proyecto
     */
    async generateCoverageReport(): Promise<CoverageReport> {
      this.log(`📊 Generando informe de cobertura de pruebas`);
      
      // Ejecutar todas las pruebas para obtener resultados de cobertura
      const results = await this.runTests(this.testsDir);
      
      // Generar informe de cobertura
      const report: CoverageReport = {
        summary: {
          statements: results.coverage.statements,
          branches: results.coverage.branches,
          functions: results.coverage.functions,
          lines: results.coverage.lines,
          files: results.testFiles.length
        },
        fileReports: results.testFiles.map(file => ({
          fileName: file.fileName,
          path: file.path,
          coverage: file.coverage
        })),
        timestamp: new Date().toISOString()
      };
      
      // Guardar informe en archivo
      const reportPath = path.join(this.testsDir, 'coverage-report.json');
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');
      
      this.log(`✅ Informe de cobertura generado: ${reportPath}`);
      this.log(`📊 Cobertura total: ${report.summary.lines}% de líneas, ${report.summary.functions}% de funciones`);
      
      return report;
    }
  
    /**
     * Sugiere mejoras para aumentar la cobertura de pruebas
     */
    async suggestCoverageImprovements(): Promise<CoverageImprovement[]> {
      this.log(`🔍 Analizando cobertura de pruebas para sugerir mejoras`);
      
      // Generar informe de cobertura
      const report = await this.generateCoverageReport();
      
      // Identificar archivos con baja cobertura
      const lowCoverageFiles = report.fileReports.filter(file => 
        file.coverage.lines < 80 || 
        file.coverage.functions < 80 || 
        file.coverage.branches < 70
      );
      
      this.log(`📋 Encontrados ${lowCoverageFiles.length} archivos con baja cobertura`);
      
      // Generar sugerencias para cada archivo
      const improvements: CoverageImprovement[] = [];
      
      for (const file of lowCoverageFiles) {
        const fileName = path.basename(file.path);
        const componentName = fileName.replace(/\.test\.(jsx|tsx|js|ts)$/, '');
        const componentPath = this.findComponentPath(componentName);
        
        if (!componentPath) {
          this.log(`⚠️ No se pudo encontrar el componente para ${fileName}`, 'warning');
          continue;
        }
        
        const componentCode = fs.readFileSync(componentPath, 'utf-8');
        const suggestions: string[] = [];
        
        // Analizar qué aspectos necesitan mejora
        if (file.coverage.functions < 80) {
          suggestions.push('Añadir pruebas para todas las funciones/métodos del componente');
        }
        
        if (file.coverage.branches < 70) {
          suggestions.push('Mejorar cobertura de ramas añadiendo pruebas para casos condicionales');
        }
        
        if (file.coverage.lines < 80) {
          suggestions.push('Aumentar cobertura de líneas probando más escenarios');
        }
        
        // Añadir sugerencias específicas según el tipo de archivo
        const fileExtension = path.extname(componentPath);
        const isReactComponent = fileExtension === '.tsx' || fileExtension === '.jsx';
        
        if (isReactComponent) {
          suggestions.push('Añadir pruebas para diferentes props y estados del componente');
          suggestions.push('Verificar renderizado condicional y manejo de errores');
        } else {
          suggestions.push('Añadir pruebas para casos límite y entradas inválidas');
          suggestions.push('Verificar manejo de errores y excepciones');
        }
        
        improvements.push({
          fileName: componentName,
          path: componentPath,
          currentCoverage: file.coverage,
          suggestions,
          testTypes: this.suggestTestTypes(componentCode, file.coverage)
        });
      }
      
      this.log(`✅ Generadas ${improvements.length} sugerencias de mejora`);
      
      return improvements;
    }
  
    /**
     * Encuentra la ruta de un componente a partir de su nombre
     */
    private findComponentPath(componentName: string): string | null {
      // En un caso real, buscaríamos el componente en el proyecto
      // Para esta simulación, devolvemos una ruta ficticia
      return path.join(process.cwd(), 'src', 'components', `${componentName}.tsx`);
    }
  
    /**
     * Sugiere tipos de prueba basados en el código y la cobertura actual
     */
    private suggestTestTypes(componentCode: string, coverage: Coverage): TestType[] {
      const testTypes: TestType[] = ['unit']; // Siempre incluir pruebas unitarias
      
      // Sugerir pruebas de integración si hay llamadas a APIs o dependencias
      if (
        componentCode.includes('fetch(') || 
        componentCode.includes('axios.') || 
        componentCode.includes('import') && componentCode.includes('from')
      ) {
        testTypes.push('integration');
      }
      
      // Sugerir pruebas de accesibilidad para componentes React
      if (
        componentCode.includes('React') && 
        (componentCode.includes('div') || componentCode.includes('button') || componentCode.includes('input'))
      ) {
        testTypes.push('accessibility');
      }
      
      // Sugerir pruebas de usabilidad para componentes interactivos
      if (
        componentCode.includes('onClick') || 
        componentCode.includes('onChange') || 
        componentCode.includes('onSubmit')
      ) {
        testTypes.push('usability');
      }
      
      // Sugerir pruebas E2E para componentes complejos o con baja cobertura
      if (
        coverage.lines < 60 || 
        coverage.branches < 50 || 
        componentCode.length > 500
      ) {
        testTypes.push('e2e');
      }
      
      return testTypes;
    }
  }
  
  /**
 * Tipos para la configuración de pruebas
 */
export interface TestConfig {
  framework: 'jest' | 'mocha' | 'vitest' | 'playwright';
  coverage: boolean;
  includeAccessibility: boolean;
  includeUsability: boolean;
  includeIntegration: boolean;
  includeE2E: boolean;
}

/**
 * Tipos de pruebas soportados
 */
export type TestType = 'unit' | 'integration' | 'accessibility' | 'usability' | 'e2e';

/**
 * Resultados de la ejecución de pruebas
 */
export interface TestResults {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  coverage: Coverage;
  testFiles: TestFileResult[];
  timestamp: string;
}

/**
 * Resultados de un archivo de prueba
 */
export interface TestFileResult {
  fileName: string;
  path: string;
  type: TestType;
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  coverage: Coverage;
  duration: number;
  errors: TestError[];
}

/**
 * Error en una prueba
 */
export interface TestError {
  type: string;
  message: string;
  location: {
    line: number;
    column: number;
  };
  stackTrace: string;
}

/**
 * Cobertura de código
 */
export interface Coverage {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
}

/**
 * Informe de cobertura de pruebas
 */
export interface CoverageReport {
  summary: Coverage & {
    files: number;
  };
  fileReports: {
    fileName: string;
    path: string;
    coverage: Coverage;
  }[];
  timestamp: string;
}

/**
 * Sugerencia de mejora de cobertura
 */
export interface CoverageImprovement {
  fileName: string;
  path: string;
  currentCoverage: Coverage;
  suggestions: string[];
  testTypes: TestType[];
}

/**
 * Sugerencia de revisión de código
 */
export interface CodeReviewSuggestion {
  type: 'MISSING_TESTS' | 'IMPROVE_TESTABILITY' | 'EDGE_CASE' | 'PERFORMANCE' | 'SECURITY' | 'MAINTAINABILITY';
  file: string;
  line?: number;
  content: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: string;
}

/**
 * Configuración para la generación de pruebas
 */
export interface TestGenerationConfig {
  testTypes: TestType[];
  outputDir?: string;
  componentName: string;
  componentPath: string;
  isReactComponent?: boolean;
  isTypescript?: boolean;
  includeSnapshots?: boolean;
  mockDependencies?: boolean;
}

/**
 * Resultado de la generación de pruebas
 */
export interface TestGenerationResult {
  testFiles: {
    path: string;
    type: TestType;
    content: string;
  }[];
  coverage: {
    estimatedCoverage: Coverage;
    uncoveredAreas: string[];
  };
  suggestions: string[];
}

/**
 * Configuración para la ejecución de pruebas
 */
export interface TestRunConfig {
  testPath: string;
  testPattern?: string;
  watch?: boolean;
  updateSnapshots?: boolean;
  bail?: boolean;
  silent?: boolean;
}

/**
 * Resultado de la ejecución de pruebas E2E
 */
export interface E2ETestResult extends TestResults {
  screenshots: string[];
  videos: string[];
  performanceMetrics: {
    loadTime: number;
    firstPaint: number;
    firstContentfulPaint: number;
    timeToInteractive: number;
  };
}

/**
 * Resultado de pruebas de accesibilidad
 */
export interface AccessibilityTestResult extends TestResults {
  violations: {
    impact: 'critical' | 'serious' | 'moderate' | 'minor';
    description: string;
    elements: string[];
    rule: string;
  }[];
  passes: {
    description: string;
    elements: string[];
    rule: string;
  }[];
  incomplete: {
    description: string;
    elements: string[];
    rule: string;
  }[];
}

/**
 * Resultado de pruebas de usabilidad
 */
export interface UsabilityTestResult extends TestResults {
  interactionFlows: {
    name: string;
    steps: number;
    completionTime: number;
    errorRate: number;
    satisfaction: number;
  }[];
  heuristicEvaluation: {
    category: string;
    score: number;
    issues: string[];
    recommendations: string[];
  }[];
}

/**
 * Configuración para la integración con CI/CD
 */
export interface CIIntegrationConfig {
  provider: 'github' | 'gitlab' | 'jenkins' | 'azure' | 'circleci';
  configPath: string;
  thresholds: {
    coverage: Partial<Coverage>;
    maxFailures: number;
    maxSkipped: number;
  };
  notifications: {
    slack?: string;
    email?: string;
    teams?: string;
  };
  artifacts: {
    saveReports: boolean;
    saveScreenshots: boolean;
    saveVideos: boolean;
  };
}

/**
 * Configuración para la generación de informes
 */
export interface ReportConfig {
  format: 'html' | 'json' | 'xml' | 'markdown';
  outputDir: string;
  includeScreenshots: boolean;
  includeVideos: boolean;
  includeTimeline: boolean;
  includeTrends: boolean;
}

/**
 * Configuración para pruebas de rendimiento
 */
export interface PerformanceTestConfig {
  concurrentUsers: number;
  duration: number;
  rampUp: number;
  thresholds: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
  endpoints: {
    url: string;
    method: string;
    payload?: any;
    headers?: Record<string, string>;
  }[];
}

/**
 * Resultado de pruebas de rendimiento
 */
export interface PerformanceTestResult {
  summary: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    throughput: number;
    errorRate: number;
  };
  endpoints: {
    url: string;
    method: string;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    throughput: number;
  }[];
  timeline: {
    timestamp: string;
    activeUsers: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
  }[];
}

/**
 * Configuración para pruebas de seguridad
 */
export interface SecurityTestConfig {
  scanTypes: ('xss' | 'sqli' | 'csrf' | 'auth' | 'api')[];
  endpoints: string[];
  headers?: Record<string, string>;
  authentication?: {
    type: 'basic' | 'oauth' | 'jwt';
    credentials: any;
  };
  excludePaths?: string[];
}

/**
 * Resultado de pruebas de seguridad
 */
export interface SecurityTestResult {
  vulnerabilities: {
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    description: string;
    location: string;
    evidence: string;
    remediation: string;
  }[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  scannedEndpoints: string[];
  scanDuration: number;
}

/**
 * Configuración para pruebas de compatibilidad
 */
export interface CompatibilityTestConfig {
  browsers: {
    name: string;
    version: string;
  }[];
  devices: {
    name: string;
    width: number;
    height: number;
    deviceScaleFactor: number;
    isMobile: boolean;
  }[];
  urls: string[];
  scenarios: {
    name: string;
    steps: string[];
  }[];
}

/**
 * Resultado de pruebas de compatibilidad
 */
export interface CompatibilityTestResult {
  browsers: {
    name: string;
    version: string;
    passed: boolean;
    issues: string[];
    screenshots: string[];
  }[];
  devices: {
    name: string;
    passed: boolean;
    issues: string[];
    screenshots: string[];
  }[];
  scenarios: {
    name: string;
    browserResults: {
      browser: string;
      passed: boolean;
      issues: string[];
    }[];
    deviceResults: {
      device: string;
      passed: boolean;
      issues: string[];
    }[];
  }[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    compatibility: number;
  };
}

/**
 * Configuración para pruebas de regresión visual
 */
export interface VisualRegressionTestConfig {
  baselineDir: string;
  screenshotDir: string;
  diffDir: string;
  thresholds: {
    pixelDifference: number;
    colorDifference: number;
  };
  viewports: {
    name: string;
    width: number;
    height: number;
  }[];
  urls: string[];
  selectors?: string[];
  ignoreRegions?: {
    selector: string;
    coordinates?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];
}

/**
 * Resultado de pruebas de regresión visual
 */
export interface VisualRegressionTestResult {
  comparisons: {
    url: string;
    viewport: string;
    selector?: string;
    diffPercentage: number;
    passed: boolean;
    baselineImage: string;
    currentImage: string;
    diffImage: string;
  }[];
  summary: {
    totalComparisons: number;
    passedComparisons: number;
    failedComparisons: number;
    overallDiffPercentage: number;
  };
}

/**
 * Configuración para pruebas de API
 */
export interface APITestConfig {
  baseUrl: string;
  endpoints: {
    path: string;
    method: string;
    headers?: Record<string, string>;
    payload?: any;
    expectedStatus: number;
    expectedResponse?: any;
    validateSchema?: boolean;
    schemaPath?: string;
  }[];
  authentication?: {
    type: 'basic' | 'oauth' | 'jwt';
    credentials: any;
  };
  environment?: 'development' | 'staging' | 'production';
}

/**
 * Resultado de pruebas de API
 */
export interface APITestResult {
  endpoints: {
    path: string;
    method: string;
    status: number;
    responseTime: number;
    passed: boolean;
    errors: string[];
    validationResults?: {
      schemaValid: boolean;
      schemaErrors: string[];
    };
  }[];
  summary: {
    totalEndpoints: number;
    passedEndpoints: number;
    failedEndpoints: number;
    averageResponseTime: number;
  };
}

/**
 * Configuración para pruebas de contrato
 */
export interface ContractTestConfig {
  provider: {
    name: string;
    url: string;
    stateHandlers?: Record<string, () => Promise<void>>;
  };
  consumer: {
    name: string;
  };
  interactions: {
    description: string;
    state?: string;
    request: {
      method: string;
      path: string;
      headers?: Record<string, string>;
      body?: any;
      query?: Record<string, string>;
    };
    response: {
      status: number;
      headers?: Record<string, string>;
      body?: any;
    };
  }[];
  pactBrokerUrl?: string;
  pactBrokerToken?: string;
}

/**
 * Resultado de pruebas de contrato
 */
export interface ContractTestResult {
  interactions: {
    description: string;
    passed: boolean;
    errors: string[];
  }[];
  summary: {
    totalInteractions: number;
    passedInteractions: number;
    failedInteractions: number;
    pactUrl?: string;
  };
}

/**
 * Configuración para pruebas de mutación
 */
export interface MutationTestConfig {
  sourceDirs: string[];
  testDirs: string[];
  mutators: string[];
  testRunner: string;
  reporters: string[];
  timeoutMS: number;
  thresholds: {
    high: number;
    low: number;
    break: number;
  };
}

/**
 * Resultado de pruebas de mutación
 */
export interface MutationTestResult {
  files: {
    path: string;
    mutants: {
      id: string;
      mutatorName: string;
      replacement: string;
      location: {
        start: { line: number; column: number };
        end: { line: number; column: number };
      };
      status: 'KILLED' | 'SURVIVED' | 'NO_COVERAGE' | 'TIMEOUT' | 'ERROR';
    }[];
    mutationScore: number;
  }[];
  summary: {
    totalMutants: number;
    killedMutants: number;
    survivedMutants: number;
    noCoverageMutants: number;
    timeoutMutants: number;
    errorMutants: number;
    mutationScore: number;
  };
}

/**
 * Configuración para pruebas de carga
 */
export interface LoadTestConfig {
  baseUrl: string;
  scenarios: {
    name: string;
    flow: {
      request: {
        url: string;
        method: string;
        headers?: Record<string, string>;
        body?: any;
      };
      thinkTime?: number;
      extractors?: {
        name: string;
        expression: string;
        source: 'body' | 'headers' | 'status';
      }[];
    }[];
    users: number;
    rampUpSeconds: number;
    durationSeconds: number;
  }[];
  thresholds: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
}

/**
 * Resultado de pruebas de carga
 */
export interface LoadTestResult {
  scenarios: {
    name: string;
    summary: {
      users: number;
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      averageResponseTime: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
      minResponseTime: number;
      maxResponseTime: number;
      throughput: number;
      errorRate: number;
    };
    requests: {
      url: string;
      method: string;
      averageResponseTime: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
      errorRate: number;
      throughput: number;
    }[];
  }[];
  summary: {
    totalScenarios: number;
    totalUsers: number;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
    duration: number;
  };
  timeline: {
    timestamp: string;
    activeUsers: number;
    responseTime: number;
    throughput: number;
    errorRate: number;
  }[];
}