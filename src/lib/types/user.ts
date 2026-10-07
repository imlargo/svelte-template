import type { BaseEntity } from '#lib/types/entity.js';

export enum UserRole {
	ADMIN = 'admin',
	MEMBER = 'member'
}

export interface User extends BaseEntity {
	email: string;
	name?: string | null;
	role: UserRole;
	avatar?: string | null;
}
