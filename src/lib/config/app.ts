import {
	PUBLIC_API_URL,
	PUBLIC_AUTH_BASE_URL,
	PUBLIC_AUTH_ENABLED,
	PUBLIC_AUTH_GOOGLE_ENABLED,
	PUBLIC_AUTH_PASSWORD_ENABLED,
	PUBLIC_AUTH_REFRESH_ENABLED,
	PUBLIC_GOOGLE_CLIENT_ID
} from '$app/env/public';
import defaultLogo from '#lib/assets/logo.svg';
import defaultFavicon from '#lib/assets/favicon.svg';

// The variables are declared in src/env.ts; this is the one rule that spans two of them.
if (PUBLIC_AUTH_GOOGLE_ENABLED && !PUBLIC_GOOGLE_CLIENT_ID) {
	throw new Error('PUBLIC_GOOGLE_CLIENT_ID is required when PUBLIC_AUTH_GOOGLE_ENABLED=true');
}

export const config = {
	api: {
		baseUrl: PUBLIC_API_URL
	},
	auth: {
		/** The auth service's base URL; the data API when `PUBLIC_AUTH_BASE_URL` is unset. */
		baseUrl: PUBLIC_AUTH_BASE_URL ?? PUBLIC_API_URL,
		enabled: PUBLIC_AUTH_ENABLED,
		methods: {
			password: PUBLIC_AUTH_PASSWORD_ENABLED,
			google: {
				enabled: PUBLIC_AUTH_GOOGLE_ENABLED,
				clientId: PUBLIC_GOOGLE_CLIENT_ID
			}
		},
		/** Renew with the refresh token on a rejected access token. Needs `POST /auth/refresh` on the backend. */
		refresh: {
			enabled: PUBLIC_AUTH_REFRESH_ENABLED
		}
	},
	// Hardcoded, not env-driven: this changes once per project, not per deploy environment.
	branding: {
		name: 'App',
		logo: defaultLogo,
		favicon: defaultFavicon,
		seo: {
			title: 'App',
			description: ''
		}
	}
};
