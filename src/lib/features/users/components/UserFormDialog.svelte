<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import * as Form from '$lib/components/ui/form/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { untrack } from 'svelte';
	import { defaults, superForm } from 'sveltekit-superforms';
	import { zod4, zod4Client } from 'sveltekit-superforms/adapters';
	import { UserFormSchema, type UserFormData } from '$lib/features/users/schemas';
	import { ROLE_LABELS } from '$lib/config/permissions';
	import { UserRole } from '$lib/types/user';
	import type { User } from '$lib/types/user';

	let {
		open = $bindable(),
		user = null,
		onsubmit
	}: {
		open: boolean;
		/** Null creates, a user edits. */
		user?: User | null;
		onsubmit: (data: UserFormData) => Promise<boolean>;
	} = $props();

	// Read once on purpose: the parent mounts this only while open, so `user`
	// never changes during its lifetime and these defaults are always fresh.
	// That is also why no $effect is needed to refill the fields.
	const initial = untrack(() => ({
		name: user?.name ?? '',
		email: user?.email ?? '',
		role: user?.role ?? UserRole.MEMBER
	}));

	// SPA mode: there is no form action to post to — the parent calls the API.
	const form = superForm(defaults(initial, zod4(UserFormSchema)), {
		SPA: true,
		validators: zod4Client(UserFormSchema),
		resetForm: false,
		async onUpdate({ form: validated }) {
			if (!validated.valid) return;
			if (await onsubmit(validated.data)) open = false;
		}
	});

	const { form: fields, enhance, submitting } = form;

	const roles = Object.values(UserRole);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{user ? 'Edit user' : 'New user'}</Dialog.Title>
			<Dialog.Description>
				{user ? `Update the details for ${user.email}.` : 'Add a new user to the workspace.'}
			</Dialog.Description>
		</Dialog.Header>

		<form method="POST" use:enhance class="grid gap-4">
			<Form.Field {form} name="name">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Name</Form.Label>
						<Input {...props} placeholder="Ada Lovelace" bind:value={$fields.name} />
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
							type="email"
							placeholder="you@example.com"
							bind:value={$fields.email}
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Form.Field {form} name="role">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Role</Form.Label>
						<Select.Root type="single" bind:value={$fields.role} name={props.name}>
							<Select.Trigger {...props}>{ROLE_LABELS[$fields.role]}</Select.Trigger>
							<Select.Content>
								{#each roles as role (role)}
									<Select.Item value={role} label={ROLE_LABELS[role]} />
								{/each}
							</Select.Content>
						</Select.Root>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" disabled={$submitting}>
					{user ? 'Save changes' : 'Create user'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
