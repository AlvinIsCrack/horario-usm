<script lang="ts">
	import { fly } from 'svelte/transition';
	import { Calendario } from '$lib/states/calendario.svelte';
	import Location from '$lib/icons/location.svelte';
	import { SidebarState } from '$lib/core/sidebar/state.svelte';
	import CornerBadge from '../ui/CornerBadge.svelte';
	import { TipoBloque, type Bloque } from '$lib/core/ramos/types';
	import { tv } from 'tailwind-variants';

	const cardStyles = tv({
		slots: {
			root: ['h-full', 'w-full'],
			innerCard: [
				'absolute flex flex-col justify-between h-full w-full',
				'ring ring-border border-input z-10 overflow-hidden',
				'text-left leading-4 bg-blend-multiply',
				'shadow-md/50 inset-shadow-xs inset-shadow-white/50 bloque-con-brillo'
			],
			titleText: ['font-medium leading-tight line-clamp-2', 'text-xs @xs:text-sm @md:text-base'],
			subtitleText: ['mt-0.5 font-mono font-medium', 'text-xs @xs:text-sm'],
			typeLabel: ['font-bold tracking-wider uppercase', 'text-[10px] @xs:text-xs']
		},
		variants: {
			isLecture: {
				true: {
					innerCard: 'rounded-lg'
				},
				false: {
					root: 'rounded-none p-2',
					innerCard: 'border'
				}
			},
			isCompactRange: {
				true: {
					innerCard: 'p-1 @xs:p-2'
				},
				false: {
					innerCard: 'p-2 @xs:p-3'
				}
			},
			isHighlighted: {
				true: {
					innerCard: 'bloque-highlighted ring-2 ring-white'
				}
			},
			isDarkTheme: {
				true: {
					innerCard: 'text-white',
					subtitleText: 'opacity-80',
					typeLabel: 'opacity-60'
				},
				false: {
					innerCard: 'text-black',
					subtitleText: 'opacity-60',
					typeLabel: 'opacity-40'
				}
			}
		}
	});

	let { bloqueObject, ...props }: { bloqueObject: Bloque } = $props();
	let visible = $state(false);

	const ramo = $derived(bloqueObject.ramo!);
	const esCátedra = $derived(bloqueObject.tipo === TipoBloque.Cátedra);

	// svelte-ignore state_referenced_locally
	const [color, esOscuro] = [ramo.color!, ramo.color!.isDark()];
	const salaVálida = $derived(!bloqueObject.sala.match(/sin(?:\s+sala)?/gi));

	/**
	 * Compute active visual configurations matching runtime entity metrics
	 */
	const { root, innerCard, titleText, subtitleText, typeLabel } = $derived(
		cardStyles({
			isLecture: esCátedra,
			isCompactRange: Calendario.bloqueRangeDifference > 14,
			isHighlighted: !!ramo.highlighted,
			isDarkTheme: esOscuro
		})
	);

	$effect(() => {
		visible = true;
		return () => {
			visible = false;
		};
	});
</script>

<div class="{root()} @container">
	<div class="relative h-full w-full">
		{#if visible}
			<div
				onmouseenter={() => !SidebarState.isOpen && (Calendario.ramoPreview = ramo)}
				onmouseleave={() => !SidebarState.isOpen && (Calendario.ramoPreview = undefined)}
				transition:fly
				class={innerCard()}
				style:background="linear-gradient(to bottom right, {color.hexa()}, {color
					.rotate(30)
					.lighten(0.3)
					.desaturate(0.25)
					.hexa()})"
				{...props}
			>
				<div class="-space-y-1">
					<p class={titleText()} title={ramo.nombre}>
						{ramo.nombre}
					</p>

					<p class={subtitleText()}>
						<b class="drop-shadow-xs" style:color={ramo.color?.lighten(-0.5).saturate(0.2).hex()}>
							{ramo.sigla}
						</b>
						P{ramo.paralelo}
					</p>
				</div>

				<div class="flex w-full flex-row flex-wrap items-center justify-between gap-2">
					{#if !esCátedra}
						<p class={typeLabel()}>
							{Object.keys(TipoBloque)[Object.values(TipoBloque).indexOf(bloqueObject.tipo)]}
						</p>
					{/if}
				</div>
			</div>
			{#if salaVálida}
				<CornerBadge
					position="bottom-right"
					class="{esCátedra ? 'rounded-br-lg' : ''} text-[10px]! @xs:text-xs! @sm:text-sm!"
					icon={Location}
				>
					{bloqueObject.sala}
				</CornerBadge>
			{/if}
		{/if}
	</div>
</div>

<style>
	@keyframes -global-bloque-highlight-animation {
		0%,
		100% {
			opacity: 1;
		}

		50% {
			opacity: 0.75;
		}
	}

	:global(.bloque-highlighted) {
		animation: 0.5s bloque-highlight-animation 400ms cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>
