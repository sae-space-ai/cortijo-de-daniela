# GEO-LAB 3.0 — Integración LiDAR y MDT

## Cortijo de Daniela · Montemolín (Badajoz)

**Punto de referencia:** 38.00653071, −6.060913125

---

## 🎯 Objetivos de la Fase 3

Integrar modelos digitales del terreno (MDT) de alta resolución para:
- Visualizar elevaciones del terreno
- Consultar cotas en cualquier punto
- Calcular pendientes aproximadas
- Identificar resaltes morfológicos
- Trazar perfiles altimétricos

---

## 📦 Productos oficiales disponibles

### MDT02 PNOA-LiDAR
- **Resolución:** 2 metros
- **Fuente:** Plan Nacional de Ortofotografía Aérea (PNOA)
- **Formato:** GeoTIFF / ASC
- **Sistema de referencia:** ETRS89 / UTM 29N (EPSG:25829)
- **Descarga:** [Centro de Descargas CNIG](https://centrodedescargas.cnig.es/)

### MDT50 cm (3ª cobertura)
- **Resolución:** 0.5 metros
- **Disponibilidad:** Extremadura (incluye Montemolín)
- **Formato:** GeoTIFF / ASC
- **Sistema de referencia:** ETRS89 / UTM 29N (EPSG:25829)

---

## ⚠️ Límites científicos

### Lo que el MDT **SÍ** proporciona:
- ✅ Elevaciones del terreno con precisión métrica
- ✅ Modelos de sombreado (hillshade)
- ✅ Cálculo de pendientes
- ✅ Perfiles topográficos
- ✅ Detección de anomalías morfológicas

### Lo que el MDT **NO** proporciona:
- ❌ Identificación directa de minerales
- ❌ Detección de galerías subterráneas
- ❌ Identificación de depósitos arqueológicos
- ❌ Composición litológica del subsuelo

**Las anomalías morfológicas son indicios que requieren verificación de campo.**

---

## 🔧 Procedimiento de integración

### Paso 1: Descarga del MDT

1. Acceder al [Centro de Descargas CNIG](https://centrodedescargas.cnig.es/)
2. Seleccionar "Modelos Digitales de Elevación"
3. Elegir MDT02 o MDT50cm según disponibilidad
4. Descargar la hoja correspondiente a Montemolín

### Paso 2: Procesamiento en SIG

#### Opción A: QGIS (recomendado)

```bash
# 1. Abrir QGIS y cargar el MDT (GeoTIFF o ASC)

# 2. Recortar al área de interés (Cortijo de Daniela)
#    Raster → Extraction → Clip raster by extent
#    Extensión: -6.07, 38.00, -6.05, 38.01 (aproximado)

# 3. Generar hillshade (sombreado)
#    Raster → Analysis → Hillshade

# 4. Calcular pendientes
#    Raster → Analysis → Slope

# 5. Exportar como GeoJSON (puntos muestreados)
#    Processing Toolbox → Raster pixels to points
#    Export layer as GeoJSON (WGS84 / EPSG:4326)
```

#### Opción B: GDAL (línea de comandos)

```bash
# Recortar MDT al área de interés
gdal_translate -projwin -6.07 38.01 -6.05 38.00 \
  -projwin_srs EPSG:4326 \
  MDT_original.tif MDT_recortado.tif

# Generar hillshade
gdaldem hillshade MDT_recortado.tif hillshade.tif

# Calcular pendientes
gdaldem slope MDT_recortado.tif slope.tif

# Convertir a GeoJSON (puntos)
gdal_translate -of XYZ MDT_recortado.tif puntos.xyz
# Luego procesar XYZ a GeoJSON con script Python
```

#### Opción C: Python con Rasterio

```python
import rasterio
import json
from rasterio.transform import xy

# Abrir MDT
with rasterio.open('MDT_recortado.tif') as src:
    # Leer datos
    data = src.read(1)
    transform = src.transform
    
    # Muestrear puntos (cada N píxeles para reducir tamaño)
    step = 2  # ajustar según resolución deseada
    points = []
    
    for i in range(0, data.shape[0], step):
        for j in range(0, data.shape[1], step):
            elev = data[i, j]
            if elev != src.nodata:
                lon, lat = xy(transform, i, j)
                points.append({
                    'lat': lat,
                    'lon': lon,
                    'elev': float(elev)
                })
    
    # Calcular metadatos
    elevations = [p['elev'] for p in points]
    metadata = {
        'resolution': src.res[0],
        'extent': f"{src.bounds.left:.6f},{src.bounds.bottom:.6f},{src.bounds.right:.6f},{src.bounds.top:.6f}",
        'points': len(points),
        'minElev': min(elevations),
        'maxElev': max(elevations),
        'sha256': 'calcular_con_hashlib'
    }
    
    # Exportar como GeoJSON
    output = {
        'metadata': metadata,
        'grid': points
    }
    
    with open('mdt_geolab.json', 'w') as f:
        json.dump(output, f, indent=2)
```

### Paso 3: Importar en GEO-LAB 3.0

1. Abrir el visor GEO-LAB 3.0
2. En el panel lateral, sección "Fase 3 · Integración LiDAR y MDT"
3. Pulsar "⬆ MDT procesado (GeoJSON)"
4. Seleccionar el archivo `mdt_geolab.json` generado
5. El visor mostrará:
   - Metadatos del MDT (resolución, extensión, puntos, rango de elevación)
   - Puntos coloreados según elevación
   - Botones para activar sombreado y consultar cotas

### Paso 4: Consulta de cotas

1. Pulsar "Consultar cota" en el panel
2. Hacer clic en cualquier punto del mapa
3. El visor mostrará:
   - Coordenadas del punto
   - Elevación (cota)
   - Pendiente aproximada (grados y porcentaje)

---

## 📊 Formato de archivo esperado

### MDT procesado (GeoJSON)

```json
{
  "metadata": {
    "resolution": 2,
    "extent": "-6.070000,38.000000,-6.050000,38.010000",
    "points": 25000,
    "minElev": 320.5,
    "maxElev": 485.2,
    "sha256": "abc123..."
  },
  "grid": [
    {
      "lat": 38.006531,
      "lon": -6.060913,
      "elev": 425.3
    },
    {
      "lat": 38.006531,
      "lon": -6.060713,
      "elev": 426.1
    }
  ]
}
```

### Perfil altimétrico (CSV)

```csv
lat;lon;elevacion
38.006531;-6.060913;425.3
38.006600;-6.060850;427.8
38.006700;-6.060750;430.2
```

### Anomalías LiDAR (GeoJSON)

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "tipo": "depresion",
        "descripcion": "Depresión circular de 3m de diámetro",
        "dimensiones": "3x3 m",
        "profundidad_altura": "0.5 m"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[
          [-6.061, 38.006],
          [-6.060, 38.006],
          [-6.060, 38.007],
          [-6.061, 38.007],
          [-6.061, 38.006]
        ]]
      }
    }
  ]
}
```

---

## 🎨 Visualización

### Colores por elevación
- **Azul:** Elevaciones mínimas
- **Verde:** Elevaciones medias
- **Rojo:** Elevaciones máximas

### Anomalías LiDAR
- 🟣 **Depresiones:** Posibles excavaciones, hundimientos
- 🔴 **Montículos:** Posibles escombreras, túmulos
- 🟡 **Alineaciones:** Posibles estructuras, muros

---

## 📈 Análisis avanzados

### Detección de anomalías morfológicas

```python
import numpy as np
from scipy import ndimage

# Cargar MDT como array numpy
# data = ...

# Calcular desviación respecto al entorno (ventana 5x5)
kernel = np.ones((5, 5)) / 25
smooth = ndimage.convolve(data, kernel, mode='reflect')
diff = data - smooth

# Identificar anomalías (desviación > 2 desviaciones estándar)
threshold = 2 * np.std(diff)
anomalies = np.abs(diff) > threshold

# Clasificar anomalías
depressions = (diff < -threshold)  # Depresiones
mounds = (diff > threshold)        # Montículos

# Exportar como GeoJSON
# ...
```

### Perfiles topográficos

```python
import matplotlib.pyplot as plt

# Definir línea de perfil
start = (38.006531, -6.060913)  # Cortijo
end = (38.012500, -6.066280)    # Arroyo Matarrama

# Interpolar elevaciones a lo largo del perfil
# ...

# Graficar perfil
plt.plot(distances, elevations)
plt.xlabel('Distancia (m)')
plt.ylabel('Elevación (m)')
plt.title('Perfil Cortijo - Arroyo Matarrama')
plt.grid(True)
plt.show()
```

---

## 🔍 Integración con otras fuentes

### Cruce con Inventario de Escombreras IGME

1. Consultar escombreras en el visor (botón "Consultar IGME")
2. Comparar ubicaciones con anomalías del MDT
3. Verificar si las escombreras inventariadas coinciden con montículos detectados

### Cruce con Patrimonio Arqueológico

1. Activar capa "Patrimonio arqueológico"
2. Comparar con anomalías morfológicas
3. Documentar posibles estructuras no catalogadas

### Cruce con Cartografía Geológica (GEODE)

1. Activar capa "GEODE 1:50.000"
2. Identificar unidades litológicas del sustrato
3. Correlacionar con anomalías topográficas

---

## 📋 Trazabilidad y documentación

### Metadatos obligatorios

Para cada MDT procesado, registrar:
- **Fuente:** MDT02 / MDT50cm / otro
- **Fecha de descarga:** AAAA-MM-DD
- **Resolución espacial:** metros
- **Sistema de referencia:** ETRS89 / UTM 29N
- **SHA-256 del archivo original:** hash completo
- **Software de procesamiento:** QGIS / GDAL / Python
- **Parámetros de procesamiento:** recorte, muestreo, reproyección

### Registro de procesamiento

```json
{
  "processing_log": [
    {
      "step": "descarga",
      "date": "2026-01-15",
      "source": "Centro de Descargas CNIG",
      "file": "MDT02_718-432.tif",
      "sha256": "abc123..."
    },
    {
      "step": "recorte",
      "date": "2026-01-15",
      "tool": "GDAL 3.6.2",
      "command": "gdal_translate -projwin ...",
      "output": "MDT_recortado.tif"
    },
    {
      "step": "exportacion_geojson",
      "date": "2026-01-15",
      "tool": "Python 3.11 + Rasterio",
      "script": "mdt_to_geojson.py",
      "output": "mdt_geolab.json",
      "points": 25000
    }
  ]
}
```

---

## ⚡ Rendimiento

### Recomendaciones

- **Máximo 50.000 puntos** por archivo GeoJSON para rendimiento óptimo
- **Muestreo inteligente:** cada 2-5 píxeles según resolución
- **Compresión:** usar gzip para archivos > 1 MB
- **Caché del navegador:** las consultas de cota son instantáneas tras carga inicial

### Optimizaciones futuras

- Web Workers para procesamiento en segundo plano
- Indexación espacial (R-tree) para consultas rápidas
- Tile loading para MDT muy extensos
- WebGL para visualización de millones de puntos

---

## 🚀 Próximos pasos

### Inmediatos
1. ✅ Descargar MDT oficial del Centro de Descargas CNIG
2. ✅ Procesar con QGIS/GDAL/Python
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

## 📚 Referencias

- **Centro de Descargas CNIG:** https://centrodedescargas.cnig.es/
- **PNOA-LiDAR:** https://pnoa.ign.es/
- **QGIS:** https://qgis.org/
- **GDAL:** https://gdal.org/
- **Rasterio:** https://rasterio.readthedocs.io/

---

## 📄 Licencia y uso

Los datos MDT del PNOA son de dominio público con atribución al CNIG/IGN.

**Uso responsable:**
- Citar fuentes oficiales
- No presentar anomalías como hallazgos confirmados
- Verificar en campo antes de cualquier intervención
- Respetar la legislación de patrimonio y minería

---

**Versión:** 3.0  
**Fecha:** 2026  
**Estado:** Infraestructura de análisis lista, pendiente incorporar MDT oficial
