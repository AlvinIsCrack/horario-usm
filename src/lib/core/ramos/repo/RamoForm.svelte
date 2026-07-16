<script module>
	import { tv } from 'tailwind-variants';

	export const ramoFormVariants = tv({
		slots: {
			wizardStep: '',
			title: 'label text-lg',
			label: 'label text-base font-medium text-card-foreground',
			description: 'text-sm text-muted-foreground max-w-xl mb-2',
			container: [
				'flex flex-row items-start *:flex-1 *:first:shrink *:not-first:justify-end md:*:first:max-w-1/2 flex-wrap max-h-auto overflow-hidden',
				'not-last:mb-4 gap-x-16 py-1 px-4 rounded-md',
				'bg-linear-to-r from-card bg-accent/60 odd:bg-accent',
				'transition-all duration-400 opacity-100 starting:h-0 starting:max-h-0 starting:opacity-0',
				'has-data-[state=on]:bg-primary/40 has-data-[state=on]:odd:bg-primary/60 has-[textarea:not(:placeholder-shown)]:bg-primary/60 has-[textarea:not(:placeholder-shown)]:odd:bg-primary/60'
			]
		}
	});

	const styles = ramoFormVariants({});
</script>

<script lang="ts">
	import Form, { FormStateManager } from '$lib/components/ui/form';
	import RamoWizard from './components/RamoWizard.svelte';

	import ExperienceStep from './components/steps/ExperienceStep.svelte';
	import RulesStep from './components/steps/RulesStep.svelte';
	import ContentDynamicsStep from './components/steps/ContentDynamicsStep.svelte';
	import CriticalExtrasStep from './components/steps/CriticalExtrasStep.svelte';

	/**
	 * Processes the aggregated multi-step wizard data layout.
	 */
	function handleFormCompletion(payload: Record<string, any>): void {
		alert('Gracias por completar ah');
		console.log(payload)
	}

	// Single source of truth for all dynamic IDs inside this form scope
	const form = new FormStateManager({}, async (data) => {
		handleFormCompletion(data);
		return { success: true, data };
	});
</script>

{#snippet experience()}
	<ExperienceStep {form} {styles} />
{/snippet}

{#snippet rules()}
	<RulesStep {form} {styles} />
{/snippet}

{#snippet dynamics()}
	<ContentDynamicsStep {form} {styles} />
{/snippet}

{#snippet critical()}
	<CriticalExtrasStep {form} {styles} />
{/snippet}

<Form.Root manager={form}>
	<RamoWizard
		onComplete={() => form.submit()}
		steps={[
			{ title: 'Experiencia', component: experience },
			{ title: 'Forma', component: rules },
			{ title: 'Dinámica', component: dynamics },
			{ title: 'Finalizar', component: critical }
		]}
	/>
</Form.Root>
