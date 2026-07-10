<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import FieldHeader from '../forms/FieldHeader.svelte';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { styles }: Props = $props();
</script>

<div class={styles.container()}>
	<FieldHeader
		title="El 'Filtro' del Ramo"
		description="¿Qué unidad o concepto específico es el que 'corta cabezas'? Ese tema que requirió el doble de esfuerzo."
		htmlFor="course-filter"
		{styles}
	/>
</div>

<div class={styles.container()}>
	<FieldHeader
		title="El Hito Crítico"
		description="¿Cuál es la evaluación más difícil o decisiva del semestre? (Ej: El Certamen 2, La entrega final del proyecto)."
		htmlFor="critical-evaluation"
		{styles}
	/>
</div>
