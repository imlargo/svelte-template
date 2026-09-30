import type { RefreshedSession } from '$lib/features/auth/types';
import type { ApiAuth } from '$lib/core/api';
import { BaseService } from '$lib/core/service';

/** Must match the `(auth)/refresh` route and its entry in AUTH_PUBLIC_ROUTE_PREFIXES. */
export const SESSION_REFRESH_PATH = '/refresh';

/**
 * This app's own session routes, not the backend's. The browser cannot renew
 * a token by itself — the refresh token lives in an httpOnly cookie — so it
 * asks the server, which holds the cookie and talks to the backend.
 */
export class SessionService extends BaseService {
	// Empty base URL: same-origin routes of this app.
	constructor(auth: ApiAuth = {}) {
		super(auth, '');
	}

	refresh() {
		return this.expectBody(this.api.post<RefreshedSession>(SESSION_REFRESH_PATH));
	}
}
