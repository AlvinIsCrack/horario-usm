import os
import json
import time
import datetime
import subprocess
import hashlib

# --- Constantes ---
DIAS = {
    "Lunes": 0, "Martes": 1, "Miércoles": 2, 
    "Jueves": 3, "Viernes": 4, "Sábado": 5, "Domingo": 6,
}

# --- IO Helpers ---
def atomic_write(filepath, data, encoding="utf-8"):
    """Escribe un JSON de forma atómica (Wrapper legacy)."""
    # Cambiado default a utf-8
    write_if_modified(filepath, data, encoding=encoding)

def write_if_modified(filepath, data, old_hash=None, encoding="utf-8"):
    """
    Escribe el archivo solo si el contenido (hash) difiere del anterior.
    Retorna: (content_hash, written_boolean)
    """
    # 1. Serialización
    json_content = json.dumps(data, sort_keys=True, ensure_ascii=False)
    content_bytes = json_content.encode(encoding)
    
    # 2. Calcular Hash MD5
    new_hash = hashlib.md5(content_bytes).hexdigest()
    
    # 3. Verificar si debemos escribir
    if old_hash and new_hash == old_hash:
        return new_hash, False

    # 4. Escritura Atómica con encoding correcto
    temp_path = filepath + ".tmp"
    with open(temp_path, "w+", encoding=encoding) as f:
        f.write(json_content)
    os.replace(temp_path, filepath)
    
    return new_hash, True

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

def get_git_revision_short_hash():
    try:
        return subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']).decode('ascii').strip()
    except:
        return "unknown"

# --- Helpers de Comparación (NUEVOS) ---

def _canonicalizar_horario(lista_horario):
    """
    Convierte la lista de horarios en un formato comparable.
    Ahora incluye CAMPUS para evitar colisiones de sedes o cambios de ubicación mayor.
    Estructura tupla: (dia, bloque, sala, tipo, profesor_bloque, campus)
    """
    if not lista_horario:
        return set()
    
    return set(
        (
            h.get('dia'), 
            h.get('bloque'), 
            h.get('sala', '').strip(), 
            h.get('tipo', '').strip(), 
            h.get('profesor', '').strip(),
            h.get('campus', '').strip() # ¡CRÍTICO! Faltaba esto.
        ) 
        for h in lista_horario
    )

def _comparar_paralelo(ctx, sigla, par_cod, data_old, data_new):
    """
    Analiza un paralelo específico buscando CUALQUIER discrepancia.
    Cubre: Cupos, Profesores, Horario (Sala, Tipo, Profe, Campus) y Metadatos (Nombre, Depto).
    """
    cambios = []
    base_event = {
        "entidad": "PARALELO",
        "ruta": {**ctx, "sigla": sigla, "paralelo": par_cod},
        "asignatura": data_new['nombre'],
        "timestamp": int(time.time())
    }

    # 1. Integridad de Metadatos (Nombre y Departamento)
    # A veces corrigen typos o cambian la unidad académica.
    for field in ['nombre', 'departamento']:
        val_old = data_old.get(field, '').strip()
        val_new = data_new.get(field, '').strip()
        if val_old != val_new:
            cambios.append({
                **base_event,
                "tipo": f"CAMBIO_{field.upper()}",
                "detalle": {
                    "anterior": val_old,
                    "nuevo": val_new
                }
            })

    # 2. Cambio de Cupos
    if data_old['cupo'] != data_new['cupo']:
        diff = data_new['cupo'] - data_old['cupo']
        es_oportunidad = diff > 0 and data_old['cupo'] == 0
        
        cambios.append({
            **base_event,
            "tipo": "CAMBIO_CUPO",
            "detalle": {
                "anterior": data_old['cupo'],
                "nuevo": data_new['cupo'],
                "delta": diff,
                "es_apertura": es_oportunidad,
                "es_cierre": data_new['cupo'] == 0 and data_old['cupo'] > 0
            }
        })

    # 3. Cambio de Profesores (Cátedra Principal)
    diff_profes = _detectar_cambios_profesores(data_old.get('profesor', []), data_new.get('profesor', []))
    if diff_profes:
        cambios.append({
            **base_event,
            "tipo": "CAMBIO_PROFESOR",
            "detalle": diff_profes
        })

    # 4. Cambio de Horario (Análisis Profundo)
    sched_old = _canonicalizar_horario(data_old.get('horario', []))
    sched_new = _canonicalizar_horario(data_new.get('horario', []))

    if sched_old != sched_new:
        bloques_agregados = sched_new - sched_old
        bloques_quitados = sched_old - sched_new
        
        # Mapeamos lo antiguo por (Dia, Bloque) para detectar modificaciones in-situ
        # Tupla índices: 0:Dia, 1:Bloque, 2:Sala, 3:Tipo, 4:Profesor, 5:Campus
        map_old = {(x[0], x[1]): x for x in bloques_quitados}
        
        cambios_logistica = []
        nuevos_bloques_reales = []
        
        for bloque in bloques_agregados:
            key = (bloque[0], bloque[1]) # (Dia, Bloque)
            
            if key in map_old:
                # Es el mismo bloque horario, pero algo cambió dentro
                b_old = map_old[key]
                modificaciones = []
                
                # Comparación campo a campo
                if b_old[2] != bloque[2]: modificaciones.append(f"Sala {b_old[2]} -> {bloque[2]}")
                if b_old[3] != bloque[3]: modificaciones.append(f"Tipo {b_old[3]} -> {bloque[3]}")
                if b_old[4] != bloque[4]: modificaciones.append(f"Prof. {b_old[4]} -> {bloque[4]}")
                if b_old[5] != bloque[5]: modificaciones.append(f"Campus {b_old[5]} -> {bloque[5]}")
                
                if modificaciones:
                    dia_nom = DIAS_INV.get(key[0], key[0])
                    cambios_logistica.append(f"{dia_nom} {key[1]}: {', '.join(modificaciones)}")
            else:
                nuevos_bloques_reales.append(bloque)

        # Calculamos eliminados puros (los que no eran modificaciones)
        # Si un bloque viejo fue usado para matchear una modificación, no cuenta como eliminado puro.
        count_modificados = len(cambios_logistica)
        count_eliminados_reales = len(bloques_quitados) - count_modificados

        cambios.append({
            **base_event,
            "tipo": "CAMBIO_HORARIO",
            "detalle": {
                "logistica": cambios_logistica,
                "bloques_nuevos": len(nuevos_bloques_reales),
                "bloques_eliminados": count_eliminados_reales
            }
        })

    return cambios

def _detectar_cambios_profesores(profes_old, profes_new):
    """Compara listas de profesores titulares (ignorando orden)."""
    set_old = set(p.strip() for p in profes_old)
    set_new = set(p.strip() for p in profes_new)
    
    if set_old == set_new:
        return None
        
    return {
        "entrantes": list(set_new - set_old),
        "salientes": list(set_old - set_new)
    }

# --- Lógica de Diff Principal ---
# Necesitamos invertir el mapa de días para logs legibles
DIAS_INV = {v: k for k, v in DIAS.items()}

def calcular_diff_ramos(ramos_antiguos, ramos_nuevos):
    """
    Calcula diferencias estructurales y de contenido.
    Estrategia: Unión de claves para detectar eliminaciones y adiciones en todos los niveles.
    """
    cambios = []
    ahora = datetime.datetime.now()
    ts = int(time.mktime(ahora.timetuple()))
    
    # Nivel 1: Sedes
    all_sedes = set(ramos_antiguos.keys()) | set(ramos_nuevos.keys())
    
    for sede in all_sedes:
        if sede not in ramos_nuevos:
            cambios.append({"tipo": "ELIMINACION_MASIVA", "nivel": "SEDE", "nombre": sede, "timestamp": ts})
            continue
        if sede not in ramos_antiguos:
            cambios.append({"tipo": "NUEVA_SEDE", "nivel": "SEDE", "nombre": sede, "timestamp": ts})
            # No comparamos hijos porque todo es nuevo
            continue

        # Nivel 2: Jornadas
        jornadas_old = ramos_antiguos[sede]
        jornadas_new = ramos_nuevos[sede]
        all_jornadas = set(jornadas_old.keys()) | set(jornadas_new.keys())

        for jornada in all_jornadas:
            if jornada not in jornadas_new:
                cambios.append({"tipo": "ELIMINACION_MASIVA", "nivel": "JORNADA", "ruta": {"sede": sede}, "nombre": jornada, "timestamp": ts})
                continue
            if jornada not in jornadas_old:
                cambios.append({"tipo": "NUEVA_JORNADA", "nivel": "JORNADA", "ruta": {"sede": sede}, "nombre": jornada, "timestamp": ts})
                continue

            # Nivel 3: Periodos
            periodos_old = jornadas_old[jornada]
            periodos_new = jornadas_new[jornada]
            all_periodos = set(periodos_old.keys()) | set(periodos_new.keys())

            for periodo in all_periodos:
                ctx = {"sede": sede, "jornada": jornada, "periodo": periodo}
                
                if periodo not in periodos_new:
                     # Periodo eliminado (raro, pero posible)
                    cambios.append({"tipo": "ELIMINACION_PERIODO", "ruta": ctx, "timestamp": ts})
                    continue
                if periodo not in periodos_old:
                    cambios.append({"tipo": "NUEVO_PERIODO", "ruta": ctx, "timestamp": ts})
                    continue

                # Nivel 4: Asignaturas (Siglas)
                asig_old = periodos_old[periodo]
                asig_new = periodos_new[periodo]
                all_siglas = set(asig_old.keys()) | set(asig_new.keys())

                for sigla in all_siglas:
                    if sigla not in asig_new:
                        cambios.append({
                            "tipo": "RETIRO_ASIGNATURA",
                            "entidad": "ASIGNATURA",
                            "ruta": {**ctx, "sigla": sigla},
                            "nombre": asig_old[sigla].get(list(asig_old[sigla].keys())[0], {}).get('nombre', 'Unknown'),
                            "timestamp": ts
                        })
                        continue
                    
                    if sigla not in asig_old:
                        # Nueva asignatura detectada
                        # Tomamos el nombre del primer paralelo disponible
                        nombre_asig = asig_new[sigla].get(list(asig_new[sigla].keys())[0], {}).get('nombre', 'Unknown')
                        cambios.append({
                            "tipo": "NUEVA_ASIGNATURA",
                            "entidad": "ASIGNATURA",
                            "ruta": {**ctx, "sigla": sigla},
                            "nombre": nombre_asig,
                            "timestamp": ts
                        })
                        continue

                    # Nivel 5: Paralelos
                    pars_old = asig_old[sigla]
                    pars_new = asig_new[sigla]
                    all_pars = set(pars_old.keys()) | set(pars_new.keys())

                    for par in all_pars:
                        ruta_par = {**ctx, "sigla": sigla, "paralelo": par}
                        
                        if par not in pars_new:
                            cambios.append({
                                "tipo": "ELIMINADO_PARALELO",
                                "entidad": "PARALELO",
                                "ruta": ruta_par,
                                "asignatura": pars_old[par]['nombre'],
                                "timestamp": ts
                            })
                            continue
                        
                        if par not in pars_old:
                            cambios.append({
                                "tipo": "NUEVO_PARALELO",
                                "entidad": "PARALELO",
                                "ruta": ruta_par,
                                "asignatura": pars_new[par]['nombre'],
                                "timestamp": ts
                            })
                            continue
                        
                        # Modificaciones: Comparación profunda
                        deltas = _comparar_paralelo(ctx, sigla, par, pars_old[par], pars_new[par])
                        cambios.extend(deltas)

    if not cambios: return None
        
    return {
        "metadata": {
            "timestamp": ts,
            "fecha": ahora.strftime("%Y-%m-%d"),
            "hora": ahora.strftime("%H:%M"),
            "total_eventos": len(cambios)
        },
        "eventos": cambios
    }