/**
 * @coral/kit/country-select
 * @version 1.0.0
 */

import { collator, displayNames } from '../../lib/intl.js';
import type { Option } from '../../lib/options.js';

/**
 * Every ISO 3166-1 alpha-2 code. Only the codes: the names come from `Intl.DisplayNames` in the
 * reader's locale, so no translated list ships with the component or falls out of date.
 */
export const COUNTRIES: readonly string[] = `
	AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI
	BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN
	CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK
	FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM
	HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN
	KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK
	ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP
	NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW
	SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF
	TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI
	VN VU WF WS YE YT ZA ZM ZW
`
	.trim()
	.split(/\s+/);

/** Where the regional indicator letters start: `A` maps here, `Z` 25 code points on. */
const REGIONAL_INDICATOR_A = 0x1f1e6;

/**
 * The flag emoji for a two-letter code, built from regional indicator symbols. Platforms without
 * flag glyphs, Windows among them, draw the two letters instead, which still identifies the country.
 */
export function flag(code: string): string {
	return String.fromCodePoint(
		...[...code.toUpperCase()].map((letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - 65)
	);
}

/**
 * The countries as options, named and sorted in `locale`. Each is also found by its code and by its
 * English name, so `Germany` finds `Deutschland` for a reader who knows the country by that name.
 */
export function countryOptions(codes: readonly string[], locale?: string): Option<string>[] {
	const names = displayNames(locale, { type: 'region', fallback: 'none' });
	const english = displayNames('en', { type: 'region', fallback: 'none' });
	const order = collator(locale);

	return codes
		.map((code) => {
			const label = names.of(code) ?? code;
			const known = english.of(code);
			return {
				value: code,
				label,
				keywords: known && known !== label ? [code, known] : [code]
			};
		})
		.sort((a, b) => order.compare(a.label, b.label));
}
