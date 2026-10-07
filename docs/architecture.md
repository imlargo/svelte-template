# Arquitectura

Cómo está armado el template y qué tocar para cambiar cada cosa. Las reglas de trabajo están en
[`AGENTS.md`](../AGENTS.md); esto explica el porqué detrás de ellas. Los comentarios del código
son la fuente de verdad del detalle: cuando este documento y el código discrepen, manda el código.

## Capas

```
routes/            páginas, layouts, form actions, endpoints
  │  usan
components/        ui (shadcn) · coral (kit) · blocks (propios) · layout
features/<slice>/  services (únicos que llaman al API) · components · schemas · types · contract
  │  usan
core/              api (cliente HTTP) · service (BaseService) · errors · logger · query · permissions
config/            app · routes · navigation · permissions · errors   ← lo que cambia por proyecto
```

`core/` no sabe nada del proyecto: recibe los datos por parámetro o los importa de `config/`. Un
proyecto nuevo cambia `config/` y añade slices en `features/`; `core/` debería quedar igual.

## Ciclo de un request

1. **`hooks.server.ts`** elige el hook según `PUBLIC_AUTH_ENABLED`. Con auth apagada instala un
   `locals.requirePermission` vacío y resuelve. Con auth encendida corre `handleAuth`
   (`features/auth/handler.server.ts`).
2. **`handleAuth`** mira `event.route.id` y lo busca en `PAGE_ACCESS` y `ENDPOINT_ACCESS`
   (`config/permissions.ts`). Una ruta `'public'` pasa. Cualquier otra necesita sesión: lee las dos
   cookies, pregunta al backend quién es el usuario (`AuthService.getMe`) y, si refresh está
   activo y el token caducó, lo renueva una vez. Deja `locals.user` y `locals.accessToken`.
3. Para una **página**, el hook exige la permission de la tabla antes de que corra ningún `load`.
   Para un **endpoint**, solo exige sesión: cada handler llama `locals.requirePermission` con lo
   que necesita por método.
4. **`+layout.server.ts`** raíz serializa `user` y `accessToken` para el cliente. Nunca el refresh
   token.
5. En el cliente, **`+layout.svelte`** crea una `ClientSession` en contexto con un getter sobre
   `data`. `getAuth().api` da a cualquier service de cliente el token actual y un `fetch` que
   reacciona a 401.

Si el backend no responde, el hook contesta 503 y conserva la sesión: una caída no cierra la sesión
de todos. Solo un 401/403 del backend la termina (`rejection.ts`).

## Flujo de un 401 en el cliente

Un service de cliente envía por el transporte de `ClientSession` (`transport.ts`):

- Con `PUBLIC_AUTH_REFRESH_ENABLED=true`, el primer 401 llama a `POST /refresh` de la propia app,
  que gasta el refresh token de su cookie httpOnly, rota ambas cookies y devuelve solo el access
  token. Las peticiones concurrentes comparten esa renovación y se reenvían con el token nuevo.
- Un 401 que sobrevive llama a `refreshAll()`: vuelven a correr los `load`, el hook decide, y si
  la sesión está muerta redirige a `/login?redirect=…`.

Ningún componente maneja 401.

## Permisos

Deny by default en tres sitios:

- **`ROLE_PERMISSIONS`**: un rol tiene exactamente lo listado. Un rol que el backend invente
  mañana no tiene nada hasta que se añada.
- **`PAGE_ACCESS`**: `Record<PageRouteId, Permission | 'public'>` exhaustivo. Una página nueva sin
  entrada no compila. Si una llegara al hook en runtime, se deniega con 403 y se loguea.
- **`ENDPOINT_ACCESS`**: `Record<EndpointRouteId, 'public' | 'session'>`, igual de exhaustivo. El
  hook solo garantiza sesión; `routes/api/endpoints.guard.test.ts` comprueba que cada handler
  llama a `locals.requirePermission`.

Los route ids (`'/(app)/admin'`) vienen de `$app/types` y los genera `svelte-kit sync`. La
navegación (`config/navigation.ts`) usa esos mismos ids: el href sale de `resolve(route)` y la
visibilidad de `PAGE_ACCESS[route]`, así que el menú y el hook leen la misma tabla.

## Cambiar el contrato con el backend

El template no impone un backend. Tres puntos lo aíslan:

- **`features/auth/contract.ts`**: rutas de auth, tipos _wire_ (`access_token`, `tokens`…) y
  mappers hacia los tipos de dominio de `features/auth/types.ts` (`Session`, `SignIn`). Nada
  fuera de `AuthService` ve la forma del backend. Si tu API devuelve `{ jwt, refresh }`, cambias
  `TokenPairWire` y `toSession`, y el hook, las actions y las cookies siguen igual.
- **`config/errors.ts`**: cómo describe un fallo tu API. `normalizeError` le pasa el body y
  recibe `{ code?, message?, status?, payload? }`. El default lee `{ status, message, payload }`
  y traduce estados con `STATUS_ALIASES`. Los códigos y sus mensajes viven en `core/errors.ts`.
- **Tipos de dominio vs wire**: `#lib/types/` y `features/<slice>/types.ts` son lo que ven los
  componentes. Un tipo de respuesta del backend vive junto al service que lo consume y se mapea
  ahí. En `auth` el mapeo es explícito; en `users` el wire y el dominio coinciden porque el demo
  es fullstack.

## Transporte: dos topologías

El default es **direct-to-API**: el browser llama al API externo con bearer, y el servidor hace lo
mismo con `{ token: locals.accessToken, fetch }`. El access token viaja al cliente en el HTML de la
página; el refresh token nunca.

El template también funciona **fullstack**: la app expone sus propios endpoints en `routes/api/`
y los services apuntan a ellos con base URL vacía, como hace el demo `UsersService`. En ese modo
el hook sigue autenticando contra el backend de auth (`PUBLIC_AUTH_BASE_URL`), los endpoints
reciben `locals.user` y `locals.accessToken`, y cada handler se guarda con
`locals.requirePermission`. Los dos modos conviven: un slice puede ir directo y otro por la app.

## Errores

- Todo lo lanzado o capturado pasa por `normalizeError` y es un `AppError` con `code` y un
  `message` siempre mostrable. Un `Error` genérico es un bug: se muestra el mensaje por defecto y
  el original queda en `cause` para el log.
- `handleError` (servidor y cliente) solo actúa sobre `kind === 'unknown'`: genera un `errorId`,
  lo loguea y devuelve el mensaje seguro. `ErrorState` muestra ese id.
- `+error.svelte` captura lo que lanza un `load`. `Boundary` (`blocks/Boundary.svelte`, sobre
  `<svelte:boundary>`) captura lo que una página lanza al renderizar; el layout de `(app)` envuelve
  sus páginas con él para que la sidebar y la salida sigan ahí.
- `logger` (`core/logger.ts`) es la única salida de logs. Para Sentry o JSON estructurado se
  implementa `Logger` y se llama `setLogger`.

## Carga de datos

- Lo que la página no puede pintar sin ello se `await`-ea en `load`. Lo lento se devuelve como
  promesa (streaming) y se pinta con `AsyncView` + skeleton.
- Lo que el usuario busca, filtra o edita en sitio lo carga la página con `Query` + `AsyncView` en
  `onMount`. `Query` se queda con la última ejecución y conserva los datos ante un fallo.
- Sin remote functions: siguen siendo experimentales en SvelteKit 3.

## Estado

Estado por request va en `locals`, en `data` del `load` o en contexto de Svelte (`ClientSession`
es el ejemplo). Un `$state` a nivel de módulo con datos de usuario filtra datos entre usuarios en
SSR: es un incidente de seguridad, no un olvido. Las clases de `#lib/hooks/` son estado genérico y
se instancian donde se usan.

## Variables de entorno

Todas en `src/env.ts` con `defineEnvVars` y schema zod; se leen de `$app/env/public` y
`$app/env/private`. `flag()` exige exactamente `true`/`false`; `unset()` trata `VAR=` como no
definida. En Cloudflare se definen en el worker: el build usa un placeholder para `PUBLIC_API_URL`.
