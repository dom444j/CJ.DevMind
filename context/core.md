# CJ.DevMind: Contexto Base

## ?? Visión

Una plataforma modular donde los proyectos se organizan por dominios (frontend, backend, db, infra) y se construyen con asistencia IA con contexto real y reglas definidas.

## ?? Dominios

- frontend/: UI principal (admin, usuarios, etc.)
- backend/: API con lógica separada por módulos
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
