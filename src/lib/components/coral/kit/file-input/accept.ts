/**
 * @coral/kit/file-input
 * @version 1.1.1
 */

/**
 * Whether a file answers an `accept` attribute - `image/*,.pdf,video/mp4` and friends. An empty
 * `accept` takes anything; extensions are matched against the name, wildcards against the type.
 *
 * The MIME type is the part that cannot be trusted: browsers report an empty `file.type` for
 * plenty of ordinary files - `.mov`, `.avi`, `.mkv`, notably on Windows, PWAs and iOS - so reading
 * only `file.type` turns away files the user can plainly see are videos. The usual patch is a
 * hardcoded extension table, which goes stale the moment an unfamiliar container turns up.
 *
 * No table needed: a file the browser refuses to type is judged by its extension when the caller
 * listed any, and let through when they did not, there being no evidence to convict it with.
 */
export function matchesAccept(file: File, accept: string): boolean {
	const entries = accept
		.split(',')
		.map((entry) => entry.trim().toLowerCase())
		.filter(Boolean);
	if (entries.length === 0) return true;
	if (entries.includes('*/*')) return true;

	const name = file.name.toLowerCase();
	const type = file.type.toLowerCase();
	const extensions = entries.filter((entry) => entry.startsWith('.'));

	if (extensions.some((extension) => name.endsWith(extension))) return true;

	if (type === '') return extensions.length === 0;

	return entries.some((entry) => {
		if (entry.startsWith('.')) return false;
		// `video/*` becomes the prefix `video/`.
		if (entry.endsWith('/*')) return type.startsWith(entry.slice(0, -1));
		return entry === type;
	});
}

/**
 * A short, language-free summary of what the zone accepts - `PDF, JPG`.
 *
 * Extensions and wildcard categories both reduce to a bare word, so nothing here needs translating.
 * Returns an empty string when `accept` is empty, which is the caller's cue to render nothing.
 */
export function describeAccept(accept: string): string {
	const words = accept
		.split(',')
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map((entry) => {
			if (entry.startsWith('.')) return entry.slice(1);
			if (entry.endsWith('/*')) return entry.slice(0, -2);
			// `image/svg+xml` is known by its subtype, not by `image`.
			return entry.split('/').pop() ?? entry;
		})
		.map((word) => word.toUpperCase());

	return [...new Set(words)].join(', ');
}
