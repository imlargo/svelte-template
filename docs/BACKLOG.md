# Requerimientos de la Base de Plataforma

> Documento de arquitectura y developer experience para convertir `svelte-template` en una
> base de plataforma reutilizable para consultoría de producto.
>
> Audiencia: un desarrollador (o un agente) que arranca un producto nuevo sobre esta base.
> Estado: propuesta de requerimientos. Cada requerimiento tiene prioridad y criterio de aceptación.

---

## 0. Contexto y diagnóstico del estado actual

El template hoy ya resuelve más de lo que un starter típico resuelve: arquitectura por capas,
auth completo con cookies server-side, shadcn-svelte, superforms, aliases, layout con sidebar.
Eso es capital real. El salto a "base de plataforma" no es agregar más features — es cerrar los
huecos que hacen que cada proyecto nuevo cueste días en lugar de horas, y que el proyecto #5 no
sea una copia divergente del #1.

### Hallazgos concretos

| #   | Hallazgo                                                                                                                                                                                                                                                 | Impacto                                                                                                                                    |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| H1  | `architecture.md` describe un stack (Drizzle, Lucia, Stripe, Uploadthing, Bun, `lib/server/db`) que **no existe en el código**. El código real es un cliente de una API externa (`PUBLIC_API_URL` + `@korastd/air`), sin base de datos ni `lib/server/`. | Crítico. El documento es el contrato con tu yo futuro y con los agentes de IA. Un doc que miente produce código equivocado en cada sesión. |
| H2  | Dos lockfiles coexisten: `package-lock.json` y `pnpm-lock.yaml`, más `pnpm-workspace.yaml`. `CLAUDE.md` dice npm.                                                                                                                                        | Alto. Builds no reproducibles, CI ambigua, resolución de dependencias divergente entre tu máquina y producción.                            |
| H3  | No hay `.github/workflows`. Ninguna verificación automatizada.                                                                                                                                                                                           | Alto. `lint`, `check` y `test` dependen de disciplina manual. En consultoría con carga alta, la disciplina manual es lo primero que cae.   |
| H4  | Un solo test en todo el repo (`redirect.test.ts`), sobre 365 componentes. No hay E2E pese a tener Playwright instalado.                                                                                                                                  | Alto. Sin red de seguridad no puedes refactorizar la base sin romper los productos que ya la usan.                                         |
| H5  | `adapter-auto` sin adapter fijo, sin `.nvmrc`, sin Dockerfile. No hay camino de despliegue definido.                                                                                                                                                     | Alto. "Time to first deploy" es la métrica que más te cuesta hoy.                                                                          |
| H6  | Los tipos de la API externa se escriben a mano en `lib/types/domain/`. No hay generación desde un contrato (OpenAPI).                                                                                                                                    | Alto. Es la fuente #1 de bugs en runtime en arquitecturas frontend + API separada.                                                         |
| H7  | No hay observabilidad: ni error tracking, ni Web Vitals, ni logging estructurado. `handleError` hace `console.error`.                                                                                                                                    | Medio-alto. En producción no te enteras de los errores de tus clientes hasta que te llaman.                                                |
| H8  | No hay i18n, ni capa de theming multi-marca, ni tokens de diseño más allá de los defaults de shadcn.                                                                                                                                                     | Medio. Cada cliente nuevo va a querer sus colores; hoy eso es buscar y reemplazar.                                                         |
| H9  | La reutilización es por _fork del template_. No hay estrategia de propagar mejoras a proyectos ya entregados.                                                                                                                                            | **Crítico para tu modelo de negocio.** Es el problema real, y ninguna decisión de arquitectura lo resuelve sola.                           |
| H10 | No hay generadores/scaffolding. Crear un CRUD nuevo es copiar-pegar-renombrar el feature de `auth`.                                                                                                                                                      | Medio-alto. Es donde más horas repetidas se van.                                                                                           |

### El requerimiento cero

**Decide el tipo de plataforma antes que nada.** Hoy el código y la documentación apuntan a dos
productos distintos:

- **A) Cliente de API externa (lo que el código hace hoy).** SvelteKit es UI + BFF delgado; el
  dominio vive en un backend separado (Go, por lo que sugiere `@korastd/air`). Contrato: OpenAPI.
- **B) SvelteKit full-stack (lo que `architecture.md` describe).** DB, auth y billing dentro del
  mismo repo. Contrato: el schema de la DB.

Son plataformas diferentes: distinto testing, distinto despliegue, distinta seguridad, distinto
modelo de datos. Intentar cubrir ambas duplica el trabajo y no te da velocidad en ninguna.

**Recomendación: A, con una extensión opcional documentada hacia B.** Razones: (1) es lo que ya
tienes construido y funcionando; (2) encaja con consultoría donde el backend a veces ya existe o
lo escribe otro equipo; (3) B sin A es un lock-in a SvelteKit para lógica de negocio que
sobrevivirá al framework. Si un proyecto necesita persistencia propia, se añade `src/lib/server/db`
como _módulo opcional_ del mismo template, no como el default.

Todo lo que sigue asume A. Los puntos marcados 🅱️ indican el trabajo extra si eliges B.

---

## 1. Arquitectura

### R1.1 — Reescribir `architecture.md` para que describa el código real ⬤ P0

**Por qué.** Es el documento que consumen tú y los agentes de IA. Hoy induce a error en cada
sesión: un agente que lea ese archivo va a escribir `import { db } from '$lib/server/db'`.

**Criterio de aceptación**

- Cada snippet del documento compila contra el código actual del repo.
- El stack listado coincide 1:1 con `package.json`.
- Un test de CI valida que los ejemplos de código en el doc referencian rutas que existen
  (basta con un script que extraiga los `import ... from '$...'` del markdown y verifique el path).
- La sección "ORM / Base de datos / Billing / Email / Archivos" se elimina o se mueve a un
  `docs/extensions/fullstack.md` explícitamente marcado como no implementado.

### R1.2 — Formalizar las reglas de dependencia entre capas con lint, no con prosa ⬤ P0

**Por qué.** `architecture.md` tiene una sección excelente de "Reglas de importación". Escrita en
prosa, se rompe en el mes tres. Escrita como regla de ESLint, no se rompe nunca.

**Criterio de aceptación**

- `eslint-plugin-boundaries` (o `import/no-restricted-paths`) configurado con las capas:
  `core` → `config` → `types`/`utils` → `stores` → `features` → `components` → `routes`.
- Reglas mínimas, que fallan el build:
  - `lib/core/**` no importa de `lib/features/**`, `lib/components/**`, `lib/config/domain/**`.
  - `lib/features/<a>/**` no importa de `lib/features/<b>/**` salvo por el barrel `index.ts`.
  - `lib/components/{ui,base,common}/**` no importa de `lib/features/**`.
  - `routes/**` no importa de `lib/features/*/stores/**` ni `lib/features/*/services/**`.
  - Nada fuera de `lib/server/**` y `hooks.server.ts` importa `lib/server/**` (SvelteKit ya lo
    verifica, pero la regla lo hace visible en el editor y no solo en build).
- `npm run lint` falla con un mensaje que nombra la regla violada y la capa correcta.

### R1.3 — Definir el contrato del "feature slice" y hacerlo verificable ⬤ P0

**Por qué.** Hoy `features/auth/` es el único ejemplo y su estructura es implícita. Un slice sin
forma canónica se convierte en cinco formas distintas en cinco proyectos.

**Estructura canónica**

```
lib/features/<domain>/
├── index.ts                  ← API pública. Único import point desde fuera.
├── types.ts                  ← tipos del dominio (o re-export de los generados)
├── schemas.ts                ← Zod: validación de forms y de payloads
├── services/<entity>.ts      ← acceso a la API externa (extiende BaseService)
├── stores/<entity>.svelte.ts ← estado reactivo del cliente
├── <domain>.svelte.ts        ← orquestador: deriva viewState, compone acciones
├── components/               ← UI del dominio (incluye la View raíz)
├── server/                   ← [opcional] lógica server-only del slice
└── *.test.ts                 ← tests colocados junto al código
```

**Reglas duras**

- El orquestador no hace HTTP. Los services sí. Los stores llaman a services.
- Ningún componente importa un store o un service directamente; solo el orquestador.
- `index.ts` exporta: el factory del orquestador, los tipos públicos, y nada más.
- Un slice se puede borrar entero (`rm -rf`) y el proyecto compila salvo por sus rutas.

**Criterio de aceptación**

- Existe un segundo slice de ejemplo, no trivial y no-auth (recomendado: `users`, CRUD completo
  con listado paginado + filtros + detalle + create/edit/delete), que sirve de referencia viva.
- Ese slice tiene tests unitarios del orquestador y un E2E del flujo completo.
- El generador de R7.1 produce exactamente esta estructura.

### R1.4 — Decidir la política de data fetching: load functions vs remote functions ⬤ P1

**Por qué.** SvelteKit estabilizó las _remote functions_ (`query` / `form` / `command` /
`prerender` en archivos `.remote.ts`) junto a Svelte 5.49 y maduraron en 5.55 / SvelteKit 2.57
— versiones que **ya tienes instaladas**. Eliminan el boilerplate de `+server.ts` y de mantener
tipos sincronizados entre request y response, y traen `single-flight mutations` y refresco de
queries. Es el cambio más grande en el modelo de datos de SvelteKit desde las form actions.

Si no fijas una política, terminarás con tres estilos de fetching conviviendo en el mismo proyecto.

**Política recomendada**

| Caso                                                                | Mecanismo                                             |
| ------------------------------------------------------------------- | ----------------------------------------------------- |
| Datos necesarios para el primer render de una página                | `+page.server.ts` `load`                              |
| Datos secundarios, bajo demanda, o refrescables desde la UI         | `query()` en `.remote.ts`                             |
| Mutación desde un `<form>`                                          | `form()` en `.remote.ts`, o form action + superforms  |
| Mutación fuera de un form (botón, drag&drop)                        | `command()`                                           |
| Contenido estático conocido en build                                | `prerender()`                                         |
| Llamada desde el cliente a la API externa sin pasar por el servidor | Solo si el token es del cliente y hay razón explícita |

**Criterio de aceptación**

- La política está documentada con un ejemplo de cada fila en el slice de referencia.
- Está resuelto y documentado dónde vive el token de acceso en cada caso (cookie httpOnly leída
  en el servidor vs. store del cliente) — hoy `BaseService` soporta ambos pero no dice cuándo usar cuál.
- Está definido el manejo de errores de la API externa dentro de remote functions: qué se
  convierte en `error()` de SvelteKit y qué se devuelve como estado de la vista.

### R1.5 — Multi-tenancy y contexto de request ⬤ P1

**Por qué.** Casi todo producto de consultoría termina siendo multi-organización. Retrofitear
tenancy es de las refactorizaciones más caras que existen.

**Criterio de aceptación**

- `locals` tipado en `app.d.ts` con `user`, `session` y (si aplica) `org`/`tenant`.
- El tenant activo se resuelve una sola vez en `hooks.server.ts` y se propaga por `locals` →
  `load` → contexto de Svelte. Ningún componente lo lee de un singleton global.
- Toda llamada a la API externa incluye el identificador de tenant de forma centralizada
  (en `createApiClient`, no en cada service).
- Documentado el modo "single-tenant": cómo desactivar la capa sin borrar código.

---

## 2. Contratos de datos y tipos

### R2.1 — Generar los tipos de la API desde OpenAPI, nunca escribirlos a mano ⬤ P0

**Por qué.** Es el mayor retorno por hora invertida en toda esta lista. En una arquitectura
frontend + API separada, los tipos escritos a mano son documentación desactualizada disfrazada
de seguridad de tipos: el compilador te da luz verde sobre una mentira.

**Criterio de aceptación**

- `openapi-typescript` (tipos) y opcionalmente `openapi-fetch`/generador de cliente, con
  `npm run api:types` que regenera `src/lib/types/api/generated.ts`.
- El archivo generado está commiteado (para builds reproducibles) y marcado como no editable en
  `.prettierignore` y en las reglas de ESLint.
- CI falla si el archivo generado difiere de regenerarlo contra el spec fijado.
- Los tipos de dominio en `lib/types/domain/` son _derivaciones_ de los generados
  (`type User = components['schemas']['User']`), no copias.
- Los schemas Zod validan solo en los bordes donde el dato entra del usuario (forms) o donde no
  confías en el backend, no en cada respuesta.

🅱️ Si eliges full-stack: los tipos salen del schema de Drizzle y este requerimiento desaparece.

### R2.2 — Modelo de errores unificado extremo a extremo ⬤ P1

Ya existe `lib/core/errors` con `normalizeError` y `ApiError` — está bien encaminado. Falta cerrarlo.

**Criterio de aceptación**

- Taxonomía cerrada de errores: `network` | `auth` | `validation` | `not_found` | `permission` |
  `conflict` | `server` | `unknown`, con mapeo desde códigos HTTP.
- Mensajes de usuario separados de mensajes de log. Nunca se muestra un stack o un mensaje del
  backend crudo en la UI.
- Cada error tiene un `correlationId` que se loguea y se muestra en el estado de error de la UI
  ("Error ref: a1b2c3"), para soporte.
- `+error.svelte` y el `ErrorState` de las vistas consumen la misma taxonomía.
- Tests que cubren cada rama del mapeo.

---

## 3. Estado, UI y sistema de diseño

### R3.1 — Formalizar el patrón de estado sobre runes ⬤ P1

**Por qué.** El template ya usa factories con getters (`createFilterStore`, `createDisclosure`),
que funciona bien. La convención de la comunidad se movió hacia _clases reactivas_ con `$state`
en campos, que evita el boilerplate de getters. Cualquiera de las dos sirve; mezclarlas no.

**Criterio de aceptación**

- Una sola convención documentada, aplicada en todos los stores existentes.
- Regla explícita sobre estado global: prohibido `$state` a nivel de módulo en código que corra
  en el servidor (se comparte entre requests y filtra datos entre usuarios — es un bug de
  seguridad, no de estilo). El estado por-request va en `locals` o en contexto de Svelte.
- Un lint o un test que detecte `$state` exportado a nivel de módulo fuera de una factory.

### R3.2 — Capa de design tokens y theming multi-marca ⬤ P1

**Por qué.** Como consultor entregas el mismo producto con la marca de cada cliente. Tailwind v4
ya es CSS-first con `@theme` y variables CSS, así que esto es barato si se hace desde el día uno
y caro si se hace después.

**Criterio de aceptación**

- Tres niveles de tokens: primitivos (paleta OKLCH) → semánticos (`--color-surface`,
  `--color-danger`) → de componente. Los componentes **solo** referencian semánticos.
- Cambiar de marca = reemplazar un archivo de tokens. Verificado con dos temas de ejemplo en el repo.
- Dark mode y light mode derivados de los mismos semánticos, no duplicados a mano.
- Los componentes de `ui/` (shadcn) no se editan; la personalización vive en tokens y en `base/`.
- Documentado el punto de decisión: si algún día necesitas tokens para móvil o para email,
  la fuente pasa a ser JSON procesado con Style Dictionary. Hoy no lo necesitas.

### R3.3 — Catálogo de componentes navegable ⬤ P2

**Por qué.** 365 archivos `.svelte`. Sin catálogo, en el proyecto #4 vas a reimplementar un
componente que ya existe porque no recordabas su nombre.

**Criterio de aceptación**

- Una ruta `/(dev)/kitchen-sink` (excluida del build de producción por variable de entorno) que
  renderiza cada componente de `base/`, `common/` y `blocks/` en sus variantes y estados
  (default, loading, error, vacío, dark).
- Sirve además como superficie de smoke test visual y de accesibilidad.
- Alternativa si crece: Storybook. No lo introduzcas hasta que el kitchen sink te quede corto.

### R3.4 — Estados de UI obligatorios ⬤ P1

**Criterio de aceptación**

- Todo componente de vista que consuma datos async maneja los cinco estados de `AsyncViewState`:
  `idle`, `loading` (skeleton, no spinner), `error` (con reintento), `empty` (con acción), `success`.
- `AsyncView` ya existe en `components/common/` — debe ser el único camino, y el generador de
  R7.1 lo cablea por defecto.
- Regla de review: una vista sin estado `empty` es un bug.

---

## 4. Autenticación, autorización y seguridad de aplicación

### R4.1 — Autorización declarativa y verificada en el servidor ⬤ P0

**Por qué.** El template ya tiene `PERMISSION_GROUPS`, `AUTH_ROUTE_PERMISSIONS` y `hasPermission`.
El riesgo es que el chequeo viva solo en el cliente (ocultar un botón no es autorización).

**Criterio de aceptación**

- Todo permiso se evalúa en el servidor (`hooks.server.ts` o `+layout.server.ts`), y el cliente
  solo lo usa para presentación.
- Una ruta nueva sin entrada en `AUTH_ROUTE_PERMISSIONS` es **denegada por defecto**, no permitida.
- Test que enumera todas las rutas bajo `(app)/` y falla si alguna no tiene política declarada.
- Documentado: el frontend nunca es la frontera de seguridad; la API externa revalida todo.

### R4.2 — Endurecimiento de la capa web ⬤ P1

**Criterio de aceptación**

- Cabeceras de seguridad en `hooks.server.ts`: CSP (con nonce para los scripts inline de
  SvelteKit), `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`,
  `Permissions-Policy`.
- Protección CSRF explícita para form actions y remote functions con estado.
- Cookies de sesión: `httpOnly`, `secure` en producción (hoy el default de `.env.example` es
  `false` — correcto para dev, debe fallar el arranque en producción), `sameSite=lax`.
- Validación de variables de entorno al arrancar con Zod: el proceso no levanta si falta o es
  inválida una variable requerida. Esto elimina la clase entera de bugs "funcionaba en local".
- Rate limiting en las rutas de auth del BFF.

### R4.3 — Manejo del token de acceso ⬤ P0

**Criterio de aceptación**

- Documentado y consistente: dónde vive el access token, quién lo refresca, qué pasa cuando
  expira a mitad de una navegación, y qué pasa con requests concurrentes durante un refresh
  (deduplicación del refresh — sin esto, un token expirado dispara N refreshes simultáneos).
- Si el token llega al cliente, está justificado por escrito. Si no, todo pasa por el BFF.
- Test del flujo de expiración y refresh.

---

## 5. Calidad: testing, tipos, accesibilidad

### R5.1 — Estrategia de testing con umbrales, no con buenas intenciones ⬤ P0

**Por qué.** Un test en 365 componentes significa que no puedes tocar la base sin miedo. Y una
base que da miedo tocar deja de mejorar.

**Pirámide propuesta**

| Nivel      | Qué cubre                                                 | Herramienta           | Meta                                                                            |
| ---------- | --------------------------------------------------------- | --------------------- | ------------------------------------------------------------------------------- |
| Unitario   | utils, orquestadores, permisos, mapeo de errores, schemas | Vitest (node)         | ≥80% en `lib/core`, `lib/utils`, `lib/features/*/[orquestador]`                 |
| Componente | componentes de `base/` y `common/` en sus estados         | vitest-browser-svelte | Los componentes con lógica, no los de puro markup                               |
| Contrato   | que los tipos generados coinciden con el spec             | script en CI          | Bloqueante                                                                      |
| E2E        | los flujos que si se rompen, el cliente llama             | Playwright            | login, logout, sesión expirada, CRUD del slice de referencia, guard de permisos |

**Criterio de aceptación**

- Umbrales de cobertura configurados en `vitest.config` y **bloqueantes en CI** solo sobre
  `lib/core/**`, `lib/utils/**` y los orquestadores. No pongas umbral global: te va a empujar a
  escribir tests basura de componentes de presentación.
- Playwright configurado con `webServer`, corriendo contra un mock de la API externa (MSW o
  Playwright route interception) — no contra un backend real.
- `npm run test` corre todo; `npm run test:e2e` separado para el ciclo rápido local.

### R5.2 — TypeScript estricto de verdad ⬤ P1

**Criterio de aceptación**

- Añadir a `tsconfig.json`: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
  `noImplicitOverride`, `verbatimModuleSyntax`.
- `@typescript-eslint/no-explicit-any` en `error`, con excepciones justificadas por comentario.
- `npm run check` con cero errores y cero warnings, bloqueante en CI.

### R5.3 — Accesibilidad como requisito, no como extra ⬤ P1

**Por qué.** La European Accessibility Act entró en vigor el 28 de junio de 2025. El estándar
armonizado vigente (EN 301 549 v3.2.1) incorpora WCAG 2.1 AA; la v4.1.1, esperada en 2026,
incorpora WCAG 2.2. Si vendes a clientes con operación en la UE, esto es contractual, no opinión.
Auditar contra **WCAG 2.2 AA** te deja cubierto hoy y con margen.

**Criterio de aceptación**

- `eslint-plugin-svelte` con las reglas a11y activas en `error`, no en `warn`.
- `axe-core` corriendo en los E2E sobre las páginas principales y sobre el kitchen sink; falla CI
  ante violaciones serias o críticas.
- Checklist manual en el template de PR: navegación completa por teclado, foco visible, contraste,
  labels de formulario, `aria-live` en los estados async.
- Los componentes de shadcn/bits-ui ya traen buena base — el riesgo está en `base/` y `blocks/`.

---

## 6. Tooling y Developer Experience

### R6.1 — Un solo package manager, una sola versión de Node ⬤ P0

**Criterio de aceptación**

- Elegir uno (recomendado **pnpm**: instalación más rápida, `node_modules` estricto que impide
  dependencias fantasma, workspaces nativos si algún día partes el repo). Borrar el otro lockfile.
- `packageManager` fijado en `package.json` + Corepack.
- `.nvmrc` / campo `engines` con la versión de Node.
- `npm run <lo que sea>` falla con mensaje claro si se usa el gestor equivocado (`only-allow`).

### R6.2 — CI como puerta de calidad ⬤ P0

**Criterio de aceptación**

- `.github/workflows/ci.yml` en cada push y PR: instalar → `check` → `lint` → `test` →
  `test:e2e` → `build`. Todos bloqueantes.
- Caché de dependencias y de Playwright para que el pipeline baje de ~5 minutos.
- Un job de `audit` de dependencias (ver R8.1).
- Branch protection en `main`: no se mergea con CI en rojo.
- Preview deploy por PR si el target lo soporta.

### R6.3 — Preflight local: rápido, automático, no negociable ⬤ P1

**Criterio de aceptación**

- Husky + lint-staged: en pre-commit corre Prettier y ESLint **solo sobre los archivos tocados**
  (< 3 segundos). `svelte-check` completo no va en pre-commit — va en pre-push o solo en CI.
- Conventional commits validados con commitlint (habilita el changelog automático de R9.2).
- `npm run verify` = el pipeline de CI completo en local, un comando.

### R6.4 — Scaffolding: el multiplicador real de velocidad ⬤ P0

**Por qué.** Es donde se van tus horas repetidas. Un golden path que hay que seguir a mano se
sigue mal; un golden path generado se sigue siempre. La métrica de las plataformas internas
maduras es "servicio nuevo desplegado en menos de tres minutos" — tu equivalente es "CRUD nuevo
funcionando en menos de cinco".

**Criterio de aceptación**

- `npm run gen:feature <nombre>` genera el slice completo de R1.3: types, schema Zod, service,
  store, orquestador, componente View con los cinco estados, ruta, y tests de esqueleto.
- `npm run gen:page <ruta>` genera una thin page + `+page.server.ts` + entrada de navegación
  - entrada en `AUTH_ROUTE_PERMISSIONS`.
- `npm run gen:component <nombre> --layer base|common|blocks` con la forma canónica de props.
- Implementación: `plop` o un script propio con templates. No sobre-ingenierices — 150 líneas
  de Node bien puestas te devuelven el tiempo en el segundo proyecto.
- Lo generado pasa `lint` + `check` + `test` sin tocar nada.

### R6.5 — Onboarding de proyecto nuevo en un comando ⬤ P1

**Criterio de aceptación**

- `npm run init:project` pregunta nombre, marca, colores base, URL de API, métodos de auth, y deja
  el repo listo: reemplaza nombres y logos, aplica tokens, escribe `.env`, borra el slice de
  ejemplo, resetea el historial de git, actualiza el README.
- El "Customization checklist" del README actual (6 pasos manuales) debe desaparecer: cada paso
  manual es un paso que un día se olvida.
- Comando de verificación post-init que confirma que arranca, compila y pasa tests.

### R6.6 — Configuración del entorno de desarrollo ⬤ P2

**Criterio de aceptación**

- `.vscode/extensions.json` ya existe; añadir `settings.json` con format-on-save y el plugin de
  Svelte, y un `devcontainer.json` si trabajas desde varias máquinas.
- `AGENTS.md` / `CLAUDE.md` mantenidos como contrato con los agentes (ver R10.2).

---

## 7. Despliegue y operación

### R7.1 — Target de despliegue fijo y documentado ⬤ P0

**Por qué.** `adapter-auto` está bien para un demo y mal para un producto: el comportamiento
cambia según dónde se construya, y no puedes probar en local lo que corre en producción.

**Criterio de aceptación**

- Adapter explícito. Recomendado `adapter-node` + Dockerfile multi-stage: corre igual en tu
  máquina, en un VPS, en Cloud Run, en el Kubernetes del cliente. Es la opción que no te ata a
  un proveedor — importante cuando el cliente decide dónde se hospeda.
- Si un proyecto concreto va a Vercel/Cloudflare, se cambia el adapter en ese proyecto y se
  documenta. La base no asume proveedor.
- Health check en `/healthz` (liveness) y `/readyz` (comprueba alcanzabilidad de la API externa).
- Imagen que corre como usuario no-root, con `NODE_ENV=production` y sin devDependencies.

### R7.2 — Entornos y configuración ⬤ P1

**Criterio de aceptación**

- Matriz de entornos definida: local → preview (por PR) → staging → producción.
- Toda la configuración por variables de entorno, validadas al arrancar (R4.2). Cero secretos
  en el repo. `.env.example` completo y verificado por un test.
- Distinción clara y documentada entre `PUBLIC_*` (llega al bundle del cliente — asume que es
  público) y el resto.

### R7.3 — Observabilidad ⬤ P1

**Por qué.** Entregas productos que operan sin ti. Sin telemetría, tu primer aviso de un fallo es
un mensaje del cliente.

**Criterio de aceptación**

- **Errores**: Sentry (o equivalente) cableado en `handleError` server y client, con source maps
  subidos en el build y el `correlationId` de R2.2 adjunto. Filtrado de PII configurado.
- **Logs**: logging estructurado JSON en el servidor (pino), con request id. Nada de `console.error`
  suelto — hoy `hooks.server.ts` tiene dos.
- **Web Vitals**: LCP, INP y CLS reportados desde el cliente. INP es la métrica que importa en
  apps con mucha interacción, y es la que peor se comporta en dashboards pesados. La ruta
  estándar hoy es OpenTelemetry Browser SDK, que además te permite correlacionar el frontend con
  las trazas del backend.
- **Presupuestos de rendimiento** verificados en CI: tamaño del bundle inicial por ruta y
  Lighthouse CI con umbrales. El pipeline falla si una PR engorda el bundle más de X%.
  Sin esto, la degradación es invisible hasta que es grave.

---

## 8. Seguridad de la cadena de suministro

### R8.1 — Endurecer dependencias ⬤ P0

**Por qué.** 2026 ha sido el peor año registrado para npm: axios comprometido en marzo, TanStack
en mayo vía el gusano _Mini Shai-Hulud_, los paquetes de `@redhat-cloud-services` en junio. Ya
no es un riesgo teórico. Tienes ~60 dependencias de desarrollo y entregas código a clientes: eres
un vector de cadena de suministro para ellos.

**Criterio de aceptación**

- `minimumReleaseAge` configurado en el package manager (p. ej. 3–7 días). La inmensa mayoría de
  los paquetes comprometidos se detectan y despublican en las primeras horas; esperar unos días
  antes de instalar una versión nueva neutraliza casi todo el riesgo, a coste cero.
- Scripts de instalación deshabilitados por defecto (`ignore-scripts`), con allowlist explícita
  de los pocos paquetes que los necesitan. El payload de los ataques de 2026 llegó por `postinstall`.
- Lockfile commiteado; instalaciones en CI con `--frozen-lockfile`.
- Dependabot/Renovate agrupando actualizaciones, con auto-merge solo de parches y solo con CI verde.
- `npm audit` / `osv-scanner` bloqueante para severidad alta y crítica.
- Verificación de provenance (npm attestations) donde esté disponible.
- Una nota en el repo justificando cada dependencia no obvia y cada exención — ya lo haces
  (el commit sobre la exención de `air`); conviértelo en práctica escrita.

### R8.2 — Higiene de secretos ⬤ P1

**Criterio de aceptación**

- `gitleaks` en pre-commit y en CI.
- Procedimiento de rotación documentado.
- Ningún secreto en variables `PUBLIC_*` — verificado por un test que inspecciona el bundle.

---

## 9. Reutilización entre proyectos — el requerimiento decisivo

Esta sección importa más que todas las anteriores juntas para tu modelo de negocio. Los otros
requerimientos hacen bueno el proyecto #1. Este hace que el proyecto #7 siga siendo barato.

### El problema

Con "fork del template", cada proyecto entregado es una fotografía congelada. Arreglas un bug de
refresh de token en el proyecto #5 y los proyectos #1–#4 se quedan con el bug. A los dos años
mantienes siete bases de código divergentes que se parecen entre sí lo justo para confundirte.

### R9.1 — Extraer el núcleo estable a paquetes versionados ⬤ P0

**Criterio de aceptación**

- Separación explícita entre:
  - **Núcleo** (estable, compartido, versionado): `lib/core/`, `lib/utils/`, `lib/stores/`,
    `lib/components/{ui,base,common}`, el handler de auth, el modelo de errores, los generadores.
  - **Plantilla** (se copia y diverge por diseño): rutas, config de dominio, features, tokens de marca.
- El núcleo se publica como uno o dos paquetes en un registro privado (GitHub Packages sirve y
  es gratis para repos privados), con SemVer.
- Los proyectos consumen el núcleo como dependencia: un `pnpm update` propaga un arreglo de
  seguridad a todos los productos entregados.
- La plantilla se consume con `degit` o `create-<tu-marca>-app`.
- Regla práctica: **algo entra al núcleo cuando lo has necesitado igual en tres proyectos.**
  Antes de eso, se copia. Abstraer en el proyecto #1 produce abstracciones equivocadas.

**Alternativa si no quieres publicar paquetes todavía:** monorepo con pnpm workspaces
(`packages/core` + `apps/*`) — ya tienes `pnpm-workspace.yaml`, así que estás a medio camino.
Funciona bien mientras los proyectos vivan en el mismo repo; deja de funcionar en cuanto entregues
el código a un cliente. Los paquetes versionados son la respuesta duradera.

### R9.2 — Versionado y changelog del núcleo ⬤ P1

**Criterio de aceptación**

- Changesets o semantic-release, con changelog generado desde los conventional commits de R6.3.
- Publicación automatizada desde CI, nunca desde una máquina local.
- Guía de migración escrita para cada versión mayor. Sin esto, tus proyectos antiguos nunca
  actualizan y vuelves al punto de partida.

### R9.3 — El template debe ser instalable y probado como tal ⬤ P1

**Criterio de aceptación**

- Un job de CI que, semanalmente, crea un proyecto desde cero con el template, corre `init`,
  `build` y los E2E. Si el camino de creación se rompe, te enteras esa semana y no el día que
  arranca un cliente.

---

## 10. Documentación y trabajo con agentes de IA

### R10.1 — Documentación que se mantiene sola o no se mantiene ⬤ P1

**Criterio de aceptación**

- `README.md`: qué es, cómo arrancar, cómo desplegar. Nada más.
- `architecture.md`: la arquitectura real (R1.1), con snippets verificados en CI.
- `docs/adr/`: un ADR corto por cada decisión estructural (una página: contexto, decisión,
  consecuencias). Las decisiones de las secciones 0, 1.4, 7.1 y 9.1 son los primeros ADRs.
  El valor no es el documento — es que dentro de un año recuerdes _por qué_, y que un cliente
  al que le pasas el código lo entienda sin ti.
- `docs/recipes/`: cómo añadir un feature, cómo añadir un rol, cómo cambiar de marca, cómo
  añadir un idioma. Cada receta corresponde a un generador de R6.4 y termina siendo su documentación.

### R10.2 — Optimizar la base para desarrollo asistido por IA ⬤ P1

**Por qué.** Trabajas con agentes. La calidad de lo que producen es función directa de la calidad
de las convenciones escritas y de las verificaciones automáticas. Una base con reglas de capa en
ESLint, generadores y tests es una base donde un agente no puede desviarse mucho — y donde puedes
aceptar su output sin revisarlo línea por línea.

**Criterio de aceptación**

- `AGENTS.md` contiene: las reglas de capa, la política de data fetching (R1.4), la convención de
  estado (R3.1), las convenciones de naming, y un enlace al slice de referencia como ejemplo
  canónico a imitar.
- `AGENTS.md` incluye el comando de verificación (`npm run verify`) con la instrucción de correrlo
  antes de dar por terminada cualquier tarea.
- Los generadores están documentados ahí: un agente debe usar `gen:feature` en vez de escribir un
  slice a mano.
- `CLAUDE.md` actual (que solo describe el MCP de Svelte) se consolida con `AGENTS.md`; hoy están
  desincronizados y ninguno describe la arquitectura.

---

## 11. Módulos opcionales

No van en la base por defecto. Van documentados como extensiones con receta de instalación, para
que el día que un proyecto los pida no partas de cero.

| Módulo                   | Cuándo                       | Nota                                                                                                                                                                                                                                                         |
| ------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| i18n                     | Cliente con más de un idioma | Paraglide (compile-time, tree-shakeable, integración oficial con SvelteKit). Decide **ahora** si las claves se extraen desde el día uno aunque solo haya un idioma — retrofitear i18n es caro.                                                               |
| Persistencia propia 🅱️   | El producto no tiene backend | Drizzle + Postgres en `lib/server/db`. Trae consigo migraciones, seeds y tests de integración.                                                                                                                                                               |
| Billing                  | SaaS con suscripción         | Stripe checkout + webhooks. Los webhooks necesitan idempotencia y verificación de firma.                                                                                                                                                                     |
| Uploads                  | Archivos de usuario          | S3 compatible con URLs prefirmadas. No proxies archivos por el servidor de la app.                                                                                                                                                                           |
| Realtime                 | Colaboración, notificaciones | SSE primero; WebSockets solo si SSE no alcanza.                                                                                                                                                                                                              |
| Trabajos en background   | Emails, reportes, exports    | Fuera del proceso de SvelteKit.                                                                                                                                                                                                                              |
| Tablas de datos          | Dashboards                   | `@tanstack/table-core` ya está instalado; falta el componente `DataTable` con paginación, orden, filtros y selección, cableado a `PaginationStore` y `FilterStore`. **Este debería subir a P1** — es el componente que reimplementas en todos los proyectos. |
| Exportación              | CSV/Excel/PDF                | Petición recurrente en producto interno de empresa.                                                                                                                                                                                                          |
| Feature flags en runtime | Rollouts progresivos         | Hoy `FEATURE_FLAGS` es estático en build. Suficiente por ahora.                                                                                                                                                                                              |

---

## 12. Roadmap sugerido

Ordenado por retorno sobre esfuerzo, no por sección.

### Fase 1 — Fundamentos (1–2 semanas). Sin esto, lo demás se construye sobre arena.

1. R1.1 Reescribir `architecture.md` para que refleje el código real
2. R6.1 Un solo package manager + versión de Node fijada
3. R6.2 CI bloqueante
4. R7.1 Adapter fijo + Dockerfile + healthchecks
5. R8.1 Endurecer la cadena de suministro (`minimumReleaseAge`, `ignore-scripts`, audit en CI)
6. R4.2 Validación de env con Zod + cabeceras de seguridad

### Fase 2 — El multiplicador (2–3 semanas). Aquí es donde ganas velocidad de verdad.

7. R2.1 Tipos generados desde OpenAPI
8. R1.3 Slice de referencia (`users`) completo y con tests
9. R6.4 Generadores (`gen:feature`, `gen:page`, `gen:component`)
10. R1.2 Reglas de capa en ESLint
11. R5.1 E2E de los flujos críticos + umbrales de cobertura en el núcleo
12. DataTable (de la sección 11, promovido)

### Fase 3 — Producción (1–2 semanas)

13. R7.3 Observabilidad (Sentry + logs estructurados + Web Vitals + presupuestos)
14. R2.2 Modelo de errores cerrado con correlation id
15. R4.1 / R4.3 Autorización deny-by-default + flujo de refresh de token
16. R5.3 Accesibilidad automatizada
17. R3.2 Design tokens y theming

### Fase 4 — Escala (continuo)

18. R9.1 Extraer el núcleo a paquetes versionados
19. R6.5 `init:project` en un comando
20. R9.2 / R9.3 Versionado, changelog y test del template
21. R10.1 / R10.2 ADRs, recetas y `AGENTS.md` consolidado

---

## 13. Métricas de éxito

Si la plataforma funciona, estos números se mueven. Si no se mueven, estás haciendo arquitectura
para tu propio disfrute y no para tu negocio. Mídelos en el primer proyecto y compáralos en el tercero.

| Métrica                                                              | Objetivo         |
| -------------------------------------------------------------------- | ---------------- |
| Time to first deploy (repo vacío → staging con auth funcionando)     | < 1 hora         |
| Time to first feature (CRUD nuevo completo, con tests)               | < 1 día          |
| Tiempo de CI (push → verde)                                          | < 5 minutos      |
| Dev server frío                                                      | < 3 segundos     |
| Propagar un arreglo de seguridad a todos los proyectos entregados    | < 1 día          |
| Bugs de producción atribuibles a la base (no al dominio del cliente) | tendencia a cero |
| Proporción de código de un proyecto que es específico del cliente    | > 70%            |
| Sesiones con agentes de IA que pasan `verify` al primer intento      | > 80%            |

---

## 14. Anti-objetivos

Tan importantes como los requerimientos. Sin esta lista, esto se convierte en un proyecto
personal infinito que nunca factura.

- **No construyas un framework.** Construye una base con opiniones. En el momento en que escribes
  abstracciones para casos que no has tenido todavía, empiezas a mantener código que no usas.
- **No abstraigas antes de la tercera repetición.** Copiar es más barato que la abstracción
  equivocada.
- **No soportes ambos modelos (BFF y full-stack) como ciudadanos de primera.** Uno por defecto,
  el otro documentado como extensión.
- **No metas Storybook, monorepo, micro-frontends ni Turborepo** hasta que un dolor concreto y
  medido lo justifique.
- **No busques 100% de cobertura.** Cubre el núcleo y los flujos críticos; el resto es lastre.
- **No mantengas documentación que el CI no verifique.** Se desincroniza, y una doc desincronizada
  es peor que ninguna — sobre todo cuando la consumen agentes.
- **No pospongas la sección 9.** Es la única que resuelve el problema que tendrás dentro de un año,
  y la única que no se puede retrofitear barato.

---

## Fuentes

- [Remote functions — SvelteKit Docs](https://svelte.dev/docs/kit/remote-functions)
- [SvelteKit Remote Functions in 2026: query, form, command, prerender](https://blog.imseankim.com/sveltekit-remote-functions-query-form-command-prerender-guide-2026/)
- [Svelte Best Practices in 2026: Scaling with Runes, Snippets, and Pure Reactivity](https://onehorizon.ai/blog/svelte-best-practices-in-2026-scaling-with-runes-snippets-and-pure-reactivity)
- [SvelteKit 2 Complete Guide: From Zero to Production (2026)](https://dev.to/stacknotice/sveltekit-2-complete-guide-from-zero-to-production-2026-b99)
- [How to Build Golden Paths Your Developers Will Actually Use](https://jellyfish.co/library/platform-engineering/golden-paths/)
- [Platform Engineering in 2026: Internal Developer Platforms Take Center Stage](https://www.devx.com/uncategorized/platform-engineering-internal-developer-platforms-2026/)
- [The npm Threat Landscape: Attack Surface and Mitigations — Unit 42](https://unit42.paloaltonetworks.com/monitoring-npm-supply-chain-attacks/)
- [Our response to the TanStack npm supply chain attack — OpenAI](https://openai.com/index/our-response-to-the-tanstack-npm-supply-chain-attack/)
- [Supply Chain Compromise Impacts Axios Node Package Manager — CISA](https://www.cisa.gov/news-events/alerts/2026/04/20/supply-chain-compromise-impacts-axios-node-package-manager)
- [Understanding the European Accessibility Act and WCAG 2.2 — OneTrust](https://www.onetrust.com/blog/understanding-the-european-accessibility-act-and-wcag-22/)
- [European Accessibility Act 2026: EAA Compliance Guide — Level Access](https://www.levelaccess.com/compliance-overview/european-accessibility-act-eaa/)
- [A User-Focused Approach To Core Web Vitals via OpenTelemetry — The New Stack](https://thenewstack.io/a-user-focused-approach-to-core-web-vitals-via-opentelemetry/)
- [How to Use OpenTelemetry Browser Instrumentation for Frontend Observability](https://oneuptime.com/blog/post/2026-01-07-opentelemetry-browser-frontend/view)
- [Design Tokens That Scale in 2026 (Tailwind v4 + CSS Variables) — Mavik Labs](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026/)
- [Tailwind Design Tokens 2026: CSS Variables, Figma Sync](https://nicolalazzari.ai/articles/integrating-design-tokens-with-tailwind-css)
