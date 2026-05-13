import { useQueries } from '@tanstack/react-query';
import type { DeviceTrack } from './useDeviceTracks';
import type { TrackPoint } from '@/lib/api/devices';

export type SnappedSegment = [number, number][];

export interface SnappedDeviceTrack {
  deviceId: string;
  color: string;
  segments: SnappedSegment[];
}

export const TRACK_COLORS = [
  '#0099CC', '#E8821C', '#7C3AED', '#059669', '#DC2626',
  '#0891B2', '#D97706', '#6D28D9', '#047857', '#B91C1C',
];

const OSRM_MAX_WAYPOINTS = 100;

function sortByTime(points: TrackPoint[]): TrackPoint[] {
  return [...points].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
  );
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth()    === db.getMonth()    &&
    da.getDate()     === db.getDate()
  );
}

// Each calendar day is its own segment — points from different days don't connect.
function splitByDay(points: TrackPoint[]): TrackPoint[][] {
  if (points.length === 0) return [];
  const segments: TrackPoint[][] = [];
  let current: TrackPoint[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    if (!isSameDay(points[i - 1].recorded_at, points[i].recorded_at)) {
      segments.push(current);
      current = [];
    }
    current.push(points[i]);
  }
  segments.push(current);
  return segments;
}

function downsample<T>(arr: T[], maxLen: number): T[] {
  if (arr.length <= maxLen) return arr;
  const step = Math.ceil((arr.length - 1) / (maxLen - 1));
  const result = arr.filter((_, i) => i % step === 0);
  if (result[result.length - 1] !== arr[arr.length - 1]) result.push(arr[arr.length - 1]);
  return result;
}

// Route API — routes between waypoints following the road network. No timestamps needed.
async function routeSegment(points: TrackPoint[]): Promise<SnappedSegment> {
  const sampled = downsample(points, OSRM_MAX_WAYPOINTS);
  const coords = sampled.map((p) => `${p.longitude},${p.latitude}`).join(';');
  const url =
    `https://router.project-osrm.org/route/v1/driving/${coords}` +
    `?overview=full&geometries=geojson`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  if (data.code !== 'Ok') throw new Error(`OSRM code: ${data.code}`);

  return (data.routes[0].geometry.coordinates as [number, number][]).map(
    ([lng, lat]) => [lat, lng] as [number, number],
  );
}

async function snapToRoads(points: TrackPoint[]): Promise<SnappedSegment[]> {
  const sorted = sortByTime(points);
  const segments = splitByDay(sorted).filter((s) => s.length >= 2);
  return Promise.all(segments.map(routeSegment));
}

function rawSegments(points: TrackPoint[]): SnappedSegment[] {
  const sorted = sortByTime(points);
  return splitByDay(sorted)
    .filter((s) => s.length >= 2)
    .map((s) => s.map((p): [number, number] => [p.latitude, p.longitude]));
}

export function useSnappedTracks(tracks: DeviceTrack[], enabled: boolean): SnappedDeviceTrack[] {
  const results = useQueries({
    queries: tracks.map((t) => ({
      queryKey: ['snapped-track', t.device.device_id, t.points.length],
      queryFn: () => snapToRoads(t.points),
      enabled: enabled && t.points.length >= 2,
      staleTime: 5 * 60 * 1000,
      gcTime: 15 * 60 * 1000,
      retry: 1,
    })),
  });

  return tracks.map((t, i) => ({
    deviceId: t.device.device_id,
    color: TRACK_COLORS[i % TRACK_COLORS.length],
    segments: results[i]?.data ?? (results[i]?.isError ? rawSegments(t.points) : []),
  }));
}
