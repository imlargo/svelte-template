/**
 * @coral/kit/shortcut
 * @version 1.0.0
 */

/** Which keyboard conventions to draw and match against. */
export type Platform = 'mac' | 'other';

export type Combo = {
	/** The non-modifier key, lowercased: `k`, `enter`, `arrowup`, `/`. */
	key: string;
	ctrl: boolean;
	meta: boolean;
	alt: boolean;
	shift: boolean;
};

/** One key as drawn: what goes on the keycap, and what a screen reader should say for it. */
export type KeyToken = {
	symbol: string;
	name: string;
};

/**
 * Spellings accepted in a shortcut string, mapped to the one used internally. People write `cmd`,
 * `command`, `opt`, `esc` and `return`, and a shortcut should not fail to register over which one
 * they reached for.
 */
const ALIASES: Record<string, string> = {
	cmd: 'meta',
	command: 'meta',
	super: 'meta',
	win: 'meta',
	control: 'ctrl',
	option: 'alt',
	opt: 'alt',
	esc: 'escape',
	return: 'enter',
	del: 'delete',
	up: 'arrowup',
	down: 'arrowdown',
	left: 'arrowleft',
	right: 'arrowright',
	space: ' ',
	spacebar: ' ',
	plus: '+'
};

/**
 * Reads `mod+shift+k` into a combo.
 *
 * `mod` is the platform's primary modifier - Command on a Mac, Control everywhere else - which is
 * what nearly every cross-platform shortcut means and what a hard-coded `ctrl` gets wrong for half
 * the readers. `+` joins keys, so the plus key itself is written `plus` - or last, as in `ctrl++`.
 */
export function parse(shortcut: string, platform: Platform): Combo {
	const combo: Combo = { key: '', ctrl: false, meta: false, alt: false, shift: false };

	// `ctrl++` ends in the plus key: split leaves two empty strings at the end, which read as `+`.
	const raw = shortcut.trim().toLowerCase();
	const parts = raw.endsWith('++') ? [...raw.slice(0, -2).split('+'), '+'] : raw.split('+');

	for (const part of parts) {
		const token = ALIASES[part.trim()] ?? part.trim();
		if (token === '' && part !== ' ') continue;

		if (token === 'mod') {
			if (platform === 'mac') combo.meta = true;
			else combo.ctrl = true;
		} else if (token === 'ctrl' || token === 'meta' || token === 'alt' || token === 'shift') {
			combo[token] = true;
		} else {
			combo.key = token;
		}
	}

	return combo;
}

const MAC_MODIFIERS: [keyof Omit<Combo, 'key'>, KeyToken][] = [
	// Apple's own order: Control, Option, Shift, Command.
	['ctrl', { symbol: '⌃', name: 'Control' }],
	['alt', { symbol: '⌥', name: 'Option' }],
	['shift', { symbol: '⇧', name: 'Shift' }],
	['meta', { symbol: '⌘', name: 'Command' }]
];

const OTHER_MODIFIERS: [keyof Omit<Combo, 'key'>, KeyToken][] = [
	// The order Windows and most Linux desktops print them in: Ctrl+Alt+Shift, then the key.
	['ctrl', { symbol: 'Ctrl', name: 'Control' }],
	['meta', { symbol: 'Win', name: 'Windows' }],
	['alt', { symbol: 'Alt', name: 'Alt' }],
	['shift', { symbol: 'Shift', name: 'Shift' }]
];

const KEYS: Record<string, KeyToken> = {
	enter: { symbol: '↵', name: 'Enter' },
	escape: { symbol: 'Esc', name: 'Escape' },
	backspace: { symbol: '⌫', name: 'Backspace' },
	delete: { symbol: 'Del', name: 'Delete' },
	tab: { symbol: '⇥', name: 'Tab' },
	' ': { symbol: 'Space', name: 'Space' },
	arrowup: { symbol: '↑', name: 'Up arrow' },
	arrowdown: { symbol: '↓', name: 'Down arrow' },
	arrowleft: { symbol: '←', name: 'Left arrow' },
	arrowright: { symbol: '→', name: 'Right arrow' },
	pageup: { symbol: 'PgUp', name: 'Page up' },
	pagedown: { symbol: 'PgDn', name: 'Page down' },
	home: { symbol: 'Home', name: 'Home' },
	end: { symbol: 'End', name: 'End' }
};

function keyToken(key: string): KeyToken {
	if (KEYS[key]) return KEYS[key];
	// `k` is drawn as `K`, the way it is printed on the keycap; `f5` as `F5`.
	const label = key.length === 1 ? key.toUpperCase() : key[0].toUpperCase() + key.slice(1);
	return { symbol: label, name: label };
}

/** The keys to draw, modifiers first, in the platform's own order and with its own symbols. */
export function tokens(combo: Combo, platform: Platform): KeyToken[] {
	const modifiers = platform === 'mac' ? MAC_MODIFIERS : OTHER_MODIFIERS;
	const drawn = modifiers.filter(([flag]) => combo[flag]).map(([, token]) => token);
	return combo.key ? [...drawn, keyToken(combo.key)] : drawn;
}

const ARIA_NAMES: Record<string, string> = {
	' ': 'Space',
	escape: 'Escape',
	enter: 'Enter',
	arrowup: 'ArrowUp',
	arrowdown: 'ArrowDown',
	arrowleft: 'ArrowLeft',
	arrowright: 'ArrowRight',
	pageup: 'PageUp',
	pagedown: 'PageDown',
	backspace: 'Backspace',
	delete: 'Delete',
	tab: 'Tab',
	'+': 'Plus'
};

/**
 * The combo in `aria-keyshortcuts` syntax - `Meta+Shift+K` - for the element the shortcut triggers,
 * so assistive tech can announce the shortcut on the control itself. Modifier names are the ones the
 * attribute defines, which are `KeyboardEvent.key` values, not the ones printed on keycaps.
 */
export function ariaKeyshortcuts(combo: Combo): string {
	const parts: string[] = [];
	if (combo.ctrl) parts.push('Control');
	if (combo.alt) parts.push('Alt');
	if (combo.shift) parts.push('Shift');
	if (combo.meta) parts.push('Meta');
	if (combo.key) parts.push(ARIA_NAMES[combo.key] ?? keyToken(combo.key).symbol);
	return parts.join('+');
}

/**
 * Whether a key press is this combo.
 *
 * Modifiers must match exactly, so `mod+k` does not also fire on `mod+shift+k`. The key is compared
 * by `event.key`, which follows the reader's keyboard layout - `mod+z` is the key labelled Z on an
 * AZERTY board too. `event.code` is only consulted when Option is held: on a Mac, Option turns `k`
 * into `˚`, and `alt+k` would otherwise be impossible to press there.
 */
export function matches(event: KeyboardEvent, combo: Combo): boolean {
	if (!combo.key) return false;
	if (event.ctrlKey !== combo.ctrl || event.metaKey !== combo.meta || event.altKey !== combo.alt) {
		return false;
	}

	const key = event.key.toLowerCase();

	// Shift is part of how a symbol is typed: `?` is Shift+/ on a US board and something else on
	// others. A combo naming a symbol does not ask for Shift, so Shift is only held to account when
	// the combo names a letter, a digit or a named key, where it is a deliberate modifier.
	const symbol = combo.key.length === 1 && !/[a-z0-9]/.test(combo.key);
	if (!symbol && event.shiftKey !== combo.shift) return false;

	if (key === combo.key) return true;
	if (combo.key === ' ' && key === 'spacebar') return true;

	if (event.altKey && combo.key.length === 1) {
		const code = /[a-z]/.test(combo.key)
			? `Key${combo.key.toUpperCase()}`
			: /[0-9]/.test(combo.key)
				? `Digit${combo.key}`
				: null;
		return code !== null && event.code === code;
	}

	return false;
}

/**
 * Whether a key press happened while the reader was typing somewhere. A shortcut without Control,
 * Command or Alt - `/` to search, `?` for help - is also a character someone may be typing, and
 * must not fire from inside a field.
 */
export function isTyping(event: KeyboardEvent): boolean {
	if (typeof HTMLElement === 'undefined') return false;
	// The first entry of the composed path, so a field inside a shadow root is seen as the field
	// rather than as the host element the event was retargeted to.
	const target = event.composedPath?.()[0] ?? event.target;
	if (!(target instanceof HTMLElement)) return false;
	if (target.isContentEditable) return true;
	if (target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) return true;
	if (!(target instanceof HTMLInputElement)) return false;

	const nonText = [
		'button',
		'checkbox',
		'color',
		'file',
		'image',
		'radio',
		'range',
		'reset',
		'submit'
	];
	return !nonText.includes(target.type);
}

/** Whether the combo can double as typed text - no Control, Command or Alt held. */
export function isPlain(combo: Combo): boolean {
	return !combo.ctrl && !combo.meta && !combo.alt;
}

/**
 * The platform this page is running on. `userAgentData` where the browser has it, since
 * `navigator.platform` is deprecated; iPad OS reports itself as a Mac, which is correct here -
 * a hardware keyboard on an iPad has a Command key.
 */
export function detectPlatform(): Platform {
	if (typeof navigator === 'undefined') return 'other';
	const data = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
	const name = data?.platform || navigator.platform || navigator.userAgent;
	return /mac|iphone|ipad|ipod/i.test(name) ? 'mac' : 'other';
}
