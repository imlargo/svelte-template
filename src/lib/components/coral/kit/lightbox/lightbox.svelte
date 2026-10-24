<script lang="ts" generics="T">
	/**
	 * @coral/kit/lightbox
	 * @version 1.0.0
	 */
	import * as Carousel from '#lib/components/ui/carousel/index.js';
	import * as Dialog from '#lib/components/ui/dialog/index.js';
	import { cn } from '#lib/utils.js';
	import LiveRegion from '../../lib/live-region.svelte';
	import { Announcer } from '../../lib/announce.svelte.js';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import type { CarouselAPI } from '#lib/components/ui/carousel/context.js';
	import type { LightboxMedia, LightboxProps } from './types.js';

	const defaults = getCoralDefaults('kit/lightbox');

	let {
		items,
		getMedia = (item: T) => item as LightboxMedia,
		open = $bindable(false),
		index = $bindable(0),
		onindexchange,
		label = defaults.label ?? 'Media viewer',
		positionLabel = defaults.positionLabel ??
			((position: number, total: number) => `${position} of ${total}`),
		previousLabel = defaults.previousLabel ?? 'Previous',
		nextLabel = defaults.nextLabel ?? 'Next',
		class: className,
		media,
		footer,
		...restProps
	}: LightboxProps<T> = $props();

	let api = $state<CarouselAPI>();
	let content = $state<HTMLDivElement | null>(null);

	const total = $derived(items.length);
	const position = $derived(positionLabel(index + 1, total));
	const announcer = new Announcer();

	/**
	 * The carousel reports where it landed; the slide index is the one thing both sides write, so a
	 * move made by swipe, arrow or button and one assigned from code end up in the same place.
	 */
	function handleSelect() {
		if (!api) return;
		const landed = api.selectedScrollSnap();
		if (landed === index) return;
		index = landed;
		onindexchange?.(landed);
		announcer.say(positionLabel(landed + 1, total));
		pauseOthers(landed);
	}

	/** A video keeps playing off screen unless told otherwise, and sound with no picture is a bug. */
	function pauseOthers(current: number) {
		content?.querySelectorAll<HTMLVideoElement>('video').forEach((video) => {
			if (
				Number(video.closest<HTMLElement>('[data-coral-slide]')?.dataset.coralSlide) !== current
			) {
				video.pause();
			}
		});
	}

	$effect(() => {
		if (!api) return;
		api.on('select', handleSelect);
		return () => api?.off('select', handleSelect);
	});

	// `index` assigned from code while the viewer is open moves the carousel there.
	$effect(() => {
		if (api && api.selectedScrollSnap() !== index) api.scrollTo(index, true);
	});

	/**
	 * The arrows work from anywhere in the viewer, not only while a button has focus, which is what
	 * the primitive gives: a reader who opened a picture and presses Right expects the next one.
	 */
	function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLElement }) {
		if (event.defaultPrevented || !api) return;
		const rtl = getComputedStyle(event.currentTarget).direction === 'rtl';
		const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
		const back = rtl ? 'ArrowRight' : 'ArrowLeft';

		if (event.key === forward) api.scrollNext();
		else if (event.key === back) api.scrollPrev();
		else if (event.key === 'Home') api.scrollTo(0);
		else if (event.key === 'End') api.scrollTo(total - 1);
		else return;
		event.preventDefault();
	}
</script>

<!--
	A dialog, so Escape closes the viewer and nothing behind it, focus is trapped while it is open and
	returns to the thumbnail that opened it when it closes. The slides are the carousel primitive's,
	which brings the swipe and the drag; what is added is the keyboard from anywhere, the position
	said out loud, the pictures beside the current one loaded ahead, and a video stopped when it is
	moved away from.
-->
<Dialog.Root bind:open {...restProps}>
	<Dialog.Content
		bind:ref={content}
		class={cn(
			'flex h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-none flex-col gap-2 sm:max-w-none',
			className
		)}
		onkeydown={handleKeydown}
	>
		<Dialog.Header class="sr-only">
			<Dialog.Title>{label}</Dialog.Title>
			<Dialog.Description>{position}</Dialog.Description>
		</Dialog.Header>

		{#if total > 0}
			<!-- The viewport the primitive wraps the slides in gets the height too, or the pictures size
			     to themselves instead of to the room they have. -->
			<Carousel.Root
				opts={{ startIndex: index, watchDrag: total > 1 }}
				setApi={(instance) => (api = instance)}
				class="min-h-0 flex-1 [&>[data-slot=carousel-content]]:h-full"
			>
				<Carousel.Content class="h-full">
					{#each items as item, slide (slide)}
						{@const current = slide === index}
						{@const near = Math.abs(slide - index) <= 1}
						<Carousel.Item data-coral-slide={slide} class="flex h-full items-center justify-center">
							{#if media}
								{@render media({ item, index: slide, current })}
							{:else}
								{@const entry = getMedia(item)}
								{#if entry.kind === 'video'}
									<!-- svelte-ignore a11y_media_has_caption -->
									<video
										src={entry.src}
										poster={entry.poster}
										aria-label={entry.alt}
										controls
										preload={near ? 'metadata' : 'none'}
										class="max-h-full max-w-full"
									></video>
								{:else}
									<!-- The pictures beside the current one are fetched ahead, so moving does
									     not flash an empty frame; the rest wait until they are near. -->
									<img
										src={entry.src}
										alt={entry.alt ?? ''}
										loading={near ? 'eager' : 'lazy'}
										decoding="async"
										class="max-h-full max-w-full object-contain"
									/>
								{/if}
							{/if}
						</Carousel.Item>
					{/each}
				</Carousel.Content>

				{#if total > 1}
					<Carousel.Previous class="start-2" aria-label={previousLabel} />
					<Carousel.Next class="end-2" aria-label={nextLabel} />
				{/if}
			</Carousel.Root>

			<div class="flex items-center justify-between gap-4 text-muted-foreground">
				<span aria-hidden="true">{position}</span>
				{#if footer}
					{@render footer({ item: items[index], index, current: true })}
				{/if}
			</div>
		{/if}
	</Dialog.Content>
</Dialog.Root>

<!-- Assertive: the move is something the reader just did, and the answer should not wait. -->
<LiveRegion message={announcer.message} assertive />
