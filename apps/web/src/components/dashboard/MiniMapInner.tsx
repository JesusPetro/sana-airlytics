'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SensorMarker } from '@/components/map/SensorMarker';
import { HeatmapOverlay } from '@/components/map/HeatmapOverlay';
import type { DeviceStatusResponse } from '@/types/sensor';

interface MiniMapInnerProps {
  devices: DeviceStatusResponse[];
  pm2_5Map: Record<string, number | null>;
  heatmap: boolean;
}

const CARTAGENA: [number, number] = [10.391, -75.479];

export function MiniMapInner({ devices, pm2_5Map, heatmap }: MiniMapInnerProps) {
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
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {!heatmap && devicesWithCoords.map((d) => (
        <SensorMarker
          key={d.device_id}
          device={d}
          pm2_5={pm2_5Map[d.device_id]}
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
