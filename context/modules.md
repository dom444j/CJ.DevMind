# 📦 CJ.DevMind - Módulos Activos

## 🎨 frontend/
Sistema de UI basado en Next.js 14+ con App Router y Tailwind CSS.

### Estructura
- **app/**: Rutas y páginas (Next.js App Router)
- **components/**: Componentes React organizados por dominio
  - **ui/**: Componentes base (botones, inputs, cards)
  - **shared/**: Componentes reutilizables (headers, footers)
  - **[dominio]/**: Componentes específicos por dominio
- **hooks/**: Custom hooks para lógica reutilizable
- **lib/**: Utilidades, helpers y configuraciones
- **styles/**: Configuración de Tailwind y estilos globales
- **public/**: Activos estáticos (imágenes, fonts)

### Estado Actual
- Implementación inicial de componentes UI base
- Sistema de rutas para secciones principales
- Integración con backend mediante Tanstack Query

## 🔧 backend/
API modular en Node.js con Fastify/tRPC y Prisma ORM.

### Estructura
- **api/**: Endpoints REST y/o tRPC
  - **controllers/**: Manejo de requests y responses
  - **services/**: Lógica de negocio
  - **repositories/**: Acceso a datos
  - **middlewares/**: Funciones intermedias (auth, validation)
- **config/**: Configuraciones de servidor y servicios
- **utils/**: Funciones de utilidad
- **types/**: Definiciones de tipos TypeScript

### Módulos Funcionales
- **auth/**: Autenticación y autorización
- **users/**: Gestión de usuarios y perfiles
- **[dominio]/**: Módulos específicos por dominio funcional

### Estado Actual
- Estructura base implementada
- Endpoints para autenticación y usuarios
- Integración con Prisma para acceso a datos

## 💾 db/
Esquema de base de datos en Prisma con migraciones y seeds.

### Estructura
- **schema.prisma**: Definición de modelos y relaciones
- **migrations/**: Historial de cambios en el esquema
- **seeds/**: Datos iniciales para desarrollo y testing

### Estado Actual
- Modelos base definidos (User, Profile, etc.)
- Migraciones iniciales creadas
- Seeds para datos de prueba

## 🚀 infra/
Configuración para despliegue y operaciones.

### Estructura
- **docker/**: Configuración de contenedores
- **ci/**: Pipelines de CI/CD (GitHub Actions)
- **config/**: Configuraciones de entorno
- **scripts/**: Automatización de tareas

### Estado Actual
- Docker Compose para desarrollo local
- Configuración básica de GitHub Actions
- Scripts para despliegue en Vercel/AWS

## 🧠 context/
Sistema de memoria estructurada para los agentes IA.

### Estructura
- **core.md**: Visión general y arquitectura base
- **rules.md**: Reglas arquitectónicas estrictas
- **modules.md**: Detalle de módulos activos
- **prompts.md**: Templates para agentes IA
- **[dominio]/**: Contexto específico por dominio

### Estado Actual
- Documentos base implementados
- Actualización manual por ahora
- Pendiente sistema de embeddings

## 🤖 agents/
Agentes IA especializados que ejecutan tareas según el contexto.

### Implementados
- **base-agent.ts**: Clase base para todos los agentes
- **architect-agent.ts**: Diseño de arquitectura global
- **refactor-agent.ts**: Optimización de código existente
- **doc-agent.ts**: Generación de documentación técnica

### Próximos
- **vision-agent**: Cuestionario inicial para requisitos
- **ui-design-agent**: Sistema de diseño y componentes
- **test-agent**: Pruebas unitarias y de integración
- **security-agent**: Protección integral del sistema

### Estado Actual
- Arquitectura base de agentes implementada
- Integración con OpenAI API
- CLI para interacción con agentes

## 💻 cli/
Interfaz de línea de comandos para interactuar con agentes.

### Comandos
- **cj architect [prompt]**: Consulta al Architect Agent
- **cj refactor [tarea]**: Ejecuta tareas de refactorización
- **cj doc [ruta]**: Genera documentación para un módulo

### Estado Actual
- Comandos básicos implementados
- Integración con agentes existentes
- Pendiente mejoras con Commander.js

## 📊 dashboard/
Interfaz visual para monitoreo y control (próximamente).

### Características Planeadas
- Visualización de progreso por módulo
- Grafo interactivo de relaciones
- Logs en tiempo real de agentes
- Aprobación de cambios importantes

### Estado Actual
- En planificación
- Diseño inicial en proceso

