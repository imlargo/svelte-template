<script lang="ts">
	/**
	 * @coral/kit/color-picker
	 * @version 1.0.0
	 */
	import { onMount, untrack } from 'svelte';
	import PipetteIcon from '@lucide/svelte/icons/pipette';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as InputGroup from '#lib/components/ui/input-group/index.js';
	import { cn } from '#lib/utils.js';
	import { focusRingWithin } from '../../lib/focus.js';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import ColorArea from './color-area.svelte';
	import HueSlider from './hue-slider.svelte';
	import { hexToHsv, hsvToHex, parseHex } from './color.js';
	import type { Hsv } from './color.js';
	import type { ColorPanelProps, Swatch } from './types.js';

	const defaults = getCoralDefaults('kit/color-picker');

	let {
		value = $bindable(),
		hue = $bindable(),
		onchange,
		swatches = [],
		disabled = false,
		locale = defaults.locale ?? 'en-US',
		areaLabel = defaults.areaLabel,
		areaValueText = defaults.areaValueText,
		hueLabel = defaults.hueLabel,
		hueValueText = defaults.hueValueText,
		hexLabel = defaults.hexLabel ?? 'Hex',
		swatchesLabel = defaults.swatchesLabel ?? 'Swatches',
		eyeDropperLabel = defaults.eyeDropperLabel ?? 'Pick a colour from the screen',
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: ColorPanelProps = $props();

	/**
	 * What the panel last wrote, kept at full precision. A hex is eight bits a channel, so reading
	 * the HSV back out of the value the panel just wrote moves the thumb a fraction on every drag,
	 * and a grey or a black has no hue to read at all - the strip would jump to red the moment the
	 * thumb touched the square's edge. Only a value the panel did not write is read back.
	 */
	let local = $state<{ hex: string; hsv: Hsv } | null>(null);
	const hsv = $derived(
		local && local.hex === value
			? local.hsv
			: hexToHsv(parseHex(value) ?? '#000000', local?.hsv.h ?? hue ?? 0)
	);

	/**
	 * The last value reported, so a press that lands where the thumb already was reports nothing.
	 * A value the panel did not write - assigned from code, or loaded later - is the new baseline.
	 */
	let reported = untrack(() => value);

	function write(next: Hsv, hex: string) {
		if (value !== local?.hex) reported = value;
		local = { hex, hsv: next };
		hue = next.h;
		value = hex;
	}

	const set = (next: Hsv) => write(next, hsvToHex(next));
	const setHex = (hex: string) => write(hexToHsv(hex, hsv.h), hex);

	function commit() {
		if (value === undefined || value === reported) return;
		reported = value;
		onchange?.(value);
	}

	const options = $derived(
		swatches.map((swatch: Swatch) => {
			const { value: color, label } =
				typeof swatch === 'string' ? { value: swatch, label: swatch } : swatch;
			return { hex: parseHex(color), label };
		})
	);

	/** What the field holds while it is being typed in; `null` shows the value. */
	let draft = $state<string | null>(null);

	function commitDraft() {
		if (draft === null) return;
		const parsed = parseHex(draft);
		draft = null;
		if (!parsed || parsed === value) return;
		setHex(parsed);
		commit();
	}

	/**
	 * Enter commits rather than submitting a surrounding form. Escape undoes a half-typed hex and
	 * stops there; with nothing to undo it goes through, so a popover around the panel closes.
	 */
	function keydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			commitDraft();
		} else if (event.key === 'Escape' && draft !== null && draft !== (value ?? '')) {
			event.preventDefault();
			event.stopPropagation();
			draft = null;
		}
	}

	type EyeDropper = new () => { open: () => Promise<{ sRGBHex: string }> };

	/** Read after mount: the server cannot know, and only Chromium browsers have it so far. */
	let eyeDropper = $state<EyeDropper | null>(null);
	onMount(() => {
		eyeDropper = (window as unknown as { EyeDropper?: EyeDropper }).EyeDropper ?? null;
	});

	async function pickFromScreen() {
		if (!eyeDropper) return;
		try {
			const picked = parseHex((await new eyeDropper().open()).sRGBHex);
			if (!picked) return;
			setHex(picked);
			commit();
		} catch (error) {
			// Escape while picking is the reader changing their mind, not a failure.
			if (error instanceof DOMException && error.name === 'AbortError') return;
			throw error;
		}
	}

	/**
	 * Radios group by `name`, and a name would put each swatch in a surrounding form - so the group
	 * is pointed at a form that does not exist, like the rating group's. The picker submits its own
	 * field when it is given a `name`.
	 */
	const uid = $props.id();
</script>

<div bind:this={ref} class={cn('flex w-full flex-col gap-3', className)} {...restProps}>
	<ColorArea
		hue={hsv.h}
		bind:saturation={() => hsv.s, (s) => set({ ...hsv, s })}
		bind:brightness={() => hsv.v, (v) => set({ ...hsv, v })}
		oncommit={commit}
		label={areaLabel}
		valueText={areaValueText}
		{locale}
		{disabled}
	/>

	<div class="flex items-center gap-3">
		{#if eyeDropper}
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				aria-label={eyeDropperLabel}
				{disabled}
				onclick={pickFromScreen}
			>
				<PipetteIcon />
			</Button>
		{/if}
		<HueSlider
			bind:value={() => hsv.h, (h) => set({ ...hsv, h })}
			oncommit={commit}
			label={hueLabel}
			valueText={hueValueText}
			{locale}
			{disabled}
		/>
	</div>

	<InputGroup.Root>
		<InputGroup.Addon>
			<!-- The colour itself, beside its hex, so a typed one is seen before it is committed. -->
			<span
				class="block size-4 rounded-sm inset-ring inset-ring-foreground/10"
				style:background-color={parseHex(draft ?? undefined) ?? value}
			></span>
		</InputGroup.Addon>
		<InputGroup.Input
			value={draft ?? value ?? ''}
			aria-label={hexLabel}
			autocomplete="off"
			spellcheck={false}
			maxlength={7}
			{disabled}
			oninput={(event) => (draft = event.currentTarget.value)}
			onblur={commitDraft}
			onkeydown={keydown}
		/>
	</InputGroup.Root>

	{#if options.length > 0}
		<div role="radiogroup" aria-label={swatchesLabel} class="flex flex-wrap gap-1.5">
			{#each options as option, index (index)}
				{#if option.hex}
					<label
						class={cn(
							'relative block size-6 cursor-pointer rounded-sm inset-ring inset-ring-foreground/10',
							'has-checked:ring-2 has-checked:ring-ring has-checked:ring-offset-2 has-checked:ring-offset-background',
							focusRingWithin,
							disabled && 'pointer-events-none opacity-50'
						)}
						style:background-color={option.hex}
					>
						<input
							class="sr-only"
							type="radio"
							name="{uid}-swatches"
							form="{uid}-detached"
							value={option.hex}
							checked={option.hex === value}
							aria-label={option.label}
							{disabled}
							onchange={() => {
								if (!option.hex) return;
								setHex(option.hex);
								commit();
							}}
						/>
					</label>
				{/if}
			{/each}
		</div>
	{/if}

	{@render children?.()}
</div>
