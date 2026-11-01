/**
 * @coral/kit/phone-input
 * @version 1.0.0
 */

import {
	AsYouType,
	getCountries,
	getCountryCallingCode,
	isSupportedCountry,
	parsePhoneNumberFromString
} from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

/** What the field holds after one edit. */
export type Reading = {
	/** The text to show, formatted for the country it was typed in. */
	text: string;
	/** The number in E.164 (`+14155550123`), complete or not. `undefined` while there is none. */
	value: string | undefined;
	/** The country the number belongs to, as far as can be told yet. */
	country: CountryCode | undefined;
	/** Whether the number is complete and has the length its country allows. */
	valid: boolean;
};

/** The countries a phone number can be entered for, from the ones asked for. */
export function supportedCountries(codes?: readonly string[]): CountryCode[] {
	return codes ? codes.filter((code) => isSupportedCountry(code)) : getCountries();
}

/** The calling code of a country, with its plus: `+49`. */
export function dialCode(country: CountryCode): string {
	return `+${getCountryCallingCode(country)}`;
}

/**
 * Whether a search reads as a calling code that belongs to `country`: `+44`, `44` and `+4` all find
 * the United Kingdom. Anything with a letter in it is left to the name match.
 */
export function matchesDialCode(country: string, search: string): boolean {
	const digits = search.replace(/[\s+]/g, '');
	if (!/^\d+$/.test(digits) || !isSupportedCountry(country)) return false;
	return getCountryCallingCode(country).startsWith(digits);
}

/**
 * Reads what is in the field. Text starting with `+` is international and names its own country;
 * anything else is national to `country`. With no country there is nothing to be national to, so
 * the plus is written in for the reader.
 */
export function read(input: string, country: CountryCode | undefined): Reading {
	const digits = input.replace(/\D/g, '');
	const international = input.trimStart().startsWith('+') || country === undefined;

	if (digits === '') {
		// A lone plus stays, so the reader can go on to type the calling code after it.
		const text = international && input.includes('+') ? '+' : '';
		return { text, value: undefined, country, valid: false };
	}

	const formatter = new AsYouType(international ? undefined : country);
	const text = formatter.input(international ? `+${digits}` : digits);
	const value = formatter.getNationalNumber() === '' ? undefined : formatter.getNumberValue();

	return {
		text,
		value,
		country: international ? countryOf(formatter, country) : country,
		valid: formatter.isValid()
	};
}

/**
 * The country an international number belongs to. A calling code several countries share, `+1`
 * among them, names none until enough digits are in; until then the current country stays if it
 * shares the code, so the picker does not flicker to blank on every number typed under it.
 */
function countryOf(formatter: AsYouType, current: CountryCode | undefined) {
	const detected = formatter.getCountry();
	if (detected) return detected;

	const code = formatter.getCallingCode();
	return current && code === getCountryCallingCode(current) ? current : undefined;
}

/**
 * How a stored value is shown: nationally when it belongs to `country`, internationally when it
 * does not, because a national number shown under the wrong flag dials somewhere else.
 */
export function display(value: string | undefined, country: CountryCode | undefined): string {
	if (!value) return '';

	const number = parsePhoneNumberFromString(value);
	if (!number) return new AsYouType().input(value);
	return number.country === country ? number.formatNational() : number.formatInternational();
}

/** The country a stored value belongs to, when it can be told. */
export function countryOfValue(value: string | undefined): CountryCode | undefined {
	return value ? parsePhoneNumberFromString(value)?.country : undefined;
}

/**
 * The field after the reader picks another country: the digits they typed, read as a number of the
 * new one. Picking the country second should not mean typing the number twice.
 */
export function switchCountry(
	input: string,
	from: CountryCode | undefined,
	to: CountryCode
): Reading {
	const formatter = new AsYouType(input.trimStart().startsWith('+') ? undefined : from);
	formatter.input(input);
	const national = formatter.getNationalNumber();
	if (national === '') return read('', to);

	const reading = read(`${dialCode(to)}${national}`, to);
	return { ...reading, text: display(reading.value, to), country: to };
}
