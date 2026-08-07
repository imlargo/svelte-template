# Plan de trabajo — tareas para agentes

Lista ordenada. Una tarea = una sesión de agente = un commit. Cada tarea deja el repo en verde.

**Cómo usarla:** el agente lee `docs/README.md` (contexto) y luego le das la tarea. El texto en
blockquote de cada punto es copiable tal cual.

**Estado medido el 2026-08-07** contra `main`, tras el merge de `refactor/auth` (PR #6,
commit `951edf8`) y su corrección posterior (`f054f25`).

Leyenda: ✅ hecho · 🔄 parcial · ⬜ pendiente · ⚠️ decisión tuya

---

## Estado actual del repo

| Verificación    | Estado                   |
| --------------- | ------------------------ |
| `npm run lint`  | ✅ 0 errores (eran 26)   |
| `npm run check` | ✅ 0 errores, 0 warnings |
| `npm run test`  | ✅ 26 tests pasando      |
| Prettier        | ✅ limpio                |
| Lockfiles       | ✅ solo `pnpm-lock.yaml` |

**Auditado con ojos frescos** (subagente sin contexto del refactor, 2026-08-07): trazó el flujo
completo de login/OAuth/logout/permisos contra el código real, corrió lint/check/test él mismo, y
comparó `ARCHITECTURE.md` contra el código citado línea por línea. Veredicto: sin hallazgos de
seguridad bloqueantes. Dos hallazgos de calidad menores, ambos corregidos en `f054f25`:
`setLogger` sin consumidor (se le añadió `core/logger.test.ts`) y un comentario obsoleto en
`redirect.ts` que aún nombraba `createAuthHandler` en vez de `handleAuth`. Confirmó además que
`core/permissions.ts` no importa de `config/` ni `features/` (cumple §13), y que no queda ningún
`$state` de módulo en `core/` ni `features/auth/`.

---

## ⚠️ D1 — Decisión pendiente: dónde vive la config ✅ CERRADO

**Resuelto:** se actualizó el documento; `config/` se queda plano.

**Bloquea:** nada, pero cuanto antes se cierre, menos divergencia.

El código ya se aplanó a `src/lib/config/{app,navigation,permissions}.ts`.
`docs/ARCHITECTURE.md` §4 todavía describe `lib/config/domain/`. Uno de los dos está mal.

**Recomendación: actualizar el documento.** El aplanado tiene menos archivos, menos barrels y
menos indirección — es coherente con "borrar antes que abstraer". La subcarpeta `domain/` solo
tenía sentido cuando había un `config/` técnico al lado, y ya no lo hay.

> Actualiza `docs/ARCHITECTURE.md` §4 y §13 para que reflejen la estructura real de
> `src/lib/config/` (aplanada: `app.ts`, `navigation.ts`, `permissions.ts`, sin subcarpeta
> `domain/` y sin barrel `index.ts`). Revisa que no queden otras referencias a `config/domain/`
> en los documentos.

---

## T0 — Base limpia

### T0.1 ✅ Lint · T0.2 ✅ Formato · T0.3 ✅ Lockfile único · T0.5 ✅ `architecture.md` eliminado

### T0.4 ✅ Los 3 warnings de reactividad

Son bugs reales: esos componentes capturan el valor inicial de una prop y nunca ven los cambios.

```
src/lib/components/base/file-input/FileState.svelte:21:31
src/lib/components/base/range-date-picker/TimeRangeSelector.svelte:14:7
src/lib/components/base/range-date-picker/TimeRangeSelector.svelte:15:3
```

> Arregla los 3 warnings `state_referenced_locally` que reporta `npm run check`, en
> `FileState.svelte` y `TimeRangeSelector.svelte`. No son ruido: significan que el componente no
> reacciona a cambios de sus props. `npm run check` debe terminar con 0 errores y 0 warnings.

### T0.6 ⬜ Fijar el gestor de paquetes

Se eligió pnpm (es el único lockfile), pero nada lo hace explícito y `AGENTS.md` aún dice npm.

> Fija pnpm como gestor: campo `packageManager` en `package.json`, `engines.node` con la versión
> de Node, y corrige las menciones a npm en `AGENTS.md`. Verifica que los scripts del README y de
> `docs/` usen el comando correcto.

---

## T1 — Borrar lo muerto 🔄

Ya se borraron `src/lib/index.ts`, `ROLE_PRIORITY`, `PAGINATION_DEFAULTS` y `FEATURE_FLAGS`.
Falta el resto. **Máximo retorno, mínimo riesgo: nada de esto tiene consumidores.**

### T1.1 ⬜ Abstracciones sin uso

**Ya hecho** en el refactor de auth: `with-loading`, `core/index.ts`, `core/helpers/index.ts`,
`types/domain/`, `(auth)/verify/` y `resolveRole`. **Queda:** `lib/stores/` completo,
`components/domain/` y `ApiError.isShape`.

> Ejecuta la Tanda 1 de `docs/AUDIT.md` sobre lo que queda. Verifica con grep en todo `src/` que
> cada símbolo tiene cero consumidores antes de borrarlo, y borra: `lib/stores/` completo
> (`FilterStore`, `PaginationStore`, `Disclosure`), `core/helpers/with-loading.svelte.ts`,
> `core/index.ts` y `core/helpers/index.ts`, `types/domain/common.ts`, la ruta `(auth)/verify/`,
> `components/domain/`, la función `resolveRole` de `features/auth/permissions.ts`, y
> `ApiError.isShape` junto con su rama en `normalizeError` si confirmas que es inalcanzable.
> Ajusta los imports rotos que aparezcan.

### T1.2 ⬜ Los 6 aliases sin usar

`svelte.config.js` declara `$components`, `$ui`, `$core`, `$stores`, `$types`, `$utils`. Cero usos
en todo el repo: todo el código importa por `$lib/`.

> Elimina los 6 aliases de `svelte.config.js`, dejando solo `$lib`. Confirma antes con grep que
> ninguno se usa. `npm run check` debe seguir en verde.

---

## T2 — Seguridad ✅

**Hecha entera y mergeada a `main`** (PR #6). Además de B1–B7 se borró el registro y `/verify`,
se aplanó `AuthCookiesManager` en tres funciones (`session.server.ts`), y `createAuthHandler`
pasó de fábrica con nueve opciones a un `Handle` concreto (`handleAuth`). Los checks de permisos
viven ahora en `core/permissions.ts`, con la matriz pasada por argumento. Auditado con ojos
frescos el 2026-08-07: sin hallazgos de seguridad.

**Sigue pendiente de ti:** arranca la app contra tu backend y haz un login real. Ni los checks ni
la auditoría sustituyen eso — nadie, ni yo ni el subagente que audita, ha visto el flujo feliz
completo (credenciales válidas → `/auth/me` resuelve → sidebar pinta el rol) contra una API de
verdad.

### T2.1 ✅ Tokens y contexto de auth _(B1 + B2)_

El cambio más grande. Van juntos porque son el mismo refactor.

> Ejecuta B1 y B2 de `docs/AUDIT.md` siguiendo `docs/ARCHITECTURE.md` §7 y §8. Resumen:
> `+layout.server.ts` devuelve `user` y `accessToken` pero **nunca** `refreshToken`; elimina
> `authStore` y `src/routes/+layout.ts` completos; el estado de auth del cliente pasa a un
> contexto creado con `createContext` en `+layout.svelte`. `BaseService` **conserva** la variante
> "token como función" — la capa de servicios es isomorfa por diseño y esa forma es lo que permite
> leer el token actual en cada request.

**⚠️ Después de esta tarea, arranca la app y haz login tú mismo.** Es el punto donde un agente
puede dejarte una sesión rota con todos los checks en verde.

### T2.2 ✅ Autorización real _(B3 + B4)_

`canAccessRoute` existe y solo se llama a sí misma desde `resolveDefaultRoute`. **Ninguna ruta
está protegida por rol**: un `member` escribe `/admin` y entra.

> Ejecuta B3 y B4 de `docs/AUDIT.md` siguiendo `docs/ARCHITECTURE.md` §7. Invoca `canAccessRoute`
> en `hooks.server.ts` tras resolver el usuario, devolviendo 403 si no pasa. Cambia a deny by
> default en las dos direcciones: rol desconocido sin permisos, y ruta no declarada en
> `AUTH_ROUTE_PERMISSIONS` denegada. El match de rutas debe ser por prefijo más largo, no por el
> primero que coincida.

### T2.3 ✅ Logout por POST _(B7)_

Hoy el logout es un `load`, que corre en GET. El prefetch de SvelteKit puede cerrar la sesión sola.

> Ejecuta B7 de `docs/AUDIT.md`: convierte el logout en una form action POST con `use:enhance`.
> La página pasa a ser un formulario con un botón, que debe funcionar también sin JavaScript.

### T2.4 ✅ Callback OAuth _(B5 + B6)_

> Ejecuta B5 y B6 de `docs/AUDIT.md`: convierte `(auth)/authorize/` de página a `+server.ts`,
> añade generación y verificación del parámetro `state` (nonce en cookie) contra CSRF de OAuth, y
> separa el `maxAge` del access token del refresh token en `AuthCookiesManager` — hoy comparten
> valor, lo que anula el sentido de tener dos tokens.

### T2.5 ✅ Auditoría con ojos frescos y correcciones

> Se lanzó un subagente sin contexto del refactor a auditar `main` tras el merge, contra
> `docs/ARCHITECTURE.md` como fuente de verdad. Sin hallazgos de seguridad. Dos hallazgos de
> calidad, ambos corregidos en el commit `f054f25`: `setLogger` (`core/logger.ts`) no tenía
> consumidor — se le dio uno real en vez de borrarlo, con `core/logger.test.ts`, porque borrarlo
> anulaba el punto de tener una interfaz `Logger` intercambiable; y `redirect.ts` citaba
> `createAuthHandler`, que el refactor había renombrado a `handleAuth`.

---

## T3 — Idiomático ⬜

Referencia: `docs/ARCHITECTURE.md` §8 y §9.

### T3.1 🔄 Los dos `$effect` mal usados

**Hecho N2** (`app-sidebar` usa `afterNavigate`). **Queda N1**: el `$effect` de `Select.svelte`.

> Ejecuta N1 y N2 de `docs/AUDIT.md`. En `base/select/Select.svelte`, elimina el `$effect` que
> llama a `onchange` (se dispara al montar y hace eco cuando el padre reasigna); invoca el
> callback en el event handler y tipa el parámetro, quitando el `any`. En
> `layout/sidebar/app-sidebar.svelte`, sustituye la detección manual de navegación con
> `previousPathname` por `afterNavigate` de `$app/navigation`.

### T3.2 ✅ `ViewState<T>` reemplazado por `Query<T>`

El más importante de esta tanda: es el ejemplo que se copia en cada página nueva.

> Ejecuta N4 de `docs/AUDIT.md`, pero con un rediseño más simple que el descrito originalmente en
> `docs/ARCHITECTURE.md` §8 (decisión explícita del autor, no una desviación accidental):
> `view-state.svelte.ts` desaparece y se reemplaza por `core/query.svelte.ts` (`Query<T>` +
> `createQuery`) — sin la máquina de estados `idle/loading/success/error/empty`, sin getters
> `is*`. Tres campos planos: `data`, `loading`, `error`. `AsyncView` expone `data` al snippet de
> éxito y la vista decide qué es "vacío" mirando el propio dato, sin un estado `empty` aparte.
> `routes/(app)/+page.svelte` ya no mantiene `items` en un `$state` paralelo — una sola fuente de
> verdad. `docs/ARCHITECTURE.md` §8 y §14 quedan actualizados con el nuevo diseño.
>
> Pulido posterior, todo en §8: `error` pasa a ser un `AppError` en vez de un string (la vista usa
> `getMessage()`, el llamante conserva `code`/`isAuth()`); `run` devuelve `void` para que nadie
> reintroduzca la variable paralela; `data`/`error` usan `$state.raw`; `loading` pasa a
> `isLoading`. `AsyncView` recupera el snippet `empty`, que se dispara solo cuando `data` es un
> array vacío — sin prop `isEmpty` que configurar. Cubierto por `core/query.test.ts`.
>
> Descartado a propósito, en dos rondas: (a) ordenar llamadas concurrentes en `run` (contador de
> corrida) — no hay consumidor que las solape, y el caso que lo motivaría necesita debounce en el
> call site igual; la limitación queda en el docstring de `Query` y en §8. (b) banderas derivadas
> al estilo TanStack (`isError`, `isSuccess`) — se implementaron y se quitaron: una bandera
> booleana no estrecha el tipo, así que `AsyncView` no podía usarlas (dos errores de
> `svelte-check`) y quedaban como una segunda forma de preguntar lo que `{#if query.error}` ya
> responde mejor.

### T3.3 🔄 Limpieza de tipos y consistencia

**Hecho:** N6 (`icon` tipado como `LucideIcon`), N7 (Zod 4 con el adaptador `zod4`) y H4
(`core/logger.ts`, ahora una interfaz `Logger` + `ConsoleLogger`, sin `console.error` sueltos).
**Queda N8**: el ejemplo original de `AUDIT.md` (`logout/+page.svelte`) ya no existe, pero la
auditoría del 2026-08-07 encontró otros dos: etiquetas en español en `utils/date.ts:16-22` y un
comentario en `NumberInput.svelte:52`. El hallazgo sigue vivo, solo cambiaron los ejemplos —
conviene un grep de barrido, no arreglar solo estos dos.

> Ejecuta N6, N7 y N8 de `docs/AUDIT.md` más H4: tipa el `icon` de `config/navigation.ts` como
> componente Svelte en vez de `any`; unifica en Zod 4 (hoy `schemas.ts` importa `zod/v3` con Zod 4
> instalado); deja todo el código y los comentarios en inglés; y centraliza el logging en
> `lib/core/logger.ts`, eliminando los `console.error` sueltos de `hooks.server.ts`,
> `hooks.client.ts` y el callback de OAuth.

---

## T4 — Red de seguridad ⬜

### T4.1 🔄 Tests de lo que importa

**Hecho:** la matriz rol × ruta completa en `core/permissions.test.ts` (16 tests), incluidos rol
desconocido, ruta no declarada y prefijo más largo — validado por la auditoría del 2026-08-07,
que solo señaló como hueco menor el caso específico `/admin` vs `/admin-panel` (la
implementación lo resuelve bien, el test no lo fija explícitamente). También se sumó
`core/logger.test.ts`, fuera del alcance original de esta tarea pero mismo criterio: cubre lo
que el propio diseño necesita probar (que `setLogger` intercambia la implementación de verdad).
**Queda:** el mapeo de `core/errors.ts` y `handleAuth`.

> Escribe los tests obligatorios de `docs/ARCHITECTURE.md` §15: la matriz completa rol × ruta de
> `features/auth/permissions.ts` incluyendo rol desconocido y ruta no declarada; el mapeo de
> `core/errors.ts`; y `createAuthHandler` (ruta pública pasa, sin cookies redirige a login, token
> inválido redirige, sin permiso da 403). No busques cobertura: cubre solo eso.

### T4.2 ⬜ E2E

Playwright lleva instalado desde el principio y sin usar.

> Configura Playwright con `webServer` y escribe dos E2E contra la API externa mockeada por
> interceptación de rutas (nunca contra un backend real): login → dashboard → logout, y un usuario
> con rol `member` que recibe 403 al ir a `/admin`.

### T4.3 ⬜ Revisar la documentación contra el código

Última tarea. Para entonces el código habrá cambiado bastante.

> Revisa `docs/ARCHITECTURE.md` entero contra el código real: cada snippet debe compilar, cada
> ruta de archivo debe existir, cada regla debe cumplirse. Corrige el documento donde el código
> ganó la discusión. Marca en `docs/AUDIT.md` los hallazgos resueltos.

---

## Opcional — decide tú

### O1 ⬜ Slice de referencia

Un CRUD completo (`users`) que sirva de patrón canónico a copiar. Cuesta ~1 día.

**A favor:** es lo que un agente imita al crear un slice nuevo; sin él, imita `auth`, que es
atípico. **En contra:** roza el límite de "no volverlo framework" — es código que no usa el
template, solo enseña.

Mi lectura: hazlo **después de T3**, cuando los patrones ya sean los definitivos. Antes,
construirías el ejemplo sobre patrones que vas a cambiar.

---

## Resumen del orden

```
D1 ✅ · T0.4 ✅ · T2 ✅ (auditada, mergeada)      ← cerrado
T0.6                                              ← queda, es rápido
T1.1, T1.2                                        ← borrar lo que sigue muerto
T3.1 (falta N1) → T3.2 → T3.3 (falta barrido N8)
T4.1 (falta errors.ts + handleAuth) → T4.2 → T4.3
O1 (opcional, tras T3)
```

**Al terminar T4**, repite la verificación con ojos frescos igual que se hizo para T2: un
subagente sin contexto del trabajo, revisando contra `docs/ARCHITECTURE.md`. Ya se demostró que
detecta cosas reales (`setLogger` sin consumidor) que quien escribe el código no ve.
