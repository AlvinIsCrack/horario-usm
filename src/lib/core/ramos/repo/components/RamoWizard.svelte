<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Step {
		title: string;
		component: Snippet;
	}

	interface Props {
		steps: Step[];
		onComplete?: () => void;
	}

	let { steps, onComplete }: Props = $props();
	let currentStep = $state(0);

	const isFirstStep = $derived(currentStep === 0);
	const isLastStep = $derived(currentStep === steps.length - 1);

	/**
	 * Navigates to the next step or triggers completion if on the final step.
	 */
	function next(): void {
		if (isLastStep) {
			onComplete?.();
		} else {
			currentStep += 1;
		}
	}

	/**
	 * Navigates back to the preceding step.
	 */
	function previous(): void {
		if (!isFirstStep) {
			currentStep -= 1;
		}
	}
</script>

<div class="mx-auto w-full max-w-4xl space-y-4">
	<div class="flex items-center justify-between pb-6 select-none">
		{#each steps as step, index}
			<div class="flex flex-1 items-center gap-2 last:flex-initial">
				<div
					class="flex size-8 shrink-0 items-center justify-center rounded-full border font-semibold tabular-nums transition-colors duration-200"
					class:bg-primary={index <= currentStep}
					class:text-primary-foreground={index <= currentStep}
					class:bg-muted={index > currentStep}
					class:text-muted-foreground={index > currentStep}
				>
					{index + 1}
				</div>

				<div class="hidden text-left md:block">
					<p
						class="text-sm font-medium transition-colors"
						class:text-foreground={index <= currentStep}
						class:text-muted-foreground={index > currentStep}
					>
						{step.title}
					</p>
				</div>

				<div
					class={cn(
						'bg-muted mx-0 h-0.5 w-full mask-l-from-80% transition-colors duration-300',
						index < currentStep && 'bg-primary'
					)}
				></div>
			</div>
		{/each}
	</div>

	<div class="min-h-75 py-4">
		{@render steps[currentStep].component()}
	</div>

	<div class="flex items-center justify-between pt-4">
		<Button type="button" onclick={previous} disabled={isFirstStep} variant="secondary">
			Anterior
		</Button>

		<Button type="button" onclick={next}>
			{isLastStep ? 'Finalizar' : 'Siguiente'}
		</Button>
	</div>
</div>
