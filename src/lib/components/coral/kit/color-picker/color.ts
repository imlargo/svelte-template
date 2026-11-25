/**
 * @coral/kit/color-picker
 * @version 1.0.0
 */

/**
 * A colour as the picker edits it. Hue is in degrees, `0` to `360`; saturation and brightness are
 * `0` to `1`. HSV rather than RGB because its three numbers are the three things a reader moves:
 * the strip is the hue, the square is the other two.
 */
export type Hsv = { h: number; s: number; v: number };

const SHORT = /^#?([\da-f])([\da-f])([\da-f])$/i;
const LONG = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i;

/**
 * Reads `#3b82f6`, `3B82F6`, `#38f` or `38f` - what a reader types or pastes - into the one
 * spelling the picker hands out, `#3b82f6`. Anything else is `undefined`.
 */
export function parseHex(text: string | undefined): string | undefined {
	const trimmed = text?.trim() ?? '';
	const short = SHORT.exec(trimmed);
	if (short)
		return `#${short
			.slice(1)
			.map((digit) => digit + digit)
			.join('')}`.toLowerCase();
	const long = LONG.exec(trimmed);
	return long ? `#${long.slice(1).join('')}`.toLowerCase() : undefined;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function hsvToHex({ h, s, v }: Hsv): string {
	const hue = ((h % 360) + 360) % 360;
	const channel = (n: number) => {
		const k = (n + hue / 60) % 6;
		const value = v - v * clamp(s, 0, 1) * clamp(Math.min(k, 4 - k), 0, 1);
		return Math.round(clamp(value, 0, 1) * 255)
			.toString(16)
			.padStart(2, '0');
	};
	return `#${channel(5)}${channel(3)}${channel(1)}`;
}

/**
 * The HSV of a hex colour. A grey has no hue, so it takes `hue` - the one the picker was on - and
 * dragging into the grey edge of the square does not snap the strip back to red.
 */
export function hexToHsv(hex: string, hue = 0): Hsv {
	const parsed = parseHex(hex) ?? '#000000';
	const [r, g, b] = [1, 3, 5].map((at) => parseInt(parsed.slice(at, at + 2), 16) / 255);
	const max = Math.max(r, g, b);
	const delta = max - Math.min(r, g, b);

	let h = hue;
	if (delta > 0) {
		if (max === r) h = 60 * (((g - b) / delta + 6) % 6);
		else if (max === g) h = 60 * ((b - r) / delta + 2);
		else h = 60 * ((r - g) / delta + 4);
	}
	return { h, s: max === 0 ? 0 : delta / max, v: max };
}
