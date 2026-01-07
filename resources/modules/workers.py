from . import scrapers

def worker_process_carrera(args):
    """Worker para procesar carreras."""
    (cookies, car_id, car_nom, sede_cod, jornada_cod, sede_nom, jornada_nom) = args

    menciones = scrapers.get_mencion_especializacion(cookies, car_id, sede_cod, jornada_cod)
    
    # [MODIFICACION] Inicializamos la memoria de ramos para esta carrera
    memo_ramos = {} 
    
    for men_id in list(menciones.keys()):
        car_base = car_id.split("-")[0]
        planes = scrapers.get_planes_carrera(cookies, men_id, sede_cod, car_base)
        
        if not planes:
            del menciones[men_id]
            continue

        for plan_id in list(planes.keys()):
            if "No Vigente" in planes[plan_id]:
                del planes[plan_id]
                continue
            
            info = scrapers.get_info_carrera(cookies, plan_id, sede_cod, car_base, men_id)
            
            # [MODIFICACION] Pasamos memo_ramos a la función
            malla = scrapers.get_malla_carrera(
                cookies, sede_cod, car_base, men_id, plan_id, 
                info["duracion"], info["creditos"], 
                memo_ramos=memo_ramos
            )
            
            planes[plan_id] = {"plan": planes[plan_id], "malla": malla}
        menciones[men_id] = {"nombre": menciones[men_id], "planes": planes}

    return {
        "nombre": car_nom, "código": car_id, 
        "sede": sede_nom, "jornada": jornada_nom, 
        "menciones/especialidades": menciones
    }

def worker_process_ramos(args):
    """Wrapper simple para llamar al scraper de ramos."""
    return scrapers.get_programacion_asignaturas(*args)