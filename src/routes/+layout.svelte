<script lang="ts">
	import './layout.css';
	import { Toaster } from '#lib/components/ui/sonner/index.js';
	import * as Tooltip from '#lib/components/ui/tooltip/index.js';
	import { ModeWatcher } from 'mode-watcher';
	import { ClientSession, setAuth } from '#lib/features/auth/client-session.svelte.js';
	import { config } from '#lib/config/app.js';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	// A getter, so the session follows `data` across navigations.
	setAuth(new ClientSession(() => data));
</script>

<svelte:head>
	<link rel="icon" href={config.branding.favicon} />
	<title>{config.branding.seo.title}</title>
	<meta name="description" content={config.branding.seo.description} />
	<meta property="og:title" content={config.branding.seo.title} />
	<meta property="og:description" content={config.branding.seo.description} />
</svelte:head>

<ModeWatcher />
<Toaster />

<!-- One provider at the root lets any page use a tooltip without bringing its own. -->
<Tooltip.Provider>
	{@render children()}
</Tooltip.Provider>
