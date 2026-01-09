import os
import sys
import json
import time
import datetime
import argparse
import hashlib
from multiprocessing import Pool

# Importación de Módulos Locales
from modules import auth, utils, scrapers, workers

# Importación de módulos de Reviews (Opcionales/Dinámicos)
try:
    from modules.reviews import fetch_profesores, aggregate
    REVIEWS_MODULE_AVAILABLE = True
except ImportError:
    REVIEWS_MODULE_AVAILABLE = False

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

if __name__ == "__main__":
    # 0. Parsing de Argumentos
    parser = argparse.ArgumentParser(description="Generador de datos SIGA (Ramos, Carreras, Programas, Profesores)")
    
    # Argumento posicional opcional para la cookie
    parser.add_argument("cookie", nargs="?", help="String de la cookie JSESSIONID")
    
    # Flags opcionales
    parser.add_argument("--ramos", action="store_true", help="Actualizar horario de asignaturas")
    parser.add_argument("--carrera", "--carreras", dest="carreras", action="store_true", help="Actualizar planes y mallas de carrera")
    parser.add_argument("--programas", action="store_true", help="Actualizar programas académicos")
    parser.add_argument("--profesores", action="store_true", help="Sincronizar reseñas de profesores (Google Sheets -> Local)")
    parser.add_argument("--reviews", action="store_true", help="Generar vistas agregadas de profesores (Local -> View JSON)")

    # Flags de sistema
    parser.add_argument("--ignore", action="store_true", help="Salir exitosamente sin hacer nada")
    parser.add_argument("--dry-run", action="store_true", help="Ejecuta el proceso completo sin escribir resultados a disco")
    
    args = parser.parse_args()
    if args.ignore:
        sys.exit(0)
    
    if args.dry_run:
        print("!!! MODO DRY-RUN ACTIVADO: No se guardarán cambios en el disco. !!!")
        utils.atomic_write = lambda *args, **kwargs: print(f"Bloqueada escritura atómica en: {args[0]}")
        utils.write_if_modified = lambda path, data, **kwargs: (hashlib.md5(str(data).encode()).hexdigest(), False)
        def mock_append_log(*args, **kwargs): pass

    # Lógica de Default: Si no se pasa ningún flag, se asume el comportamiento antiguo (Solo Ramos)
    # Si se pasa CUALQUIER flag, solo se ejecuta lo solicitado.
    if not (args.ramos or args.carreras or args.programas or args.profesores or args.reviews):
        UPDATE_RAMOS = True
        UPDATE_CARRERAS = False
        UPDATE_PROGRAMAS = False
        UPDATE_PROFESORES = True
        UPDATE_REVIEWS = True
    else:
        UPDATE_RAMOS = args.ramos
        UPDATE_CARRERAS = args.carreras
        UPDATE_PROGRAMAS = args.programas
        UPDATE_PROFESORES = args.profesores
        UPDATE_REVIEWS = args.reviews

    # 1. Configuración de Entorno y Rutas
    DATA_PATH = utils.ensure_directories(BASE_DIR)
    
    # 2. Obtención de Cookies (Auth) - Solo si es necesario para scraping de SIGA
    cookies = args.cookie
    if UPDATE_RAMOS or UPDATE_CARRERAS:
        if not cookies and not sys.stdin.isatty():
            cookies = sys.stdin.read().strip()
        
        if not cookies:
            print("Obteniendo cookie mediante autenticación interna...")
            try:
                cookies = auth.get_session_cookie()
                print(f"Login exitoso. {cookies}")
            except Exception as e:
                print(f"Error crítico de autenticación: {e}")
                sys.exit(1)

        cookies = cookies.strip()
        if not cookies.startswith("JSESSIONID"):
            print("COOKIE inválida o no aceptada")
            sys.exit(1)

    # 3. Preparación de Timestamps
    d = datetime.datetime.now()
    unix = time.mktime(d.timetuple())

    # 4. Orquestación del Scraping
    
    # A. Obtener Sedes y Jornadas
    sedes, jornadas = {}, {}
    if UPDATE_RAMOS or UPDATE_CARRERAS:
        data_sj = scrapers.get_sedes_and_jornadas(cookies)
        sedes, jornadas = data_sj["sedes"], data_sj["jornadas"]
        if not sedes:
            print("Sesión expirada al intentar obtener sedes.")
            sys.exit(0)

    try:
        # B. Procesar RAMOS
        ramos_result = {}
        if UPDATE_RAMOS:
            print("Iniciando actualización de RAMOS...")
            tasks = [[cookies, s, j, sedes[s], jornadas[j]] for j in jornadas for s in sedes]
            
            with Pool(len(sedes)) as pool:
                results = pool.map(workers.worker_process_ramos, tasks)
                for res in results:
                    sede_nom, jornada_nom, periodos = res
                    target_sede = ramos_result.setdefault(sede_nom, {})
                    target_jornada = target_sede.setdefault(jornada_nom, {})
                    
                    for periodo, lista_ramos in periodos:
                        target_periodo = target_jornada.setdefault(periodo, {})
                        for r in lista_ramos:
                            target_sigla = target_periodo.setdefault(r["sigla"], {})
                            target_sigla[r["paralelo"]] = r

        # C. Procesar CARRERAS
        carreras_result = []
        if UPDATE_CARRERAS:
            print("Iniciando actualización de CARRERAS...")
            tasks = []
            for s in sedes:
                for j in jornadas:
                    local_carreras = scrapers.get_carreras(cookies, s, j)
                    for cid, cnom in local_carreras.items():
                        tasks.append([cookies, cid, cnom, s, j, sedes[s], jornadas[j]])
            
            with Pool(20) as pool:
                try:
                    carreras_result = pool.map(workers.worker_process_carrera, tasks)
                except KeyboardInterrupt:
                    pool.terminate()
                    pool.join()
                    print("\n[ABORT] Interrupción por teclado (CTRL+C).")
                    sys.exit(1)

    except Exception as e:
        print(f"\n[ERROR FATAL] Se detectó una inconsistencia en el scraping: {e}")
        print(">>> Abortando ejecución para proteger la integridad de los datos.")
        sys.exit(1)

    # D. Procesar PROGRAMAS
    if UPDATE_PROGRAMAS:
        print("Iniciando actualización de PROGRAMAS...")
        progs = scrapers.get_programas_academicos()
        if progs:
            dest = os.path.join(DATA_PATH, "programas_academicos.json")
            utils.atomic_write(dest, progs)
            print(f"Programas actualizados en: {dest}")

    # E. Procesar PROFESORES (Google Sheets -> Processed JSON)
    if UPDATE_PROFESORES:
        if REVIEWS_MODULE_AVAILABLE:
            print("Iniciando sincronización de PROFESORES (Reviews)...")
            try:
                fetch_profesores.trigger_gas_analysis() # type: ignore
            except Exception as e:
                print(f"Error al sincronizar profesores: {e}")
        else:
            print("⚠️ El módulo 'reviews' no está disponible. Revisa la instalación.")

    # F. Procesar VISTAS AGREGADAS (Processed JSON -> Views JSON)
    if UPDATE_REVIEWS:
        if REVIEWS_MODULE_AVAILABLE:
            print("Generando vistas de REVIEWS (Agregación)...")
            try:
                aggregate.main() # type: ignore
            except Exception as e:
                print(f"Error al generar vistas: {e}")
        else:
            print("⚠️ El módulo 'reviews' no está disponible.")

    # 5. Escritura y Gestión de Metadata (Solo para Ramos/Carreras)
    metadata_path = os.path.join(DATA_PATH, "metadata.json")
    old_metadata = {}
    if os.path.exists(metadata_path):
        try:
            with open(metadata_path, "r", encoding="utf-8") as f:
                old_metadata = json.load(f)
        except: pass
    
    files_registry = old_metadata.get("files", {})

    # A. Escritura CARRERAS
    if UPDATE_CARRERAS and carreras_result:
        fname = "planes_carreras.json"
        old_hash = files_registry.get(fname, {}).get("hash")
        
        c_hash, c_written = utils.write_if_modified(
            os.path.join(DATA_PATH, fname), 
            carreras_result, 
            old_hash=old_hash,
            encoding="utf-8" 
        )
        
        if c_written:
            print(f"[CAMBIOS] {fname} actualizado.")
        else:
            print(f"[SKIP] {fname} sin cambios.")

        files_registry[fname] = {
            "hash": c_hash,
            "updatedAt": unix, 
            "size": len(carreras_result) 
        }

   # B. Escritura RAMOS y Metadata Final
    if UPDATE_RAMOS and ramos_result:
        fname_ramos = "horario_asignaturas.json"
        ramos_path = os.path.join(DATA_PATH, fname_ramos)
        
        ramos_antiguos = {}
        if os.path.exists(ramos_path):
            try:
                with open(ramos_path, "r", encoding="utf-8") as f:
                    ramos_antiguos = json.load(f)
            except (UnicodeDecodeError, json.JSONDecodeError):
                try:
                    with open(ramos_path, "r", encoding="iso-8859-1") as f:
                        ramos_antiguos = json.load(f)
                except: pass

        cambios_detectados = 0
        if ramos_antiguos:
            if "date" in ramos_antiguos: del ramos_antiguos["date"]
            diff = utils.calcular_diff_ramos(ramos_antiguos, ramos_result)
            
            if diff:
                cambios_detectados = diff["metadata"]["total_eventos"]
                log_path = os.path.join(DATA_PATH, "historial_cambios.jsonl")
                with open(log_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(diff, ensure_ascii=False) + "\n")
                print(f"Historial guardado en: {log_path}")

            ramos_final = ramos_antiguos.copy()
            for s, js in ramos_result.items():
                if s not in ramos_final: ramos_final[s] = {}
                for j, ps in js.items():
                    if j not in ramos_final[s]: ramos_final[s][j] = {}
                    for p, data in ps.items():
                        ramos_final[s][j][p] = data
            ramos_result = ramos_final

        old_hash_ramos = files_registry.get(fname_ramos, {}).get("hash")
        
        r_hash, r_written = utils.write_if_modified(
            ramos_path, 
            ramos_result, 
            old_hash=old_hash_ramos,
            encoding="utf-8"
        )

        if r_written:
            print(f"[CAMBIOS] {fname_ramos} actualizado.")
        else:
            print(f"[SKIP] {fname_ramos} sin cambios.")

        files_registry[fname_ramos] = {
            "hash": r_hash,
            "updatedAt": unix if r_written else files_registry.get(fname_ramos, {}).get("updatedAt", unix),
            "cambiosUltimaEjecucion": cambios_detectados
        }

        # 3. Metadata
        total_asignaturas = 0
        total_paralelos = 0
        for s_data in ramos_result.values():
            for j_data in s_data.values():
                for p_data in j_data.values():
                    total_asignaturas += len(p_data)
                    for sigla_data in p_data.values():
                        total_paralelos += len(sigla_data)
        
        execution_time = time.time() - unix 
        is_ci = os.getenv('CI', 'false').lower() == 'true'

        metadata = {
            "version": 3,
            "status": "success",
            "generatedAt": {
                "unix": int(unix),
                "iso": datetime.datetime.fromtimestamp(unix).isoformat(),
            },
            "system": {
                "scraperVersion": utils.get_git_revision_short_hash(),
                "environment": "CI/CD" if is_ci else "Local",
                "executionTimeSeconds": round(execution_time, 2),
            },
            "stats": {
                "totalAsignaturas": total_asignaturas,
                "totalParalelos": total_paralelos,
            },
            "files": files_registry,
        }

        utils.atomic_write(metadata_path, metadata, encoding="utf-8")
        print(f"Metadata actualizada en: {metadata_path}")

    print("OK")