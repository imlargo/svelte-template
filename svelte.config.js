import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		alias: {
			$lib: './src/lib',
			$styles: './src/styles',
			$components: './src/lib/components',
			$types: './src/lib/types',
			$client: './src/lib/client',
			$server: './src/lib/server',
			$ui: './src/lib/components/ui'
		}
	}
};

export default config;
