# Plan de trabajo — tareas para agentes

Lista ordenada. Una tarea = una sesión de agente = un commit. Cada tarea deja el repo en verde.

**Cómo usarla:** el agente lee `docs/README.md` (contexto) y luego le das la tarea. El texto en
blockquote de cada punto es copiable tal cual.

**Estado medido el 2026-08-06** contra el working tree actual, no contra el commit inicial.

Leyenda: ✅ hecho · 🔄 parcial · ⬜ pendiente · ⚠️ decisión tuya

---

## Estado actual del repo

| Verificación    | Estado                   |
| --------------- | ------------------------ |
| `npm run lint`  | ✅ 0 errores (eran 26)   |
| `npm run check` | ✅ 0 errores, 0 warnings |
| `npm run test`  | ✅ 24 tests pasando      |
| Prettier        | ✅ limpio                |
| Lockfiles       | ✅ solo `pnpm-lock.yaml` |

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

**Hecha entera**, en el refactor de auth de la rama `refactor/auth`. Además de B1–B7 se borró el
registro y `/verify`, se aplanó `AuthCookiesManager` en tres funciones (`session.server.ts`), y
`createAuthHandler` pasó de fábrica con nueve opciones a un `Handle` concreto (`handleAuth`).
Los checks de permisos viven ahora en `core/permissions.ts`, con la matriz pasada por argumento.

**Pendiente de ti:** arranca la app contra tu backend y haz un login real. Los checks están en
verde y el flujo se probó contra el dev server (redirect a login preservando destino, logout por
POST que borra cookies, callback OAuth rechazando `state` no coincidente), pero nada de eso
sustituye a un login de verdad.

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

### T3.2 ⬜ `ViewState<T>` y el patrón que enseña el template

El más importante de esta tanda: es el ejemplo que se copia en cada página nueva.

> Ejecuta N4 de `docs/AUDIT.md` siguiendo `docs/ARCHITECTURE.md` §8. `ViewState<T>` pasa a
> sostener el dato (`data` con `$state.raw`), `AsyncView` lo expone al snippet de éxito, y
> desaparece la unión de tipos escrita a mano de sus props. Reescribe la demo de
> `routes/(app)/+page.svelte` para que enseñe el patrón correcto: hoy mantiene `items` en un
> `$state` paralelo y vuelve a comprobar el vacío dentro del snippet de éxito, contradiciendo el
> propio estado `empty`.

### T3.3 🔄 Limpieza de tipos y consistencia

**Hecho:** N6 (`icon` tipado como `LucideIcon`), N7 (Zod 4 con el adaptador `zod4`) y H4
(`core/logger.ts`, sin `console.error` sueltos). **Queda N8**: barrer el repo en busca de
comentarios y textos en español fuera de `docs/`.

> Ejecuta N6, N7 y N8 de `docs/AUDIT.md` más H4: tipa el `icon` de `config/navigation.ts` como
> componente Svelte en vez de `any`; unifica en Zod 4 (hoy `schemas.ts` importa `zod/v3` con Zod 4
> instalado); deja todo el código y los comentarios en inglés; y centraliza el logging en
> `lib/core/logger.ts`, eliminando los `console.error` sueltos de `hooks.server.ts`,
> `hooks.client.ts` y el callback de OAuth.

---

## T4 — Red de seguridad ⬜

### T4.1 🔄 Tests de lo que importa

**Hecho:** la matriz rol × ruta completa en `core/permissions.test.ts`, incluidos rol
desconocido, ruta no declarada y prefijo más largo. **Queda:** el mapeo de `core/errors.ts` y
`handleAuth`.

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
D1  → decisión de config (5 min, tú)
T0.4, T0.6                          ← cerrar la base
T1.1, T1.2                          ← borrar (hace T2 más pequeña)
T2.1 → verificar login a mano ← T2.2 → T2.3 → T2.4
T3.1 → T3.2 → T3.3
T4.1 → T4.2 → T4.3
O1 (opcional, tras T3)
```

**T1 antes que T2** no es negociable: borrar `authStore` en T1 hace T2.1 mucho más pequeña. Al
revés, refactorizas código que ibas a borrar.

**Al terminar T2 y T4**, pide una verificación con ojos frescos: un subagente que no escribió el
código, revisando contra la sección correspondiente de `docs/ARCHITECTURE.md`. Los agentes son
malos auditando su propio trabajo.
