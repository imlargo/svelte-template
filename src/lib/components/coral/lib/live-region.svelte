<script lang="ts">
	/**
	 * @coral/lib/live-region
	 * @version 1.0.0
	 */

	let {
		message = '',
		assertive = false,
		id
	}: {
		/** What to say. Announced whenever it changes - see `lib/announce` for saying it twice. */
		message?: string;
		/**
		 * Interrupts whatever the reader is hearing. For something they are doing right now, such as
		 * a row moving under their hands; a result they can read at leisure stays polite.
		 */
		assertive?: boolean;
		/** For a component that also points at this region with `aria-describedby`. */
		id?: string;
	} = $props();
</script>

<!--
	Rendered always, empty until there is something to say: a region added to the page at the same
	moment as its text is a region most screen readers never read, because they announce a change
	within one that was already there.

	`role="status"` rather than `role="alert"` even when assertive. Both interrupt, but an alert is
	announced as an alert - some screen readers prefix it, and none of this is an error.

	It sits outside the control it belongs to, so the words are not also read as part of that
	control's own name.
-->
<span {id} role="status" aria-live={assertive ? 'assertive' : undefined} class="sr-only">
	{message}
</span>
