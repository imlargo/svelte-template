<script lang="ts" generics="R = unknown">
	/**
	 * @coral/kit/file-upload
	 * @version 1.0.0
	 */
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import FileIcon from '@lucide/svelte/icons/file';
	import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';
	import XIcon from '@lucide/svelte/icons/x';
	import * as Attachment from '#lib/components/ui/attachment/index.js';
	import { Progress } from '#lib/components/ui/progress/index.js';
	import { Spinner } from '#lib/components/ui/spinner/index.js';
	import { cn } from '#lib/utils.js';
	import FileInput from '../file-input/file-input.svelte';
	import { formatBytes } from '../file-input/format-bytes.js';
	import LiveRegion from '../../lib/live-region.svelte';
	import { Announcer } from '../../lib/announce.svelte.js';
	import { getCoralDefaults } from '../../lib/defaults.js';
	import { numberFormat } from '../../lib/intl.js';
	import { UploadQueue } from './queue.svelte.js';
	import type { Upload, UploadStatus, UploadSummary } from './queue.svelte.js';
	import type { FileUploadProps } from './types.js';

	const defaults = getCoralDefaults('kit/file-upload');

	let {
		upload,
		concurrency = defaults.concurrency ?? 3,
		uploads = $bindable([]),
		onupload,
		onsettle,
		cancelLabel = defaults.cancelLabel ?? ((file: File) => `Cancel uploading ${file.name}`),
		retryLabel = defaults.retryLabel ?? ((file: File) => `Retry uploading ${file.name}`),
		removeLabel = defaults.removeLabel ?? ((file: File) => `Remove ${file.name}`),
		progressMessage = defaults.progressMessage ??
			((fraction: number) => numberFormat(locale, { style: 'percent' }).format(fraction)),
		failedMessage = defaults.failedMessage ?? (() => 'Upload failed'),
		cancelledMessage = defaults.cancelledMessage ?? 'Cancelled',
		settledMessage = defaults.settledMessage ??
			((summary: UploadSummary) =>
				[
					`${summary.done} uploaded`,
					summary.failed > 0 && `${summary.failed} failed`,
					summary.cancelled > 0 && `${summary.cancelled} cancelled`
				]
					.filter(Boolean)
					.join(', ')),
		disabled = false,
		listClass,
		row,
		...restProps
	}: FileUploadProps<R> = $props();

	const locale = defaults.locale;
	const announcer = new Announcer();

	/**
	 * The queue is built once and reads its options live. `uploads` mirrors its list, so a form can
	 * read what landed through the binding; the queue is the only writer, and the rows draw from the
	 * mirror so the two can never disagree.
	 */
	const queue = new UploadQueue<R>({
		upload: (file, context) => upload(file, context),
		concurrency: () => concurrency,
		onupload: (entry) => onupload?.(entry),
		onsettle: (summary, all) => {
			announcer.say(settledMessage(summary));
			onsettle?.(summary, all);
		}
	});

	$effect(() => {
		uploads = queue.uploads;
	});

	/** The input is emptied as soon as it has handed its files over: the rows below are the record now. */
	let picked = $state<File[]>([]);
	function handlePick(files: File[]) {
		if (files.length === 0) return;
		queue.add(files);
		picked = [];
	}

	/** The primitive's own vocabulary for where a file stands. */
	const states: Record<UploadStatus, 'idle' | 'uploading' | 'done' | 'error'> = {
		queued: 'idle',
		uploading: 'uploading',
		done: 'done',
		failed: 'error',
		cancelled: 'idle'
	};

	function describe(entry: Upload<R>): string {
		const size = formatBytes(entry.file.size);
		if (entry.status === 'uploading') return `${size} · ${progressMessage(entry.progress)}`;
		if (entry.status === 'failed') return `${size} · ${failedMessage(entry.error)}`;
		if (entry.status === 'cancelled') return `${size} · ${cancelledMessage}`;
		return size;
	}
</script>

<div class="flex w-full flex-col gap-3">
	<FileInput bind:value={picked} onchange={handlePick} {disabled} {...restProps} />

	{#if uploads.length > 0}
		<!-- `role="list"` restated: Safari drops list semantics from a list with its bullets removed. -->
		<ul role="list" class={cn('flex flex-col gap-2', listClass)}>
			{#each uploads as entry (entry.id)}
				{@const sending = entry.status === 'queued' || entry.status === 'uploading'}
				{@const settled = entry.status === 'failed' || entry.status === 'cancelled'}
				<li class="min-w-0">
					{#if row}
						{@render row({
							upload: entry,
							cancel: () => queue.cancel(entry.id),
							retry: () => queue.retry(entry.id),
							remove: () => queue.remove(entry.id)
						})}
					{:else}
						<Attachment.Root
							state={states[entry.status]}
							class="w-full"
							aria-busy={entry.status === 'uploading' ? 'true' : undefined}
						>
							<Attachment.Media>
								{#if entry.status === 'uploading'}
									<Spinner aria-hidden="true" />
								{:else if entry.status === 'failed'}
									<CircleAlertIcon />
								{:else}
									<FileIcon />
								{/if}
							</Attachment.Media>
							<Attachment.Content>
								<Attachment.Title>{entry.file.name}</Attachment.Title>
								<Attachment.Description>{describe(entry)}</Attachment.Description>
								{#if entry.status === 'uploading'}
									<!-- Real progress, as the handler reports it, for the sighted reader; the
									     description above carries the same number for everyone else. -->
									<Progress value={entry.progress * 100} aria-hidden="true" class="mt-1" />
								{/if}
							</Attachment.Content>
							<Attachment.Actions>
								{#if sending}
									<Attachment.Action
										type="button"
										aria-label={cancelLabel(entry.file)}
										onclick={() => queue.cancel(entry.id)}
									>
										<XIcon />
									</Attachment.Action>
								{:else}
									{#if settled}
										<Attachment.Action
											type="button"
											aria-label={retryLabel(entry.file)}
											onclick={() => queue.retry(entry.id)}
										>
											<RotateCcwIcon />
										</Attachment.Action>
									{/if}
									<Attachment.Action
										type="button"
										aria-label={removeLabel(entry.file)}
										onclick={() => queue.remove(entry.id)}
									>
										<XIcon />
									</Attachment.Action>
								{/if}
							</Attachment.Actions>
						</Attachment.Root>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
</div>

<LiveRegion message={announcer.message} />
