<script lang="ts">
	/**
	 * @coral/kit/relative-time
	 * @version 1.0.0
	 */
	import { onMount } from 'svelte';
	import { dateTimeFormat, relativeTimeFormat } from '../../lib/intl.js';
	import { describe, nextChange, toDate } from './relative.js';
	import type { RelativeTimeProps } from './types.js';

	let {
		date,
		locale = 'en-US',
		numeric = 'auto',
		format = 'long',
		precision = 'minute',
		live = true,
		cutoff,
		titleFormat = { dateStyle: 'long', timeStyle: 'short' },
		now: pinnedNow,
		ref = $bindable(null),
		children,
		...restProps
	}: RelativeTimeProps = $props();

	/**
	 * The clock this instance reads. Rendered on the server and hydrated a moment later, the two
	 * `Date.now()` calls differ, and a label that crossed a boundary in between would mismatch - so
	 * the effect below corrects it straight after mount instead of trusting the server's copy.
	 */
	let clock = $state(Date.now());
	const now = $derived(pinnedNow ?? new Date(clock));

	const moment = $derived(toDate(date));
	const valid = $derived(Number.isFinite(moment.getTime()));

	const relativeFormat = $derived(relativeTimeFormat(locale, { numeric, style: format }));
	const absoluteFormat = $derived(dateTimeFormat(locale, titleFormat));

	const absolute = $derived(valid ? absoluteFormat.format(moment) : '');
	const pastCutoff = $derived(
		valid && cutoff !== undefined && Math.abs(moment.getTime() - now.getTime()) > cutoff
	);

	const text = $derived.by(() => {
		if (!valid) return '';
		if (pastCutoff) return absolute;
		const { value, unit } = describe(moment, now, precision);
		return relativeFormat.format(value, unit);
	});

	/**
	 * One timeout per instance, set for the exact moment this label changes - not an interval. A
	 * table of two hundred rows reading "3 days ago" wakes up every twelve hours, not every second.
	 * The dependencies are read up front so a new `date` or `precision` reschedules it.
	 */
	$effect(() => {
		// Tracked on purpose: every tick re-arms the timer for the boundary after it.
		void clock;
		if (!live || pinnedNow || !valid) return;

		const current = Date.now();
		const distance = Math.abs(moment.getTime() - current);

		let wait: number;
		if (cutoff !== undefined && distance > cutoff) {
			// An absolute date only turns relative again when a future one comes inside the cutoff.
			if (moment.getTime() < current) return;
			wait = Math.min(distance - cutoff + 1, 24 * 60 * 60 * 1000);
		} else {
			wait = nextChange(moment, new Date(current), precision);
		}

		const timer = setTimeout(() => (clock = Date.now()), wait);
		return () => clearTimeout(timer);
	});

	// Corrects the server's clock once, on mount.
	onMount(() => {
		clock = Date.now();
	});

	/**
	 * A tab in the background has its timers throttled, and a laptop that slept has missed them
	 * outright. Coming back to the page is the moment a stale "2 minutes ago" is most visible.
	 */
	$effect(() => {
		if (!live || pinnedNow) return;
		const refresh = () => {
			if (document.visibilityState === 'visible') clock = Date.now();
		};
		document.addEventListener('visibilitychange', refresh);
		return () => document.removeEventListener('visibilitychange', refresh);
	});
</script>

<!--
	`<time datetime>` carries the exact instant for machines, and `title` for the sighted reader who
	wants it. A screen reader reads the relative text, which is what a person would say out loud.
-->
<time
	bind:this={ref}
	datetime={valid ? moment.toISOString() : undefined}
	title={pastCutoff ? undefined : absolute || undefined}
	{...restProps}
>
	{#if children}
		{@render children({ text, absolute, date: moment })}
	{:else}
		{text}
	{/if}
</time>
