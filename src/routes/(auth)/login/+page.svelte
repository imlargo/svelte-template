<script lang="ts">
	import LoginForm from '$lib/features/auth/components/LoginForm.svelte';
	import { resolve } from '$app/paths';
	import { config } from '$lib/config/app';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>{config.branding.seo.title} — Log in</title>
</svelte:head>

<div class="grid min-h-svh lg:grid-cols-2">
	<div class="flex flex-col gap-4 p-6 md:p-10">
		<div class="flex justify-center gap-2 md:justify-start">
			<a href={resolve('/')} class="flex items-center gap-2 font-medium">
				<div
					class="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground"
				>
					<img src={config.branding.logo} alt="" class="size-4" />
				</div>
				{config.branding.name}
			</a>
		</div>
		<div class="flex flex-1 items-center justify-center">
			<div class="w-full max-w-xs">
				<LoginForm form={data.form} signInError={data.signInError} />
			</div>
		</div>
	</div>
	<div class="relative hidden items-center justify-center bg-muted lg:flex" aria-hidden="true">
		<!-- Replace with a hero image, illustration, or brand pattern -->
	</div>
</div>
