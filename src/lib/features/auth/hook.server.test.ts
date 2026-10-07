import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import { isHttpError, isRedirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { handleAuth } from './hook.server';
import { AppError } from '#lib/core/errors.js';
import { UserRole, type User } from '#lib/types/user.js';

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
vi.mock('#lib/config/app.js', async (importOriginal) => {
	const { config } = await importOriginal<typeof import('#lib/config/app.js')>();
	return { config: { ...config, auth: { ...config.auth, refresh: refreshFlag } } };
});

// Silenced on purpose: the outage case logs, and its own behaviour is covered
// by core/logger.test.ts.
vi.mock('#lib/core/logger.js', () => ({
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

/** A request as the hook sees it: SvelteKit resolves the route before handle() runs. */
interface Route {
	/** Null only for a path that matched nothing. */
	id: string | null;
	path: string;
}

const HOME: Route = { id: '/(app)', path: '/' };
const ADMIN: Route = { id: '/(app)/admin', path: '/admin' };
const LOGIN: Route = { id: '/(auth)/login', path: '/login' };
const USERS_API: Route = { id: '/api/users', path: '/api/users' };
/** A page that exists but that nobody declared — impossible by type, so a stale build. */
const UNDECLARED: Route = { id: '/(app)/reports', path: '/reports' };
const UNMATCHED: Route = { id: null, path: '/nope' };

async function callAuth(route: Route, cookies: Record<string, string> = {}) {
	const clearedCookies: string[] = [];
	const setCookies: Record<string, string> = {};
	const event = {
		url: new URL(`http://localhost${route.path}`),
		route: { id: route.id },
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
		const { outcome } = await callAuth(LOGIN);

		expect(outcome).toEqual({ kind: 'resolved' });
		expect(getMe).not.toHaveBeenCalled();
	});

	it('sends a page request without a session to the login page', async () => {
		const { outcome } = await callAuth(HOME);

		expect(outcome).toEqual({ kind: 'redirect', location: '/login' });
	});

	it('keeps the route it was headed to in the redirect', async () => {
		const { outcome } = await callAuth(ADMIN);

		expect(outcome).toMatchObject({ kind: 'redirect' });
		expect((outcome as { location: string }).location).toMatch(/^\/login\?redirect=/);
	});

	it('answers a data request without a session with 401 instead of redirecting', async () => {
		// A fetch() follows a 303 in silence and then fails parsing login HTML.
		const { outcome } = await callAuth(USERS_API);

		expect(outcome).toEqual({ kind: 'error', status: 401 });
	});

	it('treats half a session as no session', async () => {
		const { outcome } = await callAuth(HOME, { access_token: 'access-abc' });

		expect(outcome).toEqual({ kind: 'redirect', location: '/login' });
	});

	it('resolves the user and exposes the access token on a valid session', async () => {
		getMe.mockResolvedValue(userWith(UserRole.ADMIN));

		const { outcome, locals } = await callAuth(HOME, SESSION);

		expect(outcome).toEqual({ kind: 'resolved' });
		expect(locals.user?.role).toBe(UserRole.ADMIN);
		expect(locals.accessToken).toBe(SESSION.access_token);
	});

	it('installs a guard bound to the resolved user', async () => {
		getMe.mockResolvedValue(userWith(UserRole.MEMBER));

		const { locals } = await callAuth(HOME, SESSION);

		expect(() => locals.requirePermission('users:delete')).toThrow();
		expect(() => locals.requirePermission('dashboard:read')).not.toThrow();
	});

	it('ends the session when the backend rejects the token', async () => {
		getMe.mockRejectedValue(new AppError('UNAUTHORIZED', 'Token expired.'));

		const { outcome, clearedCookies } = await callAuth(HOME, SESSION);

		expect(outcome).toEqual({ kind: 'redirect', location: '/login' });
		expect(clearedCookies).toContain('access_token');
	});

	it('fails the request but keeps the session when the backend is unreachable', async () => {
		getMe.mockRejectedValue(new AppError('NETWORK', 'Connection refused.'));

		const { outcome, clearedCookies } = await callAuth(HOME, SESSION);

		expect(outcome).toEqual({ kind: 'error', status: 503 });
		expect(clearedCookies).toEqual([]);
	});

	it('keeps the session when the backend answers 500', async () => {
		getMe.mockRejectedValue(new AppError('SERVER_ERROR', 'Boom.'));

		const { outcome, clearedCookies } = await callAuth(HOME, SESSION);

		expect(outcome).toEqual({ kind: 'error', status: 503 });
		expect(clearedCookies).toEqual([]);
	});
});

describe('handleAuth on page routes', () => {
	it('denies a signed-in role that lacks the permission', async () => {
		getMe.mockResolvedValue(userWith(UserRole.MEMBER));

		const { outcome } = await callAuth(ADMIN, SESSION);

		expect(outcome).toEqual({ kind: 'error', status: 403 });
	});

	it('lets the role that holds the permission in', async () => {
		getMe.mockResolvedValue(userWith(UserRole.ADMIN));

		const { outcome } = await callAuth(ADMIN, SESSION);

		expect(outcome).toEqual({ kind: 'resolved' });
	});

	it('denies a page nobody declared, whatever the role', async () => {
		getMe.mockResolvedValue(userWith(UserRole.ADMIN));

		const { outcome } = await callAuth(UNDECLARED, SESSION);

		expect(outcome).toEqual({ kind: 'error', status: 403 });
	});

	it('leaves a path with no route behind it alone, so SvelteKit can 404 it', async () => {
		const { outcome } = await callAuth(UNMATCHED, SESSION);

		expect(outcome).toEqual({ kind: 'resolved' });
		expect(getMe).not.toHaveBeenCalled();
	});
});

describe('handleAuth on endpoints', () => {
	it('does not enforce a permission on an endpoint', async () => {
		// /api/users is 'session' in ROUTE_ACCESS: the handler decides per method.
		getMe.mockResolvedValue(userWith(UserRole.ADMIN));

		const { outcome } = await callAuth(USERS_API, SESSION);

		expect(outcome).toEqual({ kind: 'resolved' });
	});

	it('leaves the decision to the handler, which gets a guard bound to the user', async () => {
		getMe.mockResolvedValue(userWith(UserRole.MEMBER));

		const { outcome, locals } = await callAuth(USERS_API, SESSION);

		expect(outcome).toEqual({ kind: 'resolved' });
		expect(() => locals.requirePermission('users:delete')).toThrow();
	});
});

describe('handleAuth with refresh enabled', () => {
	const RENEWED = { accessToken: 'access-new', refreshToken: 'refresh-new' };

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

		const { outcome, locals, setCookies, clearedCookies } = await callAuth(HOME, SESSION);

		expect(outcome).toEqual({ kind: 'resolved' });
		expect(refresh).toHaveBeenCalledWith(SESSION.refresh_token);
		expect(getMe).toHaveBeenLastCalledWith(RENEWED.accessToken);
		expect(locals.accessToken).toBe(RENEWED.accessToken);
		expect(setCookies).toMatchObject({
			access_token: RENEWED.accessToken,
			refresh_token: RENEWED.refreshToken
		});
		expect(clearedCookies).toEqual([]);
	});

	it('ends the session when the refresh token is rejected too', async () => {
		getMe.mockRejectedValue(new AppError('UNAUTHORIZED', 'Token expired.'));
		refresh.mockRejectedValue(new AppError('UNAUTHORIZED', 'Refresh token revoked.'));

		const { outcome, clearedCookies } = await callAuth(HOME, SESSION);

		expect(outcome).toEqual({ kind: 'redirect', location: '/login' });
		expect(clearedCookies).toContain('refresh_token');
	});

	it('keeps the session when the renewal fails because the backend is down', async () => {
		getMe.mockRejectedValue(new AppError('UNAUTHORIZED', 'Token expired.'));
		refresh.mockRejectedValue(new AppError('NETWORK', 'Connection refused.'));

		const { outcome, clearedCookies } = await callAuth(HOME, SESSION);

		expect(outcome).toEqual({ kind: 'error', status: 503 });
		expect(clearedCookies).toEqual([]);
	});

	it('does not renew for anything but an expired token', async () => {
		// A 403 from /auth/me is a verdict on the user, not on the token's age.
		getMe.mockRejectedValue(new AppError('FORBIDDEN', 'Account disabled.'));

		const { outcome } = await callAuth(HOME, SESSION);

		expect(outcome).toEqual({ kind: 'redirect', location: '/login' });
		expect(refresh).not.toHaveBeenCalled();
	});
});

describe('handleAuth with refresh disabled', () => {
	it('never spends the refresh token', async () => {
		getMe.mockRejectedValue(new AppError('UNAUTHORIZED', 'Token expired.'));

		const { outcome } = await callAuth(HOME, SESSION);

		expect(outcome).toEqual({ kind: 'redirect', location: '/login' });
		expect(refresh).not.toHaveBeenCalled();
	});
});
