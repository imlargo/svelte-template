<script lang="ts">
	import '$styles/app.scss';

	import type { Snippet } from 'svelte';
	type Props = {
		children: Snippet;
	};
	const { children }: Props = $props();
</script>

{@render children()}
