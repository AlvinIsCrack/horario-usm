import requests
import re
import math
import json
import time
import datetime
import multiprocess as mp
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import urllib
import os

script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(script_dir)

from cookie import obtener_cookie

load_dotenv()

UPDATE_RAMOS = True
UPDATE_CARRERAS = False 
UPDATE_PROGRAMAS = False

LOGIN = os.getenv("LOGIN")
SERVER = os.getenv("SERVER")
PASSWD = os.getenv("PASSWD")

PRODUCCION = False
COOKIES = obtener_cookie(LOGIN, SERVER, PASSWD, PRODUCCION)

DIAS = {
    "Lunes": 0,
    "Martes": 1,
    "Miércoles": 2,
    "Jueves": 3,
    "Viernes": 4,
    "Sábado": 5,
    "Domingo": 6,
}


def hhmm_to_minutes(hhmm: str) -> int:
    [h, m] = hhmm.split(":")
    h = int(h)
    m = int(m)
    return h * 60 + m


def minutes_to_hhm(minutes: int) -> str:
    return "{:02d}:{:02d}".format(*divmod(minutes, 60))


def get_programas_academicos():
    html = BeautifulSoup(
        requests.get(
            url=f"https://siga.usm.cl/prog_oai/oai_academia.jsp",
        ).text,
        "html.parser",
    )
    data = {}

    sedes = {}
    for option in html.find_all("select")[0].find_all("option"):
        value = option["value"].strip()
        if value == "-1":
            continue
        sedes[" ".join(option.stripped_strings).strip()] = value

    for sede in sedes.keys():
        data[sede] = {}

    for [sede, sede_cod] in sedes.items():
        departamentos = {}
        html = BeautifulSoup(
            requests.get(
                url=f"https://siga.usm.cl/prog_oai/oai_academia.jsp?sede={sede_cod}",
            ).text,
            "html.parser",
        )

        for option in html.find_all("select")[1].find_all("option"):
            value = option["value"].strip()
            if value == "-1":
                continue
            departamentos[" ".join(option.stripped_strings).strip()] = value

        for departamento in departamentos.keys():
            data[sede][departamento] = {}

        for [departamento, departamento_cod] in departamentos.items():
            html = BeautifulSoup(
                requests.get(
                    url=f"https://siga.usm.cl/prog_oai/oai_academia.jsp?sede={sede_cod}&cod_departamento={departamento_cod}",
                ).text,
                "html.parser",
            )

            tables = ["IMPAR", "PAR", "AMBOS", "ELECTIVO"]
            for type in tables:
                data[sede][departamento][type] = {}

            i = 0
            for tbody in [element.parent for element in html.select(".LetraAzulTabla")]:
                if i >= len(tables):
                    break
                for row in tbody.find_all("tr")[1:]:
                    td = row.find_all("td")
                    if len(td) != 5:
                        continue

                    [sigla, nombre, creditos, programa, _] = [
                        " ".join(d.stripped_strings).strip() for d in td
                    ]

                    programa = ""
                    for tag in row.find_all():
                        on_click = tag.get("onclick")
                        if on_click:
                            programa = re.findall(r"\'(.*?)\'", on_click)[0]
                            programa = urllib.parse.quote(programa, safe="")

                    data[sede][departamento][tables[i]][sigla] = {
                        "nombre": nombre,
                        "creditos": creditos,
                        "programa": (
                            f"https://siga.usm.cl/prog_oai/programa_download?pdf={programa}"
                            if programa
                            else ""
                        ),
                    }
                i += 1

    return data


def get_malla_carrera(
    sede: int,
    carrera: int,
    mencion: int,
    plan: int,
    duracion: int,
    creditos: int,
):
    global COOKIES
    params = {
        "sede": sede,
        "carrera": carrera,
        "mencion": mencion,
        "plan": plan,
        "duracion": duracion,
        "creditos": creditos,
    }

    params = "&".join([f"{k[0]}={k[1]}" for k in params.items()])
    html = BeautifulSoup(
        requests.get(
            url=f"https://siga.usm.cl/pag/sistinsc/listados/insc_ListPlanAsignatura.jsp?{params}",
            headers={"Cookie": COOKIES},
        ).text,
        "html.parser",
    )

    tablas = html.find_all("table")[2::2]
    dicc_equivalencias = {}

    for row in html.find_all("table").pop().find_all("tr")[1:]:
        td = row.find_all("td")
        if len(td) != 2:
            continue

        [n, eq] = [" ".join(d.stripped_strings).strip() for d in td]
        dicc_equivalencias[n] = eq

    semestre = []
    for tabla_semestre in tablas:
        ramos = {}
        for row in tabla_semestre.find_all("tr")[2:]:
            td = row.find_all("td")
            if len(td) != 11:
                continue

            [
                sigla,
                asignatura,
                lic,
                horas_teoricas,
                horas_practicas,
                horas_laboratorios,
                horas_ayudantias,
                creditos_sct,
                departamento,
                requisitos,
                equivalencias,
            ] = [" ".join(d.stripped_strings).strip() for d in td]

            requisitos = [
                [opcion.strip() for opcion in req.strip().split("ó")]
                for req in requisitos.split("+")
            ]

            if equivalencias == "Cualquier asignatura que se dicte":
                equivalencias = "*"

            equivalencias = (
                dicc_equivalencias[equivalencias].replace("-", "ó")
                if equivalencias in dicc_equivalencias
                else equivalencias
            )

            if equivalencias and equivalencias[-1] == "-":
                equivalencias = equivalencias[:-1]

            equivalencias = [
                [opcion.strip() for opcion in eq.strip().split("ó")]
                for eq in equivalencias.split("+")
            ]

            ramos[sigla] = {
                "nombre": asignatura.upper(),
                "requisito_licenciatura": bool(lic),
                "horas": {
                    "teoricas": int(horas_teoricas or 0),
                    "practicas": int(horas_practicas or 0),
                    "laboratorios": int(horas_laboratorios or 0),
                    "ayudantias": int(horas_ayudantias or 0),
                },
                "creditos": int(creditos_sct or 0),
                "departamento": departamento,
                "requisitos": requisitos,
                "equivalencias": equivalencias,
            }
        semestre.append(ramos)

    return semestre


def get_planes_carrera(mencion: int, sede: int, carrera: int):
    global COOKIES
    params = {"mencion": mencion, "sede": sede, "carrera": carrera}

    try:
        params = "&".join([f"{k[0]}={k[1]}" for k in params.items()])
        html = BeautifulSoup(
            requests.get(
                url=f"https://siga.usm.cl/pag/sistinsc/insc_plan_frame4.jsp?{params}",
                headers={"Cookie": COOKIES},
            ).text,
            "html.parser",
        )
    except Exception as e:
        if not e is requests.exceptions.ConnectTimeout:
            print(e)
        return {}

    return dict(
        [
            [option["value"], " ".join(option.stripped_strings).strip()]
            for option in html.find_all("option")
            if option["value"] != "-1"
        ]
    )


def get_mencion_especializacion(carrera: str, sede: int, jornada: int):
    global COOKIES
    params = {"carrera": carrera, "sede": sede, "jornada": jornada}
    params = "&".join([f"{k[0]}={k[1]}" for k in params.items()])
    html = BeautifulSoup(
        requests.get(
            url=f"https://siga.usm.cl/pag/sistinsc/insc_plan_frame3.jsp?{params}",
            headers={"Cookie": COOKIES},
        ).text,
        "html.parser",
    )

    return dict(
        [
            [option["value"], " ".join(option.stripped_strings).strip()]
            for option in html.find_all("option")
            if option["value"] != "-1"
        ]
    )


def get_carreras(sede: int, jornada: int):
    global COOKIES
    params = {"sede": sede, "jornada": jornada}
    params = "&".join([f"{k[0]}={k[1]}" for k in params.items()])

    html = BeautifulSoup(
        requests.get(
            url=f"https://siga.usm.cl/pag/sistinsc/insc_plan_frame2.jsp?{params}",
            headers={"Cookie": COOKIES},
        ).text,
        "html.parser",
    )

    return dict(
        [
            [option["value"], " ".join(option.stripped_strings).strip()]
            for option in html.find_all("option")
            if option["value"] != "-1"
        ]
    )


def get_sedes_and_jornadas():
    global COOKIES

    html = BeautifulSoup(
        requests.get(
            url=f"https://siga.usm.cl/pag/sistinsc/insc_plan_frame1.jsp",
            headers={"Cookie": COOKIES},
        ).text,
        "html.parser",
    )
    if html.find(attrs={"href": "CerrarJsp.jsp"}):
        return {"sedes": {}, "jornadas": {}}

    return {
        "sedes": dict(
            [
                [option["value"], " ".join(option.stripped_strings).strip()]
                for option in html.find(attrs={"name": "sede"}).find_all("option")
                if option["value"] != "-1"
            ]
        ),
        "jornadas": dict(
            [
                [option["value"], " ".join(option.stripped_strings).strip()]
                for option in html.find(attrs={"name": "jornada"}).find_all("option")
                if option["value"] != "-1"
            ]
        ),
    }


def get_info_carrera(plan: int, sede: int, carrera: int, mencion: int):
    global COOKIES
    params = {"plan": plan, "sede": sede, "carrera": carrera, "mencion": mencion}
    params = "&".join([f"{k[0]}={k[1]}" for k in params.items()])

    html = BeautifulSoup(
        requests.get(
            url=f"https://siga.usm.cl/pag/sistinsc/insc_plan_frame5.jsp?{params}",
            headers={"Cookie": COOKIES},
        ).text,
        "html.parser",
    )

    return dict(
        [
            [input["name"], input["value"].strip() or "1"]
            for input in html.find_all("input")
        ]
    )


def get_programacion_asignaturas(
    sede: int,
    jornada: int,
    nombre_sede: str,
    nombre_jornada: str,
):
    global COOKIES

    today = datetime.date.today()

    i = 0
    año = today.year
    semestre = max(round(today.month / 6), 1)

    ITERATIONS = 2

    semestre += ITERATIONS
    if semestre > 3:
        semestre -= 3
        año += 1

    periodos = []
    while i < ITERATIONS + 1:
        params = {
            "sede": sede,
            "jornada": jornada,
            "ano": año,
            "semestre": semestre,
            "car": 0,
            "orden": 2,
        }
        params = "&".join([f"{k[0]}={k[1]}" for k in params.items()])

        html = BeautifulSoup(
            requests.get(
                url=f"https://siga.usm.cl/pag/sistinsc/listados/insc_ListProgTodasAsign.jsp?{params}",
                headers={"Cookie": COOKIES},
            ).text,
            "html.parser",
        )

        data = []
        for table in html.find_all("table"):
            for row in table.findChildren("tr", recursive=False)[1:]:
                cells = row.findChildren("td", recursive=False)
                if len(cells) != 7:
                    continue

                for br in cells[4].find_all("br"):
                    br.replace_with("###")

                [sigla, nombre, departamento, paralelo, profesor, cupo] = [
                    re.sub(
                        " +",
                        " ",
                        " ".join(cell.stripped_strings).strip().replace("\n", ""),
                    )
                    for cell in cells[:6]
                ]

                if sigla[-1] == "-":
                    continue
                r = {}

                try:
                    r["sigla"] = sigla.upper()
                    r["nombre"] = nombre.upper()
                    r["departamento"] = departamento.upper()
                    r["paralelo"] = paralelo
                    r["profesor"] = [p.strip() for p in profesor.split("###")]
                    r["cupo"] = int(cupo)
                except:
                    continue

                table_horario = cells[6].find("table", recursive=False)
                horario = []
                if table_horario:
                    for row_horario in table_horario.findChildren(
                        "tr", recursive=False
                    )[1:]:
                        cells_horario = row_horario.findChildren("td", recursive=False)
                        if len(cells_horario) != 7:
                            continue

                        [dia, bloque, _, tipo, sala, campus, profesor] = [
                            "\n".join(cell.findAll(string=True)).strip()
                            for cell in cells_horario
                        ]

                        [start, end] = bloque.split("\n")
                        start = int(start)
                        end = int(end)

                        for i, _bloque in enumerate(range(start, end + 1)):
                            b = {}
                            b["dia"] = DIAS[dia]
                            b["bloque"] = int(_bloque)
                            b["tipo"] = tipo
                            b["sala"] = sala.split()[0]
                            b["campus"] = campus
                            b["profesor"] = profesor
                            horario.append(b)

                r["horario"] = horario
                data.append(r)

        periodos.append([f"{año}-{semestre}", data])

        i += 1
        semestre -= 1
        if semestre < 1:
            año -= 1
            semestre += 3

    return [nombre_sede, nombre_jornada, periodos]


if __name__ == "__main__":
    carreras = []
    ramos = {}

    d = datetime.datetime.now()
    unix = time.mktime(d.timetuple())
    if UPDATE_RAMOS or UPDATE_CARRERAS:
        [sedes, jornadas] = get_sedes_and_jornadas().values()
        if not sedes or not jornadas:
            print("Sesión expirada.")
            exit()
        for jornada in jornadas:
            if UPDATE_RAMOS:
                with mp.Pool(len(sedes)) as pool:
                    for result in pool.map(
                        lambda args: get_programacion_asignaturas(*args),
                        [
                            [sede, jornada, sedes[sede], jornadas[jornada]]
                            for sede in sedes
                        ],
                    ):
                        [sede, _jornada, periodos] = result
                        for [periodo, r] in periodos:
                            if not sede in ramos:
                                ramos[sede] = {}
                            if not _jornada in ramos[sede]:
                                ramos[sede][_jornada] = {}
                            if not periodo in ramos[sede][_jornada]:
                                ramos[sede][_jornada][periodo] = {}
                            for _r in r:
                                if not _r["sigla"] in ramos[sede][_jornada][periodo]:
                                    ramos[sede][_jornada][periodo][_r["sigla"]] = {}
                                if not (
                                    _r["paralelo"]
                                    in ramos[sede][_jornada][periodo][_r["sigla"]]
                                ):
                                    ramos[sede][_jornada][periodo][_r["sigla"]][
                                        _r["paralelo"]
                                    ] = _r

            if UPDATE_CARRERAS:
                for sede in sedes:

                    def process_carrera(args):
                        [
                            carrera,
                            nombre_carrera,
                            sede_cod,
                            jornada_cod,
                            sede,
                            jornada,
                        ] = args

                        menciones = get_mencion_especializacion(
                            carrera, sede_cod, jornada_cod
                        )
                        for mencion in [*menciones.keys()]:
                            c = carrera.split("-")[0]
                            planes = get_planes_carrera(mencion, sede_cod, c)
                            if not planes:
                                del menciones[mencion]
                                continue

                            for plan in [*planes.keys()]:
                                info = get_info_carrera(plan, sede_cod, c, mencion)
                                if "No Vigente" in planes[plan]:
                                    del planes[plan]
                                    continue

                                planes[plan] = {
                                    "plan": planes[plan],
                                    "malla": get_malla_carrera(
                                        sede_cod,
                                        c,
                                        mencion,
                                        plan,
                                        info["duracion"],
                                        info["creditos"],
                                    ),
                                }

                            menciones[mencion] = {
                                "nombre": menciones[mencion],
                                "planes": planes,
                            }

                        return {
                            "nombre": nombre_carrera,
                            "código": carrera,
                            "sede": sede,
                            "jornada": jornada,
                            "menciones/especialidades": menciones,
                        }

                    with mp.Pool(20) as pool:
                        for carrera in pool.map(
                            process_carrera,
                            [
                                [*items, sede, jornada, sedes[sede], jornadas[jornada]]
                                for items in get_carreras(sede, jornada).items()
                            ],
                        ):
                            carreras.append(carrera)

    if UPDATE_PROGRAMAS:
        programas = get_programas_academicos()
        if len(programas.keys()):
            with open(
                "./src/lib/data/programas_academicos.json", "w+", encoding="iso-8859-1"
            ) as f:
                f.write(json.dumps(programas))
        else:
            print("NO SE OBTUVIERON LOS PROGRAMAS")
    if UPDATE_CARRERAS:
        if len(carreras):
            with open(
                "./src/lib/data/planes_carreras.json", "w+", encoding="iso-8859-1"
            ) as f:
                f.write(json.dumps(carreras))
        else:
            print("NO SE OBTUVIERON CARRERAS")
    if UPDATE_RAMOS:
        if len(ramos.keys()):
            with open(
                "./src/lib/data/horario_asignaturas.json", "w+", encoding="iso-8859-1"
            ) as f:
                ramos["date"] = unix
                f.write(json.dumps(ramos))
        else:
            print("NO SE OBTUVIERON RAMOS")
print("OK")
