/**
 * @coral/lib/defaults
 * @version 1.0.0
 */

import { getContext, hasContext, setContext } from 'svelte';

declare global {
	/**
	 * What a project states once, for every Coral component rendered under it: the locale its
	 * formatting follows, and the copy and policy values it would otherwise repeat at every call
	 * site.
	 *
	 * Only `locale` is declared here. Each component adds its own entry from its `types.ts`, keyed
	 * by its manifest name, so the shape a project can set is exactly the set of components it
	 * installed - and a prop that does not exist on the component cannot be set as a default for
	 * it either. The interface is global because the components reach each other by relative path,
	 * and a relative module augmentation does not survive being installed, or read through a
	 * workspace link, the way a global one does.
	 */
	interface CoralDefaults {
		/** The locale every component formats and sorts in, unless a call site passes its own. */
		locale?: string;
	}
}

/** The manifest name of every component that declared defaults. */
export type ComponentName = Exclude<keyof CoralDefaults, 'locale'>;

/** One component's defaults, with the shared locale folded in. */
export type ComponentDefaults<K extends ComponentName> = NonNullable<CoralDefaults[K]> & {
	locale?: string;
};

const KEY = Symbol('coral-defaults');

/**
 * States the defaults for every Coral component below the caller. Call it from the root layout, or
 * from any component to override them for one subtree - a section in another language, say.
 *
 * A default is read when a component is created. To switch defaults for components already on the
 * page, re-create them: keying the subtree on the locale is what a language switch does anyway.
 */
export function setCoralDefaults(defaults: CoralDefaults): void {
	setContext(KEY, defaults);
}

/**
 * The defaults in effect for one component, or only the shared ones for a component that declares
 * none of its own. Empty outside any `setCoralDefaults`, so a component falls through to its
 * English defaults the way it always has.
 */
export function getCoralDefaults(): Pick<CoralDefaults, 'locale'>;
export function getCoralDefaults<K extends ComponentName>(component: K): ComponentDefaults<K>;
export function getCoralDefaults(component?: ComponentName) {
	const all: CoralDefaults = hasContext(KEY) ? getContext(KEY) : {};
	return { ...(component ? all[component] : undefined), locale: all.locale };
}
