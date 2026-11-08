import { resolve } from '$app/paths';
import type { PageRouteId, Path, ResolvedPathname } from '$app/types';

/**
 * `resolve()` for the pathnames in `config/routes` and `config/navigation`.
 * They keep their leading slash because they are compared with `url.pathname`,
 * but `resolve` reads a leading slash as a route ID, and route groups make
 * `/admin` a different ID (`/(app)/admin`).
 */
export function resolvePathname(pathname: ResolvedPathname): ResolvedPathname {
	return resolve(pathname.slice(1) as Path);
}

/** A page without params, so `resolve(route)` needs nothing else. */
export type StaticPageRouteId = Exclude<PageRouteId, `${string}[${string}`>;

/**
 * `resolve()` for a page route held in a variable. `resolve` types its argument
 * as one tuple per route, and TypeScript stops merging those past a few dozen
 * routes (imlargo/svelte-template#24); one call site keeps that to one place.
 */
export function routeHref(route: StaticPageRouteId): ResolvedPathname {
	return resolve(route);
}

/**
 * Whether `pathname` is `route` or sits under it, by whole segments: '/admin'
 * covers '/admin/users' but not '/admin-panel', and '/' matches only itself.
 */
export function isPrefixOf(route: string, pathname: string): boolean {
	return pathname === route || pathname.startsWith(`${route}/`);
}

/** A page plus a query, for a menu that lists one page under several entries. */
export function withSearch(pathname: ResolvedPathname, search?: string): ResolvedPathname {
	return search ? (`${pathname}${search}` as ResolvedPathname) : pathname;
}

/**
 * The entry a page belongs to, out of every href a menu shows: an href with a
 * query only matches that exact page, the others match by whole segments and
 * the longest wins, so '/admin/users' lights Users and not Admin as well.
 */
export function activeHref(
	hrefs: readonly string[],
	url: { pathname: string; search: string }
): string | null {
	const exact = hrefs.find((href) => href.includes('?') && href === `${url.pathname}${url.search}`);
	if (exact) return exact;
	return hrefs
		.filter((href) => !href.includes('?') && isPrefixOf(href, url.pathname))
		.reduce<string | null>(
			(best, href) => (best && best.length >= href.length ? best : href),
			null
		);
}
