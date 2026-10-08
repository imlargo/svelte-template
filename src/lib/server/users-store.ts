/**
 * DEMO SCAFFOLDING — delete this file when you point the app at a real backend.
 *
 * An in-memory stand-in for the users endpoint of your API, so the admin CRUD
 * works on a fresh clone with no setup. The module-level array is fine here
 * because it is shared seed data, never per-user state. Restarting the dev
 * server resets it.
 */
import { UserRole } from '#lib/types/user.js';
import type { User } from '#lib/types/user.js';
import type { PaginatedResponse } from '#lib/types/pagination.js';

const SEED: User[] = [
	seed('1', 'Ada Lovelace', 'ada@example.com', UserRole.ADMIN),
	seed('2', 'Grace Hopper', 'grace@example.com', UserRole.ADMIN),
	seed('3', 'Alan Turing', 'alan@example.com', UserRole.MEMBER),
	seed('4', 'Katherine Johnson', 'katherine@example.com', UserRole.MEMBER),
	seed('5', 'Margaret Hamilton', 'margaret@example.com', UserRole.MEMBER),
	seed('6', 'Barbara Liskov', 'barbara@example.com', UserRole.MEMBER),
	seed('7', 'Radia Perlman', 'radia@example.com', UserRole.MEMBER)
];

function seed(id: string, name: string, email: string, role: UserRole): User {
	const at = new Date(Date.UTC(2024, 0, Number(id))).toISOString();
	return { id, name, email, role, avatar: null, created_at: at, updated_at: at };
}

let users: User[] = [...SEED];
let nextId = users.length + 1;

/** Without `pageSize`, everything in one page. */
export function listUsers(search?: string, page = 1, pageSize?: number): PaginatedResponse<User> {
	const term = search?.trim().toLowerCase();
	const found = term
		? users.filter(
				(u) => u.email.toLowerCase().includes(term) || (u.name ?? '').toLowerCase().includes(term)
			)
		: users;
	const sorted = [...found].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
	const size = pageSize ?? sorted.length;

	return {
		items: sorted.slice((page - 1) * size, page * size),
		total: sorted.length,
		page,
		pageSize: size
	};
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
