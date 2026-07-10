<script module>
	import { tv } from 'tailwind-variants';

	const ramoFormVariants = tv({
		slots: {
			wizardStep: '',
			title: 'label text-lg mb-2',
			label: 'label text-base font-medium text-card-foreground',
			description: 'text-sm text-muted-foreground max-w-xl',
			container:
				'not-last:mb-4 flex flex-col md:flex-row *:flex-1 *:first:shrink *:last:justify-start md:*:first:max-w-1/2 gap-16 items-center pb-2 px-4 border-b'
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
		// Target execution logic for processing form submission
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
