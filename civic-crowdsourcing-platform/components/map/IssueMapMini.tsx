'use client';

import { useEffect, useRef } from 'react';

interface Props {
  lat: number;
  lng: number;
}

export function IssueMapMini({ lat, lng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;
    // Static Google Maps image for the detail page (avoids loading full Maps SDK)
    const img = document.createElement('img');
    img.src = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=600x200&markers=color:red%7C${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`;
    img.alt = 'Issue location';
    img.className = 'w-full h-full object-cover';
    mapRef.current.appendChild(img);

    return () => { if (mapRef.current) mapRef.current.innerHTML = ''; };
  }, [lat, lng]);

  return <div ref={mapRef} className="w-full h-full bg-gray-100" />;
}
