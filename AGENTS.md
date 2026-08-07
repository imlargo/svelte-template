# AGENTS.md

## Qué es este repo

Un template de SvelteKit 2 + Svelte 5 que sirve de base para proyectos de consultoría. Consume una
**API externa** (no tiene base de datos) y trae resuelto lo aburrido: autenticación con cookies,
permisos, layout con sidebar, formularios, componentes.

**No es un framework y no queremos que lo sea.** El objetivo es que se clone y se empiece a
construir sin fricción ni sorpresas.

## En qué fase estamos

Refactor del código existente. No se añaden features. Concretamente:

- Simplificar lo que hay, **sin perder funcionalidad**
- Hacerlo idiomático a Svelte 5 y SvelteKit 2
- Cerrar los bugs reales, sobre todo los de seguridad
- Dejarlo en un punto desde el que **más adelante** se pueda crecer

Fuera de scope ahora: generadores de código, tipos desde OpenAPI, CI/CD, observabilidad,
multi-marca, i18n. Están en `docs/BACKLOG.md` con el disparador que los reactiva.

## Antes de tocar código

**Lee `docs/README.md`.** Es el punto de entrada al contrato del proyecto:

| Documento              | Qué es                                                                                                     | Cuándo                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------- |
| `docs/ARCHITECTURE.md` | Arquitectura vigente: estructura, reglas, patrones, anti-patrones, convenciones, definición de "terminado" | Siempre. Es la fuente de verdad |
| `docs/AUDIT.md`        | Estado actual verificado y plan de refactor en tandas (T0–T4)                                              | Antes de tocar código           |
| `docs/BACKLOG.md`      | Deliberadamente fuera de scope                                                                             | Solo si se pide explícitamente  |

---

## Filosofía

### 1. Se borra lo que no se va a usar, no lo que no se usa todavía

Un template existe para traer resuelto lo que vas a necesitar: `Disclosure` no tiene consumidores
hoy y los tendrá el primer día que alguien abra un modal — **eso se queda**. Aplicar "cero usos →
borrar" a un template lo vacía hasta dejarlo inútil.

Se borra lo muerto **por diseño**: código inalcanzable, código de una forma de trabajar que este
template descartó, configuración de piezas que no existen, código que contradice una regla de
`docs/ARCHITECTURE.md`, y segundas formas de hacer algo que ya se hace.

La prueba: **¿hay un caso de uso previsto para esto aquí?** Si la respuesta necesita un "bueno, si
algún día...", está muerto. Si es "el primer CRUD que escriba", se queda.

**Borrar es borrar.** Mover un módulo a otra carpeta no lo borra, y añadirle un test tampoco lo
convierte en usado.

### 1b. Cero barrels

Nada de `index.ts` que reexporte. Todo se importa por su ruta real: un barrel oculta de dónde
viene cada cosa y arrastra módulos al bundle.

Los **aliases sí se usan** (`$components`, `$ui`, `$core`, `$hooks`, `$types`, `$utils`) y no son
lo mismo: resuelven a un archivo concreto, así que no ocultan nada ni arrastran nada. La única
condición es que apunten a un directorio que exista.

### 2. Una sola forma de hacer cada cosa

Un estilo de import, un patrón de estado async, un lugar para cada tipo de dato. La segunda forma
equivalente no da flexibilidad — da una decisión que se toma cada vez, y que un agente toma al azar.

### 3. `$state` a nivel de módulo está prohibido para datos del usuario

En SSR los módulos son singletons por proceso, no por request. Un `$state` exportado con datos de
usuario filtra datos entre usuarios. Es la única de estas reglas cuya violación es un incidente de
seguridad y no una molestia. El estado por request va en `locals`, en `data`, o en contexto de
Svelte.

Si te encuentras escribiendo `if (browser)` alrededor de una mutación de estado global, eso no es
una guarda: es la señal de que el estado está en el sitio equivocado.

### 4. Deny by default

Rol desconocido → sin permisos. Ruta no declarada → denegada. Un olvido debe producir un 403, no
un acceso. Fallar ruidoso y a la primera, no silencioso y en producción.

### 5. Borrar antes que abstraer

La tercera repetición justifica una abstracción. La primera y la segunda, no.

### 6. Idiomático antes que ingenioso

Si SvelteKit ya lo resuelve (`afterNavigate`, `load`, form actions, `page.url`), se usa eso. No se
reimplementa con `$effect` y estado auxiliar. `$effect` es una vía de escape para sincronizar con
algo externo a Svelte — no para comunicar componentes, no para derivar valores.

---

## Cómo trabajar

**Antes de modificar**, entiende por qué el código está como está. `docs/AUDIT.md` §1 lista
explícitamente lo que **ya es correcto y no se toca** — refactorizarlo es trabajo negativo.

**Antes de borrar**, verifica los usos reales con grep en todo `src/`. Varias abstracciones del
repo parecen centrales y tienen cero consumidores; otras parecen muertas y no lo están.

**Antes de añadir**, cita la sección de `docs/ARCHITECTURE.md` que lo justifica. Si no hay sección,
no entra. Este es el mecanismo que impide que el template derive hacia framework.

**Si hay ambigüedad real** (dos soluciones razonables con impacto distinto), pregunta. Si es un
juicio de ingeniería rutinario, decide y sigue.

**No arrastres deuda entre tareas.** Cada tanda deja el repo en verde.

## Antes de dar algo por terminado

```sh
npm run lint     # sin errores
npm run check    # cero errores Y cero warnings
npm run test     # verde
```

Ejecútalos de verdad y lee la salida — no asumas que compiló. Los warnings de `svelte-check` como
`state_referenced_locally` son bugs de reactividad, no ruido. Criterios completos en
`docs/ARCHITECTURE.md` §18.

Al terminar, resume en un párrafo qué cambió y qué verificaste. No hace falta narrar el proceso.

---

## Configuración del proyecto

- **Lenguaje**: TypeScript
- **Gestor de paquetes**: npm
- **Add-ons**: prettier, eslint, vitest, tailwindcss, sveltekit-adapter, mcp

---

## Servidor MCP de Svelte

Tienes acceso a documentación completa de Svelte 5 y SvelteKit. Úsala — este proyecto depende de
detalles de versión que cambian, y la memoria del modelo se queda atrás.

**1. `list-sections`** — Úsalo PRIMERO para descubrir las secciones disponibles. Devuelve títulos,
`use_cases` y rutas. Ante cualquier duda sobre Svelte o SvelteKit, empieza aquí.

**2. `get-documentation`** — Recupera el contenido completo de secciones concretas. Tras
`list-sections`, analiza los `use_cases` y trae TODAS las secciones relevantes de una vez.

**3. `svelte-autofixer`** — Analiza código Svelte y devuelve problemas y sugerencias. **Úsalo
siempre antes de entregar código Svelte.** Repite hasta que no devuelva nada.

**4. `playground-link`** — Genera un enlace al Playground. Solo tras confirmación del usuario, y
NUNCA si el código se escribió en archivos del proyecto.
