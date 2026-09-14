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

| Concern          | Building it yourself                                    | This template                                                         |
| ---------------- | ------------------------------------------------------- | --------------------------------------------------------------------- |
| Auth transport   | wire cookies, refresh, redirects by hand                | cookie-based session, handled in `hooks.server.ts`                    |
| Login methods    | one code path per provider, hard to toggle              | password and Google, each an env flag - [Auth methods](#auth-methods) |
| Route protection | a check you remember to add per page                    | declared once per page in a table; a missing entry is denied          |
| API access       | `fetch` calls scattered across components               | one `BaseService` per feature, API access nowhere else                |
| Permission model | ad-hoc role checks, duplicated between UI and endpoints | one `Permission` union, one grant list, read by both                  |
| Sidebar + nav    | a layout built per project                              | driven by `$lib/config/navigation.ts`, filtered by permission         |
| Deploy target    | adapter and worker config assembled by hand             | `adapter-cloudflare` + `wrangler.jsonc`, ready to `wrangler deploy`   |

## Getting started

```sh
cp .env.example .env
pnpm install
pnpm run dev
```

The dev server starts on <http://localhost:5173>. Without a real backend, set `PUBLIC_API_URL` to
one that at least answers `/health`, or turn auth off (`PUBLIC_AUTH_ENABLED=false`) to browse the
app shell without a session.

## Environment variables

| Variable                       | Description                        | Default                        |
| ------------------------------ | ---------------------------------- | ------------------------------ |
| `PUBLIC_API_URL`               | Backend API base URL               | -                              |
| `PUBLIC_AUTH_BASE_URL`         | Auth service base URL, if separate | falls back to `PUBLIC_API_URL` |
| `PUBLIC_AUTH_ENABLED`          | Enable the auth hook               | `true`                         |
| `PUBLIC_AUTH_PASSWORD_ENABLED` | Show the password login form       | `true`                         |
| `PUBLIC_AUTH_GOOGLE_ENABLED`   | Show the Google OAuth button       | `false`                        |
| `PUBLIC_GOOGLE_CLIENT_ID`      | Google OAuth client ID             | -                              |
| `AUTH_COOKIE_DOMAIN`           | Cookie domain                      | -                              |
| `AUTH_COOKIE_SECURE`           | Secure cookie flag                 | `false` (dev)                  |
| `AUTH_COOKIE_MAX_AGE`          | Cookie lifetime, in seconds        | `604800` (7 days)              |
| `AUTH_COOKIE_SAMESITE`         | `SameSite` policy                  | `lax`                          |

## Architecture

```
src/
├── hooks.server.ts    # Picks the auth handle (or a no-op) from config.auth.enabled
├── lib/
│   ├── core/          # api, service, errors, logger, permissions, query - infrastructure only
│   ├── config/        # app.ts (branding/env), navigation.ts, permissions.ts
│   ├── types/         # Types shared by more than one feature
│   ├── utils/         # Pure functions - date, string, number, form
│   ├── hooks/         # Stateful runes classes: Disclosure, Filters, Pagination, IsMobile
│   ├── features/      # Vertical slices (auth, users, ...) - components, services, types together
│   ├── server/         # Server-only code, never imported from a `.svelte` file
│   └── components/    # ui/ (shadcn, untouched), kit/, blocks/, layout/
└── routes/
    ├── (auth)/        # Unauthenticated: login, logout, authorize (OAuth callback)
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
every request by `hooks.server.ts`. Turning `PUBLIC_AUTH_ENABLED` off swaps in a no-op handle
instead of skipping the check inline, so `locals.requirePermission` is always defined - a route
guard is never the thing that crashes because auth happened to be off on this machine.

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

// Server: a fresh token from locals/cookies
const service = new UserService(accessToken);

// Client: a getter, so a refreshed token is picked up on the next call
const auth = getAuth();
const service = new UserService(() => auth().accessToken);
```

`expectBody` narrows air's `T | null` for an endpoint that must answer with a body - a `204` there
is a broken response, not data, so it fails at the service boundary instead of leaking `null` into
every consumer that forgot to check.

## Testing

```sh
pnpm run test        # vitest, run once - browser tests (Playwright) and server tests both
pnpm run test:unit    # vitest, watch mode
```

Two Vitest projects, split by what they need: `*.svelte.{test,spec}.ts` run in a real Chromium tab
(`@vitest/browser-playwright`), everything else runs in Node. `src/lib/server/**` is excluded from
the browser project on purpose - server-only code has no business compiling for a browser test.

## Deploying

Built for Cloudflare Workers via `@sveltejs/adapter-cloudflare`:

```sh
pnpm run build     # wrangler types --check, then vite build
wrangler deploy
```

`wrangler.jsonc`'s `name` is still the placeholder `"app"` - rename it, and `name` in
`package.json`, before the first deploy. `pnpm run gen` regenerates `worker-configuration.d.ts`
from `wrangler.jsonc` after any binding change.

## Customization checklist

- [ ] Set `branding` in `$lib/config/app.ts` - name, logo, favicon and SEO all come from this one
      object, not from the pages that display them
- [ ] Rename `"app"` to the project's real name in `package.json` and `wrangler.jsonc`
- [ ] Add nav items in `$lib/config/navigation.ts`
- [ ] Add permission keys, roles and the page-permission table in `$lib/config/permissions.ts`
- [ ] Set `PUBLIC_API_URL` (and `PUBLIC_AUTH_BASE_URL`, if auth lives elsewhere) in `.env`
- [ ] Add feature slices under `src/lib/features/`, following `features/users/` as the reference
      shape - `services/`, `schemas.ts`, `types.ts`, `components/`

## Scripts

```sh
pnpm run dev          # Dev server, http://localhost:5173
pnpm run build        # wrangler types --check, then production build
pnpm run preview      # Serve the built worker locally, port 4173
pnpm run check        # wrangler types --check, svelte-kit sync, svelte-check
pnpm run lint         # Prettier + ESLint
pnpm run format       # Prettier --write
pnpm run test         # Vitest (browser + server projects), once
pnpm run gen          # Regenerate worker-configuration.d.ts from wrangler.jsonc
```
