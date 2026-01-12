import { toPng, toBlob } from 'html-to-image';

export async function captureSchedule(mode: 'download' | 'print' = 'download') {
    const node = document.getElementById('export-schedule-target');

    if (!node) {
        throw new Error('No se encontró el elemento de exportación');
    }

    // Configuración de alta calidad
    const options = {
        quality: 1.0,
        pixelRatio: 2, // Retina quality
        cacheBust: true,
    };

    if (mode === 'download') {
        const dataUrl = await toPng(node, options);
        const link = document.createElement('a');
        link.download = `horario-usm-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
    } else {
        // Modo Impresión: Generamos un Blob y lo abrimos en ventana limpia
        const blob = await toBlob(node, { ...options, backgroundColor: '#ffffff' });
        if (!blob) throw new Error('Error generando impresión');

        const url = URL.createObjectURL(blob);
        const printWindow = window.open(url, '_blank');

        if (printWindow) {
            printWindow.onload = () => {
                printWindow.focus();
                printWindow.print();
                URL.revokeObjectURL(url);
            };
        }
    }
}