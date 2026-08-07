import { describe, expect, it, vi, beforeEach } from 'vitest';
import { isHttpError, isRedirect, type Handle } from '@sveltejs/kit';
import { handleAuth } from './handler.server';
import { ApiError } from '$lib/core/errors';
import { UserRole, type User } from '$lib/types/user';

// The hook is the only thing standing between an anonymous request and the app,
// so what it does on a missing, rejected or unverifiable session is asserted
// here rather than discovered in production.

const { getMe } = vi.hoisted(() => ({ getMe: vi.fn() }));

vi.mock('./services/auth', () => ({
	AuthService: class {
		getMe = getMe;
	}
}));

// Silenced on purpose: the outage case logs, and its own behaviour is covered
// by core/logger.test.ts.
vi.mock('$lib/core/logger', () => ({ logger: { error: vi.fn(() => 'logged') } }));

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
	| { kind: 'resolved' }
	| { kind: 'redirect'; location: string }
	| { kind: 'error'; status: number };

async function callAuth(pathname: string, cookies: Record<string, string> = {}) {
	const clearedCookies: string[] = [];
	const event = {
		url: new URL(`http://localhost${pathname}`),
		locals: {} as App.Locals,
		cookies: {
			get: (name: string) => cookies[name],
			delete: (name: string) => {
				clearedCookies.push(name);
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

	return { outcome, clearedCookies, locals: event.locals };
}

beforeEach(() => {
	getMe.mockReset();
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
		getMe.mockRejectedValue(new ApiError(401, 'UNAUTHORIZED', 'Token expired.'));

		const { outcome, clearedCookies } = await callAuth('/', SESSION);

		expect(outcome).toEqual({ kind: 'redirect', location: '/login' });
		expect(clearedCookies).toContain('access_token');
	});

	it('fails the request but keeps the session when the backend is unreachable', async () => {
		// An outage must not sign everyone out: that turns downtime into a
		// stampede of logins and throws away whatever the user was doing.
		getMe.mockRejectedValue(new ApiError(0, 'NETWORK_ERROR', 'Connection refused.'));

		const { outcome, clearedCookies } = await callAuth('/', SESSION);

		expect(outcome).toEqual({ kind: 'error', status: 503 });
		expect(clearedCookies).toEqual([]);
	});

	it('keeps the session when the backend answers 500', async () => {
		getMe.mockRejectedValue(new ApiError(500, 'INTERNAL_SERVER_ERROR', 'Boom.'));

		const { outcome, clearedCookies } = await callAuth('/', SESSION);

		expect(outcome).toEqual({ kind: 'error', status: 503 });
		expect(clearedCookies).toEqual([]);
	});
});

// The two halves of the app authorize differently on purpose. These are the
// assertions that keep one of them from quietly deciding for the other.

describe('handleAuth on page routes', () => {
	it('denies a signed-in role that lacks the permission', async () => {
		// The B3 case, end to end: a member typing /admin in the address bar.
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
});

describe('handleAuth on endpoints', () => {
	it('does not apply the page table to /api', async () => {
		// The regression this whole change exists for: /api/users is absent from
		// AUTH_ROUTE_PERMISSIONS by design, and used to 403 for everyone — admins
		// included — because the hook judged it as if it were a page.
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
