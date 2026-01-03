import adapter from '@sveltejs/adapter-static'; // Cambiar de adapter-auto
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

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
			// Si tu repo no es 'tuusuario.github.io' (es decir, es un subproyecto), 
			// pon aquí el nombre del repositorio: /nombre-repo
			base: process.env.NODE_ENV === 'production' ? '/horario-usm' : '',
		}
	}
};

export default config;