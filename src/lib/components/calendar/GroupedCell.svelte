<script lang="ts">
	import { Calendario } from '$lib/states/calendario.svelte';
	import { TipoBloque, type Bloque, type Días } from '$lib/types/horario';
	import BlockContent from './BlockContent.svelte';

	let { día, bloque }: { día: Días; bloque: number } = $props();

	const bloque1_array = $derived(Calendario.getBloques(día, bloque));
	const bloque2_array = $derived(Calendario.getBloques(día, bloque + 1));

	/**
	 * Crea una "firma" única y ordenada para una lista de bloques.
	 * Esta firma representa el contenido exacto de la celda.
	 * @param bloques El array de bloques a procesar.
	 * @returns Un string que identifica de forma única los ramos en la celda.
	 */
	function getBloquesSignature(bloques: Bloque[] | null): string {
		if (!bloques || bloques.length === 0) return '';

		// Ordena para que el orden de los ramos en conflicto no afecte la firma.
		return bloques
			.map((b) => `${b.ramo!.sigla}-${b.ramo!.paralelo}-${b.sala}`)
			.sort()
			.join(',');
	}

	const isMerged = $derived.by(() => {
		const signature1 = getBloquesSignature(bloque1_array);
		const signature2 = getBloquesSignature(bloque2_array);

		// Las celdas se fusionan si y solo si sus firmas son idénticas.
		// Esto cubre el caso en que ambas están vacías ('' === '') y
		// el caso en que ambas tienen exactamente los mismos ramos.
		return signature1 === signature2;
	});
</script>

<div class="relative flex h-28 min-h-full w-full flex-col">
	{#if isMerged}
		<BlockContent bloques={bloque1_array} />
	{:else}
		<div class="h-1/2 w-full">
			<BlockContent bloques={bloque1_array} />
		</div>
		<div class="h-1/2 w-full">
			<BlockContent bloques={bloque2_array} />
		</div>
	{/if}
</div>
