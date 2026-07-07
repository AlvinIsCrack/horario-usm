<script lang="ts">
	import { fade } from 'svelte/transition';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';

	interface Comment {
		text: string;
		date: string;
	}

	interface Props {
		comments: Comment[];
	}

	let { comments }: Props = $props();
	let currentIndex = $state(0);
	let isPaused = $state(false);

	// Automatically rotates active comments when the mouse is not hovering
	$effect(() => {
		if (comments.length <= 1 || isPaused) return;

		const intervalId = setInterval(() => {
			currentIndex = (currentIndex + 1) % comments.length;
		}, 4000);

		return () => clearInterval(intervalId);
	});

	const activeComment = $derived(comments[currentIndex]);
</script>

{#if comments.length > 0}
	<div
		onmouseenter={() => (isPaused = true)}
		onmouseleave={() => (isPaused = false)}
		role="region"
		aria-label="Rotating comments"
		class="h-fit"
	>
		<div class="flex items-center justify-between px-1">
			<span class="text-muted-foreground/70 text-[10px] font-bold uppercase">PALABRAS</span>

			{#if comments.length > 1}
				<div class="flex gap-1">
					{#each comments as _, i}
						<button
							aria-label={`Go to comment ${i + 1}`}
							onclick={() => {
								isPaused = true;
								currentIndex = i;
							}}
							class="size-1.5 rounded-full transition-all duration-300 {i === currentIndex
								? 'bg-primary pointer-events-none w-4'
								: 'bg-muted-foreground/30 cursor-pointer hover:ring-2'}"
						></button>
					{/each}
				</div>
			{/if}
		</div>

		<div class="relative h-14 w-full">
			{#snippet commentTooltip()}
				<div class="space-y-2">
					<p class="text-foreground p-2 text-sm leading-snug italic">
						{@html activeComment.text
							.replaceAll('\n', '<br/>')
							.replace(/\((.*?)\)/g, '<span class="opacity-50">($1)</span>')}
					</p>
					<div
						class="text-muted-foreground -mx-3 flex items-center justify-between border-t border-white/10 px-3 pt-2 text-xs"
					>
						<span class="text-nowrap">{new Date(activeComment.date).toLocaleDateString()}</span>
					</div>
				</div>
			{/snippet}

			{#key currentIndex}
				<div
					in:fade={{ duration: 100, delay: 200 }}
					out:fade={{ duration: 100 }}
					class="relative inset-0 -mb-2 h-full w-full"
				>
					<Tooltip
						wrapperClass="cursor-help w-full block! max-h-full"
						class="min-w-lg! 2xl:min-w-xl!"
						content={commentTooltip}
					>
						<div
							class="group hover:bg-accent hover:border-foreground relative h-full w-full rounded-lg border p-1.5 px-2.5 transition-colors"
						>
							<p class="z-5 line-clamp-3 text-xs italic">
								{activeComment.text.replace(/\n/g, ' ')}
							</p>
						</div>
					</Tooltip>
				</div>
			{/key}
		</div>
	</div>
{/if}
