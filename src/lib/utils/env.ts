import { z } from 'zod';

/** An empty value in .env (`VAR=`) means "not set": it takes the default instead of failing. */
export const unset = (value: unknown) => (value === '' ? undefined : value);

/** Exactly `true` or `false`: `yes`, `1` or a typo is an error, not a guess. */
export const flag = (fallback: boolean) =>
	z.preprocess(
		unset,
		z.stringbool({ truthy: ['true'], falsy: ['false'], case: 'sensitive' }).default(fallback)
	);

/** Parses `env` or throws one error that names every invalid variable. */
export function parseEnv<S extends z.ZodType>(
	schema: S,
	env: Record<string, string | undefined>
): z.output<S> {
	const parsed = schema.safeParse(env);
	if (parsed.success) return parsed.data;

	const problems = parsed.error.issues.map(
		(issue) => `  ${issue.path.join('.')}: ${issue.message}`
	);
	throw new Error(`Invalid environment variables (see .env.example):\n${problems.join('\n')}`);
}
