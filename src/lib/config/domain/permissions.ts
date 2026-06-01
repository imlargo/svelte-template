import { UserRole } from '$lib/types/auth/roles';

export const PERMISSION_GROUPS = {
	Admin: [UserRole.ADMIN]
} as const;

export type PermissionGroup = keyof typeof PERMISSION_GROUPS;
