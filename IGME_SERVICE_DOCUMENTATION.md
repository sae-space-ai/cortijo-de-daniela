# Mejoras en la consulta IGME — Inventario de Escombreras 1989

## Documentación del servicio

El servicio REST del IGME proporciona información detallada sobre escombreras mineras inventariadas en 1989. La documentación completa está disponible en:

**URL del servicio:**
```
https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_InventarioEscombreras/MapServer/0
```

## Campos disponibles

El servicio incluye los siguientes campos para cada registro:

### Identificación
- **HOJA**: Hoja del Mapa Geológico (SGE)
- **OCTA**: Octante
- **NUM**: Número de registro
- **NOMBRE**: Denominación de la escombrera
- **PARAJE**: Nombre del paraje
- **NOMBRE_MUN**: Municipio
- **NMPRV**: Provincia

### Características técnicas
- **ESTRUC**: Tipo de estructura (Escombrera, Mixta)
- **Sustancia**: Sustancia mineral
- **MENA**: Mena principal
- **VOLU**: Volumen estimado (m³)
- **COTA**: Cota topográfica (m)
- **TERR**: Tipo de terreno

### Ubicación
- **HUSO**: Huso UTM
- **COORX**: Coordenada X (UTM)
- **COORY**: Coordenada Y (UTM)

### Condiciones hidrogeológicas
- **AGUAS**: Aguas existentes
- **NIVFR**: Nivel freático

### Características del sustrato
- **SUEST**: Estructura del sustrato
- **SUFRA**: Fracturación del sustrato
- **SUPER**: Permeabilidad del sustrato
- **SUSIS**: Grado de sismicidad del sustrato (PGS)

### Características de los escombros
- **Tipo_Escombro**: Litología de los escombros
- **ESALT**: Alterabilidad
- **ESSEG**: Segregación
- **ESCIS**: Compacidad in situ
- **LEY**: Ley (contenido en mineral)

### Evaluaciones
- **EVALM**: Evaluación minera
- **EVALA**: Evaluación ambiental
- **EVALG**: Evaluación geotécnica

### Otros
- **ANINV**: Años de inventario
- **REGISTRO**: Registro
- **OBSER**: Observaciones

## Mejoras implementadas en GEO-LAB 2.0

### 1. Popups enriquecidos en el mapa

Los marcadores ahora muestran información completa:
- Nombre y paraje
- Tipo de estructura
- Sustancia y mena
- Volumen estimado
- Cota topográfica
- Municipio
- Observaciones
- Distancia al punto de referencia

### 2. Panel de resultados mejorado

El panel lateral ahora incluye:
- **Estadísticas resumidas**:
  - Distancia mínima y máxima
  - Volumen total de escombreras
- **Lista detallada** con:
  - Nombre del registro
  - Distancia al cortijo
  - Tipo de estructura
  - Sustancia mineral
  - Volumen (si disponible)
  - Mena (si disponible)
  - Cota topográfica

### 3. Exportación CSV ampliada

El archivo CSV exportado ahora incluye todos los campos relevantes:
```
lat;lon;nombre;tipo;paraje;sustancia;mena;volumen_m3;cota_m;municipio;distancia_m;fuente;observaciones;fecha
```

### 4. Informe HTML detallado

El informe HTML generado incluye:
- Tabla completa con todos los campos
- Estadísticas por tipo de registro
- Información de volumen y cota
- Datos de municipio y paraje

## Ejemplo de uso

### Consulta con radio de 5 km

1. Seleccionar radio de 5 km
2. Pulsar "Consultar IGME"
3. El sistema consulta el servicio REST con:
   ```
   geometry=-6.119,37.962,-6.003,38.052
   geometryType=esriGeometryEnvelope
   inSR=4326
   outSR=4326
   spatialRel=esriSpatialRelIntersects
   outFields=*
   returnGeometry=true
   f=geojson
   ```
4. Los resultados se filtran por distancia real (haversine) al punto de referencia
5. Se muestran en el mapa y en el panel lateral

### Análisis de resultados

Para el entorno del Cortijo de Daniela, la consulta puede revelar:

- **Escombreras históricas**: Registros con tipo "Escombrera"
- **Estructuras mixtas**: Registros con tipo "Mixta"
- **Sustancias minerales**: Información sobre qué minerales se explotaban
- **Volumen estimado**: Tamaño aproximado de las escombreras
- **Mena principal**: Qué mineral se extraía

### Limitaciones importantes

1. **Inventario de 1989**: Los datos tienen más de 35 años
2. **No verifica presencia actual**: Una escombrera inventariada puede haber sido retirada
3. **No confirma contenido**: La sustancia registrada es histórica, no verificada
4. **Volumen estimado**: Puede no ser preciso
5. **MaxRecordCount**: El servicio limita a 1000 registros por consulta

## Consultas avanzadas

### Filtrar por tipo de estructura

Para consultar solo escombreras (no estructuras mixtas):
```
where=ESTRUC='Escombrera'
```

### Filtrar por sustancia

Para consultar solo escombreras de una sustancia específica:
```
where=Sustancia='Oro'
```

### Filtrar por volumen mínimo

Para consultar solo escombreras con volumen superior a 1000 m³:
```
where=VOLU>1000
```

### Combinar filtros

```
where=ESTRUC='Escombrera' AND Sustancia='Oro' AND VOLU>500
```

## Integración con otras fuentes

### Cruce con BDMIN (indicios minerales)

Comparar las escombreras del inventario con los indicios minerales de la BDMIN puede revelar:
- Correlación entre escombreras y indicios documentados
- Zonas con mayor potencial mineral
- Áreas de interés para prospección

### Cruce con GEODE (cartografía geológica)

Superponer las escombreras con la cartografía geológica permite:
- Identificar el contexto geológico
- Comprender la litología del sustrato
- Evaluar el potencial mineralógico

### Cruce con LiDAR PNOA

Comparar las escombreras inventariadas con anomalías LiDAR puede:
- Confirmar la presencia de escombreras no inventariadas
- Detectar cambios desde 1989
- Identificar escombreras retiradas

## Próximos pasos recomendados

1. **Verificación de campo**: Visitar las escombreras más cercanas
2. **Documentación fotográfica**: Registrar el estado actual
3. **Muestreo**: Tomar muestras para análisis de laboratorio
4. **Comparación temporal**: Comparar con ortofotos históricas
5. **Análisis LiDAR**: Procesar datos LiDAR para detectar cambios

## Referencias

- **IGME**: Instituto Geológico y Minero de España
- **Servicio REST**: https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_InventarioEscombreras/MapServer/0
- **Documentación API**: https://mapas.igme.es/gis/sdk/rest/02ss/02ss00000057000000.htm
- **Visor oficial**: https://info.igme.es/visor/

---

**Nota**: Esta información es un registro histórico de 1989. No constituye una evaluación actual del potencial mineral ni una verificación de la presencia de escombreras. Se requiere prospección de campo y análisis de laboratorio para confirmar cualquier hallazgo.
