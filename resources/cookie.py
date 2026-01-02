from requests import Session


# Obtiene la cookie de sesión para el usuario y la retorna como cadena.
#
# login: El identificador de usuario del correo a autenticar en SIGA. Ej: "pperez" de "pperez@usm.cl"
# server: El servidor del correo a autenticar en SIGA. Ej: "usm.cl" de "pperez@usm.cl"
# passwd: Contraseña del SIGA asociada al correo.
# decypt: Si se tienen que desencriptar las credenciales con el ssh-agent.
def obtener_cookie(login, server, passwd, decrypt):
    print(f"Iniciando sesión con {login}@{server}:{'*'*len(passwd)}")

    if (decrypt):
        from ssh_crypt import E
        from ssh_crypt.exceptions import SSHCrypAgentNotConnected

        try:
            login = str(E(login))
            server = str(E(server))
            passwd = str(E(passwd))
        except SSHCrypAgentNotConnected:
            print("Pedirle al encargado/a que inicie el ssh-agent con la llave correspondiente")
            exit(1)

    with Session() as session:
        response = session.post('https://siga.usm.cl/pag/valida_login.jsp', data={"login": login, "server": server, "passwd": passwd})

        if "error_ingreso_login.jsp" in response.text:
            print("Contraseña incorrecta")
            exit(1)

        return "JSESSIONID=" + session.cookies.get_dict()["JSESSIONID"]
