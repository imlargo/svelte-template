import type { Plan } from './billing-plans';

export const FEATURE_FLAGS: Record<Plan, Record<string, boolean>> = {
	free: {},
	pro: {},
	enterprise: {}
} as const;
