import { tv } from 'tailwind-variants';

export const scheduleStyles = tv({
    // Definimos las partes (slots) de nuestro componente
    slots: {
        root: 'flex w-[1100px] flex-col gap-6 bg-white p-10 font-sans antialiased',
        header: 'flex items-start justify-between gap-8 pb-2 border-b-2',
        title: 'text-4xl font-black tracking-tight uppercase',
        subtext: 'font-medium tracking-wide uppercase',
        metaText: 'font-mono text-[10px] tracking-wider uppercase',

        // Grilla
        gridContainer: 'grid w-full border-t border-l',
        gridHeader: 'text-center text-base font-bold uppercase border-r border-b py-1',
        blockTime: 'flex w-14 flex-col items-center justify-center border-r border-b p-2 px-3 font-mono text-xs',

        // Celdas
        cell: 'relative min-h-[70px] border-r border-b flex flex-col items-center justify-center p-1.5 text-center',

        // Elementos decorativos (Reutilizables en cards)
        overlay: 'absolute inset-0 opacity-25 mix-blend-multiply',
        badge: 'px-1.5 py-0 text-[10px] font-bold uppercase rounded-sm border',
        dashedBorder: 'border-b border-dashed pb-0.5'
    },
    variants: {
        theme: {
            Papel: {
                root: 'text-slate-900',
                header: 'border-stone-500!',
                subtext: 'text-stone-600',
                gridContainer: 'border-stone-500!',
                gridHeader: 'border-stone-500! bg-black/5',
                blockTime: 'border-stone-500! text-stone-600 bg-black/5',
                cell: 'border-stone-500!',
                overlay: 'opacity-60',
                badge: 'border-stone-500! text-slate-800 bg-slate-100',
                dashedBorder: 'border-stone-500!'
            },
            Pastel: {
                root: 'text-rose-950', // Un fondo muy sutil
                header: 'border-pink-500/50!',
                subtext: 'text-rose-600/80',
                gridContainer: 'border-pink-600/50!',
                gridHeader: 'border-pink-600/50! bg-rose-900/5',
                blockTime: 'border-pink-600/50! text-rose-600/80 bg-rose-900/5',
                cell: 'border-pink-500/50!',
                overlay: 'opacity-30 mix-blend-normal contrast-200 -hue-rotate-15 after:content-[""] after:absolute after:inset-0 after:bg-rose-400/80 after:mix-blend-color',
                badge: 'border-pink-300! text-rose-700 bg-white/80',
                dashedBorder: 'border-pink-500/50!'
            },
            Tinta: {
                root: 'text-black grayscale',
                header: 'border-black!',
                subtext: 'text-black/60',
                gridContainer: 'border-black!',
                gridHeader: 'border-black! bg-gray-300', // Un gris suave para diferenciar headers en impresión
                blockTime: 'border-black! text-black/60 bg-gray-300',
                cell: 'border-black!',
                overlay: 'opacity-60', // Forza escala de grises
                badge: 'border-black! text-black bg-white',
                dashedBorder: 'border-black!'
            }
        }
    },
    defaultVariants: {
        theme: 'Papel'
    }
});