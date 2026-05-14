'use client';

import type React from 'react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleMarker, Pane, Polyline, useMapEvents } from 'react-leaflet';
import type { LeafletMouseEvent } from 'leaflet';
import type { DeviceTrack } from '@/hooks/useDeviceTracks';
import { useSnappedTracks } from '@/hooks/useSnappedTracks';
import { getDeviceSnapshot, type Snapshot, type TrackPoint } from '@/lib/api/devices';
import { levelFromValue } from '@/lib/aqi';
import { TrackPointBubble } from './TrackPointBubble';

const DEFAULT_COLOR = '#8B9BBC';

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Agrupa puntos dentro de `threshold` metros del ancla; el representante lleva el promedio del grupo.
function deduplicateByProximity(points: TrackPoint[], threshold = 30): TrackPoint[] {
  if (points.length === 0) return [];

  function flushGroup(last: TrackPoint, sum: number, count: number): TrackPoint {
    return { ...last, contaminant_value: count > 0 ? sum / count : null };
  }

  const result: TrackPoint[] = [];
  let anchor = points[0];
  let groupLast = points[0];
  const v0 = points[0].contaminant_value ?? null;
  let groupSum = v0 ?? 0;
  let groupCount = v0 != null ? 1 : 0;

  for (let i = 1; i < points.length; i++) {
    const d = haversineMeters(anchor.latitude, anchor.longitude, points[i].latitude, points[i].longitude);
    const v = points[i].contaminant_value ?? null;
    if (d > threshold) {
      result.push(flushGroup(groupLast, groupSum, groupCount));
      anchor = points[i];
      groupSum = v ?? 0;
      groupCount = v != null ? 1 : 0;
    } else {
      if (v != null) { groupSum += v; groupCount++; }
    }
    groupLast = points[i];
  }
  result.push(flushGroup(groupLast, groupSum, groupCount));
  return result;
}


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

function getMapBounds() {
  const style = getComputedStyle(document.documentElement);
  return {
    topbarH:  parseFloat(style.getPropertyValue('--topbar-h'))          || 56,
    sidebarW: parseFloat(style.getPropertyValue('--sidebar-current-w')) || 0,
  };
}

function isInMapArea(pixelX: number, pixelY: number): boolean {
  const { topbarH, sidebarW } = getMapBounds();
  return (
    pixelY > topbarH &&
    pixelX > sidebarW &&
    pixelX < window.innerWidth &&
    pixelY < window.innerHeight
  );
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
    move: () => {
      if (isThisActive && active) {
        const p = map.latLngToContainerPoint([lat, lng]);
        const rect = map.getContainer().getBoundingClientRect();
        const px = rect.left + p.x;
        const py = rect.top  + p.y;
        if (!isInMapArea(px, py)) { onClose(); return; }
        onOpen({ ...active, pixelX: px, pixelY: py });
      }
    },
    zoomend: () => {
      if (isThisActive && active) {
        const p = map.latLngToContainerPoint([lat, lng]);
        const rect = map.getContainer().getBoundingClientRect();
        const px = rect.left + p.x;
        const py = rect.top  + p.y;
        if (!isInMapArea(px, py)) { onClose(); return; }
        onOpen({ ...active, pixelX: px, pixelY: py });
      }
    },
  });

  async function handleClick(e: LeafletMouseEvent) {
    if (isThisActive) { onClose(); return; }
    const p = map.latLngToContainerPoint([lat, lng]);
    const rect = map.getContainer().getBoundingClientRect();
    try {
      let snapshot: Snapshot;
      try {
        snapshot = await getDeviceSnapshot(deviceId, recordedAt);
      } catch {
        snapshot = await getDeviceSnapshot(deviceId);
      }
      onOpen({ deviceCode, snapshot, lat, lng, pixelX: rect.left + p.x, pixelY: rect.top + p.y });
    } catch { /* sin datos disponibles */ }
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
  trajectory?: boolean;
}

export function TrackPoints({ tracks, contaminant, trajectory }: Props) {
  const [active, setActive] = useState<ActiveBubble | null>(null);
  const filteredTracks = tracks.map(t => ({ ...t, points: deduplicateByProximity(t.points) }));
  const snapped = useSnappedTracks(filteredTracks, trajectory ?? false);

  return (
    <>
      <Pane name="trajectoryPane" style={{ zIndex: 350 }}>
        {trajectory && snapped.map(({ deviceId, color, segments }) =>
          segments.map((positions, segIdx) => (
            <Polyline
              key={`line-${deviceId}-${segIdx}`}
              positions={positions}
              pathOptions={{
                color,
                weight: 4,
                opacity: 0.85,
                dashArray: '10, 8',
                lineJoin: 'round',
                lineCap: 'round',
              }}
            />
          ))
        )}
      </Pane>

      {tracks.flatMap(({ device, points }) =>
        deduplicateByProximity(points).map((pt, i) => (
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

      {active && typeof document !== 'undefined' && (() => {
        const { topbarH, sidebarW } = getMapBounds();
        const portalLayerStyle: React.CSSProperties = {
          position: 'fixed',
          top: topbarH,
          left: sidebarW,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 30,
        };
        const bubbleAnchorStyle: React.CSSProperties = {
          position: 'absolute',
          left: active.pixelX - sidebarW,
          top: active.pixelY - topbarH,
          transform: 'translate(-50%, calc(-100% - 14px))',
          pointerEvents: 'auto',
        };
        return createPortal(
          <div style={portalLayerStyle}>
            <div style={bubbleAnchorStyle}>
              <TrackPointBubble
                snapshot={active.snapshot}
                deviceCode={active.deviceCode}
                onClose={() => setActive(null)}
              />
            </div>
          </div>,
          document.body,
        );
      })()}
    </>
  );
}
