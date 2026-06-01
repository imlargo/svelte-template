# Arquitectura SvelteKit SaaS — Guía Técnica Definitiva

> Arquitectura Domain-First Layered para aplicaciones SaaS construidas con SvelteKit 2 + Svelte 5.
> Esta guía define la estructura, patrones, convenciones y reglas de todo el proyecto.

---

## Stack

| Capa            | Tecnología        | Justificación                                                                               |
| --------------- | ----------------- | ------------------------------------------------------------------------------------------- |
| Framework       | SvelteKit 2.x     | SSR/SPA/SSG unificado, routing basado en archivos, form actions con progressive enhancement |
| UI              | Svelte 5 (Runes)  | Reactividad basada en primitivas del compilador, sin Virtual DOM                            |
| Lenguaje        | TypeScript strict | —                                                                                           |
| Estilos         | TailwindCSS v4    | —                                                                                           |
| Componentes     | shadcn-svelte     | Copia el código, sin dependencia de versión, personalizable                                 |
| Formularios     | Superforms + Zod  | Validación unificada server+client, type-safe, progressive enhancement                      |
| ORM             | Drizzle ORM       | Schema-as-code, type-safe, sin magia oculta                                                 |
| Base de datos   | PostgreSQL        | —                                                                                           |
| Auth            | Lucia Auth v3     | Sesiones en DB, control total del flujo, sin vendor lock-in                                 |
| Email           | Resend            | API simple, templates en Svelte                                                             |
| Billing         | Stripe            | Checkout sessions + webhooks                                                                |
| Archivos        | Uploadthing       | Integración nativa SvelteKit                                                                |
| Runtime         | Bun               | —                                                                                           |
| Tests unitarios | Vitest            | —                                                                                           |
| Tests E2E       | Playwright        | —                                                                                           |

---

## Principios fundamentales

**1. El servidor es parte del framework.**
SvelteKit no es un frontend que llama una API externa. Los `+page.server.ts` son el backend de cada página. La DB se consulta directamente desde el servidor, sin una capa de API intermedia para uso interno.

**2. Thin pages.**
Las páginas (`+page.svelte`) son wrappers de máximo 15 líneas. No contienen lógica, no importan stores, no calculan nada. Solo reciben `data` del servidor y montan el componente View correspondiente.

**3. El componente habla solo con el orquestador.**
Ningún componente importa stores directamente. El Feature Orchestrator es la única interfaz entre la UI y el estado.

**4. Core no sabe del negocio.**
`lib/core/` contiene infraestructura pura: podría extraerse como npm package y funcionar en cualquier SaaS sin cambios. Cualquier archivo que mencione un concepto del negocio (rol específico, plan, entidad del dominio) no pertenece a `core/`.

**5. La configuración es código, no magia.**
Los magic strings, magic numbers, thresholds y reglas de negocio viven en `lib/config/domain/` como constantes tipadas. Ningún componente o función los repite inline.

**6. Separación explícita: servidor vs cliente.**
Todo lo que corre en servidor vive en `lib/server/`. El cliente nunca importa desde `lib/server/`. El compilador de SvelteKit lo verifica y lanza error si se viola.

---

## Estructura de directorios

```
src/
├── app.html                          ← HTML base
├── app.css                           ← estilos globales, variables CSS
├── hooks.server.ts                   ← middleware global (auth, org, locale)
├── hooks.client.ts                   ← lifecycle global del cliente
│
├── lib/                              ← alias $lib — todo el código reutilizable
│   │
│   ├── core/                         ← infraestructura pura, sin lógica de negocio
│   │   ├── api/
│   │   │   ├── client.ts             ← fetch wrapper con headers de auth, base URL
│   │   │   └── errors.ts             ← ApiError, NetworkError, tipos de error HTTP
│   │   └── helpers/
│   │       ├── with-loading.svelte.ts ← helper central para manejo de estado async
│   │       └── error-message.ts       ← getErrorMessage(unknown): string
│   │
│   ├── config/
│   │   └── domain/                   ← constantes del negocio, sin lógica
│   │       ├── permissions.ts        ← PERMISSION_GROUPS, qué roles acceden a qué
│   │       ├── billing-plans.ts      ← PLAN_FEATURES, límites por tier
│   │       ├── feature-flags.ts      ← features habilitadas por plan o rol
│   │       └── pagination.ts         ← page sizes por defecto
│   │
│   ├── types/                        ← tipos TypeScript compartidos
│   │   ├── ui/
│   │   │   └── view-state.ts         ← AsyncViewState
│   │   ├── auth/
│   │   │   ├── user.ts               ← User, Session
│   │   │   └── roles.ts              ← UserRole enum
│   │   └── saas/
│   │       ├── org.ts                ← Organization, Membership, Plan
│   │       └── billing.ts            ← Subscription, Invoice
│   │
│   ├── utils/                        ← funciones puras sin efectos secundarios
│   │   ├── number.ts                 ← formatCurrency, formatPercent, formatArea
│   │   ├── date.ts                   ← formatDate, relativeTime, isExpired
│   │   └── string.ts                 ← slugify, truncate, capitalize
│   │
│   ├── stores/                       ← stores genéricos compartidos entre features
│   │   ├── filter.svelte.ts          ← createFilterStore()
│   │   └── pagination.svelte.ts      ← createPaginationStore()
│   │
│   ├── features/                     ← vertical slices por dominio
│   │   ├── auth/                     ← feature de autenticación (NO va en core)
│   │   │   ├── components/           ← LoginForm, RegisterModal, etc.
│   │   │   ├── permissions.ts        ← hasPermission(), canUseFeature()
│   │   │   └── index.svelte.ts       ← API pública del feature
│   │   └── [domain]/
│   │       ├── components/           ← componentes propios del dominio
│   │       │                            (sin prescripción de subcarpetas internas)
│   │       ├── stores/               ← estado específico de este dominio
│   │       │   └── [entity].svelte.ts
│   │       └── index.svelte.ts       ← orquestador + API pública
│   │
│   ├── components/                   ← componentes compartidos entre features
│   │   ├── ui/                       ← shadcn-svelte (NO modificar)
│   │   ├── base/                     ← átomos de la marca
│   │   ├── common/                   ← moléculas sin dominio
│   │   ├── patterns/                 ← organismos complejos sin dominio
│   │   └── domain/                   ← componentes de dominio usados por múltiples features
│   │       └── [domain]/             ← sin prescripción de subcarpetas internas
│   │
│   └── server/                       ← SOLO corre en servidor (nunca llega al bundle del cliente)
│       ├── db/
│       │   ├── schema.ts             ← Drizzle schema (tablas, relaciones, tipos)
│       │   └── index.ts              ← instancia de DB (drizzle + postgres)
│       ├── auth/
│       │   └── lucia.ts              ← configuración de Lucia Auth
│       ├── billing/
│       │   └── stripe.ts             ← Stripe client, helpers de webhooks
│       └── email/
│           └── resend.ts             ← Resend client, envío de emails
│
└── routes/                           ← SvelteKit routing
    ├── (auth)/                       ← route group sin layout de app
    │   ├── login/
    │   │   ├── +page.svelte
    │   │   └── +page.server.ts
    │   ├── register/
    │   │   ├── +page.svelte
    │   │   └── +page.server.ts
    │   └── verify/
    │       └── +page.server.ts
    │
    ├── (app)/                        ← route group con layout autenticado
    │   ├── +layout.svelte            ← sidebar + topbar
    │   ├── +layout.server.ts         ← auth guard global para toda la app
    │   │
    │   ├── dashboard/
    │   │   ├── +page.svelte          ← thin page
    │   │   └── +page.server.ts       ← load function
    │   │
    │   └── [domain]/
    │       ├── +page.svelte
    │       ├── +page.server.ts
    │       └── [id]/
    │           ├── +page.svelte
    │           └── +page.server.ts
    │
    ├── api/                          ← endpoints REST (solo para webhooks externos)
    │   └── webhooks/
    │       └── stripe/
    │           └── +server.ts
    │
    └── +layout.server.ts             ← datos globales: user, org, locale
```

---

## Capas de la arquitectura

### `lib/core/` — Infraestructura pura

Solo contiene plomería técnica. No menciona roles, planes, entidades del negocio ni reglas de dominio. Podría vivir en un npm package separado.

```typescript
// lib/core/helpers/with-loading.svelte.ts
import { getErrorMessage } from './error-message';

export interface LoadingState {
	loading: boolean;
	error: string | null;
}

export async function withLoading<T>(
	state: LoadingState,
	action: () => Promise<T>,
	opts?: { silent?: boolean }
): Promise<T> {
	state.loading = true;
	state.error = null;
	try {
		return await action();
	} catch (err) {
		if (!opts?.silent) state.error = getErrorMessage(err);
		throw err;
	} finally {
		state.loading = false;
	}
}
```

```typescript
// lib/core/helpers/error-message.ts
export function getErrorMessage(err: unknown): string {
	if (err instanceof Error) return err.message;
	if (typeof err === 'string') return err;
	return 'Error desconocido';
}
```

```typescript
// lib/core/api/client.ts
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
	const res = await fetch(`${BASE_URL}${path}`, {
		...init,
		headers: { 'Content-Type': 'application/json', ...init?.headers }
	});
	if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
	return res.json();
}

export const apiClient = {
	get: <T>(path: string) => request<T>(path),
	post: <T>(path: string, body: unknown) =>
		request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
	put: <T>(path: string, body: unknown) =>
		request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
	patch: <T>(path: string, body: unknown) =>
		request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
	delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
};
```

---

### `lib/config/domain/` — Configuración del negocio

Solo datos: constantes, mapas, tablas de configuración. Sin lógica, sin funciones. Si necesita un `if`, no pertenece acá.

```typescript
// lib/config/domain/permissions.ts
import { UserRole } from '$lib/types/auth/roles';

export const PERMISSION_GROUPS = {
	Projects: [UserRole.ADMIN, UserRole.DEAL_LEADER, UserRole.ORIGINATOR],
	EPC: [UserRole.ADMIN, UserRole.EPC_VIEW],
	Accounting: [UserRole.ADMIN, UserRole.ACCOUNTING_ACCESS, UserRole.PAYROLL_MANAGER],
	Dataroom: [UserRole.ADMIN, UserRole.DATAROOM_ACCESS]
} as const;

export type PermissionGroup = keyof typeof PERMISSION_GROUPS;
```

```typescript
// lib/config/domain/billing-plans.ts
export const PLAN_FEATURES = {
	free: {
		maxProjects: 3,
		canExport: false,
		canApiAccess: false,
		maxMembers: 2
	},
	pro: {
		maxProjects: 50,
		canExport: true,
		canApiAccess: false,
		maxMembers: 10
	},
	enterprise: {
		maxProjects: Infinity,
		canExport: true,
		canApiAccess: true,
		maxMembers: Infinity
	}
} as const;

export type Plan = keyof typeof PLAN_FEATURES;
export type PlanFeature = keyof (typeof PLAN_FEATURES)['free'];
```

---

### `lib/types/ui/view-state.ts` — Estado de vistas async

```typescript
export type AsyncViewState = 'idle' | 'loading' | 'success' | 'error' | 'empty';
```

Reemplaza múltiples booleans (`isLoading`, `hasError`, `isEmpty`) por un único estado exclusivo. Nunca se puede estar en `loading` y `error` al mismo tiempo.

---

### `lib/stores/` — Stores genéricos compartidos

Solo contiene stores que no pertenecen a ningún dominio específico y que múltiples features pueden necesitar. Los stores de dominio viven dentro de su propio feature.

---

### `lib/features/[domain]/stores/` — Estado del dominio

Cada store es una función factory que devuelve un objeto con getters reactivos. Usa `.svelte.ts` para habilitar Runes fuera de componentes. Los stores de dominio viven dentro del feature que los posee, no en una carpeta `stores/` global.

**Reglas:**

- Un store por entidad principal
- Solo maneja su estado. Sin derivaciones cruzadas entre stores.
- Siempre expone `reset()` para cleanup
- Usa `withLoading` para todas las operaciones async
- Expone estado solo mediante getters, nunca propiedades directas

```typescript
// lib/features/projects/stores/projects.svelte.ts
import { withLoading } from '$lib/core/helpers/with-loading.svelte';
import { apiClient } from '$lib/core/api/client';
import type { Project, CreateProjectInput, UpdateProjectInput } from '$lib/types/projects';

export function createProjectsStore() {
	let items = $state<Project[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let selected = $state<Project | null>(null);

	const state = {
		get loading() {
			return loading;
		},
		set loading(v: boolean) {
			loading = v;
		},
		get error() {
			return error;
		},
		set error(v: string | null) {
			error = v;
		}
	};

	async function fetch(orgId: string) {
		await withLoading(state, async () => {
			items = await apiClient.get(`/orgs/${orgId}/projects`);
		});
	}

	async function create(orgId: string, input: CreateProjectInput) {
		const created = await apiClient.post<Project>(`/orgs/${orgId}/projects`, input);
		items = [...items, created];
		return created;
	}

	async function update(id: string, input: UpdateProjectInput) {
		const updated = await apiClient.patch<Project>(`/projects/${id}`, input);
		items = items.map((p) => (p.id === id ? updated : p));
		if (selected?.id === id) selected = updated;
		return updated;
	}

	async function remove(id: string) {
		await apiClient.delete(`/projects/${id}`);
		items = items.filter((p) => p.id !== id);
		if (selected?.id === id) selected = null;
	}

	function reset() {
		items = [];
		loading = false;
		error = null;
		selected = null;
	}

	return {
		get items() {
			return items;
		},
		get loading() {
			return loading;
		},
		get error() {
			return error;
		},
		get selected() {
			return selected;
		},
		set selected(p: Project | null) {
			selected = p;
		},
		fetch,
		create,
		update,
		remove,
		reset
	};
}
```

---

### `lib/features/` — Vertical slices por dominio

Cada feature es un slice completo: tiene sus propios stores, sus propios componentes, y un orquestador que los une. La carpeta del feature es la unidad de encapsulación — todo lo que solo usa ese dominio vive adentro.

```
features/
  auth/
    components/       ← LoginForm, SessionExpiredModal, etc.
    permissions.ts    ← hasPermission(), canUseFeature() — lógica de autorización
    index.svelte.ts   ← API pública: createAuthFeature(), exports de permissions
  projects/
    components/       ← ProjectsView, ProjectCard, CreateProjectModal, etc.
    stores/
      projects.svelte.ts
      project-detail.svelte.ts
    index.svelte.ts   ← API pública: createProjectsFeature()
```

**El feature `auth/` vive aquí, no en `core/`.**
Auth no es infraestructura — sabe qué roles existen, qué planes hay, qué puede hacer un `deal_leader`. Eso es negocio. `core/` no conoce nada de eso.

**La subcarpeta `components/` dentro de cada feature** no tiene prescripción interna. El equipo decide cómo organizar adentro según la complejidad del dominio.

**`index.svelte.ts` es el único punto de entrada público del feature.** Nada fuera del feature importa desde `features/projects/stores/` o `features/projects/components/` directamente — solo desde `features/projects/`.

**Lo que hace el orquestador (`index.svelte.ts`):**

- Crea e instancia los stores del dominio
- Deriva `viewState` como `AsyncViewState`
- Calcula datos procesados (filtros, agregaciones, formatos) para que el componente no lo haga
- Expone acciones compuestas que coordinan múltiples stores
- Maneja `initialize()` y `cleanup()`

**Lo que NO hace el orquestador:**

- No contiene markup ni templates
- No importa componentes
- No hace llamadas HTTP directas (eso es del store)

```typescript
// lib/features/projects/index.svelte.ts
import { createProjectsStore } from './stores/projects.svelte';
import { createFilterStore } from '$lib/stores/filter.svelte';
import type { AsyncViewState } from '$lib/types/ui/view-state';
import type { CreateProjectInput } from '$lib/types/projects';

export function createProjectsFeature(orgId: string) {
	const projects = createProjectsStore();
	const filters = createFilterStore();

	// View state derivado — el componente nunca lo calcula
	const viewState = $derived((): AsyncViewState => {
		if (projects.loading) return 'loading';
		if (projects.error) return 'error';
		if (filteredItems.length === 0) return 'empty';
		return 'success';
	});

	// Datos procesados — listos para el template
	const filteredItems = $derived(
		projects.items.filter((p) => {
			const matchesSearch = filters.search
				? p.name.toLowerCase().includes(filters.search.toLowerCase())
				: true;
			const matchesStatus = filters.status ? p.status === filters.status : true;
			return matchesSearch && matchesStatus;
		})
	);

	// Lifecycle
	async function initialize() {
		await projects.fetch(orgId);
	}

	function cleanup() {
		projects.reset();
		filters.reset();
	}

	// Acciones compuestas
	async function createProject(input: CreateProjectInput) {
		const created = await projects.create(orgId, input);
		return created;
	}

	function selectProject(id: string) {
		projects.selected = projects.items.find((p) => p.id === id) ?? null;
	}

	return {
		get viewState() {
			return viewState;
		},
		get items() {
			return filteredItems;
		},
		get selected() {
			return projects.selected;
		},
		get error() {
			return projects.error;
		},
		get search() {
			return filters.search;
		},
		get status() {
			return filters.status;
		},
		setSearch: (v: string) => {
			filters.search = v;
		},
		setStatus: (v: string) => {
			filters.status = v;
		},
		initialize,
		cleanup,
		createProject,
		deleteProject: projects.remove,
		selectProject
	};
}
```

---

### `lib/components/` — Componentes compartidos

Cuatro niveles para componentes que se comparten entre features. Los componentes exclusivos de un dominio van en `features/[domain]/components/`, no acá.

```
ui/          ← shadcn-svelte. No se modifica. No se wrappea sin justificación.
base/        ← Átomos de la marca. Extienden o adaptan shadcn con el design system propio.
common/      ← Moléculas reutilizables sin conocimiento de dominio.
patterns/    ← Organismos complejos sin conocimiento de dominio.
domain/      ← Componentes de dominio compartidos entre múltiples features.
  [domain]/  ← Sin prescripción de subcarpetas. El equipo decide la organización interna.
```

**¿Cuándo va en `features/[domain]/components/` vs `components/domain/[domain]/`?**

- Un componente que solo usa `projects/` → `features/projects/components/`
- Un componente que necesitan `projects/` y `epc/` → `components/domain/projects/`
- Si hay duda, empieza en el feature y muévelo a `domain/` cuando se necesite reusar

**`base/` — átomos de la marca**

Wrappers con variantes propias del producto. Si shadcn tiene un Button, base tiene un AppButton que impone los colores y tamaños de la marca.

```svelte
<!-- lib/components/base/AppButton.svelte -->
<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		loading?: boolean;
	}

	let { variant = 'primary', size = 'md', loading = false, children, ...rest }: Props = $props();
</script>

<Button {variant} {size} disabled={loading || rest.disabled} {...rest}>
	{#if loading}
		<span class="spinner" />
	{/if}
	{@render children?.()}
</Button>
```

**`common/` — moléculas sin dominio**

```svelte
<!-- lib/components/common/EmptyState.svelte -->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		title: string;
		description?: string;
		action?: Snippet;
		icon?: Snippet;
	}

	let { title, description, action, icon }: Props = $props();
</script>

<div class="flex flex-col items-center gap-4 py-16 text-center">
	{#if icon}
		<div class="text-muted-foreground">
			{@render icon()}
		</div>
	{/if}
	<div>
		<p class="text-lg font-medium">{title}</p>
		{#if description}
			<p class="text-sm text-muted-foreground">{description}</p>
		{/if}
	</div>
	{#if action}
		{@render action()}
	{/if}
</div>
```

**`features/[domain]/components/` — componentes del dominio**

El componente raíz del feature (el que instancia el orquestador) vive aquí. Los demás componentes del dominio también, sin prescripción de cómo organizarlos internamente.

```svelte
<!-- lib/features/projects/components/ProjectsView.svelte -->
<script lang="ts">
	import { createProjectsFeature } from '$lib/features/projects';
	import ProjectCard from './ProjectCard.svelte';
	import ProjectsSkeleton from './ProjectsSkeleton.svelte';
	import CreateProjectModal from './CreateProjectModal.svelte';
	import EmptyState from '$lib/components/common/EmptyState.svelte';
	import ErrorState from '$lib/components/common/ErrorState.svelte';
	import { createDisclosure } from '$lib/stores/disclosure.svelte';

	let { orgId }: { orgId: string } = $props();

	const feature = createProjectsFeature(orgId);
	const modal = createDisclosure();

	$effect(() => {
		feature.initialize();
		return () => feature.cleanup();
	});
</script>

<div class="flex flex-col gap-6">
	<div class="flex items-center justify-between">
		<input
			type="search"
			value={feature.search}
			oninput={(e) => feature.setSearch(e.currentTarget.value)}
			placeholder="Buscar proyectos..."
			class="input"
		/>
		<button onclick={modal.open} class="btn-primary"> Nuevo proyecto </button>
	</div>

	{#if feature.viewState === 'loading'}
		<ProjectsSkeleton />
	{:else if feature.viewState === 'error'}
		<ErrorState message={feature.error} onRetry={feature.initialize} />
	{:else if feature.viewState === 'empty'}
		<EmptyState title="No hay proyectos" description="Crea el primero para comenzar">
			{#snippet action()}
				<button onclick={modal.open} class="btn-primary">Crear proyecto</button>
			{/snippet}
		</EmptyState>
	{:else}
		<div class="grid grid-cols-3 gap-4">
			{#each feature.items as project (project.id)}
				<ProjectCard
					{project}
					onSelect={() => feature.selectProject(project.id)}
					onDelete={() => feature.deleteProject(project.id)}
				/>
			{/each}
		</div>
	{/if}
</div>

{#if modal.isOpen}
	<CreateProjectModal
		onClose={modal.close}
		onCreate={async (input) => {
			await feature.createProject(input);
			modal.close();
		}}
	/>
{/if}
```

---

### `routes/` — Páginas

Las páginas son wrappers. No contienen lógica, no importan stores, no calculan nada. Solo:

1. Reciben `data` del servidor
2. Montan el componente View
3. Definen metadata de la página

```svelte
<!-- routes/(app)/projects/+page.svelte -->
<script lang="ts">
	import ProjectsView from '$lib/features/projects/components/ProjectsView.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Proyectos — {data.org.name}</title>
</svelte:head>

<ProjectsView orgId={data.org.id} />
```

```typescript
// routes/(app)/projects/+page.server.ts
import { db } from '$lib/server/db';
import { projects } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const data = await db.select().from(projects).where(eq(projects.orgId, locals.org.id));

	return { projects: data };
};
```

---

## Patrones clave

### `features/auth/` — Feature de autenticación y autorización

Auth no es infraestructura core — sabe qué roles existen, qué planes tienen qué capacidades, qué puede hacer un `deal_leader`. Por eso vive en `features/`, no en `core/`.

```typescript
// lib/features/auth/permissions.ts
import { PERMISSION_GROUPS, PLAN_FEATURES } from '$lib/config/domain';
import type { User, Org, PermissionGroup, PlanFeature } from '$lib/types';

export function hasPermission(user: User, group: PermissionGroup): boolean {
	if (user.role === 'admin') return true;
	return (PERMISSION_GROUPS[group] as readonly string[]).includes(user.role);
}

export function canUseFeature(org: Org, feature: PlanFeature): boolean {
	const value = PLAN_FEATURES[org.plan][feature];
	if (typeof value === 'number') return value > 0;
	return Boolean(value);
}

export function isWithinPlanLimit(org: Org, feature: PlanFeature, current: number): boolean {
	const limit = PLAN_FEATURES[org.plan][feature];
	if (typeof limit !== 'number') return false;
	return current < limit;
}
```

```typescript
// lib/features/auth/index.svelte.ts — API pública del feature
export { hasPermission, canUseFeature, isWithinPlanLimit } from './permissions';
export { createAuthFeature } from './auth-feature.svelte';
```

El `index.svelte.ts` es el único punto de entrada. Nada importa desde `features/auth/permissions` directamente — siempre desde `features/auth/`.

---

### Auth Guard — una sola vez en el layout

```typescript
// routes/(app)/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(303, '/login');
	if (!locals.org) throw redirect(303, '/onboarding');

	return {
		user: locals.user,
		org: locals.org
	};
};
```

Todo lo que esté dentro de `routes/(app)/` queda protegido automáticamente. No hay middleware global, no hay lógica duplicada por página.

---

### Form Actions — mutaciones sin fetch manual

En SvelteKit, las mutaciones van por form actions, no por fetch/axios desde el cliente. El navegador lo maneja con o sin JavaScript.

```typescript
// routes/(app)/projects/+page.server.ts
import { superValidate, fail } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const createProjectSchema = z.object({
	name: z.string().min(2).max(100),
	description: z.string().optional()
});

export const load: PageServerLoad = async ({ locals }) => {
	const form = await superValidate(zod(createProjectSchema));
	return { form };
};

export const actions = {
	create: async ({ request, locals }) => {
		const form = await superValidate(request, zod(createProjectSchema));
		if (!form.valid) return fail(400, { form });

		await db.insert(projects).values({
			...form.data,
			orgId: locals.org.id
		});

		return { form };
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		await db.delete(projects).where(and(eq(projects.id, id), eq(projects.orgId, locals.org.id)));

		return { success: true };
	}
};
```

```svelte
<!-- En el componente — progressive enhancement con use:enhance -->
<form method="POST" action="?/create" use:enhance>
	<input name="name" />
	<button type="submit">Crear</button>
</form>
```

---

### `createDisclosure` — reemplaza `isXxxOpen = false`

```typescript
// lib/composables/common/disclosure.svelte.ts
import { readonly } from 'svelte/reactivity';

export function createDisclosure(initial = false) {
	let isOpen = $state(initial);

	return {
		get isOpen() {
			return isOpen;
		},
		open: () => {
			isOpen = true;
		},
		close: () => {
			isOpen = false;
		},
		toggle: () => {
			isOpen = !isOpen;
		}
	};
}
```

Uso:

```svelte
<script lang="ts">
	const modal = createDisclosure();
	const dropdown = createDisclosure();
	const sidebar = createDisclosure(true); // abierto por defecto
</script>
```

---

### `createFilterPanel` — reemplaza N refs de filtros paralelos

```typescript
// lib/composables/common/filter-panel.svelte.ts
export function createFilterPanel<T extends Record<string, unknown>>(initial: T) {
	let filters = $state<T>({ ...initial });
	let isOpen = $state(false);

	const hasActiveFilters = $derived(
		Object.entries(filters).some(([_, v]) => v !== '' && v !== null && v !== undefined)
	);

	function set<K extends keyof T>(key: K, value: T[K]) {
		filters[key] = value;
	}

	function reset() {
		filters = { ...initial };
	}

	return {
		get filters() {
			return filters;
		},
		get isOpen() {
			return isOpen;
		},
		get hasActiveFilters() {
			return hasActiveFilters;
		},
		set,
		reset,
		open: () => {
			isOpen = true;
		},
		close: () => {
			isOpen = false;
		},
		toggle: () => {
			isOpen = !isOpen;
		}
	};
}
```

Uso:

```typescript
const filterPanel = createFilterPanel({
	search: '',
	status: '',
	from: null as Date | null,
	to: null as Date | null
});

// En el template
filterPanel.set('status', 'active');
filterPanel.filters.search;
filterPanel.hasActiveFilters;
```

---

### Multi-tenancy con contexto de Svelte

La organización activa se propaga via contexto de Svelte. Ningún componente la importa de un store global — la recibe del árbol de componentes.

```svelte
<!-- routes/(app)/+layout.svelte -->
<script lang="ts">
	import { setContext } from 'svelte';
	import type { LayoutData } from './$types';

	let { data, children } = $props();

	setContext('org', data.org);
	setContext('user', data.user);
</script>

{@render children()}
```

```typescript
// En cualquier componente descendiente
import { getContext } from 'svelte';
import type { Organization, User } from '$lib/types/saas/org';

const org = getContext<Organization>('org');
const user = getContext<User>('user');
```

---

## Svelte 5 Runes — referencia rápida

| Rune                  | Equivalente Vue 3       | Uso                                                          |
| --------------------- | ----------------------- | ------------------------------------------------------------ |
| `$state(val)`         | `ref(val)`              | Estado reactivo primitivo                                    |
| `$state({ })`         | `reactive({ })`         | Estado reactivo de objeto                                    |
| `$derived(fn)`        | `computed(() => ...)`   | Valor derivado, se recalcula cuando cambian sus dependencias |
| `$effect(() => {})`   | `watchEffect(() => {})` | Side effect reactivo                                         |
| `$effect` con cleanup | `onUnmounted`           | `$effect(() => { return () => cleanup() })`                  |
| `$props()`            | `defineProps()`         | Props del componente                                         |
| `$bindable()`         | `defineModel()`         | Prop con two-way binding                                     |

**Reglas de Runes:**

- Solo funcionan en archivos `.svelte` y `.svelte.ts`
- En archivos `.ts` normales, no están disponibles
- `$derived` no puede tener side effects (solo lectura)
- `$effect` no puede ser async directamente — wrappear con una función interna

```typescript
// $effect async — patrón correcto
$effect(() => {
	let cancelled = false;

	async function run() {
		const data = await fetchData();
		if (!cancelled) result = data;
	}

	run();
	return () => {
		cancelled = true;
	};
});
```

---

## Reglas de importación

```
routes/
  → importa desde features/[domain]/components/ (el componente View raíz)
  → NO importa stores directamente
  → NO importa desde features/[domain]/stores/

features/[domain]/components/
  → importa desde features/[domain]/ (su propio orquestador via index)
  → importa desde components/base/, common/, patterns/, domain/
  → NO importa desde stores/ directamente
  → NO importa desde otros features directamente (solo si es shared en components/domain/)

features/[domain]/index.svelte.ts (orquestador)
  → importa desde features/[domain]/stores/ (sus propios stores)
  → importa desde lib/stores/ (stores genéricos: filter, pagination)
  → importa desde lib/config/, lib/types/, lib/utils/
  → NO importa componentes
  → NO hace llamadas HTTP

features/[domain]/stores/
  → importa desde lib/core/ (withLoading, apiClient)
  → importa desde lib/types/, lib/config/
  → NO importa desde features/ ni components/

features/auth/
  → importa desde lib/config/domain/ (PERMISSION_GROUPS, PLAN_FEATURES)
  → importa desde lib/types/
  → NO importa desde lib/core/ (no es infraestructura)

lib/stores/ (genéricos)
  → importa desde lib/core/, lib/types/
  → NO importa desde features/ ni components/

lib/components/base/, common/, patterns/
  → importa de los niveles por debajo en la pirámide
  → NO importa desde features/ ni stores/

lib/components/domain/[domain]/
  → importa desde features/[domain]/ (si necesita el orquestador)
  → importa desde components/base/, common/, patterns/
  → NO importa desde features de otros dominios directamente

lib/core/
  → importa desde lib/types/ (solo tipos)
  → NO importa de ninguna otra carpeta de lib/

lib/server/
  → importa desde lib/types/, lib/config/
  → solo puede ser importado desde routes/ y hooks.server.ts
  → NUNCA llega al bundle del cliente
```

---

## Convenciones de naming

| Elemento                | Convención                | Ejemplo                                     |
| ----------------------- | ------------------------- | ------------------------------------------- |
| Archivos de componente  | PascalCase                | `ProjectCard.svelte`                        |
| Archivos de store       | kebab-case + `.svelte.ts` | `projects.svelte.ts`                        |
| Archivos de feature     | kebab-case + `.svelte.ts` | `index.svelte.ts`                           |
| Archivos de utils       | kebab-case                | `number.ts`                                 |
| Factory de store        | `create[X]Store`          | `createProjectsStore`                       |
| Factory de feature      | `create[X]Feature`        | `createProjectsFeature`                     |
| Factory de composable   | `create[X]`               | `createDisclosure`, `createFilterPanel`     |
| Constantes de config    | SCREAMING_SNAKE_CASE      | `PERMISSION_GROUPS`, `PLAN_FEATURES`        |
| Tipos e interfaces      | PascalCase                | `Project`, `Organization`, `AsyncViewState` |
| Enums                   | PascalCase                | `UserRole`, `ProjectStatus`                 |
| Props de componente     | camelCase                 | `orgId`, `onClose`, `initialData`           |
| Event handlers en props | `on[Event]`               | `onClose`, `onCreate`, `onDelete`           |

---

## Anti-patrones a evitar

**❌ Importar stores en componentes directamente**

```svelte
<!-- MAL -->
<script>
	import { createProjectsStore } from '$lib/stores/projects/projects.svelte';
	const store = createProjectsStore(); // el componente conoce la implementación
</script>
```

**✅ Siempre a través del orquestador**

```svelte
<script>
	import { createProjectsFeature } from '$lib/features/projects';
	const feature = createProjectsFeature(orgId);
</script>
```

---

**❌ Lógica de negocio en páginas**

```svelte
<!-- MAL — la página sabe demasiado -->
<script>
	import { UserRole } from '$lib/types/auth/roles';
	const canDelete = user.role === UserRole.ADMIN || user.role === UserRole.DEAL_LEADER;
</script>
```

**✅ Los permisos van en `lib/features/auth/`**

```svelte
<script>
	import { hasPermission } from '$lib/features/auth';
	const canDelete = hasPermission(user, 'Projects');
</script>
```

---

**❌ Fetch manual en componentes para mutaciones**

```svelte
<!-- MAL -->
<script>
	async function handleCreate() {
		await fetch('/api/projects', { method: 'POST', body: JSON.stringify(data) });
	}
</script>
```

**✅ Form actions para mutaciones**

```svelte
<form method="POST" action="?/create" use:enhance>
	<!-- progressive enhancement incluido -->
</form>
```

---

**❌ Lógica de derivación en el template**

```svelte
<!-- MAL — el template calcula cosas -->
{#each items.filter(p => p.status === 'active').sort((a,b) => ...) as item}
```

**✅ Los datos procesados vienen del orquestador**

```svelte
<!-- BIEN — el template solo renderiza -->
{#each feature.activeItems as item}
```

---

**❌ Múltiples booleans de estado**

```typescript
// MAL
let isLoading = $state(false);
let hasError = $state(false);
let isEmpty = $state(false);
// pueden ser true simultáneamente — estado incoherente
```

**✅ AsyncViewState como estado único exclusivo**

```typescript
// BIEN
const viewState = $derived((): AsyncViewState => {
	if (store.loading) return 'loading';
	if (store.error) return 'error';
	if (!store.items.length) return 'empty';
	return 'success';
});
```

---

**❌ Lógica de negocio en `lib/core/`**

```typescript
// MAL — core sabe de roles del negocio
// lib/core/auth/permissions.ts
export function hasPermission(user, group) {
	return PERMISSION_GROUPS[group].includes(user.role); // conoce roles del negocio
}
```

**✅ `core/` solo tiene infraestructura pura**

```
lib/core/              ← withLoading, apiClient, getErrorMessage — sin negocio
lib/features/auth/     ← hasPermission, canUseFeature — lógica de negocio de auth
lib/config/domain/     ← PERMISSION_GROUPS, PLAN_FEATURES — configuración del negocio
```
