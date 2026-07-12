import { getContext, setContext } from 'svelte';

export type FormResult<T, E = Record<string, string>> =
    | { success: true; data: T }
    | { success: false; errors: E };

export interface FormSubmissionHandler<T> {
    (data: T): Promise<FormResult<unknown>>;
}

const FORM_CONTEXT_KEY = Symbol('FORM_CONTEXT_KEY');
// Dedicated context key for field-level scope resolution (Shadcn pattern)
const FORM_FIELD_CONTEXT_KEY = Symbol('FORM_FIELD_CONTEXT_KEY');

/**
 * Manages form runtime state, handling dynamic field registration, 
 * strict-typed mutations, and submission lifecycles.
 */
export class FormStateManager<T extends Record<string, any> = Record<string, any>> {
    #initialState: T;
    #values = $state<Partial<T>>({});
    #errors = $state<Partial<Record<keyof T, string>>>({});
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
     * Updates a specific field value ensuring strict type safety matching the schema.
     */
    setFieldValue<K extends keyof T>(key: K, value: T[K]): void {
        this.#values[key] = value;
        // Clear error on change to provide immediate positive feedback
        if (this.#errors[key]) {
            delete this.#errors[key];
        }
    }

    /**
     * Retrieves the current error string for a specific field identifier.
     */
    getFieldError<K extends keyof T>(key: K): string | undefined {
        return this.#errors[key];
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
                this.#errors = result.errors as Partial<Record<keyof T, string>>;
            }
        } catch (error) {
            this.#errors = { _form: error instanceof Error ? error.message : 'Unknown execution error' } as any;
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
    if (!context) throw new Error('Must be used within a Form.Root boundary');
    return context;
}

/**
 * Registers a specific field ID within the Svelte context tree.
 * Allows nested components (Label, Description, Message, Input) to implicitly know their target field.
 */
export function setFieldContext(name: string): void {
    setContext(FORM_FIELD_CONTEXT_KEY, name);
}

export function getFieldContext(): string {
    const context = getContext<string>(FORM_FIELD_CONTEXT_KEY);
    if (!context) throw new Error('Must be used within a Form.Field boundary');
    return context;
}