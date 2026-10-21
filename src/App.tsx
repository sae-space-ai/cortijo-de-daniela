import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { inputParcels, CORTIJO, ARROYO } from './data/parcels';

function dMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const a = Math.sin((lat2 - lat1) * Math.PI / 360) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin((lon2 - lon1) * Math.PI / 360) ** 2;
  return 12742000 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function escapeText(s: string): string {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c));
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
  }>;
  error?: string;
}

const endpoints = [
  { kind: "escombreras", url: "https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_InventarioEscombreras/MapServer/0/query", color: "#c8312a" },
  { kind: "indicios", url: "https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_BDMIN_Indicios/MapServer/0/query", color: "#703dab" }
];

const box = "-6.119,37.962,-6.003,38.052";

export default function App() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const escombrerasLayerRef = useRef<L.LayerGroup | null>(null);
  const indiciosLayerRef = useRef<L.LayerGroup | null>(null);
  const [results, setResults] = useState<QueryResult[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    const newResults: QueryResult[] = [];

    for (const ep of endpoints) {
      const title = ep.kind === "escombreras" ? "Escombreras 1989" : "Indicios minerales BDMIN";
      const layer = ep.kind === "escombreras" ? escombrerasLayerRef.current : indiciosLayerRef.current;
      if (layer) layer.clearLayers();

      const params = new URLSearchParams({
        where: "1=1",
        geometry: box,
        geometryType: "esriGeometryEnvelope",
        inSR: "4326",
        outSR: "4326",
        spatialRel: "esriSpatialRelIntersects",
        outFields: "*",
        returnGeometry: "true",
        f: "geojson"
      });

      try {
        const controller = new AbortController();
        const tim = setTimeout(() => controller.abort(), 11000);
        let response: Response;
        try {
          response = await fetch(ep.url + "?" + params.toString(), { signal: controller.signal });
        } finally {
          clearTimeout(tim);
        }
        if (!response.ok) throw new Error("HTTP " + response.status);
        const body = await response.json();
        if (body.error) throw new Error(body.error.message || "Error API");
        if (!Array.isArray(body.features)) throw new Error("respuesta sin geometrías");

        const features = body.features
          .filter((f: any) =>
            f.geometry?.type === "Point" && Array.isArray(f.geometry.coordinates) &&
            dMeters(CORTIJO[0], CORTIJO[1], f.geometry.coordinates[1], f.geometry.coordinates[0]) <= 5000
          )
          .sort((a: any, b: any) =>
            dMeters(CORTIJO[0], CORTIJO[1], a.geometry.coordinates[1], a.geometry.coordinates[0]) -
            dMeters(CORTIJO[0], CORTIJO[1], b.geometry.coordinates[1], b.geometry.coordinates[0])
          );

        const parsedFeatures = features.map((f: any) => {
          const [lon, lat] = f.geometry.coordinates;
          const a = f.properties || {};
          const m = Math.round(dMeters(CORTIJO[0], CORTIJO[1], lat, lon));
          const name = a.NOMBRE || a.PARAJE || a.DENOMINACION || a.NOMBREMIN || "Registro sin denominación";
          const tipo = a.ESTRUC || a.Sustancia || a.SUSTANCIA || "";

          if (layer) {
            const popup = `<b>${escapeText(name)}</b><br>${escapeText(title)}<br>${escapeText(tipo)}<br>${m} m del punto del cortijo<br><small>IGME · registro histórico, pendiente de verificación</small>`;
            L.circleMarker([lat, lon], { radius: 7, color: "#fff", weight: 1.5, fillColor: ep.color, fillOpacity: 0.95 })
              .bindPopup(popup).addTo(layer);
          }

          return { name, distance: m, tipo, lat, lon };
        });

        newResults.push({ title, count: features.length, features: parsedFeatures });
      } catch (e: any) {
        newResults.push({ title, count: 0, features: [], error: e.message || "Error desconocido" });
      }
    }

    setResults(newResults);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, { zoomControl: false }).setView(CORTIJO, 15);
    L.control.zoom({ position: "bottomright" }).addTo(map);

    const imagery = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
      maxZoom: 19, attribution: "World Imagery © Esri"
    }).addTo(map);

    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "© OpenStreetMap"
    });

    const wmsEs = L.tileLayer.wms("https://mapas.igme.es/gis/services/BasesDatos/IGME_InventarioEscombreras/MapServer/WMSServer", {
      layers: "0", format: "image/png", transparent: true, version: "1.3.0", attribution: "IGME | Escombreras 1989"
    }).addTo(map);

    const wmsMineral = L.tileLayer.wms("https://mapas.igme.es/gis/services/BasesDatos/IGME_BDMIN_Indicios/MapServer/WMSServer", {
      layers: "0", format: "image/png", transparent: true, version: "1.3.0", attribution: "IGME | BDMIN"
    });

    const radius1 = L.circle(CORTIJO, { radius: 1000, color: "#d39c3a", weight: 2, dashArray: "8 7", fillColor: "#b5aa8f", fillOpacity: 0.035 }).addTo(map);
    const radius05 = L.circle(CORTIJO, { radius: 500, color: "#daa954", weight: 1, dashArray: "4 5", fillOpacity: 0 }).addTo(map);

    const parcelLayer = L.geoJSON(inputParcels as any, {
      style: (f: any) => ({
        color: f.properties.capa === "PG-LP" ? "#1aafd1" : "#69b9e7",
        weight: f.properties.capa === "PG-LP" ? 2.5 : 1.4,
        fillOpacity: 0.035
      }),
      onEachFeature: (f: any, l: L.Layer) => {
        l.bindPopup(`<b>Ref. ${String(f.properties.referencia).replace(/</g, "&lt;")}</b><br>Geometría: ${f.properties.capa}<br>Distancia aprox. hasta el cortijo: ${f.properties.distancia_aprox_m} m.<br><i>No indica escombrera.</i>`);
      }
    }).addTo(map);

    const cortijoMarker = L.circleMarker(CORTIJO, { radius: 8, color: "#ffffee", weight: 3, fillColor: "#d98219", fillOpacity: 1 })
      .bindPopup("<b>Cortijo de Daniela</b><br>Ubicación cartográfica aproximada<br>38.006531,-6.060913").addTo(map);

    const matarramaMarker = L.circleMarker(ARROYO, { radius: 8, color: "#fff", weight: 2, fillColor: "#188ec1", fillOpacity: 1 })
      .bindPopup("<b>Referencia del arroyo de Matarrama</b><br>No indica el trazado completo del cauce.").addTo(map);

    const actualEscombreras = L.layerGroup().addTo(map);
    const actualIndicios = L.layerGroup().addTo(map);

    escombrerasLayerRef.current = actualEscombreras;
    indiciosLayerRef.current = actualIndicios;

    L.control.layers(
      { "Ortofoto Esri": imagery, "Callejero OSM": osm },
      {
        "Escombreras IGME (imagen)": wmsEs,
        "Indicios de minerales IGME (imagen)": wmsMineral,
        "Escombreras oficiales (puntos consultados)": actualEscombreras,
        "Indicios minerales (puntos consultados)": actualIndicios,
        "Geometrías catastrales": parcelLayer,
        "Cortijo Daniela": cortijoMarker,
        "Referencia Matarrama": matarramaMarker,
        "Radio 1 km": radius1,
        "Radio 500 m": radius05
      },
      { position: "topright", collapsed: true }
    ).addTo(map);

    map.fitBounds(radius1.getBounds());
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const refs = new Map<string, number>();
  for (const f of inputParcels.features) {
    const r = f.properties.referencia;
    const dist = f.properties.distancia_aprox_m;
    refs.set(r, Math.min(refs.get(r) ?? 999999, dist));
  }
  const sortedRefs = [...refs.entries()].sort((a, b) => a[1] - b[1]);

  const handleCenterCortijo = () => {
    if (mapRef.current) mapRef.current.setView(CORTIJO, 16);
  };

  return (
    <div className="h-screen w-screen bg-[#f7fafc] text-[#1d3040] font-[system-ui,-apple-system,Segoe_UI,Arial,sans-serif] relative overflow-hidden">
      {/* Map Container */}
      <div ref={mapContainerRef} className="absolute inset-0 z-0" role="region" aria-label="Mapa del Cortijo de Daniela y registros IGME" />

      {/* Sidebar */}
      <aside className="absolute left-[15px] top-[15px] bottom-[15px] w-[min(385px,calc(100vw-30px))] overflow-y-auto bg-white z-[1000] shadow-[0_6px_26px_#12283c36] rounded-[14px] p-[18px] max-md:top-auto max-md:bottom-0 max-md:left-0 max-md:w-full max-md:h-[39%] max-md:rounded-[15px_15px_0_0] max-md:p-[12px_15px]">
        <div className="text-[11px] uppercase tracking-[1.4px] font-extrabold text-[#397590] mb-2">
          Cartografía de reconocimiento · Montemolín
        </div>
        <h1 className="text-[20px] leading-[1.22] mb-2 text-[#18374a] tracking-[-0.4px] max-md:text-[17px]">
          Cortijo de Daniela<br />y posibles escombreras
        </h1>
        <p className="text-[13px] leading-[1.44] text-[#496270] mb-0">
          Área inicial: 1 km alrededor de la posición cartográfica del cortijo. Inventarios mineros consultables en un radio de 5 km.
        </p>

        <div className="px-[10px] py-[8px] bg-[#eef5f8] rounded-[7px] text-[13px] font-bold tracking-[0.1px] mt-3">
          38.006531 N · −6.060913 O
        </div>

        <div className="px-[11px] py-[10px] bg-[#fff9ee] border-l-[3px] border-[#cb7e14] text-[12px] leading-[1.5] rounded-[3px] my-3">
          <b>Verificación:</b> el cortijo es una referencia aproximada. Los polígonos azules son límites catastrales, no escombreras. Un registro minero no demuestra oro ni contacto con el arroyo. Los servicios remotos requieren internet.
        </div>

        <div className="grid grid-cols-2 gap-2 my-[11px]">
          <div className="p-[10px] bg-[#f4f8fb] rounded-[9px]">
            <b className="block text-[17px]">1 km</b>
            <span className="text-[11px] text-[#587180]">Radio de inspección</span>
          </div>
          <div className="p-[10px] bg-[#f4f8fb] rounded-[9px]">
            <b className="block text-[17px]">~810 m</b>
            <span className="text-[11px] text-[#587180]">Entre las dos referencias cartográficas</span>
          </div>
        </div>

        <div className="flex gap-[7px] my-[9px] flex-wrap">
          <button onClick={handleCenterCortijo} className="px-[11px] py-[9px] border border-[#d7e3eb] bg-white rounded-[7px] text-[#1d4559] cursor-pointer font-semibold text-[12px] hover:bg-[#edf7fc]">
            Centrar en el cortijo
          </button>
          <button onClick={() => mapRef.current?.fitBounds(L.circle(CORTIJO, { radius: 1000 }).getBounds())} className="px-[11px] py-[9px] border border-[#d7e3eb] bg-white rounded-[7px] text-[#1d4559] cursor-pointer font-semibold text-[12px] hover:bg-[#edf7fc]">
            Ver entorno 1 km
          </button>
        </div>

        <h2 className="text-[14px] tracking-[-0.1px] my-[10px_0_8px]">Capas disponibles</h2>
        <div className="flex gap-[10px] flex-wrap text-[11px] my-[9px]">
          <span><span className="inline-block w-[10px] h-[10px] rounded-full mr-[6px] align-baseline bg-[#d13e33]" />Escombreras IGME</span>
          <span><span className="inline-block w-[10px] h-[10px] rounded-full mr-[6px] align-baseline bg-[#6f46a9]" />Indicios minerales</span>
          <span><span className="inline-block w-[10px] h-[10px] rounded-full mr-[6px] align-baseline bg-[#07a2d4]" />Límites catastrales</span>
        </div>
        <p className="text-[13px] leading-[1.44] text-[#496270]">
          En el mapa, usa el selector de capas (arriba derecha). La ortofoto permite examinar montículos, excavaciones, pistas antiguas y acumulaciones; no permite diagnosticar su composición.
        </p>

        <div className="h-[1px] bg-[#e4eaf0] my-[15px]" />

        <h2 className="text-[14px] tracking-[-0.1px] my-[10px_0_8px]">Consulta en directo a los inventarios IGME</h2>
        <div className="text-[12px] leading-[1.55]" aria-live="polite">
          {loading ? (
            <div className="border border-[#e0e8ee] rounded-[8px] p-[9px] mb-[7px]">
              <b className="block text-[#233c4d]">Consultando servicios IGME…</b>
            </div>
          ) : results.length === 0 ? (
            <div className="border border-[#e0e8ee] rounded-[8px] p-[9px] mb-[7px]">
              <b className="block text-[#233c4d]">Intentando leer los registros oficiales...</b>
            </div>
          ) : (
            results.map((r, i) => (
              <div key={i}>
                <div className="border border-[#e0e8ee] rounded-[8px] p-[9px] mb-[7px]">
                  <b className="block text-[#233c4d]">{r.title}: {r.count} registros en 5 km</b>
                  {r.count > 0
                    ? "Puntos recuperados del servicio oficial, sin verificación de campo."
                    : r.error
                      ? `Consulta automática no disponible. Error: ${r.error}. Activa la capa cartográfica WMS en el mapa o consulta la fuente original.`
                      : "Ningún punto devuelto para este radio por esta base histórica; no descarta depósitos no inventariados."
                  }
                </div>
                {r.features.map((f, j) => (
                  <div key={j} className="border border-[#e0e8ee] rounded-[8px] p-[9px] mb-[7px]">
                    <b className="block text-[#233c4d]">{f.name}</b>
                    {f.distance.toLocaleString("es-ES")} m del cortijo{f.tipo ? ` · ${f.tipo}` : ""}
                    <br />
                    <a className="text-[12px] text-[#147198]" href={`https://www.google.com/maps?q=${f.lat},${f.lon}`} target="_blank" rel="noopener noreferrer">
                      Ver posición del registro ↗
                    </a>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
        <button onClick={loadRecords} className="px-[11px] py-[9px] border border-[#d7e3eb] bg-white rounded-[7px] text-[#1d4559] cursor-pointer font-semibold text-[12px] hover:bg-[#edf7fc]">
          Reintentar consulta
        </button>

        <div className="h-[1px] bg-[#e4eaf0] my-[15px]" />

        <h2 className="text-[14px] tracking-[-0.1px] my-[10px_0_8px]">Referencias catastrales cercanas</h2>
        <div className="text-[13px] leading-[1.44] text-[#496270] mb-2">
          Mediciones aproximadas hasta geometrías de los DXF/ASC facilitados:
        </div>
        <div>
          {sortedRefs.map(([ref, dist]) => (
            <div key={ref} className="border border-[#e0e8ee] rounded-[8px] p-[9px] mb-[7px]">
              <b className="block text-[#233c4d]">{ref}</b>
              Distancia mínima: {dist} m
            </div>
          ))}
        </div>

        <div className="h-[1px] bg-[#e4eaf0] my-[15px]" />

        <p className="text-[13px] leading-[1.44] text-[#496270]">
          <b>Fuentes:</b> archivos catastrales aportados; mapa de referencia del Cortijo de Daniela; IGME — Inventario Escombreras 1989 y BDMIN, mediante servicios cartográficos oficiales.
        </p>
        <p className="text-[13px] leading-[1.44] text-[#496270] mt-2">
          <a className="text-[#147198]" target="_blank" rel="noopener noreferrer" href="https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_InventarioEscombreras/MapServer/0">Abrir el inventario oficial de escombreras</a>
          {' · '}
          <a className="text-[#147198]" target="_blank" rel="noopener noreferrer" href="https://mapas.igme.es/gis/rest/services/BasesDatos/IGME_BDMIN_Indicios/MapServer/0">Indicios minerales BDMIN</a>
        </p>
      </aside>
    </div>
  );
}
