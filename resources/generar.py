import os
import sys
import json
import time
import datetime
import argparse
from multiprocessing import Pool

# Importación de Módulos Locales
from modules import auth, utils, scrapers, workers

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

if __name__ == "__main__":
    # 0. Parsing de Argumentos
    parser = argparse.ArgumentParser(description="Generador de datos SIGA (Ramos, Carreras, Programas)")
    
    # Argumento posicional opcional para la cookie (mantiene compatibilidad con scripts antiguos)
    parser.add_argument("cookie", nargs="?", help="String de la cookie JSESSIONID")
    
    # Flags opcionales
    parser.add_argument("--ramos", action="store_true", help="Actualizar horario de asignaturas")
    parser.add_argument("--carrera", "--carreras", dest="carreras", action="store_true", help="Actualizar planes y mallas de carrera")
    parser.add_argument("--programas", action="store_true", help="Actualizar programas académicos")
    
    args = parser.parse_args()

    # Lógica de Default: Si no se pasa ningún flag, se asume el comportamiento por defecto (Solo Ramos)
    if not (args.ramos or args.carreras or args.programas):
        UPDATE_RAMOS = True
        UPDATE_CARRERAS = False
        UPDATE_PROGRAMAS = False
    else:
        UPDATE_RAMOS = args.ramos
        UPDATE_CARRERAS = args.carreras
        UPDATE_PROGRAMAS = args.programas

    # 1. Configuración de Entorno y Rutas
    DATA_PATH = utils.ensure_directories(BASE_DIR)
    
    # 2. Obtención de Cookies (Auth)
    cookies = args.cookie

    # Opción B: Pipe (Stdin) - Si no vino por argumento
    if not cookies and not sys.stdin.isatty():
        cookies = sys.stdin.read().strip()
    
    # Opción C: Autenticación nativa (Módulo Auth)
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
    
    # A. Obtener Sedes y Jornadas (Solo si es necesario para Ramos o Carreras)
    sedes, jornadas = {}, {}
    if UPDATE_RAMOS or UPDATE_CARRERAS:
        data_sj = scrapers.get_sedes_and_jornadas(cookies)
        sedes, jornadas = data_sj["sedes"], data_sj["jornadas"]
        if not sedes:
            print("Sesión expirada al intentar obtener sedes.")
            sys.exit(0)

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
            carreras_result = pool.map(workers.worker_process_carrera, tasks)

    # D. Procesar PROGRAMAS (Serial)
    if UPDATE_PROGRAMAS:
        print("Iniciando actualización de PROGRAMAS...")
        progs = scrapers.get_programas_academicos()
        if progs:
            dest = os.path.join(DATA_PATH, "programas_academicos.json")
            utils.atomic_write(dest, progs)
            print(f"Programas actualizados en: {dest}")

    # 5. Escritura y Diff
    if UPDATE_CARRERAS and carreras_result:
        utils.atomic_write(os.path.join(DATA_PATH, "planes_carreras.json"), carreras_result)

    if UPDATE_RAMOS and ramos_result:
        ramos_path = os.path.join(DATA_PATH, "horario_asignaturas.json")
        ramos_antiguos = {}
        if os.path.exists(ramos_path):
            try:
                with open(ramos_path, "r", encoding="iso-8859-1") as f:
                    ramos_antiguos = json.load(f)
            except: pass

        if ramos_antiguos:
            diff = utils.calcular_diff_ramos(ramos_antiguos, ramos_result)
            if diff:
                log_path = os.path.join(DATA_PATH, "historial_cambios.jsonl")
                with open(log_path, "a", encoding="utf-8") as f:
                    f.write(json.dumps(diff, ensure_ascii=False) + "\n")
                print(f"Cambios guardados en: {log_path}")

            ramos_final = ramos_antiguos.copy()
            if "date" in ramos_final: del ramos_final["date"]
            
            for s, js in ramos_result.items():
                if s not in ramos_final: ramos_final[s] = {}
                for j, ps in js.items():
                    if j not in ramos_final[s]: ramos_final[s][j] = {}
                    for p, data in ps.items():
                        ramos_final[s][j][p] = data
            ramos_result = ramos_final

        ramos_result["date"] = unix
        utils.atomic_write(ramos_path, ramos_result)
        print(f"Ramos actualizados en: {ramos_path}")

    print("OK")