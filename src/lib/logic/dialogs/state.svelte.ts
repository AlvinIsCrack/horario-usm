class DialogState {
    isOpen = $state(false);

    open = () => {
        this.isOpen = true;
    };

    close = () => {
        this.isOpen = false;
    };

    toggle = () => {
        this.isOpen = !this.isOpen;
    };
}

// Instancias globales (Singletons)
export const ContactState = new DialogState();
export const PromptState = new DialogState();
export const ImageState = new DialogState();