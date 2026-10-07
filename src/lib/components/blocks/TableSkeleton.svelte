<script lang="ts">
	import * as Table from '#lib/components/ui/table/index.js';
	import { Skeleton } from '#lib/components/ui/skeleton/index.js';

	// The caller passes the headers it renders when the data is there, so
	// nothing moves when the rows arrive. An empty header is an actions column.
	let { headers, rows = 5 }: { headers: string[]; rows?: number } = $props();
</script>

<div class="overflow-x-auto rounded-lg border" aria-busy="true" aria-label="Loading">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				{#each headers as header, column (column)}
					<Table.Head>
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
			{#each { length: rows }, row (row)}
				<Table.Row>
					{#each { length: headers.length }, column (column)}
						<Table.Cell>
							<Skeleton class="h-4 {column === 0 ? 'w-48' : 'w-20'}" />
						</Table.Cell>
					{/each}
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</div>
