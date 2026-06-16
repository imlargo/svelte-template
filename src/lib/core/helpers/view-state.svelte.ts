import { normalizeError } from '$lib/core/errors';
import type { AsyncViewState } from '$lib/types/ui/view-state';

export class ViewState {
	state: AsyncViewState = $state('idle');
	error: string | null = $state(null);

	get isIdle() { return this.state === 'idle'; }
	get isLoading() { return this.state === 'loading'; }
	get isSuccess() { return this.state === 'success'; }
	get isError() { return this.state === 'error'; }
	get isEmpty() { return this.state === 'empty'; }

	setLoading() {
		this.state = 'loading';
		this.error = null;
	}

	setSuccess() {
		this.state = 'success';
		this.error = null;
	}

	setError(err?: unknown) {
		this.state = 'error';
		this.error = err != null ? normalizeError(err).getMessage() : 'Something went wrong.';
	}

	setEmpty() {
		this.state = 'empty';
		this.error = null;
	}

	reset() {
		this.state = 'idle';
		this.error = null;
	}

	async run<T>(
		action: () => Promise<T>,
		options?: {
			isEmpty?: (result: T) => boolean;
			onError?: (err: unknown) => void;
		}
	): Promise<T | null> {
		this.setLoading();
		try {
			const result = await action();
			if (options?.isEmpty?.(result)) {
				this.setEmpty();
			} else {
				this.setSuccess();
			}
			return result;
		} catch (err) {
			this.setError(err);
			options?.onError?.(err);
			return null;
		}
	}
}
