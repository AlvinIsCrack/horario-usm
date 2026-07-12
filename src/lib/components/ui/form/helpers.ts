import type { FormStateManager } from './state.svelte';

/**
 * Validates whether a specific form field has been actively populated.
 * Handles null, undefined, empty strings, and empty arrays safely.
 * * @param manager Form state manager instance
 * @param key Target field identifier
 * @returns Boolean indicating if the field contains valid input
 */
export function isFieldAnswered<T extends Record<string, any>>(
    manager: FormStateManager<T>,
    key: keyof T
): boolean {
    const val = manager.values[key];
    if (val === undefined || val === null) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
}

/**
 * Validates if an entire group of fields has been populated.
 * Useful for multidimensional taxonomy blocks or compound requirements.
 */
export function areFieldsAnswered<T extends Record<string, any>>(
    manager: FormStateManager<T>,
    keys: (keyof T)[]
): boolean {
    return keys.every((key) => isFieldAnswered(manager, key));
}

/**
 * Creates a reactive dependency chain evaluator for complex survey branching.
 * Encapsulates the logic of checking multiple conditional prerequisites.
 */
export class BranchEvaluator<T extends Record<string, any>> {
    #manager: FormStateManager<T>;

    constructor(manager: FormStateManager<T>) {
        this.#manager = manager;
    }

    /**
     * Determines if a branch should be visible based on a specific parent value match.
     */
    dependsOnEquals(parentKey: keyof T, expectedValue: any): boolean {
        return this.#manager.values[parentKey] === expectedValue;
    }

    /**
     * Determines if a branch should be visible simply if the parent has any valid answer.
     */
    dependsOnAnswered(parentKey: keyof T): boolean {
        return isFieldAnswered(this.#manager, parentKey);
    }
}