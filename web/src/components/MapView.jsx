import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const OSM_STYLE = {
  version: 8,
  sources: { osm: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© OpenStreetMap' } },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};
// Mogadishu fallback center
const CENTER = [45.3182, 2.0469];

function markerColor(status) {
  if (status === 'danger') return '#FF4D5E';
  if (status === 'pending') return '#F6B73C';
  return '#2DD4A7';
}

function popupText(member) {
  return [
    member.name || 'Unknown',
    member.status === 'danger' ? 'Emergency active' : 'Safe',
    `Speed: ${member.speed || 0} km/h`,
    `Accuracy: ${member.accuracy != null ? `${member.accuracy}m` : 'unknown'}`,
    `Heading: ${member.heading != null ? `${member.heading}°` : 'unknown'}`,
    `Updated: ${member.at ? new Date(member.at).toLocaleTimeString() : 'live'}`,
  ].join('\n');
}

export default function MapView({ members = [], trail = [], height = 380 }) {
  const ref = useRef(null); const map = useRef(null); const markers = useRef({}); const trailRef = useRef(trail);

  const setTrailData = () => {
    if (!map.current?.getSource('member-trail')) return;
    map.current.getSource('member-trail').setData({
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: trailRef.current.map((p) => [p.lng, p.lat]) },
    });
  };

  useEffect(() => {
    if (map.current) return;
    map.current = new maplibregl.Map({ container: ref.current, style: OSM_STYLE, center: CENTER, zoom: 12 });
    map.current.addControl(new maplibregl.NavigationControl(), 'top-right');
    map.current.on('load', () => {
      if (!map.current.getSource('member-trail')) {
        map.current.addSource('member-trail', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } },
        });
        map.current.addLayer({
          id: 'member-trail',
          type: 'line',
          source: 'member-trail',
          paint: { 'line-color': '#4DA3FF', 'line-width': 4, 'line-opacity': .85 },
        });
      }
      setTrailData();
    });
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    trailRef.current = trail;
    if (!map.current?.isStyleLoaded()) return;
    setTrailData();
  }, [trail]);

  useEffect(() => {
    if (!map.current) return;
    const seen = new Set();
    const bounds = new maplibregl.LngLatBounds();
    members.forEach((m) => {
      if (m.lng == null || m.lat == null) return;
      seen.add(m.id);
      bounds.extend([m.lng, m.lat]);
      const color = markerColor(m.status);
      if (markers.current[m.id]) {
        markers.current[m.id].setLngLat([m.lng, m.lat]);
        const el = markers.current[m.id].getElement();
        el.style.background = color;
        markers.current[m.id].setPopup(new maplibregl.Popup({ offset: 18 }).setText(popupText(m)));
      } else {
        const el = document.createElement('div');
        el.style.cssText = `width:28px;height:28px;border-radius:50% 50% 50% 8px;background:${color};border:3px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,.45);display:grid;place-items:center;font:700 10px Sora;color:#06121c;transition:background .2s,transform .2s`;
        el.textContent = (m.name || '?').slice(0, 1).toUpperCase();
        markers.current[m.id] = new maplibregl.Marker({ element: el })
          .setLngLat([m.lng, m.lat])
          .setPopup(new maplibregl.Popup({ offset: 18 }).setText(popupText(m)))
          .addTo(map.current);
      }
    });
    // remove stale
    Object.keys(markers.current).forEach((id) => { if (!seen.has(id) && !seen.has(+id)) { markers.current[id].remove(); delete markers.current[id]; } });
    if (!bounds.isEmpty()) {
      map.current.fitBounds(bounds, { padding: 70, maxZoom: 15, duration: 700 });
    }
  }, [members]);

  return <div ref={ref} style={{ width: '100%', height, borderRadius: 14, overflow: 'hidden' }} />;
}
