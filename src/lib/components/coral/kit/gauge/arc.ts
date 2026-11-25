/**
 * @coral/kit/gauge
 * @version 1.0.0
 */

/**
 * The drawing is laid out on a 100 × 100 square: the circle the arc runs along is centred in it,
 * and everything else - the stroke, the box the value sits in - is a length on that square, so the
 * gauge scales as one picture with whatever size its box is given.
 */
const SIZE = 100;
const CENTRE = SIZE / 2;

export type Box = { x: number; y: number; width: number; height: number };

export type Arc = {
	/** The track's path, start to end, clockwise. The value is the same path, dashed. */
	path: string;
	/** Cropped to the stroke, so a half circle is not drawn with an empty half under it. */
	viewBox: Box;
	/** The square inside the stroke, cut to the drawing: where the value text goes. */
	inner: Box;
};

/** A point on the circle, `angle` degrees clockwise from twelve o'clock. */
function pointAt(angle: number, radius: number): [number, number] {
	const radians = (angle * Math.PI) / 180;
	return [CENTRE + radius * Math.sin(radians), CENTRE - radius * Math.cos(radians)];
}

const fixed = (value: number) => Number(value.toFixed(3));

/** Keeps a sweep and a thickness inside what can be drawn at all. */
export function normalize(sweep: number, thickness: number): { sweep: number; thickness: number } {
	return {
		sweep: Math.min(Math.max(sweep, 1), 360),
		thickness: Math.min(Math.max(thickness, 1), CENTRE - 1)
	};
}

/**
 * The geometry of a gauge that sweeps `sweep` degrees with a stroke `thickness` wide.
 *
 * Anything short of a full circle opens at the bottom and is symmetric about the vertical, which is
 * how every gauge reads: a full circle starts at twelve o'clock instead, like a clock hand. The arc
 * is two halves, each at most 180°, because one SVG arc command cannot draw a whole circle - its
 * start and end would be the same point - and two halves never need the large-arc flag.
 */
export function arcFor(sweepDegrees: number, thicknessUnits: number): Arc {
	const { sweep, thickness } = normalize(sweepDegrees, thicknessUnits);
	const full = sweep === 360;
	const radius = CENTRE - thickness / 2;
	const start = full ? 0 : -sweep / 2;

	const [startX, startY] = pointAt(start, radius);
	const [midX, midY] = pointAt(start + sweep / 2, radius);
	const [endX, endY] = pointAt(start + sweep, radius);
	const segment = (x: number, y: number) => `A ${radius} ${radius} 0 0 1 ${fixed(x)} ${fixed(y)}`;
	const path = `M ${fixed(startX)} ${fixed(startY)} ${segment(midX, midY)} ${segment(endX, endY)}`;

	// The arc reaches the sides only when it passes three or nine o'clock, and below its ends only
	// when it is whole. Round caps add half the stroke past each end.
	const half = sweep / 2;
	const side = half >= 90 ? CENTRE : radius * Math.sin((half * Math.PI) / 180) + thickness / 2;
	const bottom = full ? SIZE : CENTRE - radius * Math.cos((half * Math.PI) / 180) + thickness / 2;
	const viewBox = {
		x: fixed(CENTRE - side),
		y: 0,
		width: fixed(side * 2),
		height: fixed(Math.min(bottom, SIZE))
	};

	const reach = CENTRE - thickness;
	const innerTop = CENTRE - reach;
	const innerLeft = Math.max(CENTRE - reach, viewBox.x);
	const inner = {
		x: fixed(innerLeft),
		y: fixed(innerTop),
		width: fixed(Math.min(CENTRE + reach, viewBox.x + viewBox.width) - innerLeft),
		height: fixed(Math.max(Math.min(CENTRE + reach, viewBox.height) - innerTop, 0))
	};

	return { path, viewBox, inner };
}

/** How far along its range a value is, `0` to `1`. A range with no width is empty. */
export function fractionOf(value: number, min: number, max: number): number {
	if (!(max > min) || !Number.isFinite(value)) return 0;
	return Math.min(Math.max((value - min) / (max - min), 0), 1);
}
