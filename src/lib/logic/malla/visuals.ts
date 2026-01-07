export function getCenter(el: HTMLElement, container: HTMLElement) {
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return {
        x: elRect.left - containerRect.left + elRect.width / 2,
        y: elRect.top - containerRect.top + elRect.height / 2
    };
}

export function generatePath(startX: number, startY: number, endX: number, endY: number): string {
    const distX = endX - startX;
    // Si la distancia es negativa (dibujando de Derecha a Izquierda), invertimos la lógica del offset
    // para que la curva no haga un bucle hacia afuera.
    const isRightToLeft = distX < 0;

    // Calculamos un offset proporcional, pero limitado
    const rawOffset = Math.max(Math.abs(distX) * 0.5, 80);

    // Si vamos de derecha a izquierda, el punto de control 1 debe ir a la izquierda (-), y el 2 a la derecha (+)
    // Si vamos de izquierda a derecha, el punto de control 1 debe ir a la derecha (+), y el 2 a la izquierda (-)
    const controlOffset = isRightToLeft ? -rawOffset : rawOffset;

    return `M ${startX},${startY} C ${startX + controlOffset},${startY} ${endX - controlOffset},${endY} ${endX},${endY}`;
}

export function romanize(num: number): string {
    const lookup: any = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let roman = '', i;
    for (i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
}