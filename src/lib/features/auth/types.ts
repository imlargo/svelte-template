import type { FieldErrors } from '#lib/utils/forms.js';
import type { LoginInput } from '#lib/features/auth/schemas.js';

/** The token pair as the app handles it; how the backend spells it is `contract.ts`'s business. */
export interface Session {
	accessToken: string;
	refreshToken: string;
}

/** What the app's own `/refresh` route answers: the refresh token stays in its httpOnly cookie. */
export interface RefreshedSession {
	accessToken: string;
}

/** What the login action answers when it does not sign the user in. */
export interface LoginFailure {
	/** Refills the field. The password never comes back. */
	email: string;
	errors?: FieldErrors<LoginInput>;
	message?: string;
}
