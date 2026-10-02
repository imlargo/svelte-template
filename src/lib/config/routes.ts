import type { Path } from '$app/types';

/** Where a signed-in user lands when there is nowhere better to send them. */
export const HOME_ROUTE = '/' satisfies Path;

/** The auth flow's own routes, each a folder under `routes/(auth)/`. */
export const AUTH_ROUTES = {
	login: '/login',
	logout: '/logout',
	/** Google's OAuth callback: must match the redirect URI registered in its console. */
	authorize: '/authorize',
	refresh: '/refresh'
} as const satisfies Record<string, Path>;

/** Endpoints under it answer with a status; everything else is a page. */
export const API_ROUTE_PREFIX = '/api';
