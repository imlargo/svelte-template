<script lang="ts">
	/**
	 * @coral/lib/hidden-field
	 * @version 1.0.0
	 */

	let {
		name,
		value,
		form,
		required = false
	}: {
		/** Field name. The caller decides whether to render this at all, so it is not optional. */
		name: string;
		/** Already serialized - this component never stringifies a domain value. */
		value: string;
		/** `id` of the form to submit with, for a control that sits outside it. */
		form?: string;
		/** Blocks submission while `value` is empty. */
		required?: boolean;
	} = $props();
</script>

<!--
	The field that submits, for the components whose visible control is not an input: select,
	combobox and date-picker.

	**Not `type="hidden"`.** A hidden input is barred from constraint validation, so `required` on
	one is inert - the form submits empty and the browser reports nothing. Clipped to a pixel it is
	a real, validatable control, which is the trick bits-ui's own hidden input plays. `readonly` and
	`disabled` are barred too, so it is neither. `tabindex`/`aria-hidden` leave the pixel reachable
	by nothing but the validation bubble, which is what it is there for.
-->
<input
	class="sr-only"
	tabindex="-1"
	aria-hidden="true"
	autocomplete="off"
	{name}
	{form}
	{required}
	{value}
/>
