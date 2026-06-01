import { getErrorMessage, normalizeError, type AppError } from '$lib/core/errors';

export interface LoadingState {
	loading: boolean;
	error: string | null;
}

// Wraps an async action with loading/error state management.
// Pass onError to handle the full AppError (e.g. show a toast, redirect on 401).
//
// Usage:
//   const state = $state({ loading: false, error: null })
//   await withLoading(state, () => service.fetch(), {
//     onError: (err) => err.isAuth() ? goto('/login') : toast.error(err.getMessage())
//   })
export async function withLoading<T>(
	state: LoadingState,
	action: () => Promise<T>,
	onError?: (err: AppError) => void
): Promise<T> {
	state.loading = true;
	state.error = null;
	try {
		return await action();
	} catch (err) {
		const error = normalizeError(err);
		state.error = getErrorMessage(err);
		onError?.(error);
		throw error;
	} finally {
		state.loading = false;
	}
}
