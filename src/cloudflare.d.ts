// The adapter no longer passes Cloudflare's APIs through `platform`: bindings and
// `waitUntil` come from `cloudflare:workers`, `cf` from `request.cf`, and `caches`
// is a global. Declared here rather than with `wrangler types`, whose runtime
// types redefine DOM ones (`Element`, `Response`...) and break components.
declare module 'cloudflare:workers' {
	/** The bindings declared in wrangler.jsonc. Add each new one here with its type. */
	export const env: {
		ASSETS: import('@cloudflare/workers-types').Fetcher;
	};
	export function waitUntil(promise: Promise<unknown>): void;
}
