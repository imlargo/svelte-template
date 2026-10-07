/**
 * How this app's API describes a failure; the one file to edit when a backend
 * answers errors in another shape. The default reads `{ status, message,
 * payload }`. A status spelled like an `ErrorCode` passes through on its own.
 */
import type { ErrorCode, ParsedErrorBody } from '#lib/core/errors.js';

const STATUS_ALIASES: Record<string, ErrorCode> = {
	NETWORK_ERROR: 'NETWORK',
	BIND_JSON: 'BAD_REQUEST',
	UNPROCESSABLE_ENTITY: 'BAD_REQUEST',
	INTERNAL_SERVER_ERROR: 'SERVER_ERROR'
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

export function parseErrorBody(body: unknown): ParsedErrorBody {
	if (!isRecord(body)) return {};

	const status = typeof body.status === 'string' ? body.status : undefined;

	return {
		status,
		code: status ? STATUS_ALIASES[status] : undefined,
		message: typeof body.message === 'string' ? body.message : undefined,
		payload: isRecord(body.payload) ? body.payload : undefined
	};
}
