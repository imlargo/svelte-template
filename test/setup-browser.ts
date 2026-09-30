/**
 * `$env/dynamic/public` reads the env SvelteKit serializes into a real page
 * (`globalThis.__sveltekit_dev.env` in dev), and a component test has no page.
 * Put .env.test there instead — `test.env` in vite.config.ts loads it — so a
 * component reads the same config the server-side tests do.
 */
Object.assign(globalThis, { __sveltekit_dev: { env: import.meta.env } });
