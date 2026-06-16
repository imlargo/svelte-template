import type { UserRole } from './roles';

export interface BaseEntity {
	id: string;
	created_at: string;
	updated_at: string;
}

export interface User extends BaseEntity {
	email: string;
	name?: string | null;
	role: UserRole;
	avatar?: string | null;
}
