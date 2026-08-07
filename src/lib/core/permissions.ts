/**
 * Role-based access checks. Pure and project-agnostic: the permission data is
 * always passed in, so this module knows nothing about the roles, permissions
 * or routes of any particular app. See `$lib/config/permissions` for the data.
 *
 * Deny by default, and it falls out of the data rather than being bolted on: a
 * role only passes when it is listed explicitly, so an unknown role coming from
 * the backend is denied instead of inheriting the permissions of a known one.
 *
 * The one exception is deliberate, not an omission: an entry declared with an
 * empty role list means "no role restriction" and lets everyone through. Not
 * declaring the entry at all still denies — that is the case that must fail
 * shut, because it is the one you get by forgetting.
 */

/** Maps a permission key to the roles that hold it. */
export type PermissionGroups<K extends string, R extends string> = Record<K, readonly R[]>;

/** Maps a route prefix to the roles allowed to reach it. */
export type RoutePermissions<R extends string> = Record<string, readonly R[]>;

export function hasPermission<K extends string, R extends string>(
	groups: PermissionGroups<K, R>,
	role: string | null | undefined,
	key: K
): boolean {
	const allowed: readonly string[] | undefined = groups[key];
	if (!allowed) return false;
	if (allowed.length === 0) return true;
	return !!role && allowed.includes(role);
}

/** No keys required means nothing to check, so it passes. */
export function hasAnyPermission<K extends string, R extends string>(
	groups: PermissionGroups<K, R>,
	role: string | null | undefined,
	keys: readonly K[]
): boolean {
	if (keys.length === 0) return true;
	return keys.some((key) => hasPermission(groups, role, key));
}

/**
 * Whether `role` may reach `pathname`. A route not declared in `routes` is
 * denied, so forgetting to register a new page fails loudly on the first click.
 * A route declared with an empty role list is open to any role — inside this
 * app that means any signed-in user, since callers run it after resolving the
 * session. Routes that must be reachable without signing in are a separate
 * list (`AUTH_PUBLIC_ROUTE_PREFIXES`), checked before this ever runs.
 */
export function canAccessRoute<R extends string>(
	routes: RoutePermissions<R>,
	role: string | null | undefined,
	pathname: string
): boolean {
	const allowed = matchLongestPrefix(routes, pathname);
	if (!allowed) return false;
	if (allowed.length === 0) return true;
	return !!role && allowed.includes(role);
}

/**
 * Longest prefix wins, so '/admin/users' resolves with its own rule when there
 * is one instead of the shallower '/admin'. The root entry matches '/' only —
 * as a prefix it would swallow every path and undo the deny-by-default.
 */
function matchLongestPrefix<R extends string>(
	routes: RoutePermissions<R>,
	pathname: string
): readonly string[] | null {
	let best: readonly string[] | null = null;
	let bestLength = -1;

	for (const [route, allowed] of Object.entries(routes)) {
		const matches = route === '/' ? pathname === '/' : isPrefixOf(route, pathname);
		if (matches && route.length > bestLength) {
			best = allowed;
			bestLength = route.length;
		}
	}

	return best;
}

function isPrefixOf(route: string, pathname: string): boolean {
	return pathname === route || pathname.startsWith(`${route}/`);
}
