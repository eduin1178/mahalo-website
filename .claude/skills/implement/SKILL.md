---
name: implement
description: Implementa tareas de `specs/tasks.md` de forma reanudable. Lee el estado actual del proyecto, identifica qué está hecho y qué falta, y ejecuta la siguiente tarea pendiente. Soporta argumentos: número de fase (`0`–`5`), id de tarea (`T08`), o sin argumento (continúa donde se quedó). Use this skill when the user runs `/implement` in this project.
---

# /implement — Workflow de implementación reanudable

Esta skill ejecuta el desarrollo del proyecto Mahalo Enterprise de forma incremental, dejando rastro persistente para que cualquier sesión futura pueda retomar sin pérdida de contexto.

## Argumentos

El usuario puede invocar la skill de tres formas:

| Invocación | Significado |
|---|---|
| `/implement` | Continuar con la siguiente tarea pendiente respetando dependencias. |
| `/implement <fase>` | Trabajar sobre tareas de esa fase. Ej: `/implement 1` → fase 1 (T06–T15). |
| `/implement <taskId>` | Ir directo a esa tarea específica. Ej: `/implement T08`. |

## Pasos a seguir SIEMPRE

### 1. Cargar contexto (lectura obligatoria)
Lee en este orden:
1. `specs/spec.md` — qué se construye.
2. `specs/plan.md` — cómo se construye (arquitectura, stack).
3. `specs/design-system.md` — sistema visual (si la tarea es UI).
4. `specs/tasks.md` — listado de tareas con estado.
5. `specs/sessions.md` — bitácora de sesiones previas (decisiones, gotchas, archivos tocados).
6. `AGENTS.md` — recordatorio de leer `node_modules/next/dist/docs/` antes de codificar features de Next.

### 2. Determinar qué hacer
Lee los marcadores de estado en `specs/tasks.md`:
- `[ ]` pendiente
- `[~]` en progreso (sesión interrumpida)
- `[x]` completada

Lógica de selección según argumento:
- **Sin argumento**: tomar la primera tarea con estado `[~]` o, si no hay, la primera `[ ]` cuyas dependencias estén todas en `[x]`.
- **Fase N**: aplicar la misma lógica pero limitando a tareas de esa fase.
- **TaskId**: ir a esa tarea exacta. Si tiene dependencias no resueltas, advertir al usuario y pedir confirmación antes de continuar.

Si no hay tareas pendientes elegibles, informar y terminar.

### 3. Anunciar la tarea
Antes de tocar código, mostrar al usuario:
- ID, título y fase de la tarea elegida.
- Objetivo y criterio de aceptación.
- Archivos que se prevé crear/modificar.
- Dependencias y si están resueltas.
- Cualquier nota relevante de `sessions.md`.

Si la tarea está bloqueada por input del cliente (env vars, credenciales, contenido), preguntar cómo proceder: implementar con placeholder/mock, o postergar.

### 4. Marcar `[~]` en progreso
Editar `specs/tasks.md` cambiando `[ ]` a `[~]` en la tarea elegida **antes** de empezar a codificar. Esto deja rastro si la sesión se corta.

### 5. Implementar
- Si la tarea toca features de Next.js no triviales: leer la guía relevante en `node_modules/next/dist/docs/` antes (regla de `AGENTS.md`).
- Seguir el `design-system.md` para cualquier UI.
- Respetar las convenciones de `plan.md` §11.
- Hacer commits granulares solo si el usuario lo pide; por defecto dejar los cambios sin commitear.

### 6. Verificar
Aplicar el "Criterio de aceptación" definido en la tarea. Cuando aplique:
- `npm run build` (o el comando relevante) sin errores.
- `npm run dev` y validación manual de la feature en navegador para tareas de UI.
- Para server actions / DB: verificar con datos reales que la operación funciona end-to-end.

Si algo falla, **no** marcar la tarea como completa. Registrar el blocker en `sessions.md` y dejar el estado en `[~]`.

### 7. Cerrar la sesión
Al completar exitosamente:

**a)** Editar `specs/tasks.md` y cambiar `[~]` a `[x]` en la tarea.

**b)** Anexar entrada a `specs/sessions.md` con este formato:

```markdown
## YYYY-MM-DD · TXX — <título de la tarea>

- **Estado final**: ✅ completada | ⚠️ parcial | ❌ bloqueada
- **Archivos tocados**:
  - `path/al/archivo.ts` — qué cambió en una línea
- **Decisiones clave**:
  - Decisión y por qué (solo si fue una elección no obvia).
- **Gotchas / aprendizajes**:
  - Cualquier sorpresa que ahorre tiempo a futuras sesiones.
- **Pendiente para próxima sesión** (si aplica):
  - …
- **Verificación realizada**:
  - Comando/acción y resultado.
```

Reglas de la entrada:
- **Concisa**: solo lo no derivable del código o git.
- No documentar lo obvio (qué hace una función bien nombrada).
- No duplicar contenido de `spec.md`/`plan.md`/`design-system.md`.

**c)** Resumen final al usuario en 2–3 líneas: tarea completada, qué sigue (la siguiente tarea pendiente).

## Reglas duras

- **Nunca marcar `[x]` sin verificar el criterio de aceptación.**
- **Nunca saltar dependencias** sin confirmación explícita del usuario.
- **Nunca omitir `sessions.md`**: la trazabilidad es el propósito de esta skill.
- **No tocar tareas que no son la actual** salvo que el usuario lo pida.
- Si encuentras inconsistencias entre `tasks.md` y la realidad del código, sincronizarlas antes de empezar (auditoría rápida) y reportar la divergencia.

## Comando hermano: `/implement-status`

Si el usuario pide solo el estado (sin ejecutar nada), invocar la lógica de los pasos 1–2 y reportar:
- Tareas completadas (count + IDs).
- Tareas en progreso (`[~]`).
- Próxima tarea elegible.
- Bloqueos pendientes del cliente.

No tocar archivos en este modo.
