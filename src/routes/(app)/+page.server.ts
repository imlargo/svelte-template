/**
 * DEMO SCAFFOLDING — the streaming pattern, with a fake slow source. Replace
 * `demoStats` with a service call (`new StatsService({ token: locals.accessToken,
 * fetch }).get()`) when there is a real endpoint behind the cards.
 */
import type { PageServerLoad } from './$types';

// Not awaited on purpose. A promise returned from `load` is streamed: the page
// renders now, with skeletons, and the cards fill in when it settles. Awaiting
// it here would hold the whole navigation — sidebar included — for as long as
// the slowest call takes. Await only what the page cannot render without.
export const load: PageServerLoad = () => ({
	stats: demoStats()
});

async function demoStats() {
	await new Promise((resolve) => setTimeout(resolve, 1200));
	return { totalUsers: 1024, activeSessions: 47, eventsToday: 312 };
}
