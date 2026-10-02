import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { isHttpError, isRedirect, type Handle } from '@sveltejs/kit';
import { handleAuth } from './handler.server';
import { AppError } from '$lib/core/errors';
import { UserRole, type User } from '$lib/types/user';

// The hook is the only thing standing between an anonymous request and the app,
// so what it does on a missing, rejected or unverifiable session is asserted
// here rather than discovered in production.

const { getMe, refresh } = vi.hoisted(() => ({ getMe: vi.fn(), refresh: vi.fn() }));

// `getMe` is called with whatever token the service was built with, so the
// renewal cases can assert that the second call used the renewed one.
vi.mock('./services/auth', () => ({
	AuthService: class {
		constructor(private auth: { token?: string } = {}) {}
		getMe = () => getMe(this.auth.token);
		refresh = refresh;
	}
}));

const { refreshFlag } = vi.hoisted(() => ({ refreshFlag: { enabled: false } }));

// A test-owned flag in place of the real config's, which stays untouched.
vi.mock('$lib/config/app', async (importOriginal) => {
	const { config } = await importOriginal<typeof import('$lib/config/app')>();
	return { config: { ...config, auth: { ...config.auth, refresh: refreshFlag } } };
});

// Silenced on purpose: the outage case logs, and its own behaviour is covered
// by core/logger.test.ts.
vi.mock('$lib/core/logger', () => ({
	logger: { error: vi.fn(() => 'logged'), warn: vi.fn(), info: vi.fn() }
}));

const SESSION = { access_token: 'access-abc', refresh_token: 'refresh-xyz' };

function userWith(role: UserRole): User {
	return {
		id: '1',
		email: 'test@example.com',
		name: 'Test',
		role,
		avatar: null,
		created_at: '2024-01-01T00:00:00.000Z',
		updated_at: '2024-01-01T00:00:00.000Z'
	};
}

type Outcome =
	{ kind: 'resolved' } | { kind: 'redirect'; location: string } | { kind: 'error'; status: number };

async function callAuth(
	pathname: string,
	cookies: Record<string, string> = {},
	routeId: string | null = pathname
) {
	const clearedCookies: string[] = [];
	const setCookies: Record<string, string> = {};
	const event = {
		url: new URL(`http://localhost${pathname}`),
		// Non-null unless the caller is testing an unmatched path: SvelteKit
		// resolves the route before handle() runs.
		route: { id: routeId },
		locals: {} as App.Locals,
		cookies: {
			get: (name: string) => cookies[name],
			delete: (name: string) => {
				clearedCookies.push(name);
			},
			set: (name: string, value: string) => {
				setCookies[name] = value;
			}
		}
	};
	const resolve = vi.fn(async () => new Response('ok'));

	let outcome: Outcome;
	try {
		await handleAuth({ event, resolve } as unknown as Parameters<Handle>[0]);
		outcome = { kind: 'resolved' };
	} catch (err) {
		if (isRedirect(err)) outcome = { kind: 'redirect', location: err.location };
		else if (isHttpError(err)) outcome = { kind: 'error', status: err.status };
		else throw err;
	}

	return { outcome, clearedCookies, setCookies, locals: event.locals };
}

beforeEach(() => {
	getMe.mockReset();
	refresh.mockReset();
});

describe('handleAuth', () => {
	it('lets a public route through without a session', async () => {
		const { outcome } = await callAuth('/login');

		expect(outcome).toEqual({ kind: 'resolved' });
		expect(getMe).not.toHaveBeenCalled();
	});

	it('sends a page request without a session to the login page', async () => {
		const { outcome } = await callAuth('/');

		expect(outcome).toEqual({ kind: 'redirect', location: '/login' });
	});

	it('keeps the route it was headed to in the redirect', async () => {
		const { outcome } = await callAuth('/admin');

		expect(outcome).toMatchObject({ kind: 'redirect' });
		expect((outcome as { location: string }).location).toMatch(/^\/login\?redirect=/);
	});

	it('answers a data request without a session with 401 instead of redirecting', async () => {
		// A fetch() follows a 303 in silence and then fails parsing login HTML.
		const { outcome } = await callAuth('/api/users');

		expect(outcome).toEqual({ kind: 'error', status: 401 });
	});

	it('treats half a session as no session', async () => {
		const { outcome } = await callAuth('/', { access_token: 'access-abc' });

		expect(outcome).toEqual({ kind: 'redirect', location: '/login' });
	});

	it('resolves the user and exposes the access token on a valid session', async () => {
		getMe.mockResolvedValue(userWith(UserRole.ADMIN));

		const { outcome, locals } = await callAuth('/', SESSION);

		expect(outcome).toEqual({ kind: 'resolved' });
		expect(locals.user?.role).toBe(UserRole.ADMIN);
		expect(locals.accessToken).toBe(SESSION.access_token);
	});

	it('installs a guard bound to the resolved user', async () => {
		getMe.mockResolvedValue(userWith(UserRole.MEMBER));

		const { locals } = await callAuth('/', SESSION);

		expect(() => locals.requirePermission('users:delete')).toThrow();
		expect(() => locals.requirePermission('dashboard:read')).not.toThrow();
	});

	it('ends the session when the backend rejects the token', async () => {
		getMe.mockRejectedValue(new AppError('UNAUTHORIZED', 'Token expired.'));

		const { outcome, clearedCookies } = await callAuth('/', SESSION);

		expect(outcome).toEqual({ kind: 'redirect', location: '/login' });
		expect(clearedCookies).toContain('access_token');
	});

	it('fails the request but keeps the session when the backend is unreachable', async () => {
		// An outage must not sign everyone out: that turns downtime into a
		// stampede of logins and throws away whatever the user was doing.
		getMe.mockRejectedValue(new AppError('NETWORK', 'Connection refused.'));

		const { outcome, clearedCookies } = await callAuth('/', SESSION);

		expect(outcome).toEqual({ kind: 'error', status: 503 });
		expect(clearedCookies).toEqual([]);
	});

	it('keeps the session when the backend answers 500', async () => {
		getMe.mockRejectedValue(new AppError('SERVER_ERROR', 'Boom.'));

		const { outcome, clearedCookies } = await callAuth('/', SESSION);

		expect(outcome).toEqual({ kind: 'error', status: 503 });
		expect(clearedCookies).toEqual([]);
	});
});

// The two halves of the app authorize differently on purpose. These are the
// assertions that keep one of them from quietly deciding for the other.

describe('handleAuth on page routes', () => {
	it('denies a signed-in role that lacks the permission', async () => {
		// A member typing /admin in the address bar.
		getMe.mockResolvedValue(userWith(UserRole.MEMBER));

		const { outcome } = await callAuth('/admin', SESSION);

		expect(outcome).toEqual({ kind: 'error', status: 403 });
	});

	it('lets the role that holds the permission in', async () => {
		getMe.mockResolvedValue(userWith(UserRole.ADMIN));

		const { outcome } = await callAuth('/admin', SESSION);

		expect(outcome).toEqual({ kind: 'resolved' });
	});

	it('denies a page nobody declared, whatever the role', async () => {
		getMe.mockResolvedValue(userWith(UserRole.ADMIN));

		const { outcome } = await callAuth('/reports', SESSION);

		expect(outcome).toEqual({ kind: 'error', status: 403 });
	});

	it('leaves a path with no route behind it alone, so SvelteKit can 404 it', async () => {
		// A mistyped URL is not a permission problem. Answering 403 here would
		// also mean a round trip to /auth/me for every bad path a crawler tries.
		const { outcome } = await callAuth('/nope', SESSION, null);

		expect(outcome).toEqual({ kind: 'resolved' });
		expect(getMe).not.toHaveBeenCalled();
	});
});

describe('handleAuth on endpoints', () => {
	it('does not apply the page table to /api', async () => {
		// /api/users is absent from AUTH_ROUTE_PERMISSIONS by design: judging it
		// as a page would 403 every call, admins included.
		getMe.mockResolvedValue(userWith(UserRole.ADMIN));

		const { outcome } = await callAuth('/api/users', SESSION);

		expect(outcome).toEqual({ kind: 'resolved' });
	});

	it('leaves the decision to the handler, which gets a guard bound to the user', async () => {
		getMe.mockResolvedValue(userWith(UserRole.MEMBER));

		const { outcome, locals } = await callAuth('/api/users', SESSION);

		// The hook passes it through...
		expect(outcome).toEqual({ kind: 'resolved' });
		// ...and the handler's own call is what refuses a member.
		expect(() => locals.requirePermission('users:delete')).toThrow();
	});
});

describe('handleAuth with refresh enabled', () => {
	const RENEWED = { access_token: 'access-new', refresh_token: 'refresh-new', expires_at: 0 };

	beforeEach(() => {
		refreshFlag.enabled = true;
	});
	afterEach(() => {
		refreshFlag.enabled = false;
	});

	it('renews an expired access token and carries on with the new one', async () => {
		getMe.mockImplementation(async (token: string) => {
			if (token === SESSION.access_token) throw new AppError('UNAUTHORIZED', 'Token expired.');
			return userWith(UserRole.ADMIN);
		});
		refresh.mockResolvedValue(RENEWED);

		const { outcome, locals, setCookies, clearedCookies } = await callAuth('/', SESSION);

		expect(outcome).toEqual({ kind: 'resolved' });
		expect(refresh).toHaveBeenCalledWith(SESSION.refresh_token);
		expect(getMe).toHaveBeenLastCalledWith(RENEWED.access_token);
		expect(locals.accessToken).toBe(RENEWED.access_token);
		expect(setCookies).toMatchObject({
			access_token: RENEWED.access_token,
			refresh_token: RENEWED.refresh_token
		});
		expect(clearedCookies).toEqual([]);
	});

	it('ends the session when the refresh token is rejected too', async () => {
		getMe.mockRejectedValue(new AppError('UNAUTHORIZED', 'Token expired.'));
		refresh.mockRejectedValue(new AppError('UNAUTHORIZED', 'Refresh token revoked.'));

		const { outcome, clearedCookies } = await callAuth('/', SESSION);

		expect(outcome).toEqual({ kind: 'redirect', location: '/login' });
		expect(clearedCookies).toContain('refresh_token');
	});

	it('keeps the session when the renewal fails because the backend is down', async () => {
		getMe.mockRejectedValue(new AppError('UNAUTHORIZED', 'Token expired.'));
		refresh.mockRejectedValue(new AppError('NETWORK', 'Connection refused.'));

		const { outcome, clearedCookies } = await callAuth('/', SESSION);

		expect(outcome).toEqual({ kind: 'error', status: 503 });
		expect(clearedCookies).toEqual([]);
	});

	it('does not renew for anything but an expired token', async () => {
		// A 403 from /auth/me is a verdict on the user, not on the token's age.
		getMe.mockRejectedValue(new AppError('FORBIDDEN', 'Account disabled.'));

		const { outcome } = await callAuth('/', SESSION);

		expect(outcome).toEqual({ kind: 'redirect', location: '/login' });
		expect(refresh).not.toHaveBeenCalled();
	});
});

describe('handleAuth with refresh disabled', () => {
	it('never spends the refresh token', async () => {
		getMe.mockRejectedValue(new AppError('UNAUTHORIZED', 'Token expired.'));

		const { outcome } = await callAuth('/', SESSION);

		expect(outcome).toEqual({ kind: 'redirect', location: '/login' });
		expect(refresh).not.toHaveBeenCalled();
	});
});
