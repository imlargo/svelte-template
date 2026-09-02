<script lang="ts">
	import { browser } from '$app/environment';
	import { toast } from 'svelte-sonner';
	import PageHeader from '$lib/components/blocks/PageHeader.svelte';
	import AsyncView from '$lib/components/blocks/AsyncView.svelte';
	import EmptyState from '$lib/components/blocks/EmptyState.svelte';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as AlertDialog from '$lib/components/ui/alert-dialog/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { createQuery } from '$lib/core/query.svelte';
	import { normalizeError } from '$lib/core/errors';
	import { getAuth } from '$lib/features/auth/context';
	import { UsersService } from '$lib/features/users/services/users';
	import UserFormDialog from '$lib/features/users/components/UserFormDialog.svelte';
	import { ROLE_LABELS } from '$lib/config/permissions';
	import { UserRole, type User } from '$lib/types/user';
	import type { UserFormData } from '$lib/features/users/schemas';
	import { formatDate } from '$lib/utils/date';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import UsersIcon from '@lucide/svelte/icons/users';

	const auth = getAuth();
	const users = new UsersService(() => auth().accessToken);
	const list = createQuery<User[]>();

	let search = $state('');
	let searchTimer: ReturnType<typeof setTimeout>;

	let editing = $state<User | null>(null);
	let formOpen = $state(false);
	let deleting = $state<User | null>(null);
	let isDeleting = $state(false);

	async function load() {
		await list.run(() => users.list(search));
		if (list.error) toast.error(list.error.message);
	}

	// Debounced so typing doesn't fire a request per keystroke — which is also
	// what keeps overlapping runs (and their ordering) out of the picture.
	function onSearch() {
		clearTimeout(searchTimer);
		searchTimer = setTimeout(load, 300);
	}

	// Effects don't run on the server, but this is a plain call: guard it so the
	// relative /api/users URL is only ever requested from the browser.
	if (browser) load();

	function openCreate() {
		editing = null;
		formOpen = true;
	}

	function openEdit(user: User) {
		editing = user;
		formOpen = true;
	}

	/** Returns whether it succeeded, so the dialog knows to close. */
	async function save(data: UserFormData): Promise<boolean> {
		const target = editing;
		try {
			if (target) await users.update(target.id, data);
			else await users.create(data);
		} catch (err) {
			toast.error(normalizeError(err).message);
			return false;
		}

		toast.success(target ? 'User updated.' : 'User created.');
		await load();
		return true;
	}

	async function confirmDelete() {
		if (!deleting) return;

		isDeleting = true;
		try {
			await users.remove(deleting.id);
			toast.success(`${deleting.email} was removed.`);
			deleting = null;
			await load();
		} catch (err) {
			toast.error(normalizeError(err).message);
		} finally {
			isDeleting = false;
		}
	}
</script>

<svelte:head><title>Users · Admin</title></svelte:head>

<div class="flex flex-col gap-6">
	<PageHeader title="Users" description="Create, edit and remove the people in this workspace.">
		{#snippet actions()}
			<Button size="sm" onclick={openCreate}>
				<PlusIcon class="size-4" />
				New user
			</Button>
		{/snippet}
	</PageHeader>

	<Input
		type="search"
		placeholder="Search by name or email…"
		class="max-w-sm"
		bind:value={search}
		oninput={onSearch}
	/>

	<AsyncView query={list}>
		{#snippet children(rows)}
			<div class="rounded-lg border">
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Name</Table.Head>
							<Table.Head>Email</Table.Head>
							<Table.Head>Role</Table.Head>
							<Table.Head>Created</Table.Head>
							<Table.Head class="w-24 text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each rows as user (user.id)}
							<Table.Row>
								<Table.Cell class="font-medium">{user.name ?? '—'}</Table.Cell>
								<Table.Cell class="text-muted-foreground">{user.email}</Table.Cell>
								<Table.Cell>
									<Badge variant={user.role === UserRole.ADMIN ? 'default' : 'secondary'}>
										{ROLE_LABELS[user.role]}
									</Badge>
								</Table.Cell>
								<Table.Cell class="text-muted-foreground">{formatDate(user.created_at)}</Table.Cell>
								<Table.Cell class="text-right">
									<Button
										variant="ghost"
										size="icon"
										aria-label="Edit {user.email}"
										onclick={() => openEdit(user)}
									>
										<PencilIcon class="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										aria-label="Delete {user.email}"
										onclick={() => (deleting = user)}
									>
										<Trash2Icon class="size-4 text-destructive" />
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/snippet}

		{#snippet empty()}
			<EmptyState
				title={search ? 'No matches' : 'No users yet'}
				description={search
					? `Nothing matched “${search}”.`
					: 'Create the first user to get started.'}
			>
				{#snippet icon()}
					<UsersIcon class="size-5" />
				{/snippet}
				{#snippet action()}
					<Button variant="outline" size="sm" onclick={openCreate}>New user</Button>
				{/snippet}
			</EmptyState>
		{/snippet}
	</AsyncView>
</div>

{#if formOpen}
	<UserFormDialog bind:open={formOpen} user={editing} onsubmit={save} />
{/if}

<AlertDialog.Root open={deleting !== null} onOpenChange={(o) => !o && (deleting = null)}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete this user?</AlertDialog.Title>
			<AlertDialog.Description>
				{deleting?.email} will lose access immediately. This cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action disabled={isDeleting} onclick={confirmDelete}>Delete</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
