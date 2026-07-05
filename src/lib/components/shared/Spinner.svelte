<script lang="ts">
	import Loader from '$lib/icons/loader.svelte';
	import { tv, type VariantProps } from 'tailwind-variants';

	const snipperVariants = tv({
		base: 'loader-usm animate-spin',
		variants: {
			size: {
				default: 'size-8',
				lg: 'size-12'
			}
		},
		defaultVariants: {
			size: 'default'
		}
	});

	const { size }: VariantProps<typeof snipperVariants> = $props();
</script>

<Loader class={snipperVariants({ size })} />
