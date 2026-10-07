/**
 * How this app's API describes a failure; the one file to edit when a backend
 * answers errors in another shape. Installed by the `init` hooks. The default
 * reader already handles `{ status, message, payload }`; this adds the
 * statuses that mean one of our codes without being spelled like it.
 */
import { readErrorBody, type ErrorBodyParser, type ErrorCode } from '#lib/core/errors.js';

const STATUS_ALIASES: Record<string, ErrorCode> = {
	NETWORK_ERROR: 'NETWORK',
	BIND_JSON: 'BAD_REQUEST',
	UNPROCESSABLE_ENTITY: 'BAD_REQUEST',
	INTERNAL_SERVER_ERROR: 'SERVER_ERROR'
};

export const parseErrorBody: ErrorBodyParser = (body) => {
	const parsed = readErrorBody(body);
	return {
		...parsed,
		code: parsed.code ?? (parsed.status ? STATUS_ALIASES[parsed.status] : undefined)
	};
};
