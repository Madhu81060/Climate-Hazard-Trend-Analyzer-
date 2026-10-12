import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in bundlers
const customMarkerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function LocationMarker({ latitude, longitude, onLocationChange }) {
  const map = useMapEvents({
    click(e) {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    map.flyTo([latitude, longitude], map.getZoom());
  }, [latitude, longitude, map]);

  return (
    <Marker position={[latitude, longitude]} icon={customMarkerIcon}>
      <Popup>
        <div className="text-slate-900 text-xs font-sans">
          <strong>Selected Point</strong><br />
          Lat: {latitude.toFixed(4)}°<br />
          Lon: {longitude.toFixed(4)}°
        </div>
      </Popup>
    </Marker>
  );
}

export default function MapPicker({ latitude, longitude, onLocationChange, regionName }) {
  return (
    <div className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-slate-700/60 shadow-inner bg-slate-950">
      <div className="absolute top-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-slate-300 shadow">
        💡 Click anywhere on the map to set custom coordinates
      </div>
      <MapContainer
        center={[latitude, longitude]}
        zoom={5}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker
          latitude={latitude}
          longitude={longitude}
          onLocationChange={onLocationChange}
        />
      </MapContainer>
    </div>
  );
}
