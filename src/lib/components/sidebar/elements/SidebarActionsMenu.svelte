<script lang="ts">
	import { Calendario } from '$lib/states/calendario.svelte';
	import { Menu, MenuHeader, MenuItem, MenuSeparator } from '$lib/components/ui/menu';
	import Button from '$lib/components/ui/Button.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import { Dialog } from '$lib/components/ui/helpers/DialogRenderer.svelte';
	import { generateAIAnalysisPrompt } from '$lib/logic/statistics/prompt';

	// Iconos
	import MaterialSymbolsMenu from '$lib/icons/MaterialSymbolsMenu.svelte';
	import Copy from '$lib/icons/copy.svelte';
	import MaterialSymbolsMagicButton from '$lib/icons/MaterialSymbolsMagicButton.svelte';
	import Image from '$lib/icons/image.svelte';
	import Save from '$lib/icons/save.svelte';
	import Trash from '$lib/icons/trash.svelte';
	import { downloadICS } from '$lib/logic/export/ics';
	import MdiCalendarExport from '$lib/icons/MdiCalendarExport.svelte';
	import { ImageDialog } from '../dialogs/ImageDialog.svelte';
	import { toast } from '$lib/components/ui/sonner/ctx.svelte';
	import { PromptDialog } from '../dialogs/PromptDialog.svelte';
</script>

<Menu align="end">
	{#snippet trigger()}
		<Tooltip content="Opciones">
			<Button variant="outlined" size="icon">
				<MaterialSymbolsMenu />
			</Button>
		</Tooltip>
	{/snippet}

	<MenuItem
		disabled={!Calendario.ramos.length}
		onclick={async () => {
			const tiempoNoInformado = Calendario.tiempoTraslado === -1;
			const tiempoTraslado = tiempoNoInformado ? 60 : Calendario.tiempoTraslado;

			const context = {
				ramos: Calendario.ramos,
				sede: Calendario.sede,
				jornada: Calendario.jornada,
				semestre: Calendario.semestre,
				tiempoTraslado: tiempoTraslado,
				esTiempoEstimado: tiempoNoInformado,
				ventanas: Calendario.ventanas
			};
			const prompt = await generateAIAnalysisPrompt(context);
			await navigator.clipboard.writeText(prompt);

			PromptDialog.open();
			toast.success('Prompt pegado al portapepeles de tu dispositivo', {
				description: 'Pega o pulsa CTRL+V en el teclado para pegar el contenido.'
			});
		}}
	>
		<MaterialSymbolsMagicButton class="mr-2 h-4 w-4" />
		Prompt diagnóstico IA
	</MenuItem>

	<MenuHeader>Exportar</MenuHeader>

	<MenuItem onclick={() => ImageDialog.open()} disabled={!Calendario.ramos.length}>
		<Image class="mr-2 h-4 w-4" />
		Imagen/impresión
	</MenuItem>

	<MenuItem
		onclick={() => {
			downloadICS();
			toast.success('Calendario generado con éxito', {
				description: 'Ya puedes importarlo a Google Calendar, Outlook o iCal.'
			});
		}}
		disabled={!Calendario.ramos.length}
	>
		<MdiCalendarExport class="mr-2 h-4 w-4" />
		Calendario
	</MenuItem>

	<MenuItem
		disabled={!Calendario.ramos.length}
		onclick={() => {
			const listado = Calendario.ramos
				.map((r) => `${r.sigla}, PARALELO ${r.paralelo} (PROFESORES: ${r.profesor.join(', ')})`)
				.join('\n');
			navigator.clipboard.writeText(listado);
			toast.success('Lista copiada al portapapeles', {
				description: `${Calendario.ramos.length} asignaturas listas para compartir o guardar.`
			});
		}}
	>
		<Copy class="mr-2 h-4 w-4" />
		Copiar selección
	</MenuItem>

	<MenuSeparator />

	<MenuHeader>Gestión</MenuHeader>
	<MenuItem
		disabled={!Calendario.ramos.length}
		onclick={async () => {
			const key = await Dialog.input({
				title: '¿Cómo se va a llamar el horario? (debe ser único)',
				value: new Date().toLocaleDateString('es-ES', {
					year: 'numeric',
					month: '2-digit',
					day: '2-digit',
					hour: '2-digit',
					minute: '2-digit'
				})
			});
			if (key) Calendario.save(key);
		}}
	>
		<Save class="mr-2 h-4 w-4" />
		Guardar horario
	</MenuItem>

	<MenuItem
		onclick={async () =>
			(await Dialog.confirm({
				title: '¿Estás seguro? Esta acción va a borrar TODOS los ramos inscritos.'
			})) && Calendario.clear()}
		disabled={!Calendario.ramos.length}
	>
		<Trash class="mr-2 h-4 w-4" />
		Limpiar todo
	</MenuItem>
</Menu>
