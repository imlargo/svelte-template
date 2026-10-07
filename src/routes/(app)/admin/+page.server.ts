import type { PageServerLoad } from './$types';

// The hook already enforced it; the page states its own requirement anyway.
export const load: PageServerLoad = ({ locals }) => {
	locals.requirePermission('users:read');
};
