# svelte-template

> A SvelteKit 2 + Svelte 5 starter for client projects that consume an external API. Auth,
> permissions and the service layer are solved once, so a new engagement starts on day one instead
> of week two.

[![Svelte](https://img.shields.io/badge/svelte-5-FF3E00)](https://svelte.dev)
[![SvelteKit](https://img.shields.io/badge/sveltekit-2-FF3E00)](https://svelte.dev/docs/kit)
[![TypeScript](https://img.shields.io/badge/typescript-strict-3178C6)](https://www.typescriptlang.org)
[![Cloudflare Workers](https://img.shields.io/badge/deploy-cloudflare%20workers-F38020)](https://workers.cloudflare.com)

- **No database.** This template talks to an external API through a typed service layer
  ([`@imlargo/air`](https://github.com/imlargo/air)) - it has nothing of its own to migrate or seed.
- **Auth with cookies, both password and Google OAuth**, feature-flagged independently by
  environment variable - ship one, the other, or both without touching code.
- **Deny-by-default permissions.** An undeclared route or an unknown role grants nothing; a
  forgotten permission fails loudly as a 403, not silently as an open page.
- **A layered `src/lib`** - `core` (infrastructure), `features` (vertical slices), `components`
  (`ui`/`kit`/`blocks`/`layout`) - so a new feature has one obvious place to live.
- **shadcn-svelte**, used as intended: the primitives in `components/ui/` stay untouched; every
  composition sits beside them, never inside them.

## What's already solved

| Concern          | Building it yourself                                    | This template                                                          |
| ---------------- | ------------------------------------------------------- | ---------------------------------------------------------------------- |
| Auth transport   | wire cookies, refresh, redirects by hand                | cookie-based session, handled in `hooks.server.ts`                     |
| Login methods    | one code path per provider, hard to toggle              | password and Google, each an env flag - [Auth methods](#auth-methods)  |
| Route protection | a check you remember to add per page                    | declared once per page in a table; a missing entry is denied           |
| API access       | `fetch` calls scattered across components               | one `BaseService` per feature, API access nowhere else                 |
| Permission model | ad-hoc role checks, duplicated between UI and endpoints | one `Permission` union, one grant list, read by both                   |
| Sidebar + nav    | a layout built per project                              | driven by `$lib/config/navigation.ts`, filtered by permission          |
| Session expiry   | a 401 surfaces as a toast, or as a JSON parse error     | renewed with the refresh token if the backend supports it, else login  |
| Slow data        | the navigation freezes until the slowest `load` returns | streamed from `load` behind a skeleton - [Data loading](#data-loading) |
| Errors           | raw exception messages on screen                        | a safe message and an id that matches the log - [Errors](#errors)      |
| Deploy target    | adapter and worker config assembled by hand             | `adapter-cloudflare` + `wrangler.jsonc`, ready to `wrangler deploy`    |

## Getting started

```sh
cp .env.example .env
pnpm install
pnpm run dev
```

The dev server starts on <http://localhost:5173>. Without a real backend, turn auth off
(`PUBLIC_AUTH_ENABLED=false`) to browse the app shell without a session. `PUBLIC_API_URL` must
still be a URL: the environment is validated when the app starts, and a missing or malformed
variable fails there, by name, instead of surfacing later as requests to a relative path.

## Environment variables

| Variable                       | Description                                   | Default                          |
| ------------------------------ | --------------------------------------------- | -------------------------------- |
| `PUBLIC_API_URL`               | Backend API base URL                          | - (required)                     |
| `PUBLIC_AUTH_BASE_URL`         | Auth service base URL, if separate            | falls back to `PUBLIC_API_URL`   |
| `PUBLIC_AUTH_ENABLED`          | Enable the auth hook                          | `true`                           |
| `PUBLIC_AUTH_PASSWORD_ENABLED` | Show the password login form                  | `true`                           |
| `PUBLIC_AUTH_GOOGLE_ENABLED`   | Show the Google OAuth button                  | `false`                          |
| `PUBLIC_GOOGLE_CLIENT_ID`      | Google OAuth client ID                        | - (required with Google on)      |
| `PUBLIC_AUTH_REFRESH_ENABLED`  | Renew expired sessions with the refresh token | `false`                          |
| `AUTH_COOKIE_DOMAIN`           | Cookie domain                                 | -                                |
| `AUTH_COOKIE_SECURE`           | Secure cookie flag                            | `true` (`.env.example`: `false`) |
| `AUTH_COOKIE_MAX_AGE`          | Cookie lifetime, in seconds                   | `604800` (7 days)                |
| `AUTH_COOKIE_SAMESITE`         | `SameSite` policy                             | `lax`                            |

The `PUBLIC_*` variables are checked against a schema in `$lib/config/app.ts`: flags accept
`true`/`false` (a typo is an error, not a silent `true`), and an empty value means "use the
default". `AUTH_COOKIE_SECURE` is on unless set to exactly `false`, which only a local `.env`
should do.

## Architecture

```
src/
├── hooks.server.ts    # Picks the auth handle (or a no-op) from config.auth.enabled
├── error.html         # Fallback page for errors thrown before any page renders
├── lib/
│   ├── core/          # api, service, errors, logger, permissions, query - infrastructure only
│   ├── config/        # app.ts (branding/env), navigation.ts, permissions.ts
│   ├── types/         # Types shared by more than one feature
│   ├── utils/         # Pure functions - date, string
│   ├── hooks/         # Stateful runes classes: Disclosure, Filters, Pagination, IsMobile
│   ├── features/      # Vertical slices (auth, users, ...) - components, services, types together
│   ├── server/         # Server-only code, never imported from a `.svelte` file
│   └── components/    # ui/ (shadcn, untouched), coral/ (vendored kit), blocks/, layout/
└── routes/
    ├── (auth)/        # Unauthenticated: login, logout, authorize (OAuth callback), refresh
    ├── (app)/         # Protected pages, rendered inside the sidebar layout
    └── api/           # Server endpoints - each enforces its own permission (see Permissions)
```

`$components`, `$ui`, `$core`, `$hooks`, `$types` and `$utils` are real aliases (declared in
`vite.config.ts`, no separate `svelte.config.js`), not barrels - each resolves straight to a file.

See [`AGENTS.md`](./AGENTS.md) for the conventions this structure depends on: where a type belongs,
when a hook earns its own file, and the rules around `$state` at module scope on the server.

## Auth methods

Both login strategies are feature-flagged independently. Set one or both:

```sh
# Password-only
PUBLIC_AUTH_PASSWORD_ENABLED=true
PUBLIC_AUTH_GOOGLE_ENABLED=false

# Google-only
PUBLIC_AUTH_PASSWORD_ENABLED=false
PUBLIC_AUTH_GOOGLE_ENABLED=true
PUBLIC_GOOGLE_CLIENT_ID=your-client-id

# Both
PUBLIC_AUTH_PASSWORD_ENABLED=true
PUBLIC_AUTH_GOOGLE_ENABLED=true
PUBLIC_GOOGLE_CLIENT_ID=your-client-id
```

The session itself is a cookie, issued in `src/lib/features/auth/session.server.ts` and read on
every request by `hooks.server.ts`. Signing in is a form action on `/login`: the browser posts to
this app, and only the server talks to the backend's auth endpoints. Turning `PUBLIC_AUTH_ENABLED` off swaps in a no-op handle
instead of skipping the check inline, so `locals.requirePermission` is always defined - a route
guard is never the thing that crashes because auth happened to be off on this machine.

### Session refresh

Off by default, because it needs the backend to support it. With
`PUBLIC_AUTH_REFRESH_ENABLED=true`, the backend must implement:

```
POST /auth/refresh   { "refresh_token": "..." }
→ 200 { "access_token": "...", "refresh_token": "...", "expires_at": 0 }
→ 401 when the refresh token is no longer valid
```

An expired access token is then renewed instead of ending the session, in two places:

- **Before a page loads**: when `/auth/me` answers 401, the hook spends the refresh token, rotates
  both cookies and asks again (`features/auth/renew.server.ts`).
- **Between navigations**: a client-side API call that answers 401 goes through air's `refresh`
  wrapper, which calls this app's `POST /refresh` (the refresh token is httpOnly, so only the
  server can spend it) and re-sends the request with the new token. Concurrent 401s share one
  renewal.

Only a rejected refresh token ends the session. A backend that is down answers 503 and keeps it,
the same rule the hook already applied to `/auth/me`.

With refresh off, or when the renewal fails, a client-side 401 re-runs the page's loads
(`invalidateAll`). The request goes back through the hook, which is the one that decides: if the
session really is gone, it redirects to `/login?redirect=` the current page. No component handles
401s; services built from `getAuth().api` get all of this for free.

## Permissions

One `Permission` union (`$lib/config/permissions.ts`), written as `resource:action` -
`users:delete`, not "the delete button on the users page" - so it means the same thing to a page
guard and to the endpoint behind it:

```ts
export type Permission = 'dashboard:read' | 'users:read' | 'users:write' | 'users:delete';

export const ROLE_PERMISSIONS = {
	[UserRole.ADMIN]: ['dashboard:read', 'users:read', 'users:write', 'users:delete'],
	[UserRole.MEMBER]: ['dashboard:read']
} as const satisfies Record<UserRole, readonly Permission[]>;
```

Pages are declared as a tree and enforced once, in `hooks.server.ts`, before any `load` runs - a
new page with no entry is denied, not open by omission. Endpoints under `src/routes/api/` declare
their own permission per handler instead, because a `GET` and a `DELETE` on the same path are not
the same grant, and a path-keyed table can't say so. The check itself
(`createPermissionGuard`, `$lib/features/auth/guard.server.ts`) throws rather than returning a
boolean - a 401 without a session, a 403 with one that lacks the permission - so there's nothing
to forget to act on.

Add a role tomorrow and it can do nothing until `ROLE_PERMISSIONS` says otherwise. That's the
whole authorization model; there is no second place it could quietly disagree with itself.

## API layer

`src/lib/core/api.ts` builds an [air](https://github.com/imlargo/air) client from `config.api.baseUrl`
and a token getter. Every feature's data access goes through a service that extends `BaseService`
(`$lib/core/service.ts`) - nothing calls `fetch` directly from a component or a hook:

```ts
// src/lib/features/users/services/users.ts
export class UserService extends BaseService {
	getAll() {
		return this.expectBody(this.api.get<User[]>('/users'));
	}
}

// Server: the token from locals, and the per-request fetch
const service = new UserService({ token: locals.accessToken, fetch });

// Client: the session's credentials - a renewed token is picked up, and a 401 is handled
const service = new UserService(getAuth().api);
```

`expectBody` narrows air's `T | null` for an endpoint that must answer with a body - a `204` there
is a broken response, not data, so it fails at the service boundary instead of leaking `null` into
every consumer that forgot to check.

## Data loading

A slow API call must never freeze a navigation. Two patterns, both rendered with `AsyncView`
(`$lib/components/blocks/AsyncView.svelte`) and a skeleton for the pending state:

| Pattern                  | When                                                | Reference                         |
| ------------------------ | --------------------------------------------------- | --------------------------------- |
| **Streamed from `load`** | Data the page shows on arrival: dashboards, details | `routes/(app)/+page.server.ts`    |
| **Run by the page**      | Data the user searches, filters or edits in place   | `routes/(app)/admin/+page.svelte` |

```ts
// +page.server.ts - not awaited: the page renders now and the promise streams in
export const load = ({ locals, fetch }) => ({
	stats: new StatsService({ token: locals.accessToken, fetch }).get()
});
```

```svelte
<!-- +page.svelte -->
<AsyncView source={data.stats}>
	{#snippet loading()}<StatsSkeleton />{/snippet}
	{#snippet children(stats)}<StatsCards {stats} />{/snippet}
</AsyncView>
```

`await` in `load` only what the page cannot render without; everything else goes out as a promise.
For the second pattern, pass a `Query` instead: a refetch keeps the current data on screen until
the new result lands, so searching or saving updates the list instead of blanking it. Remote
functions are deliberately not used.

## Errors

Every error becomes an `AppError` (`$lib/core/errors.ts`) whose `message` is always safe to
render: the backend's own message, or the default for its code - never the text of an exception.
Unexpected errors also get an `errorId` in `handleError` (server and client), logged next to the
full error and shown on the error page, so a screenshot from a user leads to the log line.

Errors are rendered at three levels:

- `routes/(app)/+error.svelte` - inside the app shell, so a failing page keeps the sidebar.
- `routes/+error.svelte` - everything outside it.
- `src/error.html` - errors thrown in `handle`, before any page can render (the hook's 403 for a
  page the role cannot open, its 503 when the backend is down). SvelteKit serves this file as-is,
  so it carries its own inline styles, mirroring the theme tokens.

## Testing

```sh
pnpm run test        # vitest, run once - component tests (Chromium) and server tests both
pnpm run test:unit   # vitest, watch mode
pnpm run test:e2e    # Playwright, against the built worker
```

Three layers:

- **Server tests** (`*.test.ts`, Node): services, the auth hook, the permission matrix, endpoints.
- **Component tests** (`*.svelte.test.ts`, a real Chromium tab via `@vitest/browser-playwright`):
  `features/auth/components/LoginForm.svelte.test.ts` is the reference. `test/setup-browser.ts`
  gives components the `.env.test` values through `$env/dynamic/public`, as a real page would.
  `src/lib/server/**` is excluded from this project on purpose.
- **E2E smoke** (`e2e/*.e2e.ts`): builds the worker and runs it under `wrangler dev` with auth off,
  so it needs no backend. It covers booting, navigation, streaming, a create flow and the 404 page.

`.env.test` pins the variables the suite depends on, so a developer's `.env` cannot change what
the tests prove. CI (`.github/workflows/ci.yml`) runs lint, check, test and test:e2e on every pull
request, with no secrets.

## Deploying

Built for Cloudflare Workers via `@sveltejs/adapter-cloudflare`:

```sh
pnpm run build     # vite build
wrangler deploy
```

`wrangler.jsonc`'s `name` is still the placeholder `"app"` - rename it, and `name` in
`package.json`, before the first deploy. Workers Logs (`observability`) is on, so the `logger`'s
output is searchable in the Cloudflare dashboard.

Bindings are typed the way the
[adapter docs](https://svelte.dev/docs/kit/adapter-cloudflare#Runtime-APIs) describe: declare each
one in `wrangler.jsonc`, then add it to `App.Platform['env']` in `src/app.d.ts` with its type from
`@cloudflare/workers-types` (`KVNamespace`, `R2Bucket`, ...). `ctx`, `caches` and `cf` are typed by
the adapter. `wrangler types` is not used: its output changes depending on whether a build exists
([sveltejs/cli#1096](https://github.com/sveltejs/cli/issues/1096)), which breaks `check` on a
fresh clone.

## Customization checklist

- [ ] Set `branding` in `$lib/config/app.ts` - name, logo, favicon and SEO all come from this one
      object, not from the pages that display them
- [ ] Rename `"app"` to the project's real name in `package.json` and `wrangler.jsonc`
- [ ] Add nav items in `$lib/config/navigation.ts`
- [ ] Add permission keys, roles and the page-permission table in `$lib/config/permissions.ts`
- [ ] Set `PUBLIC_API_URL` (and `PUBLIC_AUTH_BASE_URL`, if auth lives elsewhere) in `.env`
- [ ] Add feature slices under `src/lib/features/`, following `features/users/` as the reference
      shape - `services/`, `schemas.ts`, `types.ts`, `components/`

## Coral

`src/lib/components/coral/` is a vendored component kit - comboboxes, a data table, a date picker,
a command palette, file input and more - built on top of the shadcn primitives. Treat it like
`ui/`: each file carries the version it was copied at, and it is updated by copying a newer
version in, not by editing it here. Compose around it the same way. Most of it is unused by the
demo pages on purpose: it is there so a project does not start by building a combobox.

## Scripts

```sh
pnpm run dev          # Dev server, http://localhost:5173
pnpm run build        # Production build
pnpm run preview      # Serve the built worker locally, port 4173
pnpm run check        # svelte-kit sync, svelte-check
pnpm run lint         # Prettier + ESLint
pnpm run format       # Prettier --write
pnpm run test         # Vitest (browser + server projects), once
pnpm run test:e2e     # Playwright smoke suite against the built worker
```
