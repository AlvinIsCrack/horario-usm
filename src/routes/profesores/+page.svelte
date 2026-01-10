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
	import Loader from '$lib/icons/loader.svelte';

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
	import { checkTextQuality } from '$lib/logic/reviews/quality';

	let query = $state('');
	let selectedSede = $state('ALL');
	let selectedDepto = $state('ALL');

	// --- VIRTUALIZACIÓN / SCROLL INFINITO ---
	let renderLimit = $state(20);
	const BATCH_SIZE = 20;
	let scrollContainer: HTMLElement; // Referencia al contenedor para resetear scroll

	// --- ESTADO DEL MODAL DE EVALUACIÓN ---
	let isModalOpen = $state(false);
	let selectedProfessor = $state<any>(null);
	let isSubmitting = $state(false);
	let submissionError = $state<string | null>(null);

	// --- ACCIÓN DE INTERSECCIÓN (Para cargar más al hacer scroll) ---
	function viewport(element: HTMLElement) {
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting) {
					renderLimit += BATCH_SIZE;
				}
			},
			{ rootMargin: '200px' }
		); // Carga antes de llegar al final

		observer.observe(element);
		return {
			destroy() {
				observer.disconnect();
			}
		};
	}

	// --- LÓGICA DE ALEATORIEDAD ---
	function shuffleArray<T>(array: T[]): T[] {
		const newArray = [...array];
		for (let i = newArray.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[newArray[i], newArray[j]] = [newArray[j], newArray[i]];
		}
		return newArray;
	}

	let renderedDimensions = $state(Object.entries(EVALUATION_DIMENSIONS));
	let renderedTagGroups = $state<[string, TagDefinition[]][]>([]);

	function getInitialMetrics() {
		const defaults: Record<string, any> = {};
		for (const dim of Object.values(EVALUATION_DIMENSIONS)) {
			for (const sub of Object.values(dim.sub_dimensions)) {
				if (sub.type === 'BARS') {
					defaults[sub.id] = 3;
				} else if (sub.type === 'DISCRETE') {
					defaults[sub.id] = Object.keys(sub.options)[0] || '';
				}
			}
		}
		return defaults;
	}

	let formValues = $state({
		metrics: getInitialMetrics(),
		tags: [] as TagId[],
		comment: ''
	});

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

	// 1. RESULTADOS COMPLETOS (Filtrados)
	const allResults = $derived(
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

	// 2. RESULTADOS VISIBLES (Virtualizados)
	const visibleResults = $derived(allResults.slice(0, renderLimit));

	// 3. RESETEO INTELIGENTE
	// Cuando cambian los filtros, reseteamos el límite y el scroll
	$effect(() => {
		// Dependencias que disparan el reset
		query;
		selectedSede;
		selectedDepto;

		// Reset
		renderLimit = BATCH_SIZE;
		if (scrollContainer) scrollContainer.scrollTop = 0;
	});

	// ... [Funciones del Modal: openEvaluationModal, closeEvaluationModal, toggleTag, handleSubmit...]
	// (MANTENLAS IGUAL, NO CAMBIAN)
	function openEvaluationModal(prof: any) {
		selectedProfessor = prof;
		formValues = { metrics: getInitialMetrics(), tags: [], comment: '' };
		submissionError = null;
		renderedDimensions = shuffleArray(Object.entries(EVALUATION_DIMENSIONS));
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
			if (formValues.tags.length < 5) formValues.tags = [...formValues.tags, id];
		}
	}

	async function handleSubmit() {
		if (!selectedProfessor) return;
		const confirmed = await Dialog.confirm({
			title: 'Consentimiento de Responsabilidad',
			body: 'Al enviar esta evaluación, usted declara que el contenido es honesto y constructivo...',
			confirmText: 'Confirmar y Enviar',
			cancelText: 'Cancelar',
			variant: 'primary'
		});

		if (!confirmed) return;

		isSubmitting = true;
		submissionError = null;

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
			submissionError = 'Ocurrió un error de conexión...';
		} finally {
			isSubmitting = false;
		}
	}

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

	const promptContexts = [
		{ label: 'Justificación de la Calificación', placeholder: 'Profundice en los criterios...' }
		// ... (resto de contextos)
	];

	const activePrompt = promptContexts[Math.floor(Math.random() * promptContexts.length)];

	let quality = $derived(checkTextQuality(formValues.comment));
	let isLowQuality = $derived(quality.isLowQuality);

	let footerStatus = $derived(
		formValues.comment.trim().length === 0
			? {
					message: 'Al incluir un comentario, duplicas la utilidad...',
					messageStyle: 'text-amber-600 font-bold animate-pulse',
					btnClass: 'bg-amber-600! text-white',
					btnText: 'Omitir aporte'
				}
			: isLowQuality
				? {
						message: 'Parece que tu comentario no aporta mucha claridad...',
						messageStyle: 'text-rose-500 font-bold animate-pulse',
						btnClass: 'bg-rose-400! text-white',
						btnText: 'Publicar aporte débil'
					}
				: {
						message: '¡Excelente! Tu reseña ayudará...',
						messageStyle: 'text-sky-500 font-medium',
						btnClass: 'text-white',
						btnText: 'Confirmar aporte valioso'
					}
	);
</script>

<div class="flex h-full w-full flex-col">
	<header class="bg-card z-20 border-b p-5 px-8 shadow-sm">
		<div class="flex flex-row items-center justify-between gap-6">
			<div class="w-full flex-1 space-y-1 self-start md:w-auto md:self-auto">
				<div class="flex items-center gap-2">
					<a
						href="{base}/"
						class="text-muted-foreground hover:text-primary hover:bg-primary/10 -ml-2 flex items-center justify-center rounded-full p-1.5 transition-colors"
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
			<span>Mostrando {allResults.length} profesores</span>
			{#if query}<span>Resultados para "{query}"</span>{/if}
		</div>
	</div>

	<div class="flex-1 overflow-y-auto p-6 pt-2" bind:this={scrollContainer}>
		<div class="mx-auto grid max-w-4xl grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
			{#each visibleResults as prof (prof.name)}
				<div
					class="bg-card group relative flex flex-col space-y-4 rounded-lg border p-4 text-left shadow-sm/50 transition-all"
				>
					<ProfessorCard professor={prof} />
					<Button size="sm" class="mt-auto w-full" onclick={() => openEvaluationModal(prof)}>
						Evaluar Desempeño Docente
					</Button>
				</div>
			{/each}

			{#if allResults.length === 0}
				<div
					class="text-muted-foreground col-span-full flex flex-col items-center justify-center py-12 opacity-50"
				>
					<p>No se encontraron profesores con esos criterios.</p>
				</div>
			{/if}

			{#if visibleResults.length < allResults.length}
				<div use:viewport class="col-span-full flex justify-center py-8 opacity-50">
					<Loader class="size-6 animate-spin" />
				</div>
			{/if}
		</div>
	</div>

	<DialogComponent bind:open={isModalOpen} class="min-w-2xl! gap-0 p-0">
		{#if selectedProfessor}
			<div class="bg-muted/30 border-b p-5 pb-4">
				<h2 class="text-lg leading-tight font-bold">Evaluación Docente</h2>
			</div>
		{/if}
	</DialogComponent>
</div>
