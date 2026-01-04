<script lang="ts">
	// Importamos el contenido como texto plano usando ?raw
	// Ajusta la ruta si tu carpeta src/lib/data está en otro nivel
	import jsonlContent from '$lib/data/historial_cambios.jsonl?raw';

	// Estado para almacenar el historial parseado
	let historial: any[] = $state([]);

	// Lógica de inicialización (se ejecuta al montar o construir)
	// 1. Limpiamos espacios en blanco al inicio/final
	// 2. Separamos por saltos de línea (\n)
	// 3. Filtramos líneas vacías
	// 4. Parseamos cada línea como objeto JSON
	// 5. Invertimos el orden para ver lo más reciente primero
	try {
		historial = jsonlContent
			.trim()
			.split('\n')
			.filter((line) => line.trim() !== '')
			.map((line) => JSON.parse(line))
			.reverse();
	} catch (error) {
		console.error('Error parseando el historial JSONL:', error);
	}
</script>

<section>
	<h2>Registro de Cambios</h2>

	{#if historial.length === 0}
		<p>No se encontraron registros de cambios.</p>
	{:else}
		{#each historial as grupo (grupo.timestamp)}
			<div class="grupo-cambio">
				<header>
					<strong>Fecha:</strong>
					{grupo.fecha_grupo} |
					<strong>Hora:</strong>
					{grupo.hora_registro} |
					<strong>Total cambios:</strong>
					{grupo.total_cambios}
				</header>

				<ul>
					{#each grupo.cambios as cambio, index}
						<li>
							<span class="etiqueta">[{cambio.tipo}]</span>

							<strong>{cambio.asignatura}</strong>
							<small>({cambio.sigla})</small>
							- Paralelo {cambio.paralelo}

							<p>{cambio.detalle}</p>

							{#if cambio.tipo === 'CAMBIO_CUPO'}
								<div class="info-cupo">
									Cupos: {cambio.anterior} ➝ {cambio.nuevo}
									(Dif: {cambio.diff > 0 ? '+' : ''}{cambio.diff})
								</div>
							{/if}
						</li>
					{/each}
				</ul>
			</div>
			<hr />
		{/each}
	{/if}
</section>

<style>
	/* Estilos mínimos para legibilidad básica */
	.grupo-cambio {
		margin-bottom: 2rem;
		font-family: monospace; /* Ayuda a leer datos crudos */
	}

	header {
		background-color: #f0f0f0;
		padding: 0.5rem;
		border-left: 4px solid #333;
	}

	ul {
		list-style-type: none;
		padding-left: 1rem;
	}

	li {
		margin-bottom: 1rem;
		border-bottom: 1px dashed #ccc;
		padding-bottom: 0.5rem;
	}

	.etiqueta {
		font-weight: bold;
		color: #007acc;
	}

	.info-cupo {
		background: #e6fffa;
		display: inline-block;
		padding: 2px 5px;
		font-size: 0.9em;
		border-radius: 4px;
	}
</style>
