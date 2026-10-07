# Svelte Template

Template de SvelteKit 3 + Svelte 5 para arrancar proyectos de cliente que consumen un API
externo. Trae resuelto lo que se repite en cada proyecto: autenticación con cookies, permisos por
rol, layout con sidebar, formularios validados con zod, errores con mensaje siempre mostrable,
carga de datos con streaming, componentes de shadcn y un kit vendorizado encima. No tiene base de
datos y no es un framework: se clona, se cambia lo que haga falta y se construye encima.

- **Reglas de trabajo:** [`AGENTS.md`](./AGENTS.md). Obligatorias para humanos y agentes.
- **Cómo está armado:** [`docs/architecture.md`](./docs/architecture.md). Léelo antes de tocar
  auth, permisos o la capa de servicios.

## Stack

SvelteKit 3, Svelte 5 (runes), TypeScript estricto, Tailwind 4, shadcn-svelte, zod 4,
[`@imlargo/air`](https://github.com/imlargo/air) como cliente HTTP, Vitest (servidor en Node,
componentes en Chromium), Playwright, y despliegue en Cloudflare Workers con `wrangler`.

## Primer arranque

Requiere Node 22 y pnpm.

```sh
pnpm install
cp .env.example .env
```

El template no trae backend. Hay dos caminos:

**1. Ver el demo sin backend.** En `.env`, pon `PUBLIC_AUTH_ENABLED=false`. Con auth apagada el
hook deja pasar todo, la sidebar muestra todo, y el CRUD de usuarios de `/admin` funciona contra
un store en memoria que vive en la propia app. Es la forma más rápida de ver todas las piezas
(streaming, `Query` + `AsyncView`, dialogs, toasts, estados vacíos y de error).

```sh
pnpm run dev
```

**2. Conectar un backend real.** Deja `PUBLIC_AUTH_ENABLED=true`, apunta `PUBLIC_API_URL` al API y
revisa `src/lib/features/auth/contract.ts`: ahí están los endpoints de auth que el template espera
y los mappers de respuesta. Si tu backend habla distinto, ese es el único archivo de auth que
cambia. Lo mismo para la forma de los errores: `src/lib/config/errors.ts`.

Con auth encendida y sin backend alcanzable, la app muestra el login y no pasa de ahí: el hook
pregunta al backend quién es el usuario en cada request.

## Scripts

| Script               | Qué hace                                                           |
| -------------------- | ------------------------------------------------------------------ |
| `pnpm run dev`       | Servidor de desarrollo                                             |
| `pnpm run build`     | Verifica los tipos de `wrangler` y construye el worker             |
| `pnpm run preview`   | Sirve el worker construido con `wrangler dev`                      |
| `pnpm run check`     | `svelte-check` sobre `.ts` y `.svelte`                             |
| `pnpm run lint`      | `prettier --check` + `eslint`                                      |
| `pnpm run format`    | `prettier --write`                                                 |
| `pnpm run test`      | Unit (servidor + componentes) y e2e                                |
| `pnpm run test:unit` | Solo Vitest; `--project server` o `--project client` para uno solo |
| `pnpm run gen`       | Regenera `worker-configuration.d.ts` tras tocar `wrangler.jsonc`   |

Antes de dar algo por terminado: `lint`, `check` y `test` en verde. Hay un pre-commit con
`lint-staged`.

## Estructura

```
src/
  env.ts                 Variables de entorno declaradas con schema (zod)
  hooks.server.ts        Auth hook + handleError
  hooks.client.ts        handleError del cliente
  lib/
    config/              Lo que cambia por proyecto: app, rutas, navegación, permisos, errores
    core/                Lo que no: cliente API, BaseService, AppError, logger, Query, permisos
    features/<slice>/    auth, users… cada uno con services/, components/, schemas, types
    components/
      ui/                shadcn — no se edita
      coral/             Kit vendorizado sobre shadcn — no se edita
      blocks/            Piezas propias: AsyncView, Boundary, EmptyState, ErrorState, PageHeader…
      layout/            Sidebar y header
    hooks/               Estado reutilizable con runes (Disclosure, Filters, Pagination…)
    utils/               Funciones puras (forms, date, paths, string, env, object)
    types/               Tipos compartidos entre slices
    server/              Solo demo: store en memoria para /api/users
  routes/
    (app)/               Páginas con sidebar, protegidas
    (auth)/              login, logout, authorize (Google), refresh
    api/                 Endpoints demo del CRUD de usuarios
```

## Scaffolding de demo

Marcado con `DEMO SCAFFOLDING` en los archivos. Al conectar un backend real, borra o reemplaza:

- `src/lib/server/users-store.ts` y `src/routes/api/users/**` — el CRUD en memoria.
- `src/lib/features/users/services/users.ts` — quita el `''` del constructor para que apunte a
  `PUBLIC_API_URL`, o déjalo si tu proyecto es fullstack (ver `docs/architecture.md`).
- `src/routes/(app)/+page.server.ts` — las stats falsas del dashboard.
- Las entradas de `/api/users` en `ENDPOINT_ACCESS` (`src/lib/config/permissions.ts`), si borras
  los endpoints.

## Despliegue

El adapter es `@sveltejs/adapter-cloudflare` con target Workers. `pnpm run build` genera el worker
en `.svelte-kit/cloudflare/`; `pnpm exec wrangler deploy` lo publica con la configuración de
`wrangler.jsonc`. Las variables de `src/env.ts` se definen en el worker, no en la máquina de
build: el build usa un placeholder y la app en ejecución es la que las valida.
