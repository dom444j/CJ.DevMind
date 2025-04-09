import { BaseAgent } from './base-agent';
import fs from 'fs';
import path from 'path';

/**
 * Component Agent - Crea componentes React basados en el sistema de diseño
 * 
 * Este agente es responsable de:
 * 1. Generar componentes React siguiendo el sistema de diseño
 * 2. Implementar lógica de interacción y estados
 * 3. Asegurar accesibilidad y responsividad
 * 4. Crear historias de Storybook para documentación visual
 * 5. Generar pruebas para los componentes
 */
export class ComponentAgent extends BaseAgent {
  constructor() {
    super('Component Agent');
  }
  
  /**
   * Ejecuta el Component Agent para crear componentes React
   * @param componentSpec Especificación del componente a crear
   */
  async run(componentSpec: string): Promise<void> {
    console.log(`🧩 Component Agent creando componente: "${componentSpec}"`);
    
    // Leer contexto relevante
    const coreContext = this.readContext('core.md');
    const designSystem = this.readContext('frontend/design-system.md');
    
    // Extraer nombre del componente de la especificación
    const componentName = this.extractComponentName(componentSpec);
    
    // Crear prompt para el LLM
    const componentPrompt = `
    # Contexto del Proyecto
    ${coreContext}
    
    # Sistema de Diseño
    ${designSystem}
    
    # Tarea de Component Agent
    Actúa como el Component Agent de CJ.DevMind. Tu tarea es crear un componente React basado en el sistema de diseño proporcionado.
    
    Especificación del componente:
    "${componentSpec}"
    
    Genera:
    1. Componente React funcional con TypeScript
    2. Estilos usando Tailwind CSS según el sistema de diseño
    3. Manejo de props y estados necesarios
    4. Implementación de accesibilidad (ARIA, keyboard navigation)
    5. Historia de Storybook para documentación visual
    6. Pruebas básicas con React Testing Library
    
    El componente debe seguir las mejores prácticas de React, ser reutilizable y seguir el sistema de diseño proporcionado.
    `;
    
    // En modo real, consultaríamos al LLM
    let componentCode, storybookCode, testCode;
    
    if (process.env.DEVMIND_REAL_MODE === 'true') {
      try {
        const result = await this.queryLLM(componentPrompt);
        
        // Extraer código de los diferentes archivos
        componentCode = this.extractCodeBlock(result, 'tsx', 'Component');
        storybookCode = this.extractCodeBlock(result, 'tsx', 'Storybook');
        testCode = this.extractCodeBlock(result, 'tsx', 'Test');
        
        // Guardar los archivos
        this.saveComponentFiles(componentName, componentCode, storybookCode, testCode);
      } catch (error) {
        console.error('❌ Error generando componente:', error);
        return;
      }
    } else {
      // Modo simulado para desarrollo
      console.log('🧪 Ejecutando en modo simulado');
      
      // Generar código simulado
      componentCode = this.generateSimulatedComponent(componentName);
      storybookCode = this.generateSimulatedStorybook(componentName);
      testCode = this.generateSimulatedTest(componentName);
      
      // Guardar los archivos simulados
      this.saveComponentFiles(componentName, componentCode, storybookCode, testCode);
    }
    
    // Mostrar resultado
    console.log('\n✅ Componente generado con éxito:');
    console.log(`- ${componentName}.tsx`);
    console.log(`- ${componentName}.stories.tsx`);
    console.log(`- ${componentName}.test.tsx`);
  }
  
  /**
   * Extrae el nombre del componente de la especificación
   */
  private extractComponentName(componentSpec: string): string {
    // Extraer el primer sustantivo que podría ser un nombre de componente
    const words = componentSpec.split(' ');
    let componentName = '';
    
    for (const word of words) {
      // Buscar palabras que podrían ser nombres de componentes (Button, Card, etc.)
      const cleanWord = word.replace(/[^a-zA-Z]/g, '');
      if (cleanWord && cleanWord.length > 2) {
        // Convertir a PascalCase
        componentName = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
        break;
      }
    }
    
    // Si no se encontró un nombre adecuado, usar un nombre genérico
    return componentName || 'CustomComponent';
  }
  
  /**
   * Extrae bloques de código de la respuesta del LLM
   */
  private extractCodeBlock(text: string, extension: string, type: string): string {
    const regex = new RegExp(`\`\`\`(?:${extension}|react|typescript)([\\s\\S]*?)\`\`\``, 'g');
    const matches = [...text.matchAll(regex)];
    
    // Buscar el bloque que corresponde al tipo (Component, Storybook, Test)
    for (const match of matches) {
      const code = match[1].trim();
      if (type === 'Component' && !code.includes('stories') && !code.includes('test')) {
        return code;
      } else if (type === 'Storybook' && code.includes('stories')) {
        return code;
      } else if (type === 'Test' && code.includes('test')) {
        return code;
      }
    }
    
    // Si no se encuentra un bloque específico, devolver el primero
    return matches.length > 0 ? matches[0][1].trim() : '';
  }
  
  /**
   * Guarda los archivos del componente
   */
  private saveComponentFiles(componentName: string, componentCode: string, storybookCode: string, testCode: string): void {
    // Crear directorio de componentes si no existe
    const componentsDir = path.join(process.cwd(), 'components');
    if (!fs.existsSync(componentsDir)) {
      fs.mkdirSync(componentsDir, { recursive: true });
    }
    
    // Guardar archivos
    fs.writeFileSync(path.join(componentsDir, `${componentName}.tsx`), componentCode, 'utf-8');
    fs.writeFileSync(path.join(componentsDir, `${componentName}.stories.tsx`), storybookCode, 'utf-8');
    fs.writeFileSync(path.join(componentsDir, `${componentName}.test.tsx`), testCode, 'utf-8');
  }
  
  /**
   * Genera un componente React simulado
   */
  private generateSimulatedComponent(componentName: string): string {
    return `import React from 'react';

interface ${componentName}Props {
  label: string;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

/**
 * ${componentName} component
 * 
 * A reusable component following the design system guidelines.
 */
export const ${componentName}: React.FC<${componentName}Props> = ({
  label,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
}) => {
  // Determine classes based on variant and size
  const baseClasses = "rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-primary text-white hover:bg-primary-dark focus:ring-primary",
    secondary: "bg-secondary text-white hover:bg-secondary-dark focus:ring-secondary",
    outline: "bg-white text-primary border border-primary hover:bg-gray-50 focus:ring-primary",
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };
  
  const classes = [
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
  ].join(" ");
  
  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
    >
      {label}
    </button>
  );
};

export default ${componentName};
`;
  }
  
  /**
   * Genera una historia de Storybook simulada
   */
  private generateSimulatedStorybook(componentName: string): string {
    return `import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ${componentName} } from './${componentName}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Components/${componentName}',
  component: ${componentName},
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    onClick: { action: 'clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof ${componentName}>;

export const Primary: Story = {
  args: {
    label: 'Primary ${componentName}',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    label: 'Secondary ${componentName}',
    variant: 'secondary',
    size: 'md',
  },
};

export const Outline: Story = {
  args: {
    label: 'Outline ${componentName}',
    variant: 'outline',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    label: 'Small ${componentName}',
    variant: 'primary',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    label: 'Large ${componentName}',
    variant: 'primary',
    size: 'lg',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled ${componentName}',
    variant: 'primary',
    size: 'md',
    disabled: true,
  },
};
`;
  }
  
  /**
   * Genera una prueba simulada
   */
  private generateSimulatedTest(componentName: string): string {
    return `import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ${componentName} } from './${componentName}';

describe('${componentName}', () => {
  test('renders correctly with default props', () => {
    render(<${componentName} label="Test ${componentName}" />);
    
    const button = screen.getByRole('button', { name: /test ${componentName}/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });
  
  test('renders with secondary variant', () => {
    render(<${componentName} label="Secondary" variant="secondary" />);
    
    const button = screen.getByRole('button', { name: /secondary/i });
    expect(button).toHaveClass('bg-secondary');
  });
  
  test('renders with outline variant', () => {
    render(<${componentName} label="Outline" variant="outline" />);
    
    const button = screen.getByRole('button', { name: /outline/i });
    expect(button).toHaveClass('bg-white');
    expect(button).toHaveClass('border-primary');
  });
  
  test('renders with different sizes', () => {
    const { rerender } = render(<${componentName} label="Small" size="sm" />);
    expect(screen.getByRole('button')).toHaveClass('px-3 py-1.5 text-sm');
    
    rerender(<${componentName} label="Medium" size="md" />);
    expect(screen.getByRole('button')).toHaveClass('px-4 py-2 text-base');
    
    rerender(<${componentName} label="Large" size="lg" />);
    expect(screen.getByRole('button')).toHaveClass('px-6 py-3 text-lg');
  });
  
  test('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<${componentName} label="Clickable" onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('is disabled when disabled prop is true', () => {
    render(<${componentName} label="Disabled" disabled />);
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('opacity-50');
    expect(button).toHaveClass('cursor-not-allowed');
  });
});
`;
  }
}

// Función auxiliar para mantener compatibilidad con código existente
export async function componentAgent(componentSpec: string): Promise<string> {
  const agent = new ComponentAgent();
  await agent.run(componentSpec);
  return "Ejecutado con éxito";
}