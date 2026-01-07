import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// Si el archivo es uno de los JSON grandes de datos, ponlo en un chunk separado
					if (id.includes('src/lib/data/') && id.endsWith('.json')) {
						return 'usm-data';
					}
				}
			}
		},
		// Opcional: Aumentar el límite de aviso si sabes que el JSON es grande y necesario
		chunkSizeWarningLimit: 1000
	}
});
