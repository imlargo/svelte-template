/**
 * The semantic colors for states and notices, declared as Tailwind utilities
 * in `routes/layout.css` (`bg-action`, `text-warning`, …). The one place they
 * become classes: Tailwind only generates class names it finds written out,
 * so `bg-${tone}` would produce nothing.
 */
export type Tone = 'default' | 'action' | 'information' | 'success' | 'warning' | 'destructive';

/** A badge chip: faint background, text and border in the solid color. */
const BADGE: Record<Tone, string> = {
	default: 'border-border bg-muted text-muted-foreground',
	action: 'border-action/20 bg-action/10 text-action',
	information: 'border-information/20 bg-information/10 text-information',
	success: 'border-success/20 bg-success/10 text-success',
	warning: 'border-warning/20 bg-warning/10 text-warning',
	destructive: 'border-destructive/20 bg-destructive/10 text-destructive'
};

/** A bare icon or text, no background. */
const TEXT: Record<Tone, string> = {
	default: 'text-muted-foreground',
	action: 'text-action',
	information: 'text-information',
	success: 'text-success',
	warning: 'text-warning',
	destructive: 'text-destructive'
};

export function toneBadgeClass(tone: Tone): string {
	return BADGE[tone];
}

export function toneTextClass(tone: Tone): string {
	return TEXT[tone];
}
