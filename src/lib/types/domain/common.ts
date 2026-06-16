export interface PaginatedResponse<T> {
	results: T[];
	count: number;
	next: string | null;
	previous: string | null;
}

export interface DateRange {
	start: string;
	end: string;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
	field: keyof T;
	direction: SortDirection;
}
