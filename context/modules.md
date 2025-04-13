## CJ.DevMind: Módulos y Agentes (Actualizado)

### Visión General

**CJ.DevMind** está compuesto por **30 agentes especializados** (anteriormente 23, con la adición de 5 nuevos agentes: `StyleAgent`, `TestAgent`, `SelfImprovementAgent`, `CodeReviewAgent`, y una actualización significativa al `ComponentAgent`) que colaboran para asistir en todas las fases del desarrollo de software: desde la definición de requisitos hasta la implementación, calidad, infraestructura, documentación, y lanzamiento. Además, incluye `BaseAgent` como núcleo y `VSCodeAgentBridge` como un componente de integración (no un agente especializado), lo que lleva el total de elementos en la jerarquía a **32**. Los agentes están organizados en una estructura jerárquica, con un **BaseAgent** como núcleo, y se dividen en categorías funcionales: **Meta-Nivel**, **Frontend**, **Backend**, **Calidad**, **Infraestructura**, **Documentación**, **Negocio**, y **Otros**. Cada agente tiene responsabilidades específicas, interactúa con otros según un grafo de dependencias dinámico, y opera bajo un ciclo de vida de tareas definido (PENDING, IN_PROGRESS, BLOCKED, REVIEW, COMPLETED, ERROR, CANCELLED). El sistema está diseñado para integrarse como una extensión de VS Code, con una arquitectura híbrida que combina un cliente ligero en VS Code y un servidor backend para tareas pesadas.

#### Características Clave
- **Persistencia de Contexto**: El estado del sistema (tareas, dependencias, métricas, código, documentación, decisiones, tendencias del mercado, preferencias del usuario) se guarda automáticamente con checkpoints periódicos (cada 100 operaciones o 10 minutos) en `cjdevmind.db` y en el almacenamiento local de VS Code (`vscode.Memento`, `vscode.workspace.fs`).
- **Ejecución Autónoma Supervisada**: Modo simulación para previsualizar acciones, rollbacks automáticos con puntos de restauración, logs transaccionales para operaciones críticas, y niveles de aprobación humana para tareas en estado REVIEW.
- **Gestión de Dependencias**: Grafo dinámico gestionado por el **OrchestratorAgent**, con resolución de bloqueos y priorización inteligente basada en una **PriorityQueue**.
- **Ciclo de Vida de Tareas**: Estados gestionados por el **TaskManager** (PENDING, IN_PROGRESS, BLOCKED, REVIEW, COMPLETED, ERROR, CANCELLED), con transiciones dinámicas y notificaciones en VS Code.
- **Dashboard de Supervisión**: Visualización en tiempo real de tareas, agentes, métricas de ROI, sistema de créditos, y gestión de licencias, renderizado en un webview de VS Code.
- **Modelo de Negocio Integrado**: Licencias (Community, Professional, Enterprise), sistema de créditos para desbloquear funcionalidades y comprar extensiones, y un marketplace de extensiones integrado en VS Code.
- **Soporte para Proyectos de Cualquier Escala**: Desde proyectos pequeños (por ejemplo, una tienda en línea sencilla) hasta proyectos complejos (por ejemplo, una app MLM híbrida con tienda internacional y realidad aumentada).
- **Integración con VS Code**: Los agentes se ejecutan como parte de una extensión de VS Code, con comandos personalizados (`cjdevmind.[agent]`), webviews para el dashboard y el marketplace, y soporte para modo offline.
- **Modo Offline**: Operaciones sin conexión usando modelos locales (Llama, Mistral), almacenamiento local, y sincronización al reconectar.
- **Seguridad**: Gestión de credenciales, validación de entrada, auditoría, niveles de aprobación, rollbacks automáticos, y logs transaccionales, con integración segura en VS Code (`vscode.SecretStorage`).
- **Autoextensión y Automejora**:
  - **Autoextensión Según Requerimientos**: El **ExtensionAgent** permite extender las capacidades del sistema instalando extensiones del marketplace (por ejemplo, plugins de AR o multilenguaje), lo que funcionalmente puede equivaler a añadir nuevas capacidades como si fueran "nuevos agentes", aunque no crea agentes nuevos en la jerarquía.
  - **Automejora de Agentes**: El **SelfImprovementAgent** optimiza el comportamiento de los agentes existentes analizando su historial de ejecución y ajustando prompts, lógica, o configuraciones para mejorar su rendimiento y adaptarse a los requerimientos del proyecto.

---

## 🔄 Jerarquía de Agentes (Actualizada)

La jerarquía incluye **32 elementos**: 30 agentes especializados, `BaseAgent` (núcleo), y `VSCodeAgentBridge` (componente de integración, no un agente especializado). Los nuevos agentes (`StyleAgent`, `TestAgent`, `SelfImprovementAgent`, `CodeReviewAgent`) y la actualización de `ComponentAgent` se integran en las categorías correspondientes:

```
BaseAgent
├── Meta-Nivel
│   ├── QuestionAgent
│   ├── VisionAgent
│   ├── ArchitectAgent
│   ├── OrchestratorAgent
│   └── ExtensionAgent
├── Frontend
│   ├── UIDesignAgent
│   ├── LayoutAgent
│   ├── ComponentAgent (Actualizado)
│   ├── FrontendSyncAgent
│   └── StyleAgent (Nuevo)
├── Backend
│   ├── APIAgent
│   ├── LogicAgent
│   ├── DatabaseAgent
│   └── IntegrationAgent
├── Calidad
│   ├── TestingAgent
│   ├── SecurityAgent
│   ├── PerformanceAgent
│   ├── RefactorAgent
│   ├── TestAgent (Nuevo)
│   ├── SelfImprovementAgent (Nuevo)
│   └── CodeReviewAgent (Nuevo)
├── Infraestructura
│   ├── DevOpsAgent
│   ├── MonitorAgent
│   ├── DashboardAgent
│   └── AnalyticsAgent
├── Documentación
│   ├── DocAgent
│   └── MemoryAgent
├── Negocio
│   ├── BusinessAgent
│   ├── MarketAgent
│   └── LaunchAgent
└── Otros
    └── VSCodeAgentBridge
```

---

### Detalle de Agentes por Categoría (Actualizado)

#### BaseAgent
- **Responsabilidad**: Núcleo del sistema, proporciona funcionalidades básicas compartidas por todos los agentes especializados, con soporte para integración con VS Code.
- **Capacidades**:
  - Comunicación entre agentes mediante un **EventBus** con canales temáticos (`frontend`, `backend`, `calidad`, `infraestructura`, `documentacion`, `negocio`).
  - Acceso al sistema de memoria persistente (gestionado por el **MemoryAgent**), incluyendo almacenamiento local en VS Code.
  - Gestión de prompts y respuestas de LLMs (OpenAI, Anthropic, modelos locales como Llama y Mistral).
  - Registro de comandos en VS Code mediante el **VSCodeAdapter**.
  - Almacenamiento seguro de credenciales usando `vscode.SecretStorage`.
- **Interacciones**:
  - Sirve como base para todos los agentes especializados, proporcionando métodos comunes como `execute`, `callLLM`, `publishEvent`, y `storeLocalData`.
  - Usa el **VSCodeAdapter** para interactuar con el entorno de VS Code (comandos, webviews, almacenamiento).
- **Implementación**:
  ```typescript
  abstract class BaseAgent {
    protected context: Context;
    protected llmProvider: LLMProvider;
    protected logger: Logger;
    protected memory: MemoryService;
    protected eventBus: EventBus;
    protected vscodeAdapter: VSCodeAdapter;

    constructor(config: AgentConfig) {
      this.context = new Context(config.contextPath);
      this.llmProvider = LLMFactory.create(config.llmProvider);
      this.logger = new Logger(config.name);
      this.memory = MemoryService.getInstance();
      this.eventBus = EventBus.getInstance();
      this.vscodeAdapter = new VSCodeAdapter(config.vscodeContext);
    }

    abstract async execute(input: string): Promise<AgentResult>;

    protected async callLLM(prompt: string, options?: LLMOptions): Promise<string> {
      return this.llmProvider.call(prompt, options);
    }

    protected publishEvent(event: AgentEvent): void {
      this.eventBus.publish(event.type, event.data);
    }

    protected async queryMemory(query: string): Promise<MemoryResult> {
      return this.memory.query(query);
    }

    protected async saveToMemory(data: any, metadata: any): Promise<void> {
      return this.memory.store(data, metadata);
    }

    protected async registerVSCodeCommand(command: string, callback: (...args: any[]) => any): void {
      this.vscodeAdapter.registerCommand(command, callback);
    }

    protected async storeLocalData(key: string, value: any): Promise<void> {
      this.vscodeAdapter.storeLocalData(key, value);
    }
  }
  ```

#### 1. Meta-Nivel (Coordinación y Contexto)

- **QuestionAgent**
  - **Responsabilidad**: Interpreta y descompone requerimientos del usuario en tareas accionables, con interacción directa en VS Code.
  - **Capacidades**:
    - Analiza entradas en lenguaje natural (por ejemplo, "Crear una app MLM con autenticación").
    - Genera un conjunto de tareas para el **OrchestratorAgent** mediante un cuestionario interactivo.
    - Usa notificaciones de VS Code (`vscode.window.showInputBox`) para recopilar información adicional.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → COMPLETED.
  - **Interacciones**:
    - Pasa tareas al **OrchestratorAgent**.
    - Usa el **MemoryAgent** para almacenar contexto histórico (por ejemplo, preferencias del usuario).
    - Notifica al usuario mediante VS Code (`vscode.window.showInformationMessage`).
  - **Ejemplo**:
    - Entrada: "Diseñar un dashboard de ventas con realidad aumentada."
    - Proceso: Muestra preguntas en VS Code ("¿Qué métricas debe mostrar el dashboard?", "¿Qué tipo de AR prefieres?").
    - Salida: Tareas para **UIDesignAgent**, **DashboardAgent**, **AnalyticsAgent**, y **ComponentAgent** (para AR).
  - **Implementación**:
    ```typescript
    class QuestionAgent extends BaseAgent {
      private questionTemplate: string;
      private followupQuestions: Map<string, string[]>;

      constructor(config: AgentConfig) {
        super(config);
        this.questionTemplate = this.loadQuestionTemplate();
        this.followupQuestions = this.loadFollowupQuestions();
      }

      async execute(input: string): Promise<AgentResult> {
        const prompt = this.buildQuestionPrompt(input);
        const response = await this.callLLM(prompt);
        const parsedRequirements = this.parseRequirements(response);

        // Cuestionario interactivo en VS Code
        const followups = this.followupQuestions.get(input.toLowerCase()) || [];
        const answers: Record<string, string> = {};
        for (const question of followups) {
          const answer = await vscode.window.showInputBox({ prompt: question });
          answers[question] = answer || '';
        }

        const enrichedRequirements = { ...parsedRequirements, answers };
        await this.saveToMemory(enrichedRequirements, {
          type: 'requirements',
          project: input
        });

        return {
          output: JSON.stringify(enrichedRequirements, null, 2),
          metadata: { requirements: enrichedRequirements }
        };
      }

      private buildQuestionPrompt(input: string): string {
        return `${this.questionTemplate}\nUser Input: ${input}`;
      }

      private parseRequirements(response: string): any {
        return JSON.parse(response);
      }

      private loadQuestionTemplate(): string {
        return "Extract requirements from the following user input:";
      }

      private loadFollowupQuestions(): Map<string, string[]> {
        return new Map([
          ['dashboard', ['What metrics should it display?', 'What style do you prefer?']],
          ['mlm', ['What structure (binary, unilevel, hybrid)?', 'Do you need a store?']],
          ['ar', ['What type of AR (ARKit, ARCore)?', 'What elements should be interactive?']]
        ]);
      }
    }
    ```

- **VisionAgent**
  - **Responsabilidad**: Procesa datos visuales (imágenes, diagramas) y los convierte en información accionable, con soporte para cargar imágenes desde VS Code.
  - **Capacidades**:
    - Analiza wireframes, mockups, o diagramas subidos por el usuario.
    - Genera descripciones textuales (por ejemplo, "Un botón rojo en la esquina superior derecha").
    - Usa el **EmbeddingService** para generar embeddings de imágenes y buscar coincidencias en el **Sistema de Memoria**.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → REVIEW → COMPLETED.
  - **Interacciones**:
    - Colabora con el **UIDesignAgent** para convertir descripciones en diseños.
    - Usa el **MemoryAgent** para almacenar imágenes procesadas y sus descripciones.
    - Permite al usuario cargar imágenes mediante `vscode.window.showOpenDialog`.
  - **Ejemplo**:
    - Entrada: Imagen de un wireframe cargada desde VS Code.
    - Proceso: Analiza la imagen y genera una descripción.
    - Salida: "Barra lateral con 3 opciones: Inicio, Ventas, Configuración."
  - **Implementación**:
    ```typescript
    class VisionAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        // Permitir al usuario seleccionar una imagen en VS Code
        const fileUri = await vscode.window.showOpenDialog({
          canSelectMany: false,
          filters: { 'Images': ['png', 'jpg', 'jpeg'] }
        });

        if (!fileUri || fileUri.length === 0) {
          throw new Error('No image selected');
        }

        const imagePath = fileUri[0].fsPath;
        const imageData = await this.readImage(imagePath);
        const embedding = await this.memory.embeddingService.generateEmbedding(imageData);
        const description = await this.callLLM(`Describe this wireframe: [Image Embedding]`, { embedding });

        await this.saveToMemory({ imagePath, description }, {
          type: 'wireframe',
          project: input
        });

        return {
          output: description,
          metadata: { imagePath, description }
        };
      }

      private async readImage(path: string): Promise<Buffer> {
        return require('fs').promises.readFile(path);
      }
    }
    ```

- **ArchitectAgent**
  - **Responsabilidad**: Diseña la arquitectura del sistema, con soporte para generar estructuras de carpetas en VS Code.
  - **Capacidades**:
    - Define tecnologías (por ejemplo, React, Node.js, PostgreSQL).
    - Genera diagramas de arquitectura (por ejemplo, en formato Mermaid).
    - Crea la estructura de carpetas del proyecto usando `vscode.workspace.fs`.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → REVIEW → COMPLETED.
  - **Interacciones**:
    - Proporciona arquitectura al **FrontendSyncAgent**, **APIAgent**, y **DatabaseAgent**.
    - Depende del **QuestionAgent** para los requisitos iniciales.
    - Usa el **MemoryAgent** para almacenar la arquitectura.
  - **Ejemplo**:
    - Entrada: "App web con autenticación y realidad aumentada."
    - Salida: Estructura de carpetas (`src/frontend`, `src/backend`), tecnologías (React, Node.js, ARKit), diagrama de flujo.
  - **Implementación**:
    ```typescript
    class ArchitectAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const requirements = await this.queryMemory(input);
        const prompt = `Design an architecture for: ${JSON.stringify(requirements)}`;
        const architecture = await this.callLLM(prompt);

        const parsedArchitecture = JSON.parse(architecture);
        const folderStructure = parsedArchitecture.folders;

        // Crear estructura de carpetas en VS Code
        for (const folder of folderStructure) {
          const uri = vscode.Uri.file(`${vscode.workspace.rootPath}/${folder}`);
          await vscode.workspace.fs.createDirectory(uri);
        }

        await this.saveToMemory(parsedArchitecture, {
          type: 'architecture',
          project: input
        });

        return {
          output: JSON.stringify(parsedArchitecture, null, 2),
          metadata: { architecture: parsedArchitecture }
        };
      }
    }
    ```

- **OrchestratorAgent**
  - **Responsabilidad**: Coordina interacciones, gestiona dependencias, y supervisa el flujo de trabajo, con integración en VS Code.
  - **Capacidades**:
    - Mantiene un **grafo dinámico de dependencias** usando el **Sistema de Memoria** (Neo4j para relaciones, Faiss para modo offline).
    - Implementa un **TaskManager** para el ciclo de vida de tareas, con estados visibles en VS Code.
    - Resuelve bloqueos y prioriza tareas usando una **PriorityQueue**.
    - Notifica al usuario sobre el estado de las tareas mediante `vscode.window.showInformationMessage`.
  - **Persistencia de Contexto**:
    - Guarda el estado en `cjdevmind.db` y en el almacenamiento local de VS Code (`vscode.Memento`).
    - Checkpoints cada 100 operaciones o 10 minutos.
  - **Ejecución Autónoma Supervisada**:
    - Modo simulación para previsualizar acciones.
    - Rollbacks automáticos con puntos de restauración (usando el **GitAdapter**).
    - Logs transaccionales para reconstruir el estado.
  - **Interacciones**:
    - Recibe tareas del **QuestionAgent**.
    - Usa el **MemoryAgent** para contexto.
    - Actualiza el **DashboardAgent** con el estado de las tareas.
    - Usa el **VSCodeAgentBridge** para ejecutar agentes en VS Code.
  - **Ejemplo**:
    - Tarea: "Implementar un endpoint de login."
    - Acción: Asigna tareas al **APIAgent**, **DatabaseAgent**, **SecurityAgent**, y notifica al usuario en VS Code.
  - **Implementación**:
    ```typescript
    class OrchestratorAgent extends BaseAgent {
      private taskManager: TaskManager;
      private dependencyGraph: DependencyGraph;
      private priorityQueue: PriorityQueue<Task>;

      constructor(config: AgentConfig) {
        super(config);
        this.taskManager = new TaskManager();
        this.dependencyGraph = new DependencyGraph();
        this.priorityQueue = new PriorityQueue<Task>();
      }

      async execute(input: string): Promise<AgentResult> {
        const tasks = await this.taskManager.createTasks(input);
        for (const task of tasks) {
          this.dependencyGraph.addTask(task);
          this.priorityQueue.enqueue(task, task.priority);
        }

        while (!this.priorityQueue.isEmpty()) {
          const task = this.priorityQueue.dequeue();
          if (this.dependencyGraph.hasUnresolvedDependencies(task)) {
            task.status = 'BLOCKED';
            this.taskManager.updateTask(task);
            continue;
          }

          const agent = AgentFactory.create(task.agent, this.config);
          const result = await agent.execute(task.input);
          task.status = result.success ? 'COMPLETED' : 'ERROR';
          this.taskManager.updateTask(task);

          // Notificar al usuario en VS Code
          vscode.window.showInformationMessage(`Task ${task.id} (${task.agent}): ${task.status}`);
        }

        return {
          output: 'All tasks processed',
          metadata: { tasks: this.taskManager.getTasks() }
        };
      }
    }
    ```

- **ExtensionAgent**
  - **Responsabilidad**: Gestiona extensiones del marketplace, integrado en VS Code, permitiendo la **autoextensión** del sistema según los requerimientos.
  - **Capacidades**:
    - Lista, instala, y configura extensiones desde el marketplace (por ejemplo, plugins de AR, multilenguaje, o temas personalizados).
    - Usa el **PaymentService** para procesar compras con créditos.
    - Ejecuta extensiones en un **PluginSandbox** para garantizar seguridad.
    - **Autoextensión**: Permite añadir nuevas funcionalidades al sistema (como soporte para AR o nuevas herramientas de testing) instalando extensiones, lo que funcionalmente puede equivaler a "nuevos agentes" en términos de capacidades, aunque no crea agentes nuevos en la jerarquía.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → COMPLETED.
  - **Interacciones**:
    - Depende del **IntegrationAgent** para conectar con la **MarketplaceAPI**.
    - Colabora con el **DashboardAgent** para mostrar extensiones disponibles.
    - Usa el **VSCodeMarketplaceBridge** para integrarse con el marketplace oficial de VS Code.
  - **Modelo de Negocio**:
    - Gestiona compras con créditos (por ejemplo, 50 créditos por un plugin de AR).
    - Restringe acceso según la licencia (Community: limitado, Professional/Enterprise: completo).
  - **Ejemplo**:
    - Entrada: "Instalar extensión de realidad aumentada para un sistema MLM."
    - Salida: Extensión instalada y configurada, con notificación en VS Code, permitiendo que agentes como **ComponentAgent** generen componentes AR.
  - **Implementación**:
    ```typescript
    class ExtensionAgent extends BaseAgent {
      private marketplaceAPI: MarketplaceAPI;

      constructor(config: AgentConfig) {
        super(config);
        this.marketplaceAPI = new MarketplaceAPI(config.marketplaceConfig);
      }

      async execute(input: string): Promise<AgentResult> {
        const plugins = await this.marketplaceAPI.listPlugins({ category: input });
        const pluginNames = plugins.map(p => p.name);

        // Mostrar lista de plugins en VS Code
        const selectedPlugin = await vscode.window.showQuickPick(pluginNames, {
          placeHolder: 'Select a plugin to install'
        });

        if (!selectedPlugin) {
          throw new Error('No plugin selected');
        }

        const plugin = plugins.find(p => p.name === selectedPlugin);
        const installResult = await this.marketplaceAPI.installPlugin(plugin.id);

        await this.saveToMemory({ plugin: plugin.name, installResult }, {
          type: 'extension',
          project: input
        });

        return {
          output: `Plugin ${plugin.name} installed successfully`,
          metadata: { installResult }
        };
      }
    }
    ```

#### 2. Frontend (Interfaz de Usuario)

- **UIDesignAgent**
  - **Responsabilidad**: Diseña interfaces de usuario, con soporte para previsualización en VS Code.
  - **Capacidades**:
    - Genera sistemas de diseño (colores, tipografía, espaciado).
    - Aplica principios de UX y accesibilidad (WCAG).
    - Muestra previsualizaciones en un webview de VS Code.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → REVIEW → COMPLETED.
  - **Interacciones**:
    - Depende del **VisionAgent** para descripciones de wireframes.
    - Pasa diseños al **LayoutAgent** y al **StyleAgent**.
    - Usa el **MemoryAgent** para almacenar sistemas de diseño.
    - Colabora con el **StyleAgent** para aplicar temas y estilos consistentes.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar sus prompts y diseños.
  - **Ejemplo**:
    - Entrada: "Diseñar un dashboard con tema oscuro."
    - Salida: Sistema de diseño (colores: negro/gris, tipografía: Roboto), previsualización en VS Code.
  - **Implementación**:
    ```typescript
    class UIDesignAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const prompt = `Design a UI system for: ${input}`;
        const designSystem = await this.callLLM(prompt);
        const parsedDesign = JSON.parse(designSystem);

        // Mostrar previsualización en un webview de VS Code
        const htmlContent = `
          <html>
          <body style="background: ${parsedDesign.colors.background}; color: ${parsedDesign.colors.text}">
            <h1>Preview</h1>
            <p>Typography: ${parsedDesign.typography}</p>
            <button style="background: ${parsedDesign.colors.primary}">Sample Button</button>
          </body>
          </html>
        `;
        await this.vscodeAdapter.showWebview('ui-preview', htmlContent);

        await this.saveToMemory(parsedDesign, {
          type: 'design-system',
          project: input
        });

        return {
          output: JSON.stringify(parsedDesign, null, 2),
          metadata: { designSystem: parsedDesign }
        };
      }
    }
    ```

- **LayoutAgent**
  - **Responsabilidad**: Convierte diseños en layouts (HTML/CSS, React), con soporte para generar archivos en VS Code.
  - **Capacidades**:
    - Genera código responsive (usando CSS Grid, Flexbox).
    - Usa frameworks definidos por el **ArchitectAgent** (por ejemplo, React, Tailwind CSS).
    - Escribe archivos en el proyecto del usuario mediante `vscode.workspace.fs`.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → BLOCKED (si diseño no está listo) → COMPLETED.
  - **Interacciones**:
    - Depende del **UIDesignAgent** para el sistema de diseño.
    - Colabora con el **ComponentAgent** para integrar componentes.
    - Usa el **StyleAgent** para aplicar estilos consistentes.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar la generación de layouts.
  - **Ejemplo**:
    - Entrada: Diseño de un dashboard.
    - Salida: Archivo `DashboardLayout.jsx` con un layout de grid, creado en `src/layouts`.
  - **Implementación**:
    ```typescript
    class LayoutAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const designSystem = await this.queryMemory(input);
        const prompt = `Generate a responsive layout for: ${JSON.stringify(designSystem)}`;
        const layoutCode = await this.callLLM(prompt);

        // Escribir archivo en el proyecto
        const filePath = `${vscode.workspace.rootPath}/src/layouts/DashboardLayout.jsx`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(layoutCode, 'utf8'));

        await this.saveToMemory({ filePath, code: layoutCode }, {
          type: 'layout',
          project: input
        });

        return {
          output: `Layout generated at ${filePath}`,
          metadata: { filePath, code: layoutCode }
        };
      }
    }
    ```

- **ComponentAgent (Actualizado)**
  - **Responsabilidad**: Crea componentes reutilizables, con soporte para generar archivos en VS Code y mejoras en accesibilidad y documentación.
  - **Capacidades**:
    - Genera componentes modulares (por ejemplo, botones, formularios) en múltiples frameworks (React, Vue, Angular, Svelte).
    - Aplica estilos consistentes basados en el sistema de diseño del **UIDesignAgent**.
    - Asegura accesibilidad (WCAG AA) y genera estados (hover, focus, disabled).
    - Escribe archivos en el proyecto del usuario mediante `vscode.workspace.fs`.
    - Genera documentación automática (JSDoc/TSDoc) y ejemplos de uso.
    - Puede aprovechar extensiones instaladas por el **ExtensionAgent** (por ejemplo, para soportar AR o multilenguaje).
  - **Persistencia de Contexto**:
    - Guarda componentes en el **MemoryAgent** para reutilización.
  - **Interacciones**:
    - Trabaja con el **LayoutAgent** para integrar componentes.
    - Depende del **UIDesignAgent** y del **StyleAgent** para estilos.
    - Colabora con el **CodeReviewAgent** para revisiones de calidad.
    - Usa el **TestAgent** para generar pruebas automatizadas de los componentes.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar la generación de componentes.
  - **Ejemplo**:
    - Entrada: "Crear un botón de login con tema oscuro en React."
    - Salida: Componente `<LoginButton />` en `src/components/LoginButton.tsx`, con documentación y ejemplo de uso.
  - **Implementación**:
    ```typescript
    class ComponentAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const designSystem = await this.queryMemory('design-system');
        const prompt = `Generate a reusable component for: ${input}, using design system: ${JSON.stringify(designSystem)}`;
        const componentCode = await this.callLLM(prompt);

        // Escribir archivo en el proyecto
        const filePath = `${vscode.workspace.rootPath}/src/components/LoginButton.tsx`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(componentCode, 'utf8'));

        // Generar documentación
        const docPath = `${vscode.workspace.rootPath}/src/components/LoginButton.md`;
        const docUri = vscode.Uri.file(docPath);
        const docContent = `## LoginButton\n\n### Props\n- **label**: string\n- **onClick**: () => void\n\n### Example\n\`\`\`tsx\n<LoginButton label="Login" onClick={() => console.log('Clicked')} />\n\`\`\``;
        await vscode.workspace.fs.writeFile(docUri, Buffer.from(docContent, 'utf8'));

        await this.saveToMemory({ filePath, code: componentCode, docPath, docContent }, {
          type: 'component',
          project: input
        });

        // Notificar a CodeReviewAgent y TestAgent
        this.publishEvent('component-created', { filePath, code: componentCode }, 'calidad');

        return {
          output: `Component generated at ${filePath}`,
          metadata: { filePath, code: componentCode, docPath, docContent }
        };
      }
    }
    ```

- **FrontendSyncAgent**
  - **Responsabilidad**: Sincroniza frontend con backend, con soporte para generar código en VS Code.
  - **Capacidades**:
    - Genera código para solicitudes HTTP (usando `fetch` o `axios`).
    - Gestiona estados (React hooks, Redux).
    - Escribe archivos en el proyecto del usuario mediante `vscode.workspace.fs`.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → BLOCKED (si APIs no están listas) → COMPLETED.
  - **Interacciones**:
    - Depende del **APIAgent** para obtener endpoints.
    - Colabora con el **ComponentAgent** para integrar componentes.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar la sincronización.
  - **Ejemplo**:
    - Entrada: "Conectar un formulario de login a una API."
    - Salida: Código en `src/services/auth.js` para enviar datos a `/login`.
  - **Implementación**:
    ```typescript
    class FrontendSyncAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const apiEndpoints = await this.queryMemory('api-endpoints');
        const prompt = `Generate frontend sync code for: ${input}, using endpoints: ${JSON.stringify(apiEndpoints)}`;
        const syncCode = await this.callLLM(prompt);

        // Escribir archivo en el proyecto
        const filePath = `${vscode.workspace.rootPath}/src/services/auth.js`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(syncCode, 'utf8'));

        await this.saveToMemory({ filePath, code: syncCode }, {
          type: 'frontend-sync',
          project: input
        });

        return {
          output: `Frontend sync code generated at ${filePath}`,
          metadata: { filePath, code: syncCode }
        };
      }
    }
    ```

- **StyleAgent (Nuevo)**
  - **Responsabilidad**: Gestiona temas y estilos visuales, asegurando consistencia en el frontend.
  - **Capacidades**:
    - Aplica temas (claro, oscuro, personalizado) basados en el sistema de diseño del **UIDesignAgent**.
    - Genera variables CSS y configuraciones Tailwind para mantener consistencia visual.
    - Gestiona transiciones de estilo (por ejemplo, cambio de tema dinámico).
    - Escribe archivos de estilo en el proyecto del usuario mediante `vscode.workspace.fs`.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → COMPLETED.
  - **Interacciones**:
    - Depende del **UIDesignAgent** para el sistema de diseño y temas.
    - Colabora con el **ComponentAgent** y el **LayoutAgent** para aplicar estilos.
    - Usa el **MemoryAgent** para almacenar configuraciones de estilo.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar la generación de estilos.
  - **Ejemplo**:
    - Entrada: "Aplicar un tema oscuro a un dashboard."
    - Salida: Archivo `src/styles/theme-dark.css` con variables CSS y configuración Tailwind actualizada.
  - **Implementación**:
    ```typescript
    class StyleAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const designSystem = await this.queryMemory('design-system');
        const prompt = `Generate styles for: ${input}, using design system: ${JSON.stringify(designSystem)}`;
        const styleCode = await this.callLLM(prompt);

        // Escribir archivo de estilos
        const filePath = `${vscode.workspace.rootPath}/src/styles/theme-dark.css`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(styleCode, 'utf8'));

        // Actualizar configuración Tailwind
        const tailwindConfigPath = `${vscode.workspace.rootPath}/tailwind.config.js`;
        const tailwindConfigUri = vscode.Uri.file(tailwindConfigPath);
        const tailwindConfig = await this.updateTailwindConfig(designSystem);
        await vscode.workspace.fs.writeFile(tailwindConfigUri, Buffer.from(tailwindConfig, 'utf8'));

        await this.saveToMemory({ filePath, code: styleCode, tailwindConfigPath, tailwindConfig }, {
          type: 'style',
          project: input
        });

        return {
          output: `Styles generated at ${filePath}`,
          metadata: { filePath, code: styleCode, tailwindConfigPath, tailwindConfig }
        };
      }

      private async updateTailwindConfig(designSystem: any): Promise<string> {
        const colors = designSystem.colors || {};
        return `
          module.exports = {
            theme: {
              extend: {
                colors: ${JSON.stringify(colors, null, 2)}
              }
            }
          };
        `;
      }
    }
    ```

#### 3. Backend (Lógica y Datos)

- **APIAgent**
  - **Responsabilidad**: Diseña e implementa APIs, con soporte para generar archivos en VS Code.
  - **Capacidades**:
    - Genera endpoints con validaciones (usando Express, FastAPI).
    - Implementa middleware para autenticación y logging.
    - Escribe archivos en el proyecto del usuario mediante `vscode.workspace.fs`.
  - **Ejecución Autónoma Supervisada**:
    - Crea puntos de restauración (usando el **GitAdapter**) y logs transaccionales antes de cambios.
  - **Interacciones**:
    - Depende del **ArchitectAgent** para la arquitectura.
    - Colabora con el **DatabaseAgent** para esquemas.
    - Pasa endpoints al **FrontendSyncAgent**.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar la generación de endpoints.
  - **Ejemplo**:
    - Entrada: "Crear un endpoint para registrar usuarios."
    - Salida: Endpoint `/register` en `src/backend/routes/auth.js`.
  - **Implementación**:
    ```typescript
    class APIAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const architecture = await this.queryMemory('architecture');
        const prompt = `Generate an API endpoint for: ${input}, using framework: ${architecture.backendFramework}`;
        const endpointCode = await this.callLLM(prompt);

        // Crear punto de restauración
        const gitAdapter = new GitAdapter(vscode.workspace.rootPath);
        await gitAdapter.commit(`Pre-API change: ${input}`);

        // Escribir archivo en el proyecto
        const filePath = `${vscode.workspace.rootPath}/src/backend/routes/auth.js`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(endpointCode, 'utf8'));

        await this.saveToMemory({ filePath, code: endpointCode }, {
          type: 'api-endpoint',
          project: input
        });

        return {
          output: `Endpoint generated at ${filePath}`,
          metadata: { filePath, code: endpointCode }
        };
      }
    }
    ```

- **LogicAgent**
  - **Responsabilidad**: Implementa lógica de negocio, con soporte para generar archivos en VS Code.
  - **Capacidades**:
    - Escribe funciones para reglas de negocio (por ejemplo, cálculo de comisiones MLM).
    - Optimiza lógica para mejorar rendimiento.
    - Escribe archivos en el proyecto del usuario mediante `vscode.workspace.fs`.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → ERROR (si falla un test) → IN_PROGRESS → COMPLETED.
  - **Interacciones**:
    - Depende del **APIAgent** para integrarse con endpoints.
    - Trabaja con el **TestingAgent** y el **TestAgent** para validar lógica.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar la lógica generada.
  - **Ejemplo**:
    - Entrada: "Calcular el total de una orden en un sistema MLM."
    - Salida: Función `calculateOrderTotal()` en `src/backend/logic/orders.js`.
  - **Implementación**:
    ```typescript
    class LogicAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const prompt = `Generate business logic for: ${input}`;
        const logicCode = await this.callLLM(prompt);

        // Escribir archivo en el proyecto
        const filePath = `${vscode.workspace.rootPath}/src/backend/logic/orders.js`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(logicCode, 'utf8'));

        await this.saveToMemory({ filePath, code: logicCode }, {
          type: 'business-logic',
          project: input
        });

        return {
          output: `Logic generated at ${filePath}`,
          metadata: { filePath, code: logicCode }
        };
      }
    }
    ```

- **DatabaseAgent**
  - **Responsabilidad**: Gestiona esquemas y migraciones, con soporte para generar archivos en VS Code.
  - **Capacidades**:
    - Diseña esquemas de bases de datos (PostgreSQL, MySQL).
    - Genera migraciones para cambios en el esquema.
    - Escribe archivos de migración en el proyecto del usuario mediante `vscode.workspace.fs`.
  - **Persistencia de Contexto**:
    - Guarda esquemas y migraciones en el **MemoryAgent**.
  - **Interacciones**:
    - Depende del **ArchitectAgent** para la arquitectura.
    - Proporciona esquemas al **APIAgent**.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar la generación de esquemas.
  - **Ejemplo**:
    - Entrada: "Crear una tabla de usuarios para un sistema MLM."
    - Salida: Esquema SQL para `users` en `src/backend/migrations/001_create_users.sql`.
  - **Implementación**:
    ```typescript
    class DatabaseAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const architecture = await this.queryMemory('architecture');
        const prompt = `Generate a database schema for: ${input}, using database: ${architecture.database}`;
        const schemaCode = await this.callLLM(prompt);

        // Escribir archivo de migración
        const filePath = `${vscode.workspace.rootPath}/src/backend/migrations/001_create_users.sql`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(schemaCode, 'utf8'));

        await this.saveToMemory({ filePath, code: schemaCode }, {
          type: 'database-schema',
          project: input
        });

        return {
          output: `Schema generated at ${filePath}`,
          metadata: { filePath, code: schemaCode }
        };
      }
    }
    ```

- **IntegrationAgent**
  - **Responsabilidad**: Integra servicios externos, con soporte para gestionar claves en VS Code.
  - **Capacidades**:
    - Configura integraciones con servicios externos (OAuth, Stripe, ARKit).
    - Gestiona claves API de forma segura usando `vscode.SecretStorage`.
    - Genera código para interactuar con APIs externas.
  - **Interacciones**:
    - Depende del **SecurityAgent** para validar integraciones.
    - Colabora con el **APIAgent** para conectar endpoints.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar las integraciones.
  - **Ejemplo**:
    - Entrada: "Integrar Stripe para pagos en un sistema MLM."
    - Salida: Código para manejar pagos en `src/backend/integrations/stripe.js`.
  - **Implementación**:
    ```typescript
    class IntegrationAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const prompt = `Generate integration code for: ${input}`;
        const integrationCode = await this.callLLM(prompt);

        // Almacenar clave API de forma segura
        const stripeKey = await vscode.window.showInputBox({ prompt: 'Enter your Stripe API key', password: true });
        await this.vscodeAdapter.storeSecret('stripe-api-key', stripeKey);

        // Escribir archivo de integración
        const filePath = `${vscode.workspace.rootPath}/src/backend/integrations/stripe.js`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(integrationCode, 'utf8'));

        await this.saveToMemory({ filePath, code: integrationCode }, {
          type: 'integration',
          project: input
        });

        return {
          output: `Integration generated at ${filePath}`,
          metadata: { filePath, code: integrationCode }
        };
      }
    }
    ```

#### 4. Calidad (Aseguramiento y Optimización)

- **TestingAgent**
  - **Responsabilidad**: Escribe y ejecuta pruebas, con soporte para generar archivos de prueba en VS Code.
  - **Capacidades**:
    - Genera pruebas unitarias e integrales (Jest, Pytest).
    - Reporta errores y cobertura de pruebas.
    - Escribe archivos de prueba en el proyecto del usuario mediante `vscode.workspace.fs`.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → ERROR (si falla) → COMPLETED.
  - **Interacciones**:
    - Depende del **APIAgent** y **LogicAgent** para probar código.
    - Notifica al **OrchestratorAgent** sobre resultados.
    - Colabora con el **TestAgent** para pruebas más especializadas.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar la generación de pruebas.
  - **Ejemplo**:
    - Entrada: "Probar un endpoint de login."
    - Salida: Pruebas Jest en `src/backend/tests/auth.test.js`.
  - **Implementación**:
    ```typescript
    class TestingAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const codeToTest = await this.queryMemory('api-endpoint');
        const prompt = `Generate tests for: ${input}, using code: ${JSON.stringify(codeToTest)}`;
        const testCode = await this.callLLM(prompt);

        // Escribir archivo de pruebas
        const filePath = `${vscode.workspace.rootPath}/src/backend/tests/auth.test.js`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(testCode, 'utf8'));

        await this.saveToMemory({ filePath, code: testCode }, {
          type: 'tests',
          project: input
        });

        return {
          output: `Tests generated at ${filePath}`,
          metadata: { filePath, code: testCode }
        };
      }
    }
    ```

- **SecurityAgent**
  - **Responsabilidad**: Analiza vulnerabilidades y aplica medidas de seguridad, con soporte para VS Code.
  - **Capacidades**:
    - Detecta vulnerabilidades (SQL injection, XSS).
    - Aplica JWT, encriptación, y sanitización de entradas.
    - Usa `vscode.SecretStorage` para gestionar claves.
  - **Ejecución Autónoma Supervisada**:
    - Crea rollbacks automáticos antes de aplicar parches.
    - Registra logs transaccionales.
  - **Interacciones**:
    - Valida integraciones del **IntegrationAgent**.
    - Trabaja con el **APIAgent** para asegurar endpoints.
    - Colabora con el **CodeReviewAgent** para revisiones de seguridad.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar las medidas de seguridad.
  - **Ejemplo**:
    - Entrada: "Asegurar un endpoint de login."
    - Salida: JWT y validación de entradas en `src/backend/middleware/security.js`.
  - **Implementación**:
    ```typescript
    class SecurityAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const endpointCode = await this.queryMemory('api-endpoint');
        const prompt = `Secure the following endpoint: ${JSON.stringify(endpointCode)}`;
        const securityCode = await this.callLLM(prompt);

        // Crear punto de restauración
        const gitAdapter = new GitAdapter(vscode.workspace.rootPath);
        await gitAdapter.commit(`Pre-security change: ${input}`);

        // Escribir archivo de seguridad
        const filePath = `${vscode.workspace.rootPath}/src/backend/middleware/security.js`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(securityCode, 'utf8'));

        await this.saveToMemory({ filePath, code: securityCode }, {
          type: 'security',
          project: input
        });

        return {
          output: `Security measures applied at ${filePath}`,
          metadata: { filePath, code: securityCode }
        };
      }
    }
    ```

- **PerformanceAgent**
  - **Responsabilidad**: Optimiza rendimiento, con soporte para generar recomendaciones en VS Code.
  - **Capacidades**:
    - Analiza tiempos de carga y uso de recursos.
    - Propone mejoras (indexación, caching).
    - Muestra recomendaciones en VS Code mediante `vscode.window.showInformationMessage`.
  - **Interacciones**:
    - Depende del **MonitorAgent** para métricas.
    - Colabora con el **DatabaseAgent** para optimizar consultas.
    - Usa el **SelfImprovementAgent** para optimizar su propio análisis.
  - **Ejemplo**:
    - Entrada: "Optimizar una consulta a la tabla de usuarios."
    - Salida: Recomendación de índices en `src/backend/optimizations/users_index.sql`.
  - **Implementación**:
    ```typescript
    class PerformanceAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const metrics = await this.queryMemory('performance-metrics');
        const prompt = `Optimize performance for: ${input}, using metrics: ${JSON.stringify(metrics)}`;
        const optimization = await this.callLLM(prompt);

        // Escribir archivo de optimización
        const filePath = `${vscode.workspace.rootPath}/src/backend/optimizations/users_index.sql`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(optimization, 'utf8'));

        // Mostrar recomendación en VS Code
        vscode.window.showInformationMessage(`Performance optimization generated at ${filePath}`);

        await this.saveToMemory({ filePath, code: optimization }, {
          type: 'optimization',
          project: input
        });

        return {
          output: `Optimization generated at ${filePath}`,
          metadata: { filePath, code: optimization }
        };
      }
    }
    ```

- **RefactorAgent**
  - **Responsabilidad**: Refactoriza código para mejorar calidad, con soporte para VS Code.
  - **Capacidades**:
    - Reorganiza código para mayor claridad.
    - Aplica patrones de diseño (por ejemplo, Factory, Singleton).
    - Escribe archivos refactorizados en el proyecto del usuario mediante `vscode.workspace.fs`.
  - **Persistencia de Contexto**:
    - Guarda versiones anteriores en el **MemoryAgent**.
  - **Interacciones**:
    - Trabaja con el **TestingAgent** y el **TestAgent** para validar refactorizaciones.
    - Depende del **LogicAgent** para identificar código a refactorizar.
    - Colabora con el **CodeReviewAgent** para revisiones.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar las refactorizaciones.
  - **Ejemplo**:
    - Entrada: "Refactorizar una función de cálculo de comisiones MLM."
    - Salida: Código refactorizado en `src/backend/logic/commissions.js`.
  - **Implementación**:
    ```typescript
    class RefactorAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const codeToRefactor = await this.queryMemory('business-logic');
        const prompt = `Refactor the following code: ${JSON.stringify(codeToRefactor)}`;
        const refactoredCode = await this.callLLM(prompt);

        // Escribir archivo refactorizado
        const filePath = `${vscode.workspace.rootPath}/src/backend/logic/commissions.js`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(refactoredCode, 'utf8'));

        await this.saveToMemory({ filePath, code: refactoredCode }, {
          type: 'refactored-code',
          project: input
        });

        return {
          output: `Code refactored at ${filePath}`,
          metadata: { filePath, code: refactoredCode }
        };
      }
    }
    ```

- **TestAgent (Nuevo)**
  - **Responsabilidad**: Genera pruebas automatizadas especializadas para componentes y layouts, con soporte para VS Code.
  - **Capacidades**:
    - Genera pruebas de accesibilidad (WCAG AA) y pruebas visuales (por ejemplo, snapshots con Storybook).
    - Escribe pruebas para estados de componentes (hover, focus, disabled).
    - Escribe archivos de prueba en el proyecto del usuario mediante `vscode.workspace.fs`.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → ERROR (si falla) → COMPLETED.
  - **Interacciones**:
    - Depende del **ComponentAgent** y **LayoutAgent** para probar componentes y layouts.
    - Colabora con el **TestingAgent** para pruebas más generales.
    - Usa el **CodeReviewAgent** para validar la calidad de las pruebas.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar la generación de pruebas.
  - **Ejemplo**:
    - Entrada: "Probar accesibilidad de un botón de login."
    - Salida: Pruebas Jest con axe-core en `src/components/tests/LoginButton.test.tsx`.
  - **Implementación**:
    ```typescript
    class TestAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const componentCode = await this.queryMemory('component');
        const prompt = `Generate accessibility and visual tests for: ${input}, using code: ${JSON.stringify(componentCode)}`;
        const testCode = await this.callLLM(prompt);

        // Escribir archivo de pruebas
        const filePath = `${vscode.workspace.rootPath}/src/components/tests/LoginButton.test.tsx`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(testCode, 'utf8'));

        await this.saveToMemory({ filePath, code: testCode }, {
          type: 'specialized-tests',
          project: input
        });

        return {
          output: `Specialized tests generated at ${filePath}`,
          metadata: { filePath, code: testCode }
        };
      }
    }
    ```

- **SelfImprovementAgent (Nuevo)**
  - **Responsabilidad**: Optimiza el código y el comportamiento de otros agentes, permitiendo la **automejora** del sistema según los requerimientos, con soporte para VS Code.
  - **Capacidades**:
    - Analiza el historial de ejecución de agentes para identificar ineficiencias.
    - Propone mejoras en prompts, lógica, o configuraciones (por ejemplo, ajusta prompts del **UIDesignAgent** para generar mejores diseños).
    - Escribe archivos de configuración optimizados en el proyecto del usuario mediante `vscode.workspace.fs`.
    - **Automejora**: Adapta dinámicamente el comportamiento de los agentes para cumplir con los requerimientos del proyecto, mejorando su rendimiento y precisión.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → REVIEW → COMPLETED.
  - **Interacciones**:
    - Usa el **MemoryAgent** para acceder al historial de ejecución.
    - Colabora con todos los agentes para optimizar su comportamiento.
    - Notifica al **OrchestratorAgent** sobre mejoras implementadas.
  - **Ejemplo**:
    - Entrada: "Optimizar el rendimiento del UIDesignAgent."
    - Salida: Nueva configuración de prompts en `src/config/ui-design-agent-prompts.json`.
  - **Implementación**:
    ```typescript
    class SelfImprovementAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const executionHistory = await this.queryMemory('execution-history');
        const prompt = `Analyze and optimize agent performance for: ${input}, using history: ${JSON.stringify(executionHistory)}`;
        const optimization = await this.callLLM(prompt);

        // Escribir archivo de configuración optimizada
        const filePath = `${vscode.workspace.rootPath}/src/config/ui-design-agent-prompts.json`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(optimization, 'utf8'));

        await this.saveToMemory({ filePath, code: optimization }, {
          type: 'agent-optimization',
          project: input
        });

        // Notificar al OrchestratorAgent
        this.publishEvent('agent-optimized', { agent: input, optimization }, 'meta');

        return {
          output: `Agent optimization generated at ${filePath}`,
          metadata: { filePath, code: optimization }
        };
      }
    }
    ```

- **CodeReviewAgent (Nuevo)**
  - **Responsabilidad**: Revisa código generado por otros agentes para asegurar calidad y consistencia, con soporte para VS Code.
  - **Capacidades**:
    - Analiza código en busca de errores, problemas de accesibilidad, y violaciones de mejores prácticas.
    - Propone correcciones y mejoras (por ejemplo, optimización de rendimiento, mejor legibilidad).
    - Muestra revisiones en VS Code mediante `vscode.window.showInformationMessage`.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → REVIEW → COMPLETED.
  - **Interacciones**:
    - Depende del **ComponentAgent**, **APIAgent**, y otros agentes para revisar su código.
    - Colabora con the **TestAgent** para validar que las correcciones pasen las pruebas.
    - Usa el **MemoryAgent** para almacenar revisiones y correcciones.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar sus revisiones.
  - **Ejemplo**:
    - Entrada: "Revisar un componente de login."
    - Salida: Informe de revisión con correcciones en `src/components/LoginButton.tsx`.
  - **Implementación**:
    ```typescript
    class CodeReviewAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const codeToReview = await this.queryMemory('component');
        const prompt = `Review the following code for quality and accessibility: ${JSON.stringify(codeToReview)}`;
        const reviewReport = await this.callLLM(prompt);

        // Aplicar correcciones
        const filePath = `${vscode.workspace.rootPath}/src/components/LoginButton.tsx`;
        const uri = vscode.Uri.file(filePath);
        const correctedCode = this.applyCorrections(codeToReview.code, reviewReport);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(correctedCode, 'utf8'));

        // Mostrar informe en VS Code
        vscode.window.showInformationMessage(`Code review completed: ${reviewReport.summary}`);

        await this.saveToMemory({ filePath, code: correctedCode, reviewReport }, {
          type: 'code-review',
          project: input
        });

        return {
          output: `Code review completed at ${filePath}`,
          metadata: { filePath, code: correctedCode, reviewReport }
        };
      }

      private applyCorrections(originalCode: string, reviewReport: any): string {
        // Simulación de aplicación de correcciones
        return originalCode + `\n// Correcciones aplicadas: ${reviewReport.corrections}`;
      }
    }
    ```

#### 5. Infraestructura (Despliegue y Monitoreo)

- **DevOpsAgent**
  - **Responsabilidad**: Gestiona despliegues y CI/CD, con soporte para VS Code.
  - **Capacidades**:
    - Configura pipelines (GitHub Actions, Jenkins).
    - Gestiona entornos (desarrollo, producción).
    - Usa el **GitAdapter** para commits y rollbacks.
  - **Ejecución Autónoma Supervisada**:
    - Crea rollbacks automáticos y logs transaccionales.
  - **Interacciones**:
    - Depende del **MonitorAgent** para métricas de despliegue.
    - Colabora con el **DashboardAgent** para mostrar el estado del despliegue.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar los pipelines.
  - **Ejemplo**:
    - Entrada: "Desplegar una app MLM en producción."
    - Salida: Pipeline configurado en `.github/workflows/deploy.yml`.
  - **Implementación**:
    ```typescript
    class DevOpsAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const prompt = `Generate a CI/CD pipeline for: ${input}`;
        const pipelineCode = await this.callLLM(prompt);

        // Crear punto de restauración
        const gitAdapter = new GitAdapter(vscode.workspace.rootPath);
        await gitAdapter.commit(`Pre-deployment: ${input}`);

        // Escribir archivo de pipeline
        const filePath = `${vscode.workspace.rootPath}/.github/workflows/deploy.yml`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(pipelineCode, 'utf8'));

        await this.saveToMemory({ filePath, code: pipelineCode }, {
          type: 'pipeline',
          project: input
        });

        return {
          output: `Pipeline generated at ${filePath}`,
          metadata: { filePath, code: pipelineCode }
        };
      }
    }
    ```

- **MonitorAgent**
  - **Responsabilidad**: Recolecta métricas, con soporte para VS Code.
  - **Capacidades**:
    - Registra métricas (uso de CPU, tiempos de respuesta).
    - Genera alertas para problemas (por ejemplo, alta latencia).
    - Muestra métricas en el dashboard de VS Code.
  - **Persistencia de Contexto**:
    - Guarda métricas en el **MemoryAgent**.
  - **Interacciones**:
    - Proporciona datos al **PerformanceAgent**.
    - Actualiza el **DashboardAgent** con métricas.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar la recolección de métricas.
  - **Ejemplo**:
    - Entrada: "Monitorear una API de login."
    - Salida: Métricas de respuesta (latencia: 200ms, uso de CPU: 5%).
  - **Implementación**:
    ```typescript
    class MonitorAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const metrics = await this.collectMetrics(input);
        await this.saveToMemory(metrics, {
          type: 'metrics',
          project: input
        });

        // Publicar evento para el DashboardAgent
        this.publishEvent('metrics-update', metrics, 'infrastructure');

        return {
          output: JSON.stringify(metrics, null, 2),
          metadata: { metrics }
        };
      }

      private async collectMetrics(input: string): Promise<any> {
        // Simulación de recolección de métricas
        return {
          latency: 200,
          cpuUsage: 5,
          timestamp: Date.now()
        };
      }
    }
    ```

- **DashboardAgent**
  - **Responsabilidad**: Mantiene el dashboard de supervisión, renderizado en VS Code.
  - **Capacidades**:
    - Muestra estados de tareas, métricas de ROI, y saldo de créditos.
    - Integra el marketplace para comprar extensiones.
    - Usa un webview de VS Code para renderizar el dashboard.
  - **Interacciones**:
    - Depende del **OrchestratorAgent** para el estado de las tareas.
    - Usa datos del **MonitorAgent** y **AnalyticsAgent**.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar la visualización.
  - **Ejemplo**:
    - Entrada: "Crear dashboard de supervisión."
    - Salida: Webview en VS Code mostrando tareas, métricas, y opciones de compra.
  - **Implementación**:
    ```typescript
    class DashboardAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const tasks = await this.queryMemory('tasks');
        const metrics = await this.queryMemory('metrics');
        const license = await this.queryMemory('license');

        const htmlContent = `
          <html>
          <body>
            <h1>CJ.DevMind Dashboard</h1>
            <h2>Tasks</h2>
            <pre>${JSON.stringify(tasks, null, 2)}</pre>
            <h2>Metrics</h2>
            <pre>${JSON.stringify(metrics, null, 2)}</pre>
            <h2>License</h2>
            <pre>${JSON.stringify(license, null, 2)}</pre>
          </body>
          </html>
        `;

        await this.vscodeAdapter.showWebview('dashboard', htmlContent);

        return {
          output: 'Dashboard rendered in VS Code',
          metadata: { tasks, metrics, license }
        };
      }
    }
    ```

- **AnalyticsAgent**
  - **Responsabilidad**: Analiza datos y genera reportes, con soporte para VS Code.
  - **Capacidades**:
    - Calcula ROI basado en métricas de proyecto.
    - Genera reportes (por ejemplo, costos vs. beneficios).
    - Muestra reportes en el dashboard de VS Code.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → REVIEW → COMPLETED.
  - **Interacciones**:
    - Depende del **MonitorAgent** para métricas.
    - Actualiza el **DashboardAgent** con reportes.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar los reportes.
  - **Ejemplo**:
    - Entrada: "Calcular ROI de un sistema MLM."
    - Salida: Reporte (inversión: $5000, retorno proyectado: $15000).
  - **Implementación**:
    ```typescript
    class AnalyticsAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const metrics = await this.queryMemory('metrics');
        const prompt = `Calculate ROI for: ${input}, using metrics: ${JSON.stringify(metrics)}`;
        const report = await this.callLLM(prompt);

        await this.saveToMemory(report, {
          type: 'analytics-report',
          project: input
        });

        // Publicar evento para el DashboardAgent
        this.publishEvent('report-update', report, 'infrastructure');

        return {
          output: JSON.stringify(report, null, 2),
          metadata: { report }
        };
      }
    }
    ```

#### 6. Documentación (Registro y Contexto)

- **DocAgent**
  - **Responsabilidad**: Genera documentación, con soporte para VS Code.
  - **Capacidades**:
    - Crea documentación de APIs (Swagger, Markdown).
    - Genera guías de usuario y técnicas.
    - Escribe archivos de documentación en el proyecto del usuario mediante `vscode.workspace.fs`.
  - **Persistencia de Contexto**:
    - Guarda versiones de documentación en el **MemoryAgent**.
  - **Interacciones**:
    - Depende del **APIAgent** para documentar endpoints.
    - Colabora con el **MemoryAgent** para almacenar documentación.
    - Usa el **CodeReviewAgent** para validar la calidad de la documentación.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar la documentación.
  - **Ejemplo**:
    - Entrada: "Documentar un endpoint de registro."
    - Salida: Archivo Markdown `docs/api/register.md`.
  - **Implementación**:
    ```typescript
    class DocAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const endpoint = await this.queryMemory('api-endpoint');
        const prompt = `Generate documentation for: ${JSON.stringify(endpoint)}`;
        const docContent = await this.callLLM(prompt);

        // Escribir archivo de documentación
        const filePath = `${vscode.workspace.rootPath}/docs/api/register.md`;
        const uri = vscode.Uri.file(filePath);
        await vscode.workspace.fs.writeFile(uri, Buffer.from(docContent, 'utf8'));

        await this.saveToMemory({ filePath, content: docContent }, {
          type: 'documentation',
          project: input
        });

        return {
          output: `Documentation generated at ${filePath}`,
          metadata: { filePath, content: docContent }
        };
      }
    }
    ```

- **MemoryAgent**
  - **Responsabilidad**: Gestiona el contexto global, con soporte para VS Code.
  - **Capacidades**:
    - Almacena código, estados, métricas, decisiones, tendencias del mercado, preferencias del usuario.
    - Proporciona contexto histórico a todos los agentes.
    - Usa almacenamiento local en VS Code (`vscode.Memento`, `vscode.workspace.fs`) para modo offline.
  - **Persistencia de Contexto**:
    - Guarda en `cjdevmind.db` (SQLite) y en Pinecone/Neo4j (en línea).
    - Checkpoints cada 100 operaciones o 10 minutos.
    - Usa Faiss para búsqueda vectorial en modo offline.
  - **Interacciones**:
    - Proporciona datos a todos los agentes.
    - Colabora con el **OrchestratorAgent** para mantener el grafo de dependencias.
    - Soporta al **SelfImprovementAgent** proporcionando historial de ejecución.
  - **Ejemplo**:
    - Entrada: "Guardar esquema de base de datos."
    - Salida: Esquema almacenado en `cjdevmind.db` y en el **Sistema de Memoria**.
  - **Implementación**:
    ```typescript
    class MemoryAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const data = JSON.parse(input);
        const metadata = { type: data.type, project: data.project };
        await this.saveToMemory(data.content, metadata);

        return {
          output: `Data stored: ${data.type}`,
          metadata: { data, metadata }
        };
      }
    }
    ```

#### 7. Negocio (Estrategia y Lanzamiento)

- **BusinessAgent**
  - **Responsabilidad**: Evalúa la viabilidad económica de un proyecto.
  - **Capacidades**:
    - Analiza costos, beneficios, y ROI.
    - Propone estrategias de monetización.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → REVIEW → COMPLETED.
  - **Interacciones**:
    - Colabora con el **AnalyticsAgent** para datos financieros.
    - Proporciona información al **LaunchAgent**.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar los análisis.
  - **Ejemplo**:
    - Entrada: "Evaluar viabilidad de un sistema MLM con AR."
    - Salida: Reporte (costo: $5000, beneficio proyectado: $15000).
  - **Implementación**:
    ```typescript
    class BusinessAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const metrics = await this.queryMemory('metrics');
        const prompt = `Evaluate business viability for: ${input}, using metrics: ${JSON.stringify(metrics)}`;
        const report = await this.callLLM(prompt);

        await this.saveToMemory(report, {
          type: 'business-report',
          project: input
        });

        return {
          output: JSON.stringify(report, null, 2),
          metadata: { report }
        };
      }
    }
    ```

- **MarketAgent**
  - **Responsabilidad**: Analiza tendencias del mercado.
  - **Capacidades**:
    - Recopila datos sobre software demandado (por ejemplo, "MLM con AR es tendencia").
    - Propone características basadas en tendencias.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → COMPLETED.
  - **Interacciones**:
    - Usa el **MemoryAgent** para almacenar tendencias.
    - Colabora con el **BusinessAgent** para estrategias.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar los análisis de mercado.
  - **Ejemplo**:
    - Entrada: "Analizar tendencias para un sistema MLM."
    - Salida: Reporte (tendencia: integración con AR, multilenguaje).
  - **Implementación**:
    ```typescript
    class MarketAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const trends = await this.queryMemory('market-trends');
        const prompt = `Analyze market trends for: ${input}, using data: ${JSON.stringify(trends)}`;
        const report = await this.callLLM(prompt);

        await this.saveToMemory(report, {
          type: 'market-report',
          project: input
        });

        return {
          output: JSON.stringify(report, null, 2),
          metadata: { report }
        };
      }
    }
    ```

- **LaunchAgent**
  - **Responsabilidad**: Planifica el lanzamiento de un proyecto.
  - **Capacidades**:
    - Crea planes de lanzamiento (por ejemplo, mercados objetivo, estrategias de marketing).
    - Coordina con el **DevOpsAgent** para despliegues finales.
  - **Ciclo de Vida de Tareas**: PENDING → IN_PROGRESS → REVIEW → COMPLETED.
  - **Interacciones**:
    - Depende del **BusinessAgent** y **MarketAgent** para datos.
    - Colabora con el **DashboardAgent** para mostrar el plan.
    - Puede ser optimizado por el **SelfImprovementAgent** para mejorar los planes de lanzamiento.
  - **Ejemplo**:
    - Entrada: "Planificar lanzamiento de un sistema MLM con AR."
    - Salida: Plan (mercados: inglés/español, marketing: redes sociales).
  - **Implementación**:
    ```typescript
    class LaunchAgent extends BaseAgent {
      async execute(input: string): Promise<AgentResult> {
        const businessReport = await this.queryMemory('business-report');
        const marketReport = await this.queryMemory('market-report');
        const prompt = `Plan a launch for: ${input}, using business data: ${JSON.stringify(businessReport)}, market data: ${JSON.stringify(marketReport)}`;
        const plan = await this.callLLM(prompt);

        await this.saveToMemory(plan, {
          type: 'launch-plan',
          project: input
        });

        return {
          output: JSON.stringify(plan, null, 2),
          metadata: { plan }
        };
      }
    }
    ```

#### 8. Otros (Integración con VS Code)

- **VSCodeAgentBridge**
  - **Responsabilidad**: Puente para ejecutar agentes dentro de VS Code (no es un agente especializado, sino un componente de integración).
  - **Capacidades**:
    - Registra comandos de VS Code para cada agente (`cjdevmind.[agent]`).
    - Gestiona la comunicación entre agentes y el entorno de VS Code.
    - Usa WebSockets para conectar con un servidor backend para tareas pesadas.
  - **Interacciones**:
    - Colabora con todos los agentes para ejecutar tareas.
    - Usa el **VSCodeAdapter** para interactuar con VS Code.
  - **Ejemplo**:
    - Entrada: Comando `cjdevmind.question` en VS Code.
    - Salida: **QuestionAgent** ejecutado, con resultados mostrados en VS Code.
  - **Implementación**:
    ```typescript
    class VSCodeAgentBridge {
      private context: vscode.ExtensionContext;

      constructor(context: vscode.ExtensionContext) {
        this.context = context;
      }

      registerCommands() {
        const agents = [
          'question', 'vision', 'architect', 'orchestrator', 'extension',
          'uiDesign', 'layout', 'component', 'frontendSync', 'style',
          'api', 'logic', 'database', 'integration',
          'testing', 'security', 'performance', 'refactor', 'test', 'selfImprovement', 'codeReview',
          'devops', 'monitor', 'dashboard', 'analytics',
          'doc', 'memory',
          'business', 'market', 'launch'
        ];

        agents.forEach(agent => {
          this.context.subscriptions.push(
            vscode.commands.registerCommand(`cjdevmind.${agent}`, async () => {
              const agentInstance = AgentFactory.create(agent, { context: this.context });
              const input = await vscode.window.showInputBox({ prompt: `Enter input for ${agent}` });
              if (input) {
                const result = await agentInstance.execute(input);
                vscode.window.showInformationMessage(result.output);
              }
            })
          );
        });
      }

      async executeAgent(agentName: string, input: string): Promise<AgentResult> {
        const agent = AgentFactory.create(agentName, { context: this.context });
        return agent.execute(input);
      }
    }
    ```

---

### Sistema de Memoria (Actualizado)

- **Almacenamiento Online**:
  - Pinecone para búsqueda vectorial de contexto (por ejemplo, embeddings de imágenes, código, documentación).
  - Neo4j para el grafo de dependencias dinámico (relaciones entre tareas, agentes, y datos).
- **Almacenamiento Offline**:
  - Faiss para búsqueda vectorial local.
  - SQLite (`cjdevmind.db`) para datos estructurados.
  - Almacenamiento local de VS Code (`vscode.Memento`, `vscode.workspace.fs`) para datos rápidos y preferencias del usuario.
- **Persistencia de Contexto**:
  - Checkpoints automáticos cada 100 operaciones o 10 minutos.
  - Sincronización al reconectar en modo offline.
- **Interacciones**:
  - Gestionado por el **MemoryAgent**, que proporciona contexto a todos los agentes.
  - Usado por el **SelfImprovementAgent** para analizar historiales de ejecución y optimizar agentes.
- **Ejemplo**:
  ```json
  {
    "type": "component",
    "project": "mlm-system",
    "data": {
      "filePath": "/src/components/LoginButton.tsx",
      "code": "export const LoginButton = () => { ... }"
    },
    "metadata": {
      "created": "2025-04-12T10:00:00Z",
      "reviewedBy": "CodeReviewAgent"
    }
  }
  ```

---

### EventBus

- **Implementación**: Sistema de publicación/suscripción basado en canales temáticos.
- **Canales**:
  - `frontend`: Para eventos de **UIDesignAgent**, **LayoutAgent**, **ComponentAgent**, **FrontendSyncAgent**, y **StyleAgent**.
  - `backend`: Para eventos de **APIAgent**, **LogicAgent**, **DatabaseAgent**, y **IntegrationAgent**.
  - `calidad`: Para eventos de **TestingAgent**, **SecurityAgent**, **PerformanceAgent**, **RefactorAgent**, **TestAgent**, **SelfImprovementAgent**, y **CodeReviewAgent**.
  - `infraestructura`: Para eventos de **DevOpsAgent**, **MonitorAgent**, **DashboardAgent**, y **AnalyticsAgent**.
  - `documentacion`: Para eventos de **DocAgent** y **MemoryAgent**.
  - `negocio`: Para eventos de **BusinessAgent**, **MarketAgent**, y **LaunchAgent**.
  - `meta`: Para eventos de **QuestionAgent**, **VisionAgent**, **ArchitectAgent**, **OrchestratorAgent**, y **ExtensionAgent**.
- **Ejemplo**:
  ```typescript
  class EventBus {
    private static instance: EventBus;
    private subscribers: Map<string, ((data: any) => void)[]>;

    private constructor() {
      this.subscribers = new Map();
    }

    static getInstance(): EventBus {
      if (!EventBus.instance) {
        EventBus.instance = new EventBus();
      }
      return EventBus.instance;
    }

    subscribe(channel: string, callback: (data: any) => void): void {
      if (!this.subscribers.has(channel)) {
        this.subscribers.set(channel, []);
      }
      this.subscribers.get(channel)!.push(callback);
    }

    publish(channel: string, data: any): void {
      const callbacks = this.subscribers.get(channel) || [];
      for (const callback of callbacks) {
        callback(data);
      }
    }
  }
  ```

---

### VSCodeAdapter

- **Responsabilidad**: Abstracción para interactuar con la API de VS Code.
- **Capacidades**:
  - Registro de comandos (`vscode.commands.registerCommand`).
  - Escritura/lectura de archivos (`vscode.workspace.fs`).
  - Almacenamiento local (`vscode.Memento`, `vscode.workspace.fs`).
  - Almacenamiento seguro de claves (`vscode.SecretStorage`).
  - Renderizado de webviews para dashboard y previsualizaciones.
  - Notificaciones al usuario (`vscode.window.showInformationMessage`).
- **Ejemplo**:
  ```typescript
  class VSCodeAdapter {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
      this.context = context;
    }

    registerCommand(command: string, callback: (...args: any[]) => any): void {
      this.context.subscriptions.push(
        vscode.commands.registerCommand(command, callback)
      );
    }

    async storeLocalData(key: string, value: any): Promise<void> {
      await this.context.workspaceState.update(key, value);
    }

    async getLocalData(key: string): Promise<any> {
      return this.context.workspaceState.get(key);
    }

    async storeSecret(key: string, value: string): Promise<void> {
      await this.context.secrets.store(key, value);
    }

    async getSecret(key: string): Promise<string | undefined> {
      return this.context.secrets.get(key);
    }

    async showWebview(viewId: string, htmlContent: string): Promise<void> {
      const panel = vscode.window.createWebviewPanel(
        viewId,
        viewId === 'dashboard' ? 'CJ.DevMind Dashboard' : 'Preview',
        vscode.ViewColumn.One,
        {}
      );
      panel.webview.html = htmlContent;
    }
  }
  ```

---

### LLMProvider

- **Responsabilidad**: Gestiona las interacciones con modelos de lenguaje.
- **Capacidades**:
  - Soporte para múltiples proveedores (OpenAI, Anthropic, modelos locales como Llama y Mistral).
  - Gestión de prompts optimizados por agente.
  - Cache de respuestas para mejorar rendimiento.
- **Optimización**:
  - El **SelfImprovementAgent** ajusta los prompts dinámicamente basándose en el historial de ejecución.
- **Ejemplo**:
  ```typescript
  class LLMProvider {
    private provider: string;
    private cache: Map<string, string>;

    constructor(provider: string) {
      this.provider = provider;
      this.cache = new Map();
    }

    async call(prompt: string, options?: LLMOptions): Promise<string> {
      const cacheKey = `${prompt}:${JSON.stringify(options)}`;
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      let response: string;
      if (this.provider === 'openai') {
        response = await this.callOpenAI(prompt, options);
      } else if (this.provider === 'anthropic') {
        response = await this.callAnthropic(prompt, options);
      } else {
        response = await this.callLocalModel(prompt, options);
      }

      this.cache.set(cacheKey, response);
      return response;
    }

    private async callOpenAI(prompt: string, options?: LLMOptions): Promise<string> {
      // Simulación de llamada a OpenAI
      return `Response from OpenAI for: ${prompt}`;
    }

    private async callAnthropic(prompt: string, options?: LLMOptions): Promise<string> {
      // Simulación de llamada a Anthropic
      return `Response from Anthropic for: ${prompt}`;
    }

    private async callLocalModel(prompt: string, options?: LLMOptions): Promise<string> {
      // Simulación de llamada a modelo local
      return `Response from local model for: ${prompt}`;
    }
  }
  ```

---

### GitAdapter

- **Responsabilidad**: Gestiona puntos de restauración y rollbacks.
- **Capacidades**:
  - Crea commits automáticos antes de cambios críticos.
  - Permite rollbacks a estados anteriores.
  - Usa la API de Git integrada en VS Code.
- **Ejemplo**:
  ```typescript
  class GitAdapter {
    private repoPath: string;

    constructor(repoPath: string) {
      this.repoPath = repoPath;
    }

    async commit(message: string): Promise<void> {
      const git = new (require('simple-git'))(this.repoPath);
      await git.add('.');
      await git.commit(message);
    }

    async rollback(commitHash: string): Promise<void> {
      const git = new (require('simple-git'))(this.repoPath);
      await git.reset(['--hard', commitHash]);
    }
  }
  ```

---

### Modelo de Negocio

#### Licencias
- **Community**: Acceso básico, limitado a 5 agentes y 50 créditos iniciales.
- **Professional**: Acceso a todos los agentes, 500 créditos iniciales, soporte prioritario.
- **Enterprise**: Acceso completo, créditos ilimitados, soporte dedicado, y personalización.

#### Sistema de Créditos
- **Uso**:
  - 10 créditos por tarea compleja (por ejemplo, generar un componente con AR).
  - 50 créditos por extensiones del marketplace (por ejemplo, plugin de AR).
- **Adquisición**:
  - Incluidos con la licencia.
  - Compra adicional vía el marketplace (gestionado por el **ExtensionAgent**).

#### Marketplace
- **Extensiones Disponibles**:
  - Plugins de AR, multilenguaje, temas personalizados.
- **Integración**:
  - Gestionado por el **ExtensionAgent**.
  - Mostrado en el dashboard de VS Code (via **DashboardAgent**).

---

### Seguridad (Actualizada)

#### Medidas de Seguridad
- **Gestión de Credenciales**:
  - Claves API almacenadas en `vscode.SecretStorage`.
  - Gestionadas por el **IntegrationAgent** y **SecurityAgent**.
- **Validación de Entrada**:
  - Sanitización de entradas del usuario para evitar inyecciones (por ejemplo, SQL injection, XSS).
  - Implementada por el **SecurityAgent**.
- **Auditoría**:
  - Logs transaccionales para todas las operaciones críticas.
  - Gestionados por el **OrchestratorAgent**.
- **Niveles de Aprobación**:
  - Tareas en estado REVIEW requieren aprobación humana.
  - Notificaciones enviadas mediante `vscode.window.showInformationMessage`.
- **Rollbacks Automáticos**:
  - Puntos de restauración creados por el **GitAdapter**.
  - Usados por agentes como **APIAgent**, **SecurityAgent**, y **DevOpsAgent**.
- **Code Review**:
  - El **CodeReviewAgent** revisa el código generado para detectar vulnerabilidades y asegurar calidad.

#### Ejemplo de Seguridad
- **Entrada**: Endpoint `/register` generado por el **APIAgent**.
- **Proceso**:
  - **SecurityAgent** aplica JWT y sanitización de entradas.
  - **CodeReviewAgent** revisa el código para detectar vulnerabilidades.
  - **GitAdapter** crea un punto de restauración antes de aplicar cambios.
- **Salida**: Endpoint seguro en `src/backend/routes/auth.js`.

---

### Escalabilidad y Rendimiento (Actualizada)

#### Escalabilidad
- **Arquitectura Híbrida**:
  - Cliente ligero en VS Code para tareas rápidas (por ejemplo, renderizado de webviews, comandos).
  - Servidor backend para tareas pesadas (por ejemplo, procesamiento de imágenes, generación de código).
  - Comunicación vía WebSockets para actualizaciones en tiempo real.
- **Modo Offline**:
  - Modelos locales (Llama, Mistral) para generación de código.
  - Almacenamiento local (`vscode.Memento`, `vscode.workspace.fs`) para datos y contexto.
  - Sincronización automática al reconectar.
- **Soporte Multi-Proyecto**:
  - El **MemoryAgent** separa el contexto por proyecto (`project_id`).
  - El **OrchestratorAgent** gestiona tareas de múltiples proyectos simultáneamente.

#### Rendimiento
- **Cache de Respuestas**:
  - Implementado en el **LLMProvider** para evitar consultas repetitivas.
- **Priorización Inteligente**:
  - El **OrchestratorAgent** usa una **PriorityQueue** para gestionar tareas.
- **Optimización Dinámica**:
  - El **SelfImprovementAgent** analiza el historial de ejecución y ajusta prompts y configuraciones para mejorar el rendimiento.
- **Métricas**:
  - El **MonitorAgent** registra métricas de rendimiento (latencia, uso de CPU).
  - El **PerformanceAgent** propone optimizaciones basadas en métricas.

---

### Ejemplo Completo: Sistema MLM con Realidad Aumentada (Actualizado)

#### Flujo de Trabajo
1. **Entrada del Usuario**:
   - Comando en VS Code: `cjdevmind.question` con "Crear un sistema MLM con realidad aumentada."
2. **QuestionAgent**:
   - Descompone el requerimiento y genera tareas mediante un cuestionario interactivo en VS Code.
   - Tareas: Diseñar UI, implementar AR, crear APIs, asegurar calidad, desplegar.
3. **OrchestratorAgent**:
   - Construye un grafo de dependencias y asigna tareas a los agentes.
   - Usa el **MemoryAgent** para almacenar el contexto.
4. **ArchitectAgent**:
   - Define arquitectura: React (Frontend), Node.js (Backend), PostgreSQL (DB), ARKit (AR).
   - Crea estructura de carpetas en `src/`.
5. **Frontend**:
   - **UIDesignAgent**: Diseña un sistema de diseño (tema oscuro, tipografía: Roboto).
   - **StyleAgent**: Genera `src/styles/theme-dark.css` y actualiza Tailwind.
   - **LayoutAgent**: Crea `DashboardLayout.jsx` con un layout responsive.
   - **ComponentAgent**: Genera `ARComponent.tsx` para realidad aumentada, con documentación.
   - **FrontendSyncAgent**: Conecta el frontend con los endpoints del backend.
6. **Backend**:
   - **APIAgent**: Crea endpoint `/register` en `src/backend/routes/auth.js`.
   - **LogicAgent**: Implementa lógica de comisiones MLM en `src/backend/logic/commissions.js`.
   - **DatabaseAgent**: Genera esquema `users` en `src/backend/migrations/001_create_users.sql`.
   - **IntegrationAgent**: Integra ARKit para componentes AR.
7. **Calidad**:
   - **TestingAgent**: Escribe pruebas Jest para `/register` en `src/backend/tests/auth.test.js`.
   - **TestAgent**: Genera pruebas de accesibilidad para `ARComponent.tsx`.
   - **SecurityAgent**: Aplica JWT y sanitización al endpoint `/register`.
   - **PerformanceAgent**: Optimiza consultas a la tabla `users`.
   - **RefactorAgent**: Refactoriza `commissions.js` para mayor claridad.
   - **CodeReviewAgent**: Revisa `ARComponent.tsx` y propone mejoras.
   - **SelfImprovementAgent**: Optimiza los prompts del **UIDesignAgent** basándose en el historial.
8. **Infraestructura**:
   - **DevOpsAgent**: Configura pipeline en `.github/workflows/deploy.yml`.
   - **MonitorAgent**: Registra métricas (latencia: 150ms, CPU: 4%).
   - **DashboardAgent**: Muestra el estado en un webview de VS Code.
   - **AnalyticsAgent**: Calcula ROI (inversión: $5000, retorno: $15000).
9. **Documentación**:
   - **DocAgent**: Genera documentación del endpoint `/register` en `docs/api/register.md`.
   - **MemoryAgent**: Almacena el contexto del proyecto.
10. **Negocio**:
    - **BusinessAgent**: Evalúa viabilidad (costo: $5000, beneficio: $15000).
    - **MarketAgent**: Analiza tendencias (AR y multilenguaje son clave).
    - **LaunchAgent**: Crea plan de lanzamiento (mercados: inglés/español, marketing: redes sociales).
11. **VSCodeAgentBridge**:
    - Ejecuta comandos y muestra resultados en VS Code.

#### Resultado Final
- Proyecto funcional en `src/` con frontend (React, ARKit), backend (Node.js, PostgreSQL), documentación, y pipeline de CI/CD.
- Dashboard en VS Code mostrando métricas, ROI, y plan de lanzamiento.
- Código revisado por **CodeReviewAgent**, con pruebas automatizadas por **TestAgent**, y optimizaciones por **SelfImprovementAgent**.

---

### Futuras Mejoras (Actualizadas)

#### Nuevas Funcionalidades
- **Soporte Multi-Idioma**:
  - Generación de prompts y documentación en múltiples idiomas (inglés, español, francés).
  - Gestionado por el **DocAgent** y el **MemoryAgent**.
- **Integración con Herramientas de AR Avanzadas**:
  - Soporte para ARCore y herramientas de AR basadas en IA.
  - Gestionado por el **IntegrationAgent** y el **ComponentAgent**.
- **Análisis Predictivo**:
  - Predecir problemas de rendimiento o seguridad antes de que ocurran.
  - Implementado por el **AnalyticsAgent** y el **SelfImprovementAgent**.

#### Optimizaciones
- **Reducción de Latencia**:
  - Cache más agresivo en el **LLMProvider**.
  - Pre-carga de modelos locales en modo offline.
- **Mejora del Modo Offline**:
  - Sincronización más eficiente al reconectar.
  - Almacenamiento local optimizado para proyectos grandes.
- **Auto-Optimización Avanzada**:
  - El **SelfImprovementAgent** podría usar aprendizaje por refuerzo para optimizar agentes en tiempo real.

#### Seguridad
- **Autenticación Multi-Factor**:
  - Para el acceso a funcionalidades críticas (por ejemplo, despliegues).
  - Gestionado por el **SecurityAgent**.
- **Análisis de Dependencias**:
  - Detectar vulnerabilidades en dependencias externas.
  - Implementado por el **SecurityAgent** y el **CodeReviewAgent**.

---

### Conclusión

**CJ.DevMind** es un sistema robusto y escalable que ahora incluye **30 agentes especializados**, con la adición de **StyleAgent**, **TestAgent**, **SelfImprovementAgent**, **CodeReviewAgent**, y una versión mejorada de **ComponentAgent**. La jerarquía total tiene 32 elementos, incluyendo `BaseAgent` (núcleo) y `VSCodeAgentBridge` (componente de integración). La integración con VS Code permite una experiencia de desarrollo fluida, con soporte para proyectos de cualquier escala, desde pequeñas aplicaciones hasta sistemas complejos como un MLM con realidad aumentada. La arquitectura híbrida, el modo offline, la persistencia de contexto, y las nuevas capacidades de revisión, autoextensión (via **ExtensionAgent**) y automejora (via **SelfImprovementAgent**) aseguran un desarrollo eficiente, seguro, y optimizado, con un enfoque en la calidad del código y la experiencia del usuario.

---
