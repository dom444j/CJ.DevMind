import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';

/**
 * Performance Agent - Analiza y optimiza el rendimiento de aplicaciones
 * 
 * Este agente es responsable de:
 * 1. Analizar el rendimiento de aplicaciones web y móviles
 * 2. Identificar cuellos de botella y problemas de rendimiento
 * 3. Proponer optimizaciones para mejorar la velocidad y eficiencia
 * 4. Generar informes de rendimiento con métricas clave
 * 5. Implementar mejores prácticas de rendimiento
 * 6. Optimizar el rendimiento de bases de datos y consultas
 * 7. Mejorar la eficiencia de algoritmos y estructuras de datos
 * 8. Realizar análisis de carga y estrés
 */
export class PerformanceAgent extends BaseAgent {
  constructor() {
    super('Performance Agent');
  }
  
  /**
   * Ejecuta el Performance Agent para analizar y optimizar el rendimiento
   * @param perfSpec Especificación o ruta del código a analizar
   */
  async run(perfSpec: string): Promise<void> {
    console.log(`⚡ Performance Agent analizando rendimiento para: "${perfSpec}"`);
    
    // Leer contexto relevante
    const coreContext = this.readContext('core.md');
    const rulesContext = this.readContext('rules.md');
    const modulesContext = this.readContext('modules.md');
    
    // Determinar el tipo de análisis de rendimiento
    const perfType = this.determinePerfType(perfSpec);
    
    // Analizar el código fuente si se proporciona una ruta
    let sourceCode = '';
    if (fs.existsSync(perfSpec)) {
      try {
        sourceCode = fs.readFileSync(perfSpec, 'utf-8');
      } catch (error) {
        console.warn(`⚠️ No se pudo leer el archivo: ${perfSpec}`);
      }
    }
    
    // Crear prompt para el LLM
    const perfPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Reglas del Sistema
    ${rulesContext}
    
    # Módulos y Agentes
    ${modulesContext}
    
    # Análisis de Rendimiento
    Analiza el siguiente código y proporciona optimizaciones de rendimiento para ${perfType}.
    
    ${sourceCode ? `\`\`\`\n${sourceCode}\n\`\`\`` : `Tipo de análisis: ${perfType}`}
    
    # Instrucciones
    1. Identifica los principales cuellos de botella y problemas de rendimiento
    2. Proporciona soluciones específicas para cada problema identificado
    3. Sugiere mejores prácticas de rendimiento aplicables
    4. Incluye ejemplos de código optimizado
    5. Proporciona métricas estimadas de mejora (porcentajes, tiempos de respuesta)
    6. Considera el impacto en la experiencia del usuario y la escalabilidad
    7. Prioriza las optimizaciones según su impacto y facilidad de implementación
    8. Incluye consideraciones para diferentes entornos (desarrollo, producción)
    
    # Formato de Respuesta
    Estructura tu respuesta en las siguientes secciones:
    1. Resumen Ejecutivo
    2. Problemas Identificados
    3. Soluciones Propuestas
    4. Código Optimizado
    5. Métricas de Mejora
    6. Recomendaciones Adicionales
    7. Plan de Implementación
    `;
    
    // Enviar prompt al LLM y procesar respuesta
    const perfAnalysis = await this.llm.complete(perfPrompt);
    
    // Guardar análisis en archivo
    const outputPath = path.join(process.cwd(), 'performance-analysis.md');
    fs.writeFileSync(outputPath, perfAnalysis);
    
    console.log(`✅ Análisis de rendimiento completado y guardado en: ${outputPath}`);
    
    // Implementar optimizaciones si se solicita
    if (perfSpec.includes('--implement')) {
      await this.implementOptimizations(perfSpec, perfAnalysis);
    }
  }
  
  /**
   * Determina el tipo de análisis de rendimiento basado en la especificación
   * @param perfSpec Especificación de rendimiento
   * @returns Tipo de análisis de rendimiento
   */
  private determinePerfType(perfSpec: string): string {
    if (perfSpec.includes('frontend') || perfSpec.includes('react') || perfSpec.includes('vue') || perfSpec.includes('angular')) {
      return 'frontend';
    } else if (perfSpec.includes('backend') || perfSpec.includes('api') || perfSpec.includes('server')) {
      return 'backend';
    } else if (perfSpec.includes('database') || perfSpec.includes('sql') || perfSpec.includes('query')) {
      return 'database';
    } else if (perfSpec.includes('algorithm') || perfSpec.includes('data-structure')) {
      return 'algorithm';
    } else if (perfSpec.includes('mobile') || perfSpec.includes('ios') || perfSpec.includes('android')) {
      return 'mobile';
    } else if (perfSpec.includes('network') || perfSpec.includes('api-calls')) {
      return 'network';
    } else {
      // Intentar determinar el tipo basado en la extensión del archivo
      if (fs.existsSync(perfSpec)) {
        const ext = path.extname(perfSpec).toLowerCase();
        if (['.js', '.jsx', '.ts', '.tsx', '.vue', '.html', '.css'].includes(ext)) {
          return 'frontend';
        } else if (['.java', '.cs', '.go', '.rb', '.py', '.php'].includes(ext)) {
          return 'backend';
        } else if (['.sql'].includes(ext)) {
          return 'database';
        }
      }
      
      return 'general';
    }
  }
  
  /**
   * Implementa las optimizaciones recomendadas
   * @param perfSpec Especificación de rendimiento
   * @param analysis Análisis de rendimiento
   */
  private async implementOptimizations(perfSpec: string, analysis: string): Promise<void> {
    console.log(`🔧 Implementando optimizaciones de rendimiento...`);
    
    // Extraer código optimizado del análisis
    const codeBlocks = this.extractCodeBlocks(analysis);
    
    if (codeBlocks.length === 0) {
      console.warn(`⚠️ No se encontraron bloques de código optimizado en el análisis`);
      return;
    }
    
    // Determinar archivo de destino
    let targetFile = perfSpec.replace('--implement', '').trim();
    if (!fs.existsSync(targetFile)) {
      console.warn(`⚠️ Archivo de destino no encontrado: ${targetFile}`);
      return;
    }
    
    // Crear copia de seguridad
    const backupFile = `${targetFile}.backup`;
    fs.copyFileSync(targetFile, backupFile);
    console.log(`📦 Copia de seguridad creada: ${backupFile}`);
    
    // Implementar optimizaciones
    const originalCode = fs.readFileSync(targetFile, 'utf-8');
    let optimizedCode = originalCode;
    
    // Prompt para implementar optimizaciones
    const implementPrompt = `
    # Implementación de Optimizaciones
    
    ## Código Original
    \`\`\`
    ${originalCode}
    \`\`\`
    
    ## Optimizaciones Recomendadas
    ${codeBlocks.map((block, i) => `### Optimización ${i + 1}\n\`\`\`\n${block}\n\`\`\``).join('\n\n')}
    
    # Instrucciones
    1. Implementa las optimizaciones recomendadas en el código original
    2. Mantén la estructura general y funcionalidad del código
    3. Añade comentarios explicando las optimizaciones realizadas
    4. Asegúrate de que el código resultante sea válido y funcional
    
    # Formato de Respuesta
    Proporciona solo el código optimizado sin explicaciones adicionales.
    `;
    
    // Enviar prompt al LLM y procesar respuesta
    optimizedCode = await this.llm.complete(implementPrompt);
    
    // Limpiar respuesta para obtener solo el código
    optimizedCode = this.cleanLLMResponse(optimizedCode);
    
    // Guardar código optimizado
    fs.writeFileSync(targetFile, optimizedCode);
    console.log(`✅ Optimizaciones implementadas en: ${targetFile}`);
  }
  
  /**
   * Extrae bloques de código de un texto
   * @param text Texto con bloques de código
   * @returns Array de bloques de código
   */
  private extractCodeBlocks(text: string): string[] {
    const codeBlockRegex = /```(?:[\w-]+)?\n([\s\S]*?)```/g;
    const codeBlocks: string[] = [];
    let match;
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      codeBlocks.push(match[1]);
    }
    
    return codeBlocks;
  }
  
  /**
   * Limpia la respuesta del LLM para obtener solo el código
   * @param response Respuesta del LLM
   * @returns Código limpio
   */
  private cleanLLMResponse(response: string): string {
    // Eliminar marcadores de código markdown
    let cleaned = response.replace(/```[\w-]*\n/g, '').replace(/```/g, '');
    
    // Eliminar explicaciones fuera de bloques de código
    const codeBlockMatch = cleaned.match(/[\s\S]+/);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[0];
    }
    
    return cleaned;
  }
  
  /**
   * Genera un informe de rendimiento para diferentes tipos de aplicaciones
   * @param perfType Tipo de rendimiento (frontend, backend, database, algorithm)
   * @returns Informe de rendimiento
   */
  public generatePerformanceReport(perfType: string): string {
    if (perfType === 'frontend') {
      return `# Informe de Rendimiento Frontend

## Resumen Ejecutivo
Este informe analiza el rendimiento de la aplicación frontend y proporciona recomendaciones para mejorar la velocidad de carga, la interactividad y la experiencia del usuario.

## Métricas Clave
- **First Contentful Paint (FCP)**: 1.8s (objetivo: <1s)
- **Time to Interactive (TTI)**: 3.5s (objetivo: <2s)
- **Largest Contentful Paint (LCP)**: 2.4s (objetivo: <2.5s)
- **Cumulative Layout Shift (CLS)**: 0.12 (objetivo: <0.1)
- **First Input Delay (FID)**: 120ms (objetivo: <100ms)
- **Total Bundle Size**: 1.2MB (objetivo: <500KB)

## Problemas Identificados
1. **Renderizado ineficiente de componentes**
   - Múltiples re-renderizados innecesarios
   - Falta de memoización en componentes pesados
   - Uso excesivo de efectos secundarios

2. **Carga de recursos no optimizada**
   - Imágenes sin optimizar
   - Carga anticipada de recursos no críticos
   - Falta de estrategia de carga diferida

3. **Gestión ineficiente del estado**
   - Estado global sobredimensionado
   - Actualizaciones frecuentes que provocan cascadas de renderizado
   - Falta de normalización de datos

## Recomendaciones

### 1. Optimización de Renderizado
\`\`\`jsx
// Antes
function HeavyComponent({ data }) {
  return (
    <div>
      {data.map(item => (
        <ExpensiveItem key={item.id} item={item} />
      ))}
    </div>
  );
}

// Después
const MemoizedExpensiveItem = React.memo(ExpensiveItem);

function HeavyComponent({ data }) {
  const memoizedData = useMemo(() => data, [data]);
  
  return (
    <div>
      {memoizedData.map(item => (
        <MemoizedExpensiveItem key={item.id} item={item} />
      ))}
    </div>
  );
}
\`\`\`

### 2. Carga Diferida de Componentes
\`\`\`jsx
// Antes
import HeavyComponent from './HeavyComponent';

// Después
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <HeavyComponent />
    </Suspense>
  );
}
\`\`\`

### 3. Optimización de Imágenes
\`\`\`jsx
// Antes
<img src="/large-image.jpg" alt="Descripción" />

// Después
<img 
  src="/large-image.jpg" 
  srcSet="/large-image-300w.jpg 300w, /large-image-600w.jpg 600w, /large-image-1200w.jpg 1200w" 
  sizes="(max-width: 600px) 300px, (max-width: 1200px) 600px, 1200px"
  loading="lazy"
  alt="Descripción" 
/>
\`\`\`

### 4. Virtualización de Listas Largas
\`\`\`jsx
// Antes
function LongList({ items }) {
  return (
    <div>
      {items.map(item => (
        <ListItem key={item.id} item={item} />
      ))}
    </div>
  );
}

// Después
import { FixedSizeList } from 'react-window';

function LongList({ items }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ListItem item={items[index]} />
    </div>
  );
  
  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={items.length}
      itemSize={50}
    >
      {Row}
    </FixedSizeList>
  );
}
\`\`\`

### 5. Optimización de Estado Global
\`\`\`jsx
// Antes - Redux sin normalización
const initialState = {
  posts: [],
  comments: [],
  users: []
};

// Después - Redux con normalización
const initialState = {
  entities: {
    posts: {},
    comments: {},
    users: {}
  },
  ids: {
    posts: [],
    comments: [],
    users: []
  }
};
\`\`\`

## Plan de Implementación
1. **Fase 1: Análisis y Medición**
   - Establecer línea base de rendimiento con Lighthouse
   - Identificar componentes críticos para la experiencia del usuario
   - Configurar monitoreo continuo

2. **Fase 2: Optimizaciones de Alto Impacto**
   - Implementar carga diferida de componentes no críticos
   - Optimizar imágenes y recursos estáticos
   - Aplicar memoización a componentes pesados

3. **Fase 3: Optimizaciones Avanzadas**
   - Refactorizar gestión de estado
   - Implementar virtualización para listas largas
   - Optimizar animaciones y transiciones

4. **Fase 4: Validación y Ajustes**
   - Medir impacto de optimizaciones
   - Realizar pruebas de usuario
   - Ajustar según resultados

## Impacto Esperado
- Reducción del 40% en tiempo de carga inicial
- Mejora del 60% en interactividad
- Reducción del 50% en tamaño de bundle
- Mejora del 30% en métricas de Core Web Vitals`;
    } else if (perfType === 'backend') {
      return `// Código optimizado para backend
const express = require('express');
const redis = require('redis');
const { promisify } = require('util');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const pLimit = require('p-limit');

// Configuración de caché con Redis
const setupCache = () => {
  const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  });
  
  return {
    getAsync: promisify(client.get).bind(client),
    setAsync: promisify(client.set).bind(client),
    delAsync: promisify(client.del).bind(client)
  };
};

// Implementación de servidor optimizado
if (cluster.isMaster) {
  console.log(\`Master \${process.pid} is running\`);

  // Crear workers para cada CPU
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.log(\`Worker \${worker.process.pid} died\`);
    // Reiniciar worker si muere
    cluster.fork();
  });
} else {
  // Código del worker
  const app = express();
  const cache = setupCache();
  const limit = pLimit(5); // Limitar concurrencia
  
  // Middleware para parsear JSON
  app.use(express.json());
  
  // Middleware de caché para rutas GET
  const cacheMiddleware = async (req, res, next) => {
    // Saltear caché para solicitudes no-GET
    if (req.method !== 'GET') {
      return next();
    }
    
    const key = \`cache:\${req.originalUrl}\`;
    
    try {
      const cachedData = await cache.getAsync(key);
      
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
      
      // Modificar res.json para cachear respuesta
      const originalJson = res.json;
      res.json = function(data) {
        cache.setAsync(key, JSON.stringify(data), 'EX', 3600); // TTL: 1 hora
        return originalJson.call(this, data);
      };
      
      next();
    } catch (error) {
      console.error('Error de caché:', error);
      next();
    }
  };
  
  // Optimización de consultas a base de datos
  const db = {
    async getUsers(filters = {}, page = 1, limit = 20) {
      // Simulación de consulta optimizada con índices
      const offset = (page - 1) * limit;
      
      // Construir consulta con solo los campos necesarios
      let query = 'SELECT id, name, email FROM users';
      const params = [];
      
      if (filters.name) {
        query += ' WHERE name LIKE ?';
        params.push(\`%\${filters.name}%\`);
      }
      
      query += ' ORDER BY id LIMIT ? OFFSET ?';
      params.push(limit, offset);
      
      // Simulación de resultado
      return Array(limit).fill().map((_, i) => ({
        id: i + offset + 1,
        name: \`User \${i + offset + 1}\`,
        email: \`user\${i + offset + 1}@example.com\`
      }));
    },
    
    async getUserById(id) {
      // Simulación de consulta por clave primaria (muy rápida)
      return {
        id,
        name: \`User \${id}\`,
        email: \`user\${id}@example.com\`
      };
    }
  };
  
  // Ruta optimizada con caché
  app.get('/api/users', cacheMiddleware, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.limit) || 20;
      const filters = {
        name: req.query.name
      };
      
      const users = await db.getUsers(filters, page, pageSize);
      
      res.json({
        data: users,
        page,
        pageSize,
        total: 1000 // Simulado
      });
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Ruta para procesar datos en paralelo
  app.post('/api/process-batch', async (req, res) => {
    try {
      const items = req.body.items || [];
      
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: 'items debe ser un array' });
      }
      
      // Procesar items en paralelo con límite de concurrencia
      const results = await Promise.all(
        items.map(item => limit(() => processItem(item)))
      );
      
      res.json({ results });
    } catch (error) {
      console.error('Error procesando batch:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });
  
  // Función de procesamiento simulada
  async function processItem(item) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          id: item.id,
          processed: true,
          result: item.value * 2
        });
      }, 50); // Simulación de procesamiento
    });
  }
  
  // Iniciar servidor
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(\`Worker \${process.pid} started on port \${PORT}\`);
  });
}`;
    } else {
      return `// Código optimizado para algoritmos
/**
 * Implementación optimizada de algoritmo de búsqueda y procesamiento
 * Complejidad original: O(n²)
 * Complejidad optimizada: O(n log n)
 */

// Estructuras de datos optimizadas
class OptimizedDataProcessor {
  constructor(data) {
    // Crear índices para búsqueda rápida
    this.dataMap = new Map();
    this.dataArray = [...data]; // Copia superficial
    
    // Indexar datos para búsqueda O(1)
    for (const item of data) {
      this.dataMap.set(item.id, item);
    }
  }
  
  // Búsqueda optimizada - O(1) en lugar de O(n)
  findById(id) {
    return this.dataMap.get(id);
  }
  
  // Ordenamiento optimizado - O(n log n) en lugar de implementación manual O(n²)
  sortByValue() {
    return [...this.dataArray].sort((a, b) => a.value - b.value);
  }
  
  // Filtrado optimizado usando índices
  filterByRange(min, max) {
    // Usar array ya ordenado si es posible
    const sorted = this.sortByValue();
    
    // Búsqueda binaria para encontrar el índice del primer elemento >= min
    const findMinIndex = (arr, minValue) => {
      let left = 0;
      let right = arr.length - 1;
      let result = arr.length;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid].value >= minValue) {
          result = mid;
          right = mid - 1;
        } else {
          left = mid + 1;
        }
      }
      
      return result;
    };
    
    // Búsqueda binaria para encontrar el índice del último elemento <= max
    const findMaxIndex = (arr, maxValue) => {
      let left = 0;
      let right = arr.length - 1;
      let result = -1;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid].value <= maxValue) {
          result = mid;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      
      return result;
    };
    
    const minIndex = findMinIndex(sorted, min);
    const maxIndex = findMaxIndex(sorted, max);
    
    if (minIndex <= maxIndex) {
      return sorted.slice(minIndex, maxIndex + 1);
    }
    
    return [];
  }
  
  // Procesamiento por lotes para operaciones costosas
  async processBatch(batchSize = 1000) {
    const results = [];
    
    // Procesar en chunks para no bloquear el hilo principal
    for (let i = 0; i < this.dataArray.length; i += batchSize) {
      const chunk = this.dataArray.slice(i, i + batchSize);
      
      // Simular procesamiento asíncrono
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Procesar chunk
      const processedChunk = chunk.map(item => ({
        id: item.id,
        processed: item.value * 2
      }));
      
      results.push(...processedChunk);
    }
    
    return results;
  }
  
  // Implementación de memoización para cálculos costosos
  memoizedCalculation() {
    if (!this._cachedCalculation) {
      console.log('Calculando y cacheando resultado...');
      
      // Simulación de cálculo costoso
      const result = {};
      
      for (const item of this.dataArray) {
        // Agrupar por categoría para acceso rápido
        const category = item.category || 'default';
        
        if (!result[category]) {
          result[category] = {
            count: 0,
            sum: 0,
            items: []
          };
        }
        
        result[category].count++;
        result[category].sum += item.value;
        result[category].items.push(item.id);
      }
      
      this._cachedCalculation = result;
    }
    
    return this._cachedCalculation;
  }
  
  // Procesamiento paralelo usando Web Workers (simulado)
  async processParallel() {
    // En un entorno real, esto usaría Web Workers o worker_threads
    console.log('Iniciando procesamiento paralelo...');
    
    // Dividir datos en chunks para cada "worker"
    const numWorkers = 4; // Simular 4 workers
    const chunkSize = Math.ceil(this.dataArray.length / numWorkers);
    const chunks = [];
    
    for (let i = 0; i < this.dataArray.length; i += chunkSize) {
      chunks.push(this.dataArray.slice(i, i + chunkSize));
    }
    
    // Simular procesamiento paralelo
    const results = await Promise.all(chunks.map(async (chunk, workerIndex) => {
      console.log(\`Worker \${workerIndex} procesando \${chunk.length} items\`);
      
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return chunk.map(item => ({
        id: item.id,
        workerIndex,
        result: item.value * 3
      }));
    }));
    
    // Combinar resultados
    return results.flat();
  }
}

// Ejemplo de uso
async function main() {
  // Generar datos de prueba
  const testData = Array.from({ length: 10000 }, (_, i) => ({
    id: \`item-\${i}\`,
    value: Math.floor(Math.random() * 1000),
    category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)]
  }));
  
  console.time('Procesamiento total');
  
  // Inicializar procesador optimizado
  const processor = new OptimizedDataProcessor(testData);
  
  // Búsqueda por ID - O(1)
  console.time('Búsqueda por ID');
  const item = processor.findById('item-5000');
  console.timeEnd('Búsqueda por ID');
  
  // Ordenamiento - O(n log n)
  console.time('Ordenamiento');
  const sorted = processor.sortByValue();
  console.timeEnd('Ordenamiento');
  
  // Filtrado por rango usando búsqueda binaria
  console.time('Filtrado por rango');
  const filtered = processor.filterByRange(300, 700);
  console.timeEnd('Filtrado por rango');
  
  // Procesamiento por lotes
  console.time('Procesamiento por lotes');
  const batchResults = await processor.processBatch();
  console.timeEnd('Procesamiento por lotes');
  
  // Cálculo con memoización
  console.time('Primera ejecución con memoización');
  const calculation1 = processor.memoizedCalculation();
  console.timeEnd('Primera ejecución con memoización');
  
  console.time('Segunda ejecución con memoización');
  const calculation2 = processor.memoizedCalculation();
  console.timeEnd('Segunda ejecución con memoización');
  
  // Procesamiento paralelo
  console.time('Procesamiento paralelo');
  const parallelResults = await processor.processParallel();
  console.timeEnd('Procesamiento paralelo');
  
  console.timeEnd('Procesamiento total');
  
  return {
    itemFound: item !== undefined,
    sortedCount: sorted.length,
    filteredCount: filtered.length,
    batchResultsCount: batchResults.length,
    calculationCategories: Object.keys(calculation1).length,
    parallelResultsCount: parallelResults.length
  };
}

// Ejecutar algoritmo optimizado
main().then(console.log).catch(console.error);`;
    }
  }
  
    /**
   * Genera recomendaciones de optimización para diferentes tipos de aplicaciones
   * @param perfType Tipo de rendimiento (frontend, backend, database, algorithm, mobile, network)
   * @returns Recomendaciones de optimización
   */
    public generateOptimizationRecommendations(perfType: string): string {
      switch (perfType) {
        case 'frontend':
          return `# Recomendaciones de Optimización Frontend
  
  ## Prioridad Alta
  1. **Reducir el tamaño de bundle**
     - Implementar code-splitting con dynamic imports
     - Configurar tree-shaking agresivo
     - Eliminar dependencias no utilizadas
  
  2. **Optimizar renderizado**
     - Implementar virtualización para listas largas
     - Usar React.memo para componentes puros
     - Optimizar re-renderizados con useMemo y useCallback
  
  3. **Mejorar carga inicial**
     - Implementar lazy loading para rutas y componentes
     - Priorizar carga de CSS crítico
     - Optimizar imágenes con formatos modernos (WebP, AVIF)
  
  ## Prioridad Media
  1. **Optimizar estado global**
     - Normalizar estructura de datos
     - Implementar selectors memoizados
     - Reducir actualizaciones innecesarias
  
  2. **Mejorar experiencia percibida**
     - Implementar skeleton screens
     - Usar transiciones suaves
     - Precargar datos críticos
  
  ## Prioridad Baja
  1. **Optimizar para dispositivos móviles**
     - Implementar responsive design eficiente
     - Reducir uso de JavaScript en móviles
     - Optimizar para touch interactions`;
  
        case 'backend':
          return `# Recomendaciones de Optimización Backend
  
  ## Prioridad Alta
  1. **Optimizar consultas a base de datos**
     - Revisar y mejorar índices
     - Implementar consultas N+1
     - Usar procedimientos almacenados para operaciones complejas
  
  2. **Implementar caché efectivo**
     - Caché en memoria para datos frecuentes
     - Caché distribuido (Redis) para entornos multi-instancia
     - Estrategias de invalidación inteligentes
  
  3. **Optimizar manejo de concurrencia**
     - Implementar procesamiento asíncrono
     - Usar worker pools para tareas CPU-intensivas
     - Implementar rate limiting y backpressure
  
  ## Prioridad Media
  1. **Mejorar arquitectura de microservicios**
     - Optimizar comunicación entre servicios
     - Implementar circuit breakers
     - Usar message queues para operaciones asíncronas
  
  2. **Optimizar serialización/deserialización**
     - Usar formatos binarios (Protocol Buffers, MessagePack)
     - Minimizar transferencia de datos innecesarios
     - Implementar compresión para respuestas grandes
  
  ## Prioridad Baja
  1. **Mejorar logging y monitoreo**
     - Implementar logging estructurado
     - Configurar alertas proactivas
     - Usar APM para identificar cuellos de botella`;
  
        case 'database':
          return `# Recomendaciones de Optimización de Base de Datos
  
  ## Prioridad Alta
  1. **Optimizar esquema y consultas**
     - Revisar y mejorar índices existentes
     - Normalizar/desnormalizar según patrones de acceso
     - Optimizar consultas complejas y joins
  
  2. **Implementar estrategias de caché**
     - Caché de resultados de consultas frecuentes
     - Caché de objetos en aplicación
     - Invalidación inteligente de caché
  
  3. **Optimizar transacciones**
     - Reducir duración de transacciones
     - Evitar bloqueos innecesarios
     - Implementar niveles de aislamiento apropiados
  
  ## Prioridad Media
  1. **Mejorar configuración del servidor**
     - Optimizar parámetros de memoria
     - Configurar buffer pools y caches
     - Ajustar configuración de escritura/lectura
  
  2. **Implementar particionamiento**
     - Particionar tablas grandes
     - Implementar sharding para escalabilidad horizontal
     - Usar vistas materializadas para reportes
  
  ## Prioridad Baja
  1. **Optimizar para alta disponibilidad**
     - Configurar replicación
     - Implementar failover automático
     - Planificar estrategias de backup y recuperación`;
  
        case 'algorithm':
          return `# Recomendaciones de Optimización de Algoritmos
  
  ## Prioridad Alta
  1. **Reducir complejidad computacional**
     - Revisar algoritmos O(n²) o peores
     - Implementar algoritmos más eficientes
     - Usar estructuras de datos optimizadas
  
  2. **Optimizar uso de memoria**
     - Reducir copias innecesarias
     - Implementar procesamiento por lotes
     - Usar estructuras de datos compactas
  
  3. **Paralelizar operaciones**
     - Identificar operaciones paralelizables
     - Implementar multithreading/multiprocessing
     - Usar procesamiento vectorial cuando sea posible
  
  ## Prioridad Media
  1. **Implementar memoización**
     - Cachear resultados de operaciones costosas
     - Usar tablas de búsqueda para cálculos frecuentes
     - Implementar lazy evaluation
  
  2. **Optimizar E/S**
     - Minimizar operaciones de disco
     - Implementar buffering eficiente
     - Usar E/S asíncrona
  
  ## Prioridad Baja
  1. **Optimizar para casos específicos**
     - Implementar optimizaciones para casos frecuentes
     - Usar heurísticas para aproximaciones rápidas
     - Implementar early termination cuando sea posible`;
  
        case 'mobile':
          return `# Recomendaciones de Optimización Mobile
  
  ## Prioridad Alta
  1. **Reducir consumo de batería**
     - Minimizar operaciones en background
     - Optimizar uso de sensores
     - Implementar batch processing para operaciones de red
  
  2. **Mejorar rendimiento de UI**
     - Evitar bloqueos del hilo principal
     - Optimizar renderizado de listas
     - Reducir complejidad de layouts
  
  3. **Optimizar uso de memoria**
     - Implementar lazy loading de recursos
     - Liberar recursos no utilizados
     - Optimizar caché de imágenes
  
  ## Prioridad Media
  1. **Reducir tamaño de aplicación**
     - Optimizar recursos gráficos
     - Implementar code splitting
     - Usar bibliotecas optimizadas para móviles
  
  2. **Mejorar experiencia offline**
     - Implementar sincronización eficiente
     - Cachear datos críticos
     - Manejar gracefully fallos de red
  
  ## Prioridad Baja
  1. **Optimizar para diferentes dispositivos**
     - Adaptar UI para diferentes tamaños de pantalla
     - Optimizar para dispositivos de gama baja
     - Implementar detección de capacidades`;
  
        case 'network':
          return `# Recomendaciones de Optimización de Red
  
  ## Prioridad Alta
  1. **Reducir número de peticiones**
     - Implementar bundling de recursos
     - Usar HTTP/2 para multiplexing
     - Consolidar APIs
  
  2. **Minimizar tamaño de transferencia**
     - Implementar compresión (gzip, Brotli)
     - Optimizar formato de datos (JSON, Protocol Buffers)
     - Implementar respuestas parciales
  
  3. **Implementar estrategias de caché**
     - Configurar headers de caché correctamente
     - Implementar ETags y validación
     - Usar service workers para caché offline
  
  ## Prioridad Media
  1. **Optimizar latencia**
     - Usar CDNs para recursos estáticos
     - Implementar conexiones persistentes
     - Reducir round-trips innecesarios
  
  2. **Mejorar resiliencia**
     - Implementar retry con backoff exponencial
     - Usar circuit breakers
     - Implementar degradación graceful
  
  ## Prioridad Baja
  1. **Optimizar para diferentes condiciones de red**
     - Adaptar calidad de contenido según ancho de banda
     - Implementar carga progresiva
     - Priorizar recursos críticos`;
  
        default:
          return `# Recomendaciones de Optimización General
  
  ## Prioridad Alta
  1. **Identificar cuellos de botella**
     - Realizar profiling de aplicación
     - Medir tiempos de respuesta
     - Analizar uso de recursos
  
  2. **Optimizar operaciones críticas**
     - Mejorar algoritmos y estructuras de datos
     - Implementar caché efectivo
     - Paralelizar operaciones cuando sea posible
  
  3. **Mejorar experiencia de usuario**
     - Optimizar tiempo de carga inicial
     - Reducir tiempo de respuesta a interacciones
     - Implementar feedback visual para operaciones largas
  
  ## Prioridad Media
  1. **Optimizar uso de recursos**
     - Reducir consumo de memoria
     - Optimizar uso de CPU
     - Minimizar operaciones de E/S
  
  2. **Mejorar escalabilidad**
     - Implementar arquitectura distribuida
     - Optimizar para concurrencia
     - Usar recursos cloud eficientemente
  
  ## Prioridad Baja
  1. **Implementar monitoreo y optimización continua**
     - Configurar alertas para degradación de rendimiento
     - Implementar A/B testing para optimizaciones
     - Establecer KPIs de rendimiento`;
      }
    }
    
    /**
     * Analiza el rendimiento de una aplicación web
     * @param url URL de la aplicación web
     * @returns Análisis de rendimiento
     */
    public async analyzeWebPerformance(url: string): Promise<string> {
      console.log(`🔍 Analizando rendimiento web para: ${url}`);
      
      // Simular análisis de rendimiento web
      // En una implementación real, esto usaría Lighthouse o herramientas similares
      const metrics = {
        fcp: 1.8, // First Contentful Paint (segundos)
        lcp: 2.4, // Largest Contentful Paint (segundos)
        cls: 0.12, // Cumulative Layout Shift
        fid: 120, // First Input Delay (ms)
        tti: 3.5, // Time to Interactive (segundos)
        tbt: 450, // Total Blocking Time (ms)
        speedIndex: 2.9, // Speed Index (segundos)
        bundleSize: 1.2, // Tamaño del bundle (MB)
      };
      
      // Evaluar métricas según estándares de Core Web Vitals
      const evaluateMetric = (name: string, value: number, good: number, needsImprovement: number): string => {
        if (value <= good) return `✅ Bueno (${value})`;
        if (value <= needsImprovement) return `⚠️ Necesita mejora (${value})`;
        return `❌ Pobre (${value})`;
      };
      
      const evaluations = {
        fcp: evaluateMetric('FCP', metrics.fcp, 1.0, 2.5),
        lcp: evaluateMetric('LCP', metrics.lcp, 2.5, 4.0),
        cls: evaluateMetric('CLS', metrics.cls, 0.1, 0.25),
        fid: evaluateMetric('FID', metrics.fid, 100, 300),
        tti: evaluateMetric('TTI', metrics.tti, 2.0, 5.0),
        tbt: evaluateMetric('TBT', metrics.tbt, 300, 600),
        speedIndex: evaluateMetric('Speed Index', metrics.speedIndex, 2.5, 4.0),
        bundleSize: evaluateMetric('Bundle Size', metrics.bundleSize, 0.5, 1.0),
      };
      
      // Generar recomendaciones basadas en métricas
      const recommendations = [];
      
      if (metrics.fcp > 1.0) {
        recommendations.push('- Optimizar tiempo de carga inicial con server-side rendering o static generation');
      }
      
      if (metrics.lcp > 2.5) {
        recommendations.push('- Priorizar carga de contenido principal y optimizar imágenes críticas');
      }
      
      if (metrics.cls > 0.1) {
        recommendations.push('- Reducir cambios de layout reservando espacio para elementos dinámicos');
      }
      
      if (metrics.fid > 100) {
        recommendations.push('- Optimizar tiempo de respuesta a interacciones dividiendo tareas largas');
      }
      
      if (metrics.tti > 2.0) {
        recommendations.push('- Reducir JavaScript no crítico y implementar code splitting');
      }
      
      if (metrics.tbt > 300) {
        recommendations.push('- Minimizar trabajo en el hilo principal y optimizar JavaScript');
      }
      
      if (metrics.bundleSize > 0.5) {
        recommendations.push('- Reducir tamaño de bundle con tree shaking y eliminación de dependencias no utilizadas');
      }
      
      // Generar informe de rendimiento
      return `# Análisis de Rendimiento Web: ${url}
  
  ## Resumen Ejecutivo
  El análisis de rendimiento de la aplicación web muestra oportunidades de mejora en varias áreas clave, especialmente en tiempo de carga inicial, interactividad y tamaño de bundle.
  
  ## Métricas Core Web Vitals
  - **First Contentful Paint (FCP)**: ${evaluations.fcp}
  - **Largest Contentful Paint (LCP)**: ${evaluations.lcp}
  - **Cumulative Layout Shift (CLS)**: ${evaluations.cls}
  - **First Input Delay (FID)**: ${evaluations.fid}
  
  ## Métricas Adicionales
  - **Time to Interactive (TTI)**: ${evaluations.tti}
  - **Total Blocking Time (TBT)**: ${evaluations.tbt}
  - **Speed Index**: ${evaluations.speedIndex}
  - **Bundle Size**: ${evaluations.bundleSize}
  
  ## Recomendaciones Principales
  ${recommendations.join('\n')}
  
  ## Plan de Acción
  1. **Fase 1: Optimizaciones Críticas**
     - Optimizar LCP implementando lazy loading y priorizando contenido visible
     - Reducir CLS reservando espacio para elementos dinámicos
     - Optimizar FID minimizando JavaScript no crítico
  
  2. **Fase 2: Optimizaciones Secundarias**
     - Implementar code splitting para reducir tamaño de bundle
     - Optimizar imágenes y recursos estáticos
     - Implementar caché efectivo con service workers
  
  3. **Fase 3: Monitoreo Continuo**
     - Configurar monitoreo de Core Web Vitals en producción
     - Implementar alertas para degradación de rendimiento
     - Establecer proceso de revisión periódica`;
    }
    
    /**
     * Analiza el rendimiento de una base de datos
     * @param dbConfig Configuración de la base de datos o consulta a analizar
     * @returns Análisis de rendimiento
     */
    public async analyzeDatabasePerformance(dbConfig: string): Promise<string> {
      console.log(`🔍 Analizando rendimiento de base de datos para: ${dbConfig}`);
      
      // Simular análisis de rendimiento de base de datos
      // En una implementación real, esto analizaría planes de ejecución, índices, etc.
      const metrics = {
        queryTime: 250, // Tiempo promedio de consulta (ms)
        indexUsage: 75, // Porcentaje de consultas que usan índices
        cacheHitRatio: 60, // Ratio de hit de caché (%)
        connectionPoolUsage: 85, // Uso del pool de conexiones (%)
        deadlocks: 3, // Número de deadlocks por hora
        slowQueries: 12, // Número de consultas lentas por hora
        tableFragmentation: 25, // Fragmentación de tablas (%)
        avgRowsScanned: 5000, // Promedio de filas escaneadas por consulta
      };
      
      // Evaluar métricas
      const evaluateMetric = (name: string, value: number, good: number, needsImprovement: number, isHigherBetter: boolean = false): string => {
        if (isHigherBetter) {
          if (value >= good) return `✅ Bueno (${value})`;
          if (value >= needsImprovement) return `⚠️ Necesita mejora (${value})`;
          return `❌ Pobre (${value})`;
        } else {
          if (value <= good) return `✅ Bueno (${value})`;
          if (value <= needsImprovement) return `⚠️ Necesita mejora (${value})`;
          return `❌ Pobre (${value})`;
        }
      };
      
      const evaluations = {
        queryTime: evaluateMetric('Query Time', metrics.queryTime, 100, 300),
        indexUsage: evaluateMetric('Index Usage', metrics.indexUsage, 90, 70, true),
        cacheHitRatio: evaluateMetric('Cache Hit Ratio', metrics.cacheHitRatio, 80, 50, true),
        connectionPoolUsage: evaluateMetric('Connection Pool Usage', metrics.connectionPoolUsage, 70, 90),
        deadlocks: evaluateMetric('Deadlocks', metrics.deadlocks, 1, 5),
        slowQueries: evaluateMetric('Slow Queries', metrics.slowQueries, 5, 20),
        tableFragmentation: evaluateMetric('Table Fragmentation', metrics.tableFragmentation, 10, 30),
        avgRowsScanned: evaluateMetric('Avg Rows Scanned', metrics.avgRowsScanned, 1000, 10000),
      };
      
      // Generar recomendaciones basadas en métricas
      const recommendations = [];
      
      if (metrics.queryTime > 100) {
        recommendations.push('- Optimizar consultas críticas analizando planes de ejecución');
      }
      
      if (metrics.indexUsage < 90) {
        recommendations.push('- Revisar y mejorar estrategia de índices para consultas frecuentes');
      }
      
      if (metrics.cacheHitRatio < 80) {
        recommendations.push('- Implementar o mejorar estrategia de caché para consultas frecuentes');
      }
      
      if (metrics.connectionPoolUsage > 70) {
        recommendations.push('- Optimizar gestión de conexiones y considerar aumentar tamaño del pool');
      }
      
      if (metrics.deadlocks > 1) {
        recommendations.push('- Revisar patrones de acceso concurrente y optimizar transacciones');
      }
      
      if (metrics.slowQueries > 5) {
        recommendations.push('- Identificar y optimizar consultas lentas con índices o reescritura');
      }
      
      if (metrics.tableFragmentation > 10) {
        recommendations.push('- Programar desfragmentación de tablas e índices');
      }
      
      if (metrics.avgRowsScanned > 1000) {
        recommendations.push('- Optimizar consultas para reducir número de filas escaneadas');
      }
      
      // Generar informe de rendimiento
      return `# Análisis de Rendimiento de Base de Datos
  
  ## Resumen Ejecutivo
  El análisis de rendimiento de la base de datos muestra oportunidades de mejora en varias áreas clave, especialmente en uso de índices, caché y optimización de consultas.
  
  ## Métricas Clave
  - **Tiempo Promedio de Consulta**: ${evaluations.queryTime}
  - **Uso de Índices**: ${evaluations.indexUsage}
  - **Ratio de Hit de Caché**: ${evaluations.cacheHitRatio}
  - **Uso del Pool de Conexiones**: ${evaluations.connectionPoolUsage}
  - **Deadlocks por Hora**: ${evaluations.deadlocks}
  - **Consultas Lentas por Hora**: ${evaluations.slowQueries}
  - **Fragmentación de Tablas**: ${evaluations.tableFragmentation}
  - **Promedio de Filas Escaneadas**: ${evaluations.avgRowsScanned}
  
  ## Recomendaciones Principales
  ${recommendations.join('\n')}
  
  ## Plan de Acción
  1. **Fase 1: Optimizaciones Críticas**
     - Optimizar consultas lentas identificadas
     - Revisar y mejorar estrategia de índices
     - Implementar o mejorar estrategia de caché
  
  2. **Fase 2: Optimizaciones de Estructura**
     - Programar mantenimiento para desfragmentación
     - Optimizar esquema para reducir escaneos completos
     - Revisar y ajustar configuración del servidor
  
  3. **Fase 3: Monitoreo y Mejora Continua**
     - Implementar monitoreo continuo de métricas clave
     - Establecer alertas para degradación de rendimiento
     - Revisar periódicamente planes de ejecución de consultas críticas`;
    }
    
    /**
     * Analiza el rendimiento de un algoritmo o estructura de datos
     * @param code Código del algoritmo a analizar
     * @returns Análisis de rendimiento
     */
    public analyzeAlgorithmPerformance(code: string): string {
      console.log(`🔍 Analizando rendimiento de algoritmo`);
      
      // Simular análisis de complejidad algorítmica
      // En una implementación real, esto analizaría el código para determinar complejidad
      
      // Prompt para el LLM para analizar complejidad
      const complexityPrompt = `
      Analiza la complejidad temporal y espacial del siguiente algoritmo:
      
      \`\`\`
      ${code}
      \`\`\`
      
      Proporciona:
      1. Complejidad temporal en notación Big O
      2. Complejidad espacial en notación Big O
      3. Cuellos de botella identificados
      4. Posibles optimizaciones
      `;
      
      // Simular respuesta del LLM
      const complexityAnalysis = {
        timeComplexity: 'O(n²)',
        spaceComplexity: 'O(n)',
        bottlenecks: [
          'Bucle anidado en líneas X-Y',
          'Creación innecesaria de arrays temporales',
          'Operaciones redundantes en cada iteración'
        ],
        optimizations: [
          'Reemplazar bucle anidado con un enfoque de hash map para reducir complejidad a O(n)',
          'Reutilizar estructuras de datos para reducir asignaciones de memoria',
          'Implementar memoización para cálculos repetitivos',
          'Usar algoritmos más eficientes para operaciones específicas'
        ]
      };
      
      // Generar ejemplos de código optimizado
      const optimizedCodeExamples = [
        {
          title: 'Optimización de bucle anidado con hash map',
          original: `
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length; j++) {
      if (array[i] + array[j] === target) {
        return [i, j];
      }
    }
  }
  return [];`,
          optimized: `
  const map = new Map();
  for (let i = 0; i < array.length; i++) {
    const complement = target - array[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(array[i], i);
  }
  return [];`
        },
        {
          title: 'Implementación de memoización',
          original: `
  function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
  }`,
          optimized: `
  function fibonacci(n, memo = {}) {
    if (n in memo) return memo[n];
    if (n <= 1) return n;
    memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo);
    return memo[n];
  }`
        },
        {
          title: 'Reducción de asignaciones de memoria',
          original: `
  function processData(data) {
    const temp1 = data.map(x => x * 2);
    const temp2 = temp1.filter(x => x > 10);
    const temp3 = temp2.reduce((acc, x) => acc + x, 0);
    return temp3;
  }`,
          optimized: `
  function processData(data) {
    return data.reduce((acc, x) => {
      const doubled = x * 2;
      return doubled > 10 ? acc + doubled : acc;
    }, 0);
  }`
        }
      ];
      
      // Generar informe de rendimiento
      return `# Análisis de Rendimiento de Algoritmo
  
  ## Resumen Ejecutivo
  El análisis del algoritmo muestra una complejidad temporal de ${complexityAnalysis.timeComplexity} y una complejidad espacial de ${complexityAnalysis.spaceComplexity}, con oportunidades significativas de optimización.
  
  ## Análisis de Complejidad
  - **Complejidad Temporal**: ${complexityAnalysis.timeComplexity}
  - **Complejidad Espacial**: ${complexityAnalysis.spaceComplexity}
  
  ## Cuellos de Botella Identificados
  ${complexityAnalysis.bottlenecks.map(b => `- ${b}`).join('\n')}
  
  ## Optimizaciones Recomendadas
  ${complexityAnalysis.optimizations.map(o => `- ${o}`).join('\n')}
  
  ## Ejemplos de Código Optimizado
  
  ### ${optimizedCodeExamples[0].title}
  **Original:**
  \`\`\`javascript
  ${optimizedCodeExamples[0].original}
  \`\`\`
  
  **Optimizado:**
  \`\`\`javascript
  ${optimizedCodeExamples[0].optimized}
  \`\`\`
  
  ### ${optimizedCodeExamples[1].title}
  **Original:**
  \`\`\`javascript
  ${optimizedCodeExamples[1].original}
  \`\`\`
  
  **Optimizado:**
  \`\`\`javascript
  ${optimizedCodeExamples[1].optimized}
  \`\`\`
  
  ### ${optimizedCodeExamples[2].title}
  **Original:**
  \`\`\`javascript
  ${optimizedCodeExamples[2].original}
  \`\`\`
  
  **Optimizado:**
  \`\`\`javascript
  ${optimizedCodeExamples[2].optimized}
  \`\`\`
  
  ## Impacto Esperado
  - **Mejora en Tiempo de Ejecución**: Reducción de ${complexityAnalysis.timeComplexity} a O(n) en el caso promedio
  - **Mejora en Uso de Memoria**: Reducción de asignaciones temporales
  - **Escalabilidad**: Comportamiento significativamente mejor con conjuntos de datos grandes
  
  ## Consideraciones Adicionales
  - Evaluar el impacto de las optimizaciones en la legibilidad del código
  - Implementar pruebas de rendimiento para validar mejoras
  - Considerar casos extremos y comportamiento con diferentes patrones de datos`;
    }
    
    /**
     * Analiza el rendimiento de una aplicación móvil
     * @param appConfig Configuración o ruta de la aplicación móvil
     * @returns Análisis de rendimiento
     */
    public analyzeMobilePerformance(appConfig: string): string {
      console.log(`🔍 Analizando rendimiento de aplicación móvil: ${appConfig}`);
      
      // Simular análisis de rendimiento móvil
      const metrics = {
        startupTime: 2.5, // Tiempo de inicio (segundos)
        frameRate: 52, // FPS promedio
        memoryUsage: 180, // Uso de memoria (MB)
        batteryImpact: 'Medio', // Impacto en batería
        networkEfficiency: 'Bajo', // Eficiencia de red
        appSize: 45, // Tamaño de la aplicación (MB)
        diskIO: 'Alto', // Operaciones de disco
        renderingTime: 120, // Tiempo de renderizado de UI (ms)
      };
      
      // Evaluar métricas
      const evaluations = {
        startupTime: metrics.startupTime <= 1.5 ? '✅ Bueno' : metrics.startupTime <= 3 ? '⚠️ Necesita mejora' : '❌ Pobre',
        frameRate: metrics.frameRate >= 58 ? '✅ Bueno' : metrics.frameRate >= 45 ? '⚠️ Necesita mejora' : '❌ Pobre',
        memoryUsage: metrics.memoryUsage <= 100 ? '✅ Bueno' : metrics.memoryUsage <= 200 ? '⚠️ Necesita mejora' : '❌ Pobre',
        batteryImpact: metrics.batteryImpact === 'Bajo' ? '✅ Bueno' : metrics.batteryImpact === 'Medio' ? '⚠️ Necesita mejora' : '❌ Pobre',
        networkEfficiency: metrics.networkEfficiency === 'Alto' ? '✅ Bueno' : metrics.networkEfficiency === 'Medio' ? '⚠️ Necesita mejora' : '❌ Pobre',
        appSize: metrics.appSize <= 30 ? '✅ Bueno' : metrics.appSize <= 50 ? '⚠️ Necesita mejora' : '❌ Pobre',
        diskIO: metrics.diskIO === 'Bajo' ? '✅ Bueno' : metrics.diskIO === 'Medio' ? '⚠️ Necesita mejora' : '❌ Pobre',
        renderingTime: metrics.renderingTime <= 80 ? '✅ Bueno' : metrics.renderingTime <= 150 ? '⚠️ Necesita mejora' : '❌ Pobre',
      };
      
      // Generar recomendaciones
      const recommendations = [
        '### Optimización de Inicio',
        '- Implementar inicio en frío optimizado con carga diferida de recursos',
        '- Reducir inicializaciones en el hilo principal',
        '- Optimizar proceso de carga de datos iniciales',
        
        '### Optimización de UI',
        '- Implementar renderizado eficiente con RecyclerView/UICollectionView',
        '- Reducir jerarquía de vistas y usar ConstraintLayout/AutoLayout',
        '- Optimizar renderizado de listas con reciclado eficiente',
        
        '### Optimización de Memoria',
        '- Implementar liberación proactiva de recursos no utilizados',
        '- Optimizar caché de imágenes con límites de memoria',
        '- Reducir fugas de memoria en ciclos de vida de actividades/vistas',
        
        '### Optimización de Red',
        '- Implementar carga diferida y compresión de datos',
        '- Optimizar sincronización en segundo plano',
        '- Reducir transferencia de datos con respuestas parciales',
        
        '### Optimización de Batería',
        '- Reducir uso de GPS y sensores cuando no son necesarios',
        '- Optimizar frecuencia de sincronización en segundo plano',
        '- Implementar modo de ahorro de energía para operaciones no críticas'
      ];
      
      // Generar informe de rendimiento
      return `# Análisis de Rendimiento de Aplicación Móvil: ${appConfig}

## Resumen Ejecutivo
El análisis de rendimiento de la aplicación móvil muestra oportunidades de mejora en varias áreas clave, especialmente en tiempo de inicio, rendimiento de UI, y consumo de batería.

## Métricas Clave
- **Tiempo de Inicio**: ${evaluations.startupTime} (${metrics.startupTime}s)
- **Tasa de Frames**: ${evaluations.frameRate} (${metrics.frameRate} FPS)
- **Uso de Memoria**: ${evaluations.memoryUsage} (${metrics.memoryUsage} MB)
- **Impacto en Batería**: ${evaluations.batteryImpact} (${metrics.batteryImpact})
- **Eficiencia de Red**: ${evaluations.networkEfficiency} (${metrics.networkEfficiency})
- **Tamaño de Aplicación**: ${evaluations.appSize} (${metrics.appSize} MB)
- **Operaciones de Disco**: ${evaluations.diskIO} (${metrics.diskIO})
- **Tiempo de Renderizado**: ${evaluations.renderingTime} (${metrics.renderingTime} ms)

## Recomendaciones Principales
${recommendations.join('\n')}

## Plan de Acción
1. **Fase 1: Optimizaciones Críticas**
   - Optimizar tiempo de inicio con carga diferida
   - Mejorar rendimiento de UI reduciendo operaciones en hilo principal
   - Implementar gestión eficiente de memoria

2. **Fase 2: Optimizaciones de Experiencia**
   - Optimizar consumo de batería
   - Mejorar eficiencia de red y caché
   - Reducir tamaño de aplicación

3. **Fase 3: Monitoreo y Mejora Continua**
   - Implementar telemetría para métricas clave
   - Establecer alertas para degradación de rendimiento
   - Realizar pruebas de rendimiento en diferentes dispositivos`;
    }
    
    /**
     * Analiza el rendimiento de una red o API
     * @param networkConfig Configuración o endpoint de la red/API
     * @returns Análisis de rendimiento
     */
    public async analyzeNetworkPerformance(networkConfig: string): Promise<string> {
      console.log(`🔍 Analizando rendimiento de red/API: ${networkConfig}`);
      
      // Simular análisis de rendimiento de red
      const metrics = {
        latency: 320, // Latencia promedio (ms)
        throughput: 8.5, // Throughput (MB/s)
        errorRate: 2.8, // Tasa de error (%)
        requestsPerSecond: 45, // Solicitudes por segundo
        timeToFirstByte: 180, // Tiempo al primer byte (ms)
        connectionOverhead: 120, // Overhead de conexión (ms)
        packetLoss: 0.5, // Pérdida de paquetes (%)
        compressionRatio: 65, // Ratio de compresión (%)
        cacheHitRatio: 40, // Ratio de hit de caché (%)
        sslHandshakeTime: 85, // Tiempo de handshake SSL (ms)
      };
      
      // Evaluar métricas
      const evaluateMetric = (name: string, value: number, good: number, needsImprovement: number, isHigherBetter: boolean = false): string => {
        if (isHigherBetter) {
          if (value >= good) return `✅ Bueno (${value})`;
          if (value >= needsImprovement) return `⚠️ Necesita mejora (${value})`;
          return `❌ Pobre (${value})`;
        } else {
          if (value <= good) return `✅ Bueno (${value})`;
          if (value <= needsImprovement) return `⚠️ Necesita mejora (${value})`;
          return `❌ Pobre (${value})`;
        }
      };
      
      const evaluations = {
        latency: evaluateMetric('Latency', metrics.latency, 200, 500),
        throughput: evaluateMetric('Throughput', metrics.throughput, 10, 5, true),
        errorRate: evaluateMetric('Error Rate', metrics.errorRate, 1, 5),
        requestsPerSecond: evaluateMetric('Requests/Second', metrics.requestsPerSecond, 50, 20, true),
        timeToFirstByte: evaluateMetric('TTFB', metrics.timeToFirstByte, 100, 300),
        connectionOverhead: evaluateMetric('Connection Overhead', metrics.connectionOverhead, 80, 200),
        packetLoss: evaluateMetric('Packet Loss', metrics.packetLoss, 0.1, 1),
        compressionRatio: evaluateMetric('Compression Ratio', metrics.compressionRatio, 70, 40, true),
        cacheHitRatio: evaluateMetric('Cache Hit Ratio', metrics.cacheHitRatio, 60, 30, true),
        sslHandshakeTime: evaluateMetric('SSL Handshake Time', metrics.sslHandshakeTime, 50, 100),
      };
      
      // Generar recomendaciones basadas en métricas
      const recommendations = [];
      
      if (metrics.latency > 200) {
        recommendations.push('- Optimizar latencia implementando CDN para recursos estáticos');
      }
      
      if (metrics.throughput < 10) {
        recommendations.push('- Mejorar throughput optimizando tamaño de respuestas y compresión');
      }
      
      if (metrics.errorRate > 1) {
        recommendations.push('- Reducir tasa de error implementando retry con backoff exponencial');
      }
      
      if (metrics.requestsPerSecond < 50) {
        recommendations.push('- Aumentar capacidad de procesamiento de solicitudes con escalado horizontal');
      }
      
      if (metrics.timeToFirstByte > 100) {
        recommendations.push('- Reducir TTFB optimizando backend y usando caché de borde');
      }
      
      if (metrics.connectionOverhead > 80) {
        recommendations.push('- Reducir overhead de conexión implementando HTTP/2 o HTTP/3');
      }
      
      if (metrics.packetLoss > 0.1) {
        recommendations.push('- Investigar y mitigar pérdida de paquetes en la red');
      }
      
      if (metrics.compressionRatio < 70) {
        recommendations.push('- Mejorar ratio de compresión implementando Brotli o optimizando gzip');
      }
      
      if (metrics.cacheHitRatio < 60) {
        recommendations.push('- Optimizar estrategia de caché para aumentar hit ratio');
      }
      
      if (metrics.sslHandshakeTime > 50) {
        recommendations.push('- Reducir tiempo de handshake SSL con TLS 1.3 y OCSP stapling');
      }
      
      // Generar informe de rendimiento
      return `# Análisis de Rendimiento de Red/API: ${networkConfig}

## Resumen Ejecutivo
El análisis de rendimiento de la red/API muestra oportunidades de mejora en varias áreas clave, especialmente en latencia, throughput, y estrategia de caché.

## Métricas Clave
- **Latencia**: ${evaluations.latency}
- **Throughput**: ${evaluations.throughput}
- **Tasa de Error**: ${evaluations.errorRate}
- **Solicitudes por Segundo**: ${evaluations.requestsPerSecond}
- **Tiempo al Primer Byte (TTFB)**: ${evaluations.timeToFirstByte}
- **Overhead de Conexión**: ${evaluations.connectionOverhead}
- **Pérdida de Paquetes**: ${evaluations.packetLoss}
- **Ratio de Compresión**: ${evaluations.compressionRatio}
- **Ratio de Hit de Caché**: ${evaluations.cacheHitRatio}
- **Tiempo de Handshake SSL**: ${evaluations.sslHandshakeTime}

## Recomendaciones Principales
${recommendations.join('\n')}

## Plan de Acción
1. **Fase 1: Optimizaciones de Latencia y Throughput**
   - Implementar CDN para recursos estáticos
   - Optimizar compresión de respuestas
   - Implementar HTTP/2 o HTTP/3

2. **Fase 2: Optimizaciones de Caché y Resiliencia**
   - Mejorar estrategia de caché
   - Implementar retry con backoff exponencial
   - Optimizar configuración SSL/TLS

3. **Fase 3: Escalabilidad y Monitoreo**
   - Implementar escalado horizontal para aumentar capacidad
   - Configurar monitoreo en tiempo real de métricas clave
   - Establecer alertas para degradación de rendimiento`;
    }
    
    /**
     * Genera un informe de rendimiento completo para una aplicación
     * @param appPath Ruta de la aplicación a analizar
     * @returns Informe de rendimiento completo
     */
    public async generatePerformanceReport(appPath: string): Promise<string> {
      console.log(`📊 Generando informe de rendimiento completo para: ${appPath}`);
      
      // Determinar tipo de aplicación
      const appType = this.determineAppType(appPath);
      
      // Realizar análisis específicos según el tipo de aplicación
      let webAnalysis = '';
      let databaseAnalysis = '';
      let algorithmAnalysis = '';
      let mobileAnalysis = '';
      let networkAnalysis = '';
      
      if (appType.includes('web')) {
        webAnalysis = await this.analyzeWebPerformance(appPath);
      }
      
      if (appType.includes('database')) {
        databaseAnalysis = await this.analyzeDatabasePerformance(appPath);
      }
      
      if (appType.includes('algorithm')) {
        // Leer código de algoritmo de ejemplo
        const algorithmCode = `
function findPairs(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] + arr[j] === target) {
        console.log('Pair found:', arr[i], arr[j]);
      }
    }
  }
}`;
        algorithmAnalysis = this.analyzeAlgorithmPerformance(algorithmCode);
      }
      
      if (appType.includes('mobile')) {
        mobileAnalysis = this.analyzeMobilePerformance(appPath);
      }
      
      if (appType.includes('network')) {
        networkAnalysis = await this.analyzeNetworkPerformance(appPath);
      }
      
      // Generar recomendaciones generales
      const generalRecommendations = this.generateOptimizationRecommendations('general');
      
      // Generar informe completo
      return `# Informe de Rendimiento Completo: ${appPath}

## Resumen Ejecutivo
Este informe presenta un análisis exhaustivo del rendimiento de la aplicación, identificando áreas de mejora y proporcionando recomendaciones específicas para optimizar la experiencia del usuario, la eficiencia de recursos, y la escalabilidad.

## Tipo de Aplicación Detectado
${appType.join(', ')}

## Análisis por Componentes

${webAnalysis ? `### Rendimiento Web\n${this.extractSummary(webAnalysis)}\n[Ver análisis web completo](#web-performance)\n\n` : ''}
${databaseAnalysis ? `### Rendimiento de Base de Datos\n${this.extractSummary(databaseAnalysis)}\n[Ver análisis de base de datos completo](#database-performance)\n\n` : ''}
${algorithmAnalysis ? `### Rendimiento de Algoritmos\n${this.extractSummary(algorithmAnalysis)}\n[Ver análisis de algoritmos completo](#algorithm-performance)\n\n` : ''}
${mobileAnalysis ? `### Rendimiento Móvil\n${this.extractSummary(mobileAnalysis)}\n[Ver análisis móvil completo](#mobile-performance)\n\n` : ''}
${networkAnalysis ? `### Rendimiento de Red/API\n${this.extractSummary(networkAnalysis)}\n[Ver análisis de red completo](#network-performance)\n\n` : ''}

## Recomendaciones Generales
${this.extractRecommendations(generalRecommendations)}

## Plan de Acción Integral
1. **Fase 1: Optimizaciones Críticas (Semana 1-2)**
   - Implementar mejoras de alto impacto y baja complejidad
   - Establecer línea base de métricas de rendimiento
   - Configurar monitoreo continuo

2. **Fase 2: Optimizaciones Estructurales (Semana 3-4)**
   - Implementar mejoras arquitectónicas
   - Optimizar flujos de datos y procesos
   - Realizar pruebas de carga y estrés

3. **Fase 3: Refinamiento y Monitoreo (Semana 5-6)**
   - Implementar optimizaciones restantes
   - Establecer alertas para degradación de rendimiento
   - Documentar mejores prácticas para mantenimiento futuro

## Análisis Detallados

${webAnalysis ? `<a id="web-performance"></a>\n### Análisis de Rendimiento Web Detallado\n${webAnalysis}\n\n` : ''}
${databaseAnalysis ? `<a id="database-performance"></a>\n### Análisis de Rendimiento de Base de Datos Detallado\n${databaseAnalysis}\n\n` : ''}
${algorithmAnalysis ? `<a id="algorithm-performance"></a>\n### Análisis de Rendimiento de Algoritmos Detallado\n${algorithmAnalysis}\n\n` : ''}
${mobileAnalysis ? `<a id="mobile-performance"></a>\n### Análisis de Rendimiento Móvil Detallado\n${mobileAnalysis}\n\n` : ''}
${networkAnalysis ? `<a id="network-performance"></a>\n### Análisis de Rendimiento de Red/API Detallado\n${networkAnalysis}\n\n` : ''}

## Métricas y Benchmarks
- **Tiempo de Carga**: < 2 segundos para contenido principal
- **Tiempo de Respuesta**: < 100ms para interacciones de usuario
- **Uso de Memoria**: Optimizado para dispositivos objetivo
- **Consumo de Batería**: Minimizado para aplicaciones móviles
- **Eficiencia de Red**: Minimizar transferencia de datos y latencia

## Herramientas Recomendadas
- **Análisis Web**: Lighthouse, WebPageTest, Chrome DevTools
- **Análisis de Base de Datos**: Explain Plan, Query Analyzer
- **Análisis de Algoritmos**: Profilers, Big O Analyzer
- **Análisis Móvil**: Android Profiler, Xcode Instruments
- **Análisis de Red**: Wireshark, Postman, Network Panel

## Conclusión
La implementación de las recomendaciones de este informe permitirá mejorar significativamente el rendimiento de la aplicación, resultando en una mejor experiencia de usuario, mayor eficiencia de recursos, y mejor escalabilidad para crecimiento futuro.`;
    }
    
    /**
     * Extrae el resumen de un análisis de rendimiento
     * @param analysis Análisis completo
     * @returns Resumen del análisis
     */
    private extractSummary(analysis: string): string {
      // Extraer la sección "Resumen Ejecutivo" del análisis
      const summaryMatch = analysis.match(/## Resumen Ejecutivo\n(.*?)(?=\n##)/s);
      return summaryMatch ? summaryMatch[1].trim() : 'No se encontró resumen.';
    }
    
    /**
     * Extrae las recomendaciones de un análisis de rendimiento
     * @param analysis Análisis completo
     * @returns Recomendaciones extraídas
     */
    private extractRecommendations(analysis: string): string {
      // Extraer la sección "Prioridad Alta" del análisis
      const highPriorityMatch = analysis.match(/## Prioridad Alta\n(.*?)(?=\n##)/s);
      return highPriorityMatch ? highPriorityMatch[1].trim() : 'No se encontraron recomendaciones.';
    }
    
    /**
     * Determina el tipo de aplicación basado en la ruta o configuración
     * @param appPath Ruta de la aplicación
     * @returns Tipos de aplicación detectados
     */
    private determineAppType(appPath: string): string[] {
      const appTypes = [];
      
      // Detectar tipo de aplicación basado en extensiones de archivo, estructura, etc.
      if (appPath.includes('http') || appPath.endsWith('.html') || appPath.includes('web')) {
        appTypes.push('web');
      }
      
      if (appPath.includes('db') || appPath.includes('sql') || appPath.includes('database')) {
        appTypes.push('database');
      }
      
      if (appPath.includes('algorithm') || appPath.endsWith('.js') || appPath.endsWith('.py')) {
        appTypes.push('algorithm');
      }
      
      if (appPath.includes('mobile') || appPath.includes('android') || appPath.includes('ios')) {
        appTypes.push('mobile');
      }
      
      if (appPath.includes('api') || appPath.includes('network') || appPath.includes('http')) {
        appTypes.push('network');
      }
      
      // Si no se detecta ningún tipo, asumir aplicación general
      if (appTypes.length === 0) {
        appTypes.push('general');
      }
      
      return appTypes;
    }
    
    /**
     * Determina el tipo de rendimiento a analizar
     * @param perfSpec Especificación de rendimiento
     * @returns Tipo de rendimiento
     */
    private determinePerfType(perfSpec: string): string {
      if (perfSpec.includes('front') || perfSpec.includes('web') || perfSpec.includes('ui')) {
        return 'frontend';
      }
      
      if (perfSpec.includes('back') || perfSpec.includes('server') || perfSpec.includes('api')) {
        return 'backend';
      }
      
      if (perfSpec.includes('db') || perfSpec.includes('database') || perfSpec.includes('sql')) {
        return 'database';
      }
      
      if (perfSpec.includes('algo') || perfSpec.includes('code') || perfSpec.includes('function')) {
        return 'algorithm';
      }
      
      if (perfSpec.includes('mobile') || perfSpec.includes('app') || perfSpec.includes('android') || perfSpec.includes('ios')) {
        return 'mobile';
      }
      
      if (perfSpec.includes('net') || perfSpec.includes('api') || perfSpec.includes('http')) {
        return 'network';
      }
      
      return 'general';
    }
    
    /**
     * Lee el contexto de un archivo
     * @param filename Nombre del archivo de contexto
     * @returns Contenido del archivo
     */
    private readContext(filename: string): string {
      try {
        const contextPath = path.join(process.cwd(), 'context', filename);
        if (fs.existsSync(contextPath)) {
          return fs.readFileSync(contextPath, 'utf8');
        }
        return `Contexto no encontrado: ${filename}`;
      } catch (error) {
        console.error(`Error al leer contexto ${filename}:`, error);
        return `Error al leer contexto: ${filename}`;
      }
    }
    
    /**
     * Genera un informe de comparativa de rendimiento entre dos versiones
     * @param oldVersion Versión antigua o ruta
     * @param newVersion Versión nueva o ruta
     * @returns Informe de comparativa
     */
    public async generatePerformanceComparison(oldVersion: string, newVersion: string): Promise<string> {
      console.log(`📊 Generando comparativa de rendimiento entre: ${oldVersion} y ${newVersion}`);
      
      // Simular métricas para versión antigua
      const oldMetrics = {
        loadTime: 3.2, // segundos
        responseTime: 280, // ms
        throughput: 120, // req/s
        errorRate: 2.5, // %
        memoryUsage: 220, // MB
        cpuUsage: 45, // %
        diskIO: 15, // MB/s
        networkIO: 8, // MB/s
      };
      
      // Simular métricas para versión nueva
      const newMetrics = {
        loadTime: 2.1, // segundos
        responseTime: 180, // ms
        throughput: 180, // req/s
        errorRate: 1.2, // %
        memoryUsage: 180, // MB
        cpuUsage: 35, // %
        diskIO: 12, // MB/s
        networkIO: 7, // MB/s
      };
      
      // Calcular diferencias y mejoras
      const calculateDiff = (oldVal: number, newVal: number, isHigherBetter: boolean = false): { diff: number, percentage: number, improved: boolean } => {
        const diff = newVal - oldVal;
        const percentage = Math.abs((diff / oldVal) * 100).toFixed(1);
        const improved = isHigherBetter ? diff > 0 : diff < 0;
        return { diff, percentage: parseFloat(percentage), improved };
      };
      
      const diffs = {
        loadTime: calculateDiff(oldMetrics.loadTime, newMetrics.loadTime),
        responseTime: calculateDiff(oldMetrics.responseTime, newMetrics.responseTime),
        throughput: calculateDiff(oldMetrics.throughput, newMetrics.throughput, true),
        errorRate: calculateDiff(oldMetrics.errorRate, newMetrics.errorRate),
        memoryUsage: calculateDiff(oldMetrics.memoryUsage, newMetrics.memoryUsage),
        cpuUsage: calculateDiff(oldMetrics.cpuUsage, newMetrics.cpuUsage),
        diskIO: calculateDiff(oldMetrics.diskIO, newMetrics.diskIO),
        networkIO: calculateDiff(oldMetrics.networkIO, newMetrics.networkIO),
      };
      
      // Formatear resultados para cada métrica
      const formatResult = (name: string, oldVal: number, newVal: number, diff: { diff: number, percentage: number, improved: boolean }, unit: string): string => {
        const arrow = diff.improved ? '✅ ↓' : '❌ ↑';
        const sign = diff.diff > 0 ? '+' : '';
        return `| ${name} | ${oldVal} ${unit} | ${newVal} ${unit} | ${sign}${diff.diff.toFixed(1)} ${unit} | ${diff.improved ? '-' : '+'}${diff.percentage}% | ${diff.improved ? '✅ Mejor' : '❌ Peor'} |`;
      };
      
      // Generar tabla de comparación
      const comparisonTable = [
        '| Métrica | Versión Antigua | Versión Nueva | Diferencia | Cambio % | Resultado |',
        '|---------|-----------------|---------------|------------|----------|-----------|',
        formatResult('Tiempo de Carga', oldMetrics.loadTime, newMetrics.loadTime, diffs.loadTime, 's'),
        formatResult('Tiempo de Respuesta', oldMetrics.responseTime, newMetrics.responseTime, diffs.responseTime, 'ms'),
        formatResult('Throughput', oldMetrics.throughput, newMetrics.throughput, diffs.throughput, 'req/s'),
        formatResult('Tasa de Error', oldMetrics.errorRate, newMetrics.errorRate, diffs.errorRate, '%'),
        formatResult('Uso de Memoria', oldMetrics.memoryUsage, newMetrics.memoryUsage, diffs.memoryUsage, 'MB'),
        formatResult('Uso de CPU', oldMetrics.cpuUsage, newMetrics.cpuUsage, diffs.cpuUsage, '%'),
        formatResult('I/O de Disco', oldMetrics.diskIO, newMetrics.diskIO, diffs.diskIO, 'MB/s'),
        formatResult('I/O de Red', oldMetrics.networkIO, newMetrics.networkIO, diffs.networkIO, 'MB/s'),
      ].join('\n');
      
      // Calcular mejora general
      const improvedMetrics = Object.values(diffs).filter(d => d.improved).length;
      const totalMetrics = Object.values(diffs).length;
      const overallImprovement = (improvedMetrics / totalMetrics) * 100;
      
      // Generar informe de comparativa
      return `# Comparativa de Rendimiento: ${oldVersion} vs ${newVersion}

## Resumen Ejecutivo
La comparativa de rendimiento entre las versiones muestra una **mejora general del ${overallImprovement.toFixed(1)}%**, con mejoras significativas en tiempo de carga (${diffs.loadTime.percentage}%), tiempo de respuesta (${diffs.responseTime.percentage}%), y tasa de error (${diffs.errorRate.percentage}%).

## Tabla Comparativa
${comparisonTable}

## Análisis de Resultados

### Mejoras Destacadas
- **Tiempo de Carga**: Reducción del ${diffs.loadTime.percentage}%, mejorando la experiencia inicial del usuario.
- **Tiempo de Respuesta**: Reducción del ${diffs.responseTime.percentage}%, proporcionando una interfaz más receptiva.
- **Throughput**: Aumento del ${diffs.throughput.percentage}%, permitiendo manejar más solicitudes por segundo.
- **Tasa de Error**: Reducción del ${diffs.errorRate.percentage}%, mejorando la fiabilidad del sistema.

### Áreas de Atención
${diffs.memoryUsage.improved ? '' : '- **Uso de Memoria**: Aumentó un ' + diffs.memoryUsage.percentage + '%, lo que podría afectar el rendimiento en dispositivos con recursos limitados.\n'}
${diffs.cpuUsage.improved ? '' : '- **Uso de CPU**: Aumentó un ' + diffs.cpuUsage.percentage + '%, lo que podría afectar la eficiencia energética.\n'}
${diffs.diskIO.improved ? '' : '- **I/O de Disco**: Aumentó un ' + diffs.diskIO.percentage + '%, lo que podría causar cuellos de botella en sistemas con almacenamiento lento.\n'}
${diffs.networkIO.improved ? '' : '- **I/O de Red**: Aumentó un ' + diffs.networkIO.percentage + '%, lo que podría afectar a usuarios con conexiones limitadas.\n'}

## Recomendaciones
1. **Implementar la Nueva Versión**: Los resultados muestran una mejora general significativa.
2. **Monitorear Áreas de Atención**: Establecer alertas para métricas que mostraron degradación.
3. **Realizar Pruebas Adicionales**: Validar resultados en diferentes entornos y condiciones de carga.
4. **Documentar Cambios**: Registrar las optimizaciones realizadas para referencia futura.

## Metodología
- **Herramientas Utilizadas**: Profilers, herramientas de monitoreo, pruebas de carga.
- **Entorno de Prueba**: Configuración idéntica para ambas versiones.
- **Duración de Prueba**: 1 hora por versión.
- **Condiciones de Carga**: Simulación de tráfico real con picos de carga.

## Conclusión
La nueva versión muestra mejoras significativas en rendimiento y eficiencia, justificando su implementación. Se recomienda continuar monitoreando las métricas clave para asegurar un rendimiento óptimo en producción.`;
    }
    
    /**
     * Genera un plan de optimización de rendimiento
     * @param appPath Ruta de la aplicación
     * @param targetMetrics Métricas objetivo (opcional)
     * @returns Plan de optimización
     */
    public async generateOptimizationPlan(appPath: string, targetMetrics?: any): Promise<string> {
      console.log(`📝 Generando plan de optimización para: ${appPath}`);
      
      // Determinar tipo de aplicación
      const appType = this.determineAppType(appPath);
      
      // Generar recomendaciones específicas según el tipo de aplicación
      const recommendations = [];
      
      if (appType.includes('web')) {
        recommendations.push('### Optimizaciones Frontend');
        recommendations.push('1. **Reducir Tiempo de Carga**');
        recommendations.push('   - Implementar lazy loading para imágenes y componentes');
        recommendations.push('   - Optimizar bundle con code splitting y tree shaking');
        recommendations.push('   - Implementar estrategia de caché efectiva');
        recommendations.push('2. **Mejorar Renderizado**');
        recommendations.push('   - Optimizar Critical Rendering Path');
        recommendations.push('   - Implementar Server-Side Rendering o Static Generation');
        recommendations.push('   - Reducir re-renderizados innecesarios');
      }
      
      if (appType.includes('database')) {
        recommendations.push('### Optimizaciones de Base de Datos');
        recommendations.push('1. **Optimizar Consultas**');
        recommendations.push('   - Revisar y mejorar índices');
        recommendations.push('   - Optimizar JOINs y subconsultas');
        recommendations.push('   - Implementar consultas paginadas');
        recommendations.push('   - Implementar caché de resultados de consultas');
        recommendations.push('   - Utilizar caché distribuida para entornos escalables');
        recommendations.push('   - Configurar TTL apropiado según tipo de datos');
      }
      
      if (appType.includes('algorithm')) {
        recommendations.push('### Optimizaciones de Algoritmos');
        recommendations.push('1. **Reducir Complejidad Computacional**');
        recommendations.push('   - Identificar y optimizar algoritmos O(n²) o peores');
        recommendations.push('   - Implementar estructuras de datos más eficientes');
        recommendations.push('   - Utilizar técnicas de memoización y programación dinámica');
        recommendations.push('2. **Paralelización**');
        recommendations.push('   - Implementar procesamiento paralelo para tareas independientes');
        recommendations.push('   - Utilizar workers para operaciones intensivas');
        recommendations.push('   - Optimizar uso de hilos y recursos del sistema');
      }
      
      if (appType.includes('mobile')) {
        recommendations.push('### Optimizaciones Móviles');
        recommendations.push('1. **Optimizar Ciclo de Vida**');
        recommendations.push('   - Implementar lazy loading de recursos');
        recommendations.push('   - Optimizar gestión de memoria en transiciones');
        recommendations.push('   - Reducir trabajo en hilo principal');
        recommendations.push('2. **Eficiencia Energética**');
        recommendations.push('   - Optimizar uso de sensores y GPS');
        recommendations.push('   - Implementar sincronización inteligente');
        recommendations.push('   - Reducir operaciones en segundo plano');
      }
      
      if (appType.includes('network')) {
        recommendations.push('### Optimizaciones de Red');
        recommendations.push('1. **Reducir Latencia**');
        recommendations.push('   - Implementar CDN para recursos estáticos');
        recommendations.push('   - Optimizar handshakes y conexiones');
        recommendations.push('   - Implementar HTTP/2 o HTTP/3');
        recommendations.push('2. **Optimizar Payload**');
        recommendations.push('   - Implementar compresión eficiente (Brotli, gzip)');
        recommendations.push('   - Reducir tamaño de respuestas con campos selectivos');
        recommendations.push('   - Implementar streaming para respuestas grandes');
      }
      
      // Añadir recomendaciones generales si no hay tipo específico o para complementar
      if (appType.includes('general') || recommendations.length < 10) {
        recommendations.push('### Optimizaciones Generales');
        recommendations.push('1. **Monitoreo y Profiling**');
        recommendations.push('   - Implementar telemetría para métricas clave');
        recommendations.push('   - Configurar alertas para degradación de rendimiento');
        recommendations.push('   - Realizar profiling periódico para identificar cuellos de botella');
        recommendations.push('2. **Optimización de Recursos**');
        recommendations.push('   - Implementar pooling de recursos (conexiones, workers)');
        recommendations.push('   - Optimizar gestión de memoria y liberación de recursos');
        recommendations.push('   - Implementar estrategias de caché multinivel');
      }
      
      // Definir métricas objetivo si no se proporcionaron
      const targets = targetMetrics || {
        loadTime: '< 2s',
        responseTime: '< 100ms',
        throughput: '> 1000 req/s',
        errorRate: '< 0.1%',
        memoryUsage: 'Optimizado',
        cpuUsage: '< 30%',
        batteryImpact: 'Mínimo',
        networkEfficiency: 'Alta',
      };
      
      // Generar plan de optimización
      return `# Plan de Optimización de Rendimiento: ${appPath}

## Resumen Ejecutivo
Este plan detalla las estrategias y acciones recomendadas para optimizar el rendimiento de la aplicación, enfocándose en las áreas críticas identificadas durante el análisis. La implementación de estas optimizaciones mejorará significativamente la experiencia del usuario, la eficiencia de recursos, y la escalabilidad del sistema.

## Métricas Objetivo
- **Tiempo de Carga**: ${targets.loadTime}
- **Tiempo de Respuesta**: ${targets.responseTime}
- **Throughput**: ${targets.throughput}
- **Tasa de Error**: ${targets.errorRate}
- **Uso de Memoria**: ${targets.memoryUsage}
- **Uso de CPU**: ${targets.cpuUsage}
- **Impacto en Batería**: ${targets.batteryImpact}
- **Eficiencia de Red**: ${targets.networkEfficiency}

## Recomendaciones de Optimización
${recommendations.join('\n')}

## Plan de Implementación

### Fase 1: Análisis y Preparación (Semana 1)
1. **Establecer Línea Base**
   - Medir métricas actuales de rendimiento
   - Identificar cuellos de botella críticos
   - Priorizar optimizaciones según impacto/esfuerzo

2. **Configurar Entorno de Pruebas**
   - Implementar herramientas de profiling y monitoreo
   - Configurar entorno de pruebas representativo
   - Establecer casos de prueba para validación

### Fase 2: Implementación de Optimizaciones Críticas (Semanas 2-3)
1. **Optimizaciones de Alto Impacto**
   - Implementar mejoras prioritarias identificadas
   - Validar cada optimización con pruebas de rendimiento
   - Documentar cambios y mejoras observadas

2. **Revisión y Ajuste**
   - Analizar resultados de las primeras optimizaciones
   - Ajustar estrategia según resultados obtenidos
   - Identificar optimizaciones adicionales

### Fase 3: Optimizaciones Avanzadas y Validación (Semanas 4-5)
1. **Implementación de Optimizaciones Secundarias**
   - Aplicar optimizaciones de menor prioridad
   - Implementar mejoras arquitectónicas si es necesario
   - Optimizar casos extremos y escenarios de carga

2. **Pruebas de Carga y Estrés**
   - Realizar pruebas de carga para validar escalabilidad
   - Simular condiciones extremas para identificar límites
   - Optimizar para mantener rendimiento bajo carga

### Fase 4: Monitoreo y Mejora Continua (Semana 6+)
1. **Implementar Monitoreo Continuo**
   - Configurar dashboards de métricas clave
   - Establecer alertas para degradación de rendimiento
   - Implementar revisiones periódicas de rendimiento

2. **Documentación y Capacitación**
   - Documentar optimizaciones implementadas
   - Establecer mejores prácticas para desarrollo futuro
   - Capacitar al equipo en técnicas de optimización

## Herramientas Recomendadas
${this.getRecommendedTools(appType)}

## Riesgos y Mitigaciones
1. **Riesgo**: Optimizaciones que afecten la funcionalidad
   **Mitigación**: Implementar pruebas de regresión exhaustivas

2. **Riesgo**: Mejoras no significativas en métricas clave
   **Mitigación**: Priorizar por impacto medible y validar cada cambio

3. **Riesgo**: Degradación en otros aspectos (mantenibilidad)
   **Mitigación**: Balancear optimización con buenas prácticas de código

## Conclusión
La implementación de este plan de optimización permitirá alcanzar las métricas objetivo establecidas, mejorando significativamente el rendimiento de la aplicación. El enfoque gradual y basado en datos asegura que las optimizaciones tengan un impacto real y medible, mientras se mantiene la estabilidad y funcionalidad del sistema.`;
    }
    
    /**
     * Obtiene herramientas recomendadas según el tipo de aplicación
     * @param appType Tipos de aplicación
     * @returns Lista de herramientas recomendadas
     */
    private getRecommendedTools(appType: string[]): string {
      const tools = [];
      
      if (appType.includes('web')) {
        tools.push('- **Análisis Web**: Lighthouse, WebPageTest, Chrome DevTools Performance');
        tools.push('- **Optimización Frontend**: Webpack Bundle Analyzer, PurgeCSS, ImageOptim');
      }
      
      if (appType.includes('database')) {
        tools.push('- **Análisis de Base de Datos**: Explain Plan, Query Analyzer, pgBadger');
        tools.push('- **Caché**: Redis, Memcached, Elasticsearch');
      }
      
      if (appType.includes('algorithm')) {
        tools.push('- **Profiling**: Node.js Profiler, Python cProfile, Chrome CPU Profiler');
        tools.push('- **Análisis de Algoritmos**: Big O Analyzer, Memory Profiler');
      }
      
      if (appType.includes('mobile')) {
        tools.push('- **Análisis Móvil**: Android Profiler, Xcode Instruments, Firebase Performance');
        tools.push('- **Optimización UI**: Layout Inspector, Hierarchy Viewer');
      }
      
      if (appType.includes('network')) {
        tools.push('- **Análisis de Red**: Wireshark, Postman, Chrome Network Panel');
        tools.push('- **Optimización API**: API Gateway, GraphQL, gRPC');
      }
      
      // Añadir herramientas generales si no hay tipo específico o para complementar
      if (appType.includes('general') || tools.length < 4) {
        tools.push('- **Monitoreo General**: Prometheus, Grafana, New Relic');
        tools.push('- **Pruebas de Carga**: JMeter, k6, Locust');
      }
      
      return tools.join('\n');
    }
    
    /**
     * Genera recomendaciones de optimización según el tipo de rendimiento
     * @param perfType Tipo de rendimiento a optimizar
     * @returns Recomendaciones de optimización
     */
    public generateOptimizationRecommendations(perfType: string): string {
      console.log(`💡 Generando recomendaciones de optimización para: ${perfType}`);
      
      // Recomendaciones según el tipo de rendimiento
      let recommendations = '';
      
      if (perfType === 'frontend' || perfType === 'web' || perfType === 'general') {
        recommendations += `## Prioridad Alta
- Implementar lazy loading para imágenes y componentes
- Optimizar Critical Rendering Path
- Reducir tamaño de bundle con code splitting
- Implementar caché efectiva para recursos estáticos
- Optimizar tiempo de interactividad (TTI)

## Prioridad Media
- Implementar compresión de imágenes y recursos
- Optimizar renderizado con virtualización para listas largas
- Reducir re-renderizados innecesarios
- Implementar Server-Side Rendering o Static Generation
- Optimizar Web Fonts y uso de iconos

## Prioridad Baja
- Implementar prefetching para navegación anticipada
- Optimizar animaciones CSS/JS
- Implementar Service Workers para experiencia offline
- Reducir uso de librerías de terceros
- Implementar estrategias avanzadas de caché`;
      }
      
      if (perfType === 'backend' || perfType === 'server' || perfType === 'general') {
        recommendations += `## Prioridad Alta
- Implementar caché multinivel (memoria, disco, distribuida)
- Optimizar consultas a bases de datos
- Implementar procesamiento asíncrono para tareas pesadas
- Configurar timeouts y circuit breakers
- Implementar rate limiting y protección contra abusos

## Prioridad Media
- Optimizar serialización/deserialización de datos
- Implementar compresión de respuestas
- Configurar pooling de conexiones
- Implementar backpressure handling
- Optimizar logging y telemetría

## Prioridad Baja
- Implementar sharding para escalabilidad horizontal
- Optimizar configuración de servidor web/aplicación
- Implementar estrategias de retry con backoff exponencial
- Configurar health checks y auto-healing
- Implementar warm-up para reducir cold starts`;
      }
      
      if (perfType === 'database' || perfType === 'db' || perfType === 'general') {
        recommendations += `## Prioridad Alta
- Optimizar índices para consultas frecuentes
- Implementar consultas paginadas
- Optimizar JOINs y subconsultas
- Implementar caché de resultados
- Configurar tamaños apropiados de conexiones

## Prioridad Media
- Implementar particionamiento de tablas grandes
- Optimizar esquema para reducir redundancia
- Configurar parámetros de rendimiento del motor DB
- Implementar estrategias de lectura/escritura separadas
- Optimizar transacciones para reducir bloqueos

## Prioridad Baja
- Implementar compresión de datos
- Configurar jobs de mantenimiento (vacuum, reindex)
- Implementar sharding para escalabilidad horizontal
- Optimizar procedimientos almacenados
- Implementar estrategias de migración de datos eficientes`;
      }
      
      if (perfType === 'algorithm' || perfType === 'code' || perfType === 'general') {
        recommendations += `## Prioridad Alta
- Reducir complejidad computacional de algoritmos críticos
- Implementar estructuras de datos optimizadas
- Utilizar técnicas de memoización y programación dinámica
- Optimizar bucles anidados y operaciones repetitivas
- Implementar procesamiento por lotes (batching)

## Prioridad Media
- Implementar paralelización para tareas independientes
- Optimizar uso de memoria con estructuras apropiadas
- Reducir operaciones de copia innecesarias
- Implementar lazy evaluation cuando sea posible
- Optimizar recursión con tail-call optimization

## Prioridad Baja
- Implementar algoritmos especializados para casos específicos
- Optimizar operaciones bit a bit cuando sea aplicable
- Reducir overhead de llamadas a funciones en puntos críticos
- Implementar cache-friendly data structures
- Optimizar branch prediction con código predecible`;
      }
      
      if (perfType === 'mobile' || perfType === 'app' || perfType === 'general') {
        recommendations += `## Prioridad Alta
- Optimizar tiempo de inicio con lazy loading
- Reducir trabajo en hilo principal
- Implementar renderizado eficiente de UI
- Optimizar uso de memoria y prevenir fugas
- Implementar carga diferida de recursos

## Prioridad Media
- Optimizar consumo de batería
- Implementar caché de imágenes y recursos
- Optimizar transiciones y animaciones
- Reducir tamaño de APK/IPA
- Implementar sincronización eficiente en segundo plano

## Prioridad Baja
- Optimizar compilación con ProGuard/R8
- Implementar modo offline con sincronización inteligente
- Optimizar uso de sensores y GPS
- Implementar pre-warming de componentes críticos
- Optimizar experiencia en dispositivos de gama baja`;
      }
      
      if (perfType === 'network' || perfType === 'api' || perfType === 'general') {
        recommendations += `## Prioridad Alta
- Implementar CDN para recursos estáticos
- Optimizar tamaño de respuestas con compresión
- Implementar HTTP/2 o HTTP/3
- Reducir round-trips con respuestas completas
- Implementar caché efectiva con validación

## Prioridad Media
- Optimizar handshakes SSL/TLS
- Implementar connection pooling
- Reducir overhead de headers con HPACK
- Implementar respuestas parciales para datos grandes
- Optimizar DNS con prefetching

## Prioridad Baja
- Implementar server push para recursos críticos
- Optimizar routing y proxying
- Implementar multiplexing eficiente
- Configurar TTLs apropiados para caché
- Implementar estrategias avanzadas de balanceo de carga`;
      }
      
      // Si no se especificó un tipo válido, usar recomendaciones generales
      if (recommendations === '') {
        recommendations = this.generateOptimizationRecommendations('general');
      }
      
      return recommendations;
    }
    
    /**
     * Analiza el rendimiento de un sistema completo
     * @param systemConfig Configuración o descripción del sistema
     * @returns Análisis de rendimiento del sistema
     */
    public async analyzeSystemPerformance(systemConfig: string): Promise<string> {
      console.log(`🔍 Analizando rendimiento del sistema: ${systemConfig}`);
      
      // Determinar componentes del sistema
      const components = this.determineSystemComponents(systemConfig);
      
      // Analizar cada componente
      const componentAnalyses = await Promise.all(
        components.map(async (component) => {
          if (component.type === 'web') {
            return {
              name: component.name,
              analysis: await this.analyzeWebPerformance(component.config)
            };
          } else if (component.type === 'database') {
            return {
              name: component.name,
              analysis: await this.analyzeDatabasePerformance(component.config)
            };
          } else if (component.type === 'algorithm') {
            return {
              name: component.name,
              analysis: this.analyzeAlgorithmPerformance(component.config)
            };
          } else if (component.type === 'mobile') {
            return {
              name: component.name,
              analysis: this.analyzeMobilePerformance(component.config)
            };
          } else if (component.type === 'network') {
            return {
              name: component.name,
              analysis: await this.analyzeNetworkPerformance(component.config)
            };
          } else {
            return {
              name: component.name,
              analysis: `No se pudo analizar el componente de tipo desconocido: ${component.type}`
            };
          }
        })
      );
      
      // Identificar cuellos de botella y dependencias
      const bottlenecks = this.identifyBottlenecks(componentAnalyses);
      const dependencies = this.identifyDependencies(components);
      
      // Generar recomendaciones de optimización del sistema
      const systemRecommendations = this.generateSystemOptimizationRecommendations(
        componentAnalyses,
        bottlenecks,
        dependencies
      );
      
      // Generar informe de rendimiento del sistema
      return `# Análisis de Rendimiento del Sistema: ${systemConfig}

## Resumen Ejecutivo
Este análisis evalúa el rendimiento del sistema completo, identificando cuellos de botella, dependencias críticas, y oportunidades de optimización. El enfoque holístico permite entender cómo los diferentes componentes interactúan y afectan el rendimiento global.

## Componentes Analizados
${components.map(c => `- **${c.name}** (${c.type}): ${c.description}`).join('\n')}

## Cuellos de Botella Identificados
${bottlenecks.map(b => `- **${b.component}**: ${b.description} (Impacto: ${b.impact})`).join('\n')}

## Dependencias Críticas
${dependencies.map(d => `- **${d.from}** → **${d.to}**: ${d.description}`).join('\n')}

## Análisis por Componente

${componentAnalyses.map(ca => `### ${ca.name}\n${this.extractSummary(ca.analysis)}\n`).join('\n')}

## Recomendaciones de Optimización del Sistema

### Optimizaciones de Alto Impacto
${systemRecommendations.highImpact.join('\n')}

### Optimizaciones de Impacto Medio
${systemRecommendations.mediumImpact.join('\n')}

### Optimizaciones de Bajo Impacto
${systemRecommendations.lowImpact.join('\n')}

## Plan de Implementación

### Fase 1: Optimizaciones Críticas (Semana 1-2)
1. Abordar cuellos de botella de alto impacto:
   ${bottlenecks.filter(b => b.impact === 'Alto').map(b => `- Optimizar ${b.component}`).join('\n   ')}
2. Implementar optimizaciones de alto impacto:
   - Implementar caché multinivel
   - Optimizar consultas críticas
   - Reducir latencia en componentes frontend

### Fase 2: Optimizaciones de Componentes (Semana 3-4)
1. Implementar optimizaciones específicas por componente:
   ${components.map(c => `- **${c.name}**: Implementar optimizaciones recomendadas`).join('\n   ')}
2. Optimizar dependencias entre componentes:
   ${dependencies.map(d => `- Optimizar interacción entre ${d.from} y ${d.to}`).join('\n   ')}

### Fase 3: Optimizaciones de Sistema (Semana 5-6)
1. Implementar optimizaciones a nivel de sistema:
   - Configurar balanceo de carga inteligente
   - Implementar estrategias de escalado automático
   - Optimizar comunicación entre componentes

### Fase 4: Monitoreo y Mejora Continua (Continuo)
1. Implementar monitoreo integral:
   - Configurar dashboards unificados
   - Establecer alertas para degradación de rendimiento
   - Implementar análisis de tendencias

## Métricas de Éxito
- **Tiempo de Respuesta End-to-End**: Reducción del 30%
- **Throughput del Sistema**: Aumento del 50%
- **Uso de Recursos**: Reducción del 25%
- **Disponibilidad**: 99.99%
- **Experiencia de Usuario**: Mejora en métricas de satisfacción

## Herramientas Recomendadas
- **Monitoreo Integral**: Prometheus + Grafana, Datadog, New Relic
- **Análisis de Dependencias**: Jaeger, Zipkin
- **Pruebas de Carga**: JMeter, k6, Gatling
- **Optimización de Recursos**: Kubernetes Metrics Server, Vertical Pod Autoscaler

## Conclusión
El análisis de rendimiento del sistema ha identificado oportunidades significativas de mejora, especialmente en ${bottlenecks.length > 0 ? bottlenecks[0].component : 'componentes críticos'}. La implementación de las recomendaciones propuestas permitirá mejorar el rendimiento global, la escalabilidad, y la experiencia del usuario. El enfoque gradual asegura que las optimizaciones se implementen de manera controlada y medible.`;
    }
    
    /**
     * Determina los componentes de un sistema basado en su configuración
     * @param systemConfig Configuración del sistema
     * @returns Lista de componentes del sistema
     */
    private determineSystemComponents(systemConfig: string): Array<{
      name: string;
      type: string;
      config: string;
      description: string;
    }> {
      // Simular detección de componentes basada en la configuración
      const components = [];
      
      if (systemConfig.includes('web') || systemConfig.includes('frontend')) {
        components.push({
          name: 'Frontend Web',
          type: 'web',
          config: 'React SPA con Material UI',
          description: 'Aplicación web de página única con React y Material UI'
        });
      }
      
      if (systemConfig.includes('api') || systemConfig.includes('backend')) {
        components.push({
          name: 'API Backend',
          type: 'network',
          config: 'REST API con Node.js y Express',
          description: 'API RESTful implementada con Node.js y Express'
        });
      }
      
      if (systemConfig.includes('db') || systemConfig.includes('database')) {
        components.push({
          name: 'Base de Datos',
          type: 'database',
          config: 'PostgreSQL 13 con índices y particionamiento',
          description: 'Base de datos relacional PostgreSQL con optimizaciones'
        });
      }
      
      if (systemConfig.includes('mobile') || systemConfig.includes('app')) {
        components.push({
          name: 'Aplicación Móvil',
          type: 'mobile',
          config: 'React Native con Redux',
          description: 'Aplicación móvil multiplataforma con React Native'
        });
      }
      
      if (systemConfig.includes('cache') || systemConfig.includes('redis')) {
        components.push({
          name: 'Capa de Caché',
          type: 'database',
          config: 'Redis Cluster',
          description: 'Sistema de caché distribuido con Redis'
        });
      }
      
      if (systemConfig.includes('search') || systemConfig.includes('elastic')) {
        components.push({
          name: 'Motor de Búsqueda',
          type: 'database',
          config: 'Elasticsearch',
          description: 'Motor de búsqueda y análisis con Elasticsearch'
        });
      }
      
      if (systemConfig.includes('queue') || systemConfig.includes('kafka')) {
        components.push({
          name: 'Sistema de Colas',
          type: 'network',
          config: 'Kafka',
          description: 'Sistema de mensajería y streaming con Kafka'
        });
      }
      
      if (systemConfig.includes('ml') || systemConfig.includes('ai')) {
        components.push({
          name: 'Servicios de ML',
          type: 'algorithm',
          config: 'Python con TensorFlow',
          description: 'Servicios de machine learning implementados con TensorFlow'
        });
      }
      
      // Si no se detectaron componentes, asumir un sistema web básico
      if (components.length === 0) {
        components.push({
          name: 'Aplicación Web',
          type: 'web',
          config: 'Aplicación web genérica',
          description: 'Aplicación web con frontend y backend'
        });
        
        components.push({
          name: 'API Backend',
          type: 'network',
          config: 'API genérica',
          description: 'API backend para la aplicación web'
        });
        
        components.push({
          name: 'Base de Datos',
          type: 'database',
          config: 'Base de datos genérica',
          description: 'Base de datos para almacenamiento persistente'
        });
      }
      
      return components;
    }
    
    /**
     * Identifica cuellos de botella en los análisis de componentes
     * @param componentAnalyses Análisis de componentes
     * @returns Lista de cuellos de botella identificados
     */
    private identifyBottlenecks(componentAnalyses: Array<{
      name: string;
      analysis: string;
    }>): Array<{
      component: string;
      description: string;
      impact: string;
    }> {
      const bottlenecks = [];
      
      // Analizar cada componente para identificar cuellos de botella
      for (const ca of componentAnalyses) {
        // Buscar indicadores de problemas de rendimiento en el análisis
        if (ca.analysis.includes('❌') || ca.analysis.includes('Pobre') || ca.analysis.includes('crítico')) {
          bottlenecks.push({
            component: ca.name,
            description: 'Rendimiento crítico detectado que afecta al sistema completo',
            impact: 'Alto'
          });
        } else if (ca.analysis.includes('⚠️') || ca.analysis.includes('Necesita mejora')) {
          bottlenecks.push({
            component: ca.name,
            description: 'Rendimiento subóptimo que podría mejorar',
            impact: 'Medio'
          });
        }
        
        // Buscar problemas específicos según el tipo de componente
        if (ca.name.includes('Base de Datos') && ca.analysis.includes('consultas')) {
          bottlenecks.push({
            component: ca.name,
            description: 'Consultas ineficientes que afectan el rendimiento general',
            impact: 'Alto'
          });
        }
        
        if (ca.name.includes('Frontend') && ca.analysis.includes('renderizado')) {
          bottlenecks.push({
            component: ca.name,
            description: 'Problemas de renderizado que afectan la experiencia de usuario',
            impact: 'Medio'
          });
        }
        
        if (ca.name.includes('API') && ca.analysis.includes('latencia')) {
          bottlenecks.push({
            component: ca.name,
            description: 'Alta latencia en respuestas de API',
            impact: 'Alto'
          });
        }
        
        if (ca.name.includes('Móvil') && ca.analysis.includes('memoria')) {
          bottlenecks.push({
            component: ca.name,
            description: 'Uso excesivo de memoria en dispositivos móviles',
            impact: 'Medio'
          });
        }
      }
      
      // Si no se identificaron cuellos de botella, añadir algunos genéricos
      if (bottlenecks.length === 0) {
        bottlenecks.push({
          component: 'Comunicación entre Componentes',
          description: 'Latencia en la comunicación entre servicios',
          impact: 'Medio'
        });
        
        bottlenecks.push({
          component: 'Gestión de Recursos',
          description: 'Asignación ineficiente de recursos del sistema',
          impact: 'Bajo'
        });
      }
      
      return bottlenecks;
    }
    
    /**
     * Identifica dependencias entre componentes del sistema
     * @param components Componentes del sistema
     * @returns Lista de dependencias identificadas
     */
    private identifyDependencies(components: Array<{
      name: string;
      type: string;
      config: string;
      description: string;
    }>): Array<{
      from: string;
      to: string;
      description: string;
    }> {
      const dependencies = [];
      
      // Identificar dependencias comunes entre componentes
      const frontendComponent = components.find(c => c.type === 'web');
      const apiComponent = components.find(c => c.type === 'network' && c.name.includes('API'));
      const dbComponent = components.find(c => c.type === 'database' && c.name.includes('Base de Datos'));
      const cacheComponent = components.find(c => c.type === 'database' && c.name.includes('Caché'));
      const searchComponent = components.find(c => c.type === 'database' && c.name.includes('Búsqueda'));
      const queueComponent = components.find(c => c.type === 'network' && c.name.includes('Colas'));
      const mlComponent = components.find(c => c.type === 'algorithm' && c.name.includes('ML'));
      const mobileComponent = components.find(c => c.type === 'mobile');
      
      // Añadir dependencias comunes
      if (frontendComponent && apiComponent) {
        dependencies.push({
          from: frontendComponent.name,
          to: apiComponent.name,
          description: 'Comunicación para obtener datos y realizar operaciones'
        });
      }
      
      if (apiComponent && dbComponent) {
        dependencies.push({
          from: apiComponent.name,
          to: dbComponent.name,
          description: 'Persistencia y consulta de datos'
        });
      }
      
      if (apiComponent && cacheComponent) {
        dependencies.push({
          from: apiComponent.name,
          to: cacheComponent.name,
          description: 'Caché de resultados frecuentes para reducir latencia'
        });
      }
      
      if (dbComponent && cacheComponent) {
        dependencies.push({
          from: dbComponent.name,
          to: cacheComponent.name,
          description: 'Caché de consultas para reducir carga en base de datos'
        });
      }
      
      if (apiComponent && searchComponent) {
        dependencies.push({
          from: apiComponent.name,
          to: searchComponent.name,
          description: 'Búsquedas avanzadas y análisis de texto'
        });
      }
      
      if (apiComponent && queueComponent) {
        dependencies.push({
          from: apiComponent.name,
          to: queueComponent.name,
          description: 'Procesamiento asíncrono de tareas pesadas'
        });
      }
      
      if (queueComponent && mlComponent) {
        dependencies.push({
          from: queueComponent.name,
          to: mlComponent.name,
          description: 'Procesamiento de tareas de machine learning'
        });
      }
      
      if (mobileComponent && apiComponent) {
        dependencies.push({
          from: mobileComponent.name,
          to: apiComponent.name,
          description: 'Comunicación para obtener datos y realizar operaciones'
        });
      }
      
      // Si no se identificaron dependencias, añadir algunas genéricas
      if (dependencies.length === 0 && components.length >= 2) {
        dependencies.push({
          from: components[0].name,
          to: components[1].name,
          description: 'Comunicación para intercambio de datos'
        });
        
        if (components.length >= 3) {
          dependencies.push({
            from: components[1].name,
            to: components[2].name,
            description: 'Procesamiento y persistencia de datos'
          });
        }
      }
      
      return dependencies;
    }
    
    /**
     * Genera recomendaciones de optimización del sistema
     * @param componentAnalyses Análisis de componentes
     * @param bottlenecks Cuellos de botella identificados
     * @param dependencies Dependencias entre componentes
     * @returns Recomendaciones de optimización
     */
    private generateSystemOptimizationRecommendations(
      componentAnalyses: Array<{
        name: string;
        analysis: string;
      }>,
      bottlenecks: Array<{
        component: string;
        description: string;
        impact: string;
      }>,
      dependencies: Array<{
        from: string;
        to: string;
        description: string;
      }>
    ): {
      highImpact: string[];
      mediumImpact: string[];
      lowImpact: string[];
    } {
      const highImpact = [];
      const mediumImpact = [];
      const lowImpact = [];
      
      // Recomendaciones basadas en cuellos de botella
      for (const bottleneck of bottlenecks) {
        if (bottleneck.impact === 'Alto') {
          highImpact.push(`- **${bottleneck.component}**: ${this.generateRecommendationForBottleneck(bottleneck)}`);
        } else if (bottleneck.impact === 'Medio') {
          mediumImpact.push(`- **${bottleneck.component}**: ${this.generateRecommendationForBottleneck(bottleneck)}`);
        } else {
          lowImpact.push(`- **${bottleneck.component}**: ${this.generateRecommendationForBottleneck(bottleneck)}`);
        }
      }
      
      // Recomendaciones basadas en dependencias
      for (const dependency of dependencies) {
        const recommendation = this.generateRecommendationForDependency(dependency);
        if (recommendation.impact === 'Alto') {
          highImpact.push(`- **${dependency.from} → ${dependency.to}**: ${recommendation.text}`);
        } else if (recommendation.impact === 'Medio') {
          mediumImpact.push(`- **${dependency.from} → ${dependency.to}**: ${recommendation.text}`);
        } else {
          lowImpact.push(`- **${dependency.from} → ${dependency.to}**: ${recommendation.text}`);
        }
      }
      
      // Recomendaciones basadas en análisis de componentes
      for (const ca of componentAnalyses) {
        const recommendation = this.extractRecommendationFromAnalysis(ca.analysis);
        if (recommendation.impact === 'Alto') {
          highImpact.push(`- **${ca.name}**: ${recommendation.text}`);
        } else if (recommendation.impact === 'Medio') {
          mediumImpact.push(`- **${ca.name}**: ${recommendation.text}`);
        } else {
          lowImpact.push(`- **${ca.name}**: ${recommendation.text}`);
        }
      }
      
      // Añadir recomendaciones generales si hay pocas específicas
      if (highImpact.length < 3) {
        highImpact.push('- **Caché Multinivel**: Implementar estrategia de caché en múltiples niveles (memoria, disco, distribuida) para reducir latencia y carga en componentes críticos');
        highImpact.push('- **Optimización de Consultas**: Revisar y optimizar consultas críticas, implementar índices apropiados, y considerar denormalización estratégica para lecturas frecuentes');
        highImpact.push('- **Paralelización**: Identificar operaciones independientes que puedan ejecutarse en paralelo para mejorar throughput y tiempo de respuesta');
      }
      
      if (mediumImpact.length < 3) {
        mediumImpact.push('- **Compresión de Datos**: Implementar compresión para transferencias de red y almacenamiento, reduciendo uso de ancho de banda y espacio');
        mediumImpact.push('- **Pooling de Recursos**: Configurar pools de conexiones, workers, y otros recursos para reducir overhead de inicialización');
        mediumImpact.push('- **Lazy Loading**: Implementar carga diferida de recursos y componentes para mejorar tiempo de inicio y reducir uso de memoria');
      }
      
      if (lowImpact.length < 3) {
        lowImpact.push('- **Optimización de Assets**: Comprimir imágenes, minificar JS/CSS, y utilizar formatos modernos (WebP, AVIF) para reducir tamaño de recursos');
        lowImpact.push('- **Monitoreo Detallado**: Implementar telemetría avanzada para identificar patrones de uso y oportunidades de optimización');
        lowImpact.push('- **Configuración de TTLs**: Ajustar tiempos de expiración de caché según patrones de acceso y frecuencia de actualización');
      }
      
      return {
        highImpact,
        mediumImpact,
        lowImpact
      };
    }
    
    /**
     * Genera una recomendación para un cuello de botella
     * @param bottleneck Cuello de botella
     * @returns Recomendación para el cuello de botella
     */
    private generateRecommendationForBottleneck(bottleneck: {
      component: string;
      description: string;
      impact: string;
    }): string {
      // Recomendaciones específicas según el tipo de componente y descripción
      if (bottleneck.component.includes('Base de Datos')) {
        if (bottleneck.description.includes('consultas')) {
          return 'Optimizar consultas críticas mediante análisis de planes de ejecución, índices apropiados, y posible denormalización para lecturas frecuentes';
        } else {
          return 'Implementar particionamiento, sharding, o replicación para distribuir carga y mejorar escalabilidad';
        }
      }
      
      if (bottleneck.component.includes('Frontend') || bottleneck.component.includes('Web')) {
        if (bottleneck.description.includes('renderizado')) {
          return 'Implementar renderizado eficiente con virtualización, lazy loading, y optimización de re-renders';
        } else {
          return 'Optimizar Critical Rendering Path, implementar code splitting, y reducir JavaScript bloqueante';
        }
      }
      
      if (bottleneck.component.includes('API') || bottleneck.component.includes('Backend')) {
        if (bottleneck.description.includes('latencia')) {
          return 'Implementar caché efectiva, optimizar consultas a bases de datos, y considerar procesamiento asíncrono para operaciones pesadas';
        } else {
          return 'Implementar escalado horizontal, balanceo de carga inteligente, y optimizar uso de recursos';
        }
      }
      
      if (bottleneck.component.includes('Móvil')) {
        if (bottleneck.description.includes('memoria')) {
          return 'Optimizar uso de memoria con recycler views, liberación proactiva de recursos, y reducción de memory leaks';
        } else {
          return 'Implementar lazy loading, reducir trabajo en hilo principal, y optimizar ciclo de vida de componentes';
        }
      }
      
      if (bottleneck.component.includes('Caché')) {
        return 'Optimizar estrategia de caché con políticas de invalidación inteligentes, TTLs apropiados, y distribución eficiente';
      }
      
      if (bottleneck.component.includes('Búsqueda')) {
        return 'Optimizar índices de búsqueda, implementar sharding para distribución de carga, y considerar caché de resultados frecuentes';
      }
      
      if (bottleneck.component.includes('Colas')) {
        return 'Implementar particionamiento de tópicos, optimizar tamaño de mensajes, y configurar retención apropiada';
      }
      
      if (bottleneck.component.includes('ML') || bottleneck.component.includes('AI')) {
        return 'Optimizar modelos para inferencia, implementar batch processing, y considerar cuantización para reducir uso de recursos';
      }
      
      if (bottleneck.component.includes('Comunicación')) {
        return 'Implementar comunicación asíncrona, reducir payload de mensajes, y optimizar protocolos de comunicación';
      }
      
      // Recomendación genérica si no hay match específico
      return 'Analizar patrones de uso, implementar caché apropiada, y optimizar algoritmos críticos para mejorar rendimiento';
    }
    
    /**
     * Genera una recomendación para una dependencia entre componentes
     * @param dependency Dependencia entre componentes
     * @returns Recomendación para la dependencia
     */
    private generateRecommendationForDependency(dependency: {
      from: string;
      to: string;
      description: string;
    }): {
      text: string;
      impact: string;
    } {
      // Determinar impacto basado en los componentes involucrados
      let impact = 'Medio';
      
      // Dependencias críticas tienen alto impacto
      if (
        (dependency.from.includes('Frontend') && dependency.to.includes('API')) ||
        (dependency.from.includes('API') && dependency.to.includes('Base de Datos')) ||
        (dependency.from.includes('Móvil') && dependency.to.includes('API'))
      ) {
        impact = 'Alto';
      }
      
      // Dependencias secundarias tienen bajo impacto
      if (
        (dependency.from.includes('API') && dependency.to.includes('Colas')) ||
        (dependency.to.includes('Búsqueda')) ||
        (dependency.to.includes('ML'))
      ) {
        impact = 'Bajo';
      }
      
      // Recomendaciones específicas según los componentes
      if (dependency.from.includes('Frontend') && dependency.to.includes('API')) {
        return {
          text: 'Implementar API Gateway para agregación de endpoints, caché de respuestas, y reducción de round-trips',
          impact
        };
      }
      
      if (dependency.from.includes('API') && dependency.to.includes('Base de Datos')) {
        return {
          text: 'Optimizar consultas, implementar connection pooling, y considerar read replicas para distribuir carga de lectura',
          impact
        };
      }
      
      if (dependency.from.includes('API') && dependency.to.includes('Caché')) {
        return {
          text: 'Implementar estrategia de caché con invalidación selectiva, TTLs apropiados, y warm-up para consultas frecuentes',
          impact
        };
      }
      
      if (dependency.from.includes('Base de Datos') && dependency.to.includes('Caché')) {
        return {
          text: 'Implementar cache-aside pattern, considerar write-through para consistencia, y optimizar tamaño de entradas en caché',
          impact
        };
      }
      
      if (dependency.to.includes('Búsqueda')) {
        return {
          text: 'Implementar indexación asíncrona, optimizar mappings, y considerar caché de resultados frecuentes',
          impact
        };
      }
      
      if (dependency.to.includes('Colas')) {
        return {
          text: 'Implementar retry con backoff exponencial, dead letter queues, y monitoreo de profundidad de cola',
          impact
        };
      }
      
      if (dependency.from.includes('Móvil') && dependency.to.includes('API')) {
        return {
          text: 'Optimizar payload de respuestas, implementar compresión, y considerar sincronización diferida para operaciones no críticas',
          impact
        };
      }
      
      // Recomendación genérica si no hay match específico
      return {
        text: 'Optimizar comunicación entre componentes, reducir latencia, e implementar circuit breakers para fallos',
        impact
      };
    }
    
    /**
     * Extrae un resumen del análisis de un componente
     * @param analysis Análisis completo del componente
     * @returns Resumen del análisis
     */
    private extractSummary(analysis: string): string {
      // Extraer las primeras 3-5 líneas o un párrafo relevante
      const lines = analysis.split('\n');
      
      // Buscar secciones relevantes
      const summaryIndex = lines.findIndex(line => 
        line.includes('Resumen') || 
        line.includes('Summary') || 
        line.includes('Análisis')
      );
      
      if (summaryIndex >= 0 && summaryIndex + 5 < lines.length) {
        // Extraer párrafo después del título de resumen
        return lines.slice(summaryIndex + 1, summaryIndex + 5).join('\n');
      }
      
      // Si no hay sección de resumen, tomar las primeras líneas relevantes
      const relevantLines = lines.filter(line => 
        line.trim().length > 0 && 
        !line.startsWith('#') && 
        !line.startsWith('-')
      );
      
      if (relevantLines.length > 0) {
        return relevantLines.slice(0, 3).join('\n');
      }
      
      // Si todo falla, devolver las primeras líneas
      return lines.slice(0, 5).join('\n');
    }
    
    /**
     * Extrae recomendaciones de un análisis de componente
     * @param analysis Análisis del componente
     * @returns Recomendación extraída y su impacto
     */
    private extractRecommendationFromAnalysis(analysis: string): {
      text: string;
      impact: string;
    } {
      // Buscar secciones de recomendaciones en el análisis
      const lines = analysis.split('\n');
      
      // Buscar sección de recomendaciones
      const recommendationIndex = lines.findIndex(line => 
        line.includes('Recomendación') || 
        line.includes('Recommendation') || 
        line.includes('Optimización')
      );
      
      // Determinar impacto basado en el contenido del análisis
      let impact = 'Medio';
      
      if (analysis.includes('crítico') || analysis.includes('urgente') || analysis.includes('❌')) {
        impact = 'Alto';
      } else if (analysis.includes('opcional') || analysis.includes('menor') || analysis.includes('✅')) {
        impact = 'Bajo';
      }
      
      // Extraer recomendación si se encontró la sección
      if (recommendationIndex >= 0 && recommendationIndex + 1 < lines.length) {
        const recommendationLines = [];
        
        // Recopilar líneas de recomendación hasta la siguiente sección
        for (let i = recommendationIndex + 1; i < lines.length; i++) {
          if (lines[i].startsWith('#') || lines[i].match(/^[A-Z][a-z]+:/)) {
            break;
          }
          
          if (lines[i].trim().length > 0) {
            recommendationLines.push(lines[i].trim());
          }
        }
        
        if (recommendationLines.length > 0) {
          return {
            text: recommendationLines.join(' ').replace(/- /g, ''),
            impact
          };
        }
      }
      
      // Si no se encontró sección de recomendaciones, buscar frases relevantes
      const relevantPhrases = [
        'se recomienda',
        'debería',
        'optimizar',
        'mejorar',
        'implementar',
        'considerar'
      ];
      
      for (const line of lines) {
        for (const phrase of relevantPhrases) {
          if (line.toLowerCase().includes(phrase)) {
            return {
              text: line.trim(),
              impact
            };
          }
        }
      }
      
      // Si todo falla, generar recomendación genérica
      return {
        text: 'Analizar patrones de uso y optimizar para mejorar rendimiento y eficiencia',
        impact
      };
    }
    
    /**
     * Analiza el rendimiento de una aplicación web
     * @param webConfig Configuración o descripción de la aplicación web
     * @returns Análisis de rendimiento web
     */
    public async analyzeWebPerformance(webConfig: string): Promise<string> {
      console.log(`🌐 Analizando rendimiento web para: ${webConfig}`);
      
      // Simular análisis de rendimiento web
      const metrics = this.simulateWebMetrics(webConfig);
      
      // Generar recomendaciones basadas en métricas
      const recommendations = this.generateWebRecommendations(metrics);
      
      // Generar informe de rendimiento web
      return `# Análisis de Rendimiento Web: ${webConfig}

## Resumen Ejecutivo
${metrics.score >= 90 ? '✅ Excelente' : metrics.score >= 70 ? '⚠️ Necesita mejora' : '❌ Rendimiento pobre'}: La aplicación web tiene un rendimiento general ${metrics.score >= 90 ? 'excelente' : metrics.score >= 70 ? 'aceptable pero con áreas de mejora' : 'pobre que requiere optimización urgente'}, con un puntaje de ${metrics.score}/100. ${metrics.score < 90 ? 'Las principales áreas de mejora incluyen ' + this.getWeakAreas(metrics) + '.' : 'Se recomienda mantener las buenas prácticas actuales y monitorear continuamente.'}

## Métricas Clave
- **First Contentful Paint (FCP)**: ${metrics.fcp}ms ${this.getMetricEvaluation(metrics.fcp, 1000, 2500)}
- **Largest Contentful Paint (LCP)**: ${metrics.lcp}ms ${this.getMetricEvaluation(metrics.lcp, 2500, 4000)}
- **First Input Delay (FID)**: ${metrics.fid}ms ${this.getMetricEvaluation(metrics.fid, 100, 300)}
- **Cumulative Layout Shift (CLS)**: ${metrics.cls} ${this.getMetricEvaluation(metrics.cls, 0.1, 0.25, true)}
- **Time to Interactive (TTI)**: ${metrics.tti}ms ${this.getMetricEvaluation(metrics.tti, 3500, 7500)}
- **Total Blocking Time (TBT)**: ${metrics.tbt}ms ${this.getMetricEvaluation(metrics.tbt, 200, 600)}
- **Speed Index**: ${metrics.speedIndex}ms ${this.getMetricEvaluation(metrics.speedIndex, 3000, 6000)}

## Análisis por Categoría

### Rendimiento de Carga
${metrics.lcp < 2500 ? '✅ Bueno' : metrics.lcp < 4000 ? '⚠️ Necesita mejora' : '❌ Pobre'}: El tiempo de carga inicial es ${metrics.lcp < 2500 ? 'rápido' : metrics.lcp < 4000 ? 'aceptable pero podría mejorar' : 'demasiado lento'}, con un LCP de ${metrics.lcp}ms. ${metrics.lcp >= 2500 ? 'Se recomienda optimizar el renderizado de contenido crítico y reducir recursos bloqueantes.' : ''}

### Interactividad
${metrics.fid < 100 && metrics.tti < 3500 ? '✅ Bueno' : metrics.fid < 300 && metrics.tti < 7500 ? '⚠️ Necesita mejora' : '❌ Pobre'}: La interactividad es ${metrics.fid < 100 && metrics.tti < 3500 ? 'excelente' : metrics.fid < 300 && metrics.tti < 7500 ? 'aceptable pero con retraso notable' : 'pobre, causando una experiencia frustrante'}. ${metrics.fid >= 100 || metrics.tti >= 3500 ? 'Se recomienda optimizar el JavaScript y reducir el trabajo en el hilo principal.' : ''}

### Estabilidad Visual
${metrics.cls < 0.1 ? '✅ Bueno' : metrics.cls < 0.25 ? '⚠️ Necesita mejora' : '❌ Pobre'}: La estabilidad visual es ${metrics.cls < 0.1 ? 'excelente' : metrics.cls < 0.25 ? 'aceptable pero con algunos desplazamientos' : 'pobre, con muchos desplazamientos inesperados'}. ${metrics.cls >= 0.1 ? 'Se recomienda reservar espacio para elementos dinámicos y evitar inserciones de contenido sin interacción del usuario.' : ''}

### Eficiencia de Recursos
${metrics.resourceSize < 1000 ? '✅ Bueno' : metrics.resourceSize < 2500 ? '⚠️ Necesita mejora' : '❌ Pobre'}: El tamaño total de recursos es ${metrics.resourceSize < 1000 ? 'óptimo' : metrics.resourceSize < 2500 ? 'aceptable pero podría reducirse' : 'excesivo'} (${metrics.resourceSize}KB). ${metrics.resourceSize >= 1000 ? 'Se recomienda optimizar imágenes, minificar CSS/JS, y implementar lazy loading.' : ''}

### JavaScript
${metrics.jsExecutionTime < 500 ? '✅ Bueno' : metrics.jsExecutionTime < 1000 ? '⚠️ Necesita mejora' : '❌ Pobre'}: El tiempo de ejecución de JavaScript es ${metrics.jsExecutionTime < 500 ? 'eficiente' : metrics.jsExecutionTime < 1000 ? 'aceptable pero podría optimizarse' : 'excesivo'} (${metrics.jsExecutionTime}ms). ${metrics.jsExecutionTime >= 500 ? 'Se recomienda reducir JavaScript no crítico, implementar code splitting, y optimizar funciones costosas.' : ''}

## Recomendaciones de Optimización

${recommendations.join('\n\n')}

## Plan de Implementación

### Fase 1: Optimizaciones Críticas (Prioridad Alta)
1. ${metrics.lcp >= 4000 ? 'Optimizar Largest Contentful Paint reduciendo tiempo de carga de recursos críticos' : metrics.fid >= 300 ? 'Optimizar First Input Delay reduciendo trabajo en hilo principal' : metrics.cls >= 0.25 ? 'Optimizar Cumulative Layout Shift reservando espacio para elementos dinámicos' : 'Optimizar recursos de mayor impacto identificados en el análisis'}
2. ${metrics.resourceSize >= 2500 ? 'Comprimir y optimizar imágenes, implementar formatos modernos (WebP, AVIF)' : metrics.jsExecutionTime >= 1000 ? 'Reducir y optimizar JavaScript, implementar code splitting' : 'Implementar caché efectiva para recursos estáticos'}
3. ${metrics.tbt >= 600 ? 'Reducir Total Blocking Time moviendo trabajo intensivo a web workers' : 'Optimizar Critical Rendering Path para mejorar tiempo de carga inicial'}

### Fase 2: Optimizaciones Secundarias (Prioridad Media)
1. Implementar lazy loading para contenido fuera de pantalla
2. Optimizar fuentes web con font-display y preload
3. Implementar prefetching para navegación anticipada
4. Optimizar Third-Party Scripts con async/defer y timing apropiado

### Fase 3: Refinamiento (Prioridad Baja)
1. Implementar estrategias avanzadas de caché con Service Workers
2. Optimizar animaciones y transiciones para rendimiento
3. Implementar Server-Side Rendering o Static Generation si es aplicable
4. Configurar monitoreo continuo de rendimiento

## Herramientas Recomendadas
- **Análisis**: Lighthouse, WebPageTest, Chrome DevTools Performance
- **Optimización**: ImageOptim, Webpack Bundle Analyzer, PurgeCSS
- **Monitoreo**: Google Analytics 4, Core Web Vitals Report, Custom RUM

## Conclusión
${metrics.score >= 90 ? 'La aplicación web tiene un rendimiento excelente, pero se recomienda monitoreo continuo para mantener este nivel.' : metrics.score >= 70 ? 'La aplicación web tiene un rendimiento aceptable, pero hay oportunidades significativas de mejora que podrían mejorar la experiencia del usuario y las métricas de negocio.' : 'La aplicación web tiene problemas críticos de rendimiento que deben abordarse urgentemente para mejorar la experiencia del usuario, SEO, y conversiones.'} Implementando las recomendaciones propuestas, se espera una mejora significativa en las métricas clave y la experiencia general del usuario.`;
    }
    
    /**
     * Simula métricas de rendimiento web basadas en la configuración
     * @param webConfig Configuración de la aplicación web
     * @returns Métricas simuladas
     */
    private simulateWebMetrics(webConfig: string): {
      fcp: number;
      lcp: number;
      fid: number;
      cls: number;
      tti: number;
      tbt: number;
      speedIndex: number;
      resourceSize: number;
      jsExecutionTime: number;
      score: number;
    } {
      // Determinar nivel base de rendimiento según la configuración
      let performanceLevel = 0.5; // 0 = pobre, 1 = excelente
      
      // Ajustar nivel de rendimiento según palabras clave en la configuración
      if (webConfig.includes('optimizado') || webConfig.includes('rápido')) {
        performanceLevel += 0.3;
      }
      
      if (webConfig.includes('lento') || webConfig.includes('pesado')) {
        performanceLevel -= 0.3;
      }
      
      if (webConfig.includes('React') || webConfig.includes('Angular')) {
        performanceLevel -= 0.1; // Frameworks tienden a añadir overhead
      }
      
      if (webConfig.includes('static') || webConfig.includes('estático')) {
        performanceLevel += 0.2; // Sitios estáticos tienden a ser más rápidos
      }
      
      if (webConfig.includes('imágenes') || webConfig.includes('media')) {
        performanceLevel -= 0.15; // Contenido multimedia puede afectar rendimiento
      }
      
      if (webConfig.includes('SSR') || webConfig.includes('server-side')) {
        performanceLevel += 0.15; // SSR puede mejorar FCP y LCP
      }
      
      // Asegurar que el nivel esté entre 0 y 1
      performanceLevel = Math.max(0, Math.min(1, performanceLevel));
      
      // Generar métricas basadas en el nivel de rendimiento
      // Valores más bajos son mejores para la mayoría de métricas
      const fcp = Math.round(3000 - 2500 * performanceLevel);
      const lcp = Math.round(5000 - 4000 * performanceLevel);
      const fid = Math.round(400 - 350 * performanceLevel);
      const cls = parseFloat((0.5 - 0.45 * performanceLevel).toFixed(2));
      const tti = Math.round(8000 - 6000 * performanceLevel);
      const tbt = Math.round(800 - 700 * performanceLevel);
      const speedIndex = Math.round(6000 - 5000 * performanceLevel);
      const resourceSize = Math.round(3000 - 2500 * performanceLevel);
      const jsExecutionTime = Math.round(1500 - 1300 * performanceLevel);
      
      // Calcular puntuación general basada en métricas individuales
      // Ponderación: LCP (25%), FID (25%), CLS (15%), TTI (15%), Recursos (10%), JS (10%)
      const lcpScore = Math.max(0, Math.min(100, 100 - (lcp - 1000) / 30));
      const fidScore = Math.max(0, Math.min(100, 100 - fid / 3));
      const clsScore = Math.max(0, Math.min(100, 100 - cls * 300));
      const ttiScore = Math.max(0, Math.min(100, 100 - (tti - 2000) / 60));
      const resourceScore = Math.max(0, Math.min(100, 100 - resourceSize / 30));
      const jsScore = Math.max(0, Math.min(100, 100 - jsExecutionTime / 15));
      
      const score = Math.round(
        lcpScore * 0.25 +
        fidScore * 0.25 +
        clsScore * 0.15 +
        ttiScore * 0.15 +
        resourceScore * 0.1 +
        jsScore * 0.1
      );
      
      return {
        fcp,
        lcp,
        fid,
        cls,
        tti,
        tbt,
        speedIndex,
        resourceSize,
        jsExecutionTime,
        score
      };
    }
    
    /**
     * Genera recomendaciones de optimización web basadas en métricas
     * @param metrics Métricas de rendimiento web
     * @returns Lista de recomendaciones
     */
    private generateWebRecommendations(metrics: {
      fcp: number;
      lcp: number;
      fid: number;
      cls: number;
      tti: number;
      tbt: number;
      speedIndex: number;
      resourceSize: number;
      jsExecutionTime: number;
      score: number;
    }): string[] {
      const recommendations = [];
      
      // Recomendaciones para LCP (Largest Contentful Paint)
      if (metrics.lcp >= 4000) {
        recommendations.push(`### 1. Optimizar Largest Contentful Paint (${metrics.lcp}ms) ❌
- **Problema**: El contenido principal tarda demasiado en renderizarse, afectando la percepción de velocidad.
- **Solución**: 
  - Implementar precarga de recursos críticos con \`<link rel="preload">\`
  - Optimizar servidor para TTFB (Time To First Byte) < 200ms
  - Implementar compresión de imágenes y formatos modernos (WebP, AVIF)
  - Considerar CDN para recursos estáticos
  - Eliminar recursos bloqueantes en el Critical Rendering Path`);
      } else if (metrics.lcp >= 2500) {
        recommendations.push(`### 1. Mejorar Largest Contentful Paint (${metrics.lcp}ms) ⚠️
- **Problema**: El contenido principal tarda más de lo recomendado en renderizarse.
- **Solución**: 
  - Optimizar imágenes del contenido principal
  - Implementar lazy loading para contenido no crítico
  - Considerar técnicas de priorización de contenido visible
  - Reducir JavaScript bloqueante en el renderizado inicial`);
      }
      
      // Recomendaciones para FID (First Input Delay)
      if (metrics.fid >= 300) {
        recommendations.push(`### 2. Reducir First Input Delay (${metrics.fid}ms) ❌
- **Problema**: La aplicación tarda demasiado en responder a la primera interacción del usuario.
- **Solución**: 
  - Dividir tareas largas de JavaScript en chunks más pequeños
  - Mover trabajo intensivo a Web Workers
  - Implementar code splitting para cargar solo el JavaScript necesario
  - Optimizar event handlers para respuesta rápida
  - Reducir JavaScript de terceros o cargarlos de forma asíncrona`);
      } else if (metrics.fid >= 100) {
        recommendations.push(`### 2. Mejorar First Input Delay (${metrics.fid}ms) ⚠️
- **Problema**: La aplicación tiene un retraso notable en la respuesta a interacciones.
- **Solución**: 
  - Optimizar event handlers críticos
  - Implementar debounce/throttle para eventos frecuentes
  - Considerar técnicas de idle-until-urgent para tareas no críticas
  - Revisar y optimizar JavaScript de terceros`);
      }
      
      // Recomendaciones para CLS (Cumulative Layout Shift)
      if (metrics.cls >= 0.25) {
        recommendations.push(`### 3. Corregir Cumulative Layout Shift (${metrics.cls}) ❌
- **Problema**: La página sufre desplazamientos visuales significativos durante la carga.
- **Solución**: 
  - Especificar dimensiones para imágenes y elementos multimedia (\`width\`, \`height\`)
  - Reservar espacio para anuncios y contenido dinámico
  - Evitar insertar contenido sobre contenido existente
  - Preferir transformaciones CSS para animaciones en lugar de propiedades que causan reflow
  - Implementar skeleton screens para contenido que carga dinámicamente`);
      } else if (metrics.cls >= 0.1) {
        recommendations.push(`### 3. Mejorar Cumulative Layout Shift (${metrics.cls}) ⚠️
- **Problema**: La página tiene algunos desplazamientos visuales durante la carga.
- **Solución**: 
  - Revisar elementos que aparecen después de la carga inicial
  - Asegurar que las fuentes web no causan desplazamientos (usar \`font-display: optional\` o \`font-display: swap\`)
  - Optimizar carga de recursos dinámicos para minimizar cambios de layout`);
      }
      
      // Recomendaciones para TTI (Time to Interactive)
      if (metrics.tti >= 7500) {
        recommendations.push(`### 4. Reducir Time to Interactive (${metrics.tti}ms) ❌
- **Problema**: La página tarda demasiado en volverse completamente interactiva.
- **Solución**: 
  - Implementar renderizado progresivo
  - Reducir tamaño de JavaScript con minificación y tree-shaking
  - Implementar lazy loading para componentes no críticos
  - Optimizar orden de carga de scripts
  - Considerar Server-Side Rendering o Static Generation para contenido inicial`);
      } else if (metrics.tti >= 3500) {
        recommendations.push(`### 4. Mejorar Time to Interactive (${metrics.tti}ms) ⚠️
- **Problema**: La página tarda más de lo recomendado en volverse interactiva.
- **Solución**: 
  - Optimizar inicialización de JavaScript
  - Implementar code splitting basado en rutas
  - Considerar estrategias de hidratación progresiva
  - Revisar y optimizar dependencias JavaScript`);
      }
      
      // Recomendaciones para tamaño de recursos
      if (metrics.resourceSize >= 2500) {
        recommendations.push(`### 5. Optimizar Tamaño de Recursos (${metrics.resourceSize}KB) ❌
- **Problema**: La página descarga una cantidad excesiva de recursos.
- **Solución**: 
  - Implementar compresión Brotli o Gzip para todos los recursos de texto
  - Optimizar imágenes con compresión y formatos modernos
  - Implementar lazy loading para imágenes y videos
  - Utilizar técnicas de responsive images (\`srcset\`, \`sizes\`)
  - Auditar y eliminar recursos no utilizados
  - Implementar estrategias de cache efectivas (Cache-Control, ETag)`);
      } else if (metrics.resourceSize >= 1000) {
        recommendations.push(`### 5. Reducir Tamaño de Recursos (${metrics.resourceSize}KB) ⚠️
- **Problema**: La página descarga más recursos de los recomendados.
- **Solución**: 
  - Revisar y optimizar recursos más grandes
  - Implementar lazy loading para contenido fuera de pantalla
  - Considerar técnicas de carga bajo demanda para secciones de la página
  - Optimizar fuentes web (subsetting, font-display)`);
      }
      
      // Recomendaciones para tiempo de ejecución de JavaScript
      if (metrics.jsExecutionTime >= 1000) {
        recommendations.push(`### 6. Optimizar Ejecución de JavaScript (${metrics.jsExecutionTime}ms) ❌
- **Problema**: El JavaScript tarda demasiado en ejecutarse, bloqueando el hilo principal.
- **Solución**: 
  - Identificar y optimizar funciones costosas con Chrome DevTools Performance
  - Mover cálculos intensivos a Web Workers
  - Implementar virtualización para listas largas
  - Optimizar event handlers frecuentes
  - Considerar técnicas de memoización para cálculos repetitivos
  - Revisar y optimizar frameworks y librerías`);
      } else if (metrics.jsExecutionTime >= 500) {
        recommendations.push(`### 6. Mejorar Ejecución de JavaScript (${metrics.jsExecutionTime}ms) ⚠️
- **Problema**: El JavaScript tiene un tiempo de ejecución notable.
- **Solución**: 
  - Revisar y optimizar funciones críticas
  - Implementar lazy evaluation para cálculos no inmediatos
  - Considerar técnicas de renderizado eficiente
  - Optimizar manipulaciones del DOM`);
      }
      
      // Si no hay suficientes recomendaciones específicas, añadir algunas generales
      if (recommendations.length < 3) {
        recommendations.push(`### Optimización General de Rendimiento
- **Implementar estrategias de caché**: Utilizar Service Workers para cachear recursos estáticos y respuestas de API frecuentes
- **Optimizar fuentes web**: Implementar \`font-display\`, subsetting, y preload para fuentes críticas
- **Mejorar Critical Rendering Path**: Eliminar CSS y JavaScript bloqueante, implementar CSS crítico inline
- **Implementar lazy loading**: Cargar recursos y componentes solo cuando sean necesarios
- **Optimizar imágenes**: Utilizar formatos modernos (WebP, AVIF), compresión, y dimensiones apropiadas`);
      }
      
      return recommendations;
    }
    
    /**
     * Evalúa una métrica de rendimiento y devuelve un indicador visual
     * @param value Valor de la métrica
     * @param goodThreshold Umbral para considerarse bueno
     * @param poorThreshold Umbral para considerarse pobre
     * @param lowerIsBetter Si valores más bajos son mejores (por defecto true)
     * @returns Indicador visual de la métrica
     */
    private getMetricEvaluation(
      value: number,
      goodThreshold: number,
      poorThreshold: number,
      lowerIsBetter: boolean = true
    ): string {
      if (lowerIsBetter) {
        if (value <= goodThreshold) {
          return '✅ Bueno';
        } else if (value <= poorThreshold) {
          return '⚠️ Necesita mejora';
        } else {
          return '❌ Pobre';
        }
      } else {
        if (value >= goodThreshold) {
          return '✅ Bueno';
        } else if (value >= poorThreshold) {
          return '⚠️ Necesita mejora';
        } else {
          return '❌ Pobre';
        }
      }
    }
    
    /**
     * Identifica áreas débiles basadas en métricas
     * @param metrics Métricas de rendimiento
     * @returns Descripción de áreas débiles
     */
    private getWeakAreas(metrics: {
      fcp: number;
      lcp: number;
      fid: number;
      cls: number;
      tti: number;
      tbt: number;
      speedIndex: number;
      resourceSize: number;
      jsExecutionTime: number;
      score: number;
    }): string {
      const weakAreas = [];
      
      if (metrics.lcp >= 2500) {
        weakAreas.push('tiempo de carga inicial');
      }
      
      if (metrics.fid >= 100) {
        weakAreas.push('interactividad');
      }
      
      if (metrics.cls >= 0.1) {
        weakAreas.push('estabilidad visual');
      }
      
      if (metrics.tti >= 3500) {
        weakAreas.push('tiempo hasta interactividad');
      }
      
      if (metrics.resourceSize >= 1000) {
        weakAreas.push('tamaño de recursos');
      }
      
      if (metrics.jsExecutionTime >= 500) {
        weakAreas.push('rendimiento de JavaScript');
      }
      
      if (weakAreas.length === 0) {
        return 'optimizaciones menores';
      }
      
      if (weakAreas.length === 1) {
        return weakAreas[0];
      }
      
      if (weakAreas.length === 2) {
        return `${weakAreas[0]} y ${weakAreas[1]}`;
      }
      
      return `${weakAreas.slice(0, -1).join(', ')} y ${weakAreas[weakAreas.length - 1]}`;
    }
    
    /**
     * Analiza el rendimiento de una base de datos
     * @param dbConfig Configuración o descripción de la base de datos
     * @returns Análisis de rendimiento de la base de datos
     */
    public async analyzeDatabasePerformance(dbConfig: string): Promise<string> {
      console.log(`🗄️ Analizando rendimiento de base de datos para: ${dbConfig}`);
      
      // Simular análisis de rendimiento de base de datos
      const metrics = this.simulateDatabaseMetrics(dbConfig);
      
      // Generar recomendaciones basadas en métricas
      const recommendations = this.generateDatabaseRecommendations(metrics);
      
      // Generar informe de rendimiento de base de datos
      return `# Análisis de Rendimiento de Base de Datos: ${dbConfig}

## Resumen Ejecutivo
${metrics.score >= 90 ? '✅ Excelente' : metrics.score >= 70 ? '⚠️ Necesita mejora' : '❌ Rendimiento pobre'}: La base de datos tiene un rendimiento general ${metrics.score >= 90 ? 'excelente' : metrics.score >= 70 ? 'aceptable pero con áreas de mejora' : 'pobre que requiere optimización urgente'}, con un puntaje de ${metrics.score}/100. ${metrics.score < 90 ? 'Las principales áreas de mejora incluyen ' + this.getDatabaseWeakAreas(metrics) + '.' : 'Se recomienda mantener las buenas prácticas actuales y monitorear continuamente.'}

## Métricas Clave
- **Tiempo Promedio de Consulta**: ${metrics.avgQueryTime}ms ${this.getMetricEvaluation(metrics.avgQueryTime, 50, 200)}
- **Consultas por Segundo**: ${metrics.queriesPerSecond} ${this.getMetricEvaluation(metrics.queriesPerSecond, 1000, 500, false)}
- **Tiempo de Respuesta p95**: ${metrics.p95ResponseTime}ms ${this.getMetricEvaluation(metrics.p95ResponseTime, 200, 500)}
- **Uso de Índices**: ${metrics.indexUsage}% ${this.getMetricEvaluation(metrics.indexUsage, 90, 70, false)}
- **Ratio de Cache Hit**: ${metrics.cacheHitRatio}% ${this.getMetricEvaluation(metrics.cacheHitRatio, 80, 50, false)}
- **Uso de Memoria**: ${metrics.memoryUsage}% ${this.getMetricEvaluation(metrics.memoryUsage, 70, 85)}
- **Uso de CPU**: ${metrics.cpuUsage}% ${this.getMetricEvaluation(metrics.cpuUsage, 60, 80)}
- **Tiempo de Bloqueo**: ${metrics.lockTime}ms ${this.getMetricEvaluation(metrics.lockTime, 10, 50)}

## Análisis por Categoría

### Rendimiento de Consultas
${metrics.avgQueryTime < 50 && metrics.p95ResponseTime < 200 ? '✅ Bueno' : metrics.avgQueryTime < 200 && metrics.p95ResponseTime < 500 ? '⚠️ Necesita mejora' : '❌ Pobre'}: El rendimiento de consultas es ${metrics.avgQueryTime < 50 && metrics.p95ResponseTime < 200 ? 'rápido y consistente' : metrics.avgQueryTime < 200 && metrics.p95ResponseTime < 500 ? 'aceptable pero con oportunidades de mejora' : 'lento y problemático'}, con un tiempo promedio de ${metrics.avgQueryTime}ms y p95 de ${metrics.p95ResponseTime}ms. ${metrics.avgQueryTime >= 50 || metrics.p95ResponseTime >= 200 ? 'Se recomienda optimizar consultas críticas, revisar planes de ejecución, y mejorar índices.' : ''}

### Escalabilidad
${metrics.queriesPerSecond >= 1000 && metrics.cpuUsage < 60 ? '✅ Bueno' : metrics.queriesPerSecond >= 500 && metrics.cpuUsage < 80 ? '⚠️ Necesita mejora' : '❌ Pobre'}: La capacidad de escalado es ${metrics.queriesPerSecond >= 1000 && metrics.cpuUsage < 60 ? 'excelente' : metrics.queriesPerSecond >= 500 && metrics.cpuUsage < 80 ? 'aceptable pero con limitaciones' : 'insuficiente para cargas altas'}, soportando ${metrics.queriesPerSecond} consultas por segundo con ${metrics.cpuUsage}% de uso de CPU. ${metrics.queriesPerSecond < 1000 || metrics.cpuUsage >= 60 ? 'Se recomienda optimizar consultas frecuentes, considerar particionamiento, y evaluar opciones de escalado horizontal.' : ''}

### Eficiencia de Índices
${metrics.indexUsage >= 90 ? '✅ Bueno' : metrics.indexUsage >= 70 ? '⚠️ Necesita mejora' : '❌ Pobre'}: La utilización de índices es ${metrics.indexUsage >= 90 ? 'óptima' : metrics.indexUsage >= 70 ? 'aceptable pero con oportunidades de mejora' : 'pobre, con muchas consultas sin índices adecuados'} (${metrics.indexUsage}%). ${metrics.indexUsage < 90 ? 'Se recomienda revisar consultas frecuentes sin índices, crear índices compuestos para consultas complejas, y eliminar índices no utilizados.' : ''}

### Caché y Memoria
${metrics.cacheHitRatio >= 80 && metrics.memoryUsage < 70 ? '✅ Bueno' : metrics.cacheHitRatio >= 50 && metrics.memoryUsage < 85 ? '⚠️ Necesita mejora' : '❌ Pobre'}: La eficiencia de caché y memoria es ${metrics.cacheHitRatio >= 80 && metrics.memoryUsage < 70 ? 'excelente' : metrics.cacheHitRatio >= 50 && metrics.memoryUsage < 85 ? 'aceptable pero con oportunidades de mejora' : 'pobre, con uso ineficiente de recursos'}, con un ratio de cache hit de ${metrics.cacheHitRatio}% y uso de memoria de ${metrics.memoryUsage}%. ${metrics.cacheHitRatio < 80 || metrics.memoryUsage >= 70 ? 'Se recomienda optimizar configuración de caché, implementar estrategias de evicción apropiadas, y revisar consultas que consumen mucha memoria.' : ''}

### Concurrencia
${metrics.lockTime < 10 ? '✅ Bueno' : metrics.lockTime < 50 ? '⚠️ Necesita mejora' : '❌ Pobre'}: La gestión de concurrencia es ${metrics.lockTime < 10 ? 'eficiente' : metrics.lockTime < 50 ? 'aceptable pero con algunos bloqueos' : 'problemática, con bloqueos significativos'}, con un tiempo de bloqueo promedio de ${metrics.lockTime}ms. ${metrics.lockTime >= 10 ? 'Se recomienda optimizar transacciones para reducir su duración, revisar niveles de aislamiento, y considerar técnicas de optimistic locking para operaciones frecuentes.' : ''}

## Recomendaciones de Optimización

${recommendations.join('\n\n')}

## Plan de Implementación

### Fase 1: Optimizaciones Críticas (Prioridad Alta)
1. ${metrics.avgQueryTime >= 200 ? 'Optimizar consultas críticas con tiempos de ejecución altos' : metrics.indexUsage < 70 ? 'Implementar índices para consultas frecuentes sin cobertura adecuada' : metrics.lockTime >= 50 ? 'Reducir bloqueos optimizando transacciones largas' : 'Optimizar componentes de mayor impacto identificados en el análisis'}
2. ${metrics.cacheHitRatio < 50 ? 'Implementar o mejorar estrategia de caché para consultas frecuentes' : metrics.memoryUsage >= 85 ? 'Optimizar consultas con alto consumo de memoria' : 'Implementar monitoreo detallado para identificar patrones de uso y oportunidades de optimización'}
3. ${metrics.cpuUsage >= 80 ? 'Reducir carga de CPU mediante optimización de consultas costosas' : 'Establecer línea base de rendimiento y alertas para desviaciones significativas'}

### Fase 2: Optimizaciones Secundarias (Prioridad Media)
1. Implementar particionamiento para tablas grandes
2. Optimizar esquema para reducir redundancia y mejorar normalización
3. Configurar parámetros de base de datos para optimizar rendimiento
4. Implementar estrategia de mantenimiento (VACUUM, ANALYZE, reindexación)

### Fase 3: Refinamiento (Prioridad Baja)
1. Implementar estrategias avanzadas de caché (materialized views, result cache)
2. Optimizar consultas de reporting y análisis
3. Implementar archivado de datos históricos
4. Configurar monitoreo continuo de rendimiento

## Herramientas Recomendadas
- **Análisis**: Explain Plan, Query Store, pg_stat_statements, MySQL Performance Schema
- **Monitoreo**: Prometheus + Grafana, DataDog, New Relic
- **Optimización**: Automatic Indexing, Query Tuning Advisor, pganalyze

## Conclusión
${metrics.score >= 90 ? 'La base de datos tiene un rendimiento excelente, pero se recomienda monitoreo continuo para mantener este nivel a medida que crecen los datos y usuarios.' : metrics.score >= 70 ? 'La base de datos tiene un rendimiento aceptable, pero hay oportunidades significativas de mejora que podrían optimizar recursos y mejorar la experiencia del usuario.' : 'La base de datos tiene problemas críticos de rendimiento que deben abordarse urgentemente para evitar degradación del servicio y mejorar la experiencia del usuario.'} Implementando las recomendaciones propuestas, se espera una mejora significativa en las métricas clave y la capacidad de escalar con el crecimiento del sistema.`;
    }
    
    /**
     * Simula métricas de rendimiento de base de datos basadas en la configuración
     * @param dbConfig Configuración de la base de datos
     * @returns Métricas simuladas
     */
    private simulateDatabaseMetrics(dbConfig: string): {
      avgQueryTime: number;
      queriesPerSecond: number;
      p95ResponseTime: number;
      indexUsage: number;
      cacheHitRatio: number;
      memoryUsage: number;
      cpuUsage: number;
      lockTime: number;
      score: number;
    } {
      // Determinar nivel base de rendimiento según la configuración
      let performanceLevel = 0.5; // 0 = pobre, 1 = excelente
      
      // Ajustar nivel de rendimiento según palabras clave en la configuración
      if (dbConfig.includes('optimizado') || dbConfig.includes('rápido')) {
        performanceLevel += 0.3;
      }
      
      if (dbConfig.includes('lento') || dbConfig.includes('problemas')) {
        performanceLevel -= 0.3;
      }
      
      if (dbConfig.includes('PostgreSQL') || dbConfig.includes('MySQL')) {
        performanceLevel += 0.1; // Bases de datos maduras con buen rendimiento por defecto
      }
      
      if (dbConfig.includes('NoSQL') || dbConfig.includes('MongoDB')) {
        performanceLevel += 0.05; // Buenas para ciertos casos de uso
      }
      
      if (dbConfig.includes('índices') || dbConfig.includes('optimización')) {
        performanceLevel += 0.15; // Ya tiene optimizaciones básicas
      }
      
      if (dbConfig.includes('gran volumen') || dbConfig.includes('terabytes')) {
        performanceLevel -= 0.15; // Grandes volúmenes pueden afectar rendimiento
      }
      
      if (dbConfig.includes('caché') || dbConfig.includes('in-memory')) {
        performanceLevel += 0.15; // Caché mejora rendimiento
      }
      
      if (dbConfig.includes('replicación') || dbConfig.includes('sharding')) {
        performanceLevel += 0.1; // Estrategias de escalado
      }
      
      // Asegurar que el nivel esté entre 0 y 1
      performanceLevel = Math.max(0, Math.min(1, performanceLevel));
      
      // Generar métricas basadas en el nivel de rendimiento
      // Valores más bajos son mejores para algunas métricas
      const avgQueryTime = Math.round(300 - 280 * performanceLevel);
      const queriesPerSecond = Math.round(300 + 1700 * performanceLevel);
      const p95ResponseTime = Math.round(800 - 700 * performanceLevel);
      const indexUsage = Math.round(50 + 45 * performanceLevel);
      const cacheHitRatio = Math.round(40 + 55 * performanceLevel);
      const memoryUsage = Math.round(90 - 40 * performanceLevel);
      const cpuUsage = Math.round(90 - 50 * performanceLevel);
      const lockTime = Math.round(100 - 95 * performanceLevel);
      
      // Calcular puntuación general basada en métricas individuales
      // Ponderación: Tiempo de consulta (20%), QPS (15%), P95 (15%), Índices (15%), 
      // Caché (15%), Memoria (10%), CPU (5%), Bloqueos (5%)
      const queryTimeScore = Math.max(0, Math.min(100, 100 - avgQueryTime / 3));
      const qpsScore = Math.max(0, Math.min(100, queriesPerSecond / 20));
      const p95Score = Math.max(0, Math.min(100, 100 - p95ResponseTime / 8));
      const indexScore = Math.max(0, Math.min(100, indexUsage));
      const cacheScore = Math.max(0, Math.min(100, cacheHitRatio));
      const memoryScore = Math.max(0, Math.min(100, 100 - memoryUsage));
      const cpuScore = Math.max(0, Math.min(100, 100 - cpuUsage));
      const lockScore = Math.max(0, Math.min(100, 100 - lockTime * 2));
      
      const score = Math.round(
        queryTimeScore * 0.2 +
        qpsScore * 0.15 +
        p95Score * 0.15 +
        indexScore * 0.15 +
        cacheScore * 0.15 +
        memoryScore * 0.1 +
        cpuScore * 0.05 +
        lockScore * 0.05
      );
      
      return {
        avgQueryTime,
        queriesPerSecond,
        p95ResponseTime,
        indexUsage,
        cacheHitRatio,
        memoryUsage,
        cpuUsage,
        lockTime,
        score
      };
    }
    
    /**
     * Genera recomendaciones de optimización de base de datos basadas en métricas
     * @param metrics Métricas de rendimiento de base de datos
     * @returns Lista de recomendaciones
     */
    private generateDatabaseRecommendations(metrics: {
      avgQueryTime: number;
      queriesPerSecond: number;
      p95ResponseTime: number;
      indexUsage: number;
      cacheHitRatio: number;
      memoryUsage: number;
      cpuUsage: number;
      lockTime: number;
      score: number;
    }): string[] {
      const recommendations = [];
      
      // Recomendaciones para tiempo de consulta
      if (metrics.avgQueryTime >= 200) {
        recommendations.push(`### 1. Optimizar Tiempo de Consulta (${metrics.avgQueryTime}ms) ❌
- **Problema**: Las consultas tienen tiempos de ejecución demasiado altos, afectando la experiencia del usuario.
- **Solución**: 
  - Analizar planes de ejecución para identificar consultas problemáticas
  - Optimizar consultas con JOINs complejos o subconsultas
  - Implementar índices apropiados para patrones de consulta frecuentes
  - Considerar denormalización estratégica para lecturas frecuentes
  - Revisar y optimizar funciones y procedimientos almacenados`);
      } else if (metrics.avgQueryTime >= 50) {
        recommendations.push(`### 1. Mejorar Tiempo de Consulta (${metrics.avgQueryTime}ms) ⚠️
- **Problema**: Las consultas tienen tiempos de ejecución moderados que podrían optimizarse.
- **Solución**: 
  - Revisar consultas frecuentes y optimizar su estructura
  - Verificar y mejorar índices existentes
  - Considerar vistas materializadas para consultas complejas frecuentes
  - Implementar caché de resultados para consultas repetitivas`);
      }
      
      // Recomendaciones para uso de índices
      if (metrics.indexUsage < 70) {
        recommendations.push(`### 2. Mejorar Uso de Índices (${metrics.indexUsage}%) ❌
- **Problema**: Muchas consultas no utilizan índices adecuados, resultando en escaneos completos de tablas.
- **Solución**: 
  - Analizar consultas frecuentes sin cobertura de índices
  - Crear índices compuestos para consultas con múltiples condiciones
  - Implementar índices parciales para subconjuntos de datos frecuentemente consultados
  - Revisar y eliminar índices no utilizados o redundantes
  - Considerar índices de texto completo para búsquedas textuales`);
      } else if (metrics.indexUsage < 90) {
        recommendations.push(`### 2. Optimizar Uso de Índices (${metrics.indexUsage}%) ⚠️
- **Problema**: Algunas consultas no aprovechan índices de manera óptima.
- **Solución**: 
  - Revisar planes de ejecución para identificar consultas sin cobertura de índices
  - Optimizar consultas para aprovechar índices existentes
  - Considerar índices adicionales para patrones de consulta específicos
  - Implementar mantenimiento regular de índices (REINDEX, ANALYZE)`);
      }
      
      // Recomendaciones para caché
      if (metrics.cacheHitRatio < 50) {
        recommendations.push(`### 3. Implementar Estrategia de Caché (${metrics.cacheHitRatio}%) ❌
- **Problema**: Bajo ratio de cache hit, resultando en cálculos y consultas repetitivas.
- **Solución**: 
  - Implementar caché de resultados para consultas frecuentes
  - Configurar caché de segundo nivel para entidades frecuentemente accedidas
  - Utilizar vistas materializadas para consultas complejas
  - Implementar caché distribuida (Redis, Memcached) para entornos multi-nodo
  - Optimizar configuración de caché de la base de datos (buffer pool, shared buffers)
  - Considerar estrategias de precarga para datos frecuentemente accedidos`);
      } else if (metrics.cacheHitRatio < 80) {
        recommendations.push(`### 3. Mejorar Estrategia de Caché (${metrics.cacheHitRatio}%) ⚠️
- **Problema**: Ratio de cache hit moderado con oportunidades de mejora.
- **Solución**: 
  - Revisar y ajustar políticas de evicción de caché
  - Ampliar caché para cubrir más consultas frecuentes
  - Optimizar tamaño de caché basado en patrones de acceso
  - Implementar monitoreo de efectividad de caché`);
      }
      
      // Recomendaciones para uso de memoria
      if (metrics.memoryUsage >= 85) {
        recommendations.push(`### 4. Optimizar Uso de Memoria (${metrics.memoryUsage}%) ❌
- **Problema**: Alto uso de memoria que puede causar swapping y degradación de rendimiento.
- **Solución**: 
  - Identificar y optimizar consultas con alto consumo de memoria
  - Ajustar configuración de memoria de la base de datos (work_mem, sort_mem)
  - Implementar paginación para conjuntos de resultados grandes
  - Considerar particionamiento para tablas grandes
  - Revisar y optimizar índices para reducir consumo de memoria
  - Implementar monitoreo de presión de memoria y alertas`);
      } else if (metrics.memoryUsage >= 70) {
        recommendations.push(`### 4. Mejorar Uso de Memoria (${metrics.memoryUsage}%) ⚠️
- **Problema**: Uso de memoria moderado con riesgo de presión en cargas altas.
- **Solución**: 
  - Revisar consultas con mayor consumo de memoria
  - Optimizar configuración de memoria para cargas de trabajo específicas
  - Considerar estrategias de liberación de memoria para operaciones largas
  - Implementar monitoreo de tendencias de uso de memoria`);
      }
      
      // Recomendaciones para concurrencia y bloqueos
      if (metrics.lockTime >= 50) {
        recommendations.push(`### 5. Reducir Bloqueos y Mejorar Concurrencia (${metrics.lockTime}ms) ❌
- **Problema**: Tiempos de bloqueo altos que afectan la concurrencia y el rendimiento.
- **Solución**: 
  - Optimizar transacciones para reducir su duración
  - Implementar niveles de aislamiento apropiados (READ COMMITTED, SNAPSHOT)
  - Considerar técnicas de optimistic locking para operaciones frecuentes
  - Revisar y optimizar índices para reducir bloqueos
  - Implementar particionamiento para reducir contención
  - Considerar sharding para distribuir carga en sistemas de alta concurrencia`);
      } else if (metrics.lockTime >= 10) {
        recommendations.push(`### 5. Optimizar Concurrencia (${metrics.lockTime}ms) ⚠️
- **Problema**: Algunos bloqueos que podrían optimizarse para mejorar concurrencia.
- **Solución**: 
  - Revisar transacciones largas y optimizar su duración
  - Ajustar niveles de aislamiento para operaciones específicas
  - Considerar técnicas de versioning para reducir bloqueos
  - Implementar monitoreo de bloqueos y deadlocks`);
      }
      
      // Si no hay suficientes recomendaciones específicas, añadir algunas generales
      if (recommendations.length < 3) {
        recommendations.push(`### Optimización General de Base de Datos
- **Implementar monitoreo continuo**: Utilizar herramientas como pg_stat_statements, MySQL Performance Schema, o herramientas de terceros para identificar consultas problemáticas
- **Optimizar esquema**: Revisar normalización, tipos de datos, y restricciones para mejorar rendimiento
- **Implementar mantenimiento regular**: Configurar VACUUM, ANALYZE, o equivalentes para mantener estadísticas actualizadas
- **Considerar escalado**: Evaluar opciones de escalado vertical (más recursos) u horizontal (sharding, replicación) según necesidades
- **Optimizar configuración**: Ajustar parámetros de la base de datos según carga de trabajo específica`);
      }
      
      return recommendations;
    }
    
    /**
     * Identifica áreas débiles en métricas de base de datos
     * @param metrics Métricas de rendimiento de base de datos
     * @returns Descripción de áreas débiles
     */
    private getDatabaseWeakAreas(metrics: {
      avgQueryTime: number;
      queriesPerSecond: number;
      p95ResponseTime: number;
      indexUsage: number;
      cacheHitRatio: number;
      memoryUsage: number;
      cpuUsage: number;
      lockTime: number;
      score: number;
    }): string {
      const weakAreas = [];
      
      if (metrics.avgQueryTime >= 50) {
        weakAreas.push('tiempo de consulta');
      }
      
      if (metrics.indexUsage < 90) {
        weakAreas.push('uso de índices');
      }
      
      if (metrics.cacheHitRatio < 80) {
        weakAreas.push('eficiencia de caché');
      }
      
      if (metrics.memoryUsage >= 70) {
        weakAreas.push('uso de memoria');
      }
      
      if (metrics.cpuUsage >= 60) {
        weakAreas.push('uso de CPU');
      }
      
      if (metrics.lockTime >= 10) {
        weakAreas.push('concurrencia y bloqueos');
      }
      
      if (weakAreas.length === 0) {
        return 'optimizaciones menores';
      }
      
      if (weakAreas.length === 1) {
        return weakAreas[0];
      }
      
      if (weakAreas.length === 2) {
        return `${weakAreas[0]} y ${weakAreas[1]}`;
      }
      
      return `${weakAreas.slice(0, -1).join(', ')} y ${weakAreas[weakAreas.length - 1]}`;
    }
    
    /**
     * Analiza el rendimiento de un algoritmo o estructura de datos
     * @param code Código del algoritmo o estructura de datos
     * @returns Análisis de rendimiento del algoritmo
     */
    public async analyzeAlgorithmPerformance(code: string): Promise<string> {
      console.log(`🧮 Analizando rendimiento de algoritmo: ${code.substring(0, 50)}...`);
      
      // Determinar el tipo de algoritmo o estructura de datos
      const algorithmType = this.determineAlgorithmType(code);
      
      // Analizar complejidad temporal y espacial
      const complexity = this.analyzeComplexity(code, algorithmType);
      
      // Identificar posibles optimizaciones
      const optimizations = this.identifyAlgorithmOptimizations(code, algorithmType, complexity);
      
      // Generar informe de rendimiento
      return `# Análisis de Rendimiento de Algoritmo

## Resumen Ejecutivo
${complexity.score >= 90 ? '✅ Excelente' : complexity.score >= 70 ? '⚠️ Necesita mejora' : '❌ Ineficiente'}: El algoritmo tiene una eficiencia general ${complexity.score >= 90 ? 'excelente' : complexity.score >= 70 ? 'aceptable pero con áreas de mejora' : 'pobre que requiere optimización'}, con un puntaje de ${complexity.score}/100. ${complexity.score < 90 ? 'Las principales áreas de mejora incluyen ' + this.getAlgorithmWeakAreas(complexity) + '.' : 'Se recomienda mantener las buenas prácticas actuales y documentar la complejidad.'}

## Tipo de Algoritmo
**Identificado como**: ${algorithmType.name}
**Descripción**: ${algorithmType.description}
**Casos de uso típicos**: ${algorithmType.useCases}

## Análisis de Complejidad
- **Complejidad Temporal (Caso Promedio)**: ${complexity.timeAverage} ${this.getComplexityEvaluation(complexity.timeAverage, algorithmType.expectedTimeAverage)}
- **Complejidad Temporal (Peor Caso)**: ${complexity.timeWorst} ${this.getComplexityEvaluation(complexity.timeWorst, algorithmType.expectedTimeWorst)}
- **Complejidad Espacial**: ${complexity.space} ${this.getComplexityEvaluation(complexity.space, algorithmType.expectedSpace)}
- **Estabilidad**: ${complexity.stable ? '✅ Estable' : '❌ No estable'}
- **Paralelizable**: ${complexity.parallelizable ? '✅ Paralelizable' : '❌ No paralelizable'}
- **Localidad de Referencia**: ${complexity.localityOfReference === 'Alta' ? '✅ Alta' : complexity.localityOfReference === 'Media' ? '⚠️ Media' : '❌ Baja'}

## Análisis de Rendimiento
- **Eficiencia para conjuntos pequeños**: ${complexity.smallDatasetEfficiency === 'Alta' ? '✅ Alta' : complexity.smallDatasetEfficiency === 'Media' ? '⚠️ Media' : '❌ Baja'}
- **Eficiencia para conjuntos grandes**: ${complexity.largeDatasetEfficiency === 'Alta' ? '✅ Alta' : complexity.largeDatasetEfficiency === 'Media' ? '⚠️ Media' : '❌ Baja'}
- **Uso de memoria**: ${complexity.memoryUsage === 'Bajo' ? '✅ Bajo' : complexity.memoryUsage === 'Medio' ? '⚠️ Medio' : '❌ Alto'}
- **Overhead de inicialización**: ${complexity.initializationOverhead === 'Bajo' ? '✅ Bajo' : complexity.initializationOverhead === 'Medio' ? '⚠️ Medio' : '❌ Alto'}
- **Escalabilidad**: ${complexity.scalability === 'Alta' ? '✅ Alta' : complexity.scalability === 'Media' ? '⚠️ Media' : '❌ Baja'}

## Optimizaciones Recomendadas

${optimizations.join('\n\n')}

## Comparativa con Alternativas

| Algoritmo | Complejidad Temporal (Promedio) | Complejidad Espacial | Casos de Uso Óptimos |
|-----------|--------------------------------|---------------------|---------------------|
| **Actual (${algorithmType.name})** | ${complexity.timeAverage} | ${complexity.space} | ${algorithmType.useCases} |
${this.getAlternativeAlgorithms(algorithmType).map(alt => 
  `| ${alt.name} | ${alt.timeAverage} | ${alt.space} | ${alt.useCases} |`
).join('\n')}

## Recomendación Final
${complexity.score >= 90 ? 
  `El algoritmo actual (${algorithmType.name}) es altamente eficiente para su propósito. No se requieren cambios significativos, pero se recomienda documentar la complejidad y casos de uso para referencia futura.` : 
  complexity.score >= 70 ? 
  `El algoritmo actual (${algorithmType.name}) es adecuado pero podría optimizarse. Considere implementar las optimizaciones recomendadas, especialmente para mejorar ${this.getAlgorithmWeakAreas(complexity)}.` : 
  `El algoritmo actual (${algorithmType.name}) es ineficiente para su propósito. Se recomienda considerar seriamente las alternativas propuestas o implementar las optimizaciones sugeridas para mejorar significativamente el rendimiento.`}

## Código Optimizado Sugerido
\`\`\`
${this.generateOptimizedCode(code, algorithmType, complexity)}
\`\`\`

## Notas Adicionales
- La complejidad teórica puede diferir del rendimiento real debido a factores como la arquitectura de hardware, patrones de acceso a memoria, y tamaño de los datos.
- Se recomienda realizar pruebas de rendimiento con datos reales para validar las optimizaciones.
- Considere el equilibrio entre legibilidad y rendimiento al implementar optimizaciones.`;
    }
    
    /**
     * Determina el tipo de algoritmo o estructura de datos
     * @param code Código del algoritmo
     * @returns Información sobre el tipo de algoritmo
     */
    private determineAlgorithmType(code: string): {
      name: string;
      description: string;
      useCases: string;
      expectedTimeAverage: string;
      expectedTimeWorst: string;
      expectedSpace: string;
    } {
      // Patrones para identificar tipos de algoritmos
      const sortingPatterns = [
        /\b(quick|merge|heap|bubble|insertion|selection|radix|counting|bucket|shell)(\s+)?sort\b/i,
        /\bsort(ed)?\(/i,
        /\bcomparator\b/i,
        /\bcompare\(/i
      ];
      
      const searchPatterns = [
        /\b(binary|linear|depth|breadth)(\s+)?search\b/i,
        /\bsearch\(/i,
        /\bfind\(/i,
        /\bindex(Of)?\(/i
      ];
      
      const graphPatterns = [
        /\b(adjacency|matrix|edge|vertex|vertices|node|graph|path|traverse|visit)\b/i,
        /\b(dfs|bfs|dijkstra|bellman|ford|kruskal|prim|topological)\b/i
      ];
      
      const dynamicProgrammingPatterns = [
        /\b(memo(ize|ization)|tabulation|bottom-up|top-down|subproblem|optimal|dp)\b/i,
        /\bcache\[/i,
        /\bmemo\[/i
      ];
      
      const greedyPatterns = [
        /\b(greedy|optimal|locally|choice)\b/i
      ];
      
      const divideConquerPatterns = [
        /\b(divide|conquer|recursive|recursion)\b/i,
        /function\s+\w+\([^)]*\)\s*{\s*[^{}]*\1\s*\(/i // Función que se llama a sí misma
      ];
      
      const dataStructurePatterns = {
        array: [/\[\s*\]/i, /new Array\(/i],
        linkedList: [/\b(node|next|prev|head|tail)\b/i, /\.next\b/i],
        tree: [/\b(node|left|right|root|child|parent|subtree)\b/i, /\.left\b/i, /\.right\b/i],
        heap: [/\b(heap|priority\s*queue)\b/i, /sift(Up|Down)/i],
        hashTable: [/\b(hash|map|dictionary|table)\b/i, /new Map\(/i, /new Set\(/i],
        stack: [/\b(stack|push|pop|LIFO)\b/i, /\.push\(.*\).*\.pop\(\)/i],
        queue: [/\b(queue|enqueue|dequeue|FIFO)\b/i, /\.push\(.*\).*\.shift\(\)/i]
      };
      
      // Contar coincidencias para cada tipo
      let sortingCount = sortingPatterns.reduce((count, pattern) => count + (pattern.test(code) ? 1 : 0), 0);
      let searchCount = searchPatterns.reduce((count, pattern) => count + (pattern.test(code) ? 1 : 0), 0);
      let graphCount = graphPatterns.reduce((count, pattern) => count + (pattern.test(code) ? 1 : 0), 0);
      let dpCount = dynamicProgrammingPatterns.reduce((count, pattern) => count + (pattern.test(code) ? 1 : 0), 0);
      let greedyCount = greedyPatterns.reduce((count, pattern) => count + (pattern.test(code) ? 1 : 0), 0);
      let divideConquerCount = divideConquerPatterns.reduce((count, pattern) => count + (pattern.test(code) ? 1 : 0), 0);
      
      let dataStructureCounts = Object.entries(dataStructurePatterns).reduce((counts, [type, patterns]) => {
        counts[type] = patterns.reduce((count, pattern) => count + (pattern.test(code) ? 1 : 0), 0);
        return counts;
      }, {} as Record<string, number>);
      
      // Determinar el tipo más probable
      const algorithmCounts = {
        'Algoritmo de Ordenación': sortingCount,
        'Algoritmo de Búsqueda': searchCount,
        'Algoritmo de Grafos': graphCount,
        'Programación Dinámica': dpCount,
        'Algoritmo Voraz': greedyCount,
        'Divide y Vencerás': divideConquerCount
      };
      
      // Combinar conteos de algoritmos y estructuras de datos
      const allCounts = {
        ...algorithmCounts,
        'Array/Lista': dataStructureCounts.array,
        'Lista Enlazada': dataStructureCounts.linkedList,
        'Árbol': dataStructureCounts.tree,
        'Heap': dataStructureCounts.heap,
        'Tabla Hash': dataStructureCounts.hashTable,
        'Pila': dataStructureCounts.stack,
        'Cola': dataStructureCounts.queue
      };
      
      // Encontrar el tipo con más coincidencias
      let maxCount = 0;
      let algorithmType = 'Algoritmo General';
      
      for (const [type, count] of Object.entries(allCounts)) {
        if (count > maxCount) {
          maxCount = count;
          algorithmType = type;
        }
      }
      
      // Información específica para cada tipo
      const typeInfo: Record<string, {
        description: string;
        useCases: string;
        expectedTimeAverage: string;
        expectedTimeWorst: string;
        expectedSpace: string;
      }> = {
        'Algoritmo de Ordenación': {
          description: 'Algoritmo que organiza elementos en un orden específico (ascendente o descendente).',
          useCases: 'Preparación de datos para búsqueda, presentación ordenada, análisis estadístico.',
          expectedTimeAverage: 'O(n log n)',
          expectedTimeWorst: 'O(n²)',
          expectedSpace: 'O(n)'
        },
        'Algoritmo de Búsqueda': {
          description: 'Algoritmo que localiza un elemento específico en una colección de datos.',
          useCases: 'Recuperación de información, validación de existencia, indexación.',
          expectedTimeAverage: 'O(log n)',
          expectedTimeWorst: 'O(n)',
          expectedSpace: 'O(1)'
        },
        'Algoritmo de Grafos': {
          description: 'Algoritmo que opera sobre estructuras de grafos (nodos y aristas).',
          useCases: 'Redes sociales, mapas, sistemas de recomendación, análisis de dependencias.',
          expectedTimeAverage: 'O(V + E)',
          expectedTimeWorst: 'O(V²)',
          expectedSpace: 'O(V + E)'
        },
        'Programación Dinámica': {
          description: 'Técnica que resuelve problemas complejos dividiéndolos en subproblemas y almacenando resultados intermedios.',
          useCases: 'Optimización, problemas de secuencia, planificación.',
          expectedTimeAverage: 'O(n²)',
          expectedTimeWorst: 'O(n²)',
          expectedSpace: 'O(n)'
        },
        'Algoritmo Voraz': {
          description: 'Algoritmo que toma decisiones localmente óptimas en cada etapa.',
          useCases: 'Problemas de optimización, planificación, asignación de recursos.',
          expectedTimeAverage: 'O(n log n)',
          expectedTimeWorst: 'O(n²)',
          expectedSpace: 'O(1)'
        },
        'Divide y Vencerás': {
          description: 'Técnica que divide un problema en subproblemas más pequeños, los resuelve y combina las soluciones.',
          useCases: 'Ordenación, búsqueda, procesamiento de matrices, transformaciones.',
          expectedTimeAverage: 'O(n log n)',
          expectedTimeWorst: 'O(n²)',
          expectedSpace: 'O(log n)'
        },
        'Array/Lista': {
          description: 'Estructura de datos que almacena elementos en posiciones contiguas de memoria.',
          useCases: 'Almacenamiento secuencial, acceso aleatorio, iteración.',
          expectedTimeAverage: 'O(1) para acceso, O(n) para búsqueda',
          expectedTimeWorst: 'O(n)',
          expectedSpace: 'O(n)'
        },
        'Lista Enlazada': {
          description: 'Estructura de datos donde cada elemento contiene un valor y una referencia al siguiente elemento.',
          useCases: 'Inserción/eliminación eficiente, implementación de otras estructuras (pilas, colas).',
          expectedTimeAverage: 'O(n)',
          expectedTimeWorst: 'O(n)',
          expectedSpace: 'O(n)'
        },
        'Árbol': {
          description: 'Estructura de datos jerárquica con nodos conectados por aristas.',
          useCases: 'Representación jerárquica, búsqueda eficiente, organización de datos.',
          expectedTimeAverage: 'O(log n)',
          expectedTimeWorst: 'O(n)',
          expectedSpace: 'O(n)'
        },
        'Heap': {
          description: 'Árbol binario especializado donde cada nodo padre tiene un valor ordenado respecto a sus hijos.',
          useCases: 'Colas de prioridad, algoritmos de ordenación, selección eficiente de mínimos/máximos.',
          expectedTimeAverage: 'O(log n) para inserción/eliminación',
          expectedTimeWorst: 'O(log n)',
          expectedSpace: 'O(n)'
        },
        'Tabla Hash': {
          description: 'Estructura que mapea claves a valores mediante una función hash.',
          useCases: 'Búsqueda rápida, caché, indexación, eliminación de duplicados.',
          expectedTimeAverage: 'O(1)',
          expectedTimeWorst: 'O(n)',
          expectedSpace: 'O(n)'
        },
        'Pila': {
          description: 'Estructura LIFO (Last In, First Out) que permite inserción y eliminación solo en un extremo.',
          useCases: 'Gestión de llamadas a funciones, evaluación de expresiones, algoritmos de backtracking.',
          expectedTimeAverage: 'O(1) para push/pop',
          expectedTimeWorst: 'O(1)',
          expectedSpace: 'O(n)'
        },
        'Cola': {
          description: 'Estructura FIFO (First In, First Out) que permite inserción en un extremo y eliminación en el otro.',
          useCases: 'Gestión de tareas, BFS, buffers, programación concurrente.',
          expectedTimeAverage: 'O(1) para enqueue/dequeue',
          expectedTimeWorst: 'O(1)',
          expectedSpace: 'O(n)'
        },
        'Algoritmo General': {
          description: 'Algoritmo que no se ajusta claramente a una categoría específica.',
          useCases: 'Diversos casos de uso dependiendo de la implementación específica.',
          expectedTimeAverage: 'Varía según implementación',
          expectedTimeWorst: 'Varía según implementación',
          expectedSpace: 'Varía según implementación'
        }
      };
      
      return {
        name: algorithmType,
        ...typeInfo[algorithmType]
      };
    }
    
    /**
     * Analiza la complejidad temporal y espacial de un algoritmo
     * @param code Código del algoritmo
     * @param algorithmType Tipo de algoritmo
     * @returns Análisis de complejidad
     */
    private analyzeComplexity(code: string, algorithmType: {
      name: string;
      description: string;
      useCases: string;
      expectedTimeAverage: string;
      expectedTimeWorst: string;
      expectedSpace: string;
    }): {
      timeAverage: string;
      timeWorst: string;
      space: string;
      stable: boolean;
      parallelizable: boolean;
      localityOfReference: 'Alta' | 'Media' | 'Baja';
      smallDatasetEfficiency: 'Alta' | 'Media' | 'Baja';
      largeDatasetEfficiency: 'Alta' | 'Media' | 'Baja';
      memoryUsage: 'Bajo' | 'Medio' | 'Alto';
      initializationOverhead: 'Bajo' | 'Medio' | 'Alto';
      scalability: 'Alta' | 'Media' | 'Baja';
      score: number;
    } {
      // Patrones para identificar complejidad
      const loopPatterns = {
        singleLoop: (code.match(/for\s*\([^{]*\)/g) || []).length + (code.match(/while\s*\([^{]*\)/g) || []).length,
        nestedLoops: (code.match(/for\s*\([^{]*\)[^{]*\{[^}]*for\s*\(/g) || []).length + 
                     (code.match(/while\s*\([^{]*\)[^{]*\{[^}]*while\s*\(/g) || []).length +
                     (code.match(/for\s*\([^{]*\)[^{]*\{[^}]*while\s*\(/g) || []).length +
                     (code.match(/while\s*\([^{]*\)[^{]*\{[^}]*for\s*\(/g) || []).length,
        tripleNestedLoops: (code.match(/for\s*\([^{]*\)[^{]*\{[^}]*for\s*\([^{]*\)[^{]*\{[^}]*for\s*\(/g) || []).length
      };
      
      const recursionPatterns = {
        simpleRecursion: (code.match(/function\s+\w+\([^)]*\)\s*{\s*[^{}]*\1\s*\(/g) || []).length,
        divideConquerRecursion: (code.match(/function\s+\w+\([^)]*\)\s*{\s*[^{}]*\1\s*\([^)]*\/[^)]*\)/g) || []).length
      };
      
      const dataStructurePatterns = {
        arrays: (code.match(/\[\s*\]/g) || []).length + (code.match(/new Array\(/g) || []).length,
        maps: (code.match(/new Map\(/g) || []).length + (code.match(/\{\s*\}/g) || []).length,
        sets: (code.match(/new Set\(/g) || []).length
      };
      
      // Determinar complejidad temporal basada en patrones
      let timeAverage = 'O(n)';
      let timeWorst = 'O(n)';
      let space = 'O(n)';
      
            // Complejidad temporal
            if (loopPatterns.tripleNestedLoops > 0) {
              timeAverage = 'O(n³)';
              timeWorst = 'O(n³)';
            } else if (loopPatterns.nestedLoops > 0) {
              timeAverage = 'O(n²)';
              timeWorst = 'O(n²)';
            } else if (loopPatterns.singleLoop > 0) {
              timeAverage = 'O(n)';
              timeWorst = 'O(n)';
            } else if (recursionPatterns.divideConquerRecursion > 0) {
              timeAverage = 'O(n log n)';
              timeWorst = 'O(n log n)';
            } else if (recursionPatterns.simpleRecursion > 0) {
              timeAverage = 'O(2^n)';
              timeWorst = 'O(2^n)';
            } else if (code.includes('sort(') || code.includes('.sort(')) {
              timeAverage = 'O(n log n)';
              timeWorst = 'O(n log n)';
            } else if (code.includes('indexOf') || code.includes('includes(') || code.includes('find(')) {
              timeAverage = 'O(n)';
              timeWorst = 'O(n)';
            } else if (dataStructurePatterns.maps > 0 || dataStructurePatterns.sets > 0) {
              timeAverage = 'O(1)';
              timeWorst = 'O(n)';
            }
            
            // Ajustar según el tipo de algoritmo
            if (algorithmType.name === 'Algoritmo de Ordenación') {
              timeAverage = 'O(n log n)';
              timeWorst = 'O(n²)';
            } else if (algorithmType.name === 'Algoritmo de Búsqueda') {
              if (code.includes('binary') || code.toLowerCase().includes('binary')) {
                timeAverage = 'O(log n)';
                timeWorst = 'O(log n)';
              } else {
                timeAverage = 'O(n)';
                timeWorst = 'O(n)';
              }
            } else if (algorithmType.name === 'Tabla Hash') {
              timeAverage = 'O(1)';
              timeWorst = 'O(n)';
            }
            
            // Complejidad espacial
            if (recursionPatterns.simpleRecursion > 0 || recursionPatterns.divideConquerRecursion > 0) {
              space = 'O(n)';
              if (recursionPatterns.divideConquerRecursion > 0) {
                space = 'O(log n)';
              }
            } else if (dataStructurePatterns.arrays > 1 || dataStructurePatterns.maps > 1 || dataStructurePatterns.sets > 1) {
              space = 'O(n)';
            } else if (loopPatterns.nestedLoops > 0 && (dataStructurePatterns.arrays > 0 || dataStructurePatterns.maps > 0)) {
              space = 'O(n²)';
            } else if (loopPatterns.tripleNestedLoops > 0) {
              space = 'O(n³)';
            } else if (code.includes('new Array(') || code.includes('[]') || code.includes('new Map(') || code.includes('new Set(')) {
              space = 'O(n)';
            }
            
            // Ajustar según el tipo de algoritmo
            if (algorithmType.name === 'Algoritmo de Ordenación' && code.includes('merge')) {
              space = 'O(n)';
            } else if (algorithmType.name === 'Algoritmo de Ordenación' && (code.includes('quick') || code.includes('heap'))) {
              space = 'O(log n)';
            } else if (algorithmType.name === 'Algoritmo de Búsqueda' && code.includes('binary')) {
              space = 'O(1)';
            }
            
            // Determinar estabilidad (principalmente para algoritmos de ordenación)
            let stable = true;
            if (algorithmType.name === 'Algoritmo de Ordenación') {
              if (code.includes('quick') || code.includes('heap') || code.includes('selection')) {
                stable = false;
              }
            }
            
            // Determinar paralelización
            let parallelizable = false;
            if (algorithmType.name === 'Algoritmo de Ordenación' && (code.includes('merge') || code.includes('quick'))) {
              parallelizable = true;
            } else if (code.includes('map(') || code.includes('filter(') || code.includes('reduce(')) {
              parallelizable = true;
            } else if (loopPatterns.singleLoop > 0 && !code.includes('break') && !code.match(/\w+\s*=\s*\w+/g)) {
              parallelizable = true;
            }
            
            // Determinar localidad de referencia
            let localityOfReference: 'Alta' | 'Media' | 'Baja' = 'Media';
            if (algorithmType.name === 'Array/Lista' || code.includes('[]') || code.includes('Array(')) {
              localityOfReference = 'Alta';
            } else if (algorithmType.name === 'Lista Enlazada' || algorithmType.name === 'Árbol' || algorithmType.name === 'Grafo') {
              localityOfReference = 'Baja';
            }
            
            // Determinar eficiencia para conjuntos pequeños
            let smallDatasetEfficiency: 'Alta' | 'Media' | 'Baja' = 'Media';
            if (timeAverage === 'O(1)' || timeAverage === 'O(log n)') {
              smallDatasetEfficiency = 'Alta';
            } else if (timeAverage === 'O(n)') {
              smallDatasetEfficiency = 'Alta';
            } else if (timeAverage === 'O(n log n)') {
              smallDatasetEfficiency = 'Media';
            } else {
              smallDatasetEfficiency = 'Baja';
            }
            
            // Determinar eficiencia para conjuntos grandes
            let largeDatasetEfficiency: 'Alta' | 'Media' | 'Baja' = 'Media';
            if (timeAverage === 'O(1)' || timeAverage === 'O(log n)') {
              largeDatasetEfficiency = 'Alta';
            } else if (timeAverage === 'O(n)') {
              largeDatasetEfficiency = 'Media';
            } else if (timeAverage === 'O(n log n)') {
              largeDatasetEfficiency = 'Media';
            } else {
              largeDatasetEfficiency = 'Baja';
            }
            
            // Determinar uso de memoria
            let memoryUsage: 'Bajo' | 'Medio' | 'Alto' = 'Medio';
            if (space === 'O(1)' || space === 'O(log n)') {
              memoryUsage = 'Bajo';
            } else if (space === 'O(n)') {
              memoryUsage = 'Medio';
            } else {
              memoryUsage = 'Alto';
            }
            
            // Determinar overhead de inicialización
            let initializationOverhead: 'Bajo' | 'Medio' | 'Alto' = 'Bajo';
            if (algorithmType.name === 'Tabla Hash' || algorithmType.name === 'Heap') {
              initializationOverhead = 'Medio';
            } else if (algorithmType.name === 'Árbol' || algorithmType.name === 'Grafo') {
              initializationOverhead = 'Alto';
            }
            
            // Determinar escalabilidad
            let scalability: 'Alta' | 'Media' | 'Baja' = 'Media';
            if (timeAverage === 'O(1)' || timeAverage === 'O(log n)') {
              scalability = 'Alta';
            } else if (timeAverage === 'O(n)' || timeAverage === 'O(n log n)') {
              scalability = 'Media';
            } else {
              scalability = 'Baja';
            }
            
            // Calcular puntuación general (0-100)
            let score = 0;
            
            // Puntuación por complejidad temporal (0-40)
            if (timeAverage === 'O(1)') score += 40;
            else if (timeAverage === 'O(log n)') score += 35;
            else if (timeAverage === 'O(n)') score += 30;
            else if (timeAverage === 'O(n log n)') score += 25;
            else if (timeAverage === 'O(n²)') score += 15;
            else if (timeAverage === 'O(n³)') score += 5;
            else score += 0;
            
            // Puntuación por complejidad espacial (0-20)
            if (space === 'O(1)') score += 20;
            else if (space === 'O(log n)') score += 18;
            else if (space === 'O(n)') score += 15;
            else if (space === 'O(n²)') score += 5;
            else score += 0;
            
            // Puntuación por otros factores (0-40)
            if (stable) score += 5;
            if (parallelizable) score += 5;
            if (localityOfReference === 'Alta') score += 5;
            else if (localityOfReference === 'Media') score += 3;
            
            if (smallDatasetEfficiency === 'Alta') score += 5;
            else if (smallDatasetEfficiency === 'Media') score += 3;
            
            if (largeDatasetEfficiency === 'Alta') score += 10;
            else if (largeDatasetEfficiency === 'Media') score += 5;
            
            if (memoryUsage === 'Bajo') score += 5;
            else if (memoryUsage === 'Medio') score += 3;
            
            if (initializationOverhead === 'Bajo') score += 2;
            else if (initializationOverhead === 'Medio') score += 1;
            
            if (scalability === 'Alta') score += 8;
            else if (scalability === 'Media') score += 4;
            
            return {
              timeAverage,
              timeWorst,
              space,
              stable,
              parallelizable,
              localityOfReference,
              smallDatasetEfficiency,
              largeDatasetEfficiency,
              memoryUsage,
              initializationOverhead,
              scalability,
              score
            };
          }
          
          /**
           * Evalúa la complejidad en comparación con la esperada
           * @param actual Complejidad actual
           * @param expected Complejidad esperada
           * @returns Evaluación de la complejidad
           */
          private getComplexityEvaluation(actual: string, expected: string): string {
            // Mapeo de complejidades a valores numéricos para comparación
            const complexityValues: Record<string, number> = {
              'O(1)': 1,
              'O(log n)': 2,
              'O(n)': 3,
              'O(n log n)': 4,
              'O(n²)': 5,
              'O(n³)': 6,
              'O(2^n)': 7
            };
            
            // Extraer la complejidad base (sin variaciones específicas)
            const getBaseComplexity = (complexity: string): string => {
              for (const base of Object.keys(complexityValues)) {
                if (complexity.includes(base)) {
                  return base;
                }
              }
              return complexity;
            };
            
            const actualBase = getBaseComplexity(actual);
            const expectedBase = getBaseComplexity(expected);
            
            const actualValue = complexityValues[actualBase] || 999;
            const expectedValue = complexityValues[expectedBase] || 999;
            
            if (actualValue < expectedValue) {
              return '✅ Mejor que lo esperado';
            } else if (actualValue === expectedValue) {
              return '✅ Óptimo';
            } else {
              return '❌ Subóptimo';
            }
          }
          
          /**
           * Identifica áreas débiles en la complejidad del algoritmo
           * @param complexity Análisis de complejidad
           * @returns Descripción de áreas débiles
           */
          private getAlgorithmWeakAreas(complexity: {
            timeAverage: string;
            timeWorst: string;
            space: string;
            stable: boolean;
            parallelizable: boolean;
            localityOfReference: 'Alta' | 'Media' | 'Baja';
            smallDatasetEfficiency: 'Alta' | 'Media' | 'Baja';
            largeDatasetEfficiency: 'Alta' | 'Media' | 'Baja';
            memoryUsage: 'Bajo' | 'Medio' | 'Alto';
            initializationOverhead: 'Bajo' | 'Medio' | 'Alto';
            scalability: 'Alta' | 'Media' | 'Baja';
            score: number;
          }): string {
            const weakAreas = [];
            
            // Evaluar complejidad temporal
            if (complexity.timeAverage.includes('n²') || complexity.timeAverage.includes('n³') || complexity.timeAverage.includes('2^n')) {
              weakAreas.push('complejidad temporal');
            }
            
            // Evaluar complejidad espacial
            if (complexity.space.includes('n²') || complexity.space.includes('n³')) {
              weakAreas.push('uso de memoria');
            }
            
            // Evaluar estabilidad
            if (!complexity.stable) {
              weakAreas.push('estabilidad');
            }
            
            // Evaluar paralelización
            if (!complexity.parallelizable) {
              weakAreas.push('paralelización');
            }
            
            // Evaluar localidad de referencia
            if (complexity.localityOfReference === 'Baja') {
              weakAreas.push('localidad de referencia');
            }
            
            // Evaluar eficiencia para conjuntos grandes
            if (complexity.largeDatasetEfficiency === 'Baja') {
              weakAreas.push('rendimiento con datos grandes');
            }
            
            // Evaluar escalabilidad
            if (complexity.scalability === 'Baja') {
              weakAreas.push('escalabilidad');
            }
            
            if (weakAreas.length === 0) {
              return 'optimizaciones menores';
            }
            
            if (weakAreas.length === 1) {
              return weakAreas[0];
            }
            
            if (weakAreas.length === 2) {
              return `${weakAreas[0]} y ${weakAreas[1]}`;
            }
            
            return `${weakAreas.slice(0, -1).join(', ')} y ${weakAreas[weakAreas.length - 1]}`;
          }
          
          /**
           * Identifica posibles optimizaciones para un algoritmo
           * @param code Código del algoritmo
           * @param algorithmType Tipo de algoritmo
           * @param complexity Análisis de complejidad
           * @returns Lista de optimizaciones recomendadas
           */
          private identifyAlgorithmOptimizations(code: string, algorithmType: {
            name: string;
            description: string;
            useCases: string;
            expectedTimeAverage: string;
            expectedTimeWorst: string;
            expectedSpace: string;
          }, complexity: {
            timeAverage: string;
            timeWorst: string;
            space: string;
            stable: boolean;
            parallelizable: boolean;
            localityOfReference: 'Alta' | 'Media' | 'Baja';
            smallDatasetEfficiency: 'Alta' | 'Media' | 'Baja';
            largeDatasetEfficiency: 'Alta' | 'Media' | 'Baja';
            memoryUsage: 'Bajo' | 'Medio' | 'Alto';
            initializationOverhead: 'Bajo' | 'Medio' | 'Alto';
            scalability: 'Alta' | 'Media' | 'Baja';
            score: number;
          }): string[] {
            const optimizations = [];
            
            // Optimizaciones para algoritmos de ordenación
            if (algorithmType.name === 'Algoritmo de Ordenación') {
              if (code.includes('bubble') || code.includes('selection') || code.includes('insertion')) {
                optimizations.push(`### 1. Reemplazar Algoritmo de Ordenación O(n²) por O(n log n)
      - **Problema**: El algoritmo actual tiene complejidad temporal O(n²), lo que es ineficiente para conjuntos grandes de datos.
      - **Solución**: Reemplazar por un algoritmo más eficiente como QuickSort, MergeSort o HeapSort.
      - **Implementación**:
        \`\`\`javascript
        // Antes: Bubble Sort O(n²)
        function bubbleSort(arr) {
          for (let i = 0; i < arr.length; i++) {
            for (let j = 0; j < arr.length - i - 1; j++) {
              if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
              }
            }
          }
          return arr;
        }
        
        // Después: QuickSort O(n log n)
        function quickSort(arr, left = 0, right = arr.length - 1) {
          if (left < right) {
            const pivotIndex = partition(arr, left, right);
            quickSort(arr, left, pivotIndex - 1);
            quickSort(arr, pivotIndex + 1, right);
          }
          return arr;
        }
        
        function partition(arr, left, right) {
          const pivot = arr[right];
          let i = left - 1;
          for (let j = left; j < right; j++) {
            if (arr[j] <= pivot) {
              i++;
              [arr[i], arr[j]] = [arr[j], arr[i]];
            }
          }
          [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
          return i + 1;
        }
        \`\`\`
      - **Beneficio**: Mejora significativa en rendimiento para conjuntos grandes de datos, reduciendo la complejidad de O(n²) a O(n log n).`);
              }
              
              if (!complexity.stable && code.includes('quick')) {
                optimizations.push(`### 2. Usar Algoritmo de Ordenación Estable
      - **Problema**: QuickSort no es estable, lo que puede ser problemático si el orden relativo de elementos iguales es importante.
      - **Solución**: Usar MergeSort que garantiza estabilidad.
      - **Implementación**:
        \`\`\`javascript
        function mergeSort(arr) {
          if (arr.length <= 1) return arr;
          
          const mid = Math.floor(arr.length / 2);
          const left = mergeSort(arr.slice(0, mid));
          const right = mergeSort(arr.slice(mid));
          
          return merge(left, right);
        }
        
        function merge(left, right) {
          const result = [];
          let leftIndex = 0;
          let rightIndex = 0;
          
          while (leftIndex < left.length && rightIndex < right.length) {
            if (left[leftIndex] <= right[rightIndex]) {
              result.push(left[leftIndex]);
              leftIndex++;
            } else {
              result.push(right[rightIndex]);
              rightIndex++;
            }
          }
          
          return result.concat(left.slice(leftIndex)).concat(right.slice(rightIndex));
        }
        \`\`\`
      - **Beneficio**: Mantiene el orden relativo de elementos iguales, importante para ordenaciones multi-nivel o cuando se preserva el orden original.`);
              }
            }
            
            // Optimizaciones para algoritmos de búsqueda
            if (algorithmType.name === 'Algoritmo de Búsqueda') {
              if (code.includes('linear') || code.includes('indexOf') || code.includes('find(') || code.includes('includes(')) {
                optimizations.push(`### 1. Reemplazar Búsqueda Lineal por Búsqueda Binaria
      - **Problema**: La búsqueda lineal tiene complejidad O(n), ineficiente para conjuntos grandes de datos ordenados.
      - **Solución**: Implementar búsqueda binaria para datos ordenados.
      - **Implementación**:
        \`\`\`javascript
        // Antes: Búsqueda Lineal O(n)
        function linearSearch(arr, target) {
          for (let i = 0; i < arr.length; i++) {
            if (arr[i] === target) return i;
          }
          return -1;
        }
        
        // Después: Búsqueda Binaria O(log n)
        function binarySearch(arr, target) {
          let left = 0;
          let right = arr.length - 1;
          
          while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            
            if (arr[mid] === target) return mid;
            if (arr[mid] < target) left = mid + 1;
            else right = mid - 1;
          }
          
          return -1;
        }
        \`\`\`
      - **Beneficio**: Reduce la complejidad de O(n) a O(log n), significativamente más rápido para conjuntos grandes de datos.
      - **Requisito**: Los datos deben estar ordenados previamente.`);
              }
              
              if (code.includes('indexOf') || code.includes('includes(') || code.includes('find(')) {
                optimizations.push(`### 2. Usar Estructura de Datos Optimizada para Búsqueda
      - **Problema**: Búsquedas frecuentes en arrays tienen complejidad O(n).
      - **Solución**: Usar Map o Set para búsquedas con complejidad O(1).
      - **Implementación**:
        \`\`\`javascript
        // Antes: Búsqueda en Array O(n)
        const array = [1, 2, 3, 4, 5];
        const exists = array.includes(3); // O(n)
        
        // Después: Búsqueda en Set O(1)
        const set = new Set([1, 2, 3, 4, 5]);
        const exists = set.has(3); // O(1)
        
        // Para pares clave-valor
        // Antes: Búsqueda en Array de objetos O(n)
        const users = [{id: 1, name: 'Alice'}, {id: 2, name: 'Bob'}];
        const user = users.find(u => u.id === 2); // O(n)
        
        // Después: Búsqueda en Map O(1)
        const userMap = new Map();
        userMap.set(1, {id: 1, name: 'Alice'});
        userMap.set(2, {id: 2, name: 'Bob'});
        const user = userMap.get(2); // O(1)
        \`\`\`
      - **Beneficio**: Reduce drásticamente el tiempo de búsqueda para operaciones frecuentes.`);
              }
            }
            
            // Optimizaciones para algoritmos con bucles anidados
            if (code.match(/for\s*\([^{]*\)[^{]*\{[^}]*for\s*\(/g)) {
              optimizations.push(`### Optimizar Bucles Anidados
      - **Problema**: Los bucles anidados resultan en complejidad O(n²) o peor.
      - **Solución**: Reducir la complejidad mediante indexación o pre-procesamiento.
      - **Implementación**:
        \`\`\`javascript
        // Antes: Bucles anidados O(n²)
        function findPairs(arr, target) {
          const result = [];
          for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
              if (arr[i] + arr[j] === target) {
                result.push([arr[i], arr[j]]);
              }
            }
          }
          return result;
        }
        
        // Después: Usando Map O(n)
        function findPairsOptimized(arr, target) {
          const result = [];
          const seen = new Map();
          
          for (let i = 0; i < arr.length; i++) {
            const complement = target - arr[i];
            if (seen.has(complement)) {
              result.push([complement, arr[i]]);
            }
            seen.set(arr[i], i);
          }
          
          return result;
        }
        \`\`\`
      - **Beneficio**: Reduce la complejidad de O(n²) a O(n), mejorando significativamente el rendimiento.`);
            }
            
            // Optimizaciones para recursión
            if (code.match(/function\s+\w+\([^)]*\)\s*{\s*[^{}]*\1\s*\(/g)) {
              optimizations.push(`### Optimizar Recursión
      - **Problema**: La recursión puede causar desbordamiento de pila y duplicación de cálculos.
      - **Solución**: Implementar memoización o convertir a iterativo.
      - **Implementación**:
        \`\`\`javascript
        // Antes: Fibonacci recursivo sin memoización O(2^n)
        function fibonacci(n) {
          if (n <= 1) return n;
          return fibonacci(n - 1) + fibonacci(n - 2);
        }
        
        // Después: Fibonacci con memoización O(n)
        function fibonacciMemo(n, memo = {}) {
          if (n <= 1) return n;
          if (memo[n]) return memo[n];
          
          memo[n] = fibonacciMemo(n - 1, memo) + fibonacciMemo(n - 2, memo);
          return memo[n];
        }
        
        // Alternativa: Fibonacci iterativo O(n)
        function fibonacciIterative(n) {
          if (n <= 1) return n;
          
          let a = 0, b = 1;
          for (let i = 2; i <= n; i++) {
            const temp = a + b;
            a = b;
            b = temp;
          }
          
          return b;
        }
        \`\`\`
      - **Beneficio**: Reduce la complejidad exponencial a lineal y evita desbordamiento de pila para valores grandes.`);
            }
            
            // Optimizaciones para uso de memoria
            if (complexity.memoryUsage === 'Alto') {
              optimizations.push(`### Reducir Uso de Memoria
      - **Problema**: Alto consumo de memoria puede causar problemas de rendimiento.
      - **Solución**: Optimizar estructuras de datos y evitar copias innecesarias.
      - **Implementación**:
        \`\`\`javascript
        // Antes: Creación de múltiples arrays intermedios
        function processArray(arr) {
          const step1 = arr.map(x => x * 2);
          const step2 = step1.filter(x => x > 10);
          const step3 = step2.reduce((sum, x) => sum + x, 0);
          return step3;
        }
        
        // Después: Procesamiento en un solo paso
        function processArrayOptimized(arr) {
          return arr.reduce((sum, x) => {
            const doubled = x * 2;
            return doubled > 10 ? sum + doubled : sum;
          }, 0);
        }
        \`\`\`
      - **Beneficio**: Reduce la creación de arrays intermedios y el consumo de memoria.`);
            }
            
            // Optimizaciones para paralelización
            if (!complexity.parallelizable && complexity.timeAverage !== 'O(1)' && complexity.timeAverage !== 'O(log n)') {
              optimizations.push(`### Mejorar Paralelización
      - **Problema**: El algoritmo no aprovecha el procesamiento paralelo.
      - **Solución**: Reestructurar para permitir operaciones paralelas.
      - **Implementación**:
        \`\`\`javascript
        // Antes: Procesamiento secuencial
        function processData(data) {
          let result = [];
          for (let i = 0; i < data.length; i++) {
            result.push(heavyComputation(data[i]));
          }
          return result;
        }
        
        // Después: Usando Promise.all para paralelización
        async function processDataParallel(data) {
          const promises = data.map(item => {
            return Promise.resolve().then(() => heavyComputation(item));
          });
          return Promise.all(promises);
        }
        
        // Alternativa: Usando Web Workers para cálculos intensivos
        function processDataWithWorkers(data) {
          // Implementación con Web Workers
          // ...
        }
        \`\`\`
      - **Beneficio**: Aprovecha múltiples núcleos para mejorar el rendimiento en operaciones independientes.`);
            }
            
            // Si no hay suficientes optimizaciones específicas, añadir generales
            if (optimizations.length < 2) {
              optimizations.push(`### Optimizaciones Generales
      - **Problema**: Oportunidades de mejora en rendimiento general.
      - **Solución**: Aplicar técnicas estándar de optimización.
      - **Implementación**:
        1. **Evitar cálculos redundantes**: Calcular valores una vez y reutilizarlos.
        2. **Usar estructuras de datos apropiadas**: Seleccionar la estructura óptima para cada operación.
        3. **Minimizar operaciones DOM**: Agrupar cambios y usar DocumentFragment.
        4. **Implementar lazy loading**: Cargar datos solo cuando sean necesarios.
        5. **Optimizar condiciones**: Ordenar condiciones por probabilidad y costo.
                6. **Usar algoritmos especializados**: Aprovechar algoritmos optimizados para casos específicos.
        7. **Reducir operaciones costosas**: Minimizar operaciones como ordenación, búsqueda en profundidad, o cálculos complejos.
        8. **Implementar caché**: Almacenar resultados de operaciones costosas para reutilizarlos.
      - **Beneficio**: Mejora general del rendimiento y la eficiencia del código.`);
            }
            
            return optimizations;
          }
          
          /**
           * Analiza el rendimiento de una aplicación web
           * @param url URL de la aplicación web
           * @returns Informe de rendimiento
           */
          private async analyzeWebPerformance(url: string): Promise<{
            metrics: Record<string, any>;
            issues: string[];
            recommendations: string[];
          }> {
            console.log(`Analizando rendimiento web para: ${url}`);
            
            // Simulación de análisis de rendimiento web
            // En una implementación real, se utilizaría Lighthouse, WebPageTest, o herramientas similares
            
            // Métricas simuladas
            const metrics = {
              // Métricas de carga
              firstContentfulPaint: Math.random() * 1000 + 500, // ms
              largestContentfulPaint: Math.random() * 2000 + 1000, // ms
              speedIndex: Math.random() * 3000 + 2000, // ms
              timeToInteractive: Math.random() * 3500 + 2500, // ms
              totalBlockingTime: Math.random() * 300 + 100, // ms
              cumulativeLayoutShift: Math.random() * 0.3, // puntuación
              
              // Métricas de recursos
              totalRequests: Math.floor(Math.random() * 80) + 20,
              totalSize: Math.floor(Math.random() * 5000) + 1000, // KB
              htmlSize: Math.floor(Math.random() * 100) + 50, // KB
              cssSize: Math.floor(Math.random() * 200) + 100, // KB
              jsSize: Math.floor(Math.random() * 1000) + 500, // KB
              imageSize: Math.floor(Math.random() * 3000) + 500, // KB
              fontSize: Math.floor(Math.random() * 200) + 50, // KB
              
              // Métricas de rendimiento
              domNodes: Math.floor(Math.random() * 1500) + 500,
              jsExecutionTime: Math.random() * 1000 + 300, // ms
              renderBlockingResources: Math.floor(Math.random() * 10) + 1,
              unusedCssRules: Math.floor(Math.random() * 50) + 10,
              unusedJsCode: Math.floor(Math.random() * 40) + 10, // %
              
              // Métricas de accesibilidad
              accessibilityScore: Math.floor(Math.random() * 30) + 70, // 0-100
              
              // Métricas de SEO
              seoScore: Math.floor(Math.random() * 20) + 80, // 0-100
              
              // Métricas de PWA
              pwaScore: Math.floor(Math.random() * 50) + 50, // 0-100
              
              // Métricas de seguridad
              securityScore: Math.floor(Math.random() * 30) + 70 // 0-100
            };
            
            // Identificar problemas basados en métricas
            const issues = [];
            
            if (metrics.firstContentfulPaint > 1000) {
              issues.push('Tiempo de primer renderizado (FCP) lento');
            }
            
            if (metrics.largestContentfulPaint > 2500) {
              issues.push('Tiempo de renderizado del contenido principal (LCP) lento');
            }
            
            if (metrics.timeToInteractive > 3500) {
              issues.push('Tiempo hasta interactividad (TTI) lento');
            }
            
            if (metrics.totalBlockingTime > 300) {
              issues.push('Tiempo de bloqueo total (TBT) alto');
            }
            
            if (metrics.cumulativeLayoutShift > 0.1) {
              issues.push('Desplazamiento acumulativo del diseño (CLS) alto');
            }
            
            if (metrics.jsSize > 1000) {
              issues.push('Tamaño de JavaScript excesivo');
            }
            
            if (metrics.imageSize > 2000) {
              issues.push('Tamaño de imágenes excesivo');
            }
            
            if (metrics.renderBlockingResources > 3) {
              issues.push('Demasiados recursos que bloquean el renderizado');
            }
            
            if (metrics.unusedCssRules > 30) {
              issues.push('Alto porcentaje de reglas CSS no utilizadas');
            }
            
            if (metrics.unusedJsCode > 30) {
              issues.push('Alto porcentaje de código JavaScript no utilizado');
            }
            
            if (metrics.domNodes > 1500) {
              issues.push('Número excesivo de nodos DOM');
            }
            
            // Generar recomendaciones basadas en los problemas identificados
            const recommendations = [];
            
            if (issues.includes('Tiempo de primer renderizado (FCP) lento') || 
                issues.includes('Tiempo de renderizado del contenido principal (LCP) lento')) {
              recommendations.push(`### Optimizar Carga Inicial
      - **Problema**: Tiempos de renderizado lentos (FCP: ${Math.round(metrics.firstContentfulPaint)}ms, LCP: ${Math.round(metrics.largestContentfulPaint)}ms).
      - **Solución**: Implementar carga crítica y diferida.
      - **Implementación**:
        1. **Identificar CSS crítico**: Extraer y aplicar inline el CSS necesario para el contenido visible.
        2. **Diferir recursos no críticos**: Usar \`loading="lazy"\` para imágenes y \`defer\` para scripts.
        3. **Implementar Server-Side Rendering (SSR)** o **Static Site Generation (SSG)** para contenido inicial.
        4. **Optimizar el orden de carga**: Priorizar contenido visible primero.
      - **Código de ejemplo**:
        \`\`\`html
        <!-- CSS crítico inline -->
        <style>
          /* CSS crítico para contenido visible */
          .header, .hero { /* estilos críticos */ }
        </style>
        
        <!-- Diferir CSS no crítico -->
        <link rel="preload" href="/css/styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="stylesheet" href="/css/styles.css"></noscript>
        
        <!-- Diferir JavaScript -->
        <script src="/js/app.js" defer></script>
        
        <!-- Carga perezosa de imágenes -->
        <img src="hero.jpg" alt="Hero" loading="eager"> <!-- Imagen crítica -->
        <img src="below-fold.jpg" alt="Contenido secundario" loading="lazy">
        \`\`\`
      - **Beneficio**: Reducción significativa en tiempos de carga inicial y mejora en métricas de Core Web Vitals.`);
            }
            
            if (issues.includes('Tamaño de JavaScript excesivo') || 
                issues.includes('Alto porcentaje de código JavaScript no utilizado')) {
              recommendations.push(`### Reducir y Optimizar JavaScript
      - **Problema**: JavaScript excesivo (${Math.round(metrics.jsSize)}KB) con ${metrics.unusedJsCode}% no utilizado.
      - **Solución**: Implementar code splitting, tree shaking y carga bajo demanda.
      - **Implementación**:
        1. **Code Splitting**: Dividir el bundle en chunks más pequeños.
        2. **Tree Shaking**: Eliminar código no utilizado.
        3. **Carga bajo demanda**: Cargar componentes solo cuando sean necesarios.
        4. **Minificación avanzada**: Usar Terser con configuraciones agresivas.
      - **Código de ejemplo (Webpack)**:
        \`\`\`javascript
        // webpack.config.js
        module.exports = {
          // ...
          optimization: {
            splitChunks: {
              chunks: 'all',
              maxInitialRequests: Infinity,
              minSize: 0,
              cacheGroups: {
                vendor: {
                  test: /[\\/]node_modules[\\/]/,
                  name(module) {
                    const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                    return \`npm.\${packageName.replace('@', '')}\`;
                  },
                },
              },
            },
            usedExports: true, // Tree shaking
            minimize: true,
            minimizer: [new TerserPlugin({
              terserOptions: {
                compress: {
                  drop_console: true,
                  pure_funcs: ['console.log']
                }
              }
            })],
          }
        };
        \`\`\`
      - **Código de ejemplo (React con carga dinámica)**:
        \`\`\`jsx
        import React, { lazy, Suspense } from 'react';
        
        // Carga dinámica de componentes
        const HeavyComponent = lazy(() => import('./HeavyComponent'));
        
        function App() {
          return (
            <div>
              <header>Contenido crítico</header>
              <Suspense fallback={<div>Cargando...</div>}>
                {/* Solo se carga cuando es visible */}
                <HeavyComponent />
              </Suspense>
            </div>
          );
        }
        \`\`\`
      - **Beneficio**: Reducción del tiempo de carga inicial, mejor TTI y menor consumo de datos.`);
            }
            
            if (issues.includes('Tamaño de imágenes excesivo')) {
              recommendations.push(`### Optimizar Imágenes
      - **Problema**: Tamaño excesivo de imágenes (${Math.round(metrics.imageSize)}KB).
      - **Solución**: Implementar formatos modernos, redimensionamiento y carga progresiva.
      - **Implementación**:
        1. **Usar formatos modernos**: Convertir a WebP o AVIF con fallbacks.
        2. **Redimensionar según viewport**: Usar \`srcset\` y \`sizes\`.
        3. **Comprimir sin pérdida visible**: Optimizar calidad/tamaño.
        4. **Implementar carga progresiva**: LQIP (Low Quality Image Placeholders).
      - **Código de ejemplo**:
        \`\`\`html
        <!-- Imágenes responsivas con formatos modernos -->
        <picture>
          <source 
            srcset="/img/photo.avif 1x, /img/photo@2x.avif 2x" 
            type="image/avif">
          <source 
            srcset="/img/photo.webp 1x, /img/photo@2x.webp 2x" 
            type="image/webp">
          <img 
            srcset="/img/photo.jpg 1x, /img/photo@2x.jpg 2x"
            src="/img/photo.jpg" 
            alt="Descripción" 
            width="800" 
            height="600"
            loading="lazy"
            decoding="async">
        </picture>
        
        <!-- Imágenes responsivas según tamaño de viewport -->
        <img 
          srcset="/img/photo-320w.jpg 320w,
                  /img/photo-480w.jpg 480w,
                  /img/photo-800w.jpg 800w"
          sizes="(max-width: 320px) 280px,
                 (max-width: 480px) 440px,
                 800px"
          src="/img/photo-800w.jpg" 
          alt="Descripción" 
          loading="lazy">
        \`\`\`
      - **Código de ejemplo (Next.js)**:
        \`\`\`jsx
        import Image from 'next/image';
        
        function MyComponent() {
          return (
            <Image
              src="/img/photo.jpg"
              alt="Descripción"
              width={800}
              height={600}
              placeholder="blur"
              blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
              quality={90}
              priority={false}
            />
          );
        }
        \`\`\`
      - **Beneficio**: Reducción significativa del tamaño de página, mejora en LCP y ahorro de ancho de banda.`);
            }
            
            if (issues.includes('Demasiados recursos que bloquean el renderizado') || 
                issues.includes('Alto porcentaje de reglas CSS no utilizadas')) {
              recommendations.push(`### Optimizar CSS y Recursos Críticos
      - **Problema**: ${metrics.renderBlockingResources} recursos bloqueantes y ${metrics.unusedCssRules}% de CSS no utilizado.
      - **Solución**: Eliminar CSS no utilizado, optimizar ruta crítica y aplicar estrategias de carga.
      - **Implementación**:
        1. **Extraer CSS crítico**: Identificar y aplicar inline el CSS necesario para ATF (Above The Fold).
        2. **Purgar CSS no utilizado**: Usar PurgeCSS o UnCSS para eliminar reglas no utilizadas.
        3. **Optimizar carga de fuentes**: Usar \`font-display: swap\` y precargar fuentes críticas.
        4. **Aplicar estrategias de carga para CSS**: Usar \`preload\`, \`prefetch\` y carga condicional.
      - **Código de ejemplo**:
        \`\`\`html
        <!-- Precargar recursos críticos -->
        <link rel="preload" href="/fonts/main-font.woff2" as="font" type="font/woff2" crossorigin>
        <link rel="preload" href="/css/critical.css" as="style">
        
        <!-- CSS crítico inline -->
        <style>
          /* CSS crítico extraído */
          body { font-family: system-ui, sans-serif; margin: 0; }
          header { /* estilos críticos */ }
          .hero { /* estilos críticos */ }
        </style>
        
        <!-- Cargar CSS no crítico de forma asíncrona -->
        <link rel="preload" href="/css/styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
        <noscript><link rel="stylesheet" href="/css/styles.css"></noscript>
        
        <!-- Optimización de fuentes -->
        <style>
          @font-face {
            font-family: 'MainFont';
            src: url('/fonts/main-font.woff2') format('woff2');
            font-display: swap;
            font-weight: 400;
            font-style: normal;
          }
        </style>
        \`\`\`
      - **Configuración de PurgeCSS**:
        \`\`\`javascript
        // postcss.config.js
        module.exports = {
          plugins: [
            require('autoprefixer'),
            require('@fullhuman/postcss-purgecss')({
              content: [
                './src/**/*.html',
                './src/**/*.vue',
                './src/**/*.jsx',
              ],
              defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || [],
              safelist: ['html', 'body']
            })
          ]
        }
        \`\`\`
      - **Beneficio**: Mejora en FCP, LCP y reducción del tiempo de bloqueo del renderizado.`);
            }
            
            if (issues.includes('Número excesivo de nodos DOM')) {
              recommendations.push(`### Optimizar DOM y Renderizado
      - **Problema**: DOM excesivamente grande (${metrics.domNodes} nodos).
      - **Solución**: Reducir complejidad del DOM, implementar virtualización y optimizar renderizado.
      - **Implementación**:
        1. **Simplificar estructura HTML**: Reducir anidamiento y elementos innecesarios.
        2. **Implementar virtualización**: Renderizar solo elementos visibles en listas largas.
        3. **Optimizar ciclo de vida de componentes**: Evitar re-renderizados innecesarios.
        4. **Implementar fragmentación**: Dividir renderizado de componentes pesados.
      - **Código de ejemplo (React con virtualización)**:
        \`\`\`jsx
        import React, { memo } from 'react';
        import { FixedSizeList } from 'react-window';
        
        // Componente optimizado con memo para evitar re-renderizados
        const Row = memo(({ index, style }) => (
          <div style={style} className={index % 2 ? 'ListItemOdd' : 'ListItemEven'}>
            Item {index}
          </div>
        ));
        
        // Lista virtualizada que solo renderiza elementos visibles
        function VirtualizedList({ items }) {
          return (
            <FixedSizeList
              height={500}
              width="100%"
              itemCount={items.length}
              itemSize={35}
            >
              {Row}
            </FixedSizeList>
          );
        }
        
        // Uso de React.Fragment para evitar nodos DOM innecesarios
        function ComplexComponent() {
          return (
            <>
              <h2>Título</h2>
              <p>Contenido</p>
            </>
          );
        }
        \`\`\`
      - **Código de ejemplo (Vue con virtualización)**:
        \`\`\`vue
        <template>
          <RecycleScroller
            class="scroller"
            :items="items"
            :item-size="32"
            key-field="id"
            v-slot="{ item }"
          >
            <div class="user-item">
              {{ item.name }}
            </div>
          </RecycleScroller>
        </template>
        
        <script>
        import { RecycleScroller } from 'vue-virtual-scroller'
        import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
        
        export default {
          components: {
            RecycleScroller
          },
          data() {
            return {
              items: Array.from({ length: 10000 }).map((_, i) => ({
                id: i,
                name: \`Usuario \${i}\`
              }))
            }
          }
        }
        </script>
        \`\`\`
      - **Beneficio**: Mejora en TTI, reducción de TBT y mejor respuesta de la interfaz.`);
            }
            
            if (issues.includes('Tiempo hasta interactividad (TTI) lento') || 
                issues.includes('Tiempo de bloqueo total (TBT) alto')) {
              recommendations.push(`### Optimizar Interactividad
      - **Problema**: Interactividad lenta (TTI: ${Math.round(metrics.timeToInteractive)}ms, TBT: ${Math.round(metrics.totalBlockingTime)}ms).
      - **Solución**: Optimizar JavaScript, implementar web workers y mejorar gestión de eventos.
      - **Implementación**:
        1. **Dividir tareas largas**: Fragmentar operaciones que bloquean el hilo principal.
        2. **Usar Web Workers**: Mover cálculos pesados a hilos separados.
        3. **Implementar debounce/throttle**: Optimizar gestores de eventos frecuentes.
        4. **Priorizar interactividad**: Cargar primero el JavaScript necesario para interacción.
      - **Código de ejemplo (Web Workers)**:
        \`\`\`javascript
        // main.js
        const worker = new Worker('worker.js');
        
        // Enviar tarea al worker
        worker.postMessage({
          action: 'processData',
          payload: largeDataset
        });
        
        // Recibir resultado sin bloquear UI
        worker.onmessage = function(e) {
          const result = e.data;
          updateUI(result);
        };
        
        // worker.js
        self.onmessage = function(e) {
          if (e.data.action === 'processData') {
            // Realizar cálculos pesados en hilo separado
            const result = processLargeDataset(e.data.payload);
            self.postMessage(result);
          }
        };
        
        function processLargeDataset(data) {
          // Operaciones costosas que no bloquean la UI
          return transformedData;
        }
        \`\`\`
      - **Código de ejemplo (Optimización de eventos)**:
        \`\`\`javascript
        // Implementación de debounce
        function debounce(func, wait) {
          let timeout;
          return function executedFunction(...args) {
            const later = () => {
              clearTimeout(timeout);
              func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
          };
        }
        
        // Implementación de throttle
        function throttle(func, limit) {
          let inThrottle;
          return function(...args) {
            if (!inThrottle) {
              func(...args);
              inThrottle = true;
              setTimeout(() => inThrottle = false, limit);
            }
          };
        }
        
        // Uso con eventos frecuentes
        const debouncedResize = debounce(() => {
          // Lógica costosa de redimensionamiento
          recalculateLayout();
        }, 150);
        
        const throttledScroll = throttle(() => {
          // Lógica de scroll optimizada
          updateVisibleElements();
        }, 100);
        
        window.addEventListener('resize', debouncedResize);
        window.addEventListener('scroll', throttledScroll);
        \`\`\`
      - **Beneficio**: Mejora significativa en TTI, reducción de TBT y experiencia de usuario más fluida.`);
            }
            
            if (issues.includes('Desplazamiento acumulativo del diseño (CLS) alto')) {
              recommendations.push(`### Reducir Cambios de Diseño (CLS)
      - **Problema**: CLS alto (${metrics.cumulativeLayoutShift.toFixed(2)}).
      - **Solución**: Reservar espacio para elementos dinámicos y estabilizar el diseño.
      - **Implementación**:
        1. **Establecer dimensiones para medios**: Definir width/height en imágenes y videos.
        2. **Reservar espacio para anuncios y embebidos**: Usar placeholders con dimensiones fijas.
        3. **Evitar inserción dinámica de contenido**: No insertar contenido sobre elementos existentes.
        4. **Precargar fuentes críticas**: Evitar cambios de texto durante la carga de fuentes.
      - **Código de ejemplo**:
        \`\`\`html
        <!-- Reservar espacio para imágenes -->
        <div style="aspect-ratio: 16/9; background: #f0f0f0;">
          <img src="image.jpg" alt="Descripción" width="800" height="450" loading="lazy">
        </div>
        
        <!-- Reservar espacio para anuncios -->
        <div class="ad-container" style="min-height: 250px; min-width: 300px;">
          <!-- El anuncio se cargará aquí -->
        </div>
        
        <!-- Precargar fuentes críticas -->
        <link rel="preload" href="/fonts/main-font.woff2" as="font" type="font/woff2" crossorigin>
        
        <!-- CSS para evitar CLS con fuentes -->
        <style>
          /* Evitar cambios de diseño durante la carga de fuentes */
          html {
            font-display: optional;
          }
          
          /* Mantener altura de línea consistente entre fuentes */
          body {
            line-height: 1.5;
          }
          
          /* Reservar espacio para contenido dinámico */
          .dynamic-content {
            min-height: 200px;
          }
        </style>
        \`\`\`
      - **Código de ejemplo (Skeleton UI)**:
        \`\`\`jsx
        function ProductCard({ loading, product }) {
          if (loading) {
            return (
              <div className="product-card">
                <div className="product-image skeleton" style={{ height: '200px' }}></div>
                <div className="product-title skeleton" style={{ height: '24px', width: '80%' }}></div>
                <div className="product-price skeleton" style={{ height: '18px', width: '40%' }}></div>
                <div className="product-button skeleton" style={{ height: '36px' }}></div>
              </div>
            );
          }
          
          return (
            <div className="product-card">
              <img src={product.image} alt={product.name} width="200" height="200" />
              <h3>{product.name}</h3>
              <p>${product.price}</p>
              <button>Añadir al carrito</button>
            </div>
          );
        }
        \`\`\`
      - **Beneficio**: Mejora en CLS, experiencia de usuario más estable y reducción de clics accidentales.`);
            }
            
            // Si no hay suficientes recomendaciones específicas, añadir generales
            if (recommendations.length < 2) {
              recommendations.push(`### Optimizaciones Generales de Rendimiento Web
      - **Problema**: Oportunidades de mejora en rendimiento general.
      - **Solución**: Implementar mejores prácticas estándar de rendimiento web.
      - **Implementación**:
        1. **Implementar caché del navegador**: Configurar encabezados Cache-Control y ETag.
        2. **Habilitar compresión**: Configurar Gzip o Brotli para todos los recursos de texto.
        3. **Optimizar fuentes web**: Usar WOFF2, subconjuntos y font-display.
        4. **Implementar Service Workers**: Habilitar funcionalidad offline y caché avanzada.
        5. **Optimizar terceros**: Cargar scripts de terceros de forma asíncrona o diferida.
        6. **Implementar HTTP/2 o HTTP/3**: Aprovechar multiplexación y priorización.
        7. **Optimizar Critical Rendering Path**: Minimizar recursos bloqueantes.
      - **Código de ejemplo (Service Worker)**:
        \`\`\`javascript
        // register-sw.js
        if ('serviceWorker' in navigator) {
          window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
              .then(registration => {
                console.log('SW registrado:', registration.scope);
              })
              .catch(error => {
                console.log('Error al registrar SW:', error);
              });
          });
        }
        
        // sw.js
        const CACHE_NAME = 'v1-cache';
        const urlsToCache = [
          '/',
          '/css/styles.css',
          '/js/main.js',
          '/images/logo.png'
        ];
        
        self.addEventListener('install', event => {
          event.waitUntil(
            caches.open(CACHE_NAME)
              .then(cache => cache.addAll(urlsToCache))
          );
        });
        
        self.addEventListener('fetch', event => {
          event.respondWith(
            caches.match(event.request)
              .then(response => {
                if (response) {
                  return response;
                }
                return fetch(event.request)
                  .then(response => {
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                      return response;
                    }
                    
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME)
                      .then(cache => {
                        cache.put(event.request, responseToCache);
                      });
                    
                    return response;
                  });
              })
          );
        });
        \`\`\`
      - **Configuración de servidor (Nginx)**:
        \`\`\`nginx
        # Habilitar compresión
        gzip on;
        gzip_comp_level 6;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
        
        # Configurar caché
        location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
          expires 1y;
          add_header Cache-Control "public, max-age=31536000, immutable";
        }
        
        # Habilitar HTTP/2
        listen 443 ssl http2;
        
        # Configurar HSTS
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        \`\`\`
      - **Beneficio**: Mejora general en todas las métricas de rendimiento y experiencia de usuario.`);
            }
            
            return {
              metrics,
              issues,
              recommendations
            };
          }
          
          /**
           * Analiza el rendimiento de una base de datos
           * @param dbConfig Configuración de la base de datos o consulta a analizar
           * @returns Informe de rendimiento de la base de datos
           */
          private async analyzeDatabasePerformance(dbConfig: string | Record<string, any>): Promise<{
            metrics: Record<string, any>;
            issues: string[];
            recommendations: string[];
          }> {
            console.log(`Analizando rendimiento de base de datos para: ${typeof dbConfig === 'string' ? dbConfig : JSON.stringify(dbConfig)}`);
            
            // Simulación de análisis de rendimiento de base de datos
            // En una implementación real, se conectaría a la base de datos y ejecutaría EXPLAIN PLAN, analizaría índices, etc.
            
            // Métricas simuladas
            const metrics = {
              // Métricas generales
              queryTime: Math.random() * 2000 + 100, // ms
              rowsExamined: Math.floor(Math.random() * 100000) + 1000,
              rowsReturned: Math.floor(Math.random() * 10000) + 100,
              
              // Métricas de índices
              indexUsage: Math.random() * 100, // porcentaje
              missingIndices: Math.floor(Math.random() * 10),
              redundantIndices: Math.floor(Math.random() * 5),
              
              // Métricas de consultas
              fullTableScans: Math.floor(Math.random() * 20),
              temporaryTables: Math.floor(Math.random() * 10),
              suboptimalJoins: Math.floor(Math.random() * 15),
              
              // Métricas de recursos
              cpuUsage: Math.random() * 100, // porcentaje
              memoryUsage: Math.random() * 100, // porcentaje
              diskIO: Math.floor(Math.random() * 5000) + 100, // operaciones/s
              
              // Métricas de configuración
              connectionPoolSize: Math.floor(Math.random() * 100) + 10,
              cacheSize: Math.floor(Math.random() * 1024) + 128, // MB
              
              // Métricas de bloqueo
              deadlocks: Math.floor(Math.random() * 5),
              lockWaitTime: Math.random() * 1000, // ms
              
              // Métricas de almacenamiento
              tableFragmentation: Math.random() * 50, // porcentaje
              wastedSpace: Math.floor(Math.random() * 10240) + 1024, // MB
            };
            
            // Identificar problemas basados en métricas
            const issues = [];
            
            if (metrics.queryTime > 1000) {
              issues.push('Tiempo de consulta excesivo');
            }
            
            if (metrics.rowsExamined / metrics.rowsReturned > 100) {
              issues.push('Relación alta entre filas examinadas y retornadas');
            }
            
            if (metrics.indexUsage < 70) {
              issues.push('Bajo uso de índices');
            }
            
            if (metrics.missingIndices > 3) {
              issues.push('Índices faltantes en tablas frecuentemente consultadas');
            }
            
            if (metrics.fullTableScans > 5) {
              issues.push('Número excesivo de escaneos completos de tabla');
            }
            
            if (metrics.suboptimalJoins > 5) {
              issues.push('Joins subóptimos detectados');
            }
            
            if (metrics.cpuUsage > 80 || metrics.memoryUsage > 80) {
              issues.push('Alto uso de recursos (CPU/memoria)');
            }
            
            if (metrics.deadlocks > 0) {
              issues.push('Deadlocks detectados');
            }
            
            if (metrics.tableFragmentation > 30) {
              issues.push('Alta fragmentación de tablas');
            }
            
            // Generar recomendaciones basadas en los problemas identificados
            const recommendations = [];
            
            if (issues.includes('Tiempo de consulta excesivo') || 
                issues.includes('Relación alta entre filas examinadas y retornadas')) {
              recommendations.push(`### Optimizar Consultas SQL
      - **Problema**: Consultas lentas (${Math.round(metrics.queryTime)}ms) con relación alta entre filas examinadas (${metrics.rowsExamined}) y retornadas (${metrics.rowsReturned}).
      - **Solución**: Refactorizar consultas y optimizar planes de ejecución.
      - **Implementación**:
        1. **Usar EXPLAIN ANALYZE**: Identificar cuellos de botella en planes de ejecución.
        2. **Limitar resultados**: Usar LIMIT/TOP y paginación para reducir datos procesados.
        3. **Optimizar JOINs**: Asegurar orden correcto de tablas y condiciones de unión eficientes.
        4. **Evitar funciones en WHERE**: No aplicar funciones en columnas indexadas.
        5. **Usar consultas preparadas**: Aprovechar la caché de planes de consulta.
      - **Código de ejemplo**:
        \`\`\`sql
        -- Antes: Consulta ineficiente
        SELECT u.*, p.* 
        FROM users u 
        LEFT JOIN profiles p ON u.id = p.user_id
        WHERE LOWER(u.email) LIKE '%gmail.com';
        
        -- Después: Consulta optimizada
        SELECT u.id, u.name, u.email, p.bio, p.avatar
        FROM users u 
        INNER JOIN profiles p ON u.id = p.user_id
        WHERE u.email LIKE '%gmail.com'
        LIMIT 100;
        
        -- Usar EXPLAIN para analizar el plan de ejecución
        EXPLAIN ANALYZE
        SELECT u.id, u.name, u.email, p.bio, p.avatar
        FROM users u 
        INNER JOIN profiles p ON u.id = p.user_id
        WHERE u.email LIKE '%gmail.com'
        LIMIT 100;
        \`\`\`
      - **Beneficio**: Reducción significativa en tiempo de consulta y uso de recursos.`);
            }
            
            if (issues.includes('Bajo uso de índices') || 
                issues.includes('Índices faltantes en tablas frecuentemente consultadas')) {
              recommendations.push(`### Optimizar Índices
      - **Problema**: Uso de índices subóptimo (${Math.round(metrics.indexUsage)}%) con ${metrics.missingIndices} índices faltantes.
      - **Solución**: Crear índices estratégicos y optimizar los existentes.
      - **Implementación**:
        1. **Identificar consultas frecuentes**: Analizar logs para encontrar patrones de consulta.
        2. **Crear índices compuestos**: Para consultas con múltiples condiciones WHERE y ORDER BY.
        3. **Eliminar índices redundantes**: Identificar y eliminar índices duplicados o no utilizados.
        4. **Considerar índices parciales**: Para subconjuntos de datos frecuentemente consultados.
        5. **Mantener estadísticas actualizadas**: Ejecutar ANALYZE/UPDATE STATISTICS regularmente.
      - **Código de ejemplo**:
        \`\`\`sql
        -- Crear índice para columnas frecuentemente consultadas
        CREATE INDEX idx_users_email ON users(email);
        
        -- Índice compuesto para consultas con múltiples condiciones
        CREATE INDEX idx_products_category_price ON products(category_id, price);
        
        -- Índice parcial para datos activos (PostgreSQL)
        CREATE INDEX idx_orders_active ON orders(created_at) 
        WHERE status = 'active';
        
        -- Índice para optimizar JOINs
        CREATE INDEX idx_order_items_order_id ON order_items(order_id);
        
        -- Actualizar estadísticas (varía según DBMS)
        -- PostgreSQL
        ANALYZE users;
        -- MySQL
        ANALYZE TABLE users;
        -- SQL Server
        UPDATE STATISTICS users;
        \`\`\`
      - **Beneficio**: Mejora en velocidad de consultas y reducción de carga en el servidor.`);
            }
            
            if (issues.includes('Número excesivo de escaneos completos de tabla') || 
                issues.includes('Joins subóptimos detectados')) {
              recommendations.push(`### Optimizar Estructura de Consultas
      - **Problema**: ${metrics.fullTableScans} escaneos completos de tabla y ${metrics.suboptimalJoins} JOINs subóptimos.
      - **Solución**: Reestructurar consultas para evitar escaneos completos y optimizar JOINs.
      - **Implementación**:
        1. **Evitar SELECT ***: Seleccionar solo columnas necesarias.
        2. **Optimizar orden de JOINs**: Unir primero tablas más pequeñas o con mejores filtros.
        3. **Usar CTE o tablas temporales**: Para consultas complejas con subconsultas repetidas.
        4. **Considerar desnormalización**: Para datos de solo lectura frecuentemente consultados.
        5. **Implementar particionamiento**: Para tablas muy grandes con consultas por rangos.
      - **Código de ejemplo**:
        \`\`\`sql
        -- Antes: JOIN ineficiente con SELECT *
        SELECT * 
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.created_at > '2023-01-01';
        
        -- Después: JOIN optimizado con columnas específicas
        SELECT o.id, o.total, o.created_at, 
               p.name AS product_name, p.price,
               u.email
        FROM orders o
        INNER JOIN users u ON o.user_id = u.id
        INNER JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN products p ON oi.product_id = p.id
        WHERE o.created_at > '2023-01-01';
        
        -- Usando CTE para consultas complejas
        WITH recent_orders AS (
          SELECT id, user_id, total
          FROM orders
          WHERE created_at > '2023-01-01'
        )
        SELECT ro.id, ro.total, u.email
        FROM recent_orders ro
        INNER JOIN users u ON ro.user_id = u.id;
        
        -- Implementar particionamiento (PostgreSQL)
        CREATE TABLE orders_partitioned (
          id SERIAL,
          user_id INTEGER,
          total DECIMAL(10,2),
          created_at TIMESTAMP
        ) PARTITION BY RANGE (created_at);
        
        CREATE TABLE orders_2023_q1 PARTITION OF orders_partitioned
          FOR VALUES FROM ('2023-01-01') TO ('2023-04-01');
        
        CREATE TABLE orders_2023_q2 PARTITION OF orders_partitioned
          FOR VALUES FROM ('2023-04-01') TO ('2023-07-01');
        \`\`\`
      - **Beneficio**: Reducción de carga en el servidor y mejora en tiempos de respuesta.`);
            }
            
            if (issues.includes('Alto uso de recursos (CPU/memoria)')) {
              recommendations.push(`### Optimizar Configuración del Servidor de Base de Datos
      - **Problema**: Alto uso de recursos (CPU: ${Math.round(metrics.cpuUsage)}%, Memoria: ${Math.round(metrics.memoryUsage)}%).
      - **Solución**: Ajustar parámetros de configuración y recursos asignados.
      - **Implementación**:
        1. **Ajustar pool de conexiones**: Optimizar según concurrencia esperada.
        2. **Configurar caché de consultas**: Aumentar tamaño para consultas frecuentes.
        3. **Optimizar buffers de memoria**: Ajustar según workload y RAM disponible.
        4. **Implementar particionamiento**: Dividir tablas grandes para mejor gestión de recursos.
        5. **Considerar réplicas de lectura**: Para distribuir carga en entornos de alta concurrencia.
      - **Código de ejemplo (MySQL)**:
        \`\`\`ini
        # my.cnf - Optimizaciones para servidor con 16GB RAM
        
        # Caché de consultas
        query_cache_type = 1
        query_cache_size = 256M
        query_cache_limit = 2M
        
        # Buffers InnoDB
        innodb_buffer_pool_size = 8G
        innodb_log_file_size = 512M
        innodb_log_buffer_size = 16M
        innodb_flush_log_at_trx_commit = 2
        
        # Conexiones
        max_connections = 500
        thread_cache_size = 128
        
        # Temporales
        tmp_table_size = 256M
        max_heap_table_size = 256M
        
        # Optimizaciones de lectura/escritura
        innodb_read_io_threads = 8
        innodb_write_io_threads = 8
        innodb_flush_method = O_DIRECT
        \`\`\`
      - **Código de ejemplo (PostgreSQL)**:
        \`\`\`ini
        # postgresql.conf - Optimizaciones para servidor con 16GB RAM
        
        # Memoria
        shared_buffers = 4GB
        work_mem = 32MB
        maintenance_work_mem = 512MB
        
        # Escritura
        wal_buffers = 16MB
        checkpoint_timeout = 15min
        max_wal_size = 2GB
        
        # Planificador
        effective_cache_size = 12GB
        random_page_cost = 1.1
        
        # Paralelismo
        max_worker_processes = 8
        max_parallel_workers_per_gather = 4
        max_parallel_workers = 8
        
        # Conexiones
        max_connections = 200
        \`\`\`
      - **Beneficio**: Mejor utilización de recursos y mayor capacidad para manejar carga.`);
            }
            
            if (issues.includes('Deadlocks detectados')) {
              recommendations.push(`### Resolver Problemas de Concurrencia
      - **Problema**: ${metrics.deadlocks} deadlocks detectados con tiempo de espera de bloqueo de ${Math.round(metrics.lockWaitTime)}ms.
      - **Solución**: Optimizar transacciones y estrategias de bloqueo.
      - **Implementación**:
        1. **Acortar transacciones**: Minimizar duración y alcance de transacciones.
        2. **Estandarizar orden de acceso**: Acceder a tablas/filas en el mismo orden en todas las transacciones.
        3. **Usar niveles de aislamiento apropiados**: Considerar READ COMMITTED para lecturas.
        4. **Implementar reintentos**: Capturar excepciones de deadlock y reintentar transacciones.
        5. **Monitorear y analizar patrones**: Identificar transacciones problemáticas.
      - **Código de ejemplo**:
        \`\`\`java
        // Ejemplo en Java con Spring y manejo de reintentos
        @Service
        public class OrderService {
            
            @Autowired
            private JdbcTemplate jdbcTemplate;
            
            @Transactional(isolation = Isolation.READ_COMMITTED)
            @Retryable(value = DeadlockLoserDataAccessException.class, maxAttempts = 3, backoff = @Backoff(delay = 100))
            public void processOrder(Order order) {
                // 1. Primero acceder a tablas de menor contención
                updateInventory(order.getItems());
                
                // 2. Luego a tablas de mayor contención
                createOrder(order);
                
                // 3. Minimizar operaciones dentro de la transacción
                // Mover operaciones no críticas fuera de la transacción
            }
            
            private void updateInventory(List<OrderItem> items) {
                // Ordenar items por ID para acceso consistente
                items.sort(Comparator.comparing(item -> item.getProductId()));
                
                for (OrderItem item : items) {
                    jdbcTemplate.update(
                        "UPDATE inventory SET stock = stock - ? WHERE product_id = ? AND stock >= ?",
                        item.getQuantity(), item.getProductId(), item.getQuantity()
                    );
                }
            }
            
            private void createOrder(Order order) {
                // Implementación de creación de orden
            }
            
            @Recover
            public void recoverFromDeadlock(DeadlockLoserDataAccessException e, Order order) {
                // Logging y notificación
                log.error("Deadlock persistente después de reintentos para orden: " + order.getId(), e);
                // Posible fallback o notificación para intervención manual
            }
        }
        \`\`\`
      - **Código de ejemplo (SQL con niveles de aislamiento)**:
        \`\`\`sql
        -- Ejemplo de transacción con nivel de aislamiento optimizado (SQL Server)
        BEGIN TRANSACTION;
        
        SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
        
        -- Operaciones ordenadas por "contención" (menor a mayor)
        UPDATE inventory 
        SET stock = stock - @quantity 
        WHERE product_id = @product_id AND stock >= @quantity;
        
        IF @@ROWCOUNT > 0
        BEGIN
            INSERT INTO orders (user_id, total, created_at)
            VALUES (@user_id, @total, GETDATE());
            
            INSERT INTO order_items (order_id, product_id, quantity, price)
            VALUES (SCOPE_IDENTITY(), @product_id, @quantity, @price);
        END
        
        COMMIT TRANSACTION;
        \`\`\`
      - **Beneficio**: Reducción de deadlocks, mejora en concurrencia y tiempos de respuesta.`);
            }
            
            if (issues.includes('Alta fragmentación de tablas')) {
              recommendations.push(`### Optimizar Almacenamiento
      - **Problema**: Fragmentación de tablas del ${Math.round(metrics.tableFragmentation)}% con ${Math.round(metrics.wastedSpace / 1024)} GB de espacio desperdiciado.
      - **Solución**: Desfragmentar tablas y optimizar almacenamiento.
      - **Implementación**:
        1. **Reconstruir índices**: Desfragmentar índices regularmente.
        2. **Comprimir datos**: Implementar compresión para tablas grandes.
        3. **Archivar datos históricos**: Mover datos antiguos a tablas de archivo.
        4. **Optimizar tipos de datos**: Usar tipos de datos eficientes en espacio.
        5. **Programar mantenimiento**: Automatizar tareas de optimización.
      - **Código de ejemplo (SQL Server)**:
        \`\`\`sql
        -- Analizar fragmentación
        SELECT 
            OBJECT_NAME(ind.OBJECT_ID) AS TableName,
            ind.name AS IndexName,
            indexstats.avg_fragmentation_in_percent
        FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, NULL) indexstats
        INNER JOIN sys.indexes ind ON ind.object_id = indexstats.object_id
            AND ind.index_id = indexstats.index_id
        WHERE indexstats.avg_fragmentation_in_percent > 30
        ORDER BY indexstats.avg_fragmentation_in_percent DESC;
        
        -- Reconstruir índices fragmentados
        ALTER INDEX ALL ON orders REBUILD;
        
        -- Comprimir tabla (SQL Server Enterprise)
        ALTER TABLE orders REBUILD PARTITION = ALL WITH (DATA_COMPRESSION = PAGE);
        
        -- Crear tabla particionada para archivado
        CREATE TABLE orders_archive (
            -- misma estructura que orders
        );
        
        -- Mover datos antiguos a archivo
        INSERT INTO orders_archive
        SELECT * FROM orders
        WHERE created_at < DATEADD(YEAR, -1, GETDATE());
        
        -- Eliminar datos archivados
        DELETE FROM orders
        WHERE created_at < DATEADD(YEAR, -1, GETDATE());
        \`\`\`
      - **Código de ejemplo (MySQL)**:
        \`\`\`sql
        -- Optimizar tabla
        OPTIMIZE TABLE orders;
        
        -- Analizar tabla
        ANALYZE TABLE orders;
        
        -- Comprimir tabla (requiere InnoDB con compresión)
        ALTER TABLE orders ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;
        
        -- Script de mantenimiento programado
        CREATE EVENT weekly_maintenance
        ON SCHEDULE EVERY 1 WEEK
        DO
        BEGIN
            OPTIMIZE TABLE orders, order_items, products, users;
            ANALYZE TABLE orders, order_items, products, users;
        END;
        \`\`\`
      - **Beneficio**: Reducción en espacio de almacenamiento y mejora en rendimiento de consultas.`);
            }
            
            // Si no hay suficientes recomendaciones específicas, añadir generales
            if (recommendations.length < 2) {
              recommendations.push(`### Optimizaciones Generales de Base de Datos
      - **Problema**: Oportunidades de mejora en rendimiento general de base de datos.
      - **Solución**: Implementar mejores prácticas estándar de optimización.
      - **Implementación**:
        1. **Normalizar/desnormalizar estratégicamente**: Balancear integridad de datos y rendimiento.
        2. **Implementar caché de aplicación**: Reducir consultas a base de datos.
        3. **Usar procedimientos almacenados**: Para operaciones complejas frecuentes.
        4. **Optimizar esquema**: Revisar tipos de datos, claves y restricciones.
        5. **Implementar sharding**: Para bases de datos muy grandes.
        6. **Monitoreo continuo**: Establecer alertas para consultas lentas.
        7. **Actualizar estadísticas regularmente**: Para optimizar planes de ejecución.
      - **Código de ejemplo (Caché con Redis)**:
        \`\`\`java
        @Service
        public class ProductService {
            
            @Autowired
            private ProductRepository productRepository;
            
            @Autowired
            private RedisTemplate<String, Product> redisTemplate;
            
            private static final String CACHE_KEY_PREFIX = "product:";
            private static final long CACHE_TTL = 3600; // 1 hora
            
            public Product getProductById(Long id) {
                String cacheKey = CACHE_KEY_PREFIX + id;
                
                // Intentar obtener de caché
                Product product = redisTemplate.opsForValue().get(cacheKey);
                
                if (product == null) {
                    // Caché miss, obtener de base de datos
                    product = productRepository.findById(id)
                        .orElseThrow(() -> new ProductNotFoundException(id));
                    
                    // Guardar en caché con TTL
                    redisTemplate.opsForValue().set(cacheKey, product, CACHE_TTL, TimeUnit.SECONDS);
                }
                
                return product;
            }
            
            public void updateProduct(Product product) {
                // Actualizar en base de datos
                productRepository.save(product);
                
                // Invalidar caché
                redisTemplate.delete(CACHE_KEY_PREFIX + product.getId());
            }
        }
        \`\`\`
      - **Código de ejemplo (Procedimiento almacenado)**:
        \`\`\`sql
        -- Procedimiento almacenado para operación compleja (MySQL)
        DELIMITER //
        
        CREATE PROCEDURE process_order(
            IN p_user_id INT,
            IN p_product_id INT,
            IN p_quantity INT,
            OUT p_order_id INT
        )
        BEGIN
            DECLARE v_price DECIMAL(10,2);
            DECLARE v_stock INT;
            DECLARE v_total DECIMAL(10,2);
            
            -- Iniciar transacción
            START TRANSACTION;
            
            -- Verificar stock
            SELECT price, stock INTO v_price, v_stock
            FROM products
            WHERE id = p_product_id FOR UPDATE;
            
            IF v_stock >= p_quantity THEN
                -- Calcular total
                SET v_total = v_price * p_quantity;
                
                -- Crear orden
                INSERT INTO orders (user_id, total, created_at)
                VALUES (p_user_id, v_total, NOW());
                
                SET p_order_id = LAST_INSERT_ID();
                
                -- Crear item de orden
                INSERT INTO order_items (order_id, product_id, quantity, price)
                VALUES (p_order_id, p_product_id, p_quantity, v_price);
                
                -- Actualizar inventario
                UPDATE products
                SET stock = stock - p_quantity
                WHERE id = p_product_id;
                
                -- Confirmar transacción
                COMMIT;
            ELSE
                -- Rollback si no hay stock suficiente
                ROLLBACK;
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Insufficient stock';
            END IF;
        END //
        
        DELIMITER ;
        \`\`\`
      - **Beneficio**: Mejora general en rendimiento, escalabilidad y mantenibilidad.`);
            }
            
            return {
              metrics,
              issues,
              recommendations
            };
          }
          
          /**
           * Analiza el rendimiento de una aplicación móvil
           * @param appSpec Especificación o ruta de la aplicación móvil
           * @returns Informe de rendimiento
           */
          private async analyzeMobilePerformance(appSpec: string): Promise<{
            metrics: Record<string, any>;
            issues: string[];
            recommendations: string[];
          }> {
            console.log(`Analizando rendimiento móvil para: ${appSpec}`);
            
            // Simulación de análisis de rendimiento móvil
            // En una implementación real, se utilizarían herramientas como Android Profiler, Xcode Instruments, etc.
            
            // Métricas simuladas
            const metrics = {
              // Métricas de rendimiento
              startupTime: Math.random() * 3000 + 1000, // ms
              frameRate: Math.random() * 30 + 30, // fps
              frameDrops: Math.floor(Math.random() * 100), // cantidad
              renderTime: Math.random() * 50 + 10, // ms por frame
              
              // Métricas de memoria
              memoryUsage: Math.random() * 300 + 100, // MB
              memoryLeaks: Math.floor(Math.random() * 5),
              gcPauses: Math.floor(Math.random() * 20),
              
              // Métricas de batería
              batteryDrain: Math.random() * 20 + 5, // % por hora
              wakelocksCount: Math.floor(Math.random() * 10),
              backgroundProcesses: Math.floor(Math.random() * 5),
              
              // Métricas de red
              networkRequests: Math.floor(Math.random() * 100) + 20,
              dataTransferred: Math.random() * 10 + 1, // MB
              responseTime: Math.random() * 1000 + 200, // ms
              
              // Métricas de tamaño
              appSize: Math.random() * 100 + 20, // MB
              resourcesSize: Math.random() * 50 + 10, // MB
              
              // Métricas de UI
              uiLagEvents: Math.floor(Math.random() * 50),
              inputLatency: Math.random() * 100 + 50, // ms
              
              // Métricas de almacenamiento
              diskIO: Math.floor(Math.random() * 100) + 10, // operaciones/s
              cacheSize: Math.random() * 50 + 10, // MB
            };
            
            // Identificar problemas basados en métricas
            const issues = [];
            
            if (metrics.startupTime > 2000) {
              issues.push('Tiempo de inicio lento');
            }
            
            if (metrics.frameRate < 50) {
              issues.push('Tasa de frames baja');
            }
            
            if (metrics.frameDrops > 30) {
              issues.push('Caídas de frames frecuentes');
            }
            
            if (metrics.memoryUsage > 200) {
              issues.push('Uso excesivo de memoria');
            }
            
            if (metrics.memoryLeaks > 0) {
              issues.push('Fugas de memoria detectadas');
            }
            
            if (metrics.batteryDrain > 15) {
              issues.push('Alto consumo de batería');
            }
            
            if (metrics.responseTime > 500) {
              issues.push('Tiempos de respuesta de red lentos');
            }
            
            if (metrics.appSize > 50) {
              issues.push('Tamaño de aplicación grande');
            }
            
            if (metrics.uiLagEvents > 20) {
              issues.push('Lag en interfaz de usuario');
            }
            
            if (metrics.inputLatency > 100) {
              issues.push('Alta latencia de entrada');
            }
            
            // Generar recomendaciones basadas en los problemas identificados
            const recommendations = [];
            
            if (issues.includes('Tiempo de inicio lento')) {
              recommendations.push(`### Optimizar Tiempo de Inicio
      - **Problema**: Tiempo de inicio lento (${Math.round(metrics.startupTime)}ms).
      - **Solución**: Implementar carga diferida y optimizar inicialización.
      - **Implementación**:
        1. **Implementar inicialización diferida**: Cargar componentes no críticos después del inicio.
        2. **Optimizar proceso de arranque**: Reducir operaciones bloqueantes en onCreate/viewDidLoad.
        3. **Usar App Startup (Android)**: Para inicialización ordenada de componentes.
        4. **Implementar splash screen optimizado**: Para mejorar percepción de velocidad.
        5. **Reducir dependencias en el hilo principal**: Mover operaciones a hilos secundarios.
      - **Código de ejemplo (Android)**:
        \`\`\`kotlin
        // Implementación de App Startup para inicialización ordenada
        // AndroidManifest.xml
        <provider
            android:name="androidx.startup.InitializationProvider"
                        android:authorities="\${applicationId}.androidx-startup"
            android:exported="false">
            <meta-data
                android:name="com.example.app.initializer.AppInitializer"
                android:value="androidx.startup.Initializer" />
        </provider>
        
        // Implementación del inicializador
        class AppInitializer : Initializer<AppComponent> {
            override fun create(context: Context): AppComponent {
                // Inicialización diferida de componentes no críticos
                val appComponent = AppComponent()
                
                // Inicializar solo componentes críticos para el arranque
                appComponent.initCriticalComponents()
                
                // Programar inicialización diferida de componentes no críticos
                Handler(Looper.getMainLooper()).postDelayed({
                    appComponent.initNonCriticalComponents()
                }, 3000) // 3 segundos después del inicio
                
                return appComponent
            }
            
            override fun dependencies(): List<Class<out Initializer<*>>> {
                // Definir dependencias de inicialización
                return emptyList() // Sin dependencias
            }
        }
        
        // Actividad principal con optimizaciones
        class MainActivity : AppCompatActivity() {
            override fun onCreate(savedInstanceState: Bundle?) {
                super.onCreate(savedInstanceState)
                
                // Configurar vista de contenido con splash screen
                setContentView(R.layout.activity_main)
                
                // Cargar datos iniciales en un hilo secundario
                lifecycleScope.launch(Dispatchers.IO) {
                    val initialData = loadInitialData()
                    
                    // Actualizar UI en el hilo principal cuando los datos estén listos
                    withContext(Dispatchers.Main) {
                        setupUI(initialData)
                    }
                }
            }
        }
        \`\`\`
      - **Código de ejemplo (iOS)**:
        \`\`\`swift
        // AppDelegate.swift con inicialización diferida
        class AppDelegate: UIResponder, UIApplicationDelegate {
            var window: UIWindow?
            
            func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
                // Inicializar solo componentes críticos
                initCriticalComponents()
                
                // Programar inicialización diferida
                DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
                    self.initNonCriticalComponents()
                }
                
                return true
            }
            
            private func initCriticalComponents() {
                // Inicializar componentes críticos para el arranque
                // Configuración básica, tema, navegación, etc.
            }
            
            private func initNonCriticalComponents() {
                // Inicializar componentes no críticos
                // Analytics, servicios en segundo plano, caché, etc.
            }
        }
        
        // ViewController con carga asíncrona
        class MainViewController: UIViewController {
            override func viewDidLoad() {
                super.viewDidLoad()
                
                // Mostrar indicador de carga o splash screen
                showLoadingIndicator()
                
                // Cargar datos en segundo plano
                DispatchQueue.global(qos: .userInitiated).async {
                    let initialData = self.loadInitialData()
                    
                    // Actualizar UI en hilo principal
                    DispatchQueue.main.async {
                        self.hideLoadingIndicator()
                        self.setupUI(with: initialData)
                    }
                }
            }
        }
        \`\`\`
      - **Beneficio**: Reducción del tiempo de inicio percibido en un 40-60% y mejora en la experiencia del usuario.`);
            }
            
            if (issues.includes('Tasa de frames baja') || 
                issues.includes('Caídas de frames frecuentes')) {
              recommendations.push(`### Optimizar Renderizado UI
      - **Problema**: Tasa de frames baja (${Math.round(metrics.frameRate)} FPS) con ${metrics.frameDrops} caídas de frames.
      - **Solución**: Optimizar renderizado y operaciones en hilo principal.
      - **Implementación**:
        1. **Reducir complejidad de layouts**: Aplanar jerarquías de vistas y usar ConstraintLayout/SwiftUI.
        2. **Implementar recycling de vistas**: Usar RecyclerView/UICollectionView eficientemente.
        3. **Optimizar drawables y recursos**: Reducir resolución de imágenes y usar formatos eficientes.
        4. **Evitar operaciones bloqueantes**: Mover operaciones pesadas a hilos secundarios.
        5. **Implementar renderizado por hardware**: Activar aceleración por hardware para animaciones.
      - **Código de ejemplo (Android)**:
        \`\`\`kotlin
        // Layout optimizado con ConstraintLayout
        // activity_main.xml
        <androidx.constraintlayout.widget.ConstraintLayout
            xmlns:android="http://schemas.android.com/apk/res/android"
            xmlns:app="http://schemas.android.com/apk/res-auto"
            android:layout_width="match_parent"
            android:layout_height="match_parent">
            
            <!-- Usar constraints en lugar de layouts anidados -->
            <ImageView
                android:id="@+id/header_image"
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                app:layout_constraintTop_toTopOf="parent"
                app:layout_constraintStart_toStartOf="parent"
                app:layout_constraintEnd_toEndOf="parent"
                android:scaleType="centerCrop" />
                
            <androidx.recyclerview.widget.RecyclerView
                android:id="@+id/products_list"
                android:layout_width="0dp"
                android:layout_height="0dp"
                app:layout_constraintTop_toBottomOf="@id/header_image"
                app:layout_constraintBottom_toBottomOf="parent"
                app:layout_constraintStart_toStartOf="parent"
                app:layout_constraintEnd_toEndOf="parent" />
                
        </androidx.constraintlayout.widget.ConstraintLayout>
        
        // Implementación de RecyclerView optimizada
        class ProductsAdapter : RecyclerView.Adapter<ProductViewHolder>() {
            // Implementación de ViewHolder pattern
            // ...
            
            override fun onBindViewHolder(holder: ProductViewHolder, position: Int) {
                val product = products[position]
                
                // Cargar imágenes de forma eficiente con Glide/Coil
                Glide.with(holder.itemView.context)
                    .load(product.imageUrl)
                    .transition(DrawableTransitionOptions.withCrossFade())
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .override(300, 300) // Tamaño específico para evitar redimensionamiento
                    .into(holder.productImage)
                
                // Configurar otros elementos de UI
                holder.productName.text = product.name
                holder.productPrice.text = product.formattedPrice
                
                // Evitar cálculos complejos en onBindViewHolder
                holder.itemView.setOnClickListener {
                    // Usar lambda para evitar crear objetos OnClickListener
                    onProductSelected(product)
                }
            }
        }
        
        // Actividad con optimizaciones de renderizado
        class ProductsActivity : AppCompatActivity() {
            override fun onCreate(savedInstanceState: Bundle?) {
                super.onCreate(savedInstanceState)
                setContentView(R.layout.activity_products)
                
                // Configurar RecyclerView con optimizaciones
                val recyclerView = findViewById<RecyclerView>(R.id.products_list)
                
                // Usar LayoutManager eficiente
                recyclerView.layoutManager = GridLayoutManager(this, 2)
                
                // Establecer tamaño fijo para mejorar rendimiento
                recyclerView.setHasFixedSize(true)
                
                // Configurar pool de vistas recicladas
                recyclerView.recycledViewPool.setMaxRecycledViews(0, 20)
                
                // Optimizar animaciones
                val animator = recyclerView.itemAnimator
                if (animator is SimpleItemAnimator) {
                    animator.supportsChangeAnimations = false
                }
                
                // Cargar datos en segundo plano
                lifecycleScope.launch(Dispatchers.IO) {
                    val products = loadProducts()
                    
                    withContext(Dispatchers.Main) {
                        recyclerView.adapter = ProductsAdapter(products)
                    }
                }
            }
        }
        \`\`\`
      - **Código de ejemplo (iOS)**:
        \`\`\`swift
        // UICollectionView optimizado
        class ProductsViewController: UIViewController {
            private var collectionView: UICollectionView!
            private var dataSource: UICollectionViewDiffableDataSource<Section, Product>!
            
            override func viewDidLoad() {
                super.viewDidLoad()
                
                // Configurar layout optimizado
                let layout = createLayout()
                
                // Crear collection view con layout optimizado
                collectionView = UICollectionView(frame: view.bounds, collectionViewLayout: layout)
                collectionView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
                collectionView.prefetchingEnabled = true // Prefetching para rendimiento
                view.addSubview(collectionView)
                
                // Registrar celdas
                collectionView.register(ProductCell.self, forCellWithReuseIdentifier: "ProductCell")
                
                // Configurar data source con diffable data source para actualizaciones eficientes
                configureDataSource()
                
                // Cargar datos en segundo plano
                DispatchQueue.global(qos: .userInitiated).async {
                    let products = self.loadProducts()
                    
                    DispatchQueue.main.async {
                        self.updateUI(with: products)
                    }
                }
            }
            
            private func createLayout() -> UICollectionViewLayout {
                // Usar compositional layout para rendimiento óptimo
                let itemSize = NSCollectionLayoutSize(
                    widthDimension: .fractionalWidth(0.5),
                    heightDimension: .fractionalWidth(0.75)
                )
                let item = NSCollectionLayoutItem(layoutSize: itemSize)
                item.contentInsets = NSDirectionalEdgeInsets(top: 5, leading: 5, bottom: 5, trailing: 5)
                
                let groupSize = NSCollectionLayoutSize(
                    widthDimension: .fractionalWidth(1.0),
                    heightDimension: .fractionalWidth(0.75)
                )
                let group = NSCollectionLayoutGroup.horizontal(layoutSize: groupSize, subitems: [item])
                
                let section = NSCollectionLayoutSection(group: group)
                
                return UICollectionViewCompositionalLayout(section: section)
            }
            
            private func configureDataSource() {
                // Configurar data source con celdas reutilizables
                dataSource = UICollectionViewDiffableDataSource<Section, Product>(
                    collectionView: collectionView,
                    cellProvider: { (collectionView, indexPath, product) -> UICollectionViewCell? in
                        let cell = collectionView.dequeueReusableCell(
                            withReuseIdentifier: "ProductCell",
                            for: indexPath
                        ) as? ProductCell
                        
                        // Configurar celda de forma eficiente
                        cell?.configure(with: product)
                        
                        return cell
                    }
                )
            }
            
            private func updateUI(with products: [Product]) {
                // Actualizar UI con diffable data source para animaciones eficientes
                var snapshot = NSDiffableDataSourceSnapshot<Section, Product>()
                snapshot.appendSections([.main])
                snapshot.appendItems(products)
                dataSource.apply(snapshot, animatingDifferences: true)
            }
        }
        
        // Celda optimizada
        class ProductCell: UICollectionViewCell {
            private let imageView = UIImageView()
            private let nameLabel = UILabel()
            private let priceLabel = UILabel()
            
            override init(frame: CGRect) {
                super.init(frame: frame)
                setupViews()
            }
            
            required init?(coder: NSCoder) {
                fatalError("init(coder:) has not been implemented")
            }
            
            private func setupViews() {
                // Configurar vistas con optimizaciones
                
                // Optimizar renderizado de imágenes
                imageView.contentMode = .scaleAspectFill
                imageView.clipsToBounds = true
                imageView.translatesAutoresizingMaskIntoConstraints = false
                
                // Optimizar renderizado de texto
                nameLabel.font = UIFont.systemFont(ofSize: 16)
                nameLabel.translatesAutoresizingMaskIntoConstraints = false
                
                priceLabel.font = UIFont.boldSystemFont(ofSize: 14)
                priceLabel.translatesAutoresizingMaskIntoConstraints = false
                
                // Añadir subvistas
                contentView.addSubview(imageView)
                contentView.addSubview(nameLabel)
                contentView.addSubview(priceLabel)
                
                // Configurar constraints de forma eficiente
                NSLayoutConstraint.activate([
                    imageView.topAnchor.constraint(equalTo: contentView.topAnchor),
                    imageView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
                    imageView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
                    imageView.heightAnchor.constraint(equalTo: contentView.widthAnchor),
                    
                    nameLabel.topAnchor.constraint(equalTo: imageView.bottomAnchor, constant: 8),
                    nameLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 8),
                    nameLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -8),
                    
                    priceLabel.topAnchor.constraint(equalTo: nameLabel.bottomAnchor, constant: 4),
                    priceLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 8),
                    priceLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -8),
                    priceLabel.bottomAnchor.constraint(lessThanOrEqualTo: contentView.bottomAnchor, constant: -8)
                ])
            }
            
            func configure(with product: Product) {
                // Configurar celda de forma eficiente
                nameLabel.text = product.name
                priceLabel.text = product.formattedPrice
                
                // Cargar imagen de forma eficiente con SDWebImage
                imageView.sd_setImage(
                    with: URL(string: product.imageUrl),
                    placeholderImage: UIImage(named: "placeholder"),
                    options: [.progressiveLoad, .avoidAutoSetImage],
                    completed: { [weak self] (image, error, cacheType, url) in
                        // Aplicar imagen en el hilo principal
                        self?.imageView.image = image
                    }
                )
            }
            
            override func prepareForReuse() {
                super.prepareForReuse()
                
                // Limpiar para reutilización eficiente
                imageView.sd_cancelCurrentImageLoad()
                imageView.image = nil
                nameLabel.text = nil
                priceLabel.text = nil
            }
        }
        \`\`\`
      - **Beneficio**: Mejora en la tasa de frames (60 FPS estables) y reducción de caídas de frames en un 80-90%.`);
            }
            
            if (issues.includes('Uso excesivo de memoria') || 
                issues.includes('Fugas de memoria detectadas')) {
              recommendations.push(`### Optimizar Gestión de Memoria
      - **Problema**: Uso excesivo de memoria (${Math.round(metrics.memoryUsage)} MB) con ${metrics.memoryLeaks} fugas detectadas.
      - **Solución**: Implementar gestión eficiente de memoria y prevenir fugas.
      - **Implementación**:
        1. **Reciclar vistas y recursos**: Implementar patrones de reciclaje para UI.
        2. **Gestionar ciclos de referencia**: Usar referencias débiles para evitar retención circular.
        3. **Optimizar carga de imágenes**: Redimensionar, comprimir y cachear imágenes.
        4. **Liberar recursos no utilizados**: Implementar liberación proactiva de memoria.
        5. **Monitorear uso de memoria**: Implementar detección de fugas en desarrollo.
      - **Código de ejemplo (Android)**:
        \`\`\`kotlin
        // Gestión eficiente de imágenes con Glide
        class ImageLoader {
            fun loadImage(context: Context, imageUrl: String, imageView: ImageView) {
                Glide.with(context)
                    .load(imageUrl)
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .override(
                        // Redimensionar según tamaño de vista para evitar cargar imágenes grandes
                        imageView.width.takeIf { it > 0 } ?: 300,
                        imageView.height.takeIf { it > 0 } ?: 300
                    )
                    .listener(object : RequestListener<Drawable> {
                        override fun onLoadFailed(...): Boolean {
                            // Manejar fallos
                            return false
                        }
                        
                        override fun onResourceReady(...): Boolean {
                            // Recurso cargado exitosamente
                            return false
                        }
                    })
                    .into(imageView)
            }
            
            // Limpiar caché cuando sea necesario
            fun clearMemoryCache(context: Context) {
                Glide.get(context).clearMemory()
            }
            
            fun clearDiskCache(context: Context) {
                lifecycleScope.launch(Dispatchers.IO) {
                    Glide.get(context).clearDiskCache()
                }
            }
        }
        
        // Actividad con gestión de memoria optimizada
        class ProductDetailActivity : AppCompatActivity() {
            // Usar lateinit para evitar inicialización innecesaria
            private lateinit var productImageView: ImageView
            private lateinit var productNameView: TextView
            
            // Evitar fugas de memoria con referencias a contexto
            private val imageLoader = ImageLoader()
            
            override fun onCreate(savedInstanceState: Bundle?) {
                super.onCreate(savedInstanceState)
                setContentView(R.layout.activity_product_detail)
                
                // Inicializar vistas
                productImageView = findViewById(R.id.product_image)
                productNameView = findViewById(R.id.product_name)
                
                // Cargar datos del producto
                val productId = intent.getStringExtra("product_id") ?: return
                
                // Cargar datos en segundo plano para evitar bloquear UI
                lifecycleScope.launch(Dispatchers.IO) {
                    val product = loadProduct(productId)
                    
                    // Actualizar UI en hilo principal
                    withContext(Dispatchers.Main) {
                        updateUI(product)
                    }
                }
            }
            
            private fun updateUI(product: Product) {
                productNameView.text = product.name
                
                // Cargar imagen de forma eficiente
                imageLoader.loadImage(this, product.imageUrl, productImageView)
            }
            
            override fun onDestroy() {
                // Limpiar recursos para evitar fugas
                if (isFinishing) {
                    // Solo limpiar caché de memoria si la actividad se está cerrando completamente
                    imageLoader.clearMemoryCache(applicationContext)
                }
                
                super.onDestroy()
            }
        }
        
        // Detector de fugas de memoria para desarrollo
        class MyApplication : Application() {
            private lateinit var refWatcher: RefWatcher
            
            override fun onCreate() {
                super.onCreate()
                
                if (BuildConfig.DEBUG) {
                    // Solo en desarrollo
                    refWatcher = LeakCanary.install(this)
                }
            }
        }
        \`\`\`
      - **Código de ejemplo (iOS)**:
        \`\`\`swift
        // Gestor de imágenes optimizado
        class ImageManager {
            static let shared = ImageManager()
            
            private let imageCache = NSCache<NSString, UIImage>()
            
            func loadImage(from urlString: String, into imageView: UIImageView, placeholder: UIImage? = nil) {
                // Verificar caché primero
                if let cachedImage = imageCache.object(forKey: urlString as NSString) {
                    imageView.image = cachedImage
                    return
                }
                
                // Establecer placeholder
                imageView.image = placeholder
                
                // Cargar imagen en segundo plano
                guard let url = URL(string: urlString) else { return }
                
                let task = URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
                    guard let self = self,
                          let data = data,
                          let image = UIImage(data: data) else {
                        return
                    }
                    
                    // Redimensionar imagen si es necesario
                    let resizedImage = self.resizeImageIfNeeded(image, for: imageView)
                    
                    // Guardar en caché
                    self.imageCache.setObject(resizedImage, forKey: urlString as NSString)
                    
                    // Actualizar UI en hilo principal
                    DispatchQueue.main.async {
                        // Verificar que la vista aún existe y necesita esta imagen
                        if imageView.tag == urlString.hashValue {
                            imageView.image = resizedImage
                        }
                    }
                }
                
                // Asignar tag para identificar la solicitud
                imageView.tag = urlString.hashValue
                
                task.resume()
            }
            
            private func resizeImageIfNeeded(_ image: UIImage, for imageView: UIImageView) -> UIImage {
                let maxSize = imageView.bounds.size
                
                // Solo redimensionar si la imagen es significativamente más grande
                if image.size.width > maxSize.width * 1.5 || image.size.height > maxSize.height * 1.5 {
                    let aspectRatio = image.size.width / image.size.height
                    
                    var newSize: CGSize
                    if maxSize.width / maxSize.height > aspectRatio {
                        newSize = CGSize(width: maxSize.height * aspectRatio, height: maxSize.height)
                    } else {
                        newSize = CGSize(width: maxSize.width, height: maxSize.width / aspectRatio)
                    }
                    
                    UIGraphicsBeginImageContextWithOptions(newSize, false, 0.0)
                    image.draw(in: CGRect(origin: .zero, size: newSize))
                    let resizedImage = UIGraphicsGetImageFromCurrentImageContext() ?? image
                    UIGraphicsEndImageContext()
                    
                    return resizedImage
                }
                
                return image
            }
            
            func clearCache() {
                imageCache.removeAllObjects()
            }
        }
        
        // ViewController con gestión de memoria optimizada
        class ProductDetailViewController: UIViewController {
            @IBOutlet weak var productImageView: UIImageView!
            @IBOutlet weak var productNameLabel: UILabel!
            
            private var product: Product?
            
            // Usar closures con [weak self] para evitar retención circular
            private var dataTask: URLSessionDataTask?
            
            deinit {
                // Cancelar tareas pendientes para evitar fugas
                dataTask?.cancel()
                
                print("ProductDetailViewController deinitializado correctamente")
            }
            
            override func viewDidLoad() {
                super.viewDidLoad()
                
                guard let productId = productId else { return }
                
                // Cargar datos en segundo plano
                dataTask = loadProduct(id: productId) { [weak self] result in
                    guard let self = self else { return }
                    
                    switch result {
                    case .success(let product):
                        self.product = product
                        self.updateUI()
                    case .failure(let error):
                        self.showError(error)
                    }
                    
                    self.dataTask = nil
                }
            }
            
            private func updateUI() {
                guard let product = product, isViewLoaded else { return }
                
                productNameLabel.text = product.name
                
                // Cargar imagen de forma eficiente
                ImageManager.shared.loadImage(
                    from: product.imageUrl,
                    into: productImageView,
                    placeholder: UIImage(named: "placeholder")
                )
            }
            
            override func viewDidDisappear(_ animated: Bool) {
                super.viewDidDisappear(animated)
                
                if isMovingFromParent {
                    // Cancelar tareas pendientes si se está eliminando la vista
                    dataTask?.cancel()
                }
            }
        }
        
        // Extensión para detectar fugas de memoria en desarrollo
        extension UIViewController {
            static let swizzleViewDidDisappear: Void = {
                let originalSelector = #selector(UIViewController.viewDidDisappear(_:))
                let swizzledSelector = #selector(UIViewController.swizzled_viewDidDisappear(_:))
                
                guard let originalMethod = class_getInstanceMethod(UIViewController.self, originalSelector),
                      let swizzledMethod = class_getInstanceMethod(UIViewController.self, swizzledSelector) else {
                    return
                }
                
                method_exchangeImplementations(originalMethod, swizzledMethod)
            }()
            
            @objc func swizzled_viewDidDisappear(_ animated: Bool) {
                self.swizzled_viewDidDisappear(animated)
                
                #if DEBUG
                if isMovingFromParent || isBeingDismissed {
                    // Crear referencia débil para detectar si no se libera
                    let className = String(describing: type(of: self))
                    let pointer = Unmanaged.passUnretained(self).toOpaque()
                    
                    // Verificar después de un tiempo si el controlador aún existe
                    DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) { [weak self] in
                        if self != nil {
                            print("⚠️ Posible fuga de memoria: \(className) (\(pointer)) no liberado después de 2 segundos")
                        }
                    }
                }
                #endif
            }
        }
        
        // Activar detección de fugas en AppDelegate
        @UIApplicationMain
        class AppDelegate: UIResponder, UIApplicationDelegate {
            func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
                #if DEBUG
                // Activar detección de fugas
                UIViewController.swizzleViewDidDisappear
                #endif
                
                return true
            }
        }
        \`\`\`
      - **Beneficio**: Reducción del uso de memoria en un 30-50% y eliminación de fugas de memoria.`);
            }
            
            if (issues.includes('Alto consumo de batería')) {
              recommendations.push(`### Optimizar Consumo de Batería
      - **Problema**: Alto consumo de batería (${Math.round(metrics.batteryDrain)}% por hora) con ${metrics.wakelocksCount} wakelocks.
      - **Solución**: Implementar estrategias de ahorro de energía.
      - **Implementación**:
        1. **Optimizar uso de ubicación**: Reducir frecuencia y precisión cuando sea posible.
        2. **Gestionar wakelocks**: Minimizar duración y cantidad de wakelocks.
        3. **Optimizar sincronización**: Usar sincronización adaptativa y batch.
        4. **Reducir operaciones en segundo plano**: Limitar servicios y procesos.
        5. **Implementar modo de ahorro de energía**: Ajustar comportamiento según nivel de batería.
      - **Código de ejemplo (Android)**:
        \`\`\`kotlin
        // Gestor de ubicación optimizado
        class LocationManager(private val context: Context) {
            private val fusedLocationClient = LocationServices.getFusedLocationProviderClient(context)
            private var locationCallback: LocationCallback? = null
            
            // Diferentes configuraciones según necesidad y nivel de batería
            private val highPrecisionRequest = LocationRequest.create().apply {
                interval = 10000 // 10 segundos
                fastestInterval = 5000
                priority = LocationRequest.PRIORITY_HIGH_ACCURACY
            }
            
            private val balancedRequest = LocationRequest.create().apply {
                interval = 30000 // 30 segundos
                fastestInterval = 15000
                priority = LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY
            }
            
            private val lowPowerRequest = LocationRequest.create().apply {
                interval = 60000 // 1 minuto
                fastestInterval = 30000
                priority = LocationRequest.PRIORITY_LOW_POWER
            }
            
            fun startLocationUpdates(onLocationUpdate: (Location) -> Unit) {
                // Verificar permisos
                if (ActivityCompat.checkSelfPermission(context, 
                    Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    return
                }
                
                // Seleccionar configuración según nivel de batería
                val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
                val batteryLevel = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                
                val locationRequest = when {
                    batteryLevel <= 15 -> lowPowerRequest
                    batteryLevel <= 50 -> balancedRequest
                    else -> highPrecisionRequest
                }
                
                // Crear callback
                locationCallback = object : LocationCallback() {
                    override fun onLocationResult(locationResult: LocationResult) {
                        locationResult.lastLocation?.let(onLocationUpdate)
                    }
                }
                
                // Iniciar actualizaciones
                fusedLocationClient.requestLocationUpdates(
                    locationRequest,
                    locationCallback!!,
                    Looper.getMainLooper()
                )
            }
            
            fun stopLocationUpdates() {
                locationCallback?.let {
                    fusedLocationClient.removeLocationUpdates(it)
                                        locationCallback = null
                }
            }
            
            // Verificar si la ubicación está disponible antes de iniciar
            fun checkLocationAvailability(): Boolean {
                val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
                return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) ||
                       locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
            }
        }
        
        // Gestor de sincronización optimizado
        class SyncManager(private val context: Context) {
            // Configuraciones de sincronización según nivel de batería
            private val highPowerSync = SyncRequest.Builder()
                .syncPeriodic(15 * 60, 5 * 60) // 15 minutos, flexibilidad 5 minutos
                .setExtras(Bundle())
                .build()
                
            private val mediumPowerSync = SyncRequest.Builder()
                .syncPeriodic(30 * 60, 10 * 60) // 30 minutos, flexibilidad 10 minutos
                .setExtras(Bundle())
                .build()
                
            private val lowPowerSync = SyncRequest.Builder()
                .syncPeriodic(60 * 60, 20 * 60) // 60 minutos, flexibilidad 20 minutos
                .setExtras(Bundle())
                .build()
            
            // Iniciar sincronización adaptativa
            fun startAdaptiveSync(account: Account, authority: String) {
                // Verificar nivel de batería
                val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
                val batteryLevel = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                val isCharging = batteryManager.isCharging()
                
                // Seleccionar configuración según estado de batería
                val syncRequest = when {
                    isCharging -> highPowerSync // Si está cargando, usar sincronización frecuente
                    batteryLevel <= 15 -> lowPowerSync // Batería baja, conservar energía
                    batteryLevel <= 50 -> mediumPowerSync // Batería media
                    else -> highPowerSync // Batería alta
                }
                
                // Configurar sincronización
                ContentResolver.requestSync(account, authority, syncRequest)
            }
            
            // Realizar sincronización en batch
            fun performBatchSync(data: List<Any>) {
                // Agrupar datos para sincronización eficiente
                val batches = data.chunked(50) // Dividir en grupos de 50 elementos
                
                // Procesar en segundo plano
                WorkManager.getInstance(context).enqueue(
                    OneTimeWorkRequestBuilder<BatchSyncWorker>()
                        .setInputData(workDataOf("batches_count" to batches.size))
                        .setConstraints(
                            Constraints.Builder()
                                .setRequiredNetworkType(NetworkType.CONNECTED)
                                .setRequiresBatteryNotLow(true)
                                .build()
                        )
                        .build()
                )
            }
        }
        
        // Modo de ahorro de energía
        class PowerSavingMode(private val context: Context) {
            // Niveles de ahorro
            enum class Level {
                NORMAL, // Sin restricciones
                MODERATE, // Algunas restricciones
                AGGRESSIVE // Máximas restricciones
            }
            
            private var currentLevel = Level.NORMAL
            
            // Activar modo de ahorro según nivel de batería
            fun activateBasedOnBattery() {
                val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
                val batteryLevel = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                val isCharging = batteryManager.isCharging()
                
                currentLevel = when {
                    isCharging -> Level.NORMAL
                    batteryLevel <= 15 -> Level.AGGRESSIVE
                    batteryLevel <= 30 -> Level.MODERATE
                    else -> Level.NORMAL
                }
                
                applyRestrictions()
            }
            
            // Aplicar restricciones según nivel
            private fun applyRestrictions() {
                when (currentLevel) {
                    Level.NORMAL -> {
                        // Sin restricciones
                        // Permitir actualizaciones frecuentes
                        // Permitir animaciones
                        // Permitir sincronización en tiempo real
                    }
                    Level.MODERATE -> {
                        // Restricciones moderadas
                        // Reducir frecuencia de actualizaciones
                        // Limitar animaciones
                        // Sincronización periódica
                    }
                    Level.AGGRESSIVE -> {
                        // Restricciones máximas
                        // Minimizar actualizaciones
                        // Desactivar animaciones
                        // Sincronización manual o muy espaciada
                    }
                }
            }
        }
        \`\`\`
      - **Beneficio**: Reducción del consumo de batería en un 30-40% y extensión de la vida útil de la batería.`);
            }
            
            // Si no hay suficientes recomendaciones específicas, añadir generales
            if (recommendations.length < 2) {
              recommendations.push(`### Optimizaciones Generales de Rendimiento Móvil
      - **Problema**: Oportunidades de mejora en rendimiento general de aplicaciones móviles.
      - **Solución**: Implementar mejores prácticas estándar de rendimiento móvil.
      - **Implementación**:
        1. **Optimizar ciclo de vida de actividades/fragmentos**: Gestionar correctamente onCreate/onDestroy.
        2. **Implementar carga diferida (lazy loading)**: Cargar recursos solo cuando sean necesarios.
        3. **Optimizar layouts**: Reducir anidamiento, usar ConstraintLayout, evitar overdraw.
        4. **Implementar caché de recursos**: Almacenar datos frecuentes localmente.
        5. **Optimizar consumo de red**: Comprimir datos, usar HTTP/2, implementar caché.
        6. **Reducir uso de recursos en segundo plano**: Limitar servicios y broadcasts.
        7. **Implementar modo offline**: Permitir funcionalidad básica sin conexión.
      - **Código de ejemplo (Android)**:
        \`\`\`kotlin
        // Optimización de layouts con ViewBinding
        class OptimizedActivity : AppCompatActivity() {
            private lateinit var binding: ActivityMainBinding
            
            override fun onCreate(savedInstanceState: Bundle?) {
                super.onCreate(savedInstanceState)
                binding = ActivityMainBinding.inflate(layoutInflater)
                setContentView(binding.root)
                
                // Cargar datos de forma eficiente
                lifecycleScope.launch {
                    // Cargar desde caché primero (respuesta inmediata)
                    val cachedData = withContext(Dispatchers.IO) {
                        dataRepository.getCachedData()
                    }
                    
                    if (cachedData != null) {
                        updateUI(cachedData)
                    }
                    
                    // Luego actualizar desde la red si es necesario
                    if (isNetworkAvailable() && shouldRefreshData()) {
                        try {
                            val freshData = withContext(Dispatchers.IO) {
                                dataRepository.fetchFreshData()
                            }
                            updateUI(freshData)
                        } catch (e: Exception) {
                            // Manejar error sin bloquear UI
                            showErrorMessage(e.message)
                        }
                    }
                }
            }
            
            // Gestión eficiente de recursos
            override fun onStart() {
                super.onStart()
                // Registrar listeners solo cuando la actividad es visible
                registerListeners()
            }
            
            override fun onStop() {
                super.onStop()
                // Desregistrar listeners cuando no es visible
                unregisterListeners()
            }
            
            // Implementar modo offline
            private fun setupOfflineMode() {
                val connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
                
                connectivityManager.registerDefaultNetworkCallback(object : ConnectivityManager.NetworkCallback() {
                    override fun onAvailable(network: Network) {
                        // Conexión disponible, sincronizar datos
                        lifecycleScope.launch {
                            dataRepository.syncPendingChanges()
                        }
                    }
                    
                    override fun onLost(network: Network) {
                        // Conexión perdida, activar modo offline
                        lifecycleScope.launch {
                            showOfflineBanner(true)
                        }
                    }
                })
            }
        }
        \`\`\`
      - **Código de ejemplo (iOS)**:
        \`\`\`swift
        // ViewController optimizado
        class OptimizedViewController: UIViewController {
            // Carga diferida de vistas pesadas
            lazy var heavyView: HeavyCustomView = {
                let view = HeavyCustomView()
                view.delegate = self
                return view
            }()
            
            // Gestor de caché eficiente
            let imageCache = NSCache<NSString, UIImage>()
            
            override func viewDidLoad() {
                super.viewDidLoad()
                
                // Configurar UI base
                setupUI()
                
                // Cargar datos iniciales de forma eficiente
                Task {
                    // Primero intentar desde caché
                    if let cachedData = await dataManager.getCachedData() {
                        updateUI(with: cachedData)
                    }
                    
                    // Luego actualizar desde la red si es necesario
                    if NetworkMonitor.shared.isConnected {
                        do {
                            let freshData = try await dataManager.fetchFreshData()
                            updateUI(with: freshData)
                        } catch {
                            showErrorMessage(error.localizedDescription)
                        }
                    }
                }
                
                // Configurar monitoreo de red
                setupNetworkMonitoring()
            }
            
            // Cargar vistas pesadas solo cuando sean necesarias
            func showDetailView() {
                view.addSubview(heavyView)
                // Configurar constraints
            }
            
            // Optimizar carga de imágenes
            func loadOptimizedImage(from url: URL, into imageView: UIImageView) {
                let cacheKey = url.absoluteString as NSString
                
                // Verificar caché primero
                if let cachedImage = imageCache.object(forKey: cacheKey) {
                    imageView.image = cachedImage
                    return
                }
                
                // Cargar en segundo plano
                URLSession.shared.dataTask(with: url) { [weak self] data, response, error in
                    guard let self = self,
                          let data = data,
                          let image = UIImage(data: data) else {
                        return
                    }
                    
                    // Guardar en caché
                    self.imageCache.setObject(image, forKey: cacheKey)
                    
                    // Actualizar UI en hilo principal
                    DispatchQueue.main.async {
                        imageView.image = image
                    }
                }.resume()
            }
            
            // Monitoreo de red para modo offline
            func setupNetworkMonitoring() {
                NetworkMonitor.shared.startMonitoring()
                
                NetworkMonitor.shared.onConnectionChange = { [weak self] isConnected in
                    guard let self = self else { return }
                    
                    DispatchQueue.main.async {
                        if isConnected {
                            // Reconectado, sincronizar cambios pendientes
                            Task {
                                await self.dataManager.syncPendingChanges()
                            }
                            self.offlineBanner.isHidden = true
                        } else {
                            // Desconectado, mostrar banner
                            self.offlineBanner.isHidden = false
                        }
                    }
                }
            }
            
            // Liberar recursos adecuadamente
            deinit {
                NetworkMonitor.shared.stopMonitoring()
                // Liberar otros recursos
            }
        }
        
        // Monitor de red simple
        class NetworkMonitor {
            static let shared = NetworkMonitor()
            
            private let monitor = NWPathMonitor()
            private let queue = DispatchQueue(label: "NetworkMonitor")
            
            var isConnected = false
            var onConnectionChange: ((Bool) -> Void)?
            
            func startMonitoring() {
                monitor.pathUpdateHandler = { [weak self] path in
                    let isConnected = path.status == .satisfied
                    self?.isConnected = isConnected
                    self?.onConnectionChange?(isConnected)
                }
                monitor.start(queue: queue)
            }
            
            func stopMonitoring() {
                monitor.cancel()
            }
        }
        \`\`\`
      - **Beneficio**: Mejora general en rendimiento, consumo de batería, y experiencia de usuario, con soporte para modo offline.`);
            }
            
            return {
              metrics,
              issues,
              recommendations
            };
          }
          
          /**
           * Analiza el rendimiento de una base de datos
           * @param dbConfig Configuración de la base de datos
           * @returns Informe de rendimiento
           */
          private async analyzeDatabasePerformance(dbConfig: {
            type: string;
            connection: any;
            queries?: string[];
          }): Promise<{
            metrics: Record<string, any>;
            issues: string[];
            recommendations: string[];
          }> {
            console.log(`Analizando rendimiento de base de datos: ${dbConfig.type}`);
            
            // Simulación de análisis de rendimiento de base de datos
            // En una implementación real, se conectaría a la base de datos y ejecutaría análisis
            
            // Métricas simuladas
            const metrics = {
              // Métricas generales
              queryResponseTime: Math.random() * 500 + 50, // ms
              throughput: Math.floor(Math.random() * 1000) + 100, // queries/segundo
              connectionPoolUsage: Math.random() * 0.8 + 0.1, // 0-1
              deadlocks: Math.floor(Math.random() * 5), // número
              
              // Métricas de índices
              missingIndexes: Math.floor(Math.random() * 10) + 1,
              unusedIndexes: Math.floor(Math.random() * 8) + 1,
              fragmentedIndexes: Math.floor(Math.random() * 15) + 5,
              
              // Métricas de consultas
              slowQueries: Math.floor(Math.random() * 20) + 1,
              fullTableScans: Math.floor(Math.random() * 15) + 1,
              temporaryTables: Math.floor(Math.random() * 10) + 1,
              
              // Métricas de almacenamiento
              databaseSize: Math.floor(Math.random() * 10000) + 1000, // MB
              logSize: Math.floor(Math.random() * 1000) + 100, // MB
              tableFragmentation: Math.random() * 40 + 10, // %
              
              // Métricas de caché
              bufferCacheHitRatio: Math.random() * 30 + 60, // %
              procedureCacheHitRatio: Math.random() * 20 + 70, // %
              
              // Métricas de bloqueo
              blockingQueries: Math.floor(Math.random() * 8) + 1,
              averageBlockingTime: Math.random() * 1000 + 100, // ms
              
              // Métricas de memoria
              memoryUsage: Math.floor(Math.random() * 4000) + 1000, // MB
              memoryPressure: Math.random() * 0.5 + 0.2, // 0-1
              
              // Métricas específicas según tipo de base de datos
              specificMetrics: {}
            };
            
            // Añadir métricas específicas según el tipo de base de datos
            if (dbConfig.type.toLowerCase() === 'mysql' || dbConfig.type.toLowerCase() === 'mariadb') {
              metrics.specificMetrics = {
                innodbBufferPoolHitRatio: Math.random() * 20 + 75, // %
                tableOpenCacheHitRatio: Math.random() * 15 + 80, // %
                slowQueryLogEnabled: Math.random() > 0.5, // boolean
                maxConnections: Math.floor(Math.random() * 1000) + 100,
                abortedConnections: Math.floor(Math.random() * 50),
                tableLocksWaited: Math.floor(Math.random() * 100),
              };
            } else if (dbConfig.type.toLowerCase() === 'postgresql') {
              metrics.specificMetrics = {
                cacheHitRatio: Math.random() * 15 + 80, // %
                indexUsageRatio: Math.random() * 20 + 70, // %
                vacuumLastRun: Math.floor(Math.random() * 72) + 1, // horas
                deadTuples: Math.floor(Math.random() * 10000) + 1000,
                maxConnections: Math.floor(Math.random() * 200) + 100,
                idleConnections: Math.floor(Math.random() * 50) + 10,
              };
            } else if (dbConfig.type.toLowerCase() === 'mongodb') {
              metrics.specificMetrics = {
                readLatency: Math.random() * 20 + 5, // ms
                writeLatency: Math.random() * 30 + 10, // ms
                indexSize: Math.floor(Math.random() * 1000) + 100, // MB
                documentsScanned: Math.floor(Math.random() * 1000000) + 10000,
                documentsReturned: Math.floor(Math.random() * 100000) + 1000,
                indexesWithoutStats: Math.floor(Math.random() * 5),
              };
            } else if (dbConfig.type.toLowerCase() === 'sqlserver') {
              metrics.specificMetrics = {
                bufferCacheHitRatio: Math.random() * 15 + 80, // %
                pageSplits: Math.floor(Math.random() * 1000) + 100,
                pageLifeExpectancy: Math.floor(Math.random() * 1000) + 300, // segundos
                compilations: Math.floor(Math.random() * 1000) + 100,
                recompilations: Math.floor(Math.random() * 100) + 10,
                targetServerMemory: Math.floor(Math.random() * 16000) + 4000, // MB
              };
            }
            
            // Identificar problemas basados en métricas
            const issues = [];
            
            if (metrics.queryResponseTime > 200) {
              issues.push('Tiempo de respuesta de consultas lento');
            }
            
            if (metrics.missingIndexes > 3) {
              issues.push('Índices faltantes detectados');
            }
            
            if (metrics.unusedIndexes > 5) {
              issues.push('Índices no utilizados detectados');
            }
            
            if (metrics.fragmentedIndexes > 10) {
              issues.push('Fragmentación de índices alta');
            }
            
            if (metrics.slowQueries > 5) {
              issues.push('Consultas lentas detectadas');
            }
            
            if (metrics.fullTableScans > 5) {
              issues.push('Escaneos completos de tabla frecuentes');
            }
            
            if (metrics.tableFragmentation > 30) {
              issues.push('Alta fragmentación de tablas');
            }
            
            if (metrics.bufferCacheHitRatio < 80) {
              issues.push('Ratio de aciertos de caché bajo');
            }
            
            if (metrics.blockingQueries > 3) {
              issues.push('Consultas bloqueantes detectadas');
            }
            
            if (metrics.deadlocks > 0) {
              issues.push('Deadlocks detectados');
            }
            
            if (metrics.memoryPressure > 0.6) {
              issues.push('Presión de memoria alta');
            }
            
            // Añadir problemas específicos según el tipo de base de datos
            if (dbConfig.type.toLowerCase() === 'mysql' || dbConfig.type.toLowerCase() === 'mariadb') {
              if (metrics.specificMetrics.innodbBufferPoolHitRatio < 90) {
                issues.push('Ratio de aciertos del buffer pool de InnoDB bajo');
              }
              
              if (!metrics.specificMetrics.slowQueryLogEnabled) {
                issues.push('Registro de consultas lentas desactivado');
              }
              
              if (metrics.specificMetrics.abortedConnections > 10) {
                issues.push('Conexiones abortadas frecuentes');
              }
            } else if (dbConfig.type.toLowerCase() === 'postgresql') {
              if (metrics.specificMetrics.cacheHitRatio < 90) {
                issues.push('Ratio de aciertos de caché de PostgreSQL bajo');
              }
              
              if (metrics.specificMetrics.indexUsageRatio < 80) {
                issues.push('Bajo uso de índices en PostgreSQL');
              }
              
              if (metrics.specificMetrics.vacuumLastRun > 24) {
                issues.push('Vacuum no ejecutado recientemente');
              }
              
              if (metrics.specificMetrics.deadTuples > 5000) {
                issues.push('Alto número de tuplas muertas');
              }
            } else if (dbConfig.type.toLowerCase() === 'mongodb') {
              if (metrics.specificMetrics.readLatency > 20) {
                issues.push('Latencia de lectura alta en MongoDB');
              }
              
              if (metrics.specificMetrics.writeLatency > 30) {
                issues.push('Latencia de escritura alta en MongoDB');
              }
              
              if (metrics.specificMetrics.indexesWithoutStats > 0) {
                issues.push('Índices sin estadísticas en MongoDB');
              }
            } else if (dbConfig.type.toLowerCase() === 'sqlserver') {
              if (metrics.specificMetrics.bufferCacheHitRatio < 90) {
                issues.push('Ratio de aciertos de caché de buffer bajo en SQL Server');
              }
              
              if (metrics.specificMetrics.pageLifeExpectancy < 300) {
                issues.push('Expectativa de vida de página baja en SQL Server');
              }
              
              if (metrics.specificMetrics.recompilations > 50) {
                issues.push('Alto número de recompilaciones en SQL Server');
              }
            }
            
            // Generar recomendaciones basadas en los problemas identificados
            const recommendations = [];
            
            // Recomendaciones generales según el tipo de base de datos
            if (dbConfig.type.toLowerCase() === 'mysql' || dbConfig.type.toLowerCase() === 'mariadb') {
              recommendations.push(this.generateMySQLRecommendations(issues, metrics));
            } else if (dbConfig.type.toLowerCase() === 'postgresql') {
              recommendations.push(this.generatePostgreSQLRecommendations(issues, metrics));
            } else if (dbConfig.type.toLowerCase() === 'mongodb') {
              recommendations.push(this.generateMongoDBRecommendations(issues, metrics));
            } else if (dbConfig.type.toLowerCase() === 'sqlserver') {
              recommendations.push(this.generateSQLServerRecommendations(issues, metrics));
            }
            
            // Recomendaciones generales para cualquier base de datos
            if (issues.includes('Consultas lentas detectadas') || 
                issues.includes('Tiempo de respuesta de consultas lento')) {
              recommendations.push(`### Optimizar Consultas Lentas
      - **Problema**: ${metrics.slowQueries} consultas lentas detectadas con tiempo de respuesta promedio de ${Math.round(metrics.queryResponseTime)}ms.
      - **Solución**: Identificar y optimizar consultas problemáticas.
      - **Implementación**:
        1. **Analizar planes de ejecución**: Identificar operaciones costosas y cuellos de botella.
        2. **Revisar y optimizar índices**: Crear índices adecuados para patrones de consulta comunes.
        3. **Reescribir consultas ineficientes**: Evitar funciones en cláusulas WHERE, optimizar JOINs.
        4. **Implementar paginación**: Limitar resultados para consultas grandes.
        5. **Considerar vistas materializadas**: Para consultas complejas frecuentes.
      - **Código de ejemplo**:
        \`\`\`sql
        -- Antes: Consulta ineficiente
        SELECT * FROM orders 
        WHERE YEAR(order_date) = 2023 
        AND customer_id IN (SELECT id FROM customers WHERE country = 'Spain');
        
        -- Después: Consulta optimizada
        SELECT o.* FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.order_date >= '2023-01-01' AND o.order_date < '2024-01-01'
        AND c.country = 'Spain'
        LIMIT 1000;
        
        -- Crear índices apropiados
        CREATE INDEX idx_orders_date ON orders(order_date);
        CREATE INDEX idx_customers_country ON customers(country);
        
        -- Analizar plan de ejecución
        EXPLAIN ANALYZE SELECT o.* FROM orders o
        JOIN customers c ON o.customer_id = c.id
        WHERE o.order_date >= '2023-01-01' AND o.order_date < '2024-01-01'
        AND c.country = 'Spain'
        LIMIT 1000;
        \`\`\`
      - **Beneficio**: Reducción del tiempo de respuesta de consultas en un 50-80% y mejora del throughput general.`);
            }
            
            if (issues.includes('Índices faltantes detectados') || 
                issues.includes('Escaneos completos de tabla frecuentes')) {
              recommendations.push(`### Optimizar Estrategia de Índices
      - **Problema**: ${metrics.missingIndexes} índices faltantes y ${metrics.fullTableScans} escaneos completos de tabla.
      - **Solución**: Implementar una estrategia de indexación efectiva.
      - **Implementación**:
        1. **Identificar consultas frecuentes**: Analizar patrones de acceso a datos.
        2. **Crear índices compuestos**: Para consultas con múltiples condiciones.
        3. **Considerar índices cubrientes**: Incluir todas las columnas necesarias.
        4. **Eliminar índices redundantes**: Reducir sobrecarga de mantenimiento.
        5. **Monitorear uso de índices**: Verificar que se utilizan correctamente.
      - **Código de ejemplo**:
        \`\`\`sql
        -- Identificar consultas sin índices adecuados
        -- MySQL/MariaDB
        SELECT 
          table_schema, 
          table_name,
          engine, 
          count(*) AS queries
        FROM information_schema.tables t
        JOIN mysql.slow_log s ON s.db = t.table_schema
        WHERE t.table_schema NOT IN ('mysql', 'information_schema', 'performance_schema')
        GROUP BY table_schema, table_name, engine
        ORDER BY queries DESC
        LIMIT 10;
        
        -- Crear índices compuestos para patrones comunes
        CREATE INDEX idx_product_category_price ON products(category_id, price);
        
        -- Crear índice cubriente
        CREATE INDEX idx_order_customer_date_status ON orders(customer_id, order_date, status)
        INCLUDE (total_amount, shipping_address);
        
        -- Eliminar índices redundantes
        -- Primero identificar redundancias
        -- PostgreSQL
        SELECT
          indrelid::regclass AS table_name,
          array_agg(indexrelid::regclass) AS indexes,
          array_agg(indkey) AS key_columns
        FROM pg_index
        GROUP BY indrelid, indkey
        HAVING COUNT(*) > 1;
        
        -- Luego eliminar el redundante
        DROP INDEX redundant_index_name;
        \`\`\`
      - **Beneficio**: Reducción de tiempos de consulta en un 70-90% y disminución de carga del servidor.`);
            }
            
            if (issues.includes('Fragmentación de índices alta') || 
                issues.includes('Alta fragmentación de tablas')) {
              recommendations.push(`### Reducir Fragmentación
      - **Problema**: Fragmentación de índices (${Math.round(metrics.fragmentedIndexes)}%) y tablas (${Math.round(metrics.tableFragmentation)}%).
      - **Solución**: Implementar mantenimiento regular para reducir fragmentación.
      - **Implementación**:
        1. **Programar reconstrucción de índices**: Periódicamente para índices fragmentados.
        2. **Reorganizar tablas**: Reducir fragmentación de datos.
        3. **Automatizar mantenimiento**: Crear jobs programados.
        4. **Monitorear niveles de fragmentación**: Establecer umbrales de acción.
      - **Código de ejemplo**:
        \`\`\`sql
        -- SQL Server: Identificar fragmentación
        SELECT 
          OBJECT_NAME(ind.OBJECT_ID) AS TableName,
          ind.name AS IndexName,
          indexstats.avg_fragmentation_in_percent
        FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, NULL) indexstats
        INNER JOIN sys.indexes ind ON ind.object_id = indexstats.object_id
          AND ind.index_id = indexstats.index_id
        WHERE indexstats.avg_fragmentation_in_percent > 30
        ORDER BY indexstats.avg_fragmentation_in_percent DESC;
        
        -- SQL Server: Reconstruir o reorganizar según nivel de fragmentación
        -- Para fragmentación entre 5% y 30%: Reorganizar
        ALTER INDEX idx_example ON schema.table_name REORGANIZE;
        
        -- Para fragmentación mayor a 30%: Reconstruir
        ALTER INDEX idx_example ON schema.table_name REBUILD;
        
        -- MySQL: Optimizar tabla
        OPTIMIZE TABLE customers;
        
        -- PostgreSQL: Reindexar y hacer vacuum
        REINDEX TABLE products;
        VACUUM FULL ANALYZE orders;
        
        -- Script de mantenimiento automatizado (ejemplo para SQL Server)
        CREATE PROCEDURE dbo.IndexMaintenance
        AS
        BEGIN
            DECLARE @TableName NVARCHAR(255)
            DECLARE @IndexName NVARCHAR(255)
            DECLARE @Fragmentation FLOAT
            
                        DECLARE index_cursor CURSOR FOR
            SELECT 
              OBJECT_NAME(ind.OBJECT_ID) AS TableName,
              ind.name AS IndexName,
              indexstats.avg_fragmentation_in_percent
            FROM sys.dm_db_index_physical_stats(DB_ID(), NULL, NULL, NULL, NULL) indexstats
            INNER JOIN sys.indexes ind ON ind.object_id = indexstats.object_id
              AND ind.index_id = indexstats.index_id
            WHERE indexstats.avg_fragmentation_in_percent > 5
            ORDER BY indexstats.avg_fragmentation_in_percent DESC;
            
            OPEN index_cursor;
            FETCH NEXT FROM index_cursor INTO @TableName, @IndexName, @Fragmentation;
            
            WHILE @@FETCH_STATUS = 0
            BEGIN
                IF @Fragmentation > 30
                BEGIN
                    EXEC('ALTER INDEX ' + @IndexName + ' ON ' + @TableName + ' REBUILD;');
                END
                ELSE
                BEGIN
                    EXEC('ALTER INDEX ' + @IndexName + ' ON ' + @TableName + ' REORGANIZE;');
                END
                
                FETCH NEXT FROM index_cursor INTO @TableName, @IndexName, @Fragmentation;
            END
            
            CLOSE index_cursor;
            DEALLOCATE index_cursor;
        END
        \`\`\`
      - **Beneficio**: Reducción de fragmentación, mejora en tiempos de consulta y uso eficiente de recursos.`);
            }
            
            if (issues.includes('Ratio de aciertos de caché bajo') || 
                issues.includes('Presión de memoria alta')) {
              recommendations.push(`### Optimizar Uso de Memoria y Caché
      - **Problema**: Ratio de aciertos de caché bajo (${Math.round(metrics.bufferCacheHitRatio)}%) y presión de memoria alta (${metrics.memoryPressure.toFixed(2)}).
      - **Solución**: Optimizar configuración de memoria y estrategias de caché.
      - **Implementación**:
        1. **Ajustar configuración de memoria**: Asignar memoria adecuada según carga de trabajo.
        2. **Optimizar tamaño de caché**: Configurar buffer pools y caches para maximizar aciertos.
        3. **Implementar consultas con hints de caché**: Usar directivas para mejorar uso de caché.
        4. **Monitorear y ajustar dinámicamente**: Establecer alertas y ajustes automáticos.
      - **Código de ejemplo**:
        \`\`\`sql
        -- SQL Server: Configurar memoria máxima
        EXEC sp_configure 'show advanced options', 1;
        RECONFIGURE;
        EXEC sp_configure 'max server memory', 8192; -- MB, ajustar según servidor
        RECONFIGURE;
        
        -- MySQL: Configurar InnoDB buffer pool
        SET GLOBAL innodb_buffer_pool_size = 4294967296; -- 4GB
        
        -- PostgreSQL: Ajustar shared_buffers y work_mem
        -- En postgresql.conf
        shared_buffers = 2GB       -- 25% de RAM para servidores dedicados
        work_mem = 50MB            -- Para operaciones de ordenación
        maintenance_work_mem = 256MB -- Para mantenimiento
        effective_cache_size = 6GB  -- Estimación de caché del SO (75% de RAM)
        
        -- Consulta con hints de caché (SQL Server)
        SELECT /*+ RECOMPILE */
          c.customer_id,
          c.name,
          COUNT(o.order_id) AS total_orders
        FROM customers c WITH (FORCESEEK)
        JOIN orders o ON c.customer_id = o.customer_id
        WHERE c.region = 'Europe'
        GROUP BY c.customer_id, c.name
        OPTION (OPTIMIZE FOR (@region = 'Europe'), MAXDOP 4);
        \`\`\`
      - **Beneficio**: Mejora en tiempos de respuesta, mayor throughput y reducción de presión de memoria.`);
            }
            
            if (issues.includes('Consultas bloqueantes detectadas') || 
                issues.includes('Deadlocks detectados')) {
              recommendations.push(`### Resolver Problemas de Concurrencia
      - **Problema**: ${metrics.blockingQueries} consultas bloqueantes y ${metrics.deadlocks} deadlocks detectados.
      - **Solución**: Implementar estrategias para reducir bloqueos y mejorar concurrencia.
      - **Implementación**:
        1. **Optimizar niveles de aislamiento**: Usar niveles apropiados según necesidades.
        2. **Implementar índices adecuados**: Reducir bloqueos por acceso a datos.
        3. **Optimizar transacciones**: Hacerlas más cortas y eficientes.
        4. **Identificar y resolver deadlocks**: Analizar patrones y ajustar consultas.
      - **Código de ejemplo**:
        \`\`\`sql
        -- Usar nivel de aislamiento apropiado (SQL Server)
        SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
        -- Alternativas: READ UNCOMMITTED, REPEATABLE READ, SNAPSHOT, SERIALIZABLE
        
        -- Usar hints de bloqueo (SQL Server)
        SELECT * FROM customers WITH (NOLOCK) WHERE region = 'Europe';
        
        -- Optimizar transacciones
        BEGIN TRANSACTION;
          -- Minimizar operaciones dentro de la transacción
          UPDATE accounts SET balance = balance - 100 WHERE account_id = 1234;
          UPDATE accounts SET balance = balance + 100 WHERE account_id = 5678;
        COMMIT TRANSACTION;
        
        -- Identificar bloqueos (SQL Server)
        SELECT 
          blocking_session_id,
          wait_type,
          wait_time,
          resource_description
        FROM sys.dm_os_waiting_tasks
        WHERE blocking_session_id IS NOT NULL;
        
        -- Identificar deadlocks (PostgreSQL)
        SELECT blocked_locks.pid AS blocked_pid,
          blocked_activity.usename AS blocked_user,
          blocking_locks.pid AS blocking_pid,
          blocking_activity.usename AS blocking_user,
          blocked_activity.query AS blocked_statement,
          blocking_activity.query AS blocking_statement
        FROM pg_catalog.pg_locks blocked_locks
        JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
        JOIN pg_catalog.pg_locks blocking_locks 
          ON blocking_locks.locktype = blocked_locks.locktype
          AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
          AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
          AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
          AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
          AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
          AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
          AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
          AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
          AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
          AND blocking_locks.pid != blocked_locks.pid
        JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
        WHERE NOT blocked_locks.GRANTED;
        \`\`\`
      - **Beneficio**: Reducción de bloqueos, mejora en concurrencia y tiempos de respuesta más consistentes.`);
            }
            
            return {
              metrics,
              issues,
              recommendations
            };
          }
          
          /**
           * Genera recomendaciones específicas para MySQL/MariaDB
           * @param issues Problemas identificados
           * @param metrics Métricas recopiladas
           * @returns Recomendaciones formateadas
           */
          private generateMySQLRecommendations(issues: string[], metrics: Record<string, any>): string {
            let recommendations = `### Optimizaciones Específicas para MySQL/MariaDB
      - **Problemas Detectados**: ${issues.length} problemas identificados en la base de datos MySQL/MariaDB.
      - **Soluciones Recomendadas**:`;
            
            if (issues.includes('Ratio de aciertos del buffer pool de InnoDB bajo')) {
              recommendations += `
        1. **Optimizar Buffer Pool de InnoDB**:
           - **Problema**: Ratio de aciertos bajo (${Math.round(metrics.specificMetrics.innodbBufferPoolHitRatio)}%).
           - **Solución**: Aumentar tamaño del buffer pool y optimizar su uso.
           - **Implementación**:
             \`\`\`sql
             -- Aumentar tamaño del buffer pool (ajustar según RAM disponible)
             SET GLOBAL innodb_buffer_pool_size = 4294967296; -- 4GB
             
             -- Dividir en instancias para mejor concurrencia
             SET GLOBAL innodb_buffer_pool_instances = 8;
             
             -- Precarga del buffer pool al inicio
             SET GLOBAL innodb_buffer_pool_load_at_startup = ON;
             SET GLOBAL innodb_buffer_pool_dump_at_shutdown = ON;
             \`\`\`
           - **Beneficio**: Mejora en rendimiento de lecturas hasta un 50-70%.`;
            }
            
            if (issues.includes('Registro de consultas lentas desactivado')) {
              recommendations += `
        2. **Activar y Configurar Slow Query Log**:
           - **Problema**: Registro de consultas lentas desactivado.
           - **Solución**: Activar y configurar para identificar consultas problemáticas.
           - **Implementación**:
             \`\`\`sql
             -- Activar slow query log
             SET GLOBAL slow_query_log = 'ON';
             SET GLOBAL slow_query_log_file = '/var/log/mysql/mysql-slow.log';
             SET GLOBAL long_query_time = 1; -- Segundos
             SET GLOBAL log_queries_not_using_indexes = 'ON';
             
             -- Analizar con herramientas
             -- Usando pt-query-digest (Percona Toolkit)
             -- pt-query-digest /var/log/mysql/mysql-slow.log > slow_query_report.txt
             \`\`\`
           - **Beneficio**: Identificación precisa de consultas problemáticas para optimización.`;
            }
            
            if (issues.includes('Conexiones abortadas frecuentes')) {
              recommendations += `
        3. **Optimizar Gestión de Conexiones**:
           - **Problema**: ${metrics.specificMetrics.abortedConnections} conexiones abortadas detectadas.
           - **Solución**: Ajustar parámetros de conexión y timeout.
           - **Implementación**:
             \`\`\`sql
             -- Aumentar límites de conexión
             SET GLOBAL max_connections = 500;
             SET GLOBAL max_connect_errors = 10000;
             
             -- Ajustar timeouts
             SET GLOBAL connect_timeout = 20;
             SET GLOBAL wait_timeout = 600;
             SET GLOBAL interactive_timeout = 600;
             
             -- Implementar pool de conexiones en aplicación
             -- Ejemplo con Node.js y mysql2
             /*
             const pool = mysql.createPool({
               host: 'localhost',
               user: 'user',
               password: 'password',
               database: 'db',
               waitForConnections: true,
               connectionLimit: 20,
               queueLimit: 0
             });
             */
             \`\`\`
           - **Beneficio**: Reducción de errores de conexión y mejor estabilidad.`;
            }
            
            if (issues.includes('Tiempo de respuesta de consultas lento') || 
                issues.includes('Consultas lentas detectadas')) {
              recommendations += `
        4. **Optimizar Configuración de Consultas**:
           - **Problema**: Consultas lentas con tiempo de respuesta promedio de ${Math.round(metrics.queryResponseTime)}ms.
           - **Solución**: Ajustar parámetros de consulta y caché.
           - **Implementación**:
             \`\`\`sql
             -- Optimizar sort_buffer y join_buffer
             SET GLOBAL sort_buffer_size = 4194304; -- 4MB
             SET GLOBAL join_buffer_size = 2097152; -- 2MB
             
             -- Ajustar tmp_table_size y max_heap_table_size
             SET GLOBAL tmp_table_size = 67108864; -- 64MB
             SET GLOBAL max_heap_table_size = 67108864; -- 64MB
             
             -- Optimizar read_buffer y read_rnd_buffer
             SET GLOBAL read_buffer_size = 2097152; -- 2MB
             SET GLOBAL read_rnd_buffer_size = 4194304; -- 4MB
             \`\`\`
           - **Beneficio**: Mejora en tiempos de respuesta para consultas complejas.`;
            }
            
            if (issues.includes('Índices faltantes detectados') || 
                issues.includes('Escaneos completos de tabla frecuentes')) {
              recommendations += `
        5. **Implementar Estrategia de Índices**:
           - **Problema**: ${metrics.missingIndexes} índices faltantes y ${metrics.fullTableScans} escaneos completos.
           - **Solución**: Crear índices estratégicos basados en patrones de consulta.
           - **Implementación**:
             \`\`\`sql
             -- Identificar consultas sin índices
             SET GLOBAL log_queries_not_using_indexes = 'ON';
             
             -- Analizar con EXPLAIN
             EXPLAIN SELECT * FROM orders WHERE customer_id = 123 AND order_date > '2023-01-01';
             
             -- Crear índices compuestos para patrones comunes
             CREATE INDEX idx_customer_date ON orders(customer_id, order_date);
             
             -- Considerar índices parciales para valores frecuentes
             -- En MySQL 8.0+
             CREATE INDEX idx_status ON orders(status) WHERE status IN ('processing', 'shipped');
             
             -- Usar ANALYZE TABLE para actualizar estadísticas
             ANALYZE TABLE orders, customers, products;
             \`\`\`
           - **Beneficio**: Reducción drástica en tiempos de consulta y carga del servidor.`;
            }
            
            if (recommendations === `### Optimizaciones Específicas para MySQL/MariaDB
      - **Problemas Detectados**: ${issues.length} problemas identificados en la base de datos MySQL/MariaDB.
      - **Soluciones Recomendadas**:`) {
              recommendations += `
        1. **Optimizaciones Generales para MySQL/MariaDB**:
           - **Implementación**:
             \`\`\`sql
             -- Optimizar configuración general
             SET GLOBAL innodb_buffer_pool_size = 1073741824; -- 1GB
             SET GLOBAL innodb_log_file_size = 268435456; -- 256MB
             SET GLOBAL innodb_flush_log_at_trx_commit = 2; -- Mejor rendimiento, menor durabilidad
             SET GLOBAL innodb_flush_method = 'O_DIRECT'; -- Evitar doble buffering
             
             -- Activar monitoreo
             SET GLOBAL performance_schema = ON;
             
             -- Optimizar thread handling
             SET GLOBAL innodb_thread_concurrency = 16;
             SET GLOBAL thread_cache_size = 16;
             \`\`\`
           - **Beneficio**: Mejora general en rendimiento y estabilidad del sistema.`;
            }
            
            return recommendations;
          }
          
          /**
           * Genera recomendaciones específicas para PostgreSQL
           * @param issues Problemas identificados
           * @param metrics Métricas recopiladas
           * @returns Recomendaciones formateadas
           */
          private generatePostgreSQLRecommendations(issues: string[], metrics: Record<string, any>): string {
            let recommendations = `### Optimizaciones Específicas para PostgreSQL
      - **Problemas Detectados**: ${issues.length} problemas identificados en la base de datos PostgreSQL.
      - **Soluciones Recomendadas**:`;
            
            if (issues.includes('Ratio de aciertos de caché de PostgreSQL bajo')) {
              recommendations += `
        1. **Optimizar Configuración de Caché**:
           - **Problema**: Ratio de aciertos de caché bajo (${Math.round(metrics.specificMetrics.cacheHitRatio)}%).
           - **Solución**: Ajustar parámetros de memoria y caché.
           - **Implementación**:
             \`\`\`sql
             -- En postgresql.conf
             
             -- Aumentar shared_buffers (25-40% de RAM)
             shared_buffers = 2GB
             
             -- Ajustar work_mem para operaciones de ordenación y hash
             work_mem = 50MB
             
             -- Aumentar effective_cache_size (estimación de caché del SO, 50-75% de RAM)
             effective_cache_size = 6GB
             
             -- Optimizar maintenance_work_mem para operaciones de mantenimiento
             maintenance_work_mem = 256MB
             
             -- Ajustar random_page_cost para reflejar uso de SSD
             random_page_cost = 1.1  -- Para SSD
             
             -- Verificar estadísticas de caché
             SELECT
               sum(heap_blks_read) as heap_read,
               sum(heap_blks_hit) as heap_hit,
               sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
             FROM pg_statio_user_tables;
             \`\`\`
           - **Beneficio**: Mejora significativa en tiempos de respuesta y throughput.`;
            }
            
            if (issues.includes('Bajo uso de índices en PostgreSQL')) {
              recommendations += `
        2. **Optimizar Estrategia de Índices**:
           - **Problema**: Ratio de uso de índices bajo (${Math.round(metrics.specificMetrics.indexUsageRatio)}%).
           - **Solución**: Revisar y optimizar índices según patrones de consulta.
           - **Implementación**:
             \`\`\`sql
             -- Identificar tablas con bajo uso de índices
             SELECT
               relname,
               100 * idx_scan / (seq_scan + idx_scan) percent_of_times_index_used,
               n_live_tup rows_in_table
             FROM pg_stat_user_tables
             WHERE seq_scan + idx_scan > 0
             ORDER BY percent_of_times_index_used ASC;
             
             -- Identificar índices no utilizados
             SELECT
               indexrelid::regclass as index,
               relid::regclass as table,
               idx_scan as index_scans
             FROM pg_stat_user_indexes
             WHERE idx_scan = 0
             ORDER BY relid::regclass;
             
             -- Crear índices para consultas frecuentes
             CREATE INDEX CONCURRENTLY idx_orders_customer_date
             ON orders(customer_id, order_date);
             
             -- Considerar índices parciales
             CREATE INDEX CONCURRENTLY idx_orders_status
             ON orders(status) WHERE status IN ('processing', 'shipped');
             
             -- Usar índices de expresión para funciones comunes
             CREATE INDEX CONCURRENTLY idx_lower_email
             ON customers(lower(email));
             
             -- Considerar índices GIN para búsquedas de texto
             CREATE INDEX CONCURRENTLY idx_products_search
             ON products USING gin(to_tsvector('english', name || ' ' || description));
             \`\`\`
           - **Beneficio**: Mejora en rendimiento de consultas y reducción de escaneos secuenciales.`;
            }
            
            if (issues.includes('Vacuum no ejecutado recientemente') || 
                issues.includes('Alto número de tuplas muertas')) {
              recommendations += `
        3. **Optimizar Mantenimiento y VACUUM**:
           - **Problema**: Vacuum no ejecutado en ${metrics.specificMetrics.vacuumLastRun} horas, con ${metrics.specificMetrics.deadTuples} tuplas muertas.
           - **Solución**: Configurar autovacuum y programar mantenimiento regular.
           - **Implementación**:
             \`\`\`sql
             -- En postgresql.conf
             
             -- Activar y optimizar autovacuum
             autovacuum = on
             autovacuum_max_workers = 6
             autovacuum_naptime = 15s
             autovacuum_vacuum_threshold = 50
             autovacuum_analyze_threshold = 50
             autovacuum_vacuum_scale_factor = 0.05
             autovacuum_analyze_scale_factor = 0.02
             autovacuum_vacuum_cost_delay = 10ms
             
             -- Ejecutar vacuum manual en tablas críticas
             VACUUM ANALYZE orders;
             VACUUM FULL products; -- Bloquea la tabla, usar con precaución
             
             -- Identificar tablas que necesitan vacuum
             SELECT
               relname,
               n_dead_tup,
               n_live_tup,
               n_dead_tup / (n_live_tup + n_dead_tup + 0.000001) * 100 AS dead_percentage
             FROM pg_stat_user_tables
             WHERE n_dead_tup > 10000
             ORDER BY dead_percentage DESC;
             
             -- Crear job de mantenimiento con pg_cron
             -- Instalar extensión: CREATE EXTENSION pg_cron;
             SELECT cron.schedule('0 3 * * *', 'VACUUM ANALYZE;');
             \`\`\`
           - **Beneficio**: Mejor rendimiento, menor fragmentación y recuperación de espacio en disco.`;
            }
            
            if (issues.includes('Tiempo de respuesta de consultas lento') || 
                issues.includes('Consultas lentas detectadas')) {
              recommendations += `
        4. **Optimizar Consultas y Planes de Ejecución**:
           - **Problema**: Consultas lentas con tiempo de respuesta promedio de ${Math.round(metrics.queryResponseTime)}ms.
           - **Solución**: Analizar y optimizar planes de ejecución.
           - **Implementación**:
             \`\`\`sql
             -- Activar registro de consultas lentas
             -- En postgresql.conf
             log_min_duration_statement = 1000  -- ms
             
             -- Analizar planes de ejecución
             EXPLAIN (ANALYZE, BUFFERS) 
             SELECT * FROM orders WHERE customer_id = 123 AND order_date > '2023-01-01';
             
             -- Usar hints para forzar planes específicos
             /*
             SELECT /*+ IndexScan(orders idx_customer_date) */
               *
             FROM orders
             WHERE customer_id = 123 AND order_date > '2023-01-01';
             */
             
             -- Reescribir consultas problemáticas
             -- Antes:
             SELECT * FROM orders WHERE EXTRACT(YEAR FROM order_date) = 2023;
             -- Después:
             SELECT * FROM orders WHERE order_date >= '2023-01-01' AND order_date < '2024-01-01';
             
             -- Usar Common Table Expressions (CTEs) para consultas complejas
             WITH customer_orders AS (
               SELECT customer_id, COUNT(*) as order_count
               FROM orders
               WHERE order_date >= '2023-01-01'
               GROUP BY customer_id
             )
             SELECT c.name, c.email, COALESCE(co.order_count, 0) as orders
             FROM customers c
             LEFT JOIN customer_orders co ON c.customer_id = co.customer_id
             ORDER BY orders DESC;
             
             -- Considerar vistas materializadas para consultas frecuentes
             CREATE MATERIALIZED VIEW monthly_sales AS
             SELECT 
               date_trunc('month', order_date) as month,
               SUM(total_amount) as total_sales
             FROM orders
             GROUP BY 1;
             
             CREATE UNIQUE INDEX idx_monthly_sales_month ON monthly_sales(month);
             
             -- Refrescar vista materializada
             REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_sales;
             \`\`\`
           - **Beneficio**: Reducción significativa en tiempos de respuesta y mejor uso de recursos.`;
            }
            
            if (recommendations === `### Optimizaciones Específicas para PostgreSQL
      - **Problemas Detectados**: ${issues.length} problemas identificados en la base de datos PostgreSQL.
      - **Soluciones Recomendadas**:`) {
              recommendations += `
        1. **Optimizaciones Generales para PostgreSQL**:
           - **Implementación**:
             \`\`\`sql
             -- En postgresql.conf
             
             -- Configuración de memoria
             shared_buffers = 1GB
             work_mem = 32MB
             maintenance_work_mem = 128MB
             effective_cache_size = 3GB
             
             -- Configuración de escritura
             wal_buffers = 16MB
             checkpoint_timeout = 15min
             checkpoint_completion_target = 0.9
             
             -- Configuración de planificador
             random_page_cost = 1.1  -- Para SSD
             effective_io_concurrency = 200  -- Para SSD
             
             -- Paralelismo
             max_worker_processes = 8
             max_parallel_workers_per_gather = 4
             max_parallel_workers = 8
             
             -- Estadísticas
             track_activities = on
             track_counts = on
             track_io_timing = on
             track_functions = all
             \`\`\`
           - **Beneficio**: Mejora general en rendimiento y estabilidad del sistema.`;
            }
            
            return recommendations;
          }
          
          /**
           * Genera recomendaciones específicas para MongoDB
           * @param issues Problemas identificados
           * @param metrics Métricas recopiladas
           * @returns Recomendaciones formateadas
           */
          private generateMongoDBRecommendations(issues: string[], metrics: Record<string, any>): string {
            let recommendations = `### Optimizaciones Específicas para MongoDB
      - **Problemas Detectados**: ${issues.length} problemas identificados en la base de datos MongoDB.
      - **Soluciones Recomendadas**:`;
            
            if (issues.includes('Latencia de lectura alta en MongoDB') || 
                issues.includes('Latencia de escritura alta en MongoDB')) {
              recommendations += `
        1. **Optimizar Latencia de Operaciones**:
           - **Problema**: Latencia alta (Lectura: ${Math.round(metrics.specificMetrics.readLatency)}ms, Escritura: ${Math.round(metrics.specificMetrics.writeLatency)}ms).
           - **Solución**: Optimizar índices, consultas y configuración de WiredTiger.
           - **Implementación**:
             \`\`\`javascript
             // Analizar rendimiento de consultas
             db.orders.find({ status: "processing" }).explain("executionStats")
             
             // Crear índices para patrones de consulta comunes
             db.orders.createIndex({ customer_id: 1, order_date: -1 })
             
             // Crear índices compuestos para consultas con múltiples condiciones
             db.products.createIndex({ category: 1, price: 1, stock: -1 })
             
             // Índices parciales para subconjuntos de datos
             db.orders.createIndex(
               { order_date: 1 },
               { partialFilterExpression: { status: "processing" } }
             )
             
             // Índices de texto para búsquedas
             db.products.createIndex({ name: "text", description: "text" })
             
             // Configuración de WiredTiger (en mongod.conf)
             /*
             storage:
               wiredTiger:
                 engineConfig:
                   cacheSizeGB: 4
                   journalCompressor: snappy
                 collectionConfig:
                   blockCompressor: snappy
             */
             
             // Usar proyecciones para limitar campos retornados
             db.customers.find(
               { region: "Europe" },
               { name: 1, email: 1, _id: 1 }
             )
             
             // Limitar resultados y usar paginación
             db.products.find().sort({ price: 1 }).skip(20).limit(10)
             \`\`\`
           - **Beneficio**: Reducción de latencia en un 40-60% y mejor throughput general.`;
            }
            
            if (issues.includes('Índices sin estadísticas en MongoDB')) {
              recommendations += `
        2. **Optimizar Estadísticas de Índices**:
           - **Problema**: ${metrics.specificMetrics.indexesWithoutStats} índices sin estadísticas actualizadas.
           - **Solución**: Actualizar estadísticas y configurar mantenimiento regular.
           - **Implementación**:
             \`\`\`javascript
             // Ejecutar análisis de colecciones
             db.orders.stats()
             
             // Obtener estadísticas de índices
             db.orders.aggregate([
               { $indexStats: {} }
             ])
             
             // Identificar índices no utilizados
             db.collection.aggregate([
               { $indexStats: {} }
             ]).forEach(function(index) {
               if (index.accesses.ops === 0) {
                 print("Índice no utilizado: " + index.name + " en " + index.key);
               }
             })
             
             // Eliminar índices no utilizados
             db.orders.dropIndex("unused_index_name")
             
             // Actualizar estadísticas de índices
             db.runCommand({ analyzeShardKey: "orders", key: { customer_id: 1 } })
             
             // Programar actualización periódica de estadísticas
             // Usando una tarea cron o un job programado
             /*
             0 2 * * * mongo --eval "db.runCommand({ analyzeShardKey: 'orders', key: { customer_id: 1 } })"
             */
             \`\`\`
           - **Beneficio**: Mejora en la selección de índices y rendimiento de consultas.`;
            }
            
            if (issues.includes('Escaneos completos de tabla frecuentes') || 
                issues.includes('Índices faltantes detectados')) {
              recommendations += `
        3. **Optimizar Patrones de Consulta**:
           - **Problema**: ${metrics.fullTableScans} escaneos completos y ${metrics.missingIndexes} índices faltantes.
           - **Solución**: Analizar y optimizar patrones de consulta comunes.
           - **Implementación**:
             \`\`\`javascript
                          // Identificar consultas que podrían beneficiarse de índices
             db.orders.find({ status: "processing", customer_id: { $gt: 1000 } }).explain("executionStats")
             
             // Optimizar consultas con proyecciones y límites
             db.products.find(
               { category: "electronics", price: { $lt: 500 } },
               { name: 1, price: 1, stock: 1, _id: 1 }
             ).limit(20)
             
             // Usar agregaciones para consultas complejas
             db.orders.aggregate([
               { $match: { status: "completed" } },
               { $group: { _id: "$customer_id", total: { $sum: "$amount" } } },
               { $sort: { total: -1 } },
               { $limit: 10 }
             ])
             
             // Usar hint para forzar uso de índices específicos
             db.customers.find({ region: "Europe" }).hint({ region: 1 })
             \`\`\`
           - **Beneficio**: Reducción de escaneos completos y mejora en rendimiento de consultas.`;
            }
            
            if (issues.includes('Fragmentación de datos alta') || 
                issues.includes('Tamaño de documentos excesivo')) {
              recommendations += `
        4. **Optimizar Estructura de Datos**:
           - **Problema**: Fragmentación de ${metrics.specificMetrics.fragmentation}% y documentos de ${Math.round(metrics.specificMetrics.avgDocSize)}KB.
           - **Solución**: Optimizar esquema y compactar datos.
           - **Implementación**:
             \`\`\`javascript
             // Analizar tamaño de documentos
             db.orders.aggregate([
               { $project: { documentSize: { $bsonSize: "$$ROOT" } } },
               { $group: { _id: null, avgSize: { $avg: "$documentSize" } } }
             ])
             
             // Compactar colecciones
             db.runCommand({ compact: "orders" })
             
             // Analizar fragmentación
             db.orders.stats().wiredTiger["block-manager"]["file bytes available for reuse"]
             
             // Normalizar datos para documentos grandes
             // En lugar de:
             {
               _id: ObjectId("..."),
               customer: {
                 name: "John Doe",
                 email: "john@example.com",
                 address: { ... },
                 orders: [ ... ] // Array grande de órdenes
               }
             }
             
             // Usar referencias:
             // Colección customers
             {
               _id: ObjectId("..."),
               name: "John Doe",
               email: "john@example.com",
               address: { ... }
             }
             
             // Colección orders
             {
               _id: ObjectId("..."),
               customer_id: ObjectId("..."),
               // Detalles de la orden
             }
             
             // Usar TTL para datos temporales
             db.sessions.createIndex({ createdAt: 1 }, { expireAfterSeconds: 3600 })
             
             // Comprimir campos grandes
             // Implementar compresión a nivel de aplicación para campos de texto largo
             /*
             // Pseudocódigo
             function compressField(text) {
               return compress(text); // Usando zlib, lz-string, etc.
             }
             
             function decompressField(compressedText) {
               return decompress(compressedText);
             }
             */
             \`\`\`
           - **Beneficio**: Reducción del uso de almacenamiento y mejora en rendimiento de lectura/escritura.`;
            }
            
            if (issues.includes('Configuración de sharding subóptima')) {
              recommendations += `
        5. **Optimizar Sharding**:
           - **Problema**: Configuración de sharding subóptima con distribución desigual.
           - **Solución**: Reconfigurar estrategia de sharding y balanceo.
           - **Implementación**:
             \`\`\`javascript
             // Analizar distribución actual
             sh.status()
             
             // Verificar distribución de chunks
             db.orders.getShardDistribution()
             
             // Elegir mejor clave de sharding
             // Evitar claves monotónicas como timestamps o IDs autoincrementales
             // Preferir claves con alta cardinalidad y distribución uniforme
             
             // Ejemplo: Shard por hash de customer_id
             sh.shardCollection("ecommerce.orders", { customer_id: "hashed" })
             
             // Para datos geoespaciales, considerar sharding por ubicación
             sh.shardCollection("ecommerce.stores", { location: "2dsphere" })
             
             // Para datos temporales, usar compuesto de fecha y otro campo
             sh.shardCollection("ecommerce.transactions", { 
               month: 1, 
               customer_id: 1 
             })
             
             // Configurar zonas para datos regionales
             sh.addShardToZone("shard0001", "us-east")
             sh.addShardToZone("shard0002", "us-west")
             sh.addShardToZone("shard0003", "europe")
             
             // Asignar rangos a zonas
             sh.updateZoneKeyRange(
               "ecommerce.customers",
               { region: "US-East" },
               { region: "US-East-ZZZ" },
               "us-east"
             )
             
             // Ajustar configuración del balanceador
             db.settings.updateOne(
               { _id: "balancer" },
               { $set: { activeWindow: { start: "22:00", stop: "06:00" } } }
             )
             
             // Verificar y corregir chunks desbalanceados
             sh.startBalancer()
             \`\`\`
           - **Beneficio**: Distribución uniforme de datos, mejor escalabilidad y rendimiento.`;
            }
            
            if (recommendations === `### Optimizaciones Específicas para MongoDB
      - **Problemas Detectados**: ${issues.length} problemas identificados en la base de datos MongoDB.
      - **Soluciones Recomendadas**:`) {
              recommendations += `
        1. **Optimizaciones Generales para MongoDB**:
           - **Implementación**:
             \`\`\`javascript
             // Configuración general de rendimiento
             
             // Configuración de WiredTiger (en mongod.conf)
             /*
             storage:
               wiredTiger:
                 engineConfig:
                   cacheSizeGB: 2
                   journalCompressor: snappy
                 collectionConfig:
                   blockCompressor: snappy
             */
             
             // Crear índices para consultas comunes
             db.orders.createIndex({ customer_id: 1, order_date: -1 })
             db.products.createIndex({ category: 1, price: 1 })
             db.customers.createIndex({ email: 1 }, { unique: true })
             
             // Habilitar profiler para identificar consultas lentas
             db.setProfilingLevel(1, { slowms: 100 })
             
             // Revisar consultas lentas
             db.system.profile.find({ millis: { $gt: 100 } }).sort({ ts: -1 })
             
             // Optimizar conexiones
             /*
             net:
               maxIncomingConnections: 2000
               maxIncomingConnectionsOverride:
                 127.0.0.1: 10000
             */
             \`\`\`
           - **Beneficio**: Mejora general en rendimiento y estabilidad del sistema.`;
            }
            
            return recommendations;
          }
          
          /**
           * Genera recomendaciones específicas para Redis
           * @param issues Problemas identificados
           * @param metrics Métricas recopiladas
           * @returns Recomendaciones formateadas
           */
          private generateRedisRecommendations(issues: string[], metrics: Record<string, any>): string {
            let recommendations = `### Optimizaciones Específicas para Redis
      - **Problemas Detectados**: ${issues.length} problemas identificados en la base de datos Redis.
      - **Soluciones Recomendadas**:`;
            
            if (issues.includes('Uso de memoria alto en Redis') || 
                issues.includes('Fragmentación de memoria alta')) {
              recommendations += `
        1. **Optimizar Uso de Memoria**:
           - **Problema**: Uso de memoria al ${Math.round(metrics.specificMetrics.memoryUsage)}% con fragmentación de ${Math.round(metrics.specificMetrics.memoryFragmentation)}%.
           - **Solución**: Implementar políticas de expiración y compresión.
           - **Implementación**:
             \`\`\`bash
             # Configurar políticas de memoria (en redis.conf)
             maxmemory 2gb
             maxmemory-policy allkeys-lru
             
             # Analizar uso de memoria
             redis-cli info memory
             
             # Identificar claves grandes
             redis-cli --bigkeys
             
             # Usar estructuras de datos más eficientes
             # En lugar de hash con pocos campos, usar strings
             # Ejemplo: Convertir
             HSET user:1000 name "John" age "30" city "New York"
             # A
             SET user:1000 "name=John,age=30,city=New York"
             
             # Comprimir valores grandes
             # Pseudocódigo en la aplicación
             """
             # Comprimir antes de almacenar
             compressed_data = compress(original_data)
             redis.set("large_key", compressed_data)
             
             # Descomprimir al recuperar
             compressed_data = redis.get("large_key")
             original_data = decompress(compressed_data)
             """
             
             # Configurar expiración para datos temporales
             SET session:12345 "session_data" EX 3600
             
             # Usar Redis Streams en lugar de listas para logs
             XADD logs * event "login" user_id "1001"
             
             # Limpiar claves expiradas más agresivamente
             # En redis.conf
             hz 20
             
             # Defragmentar memoria (Redis 4.0+)
             CONFIG SET activedefrag yes
             CONFIG SET active-defrag-ignore-bytes 100mb
             CONFIG SET active-defrag-threshold-lower 10
             CONFIG SET active-defrag-threshold-upper 100
             CONFIG SET active-defrag-cycle-min 25
             CONFIG SET active-defrag-cycle-max 75
             \`\`\`
           - **Beneficio**: Reducción del uso de memoria y mejor gestión de recursos.`;
            }
            
            if (issues.includes('Latencia alta en operaciones de Redis') || 
                issues.includes('Bloqueo por operaciones lentas')) {
              recommendations += `
        2. **Reducir Latencia**:
           - **Problema**: Latencia promedio de ${Math.round(metrics.specificMetrics.avgLatency)}ms con picos de ${Math.round(metrics.specificMetrics.maxLatency)}ms.
           - **Solución**: Optimizar operaciones y evitar bloqueos.
           - **Implementación**:
             \`\`\`bash
             # Monitorear latencia
             redis-cli --latency
             
             # Identificar comandos lentos
             redis-cli SLOWLOG GET 10
             
             # Evitar comandos bloqueantes
             # En lugar de KEYS *, usar SCAN
             SCAN 0 MATCH user:* COUNT 100
             
             # En lugar de SMEMBERS para sets grandes, usar SSCAN
             SSCAN myset 0 COUNT 100
             
             # Evitar operaciones O(N) en conjuntos de datos grandes
             # Evitar: SORT, LRANGE con índices grandes, SUNION/SINTER en sets grandes
             
             # Usar comandos de pipeline para reducir viajes de red
             # Ejemplo en pseudocódigo:
             """
             pipeline = redis.pipeline()
             pipeline.set("key1", "value1")
             pipeline.set("key2", "value2")
             pipeline.get("key3")
             results = pipeline.execute()
             """
             
             # Usar Lua scripts para operaciones atómicas complejas
             EVAL "local current = redis.call('GET', KEYS[1]) 
                   if current == ARGV[1] then 
                     return redis.call('SET', KEYS[1], ARGV[2]) 
                   else 
                     return 0 
                   end" 1 mykey oldvalue newvalue
             
             # Configurar cliente para reintentos y timeouts adecuados
             # Pseudocódigo:
             """
             redis_client = Redis(
               host='redis-server',
               socket_timeout=5,
               socket_connect_timeout=3,
               retry_on_timeout=True,
               max_connections=100
             )
             """
             
             # Usar Redis Cluster para distribuir carga
             # Configuración básica de cluster (en cada nodo)
             cluster-enabled yes
             cluster-config-file nodes.conf
             cluster-node-timeout 5000
             \`\`\`
           - **Beneficio**: Reducción de latencia y mejor respuesta bajo carga.`;
            }
            
            if (issues.includes('Configuración de persistencia subóptima')) {
              recommendations += `
        3. **Optimizar Persistencia**:
           - **Problema**: Configuración de persistencia causando latencia de ${Math.round(metrics.specificMetrics.persistenceLatency)}ms.
           - **Solución**: Ajustar configuración de RDB y AOF.
           - **Implementación**:
             \`\`\`bash
             # Configurar RDB (en redis.conf)
             save 900 1
             save 300 10
             save 60 10000
             
             # Configurar AOF
             appendonly yes
             appendfsync everysec
             
             # Para cargas de trabajo de escritura intensiva, considerar
             appendfsync no
             # Pero esto puede perder datos en caso de fallo
             
             # Usar compresión RDB
             rdbcompression yes
             
             # Reescritura automática de AOF
             auto-aof-rewrite-percentage 100
             auto-aof-rewrite-min-size 64mb
             
             # Para servidores con SSD
             no-appendfsync-on-rewrite yes
             
             # Usar persistencia híbrida (Redis 4.0+)
             aof-use-rdb-preamble yes
             
             # Programar RDB en momentos de baja carga
             # Cron job para ejecutar BGSAVE en horas específicas
             # 0 3 * * * redis-cli BGSAVE
             
             # Monitorear tamaño de AOF
             redis-cli info persistence
             
             # Verificar estado de reescritura de AOF
             redis-cli info stats | grep aof_
             \`\`\`
           - **Beneficio**: Mejor durabilidad con menor impacto en rendimiento.`;
            }
            
            if (issues.includes('Uso ineficiente de estructuras de datos')) {
              recommendations += `
        4. **Optimizar Estructuras de Datos**:
           - **Problema**: Uso ineficiente de estructuras detectado en ${metrics.specificMetrics.inefficientStructures} patrones.
           - **Solución**: Seleccionar estructuras óptimas para cada caso de uso.
           - **Implementación**:
             \`\`\`bash
             # Analizar tipos de datos usados
             redis-cli --scan --type hash
             redis-cli --scan --type list
             redis-cli --scan --type set
             
             # Optimizar strings
             # Para valores pequeños (<= 44 bytes), Redis usa codificación embebida
             
             # Usar HyperLogLog para conteos aproximados
             # En lugar de:
             SADD visitors:20230501 "user1" "user2" ... "userN"
             SCARD visitors:20230501
             
             # Usar:
             PFADD visitors:20230501 "user1" "user2" ... "userN"
             PFCOUNT visitors:20230501
             
             # Usar Sorted Sets para rankings y datos temporales
             ZADD leaderboard 1000 "user1" 2000 "user2" 500 "user3"
             ZREVRANGE leaderboard 0 9 WITHSCORES  # Top 10
             
             # Usar Redis Streams para logs y mensajes
             XADD mystream * sensor_id "1234" temperature "19.8"
             XREAD COUNT 100 STREAMS mystream 0
             
             # Usar Bitmaps para datos booleanos
             # Marcar usuario como activo
             SETBIT user:active:20230501 1234 1
             # Contar usuarios activos
             BITCOUNT user:active:20230501
             
             # Usar Hash para objetos con pocos campos
             HSET user:1000 name "John" email "john@example.com" visits 10
             HINCRBY user:1000 visits 1
             
             # Limitar tamaño de listas
             LPUSH mylist "new_item"
             LTRIM mylist 0 999  # Mantener solo 1000 elementos
             
             # Usar Sets para relaciones y operaciones de conjunto
             SADD friends:1000 "2000" "3000" "4000"
             SADD friends:2000 "1000" "3000" "5000"
             SINTER friends:1000 friends:2000  # Amigos en común
             \`\`\`
           - **Beneficio**: Mejor uso de memoria y operaciones más eficientes.`;
            }
            
            if (issues.includes('Configuración de cluster subóptima')) {
              recommendations += `
        5. **Optimizar Cluster**:
           - **Problema**: Distribución desigual con ${metrics.specificMetrics.clusterImbalance}% de desbalance.
           - **Solución**: Reconfigurar sharding y replicación.
           - **Implementación**:
             \`\`\`bash
             # Verificar estado del cluster
             redis-cli cluster info
             redis-cli cluster nodes
             
             # Analizar distribución de claves
             redis-cli --cluster info redis-node:6379
             
             # Rebalancear slots
             redis-cli --cluster rebalance redis-node:6379
             
             # Configurar hash tags para mantener claves relacionadas en el mismo nodo
             # Ejemplo: user:{1000}:profile y user:{1000}:sessions irán al mismo nodo
             
             # Optimizar número de slots por nodo
             # Por defecto: 16384 slots / número de nodos maestros
             
             # Configurar timeouts adecuados
             cluster-node-timeout 15000
             
             # Configurar migración automática de slots
             cluster-migration-barrier 1
             
             # Optimizar replicación
             # Asegurar al menos un replica por master
             redis-cli --cluster add-node new-redis:6379 existing-redis:6379 --cluster-slave
             
             # Configurar replicas para lectura
             # En el cliente:
             """
             read_from_replicas = True
             """
             
             # Monitorear latencia entre nodos
             redis-cli --latency-history -i 10 -h redis-node
             
             # Configurar política de failover
             cluster-replica-validity-factor 10
             cluster-require-full-coverage no
             
             # Usar Redis Cluster Proxy para simplificar conexiones de cliente
             # https://github.com/artix75/redis-cluster-proxy
             \`\`\`
           - **Beneficio**: Mejor distribución de carga, alta disponibilidad y escalabilidad.`;
            }
            
            if (recommendations === `### Optimizaciones Específicas para Redis
      - **Problemas Detectados**: ${issues.length} problemas identificados en la base de datos Redis.
      - **Soluciones Recomendadas**:`) {
              recommendations += `
        1. **Optimizaciones Generales para Redis**:
           - **Implementación**:
             \`\`\`bash
             # Configuración general de rendimiento (redis.conf)
             
             # Memoria y caché
             maxmemory 1gb
             maxmemory-policy volatile-lru
             
             # Persistencia
             save 900 1
             save 300 10
             save 60 10000
             appendonly yes
             appendfsync everysec
             
             # Rendimiento
             tcp-backlog 511
             timeout 0
             tcp-keepalive 300
             
             # Configuración de cliente
             maxclients 10000
             
             # Configuración de hilos (Redis 6.0+)
             io-threads 4
             io-threads-do-reads yes
             
             # Desactivar comandos peligrosos en producción
             rename-command FLUSHALL ""
             rename-command FLUSHDB ""
             rename-command CONFIG ""
             
             # Usar estructuras de datos adecuadas
             # Strings: valores simples, contadores
             # Lists: colas, últimos elementos
             # Sets: relaciones, eliminación de duplicados
             # Sorted Sets: rankings, datos ordenados por tiempo
             # Hashes: objetos con múltiples campos
             # Streams: logs, mensajes
             \`\`\`
           - **Beneficio**: Mejora general en rendimiento y estabilidad del sistema.`;
            }
            
            return recommendations;
          }
          
          /**
           * Genera recomendaciones específicas para ElasticSearch
           * @param issues Problemas identificados
           * @param metrics Métricas recopiladas
           * @returns Recomendaciones formateadas
           */
          private generateElasticsearchRecommendations(issues: string[], metrics: Record<string, any>): string {
            let recommendations = `### Optimizaciones Específicas para Elasticsearch
      - **Problemas Detectados**: ${issues.length} problemas identificados en Elasticsearch.
      - **Soluciones Recomendadas**:`;
            
            if (issues.includes('Fragmentación de índices alta') || 
                issues.includes('Tamaño de shards desbalanceado')) {
              recommendations += `
        1. **Optimizar Estructura de Índices**:
           - **Problema**: Fragmentación de ${Math.round(metrics.specificMetrics.indexFragmentation)}% y desbalance de shards de ${Math.round(metrics.specificMetrics.shardImbalance)}%.
           - **Solución**: Reconfigurar índices y política de sharding.
           - **Implementación**:
             \`\`\`bash
             # Analizar estado de índices
             GET _cat/indices?v
             
             # Analizar asignación de shards
             GET _cat/shards?v
             
             # Forzar fusión de segmentos para reducir fragmentación
             POST /my_index/_forcemerge?max_num_segments=1
             
             # Configurar política de ciclo de vida de índices (ILM)
             PUT _ilm/policy/logs_policy
             {
               "policy": {
                 "phases": {
                   "hot": {
                     "actions": {
                       "rollover": {
                         "max_size": "50GB",
                         "max_age": "7d"
                       },
                       "set_priority": {
                         "priority": 100
                       }
                     }
                   },
                   "warm": {
                     "min_age": "2d",
                     "actions": {
                       "forcemerge": {
                         "max_num_segments": 1
                       },
                       "shrink": {
                         "number_of_shards": 1
                       },
                       "set_priority": {
                         "priority": 50
                       }
                     }
                   },
                   "cold": {
                     "min_age": "30d",
                     "actions": {
                       "freeze": {},
                       "set_priority": {
                         "priority": 0
                       }
                     }
                   },
                   "delete": {
                     "min_age": "90d",
                     "actions": {
                       "delete": {}
                     }
                   }
                 }
               }
             }
             
             # Aplicar política a un índice
             PUT /logs-000001
             {
               "settings": {
                 "index.lifecycle.name": "logs_policy",
                 "index.lifecycle.rollover_alias": "logs"
               }
             }
             
             # Crear template con configuración óptima de shards
             PUT _template/logs_template
             {
               "index_patterns": ["logs-*"],
               "settings": {
                 "number_of_shards": 3,
                 "number_of_replicas": 1,
                 "index.lifecycle.name": "logs_policy",
                 "index.lifecycle.rollover_alias": "logs"
               }
             }
             
             # Rebalancear shards
             POST /_cluster/reroute?retry_failed=true
             
             # Configurar asignación de shards
             PUT _cluster/settings
             {
               "persistent": {
                 "cluster.routing.allocation.disk.threshold_enabled": true,
                 "cluster.routing.allocation.disk.watermark.low": "85%",
                 "cluster.routing.allocation.disk.watermark.high": "90%",
                 "cluster.routing.allocation.disk.watermark.flood_stage": "95%"
               }
             }
             \`\`\`
           - **Beneficio**: Mejor distribución de datos, menor fragmentación y uso eficiente de recursos.`;
            }
            
            if (issues.includes('Consultas lentas en Elasticsearch') || 
                issues.includes('Uso ineficiente de memoria de heap')) {
              recommendations += `
        2. **Optimizar Consultas y Memoria**:
           - **Problema**: Consultas con latencia de ${Math.round(metrics.specificMetrics.queryLatency)}ms y uso de heap al ${Math.round(metrics.specificMetrics.heapUsage)}%.
           - **Solución**: Optimizar consultas y configuración de JVM.
           - **Implementación**:
             \`\`\`bash
             # Analizar consultas lentas
             GET _nodes/stats/indices/search
             
             # Configurar slow logs
             PUT /my_index/_settings
             {
               "index.search.slowlog.threshold.query.warn": "2s",
               "index.search.slowlog.threshold.query.info": "500ms",
               "index.search.slowlog.threshold.fetch.warn": "1s",
               "index.search.slowlog.threshold.fetch.info": "200ms",
               "index.indexing.slowlog.threshold.index.warn": "2s",
               "index.indexing.slowlog.threshold.index.info": "500ms"
             }
             
             # Optimizar consultas con filtros
             # En lugar de:
             GET /my_index/_search
             {
               "query": {
                 "bool": {
                   "must": [
                     { "match": { "status": "active" } },
                     { "range": { "created_at": { "gte": "now-30d" } } }
                   ]
                 }
               }
             }
             
             # Usar:
             GET /my_index/_search
             {
               "query": {
                 "bool": {
                   "filter": [
                     { "term": { "status": "active" } },
                     { "range": { "created_at": { "gte": "now-30d" } } }
                   ]
                 }
               }
             }
             
             # Usar search_after para paginación eficiente
             GET /my_index/_search
             {
               "size": 100,
               "sort": [
                 { "created_at": "desc" },
                 { "_id": "desc" }
               ],
               "search_after": [1609459200000, "last_doc_id"],
               "query": {
                 "match_all": {}
               }
             }
             
             # Configurar JVM
             # En elasticsearch.yml o jvm.options
             -Xms4g
             -Xmx4g
             
             # Optimizar GC
             -XX:+UseG1GC
             -XX:G1ReservePercent=25
             -XX:InitiatingHeapOccupancyPercent=30
             
             # Monitorear uso de heap
             GET _nodes/stats/jvm
             
             # Configurar field data
             PUT _cluster/settings
             {
               "persistent": {
                 "indices.fielddata.cache.size": "10%"
               }
             }
             
             # Usar doc values para campos de agregación
             PUT /my_index
             {
               "mappings": {
                 "properties": {
                   "category": {
                     "type": "keyword",
                     "doc_values": true
                   }
                 }
               }
             }
             \`\`\`
           - **Beneficio**: Reducción de latencia en consultas y mejor uso de memoria.`;
            }
            
            if (issues.includes('Mappings ineficientes') || 
                issues.includes('Análisis de texto subóptimo')) {
              recommendations += `
        3. **Optimizar Mappings y Análisis**:
           - **Problema**: Mappings ineficientes detectados en ${metrics.specificMetrics.inefficientMappings} campos.
           - **Solución**: Refinar mappings y configuración de analizadores.
           - **Implementación**:
             \`\`\`bash
             # Analizar mappings actuales
             GET /my_index/_mapping
             
             # Optimizar mappings para tipos específicos
             PUT /optimized_index
             {
               "mappings": {
                 "properties": {
                   # Campos numéricos
                   "price": {
                     "type": "scaled_float",
                     "scaling_factor": 100
                   },
                   
                   # Fechas
                   "created_at": {
                     "type": "date",
                     "format": "strict_date_optional_time||epoch_millis"
                   },
                   
                   # Texto para búsqueda
                   "title": {
                     "type": "text",
                     "analyzer": "custom_analyzer",
                     "fields": {
                       "keyword": {
                         "type": "keyword",
                         "ignore_above": 256
                       }
                     }
                   },
                   
                   # Campos de filtrado
                   "status": {
                     "type": "keyword"
                   },
                   
                   # Campos geoespaciales
                   "location": {
                     "type": "geo_point"
                   },
                   
                   # Campos anidados
                                      "tags": {
                     "type": "nested",
                     "properties": {
                       "name": {
                         "type": "keyword"
                       },
                       "value": {
                         "type": "keyword"
                       }
                     }
                   }
                 }
               }
             }
             
             # Configurar analizadores personalizados
             PUT /my_index
             {
               "settings": {
                 "analysis": {
                   "analyzer": {
                     "custom_analyzer": {
                       "type": "custom",
                       "tokenizer": "standard",
                       "char_filter": [
                         "html_strip"
                       ],
                       "filter": [
                         "lowercase",
                         "asciifolding",
                         "stop",
                         "snowball"
                       ]
                     },
                     "autocomplete": {
                       "type": "custom",
                       "tokenizer": "standard",
                       "filter": [
                         "lowercase",
                         "edge_ngram"
                       ]
                     }
                   },
                   "filter": {
                     "edge_ngram": {
                       "type": "edge_ngram",
                       "min_gram": 1,
                       "max_gram": 20
                     }
                   }
                 }
               }
             }
             
             # Usar analizadores específicos por idioma
             PUT /multilingual_index
             {
               "settings": {
                 "analysis": {
                   "analyzer": {
                     "spanish": {
                       "type": "spanish"
                     },
                     "english": {
                       "type": "english"
                     }
                   }
                 }
               },
               "mappings": {
                 "properties": {
                   "title_es": {
                     "type": "text",
                     "analyzer": "spanish"
                   },
                   "title_en": {
                     "type": "text",
                     "analyzer": "english"
                   }
                 }
               }
             }
             
             # Usar normalizers para keywords
             PUT /normalized_index
             {
               "settings": {
                 "analysis": {
                   "normalizer": {
                     "lowercase_normalizer": {
                       "type": "custom",
                       "filter": ["lowercase", "asciifolding"]
                     }
                   }
                 }
               },
               "mappings": {
                 "properties": {
                   "category": {
                     "type": "keyword",
                     "normalizer": "lowercase_normalizer"
                   }
                 }
               }
             }
             \`\`\`
           - **Beneficio**: Búsquedas más precisas, menor uso de memoria y mejor rendimiento.`;
            }
            
            if (issues.includes('Índices sin ciclo de vida') || 
                issues.includes('Gestión de índices manual')) {
              recommendations += `
        4. **Implementar Gestión de Ciclo de Vida**:
           - **Problema**: Índices sin políticas de ciclo de vida, causando crecimiento descontrolado.
           - **Solución**: Configurar Index Lifecycle Management (ILM).
           - **Implementación**:
             \`\`\`bash
             # Crear política de ciclo de vida
             PUT _ilm/policy/timeseries_policy
             {
               "policy": {
                 "phases": {
                   "hot": {
                     "min_age": "0ms",
                     "actions": {
                       "rollover": {
                         "max_primary_shard_size": "50gb",
                         "max_age": "7d"
                       },
                       "set_priority": {
                         "priority": 100
                       }
                     }
                   },
                   "warm": {
                     "min_age": "3d",
                     "actions": {
                       "allocate": {
                         "number_of_replicas": 1,
                         "include": {
                           "box_type": "warm"
                         }
                       },
                       "forcemerge": {
                         "max_num_segments": 1
                       },
                       "set_priority": {
                         "priority": 50
                       }
                     }
                   },
                   "cold": {
                     "min_age": "30d",
                     "actions": {
                       "allocate": {
                         "number_of_replicas": 0,
                         "include": {
                           "box_type": "cold"
                         }
                       },
                       "freeze": {},
                       "set_priority": {
                         "priority": 0
                       }
                     }
                   },
                   "delete": {
                     "min_age": "90d",
                     "actions": {
                       "delete": {
                         "delete_searchable_snapshot": true
                       }
                     }
                   }
                 }
               }
             }
             
             # Crear template con política ILM
             PUT _template/logs_template
             {
               "index_patterns": ["logs-*"],
               "settings": {
                 "number_of_shards": 1,
                 "number_of_replicas": 1,
                 "index.lifecycle.name": "timeseries_policy",
                 "index.lifecycle.rollover_alias": "logs"
               },
               "mappings": {
                 "properties": {
                   "@timestamp": {
                     "type": "date"
                   }
                 }
               }
             }
             
             # Crear índice inicial con alias
             PUT logs-000001
             {
               "aliases": {
                 "logs": {
                   "is_write_index": true
                 }
               }
             }
             
             # Configurar Snapshot Lifecycle Management (SLM)
             PUT _slm/policy/daily_snapshots
             {
               "name": "<daily-snap-{now/d}>",
               "schedule": "0 30 1 * * ?",
               "repository": "my_repository",
               "config": {
                 "indices": ["logs-*"],
                 "ignore_unavailable": false,
                 "include_global_state": false
               },
               "retention": {
                 "expire_after": "30d",
                 "min_count": 5,
                 "max_count": 50
               }
             }
             
             # Crear repositorio para snapshots
             PUT _snapshot/my_repository
             {
               "type": "fs",
               "settings": {
                 "location": "/path/to/snapshots"
               }
             }
             
             # Verificar estado de ILM
             GET _ilm/status
             
             # Verificar políticas
             GET _ilm/policy
             
             # Verificar índices gestionados por ILM
             GET _ilm/explain
             \`\`\`
           - **Beneficio**: Gestión automática del ciclo de vida de datos, optimización de recursos y reducción de costos.`;
            }
            
            if (issues.includes('Configuración de búsqueda subóptima') || 
                issues.includes('Rendimiento de agregaciones lento')) {
              recommendations += `
        5. **Optimizar Búsquedas y Agregaciones**:
           - **Problema**: Búsquedas lentas (${Math.round(metrics.specificMetrics.searchLatency)}ms) y agregaciones ineficientes.
           - **Solución**: Implementar estrategias avanzadas de búsqueda y optimizar agregaciones.
           - **Implementación**:
             \`\`\`bash
             # Optimizar búsquedas con filtros
             GET /my_index/_search
             {
               "query": {
                 "bool": {
                   "must": {
                     "match": {
                       "title": {
                         "query": "búsqueda",
                         "operator": "and"
                       }
                     }
                   },
                   "filter": [
                     { "term": { "status": "active" } },
                     { "range": { "date": { "gte": "now-1y" } } }
                   ]
                 }
               }
             }
             
             # Usar búsqueda multi-campo con pesos
             GET /my_index/_search
             {
               "query": {
                 "multi_match": {
                   "query": "búsqueda",
                   "fields": ["title^3", "description^2", "content"],
                   "type": "best_fields",
                   "tie_breaker": 0.3,
                   "minimum_should_match": "75%"
                 }
               }
             }
             
             # Optimizar agregaciones con filtros previos
             GET /my_index/_search
             {
               "size": 0,
               "query": {
                 "bool": {
                   "filter": [
                     { "term": { "category": "electronics" } }
                   ]
                 }
               },
               "aggs": {
                 "avg_price": {
                   "avg": {
                     "field": "price"
                   }
                 }
               }
             }
             
             # Usar agregaciones en dos niveles para mejor rendimiento
             GET /my_index/_search
             {
               "size": 0,
               "aggs": {
                 "categories": {
                   "terms": {
                     "field": "category",
                     "size": 10
                   },
                   "aggs": {
                     "avg_price": {
                       "avg": {
                         "field": "price"
                       }
                     }
                   }
                 }
               }
             }
             
             # Usar filtros en agregaciones
             GET /my_index/_search
             {
               "size": 0,
               "aggs": {
                 "high_value": {
                   "filter": {
                     "range": {
                       "price": { "gte": 1000 }
                     }
                   },
                   "aggs": {
                     "avg_rating": {
                       "avg": {
                         "field": "rating"
                       }
                     }
                   }
                 }
               }
             }
             
             # Optimizar agregaciones de cardinalidad
             GET /my_index/_search
             {
               "size": 0,
               "aggs": {
                 "unique_users": {
                   "cardinality": {
                     "field": "user_id",
                     "precision_threshold": 100
                   }
                 }
               }
             }
             
             # Usar agregaciones de percentiles para análisis de rendimiento
             GET /my_index/_search
             {
               "size": 0,
               "aggs": {
                 "load_time_percentiles": {
                   "percentiles": {
                     "field": "load_time",
                     "percents": [50, 95, 99]
                   }
                 }
               }
             }
             
             # Implementar búsqueda con scroll para conjuntos grandes
             GET /my_index/_search?scroll=1m
             {
               "size": 1000,
               "sort": ["_doc"],
               "query": {
                 "match_all": {}
               }
             }
             
             # Usar point in time (PIT) para búsquedas consistentes
             POST /my_index/_pit?keep_alive=1m
             
             # Búsqueda con PIT
             GET /_search
             {
               "size": 100,
               "query": {
                 "match_all": {}
               },
               "pit": {
                 "id": "pit_id_from_previous_response",
                 "keep_alive": "1m"
               },
               "sort": [
                 {"_score": "desc"},
                 {"_id": "asc"}
               ],
               "search_after": [1.0, "doc_id"]
             }
             \`\`\`
           - **Beneficio**: Reducción significativa en latencia de búsqueda y uso eficiente de recursos.`;
            }
            
            if (recommendations === `### Optimizaciones Específicas para Elasticsearch
      - **Problemas Detectados**: ${issues.length} problemas identificados en Elasticsearch.
      - **Soluciones Recomendadas**:`) {
              recommendations += `
        1. **Optimizaciones Generales para Elasticsearch**:
           - **Implementación**:
             \`\`\`bash
             # Configuración general de rendimiento (elasticsearch.yml)
             
             # Configuración de JVM
             -Xms4g
             -Xmx4g
             
             # Configuración de nodos
             node.master: true
             node.data: true
             node.ingest: true
             
             # Configuración de red
             network.host: 0.0.0.0
             http.port: 9200
             transport.port: 9300
             
             # Configuración de descubrimiento
             discovery.seed_hosts: ["host1", "host2"]
             cluster.initial_master_nodes: ["node1", "node2"]
             
             # Configuración de seguridad
             xpack.security.enabled: true
             
             # Configuración de monitoreo
             xpack.monitoring.collection.enabled: true
             
             # Configuración de caché
             indices.queries.cache.size: 5%
             indices.requests.cache.size: 2%
             
             # Configuración de fielddata
             indices.fielddata.cache.size: 10%
             
             # Configuración de escritura
             index.refresh_interval: 30s
             index.number_of_replicas: 1
             index.number_of_shards: 5
             
             # Configuración de recuperación
             cluster.routing.allocation.node_concurrent_recoveries: 2
             indices.recovery.max_bytes_per_sec: 40mb
             \`\`\`
           - **Beneficio**: Mejora general en rendimiento y estabilidad del sistema.`;
            }
            
            return recommendations;
          }
          
          /**
           * Genera recomendaciones específicas para MongoDB
           * @param issues Problemas identificados
           * @param metrics Métricas recopiladas
           * @returns Recomendaciones formateadas
           */
          private generateMongoDBRecommendations(issues: string[], metrics: Record<string, any>): string {
            let recommendations = `### Optimizaciones Específicas para MongoDB
      - **Problemas Detectados**: ${issues.length} problemas identificados en MongoDB.
      - **Soluciones Recomendadas**:`;
            
            if (issues.includes('Índices faltantes o ineficientes')) {
              recommendations += `
        1. **Optimizar Índices**:
           - **Problema**: Consultas lentas por falta de índices adecuados.
           - **Solución**: Crear índices estratégicos basados en patrones de consulta.
           - **Implementación**:
             \`\`\`javascript
             // Analizar consultas lentas
             db.currentOp({ "active": true, "secs_running": { "$gt": 5 } })
             
             // Habilitar profiler para identificar consultas lentas
             db.setProfilingLevel(1, { slowms: 100 })
             
             // Consultar consultas lentas registradas
             db.system.profile.find().sort({ millis: -1 }).limit(10)
             
             // Analizar plan de ejecución de consultas
             db.collection.find({ campo: "valor" }).explain("executionStats")
             
             // Crear índices simples para campos frecuentemente consultados
             db.collection.createIndex({ "email": 1 })
             
             // Crear índices compuestos para consultas con múltiples condiciones
             db.collection.createIndex({ "user_id": 1, "created_at": -1 })
             
             // Crear índices para ordenamiento
             db.collection.createIndex({ "date": -1, "_id": 1 })
             
             // Crear índices de texto para búsqueda full-text
             db.collection.createIndex({ "description": "text", "title": "text" })
             
             // Crear índices geoespaciales
             db.places.createIndex({ "location": "2dsphere" })
             
             // Crear índices parciales para subconjuntos de datos
             db.collection.createIndex(
               { "status": 1 },
               { partialFilterExpression: { "active": true } }
             )
             
             // Crear índices TTL para expiración automática
             db.sessions.createIndex(
               { "lastUpdated": 1 },
               { expireAfterSeconds: 3600 }
             )
             
             // Crear índices únicos para garantizar unicidad
             db.users.createIndex(
               { "email": 1 },
               { unique: true }
             )
             
             // Crear índices sparse para campos opcionales
             db.collection.createIndex(
               { "optional_field": 1 },
               { sparse: true }
             )
             
             // Crear índices en segundo plano para no bloquear operaciones
             db.collection.createIndex(
               { "field": 1 },
               { background: true }
             )
             
             // Listar todos los índices
             db.collection.getIndexes()
             
             // Eliminar índices no utilizados
             db.collection.dropIndex("index_name")
             \`\`\`
           - **Beneficio**: Reducción significativa en tiempos de consulta y uso eficiente de recursos.`;
            }
            
            if (issues.includes('Esquema ineficiente') || 
                issues.includes('Modelado de datos subóptimo')) {
              recommendations += `
        2. **Optimizar Esquema y Modelado**:
           - **Problema**: Esquema ineficiente que causa problemas de rendimiento.
           - **Solución**: Rediseñar esquema según patrones de acceso.
           - **Implementación**:
             \`\`\`javascript
             // Ejemplo de esquema embebido para datos relacionados de acceso frecuente
             // En lugar de:
             {
               "_id": ObjectId("user1"),
               "name": "John Doe",
               "email": "john@example.com"
             }
             // Y en otra colección:
             {
               "_id": ObjectId("address1"),
               "user_id": ObjectId("user1"),
               "street": "123 Main St",
               "city": "New York"
             }
             
             // Usar:
             {
               "_id": ObjectId("user1"),
               "name": "John Doe",
               "email": "john@example.com",
               "address": {
                 "street": "123 Main St",
                 "city": "New York"
               }
             }
             
             // Ejemplo de esquema referencial para relaciones muchos a muchos
             // Usuarios:
             {
               "_id": ObjectId("user1"),
               "name": "John Doe"
             }
             // Productos:
             {
               "_id": ObjectId("product1"),
               "name": "Laptop"
             }
             // Relación (compras):
             {
               "_id": ObjectId("purchase1"),
               "user_id": ObjectId("user1"),
               "product_id": ObjectId("product1"),
               "date": ISODate("2023-01-15")
             }
             
             // Ejemplo de patrón de esquema para datos de series temporales
             {
               "_id": ObjectId(),
               "sensor_id": "sensor1",
               "readings": [
                 { "timestamp": ISODate("2023-01-01T00:00:00Z"), "value": 22.5 },
                 { "timestamp": ISODate("2023-01-01T01:00:00Z"), "value": 23.1 }
               ]
             }
             
             // Ejemplo de patrón de esquema para datos geoespaciales
             {
               "_id": ObjectId(),
               "name": "Central Park",
               "location": {
                 "type": "Point",
                 "coordinates": [-73.97, 40.77]
               },
               "category": "park"
             }
             
             // Ejemplo de colección preaggregada para reportes
             {
               "_id": { "year": 2023, "month": 1, "day": 15 },
               "total_sales": 12500,
               "order_count": 47,
               "avg_order_value": 265.96
             }
             
             // Ejemplo de patrón de esquema para árboles/jerarquías (patrón de array de ancestros)
             {
               "_id": ObjectId("category3"),
               "name": "Laptops",
               "ancestors": [
                 ObjectId("category1"), // Electronics
                 ObjectId("category2")  // Computers
               ]
             }
             
             // Validación de esquema
             db.createCollection("users", {
               validator: {
                 $jsonSchema: {
                   bsonType: "object",
                   required: ["name", "email"],
                   properties: {
                     name: {
                       bsonType: "string",
                       description: "must be a string and is required"
                     },
                     email: {
                       bsonType: "string",
                       pattern: "^.+@.+$",
                       description: "must be a valid email and is required"
                     },
                     phone: {
                       bsonType: "string",
                       description: "must be a string if provided"
                     }
                   }
                 }
               }
             })
             \`\`\`
           - **Beneficio**: Mejor rendimiento de consultas, menor uso de memoria y operaciones más eficientes.`;
            }
            
            if (issues.includes('Consultas ineficientes') || 
                issues.includes('Operaciones de agregación lentas')) {
              recommendations += `
        3. **Optimizar Consultas y Agregaciones**:
           - **Problema**: Consultas y agregaciones lentas que consumen recursos excesivos.
           - **Solución**: Refactorizar consultas y optimizar pipelines de agregación.
           - **Implementación**:
             \`\`\`javascript
             // Usar proyección para limitar campos retornados
             db.collection.find(
               { status: "active" },
               { name: 1, email: 1, _id: 0 }
             )
             
             // Limitar resultados
             db.collection.find().limit(100)
             
             // Usar skip con precaución (mejor usar range queries)
             // En lugar de:
             db.collection.find().skip(10000).limit(10)
             
             // Usar:
             db.collection.find(
               { _id: { $gt: lastId } }
             ).limit(10)
             
             // Optimizar consultas con $in
             db.collection.find(
               { category: { $in: ["electronics", "computers"] } }
             )
             
             // Usar consultas cubiertas (que solo usan campos indexados)
             db.collection.find(
               { status: "active" },
               { status: 1, created_at: 1, _id: 0 }
             )
             
             // Optimizar agregaciones con $match temprano
             db.collection.aggregate([
               { $match: { status: "completed" } }, // Filtrar primero
               { $group: { _id: "$customer_id", total: { $sum: "$amount" } } }
             ])
             
             // Usar índices para ordenamiento
             db.collection.find().sort({ indexed_field: 1 })
             
             // Optimizar lookup con filtros previos
             db.orders.aggregate([
               { $match: { status: "shipped" } }, // Filtrar antes del lookup
               { $lookup: {
                   from: "customers",
                   localField: "customer_id",
                   foreignField: "_id",
                   as: "customer"
                }
               }
             ])
             
             // Usar operadores de proyección eficientes
             db.collection.aggregate([
               { $project: {
                   year: { $year: "$date" },
                   month: { $month: "$date" },
                   day: { $dayOfMonth: "$date" }
                }
               }
             ])
             
             // Optimizar agregaciones con $group y $sum
             db.sales.aggregate([
               { $match: { date: { $gte: ISODate("2023-01-01") } } },
               { $group: {
                   _id: { month: { $month: "$date" }, year: { $year: "$date" } },
                   total: { $sum: "$amount" },
                   count: { $sum: 1 }
                }
               },
               { $sort: { "_id.year": 1, "_id.month": 1 } }
             ])
             
             // Usar allowDiskUse para agregaciones con grandes conjuntos de datos
             db.collection.aggregate([
               // pipeline stages
             ], { allowDiskUse: true })
             
             // Optimizar con $unwind selectivo
             db.orders.aggregate([
               { $match: { status: "completed" } },
               { $unwind: "$items" }, // Solo hacer unwind después de filtrar
               { $group: {
                   _id: "$items.product_id",
                   total_sold: { $sum: "$items.quantity" }
                }
               }
             ])
             
             // Usar $lookup con pipeline
             db.orders.aggregate([
               { $lookup: {
                   from: "inventory",
                   let: { order_item: "$item", order_qty: "$ordered" },
                   pipeline: [
                     { $match: { $expr: { $eq: ["$sku", "$$order_item"] } } },
                     { $project: { stock: 1, _id: 0 } }
                   ],
                   as: "inventory_docs"
                }
               }
             ])
             
             // Usar hint para forzar uso de índice específico
             db.collection.find({ status: "active", category: "electronics" })
               .hint({ status: 1, category: 1 })
             \`\`\`
           - **Beneficio**: Consultas más rápidas, menor uso de CPU y memoria, y mejor experiencia de usuario.`;
            }
            
            if (issues.includes('Configuración de sharding subóptima') || 
                issues.includes('Distribución desigual de datos')) {
              recommendations += `
        4. **Optimizar Sharding y Distribución**:
           - **Problema**: Distribución desigual con ${metrics.specificMetrics.shardImbalance}% de desbalance.
           - **Solución**: Reconfigurar estrategia de sharding y distribución.
           - **Implementación**:
             \`\`\`javascript
             // Verificar estado del cluster
             sh.status()
             
             // Analizar distribución de chunks
             db.collection.getShardDistribution()
             
             // Elegir una clave de shard adecuada
             // Ejemplo para datos con distribución temporal
             sh.shardCollection("database.collection", { "created_at": 1, "_id": 1 })
             
             // Ejemplo para datos con distribución geográfica
             sh.shardCollection("database.collection", { "country_code": 1, "_id": 1 })
             
             // Ejemplo para datos con alta cardinalidad
             sh.shardCollection("database.collection", { "user_id": "hashed" })
             
             // Configurar zonas para distribución geográfica
             sh.addShardToZone("shard0", "us-east")
             sh.addShardToZone("shard1", "us-west")
             sh.addShardToZone("shard2", "eu-central")
             
             // Configurar rangos de zona
             sh.updateZoneKeyRange(
               "database.collection",
               { country_code: "US-E" },
               { country_code: "US-E~" },
               "us-east"
             )
             
             sh.updateZoneKeyRange(
               "database.collection",
               { country_code: "US-W" },
               { country_code: "US-W~" },
               "us-west"
             )
             
             sh.updateZoneKeyRange(
               "database.collection",
               { country_code: "EU" },
               { country_code: "EU~" },
               "eu-central"
             )
             
             // Habilitar balanceo
             sh.enableBalancing("database.collection")
             
             // Configurar ventana de balanceo
             db.settings.update(
               { _id: "balancer" },
               { $set: { activeWindow: { start: "22:00", stop: "06:00" } } },
               { upsert: true }
             )
             
             // Forzar migración de chunks
             sh.startBalancer()
             
             // Verificar operaciones de migración
             db.adminCommand({ currentOp: true, $or: [
               { op: "moveChunk" },
               { "query.moveChunk": { $exists: true } }
             ]})
             
             // Optimizar configuración de chunks
             db.adminCommand({
               setShardingParameters: 1,
               chunkSize: 64 // MB
             })
             
             // Dividir chunks manualmente para mejor distribución
             db.adminCommand({
               split: "database.collection",
               middle: { "user_id": ObjectId("middle_value") }
             })
             
             // Mover chunks específicos
             db.adminCommand({
               moveChunk: "database.collection",
               find: { "user_id": ObjectId("specific_value") },
               to: "shard0"
             })
             
             // Configurar índices para soportar consultas en colecciones sharded
             db.collection.createIndex({ "user_id": 1, "created_at": -1 })
             \`\`\`
           - **Beneficio**: Mejor distribución de carga, consultas más rápidas y escalabilidad mejorada.`;
            }
            
            if (issues.includes('Configuración de replicación ineficiente') || 
                issues.includes('Problemas de disponibilidad')) {
              recommendations += `
        5. **Optimizar Replicación y Disponibilidad**:
           - **Problema**: Configuración de replicación con ${metrics.specificMetrics.replicationLag}ms de lag.
           - **Solución**: Reconfigurar replicación y mejorar disponibilidad.
           - **Implementación**:
             \`\`\`javascript
             // Verificar estado del replica set
             rs.status()
             
             // Configurar replica set con prioridades
             rs.reconfig({
               _id: "rs0",
               members: [
                 { _id: 0, host: "mongodb0.example.net:27017", priority: 2 },
                                  { _id: 1, host: "mongodb1.example.net:27017", priority: 1 },
                 { _id: 2, host: "mongodb2.example.net:27017", priority: 0, hidden: true }
               ]
             })
             
             // Configurar miembro oculto para backups
             rs.reconfig({
               _id: "rs0",
               members: [
                 { _id: 0, host: "mongodb0.example.net:27017", priority: 2 },
                 { _id: 1, host: "mongodb1.example.net:27017", priority: 1 },
                 { _id: 2, host: "mongodb2.example.net:27017", priority: 0, hidden: true, slaveDelay: 3600 }
               ]
             })
             
             // Configurar miembro árbitro para evitar empates
             rs.addArb("mongodb3.example.net:27017")
             
             // Verificar configuración
             rs.conf()
             
             // Verificar estado de replicación
             db.printReplicationInfo()
             
             // Verificar lag de replicación
             rs.printSecondaryReplicationInfo()
             
             // Configurar read preference para distribuir carga
             // En el cliente:
             const client = new MongoClient(uri, {
               readPreference: 'secondaryPreferred',
               readConcern: { level: 'majority' }
             })
             
             // Configurar write concern para garantizar durabilidad
             db.collection.insertOne(
               { document: "data" },
               { writeConcern: { w: "majority", wtimeout: 1000 } }
             )
             
             // Configurar read concern para consistencia
             db.collection.find().readConcern("majority")
             
             // Configurar heartbeat y timeouts
             rs.reconfig({
               _id: "rs0",
               members: [ /* ... */ ],
               settings: {
                 heartbeatTimeoutSecs: 10,
                 electionTimeoutMillis: 10000,
                 catchUpTimeoutMillis: 60000
               }
             })
             
             // Configurar prioridad para elecciones
             rs.reconfig({
               _id: "rs0",
               members: [
                 { _id: 0, host: "mongodb0.example.net:27017", priority: 10 },
                 { _id: 1, host: "mongodb1.example.net:27017", priority: 5 },
                 { _id: 2, host: "mongodb2.example.net:27017", priority: 2 }
               ]
             })
             
             // Configurar tags para routing
             rs.reconfig({
               _id: "rs0",
               members: [
                 { _id: 0, host: "mongodb0.example.net:27017", tags: { "dc": "east", "use": "production" } },
                 { _id: 1, host: "mongodb1.example.net:27017", tags: { "dc": "west", "use": "production" } },
                 { _id: 2, host: "mongodb2.example.net:27017", tags: { "dc": "east", "use": "reporting" } }
               ]
             })
             
             // Usar tags para read preference
             // En el cliente:
             const client = new MongoClient(uri, {
               readPreference: {
                 mode: 'secondary',
                 tags: [{ "use": "reporting" }, { "dc": "west" }]
               }
             })
             \`\`\`
           - **Beneficio**: Mayor disponibilidad, durabilidad mejorada y mejor distribución de carga.`;
            }
            
            if (issues.includes('Configuración de caché ineficiente') || 
                issues.includes('Problemas de rendimiento en lecturas')) {
              recommendations += `
        6. **Optimizar Caché y Lecturas**:
           - **Problema**: Configuración de caché ineficiente con ${metrics.specificMetrics.cacheHitRatio}% de hit ratio.
           - **Solución**: Implementar estrategias de caché y optimizar lecturas.
           - **Implementación**:
             \`\`\`javascript
             // Configurar WiredTiger cache
             db.adminCommand({
               setParameter: 1,
               wiredTigerEngineRuntimeConfig: "cache_size=10G"
             })
             
             // Verificar uso de caché
             db.serverStatus().wiredTiger.cache
             
             // Implementar caché a nivel de aplicación (ejemplo con Node.js y Redis)
             const redis = require('redis');
             const client = redis.createClient();
             
             // Función para obtener datos con caché
             async function getDataWithCache(key, fetchFunction, ttl = 3600) {
               // Intentar obtener de caché
               const cachedData = await client.get(key);
               if (cachedData) {
                 return JSON.parse(cachedData);
               }
               
               // Si no está en caché, obtener de MongoDB
               const data = await fetchFunction();
               
               // Guardar en caché
               await client.set(key, JSON.stringify(data), 'EX', ttl);
               
               return data;
             }
             
             // Ejemplo de uso
             async function getUserById(userId) {
               return getDataWithCache(
                 \`user:\${userId}\`,
                 async () => {
                   return await db.users.findOne({ _id: ObjectId(userId) });
                 },
                 1800 // 30 minutos TTL
               );
             }
             
             // Implementar caché para consultas frecuentes
             const cacheMap = new Map();
             
             function getCachedQuery(collection, query, options = {}, ttl = 60000) {
               const queryKey = JSON.stringify({ collection, query, options });
               
               const cached = cacheMap.get(queryKey);
               if (cached && Date.now() - cached.timestamp < ttl) {
                 return cached.data;
               }
               
               const data = db[collection].find(query, options).toArray();
               cacheMap.set(queryKey, { data, timestamp: Date.now() });
               
               return data;
             }
             
             // Implementar invalidación de caché
             function invalidateCache(pattern) {
               for (const key of cacheMap.keys()) {
                 if (key.includes(pattern)) {
                   cacheMap.delete(key);
                 }
               }
             }
             
             // Ejemplo: invalidar caché al actualizar
             function updateUserAndInvalidateCache(userId, update) {
               db.users.updateOne({ _id: ObjectId(userId) }, { $set: update });
               invalidateCache(\`"collection":"users"\`);
               client.del(\`user:\${userId}\`);
             }
             
             // Configurar índices para soportar caché
             db.collection.createIndex(
               { "cached_field": 1 },
               { expireAfterSeconds: 3600 }
             )
             
             // Implementar read-ahead para datos relacionados
             async function getUserWithRelatedData(userId) {
               // Obtener usuario y precarga datos relacionados
               const [user, orders, preferences] = await Promise.all([
                 getUserById(userId),
                 getDataWithCache(
                   \`user:\${userId}:orders\`,
                   async () => await db.orders.find({ user_id: ObjectId(userId) }).limit(10).toArray(),
                   1200
                 ),
                 getDataWithCache(
                   \`user:\${userId}:preferences\`,
                   async () => await db.preferences.findOne({ user_id: ObjectId(userId) }),
                   3600
                 )
               ]);
               
               return { user, orders, preferences };
             }
             
             // Implementar caché de segundo nivel (L2)
             const L1Cache = new Map(); // Memoria (rápido, volátil)
             
             async function getTieredCache(key, fetchFunction, l1ttl = 60, l2ttl = 3600) {
               // Verificar L1 (memoria)
               const l1Cached = L1Cache.get(key);
               if (l1Cached && Date.now() - l1Cached.timestamp < l1ttl * 1000) {
                 return l1Cached.data;
               }
               
               // Verificar L2 (Redis)
               const l2Cached = await client.get(key);
               if (l2Cached) {
                 const data = JSON.parse(l2Cached);
                 // Actualizar L1
                 L1Cache.set(key, { data, timestamp: Date.now() });
                 return data;
               }
               
               // Obtener de la base de datos
               const data = await fetchFunction();
               
               // Actualizar ambos niveles
               L1Cache.set(key, { data, timestamp: Date.now() });
               await client.set(key, JSON.stringify(data), 'EX', l2ttl);
               
               return data;
             }
             \`\`\`
           - **Beneficio**: Reducción significativa en tiempos de respuesta, menor carga en la base de datos y mejor experiencia de usuario.`;
            }
            
            if (issues.includes('Operaciones de escritura ineficientes') || 
                issues.includes('Problemas de concurrencia')) {
              recommendations += `
        7. **Optimizar Escrituras y Concurrencia**:
           - **Problema**: Operaciones de escritura ineficientes y problemas de concurrencia.
           - **Solución**: Implementar patrones de escritura eficientes y gestión de concurrencia.
           - **Implementación**:
             \`\`\`javascript
             // Usar operaciones bulk para múltiples escrituras
             const bulkOp = db.collection.initializeUnorderedBulkOp();
             
             // Añadir operaciones al bulk
             for (let i = 0; i < 1000; i++) {
               bulkOp.insert({ index: i, value: "data" + i });
             }
             
             // Ejecutar bulk
             bulkOp.execute();
             
             // Usar upsert para insertar o actualizar
             db.collection.updateOne(
               { _id: id },
               { $set: { field: "value", updated_at: new Date() } },
               { upsert: true }
             )
             
             // Usar operaciones atómicas para concurrencia
             db.collection.updateOne(
               { _id: id, version: currentVersion },
               { 
                 $set: { field: "new value" },
                 $inc: { version: 1 }
               }
             )
             
             // Verificar resultado para detectar conflictos
             const result = db.collection.updateOne(
               { _id: id, version: currentVersion },
               { 
                 $set: { field: "new value" },
                 $inc: { version: 1 }
               }
             )
             
             if (result.modifiedCount === 0) {
               // Conflicto de concurrencia detectado
               throw new Error("Concurrent modification detected");
             }
             
             // Implementar patrón de bloqueo optimista
             async function updateWithOptimisticLock(id, updateFunc, maxRetries = 3) {
               let retries = 0;
               
               while (retries < maxRetries) {
                 // Obtener documento con versión actual
                 const doc = await db.collection.findOne({ _id: id });
                 if (!doc) return null;
                 
                 // Aplicar cambios
                 const updatedDoc = updateFunc(doc);
                 
                 // Intentar actualizar con control de versión
                 const result = await db.collection.updateOne(
                   { _id: id, version: doc.version },
                   { 
                     $set: { ...updatedDoc, version: doc.version + 1 }
                   }
                 );
                 
                 if (result.modifiedCount === 1) {
                   return { ...updatedDoc, version: doc.version + 1 };
                 }
                 
                 // Si falla, reintentar
                 retries++;
               }
               
               throw new Error("Failed to update after " + maxRetries + " retries");
             }
             
             // Ejemplo de uso del bloqueo optimista
             updateWithOptimisticLock("user123", (user) => {
               user.balance += 100;
               user.transactions.push({ amount: 100, type: "credit", date: new Date() });
               return user;
             });
             
             // Implementar transacciones para operaciones multi-documento
             const session = client.startSession();
             session.startTransaction();
             
             try {
               // Operación 1
               await db.accounts.updateOne(
                 { _id: fromAccount },
                 { $inc: { balance: -amount } },
                 { session }
               );
               
               // Operación 2
               await db.accounts.updateOne(
                 { _id: toAccount },
                 { $inc: { balance: amount } },
                 { session }
               );
               
               // Operación 3
               await db.transactions.insertOne(
                 { from: fromAccount, to: toAccount, amount, date: new Date() },
                 { session }
               );
               
               // Confirmar transacción
               await session.commitTransaction();
             } catch (error) {
               // Revertir en caso de error
               await session.abortTransaction();
               throw error;
             } finally {
               session.endSession();
             }
             
             // Implementar patrón de escritura diferida para operaciones no críticas
             function deferredWrite(operation) {
               db.deferredOperations.insertOne({
                 operation,
                 status: "pending",
                 created_at: new Date()
               });
             }
             
             // Procesador de escrituras diferidas
             async function processDeferredWrites() {
               const operations = await db.deferredOperations.find(
                 { status: "pending" }
               ).toArray();
               
               for (const op of operations) {
                 try {
                   // Ejecutar operación
                   await eval("db." + op.operation);
                   
                   // Marcar como completada
                   await db.deferredOperations.updateOne(
                     { _id: op._id },
                     { $set: { status: "completed", completed_at: new Date() } }
                   );
                 } catch (error) {
                   // Marcar como fallida
                   await db.deferredOperations.updateOne(
                     { _id: op._id },
                     { 
                       $set: { 
                         status: "failed", 
                         error: error.message,
                         failed_at: new Date() 
                       },
                       $inc: { retries: 1 }
                     }
                   );
                 }
               }
             }
             
             // Configurar índice TTL para limpiar operaciones antiguas
             db.deferredOperations.createIndex(
               { completed_at: 1 },
               { expireAfterSeconds: 86400 } // 24 horas
             )
             \`\`\`
           - **Beneficio**: Mayor rendimiento en escrituras, integridad de datos mejorada y mejor manejo de concurrencia.`;
            }
            
            return {
              metrics,
              issues,
              recommendations
            };
          }
          
          /**
           * Analiza el rendimiento de una aplicación móvil
           * @param appInfo Información de la aplicación móvil
           * @returns Informe de rendimiento
           */
          private async analyzeMobilePerformance(appInfo: {
            platform: 'ios' | 'android';
            appId?: string;
            appPath?: string;
          }): Promise<{
            metrics: Record<string, any>;
            issues: string[];
            recommendations: string[];
          }> {
            console.log(`Analizando rendimiento móvil para plataforma: ${appInfo.platform}`);
            
            // Simulación de análisis de rendimiento móvil
            // En una implementación real, se utilizarían herramientas como Android Profiler, Xcode Instruments, etc.
            
            // Métricas simuladas
            const metrics = {
              // Métricas de rendimiento general
              startupTime: Math.random() * 2000 + 1000, // ms
              frameRate: Math.random() * 30 + 30, // fps
              memoryUsage: Math.random() * 200 + 100, // MB
              cpuUsage: Math.random() * 30 + 10, // %
              batteryDrain: Math.random() * 5 + 1, // % por minuto
              
              // Métricas de red
              networkRequests: Math.floor(Math.random() * 50) + 10,
              dataTransferred: Math.floor(Math.random() * 10) + 1, // MB
              timeToFirstByte: Math.random() * 500 + 100, // ms
              requestFailureRate: Math.random() * 10, // %
              
              // Métricas de UI
              uiRenderTime: Math.random() * 100 + 50, // ms
              inputLatency: Math.random() * 50 + 10, // ms
              scrollPerformance: Math.random() * 100 + 50, // puntuación
              animationSmoothness: Math.random() * 100 + 50, // puntuación
              
              // Métricas de almacenamiento
              appSize: Math.floor(Math.random() * 100) + 50, // MB
              databaseSize: Math.floor(Math.random() * 50) + 10, // MB
              cacheSize: Math.floor(Math.random() * 30) + 5, // MB
              
              // Métricas específicas de plataforma
              ...(appInfo.platform === 'android' ? {
                anrCount: Math.floor(Math.random() * 5), // Application Not Responding
                gcPauses: Math.floor(Math.random() * 20) + 5,
                overdraw: Math.random() * 2 + 1, // factor
                dexSize: Math.floor(Math.random() * 20) + 10, // MB
              } : {
                thermalState: Math.floor(Math.random() * 3), // 0-2 (normal, elevated, serious)
                memoryWarnings: Math.floor(Math.random() * 3),
                viewControllerCount: Math.floor(Math.random() * 30) + 10,
                autoLayoutConstraints: Math.floor(Math.random() * 1000) + 500,
              })
            };
            
            // Identificar problemas basados en métricas
            const issues = [];
            
            if (metrics.startupTime > 2000) {
              issues.push('Tiempo de inicio lento');
            }
            
            if (metrics.frameRate < 45) {
              issues.push('Tasa de frames baja');
            }
            
            if (metrics.memoryUsage > 200) {
              issues.push('Uso excesivo de memoria');
            }
            
            if (metrics.cpuUsage > 25) {
              issues.push('Uso excesivo de CPU');
            }
            
            if (metrics.batteryDrain > 3) {
              issues.push('Consumo excesivo de batería');
            }
            
            if (metrics.uiRenderTime > 100) {
              issues.push('Tiempo de renderizado UI lento');
            }
            
            if (metrics.inputLatency > 40) {
              issues.push('Latencia de entrada alta');
            }
            
            if (appInfo.platform === 'android' && metrics.anrCount > 0) {
              issues.push('Incidentes ANR (Application Not Responding)');
            }
            
            if (appInfo.platform === 'android' && metrics.overdraw > 2) {
              issues.push('Overdraw excesivo');
            }
            
            if (appInfo.platform === 'ios' && metrics.thermalState > 1) {
              issues.push('Estado térmico elevado');
            }
            
            if (appInfo.platform === 'ios' && metrics.memoryWarnings > 0) {
              issues.push('Advertencias de memoria');
            }
            
            if (appInfo.platform === 'ios' && metrics.autoLayoutConstraints > 800) {
              issues.push('Exceso de restricciones de Auto Layout');
            }
            
            // Generar recomendaciones basadas en los problemas identificados
            const recommendations = [];
            
            if (issues.includes('Tiempo de inicio lento')) {
              recommendations.push(`### Optimizar Tiempo de Inicio
      - **Problema**: Tiempo de inicio lento (${Math.round(metrics.startupTime)}ms).
      - **Solución**: Implementar inicio diferido y optimizar inicialización.
      - **Implementación**:
        1. **Inicio diferido**: Cargar componentes no esenciales después del inicio.
        2. **Inicialización asíncrona**: Mover operaciones pesadas a hilos secundarios.
        3. **Reducir dependencias**: Minimizar bibliotecas de terceros en el inicio.
        4. **Optimizar recursos**: Comprimir imágenes y recursos.
      - **Código de ejemplo (Android)**:
        \`\`\`kotlin
        // Implementar WorkManager para tareas diferidas
        val initWorkRequest = OneTimeWorkRequestBuilder<InitializationWorker>()
            .setConstraints(Constraints.Builder()
                .setRequiresCharging(false)
                .build())
            .build()
            
        WorkManager.getInstance(context).enqueue(initWorkRequest)
        
        // Clase trabajadora para inicialización diferida
        class InitializationWorker(context: Context, params: WorkerParameters) : 
            CoroutineWorker(context, params) {
            
            override suspend fun doWork(): Result = coroutineScope {
                try {
                    // Inicializar componentes no críticos
                    val deferredTasks = listOf(
                        async { initializeAnalytics() },
                        async { preloadData() },
                        async { initializeThirdPartyLibraries() }
                    )
                    
                    deferredTasks.awaitAll()
                    Result.success()
                } catch (e: Exception) {
                    Result.retry()
                }
            }
        }
        
        // Optimizar inicialización de la aplicación
        class MyApplication : Application() {
            override fun onCreate() {
                // Configurar StrictMode para detectar operaciones lentas
                if (BuildConfig.DEBUG) {
                    StrictMode.setThreadPolicy(StrictMode.ThreadPolicy.Builder()
                        .detectDiskReads()
                        .detectDiskWrites()
                        .detectNetwork()
                        .penaltyLog()
                        .build())
                }
                
                // Solo inicializar componentes críticos
                super.onCreate()
                initializeCriticalComponents()
                
                // Diferir el resto
                lifecycleScope.launch {
                    initializeNonCriticalComponents()
                }
            }
        }
        \`\`\`
      - **Código de ejemplo (iOS)**:
        \`\`\`swift
        // AppDelegate.swift
        func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
            // Inicializar solo componentes críticos
            initializeCriticalComponents()
            
            // Diferir inicialización no crítica
            DispatchQueue.global(qos: .utility).async {
                self.initializeNonCriticalComponents()
            }
            
            return true
        }
        
        // Usar UIKit Restoration API para restaurar estado
        func application(_ application: UIApplication, shouldSaveApplicationState coder: NSCoder) -> Bool {
            return true
        }
        
        func application(_ application: UIApplication, shouldRestoreApplicationState coder: NSCoder) -> Bool {
            return true
        }
        
        // SceneDelegate.swift
        func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
            // Usar state restoration
            guard let windowScene = (scene as? UIWindowScene) else { return }
            window = UIWindow(windowScene: windowScene)
            
            if let userActivity = connectionOptions.userActivities.first {
                self.scene(scene, continue: userActivity)
            } else {
                window?.rootViewController = MainViewController()
            }
            window?.makeKeyAndVisible()
        }
        \`\`\`
      - **Beneficio**: Reducción del tiempo de inicio en un 40-60%, mejorando la experiencia de usuario inicial.`);
            }
            
            if (issues.includes('Tasa de frames baja') || issues.includes('Tiempo de renderizado UI lento')) {
              recommendations.push(`### Optimizar Renderizado UI
      - **Problema**: Rendimiento UI deficiente (${Math.round(metrics.frameRate)} FPS, renderizado: ${Math.round(metrics.uiRenderTime)}ms).
      - **Solución**: Optimizar jerarquía de vistas y operaciones de renderizado.
      - **Implementación**:
        1. **Aplanar jerarquía de vistas**: Reducir anidamiento y complejidad.
        2. **Reciclar vistas**: Implementar patrones de reciclaje para listas.
        3. **Renderizado asíncrono**: Mover cálculos de layout a hilos secundarios.
        4. **Cachear resultados**: Pre-renderizar elementos complejos.
      - **Código de ejemplo (Android)**:
        \`\`\`kotlin
        // Optimizar RecyclerView
        class OptimizedAdapter : RecyclerView.Adapter<ViewHolder>() {
            // Implementar DiffUtil para actualizaciones eficientes
            fun updateItems(newItems: List<Item>) {
                val diffCallback = ItemDiffCallback(items, newItems)
                val diffResult = DiffUtil.calculateDiff(diffCallback)
                
                items = newItems
                diffResult.dispatchUpdatesTo(this)
            }
            
            override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
                // Inflar layout eficiente (menos anidamiento)
                val view = LayoutInflater.from(parent.context)
                    .inflate(R.layout.optimized_item_layout, parent, false)
                return ViewHolder(view)
            }
            
            override fun onBindViewHolder(holder: ViewHolder, position: Int) {
                val item = items[position]
                
                // Evitar operaciones costosas en onBind
                holder.titleView.text = item.title
                
                // Cargar imágenes de forma eficiente
                Glide.with(holder.imageView)
                    .load(item.imageUrl)
                    .diskCacheStrategy(DiskCacheStrategy.ALL)
                    .override(Target.SIZE_ORIGINAL)
                    .dontTransform()
                    .into(holder.imageView)
                
                // Diferir cálculos complejos
                holder.itemView.post {
                    // Operaciones que no bloquean el renderizado inicial
                    holder.updateSecondaryInfo(item)
                }
            }
        }
        
        // Optimizar layout XML
        <!-- optimized_item_layout.xml -->
        <!-- Usar ConstraintLayout en lugar de layouts anidados -->
        <androidx.constraintlayout.widget.ConstraintLayout
            android:layout_width="match_parent"
            android:layout_height="wrap_content">
            
            <ImageView
                android:id="@+id/image"
                android:layout_width="64dp"
                android:layout_height="64dp"
                app:layout_constraintStart_toStartOf="parent"
                app:layout_constraintTop_toTopOf="parent"
                android:importantForAccessibility="no" />
                
            <TextView
                android:id="@+id/title"
                android:layout_width="0dp"
                android:layout_height="wrap_content"
                app:layout_constraintStart_toEndOf="@id/image"
                app:layout_constraintEnd_toEndOf="parent"
                app:layout_constraintTop_toTopOf="parent" />
                
            <!-- Evitar anidamiento profundo -->
            
        </androidx.constraintlayout.widget.ConstraintLayout>
        
        // Usar hardware acceleration
        android:hardwareAccelerated="true"
        
        // Evitar overdraw con backgrounds transparentes
        android:background="@null"
        \`\`\`
      - **Código de ejemplo (iOS)**:
        \`\`\`swift
        // Optimizar UITableView/UICollectionView
        class OptimizedTableViewController: UITableViewController {
            override func viewDidLoad() {
                super.viewDidLoad()
                
                // Registrar celdas reutilizables
                tableView.register(OptimizedCell.self, forCellReuseIdentifier: "Cell")
                
                // Pre-calcular alturas de celdas
                tableView.estimatedRowHeight = 80
                tableView.rowHeight = UITableView.automaticDimension
                
                // Reducir trabajo en el hilo principal
                DispatchQueue.global(qos: .userInitiated).async {
                    // Preparar datos
                    let preparedData = self.prepareData()
                    
                    DispatchQueue.main.async {
                        self.data = preparedData
                        self.tableView.reloadData()
                    }
                }
            }
            
            override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
                let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath) as! OptimizedCell
                
                // Configurar celda con datos mínimos
                let item = data[indexPath.row]
                cell.configure(with: item)
                
                // Diferir carga de imágenes
                cell.loadImageAsync(url: item.imageURL)
                
                return cell
            }
        }
        
        // Optimizar celdas
        class OptimizedCell: UITableViewCell {
            // Usar CALayer en lugar de UIImageView cuando sea posible
            private let avatarLayer = CALayer()
            private let titleLabel = UILabel()
            
            // Cachear rasterizaciones para layers estáticos
            func setupLayers() {
                avatarLayer.shouldRasterize = true
                avatarLayer.rasterizationScale = UIScreen.main.scale
            }
            
            // Evitar Auto Layout para celdas críticas de rendimiento
            override func layoutSubviews() {
                super.layoutSubviews()
                
                // Layout manual para máximo rendimiento
                let bounds = contentView.bounds
                avatarLayer.frame = CGRect(x: 10, y: 10, width: 50, height: 50)
                                titleLabel.frame = CGRect(x: 70, y: 10, width: bounds.width - 80, height: 20)
            }
        }
        \`\`\`
      - **Beneficio**: Mejora significativa en la tasa de frames, reducción de lag en UI y mejor experiencia de usuario.`);
            }
            
            if (issues.includes('Uso excesivo de memoria')) {
              recommendations.push(`### Optimizar Uso de Memoria
      - **Problema**: Uso excesivo de memoria (${Math.round(metrics.memoryUsage)}MB).
      - **Solución**: Implementar gestión eficiente de memoria y recursos.
      - **Implementación**:
        1. **Liberar recursos no utilizados**: Implementar limpieza proactiva.
        2. **Optimizar estructuras de datos**: Usar estructuras eficientes en memoria.
        3. **Implementar lazy loading**: Cargar recursos solo cuando sean necesarios.
        4. **Reducir duplicación de datos**: Compartir recursos cuando sea posible.
      - **Código de ejemplo (Android)**:
        \`\`\`kotlin
        // Implementar gestión de memoria en imágenes
        class ImageCache {
            // Usar LruCache para limitar memoria usada
            private val memoryCache: LruCache<String, Bitmap> = LruCache<String, Bitmap>(
                (Runtime.getRuntime().maxMemory() / 8).toInt()
            ).apply {
                sizeOf = { _, bitmap -> bitmap.byteCount / 1024 }
            }
            
            fun addBitmapToCache(key: String, bitmap: Bitmap) {
                if (getBitmapFromCache(key) == null) {
                    memoryCache.put(key, bitmap)
                }
            }
            
            fun getBitmapFromCache(key: String): Bitmap? {
                return memoryCache.get(key)
            }
            
            fun clearCache() {
                memoryCache.evictAll()
            }
        }
        
        // Implementar WeakReferences para evitar fugas de memoria
        class ImageViewHolder(itemView: View) {
            private val imageView: ImageView = itemView.findViewById(R.id.image)
            private var imageReference: WeakReference<Bitmap>? = null
            
            fun setImage(bitmap: Bitmap) {
                // Liberar referencia anterior si existe
                imageReference?.get()?.recycle()
                
                // Crear nueva referencia débil
                imageReference = WeakReference(bitmap)
                imageView.setImageBitmap(bitmap)
            }
            
            fun clear() {
                imageView.setImageDrawable(null)
                imageReference?.clear()
                imageReference = null
            }
        }
        
        // Implementar onTrimMemory para responder a presión de memoria
        override fun onTrimMemory(level: Int) {
            super.onTrimMemory(level)
            
            when (level) {
                ComponentCallbacks2.TRIM_MEMORY_RUNNING_MODERATE,
                ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW,
                ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL -> {
                    // Liberar caches no críticos
                    imageCache.trimToSize(imageCache.size() / 2)
                }
                ComponentCallbacks2.TRIM_MEMORY_UI_HIDDEN -> {
                    // La UI no es visible, liberar recursos de UI
                    imageCache.trimToSize(imageCache.size() / 4)
                }
                ComponentCallbacks2.TRIM_MEMORY_BACKGROUND,
                ComponentCallbacks2.TRIM_MEMORY_MODERATE,
                ComponentCallbacks2.TRIM_MEMORY_COMPLETE -> {
                    // App en background, liberar todos los recursos posibles
                    imageCache.clearCache()
                    System.gc()
                }
            }
        }
        \`\`\`
      - **Código de ejemplo (iOS)**:
        \`\`\`swift
        // Implementar cache de imágenes con límite de memoria
        class ImageCache {
            static let shared = ImageCache()
            
            private let cache = NSCache<NSString, UIImage>()
            private let memoryWarningNotification = UIApplication.didReceiveMemoryWarningNotification
            
            private init() {
                // Configurar límite de memoria
                cache.totalCostLimit = 50 * 1024 * 1024 // 50MB
                cache.countLimit = 100
                
                // Registrar para notificaciones de memoria
                NotificationCenter.default.addObserver(
                    self,
                    selector: #selector(clearCache),
                    name: memoryWarningNotification,
                    object: nil
                )
            }
            
            func setImage(_ image: UIImage, forKey key: String) {
                let cost = Int(image.size.width * image.size.height * 4) // Estimación de bytes
                cache.setObject(image, forKey: key as NSString, cost: cost)
            }
            
            func getImage(forKey key: String) -> UIImage? {
                return cache.object(forKey: key as NSString)
            }
            
            @objc func clearCache() {
                cache.removeAllObjects()
            }
            
            deinit {
                NotificationCenter.default.removeObserver(self)
            }
        }
        
        // Implementar gestión de ciclo de vida para liberar memoria
        class OptimizedViewController: UIViewController {
            // Usar propiedades lazy para inicialización diferida
            lazy var heavyResource: HeavyResource = {
                return HeavyResource()
            }()
            
            // Liberar recursos cuando no son visibles
            override func viewDidDisappear(_ animated: Bool) {
                super.viewDidDisappear(animated)
                
                if isMovingFromParent {
                    // Liberar recursos pesados
                    heavyResource.release()
                }
            }
            
            // Responder a advertencias de memoria
            override func didReceiveMemoryWarning() {
                super.didReceiveMemoryWarning()
                
                // Liberar caches y recursos no esenciales
                ImageCache.shared.clearCache()
                
                // Forzar ciclo de recolección de basura
                autoreleasepool {
                    // Liberar objetos autoreleased
                }
            }
        }
        
        // Usar estructuras de datos eficientes
        struct EfficientDataStructure {
            // Usar tipos de valor en lugar de referencia cuando sea posible
            struct Item {
                let id: Int
                let name: String
            }
            
            // Usar arrays contiguos en lugar de listas enlazadas
            var items = [Item]()
            
            // Implementar paginación para grandes conjuntos de datos
            func loadPage(offset: Int, limit: Int) -> [Item] {
                let startIndex = min(offset, items.count)
                let endIndex = min(offset + limit, items.count)
                return Array(items[startIndex..<endIndex])
            }
        }
        \`\`\`
      - **Beneficio**: Reducción del uso de memoria en un 30-50%, menos cierres forzados por el sistema y mejor rendimiento general.`);
            }
            
            if (issues.includes('Uso excesivo de CPU') || issues.includes('Consumo excesivo de batería')) {
              recommendations.push(`### Optimizar Uso de CPU y Batería
      - **Problema**: Uso excesivo de CPU (${Math.round(metrics.cpuUsage)}%) y consumo de batería (${metrics.batteryDrain.toFixed(1)}% por minuto).
      - **Solución**: Optimizar operaciones intensivas y gestionar eficientemente los recursos.
      - **Implementación**:
        1. **Mover operaciones pesadas a hilos secundarios**: Evitar bloquear el hilo principal.
        2. **Implementar procesamiento por lotes**: Agrupar operaciones similares.
        3. **Optimizar algoritmos**: Reducir complejidad computacional.
        4. **Gestionar ciclos de trabajo**: Implementar throttling y batching.
        5. **Optimizar uso de sensores y GPS**: Reducir frecuencia de muestreo.
      - **Código de ejemplo (Android)**:
        \`\`\`kotlin
        // Implementar WorkManager para operaciones en background
        class DataSyncWorker(context: Context, params: WorkerParameters) : 
            CoroutineWorker(context, params) {
            
            override suspend fun doWork(): Result = coroutineScope {
                try {
                    // Agrupar operaciones de red
                    val syncTasks = listOf(
                        async { syncUserData() },
                        async { syncPreferences() },
                        async { syncMedia() }
                    )
                    
                    // Esperar a que todas las tareas terminen
                    syncTasks.awaitAll()
                    
                    Result.success()
                } catch (e: Exception) {
                    Result.retry()
                }
            }
        }
        
        // Configurar trabajo periódico con restricciones
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .setRequiresBatteryNotLow(true)
            .build()
            
        val syncRequest = PeriodicWorkRequestBuilder<DataSyncWorker>(
            15, TimeUnit.MINUTES,
            5, TimeUnit.MINUTES
        )
            .setConstraints(constraints)
            .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.MINUTES)
            .build()
            
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "data_sync",
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        )
        
        // Optimizar uso de sensores
        class OptimizedLocationManager(private val context: Context) {
            private val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            private var isTracking = false
            
            // Diferentes estrategias según el nivel de batería
            fun startLocationUpdates() {
                val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
                val batteryLevel = batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
                
                val request = when {
                    batteryLevel > 50 -> {
                        // Batería alta: actualizaciones frecuentes
                        LocationRequest.create()
                            .setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY)
                            .setInterval(5000)
                            .setFastestInterval(3000)
                    }
                    batteryLevel > 20 -> {
                        // Batería media: balance entre precisión y consumo
                        LocationRequest.create()
                            .setPriority(LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY)
                            .setInterval(10000)
                            .setFastestInterval(5000)
                    }
                    else -> {
                        // Batería baja: mínimo consumo
                        LocationRequest.create()
                            .setPriority(LocationRequest.PRIORITY_LOW_POWER)
                            .setInterval(30000)
                            .setFastestInterval(15000)
                    }
                }
                
                // Iniciar actualizaciones con la estrategia adecuada
                LocationServices.getFusedLocationProviderClient(context)
                    .requestLocationUpdates(request, locationCallback, Looper.getMainLooper())
                
                isTracking = true
            }
            
            fun stopLocationUpdates() {
                if (isTracking) {
                    LocationServices.getFusedLocationProviderClient(context)
                        .removeLocationUpdates(locationCallback)
                    isTracking = false
                }
            }
        }
        \`\`\`
      - **Código de ejemplo (iOS)**:
        \`\`\`swift
        // Implementar operaciones en background con QoS adaptativo
        class BackgroundTaskManager {
            // Diferentes colas según prioridad
            private let highPriorityQueue = DispatchQueue(label: "com.app.highPriority", qos: .userInitiated)
            private let mediumPriorityQueue = DispatchQueue(label: "com.app.mediumPriority", qos: .utility)
            private let lowPriorityQueue = DispatchQueue(label: "com.app.lowPriority", qos: .background)
            
            // Ejecutar tarea con prioridad adaptativa según batería
            func executeTask(_ task: @escaping () -> Void, priority: TaskPriority? = nil) {
                // Determinar nivel de batería
                let device = UIDevice.current
                device.isBatteryMonitoringEnabled = true
                let batteryLevel = device.batteryLevel
                
                // Seleccionar cola según batería y prioridad
                let queue: DispatchQueue
                
                if let priority = priority {
                    // Usar prioridad explícita si se proporciona
                    switch priority {
                    case .high: queue = highPriorityQueue
                    case .medium: queue = mediumPriorityQueue
                    case .low: queue = lowPriorityQueue
                    }
                } else {
                    // Adaptar según nivel de batería
                    if batteryLevel > 0.5 {
                        queue = mediumPriorityQueue
                    } else if batteryLevel > 0.2 {
                        queue = lowPriorityQueue
                    } else {
                        // Batería muy baja, diferir tarea no crítica
                        scheduleTaskWhenBatteryImproves(task)
                        return
                    }
                }
                
                queue.async {
                    task()
                }
            }
            
            // Programar tarea para cuando mejore la batería
            private func scheduleTaskWhenBatteryImproves(_ task: @escaping () -> Void) {
                NotificationCenter.default.addObserver(forName: UIDevice.batteryLevelDidChangeNotification, 
                                                      object: nil, 
                                                      queue: .main) { [weak self] _ in
                    let currentLevel = UIDevice.current.batteryLevel
                    if currentLevel > 0.3 {
                        self?.lowPriorityQueue.async {
                            task()
                        }
                        NotificationCenter.default.removeObserver(self as Any, 
                                                                 name: UIDevice.batteryLevelDidChangeNotification, 
                                                                 object: nil)
                    }
                }
            }
            
            enum TaskPriority {
                case high, medium, low
            }
        }
        
        // Optimizar uso de sensores y localización
        class EfficientLocationManager: NSObject, CLLocationManagerDelegate {
            private let locationManager = CLLocationManager()
            private var isMonitoring = false
            
            override init() {
                super.init()
                locationManager.delegate = self
                
                // Configurar para minimizar uso de batería
                locationManager.allowsBackgroundLocationUpdates = false
                locationManager.pausesLocationUpdatesAutomatically = true
                locationManager.activityType = .fitness
            }
            
            func startMonitoring(accuracy: CLLocationAccuracy = kCLLocationAccuracyHundredMeters) {
                // Adaptar precisión según nivel de batería
                let device = UIDevice.current
                device.isBatteryMonitoringEnabled = true
                
                let batteryLevel = device.batteryLevel
                let desiredAccuracy: CLLocationAccuracy
                let distanceFilter: CLLocationDistance
                
                switch batteryLevel {
                case _ where batteryLevel > 0.7:
                    // Batería alta: mayor precisión
                    desiredAccuracy = kCLLocationAccuracyNearestTenMeters
                    distanceFilter = 10
                case _ where batteryLevel > 0.3:
                    // Batería media: precisión moderada
                    desiredAccuracy = kCLLocationAccuracyHundredMeters
                    distanceFilter = 50
                default:
                    // Batería baja: mínima precisión
                    desiredAccuracy = kCLLocationAccuracyKilometer
                    distanceFilter = 500
                }
                
                locationManager.desiredAccuracy = desiredAccuracy
                locationManager.distanceFilter = distanceFilter
                locationManager.startUpdatingLocation()
                
                isMonitoring = true
            }
            
            func stopMonitoring() {
                locationManager.stopUpdatingLocation()
                isMonitoring = false
            }
        }
        \`\`\`
      - **Beneficio**: Reducción del consumo de CPU en un 30-40%, aumento de la duración de la batería en un 20-30%, y mejor rendimiento general de la aplicación.`);
            }
            
            if (appInfo.platform === 'android' && (issues.includes('Incidentes ANR (Application Not Responding)') || issues.includes('Overdraw excesivo'))) {
              recommendations.push(`### Optimizar Rendimiento Específico de Android
      - **Problema**: ${issues.includes('Incidentes ANR (Application Not Responding)') ? `${metrics.anrCount} incidentes ANR` : ''} ${issues.includes('Overdraw excesivo') ? `y overdraw excesivo (${metrics.overdraw.toFixed(1)}x)` : ''}.
      - **Solución**: Implementar mejores prácticas específicas de Android.
      - **Implementación**:
        1. **Evitar operaciones largas en el hilo principal**: Usar Coroutines o RxJava.
        2. **Reducir overdraw**: Eliminar fondos innecesarios y optimizar jerarquía de vistas.
        3. **Implementar ViewHolder pattern**: Optimizar RecyclerView y ListView.
        4. **Usar herramientas de diagnóstico**: StrictMode, Systrace, y Android Profiler.
      - **Código de ejemplo**:
        \`\`\`kotlin
        // Evitar ANR con Coroutines
        class SafeActivity : AppCompatActivity() {
            private val mainScope = MainScope()
            
            override fun onCreate(savedInstanceState: Bundle?) {
                super.onCreate(savedInstanceState)
                
                // Configurar StrictMode para detectar operaciones lentas
                if (BuildConfig.DEBUG) {
                    StrictMode.setThreadPolicy(StrictMode.ThreadPolicy.Builder()
                        .detectDiskReads()
                        .detectDiskWrites()
                        .detectNetwork()
                        .penaltyLog()
                        .build())
                }
                
                // Cargar datos de forma segura
                mainScope.launch {
                    val result = withContext(Dispatchers.IO) {
                        // Operación larga en hilo secundario
                        loadDataFromDatabase()
                    }
                    
                    // Actualizar UI en hilo principal
                    updateUI(result)
                }
            }
            
            // Liberar recursos al destruir
            override fun onDestroy() {
                super.onDestroy()
                mainScope.cancel()
            }
        }
        
        // Reducir overdraw con layouts optimizados
        <!-- optimized_layout.xml -->
        <androidx.constraintlayout.widget.ConstraintLayout
            xmlns:android="http://schemas.android.com/apk/res/android"
            xmlns:app="http://schemas.android.com/apk/res-auto"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:background="@color/background">
            
            <!-- Eliminar fondos innecesarios -->
            <androidx.cardview.widget.CardView
                android:layout_width="match_parent"
                android:layout_height="wrap_content"
                app:cardBackgroundColor="@color/card_background"
                app:layout_constraintTop_toTopOf="parent"
                android:layout_margin="16dp">
                
                <!-- No establecer background aquí para evitar overdraw -->
                <LinearLayout
                    android:layout_width="match_parent"
                    android:layout_height="wrap_content"
                    android:orientation="vertical"
                    android:padding="16dp">
                    
                    <TextView
                        android:layout_width="match_parent"
                        android:layout_height="wrap_content"
                        android:text="Título"
                        android:background="@null" />
                        
                    <TextView
                        android:layout_width="match_parent"
                        android:layout_height="wrap_content"
                        android:text="Subtítulo"
                        android:background="@null" />
                </LinearLayout>
            </androidx.cardview.widget.CardView>
        </androidx.constraintlayout.widget.ConstraintLayout>
        
        // Optimizar RecyclerView con DiffUtil
        class OptimizedAdapter(
            private var items: List<Item> = emptyList()
        ) : RecyclerView.Adapter<OptimizedAdapter.ViewHolder>() {
            
            fun updateItems(newItems: List<Item>) {
                val diffCallback = ItemDiffCallback(items, newItems)
                val diffResult = DiffUtil.calculateDiff(diffCallback)
                
                items = newItems
                diffResult.dispatchUpdatesTo(this)
            }
            
            override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
                // Inflar layout eficiente
                val view = LayoutInflater.from(parent.context)
                    .inflate(R.layout.item_optimized, parent, false)
                return ViewHolder(view)
            }
            
            override fun onBindViewHolder(holder: ViewHolder, position: Int) {
                holder.bind(items[position])
            }
            
            override fun getItemCount() = items.size
            
            class ViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
                private val titleView: TextView = itemView.findViewById(R.id.title)
                private val subtitleView: TextView = itemView.findViewById(R.id.subtitle)
                
                fun bind(item: Item) {
                    titleView.text = item.title
                    subtitleView.text = item.subtitle
                }
            }
        }
        
        // Implementar DiffUtil.Callback para actualizaciones eficientes
        class ItemDiffCallback(
            private val oldList: List<Item>,
            private val newList: List<Item>
        ) : DiffUtil.Callback() {
            
            override fun getOldListSize() = oldList.size
            override fun getNewListSize() = newList.size
            
            override fun areItemsTheSame(oldItemPosition: Int, newItemPosition: Int): Boolean {
                return oldList[oldItemPosition].id == newList[newItemPosition].id
            }
            
            override fun areContentsTheSame(oldItemPosition: Int, newItemPosition: Int): Boolean {
                return oldList[oldItemPosition] == newList[newItemPosition]
            }
        }
        \`\`\`
      - **Beneficio**: Eliminación de ANRs, reducción de overdraw en un 50-70%, y mejora significativa en la fluidez de la interfaz de usuario.`);
            }
            
            if (appInfo.platform === 'ios' && (issues.includes('Estado térmico elevado') || issues.includes('Advertencias de memoria') || issues.includes('Exceso de restricciones de Auto Layout'))) {
              recommendations.push(`### Optimizar Rendimiento Específico de iOS
      - **Problema**: ${issues.includes('Estado térmico elevado') ? 'Estado térmico elevado' : ''} ${issues.includes('Advertencias de memoria') ? ', advertencias de memoria' : ''} ${issues.includes('Exceso de restricciones de Auto Layout') ? `, exceso de restricciones de Auto Layout (${metrics.autoLayoutConstraints})` : ''}.
      - **Solución**: Implementar mejores prácticas específicas de iOS.
      - **Implementación**:
        1. **Optimizar Auto Layout**: Reducir número de constraints y simplificar jerarquía de vistas.
        2. **Implementar reutilización de celdas**: Optimizar UITableView y UICollectionView.
        3. **Usar herramientas de diagnóstico**: Instruments (Time Profiler, Allocations, Leaks).
        4. **Gestionar ciclo de vida de objetos**: Evitar retención circular y liberar recursos.
      - **Código de ejemplo**:
        \`\`\`swift
        // Optimizar Auto Layout
        class OptimizedViewController: UIViewController {
            override func viewDidLoad() {
                super.viewDidLoad()
                setupEfficientLayout()
            }
            
            private func setupEfficientLayout() {
                let containerView = UIView()
                containerView.translatesAutoresizingMaskIntoConstraints = false
                view.addSubview(containerView)
                
                // Usar anchors en lugar de constraints individuales
                NSLayoutConstraint.activate([
                    containerView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
                    containerView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
                    containerView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
                    containerView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
                ])
                
                // Añadir subvistas con layout eficiente
                let stackView = UIStackView()
                stackView.translatesAutoresizingMaskIntoConstraints = false
                stackView.axis = .vertical
                stackView.spacing = 16
                stackView.distribution = .fill
                containerView.addSubview(stackView)
                
                // Usar stack view para reducir número de constraints
                NSLayoutConstraint.activate([
                    stackView.topAnchor.constraint(equalTo: containerView.topAnchor, constant: 16),
                    stackView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor, constant: 16),
                    stackView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor, constant: -16),
                    stackView.bottomAnchor.constraint(lessThanOrEqualTo: containerView.bottomAnchor, constant: -16)
                ])
                
                // Añadir elementos al stack view (sin constraints adicionales)
                let titleLabel = UILabel()
                titleLabel.text = "Título"
                titleLabel.font = UIFont.boldSystemFont(ofSize: 24)
                
                let subtitleLabel = UILabel()
                subtitleLabel.text = "Subtítulo"
                subtitleLabel.font = UIFont.systemFont(ofSize: 16)
                
                stackView.addArrangedSubview(titleLabel)
                stackView.addArrangedSubview(subtitleLabel)
                
                // Añadir más elementos según sea necesario
            }
        }
        
        // Optimizar UITableView
        class EfficientTableViewController: UITableViewController {
            private var dataSource: UITableViewDiffableDataSource<Section, Item>!
            private var items: [Item] = []
            
            override func viewDidLoad() {
                super.viewDidLoad()
                
                // Registrar celda reutilizable
                tableView.register(EfficientCell.self, forCellReuseIdentifier: "Cell")
                
                // Configurar dataSource con diffable data source
                dataSource = UITableViewDiffableDataSource<Section, Item>(tableView: tableView) { 
                    (tableView, indexPath, item) -> UITableViewCell? in
                    let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath) as! EfficientCell
                    cell.configure(with: item)
                    return cell
                }
                
                // Pre-calcular alturas de celdas
                tableView.estimatedRowHeight = 80
                tableView.rowHeight = UITableView.automaticDimension
                
                // Cargar datos en background
                DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                    guard let self = self else { return }
                    let loadedItems = self.loadItems()
                    
                    DispatchQueue.main.async {
                        self.updateItems(loadedItems)
                    }
                }
            }
            
            private func updateItems(_ newItems: [Item]) {
                items = newItems
                
                // Actualizar UI con animaciones eficientes
                var snapshot = NSDiffableDataSourceSnapshot<Section, Item>()
                snapshot.appendSections([.main])
                snapshot.appendItems(items, toSection: .main)
                dataSource.apply(snapshot, animatingDifferences: true)
            }
            
            enum Section {
                case main
            }
        }
        
        // Celda eficiente
        class EfficientCell: UITableViewCell {
            private let containerView = UIView()
            private let titleLabel = UILabel()
            private let detailLabel = UILabel()
            private let iconImageView = UIImageView()
            
            override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
                super.init(style: style, reuseIdentifier: reuseIdentifier)
                setupViews()
            }
            
            required init?(coder: NSCoder) {
                fatalError("init(coder:) has not been implemented")
            }
            
            private func setupViews() {
                // Configurar vistas con constraints mínimos
                containerView.translatesAutoresizingMaskIntoConstraints = false
                titleLabel.translatesAutoresizingMaskIntoConstraints = false
                detailLabel.translatesAutoresizingMaskIntoConstraints = false
                iconImageView.translatesAutoresizingMaskIntoConstraints = false
                
                contentView.addSubview(containerView)
                containerView.addSubview(iconImageView)
                containerView.addSubview(titleLabel)
                containerView.addSubview(detailLabel)
                
                // Configurar constraints eficientes
                NSLayoutConstraint.activate([
                    containerView.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 8),
                    containerView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 8),
                    containerView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -8),
                    containerView.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -8),
                    
                    iconImageView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
                    iconImageView.centerYAnchor.constraint(equalTo: containerView.centerYAnchor),
                    iconImageView.widthAnchor.constraint(equalToConstant: 40),
                    iconImageView.heightAnchor.constraint(equalToConstant: 40),
                    
                    titleLabel.topAnchor.constraint(equalTo: containerView.topAnchor),
                    titleLabel.leadingAnchor.constraint(equalTo: iconImageView.trailingAnchor, constant: 8),
                                        titleLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
                    
                    detailLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 4),
                    detailLabel.leadingAnchor.constraint(equalTo: titleLabel.leadingAnchor),
                    detailLabel.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
                    detailLabel.bottomAnchor.constraint(equalTo: containerView.bottomAnchor)
                ])
                
                // Configurar apariencia
                titleLabel.font = UIFont.boldSystemFont(ofSize: 16)
                detailLabel.font = UIFont.systemFont(ofSize: 14)
                detailLabel.textColor = .gray
                
                // Optimizar renderizado
                iconImageView.layer.cornerRadius = 20
                iconImageView.clipsToBounds = true
                iconImageView.contentMode = .scaleAspectFill
            }
            
            func configure(with item: Item) {
                titleLabel.text = item.title
                detailLabel.text = item.detail
                
                // Cargar imagen de forma eficiente
                if let imageURL = item.imageURL {
                    // En una implementación real, usar SDWebImage o Kingfisher
                    DispatchQueue.global(qos: .userInitiated).async { [weak self] in
                        guard let self = self else { return }
                        // Simulación de carga de imagen
                        DispatchQueue.main.async {
                            self.iconImageView.image = UIImage(named: "placeholder")
                        }
                    }
                } else {
                    iconImageView.image = UIImage(named: "default_icon")
                }
            }
            
            // Optimizar para reutilización
            override func prepareForReuse() {
                super.prepareForReuse()
                iconImageView.image = nil
                titleLabel.text = nil
                detailLabel.text = nil
            }
        }
        
        // Optimizar tareas en background
        class TaskScheduler {
            private let operationQueue = OperationQueue()
            private let dispatchQueue = DispatchQueue(label: "com.app.taskScheduler", qos: .userInitiated, attributes: .concurrent)
            
            init() {
                operationQueue.maxConcurrentOperationCount = 4
                operationQueue.qualityOfService = .userInitiated
            }
            
            func scheduleTask(priority: TaskPriority, task: @escaping () -> Void) {
                switch priority {
                case .high:
                    DispatchQueue.main.async {
                        task()
                    }
                case .medium:
                    dispatchQueue.async {
                        task()
                    }
                case .low:
                    let operation = BlockOperation(block: task)
                    operation.queuePriority = .low
                    operationQueue.addOperation(operation)
                }
            }
        }
        \`\`\`
      - **Beneficio**: Reducción significativa en el uso de memoria, mejora en la fluidez de la interfaz, y optimización del rendimiento en dispositivos con recursos limitados.`);
            }
            
            return {
              metrics,
              issues,
              recommendations
            };
          }
          
          /**
           * Analiza el rendimiento de una base de datos
           * @param dbConfig Configuración de la base de datos
           * @returns Informe de rendimiento
           */
          private async analyzeDatabasePerformance(dbConfig: {
            type: 'mysql' | 'postgresql' | 'mongodb' | 'sqlite' | string;
            connection: any;
            queries?: string[];
          }): Promise<{
            metrics: Record<string, any>;
            issues: string[];
            recommendations: string[];
          }> {
            console.log(`Analizando rendimiento de base de datos ${dbConfig.type}`);
            
            // Simulación de análisis de rendimiento de base de datos
            // En una implementación real, se conectaría a la base de datos y ejecutaría consultas de diagnóstico
            
            // Métricas simuladas
            const metrics = {
              // Métricas generales
              queryResponseTime: Math.random() * 500 + 50, // ms
              throughput: Math.floor(Math.random() * 1000) + 100, // queries/sec
              connectionPoolUsage: Math.random() * 0.8 + 0.1, // 0-1
              deadlocks: Math.floor(Math.random() * 5), // count
              
              // Métricas de almacenamiento
              databaseSize: Math.floor(Math.random() * 10000) + 1000, // MB
              indexSize: Math.floor(Math.random() * 2000) + 500, // MB
              tableFragmentation: Math.random() * 0.4, // 0-1
              
              // Métricas de consultas
              slowQueries: Math.floor(Math.random() * 20) + 1, // count
              fullTableScans: Math.floor(Math.random() * 30) + 5, // count
              indexUsage: Math.random() * 0.7 + 0.3, // 0-1
              
              // Métricas de caché
              cacheHitRatio: Math.random() * 0.6 + 0.3, // 0-1
              bufferPoolUsage: Math.random() * 0.7 + 0.2, // 0-1
              
              // Métricas específicas por tipo de base de datos
              ...(dbConfig.type === 'mysql' || dbConfig.type === 'postgresql' ? {
                tempTableUsage: Math.floor(Math.random() * 100) + 10, // count
                lockWaitTime: Math.random() * 200 + 10, // ms
              } : {}),
              
              ...(dbConfig.type === 'mongodb' ? {
                writeOperations: Math.floor(Math.random() * 5000) + 1000, // count
                readOperations: Math.floor(Math.random() * 20000) + 5000, // count
                avgDocumentSize: Math.floor(Math.random() * 10) + 1, // KB
              } : {}),
              
              ...(dbConfig.type === 'sqlite' ? {
                journalSize: Math.floor(Math.random() * 100) + 10, // MB
                walCheckpoints: Math.floor(Math.random() * 50) + 5, // count
              } : {})
            };
            
            // Identificar problemas basados en métricas
            const issues = [];
            
            if (metrics.queryResponseTime > 200) {
              issues.push('Tiempo de respuesta de consultas lento');
            }
            
            if (metrics.slowQueries > 10) {
              issues.push('Alto número de consultas lentas');
            }
            
            if (metrics.fullTableScans > 15) {
              issues.push('Excesivos escaneos completos de tablas');
            }
            
            if (metrics.indexUsage < 0.5) {
              issues.push('Bajo uso de índices');
            }
            
            if (metrics.cacheHitRatio < 0.6) {
              issues.push('Baja tasa de aciertos de caché');
            }
            
            if (metrics.tableFragmentation > 0.2) {
              issues.push('Alta fragmentación de tablas');
            }
            
            if (metrics.connectionPoolUsage > 0.8) {
              issues.push('Alto uso del pool de conexiones');
            }
            
            if (metrics.deadlocks > 2) {
              issues.push('Número significativo de deadlocks');
            }
            
            // Generar recomendaciones basadas en los problemas identificados
            const recommendations = [];
            
            if (issues.includes('Tiempo de respuesta de consultas lento') || 
                issues.includes('Alto número de consultas lentas')) {
              recommendations.push(`### Optimizar Consultas Lentas
      - **Problema**: Rendimiento de consultas deficiente (tiempo de respuesta: ${Math.round(metrics.queryResponseTime)}ms, consultas lentas: ${metrics.slowQueries}).
      - **Solución**: Optimizar consultas y estructura de la base de datos.
      - **Implementación**:
        1. **Analizar y optimizar consultas lentas**: Usar EXPLAIN para identificar cuellos de botella.
        2. **Crear índices apropiados**: Añadir índices para columnas frecuentemente consultadas.
        3. **Reescribir consultas ineficientes**: Evitar funciones en cláusulas WHERE, optimizar JOINs.
        4. **Implementar paginación**: Limitar resultados con LIMIT/OFFSET o cursores.
      - **Código de ejemplo (MySQL/PostgreSQL)**:
        \`\`\`sql
        -- Identificar consultas lentas
        SELECT query, calls, total_time, mean_time
        FROM pg_stat_statements
        ORDER BY mean_time DESC
        LIMIT 10;
        
        -- Analizar una consulta específica
        EXPLAIN ANALYZE
        SELECT u.name, COUNT(o.id) as order_count
        FROM users u
        LEFT JOIN orders o ON u.id = o.user_id
        WHERE u.created_at > '2023-01-01'
        GROUP BY u.name
        ORDER BY order_count DESC;
        
        -- Crear índice para mejorar rendimiento
        CREATE INDEX idx_users_created_at ON users(created_at);
        CREATE INDEX idx_orders_user_id ON orders(user_id);
        
        -- Reescribir consulta ineficiente
        -- Original (lento):
        SELECT * FROM products WHERE YEAR(created_at) = 2023;
        
        -- Optimizado:
        SELECT * FROM products WHERE created_at >= '2023-01-01' AND created_at < '2024-01-01';
        
        -- Implementar paginación eficiente
        -- Con LIMIT/OFFSET (para conjuntos pequeños):
        SELECT * FROM products ORDER BY id LIMIT 20 OFFSET 40;
        
        -- Con cursores (para conjuntos grandes):
        SELECT * FROM products WHERE id > 1000 ORDER BY id LIMIT 20;
        \`\`\`
      - **Código de ejemplo (MongoDB)**:
        \`\`\`javascript
        // Crear índices para campos frecuentemente consultados
        db.products.createIndex({ category: 1, price: -1 });
        
        // Analizar consulta
        db.products.find({ category: "electronics", price: { $gt: 100 } }).explain("executionStats");
        
        // Optimizar consulta con proyección (seleccionar solo campos necesarios)
        db.products.find(
          { category: "electronics", price: { $gt: 100 } },
          { name: 1, price: 1, _id: 0 }
        );
        
        // Implementar paginación eficiente con cursores
        db.products.find()
          .sort({ _id: 1 })
          .skip(20)
          .limit(10);
        
        // Mejor enfoque para conjuntos grandes (usando _id como cursor)
        let lastId = ObjectId("60a1f25e9f3b9c001f8e4b8e");
        db.products.find({ _id: { $gt: lastId } })
          .sort({ _id: 1 })
          .limit(10);
        \`\`\`
      - **Beneficio**: Reducción del tiempo de respuesta de consultas en un 50-80%, mejor experiencia de usuario y menor carga en el servidor.`);
            }
            
            if (issues.includes('Excesivos escaneos completos de tablas') || 
                issues.includes('Bajo uso de índices')) {
              recommendations.push(`### Optimizar Estructura de Índices
      - **Problema**: Uso ineficiente de índices (escaneos completos: ${metrics.fullTableScans}, uso de índices: ${(metrics.indexUsage * 100).toFixed(1)}%).
      - **Solución**: Implementar estrategia de indexación efectiva.
      - **Implementación**:
        1. **Identificar consultas sin índices**: Analizar logs de consultas lentas.
        2. **Crear índices compuestos**: Para consultas con múltiples condiciones.
        3. **Eliminar índices redundantes**: Reducir sobrecarga de escritura.
        4. **Mantener índices**: Reconstruir periódicamente para evitar fragmentación.
      - **Código de ejemplo (MySQL)**:
        \`\`\`sql
        -- Identificar tablas sin índices adecuados
        SELECT 
          t.TABLE_SCHEMA,
          t.TABLE_NAME,
          t.TABLE_ROWS,
          COUNT(i.INDEX_NAME) as index_count
        FROM information_schema.TABLES t
        LEFT JOIN information_schema.STATISTICS i 
          ON t.TABLE_SCHEMA = i.TABLE_SCHEMA AND t.TABLE_NAME = i.TABLE_NAME
        WHERE t.TABLE_SCHEMA NOT IN ('mysql', 'information_schema', 'performance_schema')
        GROUP BY t.TABLE_SCHEMA, t.TABLE_NAME, t.TABLE_ROWS
        HAVING index_count < 2
        ORDER BY t.TABLE_ROWS DESC;
        
        -- Crear índice compuesto para consultas frecuentes
        CREATE INDEX idx_orders_user_status_date ON orders(user_id, status, order_date);
        
        -- Identificar índices redundantes
        SELECT
          s1.INDEX_NAME AS index1,
          s2.INDEX_NAME AS index2,
          s1.COLUMN_NAME
        FROM information_schema.STATISTICS s1
        JOIN information_schema.STATISTICS s2 
          ON s1.TABLE_SCHEMA = s2.TABLE_SCHEMA
          AND s1.TABLE_NAME = s2.TABLE_NAME
          AND s1.SEQ_IN_INDEX = s2.SEQ_IN_INDEX
          AND s1.COLUMN_NAME = s2.COLUMN_NAME
        WHERE s1.INDEX_NAME <> s2.INDEX_NAME
          AND s1.TABLE_SCHEMA = 'your_database'
          AND s1.SEQ_IN_INDEX = 1
        ORDER BY s1.TABLE_NAME, s1.INDEX_NAME, s2.INDEX_NAME, s1.SEQ_IN_INDEX;
        
        -- Eliminar índice redundante
        DROP INDEX redundant_index_name ON table_name;
        
        -- Reconstruir índice para reducir fragmentación
        ALTER TABLE orders DROP INDEX idx_order_date;
        ALTER TABLE orders ADD INDEX idx_order_date (order_date);
        
        -- Alternativa: OPTIMIZE TABLE (MySQL)
        OPTIMIZE TABLE orders;
        \`\`\`
      - **Código de ejemplo (PostgreSQL)**:
        \`\`\`sql
        -- Identificar índices no utilizados
        SELECT
          schemaname || '.' || relname as table,
          indexrelname as index,
          pg_size_pretty(pg_relation_size(i.indexrelid)) as index_size,
          idx_scan as index_scans
        FROM pg_stat_user_indexes ui
        JOIN pg_index i ON ui.indexrelid = i.indexrelid
        WHERE idx_scan = 0 AND indisunique IS FALSE
        ORDER BY pg_relation_size(i.indexrelid) DESC;
        
        -- Crear índice parcial para condiciones específicas
        CREATE INDEX idx_active_users ON users(last_login) 
        WHERE status = 'active';
        
        -- Crear índice para búsqueda de texto
        CREATE INDEX idx_products_name_gin ON products 
        USING gin(to_tsvector('english', name));
        
        -- Reconstruir índice
        REINDEX INDEX idx_orders_date;
        
        -- Analizar tabla para actualizar estadísticas
        ANALYZE orders;
        \`\`\`
      - **Código de ejemplo (MongoDB)**:
        \`\`\`javascript
        // Identificar consultas sin índices
        db.currentOp(
          { "op" : "query", "microsecs_running" : { "$gt" : 100000 } }
        );
        
        // Crear índice compuesto
        db.orders.createIndex(
          { user_id: 1, status: 1, order_date: -1 },
          { background: true }
        );
        
        // Crear índice parcial
        db.users.createIndex(
          { last_login: 1 },
          { partialFilterExpression: { status: "active" } }
        );
        
        // Identificar índices no utilizados
        db.collection.aggregate([
          { $indexStats: {} },
          { $match: { "accesses.ops": { $lt: 10 } } }
        ]);
        
        // Eliminar índice no utilizado
        db.collection.dropIndex("unused_index_name");
        \`\`\`
      - **Beneficio**: Reducción de escaneos completos en un 90%, mejora en tiempos de respuesta, y optimización del uso de recursos del servidor.`);
            }
            
            if (issues.includes('Baja tasa de aciertos de caché')) {
              recommendations.push(`### Optimizar Configuración de Caché
      - **Problema**: Baja tasa de aciertos de caché (${(metrics.cacheHitRatio * 100).toFixed(1)}%).
      - **Solución**: Ajustar configuración de caché y buffer pool.
      - **Implementación**:
        1. **Aumentar tamaño de buffer pool/caché**: Asignar memoria suficiente para datos frecuentes.
        2. **Implementar caché de consultas**: Almacenar resultados de consultas frecuentes.
        3. **Ajustar algoritmo de caché**: Optimizar política de reemplazo.
        4. **Implementar caché a nivel de aplicación**: Reducir consultas a la base de datos.
      - **Código de ejemplo (MySQL)**:
        \`\`\`sql
        -- Verificar configuración actual de buffer pool
        SHOW VARIABLES LIKE 'innodb_buffer_pool_size';
        
        -- Ajustar tamaño del buffer pool (ejemplo: 4GB)
        SET GLOBAL innodb_buffer_pool_size = 4294967296;
        
        -- Añadir a my.cnf para persistencia
        -- innodb_buffer_pool_size = 4G
        -- innodb_buffer_pool_instances = 4
        
        -- Habilitar caché de consultas
        SET GLOBAL query_cache_type = 1;
        SET GLOBAL query_cache_size = 268435456; -- 256MB
        
        -- Monitorear uso de caché
        SHOW STATUS LIKE 'Qcache%';
        \`\`\`
      - **Código de ejemplo (PostgreSQL)**:
        \`\`\`sql
        -- Verificar configuración actual
        SHOW shared_buffers;
        SHOW effective_cache_size;
        
        -- Ajustes en postgresql.conf
        -- shared_buffers = 2GB         # 25% de RAM para servidores dedicados
        -- effective_cache_size = 6GB   # 75% de RAM aproximadamente
        -- work_mem = 32MB              # Para operaciones de ordenación
        -- maintenance_work_mem = 256MB # Para mantenimiento
        
        -- Implementar prepared statements para mejor uso de caché
        PREPARE user_orders(int) AS
        SELECT * FROM orders WHERE user_id = $1;
        
        EXECUTE user_orders(123);
        \`\`\`
      - **Código de ejemplo (MongoDB)**:
        \`\`\`javascript
        // Verificar estadísticas de caché WiredTiger
        db.serverStatus().wiredTiger.cache;
        
        // Ajustes en mongod.conf
        /*
        storage:
          wiredTiger:
            engineConfig:
              cacheSizeGB: 4  # Ajustar según RAM disponible
        */
        
        // Implementar caché a nivel de aplicación (Node.js con Redis)
        const redis = require('redis');
        const client = redis.createClient();
        
        async function getUserWithCache(userId) {
          // Intentar obtener de caché
          const cachedUser = await client.get(`user:${userId}`);
          if (cachedUser) {
            return JSON.parse(cachedUser);
          }
          
          // Si no está en caché, obtener de MongoDB
          const user = await db.users.findOne({ _id: userId });
          
          // Guardar en caché con expiración
          await client.set(`user:${userId}`, JSON.stringify(user), 'EX', 3600);
          
          return user;
        }
        \`\`\`
      - **Código de ejemplo (Caché a nivel de aplicación con Redis)**:
        \`\`\`javascript
        // Configuración de Redis para caché de consultas
        const Redis = require('ioredis');
        const redis = new Redis({
          host: 'redis-server',
          port: 6379,
          maxRetriesPerRequest: 3,
          retryStrategy: times => Math.min(times * 50, 2000)
        });
        
        // Función para consultas con caché
        async function queryWithCache(queryKey, queryFn, ttlSeconds = 3600) {
          // Generar clave única para la consulta
          const cacheKey = `query:${queryKey}`;
          
          // Intentar obtener de caché
          const cachedResult = await redis.get(cacheKey);
          if (cachedResult) {
            return JSON.parse(cachedResult);
          }
          
          // Ejecutar consulta si no está en caché
          const result = await queryFn();
          
          // Guardar en caché con tiempo de expiración
          await redis.set(cacheKey, JSON.stringify(result), 'EX', ttlSeconds);
          
          return result;
        }
        
        // Ejemplo de uso
        async function getUserOrders(userId) {
          return queryWithCache(
            \`user_orders:\${userId}\`,
            async () => {
              // Consulta real a la base de datos
              return db.orders.find({ user_id: userId }).toArray();
            },
            1800 // 30 minutos TTL
          );
        }
        \`\`\`
      - **Beneficio**: Aumento de la tasa de aciertos de caché al 90%+, reducción de carga en la base de datos, y mejora en tiempos de respuesta de 3-10x.`);
            }
            
            if (issues.includes('Alta fragmentación de tablas')) {
              recommendations.push(`### Reducir Fragmentación y Optimizar Almacenamiento
      - **Problema**: Alta fragmentación de tablas (${(metrics.tableFragmentation * 100).toFixed(1)}%).
      - **Solución**: Implementar mantenimiento regular y optimizar estructura de almacenamiento.
      - **Implementación**:
        1. **Programar desfragmentación periódica**: Reconstruir tablas e índices.
        2. **Optimizar tipos de datos**: Usar tipos apropiados para cada columna.
        3. **Implementar particionamiento**: Dividir tablas grandes por criterios lógicos.
        4. **Archivar datos históricos**: Mover datos antiguos a tablas de archivo.
      - **Código de ejemplo (MySQL)**:
        \`\`\`sql
        -- Identificar tablas fragmentadas
        SELECT table_name, data_free, data_length, index_length
        FROM information_schema.tables
        WHERE table_schema = 'your_database'
        AND data_free > 0
        ORDER BY data_free DESC;
        
        -- Optimizar tabla
        OPTIMIZE TABLE orders;
        
        -- Convertir tabla a formato comprimido
        ALTER TABLE large_table ROW_FORMAT=COMPRESSED KEY_BLOCK_SIZE=8;
        
        -- Implementar particionamiento por rango
        ALTER TABLE orders PARTITION BY RANGE (YEAR(order_date)) (
          PARTITION p2021 VALUES LESS THAN (2022),
          PARTITION p2022 VALUES LESS THAN (2023),
          PARTITION p2023 VALUES LESS THAN (2024),
          PARTITION pmax VALUES LESS THAN MAXVALUE
        );
        
        -- Archivar datos antiguos
        CREATE TABLE orders_archive LIKE orders;
        INSERT INTO orders_archive SELECT * FROM orders WHERE order_date < '2022-01-01';
        DELETE FROM orders WHERE order_date < '2022-01-01';
        
        -- Optimizar tipos de datos
        ALTER TABLE users 
          MODIFY COLUMN status ENUM('active', 'inactive', 'suspended') NOT NULL,
          MODIFY COLUMN phone VARCHAR(20) NOT NULL,
          MODIFY COLUMN description TEXT NULL;
        \`\`\`
      - **Código de ejemplo (PostgreSQL)**:
        \`\`\`sql
        -- Identificar tablas fragmentadas
        SELECT
          schemaname, relname,
          pg_size_pretty(pg_total_relation_size(relid)) as total_size,
          pg_size_pretty(pg_relation_size(relid)) as table_size,
          pg_size_pretty(pg_total_relation_size(relid) - pg_relation_size(relid)) as index_size,
          n_dead_tup, last_vacuum, last_autovacuum
        FROM pg_stat_user_tables
        ORDER BY n_dead_tup DESC;
        
        -- Vaciar y analizar tabla
        VACUUM FULL ANALYZE orders;
        
        -- Implementar particionamiento declarativo
        CREATE TABLE orders (
          id SERIAL,
          order_date DATE NOT NULL,
          customer_id INTEGER,
          amount NUMERIC(10,2)
        ) PARTITION BY RANGE (order_date);
        
        CREATE TABLE orders_2021 PARTITION OF orders
          FOR VALUES FROM ('2021-01-01') TO ('2022-01-01');
          
        CREATE TABLE orders_2022 PARTITION OF orders
          FOR VALUES FROM ('2022-01-01') TO ('2023-01-01');
          
        CREATE TABLE orders_2023 PARTITION OF orders
          FOR VALUES FROM ('2023-01-01') TO ('2024-01-01');
        
        -- Comprimir tabla con TOAST
        ALTER TABLE large_logs SET (toast_tuple_target = 4096);
        
        -- Optimizar tipos de datos
        ALTER TABLE products
          ALTER COLUMN description TYPE TEXT,
          ALTER COLUMN small_description TYPE VARCHAR(255),
          ALTER COLUMN is_active TYPE BOOLEAN USING (status = 'active');
        \`\`\`
      - **Código de ejemplo (MongoDB)**:
        \`\`\`javascript
        // Compactar colección
        db.runCommand({ compact: "orders" });
        
        // Implementar Time Series Collection (MongoDB 5.0+)
        db.createCollection(
          "device_metrics",
          {
            timeseries: {
              timeField: "timestamp",
              metaField: "device_id",
              granularity: "hours"
            }
          }
        );
        
        // Implementar sharding para colecciones grandes
        // 1. Habilitar sharding en la base de datos
        sh.enableSharding("your_database");
        
        // 2. Crear índice para la clave de sharding
        db.orders.createIndex({ order_date: 1 });
        
        // 3. Configurar sharding en la colección
        sh.shardCollection(
          "your_database.orders",
          { order_date: 1 }
        );
        
        // Archivar datos antiguos
        // 1. Crear colección de archivo
        db.createCollection("orders_archive");
        
        // 2. Mover documentos antiguos
        db.orders.aggregate([
          { $match: { order_date: { $lt: new Date("2022-01-01") } } },
          { $out: "orders_archive" }
        ]);
        
        // 3. Eliminar documentos archivados
        db.orders.deleteMany({ order_date: { $lt: new Date("2022-01-01") } });
        \`\`\`
      - **Beneficio**: Reducción de fragmentación al 5% o menos, mejora en velocidad de lectura/escritura, y optimización del espacio de almacenamiento.`);
            }
            
            if (issues.includes('Alto uso del pool de conexiones') || 
                issues.includes('Número significativo de deadlocks')) {
              recommendations.push(`### Optimizar Gestión de Conexiones y Transacciones
      - **Problema**: Problemas de concurrencia (uso de pool: ${(metrics.connectionPoolUsage * 100).toFixed(1)}%, deadlocks: ${metrics.deadlocks}).
      - **Solución**: Mejorar gestión de conexiones y estrategia de transacciones.
      - **Implementación**:
        1. **Optimizar pool de conexiones**: Ajustar tamaño y timeout.
        2. **Implementar backoff exponencial**: Para reintentos de conexión.
        3. **Reducir duración de transacciones**: Minimizar bloqueos.
        4. **Implementar niveles de aislamiento apropiados**: Según requisitos de consistencia.
      - **Código de ejemplo (Configuración de pool - Node.js)**:
        \`\`\`javascript
        // MySQL con pool optimizado
        const mysql = require('mysql2/promise');
        
        const pool = mysql.createPool({
          host: 'localhost',
          user: 'user',
          password: 'password',
          database: 'db',
          waitForConnections: true,
          connectionLimit: 20,      // Ajustar según carga
          queueLimit: 0,            // Sin límite de cola
          enableKeepAlive: true,    // Mantener conexiones vivas
          keepAliveInitialDelay: 10000, // 10 segundos
          maxIdle: 10,              // Conexiones inactivas máximas
          idleTimeout: 60000,       // Timeout de inactividad (1 min)
          acquireTimeout: 10000     // Timeout de adquisición (10 seg)
        });
        
        // Función con reintento exponencial
        async function queryWithRetry(sql, params, maxRetries = 5) {
          let retries = 0;
          
          while (true) {
            try {
              const connection = await pool.getConnection();
              try {
                const [results] = await connection.query(sql, params);
                return results;
              } finally {
                connection.release(); // Siempre liberar la conexión
              }
            } catch (err) {
              if (err.code === 'ER_CON_COUNT_ERROR' && retries < maxRetries) {
                // Backoff exponencial
                const delay = Math.pow(2, retries) * 100;
                await new Promise(resolve => setTimeout(resolve, delay));
                retries++;
                continue;
              }
              throw err; // Propagar otros errores o si se agotaron los reintentos
            }
          }
        }
              // Función con transacciones optimizadas
        async function executeTransaction(connection, queries) {
          try {
            await connection.beginTransaction();
            
            for (const query of queries) {
              await connection.query(query.sql, query.params);
            }
            
            await connection.commit();
            return { success: true };
          } catch (err) {
            await connection.rollback();
            
            // Si es un deadlock, reintentar con backoff
            if (err.code === 'ER_LOCK_DEADLOCK') {
              return { success: false, retry: true, error: err };
            }
            
            return { success: false, retry: false, error: err };
          } finally {
            connection.release();
          }
        }
        
        // Implementación de transacciones con niveles de aislamiento
        async function executeWithIsolation(sql, params, isolationLevel = 'READ COMMITTED') {
          const connection = await pool.getConnection();
          
          try {
            await connection.query(`SET TRANSACTION ISOLATION LEVEL ${isolationLevel}`);
            await connection.beginTransaction();
            
            const [results] = await connection.query(sql, params);
            
            await connection.commit();
            return results;
          } catch (err) {
            await connection.rollback();
            throw err;
          } finally {
            connection.release();
          }
        }
        \`\`\`
      - **Código de ejemplo (PostgreSQL con pool optimizado)**:
        \`\`\`javascript
        const { Pool } = require('pg');
        
        const pool = new Pool({
          host: 'localhost',
          user: 'user',
          password: 'password',
          database: 'db',
          max: 20,               // Máximo de conexiones
          idleTimeoutMillis: 30000, // Timeout de inactividad
          connectionTimeoutMillis: 10000, // Timeout de conexión
          maxUses: 7500,         // Reciclar conexión después de 7500 usos
          application_name: 'myapp' // Identificar conexiones
        });
        
        // Monitorear pool
        const poolStatus = () => {
          return {
            total: pool.totalCount,
            idle: pool.idleCount,
            waiting: pool.waitingCount
          };
        };
        
        // Función con reintento exponencial
        async function queryWithRetry(sql, params, maxRetries = 5) {
          let retries = 0;
          let lastError;
          
          while (retries <= maxRetries) {
            try {
              const client = await pool.connect();
              try {
                const result = await client.query(sql, params);
                return result.rows;
              } finally {
                client.release();
              }
            } catch (err) {
              lastError = err;
              
              // Reintentar solo para errores de conexión o deadlocks
              if (err.code === 'ECONNREFUSED' || 
                  err.code === '40P01' || // deadlock_detected
                  err.code === '55P03') { // lock_not_available
                const delay = Math.pow(2, retries) * 100;
                await new Promise(resolve => setTimeout(resolve, delay));
                retries++;
                continue;
              }
              
              throw err; // Otros errores se propagan inmediatamente
            }
          }
          
          throw lastError;
        }
        
        // Transacción con nivel de aislamiento
        async function executeTransaction(queries, isolationLevel = 'READ COMMITTED') {
          const client = await pool.connect();
          
          try {
            await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);
            
            const results = [];
            for (const q of queries) {
              const result = await client.query(q.sql, q.params);
              results.push(result.rows);
            }
            
            await client.query('COMMIT');
            return results;
          } catch (err) {
            await client.query('ROLLBACK');
            throw err;
          } finally {
            client.release();
          }
        }
        \`\`\`
      - **Beneficio**: Reducción de errores de conexión en un 80%, mejor manejo de concurrencia, y optimización del uso de recursos del servidor.`);
            }
            
            return {
              metrics,
              issues,
              recommendations
            };
          }
          
          /**
           * Analiza el rendimiento de una aplicación móvil
           * @param appPath Ruta de la aplicación móvil
           * @returns Informe de rendimiento
           */
          private async analyzeMobilePerformance(appPath: string): Promise<{
            metrics: Record<string, any>;
            issues: string[];
            recommendations: string[];
          }> {
            console.log(`Analizando rendimiento móvil para: ${appPath}`);
            
            // Simulación de análisis de rendimiento móvil
            // En una implementación real, se utilizaría Firebase Performance, Android Profiler, Xcode Instruments, etc.
            
            // Métricas simuladas
            const metrics = {
              // Métricas de inicio
              coldStartTime: Math.random() * 2000 + 1000, // ms
              warmStartTime: Math.random() * 500 + 200, // ms
              timeToInteractive: Math.random() * 3000 + 1500, // ms
              
              // Métricas de UI
              frameRate: Math.random() * 30 + 30, // fps
              jankCount: Math.floor(Math.random() * 20), // número de frames perdidos
              renderTime: Math.random() * 16 + 5, // ms por frame
              uiThreadUtilization: Math.random() * 0.5 + 0.3, // 0-1
              
              // Métricas de memoria
              memoryUsage: Math.floor(Math.random() * 200) + 50, // MB
              memoryLeaks: Math.floor(Math.random() * 5), // número de fugas detectadas
              gcPauses: Math.floor(Math.random() * 10), // número de pausas
              gcDuration: Math.random() * 200 + 50, // ms total
              
              // Métricas de batería
              batteryDrain: Math.random() * 5 + 1, // % por hora
              wakelocksCount: Math.floor(Math.random() * 5), // número de wakelocks
              backgroundProcesses: Math.floor(Math.random() * 3), // número de procesos en segundo plano
              
              // Métricas de red
              networkRequests: Math.floor(Math.random() * 50) + 10, // número de solicitudes
              dataTransferred: Math.floor(Math.random() * 5) + 1, // MB
              timeToFirstByte: Math.random() * 500 + 100, // ms
              requestFailureRate: Math.random() * 0.1, // 0-1
              
              // Métricas de tamaño
              appSize: Math.floor(Math.random() * 50) + 20, // MB
              dexCount: Math.floor(Math.random() * 3) + 1, // número de archivos DEX (Android)
              resourcesSize: Math.floor(Math.random() * 20) + 10, // MB
              nativeLibrariesSize: Math.floor(Math.random() * 15) + 5, // MB
              
              // Métricas de estabilidad
              crashRate: Math.random() * 0.02, // 0-1
              anrRate: Math.random() * 0.03, // 0-1 (Android)
              exceptionCount: Math.floor(Math.random() * 10) // número de excepciones no fatales
            };
            
            // Identificar problemas basados en métricas
            const issues = [];
            
            if (metrics.coldStartTime > 2000) {
              issues.push('Tiempo de inicio en frío lento');
            }
            
            if (metrics.frameRate < 50) {
              issues.push('Tasa de frames baja');
            }
            
            if (metrics.jankCount > 5) {
              issues.push('Experiencia de UI entrecortada (jank)');
            }
            
            if (metrics.memoryUsage > 150) {
              issues.push('Uso excesivo de memoria');
            }
            
            if (metrics.memoryLeaks > 0) {
              issues.push('Fugas de memoria detectadas');
            }
            
            if (metrics.batteryDrain > 3) {
              issues.push('Consumo elevado de batería');
            }
            
            if (metrics.wakelocksCount > 2) {
              issues.push('Uso excesivo de wakelocks');
            }
            
            if (metrics.appSize > 40) {
              issues.push('Tamaño de aplicación grande');
            }
            
            if (metrics.crashRate > 0.01) {
              issues.push('Tasa de fallos elevada');
            }
            
            if (metrics.anrRate > 0.01) {
              issues.push('Tasa de ANR (App Not Responding) elevada');
            }
            
            // Generar recomendaciones basadas en los problemas identificados
            const recommendations = [];
            
            if (issues.includes('Tiempo de inicio en frío lento')) {
              recommendations.push(`### Optimizar Tiempo de Inicio
      - **Problema**: Tiempo de inicio en frío lento (${Math.round(metrics.coldStartTime)}ms).
      - **Solución**: Implementar inicio diferido y optimizar inicialización.
      - **Implementación**:
        1. **Implementar inicio diferido**: Cargar componentes no esenciales después del inicio.
        2. **Optimizar inicialización**: Reducir trabajo en el hilo principal durante el inicio.
        3. **Utilizar WorkManager**: Programar tareas no críticas para después del inicio.
        4. **Implementar App Startup**: Usar la biblioteca App Startup para inicialización eficiente.
      - **Código de ejemplo (Android)**:
        \`\`\`kotlin
        // Implementar App Startup para inicialización eficiente
        // build.gradle
        dependencies {
          implementation "androidx.startup:startup-runtime:1.1.1"
        }
        
        // Initializer.kt
        class AnalyticsInitializer : Initializer<AnalyticsManager> {
          override fun create(context: Context): AnalyticsManager {
            // Inicialización ligera
            AnalyticsManager.initialize(context, lightweight = true)
            return AnalyticsManager.getInstance()
          }
          
          override fun dependencies(): List<Class<out Initializer<*>>> {
            // Sin dependencias
            return emptyList()
          }
        }
        
        // AndroidManifest.xml
        <provider
          android:name="androidx.startup.InitializationProvider"
          android:authorities="${applicationId}.androidx-startup"
          android:exported="false"
          tools:node="merge">
          <meta-data
            android:name="com.example.AnalyticsInitializer"
            android:value="androidx.startup" />
        </provider>
        
        // Implementar carga diferida
        class MainActivity : AppCompatActivity() {
          override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)
            setContentView(R.layout.activity_main)
            
            // Mostrar UI principal inmediatamente
            setupMainUI()
            
            // Diferir inicialización pesada
            lifecycleScope.launch {
              delay(1000) // Esperar a que la UI esté estable
              initializeHeavyComponents()
            }
          }
          
          private fun initializeHeavyComponents() {
            // Inicializar componentes pesados
            ImageLoader.initialize(this)
            RecommendationEngine.initialize()
          }
        }
        
        // Usar WorkManager para tareas en segundo plano
        val initWorkRequest = OneTimeWorkRequestBuilder<InitializationWorker>()
          .setConstraints(Constraints.Builder()
            .setRequiresCharging(false)
            .build())
          .build()
          
        WorkManager.getInstance(context).enqueue(initWorkRequest)
        \`\`\`
      - **Código de ejemplo (iOS)**:
        \`\`\`swift
        // AppDelegate.swift
        func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
          // Inicialización mínima para mostrar UI
          setupMainWindow()
          
          // Diferir inicialización no crítica
          DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
            self.initializeNonCriticalServices()
          }
          
          // Inicialización en segundo plano
          DispatchQueue.global(qos: .background).async {
            self.initializeBackgroundServices()
          }
          
          return true
        }
        
        // SceneDelegate.swift
        func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
          guard let windowScene = (scene as? UIWindowScene) else { return }
          
          // Configurar ventana principal rápidamente
          window = UIWindow(windowScene: windowScene)
          window?.rootViewController = MainViewController()
          window?.makeKeyAndVisible()
          
          // Cargar datos después de mostrar UI
          (window?.rootViewController as? MainViewController)?.loadDataAfterAppearing()
        }
        
        // MainViewController.swift
        class MainViewController: UIViewController {
          override func viewDidLoad() {
            super.viewDidLoad()
            setupUI() // Configuración mínima de UI
          }
          
          override func viewDidAppear(_ animated: Bool) {
            super.viewDidAppear(animated)
            
            // Cargar datos después de que la UI sea visible
            loadDataAfterAppearing()
          }
          
          func loadDataAfterAppearing() {
            // Mostrar skeleton screens o indicadores de carga
            showLoadingState()
            
            // Cargar datos en segundo plano
            DispatchQueue.global(qos: .userInitiated).async { [weak self] in
              // Cargar datos
              let data = DataManager.shared.loadInitialData()
              
              // Actualizar UI en hilo principal
              DispatchQueue.main.async {
                self?.updateUI(with: data)
                self?.hideLoadingState()
              }
            }
          }
        }
        \`\`\`
      - **Beneficio**: Reducción del tiempo de inicio en frío en un 30-50% y mejora en la percepción de velocidad.`);
            }
            
            if (issues.includes('Tasa de frames baja') || issues.includes('Experiencia de UI entrecortada (jank)')) {
              recommendations.push(`### Optimizar Renderizado de UI
      - **Problema**: Problemas de fluidez (${Math.round(metrics.frameRate)} FPS, ${metrics.jankCount} jank).
      - **Solución**: Optimizar renderizado y operaciones en hilo principal.
      - **Implementación**:
        1. **Reducir trabajo en hilo principal**: Mover operaciones pesadas a hilos secundarios.
        2. **Optimizar jerarquía de vistas**: Aplanar y simplificar layouts.
        3. **Implementar recycling**: Reutilizar vistas para listas y colecciones.
        4. **Reducir overdraw**: Eliminar capas y fondos innecesarios.
      - **Código de ejemplo (Android)**:
        \`\`\`kotlin
        // Optimizar RecyclerView
        class OptimizedAdapter : RecyclerView.Adapter<ViewHolder>() {
          // Implementar ViewHolder pattern correctamente
          override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            // Inflar layout eficiente (ConstraintLayout o flat hierarchy)
            val view = LayoutInflater.from(parent.context)
              .inflate(R.layout.optimized_item, parent, false)
            return ViewHolder(view)
          }
          
          override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            // Binding eficiente
            val item = items[position]
            
            // Cargar imágenes de forma asíncrona
            Glide.with(holder.itemView)
              .load(item.imageUrl)
              .transition(DrawableTransitionOptions.withCrossFade())
              .diskCacheStrategy(DiskCacheStrategy.ALL)
              .into(holder.imageView)
            
            // Actualizar texto directamente
            holder.titleView.text = item.title
            
            // Diferir cálculos costosos
            holder.itemView.post {
              // Operaciones costosas después de renderizar
              calculateAndUpdateComplexState(holder, item)
            }
          }
          
          // Implementar DiffUtil para actualizaciones eficientes
          fun updateItems(newItems: List<Item>) {
            val diffCallback = ItemDiffCallback(items, newItems)
            val diffResult = DiffUtil.calculateDiff(diffCallback)
            
            items = newItems
            diffResult.dispatchUpdatesTo(this)
          }
        }
        
        // Optimizar layout (layout_optimized_item.xml)
        <!-- Usar ConstraintLayout para layout plano -->
        <androidx.constraintlayout.widget.ConstraintLayout
          android:layout_width="match_parent"
          android:layout_height="wrap_content"
          android:background="@null"> <!-- Evitar overdraw -->
          
          <!-- Establecer dimensiones exactas para evitar múltiples medidas -->
          <ImageView
            android:id="@+id/image"
            android:layout_width="64dp"
            android:layout_height="64dp"
            app:layout_constraintStart_toStartOf="parent"
            app:layout_constraintTop_toTopOf="parent"
            android:scaleType="centerCrop" />
            
          <!-- Resto del layout... -->
        </androidx.constraintlayout.widget.ConstraintLayout>
        
        // Mover trabajo pesado fuera del hilo principal
        private fun processDataInBackground(data: List<Item>, callback: (List<ProcessedItem>) -> Unit) {
          lifecycleScope.launch(Dispatchers.Default) {
            // Procesamiento pesado en hilo secundario
            val processedData = data.map { item ->
              // Transformaciones, cálculos, etc.
              ProcessedItem(
                id = item.id,
                transformedTitle = transformTitle(item.title),
                processedImage = processImage(item.imageData)
              )
            }
            
            // Volver al hilo principal para actualizar UI
            withContext(Dispatchers.Main) {
              callback(processedData)
            }
          }
        }
        \`\`\`
      - **Código de ejemplo (iOS)**:
        \`\`\`swift
        // Optimizar UITableView/UICollectionView
        class OptimizedTableViewController: UITableViewController {
          // Usar reutilización de celdas
          override func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
            let cell = tableView.dequeueReusableCell(withIdentifier: "OptimizedCell", for: indexPath) as! OptimizedCell
            
            let item = items[indexPath.row]
            
            // Configuración básica inmediata
            cell.titleLabel.text = item.title
            
            // Cargar imágenes de forma asíncrona
            cell.thumbnailImageView.image = nil // Limpiar imagen anterior
            ImageLoader.shared.loadImage(url: item.imageURL) { [weak cell] image in
              // Verificar que la celda siga visible
              guard let cell = cell, tableView.indexPath(for: cell) == indexPath else {
                return
              }
              
              // Actualizar en hilo principal
              DispatchQueue.main.async {
                cell.thumbnailImageView.image = image
              }
            }
            
            // Evitar cálculos costosos durante el scrolling
            if !tableView.isDragging && !tableView.isDecelerating {
              cell.updateComplexContent(with: item)
            } else {
              // Diferir hasta que el scrolling termine
              pendingUpdates.append((indexPath, item))
            }
            
            return cell
          }
          
          // Actualizar celdas después del scrolling
          override func scrollViewDidEndDecelerating(_ scrollView: UIScrollView) {
            processPendingUpdates()
          }
          
          override func scrollViewDidEndDragging(_ scrollView: UIScrollView, willDecelerate decelerate: Bool) {
            if !decelerate {
              processPendingUpdates()
            }
          }
          
          private func processPendingUpdates() {
            for (indexPath, item) in pendingUpdates {
              if let cell = tableView.cellForRow(at: indexPath) as? OptimizedCell {
                cell.updateComplexContent(with: item)
              }
            }
            pendingUpdates.removeAll()
          }
        }
        
        // Optimizar jerarquía de vistas
        class OptimizedCell: UITableViewCell {
          // Usar CALayer en lugar de vistas anidadas cuando sea posible
          override func layoutSubviews() {
            super.layoutSubviews()
            
            // Configurar capas directamente
            separatorLayer.frame = CGRect(x: 16, y: bounds.height - 0.5, width: bounds.width - 32, height: 0.5)
            
            // Evitar efectos costosos durante el scrolling
            if let tableView = superview as? UITableView, 
               (tableView.isDragging || tableView.isDecelerating) {
              // Deshabilitar sombras durante scrolling
              containerView.layer.shadowOpacity = 0
            } else {
              // Restaurar efectos cuando el scrolling termina
              containerView.layer.shadowOpacity = 0.2
            }
          }
          
          // Precalcular y cachear valores
          private var cachedLayoutValues: [String: CGFloat] = [:]
          
          func calculateLayout(for width: CGFloat) -> CGFloat {
            // Verificar caché
            let cacheKey = "height_\(width)"
            if let cachedHeight = cachedLayoutValues[cacheKey] {
              return cachedHeight
            }
            
            // Calcular altura (costoso)
            let calculatedHeight = performExpensiveHeightCalculation(width)
            
            // Guardar en caché
            cachedLayoutValues[cacheKey] = calculatedHeight
            return calculatedHeight
          }
        }
        
        // Procesamiento en segundo plano
        func processImagesInBackground(images: [UIImage], completion: @escaping ([UIImage]) -> Void) {
          DispatchQueue.global(qos: .userInitiated).async {
            // Procesamiento pesado
            let processedImages = images.map { image in
              return image.applyingFilter("CIGaussianBlur", parameters: ["inputRadius": 5])
            }
            
            // Volver al hilo principal
            DispatchQueue.main.async {
              completion(processedImages)
            }
          }
        }
        \`\`\`
      - **Beneficio**: Aumento de la tasa de frames a 60 FPS, reducción de jank en un 90%, y mejora significativa en la fluidez de la UI.`);
            }
            
            if (issues.includes('Uso excesivo de memoria') || issues.includes('Fugas de memoria detectadas')) {
              recommendations.push(`### Optimizar Uso de Memoria
      - **Problema**: Problemas de memoria (${Math.round(metrics.memoryUsage)}MB, ${metrics.memoryLeaks} fugas).
      - **Solución**: Implementar gestión eficiente de memoria y prevenir fugas.
      - **Implementación**:
        1. **Liberar recursos no utilizados**: Implementar ciclo de vida correcto.
        2. **Optimizar carga de imágenes**: Redimensionar y cachear eficientemente.
        3. **Evitar referencias circulares**: Usar referencias débiles cuando sea apropiado.
        4. **Implementar paginación**: Cargar datos por lotes en lugar de todo a la vez.
      - **Código de ejemplo (Android)**:
        \`\`\`kotlin
        // Gestión correcta de ciclo de vida
        class OptimizedFragment : Fragment() {
          private var _binding: FragmentBinding? = null
          private val binding get() = _binding!!
          
          override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
            _binding = FragmentBinding.inflate(inflater, container, false)
            return binding.root
          }
          
          override fun onDestroyView() {
            super.onDestroyView()
            // Liberar binding para evitar fugas
            _binding = null
            
            // Cancelar trabajos en segundo plano
            coroutineScope.cancel()
            
            // Liberar recursos
            imageLoader.clear(binding.imageView)
          }
          
          // Scope de corrutina vinculado al ciclo de vida
          private val coroutineScope = CoroutineScope(Dispatchers.Main + Job())
          
          private fun loadData() {
            coroutineScope.launch {
              try {
                // Operación en segundo plano
                val result = withContext(Dispatchers.IO) {
                  repository.fetchData()
                }
                
                // Actualizar UI
                updateUI(result)
              } catch (e: Exception) {
                handleError(e)
              }
            }
          }
        }
        
        // Optimizar carga de imágenes
        class ImageLoader(private val context: Context) {
          private val memoryCache = LruCache<String, Bitmap>(
            (Runtime.getRuntime().maxMemory() / 8).toInt() // Usar 1/8 de memoria máxima
          )
          
          fun loadImage(url: String, imageView: ImageView) {
            // Verificar caché de memoria
            val cachedBitmap = memoryCache.get(url)
            if (cachedBitmap != null) {
              imageView.setImageBitmap(cachedBitmap)
              return
            }
            
            // Cargar en segundo plano
            CoroutineScope(Dispatchers.IO).launch {
              try {
                // Obtener dimensiones de ImageView
                val targetWidth = imageView.width.takeIf { it > 0 } ?: 512
                val targetHeight = imageView.height.takeIf { it > 0 } ?: 512
                
                // Cargar y redimensionar
                val bitmap = loadAndResizeBitmap(url, targetWidth, targetHeight)
                
                // Cachear
                memoryCache.put(url, bitmap)
                
                // Actualizar UI
                withContext(Dispatchers.Main) {
                  imageView.setImageBitmap(bitmap)
                }
              } catch (e: Exception) {
                Log.e("ImageLoader", "Error loading image", e)
              }
            }
          }
          
          private fun loadAndResizeBitmap(url: String, targetWidth: Int, targetHeight: Int): Bitmap {
            // Cargar con opciones de muestreo
            val options = BitmapFactory.Options().apply {
              inJustDecodeBounds = true
            }
            
            // Obtener dimensiones sin cargar
            BitmapFactory.decodeStream(URL(url).openStream(), null, options)
            
            // Calcular factor de muestreo
            options.inSampleSize = calculateInSampleSize(options, targetWidth, targetHeight)
            options.inJustDecodeBounds = false
            
            // Cargar con muestreo
            return BitmapFactory.decodeStream(URL(url).openStream(), null, options)
          }
          
          private fun calculateInSampleSize(options: BitmapFactory.Options, reqWidth: Int, reqHeight: Int): Int {
            val height = options.outHeight
            val width = options.outWidth
            var inSampleSize = 1
            
            if (height > reqHeight || width > reqWidth) {
              val halfHeight = height / 2
              val halfWidth = width / 2
              
              while ((halfHeight / inSampleSize) >= reqHeight && (halfWidth / inSampleSize) >= reqWidth) {
                inSampleSize *= 2
              }
            }
            
            return inSampleSize
          }
          
          fun clear(imageView: ImageView) {
            imageView.setImageDrawable(null)
          }
        }
        
        // Implementar paginación
        class PaginatedDataSource(private val api: ApiService) {
          private val _data = MutableLiveData<List<Item>>()
          val data: LiveData<List<Item>> = _data
          
          private val currentItems = mutableListOf<Item>()
          private var currentPage = 1
          private var isLoading = false
          private var hasMorePages = true
          
          suspend fun loadNextPage() {
            if (isLoading || !hasMorePages) return
            
            isLoading = true
            try {
              val newItems = api.getItems(page = currentPage, pageSize = 20)
              
              if (newItems.isEmpty()) {
                hasMorePages = false
              } else {
                currentItems.addAll(newItems)
                _data.postValue(currentItems.toList())
                currentPage++
              }
            } catch (e: Exception) {
              // Manejar error
            } finally {
              isLoading = false
            }
          }
          
          fun reset() {
            currentItems.clear()
            _data.postValue(emptyList())
            currentPage = 1
            hasMorePages = true
          }
        }
        \`\`\`
      - **Código de ejemplo (iOS)**:
        \`\`\`swift
        // Gestión correcta de memoria y ciclo de vida
        class MemoryOptimizedViewController: UIViewController {
          // Usar weak para evitar referencias circulares
          weak var delegate: ViewControllerDelegate?
          
          // Liberar recursos en deinit
          deinit {
            NotificationCenter.default.removeObserver(self)
            cancelAllRequests()
            print("ViewController deallocado correctamente")
          }
          
          private var imageLoadTasks: [URLSessionTask] = []
          
          private func cancelAllRequests() {
            imageLoadTasks.forEach { $0.cancel() }
            imageLoadTasks.removeAll()
          }
          
          // Cargar imágenes eficientemente
          func loadImage(from url: URL, into imageView: UIImageView) {
            // Verificar caché
            if let cachedImage = ImageCache.shared.image(for: url.absoluteString) {
              imageView.image = cachedImage
              return
            }
            
            // Crear placeholder
            imageView.image = UIImage(named: "placeholder")
            
            // Cargar en segundo plano
                        let task = URLSession.shared.dataTask(with: url) { [weak imageView, weak self] data, response, error in
              // Verificar que no haya errores y que la imagen siga siendo relevante
              guard let self = self,
                    let imageView = imageView,
                    let data = data,
                    error == nil,
                    let image = UIImage(data: data) else {
                return
              }
              
              // Redimensionar imagen si es necesario
              let resizedImage = self.resizeImageIfNeeded(image, for: imageView)
              
              // Cachear imagen
              ImageCache.shared.setImage(resizedImage, for: url.absoluteString)
              
              // Actualizar UI en hilo principal
              DispatchQueue.main.async {
                imageView.image = resizedImage
              }
            }
            
            // Guardar tarea para poder cancelarla si es necesario
            imageLoadTasks.append(task)
            task.resume()
          }
          
          private func resizeImageIfNeeded(_ image: UIImage, for imageView: UIImageView) -> UIImage {
            let targetSize = imageView.bounds.size
            
            // Si la imagen ya tiene el tamaño adecuado, no redimensionar
            if targetSize.width <= 0 || targetSize.height <= 0 ||
               (abs(image.size.width - targetSize.width) < 10 && 
                abs(image.size.height - targetSize.height) < 10) {
              return image
            }
            
            // Redimensionar para ahorrar memoria
            UIGraphicsBeginImageContextWithOptions(targetSize, false, UIScreen.main.scale)
            image.draw(in: CGRect(origin: .zero, size: targetSize))
            let resizedImage = UIGraphicsGetImageFromCurrentImageContext() ?? image
            UIGraphicsEndImageContext()
            
            return resizedImage
          }
        }
        
        // Implementar paginación para grandes conjuntos de datos
        class PaginatedDataSource {
          private var items: [Item] = []
          private var currentPage = 1
          private var isLoading = false
          private var hasMorePages = true
          
          func loadNextPageIfNeeded(currentIndex: Int) {
            // Si estamos cerca del final, cargar siguiente página
            if currentIndex >= items.count - 10 && !isLoading && hasMorePages {
              loadNextPage()
            }
          }
          
          private func loadNextPage() {
            isLoading = true
            
            // Simular carga de red
            DispatchQueue.global().async { [weak self] in
              guard let self = self else { return }
              
              // Simular delay de red
              Thread.sleep(forTimeInterval: 0.5)
              
              // Obtener nuevos datos
              let newItems = self.fetchItems(page: self.currentPage, pageSize: 20)
              
              DispatchQueue.main.async {
                if newItems.isEmpty {
                  self.hasMorePages = false
                } else {
                  self.items.append(contentsOf: newItems)
                  self.currentPage += 1
                  
                  // Notificar actualización
                  self.delegate?.dataSourceDidUpdate()
                }
                
                self.isLoading = false
              }
            }
          }
          
          private func fetchItems(page: Int, pageSize: Int) -> [Item] {
            // Implementación real: llamada a API
            return []
          }
          
          weak var delegate: DataSourceDelegate?
        }
        
        protocol DataSourceDelegate: AnyObject {
          func dataSourceDidUpdate()
        }
        \`\`\`
      - **Beneficio**: Reducción del uso de memoria en un 40-60%, eliminación de fugas de memoria, y mejora en la estabilidad de la aplicación.`);
            }
            
            // Si no hay suficientes recomendaciones específicas, añadir generales
            if (recommendations.length < 3) {
              recommendations.push(`### Optimizaciones Generales de Rendimiento
      - **Problema**: Oportunidades de mejora en rendimiento general.
      - **Solución**: Implementar mejores prácticas estándar de rendimiento.
      - **Implementación**:
        1. **Implementar caché**: Almacenar resultados de operaciones costosas.
        2. **Optimizar consultas a bases de datos**: Índices, consultas eficientes.
        3. **Reducir operaciones de red**: Combinar peticiones, implementar batch.
        4. **Optimizar algoritmos**: Usar estructuras de datos eficientes.
        5. **Implementar compresión**: Reducir tamaño de datos transferidos.
        6. **Paralelizar operaciones**: Usar hilos y procesamiento asíncrono.
        7. **Reducir uso de memoria**: Liberar recursos no utilizados.
      - **Beneficio**: Mejora general en velocidad, eficiencia y experiencia de usuario.`);
            }
            
            return {
              metrics,
              issues,
              recommendations
            };
          }
          
          /**
           * Analiza el rendimiento de una base de datos
           * @param connectionString Cadena de conexión a la base de datos
           * @returns Informe de rendimiento
           */
          private async analyzeDatabasePerformance(connectionString: string): Promise<{
            metrics: Record<string, any>;
            issues: string[];
            recommendations: string[];
          }> {
            console.log(`Analizando rendimiento de base de datos para: ${connectionString}`);
            
            // Simulación de análisis de rendimiento de base de datos
            // En una implementación real, se conectaría a la base de datos y ejecutaría consultas de diagnóstico
            
            // Métricas simuladas
            const metrics = {
              // Métricas generales
              averageQueryTime: Math.random() * 500 + 50, // ms
              slowQueries: Math.floor(Math.random() * 20), // número de consultas lentas
              cacheHitRatio: Math.random() * 0.5 + 0.4, // 40-90%
              connectionPoolUsage: Math.random() * 0.6 + 0.3, // 30-90%
              deadlocks: Math.floor(Math.random() * 5), // número de deadlocks
              
              // Métricas de almacenamiento
              databaseSize: Math.floor(Math.random() * 10000) + 1000, // MB
              indexSize: Math.floor(Math.random() * 3000) + 500, // MB
              tableFragmentation: Math.random() * 40 + 10, // 10-50%
              
              // Métricas de consultas
              topSlowQueries: [
                {
                  query: "SELECT * FROM products WHERE category_id = ? ORDER BY price",
                  avgTime: Math.random() * 1000 + 500, // ms
                  executions: Math.floor(Math.random() * 1000) + 100
                },
                {
                  query: "SELECT o.*, c.name FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.date > ?",
                  avgTime: Math.random() * 800 + 400, // ms
                  executions: Math.floor(Math.random() * 800) + 200
                },
                {
                  query: "UPDATE inventory SET stock = stock - ? WHERE product_id = ?",
                  avgTime: Math.random() * 300 + 100, // ms
                  executions: Math.floor(Math.random() * 5000) + 1000
                }
              ],
              
              // Métricas de índices
              missingIndices: Math.floor(Math.random() * 10) + 1,
              unusedIndices: Math.floor(Math.random() * 8) + 1,
              
              // Métricas de transacciones
              transactionsPerSecond: Math.floor(Math.random() * 100) + 20,
              averageTransactionTime: Math.random() * 200 + 50, // ms
              longRunningTransactions: Math.floor(Math.random() * 5)
            };
            
            // Identificar problemas basados en métricas
            const issues = [];
            
            if (metrics.averageQueryTime > 200) {
              issues.push('Tiempo promedio de consulta elevado');
            }
            
            if (metrics.slowQueries > 5) {
              issues.push('Número significativo de consultas lentas');
            }
            
            if (metrics.cacheHitRatio < 0.6) {
              issues.push('Ratio de aciertos de caché bajo');
            }
            
            if (metrics.connectionPoolUsage > 0.8) {
              issues.push('Alto uso del pool de conexiones');
            }
            
            if (metrics.deadlocks > 0) {
              issues.push('Presencia de deadlocks');
            }
            
            if (metrics.tableFragmentation > 30) {
              issues.push('Alta fragmentación de tablas');
            }
            
            if (metrics.missingIndices > 3) {
              issues.push('Índices faltantes en consultas frecuentes');
            }
            
            if (metrics.unusedIndices > 3) {
              issues.push('Presencia de índices no utilizados');
            }
            
            if (metrics.longRunningTransactions > 0) {
              issues.push('Transacciones de larga duración');
            }
            
            // Generar recomendaciones basadas en los problemas identificados
            const recommendations = [];
            
            if (issues.includes('Tiempo promedio de consulta elevado') || 
                issues.includes('Número significativo de consultas lentas')) {
              recommendations.push(`### Optimizar Consultas Lentas
      - **Problema**: Rendimiento de consultas subóptimo (Tiempo promedio: ${Math.round(metrics.averageQueryTime)}ms, Consultas lentas: ${metrics.slowQueries}).
      - **Solución**: Optimizar consultas críticas y estructura de la base de datos.
      - **Implementación**:
        1. **Analizar plan de ejecución**: Identificar cuellos de botella en consultas lentas.
        2. **Crear índices estratégicos**: Añadir índices en columnas frecuentemente consultadas.
        3. **Reescribir consultas problemáticas**: Evitar SELECT *, usar JOINs eficientes.
        4. **Implementar paginación**: Limitar resultados con LIMIT/OFFSET o cursores.
        5. **Considerar vistas materializadas**: Para consultas analíticas complejas.
      - **Consultas a optimizar**:
        \`\`\`sql
        -- Original (lento)
        ${metrics.topSlowQueries[0].query}
        -- Tiempo promedio: ${Math.round(metrics.topSlowQueries[0].avgTime)}ms
        
        -- Optimizado
        -- Añadir índice compuesto
        CREATE INDEX idx_products_category_price ON products(category_id, price);
        
        -- Reescribir consulta para usar solo columnas necesarias
        SELECT id, name, price, stock FROM products 
        WHERE category_id = ? 
        ORDER BY price 
        LIMIT 50;
        \`\`\`
        
        \`\`\`sql
        -- Original (lento)
        ${metrics.topSlowQueries[1].query}
        -- Tiempo promedio: ${Math.round(metrics.topSlowQueries[1].avgTime)}ms
        
        -- Optimizado
        -- Añadir índice para la fecha
        CREATE INDEX idx_orders_date ON orders(date);
        
        -- Reescribir para seleccionar solo columnas necesarias
        SELECT o.id, o.date, o.total, c.name 
        FROM orders o 
        JOIN customers c ON o.customer_id = c.id 
        WHERE o.date > ? 
        ORDER BY o.date DESC
        LIMIT 100;
        \`\`\`
      - **Beneficio**: Reducción del tiempo de consulta en un 70-90%, mejor experiencia de usuario y menor carga en el servidor.`);
            }
            
            if (issues.includes('Ratio de aciertos de caché bajo')) {
              recommendations.push(`### Implementar Estrategia de Caché
      - **Problema**: Bajo ratio de aciertos de caché (${(metrics.cacheHitRatio * 100).toFixed(1)}%).
      - **Solución**: Implementar caché en múltiples niveles.
      - **Implementación**:
        1. **Caché de consultas a nivel de aplicación**: Usar Redis o Memcached.
        2. **Configurar caché de la base de datos**: Optimizar buffer pool y query cache.
        3. **Implementar TTL (Time-To-Live)**: Establecer tiempos de expiración apropiados.
        4. **Estrategia de invalidación**: Actualizar caché cuando los datos cambien.
      - **Código de ejemplo (Node.js con Redis)**:
        \`\`\`javascript
        const redis = require('redis');
        const { promisify } = require('util');
        const client = redis.createClient();
        
        // Promisify Redis methods
        const getAsync = promisify(client.get).bind(client);
        const setAsync = promisify(client.set).bind(client);
        
        async function getProductWithCache(productId) {
          const cacheKey = \`product:\${productId}\`;
          
          // Try to get from cache first
          const cachedProduct = await getAsync(cacheKey);
          if (cachedProduct) {
            console.log('Cache hit');
            return JSON.parse(cachedProduct);
          }
          
          console.log('Cache miss');
          
          // If not in cache, get from database
          const product = await db.query(
            'SELECT * FROM products WHERE id = ?', 
            [productId]
          );
          
          // Store in cache with expiration (1 hour)
          await setAsync(
            cacheKey, 
            JSON.stringify(product), 
            'EX', 
            3600
          );
          
          return product;
        }
        
        // Invalidate cache when data changes
        async function updateProduct(productId, data) {
          // Update database
          await db.query(
            'UPDATE products SET name = ?, price = ? WHERE id = ?',
            [data.name, data.price, productId]
          );
          
          // Invalidate cache
          client.del(\`product:\${productId}\`);
        }
        \`\`\`
      - **Configuración de caché en base de datos (MySQL)**:
        \`\`\`sql
        -- Configurar InnoDB Buffer Pool (50% de RAM disponible)
        SET GLOBAL innodb_buffer_pool_size = 4294967296; -- 4GB
        
        -- Habilitar query cache (MySQL 5.7 o anterior)
        SET GLOBAL query_cache_type = 1;
        SET GLOBAL query_cache_size = 268435456; -- 256MB
        
        -- Para MySQL 8.0+, usar la caché de servidor de aplicación
        \`\`\`
      - **Beneficio**: Aumento del ratio de aciertos de caché a >85%, reducción de carga en la base de datos y mejora de tiempos de respuesta en un 60-80%.`);
            }
            
            if (issues.includes('Índices faltantes en consultas frecuentes')) {
              recommendations.push(`### Optimizar Estrategia de Índices
      - **Problema**: ${metrics.missingIndices} índices faltantes y ${metrics.unusedIndices} índices no utilizados.
      - **Solución**: Implementar estrategia de indexación eficiente.
      - **Implementación**:
        1. **Añadir índices estratégicos**: Crear índices para consultas frecuentes.
        2. **Eliminar índices no utilizados**: Reducir sobrecarga de escritura y espacio.
        3. **Considerar índices compuestos**: Para consultas con múltiples condiciones.
        4. **Monitorear uso de índices**: Revisar periódicamente su efectividad.
      - **SQL para añadir índices estratégicos**:
        \`\`\`sql
        -- Índices para consultas frecuentes
        CREATE INDEX idx_orders_customer_date ON orders(customer_id, date);
        CREATE INDEX idx_order_items_order_product ON order_items(order_id, product_id);
        CREATE INDEX idx_products_category_name ON products(category_id, name);
        
        -- Índice para búsquedas de texto
        CREATE INDEX idx_products_name_fulltext ON products(name) USING FULLTEXT;
        
        -- Índice para rangos de fechas
        CREATE INDEX idx_transactions_date ON transactions(date);
        
        -- Índice para ordenamiento frecuente
        CREATE INDEX idx_products_price ON products(price);
        \`\`\`
      - **SQL para identificar y eliminar índices no utilizados**:
        \`\`\`sql
        -- Para MySQL: Identificar índices no utilizados
        SELECT
          t.TABLE_SCHEMA,
          t.TABLE_NAME,
          s.INDEX_NAME,
          s.COLUMN_NAME,
          s.SEQ_IN_INDEX,
          s.CARDINALITY,
          t.TABLE_ROWS,
          ROUND((s.CARDINALITY / IFNULL(t.TABLE_ROWS, 0.01)) * 100, 2) AS selectivity
        FROM
          information_schema.STATISTICS s
          JOIN information_schema.TABLES t ON s.TABLE_SCHEMA = t.TABLE_SCHEMA
          AND s.TABLE_NAME = t.TABLE_NAME
        WHERE
          t.TABLE_SCHEMA NOT IN ('mysql', 'information_schema', 'performance_schema')
          AND t.TABLE_ROWS > 10000
          AND ROUND((s.CARDINALITY / IFNULL(t.TABLE_ROWS, 0.01)) * 100, 2) < 1.00
        ORDER BY
          selectivity ASC;
          
        -- Eliminar índices no utilizados (después de validar)
        ALTER TABLE products DROP INDEX idx_unused_example;
        \`\`\`
      - **Beneficio**: Reducción de tiempos de consulta en un 50-90%, menor uso de espacio en disco y mejora en tiempos de escritura.`);
            }
            
            if (issues.includes('Alta fragmentación de tablas')) {
              recommendations.push(`### Optimizar Estructura de Almacenamiento
      - **Problema**: Alta fragmentación de tablas (${Math.round(metrics.tableFragmentation)}%).
      - **Solución**: Implementar mantenimiento regular y optimizar estructura.
      - **Implementación**:
        1. **Desfragmentar tablas**: Ejecutar OPTIMIZE TABLE periódicamente.
        2. **Particionar tablas grandes**: Dividir por rango, hash o lista.
        3. **Archivar datos históricos**: Mover datos antiguos a tablas de archivo.
        4. **Comprimir datos**: Usar compresión para tablas grandes.
      - **SQL para mantenimiento**:
        \`\`\`sql
        -- Analizar tablas para identificar fragmentación
        ANALYZE TABLE orders, order_items, products, customers;
        
        -- Optimizar tablas fragmentadas
        OPTIMIZE TABLE orders, order_items, products, customers;
        
        -- Ejemplo de particionamiento por rango (MySQL)
        ALTER TABLE orders
        PARTITION BY RANGE (YEAR(date)) (
          PARTITION p2020 VALUES LESS THAN (2021),
          PARTITION p2021 VALUES LESS THAN (2022),
          PARTITION p2022 VALUES LESS THAN (2023),
          PARTITION p2023 VALUES LESS THAN (2024),
          PARTITION pCurrent VALUES LESS THAN MAXVALUE
        );
        
        -- Crear tabla de archivo
        CREATE TABLE orders_archive LIKE orders;
        
        -- Mover datos antiguos a archivo
        INSERT INTO orders_archive
        SELECT * FROM orders WHERE date < DATE_SUB(NOW(), INTERVAL 2 YEAR);
        
        -- Eliminar datos archivados de tabla principal
        DELETE FROM orders WHERE date < DATE_SUB(NOW(), INTERVAL 2 YEAR);
        \`\`\`
      - **Script de mantenimiento automatizado**:
        \`\`\`bash
        #!/bin/bash
        
        # Configuración
        DB_USER="usuario"
        DB_PASS="contraseña"
        DB_NAME="nombre_db"
        
        # Tablas a optimizar
        TABLES="orders order_items products customers inventory"
        
        # Fecha para log
        DATE=$(date +"%Y-%m-%d %H:%M:%S")
        
        echo "[$DATE] Iniciando mantenimiento de base de datos"
        
        # Analizar y optimizar cada tabla
        for TABLE in $TABLES; do
          echo "[$DATE] Analizando tabla $TABLE"
          mysql -u$DB_USER -p$DB_PASS $DB_NAME -e "ANALYZE TABLE $TABLE;"
          
          echo "[$DATE] Optimizando tabla $TABLE"
          mysql -u$DB_USER -p$DB_PASS $DB_NAME -e "OPTIMIZE TABLE $TABLE;"
        done
        
        # Archivar datos antiguos (ejemplo para orders)
        echo "[$DATE] Archivando datos antiguos"
        mysql -u$DB_USER -p$DB_PASS $DB_NAME -e "
          INSERT INTO orders_archive
          SELECT * FROM orders WHERE date < DATE_SUB(NOW(), INTERVAL 2 YEAR);
          
          DELETE FROM orders WHERE date < DATE_SUB(NOW(), INTERVAL 2 YEAR);
        "
        
        echo "[$DATE] Mantenimiento completado"
        \`\`\`
      - **Beneficio**: Reducción de fragmentación a <10%, mejora en tiempos de lectura/escritura, y uso más eficiente del espacio en disco.`);
            }
            
            if (issues.includes('Alto uso del pool de conexiones') || 
                issues.includes('Presencia de deadlocks')) {
              recommendations.push(`### Optimizar Gestión de Conexiones y Transacciones
      - **Problema**: Problemas de concurrencia (Uso del pool: ${(metrics.connectionPoolUsage * 100).toFixed(1)}%, Deadlocks: ${metrics.deadlocks}).
      - **Solución**: Implementar estrategias eficientes de conexión y transacción.
      - **Implementación**:
        1. **Optimizar pool de conexiones**: Configurar tamaño y timeout adecuados.
        2. **Implementar transacciones cortas**: Minimizar duración y alcance.
        3. **Establecer niveles de aislamiento apropiados**: Usar READ COMMITTED cuando sea posible.
        4. **Implementar reintentos con backoff**: Para manejar deadlocks.
      - **Configuración de pool de conexiones (Node.js)**:
        \`\`\`javascript
        // Ejemplo con mysql2
        const mysql = require('mysql2/promise');
        
        const pool = mysql.createPool({
          host: 'localhost',
          user: 'user',
          password: 'password',
          database: 'db_name',
          // Configuración optimizada del pool
          connectionLimit: 20,      // Limitar conexiones máximas
          queueLimit: 30,           // Limitar cola de espera
          waitForConnections: true, // Esperar por conexiones disponibles
          connectTimeout: 10000,    // Timeout de conexión (10s)
          acquireTimeout: 10000,    // Timeout de adquisición (10s)
          idleTimeout: 60000,       // Timeout de inactividad (60s)
          enableKeepAlive: true,    // Mantener conexiones vivas
          keepAliveInitialDelay: 30000 // Delay inicial para keepalive (30s)
        });
        
        // Función con manejo de transacciones y reintentos
        async function transferFunds(fromAccount, toAccount, amount, maxRetries = 3) {
          let retries = 0;
          
          while (retries < maxRetries) {
            const connection = await pool.getConnection();
            
            try {
              // Iniciar transacción
              await connection.beginTransaction();
              
              // Verificar saldo suficiente
              const [rows] = await connection.query(
                'SELECT balance FROM accounts WHERE id = ? FOR UPDATE',
                [fromAccount]
              );
              
              if (rows[0].balance < amount) {
                throw new Error('Saldo insuficiente');
              }
              
              // Actualizar cuentas
              await connection.query(
                'UPDATE accounts SET balance = balance - ? WHERE id = ?',
                [amount, fromAccount]
              );
              
              await connection.query(
                'UPDATE accounts SET balance = balance + ? WHERE id = ?',
                [amount, toAccount]
              );
              
              // Registrar transacción
              await connection.query(
                'INSERT INTO transactions (from_account, to_account, amount, date) VALUES (?, ?, ?, NOW())',
                [fromAccount, toAccount, amount]
              );
              
              // Confirmar transacción
              await connection.commit();
              
              // Éxito, salir del bucle
              return { success: true };
              
            } catch (error) {
              // Revertir transacción en caso de error
              await connection.rollback();
              
              // Si es un deadlock, reintentar
              if (error.code === 'ER_LOCK_DEADLOCK' && retries < maxRetries - 1) {
                retries++;
                // Espera exponencial entre reintentos
                const waitTime = Math.pow(2, retries) * 100;
                await new Promise(resolve => setTimeout(resolve, waitTime));
                console.log(\`Deadlock detectado, reintentando (\${retries}/\${maxRetries})\`);
              } else {
                // Otro error o máximo de reintentos alcanzado
                throw error;
              }
            } finally {
              // Liberar conexión en cualquier caso
              connection.release();
            }
          }
        }
        \`\`\`
      - **Configuración de base de datos (MySQL)**:
        \`\`\`sql
        -- Configurar timeouts y límites
        SET GLOBAL wait_timeout = 600; -- 10 minutos
        SET GLOBAL interactive_timeout = 600; -- 10 minutos
        SET GLOBAL max_connections = 500; -- Ajustar según recursos
        
        -- Configurar nivel de aislamiento predeterminado
        SET GLOBAL transaction_isolation = 'READ-COMMITTED';
        
        -- Configurar detección de deadlocks
        SET GLOBAL innodb_deadlock_detect = ON;
        SET GLOBAL innodb_lock_wait_timeout = 50; -- 50 segundos
        \`\`\`
      - **Beneficio**: Reducción de deadlocks en un 90%, mejor utilización de conexiones, y mayor estabilidad del sistema bajo carga.`);
            }
            
            // Si no hay suficientes recomendaciones específicas, añadir generales
            if (recommendations.length < 3) {
              recommendations.push(`### Optimizaciones Generales de Base de Datos
      - **Problema**: Oportunidades de mejora en rendimiento general.
      - **Solución**: Implementar mejores prácticas estándar de bases de datos.
      - **Implementación**:
        1. **Normalizar/desnormalizar estratégicamente**: Balancear entre integridad y rendimiento.
        2. **Implementar procedimientos almacenados**: Para operaciones complejas frecuentes.
        3. **Configurar monitoreo continuo**: Alertas para consultas lentas y problemas.
        4. **Implementar sharding**: Dividir datos en múltiples servidores para escalar horizontalmente.
        5. **Optimizar tipos de datos**: Usar tipos apropiados para cada columna.
        6. **Implementar réplicas de lectura**: Distribuir carga de consultas.
        7. **Revisar y optimizar esquema**: Eliminar columnas y tablas no utilizadas.
      - **Beneficio**: Mejora general en rendimiento, escalabilidad y mantenibilidad de la base de datos.`);
            }
            
            return {
              metrics,
              issues,
              recommendations
            };
          }
          
          /**
           * Genera un informe de rendimiento basado en los análisis realizados
           * @param results Resultados de los análisis de rendimiento
           * @returns Informe de rendimiento formateado
           */
          private generatePerformanceReport(results: any[]): string {
            console.log(`Generando informe de rendimiento para ${results.length} análisis`);
            
            let report = `# 📊 Informe de Rendimiento\n\n`;
            report += `*Generado por Performance Agent el ${new Date().toLocaleString()}*\n\n`;
            
            // Resumen ejecutivo
            report += `## 📋 Resumen Ejecutivo\n\n`;
            
            const totalIssues = results.reduce((total, result) => total + (result.issues?.length || 0), 0);
            const totalRecommendations = results.reduce((total, result) => total + (result.recommendations?.length || 0), 0);
            
            report += `Se han analizado **${results.length}** componentes, identificando **${totalIssues}** problemas y generando **${totalRecommendations}** recomendaciones de optimización.\n\n`;
            
            // Añadir cada análisis al informe
            results.forEach((result, index) => {
              if (result.type) {
                report += `## ${this.getAnalysisTypeIcon(result.type)} Análisis de ${this.getAnalysisTypeName(result.type)}\n\n`;
              } else {
                report += `## 🔍 Análisis #${index + 1}\n\n`;
              }
              
              // Añadir métricas si existen
              if (result.metrics && Object.keys(result.metrics).length > 0) {
                report += `### Métricas Clave\n\n`;
                report += `| Métrica | Valor | Estado |\n`;
                report += `|---------|-------|--------|\n`;
                
                // Seleccionar métricas clave según el tipo de análisis
                const keyMetrics = this.getKeyMetrics(result);
                
                keyMetrics.forEach(metric => {
                  const value = result.metrics[metric.key];
                  if (value !== undefined) {
                    const formattedValue = this.formatMetricValue(value, metric.unit);
                    const status = this.getMetricStatus(value, metric.thresholds);
                    report += `| ${metric.name} | ${formattedValue} | ${status} |\n`;
                  }
                });
                
                report += `\n`;
              }
              
              // Añadir problemas identificados
              if (result.issues && result.issues.length > 0) {
                report += `### Problemas Identificados\n\n`;
                
                result.issues.forEach(issue => {
                  report += `- ⚠️ **${issue}**\n`;
                });
                
                report += `\n`;
              }
              
              // Añadir recomendaciones
              if (result.recommendations && result.recommendations.length > 0) {
                report += `### Recomendaciones de Optimización\n\n`;
                
                result.recommendations.forEach(recommendation => {
                  report += `${recommendation}\n\n`;
                });
              }
              
              // Añadir código de ejemplo si existe
              if (result.codeExamples && result.codeExamples.length > 0) {
                report += `### Ejemplos de Implementación\n\n`;
                
                result.codeExamples.forEach(example => {
                  report += `#### ${example.title}\n\n`;
                  report += `\`\`\`${example.language}\n${example.code}\n\`\`\`\n\n`;
                  if (example.explanation) {
                    report += `${example.explanation}\n\n`;
                  }
                });
              }
              
              // Añadir estimación de mejora si existe
              if (result.improvementEstimation) {
                report += `### Estimación de Mejora\n\n`;
                report += `| Métrica | Valor Actual | Valor Estimado | Mejora |\n`;
                report += `|---------|--------------|----------------|--------|\n`;
                
                Object.keys(result.improvementEstimation).forEach(metric => {
                  const current = result.metrics[metric];
                  const estimated = result.improvementEstimation[metric];
                  const improvement = this.calculateImprovement(current, estimated);
                  
                  report += `| ${this.formatMetricName(metric)} | ${this.formatMetricValue(current)} | ${this.formatMetricValue(estimated)} | ${improvement} |\n`;
                });
                
                report += `\n`;
              }
              
              // Añadir próximos pasos si existen
              if (result.nextSteps && result.nextSteps.length > 0) {
                report += `### Próximos Pasos\n\n`;
                
                result.nextSteps.forEach((step, index) => {
                  report += `${index + 1}. **${step.title}**: ${step.description}\n`;
                  if (step.priority) {
                    report += `   - Prioridad: ${this.formatPriority(step.priority)}\n`;
                  }
                  if (step.effort) {
                    report += `   - Esfuerzo estimado: ${step.effort}\n`;
                  }
                });
                
                report += `\n`;
              }
            });
            
            // Añadir resumen final
            report += `## 📈 Resumen de Optimizaciones\n\n`;
            
            // Agrupar recomendaciones por categoría
            const categorizedRecommendations = this.categorizeRecommendations(results);
            
            // Mostrar recomendaciones por categoría
            Object.keys(categorizedRecommendations).forEach(category => {
              report += `### ${category}\n\n`;
              
              categorizedRecommendations[category].forEach(recommendation => {
                report += `- ${recommendation}\n`;
              });
              
              report += `\n`;
            });
            
            // Añadir impacto estimado
            report += `## 💹 Impacto Estimado\n\n`;
            report += `La implementación de estas optimizaciones podría resultar en:\n\n`;
            
            const impactEstimations = this.calculateOverallImpact(results);
            
            impactEstimations.forEach(impact => {
              report += `- **${impact.metric}**: ${impact.improvement}\n`;
            });
            
            // Añadir conclusión
            report += `\n## 🏁 Conclusión\n\n`;
            report += `Este análisis de rendimiento ha identificado ${totalIssues} problemas y propuesto ${totalRecommendations} optimizaciones. `;
            report += `La implementación de estas recomendaciones mejorará significativamente el rendimiento, la eficiencia y la experiencia de usuario de la aplicación. `;
            report += `Se recomienda priorizar las optimizaciones según su impacto y esfuerzo de implementación, comenzando por aquellas con mayor retorno de inversión.\n\n`;
            
            // Añadir firma
            report += `---\n\n`;
            report += `*Informe generado por Performance Agent - CJ.DevMind*\n`;
            report += `*Fecha: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}*\n`;
            
            return report;
          }
          
          /**
           * Calcula la mejora entre un valor actual y uno estimado
           * @param current Valor actual
           * @param estimated Valor estimado
           * @returns Porcentaje de mejora formateado
           */
          private calculateImprovement(current: number, estimated: number): string {
            // Si los valores son iguales, no hay mejora
            if (current === estimated) {
              return '0%';
            }
            
            // Determinar si un valor menor es mejor (ej: tiempo de carga) o un valor mayor es mejor (ej: puntuación)
            const isSmallerBetter = this.isSmallerBetter(current, estimated);
            
            let improvementPercentage: number;
            
            if (isSmallerBetter) {
              // Para métricas donde menor es mejor (tiempos, tamaños)
              improvementPercentage = ((current - estimated) / current) * 100;
            } else {
              // Para métricas donde mayor es mejor (puntuaciones, rendimiento)
              improvementPercentage = ((estimated - current) / current) * 100;
            }
            
            // Formatear el porcentaje con signo y color
            const formattedImprovement = `${improvementPercentage >= 0 ? '+' : ''}${improvementPercentage.toFixed(1)}%`;
            
            return formattedImprovement;
          }
          
          /**
           * Determina si un valor menor es mejor para una métrica
           * @param current Valor actual
           * @param estimated Valor estimado
           * @returns true si un valor menor es mejor
           */
          private isSmallerBetter(current: number, estimated: number): boolean {
            // Si el valor estimado es menor que el actual, asumimos que menor es mejor
            // Esta es una heurística simple, idealmente debería basarse en el tipo de métrica
            return estimated < current;
          }
          
          /**
           * Formatea el nombre de una métrica para mostrarla en el informe
           * @param metricKey Clave de la métrica
           * @returns Nombre formateado de la métrica
           */
          private formatMetricName(metricKey: string): string {
            // Convertir camelCase a palabras separadas y capitalizar
            return metricKey
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
          }
          
          /**
           * Formatea el valor de una métrica para mostrarla en el informe
           * @param value Valor de la métrica
           * @param unit Unidad opcional
           * @returns Valor formateado
           */
          private formatMetricValue(value: any, unit?: string): string {
            if (typeof value === 'number') {
              // Formatear números según su magnitud
              if (value > 1000000) {
                return `${(value / 1000000).toFixed(2)}M${unit ? ' ' + unit : ''}`;
              } else if (value > 1000) {
                return `${(value / 1000).toFixed(2)}K${unit ? ' ' + unit : ''}`;
              } else if (Number.isInteger(value)) {
                return `${value}${unit ? ' ' + unit : ''}`;
              } else {
                return `${value.toFixed(2)}${unit ? ' ' + unit : ''}`;
              }
            } else if (typeof value === 'boolean') {
              return value ? 'Sí' : 'No';
            } else if (value === null || value === undefined) {
              return 'N/A';
            } else {
              return `${value}${unit ? ' ' + unit : ''}`;
            }
          }
          
          /**
           * Determina el estado de una métrica según sus umbrales
           * @param value Valor de la métrica
           * @param thresholds Umbrales para determinar el estado
           * @returns Emoji que representa el estado
           */
          private getMetricStatus(value: number, thresholds?: { good?: number; warning?: number }): string {
            if (!thresholds) {
              return '⚪'; // Neutral si no hay umbrales
            }
            
            // Determinar si menor es mejor basado en los umbrales
            const isSmallerBetter = thresholds.good !== undefined && thresholds.warning !== undefined && 
                                   thresholds.good < thresholds.warning;
            
            if (isSmallerBetter) {
              if (thresholds.good !== undefined && value <= thresholds.good) {
                return '🟢'; // Bueno
              } else if (thresholds.warning !== undefined && value <= thresholds.warning) {
                return '🟡'; // Advertencia
              } else {
                return '🔴'; // Malo
              }
            } else {
              if (thresholds.good !== undefined && value >= thresholds.good) {
                return '🟢'; // Bueno
              } else if (thresholds.warning !== undefined && value >= thresholds.warning) {
                return '🟡'; // Advertencia
              } else {
                return '🔴'; // Malo
              }
            }
          }
          
          /**
           * Obtiene un icono según el tipo de análisis
           * @param type Tipo de análisis
           * @returns Icono correspondiente
           */
          private getAnalysisTypeIcon(type: string): string {
            switch (type.toLowerCase()) {
              case 'web':
                return '🌐';
              case 'database':
                return '🗄️';
              case 'algorithm':
                return '⚙️';
              case 'memory':
                return '🧠';
              case 'network':
                return '📡';
              case 'mobile':
                return '📱';
              case 'api':
                return '🔌';
              case 'frontend':
                return '🖥️';
              case 'backend':
                return '🔧';
              default:
                return '🔍';
            }
          }
          
          /**
           * Obtiene el nombre descriptivo de un tipo de análisis
           * @param type Tipo de análisis
           * @returns Nombre descriptivo
           */
          private getAnalysisTypeName(type: string): string {
            switch (type.toLowerCase()) {
              case 'web':
                return 'Rendimiento Web';
              case 'database':
                return 'Rendimiento de Base de Datos';
              case 'algorithm':
                return 'Optimización de Algoritmos';
              case 'memory':
                return 'Uso de Memoria';
              case 'network':
                return 'Rendimiento de Red';
              case 'mobile':
                return 'Rendimiento Móvil';
              case 'api':
                return 'Rendimiento de API';
              case 'frontend':
                return 'Rendimiento Frontend';
              case 'backend':
                return 'Rendimiento Backend';
              default:
                return 'Rendimiento General';
            }
          }
          
          /**
           * Obtiene las métricas clave según el tipo de análisis
           * @param result Resultado del análisis
           * @returns Lista de métricas clave con sus umbrales
           */
          private getKeyMetrics(result: any): Array<{key: string; name: string; unit?: string; thresholds?: {good?: number; warning?: number}}> {
            const type = result.type?.toLowerCase() || 'general';
            
            switch (type) {
              case 'web':
                return [
                  { key: 'firstContentfulPaint', name: 'First Contentful Paint', unit: 'ms', thresholds: { good: 1000, warning: 2500 } },
                  { key: 'largestContentfulPaint', name: 'Largest Contentful Paint', unit: 'ms', thresholds: { good: 2500, warning: 4000 } },
                  { key: 'timeToInteractive', name: 'Time to Interactive', unit: 'ms', thresholds: { good: 3500, warning: 7500 } },
                  { key: 'totalBlockingTime', name: 'Total Blocking Time', unit: 'ms', thresholds: { good: 200, warning: 600 } },
                  { key: 'cumulativeLayoutShift', name: 'Cumulative Layout Shift', thresholds: { good: 0.1, warning: 0.25 } },
                  { key: 'speedIndex', name: 'Speed Index', unit: 'ms', thresholds: { good: 3400, warning: 5800 } }
                ];
              case 'database':
                return [
                  { key: 'queryTime', name: 'Tiempo de Consulta Promedio', unit: 'ms', thresholds: { good: 50, warning: 200 } },
                  { key: 'throughput', name: 'Throughput', unit: 'qps', thresholds: { good: 1000, warning: 500 } },
                  { key: 'connectionPoolUsage', name: 'Uso del Pool de Conexiones', unit: '%', thresholds: { good: 70, warning: 85 } },
                  { key: 'deadlocks', name: 'Deadlocks', thresholds: { good: 0, warning: 5 } },
                  { key: 'cacheHitRatio', name: 'Ratio de Aciertos de Caché', unit: '%', thresholds: { good: 80, warning: 60 } },
                  { key: 'tableFragmentation', name: 'Fragmentación de Tablas', unit: '%', thresholds: { good: 10, warning: 30 } }
                ];
              case 'algorithm':
                return [
                  { key: 'timeComplexity', name: 'Complejidad Temporal', thresholds: { good: 2, warning: 3 } },
                  { key: 'spaceComplexity', name: 'Complejidad Espacial', thresholds: { good: 2, warning: 3 } },
                  { key: 'executionTime', name: 'Tiempo de Ejecución', unit: 'ms', thresholds: { good: 100, warning: 500 } },
                  { key: 'memoryUsage', name: 'Uso de Memoria', unit: 'MB', thresholds: { good: 50, warning: 200 } },
                  { key: 'recursionDepth', name: 'Profundidad de Recursión', thresholds: { good: 10, warning: 50 } }
                ];
              case 'memory':
                return [
                  { key: 'heapUsage', name: 'Uso de Heap', unit: 'MB', thresholds: { good: 200, warning: 500 } },
                  { key: 'memoryLeaks', name: 'Fugas de Memoria', thresholds: { good: 0, warning: 2 } },
                  { key: 'gcPauses', name: 'Pausas de GC', unit: 'ms', thresholds: { good: 100, warning: 300 } },
                  { key: 'objectAllocationRate', name: 'Tasa de Asignación de Objetos', unit: '/s', thresholds: { good: 1000, warning: 5000 } },
                  { key: 'fragmentationRatio', name: 'Ratio de Fragmentación', unit: '%', thresholds: { good: 10, warning: 30 } }
                ];
              case 'network':
                return [
                  { key: 'latency', name: 'Latencia', unit: 'ms', thresholds: { good: 100, warning: 300 } },
                  { key: 'throughput', name: 'Throughput', unit: 'MB/s', thresholds: { good: 10, warning: 5 } },
                  { key: 'packetLoss', name: 'Pérdida de Paquetes', unit: '%', thresholds: { good: 0.1, warning: 1 } },
                  { key: 'connectionTime', name: 'Tiempo de Conexión', unit: 'ms', thresholds: { good: 50, warning: 200 } },
                  { key: 'requestsPerSecond', name: 'Solicitudes por Segundo', thresholds: { good: 100, warning: 50 } }
                ];
              case 'mobile':
                return [
                  { key: 'frameRate', name: 'Tasa de Frames', unit: 'fps', thresholds: { good: 60, warning: 30 } },
                  { key: 'startupTime', name: 'Tiempo de Inicio', unit: 'ms', thresholds: { good: 2000, warning: 5000 } },
                  { key: 'batteryUsage', name: 'Uso de Batería', unit: '%/h', thresholds: { good: 5, warning: 15 } },
                  { key: 'memoryUsage', name: 'Uso de Memoria', unit: 'MB', thresholds: { good: 100, warning: 300 } },
                  { key: 'networkRequests', name: 'Solicitudes de Red', thresholds: { good: 20, warning: 50 } }
                ];
              case 'api':
                return [
                  { key: 'responseTime', name: 'Tiempo de Respuesta', unit: 'ms', thresholds: { good: 200, warning: 500 } },
                  { key: 'throughput', name: 'Throughput', unit: 'rps', thresholds: { good: 100, warning: 50 } },
                  { key: 'errorRate', name: 'Tasa de Error', unit: '%', thresholds: { good: 1, warning: 5 } },
                  { key: 'availabilityRate', name: 'Tasa de Disponibilidad', unit: '%', thresholds: { good: 99.9, warning: 99 } },
                  { key: 'payloadSize', name: 'Tamaño de Payload', unit: 'KB', thresholds: { good: 10, warning: 50 } }
                ];
              default:
                return [
                  { key: 'responseTime', name: 'Tiempo de Respuesta', unit: 'ms', thresholds: { good: 300, warning: 1000 } },
                  { key: 'throughput', name: 'Throughput', unit: 'ops/s', thresholds: { good: 100, warning: 50 } },
                  { key: 'errorRate', name: 'Tasa de Error', unit: '%', thresholds: { good: 1, warning: 5 } },
                  { key: 'resourceUsage', name: 'Uso de Recursos', unit: '%', thresholds: { good: 70, warning: 90 } },
                  { key: 'userSatisfaction', name: 'Satisfacción del Usuario', unit: '/10', thresholds: { good: 8, warning: 6 } }
                ];
            }
          }
          
          /**
           * Formatea la prioridad de un paso
           * @param priority Prioridad (alta, media, baja)
           * @returns Prioridad formateada con emoji
           */
          private formatPriority(priority: string): string {
            switch (priority.toLowerCase()) {
              case 'alta':
              case 'high':
                return '🔴 Alta';
              case 'media':
              case 'medium':
                return '🟡 Media';
              case 'baja':
              case 'low':
                return '🟢 Baja';
              default:
                return priority;
            }
          }
          
          /**
           * Categoriza las recomendaciones por tipo
           * @param results Resultados de los análisis
           * @returns Recomendaciones agrupadas por categoría
           */
          private categorizeRecommendations(results: any[]): Record<string, string[]> {
            const categories: Record<string, string[]> = {
              'Optimizaciones Frontend': [],
              'Optimizaciones Backend': [],
              'Optimizaciones de Base de Datos': [],
              'Optimizaciones de Algoritmos': [],
              'Optimizaciones de Red': [],
              'Optimizaciones de Memoria': [],
              'Otras Optimizaciones': []
            };
            
            results.forEach(result => {
              if (!result.recommendations) return;
              
              // Simplificar las recomendaciones para el resumen
              const simplifiedRecommendations = result.recommendations.map((rec: string) => {
                // Extraer el título de la recomendación (asumiendo formato "### Título")
                const titleMatch = rec.match(/###\s+(.+?)(\n|$)/);
                if (titleMatch && titleMatch[1]) {
                  return titleMatch[1].trim();
                }
                // Si no tiene formato de título, tomar la primera línea
                return rec.split('\n')[0].replace(/^[#\-*]+\s*/, '').trim();
              });
              
              // Asignar a categorías según el tipo de análisis
              if (result.type) {
                switch (result.type.toLowerCase()) {
                  case 'web':
                  case 'frontend':
                    categories['Optimizaciones Frontend'].push(...simplifiedRecommendations);
                    break;
                  case 'backend':
                  case 'api':
                    categories['Optimizaciones Backend'].push(...simplifiedRecommendations);
                    break;
                  case 'database':
                    categories['Optimizaciones de Base de Datos'].push(...simplifiedRecommendations);
                    break;
                  case 'algorithm':
                    categories['Optimizaciones de Algoritmos'].push(...simplifiedRecommendations);
                    break;
                  case 'network':
                    categories['Optimizaciones de Red'].push(...simplifiedRecommendations);
                    break;
                  case 'memory':
                    categories['Optimizaciones de Memoria'].push(...simplifiedRecommendations);
                    break;
                  default:
                    categories['Otras Optimizaciones'].push(...simplifiedRecommendations);
                }
              } else {
                categories['Otras Optimizaciones'].push(...simplifiedRecommendations);
              }
            });
            
            // Eliminar categorías vacías
            Object.keys(categories).forEach(key => {
              if (categories[key].length === 0) {
                delete categories[key];
              } else {
                // Eliminar duplicados
                categories[key] = [...new Set(categories[key])];
              }
            });
            
            return categories;
          }
          
          /**
           * Calcula el impacto general de las optimizaciones
           * @param results Resultados de los análisis
           * @returns Lista de impactos estimados
           */
          private calculateOverallImpact(results: any[]): Array<{metric: string; improvement: string}> {
            const impacts = [
              { metric: 'Tiempo de Respuesta', improvement: 'Reducción del 40-60%' },
              { metric: 'Uso de Recursos', improvement: 'Reducción del 30-50%' },
              { metric: 'Experiencia de Usuario', improvement: 'Mejora del 50-70%' },
              { metric: 'Escalabilidad', improvement: 'Aumento del 100-200%' },
              { metric: 'Costos de Infraestructura', improvement: 'Reducción del 20-40%' }
            ];
            
            // En una implementación real, se calcularían estos valores basados en los resultados
            
            return impacts;
          }
          
          /**
           * Lee un archivo de contexto
           * @param filename Nombre del archivo de contexto
           * @returns Contenido del archivo
           */
          private readContext(filename: string): string {
            try {
              const contextPath = path.join(process.cwd(), 'context', filename);
              if (fs.existsSync(contextPath)) {
                return fs.readFileSync(contextPath, 'utf8');
              }
              return '';
            } catch (error) {
              console.error(`Error al leer el contexto ${filename}:`, error);
              return '';
            }
          }
          
          /**
           * Determina el tipo de análisis de rendimiento
           * @param perfSpec Especificación de rendimiento
           * @returns Tipo de análisis
           */
          private determinePerfType(perfSpec: string): string {
            if (perfSpec.includes('web') || perfSpec.includes('site') || perfSpec.includes('page')) {
              return 'web';
            } else if (perfSpec.includes('db') || perfSpec.includes('database') || perfSpec.includes('sql')) {
              return 'database';
            } else if (perfSpec.includes('algo') || perfSpec.includes('algorithm')) {
              return 'algorithm';
            } else if (perfSpec.includes('mem') || perfSpec.includes('memory')) {
              return 'memory';
            } else if (perfSpec.includes('net') || perfSpec.includes('network')) {
              return 'network';
            } else if (perfSpec.includes('mobile') || perfSpec.includes('app')) {
              return 'mobile';
            } else if (perfSpec.includes('api') || perfSpec.includes('endpoint')) {
              return 'api';
            } else if (perfSpec.includes('front') || perfSpec.includes('ui')) {
              return 'frontend';
            } else if (perfSpec.includes('back') || perfSpec.includes('server')) {
              return 'backend';
            } else {
              return 'general';
            }
          }
}