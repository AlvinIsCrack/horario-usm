import './extensions';

/**
 * Tokenization strategy blueprint for multi-keyword processing matrices.
 */
export interface SearchMatcherOptions<T> {
    /** Array of extraction functions to resolve search targets dynamically from a entity instance. */
    extractors: ((item: T) => string | null | undefined)[];
    /** Forces exact sub-string lookup coordinates instead of partial multi-token sequence evaluations. */
    exactMatch?: boolean;
}

/**
 * Enterprise-grade string pattern verification engine.
 * Decouples indexing operations and normalizations from Svelte layout lifecycles.
 */
export class SearchMatcher<T> {
    private extractors: ((item: T) => string | null | undefined)[];
    private exactMatch: boolean;

    constructor(options: SearchMatcherOptions<T>) {
        this.extractors = options.extractors;
        this.exactMatch = options.exactMatch ?? false;
    }

    /**
     * Tokenizes a raw lookup string into atomic, de-accented, low-cased components.
     *
     * @param query Raw target condition requested by the user boundary layer.
     * @returns Array of sanitized filter keywords.
     */
    public tokenize(query: string): string[] {
        return query
            .deaccent()
            .toLowerCase()
            .split(/\s+|\*+/g)
            .filter(Boolean);
    }

    /**
     * Evaluates if a given object instance qualifies under the query parameters.
     * Implementing a multi-field intersection logical verification (AND matching rule).
     *
     * @param item The contextual entity subject being queried.
     * @param tokens Prefiltered query parameters matching the text lookup request.
     * @returns Logical validation flag matching structural data constraints.
     */
    public isMatch(item: T, tokens: string[]): boolean {
        if (tokens.length === 0) {
            return true;
        }

        const corporateTargets = this.extractors
            .map((extractor) => extractor(item))
            .filter((text): text is string => typeof text === 'string' && text.length > 0)
            .map((text) => text.deaccent().toLowerCase());

        if (this.exactMatch) {
            const compoundQuery = tokens.join(' ');
            return corporateTargets.some((target) => target.includes(compoundQuery));
        }

        return tokens.every((token) =>
            corporateTargets.some((target) => target.includes(token))
        );
    }

    /**
     * Filters a collection pool down to elements validating all query token coordinates.
     *
     * @param items Source transaction matrix containing raw collections.
     * @param query Query specification string input.
     * @returns Filtered data elements subsets.
     */
    public filter(items: T[], query: string): T[] {
        const tokens = this.tokenize(query);
        if (tokens.length === 0) {
            return items;
        }
        return items.filter((item) => this.isMatch(item, tokens));
    }
}