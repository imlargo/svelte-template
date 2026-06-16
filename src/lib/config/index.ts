export { default as config } from '../../app.config';
export type { AppConfig } from '../../app.config';

export {
	PERMISSION_GROUPS,
	FEATURE_FLAGS,
	PAGINATION_DEFAULTS,
	PermissionKey,
	ROLE_PRIORITY,
	ROLE_LABELS,
	AUTH_ROUTE_PERMISSIONS,
	AUTH_DEFAULT_ROUTES,
	AUTH_PUBLIC_ROUTE_PREFIXES,
	NAVIGATION_ITEMS,
	NAVIGATION_GROUP_LABELS,
	NavigationGroup
} from './domain';
export type { PermissionGroup, PermissionRole, NavigationItem } from './domain';
