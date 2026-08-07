/**
 * DEMO SCAFFOLDING — stands in for your real users endpoint. See
 * `$lib/server/users-store`. Delete both when you point at a real backend.
 *
 * Error bodies use the `{ status, message }` shape that `ApiError.fromAirError`
 * parses, so failures surface as typed `ApiError`s on the client.
 */
import { json } from '@sveltejs/kit';
import { createUser, emailTaken, listUsers } from '$lib/server/users-store';
import { UserFormSchema } from '$lib/features/users/schemas';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	return json(listUsers(url.searchParams.get('q') ?? undefined));
};

export const POST: RequestHandler = async ({ request }) => {
	const parsed = UserFormSchema.safeParse(await request.json());
	if (!parsed.success) {
		return json(
			{ status: 'BAD_REQUEST', message: parsed.error.issues[0]?.message ?? 'Invalid user data.' },
			{ status: 400 }
		);
	}

	if (emailTaken(parsed.data.email)) {
		return json(
			{ status: 'CONFLICT', message: `${parsed.data.email} is already registered.` },
			{ status: 409 }
		);
	}

	return json(createUser(parsed.data), { status: 201 });
};
