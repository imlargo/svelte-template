<script lang="ts">
	import { page } from '$app/state';
	import type { ResolvedPathname } from '$app/types';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import * as Collapsible from '#lib/components/ui/collapsible/index.js';
	import * as Sidebar from '#lib/components/ui/sidebar/index.js';
	import type {
		NavigationBadge,
		NavigationItem,
		NavigationSection,
		NavigationSubItem
	} from '#lib/config/navigation.js';
	import { cn } from '#lib/utils.js';
	import { activeHref, routeHref, withSearch } from '#lib/utils/paths.js';
	import { toneBadgeClass } from '#lib/utils/tone.js';

	let { sections }: { sections: NavigationSection[] } = $props();

	function hrefOf(entry: NavigationItem | NavigationSubItem): ResolvedPathname {
		return withSearch(routeHref(entry.route), 'search' in entry ? entry.search : undefined);
	}

	const hrefs = $derived(
		sections.flatMap((section) =>
			section.items.flatMap((item) => [hrefOf(item), ...(item.items ?? []).map(hrefOf)])
		)
	);
	const active = $derived(activeHref(hrefs, page.url));
</script>

{#snippet link(item: NavigationItem, href: ResolvedPathname)}
	<Sidebar.MenuButton isActive={active === href} tooltipContent={item.title}>
		{#snippet child({ props })}
			<a {href} {...props} aria-current={active === href ? 'page' : undefined}>
				<item.icon />
				<span>{item.title}</span>
			</a>
		{/snippet}
	</Sidebar.MenuButton>
{/snippet}

{#snippet badge(value: NavigationBadge, beforeAction: boolean)}
	<!-- Right after the button: the badge positions itself against its `peer`. -->
	<Sidebar.MenuBadge class={cn('border', toneBadgeClass(value.tone), beforeAction && 'right-7')}>
		{value.label}
	</Sidebar.MenuBadge>
{/snippet}

{#each sections as section (section.group)}
	<Sidebar.Group>
		{#if section.placement === 'main'}
			<Sidebar.GroupLabel>{section.label}</Sidebar.GroupLabel>
		{/if}
		<Sidebar.GroupContent>
			<Sidebar.Menu aria-label={section.label}>
				{#each section.items as item (item.route)}
					{@const href = hrefOf(item)}
					{#if item.items}
						{@const subItems = item.items}
						<!-- Open while the page is here or under it; the chevron still folds it. -->
						<Collapsible.Root
							open={active === href || subItems.some((sub) => active === hrefOf(sub))}
							class="group/collapsible"
						>
							{#snippet child({ props })}
								<Sidebar.MenuItem {...props}>
									{@render link(item, href)}
									{#if item.badge}
										{@render badge(item.badge, true)}
									{/if}
									<Collapsible.Trigger>
										{#snippet child({ props })}
											<Sidebar.MenuAction {...props} showOnHover={false}>
												<ChevronRightIcon
													class="transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
												/>
												<span class="sr-only">Toggle {item.title}</span>
											</Sidebar.MenuAction>
										{/snippet}
									</Collapsible.Trigger>
									<Collapsible.Content>
										<Sidebar.MenuSub>
											{#each subItems as sub (hrefOf(sub))}
												{@const subHref = hrefOf(sub)}
												<Sidebar.MenuSubItem>
													<Sidebar.MenuSubButton isActive={active === subHref}>
														{#snippet child({ props })}
															<a
																href={subHref}
																{...props}
																aria-current={active === subHref ? 'page' : undefined}
															>
																<span>{sub.title}</span>
															</a>
														{/snippet}
													</Sidebar.MenuSubButton>
												</Sidebar.MenuSubItem>
											{/each}
										</Sidebar.MenuSub>
									</Collapsible.Content>
								</Sidebar.MenuItem>
							{/snippet}
						</Collapsible.Root>
					{:else}
						<Sidebar.MenuItem>
							{@render link(item, href)}
							{#if item.badge}
								{@render badge(item.badge, false)}
							{/if}
						</Sidebar.MenuItem>
					{/if}
				{/each}
			</Sidebar.Menu>
		</Sidebar.GroupContent>
	</Sidebar.Group>
{/each}
