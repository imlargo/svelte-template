import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isHttpError } from '@sveltejs/kit';
import { POST } from './+server';
import { AppError } from '#lib/core/errors.js';

// The browser's only way to renew a session. What it does with a dead refresh
// token and with an outage mirrors the hook, and is asserted the same way.

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));

const { refreshFlag } = vi.hoisted(() => ({ refreshFlag: { enabled: false } }));

// A test-owned flag in place of the real config's, which stays untouched.
vi.mock('#lib/config/app.js', async (importOriginal) => {
	const { config } = await importOriginal<typeof import('#lib/config/app.js')>();
	return { config: { ...config, auth: { ...config.auth, refresh: refreshFlag } } };
});

vi.mock('#lib/features/auth/services/auth.js', () => ({
	AuthService: class {
		refresh = refresh;
	}
}));

vi.mock('#lib/core/logger.js', () => ({
	logger: { error: vi.fn(() => 'logged'), warn: vi.fn(), info: vi.fn() }
}));

const SESSION = { access_token: 'access-old', refresh_token: 'refresh-old' };
const RENEWED = { accessToken: 'access-new', refreshToken: 'refresh-new' };

async function callRefresh(cookies: Record<string, string> = SESSION) {
	const cleared: string[] = [];
	const set: Record<string, string> = {};
	const event = {
		cookies: {
			get: (name: string) => cookies[name],
			set: (name: string, value: string) => {
				set[name] = value;
			},
			delete: (name: string) => {
				cleared.push(name);
			}
		}
	};

	try {
		const response = await POST(event as unknown as Parameters<typeof POST>[0]);
		return { status: response.status, body: await response.json(), cleared, set };
	} catch (err) {
		if (isHttpError(err)) return { status: err.status, body: err.body, cleared, set };
		throw err;
	}
}

beforeEach(() => {
	refresh.mockReset();
	refreshFlag.enabled = true;
});
afterEach(() => {
	refreshFlag.enabled = false;
});

describe('POST /refresh', () => {
	it('does not exist unless refresh is enabled', async () => {
		refreshFlag.enabled = false;

		expect((await callRefresh()).status).toBe(404);
		expect(refresh).not.toHaveBeenCalled();
	});

	it('answers 401 without a session to renew', async () => {
		expect((await callRefresh({})).status).toBe(401);
	});

	it('rotates the cookies and gives the browser only the access token', async () => {
		refresh.mockResolvedValue(RENEWED);

		const { status, body, set } = await callRefresh();

		expect(status).toBe(200);
		expect(body).toEqual({ accessToken: RENEWED.accessToken });
		expect(set).toMatchObject({ refresh_token: RENEWED.refreshToken });
	});

	it('ends the session when the backend rejects the refresh token', async () => {
		refresh.mockRejectedValue(new AppError('UNAUTHORIZED', 'Revoked.'));

		const { status, cleared } = await callRefresh();

		expect(status).toBe(401);
		expect(cleared).toContain('refresh_token');
	});

	it('keeps the session through an outage', async () => {
		refresh.mockRejectedValue(new AppError('NETWORK', 'Connection refused.'));

		const { status, cleared } = await callRefresh();

		expect(status).toBe(503);
		expect(cleared).toEqual([]);
	});
});
