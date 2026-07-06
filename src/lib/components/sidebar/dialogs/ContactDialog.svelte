<script lang="ts">
	import { base } from '$app/paths';
	import Button from '$lib/components/ui/Button.svelte';
	import DialogComponent from '$lib/components/ui/Dialog.svelte';
	import MaterialSymbolsFeedback from '$lib/icons/MaterialSymbolsFeedback.svelte';
	import MingcutePaypalFill from '$lib/icons/MingcutePaypalFill.svelte';
	import { ContactState } from '$lib/core/dialogs/state.svelte';
	import MdiInstagram from '$lib/icons/MdiInstagram.svelte';
</script>

<DialogComponent bind:open={ContactState.isOpen} class="max-w-sm gap-0 p-0">
	<div class="bg-card border-b p-4 pb-3">
		<h2 class="text-lg leading-none font-bold">Contacto</h2>
		<p class="text-muted-foreground mt-1 text-xs">
			¿Tienes dudas, encontraste un error o quieres apoyar el proyecto?
		</p>
	</div>

	<div class="flex flex-col gap-2 p-4">
		<div class="pointer-events-none my-4 w-full place-items-center space-y-1">
			<img class="h-30 w-auto rounded-md" src="{base}/media/meowl.gif" alt="Meowl" />
			<h1 class="font-mono">lukka</h1>
		</div>

		<Button
			class="justify-start gap-4"
			onclick={(e) => {
				e.preventDefault();
				window.open(
					'https://docs.google.com/forms/d/e/1FAIpQLSeKxJ4idy0vEZSqC_Ew5siparx6Lxy8kvP2ixWKBGc0Lwm6Jg/viewform?usp=dialog',
					'_blank'
				);
			}}
		>
			<MaterialSymbolsFeedback class="text-muted-foreground size-5" />
			<div class="flex flex-col items-start text-sm">
				<span class="font-medium">Reportar problema, comentar o sugerir</span>
				<span class="text-muted-foreground text-xs">Formulario de Google</span>
			</div>
		</Button>

		<Button
			variant="outlined"
			class="justify-start gap-4"
			onclick={(e) => {
				e.preventDefault();
				window.open('https://paypal.me/LuccaE', '_blank');
			}}
		>
			<MingcutePaypalFill class="text-muted-foreground size-5" />
			<div class="flex flex-col items-start text-sm">
				<span class="font-medium">Donar un peso con Paypal</span>
				<span class="text-muted-foreground text-xs">Porque no tengo ko-fi</span>
			</div>
		</Button>

		<Button
			variant="outlined"
			class="justify-start gap-4"
			onclick={(e) => {
				e.preventDefault();
				window.open('https://www.instagram.com/lvim_lucas/', '_blank');
			}}
		>
			<MdiInstagram class="text-muted-foreground size-5" />
			<div class="flex flex-col items-start text-sm">
				<span class="font-medium">Instagram de fotografía</span>
				<span class="text-muted-foreground text-xs">Nada que ver, pero me haría feliz</span>
			</div>
		</Button>
	</div>
</DialogComponent>
