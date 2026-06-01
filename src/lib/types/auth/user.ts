export interface BaseEntity {
	id: number;
	created_at: string;
	updated_at: string;
}

export interface User extends BaseEntity {
	email: string;
}
