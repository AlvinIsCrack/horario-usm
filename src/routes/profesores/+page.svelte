<script lang="ts">
	import { professorRepo } from '$lib/logic/professors/repository.svelte';

	// Iconos y UI Components
	import Search from '$lib/icons/search.svelte';
	import SelectUI from '$lib/components/ui/Select.svelte';
	import ProfessorCard from '$lib/logic/professors/components/ProfessorCard.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Slider from '$lib/components/ui/Slider.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';

	import { base } from '$app/paths';
	import { submitReview, type ReviewPayload } from '$lib/logic/reviews/api';
	import type { TagId, TagCategory, TagDefinition } from '$lib/logic/professors/types';
	import {
		USM_TAGS,
		EVALUATION_DIMENSIONS,
		TAG_CATEGORY_DESCRIPTIONS
	} from '$lib/logic/professors/types';
	import { orderTags } from '$lib/logic/professors';
	import { Data } from '$lib/data/data.svelte';
	import { Dialog } from '$lib/components/ui/helpers/DialogRenderer.svelte';
	import DialogComponent from '$lib/components/ui/Dialog.svelte';

	let query = $state('');
	let selectedSede = $state('ALL');
	let selectedDepto = $state('ALL');

	// --- ESTADO DEL MODAL DE EVALUACIÓN ---
	let isModalOpen = $state(false);
	let selectedProfessor = $state<any>(null);
	let isSubmitting = $state(false);
	let submissionError = $state<string | null>(null);

	// --- LÓGICA DE ALEATORIEDAD ---
	// Función helper para mezclar arrays (Fisher-Yates)
	function shuffleArray<T>(array: T[]): T[] {
		const newArray = [...array];
		for (let i = newArray.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
		}
		return newArray;
	}

	// Variables de estado para almacenar el orden aleatorio actual
	// Se inicializan con el orden por defecto para que no fallen al inicio
	let renderedDimensions = $state(Object.entries(EVALUATION_DIMENSIONS));
	// groupedTags se define más abajo, lo inicializamos vacío y lo llenamos al abrir
	let renderedTagGroups = $state<[string, TagDefinition[]][]>([]);

	// --- 1. Inicialización Dinámica de Métricas ---
	function getInitialMetrics() {
		const defaults: Record<string, any> = {};
		for (const dim of Object.values(EVALUATION_DIMENSIONS)) {
			for (const sub of Object.values(dim.sub_dimensions)) {
				if (sub.type === 'BARS') {
					defaults[sub.id] = 3;
				} else if (sub.type === 'DISCRETE') {
					// Selecciona la primera opción por defecto si existe
					defaults[sub.id] = Object.keys(sub.options)[0] || '';
				}
			}
		}
		return defaults;
	}

	// Estado del formulario (Ahora metrics es un objeto dinámico)
	let formValues = $state({
		metrics: getInitialMetrics(),
		tags: [] as TagId[],
		comment: ''
	});

	// Opciones de Sede
	const sedeOptions = [
		{ value: 'ALL', label: 'Todas las Sedes' },
		{ value: 'Viña del Mar', label: 'Viña del Mar' },
		{ value: 'Valparaíso', label: 'Valparaíso' },
		{ value: 'San Joaquín', label: 'San Joaquín' },
		{ value: 'Vitacura', label: 'Vitacura' },
		{ value: 'Concepción', label: 'Concepción' }
	];

	const deptoOptions = [
		{ value: 'ALL', label: 'Todos los Deptos.' },
		...Data.departamentos.map((d) => ({
			value: d,
			label: d[0].toUpperCase() + d.slice(1).toLowerCase()
		}))
	];

	// Búsqueda Reactiva
	const results = $derived(
		professorRepo.search(query, { sede: selectedSede, depto: selectedDepto }).filter((p) => {
			const n = p.name.toUpperCase().trim();
			const isInvalid =
				n.includes('SIN PROFESOR') ||
				n.startsWith('NN') ||
				n.includes('POR ASIGNAR') ||
				n.includes('NO ASIGNADO') ||
				n.length < 3;
			return !isInvalid;
		})
	);

	// --- LÓGICA DE APERTURA/CIERRE ---
	function openEvaluationModal(prof: any) {
		selectedProfessor = prof;
		// Resetear formulario dinámicamente
		formValues = {
			metrics: getInitialMetrics(),
			tags: [],
			comment: ''
		};
		submissionError = null;

		// --- ALEATORIZACIÓN DE GRUPOS ---
		// Mezclamos el orden de las dimensiones BARS
		renderedDimensions = shuffleArray(Object.entries(EVALUATION_DIMENSIONS));
		// Mezclamos el orden de las categorías de Tags
		renderedTagGroups = shuffleArray(Object.entries(groupedTags));

		isModalOpen = true;
	}

	function closeEvaluationModal() {
		if (isSubmitting) return;
		isModalOpen = false;
		setTimeout(() => {
			selectedProfessor = null;
		}, 200);
	}

	function toggleTag(tagId: string) {
		const id = tagId as TagId;
		if (formValues.tags.includes(id)) {
			formValues.tags = formValues.tags.filter((t) => t !== id);
		} else {
			if (formValues.tags.length < 5) {
				formValues.tags = [...formValues.tags, id];
			}
		}
	}

	// --- LÓGICA DE ENVÍO ---
	async function handleSubmit() {
		if (!selectedProfessor) return;

		const confirmed = await Dialog.confirm({
			title: 'Consentimiento de Responsabilidad',
			body: 'Al enviar esta evaluación, usted declara que el contenido es honesto y constructivo. Este es un espacio gestionado por y para estudiantes; el uso de lenguaje ofensivo o información falsa compromete la integridad del sistema y causará que su registro sea ignorado, dificultando la construcción de una herramienta útil para la comunidad. Cualquier abuso será detectado y se tomarán las medidas pertinentes. ¿Desea proceder con el envío?',
			confirmText: 'Confirmar y Enviar',
			cancelText: 'Cancelar',
			variant: 'primary'
		});

		if (!confirmed) return;

		isSubmitting = true;
		submissionError = null;

		// Construcción dinámica del payload
		// Se usa 'any' en metrics para acomodar la estructura variable definida en types.ts
		const payload: ReviewPayload = {
			professorId: selectedProfessor.name,
			metrics: formValues.metrics as any,
			tags: formValues.tags,
			comment: formValues.comment.trim()
		};

		try {
			const success = await submitReview(payload);
			if (success) {
				isModalOpen = false;
				setTimeout(() => {
					selectedProfessor = null;
					alert('Su evaluación ha sido registrada exitosamente.');
				}, 200);
			} else {
				throw new Error('El servidor no pudo procesar la solicitud.');
			}
		} catch (error) {
			console.error('Error al enviar:', error);
			submissionError =
				'Ocurrió un error de conexión al intentar enviar los datos. Por favor, intente nuevamente.';
		} finally {
			isSubmitting = false;
		}
	}

	// --- AGRUPACIÓN DE TAGS ---
	const groupedTags = Object.values(USM_TAGS).reduce(
		(acc, tag) => {
			if (!acc[tag.category]) acc[tag.category] = [];
			acc[tag.category].push(tag);
			return acc;
		},
		{} as Record<TagCategory, TagDefinition[]>
	);

	function getSentimentVariant(sentiment: string): 'success' | 'warning' | 'danger' | 'default' {
		switch (sentiment) {
			case 'POSITIVE':
				return 'success';
			case 'ALERT':
				return 'warning';
			case 'NEGATIVE':
				return 'danger';
			default:
				return 'default';
		}
	}
</script>

<div class="flex h-full w-full flex-col">
	<header class="bg-card z-20 border-b p-5 px-8 shadow-sm">
		<div class="flex flex-row items-center justify-between gap-6">
			<div class="w-full flex-1 space-y-1 self-start md:w-auto md:self-auto">
				<div class="flex items-center gap-2">
					<a
						href="{base}/"
						class="text-muted-foreground hover:text-primary hover:bg-primary/10 -ml-2 flex items-center justify-center rounded-full p-1.5 transition-colors"
						aria-label="Volver al inicio"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="size-6"
						>
							<path d="m15 18-6-6 6-6" />
						</svg>
					</a>
					<h1 class="text-primary text-3xl font-black tracking-tight uppercase">
						Repositorio Docente
					</h1>
				</div>
				<p class="text-muted-foreground pl-1 text-xs font-medium">
					Explora, filtra y encuentra profesores históricos.
				</p>
			</div>

			<div class="flex w-full max-w-1/2 flex-1 flex-row items-end gap-4">
				<div class="flex flex-1 flex-col gap-1">
					<p class="text-muted-foreground text-xs font-bold uppercase">Búsqueda</p>
					<div class="relative">
						<Search
							class="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
						/>
						<input
							bind:value={query}
							type="text"
							placeholder="Buscar nombre o ramo..."
							class="border-input placeholder:text-muted-foreground focus-visible:ring-ring h-10 w-full rounded-md border bg-transparent pr-4 pl-9 text-sm focus-visible:ring-1 focus-visible:outline-none"
						/>
					</div>
				</div>

				<div class="flex w-full flex-1 flex-row gap-2">
					<div class="flex flex-1 flex-col gap-1">
						<p class="text-muted-foreground text-xs font-bold uppercase">Sede</p>
						<SelectUI
							items={sedeOptions}
							bind:value={selectedSede}
							placeholder="Todas"
							class="w-full"
						/>
					</div>

					<div class="flex flex-1 flex-col gap-1">
						<p class="text-muted-foreground text-xs font-bold uppercase">Departamento</p>
						<SelectUI
							items={deptoOptions}
							bind:value={selectedDepto}
							placeholder="Todos"
							class="w-full"
						/>
					</div>
				</div>
			</div>
		</div>
	</header>

	<div class="mx-auto w-full max-w-4xl space-y-4 p-6 pb-2">
		<div class="text-muted-foreground flex items-center justify-between px-1 text-xs">
			<span>Mostrando {results.length} profesores</span>
			{#if query}
				<span>Resultados para "{query}"</span>
			{/if}
		</div>
	</div>

	<div class="flex-1 overflow-y-auto p-6 pt-2">
		<div class="mx-auto grid max-w-4xl grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
			{#each results as prof (prof.name)}
				<div
					class="bg-card group relative flex flex-col space-y-4 rounded-lg border p-4 text-left shadow-sm/50 transition-all"
				>
					<ProfessorCard professor={prof} />

					<Button size="sm" class="mt-auto w-full" onclick={() => openEvaluationModal(prof)}>
						Evaluar Desempeño Docente
					</Button>
				</div>
			{/each}

			{#if results.length === 0}
				<div
					class="text-muted-foreground col-span-full flex flex-col items-center justify-center py-12 opacity-50"
				>
					<p>No se encontraron profesores con esos criterios.</p>
				</div>
			{/if}
		</div>
	</div>

	<DialogComponent bind:open={isModalOpen} class="gap-0 p-0">
		{#if selectedProfessor}
			<div class="bg-muted/30 border-b p-5 pb-4">
				<h2 class="text-lg leading-tight font-bold">Evaluación Docente</h2>
				<p class="text-muted-foreground text-sm">
					Está evaluando a <span class="text-foreground font-medium">{selectedProfessor.name}</span>
				</p>
				<p class="text-muted-foreground/80 mt-2 text-xs leading-relaxed">
					La secuencia de criterios y etiquetas se presenta de forma aleatoria para minimizar sesgos
					cognitivos de orden y fatiga de decisión, promoviendo una valoración más objetiva e
					independiente de la estructura del formulario.
				</p>
			</div>

			<div class="max-h-[70vh] flex-1 space-y-6 overflow-y-auto p-6">
				<div class="grid gap-6">
					{#each renderedDimensions as [dimKey, dimDef] (dimKey)}
						<div class="space-y-4">
							<div class="flex items-center gap-2">
								<h3 class="text-muted-foreground text-xs font-bold tracking-wider uppercase">
									{dimDef.label}
								</h3>
								<div class="bg-border/60 h-px flex-1"></div>
							</div>

							<div class="grid gap-5 pl-1">
								{#each Object.entries(dimDef.sub_dimensions) as [subKey, subDef]}
									{#if subDef.type === 'BARS'}
										<div class="space-y-2">
											<div class="flex justify-between">
												<Tooltip wrapperClass="-mb-2" content={subDef.description}>
													<label
														for="metrics-{subDef.id}"
														class="decoration-foreground/50 cursor-help text-sm font-medium underline decoration-dotted"
													>
														{subDef.label}
													</label>
												</Tooltip>
											</div>
											<Slider
												min={1}
												max={5}
												step={1}
												bind:value={formValues.metrics[subDef.id]}
												ticks={Object.values(subDef.levels).map((l: any, i: number) => ({
													value: i + 1,
													label: l.label,
													description: l.description
												}))}
											/>
											<div
												class="text-muted-foreground -mt-2 flex justify-between text-xs font-medium"
											>
												<span>{subDef.levels[1].label}</span>
												<span>{subDef.levels[5].label}</span>
											</div>
										</div>
									{:else if subDef.type === 'DISCRETE'}
										<div class="space-y-2">
											<Tooltip content={subDef.description}>
												<label
													for="metrics-{subDef.id}"
													class="decoration-foreground/50 cursor-help text-sm font-medium underline decoration-dotted"
												>
													{subDef.label}
												</label>
											</Tooltip>
											<SelectUI
												items={Object.entries(subDef.options).map(([key, option]) => ({
													value: key,
													//@ts-ignore
													label: `${option.label} - ${option.description}`
												}))}
												bind:value={formValues.metrics[subDef.id]}
											/>
										</div>
									{/if}
								{/each}
							</div>
						</div>
					{/each}
				</div>

				<div class="border-border/50 border-t pt-4">
					<div
						class="bg-background/95 sticky top-0 z-10 -mx-6 mb-4 flex items-center justify-between px-6 py-3 transition-all"
					>
						<div>
							<label class="text-sm font-medium">Etiquetas Descriptivas</label>
							<p class="text-muted-foreground text-xs">
								Seleccione los atributos que mejor describan al docente.
							</p>
						</div>

						{#key formValues.tags.length}
							<div
								class="bg-background border-border text-muted-foreground starting:text-foreground flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-sm font-bold tracking-wider uppercase shadow-sm transition-colors duration-400 {formValues
									.tags.length >= 5
									? 'bg-amber-700! text-amber-50!'
									: ''}"
							>
								<span>{formValues.tags.length}/5</span>
							</div>
						{/key}
					</div>

					<div class="space-y-4">
						{#each renderedTagGroups as [category, tags]}
							<div class="bg-card/50 rounded-md border p-3">
								<Tooltip content={TAG_CATEGORY_DESCRIPTIONS[category as TagCategory]}>
									<h4
										class="text-muted-foreground decoration-muted-foreground/50 mb-2 cursor-help text-xs font-bold tracking-wider uppercase underline decoration-dotted"
									>
										{category}
									</h4>
								</Tooltip>
								<div class="flex flex-wrap gap-2">
									{#each orderTags(tags) as tag (tag.id)}
										{@const isSelected = formValues.tags.includes(tag.id as any)}
										{@const isDisabled = !isSelected && formValues.tags.length >= 5}
										<Tooltip content={tag.description}>
											<Toggle
												size="sm"
												pressed={isSelected}
												variant={getSentimentVariant(tag.sentiment)}
												onclick={() => toggleTag(tag.id)}
												disabled={isDisabled}
											>
												{tag.label}
											</Toggle>
										</Tooltip>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="space-y-2">
					<label for="review-comment" class="text-sm font-medium">Comentarios Adicionales</label>
					<textarea
						id="review-comment"
						class="bg-background border-input ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
						placeholder="Describa su experiencia de manera objetiva..."
						bind:value={formValues.comment}
						maxlength="500"
					></textarea>
					<div class="text-muted-foreground text-right text-[10px]">
						{formValues.comment.length}/500
					</div>
				</div>

				{#if submissionError}
					<div class="bg-destructive/10 text-destructive rounded-md p-3 text-xs font-medium">
						{submissionError}
					</div>
				{/if}
			</div>

			<div class="bg-muted/30 flex justify-end gap-2 border-t p-4">
				<Button variant="outlined" onclick={closeEvaluationModal} disabled={isSubmitting}>
					Cancelar
				</Button>
				<Button onclick={handleSubmit} disabled={isSubmitting}>
					{#if isSubmitting}
						Enviando...
					{:else}
						Enviar Evaluación
					{/if}
				</Button>
			</div>
		{/if}
	</DialogComponent>
</div>
