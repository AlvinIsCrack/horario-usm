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

interface ShrinkwrapOptions {
    preventFlicker?: boolean;
}

export function shrinkwrap(node: HTMLElement, options: ShrinkwrapOptions = {}) {
    const preventFlicker = options.preventFlicker ?? false;

    if (preventFlicker) {
        node.style.visibility = 'hidden';
    }

    const adjustWidth = () => {
        node.style.width = '';

        const range = document.createRange();
        range.selectNodeContents(node);
        const rect = range.getBoundingClientRect();

        if (rect.width > 0) {
            node.style.width = `${Math.ceil(rect.width) + 1}px`;
        }

        if (preventFlicker) {
            node.style.visibility = '';
        }
    };

    requestAnimationFrame(adjustWidth);
    const resizeObserver = new ResizeObserver(() => requestAnimationFrame(adjustWidth));
    if (node.parentElement) {
        resizeObserver.observe(node.parentElement);
    }

    return {
        destroy() {
            resizeObserver.disconnect();
        }
    };
}