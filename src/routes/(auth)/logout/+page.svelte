<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import DocumentTitle from '#lib/components/blocks/DocumentTitle.svelte';
</script>

<DocumentTitle title="Sign out" />

<!-- Reached by visiting /logout directly; the sidebar posts to this action too. -->
<div class="flex min-h-svh items-center justify-center p-6">
	<form method="POST" use:enhance class="flex flex-col items-center gap-4 text-center">
		<h1 class="text-xl font-semibold">Sign out of your account?</h1>
		<Button type="submit">Sign out</Button>
	</form>
</div>
