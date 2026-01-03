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

export function portal(node: HTMLElement) {
    const target = document.querySelector('#tooltip-portal');

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