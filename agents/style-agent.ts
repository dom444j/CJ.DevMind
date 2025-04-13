import { BaseAgent, AgentEventType, AgentOptions, AgentMessage } from './base-agent';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface DesignSystem {
  colors: Record<string, string>;
  typography: Record<string, any>;
  spacing: Record<string, string>;
  borderRadius: Record<string, string>;
  shadows?: Record<string, string>;
  transitions?: Record<string, string>;
  breakpoints?: Record<string, string>;
  zIndex?: Record<string, number>;
}

interface StyleOptions {
  framework?: 'css' | 'scss' | 'tailwind' | 'styled-components' | 'emotion';
  darkMode?: boolean;
  responsive?: boolean;
  prefix?: string;
  accessibility?: {
    contrastRatio: number;
    focusVisible: boolean;
    reduceMotion: boolean;
  };
}

export class StyleAgent extends BaseAgent {
  private designSystem: DesignSystem = {
    colors: {},
    typography: {},
    spacing: {},
    borderRadius: {},
  };
  private themesDir: string = path.join(process.cwd(), 'themes');
  private lastGeneratedThemes: string[] = [];
  private styleOptions: StyleOptions = {
    framework: 'css',
    darkMode: true,
    responsive: true,
    prefix: 'cj',
    accessibility: {
      contrastRatio: 4.5,
      focusVisible: true,
      reduceMotion: true,
    }
  };
  private projectRoot: string;

  constructor(options?: AgentOptions) {
    super({
      name: 'Style Agent',
      description: 'Gestiona el sistema de diseño, temas y estilos de la aplicación',
      ...options
    });
    this.projectRoot = options?.projectRoot || process.cwd();
    this.themesDir = path.join(this.projectRoot, 'themes');
    this.registerEventHandlers();
    this.loadDesignSystem();
  }

  private registerEventHandlers(): void {
    // Escuchar solicitudes de actualización del sistema de diseño
    this.listenForEvent(AgentEventType.DESIGN_SYSTEM_REQUESTED, async (message) => {
      this.log(`🎨 Solicitud de sistema de diseño recibida de ${message.from}`);
      this.sendEvent(AgentEventType.DESIGN_SYSTEM_UPDATED, {
        designSystem: this.designSystem,
        timestamp: new Date().toISOString(),
      }, message.from);
    });

    // Escuchar solicitudes de generación de temas
    this.listenForEvent(AgentEventType.THEME_REQUESTED, async (message) => {
      this.log(`🎨 Solicitud de tema recibida de ${message.from}: "${message.content.themeSpec}"`);
      try {
        const themeName = await this.generateTheme(message.content.themeSpec);
        this.sendEvent(AgentEventType.THEME_CREATED, {
          themeName,
          path: path.join(this.themesDir, `${themeName}.ts`),
          timestamp: new Date().toISOString(),
        }, message.from);
      } catch (error) {
        this.log(`❌ Error generando tema: ${error.message}`, 'error');
        this.sendEvent(AgentEventType.THEME_ERROR, {
          error: error.message,
          spec: message.content.themeSpec,
          timestamp: new Date().toISOString(),
        }, message.from);
      }
    });

    // Escuchar solicitudes de componentes estilizados
    this.listenForEvent(AgentEventType.STYLED_COMPONENT_REQUESTED, async (message) => {
      this.log(`🎨 Solicitud de componente estilizado recibida de ${message.from}`);
      try {
        const { componentName, componentSpec, framework } = message.content;
        const componentCode = await this.generateStyledComponent(componentName, componentSpec, framework);
        this.sendEvent(AgentEventType.STYLED_COMPONENT_CREATED, {
          componentName,
          code: componentCode,
          timestamp: new Date().toISOString(),
        }, message.from);
      } catch (error) {
        this.log(`❌ Error generando componente estilizado: ${error.message}`, 'error');
        this.sendEvent(AgentEventType.STYLED_COMPONENT_ERROR, {
          error: error.message,
          spec: message.content.componentSpec,
          timestamp: new Date().toISOString(),
        }, message.from);
      }
    });

    // Escuchar solicitudes de análisis de accesibilidad
    this.listenForEvent(AgentEventType.ACCESSIBILITY_CHECK_REQUESTED, async (message) => {
      this.log(`🔍 Solicitud de análisis de accesibilidad recibida de ${message.from}`);
      try {
        const { cssCode, htmlCode } = message.content;
        const accessibilityReport = await this.analyzeAccessibility(cssCode, htmlCode);
        this.sendEvent(AgentEventType.ACCESSIBILITY_CHECK_COMPLETED, {
          report: accessibilityReport,
          timestamp: new Date().toISOString(),
        }, message.from);
      } catch (error) {
        this.log(`❌ Error analizando accesibilidad: ${error.message}`, 'error');
        this.sendEvent(AgentEventType.ACCESSIBILITY_CHECK_ERROR, {
          error: error.message,
          timestamp: new Date().toISOString(),
        }, message.from);
      }
    });
  }

  private loadDesignSystem(): void {
    const designSystemPath = path.join(this.projectRoot, 'context', 'frontend/design-system.md');
    if (fs.existsSync(designSystemPath)) {
      const content = fs.readFileSync(designSystemPath, 'utf-8');
      this.designSystem = this.parseDesignSystem(content);
    } else {
      this.designSystem = {
        colors: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#8B5CF6',
          background: '#FFFFFF',
          text: '#1F2937',
          error: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          info: '#3B82F6',
        },
        typography: {
          fontFamily: 'sans-serif',
          fontSize: { 
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem',
            '2xl': '1.5rem',
            '3xl': '1.875rem',
            '4xl': '2.25rem',
          },
          fontWeight: {
            light: 300,
            normal: 400,
            medium: 500,
            semibold: 600,
            bold: 700,
          },
          lineHeight: {
            none: 1,
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75,
            loose: 2,
          }
        },
        spacing: { 
          xs: '0.25rem',
          sm: '0.5rem',
          md: '1rem',
          lg: '1.5rem',
          xl: '2rem',
          '2xl': '3rem',
          '3xl': '4rem',
        },
        borderRadius: { 
          none: '0',
          sm: '0.125rem',
          md: '0.25rem',
          lg: '0.5rem',
          xl: '1rem',
          full: '9999px',
        },
        shadows: {
          none: 'none',
          sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        transitions: {
          default: 'all 0.3s ease',
          fast: 'all 0.15s ease',
          slow: 'all 0.5s ease',
        },
        breakpoints: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1536px',
        },
        zIndex: {
          auto: 'auto',
          0: 0,
          10: 10,
          20: 20,
          30: 30,
          40: 40,
          50: 50,
        }
      };
    }
    this.log('🎨 Sistema de diseño cargado');
  }

  private parseDesignSystem(content: string): DesignSystem {
    try {
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      return jsonMatch ? JSON.parse(jsonMatch[1]) : this.designSystem;
    } catch (error) {
      this.log('⚠️ Error parseando sistema de diseño, usando valores por defecto', 'warning');
      return this.designSystem;
    }
  }

  async generateTheme(themeSpec: string): Promise<string> {
    this.log(`🎨 Generando tema: "${themeSpec}"`);
    this.updateAgentStatus('working', 'Generando tema');

    const themeName = this.extractThemeName(themeSpec);
    if (!fs.existsSync(this.themesDir)) {
      fs.mkdirSync(this.themesDir, { recursive: true });
    }

    // Determinar si es un tema oscuro
    const isDarkTheme = themeSpec.toLowerCase().includes('dark') || 
                        themeSpec.toLowerCase().includes('oscuro') ||
                        themeSpec.toLowerCase().includes('noche');

    // Generar código del tema
    const themeCode = await this.generateThemeCode(themeName, themeSpec, isDarkTheme);
    const themePath = path.join(this.themesDir, `${themeName}.ts`);
    fs.writeFileSync(themePath, themeCode, 'utf-8');

    // Generar versión CSS si se requiere
    if (this.styleOptions.framework === 'css' || this.styleOptions.framework === 'scss') {
      const cssThemePath = path.join(this.themesDir, `${themeName}.${this.styleOptions.framework}`);
      const cssThemeCode = await this.generateCSSTheme(themeName, isDarkTheme);
      fs.writeFileSync(cssThemePath, cssThemeCode, 'utf-8');
      this.log(`✅ Tema CSS generado: ${cssThemePath}`);
    }

    this.lastGeneratedThemes.push(themeName);
    this.log(`✅ Tema generado: ${themePath}`);
    this.updateAgentStatus('idle');
    
    // Registrar recurso creado
    this.recordResource('theme', themePath);
    
    return themeName;
  }

  private extractThemeName(themeSpec: string): string {
    const match = themeSpec.match(/name:\s*([a-zA-Z0-9]+)/);
    return match ? match[1] : 'CustomTheme';
  }

  private async generateThemeCode(themeName: string, themeSpec: string, isDarkTheme: boolean = false): Promise<string> {
    // Si el tema es complejo, usar LLM para generar colores basados en la especificación
    if (themeSpec.length > 20 && themeSpec.includes(' ')) {
      try {
        const prompt = `
        # Tarea: Generación de Paleta de Colores
        
        Genera una paleta de colores para un tema llamado "${themeName}" con la siguiente descripción:
        "${themeSpec}"
        
        El tema debe ser ${isDarkTheme ? 'oscuro' : 'claro'}.
        
        Devuelve solo un objeto JSON con la siguiente estructura:
        {
          "colors": {
            "primary": "#hex",
            "secondary": "#hex",
            "accent": "#hex",
            "background": "#hex",
            "text": "#hex",
            "error": "#hex",
            "warning": "#hex",
            "success": "#hex",
            "info": "#hex"
          }
        }
        `;
        
        const response = await this.queryLLM(prompt);
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                          response.match(/\{[\s\S]*\}/);
                          
        if (jsonMatch) {
          const colorsPalette = JSON.parse(jsonMatch[1] || jsonMatch[0]);
          
          // Actualizar colores con los generados por el LLM
          if (colorsPalette.colors) {
            return `
/**
 * Tema ${themeName}
 * Generado automáticamente basado en: "${themeSpec}"
 */
export const ${themeName} = {
  colors: {
    primary: '${colorsPalette.colors.primary || this.designSystem.colors.primary}',
    secondary: '${colorsPalette.colors.secondary || this.designSystem.colors.secondary}',
    accent: '${colorsPalette.colors.accent || this.designSystem.colors.accent}',
    background: '${colorsPalette.colors.background || (isDarkTheme ? '#121212' : '#FFFFFF')}',
    text: '${colorsPalette.colors.text || (isDarkTheme ? '#E0E0E0' : '#1F2937')}',
    error: '${colorsPalette.colors.error || this.designSystem.colors.error}',
    warning: '${colorsPalette.colors.warning || this.designSystem.colors.warning}',
    success: '${colorsPalette.colors.success || this.designSystem.colors.success}',
    info: '${colorsPalette.colors.info || this.designSystem.colors.info}',
  },
  typography: {
    fontFamily: '${this.designSystem.typography.fontFamily || 'sans-serif'}',
    fontSize: {
      xs: '${this.designSystem.typography.fontSize?.xs || '0.75rem'}',
      sm: '${this.designSystem.typography.fontSize?.sm || '0.875rem'}',
      base: '${this.designSystem.typography.fontSize?.base || '1rem'}',
      lg: '${this.designSystem.typography.fontSize?.lg || '1.125rem'}',
      xl: '${this.designSystem.typography.fontSize?.xl || '1.25rem'}',
      '2xl': '${this.designSystem.typography.fontSize?.['2xl'] || '1.5rem'}',
    },
    fontWeight: {
      light: ${this.designSystem.typography.fontWeight?.light || 300},
      normal: ${this.designSystem.typography.fontWeight?.normal || 400},
      medium: ${this.designSystem.typography.fontWeight?.medium || 500},
      semibold: ${this.designSystem.typography.fontWeight?.semibold || 600},
      bold: ${this.designSystem.typography.fontWeight?.bold || 700},
    },
  },
  spacing: {
    xs: '${this.designSystem.spacing.xs || '0.25rem'}',
    sm: '${this.designSystem.spacing.sm || '0.5rem'}',
    md: '${this.designSystem.spacing.md || '1rem'}',
    lg: '${this.designSystem.spacing.lg || '1.5rem'}',
    xl: '${this.designSystem.spacing.xl || '2rem'}',
  },
  borderRadius: {
    none: '${this.designSystem.borderRadius.none || '0'}',
    sm: '${this.designSystem.borderRadius.sm || '0.125rem'}',
    md: '${this.designSystem.borderRadius.md || '0.25rem'}',
    lg: '${this.designSystem.borderRadius.lg || '0.5rem'}',
    xl: '${this.designSystem.borderRadius.xl || '1rem'}',
    full: '${this.designSystem.borderRadius.full || '9999px'}',
  },
  shadows: {
    none: '${this.designSystem.shadows?.none || 'none'}',
    sm: '${this.designSystem.shadows?.sm || '0 1px 2px 0 rgba(0, 0, 0, 0.05)'}',
    md: '${this.designSystem.shadows?.md || '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'}',
    lg: '${this.designSystem.shadows?.lg || '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'}',
  },
  isDark: ${isDarkTheme},
};

export default ${themeName};
`;
          }
        }
      } catch (error) {
        this.log(`⚠️ Error generando paleta de colores con LLM: ${error.message}`, 'warning');
      }
    }
    
    // Código por defecto si no se pudo generar con LLM
    return `
/**
 * Tema ${themeName}
 */
export const ${themeName} = {
  colors: {
    primary: '${this.designSystem.colors.primary || '#3B82F6'}',
    secondary: '${this.designSystem.colors.secondary || '#10B981'}',
    accent: '${this.designSystem.colors.accent || '#8B5CF6'}',
    background: '${isDarkTheme ? '#121212' : '#FFFFFF'}',
    text: '${isDarkTheme ? '#E0E0E0' : '#1F2937'}',
    error: '${this.designSystem.colors.error || '#EF4444'}',
    warning: '${this.designSystem.colors.warning || '#F59E0B'}',
    success: '${this.designSystem.colors.success || '#10B981'}',
    info: '${this.designSystem.colors.info || '#3B82F6'}',
  },
  typography: {
    fontFamily: '${this.designSystem.typography.fontFamily || 'sans-serif'}',
    fontSize: {
      base: '${this.designSystem.typography.fontSize?.base || '1rem'}',
    },
  },
  spacing: {
    md: '${this.designSystem.spacing.md || '1rem'}',
  },
  borderRadius: {
    md: '${this.designSystem.borderRadius.md || '0.25rem'}',
  },
  isDark: ${isDarkTheme},
};

export default ${themeName};
`;
  }

  private async generateCSSTheme(themeName: string, isDarkTheme: boolean = false): Promise<string> {
    // Cargar el tema generado
    const themePath = path.join(this.themesDir, `${themeName}.ts`);
    if (!fs.existsSync(themePath)) {
      throw new Error(`El tema ${themeName} no existe`);
    }

    // Generar CSS basado en el tema
    const prefix = this.styleOptions.prefix;
    const extension = this.styleOptions.framework === 'scss' ? 'scss' : 'css';
    
    // Crear variables CSS
    let cssContent = `/* 
 * Tema ${themeName} 
 * Generado automáticamente por StyleAgent
 */\n\n`;
    
    if (this.styleOptions.darkMode && isDarkTheme) {
      cssContent += `@media (prefers-color-scheme: dark) {\n`;
      cssContent += `  :root {\n`;
    } else {
      cssContent += `:root {\n`;
    }
    
    // Añadir variables de color
    Object.entries(this.designSystem.colors).forEach(([key, value]) => {
      cssContent += `  --${prefix}-color-${key}: ${value};\n`;
    });
    
    // Añadir variables de tipografía
    cssContent += `  --${prefix}-font-family: ${this.designSystem.typography.fontFamily};\n`;
    Object.entries(this.designSystem.typography.fontSize || {}).forEach(([key, value]) => {
      cssContent += `  --${prefix}-font-size-${key}: ${value};\n`;
    });
    
    // Añadir variables de espaciado
    Object.entries(this.designSystem.spacing).forEach(([key, value]) => {
      cssContent += `  --${prefix}-spacing-${key}: ${value};\n`;
    });
    
    // Añadir variables de border-radius
    Object.entries(this.designSystem.borderRadius).forEach(([key, value]) => {
      cssContent += `  --${prefix}-border-radius-${key}: ${value};\n`;
    });
    
    // Añadir variables de sombras si existen
    if (this.designSystem.shadows) {
      Object.entries(this.designSystem.shadows).forEach(([key, value]) => {
        cssContent += `  --${prefix}-shadow-${key}: ${value};\n`;
      });
    }
    
    // Cerrar el bloque de variables
    cssContent += `}\n\n`;
    
    if (this.styleOptions.darkMode && isDarkTheme) {
      cssContent += `}\n\n`;
    }
    
    // Añadir clases de utilidad si es necesario
    if (extension === 'scss') {
      cssContent += this.generateSCSSUtilities(prefix);
    } else {
      cssContent += this.generateCSSUtilities(prefix);
    }
    
    return cssContent;
  }
  
  private generateCSSUtilities(prefix: string): string {
    let utilities = `/* Clases de utilidad */\n\n`;
    
    // Clases para colores
    utilities += `/* Colores */\n`;
    Object.keys(this.designSystem.colors).forEach(key => {
      utilities += `.${prefix}-bg-${key} { background-color: var(--${prefix}-color-${key}); }\n`;
      utilities += `.${prefix}-text-${key} { color: var(--${prefix}-color-${key}); }\n`;
      utilities += `.${prefix}-border-${key} { border-color: var(--${prefix}-color-${key}); }\n`;
    });
    
    utilities += `\n/* Tipografía */\n`;
    Object.keys(this.designSystem.typography.fontSize || {}).forEach(key => {
      utilities += `.${prefix}-text-${key} { font-size: var(--${prefix}-font-size-${key}); }\n`;
    });
    
    utilities += `\n/* Espaciado */\n`;
    Object.keys(this.designSystem.spacing).forEach(key => {
      utilities += `.${prefix}-m-${key} { margin: var(--${prefix}-spacing-${key}); }\n`;
      utilities += `.${prefix}-p-${key} { padding: var(--${prefix}-spacing-${key}); }\n`;
    });
    
    utilities += `\n/* Border Radius */\n`;
    Object.keys(this.designSystem.borderRadius).forEach(key => {
      utilities += `.${prefix}-rounded-${key} { border-radius: var(--${prefix}-border-radius-${key}); }\n`;
    });
    
    return utilities;
  }
  
  private generateSCSSUtilities(prefix: string): string {
    let utilities = `/* SCSS Mixins y Variables */\n\n`;
    
    // Mixins para colores
    utilities += `@mixin ${prefix}-bg($color) {\n`;
    utilities += `  background-color: var(--#{$prefix}-color-#{$color});\n`;
    utilities += `}\n\n`;
    
    utilities += `@mixin ${prefix}-text($color) {\n`;
    utilities += `  color: var(--#{$prefix}-color-#{$color});\n`;
    utilities += `}\n\n`;
    
    // Mixins para espaciado
    utilities += `@mixin ${prefix}-spacing($type, $size) {\n`;
    utilities += `  #{$type}: var(--#{$prefix}-spacing-#{$size});\n`;
    utilities += `}\n\n`;
    
    // Mixins para border-radius
    utilities += `@mixin ${prefix}-rounded($size) {\n`;
    utilities += `  border-radius: var(--#{$prefix}-border-radius-#{$size});\n`;
    utilities += `}\n\n`;
    
    return utilities;
  }

  /**
   * Genera un componente estilizado basado en una especificación
   */
  async generateStyledComponent(componentName: string, componentSpec: string, framework: string = 'react'): Promise<string> {
    this.log(`🎨 Generando componente estilizado: ${componentName}`);
    this.updateAgentStatus('working', 'Generando componente estilizado');
    
    try {
      const prompt = `
      # Tarea: Generación de Componente Estilizado
      
      Genera un componente ${framework} llamado "${componentName}" con la siguiente descripción:
      "${componentSpec}"
      
      Utiliza el siguiente sistema de diseño:
      ${JSON.stringify(this.designSystem, null, 2)}
      
      El componente debe:
      1. Ser accesible (WCAG 2.1 AA)
      2. Ser responsive
      3. Soportar tema claro y oscuro
      4. Utilizar las variables del sistema de diseño
      
      Devuelve solo el código del componente sin explicaciones adicionales.
      `;
      
      const response = await this.queryLLM(prompt);
      
      // Extraer el código del componente
      const codeMatch = response.match(/```(?:jsx|tsx|javascript|typescript)\n([\s\S]*?)\n```/) || 
                        response.match(/```\n([\s\S]*?)\n```/);
                        
      if (codeMatch) {
        const componentCode = codeMatch[1];
        
        // Guardar el componente
        const componentsDir = path.join(this.projectRoot, 'src', 'components');
        if (!fs.existsSync(componentsDir)) {
          fs.mkdirSync(componentsDir, { recursive: true });
        }
        
        const componentPath = path.join(componentsDir, `${componentName}.${framework === 'react' ? 'tsx' : 'vue'}`);
        fs.writeFileSync(componentPath, componentCode, 'utf-8');
        
        this.log(`✅ Componente estilizado guardado en: ${componentPath}`);
        this.updateAgentStatus('idle');
        
        // Registrar recurso creado
        this.recordResource('component', componentPath);
        
        // Notificar al ComponentAgent
        this.sendEvent(AgentEventType.COMPONENT_CREATED, {
          componentName,
          path: componentPath,
          type: 'styled',
          timestamp: new Date().toISOString(),
        }, 'component');
        
        return componentCode;
      } else {
        throw new Error('No se pudo extraer el código del componente de la respuesta del LLM');
      }
    } catch (error) {
      this.log(`❌ Error generando componente estilizado: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error generando componente: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analiza la accesibilidad de un código CSS y HTML
   */
  async analyzeAccessibility(cssCode: string, htmlCode: string): Promise<any> {
    this.log('🔍 Analizando accesibilidad');
    this.updateAgentStatus('working', 'Analizando accesibilidad');
    
    try {
      const prompt = `
      # Tarea: Análisis de Accesibilidad
      
      Analiza el siguiente código CSS y HTML para identificar problemas de accesibilidad:
      
      ## CSS
      \`\`\`css
      ${cssCode}
      \`\`\`
      
      ## HTML
      \`\`\`html
      ${htmlCode}
      \`\`\`
      
      Evalúa los siguientes aspectos:
      1. Contraste de color (WCAG 2.1 AA requiere 4.5:1 para texto normal)
      2. Tamaño de fuente y legibilidad
      3. Navegación por teclado y foco visible
      4. Estructura semántica del HTML
      5. Atributos ARIA y roles
      6. Soporte para lectores de pantalla
      7. Reducción de movimiento
      
      Devuelve un objeto JSON con los problemas encontrados y sugerencias de mejora.
      `;
      
      const response = await this.queryLLM(prompt);
      
      // Extraer el JSON de la respuesta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/\{[\s\S]*\}/);
                        
      if (jsonMatch) {
        const accessibilityReport = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        
        // Guardar el reporte
        const reportsDir = path.join(this.projectRoot, 'reports');
        if (!fs.existsSync(reportsDir)) {
          fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const reportPath = path.join(reportsDir, `accessibility-${new Date().toISOString().replace(/:/g, '-')}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(accessibilityReport, null, 2), 'utf-8');
        
        this.log(`✅ Reporte de accesibilidad guardado en: ${reportPath}`);
        this.updateAgentStatus('idle');
        
        // Registrar recurso creado
        this.recordResource('report', reportPath);
        
        return accessibilityReport;
      } else {
        throw new Error('No se pudo extraer el reporte de accesibilidad de la respuesta del LLM');
      }
    } catch (error) {
      this.log(`❌ Error analizando accesibilidad: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error analizando accesibilidad: ${error.message}`);
      throw error;
    }
  }

  /**
   * Exporta el sistema de diseño a diferentes formatos
   */
  async exportDesignSystem(format: 'css' | 'scss' | 'tailwind' | 'styled-components' | 'emotion' = 'css'): Promise<string> {
    this.log(`📦 Exportando sistema de diseño a formato ${format}`);
    this.updateAgentStatus('working', 'Exportando sistema de diseño');
    
    try {
      let exportedCode = '';
      const exportDir = path.join(this.projectRoot, 'src', 'styles');
      
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      switch (format) {
        case 'css':
          exportedCode = this.exportToCSS();
          fs.writeFileSync(path.join(exportDir, 'design-system.css'), exportedCode, 'utf-8');
          break;
        case 'scss':
          exportedCode = this.exportToSCSS();
          fs.writeFileSync(path.join(exportDir, 'design-system.scss'), exportedCode, 'utf-8');
          break;
        case 'tailwind':
          exportedCode = this.exportToTailwind();
          fs.writeFileSync(path.join(exportDir, 'tailwind.config.js'), exportedCode, 'utf-8');
          break;
        case 'styled-components':
          exportedCode = this.exportToStyledComponents();
          fs.writeFileSync(path.join(exportDir, 'theme.ts'), exportedCode, 'utf-8');
          break;
        case 'emotion':
          exportedCode = this.exportToEmotion();
          fs.writeFileSync(path.join(exportDir, 'theme.ts'), exportedCode, 'utf-8');
          break;
      }
      
      this.log(`✅ Sistema de diseño exportado a: ${path.join(exportDir, format === 'css' ? 'design-system.css' : format === 'scss' ? 'design-system.scss' : format === 'tailwind' ? 'tailwind.config.js' : 'theme.ts')}`);
      this.updateAgentStatus('idle');
      
      // Registrar recurso creado
      this.recordResource('style', path.join(exportDir, format === 'css' ? 'design-system.css' : format === 'scss' ? 'design-system.scss' : format === 'tailwind' ? 'tailwind.config.js' : 'theme.ts'));
      
      return exportedCode;
    } catch (error) {
      this.log(`❌ Error exportando sistema de diseño: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error exportando sistema de diseño: ${error.message}`);
      throw error;
    }
  }
  
  private exportToCSS(): string {
    const prefix = this.styleOptions.prefix;
    let cssContent = `/* 
 * Sistema de Diseño CJ.DevMind
 * Generado automáticamente por StyleAgent
 */\n\n`;
    
    cssContent += `:root {\n`;
    
    // Variables de color
    cssContent += `  /* Colors */\n`;
    Object.entries(this.designSystem.colors).forEach(([key, value]) => {
      cssContent += `  --${prefix}-color-${key}: ${value};\n`;
    });
    
    // Variables de tipografía
    cssContent += `\n  /* Typography */\n`;
    cssContent += `  --${prefix}-font-family: ${this.designSystem.typography.fontFamily};\n`;
    Object.entries(this.designSystem.typography.fontSize || {}).forEach(([key, value]) => {
      cssContent += `  --${prefix}-font-size-${key}: ${value};\n`;
    });
    Object.entries(this.designSystem.typography.fontWeight || {}).forEach(([key, value]) => {
      cssContent += `  --${prefix}-font-weight-${key}: ${value};\n`;
    });
    Object.entries(this.designSystem.typography.lineHeight || {}).forEach(([key, value]) => {
      cssContent += `  --${prefix}-line-height-${key}: ${value};\n`;
    });
    
    // Variables de espaciado
    cssContent += `\n  /* Spacing */\n`;
    Object.entries(this.designSystem.spacing).forEach(([key, value]) => {
      cssContent += `  --${prefix}-spacing-${key}: ${value};\n`;
    });
    
    // Variables de border-radius
    cssContent += `\n  /* Border Radius */\n`;
    Object.entries(this.designSystem.borderRadius).forEach(([key, value]) => {
      cssContent += `  --${prefix}-border-radius-${key}: ${value};\n`;
    });
    
    // Variables de sombras
    if (this.designSystem.shadows) {
      cssContent += `\n  /* Shadows */\n`;
      Object.entries(this.designSystem.shadows).forEach(([key, value]) => {
        cssContent += `  --${prefix}-shadow-${key}: ${value};\n`;
      });
    }
    
    // Variables de transiciones
    if (this.designSystem.transitions) {
      cssContent += `\n  /* Transitions */\n`;
      Object.entries(this.designSystem.transitions).forEach(([key, value]) => {
        cssContent += `  --${prefix}-transition-${key}: ${value};\n`;
      });
    }
    
    // Variables de breakpoints
    if (this.designSystem.breakpoints) {
      cssContent += `\n  /* Breakpoints */\n`;
      Object.entries(this.designSystem.breakpoints).forEach(([key, value]) => {
        cssContent += `  --${prefix}-breakpoint-${key}: ${value};\n`;
      });
    }
    
    // Variables de z-index
    if (this.designSystem.zIndex) {
      cssContent += `\n  /* Z-Index */\n`;
      Object.entries(this.designSystem.zIndex).forEach(([key, value]) => {
        cssContent += `  --${prefix}-z-index-${key}: ${value};\n`;
      });
    }
    
    cssContent += `}\n\n`;
    
    // Tema oscuro
    if (this.styleOptions.darkMode) {
      cssContent += `@media (prefers-color-scheme: dark) {\n`;
      cssContent += `  :root {\n`;
      cssContent += `    --${prefix}-color-background: #121212;\n`;
      cssContent += `    --${prefix}-color-text: #E0E0E0;\n`;
      cssContent += `  }\n`;
      cssContent += `}\n\n`;
    }
    
    // Clases de utilidad
    cssContent += this.generateCSSUtilities(prefix);
    
    return cssContent;
  }
  
  private exportToSCSS(): string {
    const prefix = this.styleOptions.prefix;
    let scssContent = `/* 
 * Sistema de Diseño CJ.DevMind (SCSS)
 * Generado automáticamente por StyleAgent
 */\n\n`;
    
    // Variables SCSS
    scssContent += `// Variables\n`;
    
    // Colores
    scssContent += `$${prefix}-colors: (\n`;
    Object.entries(this.designSystem.colors).forEach(([key, value], index, array) => {
      scssContent += `  '${key}': ${value}${index < array.length - 1 ? ',' : ''}\n`;
    });
    scssContent += `);\n\n`;
    
    // Tipografía
    scssContent += `$${prefix}-font-family: ${this.designSystem.typography.fontFamily};\n\n`;
    
    scssContent += `$${prefix}-font-sizes: (\n`;
    Object.entries(this.designSystem.typography.fontSize || {}).forEach(([key, value], index, array) => {
      scssContent += `  '${key}': ${value}${index < array.length - 1 ? ',' : ''}\n`;
    });
    scssContent += `);\n\n`;
    
    scssContent += `$${prefix}-font-weights: (\n`;
    Object.entries(this.designSystem.typography.fontWeight || {}).forEach(([key, value], index, array) => {
      scssContent += `  '${key}': ${value}${index < array.length - 1 ? ',' : ''}\n`;
    });
    scssContent += `);\n\n`;
    
    // Espaciado
    scssContent += `$${prefix}-spacing: (\n`;
    Object.entries(this.designSystem.spacing).forEach(([key, value], index, array) => {
      scssContent += `  '${key}': ${value}${index < array.length - 1 ? ',' : ''}\n`;
    });
    scssContent += `);\n\n`;
    
    // Border Radius
    scssContent += `$${prefix}-border-radius: (\n`;
    Object.entries(this.designSystem.borderRadius).forEach(([key, value], index, array) => {
      scssContent += `  '${key}': ${value}${index < array.length - 1 ? ',' : ''}\n`;
    });
    scssContent += `);\n\n`;
    
    // Mixins
    scssContent += this.generateSCSSUtilities(prefix);
    
    // Generación de variables CSS
    scssContent += `:root {\n`;
    scssContent += `  @each $name, $value in $${prefix}-colors {\n`;
    scssContent += `    --#{$prefix}-color-#{$name}: #{$value};\n`;
    scssContent += `  }\n\n`;
    
    scssContent += `  --#{$prefix}-font-family: #{$${prefix}-font-family};\n\n`;
    
    scssContent += `  @each $name, $value in $${prefix}-font-sizes {\n`;
    scssContent += `    --#{$prefix}-font-size-#{$name}: #{$value};\n`;
    scssContent += `  }\n\n`;
    
    scssContent += `  @each $name, $value in $${prefix}-spacing {\n`;
    scssContent += `    --#{$prefix}-spacing-#{$name}: #{$value};\n`;
    scssContent += `  }\n\n`;
    
    scssContent += `  @each $name, $value in $${prefix}-border-radius {\n`;
    scssContent += `    --#{$prefix}-border-radius-#{$name}: #{$value};\n`;
    scssContent += `  }\n`;
    scssContent += `}\n\n`;
    
    // Tema oscuro
    if (this.styleOptions.darkMode) {
      scssContent += `@media (prefers-color-scheme: dark) {\n`;
      scssContent += `  :root {\n`;
      scssContent += `    --#{$prefix}-color-background: #121212;\n`;
      scssContent += `    --#{$prefix}-color-text: #E0E0E0;\n`;
      scssContent += `  }\n`;
      scssContent += `}\n\n`;
    }
    
    return scssContent;
  }
  
  private exportToTailwind(): string {
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
${Object.entries(this.designSystem.colors).map(([key, value]) => `        ${key}: '${value}',`).join('\n')}
      },
      fontFamily: {
        sans: ['${this.designSystem.typography.fontFamily || 'sans-serif'}', 'sans-serif'],
      },
      fontSize: {
${Object.entries(this.designSystem.typography.fontSize || {}).map(([key, value]) => `        ${key}: '${value}',`).join('\n')}
      },
      fontWeight: {
${Object.entries(this.designSystem.typography.fontWeight || {}).map(([key, value]) => `        ${key}: ${value},`).join('\n')}
      },
      spacing: {
${Object.entries(this.designSystem.spacing).map(([key, value]) => `        ${key}: '${value}',`).join('\n')}
      },
      borderRadius: {
${Object.entries(this.designSystem.borderRadius).map(([key, value]) => `        ${key}: '${value}',`).join('\n')}
      },
${this.designSystem.shadows ? `      boxShadow: {
${Object.entries(this.designSystem.shadows).map(([key, value]) => `        ${key}: '${value}',`).join('\n')}
      },` : ''}
${this.designSystem.zIndex ? `      zIndex: {
${Object.entries(this.designSystem.zIndex).map(([key, value]) => `        ${key}: ${value},`).join('\n')}
      },` : ''}
    },
  },
  plugins: [],
  darkMode: ${this.styleOptions.darkMode ? "'media'" : 'false'},
}
`;
    
    return tailwindConfig;
  }
  
  private exportToStyledComponents(): string {
    const theme = `// Sistema de Diseño para styled-components
// Generado automáticamente por StyleAgent

export const theme = {
  colors: {
${Object.entries(this.designSystem.colors).map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },
  typography: {
    fontFamily: '${this.designSystem.typography.fontFamily || 'sans-serif'}',
    fontSize: {
${Object.entries(this.designSystem.typography.fontSize || {}).map(([key, value]) => `      ${key}: '${value}',`).join('\n')}
    },
    fontWeight: {
${Object.entries(this.designSystem.typography.fontWeight || {}).map(([key, value]) => `      ${key}: ${value},`).join('\n')}
    },
    lineHeight: {
${Object.entries(this.designSystem.typography.lineHeight || {}).map(([key, value]) => `      ${key}: ${value},`).join('\n')}
    },
  },
  spacing: {
${Object.entries(this.designSystem.spacing).map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },
  borderRadius: {
${Object.entries(this.designSystem.borderRadius).map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },
${this.designSystem.shadows ? `  shadows: {
${Object.entries(this.designSystem.shadows).map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },` : ''}
${this.designSystem.transitions ? `  transitions: {
${Object.entries(this.designSystem.transitions).map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },` : ''}
${this.designSystem.breakpoints ? `  breakpoints: {
${Object.entries(this.designSystem.breakpoints).map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },` : ''}
${this.designSystem.zIndex ? `  zIndex: {
${Object.entries(this.designSystem.zIndex).map(([key, value]) => `    ${key}: ${value},`).join('\n')}
  },` : ''}
};

export default theme;

// Ejemplo de uso:
// import { ThemeProvider } from 'styled-components';
// import { theme } from './theme';
//
// const App = () => (
//   <ThemeProvider theme={theme}>
//     <YourComponent />
//   </ThemeProvider>
// );
`;
    
    return theme;
  }
  
  private exportToEmotion(): string {
    // Similar a styled-components pero con sintaxis de emotion
    const theme = `// Sistema de Diseño para emotion
// Generado automáticamente por StyleAgent

export const theme = {
  colors: {
${Object.entries(this.designSystem.colors).map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },
  typography: {
    fontFamily: '${this.designSystem.typography.fontFamily || 'sans-serif'}',
    fontSize: {
${Object.entries(this.designSystem.typography.fontSize || {}).map(([key, value]) => `      ${key}: '${value}',`).join('\n')}
    },
    fontWeight: {
${Object.entries(this.designSystem.typography.fontWeight || {}).map(([key, value]) => `      ${key}: ${value},`).join('\n')}
    },
    lineHeight: {
${Object.entries(this.designSystem.typography.lineHeight || {}).map(([key, value]) => `      ${key}: ${value},`).join('\n')}
    },
  },
  spacing: {
${Object.entries(this.designSystem.spacing).map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },
  borderRadius: {
${Object.entries(this.designSystem.borderRadius).map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },
${this.designSystem.shadows ? `  shadows: {
${Object.entries(this.designSystem.shadows).map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },` : ''}
${this.designSystem.transitions ? `  transitions: {
${Object.entries(this.designSystem.transitions).map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },` : ''}
${this.designSystem.breakpoints ? `  breakpoints: {
${Object.entries(this.designSystem.breakpoints).map(([key, value]) => `    ${key}: '${value}',`).join('\n')}
  },` : ''}
${this.designSystem.zIndex ? `  zIndex: {
${Object.entries(this.designSystem.zIndex).map(([key, value]) => `    ${key}: ${value},`).join('\n')}
  },` : ''}
};

export default theme;

// Ejemplo de uso:
// import { ThemeProvider } from '@emotion/react';
// import { theme } from './theme';
//
// const App = () => (
//   <ThemeProvider theme={theme}>
//     <YourComponent />
//   </ThemeProvider>
// );
`;
    
    return theme;
  }

  /**
   * Genera un tema oscuro/claro automáticamente basado en un tema existente
   */
  async generateAlternateTheme(themeName: string, targetMode: 'dark' | 'light'): Promise<string> {
    this.log(`🌓 Generando tema ${targetMode} basado en ${themeName}`);
    this.updateAgentStatus('working', `Generando tema ${targetMode}`);
    
    try {
      // Cargar el tema original
      const themePath = path.join(this.themesDir, `${themeName}.ts`);
      if (!fs.existsSync(themePath)) {
        throw new Error(`El tema ${themeName} no existe`);
      }
      
      // Leer el contenido del tema
      const themeContent = fs.readFileSync(themePath, 'utf-8');
      
      // Determinar el nombre del nuevo tema
      const newThemeName = `${themeName}${targetMode === 'dark' ? 'Dark' : 'Light'}`;
      
      // Generar el tema alternativo con LLM
      const prompt = `
      # Tarea: Generación de Tema ${targetMode.charAt(0).toUpperCase() + targetMode.slice(1)}
      
      Basado en el siguiente tema:
      \`\`\`typescript
      ${themeContent}
      \`\`\`
      
      Genera un tema ${targetMode} equivalente. Sigue estas reglas:
      
      1. Si el tema original es claro, oscurece los colores para el tema oscuro:
         - Fondos claros -> Fondos oscuros (ej: #FFFFFF -> #121212)
         - Texto oscuro -> Texto claro (ej: #000000 -> #E0E0E0)
         - Mantén los colores de acento pero ajusta su luminosidad
      
      2. Si el tema original es oscuro, aclara los colores para el tema claro:
         - Fondos oscuros -> Fondos claros (ej: #121212 -> #FFFFFF)
         - Texto claro -> Texto oscuro (ej: #E0E0E0 -> #000000)
         - Mantén los colores de acento pero ajusta su luminosidad
      
      3. Mantén la misma estructura y propiedades, solo cambia los valores de color.
      
      4. Asegúrate de que el contraste sea adecuado para accesibilidad (WCAG 2.1 AA).
      
      5. Establece la propiedad isDark correctamente.
      
      Devuelve solo el código TypeScript del nuevo tema.
      `;
      
      const response = await this.queryLLM(prompt);
      
      // Extraer el código del tema
      const codeMatch = response.match(/```(?:typescript|tsx|javascript|ts)\n([\s\S]*?)\n```/) || 
                        response.match(/```\n([\s\S]*?)\n```/);
                        
      if (codeMatch) {
        const themeCode = codeMatch[1];
        
        // Guardar el nuevo tema
        const newThemePath = path.join(this.themesDir, `${newThemeName}.ts`);
        fs.writeFileSync(newThemePath, themeCode, 'utf-8');
        
        this.log(`✅ Tema ${targetMode} generado y guardado en: ${newThemePath}`);
        this.updateAgentStatus('idle');
        
        // Registrar recurso creado
        this.recordResource('theme', newThemePath);
        
        return themeCode;
      } else {
        throw new Error(`No se pudo extraer el código del tema ${targetMode} de la respuesta del LLM`);
      }
    } catch (error) {
      this.log(`❌ Error generando tema ${targetMode}: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error generando tema ${targetMode}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera una paleta de colores basada en un color primario
   */
  async generateColorPalette(primaryColor: string, mode: 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'monochromatic' = 'analogous'): Promise<Record<string, string>> {
    this.log(`🎨 Generando paleta de colores ${mode} basada en ${primaryColor}`);
    this.updateAgentStatus('working', 'Generando paleta de colores');
    
    try {
      const prompt = `
      # Tarea: Generación de Paleta de Colores
      
      Genera una paleta de colores ${mode} basada en el color primario: ${primaryColor}
      
      La paleta debe incluir:
      - primary: El color base proporcionado
      - secondary: Un color secundario que complemente al primario según el modo ${mode}
      - accent: Un color de acento que destaque
      - background: Un color de fondo apropiado (claro)
      - backgroundDark: Un color de fondo para modo oscuro
      - text: Un color de texto apropiado para fondos claros
      - textDark: Un color de texto para fondos oscuros
      - success: Un color para indicar éxito
      - warning: Un color para indicar advertencia
      - error: Un color para indicar error
      - info: Un color para información
      
      Asegúrate de que todos los colores tengan suficiente contraste entre sí y cumplan con los estándares de accesibilidad WCAG 2.1 AA.
      
      Devuelve un objeto JSON con los nombres de los colores y sus valores hexadecimales.
      `;
      
      const response = await this.queryLLM(prompt);
      
      // Extraer el JSON de la respuesta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/\{[\s\S]*\}/);
                        
      if (jsonMatch) {
        const colorPalette = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        
        // Actualizar el sistema de diseño con la nueva paleta
        this.designSystem.colors = {
          ...this.designSystem.colors,
          ...colorPalette
        };
        
        // Guardar la paleta
        const palettesDir = path.join(this.projectRoot, 'src', 'styles', 'palettes');
        if (!fs.existsSync(palettesDir)) {
          fs.mkdirSync(palettesDir, { recursive: true });
        }
        
        const palettePath = path.join(palettesDir, `${mode}-${primaryColor.replace('#', '')}.json`);
        fs.writeFileSync(palettePath, JSON.stringify(colorPalette, null, 2), 'utf-8');
        
        this.log(`✅ Paleta de colores guardada en: ${palettePath}`);
        this.updateAgentStatus('idle');
        
        // Registrar recurso creado
        this.recordResource('palette', palettePath);
        
        return colorPalette;
      } else {
        throw new Error('No se pudo extraer la paleta de colores de la respuesta del LLM');
      }
    } catch (error) {
      this.log(`❌ Error generando paleta de colores: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error generando paleta: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera un conjunto de iconos SVG para el proyecto
   */
  async generateIconSet(iconNames: string[], style: 'outline' | 'filled' | 'duotone' = 'outline'): Promise<Record<string, string>> {
    this.log(`🔍 Generando conjunto de iconos en estilo ${style}`);
    this.updateAgentStatus('working', 'Generando iconos');
    
    try {
      const icons: Record<string, string> = {};
      
      // Procesar cada icono
      for (const iconName of iconNames) {
        const prompt = `
        # Tarea: Generación de Icono SVG
        
        Genera un icono SVG para "${iconName}" en estilo "${style}".
        
        Requisitos:
        - Tamaño base: 24x24 pixels
        - Viewbox: 0 0 24 24
        - Estilo minimalista y moderno
        - Sin colores (usa "currentColor")
        - Optimizado para web (sin metadatos innecesarios)
        - Compatible con accesibilidad
        
        Devuelve solo el código SVG sin explicaciones adicionales.
        `;
        
        const response = await this.queryLLM(prompt);
        
        // Extraer el SVG de la respuesta
        const svgMatch = response.match(/<svg[\s\S]*<\/svg>/);
        
        if (svgMatch) {
          const svgCode = svgMatch[0];
          icons[iconName] = svgCode;
          
          // Guardar el icono
          const iconsDir = path.join(this.projectRoot, 'src', 'assets', 'icons');
          if (!fs.existsSync(iconsDir)) {
            fs.mkdirSync(iconsDir, { recursive: true });
          }
          
          const iconPath = path.join(iconsDir, `${iconName}.svg`);
          fs.writeFileSync(iconPath, svgCode, 'utf-8');
          
          this.log(`✅ Icono ${iconName} guardado en: ${iconPath}`);
          
          // Registrar recurso creado
          this.recordResource('icon', iconPath);
        } else {
          this.log(`⚠️ No se pudo extraer el SVG para el icono ${iconName}`, 'warning');
        }
      }
      
      // Generar un índice de iconos
      const indexContent = `// Índice de iconos generado por StyleAgent
export const icons = {
${Object.entries(icons).map(([name, svg]) => `  ${name}: \`${svg}\`,`).join('\n')}
};

export default icons;
`;
      
      const indexPath = path.join(this.projectRoot, 'src', 'assets', 'icons', 'index.ts');
      fs.writeFileSync(indexPath, indexContent, 'utf-8');
      
      this.log(`✅ Índice de iconos guardado en: ${indexPath}`);
      this.updateAgentStatus('idle');
      
      // Registrar recurso creado
      this.recordResource('index', indexPath);
      
      return icons;
    } catch (error) {
      this.log(`❌ Error generando conjunto de iconos: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error generando iconos: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera un componente de tema para React/Vue
   */
  async generateThemeProvider(framework: 'react' | 'vue' = 'react'): Promise<string> {
    this.log(`🔧 Generando ThemeProvider para ${framework}`);
    this.updateAgentStatus('working', `Generando ThemeProvider para ${framework}`);
    
    try {
      const prompt = `
      # Tarea: Generación de ThemeProvider
      
      Genera un componente ThemeProvider para ${framework} que:
      
      1. Proporcione un contexto de tema para toda la aplicación
      2. Soporte cambio entre tema claro y oscuro
      3. Persista la preferencia del usuario en localStorage
      4. Respete la preferencia del sistema (prefers-color-scheme)
      5. Exponga un hook/composable para acceder y modificar el tema
      
      Utiliza el siguiente sistema de diseño:
      ${JSON.stringify(this.designSystem, null, 2)}
      
      Devuelve solo el código del componente sin explicaciones adicionales.
      `;
      
      const response = await this.queryLLM(prompt);
      
      // Extraer el código del componente
      const codeMatch = response.match(/```(?:jsx|tsx|vue|javascript|typescript)\n([\s\S]*?)\n```/) || 
                        response.match(/```\n([\s\S]*?)\n```/);
                        
      if (codeMatch) {
        const providerCode = codeMatch[1];
        
        // Guardar el componente
        const componentsDir = path.join(this.projectRoot, 'src', 'components');
        if (!fs.existsSync(componentsDir)) {
          fs.mkdirSync(componentsDir, { recursive: true });
        }
        
        const extension = framework === 'react' ? 'tsx' : 'vue';
        const providerPath = path.join(componentsDir, `ThemeProvider.${extension}`);
        fs.writeFileSync(providerPath, providerCode, 'utf-8');
        
        // Si es React, generar también un hook useTheme
        if (framework === 'react') {
          const hookPrompt = `
          # Tarea: Generación de Hook useTheme
          
          Genera un hook useTheme para React que:
          
          1. Acceda al contexto de tema creado por ThemeProvider
          2. Permita obtener el tema actual
          3. Permita cambiar entre tema claro y oscuro
          4. Exponga funciones de utilidad para trabajar con el tema
          
          Asegúrate de que sea compatible con TypeScript.
          
          Devuelve solo el código del hook sin explicaciones adicionales.
          `;
          
          const hookResponse = await this.queryLLM(hookPrompt);
          
          // Extraer el código del hook
          const hookMatch = hookResponse.match(/```(?:jsx|tsx|javascript|typescript)\n([\s\S]*?)\n```/) || 
                            hookResponse.match(/```\n([\s\S]*?)\n```/);
                            
          if (hookMatch) {
            const hookCode = hookMatch[1];
            const hookPath = path.join(componentsDir, 'useTheme.ts');
            fs.writeFileSync(hookPath, hookCode, 'utf-8');
            
            this.log(`✅ Hook useTheme guardado en: ${hookPath}`);
            
            // Registrar recurso creado
            this.recordResource('hook', hookPath);
          }
        }
        
        this.log(`✅ ThemeProvider guardado en: ${providerPath}`);
        this.updateAgentStatus('idle');
        
        // Registrar recurso creado
        this.recordResource('component', providerPath);
        
        // Notificar al ComponentAgent
        this.sendEvent(AgentEventType.COMPONENT_CREATED, {
          componentName: 'ThemeProvider',
          path: providerPath,
          type: 'provider',
          timestamp: new Date().toISOString(),
        }, 'component');
        
        return providerCode;
      } else {
        throw new Error(`No se pudo extraer el código del ThemeProvider para ${framework} de la respuesta del LLM`);
      }
    } catch (error) {
      this.log(`❌ Error generando ThemeProvider: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error generando ThemeProvider: ${error.message}`);
      throw error;
    }
  }

  /**
   * Genera un sistema de diseño completo basado en una marca o descripción
   */
  async generateDesignSystemFromBrand(brandDescription: string): Promise<DesignSystem> {
    this.log(`🏢 Generando sistema de diseño basado en: ${brandDescription}`);
    this.updateAgentStatus('working', 'Generando sistema de diseño');
    
    try {
      const prompt = `
      # Tarea: Generación de Sistema de Diseño
      
      Basado en la siguiente descripción de marca:
      "${brandDescription}"
      
      Genera un sistema de diseño completo que incluya:
      
      1. Paleta de colores (primario, secundario, acento, éxito, error, advertencia, info, fondo, texto)
      2. Tipografía (familia de fuentes, tamaños, pesos, alturas de línea)
      3. Espaciado (escala de espaciado)
      4. Bordes y radios
      5. Sombras
      6. Transiciones
      7. Breakpoints para diseño responsive
      8. Z-index para capas
      
      El sistema debe reflejar la personalidad de la marca y ser accesible (WCAG 2.1 AA).
      
      Devuelve un objeto JSON con la estructura completa del sistema de diseño.
      `;
      
      const response = await this.queryLLM(prompt);
      
      // Extraer el JSON de la respuesta
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                        response.match(/\{[\s\S]*\}/);
                        
      if (jsonMatch) {
        const designSystem = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        
        // Actualizar el sistema de diseño actual
        this.designSystem = designSystem;
        
        // Guardar el sistema de diseño
        const stylesDir = path.join(this.projectRoot, 'src', 'styles');
        if (!fs.existsSync(stylesDir)) {
          fs.mkdirSync(stylesDir, { recursive: true });
        }
        
        const designSystemPath = path.join(stylesDir, 'designSystem.json');
        fs.writeFileSync(designSystemPath, JSON.stringify(designSystem, null, 2), 'utf-8');
        
        // Generar también una versión TypeScript
        const tsContent = `// Sistema de Diseño generado automáticamente por StyleAgent
// Basado en: ${brandDescription}

export const designSystem = ${JSON.stringify(designSystem, null, 2)} as const;

// Tipos para el sistema de diseño
export type DesignSystemColors = typeof designSystem.colors;
export type DesignSystemTypography = typeof designSystem.typography;
export type DesignSystemSpacing = typeof designSystem.spacing;
export type DesignSystemBorderRadius = typeof designSystem.borderRadius;
${designSystem.shadows ? 'export type DesignSystemShadows = typeof designSystem.shadows;' : ''}
${designSystem.transitions ? 'export type DesignSystemTransitions = typeof designSystem.transitions;' : ''}
${designSystem.breakpoints ? 'export type DesignSystemBreakpoints = typeof designSystem.breakpoints;' : ''}
${designSystem.zIndex ? 'export type DesignSystemZIndex = typeof designSystem.zIndex;' : ''}

export default designSystem;
`;
        
        const tsDSPath = path.join(stylesDir, 'designSystem.ts');
        fs.writeFileSync(tsDSPath, tsContent, 'utf-8');
        
        this.log(`✅ Sistema de diseño guardado en: ${designSystemPath} y ${tsDSPath}`);
        this.updateAgentStatus('idle');
        
        // Registrar recursos creados
        this.recordResource('designSystem', designSystemPath);
        this.recordResource('designSystem', tsDSPath);
        
        return designSystem;
      } else {
        throw new Error('No se pudo extraer el sistema de diseño de la respuesta del LLM');
      }
    } catch (error) {
      this.log(`❌ Error generando sistema de diseño: ${error.message}`, 'error');
      this.updateAgentStatus('error', `Error generando sistema de diseño: ${error.message}`);
      throw error;
    }
  }

  /**
   * Procesa un mensaje recibido de otro agente o del usuario
   */
  async processMessage(message: AgentMessage): Promise<AgentMessage> {
    this.log(`📩 Procesando mensaje: ${message.content.substring(0, 50)}...`);
    
    try {
      // Extraer comando y argumentos del mensaje
      const { command, args } = this.parseCommand(message.content);
      
      let response: any;
      
      switch (command) {
        case 'createTheme':
          response = await this.createTheme(args.themeName, args.isDarkTheme === 'true');
          break;
          
        case 'generateCSSTheme':
          response = await this.generateCSSTheme(args.themeName, args.isDarkTheme === 'true');
          break;
          
        case 'generateStyledComponent':
          response = await this.generateStyledComponent(args.componentName, args.componentSpec, args.framework);
          break;
          
        case 'analyzeAccessibility':
          response = await this.analyzeAccessibility(args.cssCode, args.htmlCode);
          break;
          
        case 'exportDesignSystem':
          response = await this.exportDesignSystem(args.format as any);
          break;
          
        case 'generateAlternateTheme':
          response = await this.generateAlternateTheme(args.themeName, args.targetMode as 'dark' | 'light');
          break;
          
        case 'generateColorPalette':
          response = await this.generateColorPalette(args.primaryColor, args.mode as any);
          break;
          
        case 'generateIconSet':
          response = await this.generateIconSet(args.iconNames.split(','), args.style as any);
          break;
          
        case 'generateThemeProvider':
          response = await this.generateThemeProvider(args.framework as 'react' | 'vue');
          break;
          
        case 'generateDesignSystemFromBrand':
          response = await this.generateDesignSystemFromBrand(args.brandDescription);
          break;
          
        default:
          response = `Comando no reconocido: ${command}. Comandos disponibles: createTheme, generateCSSTheme, generateStyledComponent, analyzeAccessibility, exportDesignSystem, generateAlternateTheme, generateColorPalette, generateIconSet, generateThemeProvider, generateDesignSystemFromBrand`;
      }
      
      return {
        from: this.name,
        to: message.from,
        content: typeof response === 'string' ? response : JSON.stringify(response, null, 2),
        timestamp: new Date().toISOString(),
        type: 'response',
        metadata: {
          command,
          status: 'success'
        }
      };
    } catch (error) {
      this.log(`❌ Error procesando mensaje: ${error.message}`, 'error');
      
      return {
        from: this.name,
        to: message.from,
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString(),
        type: 'error',
        metadata: {
          error: error.message,
          stack: error.stack
        }
      };
    }
  }

  /**
   * Parsea un comando y sus argumentos desde un mensaje
   */
  private parseCommand(content: string): { command: string, args: Record<string, string> } {
    const lines = content.trim().split('\n');
    const commandLine = lines[0].trim();
    
    // Extraer el comando
    const commandMatch = commandLine.match(/^(\w+)(?:\s+(.*))?$/);
    
    if (!commandMatch) {
      return { command: 'unknown', args: {} };
    }
    
    const command = commandMatch[1];
    const argsString = commandMatch[2] || '';
    
    // Parsear argumentos
    const args: Record<string, string> = {};
    
    // Argumentos en formato clave=valor
    const keyValueArgs = argsString.match(/(\w+)=("[^"]*"|\S+)/g) || [];
    keyValueArgs.forEach(arg => {
      const [key, value] = arg.split('=');
      args[key] = value.replace(/^"(.*)"$/, '$1'); // Eliminar comillas si existen
    });
    
    // Argumentos en líneas siguientes
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      const argMatch = line.match(/^(\w+):\s*(.*)$/);
      
      if (argMatch) {
        const [, key, value] = argMatch;
        args[key] = value;
      }
    }
    
    return { command, args };
  }

  /**
   * Registra un recurso creado por el agente
   */
  private recordResource(type: 'theme' | 'component' | 'style' | 'report' | 'palette' | 'icon' | 'hook' | 'index' | 'designSystem', path: string): void {
    if (!this.resources[type]) {
      this.resources[type] = [];
    }
    
    this.resources[type].push({
      path,
      timestamp: new Date().toISOString()
    });
    
    // Guardar recursos en archivo
    const resourcesPath = path.join(this.projectRoot, '.cjdevmind', 'style-agent-resources.json');
    fs.mkdirSync(path.dirname(resourcesPath), { recursive: true });
    fs.writeFileSync(resourcesPath, JSON.stringify(this.resources, null, 2), 'utf-8');
  }

  /**
   * Obtiene todos los recursos creados por el agente
   */
  getResources(): Record<string, Array<{ path: string, timestamp: string }>> {
    return this.resources;
  }
}