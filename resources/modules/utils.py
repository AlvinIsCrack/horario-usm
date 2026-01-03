import os
import json
import time
import datetime

# --- Constantes ---
DIAS = {
    "Lunes": 0, "Martes": 1, "Miércoles": 2, 
    "Jueves": 3, "Viernes": 4, "Sábado": 5, "Domingo": 6,
}

# --- IO Helpers ---
def atomic_write(filepath, data):
    """Escribe un JSON de forma atómica."""
    temp_path = filepath + ".tmp"
    with open(temp_path, "w+", encoding="iso-8859-1") as f:
        f.write(json.dumps(data))
    os.replace(temp_path, filepath)

def ensure_directories(base_dir):
    """Asegura que exista la ruta de datos."""
    data_path = os.path.join(base_dir, "src", "lib", "data")
    if not os.path.exists(data_path):
        # Intentar crearla, aunque si la estructura base falla, esto podría fallar
        pass
    os.makedirs(data_path, exist_ok=True)
    return data_path

# --- Helpers de Tiempo ---
def hhmm_to_minutes(hhmm: str) -> int:
    [h, m] = hhmm.split(":")
    return int(h) * 60 + int(m)

# --- Lógica de Diff ---
def calcular_diff_ramos(ramos_antiguos, ramos_nuevos):
    """Calcula diferencias entre dos estados de ramos."""
    cambios = []
    ahora = datetime.datetime.now()
    timestamp = int(time.mktime(ahora.timetuple()))
    
    for sede, jornadas in ramos_nuevos.items():
        if sede == "date": continue
        for jornada, periodos in jornadas.items():
            for periodo, asignaturas in periodos.items():
                for sigla, paralelos_nuevos in asignaturas.items():
                    
                    paralelos_antiguos = ramos_antiguos.get(sede, {}).get(jornada, {}).get(periodo, {}).get(sigla, {})
                    
                    ids_nuevos = set(paralelos_nuevos.keys())
                    ids_antiguos = set(paralelos_antiguos.keys())

                    # Nuevos
                    for par_cod in (ids_nuevos - ids_antiguos):
                        datos = paralelos_nuevos[par_cod]
                        cambios.append({
                            "tipo": "NUEVO_PARALELO",
                            "asignatura": datos['nombre'],
                            "sigla": sigla,
                            "paralelo": par_cod,
                            "detalle": "Nueva sección abierta."
                        })

                    # Eliminados
                    for par_cod in (ids_antiguos - ids_nuevos):
                        datos_old = paralelos_antiguos[par_cod] 
                        cambios.append({
                            "tipo": "ELIMINADO_PARALELO",
                            "asignatura": datos_old['nombre'],
                            "sigla": sigla,
                            "paralelo": par_cod,
                            "detalle": "Sección cerrada o eliminada."
                        })

                    # Modificados
                    for par_cod in (ids_nuevos & ids_antiguos):
                        datos_new = paralelos_nuevos[par_cod]
                        datos_old = paralelos_antiguos[par_cod]

                        if datos_new['cupo'] != datos_old['cupo']:
                            diff = datos_new['cupo'] - datos_old['cupo']
                            cambios.append({
                                "tipo": "CAMBIO_CUPO",
                                "asignatura": datos_new['nombre'],
                                "sigla": sigla,
                                "paralelo": par_cod,
                                "anterior": datos_old['cupo'],
                                "nuevo": datos_new['cupo'],
                                "diff": diff,
                                "detalle": f"Cupos: {datos_old['cupo']} -> {datos_new['cupo']}"
                            })

                        if datos_new['horario'] != datos_old['horario']:
                            cambios.append({
                                "tipo": "AJUSTE_HORARIO",
                                "asignatura": datos_new['nombre'],
                                "sigla": sigla,
                                "paralelo": par_cod,
                                "detalle": "Horario modificado."
                            })

    if not cambios: return None
        
    return {
        "timestamp": timestamp,
        "fecha_grupo": ahora.strftime("%Y-%m-%d"),
        "hora_registro": ahora.strftime("%H:%M"),
        "total_cambios": len(cambios),
        "cambios": cambios
    }