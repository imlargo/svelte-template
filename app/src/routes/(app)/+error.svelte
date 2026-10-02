<script lang="ts">
	import { page } from '$app/state';
	import ErrorState from '#lib/components/blocks/ErrorState.svelte';
</script>

<!-- Rendered inside the (app) layout, so an error in one page keeps the sidebar
     and the way out of it. -->
<div class="flex flex-1 items-center justify-center py-12">
	<ErrorState status={page.status} message={page.error?.message} errorId={page.error?.errorId} />
</div>
