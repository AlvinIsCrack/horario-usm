<script module lang="ts">
	const cardStyles = tv({
		base: [
			'relative flex flex-col rounded border text-left select-none overflow-hidden',
			'hover:cursor-pointer hover:ring-2 ring-0 ring-ring shadow-lg/40',
			'transition-[background-color,scale,border-color,color,box-shadow,filter] duration-400 ease-out',
			'before:content-[""] before:absolute before:size-full before:left-0 before:top-0',

			'w-36 lg:w-38 2xl:w-40',
			'p-2 @2xs:p-3 @xs:p-4',
			'h-26 @xs:h-28 @sm:h-30'
		],
		slots: {
			title: [
				'z-10 w-full font-semibold text-wrap text-xs line-clamp-3 truncate leading-tight',
				'2xl:text-sm'
			],
			credits: ['absolute bottom-0 font-medium right-1 p-2 text-[10px] lg:text-xs'],
			sigla: ['opacity-80 tracking-wider text-[10px] lg:text-xs'],
			header: 'block! -space-y-1'
		},
		variants: {
			status: {
				disponible: 'bg-primary border-transparent hover:border-primary/50!',
				aprobado: 'bg-lime-600 text-background border-lime-300',
				bloqueado: ' bg-muted border-border grayscale-25 saturate-120'
			},
			relation: {
				none: 'z-0 shadow-sm/20',
				self: 'z-50 will-change-transform border-white brightness-120 -hue-rotate-10',
				parent: 'ring-2 ring-amber-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] z-50',
				coreq: 'ring-2 ring-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] z-50',
				child: 'ring-2 ring-lime-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] z-50',
				unlock: 'ring-2 ring-white shadow-[0_0_20px_rgba(255,255,255,1)] z-50'
			},
			odd: {
				true: {
					base: 'before:bg-black/20'
				},
				false: {}
			}
		},
		defaultVariants: {
			status: 'disponible',
			relation: 'none',
			odd: false
		},
		compoundVariants: [
			{
				status: 'aprobado',
				class: {
					sigla: 'text-background/60'
				}
			},
			{
				status: 'bloqueado',
				class: {
					sigla: 'text-foreground/80'
				}
			}
		]
	});
</script>

<script lang="ts">
	import type { RamoMalla } from '$lib/core/malla/types';
	import type { MallaState } from '$lib/core/malla/malla.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { tv } from 'tailwind-variants';

	interface Props {
		ramo: RamoMalla;
		semesterIndex: number;
		mallaState: MallaState;
		onclick: (ramo: RamoMalla) => void;
	}

	const { ramo, semesterIndex, mallaState, onclick }: Props = $props();

	// Compute the current evaluation status of the course
	const status = $derived(ramo.checked ? 'aprobado' : ramo.locked ? 'bloqueado' : 'disponible');

	// Determine the visual prerequisite relationship relative to the active hover target
	const relation = $derived(
		ramo.isCoRequisite
			? 'coreq'
			: ramo.isPreRequisite
				? 'parent'
				: ramo.isUnlock
					? 'unlock'
					: ramo.isDependency
						? 'child'
						: mallaState.hoverSig === ramo.sigla
							? 'self'
							: 'none'
	);

	// Locate the structural data of the currently hovered course
	const hoverRamo = $derived(mallaState.hoverSig ? mallaState.findRamo(mallaState.hoverSig) : null);

	// Calculate sequential transition delays based on academic distance
	const semesterDiff = $derived(
		hoverRamo
			? Math.abs(
					semesterIndex -
						mallaState.currentMalla.findIndex((s) => s.some((r) => r.sigla === mallaState.hoverSig))
				)
			: semesterIndex
	);

	const delay = $derived(semesterDiff * 100);

	const {
		base: card,
		credits: cardCredits,
		title: cardTitle,
		sigla: cardSigla,
		header: cardHeader
	} = $derived(cardStyles({ status, relation, odd: semesterIndex % 2 === 0 }));
</script>

<button
	id="ramo-{ramo.sigla}"
	onclick={() => onclick(ramo)}
	onmouseenter={() => (mallaState.hoverSig = ramo.sigla)}
	onmouseleave={() => (mallaState.hoverSig = null)}
	class={card({})}
	style:transition-delay={!['self', 'none'].includes(relation) ? `${delay}ms` : '0ms'}
>
	<Tooltip
		content={mallaState.customNames[ramo.sigla] || ramo.nombre}
		wrapperClass={cardHeader({})}
	>
		<span class={cardTitle({})}>
			{mallaState.customNames[ramo.sigla] || ramo.nombre}
		</span>
		<span class={cardSigla({})}>{ramo.sigla}</span>
	</Tooltip>

	<div class={cardCredits({})}>{ramo.creditos} SCT</div>
</button>
