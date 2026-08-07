import { UserRole } from '$lib/types/user';

/**
 * What can be done, as `resource:action` — the convention OAuth scopes, GitHub
 * tokens and most RBAC systems use, and for the same reason: it names a
 * capability instead of a place in the UI. `users:delete` still means the same
 * thing after the page that used it is renamed, moved or removed.
 *
 * Add one when something in the app needs it, not before. Every entry here has
 * a caller; a permission nobody asks for protects nothing.
 */
export type Permission =
	| 'dashboard:read'
	| 'settings:read'
	| 'users:read'
	| 'users:write'
	| 'users:delete';

export const ROLE_LABELS: Record<UserRole, string> = {
	[UserRole.ADMIN]: 'Admin',
	[UserRole.MEMBER]: 'Member'
};

/**
 * What each role may do. This is the whole authorization model, and the one
 * thing both halves of the app share: `users:delete` means the same for a page
 * and for an endpoint, so defining it twice would be two definitions to keep
 * in sync.
 *
 * Read it as a grant list, and grant explicitly: a role holds exactly what is
 * written here. Deny by default then falls out of the data instead of being a
 * check someone can forget — a role the backend invents tomorrow arrives with
 * an empty grant list and can do nothing until you decide otherwise.
 */
export const ROLE_PERMISSIONS = {
	[UserRole.ADMIN]: ['dashboard:read', 'settings:read', 'users:read', 'users:write', 'users:delete'],
	[UserRole.MEMBER]: ['dashboard:read', 'settings:read']
} as const satisfies Record<UserRole, readonly Permission[]>;

// Reachable without a session. Matched by prefix, so '/login' also covers
// '/login/callback'. Everything else requires one — that part stays central,
// because a route that forgets to authenticate must not be a route that opens.
export const AUTH_PUBLIC_ROUTE_PREFIXES = ['/login', '/logout', '/authorize'] as const;

/**
 * Which permission each **page** needs. Pages are a tree the user navigates, so
 * they are declared as a tree and enforced once, in the hook, before any load
 * runs: every page needs an entry and one that is missing is denied, so a new
 * page fails loudly on the first click instead of shipping open.
 *
 * This is the page axis and only the page axis. Endpoints under `/api/` are
 * deliberately absent: a path cannot express that GET needs `users:read` and
 * DELETE needs `users:delete`, so each handler asks for its own. Keeping them
 * out of this table is what stops one of the two models from quietly deciding
 * things about the other.
 */
export const AUTH_ROUTE_PERMISSIONS = {
	'/': 'dashboard:read',
	'/settings': 'settings:read',
	// The admin area is the users screen, so it asks for the same permission its
	// endpoints do. That reuse is the point of naming capabilities, not places.
	'/admin': 'users:read'
} as const satisfies Record<string, Permission>;
