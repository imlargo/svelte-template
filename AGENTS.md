# AGENTS.md

Working guide for AI agents (and humans) on this project. These rules are mandatory.

## What this repo is

A SvelteKit 3 + Svelte 5 template for consulting projects. It consumes an external API (it has no
database) and solves the boring parts up front: cookie-based authentication, permissions, a
sidebar layout, forms, components. It is not a framework and should not become one: the goal is
to clone it and build on it without friction or surprises. See [`README.md`](./README.md) to get
started.

## Architecture documentation

[`docs/architecture.md`](./docs/architecture.md) explains the layers, the request lifecycle,
permissions, and where the backend contract is changed. `src/` remains the source of truth for
the details: when facing a structural decision or unsure about a pattern, read the code of the
equivalent area before inventing a new one.

## Workflow

- Before writing code: explore the repo, understand the folder structure, the existing conventions
  and the code related to the task.
- Look for similar existing implementations and follow the same pattern before inventing a new one.
- Favor simplicity and established patterns over quick fixes or code written just to get it done.
- When two valid approaches are ambiguous, pick the one that already dominates the codebase; if
  the impact is real and differs between them, ask instead of assuming.
- Do not add new dependencies without a clear need; first check whether something existing
  (`#lib/core`, `#lib/utils`, `#lib/hooks`) solves the problem.
- Do not carry debt between tasks: leave `pnpm run lint`, `pnpm run check` and `pnpm run test`
  green before calling anything done.

## UI / Styles

- **Always Tailwind.** Custom CSS only when it is strictly impossible with Tailwind utilities.
- **shadcn first:** if an applicable shadcn component exists (`button`, `input`, `dialog`,
  `select`, etc.), use it as is: without modifying it or adding extra classes unless strictly
  necessary.
- `src/lib/components/ui/` (shadcn) is **untouchable**: do not edit, extend or delete files there —
  it is excluded from `prettier`/`eslint` on purpose. Compose variants outside it (wrappers, props,
  composition), never by modifying the source.
- `src/lib/components/coral/` is a vendored kit on top of shadcn (combobox, data table, date
  picker…): same rule as `ui/`. It is updated by copying in a new version, never by editing it here.

## Architecture / Code

- **Services** are the only place that calls the API. No direct `fetch`/HTTP in components or
  hooks. A service extends `BaseService` (`#lib/core/service.ts`) and lives in
  `features/<slice>/services/` — see `features/users/services/users.ts` as the reference.
- **Composition over inheritance** in components and hooks: small, composable pieces. The
  deliberate exception is the service hierarchy (`extends BaseService`), which exists to share
  token and API client resolution across all services.
- **No magic strings:** use typed constants or an `enum` for fixed values, keys, API routes and
  states. Routes the code redirects to or calls by path live in `#lib/config/routes.ts`. For
  domain identity with a closed set of values (`UserRole`), use an `enum`. For capability tags
  like `"resource:action"` (`Permission` in `#lib/config/permissions.ts`), a string-literal union
  with `as const satisfies` is fine — follow the pattern the equivalent piece already uses before
  introducing a new one.
- **Environment variables:** every variable is declared in `src/env.ts` (`defineEnvVars` + a zod
  schema) and read from `$app/env/public` or `$app/env/private`. Never `process.env` nor the
  `$env/*` modules (deprecated in SvelteKit 3).
- **Links to the app's own routes:** `#lib/config/routes.ts` holds pathnames (`/login`) because
  they are redirect targets and are compared with `url.pathname`; for an `href`, pass them through
  `resolvePathname()` (`#lib/utils/paths.ts`), not `resolve()`, which reads the leading `/` as a
  route ID. `navigation.ts` and the permission tables use route IDs (`/(app)/admin`, typed from
  `$app/types`), and those do go through `resolve()`.
- **Backend contract:** the shape of the auth responses and their mappers live in
  `features/auth/contract.ts`; the shape of the error body in `#lib/config/errors.ts`. A _wire_
  type (what the API returns) lives next to the service that consumes it and is mapped there;
  components only see domain types (`#lib/types/`, `features/<slice>/types.ts`).

## Types

- **Never `any`**, no exceptions (nor `as any` to dodge a type error). If the real type is complex
  or comes from an external response, check the source (`features/<slice>/types.ts`,
  `#lib/types/`) before typing it by hand. If the shape is truly unknown at write time, use
  `unknown` and narrow it before operating on it.
- Before creating a new type, check whether an equivalent one already exists in `#lib/types/`
  (shared by more than one slice) or in `features/<slice>/types.ts` (owned by that slice). If
  something similar is not identical, verify it is the same domain concept before reusing or
  merging it.
- If no suitable type exists, create it where it belongs per the previous point — never inline or
  duplicated in the file that consumes it.

## State

- Shared state with runes lives in classes under `#lib/hooks/` (`Disclosure`, `Filters`,
  `Pagination`, `IsMobile`, in `#lib/hooks/*.svelte.ts`). Before creating a new one, consider
  whether the state is really shared or local to a component — in that case, a `$state` inside
  the component itself is enough.
- **Module-level `$state` is forbidden for user-dependent data.** Under SSR, modules are
  singletons per process, not per request: an exported `$state` holding user data leaks data
  between users — it is the only one of these rules whose violation is a security incident rather
  than a nuisance. Per-request state goes in `locals`, in the `load`'s `data`, or in Svelte
  context. If you find yourself writing `if (browser)` around a mutation of global state, that is
  not a guard: it is the sign that the state is in the wrong place.
- State hooks do not call the API directly: they delegate to services.

## Data loading

- **A navigation never waits for slow data.** In `load`, `await` only what the page cannot render
  without; return the rest as a promise (streaming) and render it with `AsyncView` + a skeleton.
  Reference: `routes/(app)/+page.server.ts`.
- Data the user searches, filters or edits in place is loaded by the page itself with `Query` +
  `AsyncView` (in `onMount`, not with `if (browser)`). Reference: `routes/(app)/admin/`.
- Remote functions are not used (they are still experimental in SvelteKit 3).
- On the client, a service is created with `getAuth().api`, never with a bare token: that way it
  inherits session renewal and 401 handling. On the server, with
  `{ token: locals.accessToken, fetch }`.
- No component handles a 401: an expired session is renewed or redirected to login in
  `features/auth/transport.ts` and in the hook.

## Forms

- No form library. A form that posts to the server is a form action with `use:enhance`; one inside
  a client flow (a dialog that calls a service) handles its own `onsubmit`. References:
  `features/auth/components/LoginForm.svelte` and
  `features/users/components/UserFormDialog.svelte`.
- They are validated with the slice's zod schema through `#lib/utils/forms.ts` (`parseForm`,
  `validateField`), and laid out with shadcn's `Field`. The server always validates, even if the
  client already did.

## Errors

- Every error is converted with `normalizeError`, and its `message` is always safe to show. Never
  display `err.message` from an error that has not been normalized.
- If an error is expected, throw it as an `AppError` with the matching code. A generic `Error` is
  treated as a bug: the default message is shown and the detail goes only to the log.
- `handleError` receives every error but only acts on unexpected ones (`kind === 'unknown'`): an
  `error(403, ...)` already carries its message for the user.

## Permissions

Deny by default: unknown role → no permissions, undeclared route → denied. `PAGE_ACCESS` and
`ENDPOINT_ACCESS` (`#lib/config/permissions.ts`) are exhaustive over the route IDs generated by
`svelte-kit sync`: a new page or endpoint without an entry does not compile, and if one reached
the hook it would be denied with a 403. A page declares its permission (or `'public'`); an
endpoint declares `'session'` and asks for its own permission per method with
`locals.requirePermission` — there is no "unrestricted" value you could use by accident.

## Code conventions

- Follow the existing naming and folder structure (check before creating files).
- **Zero barrels:** no `index.ts` of our own that re-exports. Import by the real path, always from
  `#lib/...` (the `index.js` files in `ui/` are shadcn's convention, not an exception to copy).
- **Idiomatic over clever:** if SvelteKit already solves it (`afterNavigate`, `load`, form actions,
  `page.url`), use that. `$effect` is for syncing with something outside Svelte, never for
  communicating between components or deriving values.
- Keep components focused: if one grows in responsibilities, extract subcomponents or hooks.
  Reusable logic lives in `#lib/hooks/` or `#lib/utils/`, not duplicated across components.
- If a function is pure and stateless (formatting, validation, transformation) and likely to be
  used in more than one place, extract it to `#lib/utils/`; if it has state or reactivity, to
  `#lib/hooks/`. Before creating a new one, check whether something equivalent already exists.
- **Batteries included, abstractions not:** `#lib/hooks/`, `#lib/utils/` and `coral/` ship generic
  pieces a project may not use yet, on purpose: they are the template's starting point, not dead
  code. Outside them, no "just in case" abstractions — the third repetition justifies an
  abstraction, the first and second do not.
- Do not leave dead code, debug comments or `console.log` in the final code.
- Changes must be minimal and scoped to the task: do not refactor unrelated code unless asked.

## Before calling something done

```sh
pnpm run lint       # no errors
pnpm run check      # zero errors AND zero warnings
pnpm run test       # green (server + components)
```

Actually run them and read the output — do not assume it compiled. `svelte-check` warnings such
as `state_referenced_locally` are reactivity bugs, not noise.

---

## Svelte MCP server

You have access to the full Svelte 5 and SvelteKit documentation. Use it — this project depends
on version details that change, and the model's memory lags behind.

1. **`list-sections`** — use it first to discover the available sections. For any question about
   Svelte or SvelteKit, start here.
2. **`get-documentation`** — retrieves the full content of specific sections. Fetch all the
   relevant ones at once.
3. **`svelte-autofixer`** — analyzes Svelte code and returns issues and suggestions. Always use it
   before delivering Svelte code. Repeat until it returns nothing.
4. **`playground-link`** — generates a Playground link. Only after the user confirms, and never if
   the code was written to project files.
