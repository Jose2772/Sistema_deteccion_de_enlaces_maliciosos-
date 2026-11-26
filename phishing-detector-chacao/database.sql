CREATE DATABASE IF NOT EXISTS PLATAFORMA_PHISHING
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE PLATAFORMA_PHISHING;

-- 1. Departamentos de la empresa de importación/exportación
CREATE TABLE IF NOT EXISTS departamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  nivel_criticidad ENUM('BAJO', 'MEDIO', 'ALTO', 'CRITICO') DEFAULT 'ALTO'
);

-- 2. Lista blanca de dominios aduaneros, navieros y oficiales
CREATE TABLE IF NOT EXISTS dominios_confiables (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dominio VARCHAR(150) NOT NULL UNIQUE,
  entidad VARCHAR(150) NOT NULL,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Historial de auditoría de enlaces y correos analizados
CREATE TABLE IF NOT EXISTS analisis_enlaces (
  id INT AUTO_INCREMENT PRIMARY KEY,
  remitente VARCHAR(180) DEFAULT 'No especificado',
  departamento VARCHAR(100) NOT NULL,
  url_analizada TEXT NOT NULL,
  dominio_extraido VARCHAR(255) NOT NULL,
  puntaje_riesgo INT NOT NULL DEFAULT 0,
  estado ENUM('SEGURO', 'RIESGO_MEDIO', 'PELIGROSO') NOT NULL,
  motivos JSON NOT NULL,
  reglas_activadas VARCHAR(120) DEFAULT '',
  fecha_analisis DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales de departamentos
INSERT IGNORE INTO departamentos (nombre, nivel_criticidad) VALUES
  ('Logística y Navieras', 'CRITICO'),
  ('Aduanas y Aranceles', 'CRITICO'),
  ('Tesorería y Pagos Internacionales', 'CRITICO'),
  ('Importación / Exportación', 'ALTO'),
  ('Compras Internacionales', 'MEDIO'),
  ('Gerencia General', 'ALTO');

-- Dominios institucionales y logísticos verificados
INSERT IGNORE INTO dominios_confiables (dominio, entidad) VALUES
  ('seniat.gob.ve', 'SENIAT Venezuela'),
  ('bolipuertos.gob.ve', 'Bolivariana de Puertos'),
  ('maersk.com', 'Maersk Line'),
  ('msc.com', 'Mediterranean Shipping Company'),
  ('dhl.com', 'DHL Global Forwarding'),
  ('cma-cgm.com', 'CMA CGM'),
  ('hapag-lloyd.com', 'Hapag-Lloyd'),
  ('banesco.com', 'Banesco Banco Universal'),
  ('provincial.com', 'BBVA Provincial'),
  ('mercantilbanco.com', 'Banco Mercantil');

-- Registros de prueba iniciales (coincidentes con las métricas del dashboard)
INSERT INTO analisis_enlaces (remitente, departamento, url_analizada, dominio_extraido, puntaje_riesgo, estado, motivos, reglas_activadas) VALUES
  (
    'notificaciones@seniat.gob.ve',
    'Aduanas y Aranceles',
    'https://declaraciones.seniat.gob.ve/consulta-manifiesto',
    'declaraciones.seniat.gob.ve',
    0,
    'SEGURO',
    '["Dominio institucional verificado en lista blanca oficial.", "Conexión cifrada mediante protocolo HTTPS válido."]',
    'WHITELIST'
  ),
  (
    'prueba inseguro',
    'Logística y Navieras',
    'http://198.51.100.25/seniat-invoice-bl/descargar_factura.exe',
    '198.51.100.25',
    100,
    'PELIGROSO',
    '["Protocolo HTTP inseguro (sin cifrado SSL/TLS).", "Uso de dirección IP directa en lugar de nombre de dominio corporativo.", "Términos de ingeniería social aduanera/financiera detectados: invoice, bl.", "Descarga directa de archivo ejecutable o de alto riesgo detectada (.exe)."]',
    'R1, R2, R4, R5, R6'
  );
