'use client';

import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import type { DeviceStatusResponse } from '@/types/sensor';
import { levelFromValue } from '@/lib/aqi';

interface HeatPoint {
  lat: number;
  lng: number;
  value: number | null;
}

type ContaminantCode = 'pm2_5' | 'pm10' | 'co2' | 'nox_index';

interface HeatmapOverlayProps {
  devices: DeviceStatusResponse[];
  readings: Record<string, Record<string, number | null>>;
  contaminant: ContaminantCode;
}

function resolveCssColor(cssVar: string): string {
  if (!cssVar.startsWith('var(')) return cssVar;
  const name = cssVar.replace(/^var\(/, '').replace(/\)$/, '').trim();
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#10B981';
  }
  return '#10B981';
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const int = parseInt(clean, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

export function HeatmapOverlay({ devices, readings, contaminant }: HeatmapOverlayProps) {
  const map = useMap();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<L.Layer | null>(null);

  useEffect(() => {
    const points: HeatPoint[] = [];
    for (const d of devices) {
      if (d.latitude != null && d.longitude != null) {
        points.push({
          lat: d.latitude,
          lng: d.longitude,
          value: readings[d.device_id]?.[contaminant] ?? null,
        });
      }
    }

    if (points.length === 0) return;

    const RADIUS = 80;
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 600;
    const ctx = canvas.getContext('2d')!;

    const bounds = map.getBounds();
    const sw = map.latLngToContainerPoint(bounds.getSouthWest());
    const ne = map.latLngToContainerPoint(bounds.getNorthEast());
    const mapW = Math.abs(ne.x - sw.x) || 600;
    const mapH = Math.abs(sw.y - ne.y) || 600;
    canvas.width = mapW;
    canvas.height = mapH;

    ctx.clearRect(0, 0, mapW, mapH);

    for (const pt of points) {
      const px = map.latLngToContainerPoint([pt.lat, pt.lng]);
      const level = pt.value != null ? levelFromValue(contaminant, pt.value) : null;
      const rawColor = level?.color ?? 'var(--color-aqi-good)';
      const hex = resolveCssColor(rawColor);
      const [r, g, b] = hexToRgb(hex.startsWith('#') ? hex : '#10B981');

      const grad = ctx.createRadialGradient(px.x, px.y, 0, px.x, px.y, RADIUS);
      grad.addColorStop(0,   `rgba(${r},${g},${b},0.55)`);
      grad.addColorStop(0.4, `rgba(${r},${g},${b},0.3)`);
      grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);

      ctx.beginPath();
      ctx.arc(px.x, px.y, RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    canvasRef.current = canvas;

    const dataUrl = canvas.toDataURL();
    const imageOverlay = L.imageOverlay(dataUrl, bounds, { opacity: 0.7 });
    imageOverlay.addTo(map);
    overlayRef.current = imageOverlay;

    return () => {
      imageOverlay.remove();
    };
  }, [map, devices, readings, contaminant]);

  return null;
}
