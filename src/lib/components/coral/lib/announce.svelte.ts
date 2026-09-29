/**
 * @coral/lib/announce
 * @version 1.0.0
 */

/**
 * A zero-width space. Invisible on screen, and no screen reader says anything for it, so appending
 * one changes the text a live region holds without changing the words that come out of it.
 */
const REPEAT = '\u200B';

/**
 * What a component says out loud, for the readers who cannot see it happen.
 *
 * A live region is announced when its text *changes*, which is the trap: saying the same thing
 * twice in a row is silence. Copying the same value again, or pressing the arrow key at the end of
 * a list, produces exactly the message that is already in the region - and the reader hears nothing
 * and cannot tell whether the second press did anything at all. Every component that announces
 * runs into it eventually, so the fix lives here rather than in each of them.
 */
export class Announcer {
	#text = $state('');
	#repeated = $state(false);

	/** The text for the live region. Reactive, and different every time something is said. */
	get message(): string {
		return this.#repeated ? `${this.#text}${REPEAT}` : this.#text;
	}

	/** What was last said, without the marker that forces a repeat to be heard. */
	get text(): string {
		return this.#text;
	}

	/** Says something. Saying it again is heard again. */
	say(text: string): void {
		if (text !== '' && text === this.#text) this.#repeated = !this.#repeated;
		this.#text = text;
	}

	/** Empties the region, so nothing is left for a later change to read back. */
	clear(): void {
		this.#text = '';
		this.#repeated = false;
	}
}
