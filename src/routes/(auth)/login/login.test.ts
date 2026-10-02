import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isActionFailure, isRedirect } from '@sveltejs/kit';
import { actions } from './+page.server';
import { AppError } from '#lib/core/errors.js';
import { encodeRedirect } from '#lib/features/auth/redirect.js';

const { login, logError } = vi.hoisted(() => ({ login: vi.fn(), logError: vi.fn() }));

vi.mock('#lib/features/auth/services/auth.js', () => ({
	AuthService: class {
		login = login;
	}
}));

vi.mock('#lib/core/logger.js', () => ({
	logger: { error: logError, warn: vi.fn(), info: vi.fn() }
}));

const TOKENS = { access_token: 'access', refresh_token: 'refresh', expires_at: 0 };

async function submitLogin(search = '') {
	const set: Record<string, string> = {};
	const url = new URL(`http://localhost/login?/login${search}`);
	const event = {
		url,
		request: new Request(url, {
			method: 'POST',
			body: new URLSearchParams({ email: 'ada@example.com', password: 'secret' })
		}),
		cookies: {
			set: (name: string, value: string) => {
				set[name] = value;
			}
		}
	};

	try {
		const result = await actions.login(event as unknown as Parameters<typeof actions.login>[0]);
		return { result, set };
	} catch (err) {
		if (isRedirect(err)) return { location: err.location, set };
		throw err;
	}
}

beforeEach(() => {
	login.mockReset();
	logError.mockReset();
});

describe('login action', () => {
	it('signs in and returns the user to where they were headed', async () => {
		login.mockResolvedValue({ tokens: TOKENS });

		const { location, set } = await submitLogin(`&redirect=${encodeRedirect('/admin')}`);

		expect(location).toBe('/admin');
		expect(set).toMatchObject({ access_token: 'access', refresh_token: 'refresh' });
	});

	it('lands on home without a redirect', async () => {
		login.mockResolvedValue({ tokens: TOKENS });

		expect((await submitLogin()).location).toBe('/');
	});

	it('answers rejected credentials without saying which half was wrong', async () => {
		login.mockRejectedValue(new AppError('UNAUTHORIZED'));

		const { result } = await submitLogin();

		expect(isActionFailure(result)).toBe(true);
		expect(result).toMatchObject({
			status: 401,
			data: { form: { message: 'Invalid email or password.' } }
		});
		expect(logError).not.toHaveBeenCalled();
	});

	it('does not blame the password when the backend is down', async () => {
		login.mockRejectedValue(new AppError('NETWORK'));

		const { result } = await submitLogin();

		expect(result).toMatchObject({ status: 503 });
		expect(logError).toHaveBeenCalledOnce();
	});
});
