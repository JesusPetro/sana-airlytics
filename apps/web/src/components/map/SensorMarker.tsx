'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { DeviceStatusResponse } from '@/types/sensor';
import { levelFromValue } from '@/lib/aqi';

interface SensorMarkerProps {
  device: DeviceStatusResponse;
  pm2_5?: number | null;
  onClick?: (device: DeviceStatusResponse) => void;
}

function getMarkerColor(pm2_5?: number | null): string {
  if (pm2_5 == null) return '#8B9BBC';
  const level = levelFromValue('pm2_5', pm2_5);
  return level?.color ?? '#8B9BBC';
}

function resolveCssColor(cssVar: string): string {
  if (!cssVar.startsWith('var(')) return cssVar;
  const name = cssVar.replace(/^var\(/, '').replace(/\)$/, '').trim();
  if (typeof window !== 'undefined') {
    const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return val || '#10B981';
  }
  return '#10B981';
}

export function SensorMarker({ device, pm2_5, onClick }: SensorMarkerProps) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (device.latitude == null || device.longitude == null) return;

    const rawColor = getMarkerColor(pm2_5);
    const color = resolveCssColor(rawColor);
    const isActive = device.status === 'ACTIVE';

    const pulse = isActive
      ? `<span class="sensor-pulse" style="--m-color:${color}"></span>`
      : '';

    const icon = L.divIcon({
      className: '',
      html: `
        <div class="sensor-marker-wrap" style="--m-color:${color}">
          ${pulse}
          <div class="sensor-dot-core"></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22],
    });

    const marker = L.marker([device.latitude, device.longitude], { icon });

    if (onClick) {
      marker.on('click', () => onClick(device));
    }

    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      marker.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device.device_id, device.latitude, device.longitude, device.status, pm2_5]);

  return null;
}
