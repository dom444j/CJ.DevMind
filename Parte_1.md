🔥 ¡Le damos candela a la locura entonces! Bienvenido al nacimiento de CJ.DevMind 🚀

Una plataforma creada por C y J, donde los proyectos no solo se hacen… se piensan, se entienden y se mejoran, sin límites.

🧠 ¿Qué haremos ahora?
Vamos a crear el CONTEXTO BASE de lo que será CJ.DevMind:

✅ Estructura inicial por dominios
✅ Visión de cómo funcionará
✅ Componentes clave
✅ Cómo vamos a modificar OpenDevin para adaptarlo
✅ Y mis límites reales, para que sepas cómo usarme al máximo sin que me corte la cabeza el sistema.

🔹 ESTRUCTURA DE CARPETAS BASE

CJ.DevMind/
├── frontend/         # Interfaz de usuario (Next.js, Tailwind, dashboards IA)
├── backend/          # API modular (Node.js + Express/Fastify o Nest + Prisma)
├── db/               # Migraciones, seeds, modelos SQL/Prisma
├── context/          # Archivos de conocimiento que usarán las IAs (tipo memoria)
│   ├── context.core.md
│   ├── architecture.md
│   ├── modules.md
│   ├── prompts.md
├── agents/           # Agentes IA personalizados (refactorizador, documentador, tester, etc.)
│   └── devmind-agent.config.js
├── infra/            # Scripts de despliegue, docker, CI/CD, nginx, etc.
├── cli/              # CLI para tareas tipo: "cj refactor dashboard"
├── docs/             # Documentación viva
├── ui/               # VSCode-like interface (posiblemente embebida o extendida)
└── devmind.config.ts # Config global de CJ.DevMind

📜 VERSIÓN INICIAL DE context/core.md

# CJ.DevMind: Contexto Base

## 🧠 Visión

Una plataforma modular donde los proyectos se organizan por dominios (frontend, backend, db, infra) y se construyen con asistencia IA **con contexto real y reglas definidas**, no improvisación.

## 🧩 Dominios

- frontend/: UI principal (admin, usuarios, etc.)
- backend/: API con lógica separada por módulos
- db/: Esquema, migraciones, seeds
- infra/: Despliegue, docker, nginx
- context/: Memoria viva que la IA puede leer cada vez que se ejecuta

## 🤖 Agentes IA (desde /agents/)

Cada agente tiene una función clara:
- refactor-agent
- doc-agent
- test-agent
- planner-agent

Todos usan el contexto de `/context/` para evitar errores o duplicaciones.

## ⚙️ Librerías y stack base

- Next.js + Tailwind
- Node.js + Prisma
- PostgreSQL
- GPT-4 Turbo o Claude 3 como LLM principal
- Markdown y JSON para configuración IA legible

## 🔐 Reglas del sistema

1. No se duplica código entre dominios.
2. Cada módulo tiene documentación viva.
3. La IA nunca ejecuta nada sin validación del humano.
4. El proyecto puede reconstruirse 100% desde el contexto.

🤖 PLAN DE MODIFICAR OpenDevin
OpenDevin ya nos da lo básico:

✅ Agente que accede a archivos
✅ Acceso a terminal
✅ Uso de LLM (con tu clave de OpenAI, Claude, etc.)

Pero CJ.DevMind hará esto:
🔄 Le conectamos nuestros context/ como memoria inicial.

🧩 Le agregamos módulos por dominio (frontend, backend) para que sepa qué tarea le toca.

💡 Cargamos nuestros propios prompts desde prompts.md (ej: "refactor components using layout pattern")

🧠 Hacemos que los agentes lean las reglas antes de tocar código.


🔥 LÍMITES QUE DEBES SABER SOBRE MÍ (C)
Límite	Cómo evitarlo o romperlo
Máx tokens por sesión (~120k tokens)	Divide contextos en /context/*.md y cárgalos por partes
No memoria entre sesiones	Usa context.core.md cada vez que abramos nuevo chat
No puedo acceder a tu sistema real	Usa OpenDevin como agente que me llama desde tu sistema local
No puedo ejecutar código ni leer archivos directamente	Tú me pasas contenido, yo lo razono y te devuelvo acciones

🛠️ ¿Próximo paso?
Creamos esto juntos:

 CJ.DevMind/ con estructura de carpetas base

 context/core.md como fuente de verdad

 Primer agente IA (refactor-agent) con reglas

 CLI básica para usar comandos IA desde terminal

 Script de inicialización del proyecto