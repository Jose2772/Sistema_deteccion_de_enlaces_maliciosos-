# 🛡️ FJLDI Security Chacao — Sistema de Detección Heurística de Enlaces Maliciosos en Correo Institucional



**Ubicación del Proyecto:** Municipio Chacao, Estado Miranda (Sector Importación y Exportación).  

**Asignatura:** Desarrollo del Software.  



---



## 📋 Descripción del Sistema



Plataforma web de ciberseguridad diseñada para analizar, detectar y auditar enlaces maliciosos y campañas de *spear-phishing* dirigidas a correos institucionales de compañías de importación y exportación.



* **Frontend:** HTML5, CSS3, JavaScript (Motor visual interactivo, historial y panel estadístico).

* **Backend:** Python 3.11+, FastAPI, Uvicorn (Motor heurístico de análisis R1–R6).

* **Base de Datos:** MySQL / MariaDB (`PLATAFORMA_PHISHING`) gestionada mediante **XAMPP**.



---



## 📂 Estructura del Repositorio



```text

Sistema_deteccion_de_enlaces_maliciosos-/

├── leeme.txt

├── README.md

└── phishing-detector-chacao/

    ├── database.sql          # Script SQL con las tablas y datos de prueba

    ├── backend/              # API REST en FastAPI y motor heurístico

    │   ├── main.py           # Endpoints y lógica del servidor

    │   ├── analyzer.py       # Reglas heurísticas R1 - R6 de detección de phishing

    │   ├── database.py       # Configuración de conexión a MySQL (XAMPP)

    │   └── requirements.txt  # Dependencias de Python

    └── frontend/             # Interfaz gráfica de usuario

        ├── index.html        # Estructura principal de la plataforma

        ├── styles.css        # Hoja de estilos y diseño responsivo

        └── app.js            # Lógica del cliente y conexión con la API

```



---



## 🚀 Guía Paso a Paso para Ejecutar y Conectar el Sistema



### Paso 1: Descargar el repositorio y visualizar el Frontend

1. Descargue el proyecto haciendo clic en el botón verde **`<> Code` -> `Download ZIP`** en GitHub (o ejecute `git clone https://github.com/Jose2772/Sistema_deteccion_de_enlaces_maliciosos-.git`).

2. Ingrese a la carpeta `phishing-detector-chacao/frontend/` (donde se encuentran `index.html`, `styles.css` y `app.js`) y abra el archivo **`index.html`** en su navegador web (o ábralo con *Live Server* / `python -m http.server 5500` en `http://127.0.0.1:5500`).

3. En este punto podrá explorar toda la interfaz visual del escáner, el historial y el panel estadístico. Para activar la persistencia real en base de datos, continúe con los Pasos 2 y 3 para montar y conectar la base de datos en **XAMPP**.



---



### Paso 2: Montar la Base de Datos en XAMPP (phpMyAdmin)

1. Abra el panel de control de **XAMPP** (*XAMPP Control Panel*).

2. Haga clic en el botón **Start** del módulo **Apache** y en el botón **Start** del módulo **MySQL** (ambos deben iluminarse en verde y mostrar su puerto asignado, por defecto `3306` para MySQL).

3. Haga clic en el botón **Admin** ubicado al lado de **MySQL** (esto abrirá automáticamente `http://localhost/phpmyadmin` en su navegador).

4. En el panel izquierdo de **phpMyAdmin**, haga clic en **Nueva** (*New*).

5. En el campo *Nombre de la base de datos*, escriba exactamente:

   ```text

   PLATAFORMA_PHISHING

   ```

   y haga clic en el botón **Crear**.

6. Con la base de datos `PLATAFORMA_PHISHING` seleccionada en el menú izquierdo, haga clic en la pestaña superior **Importar** (*Import*).

7. Presione **Seleccionar archivo** (*Choose File*), busque y seleccione el archivo **`database.sql`** ubicado en `phishing-detector-chacao/database.sql`.

8. Baje hasta el final de la página y haga clic en el botón **Importar** (*Go*).

9. *Verificación:* En el panel izquierdo aparecerán creadas las tablas `analisis_enlaces`, `departamentos` y `dominios_confiables` junto con sus registros iniciales de prueba.



---



### Paso 3: Conectar el Backend (FastAPI) con la Base de Datos de XAMPP

> **Requisito:** Tener instalado **Python 3.11 o 3.12** y mantener encendido el módulo **MySQL** en XAMPP.



1. Abra una terminal y ubíquese en la carpeta del servidor backend:

   ```bash

   cd phishing-detector-chacao/backend

   ```

2. Cree y active el entorno virtual de Python e instale las librerías requeridas:

   * **En Windows:**

     ```bash

     python -m venv .venv

     .venv\Scripts\activate

     pip install -r requirements.txt

     ```

   * **En Linux / macOS:**

     ```bash

     python3 -m venv .venv

     source .venv/bin/activate

     pip install -r requirements.txt

     ```

3. Para enlazar el backend con el servidor MySQL de XAMPP, cree un archivo llamado **`.env`** dentro de `phishing-detector-chacao/backend/` con los parámetros de conexión por defecto de XAMPP (usuario `root` y contraseña vacía):

   ```env

   DB_HOST=127.0.0.1

   DB_PORT=3306

   DB_USER=root

   DB_PASSWORD=

   DB_NAME=PLATAFORMA_PHISHING

   ```

   *(Nota: Si en su instalación local de XAMPP cambió el puerto de MySQL o asignó una contraseña al usuario `root`, colóquelos en `DB_PORT` y `DB_PASSWORD`).*

4. Inicie el servidor backend de FastAPI:

   ```bash

   uvicorn main:app --reload

   ```

   Al iniciar correctamente, la consola mostrará `Uvicorn running on http://127.0.0.1:8000`.

5. **Verificación de conexión:**

   * Al abrir `http://127.0.0.1:8000` en el navegador, la API responderá con `{"sistema": "FJLDI Security Chacao", "estado": "Motor Heurístico Activo - v2.6"}`.

   * Al abrir `http://127.0.0.1:8000/docs`, se desplegará la documentación interactiva (Swagger UI) conectada a `PLATAFORMA_PHISHING`.

6. Regrese a la pestaña del **Frontend** en su navegador y recargue con `F5`. El sistema quedará completamente conectado a la base de datos de XAMPP para escanear enlaces, guardar el historial de auditoría y actualizar las estadísticas en tiempo real.



---



## 👥 Integrantes del Equipo

* **José Gerardo**

* **Fabián García**

* **Isabella Serrano**

* **Daymar Escalona**

* **Luis Marin**
