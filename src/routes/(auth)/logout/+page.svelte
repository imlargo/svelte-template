<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';

	onMount(async () => {
		toast.success('Sesión cerrada exitosamente.');
		await invalidateAll();
		await goto('/login');
	});
</script>

<h1>Logging out...</h1>
