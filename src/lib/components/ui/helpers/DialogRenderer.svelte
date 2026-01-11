<script module>
	import { tick } from 'svelte';

	// Tipos extraídos
	export type DialogOptions = {
		title: string;
		body?: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'primary' | 'destructive';
		placeholder?: string;
		value?: string;
	};

	type DialogMode = 'confirm' | 'input';

	type DialogInstance = {
		id: string;
		mode: DialogMode;
		options: DialogOptions;
		inputValue: string;
		open: boolean; // <--- Nuevo campo para controlar animación
		resolve: (value: any) => void;
	};

	// Estado global reactivo (Pila de diálogos)
	let dialogs = $state<DialogInstance[]>([]);

	// Objeto público para invocar diálogos
	export const Dialog = {
		confirm: (opts: DialogOptions) => {
			return new Promise<boolean>((resolve) => {
				addDialog('confirm', opts, resolve);
			});
		},
		input: (opts: DialogOptions) => {
			return new Promise<string | null>((resolve) => {
				addDialog('input', opts, resolve);
			});
		},
		closeAll: () => {
			// Forzamos cierre con animación si es posible, o vaciamos
			dialogs.forEach((d) => (d.open = false));
			setTimeout(() => {
				dialogs = [];
			}, 200);
		}
	};

	// Función interna para añadir a la pila
	function addDialog(mode: DialogMode, opts: DialogOptions, resolve: (value: any) => void) {
		const id = crypto.randomUUID();
		const newDialog: DialogInstance = {
			id,
			mode,
			inputValue: opts.value ?? '',
			open: false, // <--- Inicia cerrado para permitir transición de entrada
			options: {
				confirmText: 'Aceptar',
				cancelText: 'Cancelar',
				variant: 'primary',
				...opts
			},
			resolve
		};

		dialogs.push(newDialog);

		// <--- Activamos la animación en el siguiente tick
		tick().then(() => {
			const d = dialogs.find((x) => x.id === id);
			if (d) d.open = true;
		});
	}

	// Función interna para cerrar y resolver promesa
	function closeDialog(id: string, result: any) {
		const index = dialogs.findIndex((d) => d.id === id);
		if (index !== -1) {
			const dialog = dialogs[index];
			dialog.open = false; // <--- Dispara transición de salida

			// <--- Esperamos a que termine la animación (150ms en Dialog.svelte + buffer)
			setTimeout(() => {
				// Re-buscamos por si el índice cambió
				const idx = dialogs.findIndex((d) => d.id === id);
				if (idx !== -1) {
					dialogs[idx].resolve(result);
					dialogs.splice(idx, 1);
				}
			}, 200);
		}
	}
</script>

<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { tv } from 'tailwind-variants';
	import DialogComponent from '../Dialog.svelte';

	// Estilos internos para diálogos estándar
	const titleStyle = tv({ base: 'text-lg font-semibold leading-snug' });
	const descriptionStyle = tv({ base: 'text-sm text-muted-foreground' });
	const inputStyle = tv({
		base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
	});

	function handleConfirm(dialog: DialogInstance) {
		const result = dialog.mode === 'input' ? dialog.inputValue : true;
		closeDialog(dialog.id, result);
	}

	function handleCancel(dialog: DialogInstance) {
		const result = dialog.mode === 'input' ? null : false;
		closeDialog(dialog.id, result);
	}

	function focusInput(el: HTMLInputElement) {
		// Pequeño delay para asegurar que el input esté renderizado y visible
		setTimeout(() => el.focus(), 50);
	}
</script>

{#each dialogs as dialog (dialog.id)}
	<DialogComponent open={dialog.open} onclose={() => handleCancel(dialog)} class="gap-4 p-6">
		<div class="flex flex-col space-y-1.5 text-center sm:text-left">
			<h2 class={titleStyle()}>
				{dialog.options.title}
			</h2>
			{#if dialog.options.body}
				<p class={descriptionStyle()}>
					{dialog.options.body}
				</p>
			{/if}
		</div>

		{#if dialog.mode === 'input'}
			<div class="py-2">
				<input
					class={inputStyle()}
					type="text"
					placeholder={dialog.options.placeholder}
					bind:value={dialog.inputValue}
					use:focusInput
					onkeydown={(e) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							handleConfirm(dialog);
						}
					}}
				/>
			</div>
		{/if}

		<div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
			<Button variant="secondary" class="mt-2 sm:mt-0" onclick={() => handleCancel(dialog)}>
				{dialog.options.cancelText}
			</Button>
			<Button
				variant={dialog.options.variant}
				onclick={() => handleConfirm(dialog)}
				class="sm:ml-2"
			>
				{dialog.options.confirmText}
			</Button>
		</div>
	</DialogComponent>
{/each}
