import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';

/**
 * UI Design Agent - Crea sistemas de diseño coherentes
 * 
 * Este agente es responsable de:
 * 1. Definir paletas de colores y tipografía
 * 2. Diseñar componentes base UI
 * 3. Crear variables Tailwind personalizadas
 * 4. Asegurar accesibilidad (WCAG AA)
 * 5. Generar ejemplos visuales de implementación
 */
export class UIDesignAgent extends BaseAgent {
  constructor() {
    super('UI Design Agent');
  }
  
  /**
   * Ejecuta el UI Design Agent para crear un sistema de diseño
   * @param projectDescription Descripción del proyecto/módulo
   */
  async run(projectDescription: string): Promise<void> {
    console.log(`🎨 UI Design Agent creando sistema de diseño para: "${projectDescription}"`);
    
    // Leer contexto relevante
    const coreContext = this.readContext('core.md');
    const rulesContext = this.readContext('rules.md');
    
    // Crear prompt para el LLM
    const designPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Reglas Arquitectónicas
    ${rulesContext}
    
    # Tarea de UI Design Agent
    Actúa como el UI Design Agent de CJ.DevMind. Tu tarea es crear un sistema de diseño coherente para:
    
    "${projectDescription}"
    
    Genera:
    1. Paleta de colores con códigos hexadecimales
    2. Tipografía y escala de tamaños
    3. Componentes base (botones, inputs, cards, etc.)
    4. Variables Tailwind personalizadas
    5. Ejemplos visuales de componentes clave
    
    Asegúrate de que el diseño sea accesible (WCAG AA) y responsive. Justifica tus decisiones de diseño en términos de usabilidad, consistencia y alineación con la identidad del proyecto.
    
    Formatea tu respuesta en Markdown estructurado.
    `;
    
    // En modo real, consultaríamos al LLM
    let designSystem;
    
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      try {
        designSystem = await this.queryLLM(designPrompt);
        
        // Guardar el sistema de diseño en el directorio de contexto
        const designPath = path.join(this.contextPath, 'frontend', 'design-system.md');
        fs.writeFileSync(designPath, designSystem, 'utf-8');
        console.log(`✅ Sistema de diseño guardado en ${designPath}`);
        
        // Generar archivo de configuración Tailwind
        await this.generateTailwindConfig(designSystem);
      } catch (error) {
        console.error('❌ Error generando sistema de diseño:', error);
        return;
      }
    } else {
      // Modo simulado para desarrollo
      console.log('🧪 Ejecutando en modo simulado');
      
      // Sistema de diseño simulado
      designSystem = `
      # Sistema de Diseño: ${projectDescription}
      
      ## Paleta de Colores
      
      ### Colores Primarios
      - **Primary**: #3B82F6 (Azul)
      - **Secondary**: #10B981 (Verde)
      - **Accent**: #8B5CF6 (Púrpura)
      
      ### Colores Neutros
      - **Background**: #FFFFFF
      - **Surface**: #F9FAFB
      - **Border**: #E5E7EB
      - **Text Primary**: #111827
      - **Text Secondary**: #6B7280
      
      ### Estados
      - **Success**: #10B981
      - **Warning**: #FBBF24
      - **Error**: #EF4444
      - **Info**: #3B82F6
      
      ## Tipografía
      
      ### Fuentes
      - **Títulos**: Inter, sans-serif
      - **Cuerpo**: Inter, sans-serif
      - **Monoespaciada**: JetBrains Mono, monospace
      
      ### Escala de Tamaños
      - **xs**: 0.75rem (12px)
      - **sm**: 0.875rem (14px)
      - **base**: 1rem (16px)
      - **lg**: 1.125rem (18px)
      - **xl**: 1.25rem (20px)
      - **2xl**: 1.5rem (24px)
      - **3xl**: 1.875rem (30px)
      - **4xl**: 2.25rem (36px)
      
      ## Componentes Base
      
      ### Botones
      
      #### Primario
      \`\`\`html
      <button class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark focus:ring-2 focus:ring-primary focus:ring-opacity-50">
        Botón Primario
      </button>
      \`\`\`
      
      #### Secundario
      \`\`\`html
      <button class="bg-white text-primary border border-primary px-4 py-2 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-primary focus:ring-opacity-50">
        Botón Secundario
      </button>
      \`\`\`
      
      ### Inputs
      
      #### Texto
      \`\`\`html
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-medium mb-2" for="username">
          Username
        </label>
        <input class="shadow-sm appearance-none border rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" id="username" type="text" placeholder="Username">
      </div>
      \`\`\`
      
      ### Cards
      
      \`\`\`html
      <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 class="text-xl font-semibold text-gray-900 mb-2">Card Title</h3>
        <p class="text-gray-600 mb-4">This is a basic card component with a title and description.</p>
        <button class="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark">
          Action
        </button>
      </div>
      \`\`\`
      
      ## Variables Tailwind Personalizadas
      
      \`\`\`js
      // tailwind.config.js
      module.exports = {
        theme: {
          extend: {
            colors: {
              primary: '#3B82F6',
              'primary-dark': '#2563EB',
              secondary: '#10B981',
              'secondary-dark': '#059669',
              accent: '#8B5CF6',
              success: '#10B981',
              warning: '#FBBF24',
              error: '#EF4444',
              info: '#3B82F6',
            },
            fontFamily: {
              sans: ['Inter', 'sans-serif'],
              mono: ['JetBrains Mono', 'monospace'],
            },
          },
        },
      }
      \`\`\`
      
      ## Consideraciones de Accesibilidad
      
      - Todos los colores cumplen con un ratio de contraste mínimo de 4.5:1 para texto normal (WCAG AA)
      - Los componentes interactivos tienen estados de foco visibles
      - La jerarquía tipográfica es clara y consistente
      - Los componentes son navegables por teclado
      `;
      
      // Guardar el sistema de diseño simulado
      const designPath = path.join(this.contextPath, 'frontend', 'design-system.md');
      
      // Asegurar que el directorio existe
      const designDir = path.join(this.contextPath, 'frontend');
      if (!fs.existsSync(designDir)) {
        fs.mkdirSync(designDir, { recursive: true });
      }
      
      fs.writeFileSync(designPath, designSystem, 'utf-8');
      console.log(`✅ Sistema de diseño simulado guardado en ${designPath}`);
      
      // Generar archivo de configuración Tailwind simulado
      this.generateTailwindConfigSimulated();
    }
    
    // Mostrar resultado
    console.log('\n🎨 Sistema de Diseño Generado:\n');
    console.log(designSystem.slice(0, 500) + '...');
    console.log('\n✅ Revisa el archivo completo en context/frontend/design-system.md');
  }
  
  /**
   * Genera un archivo de configuración Tailwind basado en el sistema de diseño
   * @param designSystem Sistema de diseño en formato Markdown
   */
  private async generateTailwindConfig(designSystem: string): Promise<void> {
    // En una implementación real, extraeríamos las variables del sistema de diseño
    // y generaríamos un archivo tailwind.config.js
    
    // Para esta demo, usamos un prompt específico para el LLM
    const configPrompt = `
    Basado en el siguiente sistema de diseño, genera un archivo tailwind.config.js completo:
    
    ${designSystem}
    
    El archivo debe incluir:
    1. Extensiones de colores basadas en la paleta
    2. Configuración de fuentes
    3. Extensiones de espaciado si son relevantes
    4. Cualquier plugin necesario
    
    Devuelve solo el código JavaScript del archivo, sin explicaciones adicionales.
    `;
    
    try {
      const tailwindConfig = await this.queryLLM(configPrompt);
      
      // Extraer solo el código JavaScript (eliminar ```js y ```)
      const configCode = tailwindConfig
        .replace(/```js|```javascript/g, '')
        .replace(/```/g, '')
        .trim();
      
      // Guardar la configuración
      const configPath = path.join(process.cwd(), 'tailwind.config.js');
      fs.writeFileSync(configPath, configCode, 'utf-8');
      console.log(`✅ Configuración Tailwind guardada en ${configPath}`);
    } catch (error) {
      console.error('❌ Error generando configuración Tailwind:', error);
    }
  }
  
  /**
   * Genera un archivo de configuración Tailwind simulado
   */
  private generateTailwindConfigSimulated(): void {
    const tailwindConfig = `
    /** @type {import('tailwindcss').Config} */
    module.exports = {
      content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
      ],
      theme: {
        extend: {
          colors: {
            primary: '#3B82F6',
            'primary-dark': '#2563EB',
            secondary: '#10B981',
            'secondary-dark': '#059669',
            accent: '#8B5CF6',
            success: '#10B981',
            warning: '#FBBF24',
            error: '#EF4444',
            info: '#3B82F6',
          },
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          },
        },
      },
      plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
      ],
    }
    `;
    
    // Guardar la configuración simulada
    const configPath = path.join(process.cwd(), 'tailwind.config.js');
    fs.writeFileSync(configPath, tailwindConfig, 'utf-8');
    console.log(`✅ Configuración Tailwind simulada guardada en ${configPath}`);
  }
}

// Función auxiliar para mantener compatibilidad con código existente
export async function uiDesignAgent(projectDescription: string): Promise<string> {
  const agent = new UIDesignAgent();
  await agent.run(projectDescription);
  return "Ejecutado con éxito";
}