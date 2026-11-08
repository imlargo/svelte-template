<script lang="ts">
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import type { NavigationSection } from '#lib/config/navigation.js';
	import NavMain from './NavMain.svelte';

	// NavMain's menu buttons read the sidebar context, so a test mounts it inside one. Not
	// collapsible: at the test browser's phone-sized viewport the sidebar would be a closed sheet.
	let { sections }: { sections: NavigationSection[] } = $props();
</script>

<Sidebar.Provider>
	<Sidebar.Root collapsible="none">
		<Sidebar.Content>
			<NavMain {sections} />
		</Sidebar.Content>
	</Sidebar.Root>
</Sidebar.Provider>
