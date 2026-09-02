/**
 * DEMO SCAFFOLDING — delete this file when you point the app at a real backend.
 *
 * An in-memory stand-in for the users endpoint of your API, so the admin CRUD
 * works on a fresh clone with no setup. State lives in a module-level array,
 * which is a per-process singleton: fine here because this is shared seed data,
 * never per-user state. Do not copy this pattern for anything user-scoped —
 * module-level $state with user data leaks across requests under SSR.
 *
 * Restarting the dev server resets it.
 */
import { UserRole } from '$lib/types/user';
import type { User } from '$lib/types/user';

const SEED: User[] = [
	['Ada Lovelace', 'ada@example.com', UserRole.ADMIN],
	['Grace Hopper', 'grace@example.com', UserRole.ADMIN],
	['Alan Turing', 'alan@example.com', UserRole.MEMBER],
	['Katherine Johnson', 'katherine@example.com', UserRole.MEMBER],
	['Margaret Hamilton', 'margaret@example.com', UserRole.MEMBER],
	['Barbara Liskov', 'barbara@example.com', UserRole.MEMBER],
	['Radia Perlman', 'radia@example.com', UserRole.MEMBER]
].map(([name, email, role], i) => ({
	id: String(i + 1),
	name: name as string,
	email: email as string,
	role: role as UserRole,
	avatar: null,
	created_at: new Date(Date.UTC(2024, 0, i + 1)).toISOString(),
	updated_at: new Date(Date.UTC(2024, 0, i + 1)).toISOString()
}));

let users: User[] = [...SEED];
let nextId = users.length + 1;

export function listUsers(search?: string): User[] {
	const term = search?.trim().toLowerCase();
	const found = term
		? users.filter(
				(u) => u.email.toLowerCase().includes(term) || (u.name ?? '').toLowerCase().includes(term)
			)
		: users;

	return [...found].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
}

export function findUser(id: string): User | undefined {
	return users.find((u) => u.id === id);
}

export function emailTaken(email: string, exceptId?: string): boolean {
	return users.some((u) => u.email.toLowerCase() === email.toLowerCase() && u.id !== exceptId);
}

export function createUser(input: { name: string; email: string; role: UserRole }): User {
	const now = new Date().toISOString();
	const user: User = {
		id: String(nextId++),
		name: input.name,
		email: input.email,
		role: input.role,
		avatar: null,
		created_at: now,
		updated_at: now
	};

	users.push(user);
	return user;
}

export function updateUser(
	id: string,
	input: Partial<{ name: string; email: string; role: UserRole }>
): User | undefined {
	const user = findUser(id);
	if (!user) return undefined;

	Object.assign(user, input, { updated_at: new Date().toISOString() });
	return user;
}

export function deleteUser(id: string): boolean {
	const before = users.length;
	users = users.filter((u) => u.id !== id);
	return users.length < before;
}
