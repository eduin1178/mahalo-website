<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Mahalo Enterprise — Guía para agentes

## Documentación canónica
La carpeta `specs/` es la fuente de verdad. Léela en este orden antes de tocar código:

1. [`specs/spec.md`](specs/spec.md) — requerimientos funcionales (qué se construye).
2. [`specs/plan.md`](specs/plan.md) — plan técnico (cómo se construye, arquitectura, stack, envs).
3. [`specs/design-system.md`](specs/design-system.md) — paleta, tipografía, gradiente, tokens visuales.
4. [`specs/tasks.md`](specs/tasks.md) — listado de tareas T01–T40 con estado (`[ ]` `[~]` `[x]`).
5. [`specs/sessions.md`](specs/sessions.md) — bitácora de sesiones previas con decisiones y gotchas.

## Flujo de implementación reanudable
El desarrollo se organiza por **tareas atómicas** (T01–T40) agrupadas en 6 fases. Cada sesión completa una o más tareas y deja rastro en `sessions.md`.

**Para implementar usar la skill `/implement`** (definida en [`.claude/skills/implement/SKILL.md`](.claude/skills/implement/SKILL.md)):

- `/implement` — continúa con la siguiente tarea pendiente.
- `/implement <fase>` — trabaja en esa fase (ej. `/implement 2`).
- `/implement T<id>` — va a una tarea específica (ej. `/implement T08`).

La skill se encarga de:
- Cargar el contexto completo de `specs/`.
- Detectar qué está hecho (`[x]`), en progreso (`[~]`) y pendiente (`[ ]`).
- Respetar dependencias entre tareas.
- Marcar `[~]` antes de empezar y `[x]` al verificar el criterio de aceptación.
- Anexar entrada a `sessions.md` al cerrar.

## Reglas duras
- No marcar una tarea como completada sin verificar su "Criterio de aceptación".
- No saltar dependencias sin confirmación explícita del usuario.
- Cada sesión que toque código debe dejar entrada en `sessions.md`.
- Si la realidad del código diverge de `tasks.md`, sincronizar primero y reportar.
- Para features de Next.js: leer `node_modules/next/dist/docs/` antes (regla superior).
- Para UI: respetar `design-system.md`. El gradiente de marca solo en landing, nunca en admin.

## Convenciones del proyecto
Ver `specs/plan.md` §11. Resumen:
- TypeScript estricto; Zod en cada server action.
- Server components por defecto; `"use client"` solo cuando se necesita.
- shadcn/ui como única librería de componentes.
- Drizzle ORM sobre Postgres.

## Stack
Next.js 16 (App Router) · Tailwind v4 · shadcn/ui · PostgreSQL · Drizzle · Clerk · Resend · Docker Compose · Dokploy · USPS API · n8n webhook.
