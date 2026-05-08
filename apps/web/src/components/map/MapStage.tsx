'use client';

import { useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useDevices } from '@/hooks/useDevices';
import { useDashboard } from '@/hooks/useDashboard';
import { useTimeRange, rangeToISO } from '@/hooks/useTimeRange';
import { SensorMarker } from './SensorMarker';
import { HeatmapOverlay } from './HeatmapOverlay';
import { MapControlPanel } from './MapControlPanel';
import { MapZoomStack } from './MapZoomStack';
import { MapLegend } from './MapLegend';
import { SensorPopup } from './SensorPopup';
import type { DeviceStatusResponse } from '@/types/sensor';
import { useTranslations } from 'next-intl';
import { EmptyWorkspace } from '@/components/ui/EmptyWorkspace';

type LayerMode = 'points' | 'heatmap';
type ContaminantCode = 'pm2_5' | 'pm10' | 'co2' | 'nox_index';

const CARTAGENA: [number, number] = [10.391, -75.479];

export function MapStage() {
  const t = useTranslations();
  const { activeWorkspace } = useWorkspace();
  const { range } = useTimeRange();
  const { from, to } = rangeToISO(range);

  const { data: devices = [], isLoading: devLoading } = useDevices(activeWorkspace?.workspace_id);
  const { data: dashData } = useDashboard(activeWorkspace?.workspace_id, from, to);

  const [layer, setLayer] = useState<LayerMode>('points');
  const [contaminant, setContaminant] = useState<ContaminantCode>('pm2_5');
  const [trajectory, setTrajectory] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceStatusResponse | null>(null);
  const popupAnchorRef = useRef<{ x: number; y: number } | null>(null);

  const devicesWithCoords = useMemo(
    () => devices.filter((d) => d.latitude != null && d.longitude != null),
    [devices],
  );

  const readings = useMemo(() => {
    const map: Record<string, Record<string, number | null>> = {};
    for (const d of devices) {
      map[d.device_id] = {
        pm2_5:     dashData['pm2_5']?.latestValue ?? null,
        pm10:      dashData['pm10']?.latestValue ?? null,
        co2:       dashData['co2']?.latestValue ?? null,
        nox_index: dashData['nox_index']?.latestValue ?? null,
      };
    }
    return map;
  }, [devices, dashData]);

  const center = useMemo((): [number, number] => {
    if (devicesWithCoords.length === 0) return CARTAGENA;
    const avgLat = devicesWithCoords.reduce((s, d) => s + d.latitude!, 0) / devicesWithCoords.length;
    const avgLng = devicesWithCoords.reduce((s, d) => s + d.longitude!, 0) / devicesWithCoords.length;
    return [avgLat, avgLng];
  }, [devicesWithCoords]);

  if (!activeWorkspace) {
    return <EmptyWorkspace msg={t('dashboard.noWorkspace')} />;
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {layer === 'points' && devicesWithCoords.map((d) => (
          <SensorMarker
            key={d.device_id}
            device={d}
            pm2_5={readings[d.device_id]?.pm2_5}
            onClick={(dev) => setSelectedDevice(dev)}
          />
        ))}

        {layer === 'heatmap' && (
          <HeatmapOverlay
            devices={devicesWithCoords}
            readings={readings}
            contaminant={contaminant}
          />
        )}

        <MapControlPanel
          layer={layer}
          onLayerChange={setLayer}
          contaminant={contaminant}
          onContaminantChange={setContaminant}
          trajectory={trajectory}
          onTrajectoryChange={setTrajectory}
        />

        <MapZoomStack />

        <MapLegend contaminant={contaminant} />
      </MapContainer>

      {/* Sensor popup — rendered outside MapContainer to use CSS vars */}
      {selectedDevice && (
        <div style={{ position: 'absolute', top: '60px', left: '172px', zIndex: 1100 }}>
          <SensorPopup
            device={selectedDevice}
            readings={readings[selectedDevice.device_id]}
            onClose={() => setSelectedDevice(null)}
          />
        </div>
      )}

      {devLoading && (
        <div style={{
          position: 'absolute', bottom: '80px', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--color-surface)', border: '1px solid var(--color-border)',
          borderRadius: '9999px', padding: '4px 12px', fontSize: '12px',
          color: 'var(--color-text-secondary)', zIndex: 1100, boxShadow: 'var(--shadow-sm)',
        }}>
          {t('common.loading')}
        </div>
      )}
    </div>
  );
}
