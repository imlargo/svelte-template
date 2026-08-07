# AGENTS.md

Guía operativa para agentes de IA (y humanos) trabajando en este proyecto. Estas reglas son
obligatorias.

## Qué es este repo

Template de SvelteKit 2 + Svelte 5 para proyectos de consultoría. Consume una API externa (no
tiene base de datos) y trae resuelto lo aburrido: autenticación con cookies, permisos, layout con
sidebar, formularios, componentes. No es un framework y no debería convertirse en uno: el objetivo
es que se clone y se construya sin fricción ni sorpresas. Ver [`README.md`](./README.md) para el
stack, la estructura de carpetas y cómo arrancar.

## Documentación de arquitectura

No hay un `ARCHITECTURE.md` aparte. La fuente de verdad de la arquitectura es `src/` — ante una
decisión estructural o una duda sobre un patrón, lee el código del área equivalente antes de
inventar uno nuevo.

## Proceso de trabajo

- Antes de escribir código: explora el repo, entiende la estructura de carpetas, las convenciones
  existentes y el código relacionado con la tarea.
- Busca implementaciones similares ya existentes y sigue el mismo patrón antes de inventar uno
  nuevo.
- Prioriza simplicidad y patrones ya establecidos por sobre soluciones rápidas o código "por
  cumplir".
- Ante ambigüedad entre dos enfoques válidos, elige el que ya predomina en el codebase; si el
  impacto es real y distinto entre ambos, pregunta en vez de asumir.
- No introduzcas dependencias nuevas sin necesidad clara; verifica primero si algo existente
  (`$lib/core`, `$lib/utils`, `$lib/hooks`) resuelve el problema.
- No arrastres deuda entre tareas: deja `pnpm run lint`, `pnpm run check` y `pnpm run test` en
  verde antes de dar algo por terminado.

## UI / Estilos

- **Tailwind siempre.** CSS custom solo si es estrictamente imposible con utilidades de Tailwind.
- **shadcn primero:** si existe un componente de shadcn aplicable (`button`, `input`, `dialog`,
  `select`, etc.), úsalo en su forma pura: sin modificarlo ni agregarle clases extra salvo
  necesidad estricta.
- `src/lib/components/ui/` (shadcn) es **intocable**: no editar, no extender, no borrar archivos
  ahí — está excluido de `prettier`/`eslint` a propósito. Compón variantes por fuera (wrappers,
  props, composición), nunca modificando la fuente.

## Arquitectura / Código

- **Services** son los únicos responsables de llamadas a la API. Nada de `fetch`/HTTP directo en
  componentes o hooks. Un service extiende `BaseService` (`$lib/core/service.ts`) y vive en
  `features/<slice>/services/` — ver `features/users/services/users.ts` como referencia.
- **Composición sobre herencia** en componentes y hooks: piezas pequeñas y componibles. La
  excepción deliberada es la jerarquía de services (`extends BaseService`), que existe para
  compartir la resolución de token/cliente API entre todos los services.
- **Prohibido magic strings:** usa constantes tipadas o `enum` para valores fijos, keys, rutas de
  API, estados. Para identidad de dominio con un conjunto cerrado de valores (`UserRole`), usa
  `enum`. Para tags de capacidad tipo `"recurso:acción"` (`Permission` en
  `$lib/config/permissions.ts`), un string-literal union con `as const satisfies` está bien —
  sigue el patrón que ya usa la pieza equivalente antes de introducir uno nuevo.

## Tipos

- **Nunca `any`**, sin excepciones (tampoco `as any` para esquivar un error de tipos). Si el tipo
  real es complejo o viene de una respuesta externa, revisa la fuente (`features/<slice>/types.ts`,
  `$lib/types/`) antes de tipar a mano. Si de verdad se desconoce la forma en tiempo de escritura,
  usa `unknown` y angosta el tipo antes de operar sobre él.
- Antes de crear un tipo nuevo, busca si ya existe uno equivalente en `$lib/types/` (compartido por
  más de un slice) o en `features/<slice>/types.ts` (propio de ese slice). Si algo parecido no es
  idéntico, verifica que sea el mismo concepto de dominio antes de reutilizarlo o fusionarlo.
- Si no existe un tipo adecuado, créalo donde corresponda según el punto anterior — nunca inline ni
  duplicado en el archivo que lo consume.

## Estado

- El estado compartido con runes vive en clases dentro de `$lib/hooks/` (`Disclosure`, `Filters`,
  `Pagination`, `IsMobile`, en `$lib/hooks/*.svelte.ts`). Antes de crear uno nuevo, evalúa si el
  estado es realmente compartido o si es local a un componente — en ese caso, un `$state` dentro
  del propio componente basta.
- **`$state` a nivel de módulo está prohibido para datos que dependan del usuario.** En SSR los
  módulos son singletons por proceso, no por request: un `$state` exportado con datos de usuario
  filtra datos entre usuarios — es la única de estas reglas cuya violación es un incidente de
  seguridad y no una molestia. El estado por request va en `locals`, en `data` del `load`, o en
  contexto de Svelte. Si te encuentras escribiendo `if (browser)` alrededor de una mutación de
  estado global, esa no es una guarda: es la señal de que el estado está en el sitio equivocado.
- Los hooks de estado no llaman a la API directamente: delegan en services.

## Permisos

Deny by default: rol desconocido → sin permisos, ruta no declarada → denegada. Un olvido debe
producir un 403, no un acceso. Al agregar una página o un permiso nuevo, decláralo explícitamente
en `$lib/config/permissions.ts` — no hay un valor "sin restricción" que puedas usar por descuido.

## Convenciones de código

- Sigue el naming y la estructura de carpetas existentes (verifica antes de crear archivos).
- **Cero barrels:** nada de `index.ts` que reexporte. Importa por la ruta real. Los aliases
  (`$components`, `$ui`, `$core`, `$hooks`, `$types`, `$utils`) sí se usan porque resuelven a un
  archivo concreto — no ocultan nada.
- **Idiomático antes que ingenioso:** si SvelteKit ya lo resuelve (`afterNavigate`, `load`, form
  actions, `page.url`), se usa eso. `$effect` es para sincronizar con algo externo a Svelte, nunca
  para comunicar componentes ni derivar valores.
- Mantén los componentes enfocados: si uno crece en responsabilidades, extrae subcomponentes o
  hooks. La lógica reutilizable vive en `$lib/hooks/` o `$lib/utils/`, no duplicada en componentes.
- Si una función es pura y sin estado (formateo, validación, transformación) y es probable que se
  use en más de un lugar, extráela a `$lib/utils/`; si tiene estado/reactividad, a `$lib/hooks/`.
  Antes de crear una nueva, revisa si ya existe algo equivalente ahí.
- **Cero exports sin consumidor, cero abstracciones "por si acaso":** la tercera repetición
  justifica una abstracción, la primera y la segunda no. Borrar es borrar — moverlo de carpeta o
  añadirle un test no lo convierte en usado.
- No dejes código muerto, comentarios de debug ni `console.log` en el código final.
- Los cambios deben ser mínimos y acotados a la tarea: no refactorices código no relacionado sin
  que se pida.

## Antes de dar algo por terminado

```sh
pnpm run lint     # sin errores
pnpm run check    # cero errores Y cero warnings
pnpm run test     # verde
```

Ejecútalos de verdad y lee la salida — no asumas que compiló. Los warnings de `svelte-check` como
`state_referenced_locally` son bugs de reactividad, no ruido.

---

## Servidor MCP de Svelte

Tienes acceso a documentación completa de Svelte 5 y SvelteKit. Úsala — este proyecto depende de
detalles de versión que cambian, y la memoria del modelo se queda atrás.

1. **`list-sections`** — úsalo primero para descubrir las secciones disponibles. Ante cualquier
   duda sobre Svelte o SvelteKit, empieza aquí.
2. **`get-documentation`** — recupera el contenido completo de secciones concretas. Trae todas las
   relevantes de una vez.
3. **`svelte-autofixer`** — analiza código Svelte y devuelve problemas y sugerencias. Úsalo
   siempre antes de entregar código Svelte. Repite hasta que no devuelva nada.
4. **`playground-link`** — genera un enlace al Playground. Solo tras confirmación del usuario, y
   nunca si el código se escribió en archivos del proyecto.
