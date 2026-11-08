<script lang="ts">
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import type { NavigationSection } from '#lib/config/navigation.js';
	import NavMain from './NavMain.svelte';

	// NavMain's menu buttons read the sidebar context, so a test mounts it inside one.
	let { sections }: { sections: NavigationSection[] } = $props();
</script>

<Sidebar.Provider>
	<Sidebar.Root>
		<Sidebar.Content>
			<NavMain {sections} />
		</Sidebar.Content>
	</Sidebar.Root>
</Sidebar.Provider>
