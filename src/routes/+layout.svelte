<script lang="ts">
	import './layout.css';
	import { Toaster } from '$lib/components/ui/sonner/index.js';
	import { ModeWatcher } from 'mode-watcher';
	import { setAuth } from '$lib/features/auth/context';
	import { ClientSession } from '$lib/features/auth/client-session.svelte';
	import { config } from '$lib/config/app';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// A getter, not a value: this way the session follows `data` across navigations.
	setAuth(new ClientSession(() => data));
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

{@render children()}
