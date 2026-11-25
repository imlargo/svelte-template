<script lang="ts">
	/**
	 * @coral/kit/color-picker
	 * @version 1.0.0
	 */
	import { cn } from '#lib/utils.js';
	import { focusRing } from '../../lib/focus.js';
	import { numberFormat } from '../../lib/intl.js';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import { drag, keyStep, unit } from './drag.js';
	import type { HueSliderProps } from './types.js';

	const defaults = getCoralDefaults('kit/color-picker');

	let {
		value = $bindable(0),
		disabled = false,
		oncommit,
		label = defaults.hueLabel ?? 'Hue',
		valueText = defaults.hueValueText,
		locale = defaults.locale ?? 'en-US',
		ref = $bindable(null),
		class: className,
		thumbClass,
		...restProps
	}: HueSliderProps = $props();

	const degrees = $derived(
		numberFormat(locale, {
			style: 'unit',
			unit: 'degree',
			unitDisplay: 'long',
			maximumFractionDigits: 0
		})
	);
	const spoken = $derived(valueText ?? ((hue: number) => degrees.format(hue)));

	let thumb = $state<HTMLDivElement | null>(null);

	function press(event: PointerEvent & { currentTarget: HTMLDivElement }) {
		if (disabled) return;
		thumb?.focus();
		drag(
			event,
			event.currentTarget,
			(x) => (value = x * 360),
			() => oncommit?.()
		);
	}

	/** Every arrow moves it, like a native slider; the strip is drawn left to right in any language. */
	function key(event: KeyboardEvent) {
		if (disabled) return;
		const step = keyStep(event, 'x') ?? keyStep(event, 'y');
		if (!step) return;

		event.preventDefault();
		value = unit('to' in step ? step.to : value / 360 + step.by) * 360;
		oncommit?.();
	}
</script>

<!--
	Every hue at full strength, in order: the strip is the hue axis itself, so its colours are data,
	written as literals for the reason the square's are.
-->
<div
	bind:this={ref}
	data-disabled={disabled || undefined}
	class={cn(
		'relative h-3 w-full touch-none rounded-full',
		'bg-[linear-gradient(to_right,red,yellow,lime,cyan,blue,magenta,red)]',
		'data-disabled:pointer-events-none data-disabled:opacity-50',
		className
	)}
	onpointerdown={press}
	{...restProps}
>
	<div
		bind:this={thumb}
		role="slider"
		tabindex={disabled ? -1 : 0}
		aria-label={label}
		aria-valuemin={0}
		aria-valuemax={360}
		aria-valuenow={Math.round(value)}
		aria-valuetext={spoken(value)}
		aria-disabled={disabled || undefined}
		aria-orientation="horizontal"
		style:left="{(value / 360) * 100}%"
		style:background-color="hsl({value} 100% 50%)"
		class={cn(
			'absolute top-1/2 size-4 -translate-1/2 rounded-full border-2 border-background shadow-sm',
			focusRing,
			thumbClass
		)}
		onkeydown={key}
	></div>
</div>
