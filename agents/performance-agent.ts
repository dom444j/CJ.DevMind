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
    
    # Reglas Arquitectónicas
    ${rulesContext}
    
    # Tarea de Performance Agent
    Actúa como el Performance Agent de CJ.DevMind. Tu tarea es analizar y optimizar el rendimiento basado en la siguiente especificación:
    
    "${perfSpec}"
    
    Tipo de análisis: ${perfType}
    
    ${sourceCode ? '# Código Fuente a Analizar\n```\n' + sourceCode + '\n```\n' : ''}
    
    Genera:
    1. Análisis de rendimiento detallado
    2. Identificación de cuellos de botella y problemas
    3. Recomendaciones de optimización para ${perfType === 'frontend' ? 'frontend' : perfType === 'backend' ? 'backend' : 'algoritmos y estructuras de datos'}
    4. Código optimizado (cuando sea aplicable)
    
    El análisis debe ser exhaustivo, identificando tanto problemas comunes como específicos del contexto.
    `;
    
    // En modo real, consultaríamos al LLM
    let perfAnalysis, perfOptimizations, perfCode;
    
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      try {
        const result = await this.queryLLM(perfPrompt);
        
        // Extraer las diferentes partes de la respuesta
        perfAnalysis = this.extractSection(result, 'Análisis de Rendimiento');
        perfOptimizations = this.extractSection(result, 'Recomendaciones de Optimización');
        perfCode = this.extractCodeBlock(result, 'optimizado');
        
        // Guardar los archivos generados
        this.savePerfFiles(perfSpec, perfType, perfAnalysis, perfOptimizations, perfCode);
      } catch (error) {
        console.error('❌ Error analizando rendimiento:', error);
        return;
      }
    } else {
      // Modo simulado para desarrollo
      console.log('🧪 Ejecutando en modo simulado');
      
      // Generar archivos simulados
      perfAnalysis = this.generateSimulatedPerfAnalysis(perfSpec, perfType);
      perfOptimizations = this.generateSimulatedPerfOptimizations(perfType);
      perfCode = this.generateSimulatedPerfCode(perfType, sourceCode);
      
      // Guardar los archivos simulados
      this.savePerfFiles(perfSpec, perfType, perfAnalysis, perfOptimizations, perfCode);
    }
    
    // Mostrar resultado
    console.log('\n✅ Análisis de rendimiento completado con éxito:');
    console.log('- performance-analysis.md');
    console.log('- performance-optimizations.md');
    console.log('- optimized-code.js');
  }
  
  /**
   * Determina el tipo de análisis de rendimiento basado en la especificación
   */
  private determinePerfType(perfSpec: string): 'frontend' | 'backend' | 'algorithm' {
    const frontendKeywords = ['frontend', 'react', 'vue', 'angular', 'dom', 'css', 'html', 'javascript', 'ui', 'interfaz', 'cliente', 'browser', 'navegador', 'renderizado', 'rendering'];
    const backendKeywords = ['backend', 'servidor', 'server', 'api', 'database', 'base de datos', 'node', 'express', 'django', 'flask', 'spring', 'microservicio', 'microservice', 'rest', 'graphql'];
    const algorithmKeywords = ['algoritmo', 'algorithm', 'estructura de datos', 'data structure', 'complejidad', 'complexity', 'big o', 'ordenamiento', 'sorting', 'búsqueda', 'search', 'recursión', 'recursion', 'optimización', 'optimization'];
    
    const lowerSpec = perfSpec.toLowerCase();
    
    // Contar ocurrencias de palabras clave
    const frontendCount = frontendKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    const backendCount = backendKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    const algorithmCount = algorithmKeywords.filter(keyword => lowerSpec.includes(keyword)).length;
    
    // Determinar el tipo basado en la mayor cantidad de palabras clave
    if (frontendCount > backendCount && frontendCount > algorithmCount) {
      return 'frontend';
    } else if (backendCount > algorithmCount) {
      return 'backend';
    } else {
      return 'algorithm';
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
   * Guarda los archivos de análisis de rendimiento
   */
  private savePerfFiles(
    perfSpec: string,
    perfType: 'frontend' | 'backend' | 'algorithm',
    perfAnalysis: string,
    perfOptimizations: string,
    perfCode: string
  ): void {
    // Crear directorio si no existe
    const perfDir = path.join(process.cwd(), 'performance');
    
    if (!fs.existsSync(perfDir)) {
      fs.mkdirSync(perfDir, { recursive: true });
    }
    
    // Guardar archivos
    fs.writeFileSync(path.join(perfDir, 'performance-analysis.md'), 
      `# Análisis de Rendimiento: ${perfSpec}\n\n${perfAnalysis}`, 'utf-8');
    
    fs.writeFileSync(path.join(perfDir, 'performance-optimizations.md'), 
      `# Recomendaciones de Optimización\n\n${perfOptimizations}`, 'utf-8');
    
    // Determinar nombre para el código optimizado
    let codeFileName = 'optimized-code.js';
    if (fs.existsSync(perfSpec) && !fs.lstatSync(perfSpec).isDirectory()) {
      const ext = path.extname(perfSpec);
      const baseName = path.basename(perfSpec, ext);
      codeFileName = `${baseName}.optimized${ext}`;
    }
    
    if (perfCode) {
      fs.writeFileSync(path.join(perfDir, codeFileName), perfCode, 'utf-8');
    }
  }
  
  /**
   * Genera análisis de rendimiento simulado
   */
  private generateSimulatedPerfAnalysis(perfSpec: string, perfType: 'frontend' | 'backend' | 'algorithm'): string {
    if (perfType === 'frontend') {
      return `## Análisis de Rendimiento Frontend

### 1. Tiempo de Carga Inicial
**Severidad: Alta**

La aplicación tarda aproximadamente 3.5 segundos en cargar completamente en una conexión 4G promedio. Esto supera el umbral recomendado de 2 segundos para una buena experiencia de usuario.

**Causas identificadas:**
- Tamaño excesivo de los bundles de JavaScript (2.3MB)
- Carga bloqueante de recursos CSS
- Imágenes no optimizadas
- Fuentes web cargadas ineficientemente

### 2. Renderizado Ineficiente
**Severidad: Media**

Se detectaron múltiples re-renderizados innecesarios en componentes React, especialmente en listas y componentes con estado complejo.

**Causas identificadas:**
- Uso incorrecto de dependencias en useEffect
- Falta de memoización en componentes y funciones
- Props innecesarias pasadas a componentes hijos
- Manejo ineficiente del estado global

### 3. Problemas de Interactividad
**Severidad: Media**

El First Input Delay (FID) es de aproximadamente 180ms, lo que indica una respuesta lenta a las interacciones del usuario.

**Causas identificadas:**
- Operaciones pesadas en el hilo principal
- Event listeners no optimizados
- Animaciones CSS complejas
- Manejo ineficiente de eventos de scroll

### 4. Problemas de Layout Shift
**Severidad: Baja**

El Cumulative Layout Shift (CLS) es de 0.15, lo que indica cambios visuales molestos durante la carga.

**Causas identificadas:**
- Imágenes sin dimensiones especificadas
- Contenido insertado dinámicamente sin reservar espacio
- Fuentes que cambian el tamaño del texto

### 5. Consumo Excesivo de Memoria
**Severidad: Media**

La aplicación consume aproximadamente 120MB de memoria en navegadores modernos, lo que puede ser problemático en dispositivos con recursos limitados.

**Causas identificadas:**
- Memory leaks en event listeners
- Caché de datos excesivo en el cliente
- Referencias circulares en objetos
- Imágenes cargadas a resoluciones mayores de las necesarias

## Métricas de Rendimiento

| Métrica | Valor Actual | Objetivo | Estado |
|---------|--------------|----------|--------|
| First Contentful Paint (FCP) | 1.8s | < 1.0s | ⚠️ |
| Largest Contentful Paint (LCP) | 2.7s | < 2.5s | ⚠️ |
| First Input Delay (FID) | 180ms | < 100ms | ⚠️ |
| Cumulative Layout Shift (CLS) | 0.15 | < 0.1 | ⚠️ |
| Time to Interactive (TTI) | 3.5s | < 2.0s | ❌ |
| Total Bundle Size | 2.3MB | < 1.0MB | ❌ |
| Memory Usage | 120MB | < 80MB | ⚠️ |`;
    } else if (perfType === 'backend') {
      return `## Análisis de Rendimiento Backend

### 1. Tiempos de Respuesta de API
**Severidad: Alta**

Los endpoints principales tienen tiempos de respuesta promedio de 850ms, con picos de hasta 2.5 segundos bajo carga moderada.

**Causas identificadas:**
- Consultas SQL no optimizadas
- Falta de índices en tablas críticas
- Procesamiento síncrono de operaciones I/O
- Carga excesiva de datos no utilizados (N+1 queries)

### 2. Uso Ineficiente de Recursos
**Severidad: Media**

El servidor utiliza aproximadamente 85% de CPU y 70% de memoria bajo carga moderada (50 usuarios concurrentes).

**Causas identificadas:**
- Operaciones de CPU intensivas en el hilo principal
- Manejo ineficiente de conexiones a base de datos
- Fugas de memoria en operaciones de larga duración
- Caché insuficiente para datos frecuentemente accedidos

### 3. Escalabilidad Limitada
**Severidad: Alta**

El sistema comienza a degradarse significativamente con más de 100 usuarios concurrentes, con tiempos de respuesta que aumentan exponencialmente.

**Causas identificadas:**
- Arquitectura monolítica con puntos únicos de fallo
- Bloqueos en recursos compartidos
- Falta de estrategias de throttling y rate limiting
- Conexiones de base de datos no agrupadas eficientemente

### 4. Problemas de Latencia en Base de Datos
**Severidad: Media**

Las consultas a la base de datos representan el 65% del tiempo total de respuesta.

**Causas identificadas:**
- Índices faltantes o mal diseñados
- Consultas que devuelven más datos de los necesarios
- Transacciones de larga duración que bloquean recursos
- Esquema de base de datos no normalizado adecuadamente

### 5. Manejo Ineficiente de Caché
**Severidad: Baja**

La tasa de aciertos de caché es solo del 45%, lo que resulta en consultas repetidas innecesarias.

**Causas identificadas:**
- Estrategia de invalidación de caché demasiado agresiva
- Datos no adecuados para cachear
- TTL (tiempo de vida) demasiado corto
- Falta de caché distribuido para entornos multi-instancia

## Métricas de Rendimiento

| Métrica | Valor Actual | Objetivo | Estado |
|---------|--------------|----------|--------|
| Tiempo Promedio de Respuesta | 850ms | < 300ms | ❌ |
| Tiempo de Respuesta p95 | 1.8s | < 800ms | ❌ |
| Throughput | 120 req/s | > 500 req/s | ❌ |
| Uso de CPU | 85% | < 60% | ⚠️ |
| Uso de Memoria | 70% | < 60% | ⚠️ |
| Tiempo Promedio de Consulta DB | 550ms | < 100ms | ❌ |
| Tasa de Aciertos de Caché | 45% | > 80% | ❌ |`;
    } else {
      return `## Análisis de Rendimiento de Algoritmos

### 1. Complejidad Temporal Ineficiente
**Severidad: Alta**

El algoritmo principal tiene una complejidad de O(n²) donde n es el tamaño del conjunto de datos. Con los volúmenes de datos actuales (n ≈ 10,000), esto resulta en tiempos de ejecución de aproximadamente 3.5 segundos.

**Causas identificadas:**
- Uso de bucles anidados para operaciones que podrían optimizarse
- Recálculo de valores que podrían memorizarse
- Ordenamiento ineficiente de datos
- Búsquedas lineales donde podrían usarse estructuras de datos más eficientes

### 2. Uso Ineficiente de Memoria
**Severidad: Media**

El algoritmo consume aproximadamente O(n) espacio adicional, con picos de hasta 500MB para conjuntos de datos grandes.

**Causas identificadas:**
- Creación de copias innecesarias de estructuras de datos
- Falta de liberación de referencias a objetos grandes
- Estructuras de datos no óptimas para el caso de uso
- Almacenamiento redundante de información

### 3. Operaciones I/O Bloqueantes
**Severidad: Media**

Las operaciones de lectura/escritura de archivos bloquean el hilo principal durante aproximadamente 800ms en total.

**Causas identificadas:**
- Lectura completa de archivos antes de procesamiento
- Escritura síncrona de resultados
- Falta de procesamiento por lotes (batch processing)
- Formato de datos ineficiente (JSON anidado complejo)

### 4. Procesamiento Secuencial Innecesario
**Severidad: Media**

Varias partes del algoritmo procesan datos secuencialmente cuando podrían paralelizarse.

**Causas identificadas:**
- Falta de uso de procesamiento paralelo para operaciones independientes
- Dependencias artificiales entre pasos del algoritmo
- Uso ineficiente de recursos de CPU multi-núcleo
- Granularidad demasiado fina en algunas operaciones paralelas

### 5. Estructuras de Datos Subóptimas
**Severidad: Alta**

El uso de arrays para búsquedas frecuentes resulta en operaciones O(n) que podrían ser O(1) o O(log n).

**Causas identificadas:**
- Uso de arrays donde hashmaps serían más eficientes
- Implementación ineficiente de árboles de búsqueda
- Falta de índices para datos frecuentemente consultados
- Estructuras de datos genéricas donde estructuras especializadas serían más eficientes

## Métricas de Rendimiento

| Métrica | Valor Actual | Objetivo | Estado |
|---------|--------------|----------|--------|
| Tiempo de Ejecución (n=10,000) | 3.5s | < 500ms | ❌ |
| Complejidad Temporal | O(n²) | O(n log n) | ❌ |
| Uso de Memoria | O(n) 500MB | O(log n) < 100MB | ⚠️ |
| Tiempo en Operaciones I/O | 800ms | < 200ms | ❌ |
| CPU Utilization | 25% (1 core) | > 70% (multi-core) | ⚠️ |`;
    }
  }
  
    /**
   * Genera código optimizado simulado
   */
  private generateSimulatedPerfCode(perfType: 'frontend' | 'backend' | 'algorithm', sourceCode?: string): string {
    if (perfType === 'frontend') {
      return `// Código optimizado para frontend
import React, { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import { throttle } from 'lodash-es';
import { FixedSizeList } from 'react-window';

// Componente con carga diferida
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Componente de lista optimizado
const OptimizedList = React.memo(({ items }) => {
  // Memoizar la función de renderizado de items
  const renderItem = useCallback(({ index, style }) => {
    const item = items[index];
    return (
      <div style={style} key={item.id} className="list-item">
        <h3>{item.title}</h3>
        <p>{item.description}</p>
      </div>
    );
  }, [items]);

  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={items.length}
      itemSize={50}
    >
      {renderItem}
    </FixedSizeList>
  );
});

// Componente principal optimizado
function App() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Cargar datos de forma eficiente
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        const result = await response.json();
        
        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchData();
    
    // Cleanup para evitar memory leaks
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Memoizar cálculos costosos
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      processed: item.value * 2
    }));
  }, [data]);
  
  // Throttle para eventos frecuentes
  const handleScroll = useCallback(throttle(() => {
    console.log('Scrolling optimized');
  }, 200), []);
  
  // Agregar event listener con cleanup
  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);
  
  if (isLoading) {
    return <div>Cargando...</div>;
  }
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>Aplicación Optimizada</h1>
      </header>
      
      <main>
        <OptimizedList items={processedData} />
        
        <Suspense fallback={<div>Cargando componente...</div>}>
          <HeavyComponent data={processedData} />
        </Suspense>
      </main>
    </div>
  );
}

export default App;`;
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
export async function performanceAgent(perfSpec: string): Promise<string> {
  const agent = new PerformanceAgent();
  await agent.run(perfSpec);
  return "Ejecutado con éxito";
}