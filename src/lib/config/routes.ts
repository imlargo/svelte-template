import type { ResolvedPathname } from '$app/types';

/** Where a signed-in user lands when there is nowhere better to send them. */
export const HOME_ROUTE = '/' satisfies ResolvedPathname;

/** The auth flow's own routes, as pathnames because they are redirect targets. */
export const AUTH_ROUTES = {
	login: '/login',
	logout: '/logout',
	/** Google's OAuth callback: must match the redirect URI registered in its console. */
	authorize: '/authorize',
	refresh: '/refresh'
} as const satisfies Record<string, ResolvedPathname>;
