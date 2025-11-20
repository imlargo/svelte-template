<script lang="ts">
	import { CheckCircle, FileIcon, ImageIcon, VideoIcon, Loader2, XCircle } from '@lucide/svelte';

	type Props = {
		file: File;
		loading: boolean;
		error: string | null;
	};

	const { file, loading, error }: Props = $props();

	function getFileType(filename: string) {
		const extension = filename.toLowerCase().split('.').pop() || '';
		const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'];
		const videoExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
		if (imageExtensions.includes(extension)) return 'image';
		if (videoExtensions.includes(extension)) return 'video';
		return 'other';
	}

	const fileType = getFileType(file.name);
</script>

<div class="bg-muted/40 flex items-center gap-4 rounded-md p-3">
	<div class="bg-muted flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
		{#if fileType === 'image'}
			<ImageIcon class="text-muted-foreground size-5" />
		{:else if fileType === 'video'}
			<VideoIcon class="text-muted-foreground size-5" />
		{:else}
			<FileIcon class="text-muted-foreground size-5" />
		{/if}
	</div>

	<div class="items-top flex h-full min-w-0 flex-1 flex-col">
		<p class="truncate text-sm font-medium">{file.name}</p>
		{#if !loading}
			<p
				class="text-xs"
				class:text-destructive={error !== null}
				class:text-muted-foreground={error === null}
			>
				{#if error === null}
					Upload complete
				{:else if error !== null}
					{error}
				{/if}
			</p>
		{/if}
	</div>

	<div class="shrink-0">
		<div class="flex h-8 w-8 shrink-0 items-center justify-center">
			{#if loading}
				<Loader2 class="text-muted-foreground size-5 animate-spin" />
			{:else if error === null}
				<CheckCircle class="size-5 text-green-500" />
			{:else if error !== null}
				<XCircle class="text-destructive size-5" />
			{/if}
		</div>
	</div>
</div>
