import { defineConfig } from '@playwright/test';

/**
 * Runs the built worker under wrangler, with auth off, so the smoke suite
 * needs no backend: it proves the app boots, routes, streams and fails the way
 * it should. Flows that need a real session belong to the project that has
 * the backend.
 *
 * The env is set twice on purpose: `env` for the build, `--var` for the worker,
 * which reads its variables from wrangler rather than from this process.
 */
const E2E_ENV = {
	PUBLIC_API_URL: 'http://localhost:8000',
	PUBLIC_AUTH_ENABLED: 'false'
};

const vars = Object.entries(E2E_ENV)
	.map(([key, value]) => `--var ${key}:${value}`)
	.join(' ');

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.{ts,js}',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	use: { baseURL: 'http://localhost:4173' },
	webServer: {
		command: `pnpm run build && pnpm exec wrangler dev .svelte-kit/cloudflare/_worker.js --port 4173 ${vars}`,
		port: 4173,
		env: E2E_ENV,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	}
});
