<script lang="ts">
	/**
	 * @coral/kit/color-picker
	 * @version 1.0.0
	 */
	import * as Popover from '#lib/components/ui/popover/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import { cn } from '#lib/utils.js';
	import HiddenField from '../../lib/hidden-field.svelte';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import ColorPanel from './color-panel.svelte';
	import { parseHex } from './color.js';
	import type { ColorPickerProps } from './types.js';

	const defaults = getCoralDefaults('kit/color-picker');

	let {
		value = $bindable(),
		open = $bindable(false),
		onOpenChange,
		onchange,
		placeholder = defaults.placeholder ?? 'Pick a colour',
		disabled = false,
		name,
		form,
		required = false,
		align = 'start',
		id,
		'aria-label': ariaLabel,
		'aria-labelledby': ariaLabelledby,
		'aria-describedby': ariaDescribedby,
		'aria-invalid': ariaInvalid,
		ref = $bindable(null),
		class: className,
		contentClass,
		trigger,
		children,
		...panelProps
	}: ColorPickerProps = $props();

	const shown = $derived(parseHex(value));

	/**
	 * The panel unmounts with the popover, and a grey has no hue to read back: kept here, the strip
	 * is where the reader left it when they open the picker again.
	 */
	let hue = $state<number>();
</script>

<Popover.Root bind:open {onOpenChange}>
	<Popover.Trigger bind:ref>
		{#snippet child({ props })}
			{#if trigger}
				{@render trigger({ props, value: shown, open, disabled })}
			{:else}
				<Button
					{...props}
					id={id ?? (props.id as string | undefined)}
					variant="outline"
					{disabled}
					aria-label={ariaLabel}
					aria-labelledby={ariaLabelledby}
					aria-describedby={ariaDescribedby}
					aria-invalid={ariaInvalid}
					class={cn('justify-start', className)}
				>
					<span
						class="block size-4 shrink-0 rounded-sm inset-ring inset-ring-foreground/10"
						style:background-color={shown}
						aria-hidden="true"
					></span>
					<span class={cn('min-w-0 truncate', !shown && 'text-muted-foreground')}>
						{shown ?? placeholder}
					</span>
				</Button>
			{/if}
		{/snippet}
	</Popover.Trigger>

	<Popover.Content {align} class={contentClass}>
		<ColorPanel bind:value bind:hue {onchange} {disabled} {...panelProps} />
		{@render children?.()}
	</Popover.Content>
</Popover.Root>

{#if name}
	<HiddenField {name} {form} {required} value={shown ?? ''} />
{/if}
