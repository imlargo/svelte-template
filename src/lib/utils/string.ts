export function getInitials(name: string | undefined): string {
	if (!name?.trim()) return '';
	return name
		.trim()
		.split(/\s+/)
		.slice(0, 2)
		.map((part) => part[0].toUpperCase())
		.join('');
}

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

export function truncate(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.slice(0, maxLength - 3) + '...';
}

export function capitalize(text: string): string {
	if (!text) return '';
	return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}
