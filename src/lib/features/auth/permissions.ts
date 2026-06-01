import { PERMISSION_GROUPS } from '$lib/config/domain'
import type { PermissionGroup } from '$lib/config/domain'

export function hasPermission(user: { role: string }, group: PermissionGroup): boolean {
	if (user.role === 'admin') return true
	const allowed = PERMISSION_GROUPS[group] as readonly string[] | undefined
	return allowed?.includes(user.role) ?? false
}
