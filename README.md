# svelte-template

A production-ready SvelteKit 2 + Svelte 5 starter template with a layered architecture, full auth system, inset sidebar layout, and shadcn-svelte UI.

## Stack

| Layer | Tool |
|---|---|
| Framework | SvelteKit 2 + Svelte 5 (Runes) |
| Language | TypeScript (strict) |
| Styling | TailwindCSS v4 + shadcn-svelte |
| Forms | sveltekit-superforms + formsnap |
| Testing | Vitest + Playwright |
| Linting | ESLint + Prettier |

## Architecture

```
src/
├── lib/
│   ├── core/          # Infrastructure: ApiClient, BaseService, error classes
│   ├── config/        # App config + domain constants (permissions, navigation)
│   ├── types/         # Shared TypeScript types
│   ├── utils/         # Pure utility functions (date, string, number, form)
│   ├── stores/        # Generic reactive stores (FilterStore, PaginationStore, Disclosure)
│   ├── hooks/         # Composable functions (isMobile, etc.)
│   ├── features/      # Vertical slices (auth, ...)
│   └── components/    # UI: ui/ (shadcn), base/, common/, blocks/, layout/
└── routes/
    ├── (auth)/        # Unauthenticated pages: login, register, logout, authorize
    └── (app)/         # Protected pages with sidebar layout
```

See `architecture.md` for the full layered architecture guide.

## Getting started

```sh
cp .env.example .env
npm install
npm run dev
```

The dev server starts on http://localhost:3000.

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `PUBLIC_API_URL` | Backend API base URL | — |
| `PUBLIC_AUTH_BASE_URL` | Auth service base URL (if separate) | — |
| `PUBLIC_AUTH_ENABLED` | Enable/disable auth middleware | `true` |
| `PUBLIC_AUTH_PASSWORD_ENABLED` | Show password login form | `true` |
| `PUBLIC_AUTH_GOOGLE_ENABLED` | Show Google OAuth button | `false` |
| `PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID | — |
| `AUTH_COOKIE_DOMAIN` | Cookie domain | — |
| `AUTH_COOKIE_SECURE` | Secure cookie flag | `false` (dev) |
| `AUTH_COOKIE_MAX_AGE` | Cookie lifetime in seconds | `604800` (7d) |
| `AUTH_COOKIE_SAMESITE` | SameSite policy | `lax` |

## Auth methods

Both login strategies are feature-flagged via env vars. Set one or both:

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

## Customization checklist

- [ ] Replace the "App" name + logo icon in `src/routes/(auth)/login/+page.svelte` and `app-sidebar.svelte`
- [ ] Add your nav items in `src/lib/config/domain/navigation.ts`
- [ ] Add your permission keys and role mappings in `src/lib/config/domain/permissions.ts`
- [ ] Set `PUBLIC_API_URL` in `.env`
- [ ] Add your domain types under `src/lib/types/domain/`
- [ ] Add feature slices under `src/lib/features/`

## Scripts

```sh
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run check        # svelte-check type checking
npm run lint         # Prettier + ESLint
npm run format       # Auto-format
npm run test         # Run all tests (Vitest + Playwright)
```
