/**
 * @coral/lib/fold
 * @version 1.0.0
 */

/**
 * Folds a string into the form searches compare against: lower case, no accents.
 *
 * Accented input is why this exists. `Açaí` and `Piña` are typed `acai` and `pina` far more often
 * than not, and comparing raw strings finds neither - the list looks empty for a term the user can
 * see on screen. NFD splits an accented character into base letter plus combining mark, so
 * dropping the marks leaves the letter. `ñ` folds to `n` for the same reason, distinct letter of
 * the alphabet though it is.
 */
export function fold(value: string): string {
	return value
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLocaleLowerCase();
}
