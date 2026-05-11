const UNIT_MAP: Record<string, string> = {
  pm1:         'µg/m³',
  pm2_5:       'µg/m³',
  pm4:         'µg/m³',
  pm10:        'µg/m³',
  temperature: '°C',
  humidity:    '%',
  voc_index:   '',
  nox_index:   '',
  co2:         'ppm',
};

export function formatValue(code: string, value: number | null): string {
  if (value === null) return '—';
  const unit = UNIT_MAP[code] ?? '';
  const decimals = code === 'temperature' ? 1 : code === 'humidity' ? 0 : 1;
  const formatted = value.toFixed(decimals);
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day:   'numeric',
    hour:  '2-digit',
    minute:'2-digit',
  });
}

export function formatRelative(iso: string, locale: string): string {
  const now  = new Date();
  const then = new Date(iso);
  const diff    = now.getTime() - then.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);

  // Calendar-day difference (midnight boundaries), not hours/24
  const nowMidnight  = new Date(now.getFullYear(),  now.getMonth(),  now.getDate());
  const thenMidnight = new Date(then.getFullYear(), then.getMonth(), then.getDate());
  const days = Math.round((nowMidnight.getTime() - thenMidnight.getTime()) / 86_400_000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (days > 0)    return rtf.format(-days, 'day');
  if (hours > 0)   return rtf.format(-hours, 'hour');
  if (minutes > 0) return rtf.format(-minutes, 'minute');
  return rtf.format(-seconds, 'second');
}
