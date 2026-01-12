export function clickOutside(node: HTMLElement, handler: () => void) {
    const handleClick = (event: MouseEvent) => {
        if (node && !node.contains(event.target as Node)) {
            handler();
        }
    };

    document.addEventListener('click', handleClick, true);

    return {
        destroy() {
            document.removeEventListener('click', handleClick, true);
        }
    };
}

export function portal(node: HTMLElement, id: string = "tooltip-portal") {
    const target = document.querySelector('#' + id);

    if (target) {
        target.appendChild(node);
    }

    return {
        destroy() {
            if (node && target && target.contains(node)) {
                target.removeChild(node);
            }
        }
    };
}