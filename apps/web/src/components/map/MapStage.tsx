'use client';

import { useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { useDarkMode } from '@/hooks/useDarkMode';
import 'leaflet/dist/leaflet.css';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useDevices } from '@/hooks/useDevices';
import { useDashboard } from '@/hooks/useDashboard';
import { rangeToISO } from '@/hooks/useTimeRange';
import { MapAutoResize } from './MapAutoResize';
import { TrackPoints } from './TrackPoints';
import { SensorMarker } from './SensorMarker';
import { HeatmapOverlay } from './HeatmapOverlay';
import { MapControlPanel } from './MapControlPanel';
import { MapZoomStack } from './MapZoomStack';
import { MapLegend } from './MapLegend';
import { SensorPopup } from './SensorPopup';
import type { DeviceStatusResponse } from '@/types/sensor';
import { useTranslations } from 'next-intl';
import { EmptyWorkspace } from '@/components/ui/EmptyWorkspace';
import { useDeviceTracks } from '@/hooks/useDeviceTracks';

type LayerMode = 'points' | 'heatmap';
type ContaminantCode = 'pm2_5' | 'pm10' | 'co2' | 'nox_index';

const CARTAGENA: [number, number] = [10.391, -75.479];

const TILE_LIGHT = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

export function MapStage() {
  const t = useTranslations();
  const isDark = useDarkMode();
  const { activeWorkspace, isLoading: wsLoading } = useWorkspace();
  // Fixed 24H window — map page has no range pill
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { from, to } = useMemo(() => rangeToISO('24H'), []);

  const [layer, setLayer] = useState<LayerMode>('points');
  const [contaminant, setContaminant] = useState<ContaminantCode>('pm2_5');

  const { data: devices = [], isLoading: devLoading } = useDevices(activeWorkspace?.workspace_id);
  const { data: dashData } = useDashboard(activeWorkspace?.workspace_id, from, to);
  const tracks = useDeviceTracks(devices, contaminant);
  const [trajectory, setTrajectory] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceStatusResponse | null>(null);
  const [popupVisible, setPopupVisible]     = useState(false);
  const popupAnchorRef = useRef<{ x: number; y: number } | null>(null);

  function openPopup(dev: DeviceStatusResponse) {
    setSelectedDevice(dev);
    setTimeout(() => setPopupVisible(true), 10);
  }

  function closePopup() {
    setPopupVisible(false);
    setTimeout(() => setSelectedDevice(null), 200);
  }

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

  if (wsLoading) return null;
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
        <MapAutoResize />
        <TileLayer
          key={isDark ? 'dark' : 'light'}
          url={isDark ? TILE_DARK : TILE_LIGHT}
          attribution={isDark
            ? '&copy; <a href="https://carto.com/">CARTO</a>'
            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}
        />

        <TrackPoints tracks={tracks} contaminant={contaminant} />

        {layer === 'points' && devicesWithCoords.map((d) => (
          <SensorMarker
            key={d.device_id}
            device={d}
            pm2_5={readings[d.device_id]?.pm2_5}
            onClick={openPopup}
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
        <div style={{
          position: 'absolute', top: '60px', left: '172px', zIndex: 1100,
          opacity: popupVisible ? 1 : 0,
          transform: popupVisible ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(-8px)',
          transformOrigin: 'top left',
          transition: 'opacity 0.18s ease, transform 0.18s ease',
        }}>
          <SensorPopup
            device={selectedDevice}
            readings={readings[selectedDevice.device_id]}
            onClose={closePopup}
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
