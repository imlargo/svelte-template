# Svelte Template

A SvelteKit 3 + Svelte 5 template for client projects that consume an external API. It solves what
repeats in every project: cookie-based authentication, role permissions, a sidebar layout, forms
validated with zod, errors whose message is always safe to show, streamed data loading, shadcn
components and a vendored kit on top of them. It has no database and it is not a framework: clone
it, change what you need, and build on it.

- **Working rules:** [`AGENTS.md`](./AGENTS.md). Mandatory for humans and agents.
- **How it is built:** [`docs/architecture.md`](./docs/architecture.md). Read it before touching
  auth, permissions or the service layer.

## Stack

SvelteKit 3, Svelte 5 (runes), strict TypeScript, Tailwind 4, shadcn-svelte, zod 4,
[`@imlargo/air`](https://github.com/imlargo/air) as the HTTP client, Vitest (server tests in Node,
component tests in Chromium), Playwright, and deployment to Cloudflare Workers with `wrangler`.

## First run

Requires Node 22 and pnpm.

```sh
pnpm install
cp .env.example .env
```

The template ships no backend. There are two paths:

**1. See the demo without a backend.** In `.env`, set `PUBLIC_AUTH_ENABLED=false`. With auth off
the hook lets everything through, the sidebar shows every entry, and the users CRUD under `/admin`
works against an in-memory store that lives in the app itself. It is the fastest way to see every
piece (streaming, `Query` + `AsyncView`, dialogs, toasts, empty and error states).

```sh
pnpm run dev
```

**2. Connect a real backend.** Keep `PUBLIC_AUTH_ENABLED=true`, point `PUBLIC_API_URL` at the API
and review `src/lib/features/auth/contract.ts`: that is where the auth endpoints the template
expects and the response mappers live. If your backend speaks differently, that is the only auth
file that changes. Same for the shape of errors: `src/lib/config/errors.ts`.

With auth on and no reachable backend, the app shows the login page and goes no further: the hook
asks the backend who the user is on every request.

## Scripts

| Script               | What it does                                                           |
| -------------------- | ---------------------------------------------------------------------- |
| `pnpm run dev`       | Development server                                                     |
| `pnpm run build`     | Checks the `wrangler` types and builds the worker                      |
| `pnpm run preview`   | Serves the built worker with `wrangler dev`                            |
| `pnpm run check`     | `svelte-check` over `.ts` and `.svelte` files                          |
| `pnpm run lint`      | `prettier --check` + `eslint`                                          |
| `pnpm run format`    | `prettier --write`                                                     |
| `pnpm run test`      | Unit (server + components) and e2e                                     |
| `pnpm run test:unit` | Vitest only; `--project server` or `--project client` for one          |
| `pnpm run gen`       | Regenerates `worker-configuration.d.ts` after editing `wrangler.jsonc` |

Before calling anything done: `lint`, `check` and `test` green. There is a pre-commit hook with
`lint-staged`.

## Structure

```
src/
  env.ts                 Environment variables declared with a schema (zod)
  hooks.server.ts        Auth hook + handleError
  hooks.client.ts        Client-side handleError
  lib/
    config/              What changes per project: app, routes, navigation, permissions, errors
    core/                What does not: API client, BaseService, AppError, logger, Query, permissions
    features/<slice>/    auth, users… each with services/, components/, schemas, types
    components/
      ui/                shadcn — do not edit
      coral/             Vendored kit on top of shadcn — do not edit
      blocks/            Our own pieces: AsyncView, Boundary, EmptyState, ErrorState, PageHeader…
      layout/            Sidebar and header
    hooks/               Reusable state with runes (Disclosure, Filters, Pagination…)
    utils/               Pure functions (forms, date, paths, string, env, object)
    types/               Types shared across slices
    server/              Demo only: in-memory store for /api/users
  routes/
    (app)/               Pages with the sidebar, protected
    (auth)/              login, logout, authorize (Google), refresh
    api/                 Demo endpoints for the users CRUD
```

## Demo scaffolding

Marked with `DEMO SCAFFOLDING` in the files. When you connect a real backend, delete or replace:

- `src/lib/server/users-store.ts` and `src/routes/api/users/**` — the in-memory CRUD.
- `src/lib/features/users/services/users.ts` — drop the `''` in the constructor so it targets
  `PUBLIC_API_URL`, or keep it if your project is fullstack (see `docs/architecture.md`).
- `src/routes/(app)/+page.server.ts` — the dashboard's fake stats.
- The `/api/users` entries in `ENDPOINT_ACCESS` (`src/lib/config/permissions.ts`), if you delete
  the endpoints.

## Deployment

The adapter is `@sveltejs/adapter-cloudflare` targeting Workers. `pnpm run build` produces the
worker in `.svelte-kit/cloudflare/`; `pnpm exec wrangler deploy` publishes it with the
configuration in `wrangler.jsonc`. The variables from `src/env.ts` are set on the worker, not on
the build machine: the build uses a placeholder and the running app is the one that validates
them.
