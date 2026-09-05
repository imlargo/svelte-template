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
		return this.expectBody(
			this.api.get<User[]>('/api/users', { query: { q: search || undefined } })
		);
	}

	create(data: UserFormData) {
		return this.expectBody(this.api.post<User>('/api/users', { body: data }));
	}

	update(id: string, data: UserFormData) {
		return this.expectBody(this.api.patch<User>(`/api/users/${id}`, { body: data }));
	}

	// No `expectBody`: a DELETE answering 204 with no body is the success case.
	async remove(id: string): Promise<void> {
		await this.api.delete(`/api/users/${id}`);
	}
}
