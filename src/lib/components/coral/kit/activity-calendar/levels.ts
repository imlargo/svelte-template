/**
 * @coral/kit/activity-calendar
 * @version 1.0.0
 */

/**
 * Minimum count per level, ascending, so `thresholds[i]` is where level `i + 1` begins.
 *
 * Quantiles of the **non-zero** days, the only split that survives real data: activity is
 * long-tailed, so equal slices of `0..max` put a whole year in the first bucket and paint one
 * square dark. Level 1 starts at 1 - any activity must read as activity - and each cut is forced
 * above the last, so flat data degrades to `1, 2, 3, 4` rather than collapsing levels together.
 */
export function thresholdsFor(counts: number[], levels: number): number[] {
	if (levels < 1) return [];

	const positive = counts.filter((count) => count > 0).sort((a, b) => a - b);
	const cuts = [1];
	for (let level = 1; level < levels; level++) {
		const at = Math.ceil((level / levels) * (positive.length - 1));
		const quantile = positive.length > 0 ? positive[at] : 0;
		cuts.push(Math.max(cuts[level - 1] + 1, quantile));
	}
	return cuts;
}

/** Which level a count falls in. Zero and below is level 0 - the empty square. */
export function levelFor(count: number, thresholds: number[]): number {
	if (count <= 0) return 0;
	let level = 0;
	while (level < thresholds.length && count >= thresholds[level]) level++;
	return level;
}
