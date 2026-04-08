export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    id: string;
    title?: string;
    description?: string;
    type: ToastType;
    duration: number;
    createdAt: number;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export type ToastOptions = Partial<Pick<ToastProps, 'id' | 'description' | 'duration' | 'action'>>;

class ToastState {
    toasts = $state<ToastProps[]>([]);
    // NUEVO: Mapa para gestionar timeouts y evitar condiciones de carrera al actualizar
    private timeouts = new Map<string, ReturnType<typeof setTimeout>>();

    add(title: string | { title: string; description?: string }, type: ToastType = 'default', options: Partial<ToastProps> = {}) {
        // Usamos el ID proporcionado o generamos uno nuevo
        const id = options.id ?? crypto.randomUUID();

        const text = typeof title === 'string' ? title : title.title;
        const desc = typeof title === 'object' ? title.description : undefined;

        const newToast: ToastProps = {
            id,
            title: text,
            description: desc,
            type,
            duration: 6000,
            createdAt: Date.now(),
            ...options
        };

        // Verificamos si ya existe
        const existingIdx = this.toasts.findIndex(t => t.id === id);

        // Limpiamos el timeout anterior si existe (para reiniciar el contador de duración)
        if (this.timeouts.has(id)) {
            clearTimeout(this.timeouts.get(id));
            this.timeouts.delete(id);
        }

        if (existingIdx !== -1) {
            // ACTUALIZACIÓN: Si existe, reemplazamos el objeto para reactividad
            this.toasts[existingIdx] = newToast;
        } else {
            // NUEVO: Si no existe, lo agregamos
            this.toasts.push(newToast);
        }

        // Configurar auto-dismiss
        if (newToast.duration !== Infinity) {
            const timeout = setTimeout(() => {
                this.dismiss(id);
            }, newToast.duration);
            this.timeouts.set(id, timeout);
        }

        return id;
    }

    dismiss(id: string) {
        this.toasts = this.toasts.filter((t) => t.id !== id);
        // Limpieza de memoria
        if (this.timeouts.has(id)) {
            clearTimeout(this.timeouts.get(id));
            this.timeouts.delete(id);
        }
    }
}

export const toastState = new ToastState();

// API simplificada
export const toast = {
    message: (title: string, opts?: ToastOptions) => toastState.add(title, 'default', opts),
    success: (title: string, opts?: ToastOptions) => toastState.add(title, 'success', opts),
    error: (title: string, opts?: ToastOptions) => toastState.add(title, 'error', opts),
    warning: (title: string, opts?: ToastOptions) => toastState.add(title, 'warning', opts),
    info: (title: string, opts?: ToastOptions) => toastState.add(title, 'info', opts),
    dismiss: (id: string) => toastState.dismiss(id)
};