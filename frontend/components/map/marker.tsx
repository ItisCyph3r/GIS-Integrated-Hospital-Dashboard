'use client';

import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import maplibregl from 'maplibre-gl';
import type { Point } from '@/types';

export interface MarkerProps {
  map: MapLibreMap | null;
  location: Point;
  color?: string;
  label?: string;
  icon?: string;
  onClick?: () => void;
}

export function Marker({
  map,
  location,
  color = '#3b82f6',
  label,
  icon,
  onClick,
}: MarkerProps) {
  const markerRef = useRef<MapLibreMarker | null>(null);

  useEffect(() => {
    if (!map) return;

    // Create marker element
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.cursor = onClick ? 'pointer' : 'default';

    // Add icon or default marker
    if (icon) {
      el.innerHTML = icon;
    } else {
      el.innerHTML = `
        <div style="
          background-color: ${color};
          width: 100%;
          height: 100%;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-center;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.3);
          border: 3px solid white;
        ">
          <div style="
            transform: rotate(45deg);
            color: white;
            font-weight: bold;
            font-size: 18px;
          ">
            ${label || ''}
          </div>
        </div>
      `;
    }

    // Add click handler
    if (onClick) {
      el.addEventListener('click', onClick);
    }

    // Create marker
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat(location.coordinates)
      .addTo(map);

    markerRef.current = marker;

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
    };
  }, [map, location, color, label, icon, onClick]);

  // Update position if location changes
  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.setLngLat(location.coordinates);
    }
  }, [location]);

  return null;
}
