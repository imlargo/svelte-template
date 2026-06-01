export interface AppConfig {
	api: {
		baseUrl: string;
	};
	auth: {
		enabled: boolean;
		loginPath: string;
		defaultRedirectPath: string;
		publicRoutes: string[];
		googleClientId: string;
	};
}

const config: AppConfig = {
	api: {
		baseUrl: import.meta.env.VITE_API_URL ?? ''
	},
	auth: {
		enabled: import.meta.env.VITE_AUTH_ENABLED !== 'false',
		loginPath: '/login',
		defaultRedirectPath: '/',
		publicRoutes: ['/login', '/authorize', '/logout', '/register'],
		googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
	}
};

export default config;
