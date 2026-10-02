import { z } from 'zod';

/** An empty value in .env (`VAR=`) means "not set": it takes the default instead of failing. */
export const unset = <T extends z.ZodType<unknown, string | undefined>>(schema: T) =>
	z
		.string()
		.optional()
		.transform((value) => value || undefined)
		.pipe(schema);

/** Exactly `true` or `false`: `yes`, `1` or a typo is an error, not a guess. */
export const flag = (fallback: boolean) =>
	unset(z.stringbool({ truthy: ['true'], falsy: ['false'], case: 'sensitive' }).default(fallback));
