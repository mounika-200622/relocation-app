"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";

export type MapMarker = {
  id: string | number;
  lat: number;
  lng: number;
  label?: string; // text inside the pin (price, number)
  title?: string;
  href?: string;
  kind?: "default" | "price" | "home";
};

function pinIcon(m: MapMarker) {
  const cls = m.kind === "price" ? "nira-pin price" : m.kind === "home" ? "nira-pin home" : "nira-pin";
  const text = (m.label ?? "").replace(/[<>&"]/g, "");
  return L.divIcon({ className: "", html: `<div class="${cls}">${text}</div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
}

function Fit({ markers, center }: { markers: MapMarker[]; center?: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const pts = markers.map((m) => [m.lat, m.lng] as [number, number]);
    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts).pad(0.15), { maxZoom: 16 });
    else if (pts.length === 1) map.setView(pts[0]!, 15);
    else if (center) map.setView(center, 14);
  }, [map, markers, center]);
  return null;
}

function ClickToPick({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

/**
 * Leaflet + OpenStreetMap tiles (no API key). Supports price/number pins, a radius
 * circle, and click/drag-to-set for the listing form.
 */
export default function MapView({
  markers, center, radiusM, height = 360, onPick, draggable, fit = true, className,
}: {
  markers: MapMarker[]; center?: [number, number]; radiusM?: number; height?: number | string; onPick?: (lat: number, lng: number) => void;
  draggable?: boolean; fit?: boolean; className?: string;
}) {
  const start: [number, number] = center ?? (markers[0] ? [markers[0].lat, markers[0].lng] : [46.8, 8.2]);
  return (
    <div className={className} style={{ height }}>
      <MapContainer center={start} zoom={14} scrollWheelZoom={false} style={{ height: "100%", width: "100%", borderRadius: "inherit" }} attributionControl>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' maxZoom={19} />
        {radiusM && center && <Circle center={center} radius={radiusM} pathOptions={{ color: "#ec4899", weight: 1.5, fillOpacity: 0.06 }} />}
        {markers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={pinIcon(m)}
            draggable={draggable}
            eventHandlers={draggable && onPick ? { dragend: (e) => { const p = (e.target as L.Marker).getLatLng(); onPick(p.lat, p.lng); } } : undefined}
          >
            {m.title && (
              <Popup>
                {m.href ? <a href={m.href} className="font-medium">{m.title}</a> : <span className="font-medium">{m.title}</span>}
              </Popup>
            )}
          </Marker>
        ))}
        {fit && <Fit markers={markers} center={center} />}
        {onPick && !draggable && <ClickToPick onPick={onPick} />}
      </MapContainer>
    </div>
  );
}
