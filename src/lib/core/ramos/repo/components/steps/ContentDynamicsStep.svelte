<script lang="ts">
	import type { FormStateManager } from '$lib/components/ui/form';
	import FieldHeader from '../forms/FieldHeader.svelte';
	import ToggleField from '../forms/ToggleField.svelte';

	interface Props {
		form: FormStateManager<any>;
		styles: any;
	}

	let { form, styles }: Props = $props();
</script>

<div class={styles.container()}>
	<FieldHeader
		title="Formato de Evaluación"
		description="Naturaleza y ponderación de las notas: ¿Predominan los certámenes teóricos, proyectos prácticos o evaluación continua?"
		htmlFor="evaluation-format"
		{styles}
	/>
	<ToggleField
		id="evaluation-format"
		{form}
		items={[
			{ value: 'theoretical', label: 'Teórico', desc: 'Puros certámenes tradicionales en aula' },
			{
				value: 'practical',
				label: 'Práctico / Proyecto',
				desc: 'Talleres, laboratorios o entregas de código'
			},
			{
				value: 'continuous',
				label: 'Mixto / Continuo',
				desc: 'Controles cortos, tareas semanales y certámenes'
			}
		]}
	/>
</div>

<div class={styles.container()}>
	<FieldHeader
		title="Curva de Aprendizaje"
		description="Facilidad para asimilar los conceptos. ¿Requiere romper una barrera inicial altísima o es intuitivo?"
		htmlFor="learning-curve"
		{styles}
	/>
	<ToggleField
		id="learning-curve"
		{form}
		items={[
			{ value: 'intuitive', label: 'Intuitivo', desc: 'Materia amigable y fácil de digerir' },
			{
				value: 'steep',
				label: 'Progresivo',
				desc: 'Complejidad escalonada a lo largo del semestre'
			},
			{ value: 'wall', label: 'Una Pared', desc: 'Barrera de entrada altísima desde la semana 1' }
		]}
	/>
</div>

<div class={styles.container()}>
	<FieldHeader
		title="Factor de Grupo"
		description="Grado de dependencia del trabajo en equipo para el éxito académico y su impacto en la carga de estrés."
		htmlFor="group-factor"
		{styles}
	/>
	<ToggleField
		id="group-factor"
		{form}
		items={[
			{ value: 'individual', label: 'Individual', desc: 'Tu nota depende 100% de ti' },
			{ value: 'moderate', label: 'Híbrido', desc: 'Tareas grupales pero certámenes individuales' },
			{
				value: 'high',
				label: 'Grupal Dependiente',
				desc: 'Proyectos pesados donde el equipo define tu nota y salud mental'
			}
		]}
	/>
</div>

<div class={styles.container()}>
	<FieldHeader
		title="Calidad del Soporte Secundario"
		description="Ecosistema de apoyo: utilidad de las ayudantías, coordinación de laboratorios y disposición de los correctores."
		htmlFor="support-quality"
		{styles}
	/>
	<ToggleField
		id="support-quality"
		{form}
		items={[
			{
				value: 'poor',
				label: 'Deficiente',
				desc: 'Ayudantías confusas, mala coordinación o correctores implacables'
			},
			{
				value: 'average',
				label: 'Estándar',
				desc: 'Cumple el mínimo para estudiar y resolver dudas'
			},
			{
				value: 'excellent',
				label: 'Excelente',
				desc: 'Ayudantes cracks, material útil y pautas claras'
			}
		]}
	/>
</div>

<div class={styles.container()}>
	<FieldHeader
		title="Relevancia en la Malla"
		description="¿Qué tan vital es dominar este ramo para sobrevivir a las asignaturas que vienen más adelante?"
		htmlFor="academic-relevance"
		{styles}
	/>
	<ToggleField
		id="academic-relevance"
		{form}
		items={[
			{ value: 'low', label: 'Relleno / Aislado', desc: 'Materia que muere al cerrar el semestre' },
			{ value: 'medium', label: 'Útil', desc: 'Aporta herramientas complementarias secundarias' },
			{
				value: 'fundamental',
				label: 'Pilar Fundamental',
				desc: 'Base obligatoria para entender los ramos de especialización'
			}
		]}
	/>
</div>

<div class={styles.container()}>
	<FieldHeader
		title="Valor Laboral"
		description="Fuera de la universidad, ¿qué tan útiles son las herramientas que aprendiste aquí para el mundo profesional?"
		htmlFor="labor-value"
		{styles}
	/>
	<ToggleField
		id="labor-value"
		{form}
		items={[
			{
				value: 'obsolete',
				label: 'Teórico / Obsoleto',
				desc: 'Enfoque académico alejado de la realidad del mercado'
			},
			{
				value: 'formative',
				label: 'Criterio Analítico',
				desc: 'Te forma una base lógica útil para resolver problemas'
			},
			{
				value: 'practical',
				label: 'Directo a la Industria',
				desc: 'Enseña softwares, tecnologías o metodologías reales del rubro'
			}
		]}
	/>
</div>
