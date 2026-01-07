<script module>
	import { type Snippet } from 'svelte';

	// Definimos los tipos para las opciones
	type DialogOptions = {
		title: string;
		body?: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'primary' | 'destructive';
		// Opciones específicas para input
		placeholder?: string;
		value?: string;
	};

	type DialogMode = 'confirm' | 'input';

	// Estado global del Dialog (Singleton)
	let dialogState = $state({
		isOpen: false,
		mode: 'confirm' as DialogMode,
		inputValue: '',
		options: {
			title: '',
			body: '',
			confirmText: 'Confirmar',
			cancelText: 'Cancelar',
			variant: 'primary',
			placeholder: '',
			value: ''
		} as DialogOptions,
		// El resolver puede devolver boolean (confirm) o string|null (input)
		resolver: null as ((value: any) => void) | null
	});

	export const Dialog = {
		/**
		 * Abre un diálogo de confirmación.
		 * Retorna true si se confirma, false si se cancela.
		 */
		confirm: (opts: DialogOptions) => {
			resetAndOpen('confirm', opts);
			return new Promise<boolean>((resolve) => {
				dialogState.resolver = resolve;
			});
		},

		/**
		 * Abre un diálogo con un campo de texto.
		 * Retorna el string escrito si se confirma, o null si se cancela.
		 */
		input: (opts: DialogOptions) => {
			resetAndOpen('input', opts);
			return new Promise<string | null>((resolve) => {
				dialogState.resolver = resolve;
			});
		},

		close: () => closeDialog(false)
	};

	function resetAndOpen(mode: DialogMode, opts: DialogOptions) {
		if (dialogState.isOpen && dialogState.resolver) {
			// Si había uno abierto, lo cancelamos
			dialogState.resolver(mode === 'confirm' ? false : null);
		}

		dialogState.mode = mode;
		dialogState.inputValue = opts.value ?? ''; // Valor inicial
		dialogState.options = {
			confirmText: 'Aceptar',
			cancelText: 'Cancelar',
			variant: 'primary',
			placeholder: '',
			...opts
		};
		dialogState.isOpen = true;
	}

	function closeDialog(isConfirmed: boolean) {
		dialogState.isOpen = false;
		if (dialogState.resolver) {
			if (isConfirmed) {
				// Si es confirm, devuelve true. Si es input, devuelve el texto.
				const result = dialogState.mode === 'input' ? dialogState.inputValue : true;
				dialogState.resolver(result);
			} else {
				// Si cancela: false para confirm, null para input
				const result = dialogState.mode === 'input' ? null : false;
				dialogState.resolver(result);
			}
			dialogState.resolver = null;
		}
	}
</script>

<script lang="ts">
	import { fade, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { tv } from 'tailwind-variants';
	import Button from '$lib/components/ui/Button.svelte';
	import { portal } from '$lib/helpers/actions';

	// --- Estilos (mismo lenguaje visual que Menu/Tooltip) ---

	const overlayStyle = tv({
		base: 'fixed inset-0 pointer-events-auto z-100 bg-black/50'
	});

	const contentStyle = tv({
		base: 'fixed left-[50%] top-[50%] pointer-events-auto z-101 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border-2 bg-popover p-6 shadow-lg duration-200 rounded-lg overflow-hidden md:w-full'
	});

	const titleStyle = tv({
		base: 'text-lg font-semibold leading-snug'
	});

	const descriptionStyle = tv({
		base: 'text-sm text-muted-foreground'
	});

	const inputStyle = tv({
		base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
	});

	// --- Manejo de Teclado ---
	function handleKeydown(e: KeyboardEvent) {
		if (!dialogState.isOpen) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			closeDialog(false);
		}

		// En modo input, Enter envía el formulario (si no es textarea)
		if (dialogState.mode === 'input' && e.key === 'Enter') {
			e.preventDefault();
			closeDialog(true);
		}
	}

	function focusInput(el: HTMLInputElement) {
		el.focus();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if dialogState.isOpen}
	<div
		use:portal
		transition:fade={{ duration: 150 }}
		class={overlayStyle()}
		onclick={() => closeDialog(false)}
		role="button"
		tabindex="-1"
		aria-hidden="true"
	></div>

	<div
		use:portal
		transition:scale={{ start: 0.95, duration: 150, easing: cubicOut }}
		class={contentStyle()}
		role="alertdialog"
		aria-modal="true"
	>
		<div class="flex flex-col space-y-1.5 text-center sm:text-left">
			<h2 class={titleStyle()}>
				{dialogState.options.title}
			</h2>
			{#if dialogState.options.body}
				<p class={descriptionStyle()}>
					{dialogState.options.body}
				</p>
			{/if}
		</div>

		{#if dialogState.mode === 'input'}
			<div class="py-2">
				<input
					class={inputStyle()}
					type="text"
					placeholder={dialogState.options.placeholder}
					bind:value={dialogState.inputValue}
					use:focusInput
				/>
			</div>
		{/if}

		<div class="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
			<Button variant="secondary" class="mt-2 sm:mt-0" onclick={() => closeDialog(false)}>
				{dialogState.options.cancelText}
			</Button>
			<Button
				variant={dialogState.options.variant}
				onclick={() => closeDialog(true)}
				class="sm:ml-2"
			>
				{dialogState.options.confirmText}
			</Button>
		</div>
	</div>
{/if}
