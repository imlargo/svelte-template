import { redirect, type Handle } from '@sveltejs/kit';
import { authCookiesManager } from '$lib/server/cookies/manager';
import type { User } from '$lib/domain/models';
import { AuthService } from '$lib/features/auth/services/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const homePath = '/';

	const isLogin =
		event.url.pathname === '/login' ||
		event.url.pathname === '/authorize' ||
		event.url.pathname === '/logout';

	if (isLogin) {
		if (event.url.pathname === '/login' && event.request.method === 'GET') {
			authCookiesManager.logout(event.cookies);
		}

		return await resolve(event);
	}

	const hasAuthCookies = authCookiesManager.isAuthenticated(event.cookies);
	if (!hasAuthCookies) {
		// Only add redirect parameter if it's not the my-courses page, or if my-courses page has search parameters
		if ((event.url.pathname !== '/' && event.url.pathname !== homePath) || event.url.search) {
			const redirectTo = btoa(event.url.pathname + event.url.search);
			redirect(303, `/login?redirect=${redirectTo}`);
		} else {
			redirect(303, '/login');
		}
	}

	const authTokens = authCookiesManager.getTokens(event.cookies);
	event.locals.accessToken = authTokens?.accessToken;
	event.locals.refreshToken = authTokens?.refreshToken;

	try {
		const authService = new AuthService(authTokens.accessToken);
		const user = (await authService.getMe()) as User;
		event.locals.user = user;
		const response = await resolve(event);
		return response;
	} catch (error) {
		console.error('Error fetching user data:', error);
		authCookiesManager.logout(event.cookies);

		// Only add redirect parameter if it's not the home page, or if home page has search parameters
		if (event.url.pathname !== homePath || event.url.search) {
			const redirectTo = btoa(event.url.pathname + event.url.search);
			redirect(303, `/login?redirect=${redirectTo}`);
		} else {
			redirect(303, '/login');
		}
	}
};
