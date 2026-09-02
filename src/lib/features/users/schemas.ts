import { z } from 'zod';
import { UserRole } from '$lib/types/user';

export const UserFormSchema = z.object({
	name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
	email: z.email('Enter a valid email address.'),
	role: z.enum(UserRole)
});

export type UserFormData = z.infer<typeof UserFormSchema>;
