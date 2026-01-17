'use client';

import { useEffect } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { Point } from '@/types';

export interface RouteLineProps {
  map: MapLibreMap | null;
  start: Point;
  end: Point;
  color?: string;
  width?: number;
  id?: string;
}

export function RouteLine({
  map,
  start,
  end,
  color = '#ef4444',
  width = 3,
  id = 'route-line',
}: RouteLineProps) {
  useEffect(() => {
    if (!map) return;

    const sourceId = `${id}-source`;
    const layerId = `${id}-layer`;

    // Wait for map to load
    if (!map.isStyleLoaded()) {
      map.once('load', addRoute);
    } else {
      addRoute();
    }

    function addRoute() {
      if (!map) return;

      // Remove existing route if present
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }

      // Add source
      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [start.coordinates, end.coordinates],
          },
        },
      });

      // Add layer
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': color,
          'line-width': width,
          'line-opacity': 0.8,
        },
      });

      // Add animated dashed line for movement effect
      map.addLayer({
        id: `${layerId}-dashed`,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': width / 2,
          'line-opacity': 0.6,
          'line-dasharray': [0, 2, 3],
        },
      });

      // Animate the dashed line
      let dashArraySequence = [
        [0, 2, 3],
        [0.5, 2, 2.5],
        [1, 2, 2],
        [1.5, 2, 1.5],
        [2, 2, 1],
        [2.5, 2, 0.5],
        [3, 2, 0],
      ];
      let step = 0;

      function animateDashArray(timestamp: number) {
        if (!map || !map.getLayer(`${layerId}-dashed`)) return;

        const newStep = Math.floor((timestamp / 100) % dashArraySequence.length);
        if (newStep !== step) {
          map.setPaintProperty(
            `${layerId}-dashed`,
            'line-dasharray',
            dashArraySequence[newStep]
          );
          step = newStep;
        }

        requestAnimationFrame(animateDashArray);
      }

      animateDashArray(0);

      // Fit bounds to show the route
      const bounds = [
        [
          Math.min(start.coordinates[0], end.coordinates[0]),
          Math.min(start.coordinates[1], end.coordinates[1]),
        ],
        [
          Math.max(start.coordinates[0], end.coordinates[0]),
          Math.max(start.coordinates[1], end.coordinates[1]),
        ],
      ] as [[number, number], [number, number]];

      map.fitBounds(bounds, {
        padding: 100,
        duration: 1000,
      });
    }

    // Cleanup
    return () => {
      if (!map) return;
      
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getLayer(`${layerId}-dashed`)) {
        map.removeLayer(`${layerId}-dashed`);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    };
  }, [map, start, end, color, width, id]);

  return null;
}
