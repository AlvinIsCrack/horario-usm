<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import { tv } from 'tailwind-variants';

	// Data & Logic
	import planesRaw from '$lib/data/planes_carreras.json';

	// Components
	import Card from '$lib/components/ui/Card.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Separator from '$lib/components/ui/Separator.svelte';
	import PlanSearch from '$lib/components/elements/PlanSearch.svelte';

	// --- Tipos y Helpers ---

	type Requisito = string[]; // Lista de siglas (OR)
	type Asignatura = {
		sigla: string;
		nombre: string;
		creditos: number;
		requisitos: Requisito[]; // Lista de listas (AND de ORs)
		esElectivo: boolean;
		esHumanista: boolean;
	};
	type Semestre = Asignatura[];
	type Malla = Semestre[];

	// --- Controlador de Lógica (Runes) ---

	class MallaState {
		// Estado base
		selectedPlanId = $state<string>('');
		approvedSigs = $state<Set<string>>(new Set());
		customNames = $state<Record<string, string>>({}); // Para electivos renombrados
		hoverSig = $state<string | null>(null);
		// --- Dentro de class MallaState ---
		selectedPlanLabel = $derived(
			careerOptions.find((opt) => opt.value === this.selectedPlanId)?.label || ''
		);

		// Datos derivados
		currentMalla = $derived(this.getMalla(this.selectedPlanId));

		// Cache de dependencias para performance en hover
		dependenciasMap = $derived(this.buildDependenciesMap(this.currentMalla));

		constructor() {
			// Recuperar estado guardado
			onMount(() => {
				const saved = localStorage.getItem('malla_progress');
				if (saved) {
					try {
						const data = JSON.parse(saved);
						this.selectedPlanId = data.planId || '';
						this.approvedSigs = new Set(data.approved || []);
						this.customNames = data.customNames || {};
					} catch (e) {
						console.error('Error loading state', e);
					}
				}
			});
		}

		save() {
			localStorage.setItem(
				'malla_progress',
				JSON.stringify({
					planId: this.selectedPlanId,
					approved: Array.from(this.approvedSigs),
					customNames: this.customNames
				})
			);
		}

		toggleAsignatura(sigla: string) {
			if (this.approvedSigs.has(sigla)) {
				this.approvedSigs.delete(sigla);
			} else {
				// Si está bloqueado, no hacer nada (opcional, aquí permitimos forzar aprobación)
				this.approvedSigs.add(sigla);
			}
			// Reasignar para reactividad profunda si fuera necesario en Svelte 4,
			// pero en Svelte 5 el Set dentro de $state es reactivo si se usa correctamente o se reasigna.
			this.approvedSigs = new Set(this.approvedSigs);
			this.save();
		}

		setCustomName(sigla: string, name: string) {
			this.customNames[sigla] = name;
			this.save();
		}

		// Lógica de grafo
		getStatus(asig: Asignatura) {
			if (this.approvedSigs.has(asig.sigla)) return 'aprobado';

			// Verificar requisitos
			// La estructura es: [[REQ1_A, REQ1_B], [REQ2]] -> (REQ1_A O REQ1_B) Y (REQ2)
			const cumpleRequisitos = asig.requisitos.every((grupoOr) => {
				if (grupoOr.length === 0 || (grupoOr.length === 1 && grupoOr[0] === '')) return true; // Sin requisitos
				return grupoOr.some((req) => this.approvedSigs.has(req));
			});

			return cumpleRequisitos ? 'disponible' : 'bloqueado';
		}

		// Utiles para Parsing
		getMalla(planId: string): Malla {
			if (!planId) return [];
			// Busqueda ineficiente pero simple dada la estructura del JSON
			for (const carrera of planesRaw) {
				for (const sedeKey in carrera['menciones/especialidades'] || {}) {
					// @ts-ignore
					const planes = carrera['menciones/especialidades'][sedeKey]?.planes;
					if (planes && planes[planId]) {
						const rawMalla = planes[planId].malla;
						return this.parseMalla(rawMalla);
					}
				}
			}
			return [];
		}

		private parseMalla(rawMalla: any[]): Malla {
			return rawMalla.map((semestre: any) => {
				return Object.entries(semestre).map(([sigla, datos]: [string, any]) => ({
					sigla,
					nombre: datos.nombre,
					creditos: parseInt(datos.creditos) || 0,
					requisitos: datos.requisitos || [],
					esElectivo: datos.nombre.includes('ELECTIVO') || datos.nombre.includes('OPTATIVO'),
					esHumanista:
						datos.nombre.includes('HUMANIST') ||
						datos.nombre.includes('ANTROPOL') ||
						datos.nombre.includes('ETICA')
				}));
			});
		}

		// Mapa inverso: Sigla -> Quienes la requieren (Hijos)
		private buildDependenciesMap(malla: Malla) {
			const map = new Map<string, string[]>(); // Padre -> Hijos
			const parents = new Map<string, string[]>(); // Hijo -> Padres

			malla.flat().forEach((asig) => {
				// Registrar Padres
				const misRequisitos = asig.requisitos.flat().filter((r) => r && r !== '');
				parents.set(asig.sigla, misRequisitos);

				// Registrar Hijos
				misRequisitos.forEach((req) => {
					if (!map.has(req)) map.set(req, []);
					map.get(req)?.push(asig.sigla);
				});
			});
			return { children: map, parents };
		}

		getRelation(targetSigla: string): 'none' | 'parent' | 'child' | 'self' {
			if (!this.hoverSig) return 'none';
			if (this.hoverSig === targetSigla) return 'self';

			// Es un prerrequisito del hover (Padre)?
			if (this.dependenciasMap.parents.get(this.hoverSig)?.includes(targetSigla)) return 'parent';

			// Es desbloqueado por el hover (Hijo)?
			if (this.dependenciasMap.children.get(this.hoverSig)?.includes(targetSigla)) return 'child';

			return 'none';
		}
	}

	const mallaState = new MallaState();

	// --- Preparación de Datos para el Select ---
	let careerOptions = $state<{ label: string; value: string }[]>([]);
	// --- Mapeo de nombres personalizados (Hardcoded) ---
	const PLAN_CUSTOM_NAMES: Record<string, string> = {
		'7310': 'Ing. Civil Informática (Antigua)',
		'7313': 'Ing. Civil Informática (Nueva)'
	};

	onMount(() => {
		const opts: { label: string; value: string }[] = [];
		const seenIds = new Set<string>();

		// @ts-ignore
		planesRaw.forEach((carrera) => {
			// @ts-ignore
			Object.values(carrera['menciones/especialidades']).forEach((mencion: any) => {
				if (mencion.planes) {
					Object.entries(mencion.planes).forEach(([id, plan]: [string, any]) => {
						// --- MODIFICACIÓN: Ignorar planes sin malla ---
						if (!plan.malla || plan.malla.length === 0) return;

						if (seenIds.has(id)) return;
						seenIds.add(id);

						const planCode = plan.plan?.toString();
						const customLabel = PLAN_CUSTOM_NAMES[planCode];

						opts.push({
							label:
								customLabel ||
								`${carrera.nombre}${mencion.nombre === 'Sin mención' ? '' : ' - ' + mencion.nombre} (Plan ${plan.plan})`,
							value: id
						});
					});
				}
			});
		});
		careerOptions = opts.sort((a, b) => a.label.localeCompare(b.label));
	});

	// --- Manejadores ---
	function handleCardClick(asig: Asignatura) {
		if (asig.esElectivo || asig.esHumanista) {
			// Lógica especial para electivos: Asignar nombre
			if (!mallaState.approvedSigs.has(asig.sigla)) {
				// Si no está aprobado, al aprobar pedimos nombre (opcional)
				// Simulación de "Popover" con prompt por ahora para no sobrecargar el código
				// Idealmente esto sería un modal con buscador de `horario_asignaturas.json`
				const realName = prompt(
					`Ingresa el nombre del ramo cursado para ${asig.nombre}:`,
					asig.nombre
				);
				if (realName) mallaState.setCustomName(asig.sigla, realName);
			}
		}
		mallaState.toggleAsignatura(asig.sigla);
	}
</script>

<div class="bg-background text-foreground flex h-full w-full flex-col overflow-hidden">
	<div class="bg-card z-20 flex flex-col shadow-sm">
		<div class="flex flex-col items-end justify-between gap-6 p-6 md:flex-row">
			<div class="flex w-full flex-col md:w-1/2">
				<h1 class="text-primary text-4xl leading-none font-black tracking-wide uppercase">
					Malla {mallaState.selectedPlanLabel || 'Interactiva'}
				</h1>
				<p class="text-muted-foreground text-sm font-medium">
					Planifica tu trayectoria académica visualmente.
				</p>
			</div>

			<div class="w-full md:w-1/3">
				<PlanSearch
					items={careerOptions}
					bind:value={mallaState.selectedPlanId}
					placeholder="Buscar Carrera o Plan (ej: 7310)..."
					class="w-full"
				/>
			</div>
		</div>
		<Separator />
	</div>

	<div class="flex-1 overflow-x-auto overflow-y-auto bg-[#0a0a0c] p-10">
		{#if mallaState.currentMalla.length > 0}
			<div class="flex min-w-max gap-8 pb-12">
				{#each mallaState.currentMalla as semestre, i}
					<div></div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	::-webkit-scrollbar {
		height: 6px;
		width: 6px;
	}

	::-webkit-scrollbar-track {
		background: #0a0a0c;
	}

	::-webkit-scrollbar-thumb {
		background: #1e293b;
		border-radius: 10px;
	}

	::-webkit-scrollbar-thumb:hover {
		background: #334155;
	}
</style>
