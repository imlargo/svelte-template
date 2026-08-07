/**
 * DEMO SCAFFOLDING — see `$lib/server/users-store`.
 */
import { json } from '@sveltejs/kit';
import { deleteUser, emailTaken, findUser, updateUser } from '$lib/server/users-store';
import { UserFormSchema } from '$lib/features/users/schemas';
import type { RequestHandler } from './$types';

const notFound = (id: string) =>
	json({ status: 'NOT_FOUND', message: `No user with id ${id}.` }, { status: 404 });

export const GET: RequestHandler = async ({ params }) => {
	const user = findUser(params.id);
	return user ? json(user) : notFound(params.id);
};

export const PATCH: RequestHandler = async ({ params, request }) => {
	if (!findUser(params.id)) return notFound(params.id);

	const parsed = UserFormSchema.partial().safeParse(await request.json());
	if (!parsed.success) {
		return json(
			{ status: 'BAD_REQUEST', message: parsed.error.issues[0]?.message ?? 'Invalid user data.' },
			{ status: 400 }
		);
	}

	if (parsed.data.email && emailTaken(parsed.data.email, params.id)) {
		return json(
			{ status: 'CONFLICT', message: `${parsed.data.email} is already registered.` },
			{ status: 409 }
		);
	}

	return json(updateUser(params.id, parsed.data));
};

export const DELETE: RequestHandler = async ({ params }) => {
	return deleteUser(params.id) ? new Response(null, { status: 204 }) : notFound(params.id);
};
