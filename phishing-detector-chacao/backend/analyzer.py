import re
from urllib.parse import urlparse

MARCAS_OBJETIVO = [
    "seniat", "bolipuertos", "maersk", "msc", "dhl",
    "cma-cgm", "hapag", "banesco", "provincial", "mercantil"
]

PALABRAS_INGENIERIA_SOCIAL = [
    "invoice", "bill-of-lading", "bl", "manifiesto", "arancel",
    "factura", "retenido", "aduana", "urgente", "verificacion",
    "tracking", "pago", "swift", "despacho"
]

TLDS_ALTO_RIESGO = (".xyz", ".top", ".tk", ".click", ".zip", ".ru", ".pw", ".gq")

EXTENSIONES_EJECUTABLES = (".exe", ".scr", ".bat", ".iso", ".vbs", ".cmd", ".msi", ".js")

ACORTADORES = ("bit.ly", "tinyurl.com", "cutt.ly", "t.co", "ow.ly", "shorturl.at")


def extraer_urls(texto: str) -> list[str]:
    patron = r'(https?://[^\s<>"\']+|(?:www\.)[^\s<>"\']+)'
    encontradas = re.findall(patron, texto.strip(), flags=re.IGNORECASE)
    if not encontradas and texto.strip():
        posible = texto.strip().split()[0]
        if "." in posible:
            return [posible if posible.startswith(("http://", "https://")) else f"http://{posible}"]
    return list(dict.fromkeys(encontradas))


def analizar_url(url_raw: str, whitelist: set[str]) -> dict:
    url = url_raw if url_raw.startswith(("http://", "https://")) else f"http://{url_raw}"
    parsed = urlparse(url)
    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()
    path = parsed.path.lower()
    full_lower = url.lower()

    host_sin_puerto = netloc.split("@")[-1].split(":")[0]
    puntaje = 0
    motivos = []
    reglas = []

    # Verificación en lista blanca oficial
    es_whitelist = any(
        host_sin_puerto == dom or host_sin_puerto.endswith(f".{dom}")
        for dom in whitelist
    )
    if es_whitelist and "@" not in netloc:
        if scheme != "https":
            puntaje += 25
            motivos.append("Dominio oficial detectado, pero usa protocolo HTTP sin cifrado SSL/TLS.")
            reglas.append("R4")
        else:
            motivos.append("Dominio institucional/naviero verificado en la lista blanca oficial.")
            motivos.append("Conexión cifrada mediante protocolo HTTPS válido.")
            return {
                "url": url,
                "dominio": host_sin_puerto,
                "puntaje": 0,
                "estado": "SEGURO",
                "motivos": motivos,
                "reglas": ["WHITELIST"]
            }

    # R4 - Protocolo sin cifrado
    if scheme == "http":
        puntaje += 25
        motivos.append("Protocolo HTTP inseguro (sin cifrado SSL/TLS).")
        reglas.append("R4")

    # R5 - Ofuscación, Punycode (xn--), IP directa o símbolo @
    es_ip = bool(re.match(r"^\d{1,3}(\.\d{1,3}){3}$", host_sin_puerto))
    if es_ip:
        puntaje += 40
        motivos.append("Uso de dirección IP directa en lugar de nombre de dominio corporativo.")
        reglas.append("R5")
    if "@" in netloc or "xn--" in host_sin_puerto:
        puntaje += 35
        motivos.append("Ofuscación de dominio detectada (símbolo '@' o codificación Punycode xn--).")
        if "R5" not in reglas:
            reglas.append("R5")
    if any(host_sin_puerto == ac or host_sin_puerto.endswith(f".{ac}") for ac in ACORTADORES):
        puntaje += 25
        motivos.append("Uso de acortador de URL que oculta el destino real de navegación.")
        if "R5" not in reglas:
            reglas.append("R5")

    # R1 - Typosquatting Aduanero / Suplantación de marca
    marcas_suplantadas = [m for m in MARCAS_OBJETIVO if m in host_sin_puerto and not es_whitelist]
    if marcas_suplantadas:
        puntaje += 40
        motivos.append(
            f"Posible suplantación de identidad (Typosquatting) de entidad oficial/naviera: {', '.join(marcas_suplantadas).upper()}."
        )
        reglas.append("R1")

    # R3 - Extensiones de dominio de alto riesgo (TLDs sospechosos)
    if host_sin_puerto.endswith(TLDS_ALTO_RIESGO):
        puntaje += 30
        motivos.append("Extensión de dominio (TLD) de alto riesgo frecuente en campañas de phishing.")
        reglas.append("R3")

    # R2 - Ingeniería Social Logística en ruta o subdominio
    tokens = re.split(r"[^a-z0-9]+", f"{host_sin_puerto}{path}")
    detectadas = sorted({p for p in PALABRAS_INGENIERIA_SOCIAL if p in tokens or p in full_lower})
    if detectadas:
        puntaje += 20
        motivos.append(
            f"Términos de ingeniería social aduanera/financiera detectados: {', '.join(detectadas)}."
        )
        reglas.append("R2")

    # R6 - Descarga directa de archivos ejecutables o peligrosos
    if any(path.endswith(ext) for ext in EXTENSIONES_EJECUTABLES):
        puntaje += 45
        ext_detectada = next(ext for ext in EXTENSIONES_EJECUTABLES if path.endswith(ext))
        motivos.append(f"Descarga directa de archivo ejecutable o de alto riesgo detectada ({ext_detectada}).")
        reglas.append("R6")

    puntaje = min(puntaje, 100)

    if puntaje >= 60:
        estado = "PELIGROSO"
    elif puntaje >= 25:
        estado = "RIESGO_MEDIO"
    else:
        estado = "SEGURO"
        if not motivos:
            motivos.append("No se detectaron indicadores maliciosos ni anomalías estructurales en el enlace.")

    return {
        "url": url,
        "dominio": host_sin_puerto or url,
        "puntaje": puntaje,
        "estado": estado,
        "motivos": motivos,
        "reglas": reglas
    }
