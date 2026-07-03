import { type Component, tick } from 'svelte';

type WindowProps = Record<string, any>;

class SidebarManager {
    private _title = $state('');
    private _description = $state('');

    // Estado reactivo
    private _activeWindow = $state<Component | null>(null);
    private _windowProps = $state<WindowProps>({});

    // Bandera para prevenir interacciones durante transiciones
    private _isTransitioning = $state(false);

    // Getters públicos
    get activeWindow() {
        return this._activeWindow;
    }

    get props() {
        return this._windowProps;
    }

    get isOpen() {
        return !!this._activeWindow;
    }

    get isLocked() {
        return this._isTransitioning;
    }

    get title() {
        return this._title;
    }

    get description() {
        return this._description;
    }

    /**
     * Abre una nueva ventana en el sidebar.
     * Si ya hay una abierta, la reemplaza suavemente.
     */
    async open(component: Component, props: WindowProps = {}, params: { title?: string; description?: string; } = {}) {
        if (this._activeWindow === component) return; // Evitar recargas innecesarias

        this._isTransitioning = true;
        this._title = '';
        this._description = '';

        // Si ya había una ventana, esperamos un tick para limpiar el estado anterior si es necesario
        // (aunque Svelte maneja el reemplazo, esto asegura que props se limpien)
        if (this._activeWindow) {
            this._activeWindow = null;
            await tick();
        }

        this._windowProps = props;
        this._activeWindow = component;
        this._title = params?.title ?? '';
        this._description = params?.description ?? '';

        // Liberamos el lock después de un breve delay técnico para permitir montaje
        setTimeout(() => {
            this._isTransitioning = false;
        }, 100);
    }

    /**
     * Cierra la ventana activa y regresa al menú principal.
     */
    close() {
        this._isTransitioning = true;
        this._activeWindow = null;
        this._windowProps = {};

        setTimeout(() => {
            this._isTransitioning = false;
        }, 300); // Sincronizado con la duración de la animación de salida
    }

    /**
     * Fuerza el cierre inmediato sin animaciones (útil para desmontajes o errores)
     */
    reset() {
        this._activeWindow = null;
        this._windowProps = {};
        this._isTransitioning = false;
    }
}

export const SidebarState = new SidebarManager();