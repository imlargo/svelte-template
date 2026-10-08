// DEMO SCAFFOLDING — see `#lib/server/users-store.js`.
import { json } from '@sveltejs/kit';
import { AppError } from '#lib/core/errors.js';
import { errorResponse, readBody } from '#lib/server/api.js';
import { deleteUser, emailTaken, findUser, updateUser } from '#lib/server/users-store.js';
import { UserFormSchema } from '#lib/features/users/schemas.js';
import type { RequestHandler } from './$types';

const notFound = (id: string) => errorResponse(new AppError('NOT_FOUND', `No user with id ${id}.`));

// Three methods, three permissions: the granularity a route table cannot express.
export const GET: RequestHandler = async ({ params, locals }) => {
	locals.requirePermission('users:read');

	const user = findUser(params.id);
	return user ? json(user) : notFound(params.id);
};

export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	locals.requirePermission('users:write');

	if (!findUser(params.id)) return notFound(params.id);

	const body = await readBody(request, UserFormSchema.partial(), 'Invalid user data.');
	if (!body.ok) return body.response;

	if (body.data.email && emailTaken(body.data.email, params.id)) {
		return errorResponse(new AppError('CONFLICT', `${body.data.email} is already registered.`));
	}

	return json(updateUser(params.id, body.data));
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	locals.requirePermission('users:delete');

	return deleteUser(params.id) ? new Response(null, { status: 204 }) : notFound(params.id);
};
