<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { cn, type WithElementRef } from '$lib/utils.js';
	import type { HTMLFormAttributes } from 'svelte/elements';
	import { superForm, type SuperValidated, type Infer } from 'sveltekit-superforms';
	import { untrack } from 'svelte';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { RegisterSchema } from '$lib/features/auth/schemas';

	let {
		ref = $bindable(null),
		class: className,
		form: formData,
		...restProps
	}: WithElementRef<HTMLFormAttributes> & {
		form: SuperValidated<Infer<typeof RegisterSchema>>;
	} = $props();

	const id = $props.id();

	const form = superForm(untrack(() => formData), {
		validators: zodClient(RegisterSchema),
		invalidateAll: false
	});
	const { form: fields, message, enhance } = form;
</script>

<form
	class={cn('flex flex-col gap-6', className)}
	bind:this={ref}
	method="POST"
	action="?/register"
	use:enhance
	{...restProps}
>
	<div class="flex flex-col items-center gap-2 text-center">
		<h1 class="text-2xl font-bold">Create an account</h1>
		<p class="text-sm text-balance text-muted-foreground">
			Fill in your details to get started.
		</p>
	</div>

	{#if $message}
		<p class="rounded-md bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
			{$message}
		</p>
	{/if}

	<div class="grid gap-4">
		<Form.Field {form} name="name">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Name</Form.Label>
					<Input
						{...props}
						id="name-{id}"
						type="text"
						placeholder="Your name"
						autocomplete="name"
						bind:value={$fields.name}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

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
					<Form.Label>Password</Form.Label>
					<Input
						{...props}
						id="password-{id}"
						type="password"
						placeholder="Min. 8 characters"
						autocomplete="new-password"
						bind:value={$fields.password}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Form.Field {form} name="confirmPassword">
			<Form.Control>
				{#snippet children({ props })}
					<Form.Label>Confirm password</Form.Label>
					<Input
						{...props}
						id="confirm-password-{id}"
						type="password"
						placeholder="Repeat your password"
						autocomplete="new-password"
						bind:value={$fields.confirmPassword}
					/>
				{/snippet}
			</Form.Control>
			<Form.FieldErrors />
		</Form.Field>

		<Button type="submit" class="w-full">Create account</Button>
	</div>

	<div class="text-center text-sm">
		Already have an account?
		<a href="/login" class="underline underline-offset-4">Sign in</a>
	</div>
</form>
