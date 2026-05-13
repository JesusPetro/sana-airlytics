'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useDarkMode } from '@/hooks/useDarkMode';
import { MapAutoResize } from '@/components/map/MapAutoResize';
import 'leaflet/dist/leaflet.css';
import { SensorMarker } from '@/components/map/SensorMarker';
import { HeatmapOverlay } from '@/components/map/HeatmapOverlay';
import type { DeviceStatusResponse } from '@/types/sensor';

interface MiniMapInnerProps {
  devices:          DeviceStatusResponse[];
  pm2_5Map:         Record<string, number | null>;
  heatmap:          boolean;
  selectedSensorId?: string;
}

const CARTAGENA: [number, number] = [10.391, -75.479];

const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export function MiniMapInner({ devices, pm2_5Map, heatmap, selectedSensorId }: MiniMapInnerProps) {
  const isDark = useDarkMode();
  const devicesWithCoords = useMemo(
    () => devices.filter((d) => d.latitude != null && d.longitude != null),
    [devices],
  );

  const center = useMemo((): [number, number] => {
    if (devicesWithCoords.length === 0) return CARTAGENA;
    const avgLat = devicesWithCoords.reduce((s, d) => s + d.latitude!, 0) / devicesWithCoords.length;
    const avgLng = devicesWithCoords.reduce((s, d) => s + d.longitude!, 0) / devicesWithCoords.length;
    return [avgLat, avgLng];
  }, [devicesWithCoords]);

  const readings = useMemo(() => {
    const m: Record<string, Record<string, number | null>> = {};
    for (const d of devices) {
      m[d.device_id] = { pm2_5: pm2_5Map[d.device_id] ?? null };
    }
    return m;
  }, [devices, pm2_5Map]);

  return (
    <MapContainer
      center={center}
      zoom={13}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      attributionControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
    >
      <MapAutoResize />
      <TileLayer
        key={isDark ? 'dark' : 'light'}
        url={isDark ? TILE_DARK : TILE_LIGHT}
      />

      {!heatmap && devicesWithCoords.map((d) => (
        <SensorMarker
          key={d.device_id}
          device={d}
          pm2_5={pm2_5Map[d.device_id]}
          selected={!!selectedSensorId && d.device_id === selectedSensorId}
        />
      ))}

      {heatmap && (
        <HeatmapOverlay
          devices={devicesWithCoords}
          readings={readings}
          contaminant="pm2_5"
        />
      )}
    </MapContainer>
  );
}
