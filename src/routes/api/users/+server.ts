// DEMO SCAFFOLDING — stands in for a real users endpoint; delete with `#lib/server/users-store.js`.
import { json } from '@sveltejs/kit';
import { AppError } from '#lib/core/errors.js';
import { errorResponse, readBody } from '#lib/server/api.js';
import { createUser, emailTaken, listUsers } from '#lib/server/users-store.js';
import { UserFormSchema } from '#lib/features/users/schemas.js';
import type { RequestHandler } from './$types';

// Each handler asks for what it does: listing is not creating.
export const GET: RequestHandler = async ({ url, locals }) => {
	locals.requirePermission('users:read');

	return json(listUsers(url.searchParams.get('q') ?? undefined));
};

export const POST: RequestHandler = async ({ request, locals }) => {
	locals.requirePermission('users:write');

	const body = await readBody(request, UserFormSchema, 'Invalid user data.');
	if (!body.ok) return body.response;

	if (emailTaken(body.data.email)) {
		return errorResponse(new AppError('CONFLICT', `${body.data.email} is already registered.`));
	}

	return json(createUser(body.data), { status: 201 });
};
