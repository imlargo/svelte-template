/**
 * A list and its unfiltered total. An empty page cannot otherwise tell
 * "nothing exists yet" from "nothing matches the filter", and those two need
 * different things said to them.
 */
export interface ListResponse<T> {
	items: T[];
	total: number;
}
