import { describe, expect, it } from 'vitest';
import { toSession, toSignIn } from './contract';
import { UserRole } from '#lib/types/user.js';

// The mappers are the seam between the backend's spelling and the app's. A
// contract change breaks here, in one file, instead of in the hook or an action.

const TOKENS = { access_token: 'access-abc', refresh_token: 'refresh-xyz', expires_at: 0 };

describe('auth contract', () => {
	it('turns a token pair into a session', () => {
		expect(toSession(TOKENS)).toEqual({ accessToken: 'access-abc', refreshToken: 'refresh-xyz' });
	});

	it('turns a sign-in into the user and their session', () => {
		const user = {
			id: '1',
			email: 'ada@example.com',
			name: 'Ada',
			role: UserRole.ADMIN,
			avatar: null,
			created_at: '2024-01-01T00:00:00.000Z',
			updated_at: '2024-01-01T00:00:00.000Z'
		};

		expect(toSignIn({ user, tokens: TOKENS })).toEqual({
			user,
			session: { accessToken: 'access-abc', refreshToken: 'refresh-xyz' }
		});
	});
});
