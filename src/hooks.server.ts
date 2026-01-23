import type { Handle } from '@sveltejs/kit';
import { authCookiesManager } from '$lib/server/cookies/manager';
import { AuthService } from '$lib/features/auth/services/auth';
import { createAuthHandler } from '$lib/server/hooks/auth';

export const handle: Handle = createAuthHandler({
	// Gestor de cookies
	cookieManager: authCookiesManager,

	// Función para obtener el usuario
	fetchUser: async (accessToken: string) => {
		const authService = new AuthService(accessToken);
		return await authService.getMe();
	},

	// Rutas públicas que no requieren autenticación
	publicRoutes: ['/login', '/authorize', '/logout'],

	// Ruta de login
	loginPath: '/login',

	// Ruta de redirección después de login exitoso
	defaultRedirectPath: '/',

	// Rutas donde NO se debe preservar el redirect (solo home '/')
	noRedirectPreservation: ['/'],

	// Manejo de errores personalizado
	onAuthError: (error, event) => {
		console.error('Error fetching user data:', error);
		// Aquí podrías agregar logging adicional o métricas
	}
});
