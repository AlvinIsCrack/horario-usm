import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					if (id.includes('src/lib/data/') && id.endsWith('.json')) {
						return 'usm-data';
					}
				}
			}
		},
		chunkSizeWarningLimit: 1000,
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
				pure_funcs: ['console.info', 'console.debug', 'console.warn'],
				passes: 3,
				unsafe: true,
			},
			format: {
				comments: false
			},
			mangle: {
				toplevel: true
			}
		}
	}
});
