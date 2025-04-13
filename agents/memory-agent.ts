import { BaseAgent, AgentEventType, AgentOptions } from './base-agent';
import fs from 'fs';
import path from 'path';
import { PineconeClient } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { Document } from 'langchain/document';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { PineconeStore } from 'langchain/vectorstores/pinecone';
import { glob } from 'glob';

/**
 * Memory Agent - Sistema de memoria y conocimiento del proyecto
 * 
 * Este agente es responsable de:
 * 1. Generar embeddings para código y documentación
 * 2. Mantener una base de datos vectorial (Pinecone)
 * 3. Construir un grafo de conocimiento visualizable
 * 4. Registrar historial de cambios con justificaciones
 * 5. Proporcionar búsqueda semántica en el código base
 */
export class MemoryAgent extends BaseAgent {
  private pineconeClient: PineconeClient;
  private embeddings: OpenAIEmbeddings;
  private indexName: string = 'cj-devmind-memory';
  private namespace: string = 'default';
  private memoryDir: string;
  private graphsDir: string;
  private historyDir: string;
  
  constructor(options?: Partial<AgentOptions>) {
    super({
      name: 'Memory Agent',
      ...(options || {})
    });
    
    this.pineconeClient = new PineconeClient();
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
    
    // Inicializar directorios
    this.memoryDir = path.join(process.cwd(), 'memory');
    this.graphsDir = path.join(this.memoryDir, 'graphs');
    this.historyDir = path.join(this.memoryDir, 'history');
    
    // Crear directorios si no existen
    this.ensureDirectoryExists(this.memoryDir);
    this.ensureDirectoryExists(this.graphsDir);
    this.ensureDirectoryExists(this.historyDir);
  }
  
  /**
   * Asegura que un directorio exista
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }
  
  /**
   * Ejecuta el Memory Agent para gestionar la memoria del sistema
   * @param memorySpec Especificación de la operación de memoria a realizar
   */
  async run(memorySpec: string): Promise<void> {
    this.log(`🧠 Memory Agent trabajando en: "${memorySpec}"`);
    this.updateAgentStatus('working', `Procesando: ${memorySpec}`);
    
    try {
      // Inicializar Pinecone
      await this.initializePinecone();
      
      // Determinar la acción a realizar
      if (memorySpec === 'index') {
        await this.indexCodebase();
      } else if (memorySpec === 'query') {
        await this.queryMemory();
      } else if (memorySpec === 'graph') {
        await this.generateKnowledgeGraph();
      } else if (memorySpec.startsWith('search:')) {
        const query = memorySpec.substring(7).trim();
        await this.searchCodebase(query);
      } else if (memorySpec.startsWith('record:')) {
        const change = memorySpec.substring(7).trim();
        await this.recordChange(change);
      } else if (memorySpec.startsWith('analyze:')) {
        const target = memorySpec.substring(8).trim();
        await this.analyzeCodeStructure(target);
      } else if (memorySpec.startsWith('embed:')) {
        const content = memorySpec.substring(6).trim();
        await this.generateEmbedding(content);
      } else {
        this.log('⚠️ Operación no reconocida. Usa: index, query, graph, search:query, record:change, analyze:target, embed:content', 'warning');
      }
      
      this.updateAgentStatus('idle');
      this.log('✅ Operación completada con éxito');
    } catch (error) {
      this.log(`❌ Error en Memory Agent: ${error}`, 'error');
      this.updateAgentStatus('error', `Error: ${error}`);
      throw error;
    }
  }
  
  /**
   * Inicializa la conexión con Pinecone
   */
  private async initializePinecone(): Promise<void> {
    try {
      await this.pineconeClient.init({
        apiKey: process.env.PINECONE_API_KEY || '',
        environment: process.env.PINECONE_ENVIRONMENT || '',
      });
      
      // Verificar si el índice existe, si no, crearlo
      const existingIndexes = await this.pineconeClient.listIndexes();
      
      if (!existingIndexes.includes(this.indexName)) {
        this.log(`🔧 Creando índice ${this.indexName} en Pinecone...`);
        await this.pineconeClient.createIndex({
          createRequest: {
            name: this.indexName,
            dimension: 1536, // Dimensión para embeddings de OpenAI
            metric: 'cosine',
          },
        });
        this.log('✅ Índice creado correctamente');
      }
      
      this.log('🔌 Conexión con Pinecone establecida');
    } catch (error) {
      this.log('❌ Error al inicializar Pinecone:', 'error');
      throw error;
    }
  }
  
  /**
   * Indexa todo el código base del proyecto
   */
  private async indexCodebase(): Promise<void> {
    this.log('📑 Indexando código base...');
    
    try {
      // Obtener todos los archivos de código
      const files = await glob('**/*.{ts,tsx,js,jsx,md}', {
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        cwd: process.cwd(),
      });
      
      this.log(`🔍 Encontrados ${files.length} archivos para indexar`);
      
      // Procesar archivos en lotes para evitar sobrecargar la API
      const batchSize = 10;
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        await Promise.all(batch.map(file => this.indexFile(file)));
        this.log(`✅ Procesado lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(files.length / batchSize)}`);
      }
      
      this.log('🎉 Indexación completada con éxito');
    } catch (error) {
      this.log('❌ Error al indexar el código base:', 'error');
      throw error;
    }
  }
  
  /**
   * Indexa un archivo individual
   */
  private async indexFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Dividir el contenido en chunks para mejor procesamiento
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });
      
      const docs = await textSplitter.createDocuments([content], [{ source: filePath }]);
      
      // Crear metadatos adicionales
      const docsWithMetadata = docs.map(doc => {
        return new Document({
          pageContent: doc.pageContent,
          metadata: {
            ...doc.metadata,
            fileName: path.basename(filePath),
            fileType: path.extname(filePath).substring(1),
            lastModified: fs.statSync(fullPath).mtime.toISOString(),
            fileSize: fs.statSync(fullPath).size,
          },
        });
      });
      
      // Obtener el índice de Pinecone
      const index = this.pineconeClient.Index(this.indexName);
      
      // Almacenar en Pinecone
      await PineconeStore.fromDocuments(docsWithMetadata, this.embeddings, {
        pineconeIndex: index,
        namespace: this.namespace,
        textKey: 'text',
      });
      
      this.log(`📄 Indexado: ${filePath}`);
    } catch (error) {
      this.log(`❌ Error al indexar ${filePath}:`, 'error');
    }
  }
  
  /**
   * Consulta la memoria del sistema
   */
  private async queryMemory(): Promise<void> {
    this.log('🔍 Consultando memoria del sistema...');
    
    try {
      // Obtener estadísticas del índice
      const index = this.pineconeClient.Index(this.indexName);
      const stats = await index.describeIndexStats();
      
      this.log('📊 Estadísticas de la memoria:');
      this.log(`- Total de vectores: ${stats.totalVectorCount}`);
      this.log(`- Dimensión: ${stats.dimension}`);
      this.log(`- Namespaces: ${Object.keys(stats.namespaces).join(', ')}`);
      
      // Guardar estadísticas en un archivo
      const statsPath = path.join(this.contextPath, 'memory-stats.json');
      fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
      this.log(`📄 Estadísticas guardadas en: ${statsPath}`);
    } catch (error) {
      this.log('❌ Error al consultar la memoria:', 'error');
      throw error;
    }
  }
  
  /**
   * Genera un grafo de conocimiento visualizable
   */
  private async generateKnowledgeGraph(): Promise<void> {
    this.log('🕸️ Generando grafo de conocimiento...');
    
    try {
      // Obtener todos los archivos de código
      const files = await glob('**/*.{ts,tsx,js,jsx}', {
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
        cwd: process.cwd(),
      });
      
      // Analizar importaciones y relaciones entre archivos
      const graph = {
        nodes: [] as any[],
        links: [] as any[],
      };
      
      // Crear nodos para cada archivo
      files.forEach(file => {
        graph.nodes.push({
          id: file,
          group: this.getFileGroup(file),
          label: path.basename(file),
        });
      });
      
      // Analizar importaciones para crear enlaces
      for (const file of files) {
        const fullPath = path.join(process.cwd(), file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Buscar importaciones (patrón simple, podría mejorarse)
        const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
        let match;
        
        while ((match = importRegex.exec(content)) !== null) {
          const importPath = match[1];
          
          // Ignorar importaciones de bibliotecas
          if (!importPath.startsWith('.')) continue;
          
          // Resolver ruta relativa
          const resolvedPath = this.resolveImportPath(file, importPath);
          if (resolvedPath && files.includes(resolvedPath)) {
            graph.links.push({
              source: file,
              target: resolvedPath,
              value: 1,
            });
          }
        }
      }
      
      // Guardar grafo en un archivo JSON
      const graphPath = path.join(process.cwd(), 'dashboard', 'public', 'knowledge-graph.json');
      
      // Asegurar que el directorio existe
      const dir = path.dirname(graphPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2), 'utf-8');
      this.log(`📊 Grafo de conocimiento generado en: ${graphPath}`);
      
      // Generar componente de visualización para el dashboard
      this.generateGraphVisualization();
    } catch (error) {
      this.log('❌ Error al generar el grafo de conocimiento:', 'error');
      throw error;
    }
  }
  
  /**
   * Busca en el código base usando embeddings
   */
  private async searchCodebase(query: string): Promise<void> {
    this.log(`🔍 Buscando: "${query}" en el código base...`);
    
    try {
      // Obtener el índice de Pinecone
      const index = this.pineconeClient.Index(this.indexName);
      
      // Crear store de vectores
      const vectorStore = await PineconeStore.fromExistingIndex(this.embeddings, {
        pineconeIndex: index,
        namespace: this.namespace,
        textKey: 'text',
      });
      
      // Realizar búsqueda semántica
      const results = await vectorStore.similaritySearch(query, 5);
      
      this.log('🔎 Resultados de la búsqueda:');
      results.forEach((result, i) => {
        this.log(`\n--- Resultado ${i + 1} ---`);
        this.log(`Archivo: ${result.metadata.source}`);
        this.log(`Relevancia: Alta`);
        this.log(`Fragmento:\n${result.pageContent.substring(0, 200)}...`);
      });
      
      // Guardar resultados en un archivo
      const resultsPath = path.join(this.contextPath, 'search-results.json');
      fs.writeFileSync(
        resultsPath,
        JSON.stringify(
          results.map(r => ({
            source: r.metadata.source,
            content: r.pageContent,
            metadata: r.metadata,
          })),
          null,
          2
        ),
        'utf-8'
      );
      this.log(`📄 Resultados guardados en: ${resultsPath}`);
    } catch (error) {
      this.log('❌ Error al buscar en el código base:', 'error');
      throw error;
    }
  }
  
  /**
   * Registra un cambio en el historial con justificación
   */
  private async recordChange(change: string): Promise<void> {
    this.log(`📝 Registrando cambio: "${change}"`);
    
    try {
      // Parsear el cambio (formato esperado: "archivo:descripción")
      const [file, description] = change.split(':', 2);
      
      if (!file || !description) {
        this.log('❌ Formato incorrecto. Usa: "archivo:descripción"', 'error');
        return;
      }
      
      // Crear entrada de historial
      const historyEntry = {
        timestamp: new Date().toISOString(),
        file,
        description,
        agent: this.name,
      };
      
      // Leer historial existente o crear uno nuevo
      const historyPath = path.join(this.contextPath, 'change-history.json');
      let history = [];
      
      if (fs.existsSync(historyPath)) {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
      }
      
      // Añadir nueva entrada
      history.push(historyEntry);
      
      // Guardar historial actualizado
      fs.writeFileSync(historyPath, JSON.stringify(history, null, 2), 'utf-8');
      this.log(`✅ Cambio registrado en el historial`);
      
      // Actualizar embeddings para el archivo modificado
      if (fs.existsSync(path.join(process.cwd(), file))) {
        await this.indexFile(file);
        this.log(`🔄 Embeddings actualizados para: ${file}`);
      }
    } catch (error) {
      this.log('❌ Error al registrar el cambio:', 'error');
      throw error;
    }
  }
  
  /**
   * Genera componente de visualización del grafo para el dashboard
   */
  private generateGraphVisualization(): void {
    const componentPath = path.join(process.cwd(), 'dashboard', 'src', 'components', 'KnowledgeGraph.tsx');
    
    const componentCode = `import React, { useEffect, useRef } from 'react';
import ForceGraph3D from 'react-force-graph-3d';

interface GraphData {
  nodes: {
    id: string;
    group: number;
    label: string;
  }[];
  links: {
    source: string;
    target: string;
    value: number;
  }[];
}

const KnowledgeGraph: React.FC = () => {
  const graphRef = useRef<any>(null);
  const [graphData, setGraphData] = React.useState<GraphData | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  useEffect(() => {
    fetch('/knowledge-graph.json')
      .then(response => response.json())
      .then(data => {
        setGraphData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error cargando el grafo:', err);
        setError('Error al cargar el grafo de conocimiento');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (graphRef.current && graphData) {
      // Configurar el grafo una vez cargado
      graphRef.current.d3Force('charge').strength(-120);
    }
  }, [graphData, graphRef.current]);

  if (loading) return <div className="flex justify-center items-center h-96">Cargando grafo de conocimiento...</div>;
  if (error) return <div className="text-red-500 p-4">{error}</div>;
  if (!graphData) return <div className="p-4">No hay datos de grafo disponibles</div>;

  return (
    <div className="w-full h-[800px] border rounded-lg overflow-hidden">
      <ForceGraph3D
        ref={graphRef}
        graphData={graphData}
        nodeLabel="label"
        nodeColor={node => {
          const colors = [
            '#4285F4', // Azul - Agentes
            '#EA4335', // Rojo - CLI
            '#FBBC05', // Amarillo - Contexto
            '#34A853', // Verde - Utilidades
            '#8334A2', // Púrpura - Componentes
          ];
          return colors[(node as any).group % colors.length];
        }}
        nodeRelSize={6}
        linkWidth={1}
        linkDirectionalParticles={2}
        linkDirectionalParticleWidth={1.5}
        backgroundColor="#111827"
      />
    </div>
  );
};

export default KnowledgeGraph;`;

    // Asegurar que el directorio existe
    const dir = path.dirname(componentPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(componentPath, componentCode, 'utf-8');
    this.log(`📄 Componente de visualización generado en: ${componentPath}`);
  }
  
  /**
   * Determina el grupo al que pertenece un archivo
   */
  private getFileGroup(filePath: string): number {
    if (filePath.includes('/agents/')) return 0; // Agentes
    if (filePath.includes('/cli/')) return 1; // CLI
    if (filePath.includes('/context/')) return 2; // Contexto
    if (filePath.includes('/utils/')) return 3; // Utilidades
    if (filePath.includes('/components/')) return 4; // Componentes
    return 5; // Otros
  }
  
  /**
   * Resuelve una ruta de importación relativa
   */
  private resolveImportPath(currentFile: string, importPath: string): string | null {
    try {
      const currentDir = path.dirname(currentFile);
      let resolvedPath = path.join(currentDir, importPath);
      
      // Añadir extensión si no la tiene
      if (!path.extname(resolvedPath)) {
        // Probar con diferentes extensiones
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];
        for (const ext of extensions) {
          const pathWithExt = resolvedPath + ext;
          if (fs.existsSync(path.join(process.cwd(), pathWithExt))) {
            return pathWithExt;
          }
        }
        
        // Probar como directorio con index
        for (const ext of extensions) {
          const indexPath = path.join(resolvedPath, `index${ext}`);
          if (fs.existsSync(path.join(process.cwd(), indexPath))) {
            return indexPath;
          }
        }
      } else if (fs.existsSync(path.join(process.cwd(), resolvedPath))) {
        return resolvedPath;
      }
      
      return null;
    } catch (error) {
      this.log(`Error resolviendo ruta de importación: ${importPath}`, 'error');
      return null;
    }
  }
  
  /**
   * Analiza la estructura del código de un archivo o directorio
   * @param target Archivo o directorio a analizar
   */
  private async analyzeCodeStructure(target: string): Promise<void> {
    this.log(`🔍 Analizando estructura de código para: ${target}`);
    this.updateAgentStatus('working', `Analizando: ${target}`);
    
    try {
      const targetPath = path.join(process.cwd(), target);
      
      if (!fs.existsSync(targetPath)) {
        throw new Error(`La ruta ${target} no existe`);
      }
      
      const isDirectory = fs.statSync(targetPath).isDirectory();
      let files: string[] = [];
      
      if (isDirectory) {
        files = await glob('**/*.{ts,tsx,js,jsx}', {
          ignore: ['**/node_modules/**', '**/dist/**', '**/build/**'],
          cwd: targetPath,
        });
        files = files.map(file => path.join(target, file));
      } else {
        files = [target];
      }
      
      this.log(`📂 Analizando ${files.length} archivos...`);
      
      const analysis = {
        target,
        timestamp: new Date().toISOString(),
        files: [] as any[],
      };
      
      for (const file of files) {
        const fullPath = path.join(process.cwd(), file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        
        // Análisis básico de estructura
        const fileAnalysis = {
          path: file,
          size: fs.statSync(fullPath).size,
          lastModified: fs.statSync(fullPath).mtime.toISOString(),
          imports: [] as string[],
          exports: [] as string[],
          classes: [] as string[],
          functions: [] as string[],
          complexity: this.calculateComplexity(content),
        };
        
        // Extraer importaciones
        const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          fileAnalysis.imports.push(match[1]);
        }
        
        // Extraer exportaciones
        const exportRegex = /export\s+(const|class|function|interface|type|default)\s+(\w+)/g;
        while ((match = exportRegex.exec(content)) !== null) {
          fileAnalysis.exports.push(match[2]);
        }
        
        // Extraer clases
        const classRegex = /class\s+(\w+)/g;
        while ((match = classRegex.exec(content)) !== null) {
          fileAnalysis.classes.push(match[1]);
        }
        
        // Extraer funciones
        const functionRegex = /function\s+(\w+)/g;
        while ((match = functionRegex.exec(content)) !== null) {
          fileAnalysis.functions.push(match[1]);
        }
        
        analysis.files.push(fileAnalysis);
      }
      
      // Guardar análisis
      const analysisPath = path.join(this.memoryDir, 'analysis', `${path.basename(target)}-analysis.json`);
      this.ensureDirectoryExists(path.dirname(analysisPath));
      fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2), 'utf-8');
      
      this.log(`✅ Análisis completado y guardado en: ${analysisPath}`);
      
      // Notificar a otros agentes
      this.sendMessage('all', AgentEventType.RESOURCE_CREATED, {
        type: 'code-analysis',
        path: analysisPath,
        analysis: analysis,
      });
      
      // Generar visualización del análisis
      await this.generateAnalysisVisualization(analysis);
    } catch (error) {
      this.log(`❌ Error al analizar estructura de código: ${error}`, 'error');
      throw error;
    }
  }
  
  /**
   * Calcula la complejidad de un fragmento de código
   * @param content Contenido del código
   */
  private calculateComplexity(content: string): number {
    // Métricas simples de complejidad
    const lines = content.split('\n').length;
    const conditionals = (content.match(/if|else|switch|case|for|while|do/g) || []).length;
    const functions = (content.match(/function|\=\>|\=\s*\(.*?\)\s*\=\>/g) || []).length;
    const classes = (content.match(/class\s+\w+/g) || []).length;
    
    // Fórmula simple de complejidad
    return Math.round((lines / 100) * 0.3 + conditionals * 0.5 + functions * 0.7 + classes * 1.0);
  }
  
  /**
   * Genera una visualización del análisis de código
   * @param analysis Análisis de código
   */
  private async generateAnalysisVisualization(analysis: any): Promise<void> {
    this.log('📊 Generando visualización del análisis...');
    
    try {
      // Crear grafo de dependencias
      const graph = {
        nodes: [] as any[],
        links: [] as any[],
      };
      
      // Añadir nodos para cada archivo
      analysis.files.forEach(file => {
        graph.nodes.push({
          id: file.path,
          group: this.getFileGroup(file.path),
          label: path.basename(file.path),
          size: Math.min(20, Math.max(5, file.complexity / 2)),
          complexity: file.complexity,
        });
      });
      
      // Añadir enlaces basados en importaciones
      analysis.files.forEach(file => {
        file.imports.forEach(importPath => {
          if (importPath.startsWith('.')) {
            const resolvedPath = this.resolveImportPath(file.path, importPath);
            if (resolvedPath) {
              const targetFile = analysis.files.find(f => f.path === resolvedPath);
              if (targetFile) {
                graph.links.push({
                  source: file.path,
                  target: resolvedPath,
                  value: 1,
                });
              }
            }
          }
        });
      });
      
      // Guardar grafo
      const graphPath = path.join(this.graphsDir, `${path.basename(analysis.target)}-graph.json`);
      fs.writeFileSync(graphPath, JSON.stringify(graph, null, 2), 'utf-8');
      
      this.log(`✅ Visualización del análisis generada: ${graphPath}`);
      
      // Generar HTML interactivo
      await this.generateInteractiveVisualization(graph, analysis.target);
    } catch (error) {
      this.log(`⚠️ Error al generar visualización: ${error}`, 'warning');
    }
  }
  
  /**
   * Genera una visualización interactiva HTML
   * @param graph Grafo de dependencias
   * @param target Objetivo del análisis
   */
  private async generateInteractiveVisualization(graph: any, target: string): Promise<void> {
    const htmlPath = path.join(this.graphsDir, `${path.basename(target)}-visualization.html`);
    
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Análisis de Código: ${target}</title>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #ddd;
      padding-bottom: 10px;
    }
        #graph {
      width: 100%;
      height: 600px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #fff;
    }
    .node {
      fill: #69b3a2;
      stroke: #fff;
      stroke-width: 2px;
    }
    .link {
      stroke: #999;
      stroke-opacity: 0.6;
    }
    .node-label {
      font-size: 12px;
      pointer-events: none;
    }
    .info-panel {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 300px;
      background-color: rgba(255, 255, 255, 0.9);
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 15px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    .info-title {
      font-weight: bold;
      margin-bottom: 10px;
      border-bottom: 1px solid #eee;
      padding-bottom: 5px;
    }
    .info-content {
      font-size: 14px;
    }
    .info-item {
      margin-bottom: 5px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Análisis de Código: ${target}</h1>
    <div id="graph"></div>
    <div class="info-panel">
      <div class="info-title">Información</div>
      <div class="info-content">
        <div class="info-item">Selecciona un nodo para ver detalles</div>
      </div>
    </div>
  </div>

  <script>
    // Datos del grafo
    const graphData = ${JSON.stringify(graph)};
    
    // Configuración del grafo
    const width = document.getElementById('graph').clientWidth;
    const height = document.getElementById('graph').clientHeight;
    
    // Crear simulación de fuerzas
    const simulation = d3.forceSimulation(graphData.nodes)
      .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));
    
    // Crear SVG
    const svg = d3.select('#graph')
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Crear enlaces
    const link = svg.append('g')
      .selectAll('line')
      .data(graphData.links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke-width', d => Math.sqrt(d.value));
    
    // Crear nodos
    const node = svg.append('g')
      .selectAll('circle')
      .data(graphData.nodes)
      .enter()
      .append('circle')
      .attr('class', 'node')
      .attr('r', d => d.size || 5)
      .attr('fill', d => {
        const colors = [
          '#4285F4', // Azul - Agentes
          '#EA4335', // Rojo - CLI
          '#FBBC05', // Amarillo - Contexto
          '#34A853', // Verde - Utilidades
          '#8334A2', // Púrpura - Componentes
        ];
        return colors[d.group % colors.length];
      })
      .call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
    
    // Añadir etiquetas
    const label = svg.append('g')
      .selectAll('text')
      .data(graphData.nodes)
      .enter()
      .append('text')
      .attr('class', 'node-label')
      .attr('dx', 12)
      .attr('dy', '.35em')
      .text(d => d.label);
    
    // Actualizar posiciones en cada tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);
      
      label
        .attr('x', d => d.x)
        .attr('y', d => d.y);
    });
    
    // Mostrar información al hacer clic en un nodo
    node.on('click', function(event, d) {
      const infoContent = document.querySelector('.info-content');
      infoContent.innerHTML = \`
        <div class="info-item"><strong>Archivo:</strong> \${d.label}</div>
        <div class="info-item"><strong>Ruta:</strong> \${d.id}</div>
        <div class="info-item"><strong>Complejidad:</strong> \${d.complexity}</div>
      \`;
    });
    
    // Funciones para el arrastre de nodos
    function dragstarted(event, d) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragended(event, d) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  </script>
</body>
</html>`;
    
    fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
    this.log(`✅ Visualización interactiva generada: ${htmlPath}`);
  }
  
  /**
   * Genera embedding para un contenido específico
   * @param content Contenido a embedear
   */
  private async generateEmbedding(content: string): Promise<void> {
    this.log('🧠 Generando embedding para contenido...');
    
    try {
      // Crear documento
      const doc = new Document({
        pageContent: content,
        metadata: {
          source: 'manual-input',
          timestamp: new Date().toISOString(),
        },
      });
      
      // Generar embedding
      const embedding = await this.embeddings.embedDocuments([doc.pageContent]);
      
      // Guardar embedding
      const embeddingPath = path.join(this.memoryDir, 'embeddings', `manual-${Date.now()}.json`);
      this.ensureDirectoryExists(path.dirname(embeddingPath));
      
      fs.writeFileSync(
        embeddingPath,
        JSON.stringify({
          content: doc.pageContent,
          embedding: embedding[0],
          metadata: doc.metadata,
        }, null, 2),
        'utf-8'
      );
      
      this.log(`✅ Embedding generado y guardado en: ${embeddingPath}`);
      
      // Opcional: almacenar en Pinecone
      const index = this.pineconeClient.Index(this.indexName);
      await PineconeStore.fromDocuments([doc], this.embeddings, {
        pineconeIndex: index,
        namespace: 'manual-embeddings',
        textKey: 'text',
      });
      
      this.log('✅ Embedding almacenado en Pinecone');
    } catch (error) {
      this.log(`❌ Error al generar embedding: ${error}`, 'error');
      throw error;
    }
  }
}

// Función auxiliar para mantener compatibilidad con código existente
export async function memoryAgent(memorySpec: string): Promise<string> {
  const agent = new MemoryAgent();
  await agent.run(memorySpec);
  return "Memory Agent ejecutado con éxito";
}