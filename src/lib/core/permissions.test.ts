import { describe, expect, it } from 'vitest';
import { hasPermission } from './permissions';

const GRANTS = { editor: ['posts:write'], viewer: [] } as const;

describe('hasPermission', () => {
	it('grants what is listed for the role', () => {
		expect(hasPermission(GRANTS, 'editor', 'posts:write')).toBe(true);
		expect(hasPermission(GRANTS, 'viewer', 'posts:write')).toBe(false);
	});

	it('grants nothing to a role it has never heard of', () => {
		expect(hasPermission(GRANTS, 'owner', 'posts:write')).toBe(false);
		expect(hasPermission(GRANTS, 'constructor', 'posts:write')).toBe(false);
	});

	it('grants nothing without a role', () => {
		expect(hasPermission(GRANTS, null, 'posts:write')).toBe(false);
		expect(hasPermission(GRANTS, undefined, 'posts:write')).toBe(false);
	});
});
