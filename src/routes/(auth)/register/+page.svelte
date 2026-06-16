<script lang="ts">
	import RegisterForm from '$lib/features/auth/components/register/register-form.svelte';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<div class="grid min-h-svh lg:grid-cols-2">
	<div class="flex flex-col gap-4 p-6 md:p-10">
		<div class="flex justify-center gap-2 md:justify-start">
			<a href="/" class="flex items-center gap-2 font-medium">
				<div
					class="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground"
				>
					<!-- Replace with your app logo -->
					<LayoutDashboardIcon class="size-4" />
				</div>
				<!-- Replace with your app name -->
				App
			</a>
		</div>
		<div class="flex flex-1 items-center justify-center">
			<div class="w-full max-w-xs">
				<RegisterForm form={data.form} />
			</div>
		</div>
	</div>
	<div
		class="relative hidden items-center justify-center bg-muted lg:flex"
		aria-hidden="true"
	>
		<!-- Replace with a hero image, illustration, or brand pattern -->
	</div>
</div>
