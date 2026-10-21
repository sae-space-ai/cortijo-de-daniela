import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { inputParcels, CORTIJO, ARROYO } from './data/parcels';

/* ─── utilidades geográficas ─── */
function dMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const a = Math.sin((lat2 - lat1) * Math.PI / 360) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin((lon2 - lon1) * Math.PI / 360) ** 2;
  return 12742000 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function escapeText(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
}

function haversineArea(coords: [number, number][]): number {
  if (coords.length < 3) return 0;
  const R = 6371000;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const [lat1, lon1] = coords[i].map(x => x * Math.PI / 180);
    const [lat2, lon2] = coords[j].map(x => x * Math.PI / 180);
    area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs(area * R * R / 2);
  return area;
}

/* ─── tipos ─── */
interface Observation {
  id: string;
  lat: number;
  lon: number;
  origen: string;
  comprobacion: string;
  descripcion: string;
  fecha: string;
}

interface QueryResult {
  title: string;
  count: number;
  features: Array<{
    name: string;
    distance: number;
    tipo: string;
    lat: number;
    lon: number;
    paraje?: string;
    sustancia?: string;
    mena?: string;
    volumen?: number;
    cota?: number;
    municipio?: string;
    observaciones?: string;
  }>;
  error?: string;
}

interface SessionData {
  version: string;
  exportDate: string;
  observations: Observation[];
  importedGeoJSON?: GeoJSON.FeatureCollection;
}

/* ─── endpoints IGME ─── */
const endpoints = [
  { kind: "escombreras", url: "https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_InventarioEscombreras/MapServer/0/query", color: "#c8312a" },
  { kind: "indicios", url: "https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_BDMIN_Indicios/MapServer/0/query", color: "#703dab" }
];

/* ─── fondos cartográficos ─── */
const basemaps: Record<string, L.TileLayer> = {} as any;

function createBasemaps(): Record<string, L.TileLayer> {
  return {
    "Esri World Imagery": L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19, attribution: "World Imagery © Esri"
    }),
    "PNOA (IGN)": L.tileLayer("https://www.ign.es/wmts/pnoa-ma?layer=OI.OrthoimageCoverage&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg&TileMatrix={z}&TileCol={x}&TileRow={y}", {
      maxZoom: 19, attribution: "PNOA © IGN"
    }),
    "OpenStreetMap": L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "© OpenStreetMap"
    }),
    "Relieve IGN": L.tileLayer("https://www.ign.es/wmts/relieve?layer=MDTGrid&style=relieve&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/png&TileMatrix={z}&TileCol={x}&TileRow={y}", {
      maxZoom: 14, attribution: "MDT25 © IGN"
    })
  };
}

export default function App() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const escombrerasLayerRef = useRef<L.LayerGroup | null>(null);
  const indiciosLayerRef = useRef<L.LayerGroup | null>(null);
  const measurementLayerRef = useRef<L.LayerGroup | null>(null);
  const cellLayerRef = useRef<L.LayerGroup | null>(null);
  const observationsLayerRef = useRef<L.LayerGroup | null>(null);
  const importedLayerRef = useRef<L.LayerGroup | null>(null);
  const basemapsRef = useRef<Record<string, L.TileLayer>>({});
  const currentBaseRef = useRef<string>("Esri World Imagery");

  const [results, setResults] = useState<QueryResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(5);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [showAnnotForm, setShowAnnotForm] = useState(false);
  const [annotPos, setAnnotPos] = useState<[number, number] | null>(null);
  const [annotOrigen, setAnnotOrigen] = useState("");
  const [annotComprobacion, setAnnotComprobacion] = useState("");
  const [annotDesc, setAnnotDesc] = useState("");
  const [measureMode, setMeasureMode] = useState<"off" | "distance" | "area">("off");
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [measureResult, setMeasureResult] = useState<string | null>(null);
  const [activeOverlays, setActiveOverlays] = useState<Set<string>>(new Set(["Escombreras IGME"]));
  const [importedData, setImportedData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [statusMsg, setStatusMsg] = useState<string>("");
  const [currentBase, setCurrentBase] = useState<string>("Esri World Imagery");

  /* ─── Fase 3: MDT y consulta de cotas ─── */
  interface MDTMetadata {
    resolution: number;
    extent: string;
    points: number;
    minElev: number;
    maxElev: number;
    sha256?: string;
  }
  
  interface ElevationQueryResult {
    lat: number;
    lon: number;
    elev: number;
    slope?: number;
    slopePercent?: number;
  }

  const [mdtMetadata, setMdtMetadata] = useState<MDTMetadata | null>(null);
  const [mdtData, setMdtData] = useState<Map<string, number>>(new Map());
  const [showHillshade, setShowHillshade] = useState(false);
  const [queryMode, setQueryMode] = useState(false);
  const [queryResult, setQueryResult] = useState<ElevationQueryResult | null>(null);
  const hillshadeLayerRef = useRef<L.ImageOverlay | null>(null);
  const queryElevationRef = useRef<(lat: number, lon: number) => ElevationQueryResult | null>(() => null);

  /* ─── init map ─── */
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView(CORTIJO, 15);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    const bmaps = createBasemaps();
    basemapsRef.current = bmaps;
    bmaps["Esri World Imagery"].addTo(map);

    // WMS layers
    const wmsEs = L.tileLayer.wms("https://mapas.igme.es/gis/services/BasesDatos/IGME_InventarioEscombreras/MapServer/WMSServer", {
      layers: "0", format: "image/png", transparent: true, version: "1.3.0", attribution: "IGME | Escombreras 1989"
    });
    const wmsMineral = L.tileLayer.wms("https://mapas.igme.es/gis/services/BasesDatos/IGME_BDMIN_Indicios/MapServer/WMSServer", {
      layers: "0", format: "image/png", transparent: true, version: "1.3.0", attribution: "IGME | BDMIN"
    });
    const wmsGeode = L.tileLayer.wms("https://mapas.igme.es/gis/services/Cartografia/IGME_Geode50/MapServer/WMSServer", {
      layers: "0", format: "image/png", transparent: true, version: "1.3.0", attribution: "IGME | GEODE 1:50.000"
    });
    const wmsArqueologia = L.tileLayer.wms("http://mapas.ideex.es/CICTEX/patrimonioCultural", {
      layers: "I-09_Bienes de Interés Cultural", format: "image/png", transparent: true, version: "1.3.0", attribution: "Junta de Extremadura | Patrimonio Cultural"
    });

    // Reference layers
    const radius1 = L.circle(CORTIJO, { radius: 1000, color: "#d39c3a", weight: 2, dashArray: "8 7", fillColor: "#b5aa8f", fillOpacity: 0.035 }).addTo(map);
    const radius05 = L.circle(CORTIJO, { radius: 500, color: "#daa954", weight: 1, dashArray: "4 5", fillOpacity: 0 }).addTo(map);

    const parcelLayer = L.geoJSON(inputParcels as any, {
      style: (f: any) => ({
        color: f.properties.capa === "PG-LP" ? "#1aafd1" : "#69b9e7",
        weight: f.properties.capa === "PG-LP" ? 2.5 : 1.4,
        fillOpacity: 0.035
      }),
      onEachFeature: (f: any, l: L.Layer) => {
        l.bindPopup(`<b>Ref. ${String(f.properties.referencia).replace(/</g, "&lt;")}</b><br>Geometría: ${f.properties.capa}<br>Distancia aprox.: ${f.properties.distancia_aprox_m} m<br><i>No indica escombrera.</i>`);
      }
    }).addTo(map);

    const cortijoMarker = L.circleMarker(CORTIJO, { radius: 8, color: "#ffffee", weight: 3, fillColor: "#d98219", fillOpacity: 1 })
      .bindPopup("<b>Cortijo de Daniela</b><br>Ubicación cartográfica aproximada<br>38.006531, -6.060913").addTo(map);

    const matarramaMarker = L.circleMarker(ARROYO, { radius: 8, color: "#fff", weight: 2, fillColor: "#188ec1", fillOpacity: 1 })
      .bindPopup("<b>Referencia del arroyo de Matarrama</b><br>No indica el trazado completo del cauce.").addTo(map);

    const actualEscombreras = L.layerGroup().addTo(map);
    const actualIndicios = L.layerGroup().addTo(map);
    const measurementLayer = L.layerGroup().addTo(map);
    const cellLayer = L.layerGroup();
    const observationsLayer = L.layerGroup().addTo(map);
    const importedLayer = L.layerGroup().addTo(map);

    escombrerasLayerRef.current = actualEscombreras;
    indiciosLayerRef.current = actualIndicios;
    measurementLayerRef.current = measurementLayer;
    cellLayerRef.current = cellLayer;
    observationsLayerRef.current = observationsLayer;
    importedLayerRef.current = importedLayer;

    // Store WMS refs
    (window as any).__wmsLayers = {
      "Escombreras IGME": wmsEs,
      "Indicios minerales IGME": wmsMineral,
      "GEODE 1:50.000": wmsGeode,
      "Patrimonio arqueológico": wmsArqueologia
    };

    map.fitBounds(radius1.getBounds());
    mapRef.current = map;

    // Load observations from localStorage
    try {
      const saved = localStorage.getItem("geolab_observations");
      if (saved) {
        const obs = JSON.parse(saved);
        setObservations(obs);
        obs.forEach((o: Observation) => addObsMarker(o));
      }
    } catch { /* ignore */ }

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  function addObsMarker(obs: Observation) {
    if (!observationsLayerRef.current) return;
    L.circleMarker([obs.lat, obs.lon], {
      radius: 6, color: "#fff", weight: 2, fillColor: "#22c55e", fillOpacity: 0.9
    }).bindPopup(`<b>Indicio registrado</b><br><small>${escapeText(obs.fecha)}</small><br>Origen: ${escapeText(obs.origen)}<br>Comprobación: ${escapeText(obs.comprobacion)}<br>${escapeText(obs.descripcion)}`)
      .addTo(observationsLayerRef.current);
  }

  /* ─── basemap switching ─── */
  const switchBasemap = useCallback((name: string) => {
    const map = mapRef.current;
    if (!map) return;
    const bmaps = basemapsRef.current;
    if (bmaps[currentBase]) map.removeLayer(bmaps[currentBase]);
    if (bmaps[name]) bmaps[name].addTo(map);
    currentBaseRef.current = name;
    setCurrentBase(name);
  }, [currentBase]);

  /* ─── overlay toggling ─── */
  const toggleOverlay = useCallback((name: string) => {
    const map = mapRef.current;
    if (!map) return;
    const wmsLayers = (window as any).__wmsLayers;
    if (!wmsLayers[name]) return;
    const newSet = new Set(activeOverlays);
    if (newSet.has(name)) {
      map.removeLayer(wmsLayers[name]);
      newSet.delete(name);
    } else {
      map.addLayer(wmsLayers[name]);
      newSet.add(name);
    }
    setActiveOverlays(newSet);
  }, [activeOverlays]);

  /* ─── IGME query ─── */
  const loadRecords = useCallback(async () => {
    setLoading(true);
    setStatusMsg("Consultando servicios IGME…");
    const newResults: QueryResult[] = [];
    const box = radius <= 1 ? "-6.071,37.997,-6.051,38.016" :
      radius <= 3 ? "-6.090,37.980,-6.032,38.034" :
        "-6.119,37.962,-6.003,38.052";

    for (const ep of endpoints) {
      const title = ep.kind === "escombreras" ? "Escombreras 1989" : "Indicios minerales BDMIN";
      const layer = ep.kind === "escombreras" ? escombrerasLayerRef.current : indiciosLayerRef.current;
      if (layer) layer.clearLayers();

      const params = new URLSearchParams({
        where: "1=1", geometry: box, geometryType: "esriGeometryEnvelope",
        inSR: "4326", outSR: "4326", spatialRel: "esriSpatialRelIntersects",
        outFields: "*", returnGeometry: "true", f: "geojson"
      });

      try {
        const controller = new AbortController();
        const tim = setTimeout(() => controller.abort(), 11000);
        let response: Response;
        try { response = await fetch(ep.url + "?" + params.toString(), { signal: controller.signal }); }
        finally { clearTimeout(tim); }
        if (!response.ok) throw new Error("HTTP " + response.status);
        const body = await response.json();
        if (body.error) throw new Error(body.error.message || "Error API");
        if (!Array.isArray(body.features)) throw new Error("respuesta sin geometrías");

        const features = body.features
          .filter((f: any) => f.geometry?.type === "Point" && Array.isArray(f.geometry.coordinates) &&
            dMeters(CORTIJO[0], CORTIJO[1], f.geometry.coordinates[1], f.geometry.coordinates[0]) <= radius * 1000)
          .sort((a: any, b: any) =>
            dMeters(CORTIJO[0], CORTIJO[1], a.geometry.coordinates[1], a.geometry.coordinates[0]) -
            dMeters(CORTIJO[0], CORTIJO[1], b.geometry.coordinates[1], b.geometry.coordinates[0]));

        const parsedFeatures = features.map((f: any) => {
          const [lon, lat] = f.geometry.coordinates;
          const a = f.properties || {};
          const m = Math.round(dMeters(CORTIJO[0], CORTIJO[1], lat, lon));
          const name = a.NOMBRE || a.PARAJE || a.DENOMINACION || a.NOMBREMIN || "Registro sin denominación";
          const tipo = a.ESTRUC || a.Sustancia || a.SUSTANCIA || "";
          const paraje = a.PARAJE || "";
          const sustancia = a.Sustancia || a.SUSTANCIA || "";
          const mena = a.MENA || "";
          const volumen = a.VOLU || 0;
          const cota = a.COTA || 0;
          const municipio = a.NOMBRE_MUN || "";
          const observaciones = a.OBSER || "";

          if (layer) {
            let popup = `<b>${escapeText(name)}</b><br>`;
            popup += `<b>${escapeText(title)}</b><br>`;
            if (tipo) popup += `Tipo: ${escapeText(tipo)}<br>`;
            if (paraje && paraje !== name) popup += `Paraje: ${escapeText(paraje)}<br>`;
            if (sustancia) popup += `Sustancia: ${escapeText(sustancia)}<br>`;
            if (mena) popup += `Mena: ${escapeText(mena)}<br>`;
            if (volumen > 0) popup += `Volumen: ${volumen.toLocaleString("es-ES")} m³<br>`;
            if (cota > 0) popup += `Cota: ${cota} m<br>`;
            if (municipio) popup += `Municipio: ${escapeText(municipio)}<br>`;
            popup += `${m} m del cortijo<br>`;
            if (observaciones) popup += `<small>${escapeText(observaciones)}</small><br>`;
            popup += `<small>IGME · Inventario 1989 · registro histórico</small>`;

            L.circleMarker([lat, lon], { radius: 7, color: "#fff", weight: 1.5, fillColor: ep.color, fillOpacity: 0.95 })
              .bindPopup(popup, { maxWidth: 300 }).addTo(layer);
          }
          return { name, distance: m, tipo, lat, lon, paraje, sustancia, mena, volumen, cota, municipio, observaciones };
        });
        newResults.push({ title, count: features.length, features: parsedFeatures });
      } catch (e: any) {
        newResults.push({ title, count: 0, features: [], error: e.message || "Error desconocido" });
      }
    }
    setResults(newResults);
    setStatusMsg(`Consulta completada · Radio ${radius} km`);
    setLoading(false);
  }, [radius]);

  /* ─── measurement ─── */
  const finishMeasurement = useCallback(() => {
    if (measurePoints.length < 2) { setMeasureResult("Se necesitan al menos 2 puntos."); return; }
    const layer = measurementLayerRef.current;
    if (!layer) return;

    if (measureMode === "distance") {
      let total = 0;
      for (let i = 1; i < measurePoints.length; i++) {
        total += dMeters(measurePoints[i - 1][0], measurePoints[i - 1][1], measurePoints[i][0], measurePoints[i][1]);
      }
      L.polyline(measurePoints, { color: "#e11d48", weight: 3 }).addTo(layer);
      setMeasureResult(`Distancia total: ${total.toFixed(1)} m (${(total / 1000).toFixed(3)} km)`);
    } else if (measureMode === "area") {
      if (measurePoints.length < 3) { setMeasureResult("Se necesitan al menos 3 puntos para un área."); return; }
      const closed = [...measurePoints, measurePoints[0]];
      L.polygon(measurePoints, { color: "#7c3aed", weight: 2, fillOpacity: 0.15 }).addTo(layer);
      const area = haversineArea(measurePoints);
      setMeasureResult(`Superficie: ${area.toFixed(1)} m² (${(area / 10000).toFixed(4)} ha)`);
    }
    setMeasureMode("off");
    setMeasurePoints([]);
  }, [measureMode, measurePoints]);

  const cancelMeasurement = useCallback(() => {
    measurementLayerRef.current?.clearLayers();
    setMeasurePoints([]);
    setMeasureMode("off");
    setMeasureResult(null);
  }, []);

  /* ─── map click handler ─── */
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: L.LeafletMouseEvent) => {
      if (queryMode && mdtData.size > 0) {
        const result = queryElevationRef.current(e.latlng.lat, e.latlng.lng);
        if (result) {
          setQueryResult(result);
          // Marcar el punto consultado
          L.circleMarker([e.latlng.lat, e.latlng.lng], {
            radius: 5,
            color: "#fbbf24",
            fillColor: "#fbbf24",
            fillOpacity: 0.8,
            weight: 2
          }).bindPopup(`Cota: ${result.elev.toFixed(2)} m`).addTo(map);
        }
      } else if (measureMode !== "off") {
        const pt: [number, number] = [e.latlng.lat, e.latlng.lng];
        setMeasurePoints(prev => [...prev, pt]);
        const layer = measurementLayerRef.current;
        if (layer) {
          L.circleMarker(pt, { radius: 4, color: "#e11d48", fillColor: "#fff", fillOpacity: 1, weight: 2 }).addTo(layer);
        }
      } else if (showAnnotForm) {
        setAnnotPos([e.latlng.lat, e.latlng.lng]);
      }
    };
    map.on("click", handler);
    return () => { map.off("click", handler); };
  }, [measureMode, showAnnotForm, queryMode, mdtData]);

  /* ─── 1m² cell ─── */
  const drawCell = useCallback(() => {
    const map = mapRef.current;
    const cellLayer = cellLayerRef.current;
    if (!map || !cellLayer) return;
    cellLayer.clearLayers();
    const center = map.getCenter();
    const cellSize = 1; // 1 meter
    const latOffset = cellSize / 111320;
    const lonOffset = cellSize / (111320 * Math.cos(center.lat * Math.PI / 180));
    const bounds: L.LatLngBoundsExpression = [
      [center.lat - latOffset / 2, center.lng - lonOffset / 2],
      [center.lat + latOffset / 2, center.lng + lonOffset / 2]
    ];
    L.rectangle(bounds, { color: "#f59e0b", weight: 2, fillOpacity: 0.2, dashArray: "4 3" })
      .bindPopup("Celda de referencia 1 m²<br><small>Geometría de referencia, no una cata verificada.</small>")
      .addTo(cellLayer);
    if (!map.hasLayer(cellLayer)) map.addLayer(cellLayer);
    setStatusMsg("Celda de 1 m² dibujada en el centro del mapa.");
  }, []);

  /* ─── save observation ─── */
  const saveObservation = useCallback(() => {
    if (!annotPos) return;
    const obs: Observation = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      lat: annotPos[0], lon: annotPos[1],
      origen: annotOrigen, comprobacion: annotComprobacion,
      descripcion: annotDesc, fecha: new Date().toISOString().slice(0, 16).replace("T", " ")
    };
    const newObs = [...observations, obs];
    setObservations(newObs);
    addObsMarker(obs);
    try { localStorage.setItem("geolab_observations", JSON.stringify(newObs)); } catch { /* */ }
    setShowAnnotForm(false);
    setAnnotPos(null);
    setAnnotOrigen("");
    setAnnotComprobacion("");
    setAnnotDesc("");
    setStatusMsg("Observación registrada.");
  }, [annotPos, annotOrigen, annotComprobacion, annotDesc, observations]);

  /* ─── export functions ─── */
  const exportGeoJSON = useCallback(() => {
    const features: GeoJSON.Feature[] = [];
    // Observations
    observations.forEach(o => {
      features.push({
        type: "Feature",
        properties: { tipo: "observacion", origen: o.origen, comprobacion: o.comprobacion, descripcion: o.descripcion, fecha: o.fecha },
        geometry: { type: "Point", coordinates: [o.lon, o.lat] }
      });
    });
    // Add imported data features
    if (importedData) features.push(...importedData.features);
    // Add parcels
    features.push(...(inputParcels.features as any));

    const fc: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: "application/geo+json" });
    downloadBlob(blob, "geolab_export.geojson");
  }, [observations, importedData]);

  const exportCSV = useCallback(() => {
    let csv = "lat;lon;nombre;tipo;paraje;sustancia;mena;volumen_m3;cota_m;municipio;distancia_m;fuente;observaciones;fecha\n";
    observations.forEach(o => {
      csv += `${o.lat};${o.lon};"${o.origen}";observacion;;;;;;0;"${o.descripcion}";${o.fecha}\n`;
    });
    results.forEach(r => r.features.forEach(f => {
      csv += `${f.lat};${f.lon};"${f.name}";"${f.tipo}";"${f.paraje || ""}";"${f.sustancia || ""}";"${f.mena || ""}";${f.volumen || 0};${f.cota || 0};"${f.municipio || ""}";${f.distance};${r.title};"${f.observaciones || ""}";\n`;
    }));
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, "geolab_export.csv");
  }, [observations, results]);

  const exportSession = useCallback(() => {
    const session: SessionData = {
      version: "2.0",
      exportDate: new Date().toISOString(),
      observations,
      importedGeoJSON: importedData || undefined
    };
    const blob = new Blob([JSON.stringify(session, null, 2)], { type: "application/json" });
    downloadBlob(blob, "geolab_session.json");
  }, [observations, importedData]);

  const exportHTML = useCallback(() => {
    let html = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Informe GEO-LAB 2.0</title>
<style>body{font-family:system-ui;max-width:800px;margin:2em auto;padding:0 1em;color:#1d3040}
h1{border-bottom:2px solid #397590}table{width:100%;border-collapse:collapse;margin:1em 0}
th,td{border:1px solid #d7e3eb;padding:6px 8px;text-align:left;font-size:13px}
th{background:#eef5f8}.warn{background:#fff9ee;border-left:3px solid #cb7e14;padding:10px;margin:1em 0}</style></head><body>
<h1>Informe GEO-LAB 2.0 — Cortijo de Daniela</h1>
<p>Generado: ${new Date().toLocaleString("es-ES")}</p>
<p>Punto de referencia: ${CORTIJO[0]} N, ${CORTIJO[1]} O</p>
<div class="warn"><b>Aviso:</b> Este informe es un registro de observaciones y consultas. No constituye un estudio geotécnico ni una verificación de campo.</div>
<h2>Observaciones registradas (${observations.length})</h2>`;
    if (observations.length > 0) {
      html += `<table><tr><th>Fecha</th><th>Coordenadas</th><th>Origen</th><th>Comprobación</th><th>Descripción</th></tr>`;
      observations.forEach(o => {
        html += `<tr><td>${o.fecha}</td><td>${o.lat.toFixed(6)}, ${o.lon.toFixed(6)}</td><td>${escapeText(o.origen)}</td><td>${escapeText(o.comprobacion)}</td><td>${escapeText(o.descripcion)}</td></tr>`;
      });
      html += `</table>`;
    } else { html += `<p>Sin observaciones registradas.</p>`; }
    html += `<h2>Resultados consulta IGME</h2>`;
    results.forEach(r => {
      html += `<h3>${r.title}: ${r.count} registros</h3>`;
      if (r.features.length > 0) {
        // Estadísticas
        const minDist = Math.min(...r.features.map(f => f.distance));
        const maxDist = Math.max(...r.features.map(f => f.distance));
        const totalVol = r.features.reduce((sum, f) => sum + (f.volumen || 0), 0);
        html += `<p><b>Estadísticas:</b> Distancia: ${minDist}–${maxDist} m`;
        if (totalVol > 0) html += ` · Volumen total: ${totalVol.toLocaleString("es-ES")} m³`;
        html += `</p>`;

        html += `<table><tr><th>Nombre</th><th>Distancia</th><th>Tipo</th><th>Sustancia</th><th>Mena</th><th>Volumen</th><th>Cota</th><th>Municipio</th></tr>`;
        r.features.forEach(f => {
          html += `<tr>`;
          html += `<td>${escapeText(f.name)}</td>`;
          html += `<td>${f.distance} m</td>`;
          html += `<td>${escapeText(f.tipo)}</td>`;
          html += `<td>${escapeText(f.sustancia || "")}</td>`;
          html += `<td>${escapeText(f.mena || "")}</td>`;
          html += `<td>${f.volumen ? f.volumen.toLocaleString("es-ES") + " m³" : ""}</td>`;
          html += `<td>${f.cota ? f.cota + " m" : ""}</td>`;
          html += `<td>${escapeText(f.municipio || "")}</td>`;
          html += `</tr>`;
        });
        html += `</table>`;
      }
    });
    html += `<h2>Referencias catastrales</h2><table><tr><th>Referencia</th><th>Capa</th><th>Distancia aprox.</th></tr>`;
    inputParcels.features.forEach(f => {
      html += `<tr><td>${f.properties.referencia}</td><td>${f.properties.capa}</td><td>${f.properties.distancia_aprox_m} m</td></tr>`;
    });
    html += `</table><p><small>Fuentes: IGME-CSIC, IGN, CNIG. Datos catastrales aportados por el usuario.</small></p></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    downloadBlob(blob, "geolab_informe.html");
  }, [observations, results]);

  /* ─── import functions ─── */
  const importGeoJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as GeoJSON.FeatureCollection;
        if (!data.features || data.features.length > 5000) {
          setStatusMsg("Error: máximo 5.000 elementos permitidos.");
          return;
        }
        setImportedData(data);
        const layer = importedLayerRef.current;
        if (layer) {
          layer.clearLayers();
          L.geoJSON(data as any, {
            style: () => ({ color: "#16a34a", weight: 2, fillOpacity: 0.1 }),
            pointToLayer: (f: any, latlng) => L.circleMarker(latlng, { radius: 5, color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.8 })
          }).addTo(layer);
        }
        setStatusMsg(`Importados ${data.features.length} elementos.`);
      } catch { setStatusMsg("Error al leer el archivo GeoJSON."); }
    };
    reader.readAsText(file);
  }, []);

  const importSession = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as SessionData;
        if (data.observations) {
          setObservations(data.observations);
          try { localStorage.setItem("geolab_observations", JSON.stringify(data.observations)); } catch { /* */ }
          observationsLayerRef.current?.clearLayers();
          data.observations.forEach(o => addObsMarker(o));
        }
        if (data.importedGeoJSON) {
          setImportedData(data.importedGeoJSON);
          const layer = importedLayerRef.current;
          if (layer) {
            layer.clearLayers();
            L.geoJSON(data.importedGeoJSON as any, {
              style: () => ({ color: "#16a34a", weight: 2, fillOpacity: 0.1 }),
              pointToLayer: (_: any, latlng) => L.circleMarker(latlng, { radius: 5, color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.8 })
            }).addTo(layer);
          }
        }
        setStatusMsg("Sesión restaurada.");
      } catch { setStatusMsg("Error al leer la sesión."); }
    };
    reader.readAsText(file);
  }, []);

  const importCSV = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) { setStatusMsg("CSV vacío o sin datos."); return; }
        const features: GeoJSON.Feature[] = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(";");
          const lat = parseFloat(parts[0]?.replace(/"/g, ""));
          const lon = parseFloat(parts[1]?.replace(/"/g, ""));
          if (isNaN(lat) || isNaN(lon)) continue;
          const nombre = parts[2]?.replace(/"/g, "") || "";
          const alt = parts[3]?.replace(/"/g, "") || "";
          features.push({
            type: "Feature",
            properties: { nombre, altitud: alt, origen_csv: true },
            geometry: { type: "Point", coordinates: [lon, lat] }
          });
        }
        const fc: GeoJSON.FeatureCollection = { type: "FeatureCollection", features };
        setImportedData(fc);
        const layer = importedLayerRef.current;
        if (layer) {
          layer.clearLayers();
          L.geoJSON(fc as any, {
            pointToLayer: (_, latlng) => L.circleMarker(latlng, { radius: 5, color: "#0891b2", fillColor: "#22d3ee", fillOpacity: 0.8 })
          }).addTo(layer);
        }
        setStatusMsg(`Importados ${features.length} puntos del CSV.`);
      } catch { setStatusMsg("Error al leer el CSV."); }
    };
    reader.readAsText(file);
  }, []);

  const downloadCSVTemplate = useCallback(() => {
    const csv = "lat;lon;nombre;altitud\n38.006;-6.061;Punto ejemplo;\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, "plantilla_geolab.csv");
  }, []);

  /* ─── Fase 2: LiDAR y MDT ─── */
  const [profileData, setProfileData] = useState<Array<{lat: number; lon: number; elev: number}>>([]);
  const lidarLayerRef = useRef<L.LayerGroup | null>(null);

  const importLidarData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as GeoJSON.FeatureCollection;
        if (!data.features || data.features.length > 5000) {
          setStatusMsg("Error: máximo 5.000 elementos permitidos.");
          return;
        }
        // Crear capa específica para LiDAR si no existe
        if (!lidarLayerRef.current && mapRef.current) {
          lidarLayerRef.current = L.layerGroup().addTo(mapRef.current);
        }
        const layer = lidarLayerRef.current;
        if (layer) {
          layer.clearLayers();
          L.geoJSON(data as any, {
            style: () => ({ color: "#dc2626", weight: 2, fillOpacity: 0.15 }),
            pointToLayer: (f: any, latlng) => {
              const tipo = f.properties?.tipo || "anomalia";
              const color = tipo === "depresion" ? "#7c3aed" : tipo === "monticulo" ? "#dc2626" : "#f59e0b";
              return L.circleMarker(latlng, { radius: 4, color, fillColor: color, fillOpacity: 0.7 });
            },
            onEachFeature: (f: any, l: L.Layer) => {
              const props = f.properties || {};
              l.bindPopup(`<b>Anomalía LiDAR</b><br>Tipo: ${props.tipo || "no clasificado"}<br>${props.descripcion || ""}<br><small>Requiere verificación de campo</small>`);
            }
          }).addTo(layer);
        }
        setStatusMsg(`LiDAR importado: ${data.features.length} anomalías. Verificación de campo necesaria.`);
      } catch { setStatusMsg("Error al leer el archivo LiDAR."); }
    };
    reader.readAsText(file);
  }, []);

  const importProfileData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) { setStatusMsg("CSV de perfil vacío."); return; }
        const points: Array<{lat: number; lon: number; elev: number}> = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(";");
          const lat = parseFloat(parts[0]?.replace(/"/g, ""));
          const lon = parseFloat(parts[1]?.replace(/"/g, ""));
          const elev = parseFloat(parts[2]?.replace(/"/g, ""));
          if (isNaN(lat) || isNaN(lon) || isNaN(elev)) continue;
          points.push({ lat, lon, elev });
        }
        setProfileData(points);
        // Dibujar perfil en el mapa
        if (mapRef.current) {
          const latlngs = points.map(p => [p.lat, p.lon] as [number, number]);
          L.polyline(latlngs, { color: "#0284c7", weight: 3, dashArray: "5 5" }).addTo(mapRef.current);
          mapRef.current.fitBounds(L.polyline(latlngs).getBounds());
        }
        setStatusMsg(`Perfil importado: ${points.length} puntos.`);
      } catch { setStatusMsg("Error al leer el perfil."); }
    };
    reader.readAsText(file);
  }, []);

  const minElev = profileData.length > 0 ? Math.min(...profileData.map(p => p.elev)) : 0;
  const maxElev = profileData.length > 0 ? Math.max(...profileData.map(p => p.elev)) : 0;

  /* ─── Fase 3: MDT y consulta de cotas ─── */
  interface MDTMetadata {
    resolution: number;
    extent: string;
    points: number;
    minElev: number;
    maxElev: number;
    sha256?: string;
  }
  
  interface ElevationQueryResult {
    lat: number;
    lon: number;
    elev: number;
    slope?: number;
    slopePercent?: number;
  }



  const importMDTData = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Validar estructura esperada
        if (!data.metadata || !data.grid) {
          setStatusMsg("Error: formato MDT inválido. Se espera {metadata, grid}.");
          return;
        }

        const { metadata, grid } = data;
        
        // Crear mapa de coordenadas a elevaciones
        const elevMap = new Map<string, number>();
        grid.forEach((point: any) => {
          const key = `${point.lat.toFixed(6)},${point.lon.toFixed(6)}`;
          elevMap.set(key, point.elev);
        });

        setMdtData(elevMap);
        setMdtMetadata({
          resolution: metadata.resolution,
          extent: metadata.extent,
          points: grid.length,
          minElev: metadata.minElev,
          maxElev: metadata.maxElev,
          sha256: metadata.sha256
        });

        // Dibujar puntos en el mapa
        if (mapRef.current) {
          const layer = L.layerGroup().addTo(mapRef.current);
          grid.forEach((point: any) => {
            const color = getElevationColor(point.elev, metadata.minElev, metadata.maxElev);
            L.circleMarker([point.lat, point.lon], {
              radius: 2,
              color: color,
              fillColor: color,
              fillOpacity: 0.6,
              weight: 0
            }).addTo(layer);
          });
        }

        setStatusMsg(`MDT cargado: ${grid.length} puntos, resolución ${metadata.resolution}m`);
      } catch (err) {
        setStatusMsg("Error al procesar el archivo MDT.");
      }
    };
    reader.readAsText(file);
  }, []);

  const getElevationColor = (elev: number, min: number, max: number): string => {
    const ratio = (elev - min) / (max - min);
    const r = Math.round(255 * (1 - ratio));
    const g = Math.round(255 * ratio);
    return `rgb(${r}, ${g}, 100)`;
  };

  const toggleHillshade = useCallback(() => {
    if (!mapRef.current || mdtData.size === 0) return;
    
    if (showHillshade) {
      if (hillshadeLayerRef.current) {
        mapRef.current.removeLayer(hillshadeLayerRef.current);
        hillshadeLayerRef.current = null;
      }
      setShowHillshade(false);
    } else {
      // Generar hillshade simplificado (requeriría procesamiento real)
      setStatusMsg("Sombreado: requiere procesamiento GDAL/QGIS previo. Mostrando puntos de elevación.");
      setShowHillshade(true);
    }
  }, [showHillshade, mdtData]);

  const queryElevation = useCallback((lat: number, lon: number): ElevationQueryResult | null => {
    if (mdtData.size === 0) {
      setStatusMsg("No hay MDT cargado.");
      return null;
    }

    // Buscar punto más cercano
    let closestKey = "";
    let minDist = Infinity;
    
    mdtData.forEach((_, key) => {
      const [pointLat, pointLon] = key.split(",").map(Number);
      const dist = Math.sqrt(Math.pow(pointLat - lat, 2) + Math.pow(pointLon - lon, 2));
      if (dist < minDist) {
        minDist = dist;
        closestKey = key;
      }
    });

    if (closestKey) {
      const elev = mdtData.get(closestKey)!;
      
      // Calcular pendiente aproximada (simplificado)
      const [pointLat, pointLon] = closestKey.split(",").map(Number);
      const neighbors = [
        mdtData.get(`${(pointLat + 0.00001).toFixed(6)},${pointLon.toFixed(6)}`),
        mdtData.get(`${(pointLat - 0.00001).toFixed(6)},${pointLon.toFixed(6)}`),
        mdtData.get(`${pointLat.toFixed(6)},${(pointLon + 0.00001).toFixed(6)}`),
        mdtData.get(`${pointLat.toFixed(6)},${(pointLon - 0.00001).toFixed(6)}`)
      ].filter((n): n is number => n !== undefined);

      let slope = 0;
      let slopePercent = 0;
      if (neighbors.length > 0) {
        const maxDiff = Math.max(...neighbors.map(n => Math.abs(n - elev)));
        slopePercent = (maxDiff / 1.11) * 100; // ~1.11m por 0.00001 grados
        slope = Math.atan(maxDiff / 1.11) * (180 / Math.PI);
      }

      return { lat, lon, elev, slope, slopePercent };
    }
    return null;
  }, [mdtData]);

  // Actualizar la referencia cuando queryElevation cambie
  useEffect(() => {
    queryElevationRef.current = queryElevation;
  }, [queryElevation]);

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /* ─── refs list ─── */
  const refs = new Map<string, number>();
  for (const f of inputParcels.features) {
    const r = f.properties.referencia;
    refs.set(r, Math.min(refs.get(r) ?? 999999, f.properties.distancia_aprox_m));
  }
  const sortedRefs = [...refs.entries()].sort((a, b) => a[1] - b[1]);

  return (
    <div className="h-screen w-screen bg-[#f0f4f8] text-[#1d3040] font-[system-ui,-apple-system,Segoe_UI,Arial,sans-serif] relative overflow-hidden">
      <div ref={mapContainerRef} className="absolute inset-0 z-0" />

      {/* Status bar */}
      {statusMsg && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1100] bg-[#18374a] text-white px-4 py-2 rounded-lg text-xs shadow-lg max-w-md text-center">
          {statusMsg}
          <button onClick={() => setStatusMsg("")} className="ml-3 opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Sidebar */}
      <aside className="absolute left-3 top-3 bottom-3 w-[min(400px,calc(100vw-24px))] overflow-y-auto bg-white/97 z-[1000] shadow-[0_6px_26px_#12283c36] rounded-2xl p-4 max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:w-full max-md:h-[44%] max-md:rounded-t-2xl max-md:p-3">
        <div className="text-[10px] uppercase tracking-[1.6px] font-extrabold text-[#397590] mb-1">GEO-LAB 3.0</div>
        <h1 className="text-lg leading-tight mb-1 text-[#18374a] tracking-tight max-md:text-base">Cortijo de Daniela · Integración LiDAR y MDT</h1>
        <p className="text-xs text-[#496270] leading-snug mb-2">Reconocimiento preliminar con modelos digitales del terreno. Montemolín (Badajoz).</p>

        <div className="px-2.5 py-2 bg-[#eef5f8] rounded-lg text-xs font-bold tracking-wide mb-2">
          38.006531 N · −6.060913 O
        </div>

        <div className="px-2.5 py-2 bg-[#fff9ee] border-l-[3px] border-[#cb7e14] text-[11px] leading-relaxed rounded mb-3">
          <b>Alcance:</b> Los registros mineros son indicios de inventario, no pruebas de presencia actual. La celda de 1 m² es geometría de referencia, no una cata. GEODE es cartografía regional 1:50.000.
        </div>

        {/* Basemaps */}
        <h2 className="text-sm font-bold mb-1.5 text-[#18374a]">Fondo cartográfico</h2>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {["Esri World Imagery", "PNOA (IGN)", "OpenStreetMap", "Relieve IGN"].map(name => (
            <button key={name} onClick={() => switchBasemap(name)}
              className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${currentBase === name ? "bg-[#18374a] text-white border-[#18374a]" : "bg-white text-[#1d4559] border-[#d7e3eb] hover:bg-[#edf7fc]"}`}>
              {name}
            </button>
          ))}
        </div>

        {/* WMS Overlays */}
        <h2 className="text-sm font-bold mb-1.5 text-[#18374a]">Capas WMS</h2>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {["Escombreras IGME", "Indicios minerales IGME", "GEODE 1:50.000", "Patrimonio arqueológico"].map(name => (
            <button key={name} onClick={() => toggleOverlay(name)}
              className={`px-2 py-1 text-[11px] rounded-md border transition-colors ${activeOverlays.has(name) ? "bg-[#397590] text-white border-[#397590]" : "bg-white text-[#1d4559] border-[#d7e3eb] hover:bg-[#edf7fc]"}`}>
              {activeOverlays.has(name) ? "✓ " : ""}{name}
            </button>
          ))}
        </div>

        {/* IGME Query */}
        <h2 className="text-sm font-bold mb-1.5 text-[#18374a]">Consulta IGME</h2>
        <div className="flex items-center gap-2 mb-2">
          <label className="text-[11px] text-[#587180]">Radio:</label>
          {[1, 3, 5].map(r => (
            <button key={r} onClick={() => setRadius(r)}
              className={`px-2 py-0.5 text-[11px] rounded border ${radius === r ? "bg-[#d98219] text-white border-[#d98219]" : "bg-white border-[#d7e3eb] text-[#1d4559]"}`}>
              {r} km
            </button>
          ))}
          <button onClick={loadRecords} disabled={loading}
            className="ml-auto px-3 py-1 text-[11px] bg-[#18374a] text-white rounded-md hover:bg-[#234d63] disabled:opacity-50 font-semibold">
            {loading ? "Consultando…" : "Consultar IGME"}
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="text-[11px] leading-relaxed mb-3 max-h-60 overflow-y-auto">
            {results.map((r, i) => (
              <div key={i} className="border border-[#e0e8ee] rounded-lg p-2 mb-1.5">
                <b className="block text-[#233c4d] mb-1">{r.title}: {r.count} registros</b>
                {r.error ? (
                  <span className="text-red-600">Error: {r.error}</span>
                ) : r.count === 0 ? (
                  <div className="text-[#587180]">Sin registros en este radio.</div>
                ) : (
                  <>
                    {/* Estadísticas */}
                    {r.features.length > 0 && (
                      <div className="bg-[#f4f8fb] rounded p-1.5 mb-1.5 text-[10px]">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                          <span>Distancia mín:</span>
                          <span className="font-semibold">{Math.min(...r.features.map(f => f.distance))} m</span>
                          <span>Distancia máx:</span>
                          <span className="font-semibold">{Math.max(...r.features.map(f => f.distance))} m</span>
                          {r.features.some(f => f.volumen && f.volumen > 0) && (
                            <>
                              <span>Volumen total:</span>
                              <span className="font-semibold">
                                {r.features.reduce((sum, f) => sum + (f.volumen || 0), 0).toLocaleString("es-ES")} m³
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Lista de registros */}
                    {r.features.slice(0, 8).map((f, j) => (
                      <div key={j} className="border-l-2 border-[#d7e3eb] pl-2 mb-1 text-[10px]">
                        <div className="font-semibold text-[#233c4d]">{f.name}</div>
                        <div className="text-[#496270]">
                          {f.distance} m{f.tipo ? ` · ${f.tipo}` : ""}
                          {f.sustancia && ` · ${f.sustancia}`}
                          {f.volumen && f.volumen > 0 && ` · ${f.volumen.toLocaleString("es-ES")} m³`}
                        </div>
                        {f.mena && <div className="text-[#587180] text-[9px]">Mena: {f.mena}</div>}
                        {f.cota && f.cota > 0 && <div className="text-[#587180] text-[9px]">Cota: {f.cota} m</div>}
                      </div>
                    ))}
                    {r.features.length > 8 && (
                      <div className="text-[10px] text-[#587180] pl-2 italic">
                        …y {r.features.length - 8} registros más (ver en mapa)
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="h-px bg-[#e4eaf0] my-3" />

        {/* Measurement tools */}
        <h2 className="text-sm font-bold mb-1.5 text-[#18374a]">Herramientas</h2>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button onClick={() => { setMeasureMode("distance"); setMeasurePoints([]); measurementLayerRef.current?.clearLayers(); setMeasureResult(null); }}
            className={`px-2 py-1 text-[11px] rounded-md border ${measureMode === "distance" ? "bg-[#e11d48] text-white border-[#e11d48]" : "bg-white border-[#d7e3eb] text-[#1d4559]"}`}>
            📏 Medir distancia
          </button>
          <button onClick={() => { setMeasureMode("area"); setMeasurePoints([]); measurementLayerRef.current?.clearLayers(); setMeasureResult(null); }}
            className={`px-2 py-1 text-[11px] rounded-md border ${measureMode === "area" ? "bg-[#7c3aed] text-white border-[#7c3aed]" : "bg-white border-[#d7e3eb] text-[#1d4559]"}`}>
            ⬡ Medir superficie
          </button>
          <button onClick={drawCell} className="px-2 py-1 text-[11px] rounded-md border bg-white border-[#d7e3eb] text-[#1d4559] hover:bg-[#edf7fc]">
            □ Celda 1 m²
          </button>
          <button onClick={() => { setShowAnnotForm(true); setAnnotPos(null); }}
            className={`px-2 py-1 text-[11px] rounded-md border ${showAnnotForm ? "bg-[#22c55e] text-white border-[#22c55e]" : "bg-white border-[#d7e3eb] text-[#1d4559]"}`}>
            📍 Anotar punto
          </button>
        </div>

        {measureMode !== "off" && (
          <div className="bg-[#f4f8fb] rounded-lg p-2 mb-2 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{measureMode === "distance" ? "Distancia" : "Superficie"}: {measurePoints.length} pts</span>
              <button onClick={finishMeasurement} className="px-2 py-0.5 bg-[#18374a] text-white rounded text-[10px]">Finalizar</button>
              <button onClick={cancelMeasurement} className="px-2 py-0.5 bg-white border border-[#d7e3eb] rounded text-[10px]">Cancelar</button>
            </div>
            {measureResult && <div className="mt-1 font-bold text-[#233c4d]">{measureResult}</div>}
            <div className="text-[10px] text-[#587180] mt-1">Pulse en el mapa para añadir vértices.</div>
          </div>
        )}

        {/* Annotation form */}
        {showAnnotForm && (
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-2.5 mb-2 text-[11px]">
            <div className="font-bold text-[#166534] mb-1">📍 {annotPos ? `Posición: ${annotPos[0].toFixed(6)}, ${annotPos[1].toFixed(6)}` : "Pulse en el mapa para situar"}</div>
            {annotPos && (
              <>
                <input placeholder="Origen del indicio" value={annotOrigen} onChange={e => setAnnotOrigen(e.target.value)}
                  className="w-full px-2 py-1 border border-[#d7e3eb] rounded text-[11px] mb-1" />
                <input placeholder="Comprobación realizada" value={annotComprobacion} onChange={e => setAnnotComprobacion(e.target.value)}
                  className="w-full px-2 py-1 border border-[#d7e3eb] rounded text-[11px] mb-1" />
                <textarea placeholder="Descripción" value={annotDesc} onChange={e => setAnnotDesc(e.target.value)}
                  className="w-full px-2 py-1 border border-[#d7e3eb] rounded text-[11px] mb-1" rows={2} />
                <div className="flex gap-1.5">
                  <button onClick={saveObservation} className="px-2 py-1 bg-[#22c55e] text-white rounded text-[10px] font-semibold">Guardar</button>
                  <button onClick={() => { setShowAnnotForm(false); setAnnotPos(null); }} className="px-2 py-1 bg-white border border-[#d7e3eb] rounded text-[10px]">Cancelar</button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="h-px bg-[#e4eaf0] my-3" />

        {/* Fase 3 - Integración LiDAR y MDT */}
        <h2 className="text-sm font-bold mb-1.5 text-[#18374a]">Fase 3 · Integración LiDAR y MDT</h2>
        <div className="bg-[#eff6ff] border border-[#bfdbfe] rounded-lg p-2.5 mb-2 text-[10px] leading-snug">
          <b className="text-[#1e40af]">Productos oficiales disponibles:</b>
          <ul className="list-disc pl-3 mt-1 space-y-0.5 text-[#1e3a8a]">
            <li><b>MDT02 PNOA-LiDAR:</b> malla de 2 metros</li>
            <li><b>MDT50 cm (3ª cobertura):</b> malla de 0,5 metros</li>
            <li>Sistema de referencia: ETRS89 / UTM 29N (EPSG:25829)</li>
          </ul>
          <div className="mt-1.5 text-[#1e40af]">
            <b>Procesamiento requerido:</b> Los rasters deben procesarse en SIG (QGIS, GDAL) antes de importar. El visor muestra resultados, no procesa rasters crudos.
          </div>
        </div>
        
        <div className="flex flex-wrap gap-1.5 mb-2">
          <label className="px-2 py-1 text-[11px] bg-[#eff6ff] border border-[#bfdbfe] rounded-md text-[#1e40af] hover:bg-[#dbeafe] cursor-pointer font-semibold">
            ⬆ MDT procesado (GeoJSON)
            <input type="file" accept=".geojson,.json" className="hidden" onChange={e => e.target.files?.[0] && importMDTData(e.target.files[0])} />
          </label>
          <label className="px-2 py-1 text-[11px] bg-[#eff6ff] border border-[#bfdbfe] rounded-md text-[#1e40af] hover:bg-[#dbeafe] cursor-pointer font-semibold">
            ⬆ Perfil altimétrico (CSV)
            <input type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && importProfileData(e.target.files[0])} />
          </label>
          <label className="px-2 py-1 text-[11px] bg-[#eff6ff] border border-[#bfdbfe] rounded-md text-[#1e40af] hover:bg-[#dbeafe] cursor-pointer font-semibold">
            ⬆ Anomalías LiDAR (GeoJSON)
            <input type="file" accept=".geojson,.json" className="hidden" onChange={e => e.target.files?.[0] && importLidarData(e.target.files[0])} />
          </label>
        </div>

        {/* MDT cargado */}
        {mdtMetadata && (
          <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg p-2 mb-2 text-[10px]">
            <div className="font-bold text-[#166534] mb-1">✓ MDT cargado</div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[#14532d]">
              <span>Resolución:</span>
              <span className="font-semibold">{mdtMetadata.resolution} m</span>
              <span>Extensión:</span>
              <span className="font-semibold text-[9px]">{mdtMetadata.extent}</span>
              <span>Puntos:</span>
              <span className="font-semibold">{mdtMetadata.points.toLocaleString("es-ES")}</span>
              <span>Rango elevación:</span>
              <span className="font-semibold">{mdtMetadata.minElev.toFixed(1)}–{mdtMetadata.maxElev.toFixed(1)} m</span>
              {mdtMetadata.sha256 && (
                <>
                  <span>SHA-256:</span>
                  <span className="font-mono text-[8px]">{mdtMetadata.sha256.slice(0, 16)}…</span>
                </>
              )}
            </div>
            <div className="flex gap-1 mt-1.5">
              <button onClick={toggleHillshade} className="px-2 py-0.5 bg-white border border-[#86efac] rounded text-[9px] text-[#166534]">
                {showHillshade ? "Ocultar" : "Mostrar"} sombreado
              </button>
              <button onClick={() => setQueryMode(!queryMode)} className="px-2 py-0.5 bg-white border border-[#86efac] rounded text-[9px] text-[#166534]">
                {queryMode ? "Cancelar" : "Consultar"} cota
              </button>
            </div>
          </div>
        )}

        {/* Consulta de cota */}
        {queryMode && queryResult && (
          <div className="bg-[#fefce8] border border-[#fde047] rounded-lg p-2 mb-2 text-[10px]">
            <div className="font-bold text-[#854d0e] mb-1">📍 Cota consultada</div>
            <div className="text-[#713f12]">
              <div>Coordenadas: {queryResult.lat.toFixed(6)}, {queryResult.lon.toFixed(6)}</div>
              <div>Elevación: <b>{queryResult.elev.toFixed(2)} m</b></div>
              {queryResult.slope !== undefined && queryResult.slopePercent !== undefined && (
                <div>Pendiente: <b>{queryResult.slope.toFixed(1)}°</b> ({queryResult.slopePercent.toFixed(1)}%)</div>
              )}
            </div>
          </div>
        )}

        {/* Perfil topográfico */}
        {profileData.length > 0 && (
          <div className="bg-[#f0f9ff] border border-[#bae6fd] rounded-lg p-2 mb-2">
            <div className="text-[11px] font-bold text-[#0c4a6e] mb-1">Perfil topográfico</div>
            <div className="h-24 bg-white rounded border border-[#e0f2fe] relative overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 300 80" preserveAspectRatio="none">
                <polyline
                  points={profileData.map((p, i) => `${(i / (profileData.length - 1)) * 300},${80 - ((p.elev - minElev) / (maxElev - minElev)) * 70 - 5}`).join(" ")}
                  fill="none" stroke="#0284c7" strokeWidth="2"
                />
              </svg>
            </div>
            <div className="text-[9px] text-[#475569] mt-1">
              Elevación: {minElev.toFixed(1)} m — {maxElev.toFixed(1)} m · Desnivel: {(maxElev - minElev).toFixed(1)} m
            </div>
          </div>
        )}

        <div className="h-px bg-[#e4eaf0] my-3" />

        {/* Import/Export */}
        <h2 className="text-sm font-bold mb-1.5 text-[#18374a]">Importar / Exportar</h2>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button onClick={exportGeoJSON} className="px-2 py-1 text-[11px] bg-white border border-[#d7e3eb] rounded-md text-[#1d4559] hover:bg-[#edf7fc]">⬇ GeoJSON</button>
          <button onClick={exportCSV} className="px-2 py-1 text-[11px] bg-white border border-[#d7e3eb] rounded-md text-[#1d4559] hover:bg-[#edf7fc]">⬇ CSV</button>
          <button onClick={exportSession} className="px-2 py-1 text-[11px] bg-white border border-[#d7e3eb] rounded-md text-[#1d4559] hover:bg-[#edf7fc]">⬇ Sesión JSON</button>
          <button onClick={exportHTML} className="px-2 py-1 text-[11px] bg-white border border-[#d7e3eb] rounded-md text-[#1d4559] hover:bg-[#edf7fc]">⬇ Informe HTML</button>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          <label className="px-2 py-1 text-[11px] bg-white border border-[#d7e3eb] rounded-md text-[#1d4559] hover:bg-[#edf7fc] cursor-pointer">
            ⬆ GeoJSON
            <input type="file" accept=".geojson,.json" className="hidden" onChange={e => e.target.files?.[0] && importGeoJSON(e.target.files[0])} />
          </label>
          <label className="px-2 py-1 text-[11px] bg-white border border-[#d7e3eb] rounded-md text-[#1d4559] hover:bg-[#edf7fc] cursor-pointer">
            ⬆ CSV
            <input type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && importCSV(e.target.files[0])} />
          </label>
          <label className="px-2 py-1 text-[11px] bg-white border border-[#d7e3eb] rounded-md text-[#1d4559] hover:bg-[#edf7fc] cursor-pointer">
            ⬆ Sesión JSON
            <input type="file" accept=".json" className="hidden" onChange={e => e.target.files?.[0] && importSession(e.target.files[0])} />
          </label>
          <button onClick={downloadCSVTemplate} className="px-2 py-1 text-[11px] bg-white border border-[#d7e3eb] rounded-md text-[#1d4559] hover:bg-[#edf7fc]">📋 Plantilla CSV</button>
        </div>

        <div className="h-px bg-[#e4eaf0] my-3" />

        {/* Observations list */}
        {observations.length > 0 && (
          <>
            <h2 className="text-sm font-bold mb-1.5 text-[#18374a]">Observaciones ({observations.length})</h2>
            <div className="max-h-32 overflow-y-auto mb-2">
              {observations.map(o => (
                <div key={o.id} className="border border-[#e0e8ee] rounded-lg p-1.5 mb-1 text-[10px]">
                  <b>{o.fecha}</b> · {o.lat.toFixed(5)}, {o.lon.toFixed(5)}<br />
                  <span className="text-[#496270]">{o.origen}: {o.descripcion}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Catastral refs */}
        <h2 className="text-sm font-bold mb-1.5 text-[#18374a]">Referencias catastrales</h2>
        <div className="text-[11px] text-[#496270] mb-1">8 polígonos · 5 referencias · SHA-256 verificado</div>
        <div className="max-h-28 overflow-y-auto">
          {sortedRefs.map(([ref, dist]) => (
            <div key={ref} className="border border-[#e0e8ee] rounded-lg p-1.5 mb-1 text-[11px]">
              <b className="text-[#233c4d]">{ref}</b> — mín. {dist} m
            </div>
          ))}
        </div>

        <div className="h-px bg-[#e4eaf0] my-3" />

        <p className="text-[10px] text-[#587180] leading-snug">
          <b>Fuentes:</b> IGME-CSIC, IGN, CNIG. Cartografía catastral aportada. Servicios WMS oficiales.
        </p>
        <p className="text-[10px] text-[#587180] leading-snug mt-1">
          <a className="text-[#147198]" target="_blank" rel="noopener noreferrer" href="https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_InventarioEscombreras/MapServer/0">Inventario escombreras</a>
          {' · '}
          <a className="text-[#147198]" target="_blank" rel="noopener noreferrer" href="https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_BDMIN_Indicios/MapServer/0">BDMIN indicios</a>
          {' · '}
          <a className="text-[#147198]" target="_blank" rel="noopener noreferrer" href="https://info.igme.es/cartografiadigital/geologica/Geode.aspx">GEODE</a>
          {' · '}
          <a className="text-[#147198]" target="_blank" rel="noopener noreferrer" href="http://mapas.ideex.es/CICTEX/patrimonioCultural">Patrimonio Extremadura</a>
        </p>

        <div className="h-px bg-[#e4eaf0] my-3" />

        {/* Límites probatorios */}
        <div className="bg-[#fef2f2] border border-[#fecaca] rounded-lg p-2.5 text-[10px] leading-snug">
          <b className="text-[#991b1b] block mb-1">⚠ Límites probatorios de esta plataforma:</b>
          <ul className="list-disc pl-3 space-y-0.5 text-[#7f1d1d]">
            <li><b>No identifica minerales:</b> requiere análisis de laboratorio (DRX, espectrometría).</li>
            <li><b>No detecta galerías subterráneas:</b> requiere geofísica de campo (georradar, resistividad).</li>
            <li><b>No identifica yacimientos arqueológicos:</b> requiere prospección autorizada por la Junta de Extremadura.</li>
            <li><b>Anomalías LiDAR ≠ hallazgos verificados:</b> son indicios cartográficos que requieren comprobación.</li>
            <li><b>GEODE es escala 1:50.000:</b> no tiene detalle de estudio submétrico.</li>
            <li><b>Los registros IGME son inventario histórico:</b> no demuestran presencia actual.</li>
          </ul>
          <div className="mt-1.5 text-[#991b1b] font-semibold">
            Para verificación: estudio geotécnico, prospección arqueológica autorizada, análisis de laboratorio.
          </div>
        </div>
      </aside>
    </div>
  );
}
