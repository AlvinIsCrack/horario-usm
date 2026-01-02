<script lang="ts">
	import Circle from '$lib/icons/circle.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import { Días, type Bloque } from '$lib/types/horario';
	import _ from 'lodash';
	import { untrack } from 'svelte';

	let { bloques }: { bloques: Bloque[] } = $props();

	const [bloqueBegin, bloqueEnd] = $derived.by(() => {
		let def = Calendario.bloqueRange;
		if (bloques.length > 0) {
			const min = Math.min(1, _.minBy(bloques, 'bloque')?.bloque ?? def[0]);
			const max = Math.max(8, _.maxBy(bloques, 'bloque')?.bloque ?? def[1]);
			def = [min, max];
		}
		return def;
	});
	const [díaBegin, díaEnd] = $derived.by(() => {
		let def = Calendario.range;
		if (bloques.length > 0) {
			const min = Math.min(Días.Lunes, _.minBy(bloques, 'dia')?.dia ?? def[0]);
			const max = Math.max(Días.Viernes, _.maxBy(bloques, 'dia')?.dia ?? def[1]);
			def = [min, max];
		}
		return def;
	});

	const gridState = $derived.by(() => {
		const __ = Calendario.ramos;

		return untrack(() => {
			const state = new Map<string, { scale: string; color: string }>();
			const newBloquesMap = _.keyBy(bloques, (b) => `${b.dia}-${b.bloque}`);

			for (const bloque of _.range(bloqueBegin, bloqueEnd + 1)) {
				for (const dia of _.range(díaBegin, díaEnd + 1)) {
					const key = `${dia}-${bloque}`;
					const newBloque = newBloquesMap[key];
					const n = newBloque !== undefined;

					const c =
						(Calendario.getBloques(bloque, dia)?.filter(
							(b) => b.ramo.sigla !== newBloque?.ramo.sigla
						).length ?? 0) > 0;

					state.set(key, {
						scale: !c && !n ? '80%' : '100%',
						color: c && n ? 'var(--warning)' : c ? '#fff8' : n ? 'var(--primary)' : '#fff2'
					});
				}
			}
			return state;
		});
	});
</script>

<div>
	<table>
		<tbody>
			<tr>
				<td></td>
				{#each _.range(díaBegin, díaEnd + 1) as día (día)}
					<td class="text-muted-foreground">
						{Días[día].charAt(0)}
					</td>
				{/each}
			</tr>
			{#each _.range(bloqueBegin, bloqueEnd + 1) as bloque (bloque)}
				<tr>
					<td>
						<div class="text-muted-foreground">
							{bloque}
						</div>
					</td>
					{#each _.range(díaBegin, díaEnd + 1) as día (día)}
						{@const cellState = gridState.get(`${día}-${bloque}`)}
						<td class="m-0 h-min w-min border-0 px-3 text-center text-sm">
							{#if cellState}
								<Circle
									style="scale: {cellState.scale}; color: {cellState.color};"
									class="inline"
								/>
							{/if}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
