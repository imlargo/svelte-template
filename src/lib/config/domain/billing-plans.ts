export const PLAN_FEATURES = {
	free: {
		maxProjects: 3,
		canExport: false,
		canApiAccess: false,
		maxMembers: 2
	},
	pro: {
		maxProjects: 50,
		canExport: true,
		canApiAccess: false,
		maxMembers: 10
	},
	enterprise: {
		maxProjects: Infinity,
		canExport: true,
		canApiAccess: true,
		maxMembers: Infinity
	}
} as const;

export type Plan = keyof typeof PLAN_FEATURES;
export type PlanFeature = keyof (typeof PLAN_FEATURES)['free'];
