import { z } from 'zod';

/** Messages per field, as a form action's `fail()` carries them back to the page. */
export type FieldErrors<T> = Partial<Record<keyof T, string[]>>;

/** Parses `FormData` against an object schema, keeping every message per field. */
export function parseForm<S extends z.ZodObject>(
	schema: S,
	data: FormData
): { data: z.output<S>; errors?: never } | { data?: never; errors: FieldErrors<z.input<S>> } {
	const parsed = schema.safeParse(Object.fromEntries(data));
	if (parsed.success) return { data: parsed.data };
	return { errors: z.flattenError(parsed.error).fieldErrors as FieldErrors<z.input<S>> };
}

/** Validates one field on its own, for feedback before the form is submitted. */
export function validateField<S extends z.ZodObject>(
	schema: S,
	name: keyof S['shape'],
	value: unknown
): string[] | undefined {
	const parsed = (schema.shape[name as string] as z.ZodType).safeParse(value);
	return parsed.success ? undefined : parsed.error.issues.map((issue) => issue.message);
}

/** `Field.Error` takes `{ message }` objects. */
export function toErrorItems(messages: string[] | undefined) {
	return messages?.map((message) => ({ message }));
}
