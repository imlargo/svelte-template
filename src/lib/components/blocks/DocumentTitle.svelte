<script lang="ts">
	import { config } from '$lib/config/app';

	let { title }: { title: string } = $props();
</script>

<svelte:head>
	<title>{title} · {config.branding.seo.title}</title>
</svelte:head>
