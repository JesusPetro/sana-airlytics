'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleMarker, useMapEvents } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import type { DeviceTrack } from '@/hooks/useDeviceTracks';
import { getDeviceSnapshot, type Snapshot } from '@/lib/api/devices';
import { levelFromValue } from '@/lib/aqi';
import { TrackPointBubble } from './TrackPointBubble';

const DEFAULT_COLOR = '#8B9BBC';

function resolveColor(cssVar: string): string {
  if (!cssVar.startsWith('var(')) return cssVar;
  const name = cssVar.replace(/^var\(/, '').replace(/\)$/, '').trim();
  return typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() || DEFAULT_COLOR
    : DEFAULT_COLOR;
}

function pointColor(contaminant: string | undefined, value: number | null | undefined): string {
  if (!contaminant || value == null) return DEFAULT_COLOR;
  const level = levelFromValue(contaminant, value);
  return level ? resolveColor(level.color) : DEFAULT_COLOR;
}

interface ActiveBubble {
  deviceCode: string;
  snapshot: Snapshot;
  lat: number;
  lng: number;
  pixelX: number;
  pixelY: number;
}

interface TrackCircleProps {
  lat: number;
  lng: number;
  deviceId: string;
  deviceCode: string;
  recordedAt: string;
  contaminant: string | undefined;
  contaminantValue: number | null | undefined;
  active: ActiveBubble | null;
  onOpen: (b: ActiveBubble) => void;
  onClose: () => void;
}

function TrackCircle({
  lat, lng, deviceId, deviceCode, recordedAt,
  contaminant, contaminantValue,
  active, onOpen, onClose,
}: TrackCircleProps) {
  const isThisActive = active?.lat === lat && active?.lng === lng && active?.deviceCode === deviceCode;
  const color = pointColor(contaminant, contaminantValue);

  const map = useMapEvents({
    moveend: () => {
      if (isThisActive && active) {
        const p = map.latLngToContainerPoint([lat, lng]);
        const rect = map.getContainer().getBoundingClientRect();
        onOpen({ ...active, pixelX: rect.left + p.x, pixelY: rect.top + p.y });
      }
    },
    zoomend: () => {
      if (isThisActive && active) {
        const p = map.latLngToContainerPoint([lat, lng]);
        const rect = map.getContainer().getBoundingClientRect();
        onOpen({ ...active, pixelX: rect.left + p.x, pixelY: rect.top + p.y });
      }
    },
  });

  async function handleClick(e: LeafletMouseEvent) {
    if (isThisActive) { onClose(); return; }
    const p = map.latLngToContainerPoint([lat, lng]);
    const rect = map.getContainer().getBoundingClientRect();
    try {
      const snapshot = await getDeviceSnapshot(deviceId, recordedAt);
      onOpen({ deviceCode, snapshot, lat, lng, pixelX: rect.left + p.x, pixelY: rect.top + p.y });
    } catch { /* sin mediciones */ }
  }

  return (
    <CircleMarker
      center={[lat, lng]}
      radius={12}
      pathOptions={{
        color: '#fff',
        fillColor: color,
        fillOpacity: 0.9,
        weight: 2.5,
      }}
      eventHandlers={{ click: handleClick }}
    />
  );
}

interface Props {
  tracks: DeviceTrack[];
  contaminant?: string;
}

export function TrackPoints({ tracks, contaminant }: Props) {
  const [active, setActive] = useState<ActiveBubble | null>(null);

  return (
    <>
      {tracks.flatMap(({ device, points }) =>
        points.map((pt, i) => (
          <TrackCircle
            key={`${device.device_id}-${i}`}
            lat={pt.latitude}
            lng={pt.longitude}
            deviceId={device.device_id}
            deviceCode={device.code}
            recordedAt={pt.recorded_at}
            contaminant={contaminant}
            contaminantValue={pt.contaminant_value}
            active={active}
            onOpen={setActive}
            onClose={() => setActive(null)}
          />
        ))
      )}

      {active && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          left: active.pixelX,
          top: active.pixelY,
          transform: 'translate(-50%, calc(-100% - 14px))',
          zIndex: 2000,
          pointerEvents: 'auto',
        }}>
          <TrackPointBubble
            snapshot={active.snapshot}
            deviceCode={active.deviceCode}
            onClose={() => setActive(null)}
          />
        </div>,
        document.body,
      )}
    </>
  );
}
