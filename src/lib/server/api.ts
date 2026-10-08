/**
 * How an endpoint under `routes/api/` answers. Failures travel as the
 * `{ status, message }` body `#lib/core/errors` reads back, so a CONFLICT
 * thrown here arrives in the browser as a typed AppError with its message.
 */
import { json } from '@sveltejs/kit';
import type { ZodType } from 'zod';
import { normalizeError, type ErrorCode } from '#lib/core/errors.js';
import { logger } from '#lib/core/logger.js';

const HTTP_STATUS: Record<ErrorCode, number> = {
	NETWORK: 502,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	CONFLICT: 409,
	BAD_REQUEST: 400,
	SERVER_ERROR: 500,
	UNKNOWN: 500
};

/** Raised on purpose, with a message written for a person. Anything else is logged and answered generically. */
const SAFE_TO_SURFACE: ReadonlySet<ErrorCode> = new Set<ErrorCode>([
	'UNAUTHORIZED',
	'FORBIDDEN',
	'NOT_FOUND',
	'CONFLICT',
	'BAD_REQUEST'
]);

export function errorResponse(err: unknown): Response {
	const error = normalizeError(err);
	const message = SAFE_TO_SURFACE.has(error.code) ? error.message : logger.error('api', error);

	return json({ status: error.code, message }, { status: HTTP_STATUS[error.code] });
}

/**
 * Validates a JSON body, answering 400 with the first problem. A discriminated
 * result rather than a throw, so the handler reads "parse, then work" and
 * cannot forget the failure branch.
 */
export async function readBody<T>(
	request: Request,
	schema: ZodType<T>,
	fallback: string
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		return { ok: false, response: badRequest(fallback) };
	}

	const parsed = schema.safeParse(raw);
	if (parsed.success) return { ok: true, data: parsed.data };
	return { ok: false, response: badRequest(parsed.error.issues[0]?.message ?? fallback) };
}

function badRequest(message: string): Response {
	return json({ status: 'BAD_REQUEST' satisfies ErrorCode, message }, { status: 400 });
}
