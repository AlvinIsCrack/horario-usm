<script lang="ts">
	import { Data } from '$lib/data/data.svelte';
	import SelectUI from '$lib/components/ui/Select.svelte';
	import Search from '$lib/icons/search.svelte';
	import { ProfessorPageState } from '../../../../routes/profesores/+page.svelte';

	const sedeOptions = [
		{ value: 'ALL', label: 'Todas las Sedes' },
		{ value: 'Viña del Mar', label: 'Viña del Mar' },
		{ value: 'Valparaíso', label: 'Valparaíso' },
		{ value: 'San Joaquín', label: 'San Joaquín' },
		{ value: 'Vitacura', label: 'Vitacura' },
		{ value: 'Concepción', label: 'Concepción' }
	];

	const deptoOptions = $derived([
		{ value: 'ALL', label: 'Todos los Deptos.' },
		...Data.departamentos.map((d) => ({
			value: d,
			label: d[0].toUpperCase() + d.slice(1).toLowerCase()
		}))
	]);
</script>

<div class="flex w-full flex-col gap-4">
	<div class="flex flex-col gap-1">
		<p class="label">Búsqueda</p>
		<div class="relative">
			<Search class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
			<input
				bind:value={ProfessorPageState.query}
				type="text"
				placeholder="Buscar nombre o ramo..."
				class="border-input placeholder:text-muted-foreground focus-visible:ring-ring h-10 w-full rounded-md border bg-transparent pr-4 pl-9 text-sm focus-visible:ring-1 focus-visible:outline-none"
			/>
		</div>
	</div>

	<div class="flex flex-col gap-1">
		<p class="label">Sede</p>
		<SelectUI
			items={sedeOptions}
			bind:value={ProfessorPageState.selectedSede}
			placeholder="Todas"
			class="w-full"
		/>
	</div>

	<div class="flex flex-col gap-1">
		<p class="label">Departamento</p>
		<SelectUI
			items={deptoOptions}
			bind:value={ProfessorPageState.selectedDepto}
			placeholder="Todos"
			class="w-full"
		/>
	</div>
</div>
