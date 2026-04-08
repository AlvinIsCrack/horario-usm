import { tv } from 'tailwind-variants';

export const nodeStyles = tv({
    slots: {
        base: 'absolute cursor-default! flex w-[200px]! flex-col rounded-md border shadow-sm/50! transition-all duration-500 select-none overflow-hidden font-sans',
        header: 'flex h-8 shrink-0 items-center justify-between px-3 text-base font-bold tracking-wider text-white uppercase border-b transition-colors duration-500',
        body: 'relative flex flex-col gap-0 py-2 transition-colors duration-500',
        row: 'relative flex h-8 items-center justify-between px-5 hover:bg-white/5 transition-colors',
        label: 'text-xs font-medium text-wrap max-w-[120px] transition-colors',

        // MEJORA: Value ahora es más flexible
        value: 'font-mono text-xl font-bold tabular-nums text-white',

        // NUEVO: Badge para estados lógicos (True/False, Pass/Fail)
        badge: 'px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide shadow-sm border',

        handleInput: 'absolute -left-[7px]! top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 transition-all duration-300 hover:scale-125 z-50',
        handleOutput: 'absolute -right-[7px]! top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 transition-all duration-300 hover:scale-125 z-50'
    },
    variants: {
        category: {
            input: {
                base: 'bg-zinc-900 border-emerald-800/30',
                header: 'bg-emerald-900/40 border-emerald-800/50 text-emerald-100/60',
                label: 'text-emerald-100/40',
                handleInput: 'bg-zinc-950 border-emerald-800/50',
                handleOutput: 'bg-zinc-950 border-emerald-800/50'
            },
            math: {
                base: 'bg-zinc-900 border-blue-800/30',
                header: 'bg-blue-900/40 border-blue-800/50 text-blue-100/60',
                label: 'text-blue-100/40',
                handleInput: 'bg-zinc-950 border-blue-800/50',
                handleOutput: 'bg-zinc-950 border-blue-800/50'
            },
            logic: {
                base: 'bg-zinc-900 border-purple-800/30',
                header: 'bg-purple-900/40 border-purple-800/50 text-purple-100/60',
                label: 'text-purple-100/40',
                handleInput: 'bg-zinc-950 border-purple-800/50',
                handleOutput: 'bg-zinc-950 border-purple-800/50'
            },
            flow: {
                base: 'bg-zinc-900 border-pink-800/30',
                header: 'bg-pink-900/40 border-pink-800/50 text-pink-100/60',
                label: 'text-pink-100/40',
                handleInput: 'bg-zinc-950 border-pink-800/50',
                handleOutput: 'bg-zinc-950 border-pink-800/50'
            },
            usm: {
                base: 'bg-zinc-900 border-amber-800/30',
                header: 'bg-amber-900/40 border-amber-800/50 text-amber-100/60',
                label: 'text-amber-100/40',
                handleInput: 'bg-zinc-950 border-amber-800/50',
                handleOutput: 'bg-zinc-950 border-amber-800/50'
            }
        },
        status: {
            idle: { base: 'opacity-80' },
            active: { base: 'opacity-100 ring-1 ring-white/20 shadow-md/50!' },
            computed: { base: 'opacity-100' },
            error: {
                base: 'border-red-500 ring-1 ring-red-500 opacity-100',
                header: 'bg-red-900/50'
            }
        },
        // Variantes para los Badges lógicos
        badgeState: {
            success: { badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30!' },
            failure: { badge: 'bg-red-500/20 text-red-400 border-red-500/30!' },
            neutral: { badge: 'bg-zinc-700/50 text-zinc-300 border-zinc-600!' },
            warning: { badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30!' }
        }
    },
    compoundVariants: [
        {
            category: 'input', status: 'active', class: {
                base: 'border-lime-500! bg-card',
                header: 'bg-lime-600 text-white border-lime-500!',
                label: 'text-lime-100',
                handleInput: 'border-lime-400! bg-lime-950',
                handleOutput: 'border-lime-400! bg-lime-950'
            }
        },
        {
            category: 'math', status: 'active', class: {
                base: 'border-blue-500! bg-card',
                header: 'bg-blue-600 text-white border-blue-500!',
                label: 'text-blue-100',
                handleInput: 'border-blue-400! bg-blue-950',
                handleOutput: 'border-blue-400! bg-blue-950'
            }
        },
        {
            category: 'logic', status: 'active', class: {
                base: 'border-purple-500! bg-card',
                header: 'bg-purple-600! text-white border-purple-500',
                label: 'text-purple-100',
                handleInput: 'border-purple-400! bg-purple-950',
                handleOutput: 'border-purple-400! bg-purple-950'
            }
        },
        {
            category: 'flow', status: 'active', class: {
                base: 'border-pink-500! bg-card',
                header: 'bg-pink-600 text-white border-pink-500!',
                label: 'text-pink-100',
                handleInput: 'border-pink-400! bg-pink-950',
                handleOutput: 'border-pink-400! bg-pink-950'
            }
        },
        {
            category: 'usm', status: 'active', class: {
                base: 'border-amber-600! bg-card',
                header: 'bg-amber-600 text-white border-amber-500!',
                label: 'text-amber-100',
                handleInput: 'border-amber-400! bg-amber-950',
                handleOutput: 'border-amber-400! bg-amber-950'
            }
        },
    ],
    defaultVariants: {
        category: 'math',
        status: 'idle',
        badgeState: 'neutral'
    }
});

export const simpleNodeStyles = tv({
    slots: {
        // Base común para nodos "Caja" (Standard)
        base: 'absolute cursor-default! flex flex-col items-center justify-center rounded-lg shadow-sm transition-all duration-500 select-none overflow-hidden font-sans border',
        // Base para nodos "Círculo" (Utility/Notifier)
        circle: 'absolute cursor-default! flex items-center justify-center rounded-full shadow-md transition-all duration-500 select-none border [&_svg]:scale-150',

        label: 'px-2 text-[10px] font-bold uppercase text-center truncate w-full opacity-70',
        value: 'text-2xl font-bold tracking-tighter tabular-nums',
        icon: 'text-white/80' // Para nodos circulares
    },
    variants: {
        category: {
            input: {
                base: 'bg-green-950 border-green-500/30! text-green-100',
                circle: 'bg-green-600 border-green-400! text-white h-10 w-10',
                value: 'text-green-400'
            },
            math: {
                base: 'bg-blue-950 border-blue-500/30! text-blue-100',
                circle: 'bg-blue-600 border-blue-400! text-white h-10 w-10',
                value: 'text-blue-400'
            },
            logic: {
                base: 'bg-purple-950 border-purple-500/30! text-purple-100',
                circle: 'bg-purple-600 border-purple-400! text-white h-10 w-10',
                value: 'text-purple-400'
            },
            flow: {
                base: 'bg-pink-950 border-pink-500/30! text-pink-100',
                circle: 'bg-pink-600 border-pink-400! text-white h-10 w-10',
                value: 'text-pink-400'
            },
            usm: {
                base: 'bg-amber-950 border-amber-500/30! text-amber-100',
                circle: 'bg-amber-600 border-amber-400! text-white h-10 w-10',
                value: 'text-amber-400'
            }
        },
        status: {
            idle: { base: 'opacity-60 grayscale-75', circle: 'opacity-60 grayscale' },
            active: {
                base: 'opacity-100 grayscale-0 ring-1 ring-white/30 shadow-md!',
                circle: 'opacity-100 shadow-sm/50!'
            }
        }
    },
    defaultVariants: {
        category: 'math',
        status: 'idle'
    }
});

export const connectionStyles = tv({
    base: 'fill-none stroke-2 transition-all duration-700 pointer-events-none',
    variants: {
        state: {
            idle: 'stroke-slate-800 stroke-[1px] opacity-40',
            active: 'stroke-white stroke-[2px] opacity-80',
            computed: 'stroke-white stroke-[2px]'
        }
    }
});