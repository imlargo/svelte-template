<script lang="ts">
	import { page } from '$app/state';
	import ErrorState from '#lib/components/blocks/ErrorState.svelte';
</script>

<!-- Outside the app shell: auth pages, and anything the (app) boundary cannot catch. -->
<div class="flex min-h-svh items-center justify-center p-6">
	<ErrorState status={page.status} message={page.error?.message} errorId={page.error?.errorId} />
</div>
