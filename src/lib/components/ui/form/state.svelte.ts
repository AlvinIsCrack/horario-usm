import { getContext, setContext } from 'svelte';

export type FormResult<T, E = Record<string, string>> =
    | { success: true; data: T }
    | { success: false; errors: E };

export interface FormSubmissionHandler<T> {
    (data: T): Promise<FormResult<unknown>>;
}

const FORM_CONTEXT_KEY = Symbol('FORM_CONTEXT_KEY');

/**
 * Manages form runtime state, handling dynamic field registration and submission lifecycles.
 */
export class FormStateManager<T extends Record<string, any> = Record<string, any>> {
    #initialState: T;
    #values = $state<Record<string, any>>({});
    #errors = $state<Record<string, string>>({});
    #isSubmitting = $state(false);
    #onSubmit: FormSubmissionHandler<T>;

    constructor(initialState: T, onSubmit: FormSubmissionHandler<T>) {
        this.#initialState = { ...initialState };
        this.#values = { ...initialState };
        this.#onSubmit = onSubmit;
    }

    get values() { return this.#values; }
    get errors() { return this.#errors; }
    get isSubmitting() { return this.#isSubmitting; }
    get isValid() { return Object.keys(this.#errors).length === 0; }

    /**
     * Updates a specific field value by its unique identifier.
     * Crucial for dynamic field detection without pre-defined local states.
     */
    setFieldValue(key: string, value: any): void {
        this.#values[key] = value;
    }

    /**
     * Dispatches the internal state payload to the designated submission handler.
     */
    async submit(): Promise<void> {
        if (this.#isSubmitting) return;
        this.#isSubmitting = true;
        this.#errors = {};

        try {
            const result = await this.#onSubmit(this.#values as T);
            if (!result.success) {
                this.#errors = result.errors || { _form: 'Submission failed' };
            }
        } catch (error) {
            this.#errors = { _form: error instanceof Error ? error.message : 'Unknown fatal execution error' };
        } finally {
            this.#isSubmitting = false;
        }
    }

    /**
     * Resets the managed values back to their baseline definition.
     */
    reset(): void {
        this.#values = { ...this.#initialState };
        this.#errors = {};
        this.#isSubmitting = false;
    }
}

export function setFormContext<T extends Record<string, any>>(manager: FormStateManager<T>): void {
    setContext(FORM_CONTEXT_KEY, manager);
}

export function getFormContext<T extends Record<string, any>>(): FormStateManager<T> {
    const context = getContext<FormStateManager<T>>(FORM_CONTEXT_KEY);
    if (!context) {
        throw new Error('Form compound components must be rendered within a Form.Root boundary');
    }
    return context;
}