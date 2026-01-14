<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { circOut } from 'svelte/easing';
	import { base } from '$app/paths';
	import { goto } from '$app/navigation';
	import { Calendario } from '$lib/states/calendario.svelte';
	import { SidebarState } from '$lib/logic/sidebar/state.svelte';
	import { ContactState } from '$lib/logic/dialogs/state.svelte';
	import { Config } from '$lib/logic/config/store.svelte';

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
	import RamosList from '../elements/RamosList.svelte';
	import Statistics from '../../logic/statistics/components/Statistics.svelte';
	import SedeSelector from '../../logic/config/components/SedeSelector.svelte';
	import UserData from '../../logic/config/components/UserData.svelte';
</script>

<div
	id="main-sidebar"
	class="bg-sidebar text-sidebar-foreground relative h-full overflow-hidden p-4"
>
	<div in:fade={{ delay: 500, duration: 500 }} class="isolate h-full w-full">
		<div
			class="absolute inset-0 flex h-full w-full flex-col gap-2 p-3 transition-opacity duration-300
			{SidebarState.isOpen ? 'pointer-events-none opacity-0' : 'opacity-100 delay-100'}"
			aria-hidden={SidebarState.isOpen}
		>
			<div class="h-min w-full">
				{#if Config.sede}
					<div in:fly={{ y: -40 }} class="flex h-min w-full flex-row flex-wrap gap-2">
						<SidebarButton
							text="Añadir ramo"
							onclick={() => SidebarState.open(RamoWindow)}
							Icon={Add}
							class="justify-center!"
						/>

						<SidebarActionsMenu />

						<Separator />

						{#if !Calendario.visible}
							<div class="flex flex-1 flex-col gap-[inherit]">
								<SidebarButton
									text="Horarios guardados"
									onclick={() => SidebarState.open(SavedHorariosWindow)}
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
					</div>
				{/if}
			</div>

			<div class="flex h-full w-full flex-col-reverse gap-1 overflow-hidden">
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
					<button
						type="button"
						class="decoration-foreground/50 mt-1 cursor-pointer underline decoration-dashed opacity-50 hover:decoration-solid hover:opacity-100"
						onclick={ContactState.open}
					>
						<MaterialSymbolsFeedback class="mr-1 inline" />
						Contacto
					</button>
				{/await}
			</div>
		</div>

		{#if SidebarState.activeWindow}
			{@const Window = SidebarState.activeWindow}
			<div
				class="bg-sidebar-accent text-sidebar-accent-foreground absolute top-0 left-0 z-10 flex h-full w-full min-w-full flex-col items-end gap-2 p-4"
				transition:fly={{ x: '-100%', opacity: 1, easing: circOut, duration: 300 }}
			>
				<Button
					class="aspect-square h-min w-auto bg-destructive/50! hover:bg-destructive/80!"
					variant="outlined"
					disabled={SidebarState.isLocked}
					onclick={() => {
						SidebarState.close();
						Calendario.ramoPreview = undefined;
					}}
				>
					<Add class="scale-150 rotate-45" />
				</Button>

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
			padding: 0;
		}

		50% {
			opacity: 1;
		}
	}
</style>
