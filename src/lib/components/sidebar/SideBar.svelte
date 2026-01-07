<script lang="ts" module>
	import Add from '$lib/icons/add.svelte';
	import { circOut } from 'svelte/easing';
	import RamoWindow from './windows/RamoWindow.svelte';
	import { fade, fly } from 'svelte/transition';
	import Button from '$lib/components/ui/Button.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import Trash from '$lib/icons/trash.svelte';
	import Save from '$lib/icons/save.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import Separator from '$lib/components/ui/Separator.svelte';
	import { tick } from 'svelte';
	import SavedHorariosWindow from './windows/SavedHorariosWindow.svelte';
	import Horario from '$lib/icons/horario.svelte';
	import { Menu, MenuHeader, MenuItem, MenuSeparator } from '../ui/menu';
	import MaterialSymbolsMenu from '$lib/icons/MaterialSymbolsMenu.svelte';
	import Image from '$lib/icons/image.svelte';
	import { exportScheduleAsImage } from '$lib/helpers/screenshot';
	import Copy from '$lib/icons/copy.svelte';
	import { Dialog } from '../ui/Dialog.svelte';
	import SedeSelector from '../elements/SedeSelector.svelte';
	import Statistics from '../elements/Statistics.svelte';
	import RamosList from '../elements/RamosList.svelte';
	import MaterialSymbolsFeedback from '$lib/icons/MaterialSymbolsFeedback.svelte';
	import MaterialSymbolsGrid4x4 from '$lib/icons/MaterialSymbolsGrid4x4.svelte';
	import { goto } from '$app/navigation';
	import MaterialSymbolsMagicButton from '$lib/icons/MaterialSymbolsMagicButton.svelte';
	import { generateAIAnalysisPrompt } from '$lib/logic/statistics/prompt';
	import UserData from '../elements/UserData.svelte';
	import { base } from '$app/paths';

	let activeWindowProps: any = $state(undefined);
	let activeWindow: any | undefined = $state(undefined);
	export const SideBar = {
		closeActiveWindow: function () {
			activeWindow = undefined;
		},

		get activeWindow() {
			return activeWindow;
		},

		async setActiveWindow(value: any, props: any) {
			activeWindow = undefined;
			await tick();
			activeWindowProps = props;
			activeWindow = value;
		}
	};
</script>

<div
	id="main-sidebar"
	class="bg-sidebar text-sidebar-foreground relative h-full overflow-hidden p-4"
>
	<div in:fade={{ delay: 500, duration: 500 }} class="h-full w-full">
		{#if !activeWindow}
			{#snippet sidebarButton(
				text: string,
				onclick: () => any,
				Icon?: any,
				variant?: string,
				_class?: string
			)}
				<Button
					variant={(variant as any) ?? undefined}
					class="block h-auto flex-1 justify-start py-2 text-left leading-tight whitespace-normal {_class ??
						''}"
					{onclick}
				>
					<p class="display-[inherit] text-[inherit]">
						{#if Icon}
							<Icon class="mr-1 inline-block scale-125 align-middle" />
						{/if}
						{text}
					</p>
				</Button>
			{/snippet}
			<div
				out:fade={{ delay: 400, duration: 50 }}
				class="flex h-full w-full flex-col gap-2 {activeWindow ? 'pointer-events-none' : ''}"
			>
				<!-- <div
					class="pointer-events-none relative z-10 flex h-40 flex-col items-center justify-center pb-2 select-none"
				>
					<div
						class="absolute top-0 left-0 -z-10 h-full w-full origin-bottom scale-150 bg-white"
					></div>
					<img
						src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSexr4dvbYixA8xOnNyeqx_w0Y3H0F9jkT6Hg&s"
						alt=""
						class="z-10"
					/>
				</div> -->
				<div class="h-min w-full">
					{#if Calendario.sede}
						<div in:fly={{ y: -40 }} class="flex h-min w-full flex-row flex-wrap gap-2">
							{@render sidebarButton(
								'Añadir ramo',
								() => SideBar.setActiveWindow(RamoWindow, {}),
								Add,
								undefined,
								'justify-center!'
							)}
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
									onclick={() => {
										const listado = Calendario.ramos
											.map(
												(r) =>
													`${r.sigla}, PARALELO ${r.paralelo} (PROFESORES: ${r.profesor.join(', ')})`
											)
											.join('\n');
										navigator.clipboard
											.writeText(listado)
											.then(() => alert(`Lista copiada al portapapeles:\n"${listado}"`));
									}}
								>
									<Copy class="mr-2 h-4 w-4" />
									Copiar selección
								</MenuItem>

								<MenuItem
									disabled={!Calendario.ramos.length}
									onclick={async () => {
										// 1. Preparar Contexto
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

										// 2. Generar Prompt (Lógica extraída)
										const prompt = await generateAIAnalysisPrompt(context);

										// 3. Acción de UI
										await navigator.clipboard.writeText(prompt);
										alert(
											'¡Diagnóstico copiado al portapapeles!\n\nPégalo en tu IA favorita (ChatGPT, Claude, Gemini) para recibir un análisis detallado.\n\nPara que la IA analice la materia específica, te recomendamos adjuntar los archivos de los programas (syllabus) de tus ramos directamente en el chat.'
										);
									}}
								>
									<MaterialSymbolsMagicButton class="mr-2 h-4 w-4" />
									Prompt diagnóstico IA
								</MenuItem>

								<MenuItem onclick={exportScheduleAsImage} disabled={!Calendario.ramos.length}>
									<Image class="mr-2 h-4 w-4" />
									Exportar imagen
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

							<Separator />
							{#if !Calendario.visible}
								<div class="flex flex-1 flex-col gap-[inherit]">
									{@render sidebarButton(
										'Horarios guardados',
										() => (activeWindow = SavedHorariosWindow),
										Horario,
										'secondary'
									)}
									{@render sidebarButton(
										'Malla Interactiva',
										() => goto(`${base}/malla`),
										MaterialSymbolsGrid4x4,
										'secondary'
									)}
								</div>
							{/if}
						</div>
					{/if}
				</div>
				<div class="flex h-full w-full flex-col-reverse gap-1">
					{#if Calendario.visible}
						<RamosList />
						<Separator />
						<Statistics />
					{:else if Calendario.inicializado}
						<SedeSelector />
						<UserData />
					{/if}
				</div>
				<div class="w-full text-center text-sm">
					<Separator />
					{#await import("$lib/components/elements/Me.svelte") then { default: Me }}
						<Me />
						<p
							class="decoration-foreground/50 mt-1 cursor-pointer underline decoration-dashed opacity-50 hover:decoration-solid hover:opacity-100"
							onclick={() =>
								window.open(
									'https://docs.google.com/forms/d/e/1FAIpQLSeKxJ4idy0vEZSqC_Ew5siparx6Lxy8kvP2ixWKBGc0Lwm6Jg/viewform?usp=dialog',
									'_blank'
								)}
						>
							<MaterialSymbolsFeedback class="mr-1 inline" />
							Comentarios, reclamos y sugerencias
						</p>
					{/await}
				</div>
			</div>
		{/if}
		{#if activeWindow}
			{@const Window = activeWindow}
			<div
				class="bg-sidebar-accent text-sidebar-accent-foreground absolute top-0 left-0 flex h-full w-full min-w-full flex-col items-end gap-2 p-4 {activeWindow
					? 'pointer-events-auto'
					: 'pointer-events-none'}"
				transition:fly={{
					x: '-100%',
					opacity: 1,
					easing: circOut,
					duration: 300
				}}
			>
				<Button
					class="aspect-square h-min w-auto"
					variant="ghost"
					onclick={() => {
						activeWindow = undefined;
						Calendario.ramoPreview = undefined;
					}}
				>
					<Add class="scale-150 rotate-45" />
				</Button>
				<Window {...activeWindowProps ?? {}} />
			</div>
		{/if}
	</div>
</div>

<style lang="postcss">
	@reference 'tailwindcss';

	#main-sidebar {
		animation: main-sidebar-in 1.2s cubic-bezier(0.23, 1, 0.32, 1);
		@apply w-90;
	}

	@keyframes -global-main-sidebar-in {
		0% {
			opacity: 0;
			width: 0;
			padding: 0;
		}

		50% {
			opacity: 1;
		}
	}
</style>
