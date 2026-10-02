<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import PageHeader from '#lib/components/blocks/PageHeader.svelte';
	import DocumentTitle from '#lib/components/blocks/DocumentTitle.svelte';
	import AsyncView from '#lib/components/blocks/AsyncView.svelte';
	import EmptyState from '#lib/components/blocks/EmptyState.svelte';
	import SearchInput from '#lib/components/coral/kit/search-input/search-input.svelte';
	import ConfirmDialog from '#lib/components/coral/kit/confirm-dialog/confirm-dialog.svelte';
	import * as Table from '#lib/components/ui/table/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';
	import { createQuery } from '#lib/core/query.svelte.js';
	import { normalizeError } from '#lib/core/errors.js';
	import { getAuth } from '#lib/features/auth/context.js';
	import { UsersService } from '#lib/features/users/services/users.js';
	import UserFormDialog from '#lib/features/users/components/UserFormDialog.svelte';
	import { ROLE_LABELS } from '#lib/config/permissions.js';
	import { UserRole, type User } from '#lib/types/user.js';
	import type { UserFormData } from '#lib/features/users/schemas.js';
	import { formatDate } from '#lib/utils/date.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import UsersIcon from '@lucide/svelte/icons/users';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	// Loaded by the page, not by `load`: the list is searched and edited in
	// place, and a refetch should update the table rather than replace it.
	const users = new UsersService(getAuth().api);
	const list = createQuery<User[]>();

	let search = $state('');

	let editing = $state<User | null>(null);
	let formOpen = $state(false);
	let deleting = $state<User | null>(null);

	async function load() {
		await list.run(() => users.list(search));
		// A first load that fails is AsyncView's error panel; a later one keeps
		// the table on screen, so it is reported here instead.
		if (list.error && list.data !== null) toast.error(list.error.message);
	}

	function onSearch(term: string) {
		search = term;
		load();
	}

	// The relative /api/users URL is only requested from the browser; the
	// server renders the skeleton.
	onMount(load);

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
		const target = deleting;
		if (!target) return;

		await users.remove(target.id);
		toast.success(`${target.email} was removed.`);
		await load();
	}
</script>

<DocumentTitle title="Users" />

<div class="flex flex-col gap-6">
	<PageHeader title="Users" description="Create, edit and remove the people in this workspace.">
		{#snippet actions()}
			<Button size="sm" onclick={openCreate}>
				<PlusIcon class="size-4" />
				New user
			</Button>
		{/snippet}
	</PageHeader>

	<SearchInput
		placeholder="Search by name or email…"
		groupClass="max-w-sm"
		onsearch={onSearch}
		loading={list.isLoading}
	/>

	<AsyncView source={list}>
		{#snippet loading()}
			<div
				class="flex flex-col gap-3 rounded-lg border p-4"
				aria-busy="true"
				aria-label="Loading users"
			>
				{#each { length: 5 }, i (i)}
					<div class="flex items-center gap-4">
						<Skeleton class="h-4 w-32" />
						<Skeleton class="h-4 flex-1" />
						<Skeleton class="h-5 w-16 rounded-full" />
					</div>
				{/each}
			</div>
		{/snippet}

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

<ConfirmDialog
	open={deleting !== null}
	onOpenChange={(o) => !o && (deleting = null)}
	title="Delete this user?"
	description="{deleting?.email} will lose access immediately. This cannot be undone."
	confirmLabel="Delete"
	variant="destructive"
	onconfirm={confirmDelete}
	onerror={(err) => toast.error(normalizeError(err).message)}
/>
