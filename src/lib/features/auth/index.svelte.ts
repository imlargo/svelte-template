export { authStore, AuthStore } from './stores/auth.svelte';
export { authCookies, AuthCookiesManager } from './cookies';
export { createAuthHandler } from './handler';
export { AuthService } from './services/auth';
export { encodeRedirect, decodeRedirect, sanitizeRedirect } from './redirect';
export {
	hasPermission,
	hasAnyPermission,
	resolveRole,
	canAccessRoute,
	resolveDefaultRoute
} from './permissions';
