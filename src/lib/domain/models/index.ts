import type { BaseEntity } from './base';

export enum UserType {
	USER = 'user',
	POSTER = 'poster',
	ADMIN_AGENCY = 'admin/agency',
	CLIENT = 'client',
	TEAM_LEADER = 'team_leader',
	SUPER_ADMIN = 'super_admin'
}

export function getUserTypeLabel(userType: UserType) {
	switch (userType) {
		case UserType.USER:
			return 'User';
		case UserType.POSTER:
			return 'Poster';
		case UserType.ADMIN_AGENCY:
			return 'Admin/Agency';
		case UserType.CLIENT:
			return 'Client';
		case UserType.TEAM_LEADER:
			return 'Team Leader';
		case UserType.SUPER_ADMIN:
			return 'Super Admin';
		default:
			return 'Unknown';
	}
}

export interface User extends BaseEntity {
	name: string;
	email: string;
	user_type: UserType;
	password: string;
	changed_password: boolean;
	tier_level: number; // Legacy field
	created_by: number;
	referral_code_id: number | null;
}
