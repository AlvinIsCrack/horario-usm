<script lang="ts">
	import RamoSummary from '$lib/components/elements/RamoSummary.svelte';
	import Select from '$lib/components/ui/Select.svelte';
	import OptimizerInputs from '$lib/logic/promedios/components/OptimizerInputs.svelte';
	import { GRAFOS_TEMPLATES } from '$lib/logic/promedios/templates';
	import { PromediosPageState } from '../../../../routes/promedios/+page.svelte';

	const templateOptions = Object.keys(GRAFOS_TEMPLATES).map((k) => ({ value: k, label: k }));

	// Cuando cambia el template, reseteamos todo
	function loadTemplate(key: string) {
		if (!GRAFOS_TEMPLATES[key]) return;
		PromediosPageState.init(JSON.parse(JSON.stringify(GRAFOS_TEMPLATES[key])));
	}
	let currentRamo = $state('');
</script>

<div class="flex h-full max-h-full min-h-0 w-full flex-col gap-4">
	<div class="z-10 flex shrink-0 flex-col gap-1">
		<p class="text-muted-foreground text-xs font-bold uppercase">Ramo</p>
		<div class="w-64">
			<Select
				items={templateOptions}
				placeholder="Seleccionar..."
				onUpdate={(val) => loadTemplate(val)}
				bind:value={currentRamo}
			/>
		</div>
	</div>

	{#if currentRamo}
		<div class="shrink-0">
			<RamoSummary sigla={currentRamo} />
		</div>
	{/if}

	<div class="min-h-0 flex-1 space-y-8 overflow-y-auto p-2">
		{#if PromediosPageState.graph}
			<OptimizerInputs />
		{/if}
	</div>
</div>
