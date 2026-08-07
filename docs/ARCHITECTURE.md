# Arquitectura del template

> Especificación del estado objetivo. Este documento define **qué es** el template, **cómo se
> construye sobre él** y **qué está prohibido**. Es el contrato con cualquier persona o agente que
> toque el repo.
>
> Sustituye a `architecture.md` (que describía un proyecto distinto y debe borrarse).
> El plan para llegar aquí desde el estado actual está en `AUDIT.md`.

Verificado contra `@sveltejs/kit@2.61.1` y `svelte@5.56.0` — las versiones instaladas.

---

(Deprecado pq es uno muy antiguo)

## 1. Qué es esto

Un punto de partida para aplicaciones web con interfaz autenticada que consumen **una API externa
ya existente**. Clonas, configuras la URL de la API, y empiezas a escribir pantallas.

**SvelteKit es full-stack, y la capa de servicios es isomorfa.** Un servicio se instancia igual
desde un `+page.server.ts` que desde un componente: el mismo código, el mismo tipado, la misma
API. Lo único que cambia es de dónde sale el token. Esta es la decisión que gobierna todo el resto
del documento, y el motivo por el que `air` (un wrapper de `fetch`, sin dependencias de Node) es
el cliente HTTP.

Que sea posible desde ambos lados no significa que dé igual: §5 fija cuándo se usa cada uno.

### Qué NO es

- **No tiene base de datos.** No hay ORM, no hay migraciones, no hay `$lib/server/db`. La
  persistencia vive en la API externa.
- **No es un framework.** No hay generadores, ni plugins, ni convenciones mágicas. Lo que ves en
  `src/` es todo lo que hay.
- **No es una librería.** No se publica ni se versiona. Se clona y diverge.
- **No resuelve billing, emails, uploads, i18n ni multi-tenancy.** Cuando un proyecto lo necesite,
  se añade en ese proyecto.

### La regla que mantiene esto vivo

> **Se borra lo que no se va a usar, no lo que no se usa todavía.**

La distinción importa, y es fácil equivocarse en las dos direcciones.

Un template existe precisamente para traer resuelto lo que vas a necesitar. `Disclosure` no tiene
consumidores hoy y los tendrá el primer día que abras un modal: **eso se queda**. Aplicar "cero
usos → borrar" a un template lo vacía hasta dejarlo inútil.

Lo que se borra es lo que está muerto **por diseño**, no por calendario:

- Código que ningún camino puede alcanzar (`ApiError.isShape`, si `air` ya normaliza).
- Código para una forma de trabajar que este template descartó (`ValidationError`, cuando la
  validación de formularios la hace Superforms).
- Configuración de una pieza que no existe (`PUBLIC_AUTH_BASE_URL`, sin servicio de auth aparte).
- Código que contradice una regla de este documento. Si §8 dice que los filtros van en la URL, un
  `FilterStore` en memoria no es una utilidad pendiente de estrenar: es una trampa.
- Segundas formas de hacer algo que ya se hace: barrels, alias de funciones (`resolveRole` sobre
  `normalizeRole`), azúcar sobre un método que ya existe (`isAuth()` sobre `is('UNAUTHORIZED')`).

La prueba: **¿existe un caso de uso previsto para esto en este template?** Si la respuesta necesita
un "bueno, si algún día...", está muerto. Si es "el primer CRUD que escriba", se queda.

Lo que sí es absoluto: cero exports sin consumidor **ni caso de uso previsto**. Todo lo que
sobra es una decisión que vuelves a tomar cada vez que abres el repo, y una pista falsa para
cualquier agente que lo lea.

---

## 2. Stack

Exactamente lo que hay en `package.json`. Nada más.

| Capa         | Herramienta                      | Nota                                                    |
| ------------ | -------------------------------- | ------------------------------------------------------- |
| Framework    | SvelteKit 2                      | Routing por archivos, load functions, form actions      |
| UI           | Svelte 5 (runes)                 | `runes: true` forzado en `svelte.config.js`             |
| Lenguaje     | TypeScript strict                | —                                                       |
| Estilos      | TailwindCSS v4                   | CSS-first con `@theme`; sin `tailwind.config.ts`        |
| Componentes  | shadcn-svelte sobre bits-ui      | Vendorizado en `lib/components/ui/`. **No se modifica** |
| Formularios  | Superforms + Zod                 | Validación compartida servidor/cliente                  |
| Cliente HTTP | `@korastd/air`                   | Envuelto en `lib/core/api`                              |
| Iconos       | `@lucide/svelte`                 | Import por icono, nunca el barrel                       |
| Toasts       | `svelte-sonner`                  | Un `<Toaster />` en el layout raíz                      |
| Tests        | Vitest + Playwright              | Unit en Node, componentes en navegador, E2E             |
| Calidad      | ESLint + Prettier + svelte-check | Los tres bloquean                                       |

**Añadir una dependencia requiere justificarla en el PR.** El coste de una dependencia no es su
tamaño: es que alguien tenga que entenderla dentro de un año.

---

## 3. Principios

**1. El refresh token nunca llega al navegador.**
Es la única línea que no se cruza. El access token sí puede estar en el cliente —es de vida
corta y es lo que hace posible la capa de servicios isomorfa— pero el refresh token vive en una
cookie `httpOnly` y solo el servidor lo toca. Ver §7.

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
├── hooks.server.ts                ← auth + autorización + cabeceras + handleError
├── hooks.client.ts                ← handleError del cliente
│
├── lib/
│   ├── core/                      ← infraestructura. No sabe nada del negocio.
│   │   ├── api.ts                 ← createApiClient (air + baseURL + Authorization)
│   │   ├── service.ts             ← BaseService
│   │   ├── errors.ts              ← AppError, ApiError, ValidationError, normalizeError
│   │   ├── logger.ts              ← interfaz `Logger` + `logger` — único punto de salida de logs
│   │   ├── permissions.ts         ← checks de acceso puros; reciben la matriz por argumento
│   │   └── query.svelte.ts        ← Query<T> + createQuery
│   │
│   ├── config/                     ← plano, sin subcarpetas: 3 archivos no justifican una.
│   │   ├── app.ts                 ← configuración leída de env, tipada. Único objeto `config`.
│   │   ├── permissions.ts         ← roles, permisos `resource:action`, tabla ruta→permiso
│   │   └── navigation.ts          ← items del menú
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
│   │       │   └── <entity>.ts        ← isomorfo: servidor y cliente (§6)
│   │       ├── <domain>.svelte.ts     ← orquestador (solo si hace falta)
│   │       ├── components/            ← UI del dominio
│   │       └── *.test.ts              ← tests junto al código
│   │
│   ├── components/
│   │   ├── ui/                    ← shadcn-svelte vendorizado. NO SE TOCA.
│   │   ├── base/                  ← átomos propios sobre ui/ o bits-ui
│   │   ├── common/                ← moléculas sin dominio (PageHeader, EmptyState, AsyncView)
│   │   └── layout/                ← chrome de la app (sidebar, header)
│   │                                 (blocks/ es un nivel previsto, sin componentes todavía)
│   │
│   └── assets/
│
├── routes/
│   ├── +layout.svelte             ← ModeWatcher, Toaster, skip link, contexto de auth
│   ├── +layout.server.ts          ← user + accessToken (nunca el refresh)
│   ├── +error.svelte
│   ├── (auth)/                    ← login, logout, authorize — sin sesión
│   └── (app)/                     ← todo lo autenticado
│       ├── +layout.svelte         ← sidebar + header
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

**No hay barrels. Ninguno, en ninguna capa.** Ni `lib/index.ts`, ni `core/index.ts`, ni
`components/common/index.ts`, ni `features/<domain>/index.ts`. Todo se importa por su ruta real:

```ts
import AsyncView from '$lib/components/common/AsyncView.svelte'; // ✅
import { AsyncView } from '$lib/components/common'; // ❌
```

Tres razones, en orden de importancia:

1. **Ocultan de dónde viene cada cosa.** Un import por ruta real te dice el archivo. Un barrel te
   obliga a abrirlo para averiguarlo, y eso es exactamente el trabajo que un agente hace mal.
2. **Arrastran módulos al bundle.** Importar un símbolo de un barrel evalúa el módulo entero. El
   tree-shaking lo arregla a veces; los efectos de importación y las dependencias transitivas, no.
   En `features/auth`, donde conviven módulos server-only (`session.server.ts`) con isomorfos
   (`services/`, `context.ts`), un barrel es la forma más fácil de arrastrar `$env/dynamic/private`
   al navegador sin enterarte.
3. **Son una segunda forma de importar lo mismo**, y eso ya lo prohíbe el principio 4.

**Los aliases sí se quedan**, y no contradicen lo anterior: un alias resuelve a un archivo
concreto, así que sigues viendo qué importas y no arrastras nada extra. Lo que hace un barrel
—ocultar el origen y evaluar el módulo entero— un alias no lo hace.

```js
// svelte.config.js
alias: {
    $components: './src/lib/components',   // el más usado
    $ui: './src/lib/components/ui',
    $core: './src/lib/core',
    $hooks: './src/lib/hooks',
    $types: './src/lib/types',
    $utils: './src/lib/utils'
}
```

La única regla: **un alias debe apuntar a un directorio que exista.** Un alias huérfano es peor
que no tenerlo, porque el editor lo autocompleta y el fallo aparece en build. (`$stores` apuntaba
a `src/lib/stores/` después de que esa carpeta pasara a ser `hooks/`; por eso ahora es `$hooks`.)

**Un módulo de `core/` es un archivo, no una carpeta.** Una carpeta por módulo obliga a un
`index.ts` por módulo, que es justo el barrel intermedio que la regla anterior prohíbe. La carpeta
aparece cuando un módulo necesita de verdad dos o más archivos.

**`lib/types/` es residual, no un almacén.** Un tipo vive en `lib/types/` solo si lo consumen dos
o más slices (o el slice y `app.d.ts`). En la práctica eso significa `User` y poco más. Todo lo
demás vive en `features/<domain>/types.ts`.

**Un slice puede no tener orquestador.** Si el dato llega por `load` y la página solo lo renderiza,
no hay nada que orquestar. El orquestador aparece cuando hay estado del cliente que coordinar —
no antes.

---

## 5. Flujo de datos

```
                    ┌─────────────────────┐
                    │   SvelteKit server  │──────┐
   Navegador ──────►│  load / actions     │      │
        │           └─────────────────────┘      ├──────► API externa
        │              ▲  refresh_token (httpOnly, no sale de aquí)
        │              │                         │
        └──────────────┴─── access_token ────────┘
             (en memoria, vida corta)
```

Los dos caminos existen y usan **el mismo servicio**. La diferencia es de dónde sale el token:

| Origen                                                             | Token                | Vía                                        |
| ------------------------------------------------------------------ | -------------------- | ------------------------------------------ |
| `+page.server.ts`, `+layout.server.ts`, actions, `hooks.server.ts` | `locals.accessToken` | `new UsersService(locals.accessToken)`     |
| Componente, orquestador, event handler                             | contexto de auth     | `new UsersService(() => auth.accessToken)` |

### Cuándo se usa cada uno

Que ambos sean posibles no significa que sean intercambiables. Por defecto, **servidor**:

| Caso                                                             | Dónde                     | Por qué                                                                                               |
| ---------------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------- |
| Datos del primer render                                          | `load` en el servidor     | Llegan con el HTML: sin waterfall, sin flash de loading, indexables, y funcionan con JS deshabilitado |
| Datos que comparten varias rutas hijas                           | `+layout.server.ts`       | Se propagan por `data`                                                                                |
| Mutación desde un formulario                                     | form action + Superforms  | Progressive enhancement gratis                                                                        |
| Búsqueda incremental, scroll infinito, polling, refresco parcial | Servicio desde el cliente | Un round-trip menos y no re-ejecuta el `load` de toda la página                                       |
| Mutación optimista con rollback                                  | Servicio desde el cliente | Necesitas el control del ciclo, que una action no te da                                               |
| Cualquier cosa que requiera un secreto distinto del access token | Servidor, obligatorio     | Ese secreto no puede salir                                                                            |

La regla práctica: **si el dato hace falta para pintar la página, va por `load`. Si es una
interacción posterior del usuario, puede ir por el cliente.** Empieza siempre por el servidor y
muévete al cliente cuando tengas una razón concreta.

### Consecuencias de llamar desde el cliente

Tres cosas que hay que aceptar conscientemente, no descubrir después:

1. **La API externa necesita CORS** configurado para el origen de la app.
2. **El access token es visible para el JavaScript de la página.** Un XSS puede usarlo mientras
   sea válido. Por eso su vida debe ser corta y por eso el refresh token no acompaña (§7).
3. **No hay SSR para ese dato.** La primera pintura no lo tiene, así que necesitas un estado de
   carga real — es justo el caso de uso de `Query` (§8).

### Sobre remote functions

SvelteKit tiene `query` / `form` / `command` / `prerender` en archivos `.remote.ts`, que darían un
tercer camino con tipado extremo a extremo. **Están marcadas como experimentales en la versión
instalada** (`kit.experimental.remoteFunctions`, por defecto `false`, documentadas en los tipos
como _"not yet stable and may be changed or removed at any time"_). Por eso el template no las usa.
Cuando se estabilicen serán una alternativa al camino cliente, no un reemplazo de la capa de
servicios.

---

## 6. Servicios y acceso a la API

Un servicio encapsula las llamadas a la API externa de un dominio. **Es isomorfo: el mismo archivo
se usa desde el servidor y desde el cliente.**

```ts
// lib/features/users/services/users.ts
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

Un servicio **no importa nada específico de un entorno**: ni `$env/dynamic/private`, ni `node:*`,
ni `$app/state`. Solo `BaseService`, tipos, y como mucho constantes de `config/`. Ese es el
requisito que lo mantiene isomorfo, y es fácil de romper sin darse cuenta.

### El token

`BaseService` acepta el token como valor o como función. No es una comodidad: la forma función es
lo que permite que un servicio de vida larga en el cliente vea el token **actual** en cada request,
en vez de capturar el que había cuando se construyó.

```ts
// lib/core/service.ts
export class BaseService {
	protected api: AirClient;

	constructor(token: string | (() => string | null) = '') {
		this.api = createApiClient({
			getToken: () => (typeof token === 'function' ? token() : token)
		});
	}
}
```

`air` resuelve `headers` en cada llamada, así que la función se evalúa por request, no una vez.

### Uso desde el servidor

```ts
// routes/(app)/users/+page.server.ts
import { UsersService } from '$lib/features/users/services/users';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const users = new UsersService(locals.accessToken ?? '');
	return { users: await users.list({ search: url.searchParams.get('q') ?? undefined }) };
};
```

### Uso desde el cliente

El token sale del contexto de auth (§8), nunca de un singleton de módulo:

```svelte
<script lang="ts">
	import { getAuth } from '$lib/features/auth/context';
	import { UsersService } from '$lib/features/users/services/users';
	import { createQuery } from '$lib/core/query.svelte';

	const auth = getAuth();
	const users = new UsersService(() => auth().accessToken);
	const search = createQuery<User[]>();

	async function onSearch(q: string) {
		await search.run(() => users.list({ search: q }));
	}
</script>
```

### Cuándo un servicio SÍ es server-only

Si un servicio necesita un secreto que no puede salir del servidor (una API key de un tercero, un
token de servicio), deja de ser isomorfo y **debe** llevar sufijo `.server.ts`. SvelteKit trata
como server-only los módulos bajo `$lib/server/` y cualquier archivo con `.server.` en el nombre:
si código del navegador lo importa, directa o indirectamente, el build falla y muestra la cadena
de imports completa.

Es la excepción, no la norma. La norma es `services/<entity>.ts`.

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

- Sesión por **cookies `httpOnly`** (`access_token`, `refresh_token`), en
  `features/auth/session.server.ts`: tres funciones (`getSession`, `setSession`, `clearSession`),
  con los nombres y las opciones en un solo sitio y configuradas desde env. El sufijo `.server`
  hace que el compilador impida que el navegador lo importe.
- `hooks.server.ts` monta `handleAuth`, que en cada request: decide si la ruta es pública,
  lee las cookies, resuelve el usuario contra la API (`/auth/me`), **comprueba el permiso de la
  ruta**, y puebla `locals`.
- El login es una **form action**. El callback de OAuth es un **`+server.ts`**. El logout es una
  **form action POST**.
- **No hay registro.** Un alta pública es una decisión de producto, no infraestructura: cuando un
  proyecto la necesite, se escribe ahí con las reglas de ese backend.

### Los dos tokens no son simétricos

Esta es la parte que hay que entender bien, porque la capa de servicios isomorfa depende de ella.

|                               | Access token                             | Refresh token           |
| ----------------------------- | ---------------------------------------- | ----------------------- |
| Cookie `httpOnly`             | sí                                       | sí                      |
| Llega al navegador vía `data` | **sí**                                   | **nunca**               |
| Dónde vive en el cliente      | memoria (contexto), nunca `localStorage` | no existe en el cliente |
| Vida                          | corta (minutos, la fija la API)          | larga (días)            |
| Si hay XSS                    | se puede usar mientras no expire         | sigue a salvo           |

`+layout.server.ts` devuelve el usuario y el access token. **No devuelve el refresh token.**

```ts
// src/routes/+layout.server.ts
export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ?? null,
		accessToken: locals.accessToken ?? null // el refresh se queda en el servidor
	};
};
```

El razonamiento: exponer el access token es el precio de tener servicios que funcionan desde el
cliente, y es un precio acotado si el token dura poco. Exponer el refresh token no compra nada
—el cliente nunca necesita refrescar por su cuenta, para eso está el servidor— y convierte un XSS
en una sesión permanente para el atacante. Por eso uno sale y el otro no.

**Corolario que hay que respetar:** si tu API emite access tokens de larga duración, esta
arquitectura pierde su garantía. En ese caso, o acortas la vida del token en la API, o renuncias
al camino cliente y usas solo `load` y actions.

**Las dos cookies comparten `maxAge`, y es deliberado.** Sin flujo de refresh, una cookie de
acceso más corta no cierra ninguna ventana: el handler exige las dos cookies, así que lo único que
consigue es echar al usuario antes. Separar las vidas y añadir el refresh es un solo cambio, y va
junto. Está escrito también en `session.server.ts`, que es donde alguien lo va a leer.

### El check de autorización va en el servidor, y tiene dos ejes

La autenticación es central: o hay sesión válida o no la hay, y una ruta que se olvida de
preguntarlo no puede ser una ruta que se abre. La **autorización** está deliberadamente partida en
dos, porque las dos mitades de una app full-stack no tienen la misma forma.

**Páginas.** Son un árbol que el usuario navega, así que se declaran como un árbol
(`AUTH_ROUTE_PERMISSIONS`: prefijo de ruta → `Permission`) y se evalúan **una vez, en el hook**,
antes de que corra ningún `load`. No declarada equivale a denegada, así que una página nueva no
puede salir abierta por olvido:

```ts
if (!isDataRequest(pathname)) {
	const required = permissionForRoute(AUTH_ROUTE_PERMISSIONS, pathname);
	if (!required) error(403, 'You do not have access to this page.');
	event.locals.requirePermission(required);
}
```

**Endpoints.** No son un árbol. Una misma ruta responde a varios métodos que pueden necesitar
permisos distintos —leer una colección y borrar de ella no son lo mismo—, y eso una tabla indexada
por path no sabe decirlo. Cada handler declara el suyo, en su primera línea:

```ts
export const DELETE: RequestHandler = async ({ params, locals }) => {
	locals.requirePermission('users:delete');
	// ...
};
```

Meter `/api/**` en la tabla de páginas no es una simplificación, es un bug: el hook juzga el
endpoint como si fuera una página, no encuentra entrada, y devuelve 403 a todo el mundo
—incluido el admin— antes de que el handler llegue a correr.

**Lo que sí comparten** es quién tiene cada permiso (`ROLE_PERMISSIONS`) y el objeto que lo aplica
(`locals.requirePermission`, en `features/auth/guard.server.ts`). Lo que no comparten es cómo una
ruta dice lo que necesita, ni cómo vuelve la negativa: una página recibe redirect o página de
error; un `fetch` recibe un status que puede leer.

`permissionForRoute` y `hasPermission` viven en `core/permissions.ts`, que es infraestructura
reutilizable y no conoce los roles ni las rutas de este proyecto (§13): los datos se pasan por
argumento y viven en `config/permissions.ts`.

### El guard se inyecta, no se importa

`locals.requirePermission` lo instala el hook en cada request, ya ligado al usuario resuelto. Es
una función, no un booleano, y **lanza** en vez de devolver: un check de autorización cuyo
resultado se puede olvidar de mirar no es un check. Sin sesión responde 401 y no 403, para que el
llamante distinga "vuelve a entrar" de "esto no es para ti".

No hay un `can()` al lado porque nada en el servidor lo necesita — el sidebar pregunta con
`hasPermission` en el cliente, con el usuario del contexto.

El sidebar sigue filtrando items con `hasPermission`, pero eso es **presentación**. Ocultar un
enlace no es autorización: cualquiera puede escribir la URL. Si el único control fuera el menú, el
mapa de permisos daría una falsa sensación de cobertura, que es peor que no tener nada.

### Deny by default, en las dos direcciones

No hay función que normalice el rol: un rol pasa **solo si está listado**, así que un rol
desconocido del backend cae fuera de todas las listas y se deniega sin código extra. Denegar es el
comportamiento por defecto de la estructura de datos, no una comprobación que alguien puede olvidar.

```ts
// Página no declarada en la matriz → null, que el llamante trata como denegada.
export function permissionForRoute<K extends string>(
	routes: RoutePermissions<K>,
	pathname: string
): K | null {
	// ...prefijo más largo; '/' solo casa consigo misma
	return best; // ← null cuando no hay entrada, nunca un permiso por defecto
}
```

Dos consecuencias que hay que entender antes de aceptarlas:

1. **Toda página nueva bajo `(app)/` necesita una entrada en `AUTH_ROUTE_PERMISSIONS`.** Si se
   olvida, la ruta da 403 y te enteras en el primer clic. Es exactamente el fallo que quieres:
   ruidoso e inmediato, en vez de silencioso y en producción. Los endpoints bajo `/api/` **no**
   van en esa tabla: se autorizan en su handler.
2. **Un rol nuevo en el backend no hereda permisos.** Añadir `viewer` en la API no le da acceso a
   nada aquí hasta que lo declares. El sentido contrario —que un rol restrictivo herede los
   permisos de `member`— es cómo se abren agujeros.

**El match es por prefijo más largo**, no por el primero que coincida: `/admin/users` debe
resolver con la regla de `/admin/users` si existe, no con la de `/admin`. La entrada `'/'` es un
caso especial y **solo casa consigo misma**: como prefijo se tragaría todas las rutas y anularía
el deny by default.

### Redirects

`features/auth/redirect.ts` codifica el path de origen en el `?redirect=` y lo valida al volver.
La validación **no** es `startsWith('/')`: re-parsea contra un origen falso y rechaza cualquier
cosa que se escape de él, porque `//evil.com` y `/\evil.com` empiezan por `/` y aun así son URLs
externas. Este archivo está bien y no se toca sin tests.

### OAuth con Google

Dos mitades, las dos en el servidor:

1. **Salida** — la action `?/google` de la página de login genera un nonce, lo guarda en una cookie
   `httpOnly` de vida corta junto al `?redirect=` pendiente, y redirige a Google con ese nonce en
   el parámetro `state`. La action existe para que la cookie se pueda escribir antes del redirect;
   el botón es un `<form method="POST">`, así que funciona sin JavaScript.
2. **Vuelta** — `(auth)/authorize/+server.ts` consume la cookie (vale para un solo callback),
   compara el `state` recibido con el nonce y **rechaza cualquier callback que no coincida**. Sin
   esa comprobación, un atacante puede inducir a la víctima a completar un login con la cuenta del
   atacante. Si la validación falla o el intercambio del código falla, se limpia la sesión y se
   vuelve a `/login?error=oauth`.

Nada de esto depende del backend: el `state` es un contrato entre esta app y Google.

### Lo que el template NO resuelve

- **No hay refresh de token.** Cuando el access token expira, `/auth/me` falla y el handler manda
  al login. Es una decisión, no un olvido: implementarlo bien exige deduplicar refreshes
  concurrentes, y eso depende de cómo funcione tu API. Documentado aquí para que nadie asuma que
  existe.
- **La vida del access token la fija la API externa.** Las cookies tienen su propio `maxAge`, hoy
  compartido por las dos. Mientras no haya refresh, el par de tokens no aporta sobre un token
  único; separar las vidas sin añadir el refresh solo acorta la sesión.
- **No hay alta de usuarios ni recuperación de contraseña.** Son flujos de producto que dependen
  del backend de cada proyecto.

---

## 8. Estado en el cliente

### Jerarquía de decisión

Antes de crear estado, comprueba en orden:

1. **¿Debería sobrevivir a un reload o poder compartirse por enlace?** → query params. Es el caso
   de filtros, orden, paginación y tab activa **cuando el servidor pagina o filtra**: el `load` los
   lee, participan en el SSR, y el usuario puede mandar la URL a un compañero.
2. **¿Viene del servidor?** → `data` de `load`. No lo copies a `$state`; si necesitas derivarlo,
   `$derived`.
3. **¿Es local a un componente?** → `$state` dentro del componente.
4. **¿Lo necesitan varios componentes de un subárbol?** → contexto.
5. **¿Nada de lo anterior?** → una clase con campos `$state` en un `.svelte.ts`, **instanciada**
   por quien la use. Nunca exportada ya instanciada.

**La URL es una preferencia, no una obligación.** Filtrar o paginar en el cliente sobre una lista
que ya tienes en memoria no necesita pasar por la URL, y forzarlo añade navegaciones y ruido al
historial. `lib/hooks/` trae `FilterStore` y `PaginationStore` para ese caso; para el caso servidor,
los mismos valores van en los search params. Elige según quién hace el trabajo, no por dogma.

### Contexto

Svelte 5.40+ trae `createContext`, que da tipado y elimina las claves mágicas. Es lo que usamos:

Es donde vive el estado de auth del cliente: el usuario y el access token que consumen los
servicios (§6).

```ts
// lib/features/auth/context.ts
import { createContext } from 'svelte';
import type { User } from '$lib/types/user';

export interface AuthState {
	user: User | null;
	accessToken: string | null;
}

export const [getAuth, setAuth] = createContext<() => AuthState>();
```

```svelte
<!-- routes/+layout.svelte -->
<script lang="ts">
	import { setAuth } from '$lib/features/auth/context';
	let { data, children } = $props();

	// Se pasa una función, no el valor: así la reactividad cruza el límite del contexto
	// y el token siempre se lee actualizado tras una navegación.
	setAuth(() => ({ user: data.user, accessToken: data.accessToken }));
</script>

{@render children()}
```

```svelte
<!-- cualquier descendiente -->
<script lang="ts">
	import { getAuth } from '$lib/features/auth/context';
	const auth = getAuth();
</script>

<span>{auth().user?.name}</span>
```

Esto sustituye por completo al `authStore` singleton. Mismo acceso ergonómico, pero el estado
cuelga del árbol de componentes —es decir, de la request— en vez de vivir en el módulo.

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

### `Query<T>` — estado de una operación async del cliente

Los datos del primer render vienen de `load`, así que `Query` cubre lo que pasa **después**:
una acción del usuario que dispara trabajo async. Es la **única** utilidad para eso.

```ts
// lib/core/query.svelte.ts
export class Query<T> {
	data = $state.raw<T | null>(null);
	error = $state.raw<AppError | null>(null);
	isLoading = $state(false);

	async run(fetcher: () => Promise<T>): Promise<void> {
		/* ... */
	}
}

export function createQuery<T>(): Query<T> {
	return new Query<T>();
}
```

Tres campos y un método. Es una clase con campos `$state`, que es la forma que la doc de Svelte
recomienda para compartir reactividad entre componentes — no un factory que devuelve getters.

Se leen directo, y en un template la comprobación por verdad ya es la forma corta:

```svelte
{#if query.isLoading}…{:else if query.error}…{:else if query.data}…{/if}
```

Cuatro decisiones que conviene no deshacer sin motivo:

1. **`Query` sostiene el dato.** No hay un `$state` paralelo con los items al lado de un `Query`
   que solo guarda loading/error — eso son dos fuentes de verdad que se desincronizan.
2. **`run` no devuelve el resultado.** Devolver `T | null` invita a `const items = await q.run(…)`,
   que reintroduce exactamente la variable paralela del punto 1. El dato se lee de `query.data`.
3. **`error` es un `AppError`, no un string.** La vista necesita el mensaje (`getMessage()`), pero
   el llamante a menudo necesita el objeto: `error.code`, `error.isAuth()`, `instanceof ApiError`.
   Guardar el string ya normalizado tira esa información en el único punto donde se puede
   recuperar. Normalizar aquí es core→core: `normalizeError` vive en `core/errors.ts`.
4. **No hay `isError`/`isSuccess` ni `status`.** Se probaron y se quitaron. Una bandera booleana
   no estrecha el tipo: dentro de `{#if query.isError}` TypeScript sigue viendo
   `error: AppError | null`, así que `AsyncView` no podía ni pasar el error al snippet ni llamar
   `getMessage()` — dos errores reales de `svelte-check`. Comprobar el valor (`{#if query.error}`)
   es igual de corto, sí estrecha, y deja una sola forma de preguntar lo mismo. De TanStack
   tampoco viene `status`/`fetchStatus`: esa separación existe para distinguir un refetch en
   segundo plano de una primera carga, y sin caché ni refetch automático no tiene a quién servir.

Y una limitación deliberada: **`run` no ordena llamadas concurrentes.** Si disparas dos, gana la
que resuelva última, que puede no ser la que empezaste última. No lleva contador interno porque
hoy ningún consumidor corre llamadas solapadas, y el caso que lo motivaría (buscar por tecla)
necesita un debounce en el call site de todos modos — y el debounce ya elimina la carrera.

No hay `onError`: tras `await query.run(…)` el llamante ya puede mirar `query.error`. Un callback
sería una segunda forma de hacer lo mismo.

```svelte
<script lang="ts">
	const users = createQuery<User[]>();

	async function search(q: string) {
		await users.run(() => service.list({ search: q }));
		if (users.error) toast.error(users.error.getMessage());
	}
</script>
```

El toast vive en el llamante, no dentro de `run`: `core` no conoce la UI, y solo el llamante sabe
si ese fallo concreto merece interrumpir al usuario. Ojo con duplicar el reporte — si la vista ya
pinta el error con `AsyncView`, un toast encima dice lo mismo dos veces. Los toasts son sobre todo
para fallos sin sitio inline donde mostrarse (una mutación, una acción de un botón).

Para cargar al montar no hace falta `onMount` ni `$effect`: `run` no lanza, así que se dispara en
el top-level del `<script>`, que corre una sola vez al crear el componente.

`AsyncView` consume `Query<T>` y expone el dato al snippet de éxito:

```svelte
<AsyncView query={users}>
	{#snippet children(items)}
		{#each items as item (item.id)}…{/each}
	{/snippet}

	{#snippet empty()}
		<EmptyState title="No users yet" />
	{/snippet}
</AsyncView>
```

Snippets opcionales para `loading`, `empty` y `error` (recibe el `AppError`), con defaults
razonables si no se pasan.

`empty` se dispara cuando `data` es un array vacío — no hay prop `isEmpty` que configurar. Es el
95% de los casos (una lista que volvió sin nada) y evita que el snippet de éxito tenga que volver
a preguntar por el vacío. Si tu noción de "vacío" es otra, va dentro de `children`.

---

## 9. Componentes

### Niveles

| Nivel                      | Qué contiene                                                                                                               | Puede importar de                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| `ui/`                      | shadcn-svelte vendorizado. **No se modifica ni se envuelve sin motivo.** Se actualiza con el CLI de shadcn.                | bits-ui, `$lib/utils`                 |
| `base/`                    | Átomos propios: componentes que shadcn no trae o que necesitan variantes de marca (`Combobox`, `DatePicker`, `FileInput`). | `ui/`                                 |
| `common/`                  | Moléculas sin conocimiento de dominio: `PageHeader`, `EmptyState`, `AsyncView`, `CardIcon`.                                | `ui/`, `base/`                        |
| `blocks/`                  | Organismos sin dominio: composiciones grandes reutilizables. Nivel previsto; la carpeta se crea con el primer componente.  | `ui/`, `base/`, `common/`             |
| `layout/`                  | El chrome de la app: sidebar, header. Conoce `config/navigation`.                                                          | todos los anteriores, `config/`       |
| `features/<d>/components/` | UI del dominio.                                                                                                            | todos los anteriores, su propio slice |

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
Los componentes de `layout/` siguen en kebab-case y hay que renombrarlos; los de
`features/auth/components/` ya están migrados.

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
código.

```ts
export interface Logger {
	error(scope: string, error: unknown): string;
}
```

El resto del código depende de `Logger`, la interfaz, nunca de la implementación. Hoy la única
implementación es `ConsoleLogger`, expuesta como la instancia `logger`. Para Sentry o logs
estructurados, se escribe una clase que implemente `Logger` y se reasigna con `setLogger(...)` —
un archivo, sin tocar los llamantes.

`logger.error(scope, error)` normaliza, registra, y **devuelve el mensaje seguro para el
usuario** — que es lo que los tres llamantes necesitaban, así que evita normalizar dos veces.

`handleError` de `hooks.server.ts` y `hooks.client.ts` pasa por ahí y devuelve un mensaje seguro
para `+error.svelte`.

---

## 12. Configuración y entorno

- **Todo lo público** se lee en `lib/config/app.ts` desde `$env/dynamic/public` y se expone como un
  objeto tipado, importado siempre como `$lib/config/app`. Los componentes leen `config`, nunca
  `env` directamente.
- **Todo lo privado** se lee con `$env/dynamic/private`, y **solo** desde archivos server-only.
- `PUBLIC_*` significa que **llega al bundle del navegador**. Asume que es visible para cualquiera.
  Un secreto nunca lleva ese prefijo.
- `.env.example` lista todas las variables con su default. Si añades una, la añades ahí en el mismo
  commit.

---

## 13. Reglas de import

Una sola forma:

```ts
import { X } from '$lib/…'; // ✅ siempre
import { X } from '../../lib/…'; // ❌ nunca
import { X } from '$core/…'; // ❌ los aliases extra se eliminan
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
components/layout/ → components/*, config/, core/ (permisos)   ✗ no importa de features/
components/blocks/ → components/{ui,base,common}
components/common/ → components/{ui,base}, core/, utils/
components/base/   → components/ui, utils/
components/ui/     → bits-ui, utils/   ✗ nada más
core/              → types/            ✗ no conoce config/ ni features/
utils/             → nada
config/            → types/
features/<d>/services/ → core/, config/, types/, sus propios types
                     ✗ NADA específico de un entorno ($env/private, node:*, $app/state):
                       rompe el isomorfismo
*.server.ts        → cualquier cosa; el compilador impide que el cliente lo importe.
                     Solo para servicios que necesitan secretos (excepción, §6)
```

Un slice se comunica con otro **solo** a través de su `index.ts`. Si `features/orders` necesita
algo de `features/users`, lo importa de `$lib/features/users`, nunca de
`$lib/features/users/services/...`.

---

## 14. Convenciones de nombres

| Elemento                        | Convención               | Ejemplo                               |
| ------------------------------- | ------------------------ | ------------------------------------- |
| Componentes propios             | PascalCase               | `UserCard.svelte`                     |
| Componentes en `ui/`            | kebab-case (vendorizado) | `alert-dialog-content.svelte`         |
| Módulos TS                      | kebab-case               | `query.svelte.ts`, `feature-flags.ts` |
| Módulos con runes               | sufijo `.svelte.ts`      | `query.svelte.ts`                     |
| Módulos server-only (excepción) | sufijo `.server.ts`      | `billing.server.ts`                   |
| Tests                           | junto al código          | `redirect.test.ts`                    |
| Clases y tipos                  | PascalCase               | `Query`, `ApiError`, `User`           |
| Constantes de config            | SCREAMING_SNAKE_CASE     | `AUTH_ROUTE_PERMISSIONS`              |
| Props y variables               | camelCase                | `userId`, `isLoading`                 |
| Callbacks en props              | `on` + evento            | `onSelect`, `onClose`                 |
| Booleanos                       | `is` / `has` / `can`     | `isLoading`, `canEdit`                |
| Rutas                           | kebab-case               | `/user-settings`                      |

**Un solo idioma en el código: inglés.** Nombres, comentarios, mensajes de UI, mensajes de commit.
No porque el inglés sea mejor, sino porque mezclar dos idiomas obliga a decidir en cada línea.

---

## 15. Testing

No se busca cobertura. Se cubre lo que, si se rompe, rompe algo grave o silencioso.

**Obligatorio:**

| Qué                                                | Por qué                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `core/permissions.ts`                              | La matriz completa rol × ruta, incluidos rol desconocido y ruta no declarada. Es el control de acceso. Hecho. |
| `features/auth/redirect.ts`                        | Ya existe. Cubre los vectores de open redirect.                                                               |
| `core/errors.ts`                                   | El mapeo status/HTTP → código. Un mapeo mal hecho muestra el mensaje equivocado en producción.                |
| `handleAuth`                                       | Público→pasa, sin cookies→login, token inválido→login, sin permiso→403.                                       |
| E2E: login → dashboard → logout                    | El flujo que si se rompe, no entra nadie.                                                                     |
| E2E: rol sin permiso no accede a su ruta prohibida | Verifica que §7 sigue siendo cierto.                                                                          |

**No se testea:** componentes de presentación sin lógica, wrappers de `ui/`, ni utils triviales.
Un test que solo reafirma que el markup no cambió es lastre.

Los E2E corren contra la API externa **mockeada** (interceptación de rutas en Playwright), nunca
contra un backend real: un test que depende de la red no es una red de seguridad.

---

## 16. Anti-patrones

Todos estos existieron en el repo. Están aquí para que no vuelvan.

**❌ Devolver el refresh token desde un `load`**
Convierte un XSS en una sesión permanente. El access token sí sale (§7); el refresh, nunca.

**❌ Guardar el token en `localStorage` o en un singleton**
Vive en el contexto, en memoria, y muere con la pestaña.

**❌ `$state` a nivel de módulo con datos de usuario**
Se comparte entre requests en SSR. Usa contexto.

**❌ Permisos declarados pero no aplicados**
Filtrar el menú no es autorización. El check va en el servidor.

**❌ `$effect` para notificar al padre**

```ts
$effect(() => {
	onchange?.(value);
}); // ❌ se dispara al montar y en cada eco
```

Llama el callback en el event handler, o usa `bind:`.

**❌ `$effect` reimplementando SvelteKit**
Detectar navegación con un `previousPathname` en `$state` cuando existe `afterNavigate`.

**❌ Efectos secundarios en `load`**
Un `load` devuelve datos. No muta estado global ni escribe en stores.

**❌ Dos fuentes de verdad para el mismo dato**
Un `Query` con loading/error y un `$state` aparte con los items. Se desincronizan.

**❌ Lógica de negocio en la página**

```svelte
const canDelete = user.role === 'admin' || user.role === 'lead'; // ❌ const canDelete =
hasPermission(ROLE_PERMISSIONS, user.role, 'users:read'); // ✅
```

**❌ Derivar en el template**

```svelte
{#each items.filter(i => i.active).sort(byDate) as item}   <!-- ❌ -->
```

Deriva con `$derived` en el script.

**❌ Abstracciones sin consumidor**
Un store genérico, un helper o un tipo que nadie importa. Bórralo.

**❌ Mutar por GET**
Logout, borrados o cualquier cambio de estado en un `load`. El prefetch de SvelteKit los dispara solo.

---

## 17. Recetas

### Añadir una página

1. Crear `routes/(app)/<ruta>/+page.svelte` (thin) y `+page.server.ts` (`load`).
2. **Añadir la entrada en `AUTH_ROUTE_PERMISSIONS`.** Sin esto la ruta da 403 — es deliberado.
3. Si va en el menú, añadir el item en `config/navigation.ts` con sus `requiredPermissions`.
4. `pnpm run lint && pnpm run check && pnpm run test`.

### Añadir un endpoint

1. Crear `routes/api/<recurso>/+server.ts`.
2. **Primera línea de cada handler: `locals.requirePermission('resource:action')`.** No hay tabla
   central que lo cubra, y es a propósito: cada método declara el suyo, así que `GET` y `DELETE`
   pueden pedir permisos distintos.
3. No lo añadas a `AUTH_ROUTE_PERMISSIONS`. Esa tabla es de páginas; meterlo ahí no lo protege más
   y sí lo rompe.
4. Test del handler si la regla de permiso no es obvia. El olvido del paso 2 lo detecta
   `src/routes/api/endpoints.guard.test.ts`, que recorre cada método exportado.

### Añadir una form action

Una action vive en una ruta de página, así que **lo único que el hook le ha exigido es el permiso
de esa página** — normalmente uno de lectura. Una action que escribe o borra necesita su propia
llamada, igual que un endpoint:

```ts
export const actions = {
	remove: async ({ locals, request }) => {
		locals.requirePermission('users:delete');
		// ...
	}
};
```

Es la misma trampa que tienen los endpoints, con la diferencia de que aquí la página sí pasó por
la tabla y da la falsa sensación de estar cubierta.

### Añadir un slice

1. `lib/features/<domain>/` con `types.ts`, `schemas.ts` y `services/<entity>.ts`.
2. `index.ts` exportando **solo** la API pública: tipos y, si existe, el orquestador.
3. Componentes en `components/`. El componente raíz recibe los datos por props desde la página.
4. Estado del cliente solo si hace falta: una clase con `$state` en `<domain>.svelte.ts`.
5. Tests de la lógica que tenga reglas (permisos, transformaciones, validaciones).

### Añadir un rol

1. Añadirlo a `UserRole` en `lib/types/user.ts`.
2. Añadirlo a `ROLE_LABELS`.
3. Declararlo en cada `ROLE_PERMISSIONS` donde deba entrar. **Si no lo declaras, no tiene acceso
   a nada** — eso es lo correcto.
4. Actualizar el test de la matriz de permisos.

### Cambiar la marca

1. Tokens de color en `src/routes/layout.css` (`@theme`).
2. Nombre, logo, favicon y SEO: un solo punto de configuración, `config.branding` en
   `lib/config/app.ts`. Hardcodeado a propósito, no por variable de entorno: cambia una vez por
   proyecto, no una vez por entorno de despliegue. Edita los valores ahí y reemplaza los
   placeholders en `lib/assets/logo.svg` y `lib/assets/favicon.svg`. `AppSidebar.svelte`, la
   página de login y `+layout.svelte` (favicon + `<title>`/meta SEO por defecto) leen de ahí — no
   se tocan para cambiar de marca.

---

## 18. Definición de "terminado"

Un cambio está listo cuando:

- [ ] `pnpm run lint` — sin errores
- [ ] `pnpm run check` — cero errores **y cero warnings** (los warnings de `svelte-check` como
      `state_referenced_locally` son bugs de reactividad, no ruido)
- [ ] `pnpm run test` — verde
- [ ] No añade exports sin consumidor
- [ ] No añade una segunda forma de hacer algo que ya se hace
- [ ] Si añade una página, tiene entrada en `AUTH_ROUTE_PERMISSIONS`
- [ ] Si añade un endpoint, cada handler llama a `locals.requirePermission`
- [ ] Si toca permisos o auth, tiene test
- [ ] Si añade una variable de entorno, está en `.env.example`
- [ ] Este documento sigue siendo cierto — o se actualizó en el mismo commit

Ese último punto es el que importa. Un documento de arquitectura que se desincroniza del código es
peor que no tenerlo: los agentes lo leen y escriben código para un proyecto que no existe. Es
exactamente lo que le pasó al `architecture.md` anterior.
