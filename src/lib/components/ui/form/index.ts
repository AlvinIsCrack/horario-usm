import FormRoot from './.FormRoot.svelte';
import FormSubmit from './.FormSubmit.svelte';

export * from './state.svelte';

export const Form = {
    Root: FormRoot,
    Submit: FormSubmit
};

export default Form;