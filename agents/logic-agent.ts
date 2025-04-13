import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

/**
 * Logic Agent - Implementa algoritmos y reglas de negocio complejas
 * 
 * Este agente es responsable de:
 * 1. Analizar requisitos de lógica de negocio
 * 2. Diseñar e implementar algoritmos optimizados
 * 3. Crear diagramas de flujo y árboles de decisión
 * 4. Generar pruebas unitarias para la lógica implementada
 * 5. Documentar la lógica de negocio con ejemplos
 */
export class LogicAgent extends BaseAgent {
  constructor() {
    super('Logic Agent');
  }

  /**
   * Ejecuta el agente de lógica de negocio
   * @param spec Especificación de la lógica a implementar
   */
  async run(spec: string): Promise<void> {
    console.log('🧮 Iniciando Logic Agent...');
    console.log('📋 Especificación recibida:', spec);

    try {
      // Determinar el tipo de operación
      if (spec.startsWith('algorithm:')) {
        const algorithmSpec = spec.substring(10).trim();
        await this.implementAlgorithm(algorithmSpec);
      } else if (spec.startsWith('business-rule:')) {
        const ruleSpec = spec.substring(14).trim();
        await this.implementBusinessRule(ruleSpec);
      } else if (spec.startsWith('flow:')) {
        const flowSpec = spec.substring(5).trim();
        await this.createFlowDiagram(flowSpec);
      } else if (spec.startsWith('optimize:')) {
        const optimizeSpec = spec.substring(9).trim();
        await this.optimizeAlgorithm(optimizeSpec);
      } else {
        // Operación por defecto: análisis e implementación completa
        await this.implementLogic(spec);
      }
      
      console.log('✅ Lógica de negocio implementada con éxito');
    } catch (error) {
      console.error('❌ Error al implementar la lógica de negocio:', error);
      throw error;
    }
  }
  
  /**
   * Implementa un algoritmo específico
   * @param spec Especificación del algoritmo
   */
  private async implementAlgorithm(spec: string): Promise<void> {
    console.log(`🧠 Implementando algoritmo: "${spec}"`);
    
    // Crear directorio para algoritmos si no existe
    const algorithmsDir = path.join(process.cwd(), 'src', 'algorithms');
    if (!fs.existsSync(algorithmsDir)) {
      fs.mkdirSync(algorithmsDir, { recursive: true });
    }
    
    // Crear prompt para el LLM
    const algorithmPrompt = `
    # Tarea de Logic Agent
    
    Implementa un algoritmo optimizado para la siguiente especificación:
    
    "${spec}"
    
    Proporciona:
    1. Análisis de complejidad (tiempo y espacio)
    2. Implementación en TypeScript
    3. Explicación detallada del funcionamiento
    4. Casos de prueba
    
    El algoritmo debe ser eficiente, legible y bien documentado.
    `;
    
    try {
      // Consultar al LLM
      const response = await this.queryLLM(algorithmPrompt);
      
      // Extraer el código TypeScript de la respuesta
      const tsMatch = response.match(/```(?:typescript|ts)\n([\s\S]*?)\n```/);
      
      if (!tsMatch) {
        throw new Error('No se pudo extraer el código del algoritmo de la respuesta del LLM');
      }
      
      const algorithmCode = tsMatch[1];
      
      // Generar nombre de archivo basado en la especificación
      const fileName = `${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.ts`;
      const filePath = path.join(algorithmsDir, fileName);
      
      // Guardar el algoritmo
      fs.writeFileSync(filePath, algorithmCode, 'utf-8');
      
      // Extraer la explicación y análisis
      const explanation = response.replace(/```[\s\S]*?```/g, '').trim();
      
      // Guardar la explicación
      const docPath = path.join(algorithmsDir, `${path.basename(fileName, '.ts')}.md`);
      fs.writeFileSync(docPath, explanation, 'utf-8');
      
      // Generar pruebas unitarias
      await this.generateTests(spec, algorithmCode, fileName);
      
      console.log(`✅ Algoritmo implementado: ${filePath}`);
      console.log(`📝 Documentación guardada: ${docPath}`);
    } catch (error) {
      console.error('❌ Error al implementar algoritmo:', error);
      throw error;
    }
  }
  
  /**
   * Implementa una regla de negocio
   * @param spec Especificación de la regla de negocio
   */
  private async implementBusinessRule(spec: string): Promise<void> {
    console.log(`📏 Implementando regla de negocio: "${spec}"`);
    
    // Crear directorio para reglas de negocio si no existe
    const rulesDir = path.join(process.cwd(), 'src', 'business-rules');
    if (!fs.existsSync(rulesDir)) {
      fs.mkdirSync(rulesDir, { recursive: true });
    }
    
    // Crear prompt para el LLM
    const rulePrompt = `
    # Tarea de Logic Agent
    
    Implementa una regla de negocio para la siguiente especificación:
    
    "${spec}"
    
    Proporciona:
    1. Análisis de la regla y sus implicaciones
    2. Implementación en TypeScript (clase o función)
    3. Validaciones y manejo de excepciones
    4. Ejemplos de uso
    
    La regla debe ser robusta, mantenible y bien documentada.
    `;
    
    try {
      // Consultar al LLM
      const response = await this.queryLLM(rulePrompt);
      
      // Extraer el código TypeScript de la respuesta
      const tsMatch = response.match(/```(?:typescript|ts)\n([\s\S]*?)\n```/);
      
      if (!tsMatch) {
        throw new Error('No se pudo extraer el código de la regla de negocio de la respuesta del LLM');
      }
      
      const ruleCode = tsMatch[1];
      
      // Generar nombre de archivo basado en la especificación
      const fileName = `${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.ts`;
      const filePath = path.join(rulesDir, fileName);
      
      // Guardar la regla de negocio
      fs.writeFileSync(filePath, ruleCode, 'utf-8');
      
      // Extraer la explicación y análisis
      const explanation = response.replace(/```[\s\S]*?```/g, '').trim();
      
      // Guardar la explicación
      const docPath = path.join(rulesDir, `${path.basename(fileName, '.ts')}.md`);
      fs.writeFileSync(docPath, explanation, 'utf-8');
      
      // Generar pruebas unitarias
      await this.generateTests(spec, ruleCode, fileName, 'business-rules');
      
      // Generar diagrama de flujo para la regla
      await this.createFlowDiagram(spec, 'rule');
      
      console.log(`✅ Regla de negocio implementada: ${filePath}`);
      console.log(`📝 Documentación guardada: ${docPath}`);
    } catch (error) {
      console.error('❌ Error al implementar regla de negocio:', error);
      throw error;
    }
  }
  
  /**
   * Crea un diagrama de flujo
   * @param spec Especificación del flujo
   * @param type Tipo de diagrama (flow, rule, decision-tree)
   */
  private async createFlowDiagram(spec: string, type: string = 'flow'): Promise<void> {
    console.log(`📊 Creando diagrama de flujo para: "${spec}"`);
    
    // Crear directorio para diagramas si no existe
    const diagramsDir = path.join(process.cwd(), 'diagrams');
    if (!fs.existsSync(diagramsDir)) {
      fs.mkdirSync(diagramsDir, { recursive: true });
    }
    
    // Crear prompt para el LLM
    const diagramPrompt = `
    # Tarea de Logic Agent
    
    Crea un diagrama de flujo en formato Mermaid para la siguiente especificación:
    
    "${spec}"
    
    El diagrama debe representar ${type === 'rule' ? 'la regla de negocio' : type === 'decision-tree' ? 'el árbol de decisión' : 'el flujo lógico'}.
    
    Utiliza la sintaxis de Mermaid para diagramas de flujo.
    `;
    
    try {
      // Consultar al LLM
      const response = await this.queryLLM(diagramPrompt);
      
      // Extraer el código Mermaid de la respuesta
      const mermaidMatch = response.match(/```(?:mermaid)\n([\s\S]*?)\n```/) || 
                          response.match(/```\n([\s\S]*?)\n```/) ||
                          response.match(/graph [A-Z][A-Z][\s\S]*?;/);
      
      if (!mermaidMatch) {
        throw new Error('No se pudo extraer el diagrama Mermaid de la respuesta del LLM');
      }
      
      const mermaidCode = mermaidMatch[1] || mermaidMatch[0];
      
      // Generar nombre de archivo basado en la especificación
      const fileName = `${type}-${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.md`;
      const filePath = path.join(diagramsDir, fileName);
      
      // Guardar el diagrama Mermaid
      const fileContent = `# Diagrama: ${spec}\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n`;
      fs.writeFileSync(filePath, fileContent, 'utf-8');
      
      // Generar SVG si es posible
      try {
        const svgFileName = `${type}-${spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.svg`;
        const svgFilePath = path.join(diagramsDir, svgFileName);
        
        // Aquí se podría usar una librería para convertir Mermaid a SVG
        // Por ahora, solo guardamos el código Mermaid
        
        console.log(`✅ Diagrama creado: ${filePath}`);
      } catch (svgError) {
        console.warn('⚠️ No se pudo generar el SVG del diagrama:', svgError);
        console.log(`✅ Diagrama Mermaid guardado: ${filePath}`);
      }
    } catch (error) {
      console.error('❌ Error al crear diagrama de flujo:', error);
      throw error;
    }
  }
  
  /**
   * Optimiza un algoritmo existente
   * @param spec Especificación del algoritmo a optimizar
   */
  private async optimizeAlgorithm(spec: string): Promise<void> {
    console.log(`⚡ Optimizando algoritmo: "${spec}"`);
    
    // Verificar si se proporciona una ruta de archivo
    let sourceCode = '';
    let filePath = '';
    
    if (fs.existsSync(spec)) {
      // Es una ruta de archivo
      filePath = spec;
      sourceCode = fs.readFileSync(spec, 'utf-8');
    } else {
      // Buscar el archivo por nombre en el directorio de algoritmos
      const algorithmsDir = path.join(process.cwd(), 'src', 'algorithms');
      if (fs.existsSync(algorithmsDir)) {
        const files = fs.readdirSync(algorithmsDir);
        const matchingFile = files.find(file => 
          file.toLowerCase().includes(spec.toLowerCase().replace(/\s+/g, '-'))
        );
        
        if (matchingFile) {
          filePath = path.join(algorithmsDir, matchingFile);
          sourceCode = fs.readFileSync(filePath, 'utf-8');
        }
      }
    }
    
    if (!sourceCode) {
      throw new Error(`No se encontró el algoritmo para optimizar: ${spec}`);
    }
    
    // Crear prompt para el LLM
    const optimizePrompt = `
    # Tarea de Logic Agent
    
    Optimiza el siguiente algoritmo:
    
    \`\`\`typescript
    ${sourceCode}
    \`\`\`
    
    Proporciona:
    1. Análisis de la complejidad actual
    2. Optimizaciones aplicadas
    3. Versión optimizada del código
    4. Nuevo análisis de complejidad
    
    Mantén la misma interfaz pública para no romper compatibilidad.
    `;
    
    try {
      // Consultar al LLM
      const response = await this.queryLLM(optimizePrompt);
      
      // Extraer el código optimizado de la respuesta
      const tsMatch = response.match(/```(?:typescript|ts)\n([\s\S]*?)\n```/);
      
      if (!tsMatch) {
        throw new Error('No se pudo extraer el código optimizado de la respuesta del LLM');
      }
      
      const optimizedCode = tsMatch[1];
      
      // Crear copia de seguridad del archivo original
      const backupPath = `${filePath}.bak`;
      fs.copyFileSync(filePath, backupPath);
      
      // Guardar el código optimizado
      fs.writeFileSync(filePath, optimizedCode, 'utf-8');
      
      // Extraer la explicación y análisis
      const explanation = response.replace(/```[\s\S]*?```/g, '').trim();
      
      // Guardar la explicación
      const docPath = path.join(path.dirname(filePath), `${path.basename(filePath, '.ts')}-optimization.md`);
      fs.writeFileSync(docPath, explanation, 'utf-8');
      
      console.log(`✅ Algoritmo optimizado: ${filePath}`);
      console.log(`📝 Análisis de optimización guardado: ${docPath}`);
      console.log(`🔄 Copia de seguridad creada: ${backupPath}`);
    } catch (error) {
      console.error('❌ Error al optimizar algoritmo:', error);
      throw error;
    }
  }
  
  /**
   * Implementa lógica de negocio completa
   * @param spec Especificación de la lógica
   */
  private async implementLogic(spec: string): Promise<void> {
    console.log(`🧮 Implementando lógica de negocio completa: "${spec}"`);
    
    try {
      // Analizar la especificación
      console.log('🔍 Analizando especificación de lógica de negocio...');
      
      // Crear prompt para el LLM
      const analysisPrompt = `
      # Tarea de Logic Agent
      
      Analiza la siguiente especificación de lógica de negocio:
      
      "${spec}"
      
      Proporciona:
      1. Descomposición en componentes lógicos
      2. Algoritmos necesarios
      3. Reglas de negocio identificadas
      4. Flujos de decisión requeridos
      
      Estructura tu respuesta en formato JSON.
      `;
      
      // Consultar al LLM
      const analysisResponse = await this.queryLLM(analysisPrompt);
      
      // Extraer el JSON de la respuesta
      const jsonMatch = analysisResponse.match(/```(?:json)\n([\s\S]*?)\n```/) || 
                       analysisResponse.match(/```\n([\s\S]*?)\n```/) ||
                       analysisResponse.match(/{[\s\S]*?}/);
      
      if (!jsonMatch) {
        throw new Error('No se pudo extraer el análisis de la respuesta del LLM');
      }
      
      const analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      
      // Crear directorio para la lógica de negocio
      const logicName = spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const logicDir = path.join(process.cwd(), 'src', 'logic', logicName);
      if (!fs.existsSync(logicDir)) {
        fs.mkdirSync(logicDir, { recursive: true });
      }
      
      // Guardar el análisis
      const analysisPath = path.join(logicDir, 'analysis.json');
      fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), 'utf-8');
      
      // Implementar cada componente lógico
      if (analysis.algorithms) {
        for (const algorithm of analysis.algorithms) {
          await this.implementAlgorithm(`${algorithm.name}: ${algorithm.description}`);
        }
      }
      
      if (analysis.businessRules) {
        for (const rule of analysis.businessRules) {
          await this.implementBusinessRule(`${rule.name}: ${rule.description}`);
        }
      }
      
      if (analysis.decisionFlows) {
        for (const flow of analysis.decisionFlows) {
          await this.createFlowDiagram(`${flow.name}: ${flow.description}`, 'decision-tree');
        }
      }
      
      // Generar módulo principal que integre todos los componentes
      await this.generateMainModule(spec, analysis, logicDir);
      
            // Generar pruebas de integración
      await this.generateIntegrationTests(spec, analysis, logicDir);
      
      console.log(`✅ Lógica de negocio completa implementada: ${logicDir}`);
    } catch (error) {
      console.error('❌ Error al implementar lógica de negocio:', error);
      throw error;
    }
  }
  
  /**
   * Genera pruebas unitarias para un algoritmo o regla de negocio
   * @param spec Especificación del algoritmo o regla
   * @param code Código implementado
   * @param fileName Nombre del archivo
   * @param type Tipo de prueba (algorithms, business-rules)
   */
  private async generateTests(spec: string, code: string, fileName: string, type: string = 'algorithms'): Promise<void> {
    console.log(`🧪 Generando pruebas unitarias para: "${spec}"`);
    
    // Crear directorio para pruebas si no existe
    const testsDir = path.join(process.cwd(), 'tests', type);
    if (!fs.existsSync(testsDir)) {
      fs.mkdirSync(testsDir, { recursive: true });
    }
    
    // Crear prompt para el LLM
    const testPrompt = `
    # Tarea de Logic Agent
    
    Genera pruebas unitarias para el siguiente código ${type === 'algorithms' ? 'algoritmo' : 'regla de negocio'}:
    
    \`\`\`typescript
    ${code}
    \`\`\`
    
    Especificación: "${spec}"
    
    Proporciona:
    1. Pruebas unitarias completas usando Jest
    2. Casos de prueba que cubran casos normales, límite y de error
    3. Mocks y stubs si son necesarios
    4. Comentarios explicativos
    
    Las pruebas deben ser exhaustivas y verificar correctamente la funcionalidad.
    `;
    
    try {
      // Consultar al LLM
      const response = await this.queryLLM(testPrompt);
      
      // Extraer el código de pruebas de la respuesta
      const tsMatch = response.match(/```(?:typescript|ts|jest|js)\n([\s\S]*?)\n```/);
      
      if (!tsMatch) {
        throw new Error('No se pudo extraer el código de pruebas de la respuesta del LLM');
      }
      
      const testCode = tsMatch[1];
      
      // Generar nombre de archivo de prueba
      const testFileName = `${path.basename(fileName, '.ts')}.test.ts`;
      const testFilePath = path.join(testsDir, testFileName);
      
      // Guardar las pruebas
      fs.writeFileSync(testFilePath, testCode, 'utf-8');
      
      console.log(`✅ Pruebas unitarias generadas: ${testFilePath}`);
    } catch (error) {
      console.error('❌ Error al generar pruebas unitarias:', error);
      throw error;
    }
  }
  
  /**
   * Genera pruebas de integración para la lógica de negocio
   * @param spec Especificación de la lógica
   * @param analysis Análisis de la lógica
   * @param logicDir Directorio de la lógica
   */
  private async generateIntegrationTests(spec: string, analysis: any, logicDir: string): Promise<void> {
    console.log(`🧪 Generando pruebas de integración para: "${spec}"`);
    
    // Crear directorio para pruebas de integración si no existe
    const integrationTestsDir = path.join(process.cwd(), 'tests', 'integration');
    if (!fs.existsSync(integrationTestsDir)) {
      fs.mkdirSync(integrationTestsDir, { recursive: true });
    }
    
    // Crear prompt para el LLM
    const integrationTestPrompt = `
    # Tarea de Logic Agent
    
    Genera pruebas de integración para la siguiente lógica de negocio:
    
    Especificación: "${spec}"
    
    Análisis: ${JSON.stringify(analysis, null, 2)}
    
    Proporciona:
    1. Pruebas de integración usando Jest
    2. Escenarios que verifiquen la interacción entre componentes
    3. Configuración de entorno de prueba
    4. Mocks para dependencias externas
    
    Las pruebas deben verificar que todos los componentes funcionen correctamente juntos.
    `;
    
    try {
      // Consultar al LLM
      const response = await this.queryLLM(integrationTestPrompt);
      
      // Extraer el código de pruebas de la respuesta
      const tsMatch = response.match(/```(?:typescript|ts|jest|js)\n([\s\S]*?)\n```/);
      
      if (!tsMatch) {
        throw new Error('No se pudo extraer el código de pruebas de integración de la respuesta del LLM');
      }
      
      const testCode = tsMatch[1];
      
      // Generar nombre de archivo de prueba
      const logicName = spec.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const testFileName = `${logicName}.integration.test.ts`;
      const testFilePath = path.join(integrationTestsDir, testFileName);
      
      // Guardar las pruebas
      fs.writeFileSync(testFilePath, testCode, 'utf-8');
      
      console.log(`✅ Pruebas de integración generadas: ${testFilePath}`);
    } catch (error) {
      console.error('❌ Error al generar pruebas de integración:', error);
      throw error;
    }
  }
  
  /**
   * Genera el módulo principal que integra todos los componentes
   * @param spec Especificación de la lógica
   * @param analysis Análisis de la lógica
   * @param logicDir Directorio de la lógica
   */
  private async generateMainModule(spec: string, analysis: any, logicDir: string): Promise<void> {
    console.log(`📦 Generando módulo principal para: "${spec}"`);
    
    // Crear prompt para el LLM
    const mainModulePrompt = `
    # Tarea de Logic Agent
    
    Genera un módulo principal que integre todos los componentes para la siguiente lógica de negocio:
    
    Especificación: "${spec}"
    
    Análisis: ${JSON.stringify(analysis, null, 2)}
    
    Proporciona:
    1. Clase o módulo principal en TypeScript
    2. Importaciones de todos los componentes necesarios
    3. Métodos públicos para interactuar con la lógica
    4. Documentación completa con JSDoc
    
    El módulo debe ser fácil de usar y ocultar la complejidad interna.
    `;
    
    try {
      // Consultar al LLM
      const response = await this.queryLLM(mainModulePrompt);
      
      // Extraer el código del módulo principal de la respuesta
      const tsMatch = response.match(/```(?:typescript|ts)\n([\s\S]*?)\n```/);
      
      if (!tsMatch) {
        throw new Error('No se pudo extraer el código del módulo principal de la respuesta del LLM');
      }
      
      const moduleCode = tsMatch[1];
      
      // Generar nombre de archivo
      const fileName = 'index.ts';
      const filePath = path.join(logicDir, fileName);
      
      // Guardar el módulo principal
      fs.writeFileSync(filePath, moduleCode, 'utf-8');
      
      // Extraer la documentación
      const documentation = response.replace(/```[\s\S]*?```/g, '').trim();
      
      // Guardar la documentación
      const docPath = path.join(logicDir, 'README.md');
      fs.writeFileSync(docPath, documentation, 'utf-8');
      
      console.log(`✅ Módulo principal generado: ${filePath}`);
      console.log(`📝 Documentación guardada: ${docPath}`);
    } catch (error) {
      console.error('❌ Error al generar módulo principal:', error);
      throw error;
    }
  }
  
  /**
   * Genera un archivo .env.example con las variables de entorno necesarias
   * @param logicDir Directorio de la lógica
   */
  private generateEnvExample(logicDir: string): void {
    console.log('📄 Generando archivo .env.example');
    
    const envExample = `# Variables de entorno para la lógica de negocio
# Copie este archivo a .env y ajuste los valores según sea necesario

# Configuración general
NODE_ENV=development
LOG_LEVEL=info

# Configuración de servicios externos (si aplica)
# API_KEY=your_api_key_here
# API_URL=https://api.example.com

# Configuración de base de datos (si aplica)
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres
# DB_PASSWORD=password
# DB_NAME=logic_db

# Configuración de caché (si aplica)
# CACHE_TTL=3600
# REDIS_URL=redis://localhost:6379

# Configuración de rendimiento
# MAX_CONCURRENT_OPERATIONS=10
# TIMEOUT_MS=5000
`;
    
    const envPath = path.join(logicDir, '.env.example');
    fs.writeFileSync(envPath, envExample, 'utf-8');
    
    console.log(`✅ Archivo .env.example generado: ${envPath}`);
  }
  
  /**
   * Genera un archivo de configuración para la lógica de negocio
   * @param spec Especificación de la lógica
   * @param logicDir Directorio de la lógica
   */
  private generateConfig(spec: string, logicDir: string): void {
    console.log('⚙️ Generando archivo de configuración');
    
    const configCode = `/**
 * Configuración para la lógica de negocio: ${spec}
 */
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

export interface LogicConfig {
  environment: string;
  logLevel: string;
  performance: {
    maxConcurrentOperations: number;
    timeoutMs: number;
  };
  // Añadir otras configuraciones específicas según sea necesario
}

const config: LogicConfig = {
  environment: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  performance: {
    maxConcurrentOperations: parseInt(process.env.MAX_CONCURRENT_OPERATIONS || '10', 10),
    timeoutMs: parseInt(process.env.TIMEOUT_MS || '5000', 10),
  },
  // Añadir otras configuraciones específicas según sea necesario
};

export default config;
`;
    
    const configPath = path.join(logicDir, 'config.ts');
    fs.writeFileSync(configPath, configCode, 'utf-8');
    
    console.log(`✅ Archivo de configuración generado: ${configPath}`);
  }
  
  /**
   * Genera un archivo de utilidades para la lógica de negocio
   * @param logicDir Directorio de la lógica
   */
  private generateUtils(logicDir: string): void {
    console.log('🔧 Generando archivo de utilidades');
    
    const utilsCode = `/**
 * Utilidades para la lógica de negocio
 */

/**
 * Registra un mensaje en el log
 * @param message Mensaje a registrar
 * @param level Nivel de log (info, warn, error)
 */
export function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  const formattedMessage = \`[\${timestamp}] [\${level.toUpperCase()}] \${message}\`;
  
  switch (level) {
    case 'warn':
      console.warn(formattedMessage);
      break;
    case 'error':
      console.error(formattedMessage);
      break;
    default:
      console.log(formattedMessage);
  }
}

/**
 * Mide el tiempo de ejecución de una función
 * @param fn Función a medir
 * @param args Argumentos para la función
 * @returns Resultado de la función y tiempo de ejecución en ms
 */
export async function measureExecutionTime<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T> | T,
  ...args: Args
): Promise<{ result: T; executionTime: number }> {
  const startTime = performance.now();
  const result = await fn(...args);
  const endTime = performance.now();
  const executionTime = endTime - startTime;
  
  return { result, executionTime };
}

/**
 * Reintenta una operación un número específico de veces
 * @param operation Operación a reintentar
 * @param maxRetries Número máximo de reintentos
 * @param delayMs Retraso entre reintentos en ms
 * @returns Resultado de la operación
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      log(\`Intento \${attempt} fallido: \${error.message}\`, 'warn');
      
      if (attempt < maxRetries) {
        log(\`Reintentando en \${delayMs}ms...\`, 'info');
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw new Error(\`Operación fallida después de \${maxRetries} intentos: \${lastError?.message}\`);
}

/**
 * Valida que un valor no sea nulo o indefinido
 * @param value Valor a validar
 * @param name Nombre del valor para el mensaje de error
 * @returns El valor validado
 */
export function validateNotNull<T>(value: T | null | undefined, name: string): T {
  if (value === null || value === undefined) {
    throw new Error(\`\${name} no puede ser nulo o indefinido\`);
  }
  return value;
}

/**
 * Formatea un número con separadores de miles
 * @param num Número a formatear
 * @returns Número formateado
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('es-ES');
}

/**
 * Genera un ID único
 * @returns ID único
 */
export function generateId(): string {
  return \`\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
}
`;
    
    const utilsPath = path.join(logicDir, 'utils.ts');
    fs.writeFileSync(utilsPath, utilsCode, 'utf-8');
    
    console.log(`✅ Archivo de utilidades generado: ${utilsPath}`);
  }
  
  /**
   * Genera un archivo de tipos para la lógica de negocio
   * @param spec Especificación de la lógica
   * @param analysis Análisis de la lógica
   * @param logicDir Directorio de la lógica
   */
  private async generateTypes(spec: string, analysis: any, logicDir: string): Promise<void> {
    console.log('📝 Generando archivo de tipos');
    
    // Crear prompt para el LLM
    const typesPrompt = `
    # Tarea de Logic Agent
    
    Genera un archivo de tipos TypeScript para la siguiente lógica de negocio:
    
    Especificación: "${spec}"
    
    Análisis: ${JSON.stringify(analysis, null, 2)}
    
    Proporciona:
    1. Interfaces y tipos para todos los componentes
    2. Enumeraciones para valores fijos
    3. Tipos de utilidad si son necesarios
    4. Documentación completa con JSDoc
    
    Los tipos deben ser claros, precisos y bien documentados.
    `;
    
    try {
      // Consultar al LLM
      const response = await this.queryLLM(typesPrompt);
      
      // Extraer el código de tipos de la respuesta
      const tsMatch = response.match(/```(?:typescript|ts)\n([\s\S]*?)\n```/);
      
      if (!tsMatch) {
        throw new Error('No se pudo extraer el código de tipos de la respuesta del LLM');
      }
      
      const typesCode = tsMatch[1];
      
      // Guardar el archivo de tipos
      const typesPath = path.join(logicDir, 'types.ts');
      fs.writeFileSync(typesPath, typesCode, 'utf-8');
      
      console.log(`✅ Archivo de tipos generado: ${typesPath}`);
    } catch (error) {
      console.error('❌ Error al generar archivo de tipos:', error);
      throw error;
    }
  }
  
  /**
   * Genera un archivo de constantes para la lógica de negocio
   * @param spec Especificación de la lógica
   * @param analysis Análisis de la lógica
   * @param logicDir Directorio de la lógica
   */
  private async generateConstants(spec: string, analysis: any, logicDir: string): Promise<void> {
    console.log('📋 Generando archivo de constantes');
    
    // Crear prompt para el LLM
    const constantsPrompt = `
    # Tarea de Logic Agent
    
    Genera un archivo de constantes para la siguiente lógica de negocio:
    
    Especificación: "${spec}"
    
    Análisis: ${JSON.stringify(analysis, null, 2)}
    
    Proporciona:
    1. Constantes para valores fijos
    2. Mensajes de error
    3. Configuraciones por defecto
    4. Documentación con comentarios
    
    Las constantes deben ser organizadas por categorías y bien documentadas.
    `;
    
    try {
      // Consultar al LLM
      const response = await this.queryLLM(constantsPrompt);
      
      // Extraer el código de constantes de la respuesta
      const tsMatch = response.match(/```(?:typescript|ts)\n([\s\S]*?)\n```/);
      
      if (!tsMatch) {
        throw new Error('No se pudo extraer el código de constantes de la respuesta del LLM');
      }
      
      const constantsCode = tsMatch[1];
      
      // Guardar el archivo de constantes
      const constantsPath = path.join(logicDir, 'constants.ts');
      fs.writeFileSync(constantsPath, constantsCode, 'utf-8');
      
      console.log(`✅ Archivo de constantes generado: ${constantsPath}`);
    } catch (error) {
      console.error('❌ Error al generar archivo de constantes:', error);
      throw error;
    }
  }
  
  /**
   * Genera un archivo de validaciones para la lógica de negocio
   * @param spec Especificación de la lógica
   * @param analysis Análisis de la lógica
   * @param logicDir Directorio de la lógica
   */
  private async generateValidations(spec: string, analysis: any, logicDir: string): Promise<void> {
    console.log('✅ Generando archivo de validaciones');
    
    // Crear prompt para el LLM
    const validationsPrompt = `
    # Tarea de Logic Agent
    
    Genera un archivo de validaciones para la siguiente lógica de negocio:
    
    Especificación: "${spec}"
    
    Análisis: ${JSON.stringify(analysis, null, 2)}
    
    Proporciona:
    1. Funciones de validación para entradas
    2. Validadores de reglas de negocio
    3. Manejo de errores personalizado
    4. Documentación con JSDoc
    
    Las validaciones deben ser robustas y cubrir todos los casos posibles.
    `;
    
    try {
      // Consultar al LLM
      const response = await this.queryLLM(validationsPrompt);
      
      // Extraer el código de validaciones de la respuesta
      const tsMatch = response.match(/```(?:typescript|ts)\n([\s\S]*?)\n```/);
      
      if (!tsMatch) {
        throw new Error('No se pudo extraer el código de validaciones de la respuesta del LLM');
      }
      
      const validationsCode = tsMatch[1];
      
      // Guardar el archivo de validaciones
      const validationsPath = path.join(logicDir, 'validations.ts');
      fs.writeFileSync(validationsPath, validationsCode, 'utf-8');
      
      console.log(`✅ Archivo de validaciones generado: ${validationsPath}`);
    } catch (error) {
      console.error('❌ Error al generar archivo de validaciones:', error);
      throw error;
    }
  }
  
  /**
   * Consulta al LLM para obtener una respuesta
   * @param prompt Prompt para el LLM
   * @returns Respuesta del LLM
   */
  private async queryLLM(prompt: string): Promise<string> {
    // Aquí se implementaría la lógica para consultar al LLM
    // Por ahora, simulamos una respuesta
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulación de respuesta del LLM
        resolve(`Respuesta simulada para el prompt: "${prompt.substring(0, 50)}..."`);
      }, 1000);
    });
  }
}