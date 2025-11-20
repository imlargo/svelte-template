<script lang="ts">
	import type { LayoutProps } from './$types';
	let { data, children }: LayoutProps = $props();
</script>

<div class="flex w-full flex-col gap-y-6 px-4 pt-12 pb-24 md:px-12 md:pb-12 xl:px-24">
	{@render children()}
</div>
