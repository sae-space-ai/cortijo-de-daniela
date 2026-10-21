# GEO-LAB 2.0 — Cortijo de Daniela

## Visor cartográfico para reconocimiento preliminar de escombreras e indicios minerales

**Ubicación:** Montemolín (Badajoz) · 38.006531 N, −6.060913 O

---

## ⚠️ AVISO IMPORTANTE: LÍMITES PROBATORIOS

### Lo que esta plataforma **NO PUEDE** hacer:

1. **Identificar minerales directamente**
   - Requiere análisis de laboratorio (difracción de rayos X, espectrometría, etc.)
   - La cartografía geológica (GEODE) muestra unidades litológicas a escala 1:50.000, no composición mineralógica verificada

2. **Detectar galerías subterráneas**
   - Requiere estudios geofísicos de campo (georradar, resistividad eléctrica, magnetometría)
   - Los registros mineros históricos (BDMIN) son documentación de inventario, no detección activa

3. **Identificar depósitos arqueológicos**
   - Requiere prospección arqueológica autorizada por la Junta de Extremadura
   - La capa de patrimonio cultural muestra BIC catalogados, no yacimientos no documentados

4. **Verificar hallazgos desde anomalías LiDAR**
   - Las anomalías topográficas son **indicios cartográficos**, no hallazgos geológicos demostrados
   - Requieren verificación de campo y análisis especializado

### Lo que esta plataforma **SÍ PUEDE** hacer:

1. **Integrar fuentes públicas oficiales:**
   - Inventario de escombreras IGME (1989)
   - Base de datos de indicios minerales (BDMIN)
   - Cartografía geológica GEODE 1:50.000
   - Patrimonio arqueológico de Extremadura (BIC catalogados)

2. **Preparar la estructura para importar resultados procesados:**
   - LiDAR PNOA procesado en SIG (GeoJSON de anomalías clasificadas)
   - MDT oficial con perfiles topográficos
   - Clasificación de puntos (suelo, vegetación, estructuras)

3. **Herramientas de análisis cartográfico:**
   - Medición de distancias y superficies
   - Registro de observaciones geolocalizadas
   - Exportación de datos en múltiples formatos

---

## Fase 2: Incorporación de datos procesados

### Procedimiento para LiDAR PNOA

1. **Procesamiento previo (fuera de esta plataforma):**
   - Descargar nube de puntos LiDAR del PNOA (formato LAZ)
   - Procesar en software especializado (CloudCompare, QGIS con plugin LAStools, ArcGIS)
   - Clasificar puntos (suelo, vegetación, estructuras)
   - Generar MDT y MDS
   - Identificar anomalías topográficas (depresiones, montículos, alineaciones)
   - Exportar anomalías como **GeoJSON** (WGS84 / EPSG:4326)

2. **Formato GeoJSON esperado:**
   ```json
   {
     "type": "FeatureCollection",
     "features": [
       {
         "type": "Feature",
         "properties": {
           "tipo": "depresion|monticulo|alineacion",
           "descripcion": "Descripción de la anomalía",
           "dimensiones": "Aprox. 3x2 m",
           "profundidad_altura": "0.5 m"
         },
         "geometry": {
           "type": "Polygon",
           "coordinates": [[[-6.061, 38.006], [-6.060, 38.006], ...]]
         }
       }
     ]
   }
   ```

3. **Importación en GEO-LAB 2.0:**
   - Pulsar "⬆ LiDAR procesado (GeoJSON)"
   - Las anomalías se visualizarán con colores según tipo:
     - 🟣 Depresiones (posibles excavaciones)
     - 🔴 Montículos (posibles escombreras o túmulos)
     - 🟡 Alineaciones (posibles estructuras)

4. **Verificación obligatoria:**
   - Las anomalías son **indicios**, no hallazgos confirmados
   - Requieren prospección de campo
   - Documentar con fotografías, coordenadas GPS precisas
   - Consultar con especialistas (geólogos, arqueólogos)

### Procedimiento para MDT oficial

1. **Descargar MDT25 del IGN:**
   - https://centrodedescargas.cnig.es/
   - Seleccionar "Modelos Digitales de Elevación" → MDT25
   - Descargar la hoja correspondiente a Montemolín

2. **Procesamiento en SIG:**
   - Importar MDT (formato ASC o GeoTIFF)
   - Generar perfiles topográficos entre puntos de interés
   - Calcular pendientes, orientaciones, curvaturas
   - Exportar perfiles como **CSV** con columnas: `lat;lon;elevacion`

3. **Importación de perfiles:**
   - Pulsar "⬆ MDT perfiles (CSV)"
   - El perfil se visualizará en el mapa y en gráfico de elevación

---

## Datos conservados

### Bloque catastral original
- **8 polígonos** con 5 referencias catastrales distintas
- 5 elementos PG-LP (parcelas) + 3 PG-LI (límites)
- **SHA-256:** `de3a1c347bcfe6d0248a7bb6212381117ea8576b2f224a1c0f49ce8e05fd52be`
- Sin simplificación ni modificación de vértices

---

## Servicios WMS integrados

| Capa | Fuente | URL |
|------|--------|-----|
| Escombreras IGME | IGME-CSIC | https://mapas.igme.es/gis/services/BasesDatos/IGME_InventarioEscombreras/MapServer/WMSServer |
| Indicios minerales BDMIN | IGME-CSIC | https://mapas.igme.es/gis/services/BasesDatos/IGME_BDMIN_Indicios/MapServer/WMSServer |
| GEODE 1:50.000 | IGME-CSIC | https://mapas.igme.es/gis/services/Cartografia/IGME_Geode50/MapServer/WMSServer |
| Patrimonio arqueológico | Junta de Extremadura | http://mapas.ideex.es/CICTEX/patrimonioCultural |

---

## Fondos cartográficos

- **Esri World Imagery:** Ortofoto satelital global
- **PNOA (IGN):** Ortofoto oficial española (máxima actualidad)
- **OpenStreetMap:** Callejero colaborativo
- **Relieve IGN:** MDT25 sombreado (escala regional)

---

## Herramientas disponibles

### Medición
- **Medir distancia:** Marcar vértices y calcular distancia total
- **Medir superficie:** Marcar polígono y calcular área
- **Celda 1 m²:** Geometría de referencia (no es una cata verificada)

### Anotación
- **Anotar punto:** Registrar indicios con coordenadas, origen, comprobación y descripción
- Las observaciones se guardan en localStorage del navegador
- Exportar periódicamente la sesión JSON para trazabilidad

### Importación/Exportación
- **GeoJSON:** Datos geográficos completos
- **CSV:** Registros tabulares (plantilla descargable)
- **Sesión JSON:** Copia completa de observaciones e imports
- **Informe HTML:** Documento imprimible con todos los datos

---

## Referencias institucionales

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

## Próximos pasos recomendados

### Para verificación de indicios minerales:
1. Consultar el **Inventario de Escombreras** del IGME (capa WMS activa)
2. Revisar la **BDMIN** para indicios minerales documentados en la zona
3. Si se detectan anomalías en ortofoto o LiDAR:
   - Solicitar permiso de acceso a la propiedad
   - Realizar prospección superficial
   - Tomar muestras para análisis de laboratorio
   - Consultar con geólogo especializado

### Para verificación arqueológica:
1. Consultar la capa de **Patrimonio Cultural** de Extremadura
2. Revisar el **Catálogo de Bienes de Interés Cultural**
3. Si se detectan posibles estructuras:
   - **NO intervenir sin autorización**
   - Contactar con la Dirección General de Patrimonio de la Junta de Extremadura
   - Solicitar prospección arqueológica autorizada
   - Documentar con fotografías y coordenadas GPS

### Para análisis topográfico avanzado:
1. Procesar LiDAR PNOA en SIG especializado
2. Generar MDT de alta resolución
3. Identificar anomalías topográficas
4. Importar resultados en GEO-LAB 2.0
5. Verificar en campo las anomalías detectadas

---

## Limitaciones técnicas

- **No decodifica LAZ ni GeoTIFF:** Requiere procesamiento previo en SIG
- **Escala GEODE:** 1:50.000 (no es detalle submétrico)
- **Dependencia de internet:** Servicios WMS requieren conexión
- **CORS:** Algunas configuraciones de privacidad pueden bloquear consultas
- **Almacenamiento local:** Las observaciones se guardan en el navegador (exportar periódicamente)

---

## Verificación técnica realizada

- ✅ Comparación literal del bloque catastral frente al archivo original
- ✅ Validación sintáctica del JavaScript
- ✅ Pruebas de interacción, medición, registro de observaciones
- ✅ Importación de CSV y exportación GeoJSON/CSV/JSON/HTML
- ⚠️ No se ejecutó comprobación visual con mosaicos reales
- ⚠️ No se ejecutó consulta de red al IGME (las respuestas en pruebas fueron simuladas)

---

## Licencia y uso

Esta plataforma es una herramienta de **reconocimiento preliminar**. No sustituye:
- Estudios geotécnicos profesionales
- Prospecciones arqueológicas autorizadas
- Análisis de laboratorio
- Peritajes oficiales

**Responsabilidad del usuario:** Verificar la información y obtener las autorizaciones necesarias antes de cualquier intervención en el terreno.

---

**Versión:** 2.0  
**Fecha:** 2026  
**Desarrollo:** React + Vite + Tailwind CSS + Leaflet
