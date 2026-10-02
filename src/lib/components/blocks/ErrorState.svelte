<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button } from '#lib/components/ui/button/index.js';
	import DocumentTitle from '#lib/components/blocks/DocumentTitle.svelte';
	import { AUTH_ROUTES, HOME_ROUTE } from '#lib/config/routes.js';

	let {
		status,
		message,
		errorId
	}: {
		status: number;
		/** Always safe to render: `handleError` never lets a raw message through. */
		message?: string;
		/** Present for unexpected errors: the id the log line carries too. */
		errorId?: string;
	} = $props();

	const TITLES: Record<number, string> = {
		401: 'Authentication required',
		403: 'Access denied',
		404: 'Page not found',
		503: 'Service unavailable'
	};

	const title = $derived(TITLES[status] ?? 'Something went wrong');
</script>

<DocumentTitle {title} />

<div class="flex flex-col items-center gap-4 text-center">
	<p class="text-6xl font-bold text-muted-foreground">{status}</p>
	<h1 class="text-2xl font-semibold">{title}</h1>
	<p class="max-w-sm text-muted-foreground">
		{message ?? 'An unexpected error occurred. Please try again.'}
	</p>
	{#if errorId}
		<p class="text-xs text-muted-foreground">
			Reference: <code class="font-mono select-all">{errorId}</code>
		</p>
	{/if}
	{#if status === 401}
		<Button href={resolve(AUTH_ROUTES.login)} variant="outline">Sign in</Button>
	{:else}
		<Button href={resolve(HOME_ROUTE)} variant="outline">Go home</Button>
	{/if}
</div>
