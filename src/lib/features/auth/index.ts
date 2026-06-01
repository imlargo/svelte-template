export {
	authStore,
	AuthStore,
	authCookies,
	AuthCookiesManager,
	createAuthHandler,
	AuthService,
	hasPermission,
	canUseFeature,
	isWithinPlanLimit
} from './index.svelte';
export type {
	AuthTokens,
	AuthTokensResponse,
	SignInRequest,
	SignInResponse,
	SignUpRequest,
	SignUpResponse,
	ChangePasswordRequest,
	ChangePasswordResponse
} from './types';
