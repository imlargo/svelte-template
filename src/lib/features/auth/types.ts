import type { User } from '#lib/types/user.js';

/**
 * The two tokens of a signed-in session, as the app handles them. How the
 * backend spells them is `contract.ts`'s business.
 */
export interface Session {
	accessToken: string;
	refreshToken: string;
}

/** A completed sign-in, by password or by Google. */
export interface SignIn {
	user: User;
	session: Session;
}

/**
 * What this app's own `/refresh` route answers. Only the access token reaches
 * the browser: the refresh token is rotated into its httpOnly cookie.
 */
export interface RefreshedSession {
	accessToken: string;
}
