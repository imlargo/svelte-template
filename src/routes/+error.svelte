<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="flex min-h-svh flex-col items-center justify-center gap-4 text-center">
	<p class="text-6xl font-bold text-muted-foreground">{page.status}</p>
	<h1 class="text-2xl font-semibold">
		{#if page.status === 404}
			Page not found
		{:else if page.status === 403}
			Access denied
		{:else if page.status === 401}
			Authentication required
		{:else}
			Something went wrong
		{/if}
	</h1>
	<p class="max-w-sm text-muted-foreground">
		{page.error?.message ?? 'An unexpected error occurred. Please try again.'}
	</p>
	<a href="/" class="underline underline-offset-4 hover:text-primary">Go home</a>
</div>
