import { z } from 'zod';
import type { FieldErrors } from '#lib/utils/forms.js';

export const LoginSchema = z.object({
	email: z.email('Please enter a valid email address.'),
	password: z.string().min(1, 'Password is required.')
});

export type LoginInput = z.infer<typeof LoginSchema>;

/** What the login action answers when it does not sign the user in. */
export interface LoginFailure {
	/** Refills the field. The password never comes back. */
	email: string;
	errors?: FieldErrors<LoginInput>;
	message?: string;
}
