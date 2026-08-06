# Auditoría del template — estado actual y plan de refactor

> Objetivo: dejar el repo en un estado donde lo clonas y empiezas a construir sin pensar.
> No convertirlo en framework. No añadir generadores, OpenAPI ni capas nuevas.
> Simplificar lo que hay, hacerlo idiomático a Svelte 5 / SvelteKit 2, y cerrar los bugs reales.

Verificado contra el código en `main` (commit `7c6bd59`).

---

## Veredicto

La arquitectura de carpetas es correcta y no hay que tocarla. El problema no es el diseño —
es que **hay más andamiaje que edificio**: abstracciones escritas "por si acaso" que nadie usa,
dos formas de hacer lo mismo, y un puñado de bugs reales escondidos debajo.

Números concretos:

- **26 errores de ESLint.** `npm run lint` falla hoy.
- **420 archivos con formato inconsistente** según el propio Prettier del repo.
- **3 warnings de reactividad** de `svelte-check` que son bugs, no ruido.
- **~15 exports públicos con cero usos** en todo el repo.
- **2 problemas de seguridad reales** (tokens en el payload del cliente, autorización por ruta declarada pero no aplicada).

Lo bueno: `redirect.ts`, `errors/index.ts`, `cookies.ts` y `handler.ts` están **bien escritos**.
Son el núcleo real del template y sobreviven al refactor casi intactos.

---

## 1. Lo que está bien — no tocar

| Archivo                             | Por qué                                                                                                                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/features/auth/redirect.ts` | Protección de open-redirect hecha correctamente: re-parsea contra un origen falso en vez de confiar en `startsWith('/')`. Cubre `//evil.com` y `/\evil.com`. Es el único archivo con test, y el test está justificado. |
| `src/lib/core/errors/index.ts`      | Taxonomía cerrada, doble mapeo (status del backend → código, con fallback a HTTP), `ApiError` que deliberadamente no guarda headers para no filtrar el token a los logs. Bien pensado.                                 |
| `src/lib/features/auth/cookies.ts`  | Clase limpia, defaults en un sitio, httpOnly siempre. El comentario sobre haber consolidado 4 archivos en 1 es exactamente la dirección correcta.                                                                      |
| `src/lib/features/auth/handler.ts`  | Hook bien diseñado, con opciones sensatas y matching de prefijos correcto.                                                                                                                                             |
| `src/lib/components/ui/**`          | shadcn-svelte sin tocar. Correcto: no se modifica.                                                                                                                                                                     |
| `src/routes/(app)/+layout.svelte`   | Layout limpio, sin lógica.                                                                                                                                                                                             |

---

## 2. Hallazgos bloqueantes — corrección y seguridad

### B1 — El refresh token viaja al cliente 🔴

> **Revisado.** La primera versión de este hallazgo decía que *ningún* token debía salir del
> servidor. Eso era incorrecto: la capa de servicios es isomorfa por diseño (`air` funciona en
> ambos lados y `BaseService` acepta el token como función precisamente para el caso cliente),
> así que el **access token sí debe llegar al navegador**. El problema real es más estrecho y
> sigue siendo grave: es el **refresh token** el que no puede salir. Ver §7 de `ARCHITECTURE.md`.

`src/routes/+layout.server.ts:3-9`

```ts
return {
	user: locals.user ?? null,
	accessToken: locals.accessToken ?? null, // ← se serializa en el HTML
	refreshToken: locals.refreshToken ?? null // ← idem
};
```

Todo lo que devuelve un `+layout.server.ts` se serializa en el payload que SvelteKit inyecta en
la página. Para el access token eso es aceptable y necesario: es lo que permite que un servicio
funcione desde un componente, y su exposición está acotada por su vida corta.

Para el refresh token no lo es. El cliente **nunca** necesita refrescar por su cuenta —para eso
está el servidor— así que exponerlo no compra nada, y convierte un XSS de "sesión robada hasta que
expire el access token" en "sesión permanente para el atacante".

**Refactor.** `+layout.server.ts` devuelve `user` y `accessToken`. El `refreshToken` desaparece del
retorno y de `App.Locals` fuera del handler de auth. Además, `AuthCookiesManager` aplica hoy el
mismo `maxAge` a las dos cookies (`cookies.ts:23`): deben ser dos valores distintos, o el par de
tokens no aporta nada sobre un token único.

**No cambia:** `BaseService` conserva la variante "token como función"
(`src/lib/core/service.ts:36`). Es lo que hace que un servicio de vida larga en el cliente lea el
token actual en cada request en vez de capturar el que había al construirse.

### B2 — `authStore` es estado de módulo: se comparte entre requests en el servidor 🔴

`src/lib/features/auth/stores/auth.svelte.ts:42`

```ts
export const authStore = new AuthStore<User>(); // $state a nivel de módulo
```

En SSR los módulos son singletons por proceso, no por request. Un `$state` exportado a nivel de
módulo que contenga datos de usuario es una fuga de datos entre usuarios: el usuario B ve al
usuario A. Hoy no explota **solo** porque `src/routes/+layout.ts:8` lo envuelve en `if (browser)`.
Esa guarda es lo único que separa el template de un incidente, y no está documentada como tal.

Además, `+layout.ts` es un load universal que existe únicamente para provocar un efecto
secundario (mutar el singleton) y devolver `{ ...data }` sin transformar nada. Un load que no
transforma datos no debería existir.

**Refactor.** Eliminar `authStore` y `+layout.ts` completos. El usuario y el access token llegan
por `data` desde `+layout.server.ts`, y se propagan con `createContext` desde `+layout.svelte`
— estado colgado del árbol de componentes, es decir por request. Nunca un singleton de módulo.
Los servicios del cliente leen el token de ese contexto (`ARCHITECTURE.md` §6 y §8).

Regla que hay que escribir en `AGENTS.md`: **`$state` a nivel de módulo está prohibido para
cualquier dato que dependa del usuario.**

### B3 — La autorización por ruta está declarada pero nunca se aplica 🔴

`src/lib/config/domain/permissions.ts:33-37` define `AUTH_ROUTE_PERMISSIONS`.
`src/lib/features/auth/permissions.ts:31` define `canAccessRoute`.
`src/lib/features/auth/index.ts:10` lo exporta.

**Nadie lo llama.** Grep en todo `src/`: cero invocaciones. Lo único que se aplica es
`app-sidebar.svelte:31`, que filtra los items visibles del menú.

Es decir: un usuario con rol `member` escribe `/admin` en la barra de direcciones y entra. La
"protección" es que no le mostramos el enlace. Eso es seguridad por ocultación, y es peor que no
tener nada porque el `AUTH_ROUTE_PERMISSIONS` da la impresión de que sí está cubierto.

**Refactor.** `canAccessRoute` se invoca en `hooks.server.ts`, dentro del handler de auth, justo
después de resolver el usuario. Si el rol no puede acceder, `error(403)`. El sidebar sigue
filtrando, pero como presentación, no como control.

### B4 — Fail-open en la resolución de roles y rutas 🟠

`src/lib/features/auth/permissions.ts:9-12`

```ts
function normalizeRole(role: string | null | undefined): UserRole {
	if (role === UserRole.ADMIN) return UserRole.ADMIN;
	return UserRole.MEMBER; // ← cualquier cosa desconocida se vuelve MEMBER
}
```

Un rol nuevo en el backend (`viewer`, `billing_only`) se convierte silenciosamente en `MEMBER`
y hereda sus permisos. Añadir un rol restrictivo en el backend **amplía** los permisos en el
frontend. Es el sentido contrario al que debería fallar.

`permissions.ts:38` tiene el mismo problema en otra dirección:

```ts
return true; // ruta no listada en AUTH_ROUTE_PERMISSIONS → permitida
```

Cada ruta nueva nace desprotegida y hay que acordarse de registrarla.

**Refactor.** Rol desconocido → sin permisos (o el rol menos privilegiado explícito, no el
default por descarte). Ruta no listada → denegada. Con dos roles hoy el cambio es trivial; con
seis roles dentro de un año, retrofitearlo es doloroso.

### B5 — El callback de Google OAuth no valida el parámetro `state` 🟠

`src/routes/(auth)/authorize/+page.server.ts:24-26`

```ts
const credentials = Object.fromEntries(
	new URLSearchParams(url.searchParams.toString())
) as GoogleOAuthResponse;
```

Se toma lo que venga en la query y se castea. No hay `state` generado antes del redirect ni
verificado al volver, que es la defensa estándar contra CSRF en OAuth: un atacante puede inducir
a la víctima a completar un flujo de login con la cuenta del atacante.

Además, todo el flujo es un `+page.server.ts` cuyo `load` siempre redirige, con un
`+page.svelte` que recibe `data` y no lo usa (`authorize/+page.svelte:4`, error de lint).
Un callback OAuth no es una página: es un endpoint.

**Refactor.** Convertir a `src/routes/(auth)/authorize/+server.ts`. Generar `state` con un nonce
guardado en cookie antes del redirect a Google, y verificarlo aquí. Borrar el `+page.svelte`.

### B6 — El access token vive tanto como el refresh token 🟠

`src/lib/features/auth/cookies.ts:19-26` — un solo `maxAgeSeconds` (7 días) para ambas cookies.

El punto de tener dos tokens es que el de acceso sea corto (minutos) y el de refresco largo. Con
la misma vida, el par no aporta nada sobre un solo token y amplía la ventana de un token robado.

Relacionado: **no hay flujo de refresh en ninguna parte del código.** Cuando el access token
expira, `fetchUser` falla y el handler manda al login (`handler.ts:106-112`). El usuario pierde
la sesión y lo que estuviera haciendo. Es un comportamiento defendible para un template, pero
debe ser una decisión escrita, no un olvido.

### B7 — Logout por GET 🟠

`src/routes/(auth)/logout/+page.server.ts` — el `load` borra las cookies y redirige.

Un `load` corre en GET. Cualquier prefetch de SvelteKit sobre un `<a href="/logout">`, un
prerender, o un `<img src="/logout">` inyectado, cierra la sesión del usuario. Las mutaciones
van por POST.

**Refactor.** Form action POST con `use:enhance`. El `+page.svelte` pasa a ser un formulario con
un botón, que además funciona sin JavaScript.

---

## 3. Abstracciones muertas — borrar

Esto es el grueso de "simplificar sin perder funcionalidad": **no se pierde funcionalidad porque
nada de esto se usa**. Cada una de estas piezas es una decisión que tienes que volver a tomar
cada vez que abres el repo, y una pista falsa para cualquier agente que lo lea.

| #   | Qué                                                                    | Dónde                                 | Usos reales                                                                                                           |
| --- | ---------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| D1  | `withLoading`                                                          | `core/helpers/with-loading.svelte.ts` | **0**. Duplica `ViewState.run()`, que sí se usa. Dos APIs para lo mismo.                                              |
| D2  | `FilterStore`, `PaginationStore`, `Disclosure`                         | `lib/stores/*`                        | **0**. Escritos para features que aún no existen.                                                                     |
| D3  | Barrel `$lib`                                                          | `src/lib/index.ts` (38 líneas)        | **0**. Ningún archivo importa `from '$lib'`.                                                                          |
| D4  | Aliases `$core $stores $types $utils $components $ui`                  | `svelte.config.js:15-22`              | **0**. Todo el código usa `$lib/...`. Seis formas de escribir el mismo import, cero en uso.                           |
| D5  | Barrels `core/index.ts`, `core/helpers/index.ts`                       | —                                     | **0**. Todo importa la ruta directa.                                                                                  |
| D6  | `PAGINATION_DEFAULTS`, `FEATURE_FLAGS` (objeto vacío), `ROLE_PRIORITY` | `config/domain/*`                     | **0**.                                                                                                                |
| D7  | Ruta `/verify`                                                         | `routes/(auth)/verify/`               | `load` que devuelve `{}`, sin `+page.svelte`, sin enlaces entrantes.                                                  |
| D8  | `PaginatedResponse`, `DateRange`, `SortDirection`, `SortConfig`        | `types/domain/common.ts`              | **0**. Además `PaginatedResponse` asume convención DRF (`results/count/next/previous`) que puede no ser la de tu API. |
| D9  | Genérico `AuthStore<T>`                                                | `stores/auth.svelte.ts:4`             | Instanciado una sola vez, con `User`. Genericidad sin caso de uso. Desaparece con B2.                                 |
| D10 | `resolveRole`                                                          | `permissions.ts:14-16`                | Alias de una línea de `normalizeRole`. Dos nombres, una función, ninguna diferencia.                                  |
| D11 | `ApiError.isShape` + su rama en `normalizeError`                       | `errors/index.ts:118-125,183-190`     | Rama defensiva para errores crudos que `air` ya normaliza a `AirError`. Probablemente inalcanzable. Verifica y borra. |
| D12 | Carpeta `components/domain/`                                           | solo un `index.ts` con comentarios    | Vacía. Créala cuando tengas el primer componente de dominio compartido.                                               |

**Criterio para todo lo anterior:** si lo necesitas dentro de tres meses, escribirlo entonces te
cuesta veinte minutos y saldrá adaptado al caso real. Mantenerlo ahora te cuesta atención en cada
sesión y produce código equivocado cuando un agente lo toma como el camino recomendado.

**Regla a adoptar:** el template contiene lo que el template usa. Si el propio template no lo
consume, no va en el template.

---

## 4. Código no idiomático — Svelte 5 / SvelteKit 2

### N1 — `$effect` usado para notificar hacia afuera

`src/lib/components/base/select/Select.svelte:30-34`

```ts
$effect(() => {
	if (onchange) onchange(value || '');
});
```

Es el antipatrón número uno de runes. Tres problemas: (a) se dispara en el montaje, así que el
padre recibe un `onchange` que el usuario nunca provocó; (b) se dispara cuando el padre cambia
`value` por su cuenta, generando un eco; (c) `onchange?: (value: any) => void` — el `any` es uno
de los dos errores de lint de ese tipo.

**Refactor.** `bind:value` ya propaga el valor al padre. Si además quieres el callback, invócalo
en el handler del evento, no en un efecto. `$effect` es para sincronizar con sistemas externos
(DOM imperativo, subscripciones, timers), no para comunicar componentes.

### N2 — `$effect` reimplementando `afterNavigate`

`src/lib/components/layout/sidebar/app-sidebar.svelte:56-66` — mantiene `previousPathname` en
`$state` para detectar cambios de ruta y cerrar el sidebar móvil.

SvelteKit ya tiene `afterNavigate` de `$app/navigation`. Once líneas se convierten en tres, sin
estado auxiliar.

### N3 — Load universal usado como efecto secundario

`src/routes/+layout.ts` — corre en cliente y servidor, muta un singleton bajo `if (browser)`,
y devuelve `{ ...data }` sin transformar nada. Desaparece entero con B2.

### N4 — Dos fuentes de verdad en el ejemplo que el template enseña

`src/routes/(app)/+page.svelte:14-26,78-98`

```ts
const viewState = new ViewState();
let items: string[] = $state([]); // ← el dato vive aparte del estado de la vista
```

Y luego, dentro del snippet de éxito de `AsyncView`, hay un `{#if items.length > 0}` con un
`EmptyState` en el `else`. O sea: `AsyncView` tiene un estado `empty` y aun así la página vuelve
a comprobar si está vacío por dentro. El patrón se contradice a sí mismo en el único sitio donde
se demuestra.

Esto importa más de lo que parece: es el ejemplo canónico que vas a copiar (y que un agente va a
imitar) en cada página nueva.

**Refactor.** Que `ViewState` sostenga el dato: `ViewState<T>` con `data`, y `AsyncView` expone
el dato al snippet de éxito (`{#snippet children(items)}`). Una sola fuente de verdad, y la
página no vuelve a preguntar por el vacío.

Relacionado: `AsyncView.svelte:15` acepta `ViewState | { state: AsyncViewState; error?: ... }`.
Esa unión escrita a mano existe porque `ViewState` no tiene una interfaz. Define la interfaz y la
unión desaparece.

### N5 — Tres bugs de reactividad reportados por `svelte-check`

```
base/file-input/FileState.svelte:21:31          state_referenced_locally
base/range-date-picker/TimeRangeSelector.svelte:14:7   state_referenced_locally
base/range-date-picker/TimeRangeSelector.svelte:15:3   state_referenced_locally
```

`state_referenced_locally` significa que el componente captura el valor inicial y nunca ve las
actualizaciones. No es estilo: esos componentes no reaccionan a cambios de sus props.

### N6 — `icon: any` en la configuración de navegación

`src/lib/config/domain/navigation.ts:13-15`. El tipo correcto para un icono de Lucide es
`Component<SVGAttributes<SVGSVGElement>>` desde `svelte`. Con eso se va el `eslint-disable` y
pasas a detectar en compilación si alguien pone algo que no es un componente.

### N7 — `zod/v3` con Zod 4 instalado

`src/lib/features/auth/schemas.ts:1` importa `zod/v3` mientras `package.json:66` trae
`zod@^4.4.3`, y los adaptadores usan `zod()` (el de v3) en vez de `zod4()`.

Funciona por el shim de compatibilidad, pero es deuda silenciosa: estás en v4 escribiendo v3.
Decide y unifica — Superforms soporta Zod 4 con su adaptador propio.

### N8 — Mezcla de idiomas

`src/routes/(auth)/logout/+page.svelte:5` dice "Cerrando sesión..." y
`src/lib/config/domain/feature-flags.ts:1-10` está comentado en español; todo lo demás está en
inglés. Elige uno para el código y comentarios (recomendado: inglés, por los agentes y por si
entregas el repo) y aplícalo.

---

## 5. Higiene

| #   | Qué                                          | Detalle                                                                                                                                                                                                                                                                                                                                      |
| --- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1  | **`npm run lint` falla**                     | 26 errores. El mayor grupo: 11 × `svelte/no-navigation-without-resolve` (hay que envolver los `href` internos con `resolve()`). El resto son variables no usadas (`_authData` en `authorize/+page.server.ts:36`, `data` en dos páginas, `NavSecondary` importado y no usado), `{#each}` sin key ×2, `any` ×2. Todos son de arreglo mecánico. |
| H2  | **Formato inconsistente**                    | Prettier reporta 420 archivos. `lib/stores/*` y `lib/index.ts` están escritos sin punto y coma; el resto con. Un `npm run format` lo cierra, pero conviene hacerlo en un commit aislado para no contaminar el diff del refactor.                                                                                                             |
| H3  | **Dos lockfiles**                            | `package-lock.json` + `pnpm-lock.yaml` + `pnpm-workspace.yaml`, y `CLAUDE.md` dice npm. Elige uno y borra el otro; hoy no sabes cuál resolución de dependencias es la real.                                                                                                                                                                  |
| H4  | **`console.error` suelto**                   | `hooks.server.ts:24`, `hooks.client.ts:6`, `authorize/+page.server.ts:40`. Suficiente por ahora, pero céntralo en una función para poder cambiarlo de sitio el día que quieras Sentry, sin tocar tres archivos.                                                                                                                              |
| H5  | **`architecture.md` describe otro proyecto** | Drizzle, Lucia, Stripe, Bun, `lib/server/db`: nada de eso existe. Es el archivo que consumen los agentes. Mientras el refactor esté en marcha, márcalo como obsoleto; al final, reescríbelo desde el código que quede.                                                                                                                       |
| H6  | **`AGENTS.md` no describe la arquitectura**  | Solo habla del MCP de Svelte. Es el sitio natural para las tres o cuatro reglas duras (prohibido `$state` de módulo, un solo estilo de import, dónde va cada cosa).                                                                                                                                                                          |

---

## 6. Plan de refactor

Cinco tandas. Cada una es un commit o un PR, cada una deja el repo verde. Sin dependencias hacia
atrás, así que puedes parar en cualquier punto.

### Tanda 0 — Base limpia (medio día)

Para que los diffs siguientes se lean.

1. Elegir package manager, borrar el otro lockfile (H3)
2. `npm run format` en un commit aislado (H2)
3. Arreglar los 26 errores de lint (H1)
4. Arreglar los 3 warnings de `state_referenced_locally` (N5)
5. Marcar `architecture.md` como obsoleto con una nota arriba

**Salida:** `lint`, `check` y `test` en verde. A partir de aquí, romperlos se nota.

### Tanda 1 — Borrar lo muerto (medio día)

La tanda de mayor retorno y menor riesgo: nada de esto tiene usos.

6. Borrar D1–D8, D10, D12 (`withLoading`, `lib/stores/*`, `lib/index.ts`, los 6 aliases,
   los barrels de `core`, config sin usar, ruta `/verify`, `types/domain/common.ts`,
   `resolveRole`, `components/domain/`)
7. Verificar y borrar D11 (`ApiError.isShape`)
8. Fijar **una sola convención de import** (`$lib/...` en todo el repo) y escribirla en `AGENTS.md`

**Salida:** el repo pierde ~300 líneas y no pierde ninguna funcionalidad. Lo que queda, se usa.

### Tanda 2 — Cerrar los agujeros de seguridad (1–2 días)

Es donde está el riesgo real.

9. **B1**: los tokens dejan de salir del servidor. `+layout.server.ts` devuelve solo `user`
10. **B2**: borrar `authStore` y `+layout.ts`. El usuario va por `data` y, si hace falta, por contexto
11. **B3**: `canAccessRoute` invocado en `hooks.server.ts` → 403 real
12. **B4**: rol desconocido sin permisos; ruta no listada denegada
13. **B7**: logout como form action POST
14. **B5**: `authorize` pasa a `+server.ts` con validación de `state`
15. **B6**: decidir la vida del access token y documentar si hay o no refresh

**Salida:** el modelo de auth es coherente y defendible. Es el activo diferencial del template.

### Tanda 3 — Hacerlo idiomático (1 día)

16. **N1**: `Select.svelte` sin `$effect` de notificación
17. **N2**: `app-sidebar` con `afterNavigate`
18. **N4**: `ViewState<T>` sostiene el dato; `AsyncView` lo expone al snippet; reescribir la
    página demo para que enseñe el patrón correcto
19. **N6**: tipar `icon`
20. **N7**: unificar en Zod 4
21. **N8**: un solo idioma
22. **H4**: centralizar el logging en una función

**Salida:** el código que copias para empezar una feature es el código correcto.

### Tanda 4 — Red de seguridad y documentación (1 día)

23. Tests de lo que sí importa: `permissions.ts` (la matriz completa rol × ruta),
    `errors/index.ts` (el mapeo), y el `handler` de auth. No busques cobertura: cubre
    exactamente lo que, si se rompe, rompe la seguridad.
24. Un E2E de Playwright: login → dashboard → logout, más "member no entra a /admin".
    Ya tienes Playwright instalado y sin usar.
25. Reescribir `architecture.md` desde el código que quedó, con snippets que compilen
26. `AGENTS.md` con las reglas duras y el enlace al patrón canónico

**Salida:** puedes refactorizar sin miedo, y los agentes producen código alineado al primer intento.

**Total: 4–5 días de trabajo real.** Ninguna tanda introduce dependencias nuevas ni conceptos nuevos.

---

## 7. Lo que NO hacemos ahora

Registrado para que no vuelva a discutirse en cada sesión, y para que el día que sí toque, esté
la razón escrita.

| Fuera de scope                               | Cuándo reconsiderarlo                                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Generadores de código / scaffolding          | Cuando hayas escrito el mismo slice a mano tres veces y te moleste                                                               |
| Tipos generados desde OpenAPI                | Cuando un cambio del backend te rompa producción sin avisar                                                                      |
| Extraer el núcleo a paquetes npm versionados | Cuando tengas 3+ proyectos entregados y un arreglo que propagar                                                                  |
| CI, Docker, adapter fijo, observabilidad     | Cuando el primer proyecto real vaya a producción. Entonces vuelve a `BACKLOG.md`                                   |
| Design tokens multi-marca, i18n, Storybook   | Cuando un cliente lo pida                                                                                                        |
| Segundo slice de ejemplo (`users`)           | Discutible: podría entrar en la Tanda 4 si quieres que el template enseñe un CRUD completo. Cuesta un día más. Decisión abierta. |

`BACKLOG.md` se queda en el repo como backlog de "más adelante". Este documento
es lo que se ejecuta ahora.

---

## 8. Las tres reglas que evitan la recaída

Todo lo de la sección 3 apareció por no tener estas reglas escritas.

1. **El template contiene solo lo que el template usa.** Cero exports sin consumidor. Si escribes
   una abstracción "para cuando la necesite", bórrala: la versión que escribas cuando la necesites
   de verdad será mejor y te costará lo mismo.

2. **Una sola forma de hacer cada cosa.** Un estilo de import, un helper de estado async, un lugar
   para el estado de usuario. Dos formas equivalentes no dan flexibilidad — dan una decisión que
   tomas cada vez y un agente toma al azar.

3. **`$state` a nivel de módulo está prohibido para datos de usuario.** En SSR se comparte entre
   requests. Es la única regla de esta lista cuya violación es un incidente de seguridad y no una
   molestia.
