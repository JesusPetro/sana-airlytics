interface AqiLevel {
  id: string;
  minValue: number;
  color: string;
  labelKey: string;
}

type AqiThresholds = Record<string, AqiLevel[]>;

const THRESHOLDS: AqiThresholds = {
  pm2_5: [
    { id: 'good',      minValue: 0,     color: 'var(--color-aqi-good)',      labelKey: 'aqiLevel.good' },
    { id: 'moderate',  minValue: 12.1,  color: 'var(--color-aqi-moderate)',  labelKey: 'aqiLevel.moderate' },
    { id: 'elevated',  minValue: 35.5,  color: 'var(--color-aqi-elevated)',  labelKey: 'aqiLevel.elevated' },
    { id: 'unhealthy', minValue: 55.5,  color: 'var(--color-aqi-unhealthy)', labelKey: 'aqiLevel.unhealthy' },
    { id: 'critical',  minValue: 150.5, color: 'var(--color-aqi-critical)',  labelKey: 'aqiLevel.critical' },
    { id: 'hazardous', minValue: 250.5, color: 'var(--color-aqi-hazardous)', labelKey: 'aqiLevel.hazardous' },
  ],
  pm10: [
    { id: 'good',      minValue: 0,   color: 'var(--color-aqi-good)',      labelKey: 'aqiLevel.good' },
    { id: 'moderate',  minValue: 55,  color: 'var(--color-aqi-moderate)',  labelKey: 'aqiLevel.moderate' },
    { id: 'elevated',  minValue: 155, color: 'var(--color-aqi-elevated)',  labelKey: 'aqiLevel.elevated' },
    { id: 'unhealthy', minValue: 255, color: 'var(--color-aqi-unhealthy)', labelKey: 'aqiLevel.unhealthy' },
    { id: 'critical',  minValue: 355, color: 'var(--color-aqi-critical)',  labelKey: 'aqiLevel.critical' },
    { id: 'hazardous', minValue: 425, color: 'var(--color-aqi-hazardous)', labelKey: 'aqiLevel.hazardous' },
  ],
  co2: [
    { id: 'good',      minValue: 350,  color: 'var(--color-aqi-good)',      labelKey: 'aqiLevel.good' },
    { id: 'moderate',  minValue: 801,  color: 'var(--color-aqi-moderate)',  labelKey: 'aqiLevel.moderate' },
    { id: 'elevated',  minValue: 1001, color: 'var(--color-aqi-elevated)',  labelKey: 'aqiLevel.elevated' },
    { id: 'unhealthy', minValue: 1501, color: 'var(--color-aqi-unhealthy)', labelKey: 'aqiLevel.unhealthy' },
    { id: 'critical',  minValue: 2500, color: 'var(--color-aqi-critical)',  labelKey: 'aqiLevel.critical' },
  ],
  voc_index: [
    { id: 'good',      minValue: 1,   color: 'var(--color-aqi-good)',      labelKey: 'aqiLevel.good' },
    { id: 'moderate',  minValue: 151, color: 'var(--color-aqi-moderate)',  labelKey: 'aqiLevel.moderate' },
    { id: 'elevated',  minValue: 251, color: 'var(--color-aqi-elevated)',  labelKey: 'aqiLevel.elevated' },
    { id: 'unhealthy', minValue: 351, color: 'var(--color-aqi-unhealthy)', labelKey: 'aqiLevel.unhealthy' },
  ],
  nox_index: [
    { id: 'good',      minValue: 1,   color: 'var(--color-aqi-good)',      labelKey: 'aqiLevel.good' },
    { id: 'moderate',  minValue: 21,  color: 'var(--color-aqi-moderate)',  labelKey: 'aqiLevel.moderate' },
    { id: 'elevated',  minValue: 51,  color: 'var(--color-aqi-elevated)',  labelKey: 'aqiLevel.elevated' },
    { id: 'unhealthy', minValue: 101, color: 'var(--color-aqi-unhealthy)', labelKey: 'aqiLevel.unhealthy' },
    { id: 'critical',  minValue: 201, color: 'var(--color-aqi-critical)',  labelKey: 'aqiLevel.critical' },
  ],
};

export function levelFromValue(
  code: string,
  value: number,
): AqiLevel | null {
  const levels = THRESHOLDS[code];
  if (!levels) return null;

  let match = levels[0];
  for (const level of levels) {
    if (value >= level.minValue) match = level;
  }
  return match;
}

export function colorFromLevel(levelId: string): string {
  const map: Record<string, string> = {
    good:      'var(--color-aqi-good)',
    moderate:  'var(--color-aqi-moderate)',
    elevated:  'var(--color-aqi-elevated)',
    unhealthy: 'var(--color-aqi-unhealthy)',
    critical:  'var(--color-aqi-critical)',
    hazardous: 'var(--color-aqi-hazardous)',
  };
  return map[levelId] ?? 'var(--color-text-secondary)';
}
