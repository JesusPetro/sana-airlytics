'use client';

import type React from 'react';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents, useMap } from 'react-leaflet';
import { MapAutoResize } from '@/components/map/MapAutoResize';
import { useDarkMode } from '@/hooks/useDarkMode';
import type { ZoneResponse } from '@/types/analytics';
import 'leaflet/dist/leaflet.css';

const CARTAGENA: [number, number] = [10.391, -75.479];
const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

interface DrawCaptureProps {
  onPick: (lat: number, lng: number) => void;
}

function DrawCapture({ onPick }: DrawCaptureProps) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface FlyToProps {
  zone: ZoneResponse | null;
}

function FlyTo({ zone }: FlyToProps) {
  const map = useMap();
  useEffect(() => {
    if (zone) {
      map.flyTo([zone.center_lat, zone.center_lon], 15, { duration: 0.8 });
    }
  }, [zone, map]);
  return null;
}

interface ZoneCircleProps {
  zone: ZoneResponse;
}

function ZoneCircle({ zone }: ZoneCircleProps) {
  return (
    <Circle
      center={[zone.center_lat, zone.center_lon]}
      radius={zone.radius_m}
      pathOptions={{
        color:       'var(--color-accent, #4F39F6)',
        fillColor:   'var(--color-accent, #4F39F6)',
        fillOpacity: 0.08,
        weight:      2,
      }}
    />
  );
}

interface ZoneMapProps {
  zones: ZoneResponse[];
  selectedZone: ZoneResponse | null;
  drawMode: boolean;
  drawModeHint: string;
  pendingCenter: [number, number] | null;
  pendingRadius: number;
  onPick: (lat: number, lng: number) => void;
}

export function ZoneMap({
  zones,
  selectedZone,
  drawMode,
  drawModeHint,
  pendingCenter,
  pendingRadius,
  onPick,
}: ZoneMapProps) {
  const isDark = useDarkMode();

  const wrapperStyle: React.CSSProperties = {
    width:    '100%',
    height:   '100%',
    position: 'relative',
    cursor:   drawMode ? 'crosshair' : 'default',
  };

  const bannerStyle: React.CSSProperties = {
    position:   'absolute',
    top:        '12px',
    left:       '50%',
    transform:  'translateX(-50%)',
    zIndex:     1000,
    background: 'var(--color-surface)',
    border:     '1px solid var(--color-accent)',
    borderRadius: '9999px',
    padding:    '6px 16px',
    fontSize:   '13px',
    fontWeight: 500,
    color:      'var(--color-accent)',
    boxShadow:  'var(--shadow-md)',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
  };

  const center: [number, number] = selectedZone
    ? [selectedZone.center_lat, selectedZone.center_lon]
    : CARTAGENA;

  return (
    <div style={wrapperStyle}>
      {drawMode && (
        <div style={bannerStyle}>
          {drawModeHint}
        </div>
      )}

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
            : '&copy; <a href="https://carto.com/">CARTO</a>'}
        />

        <FlyTo zone={selectedZone} />

        {drawMode && <DrawCapture onPick={onPick} />}

        {zones.map((z) => (
          <ZoneCircle key={z.zone_id} zone={z} />
        ))}

        {pendingCenter && (
          <Circle
            center={pendingCenter}
            radius={pendingRadius}
            pathOptions={{
              color:       'var(--color-accent, #6366F1)',
              fillColor:   'var(--color-accent, #6366F1)',
              fillOpacity: 0.15,
              weight:      2,
              dashArray:   '6 4',
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
