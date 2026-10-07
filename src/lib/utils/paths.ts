import { resolve } from '$app/paths';
import type { Path, ResolvedPathname } from '$app/types';

/**
 * `resolve()` for the pathnames in `config/routes` and `config/navigation`.
 * They keep their leading slash because they are compared with `url.pathname`,
 * but `resolve` reads a leading slash as a route ID, and route groups make
 * `/admin` a different ID (`/(app)/admin`).
 */
export function resolvePathname(pathname: ResolvedPathname): ResolvedPathname {
	return resolve(pathname.slice(1) as Path);
}

/**
 * Whether `pathname` is `route` or sits under it, by whole segments: '/admin'
 * covers '/admin/users' but not '/admin-panel', and '/' matches only itself.
 */
export function isPrefixOf(route: string, pathname: string): boolean {
	return pathname === route || pathname.startsWith(`${route}/`);
}
