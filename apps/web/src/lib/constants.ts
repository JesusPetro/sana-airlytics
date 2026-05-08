export interface KpiSpecThresh {
  code: string;
  labelKey: string;
  unit: string;
  softMax: number;
}

export interface KpiSpecNoThresh {
  code: string;
  labelKey: string;
  unit: string;
  softMin: number;
  softMax: number;
}

export interface TSVar {
  code: string;
  labelKey: string;
  unit: string;
  color: string;
}

export const KPI_SPECS_THRESH: KpiSpecThresh[] = [
  { code: 'pm2_5',     labelKey: 'kpi.pm2_5',     unit: 'µg/m³', softMax: 250 },
  { code: 'pm10',      labelKey: 'kpi.pm10',      unit: 'µg/m³', softMax: 430 },
  { code: 'co2',       labelKey: 'kpi.co2',       unit: 'ppm',   softMax: 3000 },
  { code: 'voc_index', labelKey: 'kpi.voc_index', unit: '',      softMax: 500 },
  { code: 'nox_index', labelKey: 'kpi.nox_index', unit: '',      softMax: 300 },
];

export const KPI_SPECS_NOTHRESH: KpiSpecNoThresh[] = [
  { code: 'pm1',         labelKey: 'kpi.pm1',         unit: 'µg/m³', softMin: 0,  softMax: 500 },
  { code: 'pm4',         labelKey: 'kpi.pm4',         unit: 'µg/m³', softMin: 0,  softMax: 500 },
  { code: 'temperature', labelKey: 'kpi.temperature', unit: '°C',    softMin: 10, softMax: 45  },
  { code: 'humidity',    labelKey: 'kpi.humidity',    unit: '%',     softMin: 30, softMax: 85  },
];

export const TS_VARS: TSVar[] = [
  { code: 'pm2_5',       labelKey: 'kpi.pm2_5',       unit: 'µg/m³', color: '#f97316' },
  { code: 'pm10',        labelKey: 'kpi.pm10',         unit: 'µg/m³', color: '#ef4444' },
  { code: 'co2',         labelKey: 'kpi.co2',          unit: 'ppm',   color: '#8b5cf6' },
  { code: 'voc_index',   labelKey: 'kpi.voc_index',    unit: '',      color: '#06b6d4' },
  { code: 'nox_index',   labelKey: 'kpi.nox_index',    unit: '',      color: '#ec4899' },
  { code: 'pm1',         labelKey: 'kpi.pm1',          unit: 'µg/m³', color: '#f59e0b' },
  { code: 'pm4',         labelKey: 'kpi.pm4',          unit: 'µg/m³', color: '#84cc16' },
  { code: 'temperature', labelKey: 'kpi.temperature',  unit: '°C',    color: '#3b82f6' },
  { code: 'humidity',    labelKey: 'kpi.humidity',     unit: '%',     color: '#10b981' },
];
