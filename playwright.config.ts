import { defineConfig } from '@playwright/test';

/**
 * Runs the built worker (`pnpm run preview`), with auth off, so the smoke suite
 * needs no backend: it proves the app boots, routes, streams and fails the way
 * it should. Flows that need a real session belong to the project that has
 * the backend.
 *
 * The variables go to the worker as `--var`: it reads them from wrangler, not
 * from this process, and the build does not need them.
 */
const E2E_VARS = {
	PUBLIC_API_URL: 'http://localhost:8000',
	PUBLIC_AUTH_ENABLED: 'false'
};

const vars = Object.entries(E2E_VARS)
	.map(([key, value]) => `--var ${key}:${value}`)
	.join(' ');

export default defineConfig({
	testDir: 'e2e',
	testMatch: '**/*.e2e.{ts,js}',
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	use: { baseURL: 'http://localhost:4173' },
	webServer: {
		command: `pnpm run build && pnpm run preview ${vars}`,
		port: 4173,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000
	}
});
