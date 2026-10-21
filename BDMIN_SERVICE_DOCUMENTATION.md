# Documentación del Servicio BDMIN - Base de Datos de Indicios Minerales

## Descripción General

El servicio **BDMIN (Base de Datos de Indicios Minerales)** del IGME (Instituto Geológico y Minero de España) proporciona información sobre yacimientos minerales, indicios mineros y manifestaciones mineras históricas en todo el territorio español.

**URL del servicio:**
```
https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_BDMIN_Indicios/MapServer/0
```

**Tipo de servicio:** Feature Layer (capa de entidades)  
**Geometría:** Puntos (esriGeometryPoint)  
**Sistema de referencia:** ETRS89 (EPSG:4326)  
**Escala mínima:** 1:200,000  
**Escala máxima:** Sin límite

---

## Campos Disponibles

### Identificación del Indicio

| Campo | Alias | Tipo | Descripción |
|-------|-------|------|-------------|
| **NOMBREMIN** | Nombre del yacimiento | String (255) | Denominación oficial del yacimiento o indicio |
| **PARAJE** | Paraje | String (255) | Nombre del paraje donde se ubica |
| **MUNICIPIO** | Municipio | String (255) | Municipio donde se encuentra |
| **PROVINCIA** | Provincia | String (255) | Provincia administrativa |
| **HOJA** | Hoja MAGNA | String (8) | Número de hoja del Mapa Geológico |
| **OCTA** | Octante | String (8) | Octante cartográfico |
| **NUM** | Número | String (8) | Número de registro |

### Características Minerales

| Campo | Alias | Tipo | Descripción |
|-------|-------|------|-------------|
| **Sustancia** | Sustancia | String (255) | Tipo de sustancia mineral principal |
| **SUST_MIN** | Sustancia mineral | String (255) | Mineral específico identificado |
| **MENA** | Mena | String (255) | Mineral de interés económico |
| **TIPO_YACIMIENTO** | Tipo de yacimiento | String (255) | Clasificación genética del yacimiento |
| **ESTADO** | Estado | String (255) | Situación actual (explorado, explotado, abandonado) |
| **EVALM** | Evaluación minera | String (255) | Evaluación del potencial minero |

### Ubicación y Topografía

| Campo | Alias | Tipo | Descripción |
|-------|-------|------|-------------|
| **HUSO** | Huso UTM | Double | Huso del sistema UTM |
| **COORX** | Coordenada X (UTM) | Double | Coordenada este en metros |
| **COORY** | Coordenada Y (UTM) | Double | Coordenada norte en metros |
| **COTA** | Cota topográfica | Double | Altitud en metros sobre el nivel del mar |
| **ALTITUD** | Altitud | Double | Altitud alternativa |

### Características Geológicas

| Campo | Alias | Tipo | Descripción |
|-------|-------|------|-------------|
| **TERR** | Tipo de terreno | String (255) | Descripción del terreno |
| **SUEST** | Estructura sustrato | String (255) | Estructura geológica del sustrato |
| **SUFRA** | Fracturación sustrato | String (255) | Grado de fracturación |
| **SUPER** | Permeabilidad sustrato | String (255) | Permeabilidad del sustrato |
| **SUSIS** | Sismicidad sustrato | String (255) | Grado de sismicidad |

### Características del Yacimiento

| Campo | Alias | Tipo | Descripción |
|-------|-------|------|-------------|
| **VOLU** | Volumen | Double | Volumen estimado en m³ |
| **LEY** | Ley | String (255) | Concentración del mineral |
| **ESALT** | Alterabilidad | String (255) | Grado de alteración |
| **ESSEG** | Segregación | String (255) | Tipo de segregación |
| **ESCIS** | Compacidad in situ | String (255) | Compactación del material |

### Hidrogeología

| Campo | Alias | Tipo | Descripción |
|-------|-------|------|-------------|
| **AGUAS** | Aguas existentes | String (255) | Presencia de aguas |
| **NIVFR** | Nivel freático | String (255) | Profundidad del nivel freático |

### Información Administrativa

| Campo | Alias | Tipo | Descripción |
|-------|-------|------|-------------|
| **ANINV** | Años de inventario | String (255) | Año de inclusión en el inventario |
| **REGISTRO** | Registro | String (255) | Número de registro oficial |
| **OBSER** | Observaciones | String (255) | Observaciones adicionales |
| **BIBLIOGRAFIA** | Bibliografía | String (255) | Referencias bibliográficas |

### Identificadores del Sistema

| Campo | Alias | Tipo | Descripción |
|-------|-------|------|-------------|
| **IDent** | IDent | Integer | Identificador único |
| **ESRI_OID** | ESRI_OID | OID | Identificador ESRI |

---

## Códigos de Simbología

El servicio utiliza códigos numéricos para clasificar visualmente los tipos de indicios:

### Serie 0001 - Metales preciosos y base
- **000101030-000101040**: Oro y plata
- **000102010-000102040**: Cobre
- **000103010-000103040**: Plomo
- **000104010-000104040**: Zinc
- **000106010-000106040**: Hierro
- **000107020-000107030**: Manganeso
- **000108030-000108040**: Estaño
- **000109010-000109040**: Tungsteno

### Serie 0002 - Minerales industriales
- **000201030-000201040**: Cuarzo
- **000202010-000202040**: Feldespato
- **000203030-000203040**: Caolín
- **000204010-000204040**: Arcillas
- **000206010-000206040**: Calizas
- **000209020-000209040**: Yeso

### Serie 0003 - Minerales energéticos
- **000301040**: Carbón
- **000302010-000302040**: Uranio
- **000304010-000304040**: Pizarra
- **000305010**: Turba
- **000306010-000306040**: Petróleo
- **000308030-000308040**: Gas natural
- **000309030-000309040**: Geotermia

### Serie 0004 - Rocas ornamentales
- **000401040**: Mármol
- **000402040**: Granito
- **000403010-000403040**: Pizarra ornamental
- **000404010-000404040**: Cuarcita
- **000405040**: Arenisca
- **000406030-000406040**: Otras rocas
- **000407010-000407040**: Áridos
- **000409030-000409040**: Otros materiales

### Serie 0005 - Minerales especiales
- **000502010-000502040**: Minerales de tierras raras
- **000503010**: Minerales estratégicos
- **000504010-000504040**: Minerales de litio
- **000506010-000506040**: Minerales de cobalto
- **000508030**: Minerales de níquel
- **000509040**: Otros minerales especiales

### Serie 0006 - Aguas minerales
- **000601040**: Aguas termales
- **000602010-000602040**: Aguas minero-medicinales
- **000603010-000603040**: Manantiales
- **000604030-000604040**: Fuentes
- **000606030-000606040**: Captaciones
- **000609030-000609040**: Otras aguas

### Serie 0007 - Manifestaciones mineras
- **000701040**: Minas históricas
- **000702020-000702040**: Canteras
- **000703010-000703030**: Escombreras
- **000704010-000704040**: Lavaderos
- **000706010-000706040**: Fundiciones
- **000707010-000707040**: Infraestructuras mineras
- **000709010-000709040**: Otras manifestaciones

---

## Ejemplos de Consultas

### Consulta básica por ubicación

```javascript
const params = new URLSearchParams({
  where: "1=1",
  geometry: "-6.07,38.00,-6.05,38.01",
  geometryType: "esriGeometryEnvelope",
  inSR: "4326",
  outSR: "4326",
  spatialRel: "esriSpatialRelIntersects",
  outFields: "*",
  returnGeometry: "true",
  f: "geojson"
});

const response = await fetch(
  `https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_BDMIN_Indicios/MapServer/0/query?${params}`
);
```

### Consulta por tipo de sustancia

```javascript
const params = new URLSearchParams({
  where: "Sustancia = 'Oro'",
  geometry: "-6.119,37.962,-6.003,38.052",
  geometryType: "esriGeometryEnvelope",
  inSR: "4326",
  outSR: "4326",
  spatialRel: "esriSpatialRelIntersects",
  outFields: "*",
  returnGeometry: "true",
  f: "geojson"
});
```

### Consulta por estado

```javascript
const params = new URLSearchParams({
  where: "ESTADO = 'Abandonado'",
  geometry: "-6.119,37.962,-6.003,38.052",
  geometryType: "esriGeometryEnvelope",
  inSR: "4326",
  outSR: "4326",
  spatialRel: "esriSpatialRelIntersects",
  outFields: "*",
  returnGeometry: "true",
  f: "geojson"
});
```

### Consulta por tipo de yacimiento

```javascript
const params = new URLSearchParams({
  where: "TIPO_YACIMIENTO LIKE '%veta%'",
  geometry: "-6.119,37.962,-6.003,38.052",
  geometryType: "esriGeometryEnvelope",
  inSR: "4326",
  outSR: "4326",
  spatialRel: "esriSpatialRelIntersects",
  outFields: "*",
  returnGeometry: "true",
  f: "geojson"
});
```

### Consulta combinada

```javascript
const params = new URLSearchParams({
  where: "Sustancia = 'Cobre' AND ESTADO = 'Abandonado' AND VOLU > 1000",
  geometry: "-6.119,37.962,-6.003,38.052",
  geometryType: "esriGeometryEnvelope",
  inSR: "4326",
  outSR: "4326",
  spatialRel: "esriSpatialRelIntersects",
  outFields: "*",
  returnGeometry: "true",
  f: "geojson"
});
```

---

## Integración con GEO-LAB 3.0

### Visualización en el Mapa

Los indicios minerales se visualizan con:
- **Color:** Púrpura (#703dab)
- **Radio:** 7 píxeles
- **Borde:** Blanco, 1.5 píxeles
- **Opacidad:** 95%

### Popup Enriquecido

El popup muestra:
1. **Nombre del yacimiento** (NOMBREMIN)
2. **Tipo de yacimiento** (TIPO_YACIMIENTO)
3. **Paraje** (PARAJE)
4. **Sustancia mineral** (Sustancia)
5. **Mena** (MENA)
6. **Estado** (ESTADO)
7. **Volumen** (VOLU) si disponible
8. **Cota** (COTA) si disponible
9. **Municipio y Provincia**
10. **Coordenadas UTM** (COORX, COORY)
11. **Distancia al Cortijo de Daniela**
12. **Observaciones** (OBSER)
13. **Bibliografía** (BIBLIOGRAFIA) truncada a 80 caracteres

### Panel de Resultados

El panel lateral muestra:
- **Conteo total** de indicios en el radio seleccionado
- **Estadísticas** (distancia mín/máx, volumen total si aplica)
- **Lista detallada** con:
  - Nombre del indicio
  - Distancia al Cortijo
  - Tipo de yacimiento
  - Sustancia mineral
  - Volumen (si disponible)
  - Estado
  - Cota (si disponible)
  - Municipio y provincia

### Exportación de Datos

#### CSV
Incluye 18 columnas:
- lat, lon, nombre, tipo_yacimiento, paraje, sustancia, mena, estado
- volumen_m3, cota_m, municipio, provincia, coordenadas_utm
- distancia_m, fuente, observaciones, bibliografia, fecha

#### HTML
Tabla completa con 10 columnas principales:
- Nombre, Distancia, Tipo Yacimiento, Sustancia, Mena
- Estado, Volumen, Cota, Municipio, Provincia

---

## Limitaciones y Consideraciones

### Limitaciones del Servicio

1. **Datos históricos:** La base de datos contiene registros de diferentes épocas
2. **Verificación de campo:** Los indicios requieren verificación in situ
3. **Actualización:** No todos los registros están actualizados
4. **Completitud:** Puede haber indicios no catalogados
5. **Precisión:** La precisión posicional varía según la fuente original

### Consideraciones Legales

1. **Propiedad del subsuelo:** En España, los recursos del subsuelo son de dominio público
2. **Permisos de investigación:** Requieren autorización de la Administración Minera
3. **Patrimonio histórico:** Algunas minas históricas están protegidas
4. **Impacto ambiental:** Cualquier intervención requiere evaluación ambiental

### Consideraciones Científicas

1. **No identifica minerales directamente:** Requiere análisis de laboratorio
2. **No detecta galerías subterráneas:** Requiere geofísica de campo
3. **Los registros son indicios:** No garantizan presencia actual de minerales
4. **Escala regional:** La base de datos es para reconocimiento, no para detalle

---

## Referencias Cruzadas

### Con Inventario de Escombreras (1989)

- Comparar ubicaciones de indicios con escombreras cercanas
- Identificar correlaciones entre tipo de indicio y tipo de escombrera
- Evaluar potencial de recuperación de materiales

### Con Cartografía GEODE (1:50,000)

- Contexto geológico regional
- Unidades litológicas del sustrato
- Estructuras geológicas asociadas

### Con Patrimonio Arqueológico

- Minas históricas catalogadas como BIC
- Canteras antiguas
- Manifestaciones mineras de interés cultural

### Con LiDAR PNOA

- Detección de escombreras no catalogadas
- Identificación de antiguas explotaciones
- Análisis de modificaciones del terreno

---

## Recursos Adicionales

### Enlaces Oficiales

- **IGME - BDMIN:** https://www.igme.es/
- **Visor IGME:** https://info.igme.es/visor/
- **Servicios WMS:** https://mapas.igme.es/gis/
- **Centro Descargas CNIG:** https://centrodedescargas.cnig.es/

### Documentación Técnica

- **Ley de Minas:** Ley 22/1973, de 21 de julio
- **Reglamento General:** Real Decreto 2857/1978
- **Norma Técnica:** Instrucción para la investigación de recursos mineros

### Software Recomendado

- **QGIS:** Visualización y análisis espacial
- **GDAL:** Procesamiento de datos geoespaciales
- **Python + GeoPandas:** Análisis automatizado
- **R + sf:** Análisis estadístico espacial

---

## Ejemplo de Uso en el Cortijo de Daniela

### Escenario

Búsqueda de indicios minerales en un radio de 5 km alrededor del Cortijo de Daniela (38.006531, -6.060913).

### Procedimiento

1. **Consulta inicial:** Radio de 5 km, todos los tipos de indicios
2. **Filtrado por sustancia:** Oro, cobre, estaño (minerales históricos de la zona)
3. **Análisis de resultados:**
   - Identificar indicios más cercanos
   - Evaluar tipo de yacimiento
   - Revisar estado actual
   - Consultar bibliografía asociada
4. **Cruce con otras fuentes:**
   - Superponer con escombreras del Inventario 1989
   - Comparar con cartografía GEODE
   - Analizar con LiDAR PNOA
5. **Planificación de verificación:**
   - Seleccionar indicios prioritarios
   - Planificar trabajo de campo
   - Documentar con fotografías GPS

### Resultados Esperados

- Lista de indicios minerales históricos en la zona
- Información sobre tipos de yacimientos
- Datos sobre sustancias minerales identificadas
- Estado actual de las manifestaciones
- Referencias bibliográficas para estudio detallado

---

**Versión:** 1.0  
**Fecha:** 2026  
**Servicio:** IGME BDMIN - Base de Datos de Indicios Minerales  
**URL:** https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_BDMIN_Indicios/MapServer/0
