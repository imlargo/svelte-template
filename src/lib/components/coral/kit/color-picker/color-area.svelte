<script lang="ts">
	/**
	 * @coral/kit/color-picker
	 * @version 1.0.0
	 */
	import { cn } from '#lib/utils.js';
	import { focusRing } from '../../lib/focus.js';
	import { numberFormat } from '../../lib/intl.js';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import { hsvToHex } from './color.js';
	import { drag, keyStep, unit } from './drag.js';
	import type { ColorAreaProps } from './types.js';

	const defaults = getCoralDefaults('kit/color-picker');

	let {
		hue,
		saturation = $bindable(0),
		brightness = $bindable(0),
		disabled = false,
		oncommit,
		label = defaults.areaLabel ?? 'Saturation and brightness',
		valueText = defaults.areaValueText,
		locale = defaults.locale ?? 'en-US',
		ref = $bindable(null),
		class: className,
		thumbClass,
		...restProps
	}: ColorAreaProps = $props();

	const percent = $derived(numberFormat(locale, { style: 'percent' }));
	const spoken = $derived(
		valueText ??
			((s: number, v: number) => `Saturation ${percent.format(s)}, brightness ${percent.format(v)}`)
	);

	let thumb = $state<HTMLDivElement | null>(null);

	function press(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		if (disabled) return;
		thumb?.focus();
		drag(
			event,
			event.currentTarget,
			(x, y) => {
				saturation = x;
				brightness = 1 - y;
			},
			() => oncommit?.()
		);
	}

	/**
	 * Across is saturation, up is brightness, like the square is drawn: the arrows move the thumb
	 * the way it looks, in any reading direction, because the square is a picture and not text.
	 */
	function key(event: KeyboardEvent) {
		if (disabled) return;
		const across = keyStep(event, 'x');
		const up = across ? undefined : keyStep(event, 'y');
		const step = across ?? up;
		if (!step) return;

		event.preventDefault();
		const from = across ? saturation : brightness;
		const next = unit('to' in step ? step.to : from + step.by);
		if (across) saturation = next;
		else brightness = next;
		oncommit?.();
	}
</script>

<!--
	The square is the colour space, not decoration: its corners are the hue at full strength, white
	and black, which is what saturation and brightness mean. Those are literal colours because they
	are data: no theme changes what white is. The hue under them is a custom property for the same
	reason.
-->
<div
	bind:this={ref}
	data-disabled={disabled || undefined}
	style:--coral-hue="hsl({hue} 100% 50%)"
	class={cn(
		'relative aspect-3/2 w-full touch-none rounded-md bg-(--coral-hue)',
		'bg-[linear-gradient(to_top,black,transparent),linear-gradient(to_right,white,transparent)]',
		'data-disabled:pointer-events-none data-disabled:opacity-50',
		className
	)}
	onpointerdown={press}
	{...restProps}
>
	<!--
		A slider for its first axis, with both axes in its text: a square has no role of its own, and
		this is the reading a screen reader can act on - the arrow keys move both.
	-->
	<div
		bind:this={thumb}
		role="slider"
		tabindex={disabled ? -1 : 0}
		aria-label={label}
		aria-valuemin={0}
		aria-valuemax={100}
		aria-valuenow={Math.round(saturation * 100)}
		aria-valuetext={spoken(saturation, brightness)}
		aria-disabled={disabled || undefined}
		style:left="{saturation * 100}%"
		style:top="{(1 - brightness) * 100}%"
		style:background-color={hsvToHex({ h: hue, s: saturation, v: brightness })}
		class={cn(
			'absolute size-4 -translate-1/2 rounded-full border-2 border-background shadow-sm',
			focusRing,
			thumbClass
		)}
		onkeydown={key}
	></div>
</div>
