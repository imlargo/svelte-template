import { PERMISSION_GROUPS, PLAN_FEATURES } from '$lib/config/domain';
import type { User } from '$lib/types/auth/user';
import type { Organization } from '$lib/types/saas/org';
import type { PermissionGroup, PlanFeature } from '$lib/config/domain';

export function hasPermission(user: User & { role: string }, group: PermissionGroup): boolean {
	if (user.role === 'admin') return true;
	return (PERMISSION_GROUPS[group] as readonly string[]).includes(user.role);
}

export function canUseFeature(org: Organization, feature: PlanFeature): boolean {
	const value = PLAN_FEATURES[org.plan][feature];
	if (typeof value === 'number') return value > 0;
	return Boolean(value);
}

export function isWithinPlanLimit(
	org: Organization,
	feature: PlanFeature,
	current: number
): boolean {
	const limit = PLAN_FEATURES[org.plan][feature];
	if (typeof limit !== 'number') return false;
	return current < limit;
}
