import type { Plan } from '$lib/config/domain/billing-plans';

export interface Subscription {
	id: string;
	orgId: string;
	plan: Plan;
	status: 'active' | 'canceled' | 'past_due' | 'trialing';
	currentPeriodEnd: string;
}

export interface Invoice {
	id: string;
	orgId: string;
	amount: number;
	currency: string;
	status: 'paid' | 'open' | 'void';
	createdAt: string;
}
