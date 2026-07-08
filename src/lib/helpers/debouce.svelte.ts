/**
 * Creates a reactive debounced state cell compatible with Svelte 5 runes.
 * Abstracts asynchronous delay pipelines for rapid user inputs like search fields.
 *
 * @template T The data type of the underlying state representation.
 * @param initialState The default evaluation metric loaded upon instantiating the hook.
 * @param delayMs Timeout constraint in milliseconds before committing transient modifications.
 * @returns An object containing reactive read-only and tracking states.
 */
export function createDebouncedState<T>(initialState: T, delayMs: number = 200) {
    let currentValue = $state<T>(initialState);
    let debouncedValue = $state<T>(initialState);
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    $effect(() => {
        // Synchronously capture the state to register it as a reactive dependency
        const nextValue = currentValue;

        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }

        timeoutId = setTimeout(() => {
            debouncedValue = nextValue;
        }, delayMs);

        return () => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
        };
    });

    return {
        get current(): T {
            return currentValue;
        },
        set current(value: T) {
            currentValue = value;
        },
        get debounced(): T {
            return debouncedValue;
        },
        /**
         * Synchronously bypasses the scheduling pool to force an immediate value flush.
         */
        flush(): void {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
            debouncedValue = currentValue;
        }
    };
}