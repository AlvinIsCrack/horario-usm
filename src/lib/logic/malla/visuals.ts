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
    const distY = endY - startY;

    // Calculamos la distancia euclidiana real entre los puntos
    const distance = Math.sqrt(distX * distX + distY * distY);

    // Definimos una tensión que no dependa solo de X, para que en cambios 
    // verticales grandes la curva sea amplia y no abrupta.
    // Usamos el 45% de la distancia total con un mínimo de 140px.
    const tension = Math.max(distance * 0.45, 140);

    // Forzamos la salida horizontal pura manteniendo cpY = startY/endY
    // El cpX se aleja lo suficiente para suavizar la transición hacia el centro
    const cp1x = startX + (distX > 0 ? tension : -tension);
    const cp1y = startY;

    const cp2x = endX - (distX > 0 ? tension : -tension);
    const cp2y = endY;

    return `M ${startX},${startY} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${endX},${endY}`;
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