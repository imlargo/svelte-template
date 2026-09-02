import type { User } from '$lib/types/user';
import type { UserFormData } from '$lib/features/users/schemas';
import { BaseService } from '$lib/core/service';

export class UsersService extends BaseService {
	/**
	 * Empty base URL: the demo endpoints live in this app, so requests stay
	 * relative. Drop the second argument to target `config.api.baseUrl` once a
	 * real backend serves /users.
	 */
	constructor(token: string | (() => string | null) = '') {
		super(token, '');
	}

	list(search?: string) {
		return this.api.get<User[]>('/api/users', { query: { q: search || undefined } });
	}

	create(data: UserFormData) {
		return this.api.post<User>('/api/users', { body: data });
	}

	update(id: string, data: UserFormData) {
		return this.api.patch<User>(`/api/users/${id}`, { body: data });
	}

	remove(id: string) {
		return this.api.delete<void>(`/api/users/${id}`);
	}
}
