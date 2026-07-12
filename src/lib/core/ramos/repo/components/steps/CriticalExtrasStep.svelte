<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import { Form } from '$lib/components/ui/form';
	import FieldHeader from '../forms/FieldHeader.svelte';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { styles, form }: Props = $props();
</script>

{#if form}
	<Form.Field name="teacher-factor" class={styles.container()}>
		<FieldHeader
			title="Factor Docente"
			description="¿El ramo sigue un programa estandarizado o tu nota final depende casi totalmente del profesor que te tocó?"
			htmlFor="teacher-factor"
		/>
		<Form.Message />
	</Form.Field>
{/if}

{#if form.values['teacher-factor']}
	<Form.Field name="snowball-effect" class={styles.container()}>
		<FieldHeader
			title="Continuidad del Contenido (Bola de nieve)"
			description="Si te pierdes al principio, ¿puedes recuperarte más adelante o cada clase depende estrictamente de la anterior?"
			htmlFor="snowball-effect"
		/>
		<Form.Message />
	</Form.Field>
{/if}
