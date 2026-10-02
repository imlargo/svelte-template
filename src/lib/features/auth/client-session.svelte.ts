import { invalidateAll } from '$app/navigation';
import type { Fetch } from '@imlargo/air';
import type { ApiAuth } from '$lib/core/api';
import { config } from '$lib/config/app';
import { logger } from '$lib/core/logger';
import type { User } from '$lib/types/user';
import type { AuthState } from './context';
import { SessionService } from './services/session';
import { createAuthTransport } from './transport';

interface SessionData {
	user: User | null;
	accessToken: string | null;
}

/**
 * The browser's side of the session. Built in the root layout from its data
 * and shared through context — never a module-level singleton, since on the
 * server that would be one session for every user.
 */
export class ClientSession implements AuthState {
	readonly #data: () => SessionData;

	/**
	 * Follows the layout data, and is overwritten in place when `/refresh`
	 * renews the token between navigations; the next navigation brings back
	 * that same token from the server.
	 */
	accessToken = $derived.by(() => this.#data().accessToken);

	readonly api: ApiAuth;

	constructor(data: () => SessionData) {
		this.#data = data;
		this.api = {
			token: () => this.accessToken,
			fetch: createAuthTransport({
				// The server judges a 401: re-running the loads goes through the hook,
				// which sends the user to sign in if the session really is gone.
				onUnauthorized: () => invalidateAll().catch((err) => logger.error('auth', err)),
				renew: config.auth.refresh.enabled ? (fetch) => this.#renew(fetch) : undefined
			})
		};
	}

	get user(): User | null {
		return this.#data().user;
	}

	async #renew(fetch: Fetch): Promise<string | null> {
		try {
			const { accessToken } = await new SessionService({ fetch }).refresh();
			this.accessToken = accessToken;
			return accessToken;
		} catch {
			// `/refresh` already cleared a dead session or logged an outage; the
			// transport turns the null into a sign-in if it comes to that.
			return null;
		}
	}
}
