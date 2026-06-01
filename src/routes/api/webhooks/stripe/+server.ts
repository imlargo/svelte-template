import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	// Verify Stripe webhook signature and handle events
	// See $lib/server/billing/stripe.ts
	return new Response(null, { status: 200 });
};
