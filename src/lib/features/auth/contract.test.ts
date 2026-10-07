import { describe, expect, it } from 'vitest';
import { toSession } from './contract';

describe('auth contract', () => {
	it('turns the backend token pair into a session', () => {
		expect(toSession({ access_token: 'a', refresh_token: 'r', expires_at: 0 })).toEqual({
			accessToken: 'a',
			refreshToken: 'r'
		});
	});
});
