import os
from requests import Session

def get_session_cookie():
    """
    Intenta iniciar sesión en SIGA usando variables de entorno.
    Retorna: str (formato 'JSESSIONID=...')
    Lanza: Exception si fallan credenciales o login.
    """
    LOGIN = os.getenv("SIGA_LOGIN")
    SERVER = os.getenv("SIGA_SERVER")
    PASSWD = os.getenv("SIGA_PASSWD")

    if not all([LOGIN, SERVER, PASSWD]):
        raise ValueError("Error: Credenciales de entorno (SIGA_LOGIN, SIGA_SERVER, SIGA_PASSWD) incompletas.")

    with Session() as session:
        response = session.post(
            'https://siga.usm.cl/pag/valida_login.jsp', 
            data={"login": LOGIN, "server": SERVER, "passwd": PASSWD}
        )
        
        if "error_ingreso_login.jsp" in response.text:
            raise PermissionError("Error: Contraseña de SIGA incorrecta.")
        
        cookie_dict = session.cookies.get_dict()
        if "JSESSIONID" not in cookie_dict:
            raise ConnectionError("Error: No se recibió JSESSIONID del servidor.")

        return "JSESSIONID=" + cookie_dict["JSESSIONID"]