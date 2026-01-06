<script lang="ts">
	import { onMount } from 'svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import planesRaw from '$lib/data/planes_carreras.json';
	import { tv } from 'tailwind-variants';

	// Componentes UI del sistema
	import Badge from '$lib/components/ui/Badge.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import PlanSearch from '$lib/components/elements/PlanSearch.svelte';

	// --- Definición de Estilos con tailwind-variants ---

	const {
		base: card,
		credits: cardCredits,
		title: cardTitle,
		sigla: cardSigla
	} = tv({
		base: 'relative flex hover:cursor-pointer min-h-24! hover:ring-2 hover:scale-110 ring-ring shadow-sm flex-col w-40 p-4 transition-all duration-200 select-none border-2 text-left h-full',
		slots: {
			title: 'my-1 z-10 line-clamp-2 text-wrap h-full truncate text-sm leading-4 font-bold',
			credits: 'text-muted-foreground text-[9px] font-black',
			sigla: 'text-primary/80 mb-auto text-xs font-bold tracking-wider font-mono uppercase'
		},
		variants: {
			status: {
				disponible: 'bg-card border-border hover:border-primary/50',
				aprobado: 'bg-lime-600 text-background border-primary',
				bloqueado: 'bg-muted/50 border-transparent! opacity-60 grayscale-[0.6]'
			},
			relation: {
				none: '',
				self: 'ring-2 ring-primary ring-offset-2 ring-offset-background z-10 scale-105',
				parent:
					'border-yellow-500 bg-yellow-500/10 shadow-[0_0_10px_rgba(234,179,8,0.3)] scale-105 z-10',
				child:
					'border-green-500 bg-green-500/10 shadow-[0_0_10px_rgba(34,197,94,0.3)] scale-105 z-10'
			}
		},
		defaultVariants: {
			status: 'disponible',
			relation: 'none'
		},
		compoundVariants: [
			{
				status: 'aprobado',
				class: {
					sigla: 'text-background/60',
					credits: 'text-background/40'
				}
			},
			{
				status: 'bloqueado',
				class: {
					sigla: 'text-background/80'
				}
			}
		]
	})();

	// --- Tipos Portados de MallaInteractiva.tsx ---
	type Requisito = string[];

	interface RamoMalla {
		sigla: string;
		nombre: string;
		creditos: number;
		requisitos: Requisito[]; // Formato: [[REQ1_A, REQ1_B], [REQ2]] -> (A o B) y (C)
		esElectivo: boolean;
		esHumanista: boolean;
		// Estados derivados para UI
		locked?: boolean;
		checked?: boolean;
		isDependency?: boolean; // Destacado porque el hover actual lo desbloquea
		isPreRequisite?: boolean; // Destacado porque desbloquea al hover actual
	}

	type Semestre = RamoMalla[];
	type Malla = Semestre[];

	// --- Estado de la Malla (MallaState) ---
	class MallaState {
		selectedPlanId = $state<string>('');
		approvedSigs = $state<Set<string>>(new Set());
		customNames = $state<Record<string, string>>({});
		hoverSig = $state<string | null>(null);

		// Datos crudos de la malla seleccionada
		rawMalla = $derived(this.fetchMallaData(this.selectedPlanId));

		// Lógica portada de updateSemestres de React: Calcula bloqueos y dependencias
		currentMalla = $derived.by(() => {
			if (!this.rawMalla.length) return [];

			return this.rawMalla.map((semestre) => {
				return semestre.map((ramo) => {
					const isChecked = this.approvedSigs.has(ramo.sigla);

					// Lógica de Bloqueo: Un ramo está bloqueado si tiene requisitos y
					// al menos uno de los grupos de requisitos (AND) no tiene ninguna sigla aprobada (OR)
					let isLocked = false;
					if (!isChecked && ramo.requisitos.length > 0) {
						isLocked = !ramo.requisitos.every((grupoOr) => {
							if (grupoOr.length === 0 || (grupoOr.length === 1 && grupoOr[0] === '')) return true;
							return grupoOr.some((reqSigla) => this.approvedSigs.has(reqSigla));
						});
					}

					// Lógica de Relaciones (Hover)
					let isDep = false;
					let isPre = false;
					if (this.hoverSig) {
						// ¿Este ramo desbloquea al que tengo en hover? (Es Prerrequisito)
						const hoverRamo = this.findRamo(this.hoverSig);
						if (hoverRamo?.requisitos.flat().includes(ramo.sigla)) isPre = true;

						// ¿Este ramo es desbloqueado por el que tengo en hover? (Es Dependencia)
						if (ramo.requisitos.flat().includes(this.hoverSig)) isDep = true;
					}

					return {
						...ramo,
						checked: isChecked,
						locked: isLocked,
						isDependency: isDep,
						isPreRequisite: isPre
					};
				});
			});
		});

		// Estadísticas portadas de PercentCompletado
		stats = $derived.by(() => {
			const todos = this.currentMalla.flat();
			if (todos.length === 0) return { percent: 0, total: 0, approved: 0, creditos: 0 };
			const aprobados = todos.filter((r) => r.checked);
			const creditosAprobados = aprobados.reduce((acc, r) => acc + r.creditos, 0);
			return {
				percent: Math.round((aprobados.length / todos.length) * 100),
				total: todos.length,
				approved: aprobados.length,
				creditos: creditosAprobados
			};
		});

		constructor() {
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

		private fetchMallaData(planId: string): Malla {
			if (!planId) return [];
			for (const carrera of planesRaw) {
				for (const sedeKey in carrera['menciones/especialidades'] || {}) {
					// @ts-ignore
					const planes = carrera['menciones/especialidades'][sedeKey]?.planes;
					if (planes && planes[planId]) {
						return (planes[planId].malla || []).map((sem: any) =>
							Object.entries(sem).map(([sigla, d]: [string, any]) => ({
								sigla,
								nombre: d.nombre,
								creditos: parseInt(d.creditos) || 0,
								requisitos: d.requisitos || [],
								esElectivo: d.nombre.includes('ELECTIVO') || d.nombre.includes('OPTATIVO'),
								esHumanista: /HUMANIST|ANTROPOL|ETICA/.test(d.nombre)
							}))
						);
					}
				}
			}
			return [];
		}

		private findRamo(sigla: string): RamoMalla | null {
			return this.rawMalla.flat().find((r) => r.sigla === sigla) || null;
		}

		toggleRamo(sigla: string) {
			if (this.approvedSigs.has(sigla)) {
				this.approvedSigs.delete(sigla);
			} else {
				this.approvedSigs.add(sigla);
			}
			this.approvedSigs = new Set(this.approvedSigs);
			this.save();
		}

		setCustomName(sigla: string, name: string) {
			this.customNames[sigla] = name;
			this.save();
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
	}

	const mallaState = new MallaState();

	// --- Opciones de Carrera filtradas por Sede (Calendario) ---
	let careerOptions = $state<{ label: string; value: string }[]>([]);

	// --- Mapeo de nombres personalizados ---
	const PLAN_CUSTOM_NAMES: Record<string, string> = {
		'7313': 'Ing. Civil Informática (Antigua)',
		'7310': 'Ing. Civil Informática (Nueva)'
	};

	$effect(() => {
		const sedeActual = Calendario.sede;
		const opts: { label: string; value: string }[] = [];
		const seenIds = new Set<string>();

		planesRaw.forEach((carrera) => {
			const menciones = carrera['menciones/especialidades'] || {};
			Object.keys(menciones).forEach((sedeKey) => {
				if (carrera.sede !== sedeActual) return;

				//@ts-ignore
				const mencion = menciones[sedeKey];
				if (mencion.planes) {
					Object.entries(mencion.planes).forEach(([id, plan]: [string, any]) => {
						if (!plan.malla || seenIds.has(id)) return;
						seenIds.add(id);

						// Lógica de reemplazo de nombre:
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

	function handleRamoClick(ramo: RamoMalla) {
		if (ramo.esElectivo || ramo.esHumanista) {
			if (!mallaState.approvedSigs.has(ramo.sigla)) {
				const name = prompt(`Nombre para el electivo ${ramo.sigla}:`, ramo.nombre);
				if (name) mallaState.setCustomName(ramo.sigla, name);
			}
		}
		mallaState.toggleRamo(ramo.sigla);
	}

	// Helper para romanizar portado de React
	function romanize(num: number) {
		const lookup: any = {
			M: 1000,
			CM: 900,
			D: 500,
			CD: 400,
			C: 100,
			XC: 90,
			L: 50,
			XL: 40,
			X: 10,
			IX: 9,
			V: 5,
			IV: 4,
			I: 1
		};
		let roman = '',
			i;
		for (i in lookup) {
			while (num >= lookup[i]) {
				roman += i;
				num -= lookup[i];
			}
		}
		return roman;
	}
</script>

<div class="flex h-screen w-full flex-col overflow-hidden">
	<header class="bg-card z-20 border-b p-6 shadow-sm">
		<div class="flex flex-col items-center justify-between gap-6 md:flex-row">
			<div class="space-y-1">
				<h1 class="text-primary text-3xl font-black tracking-tight uppercase">Malla Interactiva</h1>
				<div class="flex items-center gap-2">
					<Badge variant="outline">{Calendario.sede}</Badge>
					{#if mallaState.selectedPlanId}
						<span class="text-muted-foreground text-sm">
							{mallaState.stats.percent}% completado • {mallaState.stats.creditos} SCT
						</span>
					{/if}
				</div>
			</div>

			<div class="w-full max-w-md">
				<PlanSearch items={careerOptions} bind:value={mallaState.selectedPlanId} />
			</div>
		</div>
	</header>

	<main class="flex-1 overflow-auto p-3.5">
		{#if mallaState.currentMalla.length > 0}
			<div class="flex gap-2 pb-10">
				{#each mallaState.currentMalla as semestre, i}
					<div class="flex flex-col gap-2">
						<div class="flex items-center justify-between border-b border-white/50 px-1 pb-1">
							<span class="text-foreground text-lg font-bold">{romanize(i + 1)}</span>
							<span class="text-xs font-medium text-white/40 uppercase">
								{semestre.reduce((acc, r) => acc + r.creditos, 0)} SCT
							</span>
						</div>

						<div class="flex flex-col gap-2">
							{#each semestre as ramo}
								{@const status = ramo.checked
									? 'aprobado'
									: ramo.locked
										? 'bloqueado'
										: 'disponible'}
								<button
									onclick={() => mallaState.toggleRamo(ramo.sigla)}
									onmouseenter={() => (mallaState.hoverSig = ramo.sigla)}
									onmouseleave={() => (mallaState.hoverSig = null)}
									class={card({
										status
										// relation: ramo.relation
									})}
								>
									<Tooltip content={ramo.sigla}>
										<span
											class={cardSigla({
												status
												// relation: ramo.relation
											})}
										>
											{ramo.sigla}
										</span>
									</Tooltip>
									<span
										class={cardTitle({
											status
											// relation: ramo.relation
										})}
									>
										{mallaState.customNames[ramo.sigla] || ramo.nombre}
									</span>
									<div class="mt-1 flex items-center justify-between">
										<span
											class={cardCredits({
												status
												// relation: ramo.relation
											})}
										>
											{ramo.creditos} SCT
										</span>
									</div>
								</button>
							{/each}
						</div>
					</div>
					<!-- {#if i < mallaState.currentMalla.length - 1}
						<Separator orientation="vertical" class="opacity-10" />
					{/if} -->
				{/each}
			</div>
		{:else}
			<div class="flex h-full items-center justify-center text-center">
				<div class="max-w-sm space-y-4">
					<p class="text-muted-foreground text-lg">
						Selecciona una carrera para visualizar tu avance académico en {Calendario.sede}.
					</p>
				</div>
			</div>
		{/if}
	</main>
</div>
