/** The token pair as the app handles it; how the backend spells it is `contract.ts`'s business. */
export interface Session {
	accessToken: string;
	refreshToken: string;
}

/** What the app's own `/refresh` route answers: the refresh token stays in its httpOnly cookie. */
export interface RefreshedSession {
	accessToken: string;
}
