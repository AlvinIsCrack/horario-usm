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

export type ToastOptions = Partial<Pick<ToastProps, 'description' | 'duration' | 'action'>>;

class ToastState {
    toasts = $state<ToastProps[]>([]);

    add(title: string | { title: string; description?: string }, type: ToastType = 'default', options: Partial<ToastProps> = {}) {
        const id = crypto.randomUUID();
        const text = typeof title === 'string' ? title : title.title;
        const desc = typeof title === 'object' ? title.description : undefined;

        const newToast: ToastProps = {
            id,
            title: text,
            description: desc,
            type,
            duration: 5000,
            createdAt: Date.now(),
            ...options
        };

        this.toasts.push(newToast);

        // Auto-dismiss
        if (newToast.duration !== Infinity) {
            setTimeout(() => {
                this.dismiss(id);
            }, newToast.duration);
        }

        return id;
    }

    dismiss(id: string) {
        this.toasts = this.toasts.filter((t) => t.id !== id);
    }
}

export const toastState = new ToastState();

// API simplificada estilo "toast.success()"
export const toast = {
    message: (title: string, opts?: ToastOptions) => toastState.add(title, 'default', opts),
    success: (title: string, opts?: ToastOptions) => toastState.add(title, 'success', opts),
    error: (title: string, opts?: ToastOptions) => toastState.add(title, 'error', opts),
    warning: (title: string, opts?: ToastOptions) => toastState.add(title, 'warning', opts),
    info: (title: string, opts?: ToastOptions) => toastState.add(title, 'info', opts),
    dismiss: (id: string) => toastState.dismiss(id)
};