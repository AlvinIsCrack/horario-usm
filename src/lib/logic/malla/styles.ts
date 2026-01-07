import { tv } from "tailwind-variants";

export const cardStyles = tv({
    base: 'relative flex hover:cursor-pointer h-26 xl:h-28 2xl:h-30 w-36 xl:w-38 2xl:w-40 p-2 xl:p-3 2xl:p-4 transition-[background-color,border-color,color,box-shadow,filter] duration-500 ease-out select-none border-2 text-left rounded-lg hover:ring-2 ring-0 ring-ring shadow-sm flex-col',
    slots: {
        title: 'my-1 z-10 line-clamp-2 w-full text-wrap text-xs 2xl:text-sm leading-3 xl:leading-4 font-bold',
        credits: 'font-mono text-[10px] xl:text-xs 2xl:text-sm font-semibold opacity-80',
        sigla: 'absolute bottom-1 right-2 xl:bottom-2 xl:right-3 text-[9px] xl:text-[10px] 2xl:text-xs font-black opacity-50 tracking-wider',
    },
    variants: {
        status: {
            disponible: 'bg-card border-border hover:border-primary/50',
            aprobado: 'bg-lime-600 text-background border-lime-300',
            bloqueado: 'bg-primary border-transparent grayscale-25 saturate-120'
        },
        relation: {
            none: 'z-0',
            self: 'z-50 border-white',
            parent: 'ring-4 ring-amber-500 shadow-[0_0_20px_rgba(234,179,8,0.5)] z-50',
            coreq: 'ring-4 ring-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] z-50',
            child: 'ring-4 ring-lime-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] z-50',
            unlock: 'ring-4 ring-white ring-offset-2 shadow-[0_0_20px_rgba(255,255,255,0.5)] z-50'
        }
    },
    defaultVariants: {
        status: 'disponible',
        relation: 'none'
    },
    compoundVariants: [
        {
            status: 'aprobado',
            class: {
                sigla: 'text-background/60',
                credits: 'text-background/40'
            }
        },
        {
            status: 'bloqueado',
            class: {
                sigla: 'text-background/80'
            }
        }
    ]
});