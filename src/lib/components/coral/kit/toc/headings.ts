/**
 * @coral/kit/toc
 * @version 1.0.0
 */

/** One entry in the table of contents. */
export type TocHeading = {
	/** The `id` of the element it points at. Anchors are `#id`, so this is what makes the link work. */
	id: string;
	text: string;
	/** `2` for an `h2`, `3` for an `h3`. Drives the indentation, not the order. */
	level: number;
};

/**
 * A slug for a heading with no `id` of its own. Accents on Latin letters are folded (`São Paulo`
 * gives `sao-paulo`), but letters from other scripts are kept: an ASCII-only slug turns every
 * Cyrillic, Arabic or CJK heading into `section`.
 */
export function slug(text: string): string {
	return (
		text
			// Marks are stripped only after a Latin letter, so `й` is not turned into `и`.
			.normalize('NFD')
			.replace(/(\p{Script=Latin})\p{M}+/gu, '$1')
			.normalize('NFC')
			.toLowerCase()
			.trim()
			.replace(/[^\p{L}\p{N}\s-]/gu, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.replace(/^-|-$/g, '') || 'section'
	);
}

export function uniqueId(candidate: string, taken: Set<string>): string {
	if (!taken.has(candidate)) return candidate;

	let suffix = 2;
	while (taken.has(`${candidate}-${suffix}`)) suffix++;
	return `${candidate}-${suffix}`;
}

/**
 * Reads the headings out of a rendered article, giving an anchor to any that lacks one.
 *
 * Ids are assigned here rather than expected of the caller because the markup usually is not
 * theirs - it came from a markdown pipeline or a CMS - and a table of contents whose links go
 * nowhere is worse than none. Ids already in the document are avoided, so an invented anchor cannot
 * collide with a real one somewhere else on the page.
 */
export function collect(
	// Not `ParentNode`: in a Cloudflare project the worker types declare a global `Element` whose
	// HTMLRewriter methods shadow the DOM ones, and that interface stops matching real elements.
	scope: Document | HTMLElement,
	selector: string,
	document: Document
): TocHeading[] {
	const taken = new Set(
		Array.from(document.querySelectorAll<HTMLElement>('[id]')).map((node) => node.id)
	);

	return Array.from(scope.querySelectorAll<HTMLElement>(selector)).map((node) => {
		const text = (node.textContent ?? '').trim();
		if (!node.id) {
			node.id = uniqueId(slug(text), taken);
			taken.add(node.id);
		}
		return { id: node.id, text, level: Number(node.tagName.slice(1)) || 2 };
	});
}

/**
 * Which heading the reader is in, given each heading's distance from the top of the viewport (or of
 * the scrolling box) and where the boundary sits.
 *
 * The last heading that has crossed the boundary, not the first one visible. Reading it off
 * `IntersectionObserver` entries is the obvious build, and it is wrong in two ordinary places: a
 * heading whose whole section fits above the band never becomes active, and entries arrive in the
 * order they changed rather than in document order.
 *
 * `atEnd` is the other half. Scrolled to the bottom of the page, the last section usually has not
 * crossed the boundary - it cannot, there is nothing left to scroll - so a boundary rule alone
 * leaves the final heading permanently unreachable.
 */
export function pickActive(tops: readonly number[], boundary: number, atEnd = false): number {
	// A pixel of slack: a heading scrolled to exactly the boundary rounds either way between
	// layout and measurement, and without it the highlight flickers between two sections there.
	if (tops.length === 0) return -1;
	if (atEnd) return tops.length - 1;

	let active = 0;
	for (let index = 0; index < tops.length; index++) {
		if (tops[index] - boundary <= 1) active = index;
		else break;
	}
	return active;
}
