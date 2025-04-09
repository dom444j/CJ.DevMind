# CJ.DevMind: Contexto Base

## ?? Visi�n

Una plataforma modular donde los proyectos se organizan por dominios (frontend, backend, db, infra) y se construyen con asistencia IA con contexto real y reglas definidas.

## ?? Dominios

- frontend/: UI principal (admin, usuarios, etc.)
- backend/: API con l�gica separada por m�dulos
- db/: Esquema, migraciones, seeds
- infra/: Despliegue, docker, nginx
- context/: Memoria viva para las IAs

## ?? Agentes IA (desde /agents/)

- refactor-agent
- doc-agent
- test-agent
- planner-agent

Todos usan /context/*.md para entender reglas, estructura y decisiones del proyecto.

## ?? Stack base

- Next.js + Tailwind
- Node.js + Prisma
- PostgreSQL
- LLM: GPT-4 Turbo (por ahora)

------------------------------------------
# 🧠 CJ.DevMind: Contexto Fundamental

## 🌟 Visión

CJ.DevMind es una plataforma revolucionaria donde los proyectos se organizan por dominios y se construyen con asistencia IA que mantiene contexto persistente, respeta reglas arquitectónicas y colabora mediante agentes especializados.

## 🏗️ Arquitectura Base

### Sistema de Memoria Persistente
- **Embeddings Vectoriales**: Representación del código, documentación y decisiones
- **Grafo de Conocimiento**: Mapa visual de relaciones entre componentes
- **Historial Versionado**: Registro de cambios con justificaciones

### Agentes Especializados
- **Meta-Agentes**: Vision, Architect, Orchestrator
- **Agentes Frontend**: Design System, Layout, Component, Integration
- **Agentes Backend**: API, Logic, Data, Security
- **Agentes de Calidad**: Test, Doc, Deploy, Monitor

### Interfaz Visual
- **Dashboard**: Representación gráfica del proyecto
- **Logs en Tiempo Real**: Actividad de agentes
- **Aprobación Selectiva**: Control humano sobre decisiones clave

## 🧩 Dominios

### frontend/
- **Tecnologías**: Next.js, Tailwind, React, Shadcn/ui
- **Estructura**: App Router, componentes modulares, sistema de diseño
- **Patrones**: Atomic Design, Server Components, Client Components

### backend/
- **Tecnologías**: Node.js, Fastify/tRPC, Prisma
- **Estructura**: Modular por dominio funcional
- **Patrones**: Clean Architecture, Repository Pattern, DTOs

### db/
- **Tecnologías**: PostgreSQL/MySQL, Prisma, Redis
- **Estructura**: Migraciones, seeds, optimizaciones
- **Patrones**: Normalización, índices, relaciones

### infra/
- **Tecnologías**: Docker, GitHub Actions, AWS/Vercel
- **Estructura**: CI/CD, monitoreo, escalabilidad
- **Patrones**: Infrastructure as Code, Zero-downtime Deployment

### context/
- **Estructura**: Jerárquica por dominio
- **Formatos**: Markdown, YAML, JSON
- **Actualización**: Automática por agentes, supervisada por humanos

## ⚙️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 14+
- **Estilos**: Tailwind CSS
- **Componentes**: Shadcn/ui, Radix UI
- **Estado**: Tanstack Query, Zustand
- **Formularios**: React Hook Form, Zod

### Backend
- **Runtime**: Node.js
- **API**: Fastify/tRPC
- **ORM**: Prisma
- **Validación**: Zod, class-validator
- **Autenticación**: JWT, NextAuth

### Datos
- **Principal**: PostgreSQL/MySQL
- **Caché**: Redis
- **Búsqueda**: Meilisearch/Algolia
- **Analytics**: Clickhouse

### IA
- **LLMs**: GPT-4o, Claude 3.5
- **Embeddings**: OpenAI, Hugging Face
- **RAG**: LangChain, LlamaIndex
- **Visualización**: D3.js, Three.js

## 🔄 Flujo de Trabajo

1. **Iniciación**: Vision Agent define requisitos mediante cuestionario
2. **Diseño**: Architect Agent crea la estructura global
3. **Orquestación**: Orchestrator Agent coordina el desarrollo
4. **Implementación**: Agentes especializados desarrollan componentes
5. **Validación**: Agentes de calidad verifican el trabajo
6. **Despliegue**: DevOps Agent gestiona la infraestructura
7. **Monitoreo**: Monitor Agent supervisa el sistema en producción