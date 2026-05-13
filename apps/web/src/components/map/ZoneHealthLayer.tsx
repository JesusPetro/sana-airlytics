'use client';

import { Circle } from 'react-leaflet';
import { useZoneHealth } from '@/hooks/useZoneHealth';
import { VERDICT_COLOR } from '@/components/zones/ZoneVerdictBadge';
import type { ZoneResponse } from '@/types/analytics';

function verdictForContaminant(
  variables: { property_code: string; verdict: string }[],
  contaminant: string,
): string {
  const code = contaminant.toUpperCase();
  return variables.find((v) => v.property_code.toUpperCase() === code)?.verdict ?? 'unknown';
}

interface ZoneHealthCircleProps {
  zone: ZoneResponse;
  fromDt: string;
  toDt: string;
  contaminant: string;
}

function ZoneHealthCircle({ zone, fromDt, toDt, contaminant }: ZoneHealthCircleProps) {
  const { data: health } = useZoneHealth(zone.zone_id, fromDt, toDt);
  const verdict = health
    ? verdictForContaminant(health.variables, contaminant)
    : 'unknown';
  const color = VERDICT_COLOR[verdict] ?? VERDICT_COLOR.unknown;

  const center: [number, number] = [zone.center_lat, zone.center_lon];

  return (
    <>
      {/* Fill difuminado */}
      <Circle
        center={center}
        radius={zone.radius_m}
        pathOptions={{
          weight:      0,
          fillColor:   color,
          fillOpacity: 0.35,
          className:   'zone-heatmap-fill',
        }}
      />
      {/* Borde discontinuo */}
      <Circle
        center={center}
        radius={zone.radius_m}
        pathOptions={{
          color,
          weight:      1.5,
          dashArray:   '8 6',
          fillOpacity: 0,
        }}
      />
    </>
  );
}

interface ZoneHealthLayerProps {
  zones: ZoneResponse[];
  fromDt: string;
  toDt: string;
  contaminant: string;
}

export function ZoneHealthLayer({ zones, fromDt, toDt, contaminant }: ZoneHealthLayerProps) {
  return (
    <>
      {zones.map((z) => (
        <ZoneHealthCircle
          key={z.zone_id}
          zone={z}
          fromDt={fromDt}
          toDt={toDt}
          contaminant={contaminant}
        />
      ))}
    </>
  );
}
