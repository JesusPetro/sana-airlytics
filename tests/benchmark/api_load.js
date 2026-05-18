import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

const errorRate = new Rate('errors');
const requestCount = new Counter('request_count');

export const options = {
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { scenario: 'smoke' },
    },
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '1m',  target: 20 },
        { duration: '15s', target: 0 },
      ],
      startTime: '35s',
      tags: { scenario: 'load' },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    errors:            ['rate<0.01'],
  },
};

const BASE      = 'http://nginx';
const WS_ID     = '019e3c64-67e3-71f6-a0fc-c01e35501abd';
const SENSOR_ID = '8910b1cf-1a42-4a36-81a5-fce8e824c958';
const DS_PM10   = '019e26f7-cbfa-74a0-9085-71f3be2f85e4';
const DS_TEMP   = '019e26f7-cbfa-74a0-9085-71f49353d234';

// Rango completo con datos
const FROM = '2026-05-14T14:47:00Z';
const TO   = '2026-05-14T15:54:00Z';

export function setup() {
  const res = http.post(
    `${BASE}/api/v1/auth/login`,
    JSON.stringify({ email: __ENV.K6_EMAIL, password: __ENV.K6_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } },
  );

  check(res, { 'login ok': (r) => r.status === 200 });

  if (res.status !== 200) {
    throw new Error(`Login failed: ${res.status} ${res.body}`);
  }

  return { cookie: res.cookies['sana_session'][0].value };
}

export default function (data) {
  const headers = {
    'Content-Type': 'application/json',
    Cookie: `sana_session=${data.cookie}`,
  };

  // Dashboard — todo lo que carga la vista principal
  const dashboard = http.batch([
    ['GET', `${BASE}/api/v1/workspaces`,                                                                              null, { headers, tags: { name: 'workspaces' } }],
    ['GET', `${BASE}/api/v1/workspaces/${WS_ID}/datastreams`,                                                         null, { headers, tags: { name: 'datastreams' } }],
    ['GET', `${BASE}/api/v1/workspaces/${WS_ID}/datastreams/${DS_PM10}/observations?from=${FROM}&to=${TO}`,           null, { headers, tags: { name: 'observations_pm10' } }],
    ['GET', `${BASE}/api/v1/workspaces/${WS_ID}/datastreams/${DS_TEMP}/observations?from=${FROM}&to=${TO}`,           null, { headers, tags: { name: 'observations_temp' } }],
    ['GET', `${BASE}/api/v1/workspaces/${WS_ID}/datastreams/${DS_PM10}/aggregations?from=${FROM}&to=${TO}&bucket=1h`, null, { headers, tags: { name: 'aggregations' } }],
  ]);

  // Mapa — ubicación y heatmap
  const map = http.batch([
    ['GET', `${BASE}/api/v1/sensors/${SENSOR_ID}/location`,                                                                        null, { headers, tags: { name: 'location' } }],
    ['GET', `${BASE}/api/v1/sensors/${SENSOR_ID}/snapshot`,                                                                        null, { headers, tags: { name: 'snapshot' } }],
    ['GET', `${BASE}/api/v1/workspaces/${WS_ID}/heatmap?property_code=PM10&from=${FROM}&to=${TO}`,                                 null, { headers, tags: { name: 'heatmap' } }],
  ]);

  [...dashboard, ...map].forEach((res) => {
    const ok = check(res, {
      'status 2xx':       (r) => r.status >= 200 && r.status < 300,
      'duration < 500ms': (r) => r.timings.duration < 500,
    });
    errorRate.add(!ok);
    requestCount.add(1);
  });

  sleep(1);
}
