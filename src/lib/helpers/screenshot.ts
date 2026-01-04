import { toPng } from 'html-to-image';

export async function exportScheduleAsImage() {
    const node = document.getElementById('calendar-main');

    if (!node) {
        console.error('No se encontró el elemento #calendar-main');
        return;
    }

    try {
        // Obtenemos el color de fondo real de la página para evitar transparencias raras
        const bgColor = getComputedStyle(document.body).backgroundColor || '#0a0a0c';

        const dataUrl = await toPng(node, {
            cacheBust: true,
            pixelRatio: 2, // Mejor resolución (Retina)
            backgroundColor: bgColor,
            style: {
                // Ajustes opcionales para asegurar que se vea bien en la exportación
                transform: 'scale(1)',
                height: '100%',
                width: '100%'
            }
        });

        const link = document.createElement('a');
        link.download = `horario-usm-${new Date().getTime()}.png`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error('Error al exportar imagen:', error);
        alert('Hubo un error al generar la imagen. Revisa la consola para más detalles.');
    }
}