// DEMO SCAFFOLDING — stands in for a real users endpoint; delete with `#lib/server/users-store.js`.
// Error bodies use the `{ status, message }` shape `#lib/config/errors` parses.
import { createUser, emailTaken, listUsers } from '#lib/server/users-store.js';
import { UserFormSchema } from '#lib/features/users/schemas.js';
import type { RequestHandler } from './$types';

// Each handler asks for what it does: listing is not creating.
export const GET: RequestHandler = async ({ url, locals }) => {
	locals.requirePermission('users:read');

	return Response.json(listUsers(url.searchParams.get('q') ?? undefined));
};

export const POST: RequestHandler = async ({ request, locals }) => {
	locals.requirePermission('users:write');

	const parsed = UserFormSchema.safeParse(await request.json());
	if (!parsed.success) {
		return Response.json(
			{ status: 'BAD_REQUEST', message: parsed.error.issues[0]?.message ?? 'Invalid user data.' },
			{ status: 400 }
		);
	}

	if (emailTaken(parsed.data.email)) {
		return Response.json(
			{ status: 'CONFLICT', message: `${parsed.data.email} is already registered.` },
			{ status: 409 }
		);
	}

	return Response.json(createUser(parsed.data), { status: 201 });
};
