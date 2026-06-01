import { getErrorMessage } from './error-message';

export interface LoadingState {
	loading: boolean;
	error: string | null;
}

export async function withLoading<T>(
	state: LoadingState,
	action: () => Promise<T>,
	opts?: { silent?: boolean }
): Promise<T> {
	state.loading = true;
	state.error = null;
	try {
		return await action();
	} catch (err) {
		if (!opts?.silent) state.error = getErrorMessage(err);
		throw err;
	} finally {
		state.loading = false;
	}
}
