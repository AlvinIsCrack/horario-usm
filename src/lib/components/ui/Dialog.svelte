<script module>
	import { type Snippet } from 'svelte';

	// Definimos los tipos para las opciones
	type DialogOptions = {
		title: string;
		body?: string;
		confirmText?: string;
		cancelText?: string;
		variant?: 'primary' | 'destructive';
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
		resolver: null as ((value: any) => void) | null
	});

	export const Dialog = {
		confirm: (opts: DialogOptions) => {
			resetAndOpen('confirm', opts);
			return new Promise<boolean>((resolve) => {
				dialogState.resolver = resolve;
			});
		},
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
			dialogState.resolver(mode === 'confirm' ? false : null);
		}
		dialogState.mode = mode;
		dialogState.inputValue = opts.value ?? '';
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
				const result = dialogState.mode === 'input' ? dialogState.inputValue : true;
				dialogState.resolver(result);
			} else {
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

	let {
		open = $bindable(false),
		class: _class = '',
		children
	}: {
		open?: boolean;
		class?: string;
		children?: Snippet;
	} = $props();

	// --- Estilos ---
	const overlayStyle = tv({
		base: 'fixed inset-0 pointer-events-auto z-[100] bg-black/60'
	});

	const contentStyle = tv({
		base: 'fixed left-[50%] top-[50%] pointer-events-auto z-[101] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] border bg-background shadow-lg duration-200 rounded-xl overflow-hidden md:w-full'
	});

	// Estilos internos solo para el modo Manager
	const managerPadding = 'p-6 gap-4';

	const titleStyle = tv({ base: 'text-lg font-semibold leading-snug' });
	const descriptionStyle = tv({ base: 'text-sm text-muted-foreground' });
	const inputStyle = tv({
		base: 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
	});

	// --- Lógica Combinada ---
	// Si hay children, usamos 'open' local. Si no, usamos 'dialogState.isOpen'.
	const isVisible = $derived(children ? open : dialogState.isOpen);

	function handleClose(confirmed = false) {
		if (children) {
			open = false;
		} else {
			closeDialog(confirmed);
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (!isVisible) return;

		if (e.key === 'Escape') {
			e.preventDefault();
			handleClose(false);
		}

		if (!children && dialogState.mode === 'input' && e.key === 'Enter') {
			e.preventDefault();
			handleClose(true);
		}
	}

	function focusInput(el: HTMLInputElement) {
		el.focus();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isVisible}
	<div
		use:portal
		transition:fade={{ duration: 150 }}
		class={overlayStyle()}
		onclick={() => handleClose(false)}
		role="button"
		tabindex="-1"
		aria-hidden="true"
	></div>

	<div
		use:portal
		transition:scale={{ start: 0.95, duration: 150, easing: cubicOut }}
		class="{contentStyle()} {children ? _class : managerPadding}"
		role="alertdialog"
		aria-modal="true"
		onclick={(e) => e.stopPropagation()}
	>
		{#if children}
			{@render children()}
		{:else}
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
				<Button variant="secondary" class="mt-2 sm:mt-0" onclick={() => handleClose(false)}>
					{dialogState.options.cancelText}
				</Button>
				<Button
					variant={dialogState.options.variant}
					onclick={() => handleClose(true)}
					class="sm:ml-2"
				>
					{dialogState.options.confirmText}
				</Button>
			</div>
		{/if}
	</div>
{/if}
