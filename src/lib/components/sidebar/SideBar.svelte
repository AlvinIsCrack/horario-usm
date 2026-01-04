<script lang="ts" module>
	import Add from '$lib/icons/add.svelte';
	import { circOut } from 'svelte/easing';
	import RamoWindow from './windows/RamoWindow.svelte';
	import { fade, fly } from 'svelte/transition';
	import Button from '$lib/components/ui/Button.svelte';
	import { Calendario } from '$lib/states/calendario.svelte';
	import Trash from '$lib/icons/trash.svelte';
	import Save from '$lib/icons/save.svelte';
	import Load from '$lib/icons/load.svelte';
	import Tooltip from '$lib/components/ui/Tooltip.svelte';
	import Separator from '$lib/components/ui/Separator.svelte';
	import { tick } from 'svelte';
	import SavedHorariosWindow from './windows/SavedHorariosWindow.svelte';
	import Horario from '$lib/icons/horario.svelte';
	import Time from '$lib/helpers/time';

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
							<Button
								class="flex-1 text-nowrap"
								onclick={() => SideBar.setActiveWindow(RamoWindow, {})}
							>
								<Add class="inline scale-125" /> Añadir ramo
							</Button>
							<Tooltip content="Guardar horario">
								<Button
									variant="ghost"
									size="icon"
									disabled={!Calendario.ramos.length}
									onclick={() => {
										const key = prompt(
											'¿Cómo se va a llamar el horario? (debe ser único)',
											new Date().toLocaleDateString('es-ES', {
												year: 'numeric',
												month: '2-digit',
												day: '2-digit',
												hour: '2-digit',
												minute: '2-digit'
											})
										);
										if (key) Calendario.save(key);
									}}
								>
									<Save />
								</Button>
							</Tooltip>
							<Tooltip content="Limpiar todo">
								<Button
									size="icon"
									disabled={!Calendario.ramos.length}
									variant="ghost"
									onclick={() =>
										confirm('¿Estás seguro? Esta acción va a borrar TODOS los ramos inscritos.') &&
										Calendario.clear()}
								>
									<Trash />
								</Button>
							</Tooltip>

							<Separator />
							{#if !Calendario.visible}
								<Button
									variant="secondary"
									class="w-full text-nowrap"
									onclick={() => (activeWindow = SavedHorariosWindow)}
								>
									<Horario class="inline scale-125" />
									Horarios guardados
								</Button>
							{/if}
						</div>
					{/if}
				</div>
				<div class="flex h-full w-full flex-col-reverse gap-1">
					{#if Calendario.visible}
						{#await import('../elements/RamosList.svelte') then { default: RamosList }}
							<RamosList />
						{/await}
						<Separator />
						{#await import('../elements/Statistics.svelte') then { default: Statistics }}
							<Statistics />
						{/await}
					{:else if Calendario.inicializado}
						{#await import('../elements/SedeSelector.svelte') then { default: SedeSelector }}
							<SedeSelector />
						{/await}
					{/if}
				</div>
				<div class="w-full text-center text-sm">
					<Separator />
					{#await import("$lib/components/elements/Me.svelte") then { default: Me }}
						<Me />
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
	@import 'tailwindcss';

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
