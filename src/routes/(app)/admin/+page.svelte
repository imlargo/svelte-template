<script lang="ts">
	import { onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import PageHeader from '#lib/components/blocks/PageHeader.svelte';
	import DocumentTitle from '#lib/components/blocks/DocumentTitle.svelte';
	import AsyncView from '#lib/components/blocks/AsyncView.svelte';
	import EmptyState from '#lib/components/blocks/EmptyState.svelte';
	import TableSkeleton from '#lib/components/blocks/TableSkeleton.svelte';
	import TruncatedText from '#lib/components/blocks/TruncatedText.svelte';
	import SearchInput from '#lib/components/coral/kit/search-input/search-input.svelte';
	import ConfirmDialog from '#lib/components/coral/kit/confirm-dialog/confirm-dialog.svelte';
	import * as Table from '#lib/components/ui/table/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { ListQuery } from '#lib/hooks/list-query.svelte.js';
	import { normalizeError } from '#lib/core/errors.js';
	import { getAuth } from '#lib/features/auth/client-session.svelte.js';
	import { UsersService } from '#lib/features/users/services/users.js';
	import UserFormDialog from '#lib/features/users/components/UserFormDialog.svelte';
	import { ROLE_LABELS } from '#lib/config/permissions.js';
	import { UserRole, type User } from '#lib/types/user.js';
	import type { ListResponse } from '#lib/types/list.js';
	import type { UserFormData } from '#lib/features/users/schemas.js';
	import { formatDate } from '#lib/utils/date.js';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import UsersIcon from '@lucide/svelte/icons/users';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	const HEADERS = ['Name', 'Email', 'Role', 'Created', ''];

	// Loaded by the page, not by `load`: the list is searched and edited in place.
	const users = new UsersService(getAuth().api);
	const list = new ListQuery<ListResponse<User>>();

	let search = $state('');

	let editing = $state<User | null>(null);
	let formOpen = $state(false);
	let deleting = $state<User | null>(null);

	async function load() {
		await list.load({ search }, () => users.list(search));
		// A later failure keeps the table on screen, so it is reported here.
		if (list.error && list.data !== null) toast.error(list.error.message);
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

	<!-- A changed filter replaces the rows with a skeleton; a refresh keeps them. -->
	{#if list.isStale && !list.error}
		<TableSkeleton headers={HEADERS} />
	{:else}
		<AsyncView source={list}>
			{#snippet children(page)}
				{#if page.items.length === 0}
					<!-- The total tells an empty system from a filter that excludes everyone. -->
					<EmptyState
						title={page.total === 0 ? 'No users yet' : 'No matches'}
						description={page.total === 0
							? 'Create the first user to get started.'
							: `Nothing matched “${search}”.`}
					>
						{#snippet icon()}
							<UsersIcon class="size-5" />
						{/snippet}
						{#snippet action()}
							{#if page.total === 0}
								<Button variant="outline" size="sm" onclick={openCreate}>New user</Button>
							{/if}
						{/snippet}
					</EmptyState>
				{:else}
					<div class="overflow-x-auto rounded-lg border">
						<Table.Root>
							<Table.Header>
								<Table.Row>
									{#each HEADERS as header, column (column)}
										<Table.Head class={header ? '' : 'w-24 text-right'}>
											{#if header}
												{header}
											{:else}
												<span class="sr-only">Actions</span>
											{/if}
										</Table.Head>
									{/each}
								</Table.Row>
							</Table.Header>
							<Table.Body>
								{#each page.items as user (user.id)}
									<Table.Row>
										<Table.Cell class="font-medium">{user.name ?? '—'}</Table.Cell>
										<Table.Cell class="text-muted-foreground">
											<TruncatedText text={user.email} class="max-w-56" />
										</Table.Cell>
										<Table.Cell>
											<Badge variant={user.role === UserRole.ADMIN ? 'default' : 'secondary'}>
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
	{/if}
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
