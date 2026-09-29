<script lang="ts">
	/**
	 * @coral/kit/page-state
	 * @version 1.0.0
	 */
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Spinner } from '$lib/components/ui/spinner/index.js';
	import { cn } from '$lib/utils.js';
	import { Action } from '../../lib/action.svelte.js';
	import ActionButton from '../action-button/action-button.svelte';
	import { hiddenFrom, shownFrom, stateOf, waitUntil } from './delay.js';
	import type { PageStateProps } from './types.js';

	let {
		loading = false,
		error = undefined,
		empty = false,
		onretry,
		onretryerror,
		delay = 200,
		minimum = 400,
		emptyTitle = 'Nothing here yet.',
		emptyDescription,
		errorTitle = 'Something went wrong.',
		errorDescription,
		retryLabel = 'Try again',
		status = $bindable(),
		ref = $bindable(null),
		class: className,
		children,
		loadingState,
		emptyState,
		errorState,
		...restProps
	}: PageStateProps = $props();

	const retrying = new Action();

	/** Whether the wait has lasted long enough to be worth drawing. */
	let showLoading = $state(false);
	/** When it started being drawn, which is what the minimum is measured from. */
	let shownAt = 0;

	/**
	 * The two timers that keep a fast request from flashing.
	 *
	 * Nothing is drawn for the first `delay`, so a request that lands in 80ms shows the reader
	 * nothing at all. Once something *is* drawn it stays for `minimum`, because an indicator that
	 * appears and vanishes within a frame or two is a blink the eye catches and cannot resolve -
	 * which is worse than either showing it properly or not at all.
	 */
	$effect(() => {
		if (loading) {
			const since = Date.now();
			const timer = setTimeout(
				() => {
					shownAt = Date.now();
					showLoading = true;
				},
				waitUntil(shownFrom(since, { delay, minimum }), since)
			);
			return () => clearTimeout(timer);
		}

		if (!showLoading) return;

		const timer = setTimeout(
			() => (showLoading = false),
			waitUntil(hiddenFrom(shownAt, { delay, minimum }), Date.now())
		);
		return () => clearTimeout(timer);
	});

	const kind = $derived(stateOf({ loading, error, empty, showLoading }));

	// Reported outwards rather than derived by the caller, because the timing above is what decides
	// it and only this component knows how far into the delay window a wait is.
	$effect(() => {
		if (status !== kind) status = kind;
	});

	async function retry() {
		if (!onretry) return;
		try {
			await retrying.run(onretry);
		} catch (error) {
			if (!onretryerror) throw error;
			onretryerror(error);
		}
	}
</script>

<div
	bind:this={ref}
	data-state={kind}
	aria-busy={loading ? 'true' : undefined}
	class={cn('w-full', className)}
	{...restProps}
>
	{#if kind === 'error'}
		{#if errorState}
			{@render errorState({ error, retry, retrying: retrying.running })}
		{:else}
			<Empty.Root>
				<Empty.Header>
					<Empty.Media variant="icon">
						<TriangleAlertIcon />
					</Empty.Media>
					<Empty.Title>{errorTitle}</Empty.Title>
					{#if errorDescription}
						<Empty.Description>{errorDescription}</Empty.Description>
					{/if}
				</Empty.Header>
				{#if onretry}
					<Empty.Content>
						<!--
							The retry goes through `action-button`, so a failed attempt is reported and a second
							press while the first is still out does nothing - the same rules as anywhere else a
							request is waited on.
						-->
						<ActionButton variant="outline" onclick={onretry} onerror={onretryerror}>
							{retryLabel}
						</ActionButton>
					</Empty.Content>
				{/if}
			</Empty.Root>
		{/if}
	{:else if kind === 'loading'}
		{#if loadingState}
			{@render loadingState()}
		{:else}
			<div class="flex items-center justify-center py-10">
				<Spinner class="size-5" />
			</div>
		{/if}
	{:else if kind === 'empty'}
		{#if emptyState}
			{@render emptyState()}
		{:else}
			<Empty.Root>
				<Empty.Header>
					<Empty.Title>{emptyTitle}</Empty.Title>
					{#if emptyDescription}
						<Empty.Description>{emptyDescription}</Empty.Description>
					{/if}
				</Empty.Header>
			</Empty.Root>
		{/if}
	{:else}
		<!--
			`idle` renders the content too: a refresh that has not earned an indicator yet keeps the rows
			the reader is already looking at, rather than blanking the screen for a fifth of a second.
		-->
		{@render children()}
	{/if}
</div>
