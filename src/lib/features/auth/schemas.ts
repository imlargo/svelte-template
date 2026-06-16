import { z } from 'zod/v3';

export const LoginSchema = z.object({
	email: z.string().email('Please enter a valid email address.'),
	password: z.string().min(1, 'Password is required.')
});

export const RegisterSchema = z
	.object({
		name: z.string().min(1, 'Name is required.').max(100),
		email: z.string().email('Please enter a valid email address.'),
		password: z
			.string()
			.min(8, 'Password must be at least 8 characters.')
			.max(128),
		confirmPassword: z.string().min(1, 'Please confirm your password.')
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match.",
		path: ['confirmPassword']
	});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
