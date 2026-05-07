'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Props {
  onSelect: (lat: number, lng: number) => void;
  initialLat?: number;
  initialLng?: number;
}

export function GpsPicker({ onSelect, initialLat, initialLng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  // Auto-geolocate on mount
  const initMap = useCallback(async (lat: number, lng: number) => {
    if (!mapRef.current) return;
    const { Map } = (await google.maps.importLibrary('maps')) as google.maps.MapsLibrary;
    const { AdvancedMarkerElement } = (await google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;

    const map = new Map(mapRef.current, {
      center: { lat, lng },
      zoom: 17,
      mapId: 'civic-gps-picker',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    mapInstanceRef.current = map;

    const position = { lat, lng };
    const markerEl = new AdvancedMarkerElement({ map, position });
    markerRef.current = markerEl as unknown as google.maps.Marker;

    setMarker(position);
    onSelect(lat, lng);
    setLoading(false);

    // Drag to reposition
    map.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        markerEl.position = newPos;
        setMarker(newPos);
        onSelect(newPos.lat, newPos.lng);
      }
    });
  }, [onSelect]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (initialLat && initialLng) {
      initMap(initialLat, initialLng);
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => initMap(pos.coords.latitude, pos.coords.longitude),
        () => initMap(17.385, 78.4867) // Default: Hyderabad
      );
    } else {
      initMap(17.385, 78.4867);
    }
  }, [initialLat, initialLng, initMap]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}
      {marker && (
        <div className="absolute bottom-2 left-2 right-2 bg-white rounded-lg px-3 py-2 text-xs shadow">
          <span className="text-gray-500">GPS: </span>
          <span className="font-mono">{marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}</span>
        </div>
      )}
    </div>
  );
}
