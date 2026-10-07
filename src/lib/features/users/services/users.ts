import type { User } from '#lib/types/user.js';
import type { ListResponse } from '#lib/types/list.js';
import type { UserFormData } from '#lib/features/users/schemas.js';
import { SAME_ORIGIN, type ApiAuth } from '#lib/core/api.js';
import { BaseService } from '#lib/core/service.js';

export class UsersService extends BaseService {
	/** The demo endpoints live in this app; use `config.api.baseUrl` once a real backend serves /users. */
	constructor(auth: ApiAuth = {}) {
		super(SAME_ORIGIN, auth);
	}

	list(search?: string) {
		return this.expectBody(
			this.api.get<ListResponse<User>>('/api/users', { query: { q: search || undefined } })
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
