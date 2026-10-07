// DEMO SCAFFOLDING — replace `demoStats` with a service call when there is a real endpoint.
import type { PageServerLoad } from './$types';

// Not awaited: the promise streams and the page renders with skeletons meanwhile.
export const load: PageServerLoad = ({ locals }) => {
	locals.requirePermission('dashboard:read');
	return { stats: demoStats() };
};

async function demoStats() {
	await new Promise((resolve) => setTimeout(resolve, 1200));
	return { totalUsers: 1024, activeSessions: 47, eventsToday: 312 };
}
