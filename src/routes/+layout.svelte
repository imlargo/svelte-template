<script lang="ts">
	import './layout.css';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { ModeWatcher } from 'mode-watcher';
	import { setAuth } from '$lib/features/auth/context';
	import { config } from '$lib/config/app';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// A getter, not a value: this way the token stays current across navigations.
	setAuth(() => ({ user: data.user, accessToken: data.accessToken }));
</script>

<svelte:head>
	<link rel="icon" href={config.branding.favicon} />
	<!-- Fallback title/description: a page with its own <svelte:head> title overrides this. -->
	<title>{config.branding.seo.title}</title>
	<meta name="description" content={config.branding.seo.description} />
	<meta property="og:title" content={config.branding.seo.title} />
	<meta property="og:description" content={config.branding.seo.description} />
</svelte:head>

<ModeWatcher />
<Toaster />

<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-2 focus:ring-ring"
>
	Skip to main content
</a>

{@render children?.()}
