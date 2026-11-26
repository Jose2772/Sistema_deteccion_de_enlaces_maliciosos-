import json
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import get_connection
from analyzer import extraer_urls, analizar_url

app = FastAPI(
    title="FJLDI Security Chacao - API de Detección Heurística",
    version="2.6"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class EscaneoRequest(BaseModel):
    remitente: Optional[str] = "No especificado"
    departamento: str = "Importación / Exportación"
    contenido: str


@app.get("/")
def root():
    return {
        "sistema": "FJLDI Security Chacao",
        "estado": "Motor Heurístico Activo - v2.6"
    }


@app.post("/api/analizar")
def analizar_correo_o_enlaces(payload: EscaneoRequest):
    urls = extraer_urls(payload.contenido)
    if not urls:
        raise HTTPException(
            status_code=400,
            detail="No se detectó ninguna URL válida en el texto ingresado."
        )

    conn = get_connection()
    resultados = []
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT dominio FROM dominios_confiables")
            whitelist = {row["dominio"].lower() for row in cursor.fetchall()}

            remitente_limpio = payload.remitente.strip() if payload.remitente and payload.remitente.strip() else "No especificado"

            for url in urls:
                res = analizar_url(url, whitelist)
                reglas_str = ", ".join(res["reglas"])

                cursor.execute(
                    """
                    INSERT INTO analisis_enlaces
                      (remitente, departamento, url_analizada, dominio_extraido, puntaje_riesgo, estado, motivos, reglas_activadas)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        remitente_limpio,
                        payload.departamento,
                        res["url"],
                        res["dominio"],
                        res["puntaje"],
                        res["estado"],
                        json.dumps(res["motivos"], ensure_ascii=False),
                        reglas_str
                    )
                )
                res["id"] = cursor.lastrowid
                res["remitente"] = remitente_limpio
                res["departamento"] = payload.departamento
                resultados.append(res)
    finally:
        conn.close()

    return {
        "total_analizados": len(resultados),
        "resultados": resultados
    }


@app.get("/api/historial")
def obtener_historial(estado: Optional[str] = None, buscar: Optional[str] = None):
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            query = "SELECT * FROM analisis_enlaces WHERE 1=1"
            params = []

            if estado and estado.upper() in ("SEGURO", "RIESGO_MEDIO", "PELIGROSO"):
                query += " AND estado = %s"
                params.append(estado.upper())

            if buscar and buscar.strip():
                query += " AND (url_analizada LIKE %s OR dominio_extraido LIKE %s OR departamento LIKE %s)"
                like = f"%{buscar.strip()}%"
                params.extend([like, like, like])

            query += " ORDER BY fecha_analisis DESC, id DESC"
            cursor.execute(query, params)
            filas = cursor.fetchall()

            for fila in filas:
                if isinstance(fila["motivos"], str):
                    fila["motivos"] = json.loads(fila["motivos"])
                if fila["fecha_analisis"]:
                    fila["fecha_analisis"] = fila["fecha_analisis"].strftime("%d/%m/%Y %I:%M %p")

            return filas
    finally:
        conn.close()


@app.delete("/api/historial")
def borrar_historial():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("TRUNCATE TABLE analisis_enlaces")
        return {"mensaje": "Historial de auditoría eliminado correctamente."}
    finally:
        conn.close()


@app.get("/api/estadisticas")
def obtener_estadisticas():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT
                    COUNT(*) AS total,
                    SUM(CASE WHEN estado = 'SEGURO' THEN 1 ELSE 0 END) AS seguros,
                    SUM(CASE WHEN estado = 'RIESGO_MEDIO' THEN 1 ELSE 0 END) AS riesgo_medio,
                    SUM(CASE WHEN estado = 'PELIGROSO' THEN 1 ELSE 0 END) AS peligrosos
                FROM analisis_enlaces
            """)
            row = cursor.fetchone()
            total = int(row["total"] or 0)
            seguros = int(row["seguros"] or 0)
            riesgo_medio = int(row["riesgo_medio"] or 0)
            peligrosos = int(row["peligrosos"] or 0)

            return {
                "total_analizados": total,
                "seguros": seguros,
                "riesgo_medio": riesgo_medio,
                "peligrosos": peligrosos,
                "porcentajes": {
                    "seguros": round((seguros / total) * 100) if total else 0,
                    "riesgo_medio": round((riesgo_medio / total) * 100) if total else 0,
                    "peligrosos": round((peligrosos / total) * 100) if total else 0,
                }
            }
    finally:
        conn.close()


@app.get("/api/departamentos")
def listar_departamentos():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, nombre, nivel_criticidad FROM departamentos ORDER BY id ASC")
            return cursor.fetchall()
    finally:
        conn.close()


@app.get("/api/whitelist")
def listar_whitelist():
    conn = get_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, dominio, entidad FROM dominios_confiables ORDER BY dominio ASC")
            return cursor.fetchall()
    finally:
        conn.close()
