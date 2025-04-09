import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';

export class DocAgent extends BaseAgent {
  constructor() {
    super('Doc Agent');
  }
  
  // Utilidad: obtener archivos .ts/.tsx de un módulo
  private getModuleFiles(modulePath: string): string[] {
    try {
      return fs
        .readdirSync(modulePath)
        .filter(file => file.endsWith(".ts") || file.endsWith(".tsx"))
        .map(file => path.join(modulePath, file));
    } catch (error) {
      console.error(`Error leyendo directorio ${modulePath}:`, error);
      return [];
    }
  }
  
  // Generador de documentación con LLM
  private async generateDocFromCode(fileContent: string, fileName: string): Promise<string> {
    // En modo real, usaríamos el LLM
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      const prompt = `
      # Tarea de Documentación
      
      Genera documentación completa para el siguiente archivo de código:
      Nombre del archivo: ${fileName}
      
      \`\`\`typescript
      ${fileContent}
      \`\`\`
      
      La documentación debe incluir:
      1. Descripción general del archivo
      2. Funciones/clases principales y su propósito
      3. Parámetros y tipos de retorno
      4. Ejemplos de uso si es relevante
      
      Formato la salida en Markdown.
      `;
      
      return await this.queryLLM(prompt);
    } else {
      // Modo simulación para desarrollo
      return `## 📄 Documentación de ${fileName}

Este archivo contiene funciones, clases o componentes clave del módulo.

> ⚠️ Documentación generada automáticamente. Revisar antes de publicar.

\`\`\`ts
${fileContent.slice(0, 400)}...
\`\`\`
`;
    }
  }
  
  async run(modulePath: string): Promise<void> {
    console.log("📚 Generando documentación del módulo:", modulePath);
    
    // Verificar que el path existe
    const fullPath = path.resolve(modulePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ Error: El path ${fullPath} no existe`);
      return;
    }
    
    const files = this.getModuleFiles(fullPath);
    if (files.length === 0) {
      console.log("⚠️ No se encontraron archivos .ts/.tsx en el módulo");
      return;
    }
    
    const docsOutputPath = path.join(fullPath, "README.generated.md");
    
    // Generar documentación para cada archivo
    const allDocsPromises = files.map(async file => {
      const content = fs.readFileSync(file, "utf-8");
      return await this.generateDocFromCode(content, path.basename(file));
    });
    
    // Esperar a que todas las promesas se resuelvan
    const allDocs = (await Promise.all(allDocsPromises)).join("\n\n---\n\n");
    
    // Escribir la documentación generada
    fs.writeFileSync(docsOutputPath, allDocs, "utf-8");
    console.log(`✅ Documentación generada en: ${docsOutputPath}`);
  }
}

// Función auxiliar para mantener compatibilidad
export async function runDocAgent(modulePath: string): Promise<void> {
  const agent = new DocAgent();
  await agent.run(modulePath);
}
