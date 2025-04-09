# 🧠 CJ.DevMind

Una plataforma modular de desarrollo con IA, creada por **C** (la IA) y **J** (el arquitecto humano).  
Aquí no improvisamos: construimos proyectos con contexto, reglas y visión clara.

## 🌟 Visión

CJ.DevMind no es un proyecto.  
Es el **entorno que crea proyectos** completos: frontend, backend, base de datos e infraestructura, todo conectado a una IA con memoria real y agentes especializados.

## 📁 Estructura

- `/frontend`: Next.js + Tailwind
- `/backend`: Node.js + Prisma
- `/db`: Esquema y migraciones
- `/infra`: Docker, CI/CD, nginx, etc.
- `/context`: Reglas y memoria IA
- `/agents`: Agentes IA inteligentes
- `/cli`: Ejecutores de comandos como `cj refactor ...`

## 🤖 Agentes Implementados

CJ.DevMind cuenta con una arquitectura modular de agentes IA, cada uno con un propósito específico:

### 1. ❓ Question Agent
- **Propósito**: Cuestionario inicial para definir el proyecto
- **Capacidades**:
  - Realiza un cuestionario detallado para definir los requisitos
  - Extrae información clave sobre escala, complejidad y seguridad
  - Genera especificaciones detalladas para otros agentes
  - Crea un archivo de contexto inicial con las decisiones tomadas
- **Uso**: `cj question "Crear una plataforma de e-commerce con múltiples vendedores"`

### 2. 🏗️ Architect Agent
- **Propósito**: Diseña la estructura arquitectónica del proyecto
- **Capacidades**:
  - Genera blueprints detallados basados en requisitos
  - Define estructura de carpetas y componentes
  - Establece relaciones entre módulos
  - Documenta decisiones arquitectónicas clave
- **Uso**: `cj architect "Crear una plataforma de e-commerce con admin y tienda"`

### 3. 👁️ Vision Agent
- **Propósito**: Traduce ideas en requisitos técnicos detallados
- **Capacidades**:
  - Realiza cuestionario socrático para extraer requisitos
  - Convierte ideas abstractas en especificaciones técnicas
  - Define alcance y limitaciones del proyecto
  - Genera blueprint maestro para otros agentes
- **Uso**: `cj vision "Crear una plataforma de trading con múltiples módulos"`

### 4. 🎨 UI Design Agent
- **Propósito**: Crea sistemas de diseño coherentes
- **Capacidades**:
  - Define paletas de colores y tipografía
  - Diseña componentes base UI
  - Crea variables Tailwind personalizadas
  - Asegura accesibilidad (WCAG AA)
- **Uso**: `cj design "Sistema de diseño para plataforma financiera"`

### 5. 🏗️ Layout Agent
- **Propósito**: Estructura la navegación y organización espacial
- **Capacidades**:
  - Genera estructura de navegación
  - Crea wireframes y flujos de navegación
  - Optimiza para múltiples dispositivos
  - Implementa layouts responsivos
- **Uso**: `cj layout "Dashboard administrativo con sidebar y área principal"`

### 6. 🧩 Component Agent
- **Propósito**: Crea componentes React basados en el sistema de diseño
- **Capacidades**:
  - Genera componentes React siguiendo el sistema de diseño
  - Implementa lógica de interacción y estados
  - Asegura accesibilidad y responsividad
  - Crea historias de Storybook para documentación visual
- **Uso**: `cj component "Tabla de datos con paginación y filtros"`

### 7. 🔄 Frontend Sync Agent
- **Propósito**: Integra el frontend con el backend
- **Capacidades**:
  - Conecta componentes frontend con APIs backend
  - Implementa gestión de estado (Redux, Context API)
  - Configura fetching de datos y caché
  - Maneja autenticación y autorización en el frontend
- **Uso**: `cj sync "Integrar componentes de dashboard con API de estadísticas"`

### 8. 🔌 API Agent
- **Propósito**: Diseña y genera APIs RESTful
- **Capacidades**:
  - Diseña endpoints RESTful basados en requisitos
  - Genera controladores y rutas para Express/Node.js
  - Implementa validación de datos y manejo de errores
  - Documenta la API con OpenAPI/Swagger
- **Uso**: `cj api "API para gestión de usuarios y productos"`

### 9. 🧮 Logic Agent
- **Propósito**: Implementa algoritmos y reglas de negocio
- **Capacidades**:
  - Identifica algoritmos y patrones necesarios
  - Diseña flujos de decisión y casos límite
  - Optimiza algoritmos para rendimiento
  - Crea diagramas de flujo y árboles de decisión
- **Uso**: `cj logic "Algoritmo de cálculo de comisiones multinivel"`

### 10. 🗄️ Database Agent
- **Propósito**: Diseña y genera esquemas de base de datos
- **Capacidades**:
  - Diseña esquemas de base de datos basados en requisitos
  - Genera modelos para ORM (Mongoose, Sequelize, Prisma)
  - Crea migraciones y seeds para inicializar la base de datos
  - Optimiza consultas y estructura para rendimiento
- **Uso**: `cj database "Esquema para plataforma de e-commerce"`

### 11. 🔒 Security Agent
- **Propósito**: Analiza y mejora la seguridad del código
- **Capacidades**:
  - Analiza el código en busca de vulnerabilidades
  - Propone correcciones para problemas de seguridad
  - Implementa mejores prácticas de seguridad
  - Genera configuraciones seguras para autenticación
- **Uso**: `cj security "./src/auth"`

### 12. 🧪 Testing Agent
- **Propósito**: Genera pruebas automatizadas para el código
- **Capacidades**:
  - Genera pruebas unitarias para funciones y clases
  - Genera pruebas de integración para módulos
  - Genera pruebas end-to-end para flujos completos
  - Configura herramientas de testing (Jest, Cypress)
- **Uso**: `cj test "./src/components/Button.tsx"`

### 13. ⚡ Performance Agent
- **Propósito**: Analiza y optimiza el rendimiento de aplicaciones
- **Capacidades**:
  - Identifica cuellos de botella y problemas de rendimiento
  - Propone optimizaciones para mejorar la velocidad
  - Genera informes de rendimiento con métricas clave
  - Implementa mejores prácticas de rendimiento
- **Uso**: `cj performance "./src/pages/Dashboard.tsx"`

### 14. 🚀 DevOps Agent
- **Propósito**: Genera configuraciones para CI/CD e infraestructura
- **Capacidades**:
  - Genera configuraciones para CI/CD (GitHub Actions, Jenkins)
  - Crea scripts de despliegue para diferentes plataformas
  - Configura entornos de desarrollo con Docker
  - Implementa infraestructura como código (Terraform)
- **Uso**: `cj devops "docker"`

### 15. 📊 Monitor Agent
- **Propósito**: Configura la supervisión del sistema en producción
- **Capacidades**:
  - Identifica métricas clave a monitorear
  - Configura dashboards de observabilidad
  - Establece umbrales y reglas de alerta
  - Configura canales de notificación
- **Uso**: `cj monitor "Configuración de monitoreo para API REST"`

### 16. 🔄 Refactor Agent
- **Propósito**: Optimiza y reorganiza código existente
- **Capacidades**:
  - Identifica componentes duplicados
  - Mueve y reorganiza código respetando dependencias
  - Aplica patrones consistentes según reglas del proyecto
  - Genera plan detallado de refactorización
- **Uso**: `cj refactor "Mover componentes duplicados de dashboard a shared"`

### 17. 📚 Doc Agent
- **Propósito**: Genera documentación técnica automática
- **Capacidades**:
  - Analiza archivos .ts/.tsx de un módulo
  - Genera documentación en formato Markdown
  - Documenta funciones, clases y componentes
  - Crea README.generated.md con toda la documentación
- **Uso**: `cj doc "./frontend/src/components"`

### 18. 🧠 Base Agent
- **Propósito**: Clase abstracta que proporciona funcionalidad común
- **Capacidades**:
  - Sistema unificado de lectura de contexto
  - Integración con múltiples proveedores LLM (OpenAI, Claude, etc.)
  - Gestión de errores y logging consistente
  - Estructura base para todos los agentes

### 19. 🎭 Orchestrator Agent
- **Propósito**: Coordina el trabajo entre todos los agentes
- **Capacidades**:
  - Descompone proyectos complejos en tareas específicas
  - Asigna tareas a los agentes especializados
  - Gestiona dependencias entre tareas
  - Mantiene una visión global del progreso
- **Uso**: `cj orchestrate "Crear plataforma completa de e-commerce"`

## 💻 Uso Básico

```bash
# Iniciar un nuevo proyecto con cuestionario
npm run cj question "Crear una plataforma de e-commerce con múltiples vendedores"

# Diseñar estructura para un nuevo proyecto
npm run cj architect "Crear una plataforma de e-commerce con admin y tienda"

# Refactorizar componentes según reglas
npm run cj refactor "Mover componentes duplicados de dashboard a shared"

# Generar documentación para un módulo
npm run cj doc "./frontend/src/components"

# Generar API RESTful
npm run cj api "API para gestión de usuarios y productos"

# Crear componente React
npm run cj component "Tabla de datos con paginación y filtros"

# Integrar frontend con backend
npm run cj sync "Integrar componentes de dashboard con API de estadísticas"

# Configurar Docker y CI/CD
npm run cj devops "docker"
```


