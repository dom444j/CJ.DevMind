export const devmindConfig = {
    projectName: "CJ.DevMind",
    version: "0.1.0",
    domains: ["frontend", "backend", "db", "infra"],
    contextPath: "./context",
    llmProvider: "openai", // También: "claude", "mistral"
    agents: [
      {
        name: "refactor-agent",
        entry: "./agents/refactor-agent.ts",
        description: "Refactoriza componentes, módulos o estructuras siguiendo reglas del contexto"
      }
    ]
  };
  