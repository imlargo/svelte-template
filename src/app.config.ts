import { env } from '$env/dynamic/public';

export interface AppConfig {
	api: {
		baseUrl: string;
	};
	auth: {
		baseUrl: string;
		enabled: boolean;
		loginPath: string;
		defaultRedirectPath: string;
		publicRoutes: string[];
		methods: {
			password: boolean;
			google: {
				enabled: boolean;
				clientId: string;
			};
		};
	};
}

const config: AppConfig = {
	api: {
		baseUrl: env.PUBLIC_API_URL ?? ''
	},
	auth: {
		baseUrl: env.PUBLIC_AUTH_BASE_URL ?? '',
		enabled: env.PUBLIC_AUTH_ENABLED !== 'false',
		loginPath: '/login',
		defaultRedirectPath: '/',
		publicRoutes: ['/login', '/authorize', '/logout', '/register'],
		methods: {
			password: env.PUBLIC_AUTH_PASSWORD_ENABLED !== 'false',
			google: {
				enabled: env.PUBLIC_AUTH_GOOGLE_ENABLED === 'true',
				clientId: env.PUBLIC_GOOGLE_CLIENT_ID ?? ''
			}
		}
	}
};

export default config;
