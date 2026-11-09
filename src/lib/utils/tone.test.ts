import { describe, expect, it } from 'vitest';
import { toneBadgeClass, toneDotClass, toneTextClass, toneTileClass, type Tone } from './tone';

const TONES: Tone[] = ['default', 'action', 'information', 'success', 'warning', 'destructive'];

describe('tone classes', () => {
	it('every tone has every shape, written out so Tailwind can find the classes', () => {
		for (const tone of TONES) {
			for (const shape of [toneBadgeClass, toneTextClass, toneDotClass, toneTileClass]) {
				expect(shape(tone)).toMatch(/^[a-z0-9/-]+( [a-z0-9/-]+)*$/);
			}
		}
	});

	it('a colored tone names its color in every shape; the default tone stays muted', () => {
		expect(toneDotClass('success')).toBe('bg-success');
		expect(toneTileClass('warning')).toBe('bg-warning/10 text-warning');
		expect(toneDotClass('default')).toBe('bg-muted-foreground');
		expect(toneTileClass('default')).toBe('bg-muted text-muted-foreground');
	});
});
