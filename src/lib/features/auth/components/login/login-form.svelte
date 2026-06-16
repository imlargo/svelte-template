<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLFormAttributes } from 'svelte/elements';
	import { config } from '$lib/config';
	import { superForm, type SuperValidated, type Infer } from 'sveltekit-superforms';
	import { untrack } from 'svelte';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { LoginSchema, type LoginInput } from '$lib/features/auth/schemas';

	let {
		ref = $bindable(null),
		class: className,
		form: formData,
		...restProps
	}: WithElementRef<HTMLFormAttributes> & {
		form: SuperValidated<Infer<typeof LoginSchema>>;
	} = $props();

	const id = $props.id();

	const form = superForm(untrack(() => formData), {
		validators: zodClient(LoginSchema),
		invalidateAll: false
	});
	const { form: fields, errors, message, enhance } = form;

	const showPassword = config.auth.methods.password;
	const showGoogle = config.auth.methods.google.enabled;
	const showDivider = showPassword && showGoogle;

	function handleGoogleLogin() {
		const googleForm = document.createElement('form');
		googleForm.setAttribute('method', 'GET');
		googleForm.setAttribute('action', 'https://accounts.google.com/o/oauth2/v2/auth');

		const params: Record<string, string> = {
			client_id: config.auth.methods.google.clientId,
			redirect_uri: `${window.location.origin}/authorize`,
			response_type: 'code',
			prompt: 'select_account',
			scope: 'openid profile email',
			include_granted_scopes: 'true'
		};

		for (const [key, value] of Object.entries(params)) {
			const input = document.createElement('input');
			input.setAttribute('type', 'hidden');
			input.setAttribute('name', key);
			input.setAttribute('value', value);
			googleForm.appendChild(input);
		}

		document.body.appendChild(googleForm);
		googleForm.submit();
	}
</script>

<form
	class={cn('flex flex-col gap-6', className)}
	bind:this={ref}
	method="POST"
	action="?/login"
	use:enhance
	{...restProps}
>
	<div class="flex flex-col items-center gap-2 text-center">
		<h1 class="text-2xl font-bold">Sign in to your account</h1>
		<p class="text-sm text-balance text-muted-foreground">
			{#if showPassword && showGoogle}
				Use your email or a third-party account to sign in.
			{:else if showPassword}
				Enter your email and password to sign in.
			{:else if showGoogle}
				Sign in with your Google account to continue.
			{/if}
		</p>
	</div>

	{#if $message}
		<p class="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
			{$message}
		</p>
	{/if}

	<div class="grid gap-6">
		{#if showGoogle}
			<Button type="button" variant="outline" class="w-full" onclick={handleGoogleLogin}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="16"
					height="16"
					viewBox="0 0 16 16"
					aria-hidden="true"
					class="shrink-0"
				>
					<path
						fill="currentColor"
						d="M15.545 6.558a9.4 9.4 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.7 7.7 0 0 1 5.352 2.082l-2.284 2.284A4.35 4.35 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.8 4.8 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.7 3.7 0 0 0 1.599-2.431H8v-3.08z"
					/>
				</svg>
				Sign in with Google
			</Button>
		{/if}

		{#if showDivider}
			<div
				class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
			>
				<span class="relative z-10 bg-background px-2 text-muted-foreground">or</span>
			</div>
		{/if}

		{#if showPassword}
			<Form.Field {form} name="email">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Email</Form.Label>
						<Input
							{...props}
							id="email-{id}"
							type="email"
							placeholder="you@example.com"
							autocomplete="email"
							bind:value={$fields.email}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="password">
				<Form.Control>
					{#snippet children({ props })}
						<div class="flex items-center">
							<Form.Label>Password</Form.Label>
							<a
								href="/forgot-password"
								class="ml-auto text-sm underline-offset-4 hover:underline"
							>
								Forgot your password?
							</a>
						</div>
						<Input
							{...props}
							id="password-{id}"
							type="password"
							autocomplete="current-password"
							bind:value={$fields.password}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Button type="submit" class="w-full">Sign in</Button>
		{/if}
	</div>

	<div class="text-center text-sm">
		Don't have an account?
		<a href="/register" class="underline underline-offset-4">Sign up</a>
	</div>
</form>
