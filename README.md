# GEO-LAB · Cortijo de Daniela

## Visor cartográfico para reconocimiento preliminar con integración LiDAR y MDT

**Ubicación:** Montemolín (Badajoz) · 38.006531 N, −6.060913 O  
**Versión actual:** 3.0

---

## 📋 Resumen ejecutivo

GEO-LAB es una plataforma web de reconocimiento cartográfico que integra:
- Cartografía catastral original (8 polígonos, 5 referencias)
- Servicios WMS oficiales (IGME, patrimonio arqueológico)
- Modelos digitales del terreno (MDT02, MDT50cm)
- Herramientas de medición y anotación
- Sistema de trazabilidad con hashes SHA-256

**Estado actual:** Infraestructura completa lista para integrar MDT oficial del Cortijo de Daniela.

---

## 🎯 Evolución del proyecto

### Versión 1.0 — Visor básico
- Mapa interactivo con Leaflet
- Polígonos catastrales originales
- Consulta IGME (escombreras 1989, indicios BDMIN)
- Herramientas de medición
- Exportación GeoJSON/CSV/JSON/HTML

### Versión 2.0 — Análisis avanzados
- Capa WMS de patrimonio arqueológico (Junta de Extremadura)
- Panel de límites probatorios
- Sistema de anotaciones geolocalizadas
- Preparación para importación LiDAR/MDT
- Documentación técnica completa

### Versión 3.0 — Integración LiDAR y MDT (actual)
- Carga de MDT procesado (GeoJSON)
- Consulta de cotas y pendientes
- Visualización de perfiles altimétricos
- Detección de anomalías morfológicas
- Sistema de trazabilidad con SHA-256
- Guía completa de procesamiento SIG

---

## 📦 Archivos del proyecto

### Visor web
- **`index.html`** — Punto de entrada HTML
- **`src/App.tsx`** — Aplicación React completa (1200+ líneas)
- **`src/data/parcels.ts`** — Datos catastrales originales
- **`src/index.css`** — Estilos Tailwind CSS

### Documentación
- **`README.md`** — Este archivo (resumen general)
- **`GEOLAB_3.0_LIDAR_MDT_GUIDE.md`** — Guía completa de integración LiDAR/MDT
- **`IGME_SERVICE_DOCUMENTATION.md`** — Documentación del servicio IGME (Inventario de Escombreras)
- **`BDMIN_SERVICE_DOCUMENTATION.md`** — Documentación del servicio BDMIN (Indicios Minerales)
- **`public/cortijo_daniela_busqueda_escombreras_original.html`** — Versión 1.0 original

### Build
- **`dist/`** — Archivos compilados para producción
  - `index.html` (0.5 KB)
  - `assets/index-*.js` (~356 KB)
  - `assets/index-*.css` (~16 KB)

---

## 🚀 Uso rápido

### Abrir el visor

1. **Desarrollo local:**
   ```bash
   npm install
   npm run dev
   # Abrir http://localhost:5173
   ```

2. **Producción:**
   ```bash
   npm run build
   # Servir dist/index.html con cualquier servidor HTTP
   ```

3. **Archivo HTML standalone:**
   - Abrir `public/cortijo_daniela_busqueda_escombreras_original.html` directamente en el navegador

### Cargar MDT procesado

1. Procesar MDT oficial con QGIS/GDAL/Python (ver guía)
2. Exportar como GeoJSON con estructura `{metadata, grid}`
3. En el visor: "⬆ MDT procesado (GeoJSON)"
4. Activar "Consultar cota" y hacer clic en el mapa

---

## 🔍 Funcionalidades principales

### Cartografía
- **Fondos:** Esri World Imagery, PNOA (IGN), OpenStreetMap, Relieve IGN
- **Capas WMS:** Escombreras IGME, Indicios minerales BDMIN, GEODE 1:50.000, Patrimonio arqueológico
- **Datos catastrales:** 8 polígonos originales preservados (SHA-256 verificado)

### Consulta IGME
- Radio configurable: 1, 3 o 5 km
- Campos detallados: nombre, tipo, sustancia, mena, volumen, cota, municipio
- Estadísticas: distancia mín/máx, volumen total
- Popups enriquecidos en el mapa

### Herramientas de medición
- **Distancia:** Marcar vértices y calcular distancia total
- **Superficie:** Marcar polígono y calcular área
- **Celda 1 m²:** Geometría de referencia (no es una cata)
- **Perfil altimétrico:** Importar CSV con elevaciones

### Integración MDT (Fase 3)
- Carga de MDT procesado (GeoJSON)
- Consulta de cotas en cualquier punto
- Cálculo de pendientes aproximadas
- Visualización de puntos coloreados por elevación
- Metadatos: resolución, extensión, SHA-256

### Anotaciones
- Registrar indicios geolocalizados
- Campos: origen, comprobación, descripción
- Almacenamiento en localStorage
- Exportación en sesión JSON

### Importación/Exportación
- **GeoJSON:** Datos geográficos completos
- **CSV:** Registros tabulares (14 columnas)
- **Sesión JSON:** Copia completa de observaciones
- **Informe HTML:** Documento imprimible

---

## ⚠️ Límites probatorios

### Lo que la plataforma **NO PUEDE** hacer:

1. **Identificar minerales directamente**
   - Requiere análisis de laboratorio (DRX, espectrometría)

2. **Detectar galerías subterráneas**
   - Requiere geofísica de campo (georradar, resistividad)

3. **Identificar yacimientos arqueológicos**
   - Requiere prospección autorizada por la Junta de Extremadura

4. **Verificar hallazgos desde anomalías LiDAR/MDT**
   - Son indicios cartográficos, no hallazgos confirmados

### Lo que la plataforma **SÍ PUEDE** hacer:

1. **Integrar fuentes públicas oficiales**
2. **Preparar la estructura para importar resultados procesados**
3. **Proporcionar herramientas de análisis cartográfico**
4. **Documentar observaciones con trazabilidad**

---

## 📊 Datos conservados

### Bloque catastral original
- **8 polígonos** con 5 referencias catastrales distintas
- 5 elementos PG-LP (parcelas) + 3 PG-LI (límites)
- **SHA-256:** `de3a1c347bcfe6d0248a7bb6212381117ea8576b2f224a1c0f49ce8e05fd52be`
- Sin simplificación ni modificación de vértices

### Servicios WMS integrados
| Capa | Fuente | URL |
|------|--------|-----|
| Escombreras IGME | IGME-CSIC | mapas.igme.es |
| Indicios minerales BDMIN | IGME-CSIC | mapas.igme.es |
| GEODE 1:50.000 | IGME-CSIC | mapas.igme.es |
| Patrimonio arqueológico | Junta de Extremadura | mapas.ideex.es |

---

## 🔧 Requisitos técnicos

### Para el visor
- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Conexión a internet (para servicios WMS y tile servers)
- JavaScript habilitado

### Para procesamiento MDT
- **QGIS 3.x** (recomendado) o
- **GDAL 3.x** (línea de comandos) o
- **Python 3.8+** con rasterio, numpy, scipy

### Para desarrollo
- Node.js 18+
- npm 9+
- React 18
- TypeScript 5
- Vite 6
- Tailwind CSS 4

---

## 📚 Documentación detallada

- **[GEOLAB_3.0_LIDAR_MDT_GUIDE.md](./GEOLAB_3.0_LIDAR_MDT_GUIDE.md)** — Guía completa de integración LiDAR y MDT
  - Procedimiento de descarga y procesamiento
  - Scripts de ejemplo (QGIS, GDAL, Python)
  - Formato de archivos esperados
  - Análisis de anomalías morfológicas
  - Trazabilidad y documentación

- **[IGME_SERVICE_DOCUMENTATION.md](./IGME_SERVICE_DOCUMENTATION.md)** — Documentación del servicio IGME (Inventario de Escombreras)
  - Campos disponibles (34 campos)
  - Consultas avanzadas con filtros
  - Integración con otras fuentes
  - Ejemplos de uso

- **[BDMIN_SERVICE_DOCUMENTATION.md](./BDMIN_SERVICE_DOCUMENTATION.md)** — Documentación del servicio BDMIN (Base de Datos de Indicios Minerales)
  - Campos disponibles (35+ campos)
  - Códigos de simbología por tipo de mineral
  - Consultas por sustancia, estado, tipo de yacimiento
  - Integración con Inventario de Escombreras y GEODE
  - Ejemplos de uso para el Cortijo de Daniela

---

## 🎓 Próximos pasos recomendados

### Inmediatos
1. ✅ Descargar MDT oficial del Centro de Descargas CNIG
2. ✅ Procesar con QGIS/GDAL/Python (ver guía)
3. ✅ Importar en GEO-LAB 3.0
4. ✅ Consultar cotas del Cortijo y arroyo Matarrama

### A medio plazo
- Generar perfiles topográficos Cortijo → Arroyo
- Detectar anomalías morfológicas automáticas
- Cruzar con inventario IGME y patrimonio arqueológico
- Documentar hallazgos con fotografías georreferenciadas

### A largo plazo
- Integrar LiDAR multitemporal (detectar cambios)
- Análisis de cuencas visuales
- Modelado 3D del terreno
- Realidad aumentada para trabajo de campo

---

## 🔬 Verificación técnica realizada

- ✅ Comparación literal del bloque catastral frente al archivo original
- ✅ Validación sintáctica del JavaScript (TypeScript)
- ✅ Pruebas de interacción, medición, registro de observaciones
- ✅ Importación de CSV y exportación GeoJSON/CSV/JSON/HTML
- ✅ Compilación exitosa con Vite
- ⚠️ No se ejecutó comprobación visual con mosaicos reales
- ⚠️ No se ejecutó consulta de red al IGME en pruebas automatizadas
- ⚠️ No se han incorporado aún elevaciones reales del Cortijo (pendiente MDT oficial)

---

## 📄 Licencia y uso

### Datos
- **Cartografía catastral:** Aportada por el usuario
- **Servicios WMS:** IGME-CSIC, IGN, CNIG, Junta de Extremadura
- **MDT PNOA:** Dominio público con atribución al CNIG/IGN

### Software
- **React, Vite, Tailwind CSS:** MIT License
- **Leaflet:** BSD 2-Clause License

### Responsabilidad
Esta plataforma es una herramienta de **reconocimiento preliminar**. No sustituye:
- Estudios geotécnicos profesionales
- Prospecciones arqueológicas autorizadas
- Análisis de laboratorio
- Peritajes oficiales

**Responsabilidad del usuario:** Verificar la información y obtener las autorizaciones necesarias antes de cualquier intervención en el terreno.

---

## 📞 Referencias institucionales

- **IGME-CSIC:** Instituto Geológico y Minero de España
  - https://www.igme.es/
  - https://info.igme.es/cartografiadigital/

- **IGN:** Instituto Geográfico Nacional
  - https://www.ign.es/
  - https://centrodedescargas.cnig.es/

- **CNIG:** Centro Nacional de Información Geográfica
  - https://www.cnig.es/

- **Junta de Extremadura:** Patrimonio cultural
  - http://mapas.ideex.es/

---

## 📝 Historial de cambios

### v3.0 (2026)
- Integración de MDT procesado (GeoJSON)
- Consulta de cotas y pendientes
- Visualización de perfiles altimétricos
- Sistema de trazabilidad con SHA-256
- Guía completa de procesamiento SIG

### v2.0 (2026)
- Capa WMS de patrimonio arqueológico
- Panel de límites probatorios
- Sistema de anotaciones geolocalizadas
- Preparación para importación LiDAR/MDT

### v1.0 (2026)
- Visor cartográfico básico
- Consulta IGME (escombreras, indicios)
- Herramientas de medición
- Exportación de datos

---

**Desarrollo:** React + Vite + TypeScript + Tailwind CSS + Leaflet  
**Última actualización:** 2026  
**Estado:** Producción · Infraestructura lista para MDT oficial
