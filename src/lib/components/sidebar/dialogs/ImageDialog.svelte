<script module>
	let open = $state(false);

	// Singleton Pattern para control global
	export const ImageDialog = {
		open() {
			open = true;
		},
		close() {
			open = false;
		}
	};
</script>

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import DialogComponent from '$lib/components/ui/Dialog.svelte';
	import Toggle from '$lib/components/ui/Toggle.svelte';
	import { toast } from '$lib/components/ui/sonner/ctx.svelte';
	import MdiPrinter from '$lib/icons/teachers.svelte'; // Iconos sugeridos
	import MdiDownload from '$lib/icons/save.svelte';
	import ExportableSchedule from '$lib/logic/export/components/ExportableSchedule.svelte';
	import MaterialSymbolsPrint from '$lib/icons/MaterialSymbolsPrint.svelte';

	let theme = $state<'light' | 'dark' | 'bw'>('light');
	let nomenclature = $state<'detailed' | 'codes'>('detailed');
	let showProfessors = $state(true);
	let showRooms = $state(true);
	let showHeader = $state(true);
	let showParalelos = $state(true);
	let showClassType = $state(true);
	let showBloqueEnd = $state(true);
	let isProcessing = $state(false);

	async function handleAction(mode: 'download' | 'print') {
		isProcessing = true;
		try {
			// Importamos dinámicamente el helper para evitar problemas de SSR si los hubiera
			const { captureSchedule } = await import('$lib/logic/export/screenshot');
			await captureSchedule(mode);

			if (mode === 'download') toast.success('Imagen guardada correctamente');
		} catch (e) {
			console.error(e);
			toast.error('Ocurrió un error al generar la imagen');
		} finally {
			isProcessing = false;
			open = false;
		}
	}
</script>

<DialogComponent bind:open class="max-w-5xl! gap-0 p-0">
	<div class="bg-card flex w-full shrink-0 items-center justify-between border-b p-4 pb-3">
		<div>
			<h2 class="text-lg leading-none font-bold">Exportar Horario</h2>
			<p class="text-muted-foreground mt-1 text-xs">Personaliza el diseño antes de guardar</p>
		</div>
	</div>

	<div class="flex flex-1 flex-col overflow-hidden lg:flex-row">
		<div class="bg-card flex w-full flex-1 shrink-0 flex-col gap-6 border-r p-5">
			<div class="space-y-2">
				<h3 class="text-muted-foreground text-xs font-bold tracking-wider uppercase">Formato</h3>
				<div class="space-y-2">
					<label class="text-sm font-medium">Modo de Etiquetas</label>
					<div class="grid grid-cols-2 gap-2">
						<button
							class="rounded border px-2 py-1.5 text-xs transition-all {nomenclature === 'detailed'
								? 'bg-primary text-primary-foreground border-primary'
								: 'bg-background hover:bg-accent'}"
							onclick={() => (nomenclature = 'detailed')}
						>
							Completo
						</button>
						<button
							class="rounded border px-2 py-1.5 text-xs transition-all {nomenclature === 'codes'
								? 'bg-primary text-primary-foreground border-primary'
								: 'bg-background hover:bg-accent'}"
							onclick={() => (nomenclature = 'codes')}
						>
							Compacto
						</button>
					</div>
					<p class="text-muted-foreground text-xs leading-tight">
						{nomenclature === 'detailed'
							? 'Muestra el nombre completo dentro de cada bloque.'
							: 'Muestra solo siglas grandes y añade una leyenda al inicio.'}
					</p>
				</div>

				<div class="space-y-2">
					<label class="text-sm font-medium">Tema</label>
					<div class="bg-muted flex rounded-lg p-1">
						{#each ['light', 'dark', 'bw'] as t}
							<button
								class="flex-1 rounded-md px-3 py-1 text-xs font-medium capitalize transition-all {theme ===
								t
									? 'bg-background text-foreground shadow'
									: 'text-muted-foreground hover:text-foreground hover:cursor-pointer'}"
								onclick={() => (theme = t as any)}
							>
								{t === 'bw' ? 'Tinta' : t === 'light' ? 'Papel' : 'Pantalla'}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<div class="space-y-2">
				<h3 class="text-muted-foreground text-xs font-bold tracking-wider uppercase">Contenido</h3>
				<div class="flex flex-col gap-1">
					<Toggle bind:pressed={showHeader} size="sm">Encabezado</Toggle>
					<Toggle bind:pressed={showParalelos} size="sm">Paralelos</Toggle>
					<Toggle bind:pressed={showRooms} size="sm">Salas</Toggle>
					<Toggle bind:pressed={showProfessors} size="sm">Profesores</Toggle>
					<Toggle bind:pressed={showClassType} size="sm">Tipo de Clase</Toggle>
					<Toggle bind:pressed={showBloqueEnd} size="sm">Termino de bloque</Toggle>
				</div>
			</div>

			<div class="mt-auto space-y-1">
				<Button class="w-full" disabled={isProcessing} onclick={() => handleAction('download')}>
					<MdiDownload class="mr-1 size-4" />
					{isProcessing ? 'Procesando...' : 'Descargar imagen'}
				</Button>

				<Button
					variant="secondary"
					class="w-full"
					disabled={isProcessing}
					onclick={() => handleAction('print')}
				>
					<MaterialSymbolsPrint class="mr-1 size-4" />
					Imprimir
				</Button>
			</div>
		</div>

		<div class="relative flex aspect-[1.5] flex-2 items-start justify-center overflow-auto">
			<div class="top-0 left-0 h-full w-full shadow-2xl transition-transform duration-300">
				<ExportableSchedule
					{theme}
					{nomenclature}
					{showParalelos}
					{showRooms}
					{showClassType}
					{showHeader}
					{showBloqueEnd}
				/>
			</div>
		</div>
	</div>
</DialogComponent>
