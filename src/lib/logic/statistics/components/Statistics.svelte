<script lang="ts">
	import Loader from '$lib/icons/loader.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import { fade } from 'svelte/transition';
	import { untrack } from 'svelte';
	import Card from '../../../components/ui/Card.svelte';
	import Tooltip from '../../../components/ui/Tooltip.svelte';
	import { cubicOut } from 'svelte/easing';

	// Importamos SOLO la fachada y los tipos necesarios
	import { generateScheduleStatistics } from '$lib/logic/statistics/index';
	import type { StatItem, AnalyzerContext } from '$lib/logic/statistics/types';
	import { Config } from '$lib/logic/config/store.svelte';
	import { SidebarState } from '$lib/logic/sidebar/state.svelte';

	let statistics: StatItem[] = $state([]);
	// let updated = $state(false);

	$effect(() => {
		// Dependencias reactivas
		const _ = [Calendario.ramos, SidebarState.activeWindow, Config.tiempoTraslado];
		if (SidebarState.activeWindow) return;

		untrack(() => {
			const tiempoNoInformado = Config.tiempoTraslado === -1;
			const TIEMPO_TRASLADO_MINS = tiempoNoInformado ? 60 : Config.tiempoTraslado;

			// 1. Construcción del Contexto (Única responsabilidad del componente)
			const context: AnalyzerContext = {
				ramos: Calendario.ramos,
				sede: Config.sede,
				jornada: Config.jornada,
				semestre: Config.semestre,
				tiempoTraslado: TIEMPO_TRASLADO_MINS,
				esTiempoEstimado: tiempoNoInformado,
				ventanas: Calendario.ventanas
			};

			// 2. Llamada a la Fachada (Single Source of Truth)
			generateScheduleStatistics(context).then((res) => {
				statistics = res;
				// Lógica visual de actualización
				// setTimeout(() => {
				// 	updated = true;
				// 	setTimeout(() => (updated = false), 2500);
				// }, 100);
			});
		});
	});

	function levitate(node: Element, { duration = 400, y = -20, delay = 0 }) {
		return {
			delay,
			duration,
			css: (t: number, u: number) =>
				`z-index: 100; transform: translateY(${cubicOut(u) * y}px); opacity: ${t};`
		};
	}

	/**
	 * Acción para detectar desbordamiento y animar "ida y vuelta".
	 * Calcula dinámicamente cuánto debe moverse el texto.
	 */
	function marquee(node: HTMLElement, content: string) {
		const update = () => {
			// Reseteamos estilos para medir correctamente
			node.style.removeProperty('--marquee-distance');
			node.classList.remove('animate-shuttle');

			const parent = node.parentElement;
			if (parent && node.scrollWidth > parent.clientWidth) {
				const overflow = node.scrollWidth - parent.clientWidth;
				// Agregamos un pequeño padding al desplazamiento para que no quede pegado al borde
				node.style.setProperty('--marquee-distance', `-${overflow}px`);
				node.classList.add('animate-shuttle');
				// Agregamos máscara al padre para efecto visual
				parent.classList.add('mask-gradient');
			} else {
				parent?.classList.remove('mask-gradient');
			}
		};

		// Ejecutar al montar y cuando cambie el contenido
		update();

		// Observer por si el contenedor cambia de tamaño (sidebar resize)
		const observer = new ResizeObserver(update);
		if (node.parentElement) observer.observe(node.parentElement);

		return {
			update,
			destroy() {
				observer.disconnect();
			}
		};
	}
</script>

<div class="flex min-h-1/2 w-full flex-col gap-1.5 2xl:gap-2">
	<Tooltip
		wrapperClass="group"
		content="Estas métricas son una guía orientativa, diseñadas a partir de patrones comunes en la vida universitaria chilena, tiempos de traslado y heurísticas de gestión del tiempo. No constituyen un diagnóstico profesional; úsalas como una herramienta de apoyo para visualizar mejor tu carga académica."
	>
		<h1 class="flex items-center gap-2 text-sm font-normal">
			<span
				class="decoration-foreground/50 underline decoration-dotted underline-offset-2 group-hover:decoration-solid"
				>Estadísticas</span
			>
			<span class="opacity-50">(Referencial)</span>
		</h1>
	</Tooltip>
	<div class="flex h-full min-h-0 w-full flex-col gap-1">
		{#await statistics}
			<div class="flex h-full w-full items-center justify-center">
				<div in:fade class="absolute">
					<Loader class="loader-usm scale-200" />
				</div>
			</div>
		{:then statistics}
			<div
				class="flex w-full flex-1 flex-col gap-1 overflow-y-auto pr-1 text-justify text-sm transition-colors duration-1000 2xl:gap-1.5"
			>
				{#each statistics as stat, i ((stat.label, i))}
					{@const statusColors = {
						success:
							'bg-gradient-to-r to-green-500/20 from-green-500/40 text-green-50 border-green-500/80',
						warning:
							'bg-gradient-to-r to-amber-500/20 from-amber-500/40 text-amber-50 border-amber-500/80',
						danger: 'bg-gradient-to-r to-red-500/20 from-red-500/40 text-red-50 border-red-500/80'
					}}

					<div>
						{#snippet tooltipContent()}
							{@html stat.tooltip}
						{/snippet}

						<Tooltip
							content={tooltipContent}
							class="text-left"
							wrapperClass="w-full cursor-help"
							position="right"
						>
							<Card
								class="group isolate flex w-full flex-row items-center gap-1.5 px-2.5! py-1! 2xl:gap-2 2xl:px-3! 2xl:py-1.5! {stat.status
									? statusColors[stat.status]
									: ''} shadow-sm/50!"
							>
								<div class="size-4 shrink-0 opacity-70">
									<stat.icon class="h-full w-full scale-125" />
								</div>

								<div
									title={stat.label}
									class="block min-w-0 shrink truncate overflow-hidden mix-blend-lighten select-none"
								>
									<span
										class="decoration-foreground/50 truncate underline decoration-dotted underline-offset-2 opacity-90 group-hover:decoration-solid"
									>
										{stat.label}
									</span>
								</div>

								<div
									title={stat.value}
									class="ml-auto flex max-w-[55%] items-center justify-end overflow-hidden"
								>
									{#key stat.value}
										<div
											class="relative w-full overflow-hidden text-right whitespace-nowrap"
											out:levitate={{ duration: 3000, y: -30, delay: 50 }}
										>
											<span
												use:marquee={stat.value}
												class="inline-block font-medium opacity-90 will-change-transform"
											>
												{stat.value}
											</span>
										</div>
									{/key}
								</div>
							</Card>
						</Tooltip>
					</div>
				{/each}
			</div>
		{/await}
	</div>
</div>

<style>
	/* Animación Ping-Pong: Ida -> Pausa -> Vuelta -> Pausa */
	:global(.animate-shuttle) {
		animation: shuttle 8s ease-in-out infinite;
	}

	/* Máscara para suavizar los bordes cuando hay scroll */
	:global(.mask-gradient) {
		mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
		-webkit-mask-image: linear-gradient(
			to right,
			transparent 0%,
			black 5%,
			black 95%,
			transparent 100%
		);
	}

	@keyframes shuttle {
		0%,
		15% {
			transform: translateX(0);
		}
		50%,
		65% {
			transform: translateX(var(--marquee-distance));
		}
		100% {
			transform: translateX(0);
		}
	}
</style>
