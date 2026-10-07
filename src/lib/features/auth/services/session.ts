import type { RefreshedSession } from '#lib/features/auth/types.js';
import { SAME_ORIGIN, type ApiAuth } from '#lib/core/api.js';
import { AUTH_ROUTES } from '#lib/config/routes.js';
import { BaseService } from '#lib/core/service.js';

/**
 * This app's own session routes, not the backend's: the refresh token lives in
 * an httpOnly cookie, so the browser asks the server to spend it.
 */
export class SessionService extends BaseService {
	constructor(auth: ApiAuth = {}) {
		super(SAME_ORIGIN, auth);
	}

	refresh() {
		return this.expectBody(this.api.post<RefreshedSession>(AUTH_ROUTES.refresh));
	}
}
