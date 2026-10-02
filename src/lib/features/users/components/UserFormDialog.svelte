<script lang="ts">
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import * as Field from '#lib/components/ui/field/index.js';
	import * as Select from '#lib/components/ui/select/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { untrack } from 'svelte';
	import { UserFormSchema, type UserFormData } from '#lib/features/users/schemas.js';
	import { ROLE_LABELS } from '#lib/config/permissions.js';
	import { UserRole } from '#lib/types/user.js';
	import type { User } from '#lib/types/user.js';
	import { parseForm, toFieldErrors, validateField, type FieldErrors } from '#lib/utils/forms.js';

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
	const initial = untrack(() => ({
		name: user?.name ?? '',
		email: user?.email ?? '',
		role: user?.role ?? UserRole.MEMBER
	}));

	let role = $state(initial.role);
	let errors = $state<FieldErrors<UserFormData>>({});
	let submitting = $state(false);

	const roles = Object.values(UserRole);

	function validate(event: Event & { currentTarget: HTMLInputElement }) {
		const { name, value } = event.currentTarget;
		errors = {
			...errors,
			[name]: validateField(UserFormSchema, name as keyof UserFormData, value)
		};
	}

	// No form action to post to: the parent calls the API.
	async function submit(event: SubmitEvent & { currentTarget: HTMLFormElement }) {
		event.preventDefault();

		const parsed = parseForm(UserFormSchema, new FormData(event.currentTarget));
		errors = parsed.errors ?? {};
		if (!parsed.data) return;

		submitting = true;
		try {
			if (await onsubmit(parsed.data)) open = false;
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>{user ? 'Edit user' : 'New user'}</Dialog.Title>
			<Dialog.Description>
				{user ? `Update the details for ${user.email}.` : 'Add a new user to the workspace.'}
			</Dialog.Description>
		</Dialog.Header>

		<form method="POST" onsubmit={submit} novalidate>
			<Field.Group>
				<Field.Field data-invalid={errors.name ? true : undefined}>
					<Field.Label for="user-name">Name</Field.Label>
					<Input
						id="user-name"
						name="name"
						placeholder="Ada Lovelace"
						value={initial.name}
						aria-invalid={errors.name ? true : undefined}
						onchange={validate}
					/>
					<Field.Error errors={toFieldErrors(errors.name)} />
				</Field.Field>

				<Field.Field data-invalid={errors.email ? true : undefined}>
					<Field.Label for="user-email">Email</Field.Label>
					<Input
						id="user-email"
						name="email"
						type="email"
						placeholder="you@example.com"
						value={initial.email}
						aria-invalid={errors.email ? true : undefined}
						onchange={validate}
					/>
					<Field.Error errors={toFieldErrors(errors.email)} />
				</Field.Field>

				<Field.Field data-invalid={errors.role ? true : undefined}>
					<Field.Label for="user-role">Role</Field.Label>
					<!-- `name` renders the hidden input the form data is read from. -->
					<Select.Root type="single" name="role" bind:value={role}>
						<Select.Trigger id="user-role">{ROLE_LABELS[role]}</Select.Trigger>
						<Select.Content>
							{#each roles as option (option)}
								<Select.Item value={option} label={ROLE_LABELS[option]} />
							{/each}
						</Select.Content>
					</Select.Root>
					<Field.Error errors={toFieldErrors(errors.role)} />
				</Field.Field>

				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
					<Button type="submit" disabled={submitting}>
						{user ? 'Save changes' : 'Create user'}
					</Button>
				</Dialog.Footer>
			</Field.Group>
		</form>
	</Dialog.Content>
</Dialog.Root>
