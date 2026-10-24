/**
 * @coral/kit/file-upload
 * @version 1.0.0
 */

/** Where one file stands. */
export type UploadStatus = 'queued' | 'uploading' | 'done' | 'failed' | 'cancelled';

export type Upload<R = unknown> = {
	/** Stable for the life of the row, across retries. */
	id: string;
	file: File;
	status: UploadStatus;
	/** `0` to `1`, as the handler reports it. */
	progress: number;
	/** What the handler resolved to, once `done`. */
	result?: R;
	/** What it threw, once `failed`. */
	error?: unknown;
};

export type UploadContext = {
	/** Aborted when the reader cancels. Hand it to `fetch`, or read it to stop an `XMLHttpRequest`. */
	signal: AbortSignal;
	/** Reports how far the file is, `0` to `1`. */
	onprogress: (fraction: number) => void;
};

/**
 * Sends one file and resolves to whatever the project wants back - a URL, an id. Where it goes and
 * how is the project's: Coral never fetches. `fetch` reports no upload progress, so a handler that
 * wants a real bar uses `XMLHttpRequest` and forwards its `upload.progress` events.
 */
export type UploadHandler<R> = (file: File, context: UploadContext) => Promise<R>;

/** How a batch ended: how many landed, how many did not, how many the reader stopped. */
export type UploadSummary = {
	done: number;
	failed: number;
	cancelled: number;
};

export type UploadQueueOptions<R> = {
	upload: UploadHandler<R>;
	/** How many files are in flight at once. */
	concurrency: () => number;
	/** One file reached `done`. */
	onupload?: (upload: Upload<R>) => void;
	/** Every file in the batch is done, failed or cancelled. */
	onsettle?: (summary: UploadSummary, uploads: Upload<R>[]) => void;
};

/**
 * The files picked, each with where its upload stands, and the running of those uploads a few at
 * a time. Ten files started at once saturate the connection and trip a server's limits; one at a
 * time wastes the connection. A cancel aborts the request rather than hiding the row, a retry
 * sends that one file again, and a failure is kept on its own row instead of failing the batch or
 * sending everything again.
 */
export class UploadQueue<R = unknown> {
	#options: UploadQueueOptions<R>;
	// Plain, not a SvelteMap: it holds the controllers that abort requests, and nothing renders from it.
	// eslint-disable-next-line svelte/prefer-svelte-reactivity
	#controllers = new Map<string, AbortController>();
	#next = 0;
	/** Whether a batch is under way, so settling is reported once per batch and not per file. */
	#active = false;

	uploads = $state<Upload<R>[]>([]);

	constructor(options: UploadQueueOptions<R>) {
		this.#options = options;
	}

	get inFlight(): number {
		return this.uploads.filter((upload) => upload.status === 'uploading').length;
	}

	/** Whether anything is still queued or being sent. */
	get busy(): boolean {
		return this.uploads.some(
			(upload) => upload.status === 'queued' || upload.status === 'uploading'
		);
	}

	get summary(): UploadSummary {
		return {
			done: this.uploads.filter((upload) => upload.status === 'done').length,
			failed: this.uploads.filter((upload) => upload.status === 'failed').length,
			cancelled: this.uploads.filter((upload) => upload.status === 'cancelled').length
		};
	}

	/** Queues files and starts sending them. */
	add(files: File[]): void {
		for (const file of files) {
			this.uploads.push({ id: `upload-${this.#next++}`, file, status: 'queued', progress: 0 });
		}
		this.#pump();
	}

	/** Stops a file that is queued or being sent. The request is aborted, not just the row hidden. */
	cancel(id: string): void {
		const upload = this.#find(id);
		if (!upload || (upload.status !== 'queued' && upload.status !== 'uploading')) return;
		if (upload.status === 'queued') {
			upload.status = 'cancelled';
			this.#settleIfDone();
			return;
		}
		// The abort rejects the handler's promise, and `#send` records the cancel from there.
		this.#controllers.get(id)?.abort();
	}

	/** Sends a failed or cancelled file again, on the same row. */
	retry(id: string): void {
		const upload = this.#find(id);
		if (!upload || (upload.status !== 'failed' && upload.status !== 'cancelled')) return;
		upload.status = 'queued';
		upload.progress = 0;
		upload.error = undefined;
		this.#pump();
	}

	/** Drops a row that is no longer being sent. */
	remove(id: string): void {
		const upload = this.#find(id);
		if (!upload || upload.status === 'uploading') return;
		this.uploads = this.uploads.filter((entry) => entry.id !== id);
	}

	#find(id: string): Upload<R> | undefined {
		return this.uploads.find((upload) => upload.id === id);
	}

	#pump(): void {
		for (const upload of this.uploads) {
			if (this.inFlight >= this.#options.concurrency()) break;
			if (upload.status === 'queued') {
				this.#active = true;
				this.#send(upload);
			}
		}
	}

	async #send(upload: Upload<R>): Promise<void> {
		const controller = new AbortController();
		this.#controllers.set(upload.id, controller);
		upload.status = 'uploading';
		upload.progress = 0;

		try {
			upload.result = await this.#options.upload(upload.file, {
				signal: controller.signal,
				onprogress: (fraction) => {
					if (upload.status === 'uploading') upload.progress = Math.min(1, Math.max(0, fraction));
				}
			});
			upload.progress = 1;
			upload.status = 'done';
			this.#options.onupload?.(upload);
		} catch (error) {
			if (controller.signal.aborted) {
				upload.status = 'cancelled';
			} else {
				upload.status = 'failed';
				upload.error = error;
			}
		} finally {
			this.#controllers.delete(upload.id);
			this.#pump();
			this.#settleIfDone();
		}
	}

	#settleIfDone(): void {
		if (!this.#active || this.busy) return;
		this.#active = false;
		this.#options.onsettle?.(this.summary, this.uploads);
	}
}
