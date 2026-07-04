<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { circOut } from 'svelte/easing';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Calendario } from '$lib/states/calendario.svelte';
	import { SidebarState } from '$lib/core/sidebar/state.svelte';
	import { ContactState } from '$lib/core/dialogs/state.svelte';
	import { Config } from '$lib/core/config/store.svelte';

	// Componentes UI & Iconos
	import Button from '$lib/components/ui/Button.svelte';
	import Separator from '$lib/components/ui/Separator.svelte';
	import Add from '$lib/icons/add.svelte';
	import Horario from '$lib/icons/horario.svelte';
	import Teachers from '$lib/icons/teachers.svelte';
	import MaterialSymbolsGrid4x4 from '$lib/icons/MaterialSymbolsGrid4x4.svelte';
	import MaterialSymbolsFeedback from '$lib/icons/MaterialSymbolsFeedback.svelte';

	// Elementos
	import SidebarButton from './elements/SidebarButton.svelte';
	import SidebarActionsMenu from './elements/SidebarActionsMenu.svelte';
	import ContactDialogComponent from './dialogs/ContactDialog.svelte';
	import PromptDialogComponent from './dialogs/PromptDialog.svelte';
	import ImageDialogComponent from './dialogs/ImageDialog.svelte';

	// Ventanas y Paneles
	import RamoWindow from './windows/RamoWindow.svelte';
	import SavedHorariosWindow from './windows/SavedHorariosWindow.svelte';
	import Statistics from '$lib/core/statistics/components/Statistics.svelte';
	import MaterialSymbolsArrowLeftAlt from '$lib/icons/MaterialSymbolsArrowLeftAlt.svelte';
	import { SettingsDialogState } from '$lib/core/config/components/dialog/SettingsDialog.svelte';
	import Tooltip from '../ui/Tooltip.svelte';
	import MaterialSymbolsSettings from '$lib/icons/MaterialSymbolsSettings.svelte';
	import RamosList from '../shared/RamosList.svelte';
</script>

<div
	id="main-sidebar"
	class="bg-sidebar text-sidebar-foreground relative flex h-full max-w-xs! flex-col overflow-hidden"
>
	<div in:fade={{ delay: 500, duration: 500 }} class="flex h-full w-full flex-col">
		<div
			class="flex h-full w-full flex-col transition-opacity duration-300
			{SidebarState.isOpen ? 'pointer-events-none opacity-0' : 'opacity-100 delay-100'}"
			aria-hidden={SidebarState.isOpen}
		>
			{#if Config.sede}
				<div class="flex flex-row gap-2 p-4 pb-2" in:fly={{ y: -20 }}>
					<SidebarButton
						text={Calendario.ramos.length ? 'Añadir ramo' : 'Crear horario'}
						onclick={() => {
							SidebarState.open(
								RamoWindow,
								{},
								{
									title: 'Añadir ramo',
									description: 'Planificar tu horario'
								}
							);
						}}
						Icon={Add}
						class="justify-center!"
					/>
					{#if Calendario.ramos.length}
						<SidebarActionsMenu />
					{/if}
				</div>
				<Separator class="mx-4 w-auto" />
			{/if}

			<div class="flex-1 overflow-x-hidden overflow-y-auto p-4">
				<div class="flex flex-col gap-4">
					{#if Calendario.visible}
						<div class="flex flex-col gap-1">
							<RamosList />
						</div>
						<Separator />
						<Statistics />
					{/if}
				</div>
			</div>

			<div class="flex flex-col gap-2 border-t bg-black/5 dark:bg-white/5">
				{#if Config.sede && !Calendario.visible}
					<div class="flex flex-col gap-2 p-4">
						<p class="text-opacity-60 mb-1 text-xs font-semibold tracking-wider uppercase">
							Otras Herramientas
						</p>
						<SidebarButton
							text="Horarios guardados"
							onclick={() => {
								SidebarState.open(
									SavedHorariosWindow,
									{},
									{
										title: 'Horarios guardados',
										description: 'Guardados localmente'
									}
								);
							}}
							Icon={Horario}
							variant="secondary"
						/>
						<SidebarButton
							text="Malla Interactiva"
							onclick={() => goto(`${base}/malla`)}
							Icon={MaterialSymbolsGrid4x4}
							variant="secondary"
						/>
						<SidebarButton
							text="Profesores"
							onclick={() => goto(`${base}/profesores`)}
							Icon={Teachers}
							variant="secondary"
						/>
					</div>
				{/if}

				{#if Calendario.inicializado}
					<div class="bg-primary/60 flex w-full flex-row items-center justify-between border-t p-4">
						<div></div>
						<div class="flex gap-1">
							<Tooltip content="Ajustes">
								<Button size="icon" variant="ghost" onclick={SettingsDialogState.open}>
									<MaterialSymbolsSettings class="size-5" />
								</Button>
							</Tooltip>
							<Tooltip content="Contacto">
								<Button size="icon" variant="ghost" onclick={ContactState.open}>
									<MaterialSymbolsFeedback class="size-5" />
								</Button>
							</Tooltip>
						</div>
					</div>
				{/if}
			</div>
		</div>

		{#if SidebarState.activeWindow}
			{@const Window = SidebarState.activeWindow}
			<div
				class="bg-sidebar-accent text-sidebar-accent-foreground absolute top-0 left-0 z-10 flex h-full w-full min-w-full flex-col items-end gap-2 overflow-hidden p-4"
				transition:fly={{ x: '-100%', opacity: 1, easing: circOut, duration: 300 }}
			>
				<div
					class="bg-card -mx-4 -mt-4 mb-2 flex w-[calc(100%+2rem)] flex-row items-center justify-between p-4 shadow-sm"
				>
					<div class="flex flex-1 flex-col items-start justify-center pr-4 text-left">
						{#if SidebarState.title}
							<h1 class="-mb-0.5 font-semibold">{SidebarState.title}</h1>
						{/if}
						{#if SidebarState.description}
							<p class="text-sm leading-tight opacity-50">{SidebarState.description}</p>
						{/if}
					</div>
					<Button
						class="bg-card/50! hover:bg-accent/80! aspect-square h-min w-auto"
						variant="outlined"
						disabled={SidebarState.isLocked}
						onclick={() => {
							SidebarState.close();
							goto(base + '/');
							Calendario.ramoPreview = undefined;
						}}
					>
						<MaterialSymbolsArrowLeftAlt class="scale-150" />
					</Button>
				</div>

				<Window {...SidebarState.props} />
			</div>
		{/if}
	</div>

	<ContactDialogComponent />
	<PromptDialogComponent />
	<ImageDialogComponent />
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
		}
		50% {
			opacity: 1;
		}
	}
</style>
