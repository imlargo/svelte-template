<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Progress } from '$lib/components/ui/progress/index.js';
	import { X, Upload, File as FileIcon, AlertCircle } from '@lucide/svelte';
	import { ScrollArea } from '$components/ui/scroll-area';

	type Props = {
		variant?: 'single' | 'multiple';
		accept?: string;
		maxSize?: number;
		maxFiles?: number;
		disabled?: boolean;
		value?: File[];
		onFilesChange?: (files: File[]) => void;
		showFiles?: boolean;
	};

	let {
		variant = 'single',
		accept = '',
		maxSize = 5 * 1024 * 1024, // 5MB
		maxFiles = 5,
		disabled = false,
		value = $bindable(),
		onFilesChange,
		showFiles = true
	}: Props = $props();

	let files = $state<File[]>([]);
	let error = $state<string | null>(null);
	let uploadProgress = $state<number>(0);

	let fileInputRef: HTMLInputElement;

	$effect(() => {
		if (files.length > 0 && uploadProgress < 100) {
			const timer = setTimeout(() => {
				uploadProgress = Math.min(uploadProgress + 10, 100);
			}, 80);

			return () => clearTimeout(timer);
		}
	});

	const isValidFileType = (fileType: string): boolean => {
		if (!accept) return true;

		const acceptedTypes = accept.split(',');
		return acceptedTypes.some((type) => {
			// Handle wildcards like image/*
			if (type.endsWith('/*')) {
				const category = type.split('/')[0];
				return fileType.startsWith(`${category}/`);
			}
			return type === fileType;
		});
	};

	const isValidFileSize = (fileSize: number): boolean => {
		return fileSize <= maxSize;
	};

	const validateFiles = (fileList: FileList): { valid: File[]; errors: string[] } => {
		const validFiles: File[] = [];
		const errors: string[] = [];

		Array.from(fileList).forEach((file: File) => {
			if (!isValidFileType(file.type)) {
				errors.push(`File "${file.name}" is not a valid file type.`);
			} else if (!isValidFileSize(file.size)) {
				errors.push(`File "${file.name}" exceeds the maximum size of ${formatFileSize(maxSize)}.`);
			} else {
				validFiles.push(file);
			}
		});

		return { valid: validFiles, errors };
	};

	const handleFiles = (fileList: FileList) => {
		error = null;

		const { valid, errors } = validateFiles(fileList);

		if (errors.length > 0) {
			error = errors[0];
			return;
		}

		if (variant === 'single') {
			if (valid.length > 0) {
				files = [valid[0]];
				uploadProgress = 0;
				handleFilesChange([valid[0]]);
			}
		} else {
			// For multiple files, respect the maxFiles limit
			const newFiles = [...files, ...valid].slice(0, maxFiles);
			files = newFiles;
			uploadProgress = 0;
			handleFilesChange(newFiles);
		}
	};

	const handleInputChange = (e: Event) => {
		const files = (e.target as HTMLInputElement).files;
		if (files) {
			handleFiles(files);
		}
	};

	const handleClick = () => {
		if (!disabled && fileInputRef) {
			fileInputRef.click();
		}
	};

	const removeFile = (index: number) => {
		const newFiles = [...files];
		newFiles.splice(index, 1);
		files = newFiles;
		handleFilesChange(newFiles);
	};

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	function handleFilesChange(files: File[]) {
		value = files;

		if (onFilesChange) {
			onFilesChange(files);
		}
	}
</script>

<div class="space-y-4">
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		onclick={handleClick}
		class="hover:border-primary hover:bg-primary/5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 transition-colors"
	>
		<input
			bind:this={fileInputRef}
			type="file"
			{accept}
			multiple={variant === 'multiple'}
			{disabled}
			onchange={handleInputChange}
			class="hidden"
			aria-label={variant === 'single' ? 'Select file' : 'Select files'}
		/>
		<Upload class="text-muted-foreground h-10 w-10" />
		<div class="text-center">
			<p class="text-sm font-medium">
				Click to select {variant === 'single' ? 'a file' : 'files'}.
			</p>
			<p class="text-muted-foreground mt-1 text-xs">
				{variant === 'single' ? 'Maximum file size: ' : 'Maximum file size per file: '}
				{formatFileSize(maxSize)}
			</p>

			{#if variant === 'multiple'}
				<p class="text-muted-foreground text-xs">Maximum files: {maxFiles}</p>
			{/if}
		</div>
	</div>

	{#if error}
		<div class="text-destructive flex items-center gap-2 text-sm">
			<AlertCircle class="size-4" />
			<span>{error}</span>
		</div>
	{/if}

	{#if files.length > 0 && showFiles}
		<ScrollArea class="h-full max-h-36 w-full lg:max-h-44">
			<div class="flex w-full flex-col gap-y-2">
				{#each files as file, index (index)}
					<div class="bg-muted/40 flex w-full items-center justify-between rounded-lg p-3">
						<div class="flex items-center gap-2 overflow-hidden">
							<FileIcon class="text-muted-foreground size-5 shrink-0" />
							<div class="min-w-0 max-w-52">
								<p class="truncate text-sm font-medium">{file.name}</p>
								<p class="text-muted-foreground text-xs">{formatFileSize(file.size)}</p>
							</div>
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							class="h-8 w-8 shrink-0"
							onclick={(e) => {
								e.stopPropagation();
								removeFile(index);
							}}
						>
							<X class="size-4" />
							<span class="sr-only">Remove file</span>
						</Button>
					</div>
				{/each}
			</div>
		</ScrollArea>
	{/if}

	{#if uploadProgress > 0 && uploadProgress < 100}
		<div class="space-y-1">
			<div class="flex justify-between text-xs">
				<span>Uploading...</span>
				<span>{uploadProgress}%</span>
			</div>
			<Progress value={uploadProgress} class="h-2" />
		</div>
	{/if}
</div>
