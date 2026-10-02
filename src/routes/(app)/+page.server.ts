/**
 * DEMO SCAFFOLDING — the streaming pattern, with a fake slow source. Replace
 * `demoStats` with a service call (`new StatsService({ token: locals.accessToken,
 * fetch }).get()`) when there is a real endpoint behind the cards.
 */
import type { PageServerLoad } from './$types';

// Not awaited: a promise returned from `load` streams, so the page renders now
// with skeletons instead of holding the navigation for the slowest call.
export const load: PageServerLoad = () => ({
	stats: demoStats()
});

async function demoStats() {
	await new Promise((resolve) => setTimeout(resolve, 1200));
	return { totalUsers: 1024, activeSessions: 47, eventsToday: 312 };
}
