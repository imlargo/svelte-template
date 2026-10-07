<script lang="ts">
	import { enhance } from '$app/forms';
	import * as Field from '#lib/components/ui/field/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { cn } from '#lib/utils.js';
	import { config } from '#lib/config/app.js';
	import { LoginSchema, type LoginFailure, type LoginInput } from '#lib/features/auth/schemas.js';
	import { REDIRECT_PARAM } from '#lib/features/auth/redirect.js';
	import { toFieldErrors, validateField, type FieldErrors } from '#lib/utils/forms.js';

	let {
		form = null,
		signInError = null,
		redirect = null,
		class: className
	}: {
		/** The login action's answer when it did not sign the user in. */
		form?: LoginFailure | null;
		/** Set when the user comes back from a failed OAuth round trip. */
		signInError?: string | null;
		/** The `?redirect=` value, carried to both actions. */
		redirect?: string | null;
		class?: string;
	} = $props();

	// `action="?/login"` alone would drop the page's query string, and with it the redirect.
	const actionQuery = $derived(
		redirect ? `&${new URLSearchParams({ [REDIRECT_PARAM]: redirect })}` : ''
	);

	let errors = $derived<FieldErrors<LoginInput>>(form?.errors ?? {});

	function validate(event: Event & { currentTarget: HTMLInputElement }) {
		const { name, value } = event.currentTarget;
		errors = { ...errors, [name]: validateField(LoginSchema, name as keyof LoginInput, value) };
	}

	const showPassword = config.auth.methods.password;
	const showGoogle = config.auth.methods.google.enabled;
</script>

<div class={cn('flex flex-col gap-6', className)}>
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

	{#if form?.message || signInError}
		<p class="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
			{form?.message ?? signInError}
		</p>
	{/if}

	{#if showGoogle}
		<form method="POST" action="?/google{actionQuery}">
			<Button type="submit" variant="outline" class="w-full">
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
		</form>
	{/if}

	{#if showPassword && showGoogle}
		<div
			class="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border"
		>
			<span class="relative z-10 bg-background px-2 text-muted-foreground">or</span>
		</div>
	{/if}

	{#if showPassword}
		<form method="POST" action="?/login{actionQuery}" use:enhance novalidate>
			<Field.Group>
				<Field.Field data-invalid={errors.email ? true : undefined}>
					<Field.Label for="email">Email</Field.Label>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="you@example.com"
						autocomplete="email"
						value={form?.email ?? ''}
						aria-invalid={errors.email ? true : undefined}
						onchange={validate}
					/>
					<Field.Error errors={toFieldErrors(errors.email)} />
				</Field.Field>

				<Field.Field data-invalid={errors.password ? true : undefined}>
					<Field.Label for="password">Password</Field.Label>
					<Input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						aria-invalid={errors.password ? true : undefined}
						onchange={validate}
					/>
					<Field.Error errors={toFieldErrors(errors.password)} />
				</Field.Field>

				<Button type="submit" class="w-full">Sign in</Button>
			</Field.Group>
		</form>
	{/if}
</div>
