import adapter from '@sveltejs/adapter-static'; // Cambiar de adapter-auto
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html', // Necesario para SPA en GitHub Pages
			precompress: false,
			strict: true
		}),
		paths: {
			base: dev ? '' : '/horario-usm',
		}
	}
};

export default config;