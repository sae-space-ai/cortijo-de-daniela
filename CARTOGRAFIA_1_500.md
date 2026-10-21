# Cartografía 1:500 · Cortijo de Daniela

## Escala de detalle para estudios especializados

**Ubicación:** Montemolín (Badajoz) · 38.006531 N, −6.060913 O  
**Escala objetivo:** 1:500 (1 cm en mapa = 5 m en terreno)

---

## 📐 ¿Qué es la cartografía 1:500?

La escala 1:500 es una escala de **gran detalle** utilizada para:
- Estudios geotécnicos y geológicos de detalle
- Prospección arqueológica sistemática
- Proyectos de ingeniería civil
- Documentación de yacimientos y estructuras
- Planificación de intervenciones en el terreno

**Precisión requerida:**
- Error posicional: < 0.25 m (25 cm)
- Error altimétrico: < 0.10 m (10 cm)
- Resolución espacial: < 0.50 m (50 cm)

---

## 🗺️ Fuentes disponibles para Montemolín

### 1. Cartografía Catastral (ya integrada en GEO-LAB)

**Características:**
- **Escala:** 1:500 a 1:1000 (variable)
- **Precisión:** Submétrica (< 0.5 m)
- **Contenido:** Límites parcelarios, referencias catastrales, construcciones, servidumbres
- **Formato:** DXF, SHP, GeoJSON
- **Actualización:** Continua

**Datos ya disponibles en GEO-LAB:**
- 8 polígonos catastrales del entorno del Cortijo
- 5 referencias catastrales distintas
- Capas PG-LP (parcelas) y PG-LI (límites)
- SHA-256 verificado: `de3a1c347bcfe6d0248a7bb6212381117ea8576b2f224a1c0f49ce8e05fd52be`

**Acceso:**
- Sede Electrónica del Catastro: https://www1.sedecatastro.gob.es/
- Centro de Descargas CNIG: https://centrodedescargas.cnig.es/

### 2. Ortofoto PNOA (Plan Nacional de Ortofotografía Aérea)

**Características:**
- **Resolución:** 25 cm/píxel (máxima actualidad) / 50 cm/píxel (histórica)
- **Cobertura:** Nacional completa
- **Actualización:** Anual o bianual
- **Formato:** GeoTIFF, ECW, JPEG2000
- **Sistema de referencia:** ETRS89 / UTM 29N (EPSG:25829)

**Aplicaciones para escala 1:500:**
- Base cartográfica de alta resolución
- Identificación de estructuras superficiales
- Documentación fotográfica georreferenciada
- Comparación multitemporal (cambios en el terreno)

**Acceso:**
- Centro de Descargas CNIG: https://centrodedescargas.cnig.es/
- WMS PNOA: https://www.ign.es/wmts/pnoa-ma

### 3. LiDAR PNOA (nube de puntos clasificada)

**Características:**
- **Densidad:** 0.5-1 punto/m² (primera cobertura) / 2-5 puntos/m² (segunda cobertura)
- **Precisión altimétrica:** < 0.10 m (terreno) / < 0.20 m (vegetación)
- **Clasificación:** Suelo, vegetación baja/alta, edificios, agua
- **Formato:** LAZ (comprimido), LAS
- **Sistema de referencia:** ETRS89 / UTM 29N (EPSG:25829)

**Productos derivados para escala 1:500:**
- **MDT (Modelo Digital del Terreno):** Malla de 0.5-2 m
- **MDS (Modelo Digital de Superficie):** Incluye vegetación y edificios
- **Curvas de nivel:** Equidistancia 0.5-1 m
- **Mapas de pendientes:** Resolución submétrica
- **Hillshade (sombreado):** Visualización de microrelieve

**Acceso:**
- Centro de Descargas CNIG: https://centrodedescargas.cnig.es/
- Visualizador LiDAR: https://lidar.ign.es/visor/

### 4. Planos Topográficos Municipales

**Características:**
- **Escala:** 1:500 a 1:2000 (variable según municipio)
- **Contenido:** Calles, edificios, infraestructuras, servicios
- **Precisión:** Variable (consultar ayuntamiento)
- **Formato:** DWG, DXF, PDF georreferenciado

**Acceso:**
- Ayuntamiento de Montemolín
- Diputación de Badajoz
- Oficina de Planificación Urbanística

---

## 🔧 Generación de cartografía 1:500

### Opción A: Desde LiDAR + Ortofoto (recomendado)

#### Paso 1: Descarga de datos

```bash
# Desde Centro de Descargas CNIG
# 1. Ortofoto PNOA (GeoTIFF)
# 2. LiDAR PNOA (LAZ)
# 3. Seleccionar hoja correspondiente a Montemolín
```

#### Paso 2: Procesamiento en QGIS

```bash
# 1. Abrir QGIS y crear proyecto con CRS EPSG:25829

# 2. Cargar ortofoto PNOA
#    Capa → Añadir capa → Añadir capa ráster

# 3. Cargar nube de puntos LiDAR
#    Instalar plugin "LAStools" o "PDAL"
#    Procesar → Caja de herramientas → LAStools → lasview (visualización)

# 4. Clasificar puntos (si no están clasificados)
#    LAStools → lasground (clasificar suelo)
#    LAStools → lasheight (clasificar vegetación)

# 5. Generar MDT de alta resolución
#    LAStools → las2dem
#    Resolución: 0.5 m
#    Salida: MDT_50cm.tif

# 6. Generar curvas de nivel
#    LAStools → las2iso
#    Equidistancia: 0.5 m
#    Salida: curvas_nivel.shp

# 7. Generar hillshade
#    Raster → Análisis → Sombreado (Hillshade)
#    Entrada: MDT_50cm.tif
#    Salida: hillshade.tif

# 8. Recortar al área de interés (Cortijo de Daniela)
#    Raster → Extracción → Recortar ráster por extensión
#    Extensión: -6.07, 38.00, -6.05, 38.01 (aproximado)
```

#### Paso 3: Composición cartográfica

```bash
# 1. Crear composición de impresión
#    Proyecto → Nueva composición de impresión

# 2. Añadir mapa
#    Escala: 1:500
#    Extensión: centrada en el Cortijo de Daniela

# 3. Añadir capas:
#    - Ortofoto PNOA (base)
#    - Límites catastrales
#    - Curvas de nivel (0.5 m)
#    - Hillshade (transparencia 50%)
#    - Puntos de interés (escombreras, indicios)

# 4. Añadir elementos cartográficos:
#    - Norte
#    - Escala gráfica
#    - Leyenda
#    - Coordenadas UTM
#    - Título y fecha

# 5. Exportar
#    Formato: PDF (impresión) / GeoTIFF (digital)
#    Resolución: 300 dpi (impresión) / 150 dpi (digital)
```

### Opción B: Desde Catastro + Ortofoto

```bash
# 1. Descargar cartografía catastral
#    Sede del Catastro → Descarga masiva
#    Formato: DXF o SHP

# 2. Descargar ortofoto PNOA
#    Centro de Descargas CNIG

# 3. Cargar en QGIS
#    - Ortofoto como base
#    - Catastro superpuesto

# 4. Digitalizar elementos adicionales
#    - Caminos, pistas
#    - Estructuras visibles en ortofoto
#    - Puntos de interés

# 5. Generar composición 1:500
#    (igual que Opción A, paso 3)
```

### Opción C: Desde GPS de alta precisión (trabajo de campo)

```bash
# 1. Campaña GPS
#    - Equipo: GNSS RTK o diferencial
#    - Precisión: < 0.02 m (horizontal) / < 0.03 m (vertical)
#    - Puntos: cada 5-10 m (terreno llano) / cada 2-5 m (pendientes)

# 2. Procesamiento
#    - Software: RTKLIB, Trimble Business Center, Leica Infinity
#    - Generar MDT a partir de puntos GPS

# 3. Integración con ortofoto
#    - Superponer puntos GPS sobre ortofoto PNOA
#    - Digitalizar elementos complementarios

# 4. Generar cartografía 1:500
#    (igual que Opción A, paso 3)
```

---

## 📊 Especificaciones técnicas para escala 1:500

### Resolución espacial

| Producto | Resolución mínima | Recomendado |
|----------|-------------------|-------------|
| Ortofoto | 50 cm/píxel | 25 cm/píxel |
| MDT | 1.0 m | 0.5 m |
| Curvas de nivel | 1.0 m equidistancia | 0.5 m |
| Nube de puntos | 1 punto/m² | 2-5 puntos/m² |

### Precisión requerida

| Tipo | Error máximo | Recomendado |
|------|--------------|-------------|
| Posicional (XY) | 0.50 m | 0.25 m |
| Altimétrico (Z) | 0.20 m | 0.10 m |
| Ángulos | 1° | 0.5° |
| Distancias | 0.50 m | 0.25 m |

### Elementos cartográficos obligatorios

- **Sistema de referencia:** ETRS89 / UTM 29N (EPSG:25829)
- **Cuadrícula:** cada 50 m (etiquetada)
- **Curvas de nivel:** maestras cada 2.5 m, secundarias cada 0.5 m
- **Escala gráfica:** 0-25-50-100 m
- **Norte:** flecha indicando norte geográfico
- **Leyenda:** todos los símbolos utilizados
- **Metadata:** fuente, fecha, precisión, autor

---

## 🎯 Aplicaciones para el Cortijo de Daniela

### 1. Estudio geotécnico

**Objetivo:** Caracterizar el terreno para posibles intervenciones

**Cartografía necesaria:**
- MDT de alta resolución (0.5 m)
- Curvas de nivel (0.5 m equidistancia)
- Mapa de pendientes
- Perfil topográfico Cortijo → Arroyo Matarrama
- Sondeos geotécnicos georreferenciados

**Escala:** 1:500  
**Precisión altimétrica:** < 0.10 m

### 2. Prospección arqueológica

**Objetivo:** Identificar estructuras subsuperficiales

**Cartografía necesaria:**
- Ortofoto PNOA (25 cm/píxel)
- Hillshade de alta resolución
- Límites catastrales
- Anomalías morfológicas detectadas en LiDAR
- cuadrícula de prospección (10x10 m)

**Escala:** 1:500  
**Precisión posicional:** < 0.25 m

### 3. Documentación de hallazgos

**Objetivo:** Registrar elementos descubiertos durante la prospección

**Cartografía necesaria:**
- Base topográfica 1:500
- Ortofoto georreferenciada
- Puntos de hallazgo con coordenadas GPS
- Fotografías georreferenciadas
- Perfiles y secciones

**Escala:** 1:200 a 1:500 (según detalle)  
**Precisión:** < 0.10 m (XYZ)

### 4. Análisis de visibilidad

**Objetivo:** Determinar cuencas visuales desde el Cortijo

**Cartografía necesaria:**
- MDT de alta resolución (0.5 m)
- MDS (incluyendo vegetación y edificios)
- Mapa de cuencas visuales
- Perfil topográfico en todas direcciones

**Escala:** 1:500 (detalle) / 1:5000 (entorno)  
**Precisión altimétrica:** < 0.10 m

---

## 📋 Integración en GEO-LAB 3.0

### Importar cartografía 1:500 procesada

**Formato recomendado:** GeoJSON con estructura:

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "escala": "1:500",
    "fecha": "2026-01-15",
    "fuente": "LiDAR PNOA + Catastro",
    "precision_xy": "0.25 m",
    "precision_z": "0.10 m",
    "crs": "EPSG:25829",
    "sha256": "abc123..."
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "tipo": "curva_nivel",
        "elevacion": 425.5,
        "equidistancia": "maestra"
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [[-6.061, 38.006], [-6.060, 38.006]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "tipo": "estructura",
        "descripcion": "Muro de piedra visible en ortofoto",
        "longitud_m": 12.5
      },
      "geometry": {
        "type": "LineString",
        "coordinates": [[-6.061, 38.006], [-6.0605, 38.0065]]
      }
    }
  ]
}
```

**Procedimiento:**
1. Procesar cartografía en QGIS/GDAL
2. Exportar como GeoJSON (WGS84 / EPSG:4326)
3. Importar en GEO-LAB: "⬆ Cartografía 1:500 (GeoJSON)"
4. Visualizar sobre ortofoto PNOA

---

## ⚠️ Límites y consideraciones

### Lo que la cartografía 1:500 **SÍ** permite:
- ✅ Documentación detallada del terreno
- ✅ Identificación de estructuras superficiales
- ✅ Planificación de intervenciones
- ✅ Análisis de visibilidad y pendientes
- ✅ Integración con datos geofísicos

### Lo que la cartografía 1:500 **NO** permite:
- ❌ Identificar minerales (requiere análisis de laboratorio)
- ❌ Detectar galerías subterráneas (requiere geofísica)
- ❌ Confirmar yacimientos arqueológicos (requiere prospección)
- ❌ Sustituir estudios geotécnicos especializados

### Consideraciones legales:
- **Patrimonio arqueológico:** Cualquier intervención requiere autorización de la Junta de Extremadura
- **Propiedad privada:** Respetar límites catastrales y obtener permisos de acceso
- **Protección ambiental:** Consultar normativa de espacios protegidos si aplica

---

## 📚 Recursos adicionales

### Descarga de datos
- **Centro de Descargas CNIG:** https://centrodedescargas.cnig.es/
- **Sede Electrónica del Catastro:** https://www1.sedecatastro.gob.es/
- **Visualizador LiDAR IGN:** https://lidar.ign.es/visor/

### Software recomendado
- **QGIS:** https://qgis.org/ (gratuito, código abierto)
- **GDAL:** https://gdal.org/ (procesamiento de rasters)
- **LAStools:** https://rapidlasso.com/lastools/ (procesamiento LiDAR)
- **CloudCompare:** https://www.danielgm.net/cc/ (visualización nubes de puntos)

### Documentación técnica
- **NTM 1.1:** Norma Técnica de Metodología para cartografía 1:500
- **ETRS89:** Sistema de referencia oficial en España
- **INSPIRE:** Directiva europea de infraestructura de datos espaciales

---

## 📄 Ejemplo de composición cartográfica 1:500

```
┌─────────────────────────────────────────┐
│  CARTOGRAFÍA 1:500                      │
│  Cortijo de Daniela · Montemolín        │
│  Fecha: 2026-01-15                      │
├─────────────────────────────────────────┤
│                                         │
│  [Ortofoto PNOA 25cm como base]        │
│                                         │
│  ┌───┐                                  │
│  │ C │  Límites catastrales (cyan)      │
│  └───┘  Curvas de nivel 0.5m (marrón)  │
│         Hillshade (transparencia 50%)   │
│         Puntos de interés (rojo)        │
│                                         │
│  ┌──────────────────────┐              │
│  │ Perfil A-A'          │              │
│  │ [gráfico de perfil]  │              │
│  └──────────────────────┘              │
│                                         │
├─────────────────────────────────────────┤
│  Escala 1:500    Norte ↑    CRS:25829  │
│  ───┬───┬───┬───                       │
│     0   25  50  100 m                  │
│                                         │
│  Fuente: LiDAR PNOA + Catastro          │
│  Precisión: XY<0.25m, Z<0.10m          │
│  Autor: [nombre] · SHA-256: abc123...  │
└─────────────────────────────────────────┘
```

---

## 🚀 Próximos pasos

### Inmediatos
1. ✅ Descargar ortofoto PNOA (25 cm) del Centro de Descargas CNIG
2. ✅ Descargar LiDAR PNOA (LAZ) de la zona
3. ✅ Procesar en QGIS: generar MDT 0.5m, curvas de nivel, hillshade
4. ✅ Recortar al área del Cortijo de Daniela
5. ✅ Importar en GEO-LAB 3.0 como cartografía 1:500

### A medio plazo
- Digitalizar estructuras visibles en ortofoto
- Integrar con inventario IGME y patrimonio arqueológico
- Generar perfiles topográficos detallados
- Documentar con fotografías georreferenciadas

### A largo plazo
- Campaña GPS de alta precisión (RTK)
- Prospección geofísica (georradar, resistividad)
- Prospección arqueológica autorizada
- Publicación de resultados en formato cartográfico 1:500

---

**Versión:** 1.0  
**Fecha:** 2026  
**Estado:** Documentación lista · Pendiente procesar cartografía oficial
