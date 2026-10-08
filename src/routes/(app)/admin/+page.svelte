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
	import { Query } from '#lib/hooks/query.svelte.js';
	import { reportError } from '#lib/utils/notify.js';
	import { getAuth } from '#lib/features/auth/client-session.svelte.js';
	import { UsersService } from '#lib/features/users/services/users.js';
	import UserFormDialog from '#lib/features/users/components/UserFormDialog.svelte';
	import { ROLE_LABELS } from '#lib/config/permissions.js';
	import { UserRole, type User } from '#lib/types/user.js';
	import type { PaginatedResponse } from '#lib/types/pagination.js';
	import type { UserFormData } from '#lib/features/users/schemas.js';
	import { formatDate } from '#lib/utils/date.js';
	import { toneBadgeClass } from '#lib/utils/tone.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import UsersIcon from '@lucide/svelte/icons/users';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	// Loaded by the page, not by `load`: the list is searched and edited in place.
	const users = new UsersService(getAuth().api);
	const list = new Query<PaginatedResponse<User>>();

	let search = $state('');

	let editing = $state<User | null>(null);
	let formOpen = $state(false);
	let deleting = $state<User | null>(null);

	async function load() {
		// The params make a new search stale and a refresh after a write not.
		await list.run((signal) => users.list(search, signal), { search });
		// A refresh that fails keeps the table on screen, so it is reported here.
		if (list.error && !list.isStale) reportError(list.error);
	}

	function onSearch(term: string) {
		search = term;
		load();
	}

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
			reportError(err);
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
			<Button onclick={openCreate}>
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

		{#snippet children(page)}
			{#if page.items.length === 0}
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
						{#if !search}
							<Button variant="outline" onclick={openCreate}>New user</Button>
						{/if}
					{/snippet}
				</EmptyState>
			{:else}
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
							{#each page.items as user (user.id)}
								<Table.Row>
									<Table.Cell class="font-medium">{user.name ?? '—'}</Table.Cell>
									<Table.Cell class="text-muted-foreground">{user.email}</Table.Cell>
									<Table.Cell>
										<Badge
											variant="outline"
											class={toneBadgeClass(user.role === UserRole.ADMIN ? 'action' : 'default')}
										>
											{ROLE_LABELS[user.role]}
										</Badge>
									</Table.Cell>
									<Table.Cell class="text-muted-foreground"
										>{formatDate(user.created_at)}</Table.Cell
									>
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
			{/if}
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
	onerror={reportError}
/>
