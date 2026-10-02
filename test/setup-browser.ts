import { variables } from '../src/env';

/**
 * `$app/env/public` reads the values SvelteKit serializes into a real page
 * (`globalThis.__sveltekit_dev.env` in dev), and a component test has no page.
 * Put .env.test there instead — `test.env` in vite.config.ts loads it — run
 * through the schemas in src/env.ts, so a component reads the same parsed config
 * the server-side tests do.
 */
const env = Object.fromEntries(
	Object.entries(variables)
		.filter(([, config]) => config.public)
		.map(([name, config]) => {
			const result = config.schema['~standard'].validate(import.meta.env[name]);
			if (result instanceof Promise || result.issues)
				throw new Error(`Invalid ${name} in .env.test`);
			return [name, result.value];
		})
);

Object.assign(globalThis, { __sveltekit_dev: { env } });
