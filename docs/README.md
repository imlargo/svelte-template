# docs/ — contexto del proyecto

Si vas a trabajar en este repo (persona o agente), **empieza aquí**. Esta carpeta es el contrato:
define qué es el template, en qué estado está, y qué está permitido hacer.

---

## Qué hay y en qué orden leerlo

| Archivo | Qué es | Cuándo leerlo |
|---|---|---|
| **`ARCHITECTURE.md`** | La especificación del estado objetivo: estructura, reglas, patrones, anti-patrones, convenciones y definición de "terminado". | **Siempre.** Es la fuente de verdad de cómo se escribe código aquí. |
| **`AUDIT.md`** | Auditoría verificada del estado actual: hallazgos de seguridad, abstracciones muertas, código no idiomático, y el plan de refactor en tandas (T0–T4). | Antes de tocar código. Te dice qué está roto y qué está bien. |
| **`BACKLOG.md`** | Ideas de plataforma a largo plazo: generadores, tipos desde OpenAPI, CI/CD, observabilidad, multi-marca, paquetes versionados. | **Fuera de scope.** Consulta solo si se te pide explícitamente. |

Los tres se leen en ese orden. `ARCHITECTURE.md` dice a dónde vamos, `AUDIT.md` dice desde dónde
partimos, `BACKLOG.md` dice qué **no** hacemos todavía.

> El archivo `architecture.md` en la raíz del repo está **obsoleto** — describe un stack
> (Drizzle, Lucia, Stripe, Bun) que no existe en el código. No lo uses. Lo sustituye
> `docs/ARCHITECTURE.md` y debe borrarse.

---

## El objetivo de esta fase

Convertir el repo en algo que se clona y se usa para construir, sin fricción ni sorpresas.
**No** convertirlo en un framework. Concretamente:

- Simplificar lo que existe, sin perder funcionalidad
- Hacerlo idiomático a Svelte 5 y SvelteKit 2
- Cerrar los bugs reales, especialmente los de seguridad
- Dejarlo en un punto desde el que **más adelante** se pueda crecer hacia `BACKLOG.md`

No se añaden generadores, ni generación de tipos desde OpenAPI, ni CI, ni capas nuevas.

---

## Las tres reglas que no se rompen

Todo lo que `AUDIT.md` encontró apareció por no tener esto escrito:

**1. El repo contiene solo lo que el repo usa.**
Cero exports sin consumidor. Cero abstracciones "por si acaso". Si escribes algo para cuando lo
necesites, bórralo: la versión que escribas cuando lo necesites de verdad será mejor y costará lo
mismo.

**2. Una sola forma de hacer cada cosa.**
Un estilo de import, un patrón de estado async, un lugar para cada tipo de dato. La segunda forma
equivalente no da flexibilidad — da una decisión que hay que volver a tomar cada vez, y que un
agente toma al azar.

**3. `$state` a nivel de módulo está prohibido para datos que dependan del usuario.**
En SSR los módulos son singletons por proceso, no por request: eso es fuga de datos entre
usuarios. Es la única de estas reglas cuya violación es un incidente de seguridad y no una
molestia. El estado por request va en `locals`, en `data`, o en contexto de Svelte.

Corolario de las tres: **prefiere borrar sobre abstraer**, e idiomatismo de Svelte 5 sobre
patrones traídos de otros frameworks (nada de `$effect` para comunicar componentes, nada de estado
reactivo reinventando lo que SvelteKit ya resuelve).

---

## Cómo trabajar aquí

**Antes de modificar un archivo**, entiende por qué está como está. `AUDIT.md` §1 lista
explícitamente el código que **ya es correcto y no se toca** — refactorizarlo es trabajo negativo.

**Antes de borrar algo**, verifica sus usos reales con grep en todo `src/`. Varias de las
abstracciones del repo parecen centrales y tienen cero consumidores; otras parecen muertas y no lo
están.

**Antes de añadir algo**, cita la sección de `ARCHITECTURE.md` que lo justifica. Si no hay
sección, no entra. Este es el mecanismo que impide que el template derive hacia framework.

**Antes de dar una tarea por terminada**, ejecuta y verifica de verdad:

```sh
npm run lint     # sin errores
npm run check    # cero errores Y cero warnings
npm run test     # verde
```

Los warnings de `svelte-check` como `state_referenced_locally` son bugs de reactividad, no ruido.
La lista completa de criterios está en `ARCHITECTURE.md` §18.

**No arrastres deuda entre tareas.** Cada tanda deja el repo en verde.

---

## Ambigüedad

Si una tarea admite dos soluciones razonables con impacto distinto, pregunta antes de asumir.
Si es un juicio de ingeniería rutinario, decide y sigue.

Al terminar, resume en un párrafo qué cambió y qué verificaste. No hace falta narrar el proceso.
