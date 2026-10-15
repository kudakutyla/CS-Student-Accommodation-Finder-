'use client';

import { useEffect, useRef } from 'react';
import { LngLatBounds, Map as MapLibreMap, Marker, NavigationControl, Popup } from 'maplibre-gl';
import type { ListingRoutePreview } from '../types';

type RoutePreviewMapProps = {
  preview: ListingRoutePreview;
  campusName: string;
};

export default function RoutePreviewMap({ preview, campusName }: RoutePreviewMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new MapLibreMap({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          openstreetmap: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
          },
        },
        layers: [{ id: 'openstreetmap', type: 'raster', source: 'openstreetmap' }],
      },
      center: [preview.longitude, preview.latitude],
      zoom: 12,
    });

    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    new Marker({ color: '#c4704a' })
      .setLngLat([preview.longitude, preview.latitude])
      .setPopup(new Popup().setText('Property address'))
      .addTo(map);
    new Marker({ color: '#55755a' })
      .setLngLat([preview.campusCoordinates.longitude, preview.campusCoordinates.latitude])
      .setPopup(new Popup().setText(campusName))
      .addTo(map);

    map.on('load', () => {
      map.addSource('campus-route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: preview.routeGeometry,
        },
      });
      map.addLayer({
        id: 'campus-route-line',
        type: 'line',
        source: 'campus-route',
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#c4704a',
          'line-width': 5,
        },
      });

      const routeCoordinates = preview.routeGeometry.coordinates;
      const bounds = routeCoordinates.reduce(
        (currentBounds, coordinate) => currentBounds.extend(coordinate),
        new LngLatBounds(routeCoordinates[0], routeCoordinates[0])
      );
      map.fitBounds(bounds, { padding: 48, maxZoom: 14 });
    });

    return () => map.remove();
  }, [campusName, preview]);

  return <div ref={mapContainer} className="h-80 w-full overflow-hidden rounded-2xl" aria-label={`Driving route to ${campusName}`} />;
}
