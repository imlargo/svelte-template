# Arquitectura del template

> Especificación del estado objetivo. Este documento define **qué es** el template, **cómo se
> construye sobre él** y **qué está prohibido**. Es el contrato con cualquier persona o agente que
> toque el repo.
>
> Sustituye a `architecture.md` (que describía un proyecto distinto y debe borrarse).
> El plan para llegar aquí desde el estado actual está en `AUDIT.md`.

Verificado contra `@sveltejs/kit@2.61.1` y `svelte@5.56.0` — las versiones instaladas.

---

## 1. Qué es esto

Un punto de partida para aplicaciones web con interfaz autenticada que consumen **una API externa
ya existente**. Clonas, configuras la URL de la API, y empiezas a escribir pantallas.

**SvelteKit es el BFF (backend for frontend).** No es un frontend que llama a la API desde el
navegador: es un servidor que llama a la API y le entrega al navegador solo lo que necesita ver.
Esta es la decisión que gobierna todo el resto del documento.

### Qué NO es

- **No tiene base de datos.** No hay ORM, no hay migraciones, no hay `$lib/server/db`. La
  persistencia vive en la API externa.
- **No es un framework.** No hay generadores, ni plugins, ni convenciones mágicas. Lo que ves en
  `src/` es todo lo que hay.
- **No es una librería.** No se publica ni se versiona. Se clona y diverge.
- **No resuelve billing, emails, uploads, i18n ni multi-tenancy.** Cuando un proyecto lo necesite,
  se añade en ese proyecto.

### La regla que mantiene esto vivo

> **El template contiene solo lo que el template usa.**

Cero exports sin consumidor. Si escribes una abstracción "para cuando la necesite", bórrala: la
versión que escribas cuando la necesites de verdad será mejor y te costará lo mismo. Todo lo que
sobra es una decisión que vuelves a tomar cada vez que abres el repo, y una pista falsa para
cualquier agente que lo lea.

---

## 2. Stack

Exactamente lo que hay en `package.json`. Nada más.

| Capa | Herramienta | Nota |
|---|---|---|
| Framework | SvelteKit 2 | Routing por archivos, load functions, form actions |
| UI | Svelte 5 (runes) | `runes: true` forzado en `svelte.config.js` |
| Lenguaje | TypeScript strict | — |
| Estilos | TailwindCSS v4 | CSS-first con `@theme`; sin `tailwind.config.ts` |
| Componentes | shadcn-svelte sobre bits-ui | Vendorizado en `lib/components/ui/`. **No se modifica** |
| Formularios | Superforms + Zod | Validación compartida servidor/cliente |
| Cliente HTTP | `@korastd/air` | Envuelto en `lib/core/api` |
| Iconos | `@lucide/svelte` | Import por icono, nunca el barrel |
| Toasts | `svelte-sonner` | Un `<Toaster />` en el layout raíz |
| Tests | Vitest + Playwright | Unit en Node, componentes en navegador, E2E |
| Calidad | ESLint + Prettier + svelte-check | Los tres bloquean |

**Añadir una dependencia requiere justificarla en el PR.** El coste de una dependencia no es su
tamaño: es que alguien tenga que entenderla dentro de un año.

---

## 3. Principios

**1. El servidor es la frontera de confianza.**
El navegador no ve secretos, no ve tokens, y no habla con la API externa. Todo pasa por el
servidor de SvelteKit. Si un dato no debería estar en el HTML, no se devuelve desde un `load`.

**2. Deny by default.**
Rol desconocido → sin permisos. Ruta no declarada → denegada. Un olvido debe producir un 403, no
un acceso. La única postura defendible es que equivocarse cierre la puerta.

**3. El estado del usuario nunca vive en un módulo.**
En SSR los módulos son singletons por proceso, no por request. Un `$state` a nivel de módulo con
datos de usuario filtra datos entre usuarios. Es un incidente de seguridad, no un detalle de
estilo. El estado por request va en `locals`, en `data`, o en contexto de Svelte.

**4. Una sola forma de hacer cada cosa.**
Un estilo de import. Un helper de estado async. Un lugar para cada tipo de dato. Dos formas
equivalentes no dan flexibilidad: dan una decisión que tomas cada vez y que un agente toma al azar.

**5. Idiomático antes que ingenioso.**
Si SvelteKit ya lo resuelve (`afterNavigate`, `load`, form actions, `page.url`), se usa eso. No se
reimplementa con `$effect` y estado auxiliar.

**6. Las páginas son delgadas.**
Un `+page.svelte` recibe `data`, monta un componente y define el `<title>`. No calcula, no filtra,
no llama servicios.

**7. Borrar antes que abstraer.**
La tercera repetición justifica una abstracción. La primera y la segunda, no.

---

## 4. Estructura

```
src/
├── app.html
├── app.d.ts                       ← tipado de App.Locals, App.Error
├── app.config.ts                  ← configuración leída de env, tipada
├── hooks.server.ts                ← auth + autorización + cabeceras + handleError
├── hooks.client.ts                ← handleError del cliente
│
├── lib/
│   ├── core/                      ← infraestructura. No sabe nada del negocio.
│   │   ├── api.ts                 ← createApiClient (air + baseURL + Authorization)
│   │   ├── service.ts             ← BaseService
│   │   ├── errors.ts              ← AppError, ApiError, ValidationError, normalizeError
│   │   ├── logger.ts              ← log(...) — único punto de salida de logs
│   │   └── view-state.svelte.ts   ← ViewState<T> + AsyncViewState
│   │
│   ├── config/
│   │   └── domain/                ← constantes del negocio. Datos, sin lógica.
│   │       ├── permissions.ts     ← roles, PermissionKey, matriz ruta→roles
│   │       └── navigation.ts      ← items del menú
│   │
│   ├── types/                     ← SOLO tipos usados por más de un slice
│   │   └── user.ts                ← User, UserRole, BaseEntity
│   │
│   ├── utils/                     ← funciones puras, sin estado, sin efectos
│   │   ├── date.ts
│   │   ├── number.ts
│   │   ├── string.ts
│   │   └── form.ts
│   │
│   ├── features/                  ← vertical slices
│   │   └── <domain>/
│   │       ├── index.ts               ← API pública del slice
│   │       ├── types.ts               ← tipos propios del dominio
│   │       ├── schemas.ts             ← Zod: forms y payloads
│   │       ├── services/
│   │       │   └── <entity>.server.ts ← SERVER-ONLY (ver §6)
│   │       ├── <domain>.svelte.ts     ← orquestador (solo si hace falta)
│   │       ├── components/            ← UI del dominio
│   │       └── *.test.ts              ← tests junto al código
│   │
│   ├── components/
│   │   ├── ui/                    ← shadcn-svelte vendorizado. NO SE TOCA.
│   │   ├── base/                  ← átomos propios sobre ui/ o bits-ui
│   │   ├── common/                ← moléculas sin dominio (PageHeader, EmptyState, AsyncView)
│   │   ├── blocks/                ← organismos sin dominio
│   │   └── layout/                ← chrome de la app (sidebar, header)
│   │
│   └── assets/
│
├── routes/
│   ├── +layout.svelte             ← ModeWatcher, Toaster, skip link
│   ├── +layout.server.ts          ← devuelve SOLO `user`
│   ├── +error.svelte
│   ├── (auth)/                    ← login, register, logout, authorize — sin sesión
│   └── (app)/                     ← todo lo autenticado
│       ├── +layout.server.ts      ← guard: sin user → /login
│       ├── +layout.svelte         ← sidebar + header + contexto de usuario
│       └── <ruta>/
│           ├── +page.svelte       ← thin page
│           └── +page.server.ts    ← load / actions
│
└── static/
```

### Notas sobre la estructura

**No hay `lib/stores/`.** Los stores genéricos que no usa nadie se borran. Si un slice necesita
estado compartido, lo declara en su propio `.svelte.ts`.

**No hay `lib/hooks/`.** `IsMobile` es un caso de `MediaQuery` de `svelte/reactivity`; vive donde
se use o en `core/` si se usa en varios sitios.

**No hay barrels intermedios.** Nada de `lib/index.ts`, `lib/core/index.ts`,
`lib/config/index.ts`. Un barrel se justifica solo para exponer la API pública de un slice
(`features/<domain>/index.ts`) o un conjunto de componentes (`components/common/index.ts`).
Todo lo demás se importa por ruta directa: los barrels intermedios encadenan imports que arrastran
módulos innecesarios al bundle y ocultan de dónde viene cada cosa.

**`lib/types/` es residual, no un almacén.** Un tipo vive en `lib/types/` solo si lo consumen dos
o más slices (o el slice y `app.d.ts`). En la práctica eso significa `User` y poco más. Todo lo
demás vive en `features/<domain>/types.ts`.

**Un slice puede no tener orquestador.** Si el dato llega por `load` y la página solo lo renderiza,
no hay nada que orquestar. El orquestador aparece cuando hay estado del cliente que coordinar —
no antes.

---

## 5. Flujo de datos

```
                       ┌──────────────────┐
   Navegador ────────► │  SvelteKit (BFF) │ ────────► API externa
                       └──────────────────┘
   ▲                     │        │
   │                     │        └── locals.accessToken (nunca sale de aquí)
   └── data (user, DTOs) ┘
```

**Regla absoluta: el navegador nunca llama a la API externa y nunca ve un token.**

Las cookies de sesión son `httpOnly` precisamente para que el JavaScript del navegador no las
lea. Devolver los tokens desde un `load` los serializa en el HTML y anula esa protección: un XSS
se llevaría el refresh token. Por eso:

```ts
// src/routes/+layout.server.ts
export const load: LayoutServerLoad = async ({ locals }) => {
    return { user: locals.user ?? null };   // ← y nada más
};
```

`locals.accessToken` existe solo para que el código del servidor construya servicios. No se
devuelve, no se loguea, no se pasa a un componente.

### Dónde se piden los datos

| Caso | Mecanismo | Por qué |
|---|---|---|
| Datos del primer render de una página | `+page.server.ts` → `load` | Llegan con el HTML, sin waterfall, sin flash de loading |
| Datos que dependen de la ruta padre | `+layout.server.ts` → `load` | Se comparten con las hijas vía `data` |
| Mutación desde un formulario | form action + Superforms | Progressive enhancement gratis; funciona sin JS |
| Datos bajo demanda desde el cliente (búsqueda, scroll infinito, refresco) | `+server.ts` en la misma carpeta de la ruta, llamado con `fetch` | El servidor sigue siendo quien tiene el token |
| Cualquier llamada directa del navegador a la API externa | **Prohibido** | Requeriría exponer el token |

**Sobre remote functions.** SvelteKit tiene `query` / `form` / `command` / `prerender` en archivos
`.remote.ts`, y resolverían con menos código el caso de "datos bajo demanda". **Están marcadas como
experimentales en la versión instalada** (`kit.experimental.remoteFunctions`, por defecto `false`,
documentadas como "not yet stable and may be changed or removed at any time"). Por eso el template
no las usa. Cuando se estabilicen, sustituyen la fila de `+server.ts` de la tabla y esta sección
se reescribe — es un cambio aditivo, no un rediseño.

---

## 6. Servicios y acceso a la API

Un servicio encapsula las llamadas a la API externa de un dominio. **Todos los servicios son
código de servidor.**

### Cómo se garantiza

SvelteKit trata como server-only dos cosas: los módulos bajo `$lib/server/`, y **cualquier archivo
con `.server.` en el nombre**. Si código del navegador importa uno de ellos —directa o
indirectamente— el build falla con un error que muestra la cadena de imports completa.

Por eso los servicios se llaman `<entity>.server.ts`:

```
lib/features/users/services/users.server.ts
```

Esto da lo mejor de los dos mundos: el slice sigue siendo cohesivo (el servicio vive junto a sus
tipos y sus componentes) **y** el compilador impide que se filtre al cliente. No dependemos de la
disciplina de nadie.

### La forma de un servicio

```ts
// lib/features/users/services/users.server.ts
import { BaseService } from '$lib/core/service';
import type { User } from '$lib/types/user';
import type { CreateUserInput } from '../types';

export class UsersService extends BaseService {
    list(query?: { page?: number; search?: string }) {
        return this.api.get<User[]>('/users', { query });
    }

    get(id: string) {
        return this.api.get<User>(`/users/${id}`);
    }

    create(input: CreateUserInput) {
        return this.api.post<User>('/users', { body: input });
    }
}
```

`BaseService` recibe el token en el constructor y construye su cliente:

```ts
// lib/core/service.ts
export class BaseService {
    protected api: AirClient;

    constructor(token = '') {
        this.api = createApiClient({ token });
    }
}
```

Un solo tipo de token: `string`. La variante "token como función" existía únicamente para el caso
cliente, que ya no existe.

### Uso

```ts
// routes/(app)/users/+page.server.ts
import { UsersService } from '$lib/features/users/services/users.server';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
    const users = new UsersService(locals.accessToken ?? '');
    return {
        users: await users.list({ search: url.searchParams.get('q') ?? undefined })
    };
};
```

### Errores

Un servicio **no captura errores**. Deja que `air` lance y que el llamante decida. En un `load`,
lo idiomático es traducirlo a un error de SvelteKit:

```ts
import { error } from '@sveltejs/kit';
import { normalizeError } from '$lib/core/errors';

try {
    return { user: await service.get(params.id) };
} catch (err) {
    const e = normalizeError(err);
    error(e.is('NOT_FOUND') ? 404 : 500, e.getMessage());
}
```

---

## 7. Autenticación y autorización

Es el activo diferencial del template. Tiene que ser correcto.

### Modelo

- Sesión por **cookies `httpOnly`** (`access_token`, `refresh_token`), gestionadas por
  `AuthCookiesManager`, configuradas desde env en `features/auth/server.ts`.
- `hooks.server.ts` monta `createAuthHandler`, que en cada request: decide si la ruta es pública,
  lee las cookies, resuelve el usuario contra la API (`/auth/me`), **comprueba el permiso de la
  ruta**, y puebla `locals`.
- El login y el registro son **form actions**. El callback de OAuth es un **`+server.ts`**. El
  logout es una **form action POST**.

### El check de autorización va en el servidor

`AUTH_ROUTE_PERMISSIONS` mapea prefijo de ruta → roles permitidos. Ese mapa se evalúa **una vez,
en el hook**, después de resolver el usuario:

```ts
if (!canAccessRoute(user.role, pathname)) {
    error(403, 'You do not have access to this page.');
}
```

El sidebar sigue filtrando items con `hasAnyPermission`, pero eso es **presentación**. Ocultar un
enlace no es autorización: cualquiera puede escribir la URL. Si el único control fuera el menú, el
mapa de permisos daría una falsa sensación de cobertura, que es peor que no tener nada.

### Deny by default, en las dos direcciones

```ts
// Rol desconocido → el rol sin privilegios. NUNCA por descarte a un rol con permisos.
function toRole(role: string | null | undefined): UserRole {
    return isKnownRole(role) ? role : UserRole.GUEST;
}

// Ruta no declarada en AUTH_ROUTE_PERMISSIONS → denegada.
export function canAccessRoute(role: string | null | undefined, pathname: string): boolean {
    const entry = matchLongestPrefix(AUTH_ROUTE_PERMISSIONS, pathname);
    if (!entry) return false;              // ← nunca `true`
    return entry.roles.includes(toRole(role));
}
```

Dos consecuencias que hay que entender antes de aceptarlas:

1. **Toda ruta nueva bajo `(app)/` necesita una entrada en `AUTH_ROUTE_PERMISSIONS`.** Si se
   olvida, la ruta da 403 y te enteras en el primer clic. Es exactamente el fallo que quieres:
   ruidoso e inmediato, en vez de silencioso y en producción.
2. **Un rol nuevo en el backend no hereda permisos.** Añadir `viewer` en la API no le da acceso a
   nada aquí hasta que lo declares. El sentido contrario —que un rol restrictivo herede los
   permisos de `member`— es cómo se abren agujeros.

**El match es por prefijo más largo**, no por el primero que coincida: `/admin/users` debe
resolver con la regla de `/admin/users` si existe, no con la de `/admin`.

### Redirects

`features/auth/redirect.ts` codifica el path de origen en el `?redirect=` y lo valida al volver.
La validación **no** es `startsWith('/')`: re-parsea contra un origen falso y rechaza cualquier
cosa que se escape de él, porque `//evil.com` y `/\evil.com` empiezan por `/` y aun así son URLs
externas. Este archivo está bien y no se toca sin tests.

### Lo que el template NO resuelve

- **No hay refresh de token.** Cuando el access token expira, `/auth/me` falla y el handler manda
  al login. Es una decisión, no un olvido: implementarlo bien exige deduplicar refreshes
  concurrentes, y eso depende de cómo funcione tu API. Documentado aquí para que nadie asuma que
  existe.
- **La vida del access token la fija la API externa.** Las cookies tienen su propio `maxAge`; si
  configuras 7 días para ambas, el par de tokens no aporta nada sobre un token único.

---

## 8. Estado en el cliente

### Jerarquía de decisión

Antes de crear estado, comprueba en orden:

1. **¿Puede estar en la URL?** Filtros, orden, paginación, tab activa, término de búsqueda → query
   params. Sobreviven al reload, se comparten por enlace, participan en el SSR, y el `load` los lee.
2. **¿Viene del servidor?** → `data` de `load`. No lo copies a `$state`; si necesitas derivarlo,
   `$derived`.
3. **¿Es local a un componente?** → `$state` dentro del componente.
4. **¿Lo necesitan varios componentes de un subárbol?** → contexto.
5. **¿Nada de lo anterior?** → una clase con campos `$state` en un `.svelte.ts`, **instanciada**
   por quien la use. Nunca exportada ya instanciada.

### Contexto

Svelte 5.40+ trae `createContext`, que da tipado y elimina las claves mágicas. Es lo que usamos:

```ts
// lib/features/auth/context.ts
import { createContext } from 'svelte';
import type { User } from '$lib/types/user';

export const [getUser, setUser] = createContext<() => User>();
```

```svelte
<!-- routes/(app)/+layout.svelte -->
<script lang="ts">
    import { setUser } from '$lib/features/auth/context';
    let { data, children } = $props();

    // Se pasa una función, no el valor: así la reactividad cruza el límite del contexto.
    setUser(() => data.user);
</script>

{@render children()}
```

```svelte
<!-- cualquier descendiente -->
<script lang="ts">
    import { getUser } from '$lib/features/auth/context';
    const user = getUser();
</script>

<span>{user().name}</span>
```

Se usa contexto **solo** cuando el prop drilling sería de tres o más niveles. A dos niveles, pasa
props: son más fáciles de seguir y de testear.

### Prohibido

```ts
// ❌ NUNCA. En SSR esto se comparte entre requests.
export const authStore = new AuthStore();
export const currentUser = $state<User | null>(null);
```

La regla completa: **ningún `$state` exportado a nivel de módulo puede contener datos que dependan
del usuario o de la request.** Constantes de UI compartidas por toda la app (el tema, si el sidebar
está colapsado) sí pueden, porque no identifican a nadie — y aun así, prefiere contexto.

Corolario: si te encuentras escribiendo `if (browser)` alrededor de una mutación de estado global,
eso no es una guarda, es la señal de que el estado está en el sitio equivocado.

### Convenciones de runes

Alineadas con las best practices oficiales de Svelte:

- **Clases con campos `$state`** para lógica reactiva reutilizable. No factories que devuelven
  objetos con getters: más código, mismo resultado.
- **`$derived` para computar, nunca `$effect`.** Si escribes en estado dentro de un efecto, casi
  siempre querías un `$derived`.
- **`$effect` es una vía de escape.** Se justifica para sincronizar con algo externo a Svelte
  (una librería imperativa, un timer, una suscripción). **No** para notificar al padre, **no**
  para detectar navegación, **no** para derivar valores. Un `$effect` que llama a un callback de
  props es un bug esperando a que el padre reasigne el valor.
- **`$state.raw` para respuestas de API.** Objetos y arrays grandes que solo se reasignan, nunca
  se mutan: evitas el coste del proxy profundo.
- **`{#each}` siempre con key**, y la key identifica al objeto — nunca el índice.
- **`{@attach}` en vez de `use:`** para comportamiento sobre elementos.
- Los efectos no corren en el servidor. Nunca los envuelvas en `if (browser)`.

### `ViewState<T>` — estado de una operación async del cliente

Los datos del primer render vienen de `load`, así que `ViewState` cubre lo que pasa **después**:
una acción del usuario que dispara trabajo async. Es la **única** utilidad para eso.

```ts
// lib/core/view-state.svelte.ts
export type AsyncViewState = 'idle' | 'loading' | 'success' | 'error' | 'empty';

export class ViewState<T> {
    state = $state<AsyncViewState>('idle');
    error = $state<string | null>(null);
    data = $state.raw<T | null>(null);

    async run(action: () => Promise<T>, opts?: { isEmpty?: (r: T) => boolean }) { /* ... */ }
    reset() { /* ... */ }
}
```

El punto clave: **`ViewState` sostiene el dato**. No hay un `$state` paralelo con los items al
lado de un `ViewState` que solo guarda el estado — eso son dos fuentes de verdad que se
desincronizan, y obliga a la vista a volver a comprobar si está vacía cuando el propio
`ViewState` ya tiene un estado `empty`.

`AsyncView` consume `ViewState` y expone el dato al snippet de éxito:

```svelte
<AsyncView {viewState}>
    {#snippet success(items)}
        {#each items as item (item.id)}…{/each}
    {/snippet}
</AsyncView>
```

Con snippets opcionales para `loading`, `empty` y `error`, y defaults razonables si no se pasan.

---

## 9. Componentes

### Niveles

| Nivel | Qué contiene | Puede importar de |
|---|---|---|
| `ui/` | shadcn-svelte vendorizado. **No se modifica ni se envuelve sin motivo.** Se actualiza con el CLI de shadcn. | bits-ui, `$lib/utils` |
| `base/` | Átomos propios: componentes que shadcn no trae o que necesitan variantes de marca (`Combobox`, `DatePicker`, `FileInput`). | `ui/` |
| `common/` | Moléculas sin conocimiento de dominio: `PageHeader`, `EmptyState`, `AsyncView`, `CardIcon`. | `ui/`, `base/` |
| `blocks/` | Organismos sin dominio: composiciones grandes reutilizables. | `ui/`, `base/`, `common/` |
| `layout/` | El chrome de la app: sidebar, header. Conoce `config/domain/navigation`. | todos los anteriores, `config/` |
| `features/<d>/components/` | UI del dominio. | todos los anteriores, su propio slice |

**Ninguno de `ui/`, `base/`, `common/`, `blocks/` puede importar de `features/`.** La flecha va en
un solo sentido. Si un componente compartido necesita saber de un dominio, no es compartido.

**No existe `components/domain/`.** Un componente que necesitan dos slices se sube a `blocks/` sin
conocimiento de dominio (recibe todo por props), o se queda duplicado hasta que el patrón esté
claro. Duplicar dos veces es más barato que la abstracción equivocada.

### Forma de un componente

```svelte
<script lang="ts">
    import type { Snippet } from 'svelte';
    import { cn } from '$lib/utils';

    interface Props {
        title: string;
        description?: string;
        onSelect?: (id: string) => void;
        actions?: Snippet;
        class?: string;
    }

    let { title, description, onSelect, actions, class: className }: Props = $props();
</script>
```

- Props tipadas con una `interface Props` nombrada. No tipos inline en el destructuring cuando hay
  más de dos props.
- Callbacks como props con prefijo `on`: `onSelect`, `onClose`, `onSubmit`. No `createEventDispatcher`.
- `class` siempre se acepta y se compone con `cn()`, para que el padre pueda ajustar espaciado sin
  añadir un div.
- Composición con snippets. Nunca `<slot>`.
- Los componentes de `base/`, `common/` y `blocks/` **no llaman servicios y no leen contexto de
  dominio**. Reciben todo por props. Eso los hace testeables y reutilizables.

### Nombres de archivo

- **PascalCase para todo componente que escribimos nosotros**: `UserCard.svelte`, `AppSidebar.svelte`.
- **kebab-case solo dentro de `ui/`**, porque es código vendorizado que se regenera con el CLI de
  shadcn y no queremos divergir de él.

La regla no es estética: hace visible de un vistazo qué código es nuestro y qué código no se toca.
Los componentes actuales en `layout/` y `features/auth/components/` están en kebab-case y hay que
renombrarlos.

---

## 10. Rutas

### Anatomía

```svelte
<!-- routes/(app)/users/+page.svelte — así de delgada -->
<script lang="ts">
    import UsersView from '$lib/features/users/components/UsersView.svelte';
    import type { PageProps } from './$types';

    let { data }: PageProps = $props();
</script>

<svelte:head><title>Users</title></svelte:head>

<UsersView users={data.users} />
```

Una página **no** importa servicios, **no** filtra ni ordena, **no** decide permisos. Si tiene más
de ~15 líneas, la lógica está en el sitio equivocado.

### Formularios

Superforms + Zod. El mismo schema valida en el servidor y en el cliente, y el formulario funciona
sin JavaScript:

```ts
export const load: PageServerLoad = async () => ({ form: await superValidate(zod(Schema)) });

export const actions = {
    create: async ({ request, locals }) => {
        const form = await superValidate(request, zod(Schema));
        if (!form.valid) return fail(400, { form });
        // ...
        return message(form, 'Created.');
    }
} satisfies Actions;
```

**Toda mutación va por POST.** Un `load` corre en GET, y SvelteKit hace prefetch de los enlaces:
un `load` que muta estado se dispara solo cuando el usuario pasa el ratón por encima de un enlace.
El logout es el caso clásico.

### Enlaces

Los `href` internos se resuelven con `resolve()` de `$app/paths` — la regla
`svelte/no-navigation-without-resolve` lo exige. No es ceremonia: es lo que hace que la app siga
funcionando si algún día se despliega bajo un subpath.

---

## 11. Errores

Una sola taxonomía, definida en `lib/core/errors.ts`:

```
NETWORK · UNAUTHORIZED · FORBIDDEN · NOT_FOUND · CONFLICT · BAD_REQUEST · SERVER_ERROR · VALIDATION · UNKNOWN
```

- `normalizeError(unknown): AppError` convierte cualquier cosa lanzada en algo con forma conocida.
  Es el único punto de entrada.
- `ApiError` mapea primero el `status` textual del backend y, si no lo reconoce, cae al código HTTP.
- **`ApiError` guarda método y URL de la request, pero nunca las cabeceras**, porque llevan el
  `Authorization` y este objeto acaba en los logs.
- El mensaje que ve el usuario sale de `getMessage()`. El stack y el payload van al log. Nunca se
  muestra un mensaje crudo del backend en la UI.

### Logging

Un único punto de salida: `lib/core/logger.ts`. Ni un `console.error` suelto en el resto del
código. Hoy la implementación es `console`; cuando quieras Sentry o logs estructurados, cambias un
archivo en vez de buscar por el repo.

`handleError` de `hooks.server.ts` y `hooks.client.ts` pasa por ahí y devuelve un mensaje seguro
para `+error.svelte`.

---

## 12. Configuración y entorno

- **Todo lo público** se lee en `src/app.config.ts` desde `$env/dynamic/public` y se expone como un
  objeto tipado. Los componentes leen `config`, nunca `env` directamente.
- **Todo lo privado** se lee con `$env/dynamic/private`, y **solo** desde archivos server-only.
- `PUBLIC_*` significa que **llega al bundle del navegador**. Asume que es visible para cualquiera.
  Un secreto nunca lleva ese prefijo.
- `.env.example` lista todas las variables con su default. Si añades una, la añades ahí en el mismo
  commit.

---

## 13. Reglas de import

Una sola forma:

```ts
import { X } from '$lib/…';     // ✅ siempre
import { X } from '../../lib/…' // ❌ nunca
import { X } from '$core/…';    // ❌ los aliases extra se eliminan
```

`svelte.config.js` mantiene solo `$lib` (el default de SvelteKit). Los seis aliases adicionales
(`$components`, `$ui`, `$core`, `$stores`, `$types`, `$utils`) se borran: no los usa nadie y cada
uno es una forma más de escribir el mismo import.

Imports relativos **solo dentro del mismo slice** (`./types`, `./components/UserCard.svelte`).
Cruzar de slice a slice o de capa a capa siempre por `$lib/`.

### Dirección de las dependencias

```
routes/            → features/, components/, config/, core/, utils/, types/
features/<d>/      → components/{ui,base,common,blocks}, core/, config/, utils/, types/
                     ✗ NO importa de otro feature salvo por su index.ts
components/layout/ → components/*, config/, features/auth (permisos)
components/blocks/ → components/{ui,base,common}
components/common/ → components/{ui,base}, core/, utils/
components/base/   → components/ui, utils/
components/ui/     → bits-ui, utils/   ✗ nada más
core/              → types/            ✗ no conoce config/ ni features/
utils/             → nada
config/domain/     → types/
*.server.ts        → cualquier cosa; nadie del cliente lo importa (el compilador lo verifica)
```

Un slice se comunica con otro **solo** a través de su `index.ts`. Si `features/orders` necesita
algo de `features/users`, lo importa de `$lib/features/users`, nunca de
`$lib/features/users/services/...`.

---

## 14. Convenciones de nombres

| Elemento | Convención | Ejemplo |
|---|---|---|
| Componentes propios | PascalCase | `UserCard.svelte` |
| Componentes en `ui/` | kebab-case (vendorizado) | `alert-dialog-content.svelte` |
| Módulos TS | kebab-case | `view-state.svelte.ts`, `feature-flags.ts` |
| Módulos con runes | sufijo `.svelte.ts` | `view-state.svelte.ts` |
| Módulos server-only | sufijo `.server.ts` | `users.server.ts` |
| Tests | junto al código | `redirect.test.ts` |
| Clases y tipos | PascalCase | `ViewState`, `ApiError`, `User` |
| Constantes de config | SCREAMING_SNAKE_CASE | `AUTH_ROUTE_PERMISSIONS` |
| Props y variables | camelCase | `userId`, `isLoading` |
| Callbacks en props | `on` + evento | `onSelect`, `onClose` |
| Booleanos | `is` / `has` / `can` | `isLoading`, `canEdit` |
| Rutas | kebab-case | `/user-settings` |

**Un solo idioma en el código: inglés.** Nombres, comentarios, mensajes de UI, mensajes de commit.
No porque el inglés sea mejor, sino porque mezclar dos idiomas obliga a decidir en cada línea.

---

## 15. Testing

No se busca cobertura. Se cubre lo que, si se rompe, rompe algo grave o silencioso.

**Obligatorio:**

| Qué | Por qué |
|---|---|
| `features/auth/permissions.ts` | La matriz completa rol × ruta, incluidos rol desconocido y ruta no declarada. Es el control de acceso. |
| `features/auth/redirect.ts` | Ya existe. Cubre los vectores de open redirect. |
| `core/errors.ts` | El mapeo status/HTTP → código. Un mapeo mal hecho muestra el mensaje equivocado en producción. |
| `createAuthHandler` | Público→pasa, sin cookies→login, token inválido→login, sin permiso→403. |
| E2E: login → dashboard → logout | El flujo que si se rompe, no entra nadie. |
| E2E: rol sin permiso no accede a su ruta prohibida | Verifica que §7 sigue siendo cierto. |

**No se testea:** componentes de presentación sin lógica, wrappers de `ui/`, ni utils triviales.
Un test que solo reafirma que el markup no cambió es lastre.

Los E2E corren contra la API externa **mockeada** (interceptación de rutas en Playwright), nunca
contra un backend real: un test que depende de la red no es una red de seguridad.

---

## 16. Anti-patrones

Todos estos existieron en el repo. Están aquí para que no vuelvan.

**❌ Devolver tokens desde un `load`**
Anula `httpOnly`. Los tokens no salen del servidor.

**❌ `$state` a nivel de módulo con datos de usuario**
Se comparte entre requests en SSR. Usa contexto.

**❌ Permisos declarados pero no aplicados**
Filtrar el menú no es autorización. El check va en el servidor.

**❌ `$effect` para notificar al padre**
```ts
$effect(() => { onchange?.(value); });   // ❌ se dispara al montar y en cada eco
```
Llama el callback en el event handler, o usa `bind:`.

**❌ `$effect` reimplementando SvelteKit**
Detectar navegación con un `previousPathname` en `$state` cuando existe `afterNavigate`.

**❌ Efectos secundarios en `load`**
Un `load` devuelve datos. No muta estado global ni escribe en stores.

**❌ Dos fuentes de verdad para el mismo dato**
Un `ViewState` con el estado y un `$state` aparte con los items. Se desincronizan.

**❌ Lógica de negocio en la página**
```svelte
const canDelete = user.role === 'admin' || user.role === 'lead';  // ❌
const canDelete = hasPermission(user.role, PermissionKey.Users);  // ✅
```

**❌ Derivar en el template**
```svelte
{#each items.filter(i => i.active).sort(byDate) as item}   <!-- ❌ -->
```
Deriva con `$derived` en el script.

**❌ Abstracciones sin consumidor**
Un store genérico, un helper o un tipo que nadie importa. Bórralo.

**❌ Dos utilidades para lo mismo**
`withLoading` y `ViewState` resolviendo el mismo problema. Elige una, borra la otra.

**❌ Mutar por GET**
Logout, borrados o cualquier cambio de estado en un `load`. El prefetch de SvelteKit los dispara solo.

---

## 17. Recetas

### Añadir una página

1. Crear `routes/(app)/<ruta>/+page.svelte` (thin) y `+page.server.ts` (`load`).
2. **Añadir la entrada en `AUTH_ROUTE_PERMISSIONS`.** Sin esto la ruta da 403 — es deliberado.
3. Si va en el menú, añadir el item en `config/domain/navigation.ts` con sus `requiredPermissions`.
4. `npm run lint && npm run check && npm run test`.

### Añadir un slice

1. `lib/features/<domain>/` con `types.ts`, `schemas.ts` y `services/<entity>.server.ts`.
2. `index.ts` exportando **solo** la API pública: tipos y, si existe, el orquestador.
3. Componentes en `components/`. El componente raíz recibe los datos por props desde la página.
4. Estado del cliente solo si hace falta: una clase con `$state` en `<domain>.svelte.ts`.
5. Tests de la lógica que tenga reglas (permisos, transformaciones, validaciones).

### Añadir un rol

1. Añadirlo a `UserRole` en `lib/types/user.ts`.
2. Añadirlo a `ROLE_LABELS`.
3. Declararlo en cada `PERMISSION_GROUPS` donde deba entrar. **Si no lo declaras, no tiene acceso
   a nada** — eso es lo correcto.
4. Actualizar el test de la matriz de permisos.

### Cambiar la marca

1. Tokens de color en `src/routes/layout.css` (`@theme`).
2. Nombre y logo: `AppSidebar.svelte` y la página de login.
3. `favicon.svg` en `lib/assets/`.

---

## 18. Definición de "terminado"

Un cambio está listo cuando:

- [ ] `npm run lint` — sin errores
- [ ] `npm run check` — cero errores **y cero warnings** (los warnings de `svelte-check` como
      `state_referenced_locally` son bugs de reactividad, no ruido)
- [ ] `npm run test` — verde
- [ ] No añade exports sin consumidor
- [ ] No añade una segunda forma de hacer algo que ya se hace
- [ ] Si toca rutas, tienen entrada en `AUTH_ROUTE_PERMISSIONS`
- [ ] Si toca permisos o auth, tiene test
- [ ] Si añade una variable de entorno, está en `.env.example`
- [ ] Este documento sigue siendo cierto — o se actualizó en el mismo commit

Ese último punto es el que importa. Un documento de arquitectura que se desincroniza del código es
peor que no tenerlo: los agentes lo leen y escriben código para un proyecto que no existe. Es
exactamente lo que le pasó al `architecture.md` anterior.
