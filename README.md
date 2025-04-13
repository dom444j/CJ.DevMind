## CJ.DevMind README

### Visión General

**CJ.DevMind** es un sistema avanzado de colaboración humano-IA diseñado para asistir a desarrolladores en la creación, gestión y optimización de proyectos de software. Integra un conjunto de agentes especializados que trabajan de manera autónoma y coordinada para abarcar todas las fases del desarrollo: desde la arquitectura hasta la implementación, calidad, infraestructura y documentación. Con un enfoque en la persistencia de contexto, ejecución supervisada y un modelo de negocio sostenible, CJ.DevMind está diseñado para ser extensible, seguro y escalable.

#### Características Principales
- **Agentes especializados**: 23 agentes que cubren frontend, backend, calidad, infraestructura, documentación y más.
- **Ciclo de vida de tareas**: Gestión de tareas con estados claros (PENDING, IN_PROGRESS, BLOCKED, REVIEW, COMPLETED, ERROR, CANCELLED).
- **Persistencia de contexto**: Estado del sistema guardado automáticamente con checkpoints periódicos.
- **Ejecución autónoma supervisada**: Modo simulación, rollbacks automáticos y logs transaccionales para operaciones críticas.
- **Dashboard de supervisión**: Visualización en tiempo real de tareas, agentes, métricas de ROI y gestión de licencias.
- **Modelo de negocio integrado**: Licencias (Community, Professional, Enterprise), sistema de créditos y marketplace de extensiones.
- **Extensión de VSCode**: Integración directa con tu editor para ejecutar comandos y supervisar tareas.

---

### Requisitos del Sistema

- **Sistema operativo**: Windows, macOS o Linux.
- **Node.js**: v18 o superior (para CLI y dashboard).
- **Python**: v3.9 o superior (para agentes basados en IA).
- **Git**: Para control de versiones.
- **Espacio en disco**: Mínimo 2 GB para instalación y almacenamiento de contexto.
- **RAM**: Mínimo 8 GB (16 GB recomendados para proyectos grandes).
- **Conexión a internet**: Necesaria para instalación inicial y acceso al marketplace (modo offline disponible tras configuración).

---

### Primeros Pasos

#### Instalación
1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/cjdevmind/cjdevmind.git
   cd cjdevmind
   ```
2. **Instala dependencias**:
   ```bash
   npm install  # Para CLI y dashboard
   pip install -r requirements.txt  # Para agentes basados en Python
   ```
3. **Configura el entorno**:
   - Crea un archivo `.env` con tus credenciales (API keys para LLMs, configuración de base de datos, etc.).
   - Ejemplo de `.env`:
     ```
     LLM_API_KEY=tu-api-key
     DATABASE_URL=sqlite:///cjdevmind.db
     ```
4. **Inicia el sistema**:
   ```bash
   npm run start
   ```
   Esto inicia el CLI y el dashboard de supervisión (disponible en `http://localhost:3000`).

#### Configuración del Modo Offline
- Descarga modelos y dependencias para modo offline:
  ```bash
  cjdevmind setup-offline
  ```
- Una vez configurado, el sistema puede operar sin conexión, excepto para funciones del marketplace.

#### Instalación de la Extensión de VSCode
1. Busca "CJ.DevMind" en el marketplace de VSCode.
2. Instala la extensión y autentícate con tu licencia (Community, Professional o Enterprise).
3. Usa el panel de comandos de VSCode para interactuar con CJ.DevMind directamente desde tu editor.

---

### Creación de un Proyecto

1. **Inicia un nuevo proyecto**:
   ```bash
   cjdevmind create-project my-app
   ```
   Esto genera una estructura inicial con carpetas para frontend, backend, documentación, etc.
2. **Define los requisitos**:
   - Usa el QuestionAgent para recopilar requisitos:
     ```bash
     cjdevmind ask "Crear una app web con autenticación y un dashboard"
     ```
   - El ArchitectAgent generará una arquitectura inicial.
3. **Asigna tareas**:
   - El OrchestratorAgent distribuirá tareas a los agentes relevantes (por ejemplo, UIDesignAgent para el diseño del dashboard, APIAgent para la autenticación).
   - Supervisa el progreso desde el dashboard o con:
     ```bash
     cjdevmind status
     ```

#### Ejemplo de Flujo de Trabajo
- **Comando**: `cjdevmind ask "Implementar un sistema de login con JWT"`
- **Flujo**:
  1. **QuestionAgent**: Interpreta el requerimiento y lo descompone.
  2. **ArchitectAgent**: Diseña la arquitectura (endpoints, esquemas de base de datos).
  3. **APIAgent**: Implementa los endpoints de login.
  4. **DatabaseAgent**: Crea las tablas de usuarios.
  5. **SecurityAgent**: Valida la seguridad (tokens JWT, encriptación).
  6. **TestingAgent**: Escribe pruebas para los endpoints.
  7. **DocAgent**: Genera documentación de la API.

---

### Flujo de Trabajo Básico

1. **Crea o importa un proyecto**:
   - Usa `cjdevmind create-project` o importa uno existente con `cjdevmind import-project /ruta/a/tu/proyecto`.
2. **Interactúa con los agentes**:
   - Usa comandos del CLI o la extensión de VSCode para asignar tareas:
     ```bash
     cjdevmind ask "Diseñar una interfaz de usuario para un dashboard"
     ```
3. **Supervisa el progreso**:
   - Desde el CLI:
     ```bash
     cjdevmind status
     ```
   - O desde el dashboard en `http://localhost:3000`, donde verás:
     - Estado de tareas (PENDING, IN_PROGRESS, BLOCKED, etc.).
     - Actividad de los agentes.
     - Métricas de ROI y uso de créditos (si usas licencias Professional o Enterprise).
4. **Revisa y aprueba**:
   - Las tareas marcadas como REVIEW requieren tu aprobación:
     ```bash
     cjdevmind review task-id
     ```
5. **Itera**:
   - Si una tarea falla (estado ERROR), usa:
     ```bash
     cjdevmind retry task-id
     ```

---

### Consejos para Principiantes

- **Usa el modo simulación**: Antes de ejecutar tareas críticas (como despliegues), previsualiza las acciones:
  ```bash
  cjdevmind simulate deploy
  ```
- **Revisa el dashboard**: El dashboard de supervisión (`http://localhost:3000`) te da una visión clara del estado del sistema.
- **Empieza con proyectos pequeños**: Prueba con un proyecto simple (como una API básica) para entender cómo interactúan los agentes.
- **Consulta la documentación**: Usa el DocAgent para generar documentación de tu proyecto:
  ```bash
  cjdevmind document
  ```

---

### Estructura del Proyecto

Un proyecto típico generado por CJ.DevMind tiene esta estructura:

```
my-app/
├── frontend/           # Código del frontend (React, CSS, etc.)
├── backend/            # Código del backend (APIs, lógica, base de datos)
├── tests/              # Pruebas generadas por TestingAgent
├── docs/               # Documentación generada por DocAgent
├── infra/              # Configuraciones de infraestructura (CI/CD, Docker)
├── cjdevmind.db        # Base de datos SQLite para tareas y contexto
├── tasks.json          # Registro de tareas y estados
└── README.md           # Documentación inicial del proyecto
```

#### Base de Datos de Tareas
- **Ubicación**: `cjdevmind.db` (SQLite).
- **Contenido**: Registra todas las tareas, sus estados (PENDING, IN_PROGRESS, etc.), transiciones y metadatos.
- **Acceso**: Puedes consultar el estado de las tareas con:
  ```bash
  cjdevmind status
  ```

---

### Agentes Implementados

CJ.DevMind cuenta con 23 agentes especializados, coordinados por el OrchestratorAgent. Aquí una lista resumida:

- **Meta-Nivel**:
  - **QuestionAgent**: Interpreta requerimientos del usuario.
  - **VisionAgent**: Procesa imágenes y datos visuales.
  - **ArchitectAgent**: Diseña arquitecturas de software.
  - **OrchestratorAgent**: Gestiona dependencias, tareas y flujo de trabajo.
- **Frontend**:
  - **UIDesignAgent**: Diseña interfaces de usuario.
  - **LayoutAgent**: Crea layouts (HTML/CSS, frameworks).
  - **ComponentAgent**: Genera componentes reutilizables.
  - **FrontendSyncAgent**: Sincroniza frontend con backend.
- **Backend**:
  - **APIAgent**: Diseña e implementa APIs.
  - **LogicAgent**: Implementa lógica de negocio.
  - **DatabaseAgent**: Gestiona bases de datos.
  - **IntegrationAgent**: Integra servicios externos.
- **Calidad**:
  - **TestingAgent**: Escribe y ejecuta pruebas.
  - **SecurityAgent**: Asegura el código y las integraciones.
  - **PerformanceAgent**: Optimiza el rendimiento.
  - **RefactorAgent**: Refactoriza código.
- **Infraestructura**:
  - **DevOpsAgent**: Gestiona despliegues y CI/CD.
  - **MonitorAgent**: Recolecta métricas y telemetría.
  - **DashboardAgent**: Mantiene el dashboard de supervisión.
  - **AnalyticsAgent**: Genera reportes (ROI, métricas).
- **Documentación**:
  - **DocAgent**: Genera documentación técnica y de usuario.
  - **MemoryAgent**: Gestiona el contexto y el estado del sistema.
- **Otros**:
  - **ExtensionAgent**: Gestiona extensiones del marketplace.

#### Ejemplo de Uso de un Agente
- **Comando**: `cjdevmind ask "Crear un endpoint para registrar usuarios"`
- **Agentes involucrados**:
  - **APIAgent**: Crea el endpoint `/register`.
  - **DatabaseAgent**: Define el esquema de la tabla `users`.
  - **SecurityAgent**: Añade encriptación para contraseñas.
  - **TestingAgent**: Escribe pruebas para el endpoint.

---

### Modelo de Negocio

CJ.DevMind opera bajo un modelo freemium con tres niveles de licencia:

- **Community**: Gratis, acceso a agentes básicos, modo offline, sin marketplace.
- **Professional**: $15/mes, acceso a todos los agentes, dashboard avanzado, 100 créditos/mes para el marketplace.
- **Enterprise**: $50/mes, incluye soporte prioritario, integración con herramientas empresariales, créditos ilimitados.

#### Sistema de Créditos y Marketplace
- **Créditos**: Usados para comprar extensiones en el marketplace (por ejemplo, una extensión de autenticación avanzada cuesta 50 créditos).
- **Marketplace**: Gestionado por el ExtensionAgent, permite a los usuarios adquirir extensiones creadas por la comunidad o el equipo de CJ.DevMind.
- **Gestión de licencias**: Supervisada desde el dashboard, donde puedes ver tu plan, créditos disponibles y métricas de ROI.

---

### Ejemplos de Uso Básico

#### Ejemplo 1: Crear una API Básica
1. Inicia un proyecto:
   ```bash
   cjdevmind create-project my-api
   ```
2. Define el requerimiento:
   ```bash
   cjdevmind ask "Crear una API REST para gestionar productos"
   ```
3. Supervisa el progreso:
   ```bash
   cjdevmind status
   ```
4. Revisa los resultados:
   - Código generado en `my-api/backend/`.
   - Pruebas en `my-api/tests/`.
   - Documentación en `my-api/docs/`.

#### Ejemplo 2: Diseñar un Dashboard
1. Define el requerimiento:
   ```bash
   cjdevmind ask "Diseñar un dashboard para mostrar métricas de ventas"
   ```
2. El UIDesignAgent creará un diseño, que pasará a REVIEW.
3. Aprueba el diseño:
   ```bash
   cjdevmind review task-id
   ```
4. El LayoutAgent y ComponentAgent implementarán el dashboard en `my-app/frontend/`.

#### Ejemplo 3: Supervisar un Despliegue
1. Usa el modo simulación para previsualizar:
   ```bash
   cjdevmind simulate deploy
   ```
2. Si todo está bien, ejecuta el despliegue:
   ```bash
   cjdevmind deploy
   ```
3. El DevOpsAgent gestionará el despliegue, con rollbacks automáticos si algo falla.

---

### Contribuciones y Soporte

- **Contribuciones**: Bienvenidas vía pull requests en el repositorio de GitHub. Consulta `CONTRIBUTING.md` para más detalles.
- **Soporte**:
  - Community: Foro de la comunidad.
  - Professional/Enterprise: Soporte por email y chat prioritario.
- **Reportar problemas**:
  ```bash
  cjdevmind report-issue "Descripción del problema"
  ```

---

### Visión a Futuro

- **IA más avanzada**: Integración de modelos de lenguaje más potentes para mejorar la comprensión contextual.
- **Marketplace expandido**: Más extensiones y herramientas creadas por la comunidad.
- **Soporte multiusuario**: Colaboración en tiempo real para equipos.
- **Automatización total**: Capacidad para gestionar proyectos completos con mínima intervención humana.

---
