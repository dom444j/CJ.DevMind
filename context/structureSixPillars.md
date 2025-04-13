# 🧱 Estructura Modular de CJ.DevMind (6 Pilares Fundamentales)

Este documento describe la estructura central de CJ.DevMind basada en seis pilares interconectados. Cada pilar representa un dominio esencial en la construcción, escalado, operación y extensión de proyectos inteligentes asistidos por IA. La estructura ha sido actualizada para reflejar los **30 agentes especializados** (antes 23), las nuevas funcionalidades como **autoextensión**, **automejora**, **revisión de código**, y **pruebas avanzadas**, y una integración más profunda con VS Code.

---

## 1. 🧠 `architecture.md`
### Descripción:
Define la arquitectura del sistema, incluyendo:
- Estructura modular de agentes y dominios, ahora con **30 agentes** organizados en categorías: Meta-Nivel, Frontend, Backend, Calidad, Infraestructura, Documentación, Negocio, Autoextensión, Automejora, Revisión de Código, Pruebas Avanzadas, y Otros.
- Jerarquía entre agentes: ejecutores (por ejemplo, **APIAgent**, **StyleAgent**), informadores (por ejemplo, **MonitorAgent**, **AnalyticsAgent**), y coordinadores (por ejemplo, **OrchestratorAgent**, **VSCodeAgentBridge**).
- Extensibilidad: soporte para nuevos agentes, dominios, y hooks, con capacidades de **autoextensión** (mediante el **ExtensionAgent**) y **automejora** (mediante el **SelfImprovementAgent**).
- Flujo de decisiones entre agentes, ahora incluyendo revisiones automáticas del **CodeReviewAgent** y pruebas avanzadas del **TestAgent**.
- Diagramas de comunicación actualizados para reflejar las interacciones entre los nuevos agentes.
- Árbol de dependencias y tareas, gestionado por el **OrchestratorAgent** con optimizaciones dinámicas del **SelfImprovementAgent**.

### Subcomponentes:
- **core.md**: Define los agentes principales y sus roles, ahora incluyendo **StyleAgent**, **CodeReviewAgent**, **SelfImprovementAgent**, **TestAgent**, **MarketAgent**, **GrowthAgent**, y **AnalyticsAgent**.
- **modules.md**: Detalla los módulos funcionales, con nuevas secciones para Autoextensión, Automejora, Revisión de Código, y Pruebas Avanzadas.
- **rules.md**: Actualizado para incluir reglas específicas para los nuevos agentes y funcionalidades (ver documento **rules.md**).
- **extensibility.md**: Describe cómo añadir nuevos agentes y extensiones, con énfasis en la **autoextensión** del **ExtensionAgent** y la **automejora** del **SelfImprovementAgent**.

### Diagramas:
- **Árbol de jerarquía de agentes**: Actualizado para incluir los 30 agentes, con nuevas ramas para Autoextensión, Automejora, Revisión de Código, y Pruebas Avanzadas.
- **Flujo de colaboración multi-agente**: Incluye interacciones entre el **StyleAgent**, **CodeReviewAgent**, **TestAgent**, y **SelfImprovementAgent** para optimizar el desarrollo.
- **Ciclo de vida de tareas IA**: Actualizado para reflejar las revisiones automáticas del **CodeReviewAgent** y las pruebas avanzadas del **TestAgent** antes de pasar a estado REVIEW.

---

## 2. 🚀 `deploymentAndOperations.md`
### Descripción:
Gestiona el despliegue, ejecución, configuración de entornos y mantenimiento:
- CI/CD: Configurado por el **DevOpsAgent**, ahora con revisiones automáticas del **CodeReviewAgent** antes de cada despliegue.
- **DevOps Agents**: Incluye el **DevOpsAgent** para despliegues y el **MonitorAgent** para supervisión operativa.
- Configuración local / nube / Docker: Soporte para modo offline con modelos locales (Llama, Mistral) y sincronización al reconectar mediante el **SyncService**.
- Rollback automático y backups: Gestionados por el **GitAdapter**, con puntos de restauración antes de operaciones críticas.
- Logs operativos y recovery: Almacenados en `cjdevmind.db` y en el **MemoryAgent**, con análisis de logs por el **SelfImprovementAgent** para optimizar operaciones futuras.

### Subcomponentes:
- **deployment.md**: Detalla los flujos de despliegue, ahora incluyendo revisiones del **CodeReviewAgent** y pruebas del **TestAgent** antes de cada despliegue.
- **collaborationAndRecovery.md**: Describe la colaboración entre agentes durante el despliegue y los mecanismos de recuperación, con optimizaciones sugeridas por el **SelfImprovementAgent**.
- **configuraciones CLI/API**: Incluye comandos CLI para los nuevos agentes (`cjdevmind.style`, `cjdevmind.codereview`, `cjdevmind.improve`, `cjdevmind.test`).

### Diagramas:
- **Flujo de despliegue**: Actualizado para incluir pasos de revisión de código y pruebas avanzadas antes del despliegue.
- **Estados de tareas operativas**: Refleja los estados del ciclo de vida (PENDING, IN_PROGRESS, BLOCKED, REVIEW, COMPLETED, ERROR, CANCELLED), con transiciones gestionadas por el **TaskManager**.

---

## 3. 📊 `monitoringAndOptimization.md`
### Descripción:
Define el monitoreo en tiempo real y la optimización del sistema:
- Métricas del dashboard: Incluye métricas de calidad (cobertura de pruebas, resultados de revisión de código) proporcionadas por el **CodeReviewAgent** y el **TestAgent**.
- Monitoreo de salud del sistema: Gestionado por el **MonitorAgent**, con alertas mostradas en VS Code.
- Performance de agentes: Analizado por el **AnalyticsAgent**, con optimizaciones sugeridas por el **SelfImprovementAgent**.
- Optimizaciones de red, memoria y ejecución: Implementadas dinámicamente por el **SelfImprovementAgent**, con sugerencias mostradas en un webview de VS Code.

### Subcomponentes:
- **monitoring.md**: Detalla las métricas y alertas, ahora incluyendo métricas de calidad del **CodeReviewAgent** y el **TestAgent**.
- **performanceOptimization.md**: Describe las optimizaciones automáticas del **SelfImprovementAgent**, como reducción de uso de tokens y mejora de prompts.

### Diagramas:
- **Vista del dashboard CJ**: Actualizado para mostrar métricas de calidad (cobertura de pruebas, resultados de revisión) y sugerencias del **SelfImprovementAgent**.
- **Árbol de decisiones de optimización**: Incluye decisiones del **SelfImprovementAgent** para optimizar el rendimiento de los agentes.
- **Ciclo de retroalimentación de rendimiento**: Refleja cómo el **SelfImprovementAgent** usa métricas del **MonitorAgent** y el **AnalyticsAgent** para implementar mejoras.

---

## 4. 🔐 `securityAndQuality.md`
### Descripción:
Define los protocolos de seguridad y calidad:
- Roles y permisos: Gestionados por el **OrchestratorAgent**, con restricciones basadas en licencias (Community, Professional, Enterprise).
- Auditoría de tareas: Realizada por el **SecurityAgent** y el **MemoryAgent**, con análisis de logs por el **SelfImprovementAgent**.
- Seguridad de ejecución local vs nube: Asegurada por el **SecurityAgent**, con almacenamiento seguro en `vscode.SecretStorage`.
- Testing automatizado: Gestionado por el **TestingAgent** y el **TestAgent**, con pruebas avanzadas (usabilidad, accesibilidad, integración).
- Validaciones por agente: Incluye revisiones automáticas del **CodeReviewAgent** para garantizar la calidad del código.

### Subcomponentes:
- **security.md**: Detalla las políticas de seguridad, ahora incluyendo análisis de patrones de inyección por el **SelfImprovementAgent**.
- **testing.md**: Describe los procesos de testing, con nuevas secciones para pruebas avanzadas del **TestAgent** (usabilidad, accesibilidad, integración).

### Diagramas:
- **Ciclo de validación**: Actualizado para incluir revisiones del **CodeReviewAgent** y pruebas del **TestAgent**.
- **Matriz de riesgos**: Incluye riesgos relacionados con la autoextensión y cómo el **SecurityScanner** los mitiga.
- **Flujo de autorizaciones entre agentes**: Refleja las interacciones entre el **SecurityAgent**, el **CodeReviewAgent**, y el **TestAgent** para aprobar tareas.

---

## 5. 📓 `guidesAndDocs.md`
### Descripción:
Consolida la guía de uso, documentación y manejo de prompts:
- Guía para nuevos usuarios: Incluye instrucciones para usar los nuevos agentes (**StyleAgent**, **CodeReviewAgent**, **SelfImprovementAgent**, **TestAgent**).
- Onboarding de agentes: Actualizado para incluir el onboarding de los 30 agentes, con ejemplos de comandos (`cjdevmind.style`, `cjdevmind.codereview`, etc.).
- Prompts estandarizados: Definidos en **prompts.md**, ahora con categorías para Autoextensión, Automejora, Revisión de Código, y Pruebas Avanzadas.
- Estructura de respuestas: Incluye formatos para mostrar resultados de revisión de código y pruebas avanzadas en webviews de VS Code.
- Autogeneración de documentación: Gestionada por el **DocAgent**, con optimizaciones del **SelfImprovementAgent** para mejorar la claridad.

### Subcomponentes:
- **prompts.md**: Actualizado para incluir prompts para los nuevos agentes y funcionalidades (ver documento **prompts.md**).
- **userGuide.md**: Incluye guías para usar las nuevas funcionalidades (autoextensión, automejora, revisión de código, pruebas avanzadas).
- **onboarding.md**: Detalla el proceso de onboarding para los 30 agentes, con ejemplos interactivos en VS Code.
- **documentation.md**: Describe cómo el **DocAgent** genera documentación, con optimizaciones del **SelfImprovementAgent**.

### Diagramas:
- **Flujo de interacción humana-IA**: Actualizado para incluir interacciones con el **SelfImprovementAgent** para optimizar prompts y procesos.
- **Ciclo de onboarding**: Incluye pasos para los nuevos agentes, con ejemplos de comandos en VS Code.
- **Protocolo de generación de documentos**: Refleja cómo el **DocAgent** y el **SelfImprovementAgent** colaboran para generar documentación optimizada.

---

## 6. 🌐 `ecosystemAndCommunity.md`
### Descripción:
Expone el ecosistema de extensión y colaboración:
- Modelo de licencias y créditos IA: Gestionado por el **PaymentService**, con restricciones de acceso a agentes como **SelfImprovementAgent**, **CodeReviewAgent**, y **TestAgent** para usuarios Community.
- Marketplace de extensiones: Soporte para **autoextensión** mediante el **ExtensionAgent**, con revisiones de seguridad por el **SecurityScanner**.
- Comunidad abierta: Incluye contribuciones de extensiones, con revisiones por el equipo de CJ.DevMind.
- Contribuciones externas: Gestionadas a través del **MarketplaceAPI**, con sugerencias de mejora por el **SelfImprovementAgent**.
- Governance: Define las políticas de contribución y revisión, con un enfoque en la seguridad y calidad de las extensiones.

### Subcomponentes:
- **licenseManagement.md**: Detalla las licencias (Community, Professional, Enterprise) y las restricciones de acceso a los nuevos agentes.
- **communityCollaboration.md**: Describe cómo la comunidad puede contribuir con extensiones, con revisiones automáticas del **CodeReviewAgent**.
- **business_model.md**: Explica el sistema de créditos, ahora incluyendo costos por pruebas avanzadas del **TestAgent**.

### Diagramas:
- **Mapa de roles en comunidad**: Actualizado para incluir roles relacionados con la autoextensión y la automejora.
- **Flujo de contribución**: Incluye pasos para la revisión de extensiones por el **CodeReviewAgent** y el **SecurityScanner**.
- **Sistema de créditos y licencias**: Refleja los costos asociados con las nuevas funcionalidades (por ejemplo, 10 créditos por ejecución de pruebas avanzadas).

---

## ✨ Bonus: `systemOverview.md`
### Descripción:
Un documento maestro que actúa como árbol de navegación, tabla de contenido y diagrama general del proyecto.  
Incluye:
- Tabla de contenido jerárquica enlazada a los 6 pilares, actualizada para reflejar los nuevos subcomponentes y agentes.
- Mapa visual de la arquitectura, ahora con los 30 agentes y las nuevas categorías (Autoextensión, Automejora, Revisión de Código, Pruebas Avanzadas).
- Roadmap de evolución (por milestones), con objetivos a corto plazo (soporte multi-idioma, integración con nuevos LLMs), mediano plazo (proyectos colaborativos, expansión del marketplace), y largo plazo (integración con hardware, IA predictiva).

---

## 🌱 Resumen

Este modelo permite escalar el proyecto sin perder claridad, manteniendo una estructura viva, modular y completamente documentada. La actualización incorpora los **30 agentes especializados**, las nuevas funcionalidades (**autoextensión**, **automejora**, **revisión de código**, **pruebas avanzadas**), y una integración más profunda con VS Code. Cada pilar ha sido ajustado para reflejar estas mejoras, asegurando que CJ.DevMind siga siendo un sistema robusto y escalable para el desarrollo asistido por IA. Cada pilar puede ser convertido en un submódulo versionado o una extensión del CLI DevMind.

Listo para codificar el futuro — uno bien fumado, pero funcional. 🚀