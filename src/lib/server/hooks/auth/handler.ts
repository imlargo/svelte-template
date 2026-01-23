import { redirect, type Handle, type Cookies, type RequestEvent } from '@sveltejs/kit';
import type { AuthCookiesManager } from '$lib/server/cookies/cookies';
import type { User } from '$lib/domain/models/user';

interface AuthTokens {
	accessToken: string;
	refreshToken: string;
}

interface AuthHandlerParams {
	/**
	 * Gestor de cookies de autenticación
	 */
	cookieManager: AuthCookiesManager;

	/**
	 * Función que obtiene los datos del usuario autenticado
	 */
	fetchUser: (accessToken: string) => Promise<User>;

	/**
	 * Rutas públicas que no requieren autenticación
	 * @default ['/login', '/register', '/forgot-password']
	 */
	publicRoutes?: string[];

	/**
	 * Rutas protegidas que requieren autenticación
	 * Puede ser un array de rutas exactas o una función de validación
	 * @default (pathname) => !publicRoutes.includes(pathname)
	 */
	protectedRoutes?: string[] | ((pathname: string) => boolean);

	/**
	 * Ruta de login
	 * @default '/login'
	 */
	loginPath?: string;

	/**
	 * Ruta de redirección después de login exitoso
	 * @default '/'
	 */
	defaultRedirectPath?: string;

	/**
	 * Rutas que no deben preservar el parámetro de redirección
	 * @default [defaultRedirectPath]
	 */
	noRedirectPreservation?: string[];

	/**
	 * Callback cuando ocurre un error de autenticación
	 */
	onAuthError?: (error: unknown, event: RequestEvent) => void;

	/**
	 * Función para personalizar cómo se asignan los datos al evento
	 */
	assignLocals?: (event: RequestEvent, user: User, tokens: AuthTokens) => void;
}

export function createAuthHandler(params: AuthHandlerParams): Handle {
	const {
		cookieManager,
		fetchUser,
		publicRoutes = ['/login', '/register', '/forgot-password'],
		protectedRoutes,
		loginPath = '/login',
		defaultRedirectPath = '/',
		noRedirectPreservation = [defaultRedirectPath],
		onAuthError,
		assignLocals
	} = params;

	const publicRoutesSet = new Set(publicRoutes);

	/**
	 * Determina si una ruta está protegida
	 */
	const isProtectedRoute = (pathname: string): boolean => {
		if (publicRoutesSet.has(pathname)) {
			return false;
		}

		if (Array.isArray(protectedRoutes)) {
			return protectedRoutes.includes(pathname);
		}

		if (typeof protectedRoutes === 'function') {
			return protectedRoutes(pathname);
		}

		// Por defecto, todas las rutas no públicas están protegidas
		return true;
	};

	/**
	 * Determina si se debe preservar la URL de redirección
	 */
	const shouldPreserveRedirect = (pathname: string, search: string): boolean => {
		return !noRedirectPreservation.includes(pathname) || Boolean(search);
	};

	/**
	 * Construye la URL de redirección al login
	 */
	const buildLoginRedirectUrl = (pathname: string, search: string): string => {
		if (!shouldPreserveRedirect(pathname, search)) {
			return loginPath;
		}

		const fullPath = pathname + search;
		const encodedRedirect = btoa(fullPath);
		return `${loginPath}?redirect=${encodedRedirect}`;
	};

	/**
	 * Maneja el logout y redirección
	 */
	const handleUnauthenticated = async (cookies: Cookies, pathname: string, search: string) => {
		cookieManager.logout(cookies);
		const redirectUrl = buildLoginRedirectUrl(pathname, search);
		return await redirect(303, redirectUrl);
	};

	/**
	 * Asigna los datos de autenticación al evento
	 */
	const setEventLocals = (event: RequestEvent, user: User, tokens: AuthTokens): void => {
		if (assignLocals) {
			assignLocals(event, user, tokens);
			return;
		}

		// Asignación por defecto
		event.locals.accessToken = tokens.accessToken;
		event.locals.refreshToken = tokens.refreshToken;
		event.locals.user = user;
	};

	return async ({ event, resolve }) => {
		const { pathname, search } = event.url;

		// Permitir acceso a rutas públicas
		if (!isProtectedRoute(pathname)) {
			return await resolve(event);
		}

		// Verificar que existan cookies de autenticación
		if (!cookieManager.isAuthenticated(event.cookies)) {
			return await handleUnauthenticated(event.cookies, pathname, search);
		}

		// Obtener tokens
		const tokens = cookieManager.getTokens(event.cookies);
		if (!tokens) {
			return await handleUnauthenticated(event.cookies, pathname, search);
		}

		// Obtener datos del usuario
		try {
			const user = await fetchUser(tokens.accessToken);
			setEventLocals(event, user, tokens);
			return await resolve(event);
		} catch (error) {
			// Ejecutar callback de error si existe
			if (onAuthError) {
				await onAuthError(error, event);
			} else {
				console.error('Error al autenticar usuario:', error);
			}

			return await handleUnauthenticated(event.cookies, pathname, search);
		}
	};
}
