<script lang="ts">
	import { Data } from '$lib/data/data.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import { fade, fly } from 'svelte/transition';

	let visible = $state(false);
	$effect(() => {
		setTimeout(() => {
			visible = true;
		}, 200);
	});
</script>

{#if visible}
	<div
		transition:fade={{ duration: 400 }}
		class="relative flex h-full w-full flex-col items-center justify-center p-8 select-none"
	>
		<div class="z-10 flex flex-col items-center justify-center">
			<div class="text-foreground flex flex-col items-center">
				<span
					class="mb-1 text-center text-xl font-black
							 tracking-tight opacity-70 lg:text-3xl xl:text-4xl"
				>
					INFORMACIÓN DE RAMOS ACTUALIZADA HACE
				</span>
				<div
					class="font-gothic-expanded text-foreground w-full
						   text-center text-7xl
						   leading-[0.85] font-black
						   tracking-tighter
						   uppercase lg:-mt-3 lg:text-8xl lg:leading-[0.8] xl:text-9xl"
				>
					{Data.updateDate?.fromNow().replace('hace', '').deaccent() ?? '...'}
				</div>
			</div>
			<div class="w-full text-center italic opacity-50">
				Actualizado el {Data.updateDate?.format('dddd D [de] MMM/YYYY[, a las] HH:mm')}
			</div>
		</div>

		<div class="absolute bottom-0 left-1/2 -translate-x-1/2">
			<div in:fly={{ y: 100, delay: 500 }} class="text-center text-xs opacity-50">
				Esta página no está afiliada, asociada, autorizada, respaldada ni conectada de ninguna
				manera oficialmente con la <b>Universidad Técnica Federico Santa María</b> o cualquiera de sus
				subsidiarias o afiliadas. La página no recopila información, ni utiliza cookies de terceros.
			</div>
		</div>
	</div>
{/if}
