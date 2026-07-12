import FormRoot from './.FormRoot.svelte';
import FormSubmit from './.FormSubmit.svelte';
import FormField from './.FormField.svelte';
import FormMessage from './.FormMessage.svelte';

export * from './state.svelte';

export const Form = {
    Root: FormRoot,
    Submit: FormSubmit,
    Field: FormField,
    Message: FormMessage
};

export default Form;