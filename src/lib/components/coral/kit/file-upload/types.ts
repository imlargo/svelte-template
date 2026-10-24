/**
 * @coral/kit/file-upload
 * @version 1.0.0
 */

import type { Snippet } from 'svelte';
import type { FileInputProps } from '../file-input/types.js';
import type { Upload, UploadHandler, UploadSummary } from './queue.svelte.js';

/** What the `row` snippet receives. */
export type RowContext<R> = {
	upload: Upload<R>;
	/** Stops a file that is queued or being sent. */
	cancel: () => void;
	/** Sends a failed or cancelled file again. */
	retry: () => void;
	/** Drops a row that is no longer being sent. */
	remove: () => void;
};

/**
 * Everything `kit/file-input` takes - `accept`, `multiple`, `maxFiles`, `maxSize`, `onreject`,
 * `label`, `hint`, `zone` - stays available and reaches the input. What the input held and showed
 * is this component's: the files go into the queue the moment they are picked, and the rows are
 * the uploads.
 */
type InputProps = Omit<FileInputProps, 'value' | 'onchange' | 'file' | 'removeLabel' | 'listClass'>;

export type FileUploadProps<R> = InputProps & {
	/** Sends one file. Where it goes, and how, is yours - see `UploadHandler`. */
	upload: UploadHandler<R>;
	/** How many files are sent at once. */
	concurrency?: number;
	/** Every upload and where it stands. Bindable, read-only in spirit: the queue writes it. */
	uploads?: Upload<R>[];
	/** One file landed. Receives it with what `upload` resolved to. */
	onupload?: (upload: Upload<R>) => void;
	/** The batch is over: every file is done, failed or cancelled. Receives the tally. */
	onsettle?: (summary: UploadSummary, uploads: Upload<R>[]) => void;
	/** Accessible label for a row's cancel control. Takes the file, because "Cancel" alone names none. */
	cancelLabel?: (file: File) => string;
	/** Accessible label for a row's retry control. */
	retryLabel?: (file: File) => string;
	/** Accessible label for a row's remove control. */
	removeLabel?: (file: File) => string;
	/** The line under a file that is on its way. Receives the fraction sent. */
	progressMessage?: (fraction: number) => string;
	/** The line under a file that did not make it. Receives what the handler threw. */
	failedMessage?: (error: unknown) => string;
	/** The line under a file the reader stopped. */
	cancelledMessage?: string;
	/** Announced once the batch is over. Receives the tally. */
	settledMessage?: (summary: UploadSummary) => string;
	/** Merged onto the list of uploads. */
	listClass?: string;
	/** Replaces each row. */
	row?: Snippet<[RowContext<R>]>;
};

/** What a project can state once for every uploader - see `lib/defaults`. */
export type FileUploadDefaults = Partial<
	Pick<
		FileUploadProps<unknown>,
		| 'concurrency'
		| 'cancelLabel'
		| 'retryLabel'
		| 'removeLabel'
		| 'progressMessage'
		| 'failedMessage'
		| 'cancelledMessage'
		| 'settledMessage'
	>
>;

declare global {
	interface CoralDefaults {
		'kit/file-upload'?: FileUploadDefaults;
	}
}

export type {
	Upload,
	UploadContext,
	UploadHandler,
	UploadStatus,
	UploadSummary
} from './queue.svelte.js';
