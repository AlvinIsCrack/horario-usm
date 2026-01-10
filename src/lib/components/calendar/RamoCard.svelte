<script lang="ts">
	import { fly } from 'svelte/transition';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import { TipoBloque, type Bloque } from '$lib/types/horario';
	import Location from '$lib/icons/location.svelte';
	import { SideBar } from '../sidebar/SideBar.svelte';
	import CornerBadge from '../ui/CornerBadge.svelte';

	let { bloqueObject, ...props }: { bloqueObject: Bloque } = $props();
	let visible = $state(false);

	const ramo = $derived(bloqueObject.ramo);
	const esCátedra = bloqueObject.tipo === TipoBloque.Cátedra;
	// svelte-ignore state_referenced_locally
	const [color, esOscuro] = [ramo.color!, ramo.color!.isDark()];
	const salaVálida = !bloqueObject.sala.match(/sin(?:\s+sala)?/gi);

	$effect(() => {
		visible = true;
		return () => {
			visible = false;
		};
	});
</script>

<div class="h-full w-full {!esCátedra ? 'rounded-none p-2' : ''}">
	<div class="relative h-full w-full">
		{#if visible}
			<div
				onmouseenter={() => !SideBar.activeWindow && (Calendario.ramoPreview = ramo)}
				onmouseleave={() => !SideBar.activeWindow && (Calendario.ramoPreview = undefined)}
				transition:fly
				class="ring-border border-input absolute flex h-full w-full flex-col justify-between ring {esCátedra
					? 'rounded-lg'
					: 'border'} 
    
    {Calendario.bloqueRangeDifference > 14 ? 'p-1 lg:p-2' : 'p-2 lg:p-3'} 
    
    {ramo.highlighted
					? 'bloque-highlighted ring-2 ring-white'
					: ''} bloque-con-brillo z-10 overflow-hidden text-left leading-4 bg-blend-multiply shadow-md/50 inset-shadow-xs inset-shadow-white/50"
				class:text-white={esOscuro}
				class:text-gray-900={!esOscuro}
				style:background="linear-gradient(to bottom right, {color.hexa()}, {color
					.rotate(30)
					.lighten(0.3)
					.desaturate(0.25)
					.hexa()})"
				{...props}
			>
				<div>
					<p
						class="line-clamp-2 text-xs leading-tight font-medium md:text-sm 2xl:text-base"
						title={ramo.nombre}
					>
						{ramo.nombre}
					</p>

					<p
						class:opacity-60={esOscuro}
						class:opacity-40={!esOscuro}
						class="mt-0.5 text-[10px] lg:text-xs"
					>
						<b>{ramo.sigla}</b>
						<span class="ml-1 opacity-80">PAR. {ramo.paralelo}</span>
					</p>
				</div>

				<div class="flex w-full flex-row flex-wrap items-center justify-between gap-2">
					{#if !esCátedra}
						<p
							class="text-[10px] font-bold tracking-wider uppercase lg:text-xs"
							class:opacity-60={esOscuro}
							class:opacity-40={!esOscuro}
						>
							{Object.keys(TipoBloque)[Object.values(TipoBloque).indexOf(bloqueObject.tipo)]}
						</p>
					{/if}
				</div>
			</div>
			{#if salaVálida}
				<CornerBadge
					position="bottom-right"
					class="{esCátedra ? 'rounded-br-lg' : ''} text-xs! xl:text-sm!"
					icon={Location}
				>
					{bloqueObject.sala.replace(/san joaqu.n/gi, '').replace(/(?:-|_)\s+$/g, '')}
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
