import type { Plan } from '$lib/config/domain/billing-plans';

export interface Organization {
	id: string;
	name: string;
	slug: string;
	plan: Plan;
	createdAt: string;
}

export interface Membership {
	userId: number;
	orgId: string;
	role: string;
	joinedAt: string;
}
