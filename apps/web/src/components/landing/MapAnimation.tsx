'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';

// GeoJSON was [lng, lat] — converted here to Leaflet [lat, lng]
const ROUTE_1_COORDS: [number, number][] = [
  [10.412765, -75.538933],  // 0 — Sensor A: UTB Manga
  [10.421101, -75.548356],  // 1
  [10.421943, -75.547805],  // 2
  [10.422515, -75.549029],  // 3 — Sensor B: Torre del Reloj
  [10.418393, -75.552058],  // 4
  [10.414180, -75.550284],  // 5
  [10.407800, -75.551018],  // 6
  [10.402685, -75.555607],  // 7 — Sensor C: Bocagrande
];

const ROUTE_2_COORDS: [number, number][] = [
  [10.393206, -75.483222],  // 0
  [10.388346, -75.502973],  // 1
  [10.396047, -75.504712],  // 2
  [10.400171, -75.500839],  // 3
  [10.405030, -75.507591],  // 4
];

const ROUTE_3_COORDS: [number, number][] = [
  [10.410609, -75.522562],  // 0
  [10.416520, -75.519600],  // 1
  [10.429224, -75.519524],  // 2
  [10.429229, -75.516472],  // 3
  [10.436839, -75.515154],  // 4
  [10.437808, -75.525115],  // 5
  [10.441778, -75.525525],  // 6
];

const CENTER: [number, number] = [10.415, -75.521];
const DRAW_SPEED  = 80;   // px / second
const LOOP_PAUSE  = 2.5;  // seconds to hold at end before restarting

const TOOLTIP_PM25_HTML = `
  <div style="font-size:9px;font-family:var(--font-mono);color:var(--color-text-secondary);margin-bottom:5px;letter-spacing:.04em">PM2.5</div>
  <div class="skel-bar" style="height:8px;width:100%;border-radius:4px;margin-bottom:4px;background:var(--color-surface-2);animation:skelPulse 1.4s ease-in-out infinite"></div>
  <div class="skel-bar" style="height:6px;width:65%;border-radius:3px;background:var(--color-surface-2);animation:skelPulse 1.4s ease-in-out .25s infinite"></div>
`;

const TOOLTIP_NO2_HTML = `
  <div style="font-size:9px;font-family:var(--font-mono);color:var(--color-text-secondary);margin-bottom:5px;letter-spacing:.04em">NO₂</div>
  <div class="skel-bar" style="height:8px;width:100%;border-radius:4px;margin-bottom:4px;background:var(--color-surface-2);animation:skelPulse 1.4s ease-in-out infinite"></div>
  <div class="skel-bar" style="height:6px;width:65%;border-radius:3px;background:var(--color-surface-2);animation:skelPulse 1.4s ease-in-out .25s infinite"></div>
`;

export function MapAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let mapInstance: import('leaflet').Map | null = null;
    let destroyed = false;
    let observer: MutationObserver | null = null;

    let currentTl:      gsap.core.Timeline | null = null;
    const pulseTweens:  gsap.core.Tween[]         = [];
    let delayedRestart: gsap.core.Tween    | null = null;
    const fadeTweens:   gsap.core.Tween[]         = [];

    (async () => {
      const L = (await import('leaflet')).default;
      if (destroyed) return;

      /* ── Map ──────────────────────────────────────── */
      mapInstance = L.map(el, {
        center: CENTER,
        zoom: 13,
        zoomControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        keyboard: false,
        attributionControl: false,
      });
      const map = mapInstance;

      /* ── Tiles ────────────────────────────────────── */
      const TILE_LIGHT = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
      const TILE_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

      let tileLayer = L.tileLayer(
        document.documentElement.classList.contains('dark') ? TILE_DARK : TILE_LIGHT,
        { maxZoom: 19 },
      ).addTo(map);

      observer = new MutationObserver(() => {
        const dark = document.documentElement.classList.contains('dark');
        tileLayer.remove();
        tileLayer = L.tileLayer(dark ? TILE_DARK : TILE_LIGHT, { maxZoom: 19 }).addTo(map);
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

      /* ── Icon factory ─────────────────────────────── */
      const makeIcon = () =>
        L.divIcon({
          className: '',
          iconSize:   [60, 60],
          iconAnchor: [30, 30],
          html: `<div class="sensor-marker" style="width:60px;height:60px;position:relative;opacity:0;">
            <div class="sensor-ring sensor-ring--outer"></div>
            <div class="sensor-ring sensor-ring--inner"></div>
            <div class="sensor-dot"></div>
          </div>`,
        });

      /* ── SVG overlay ──────────────────────────────── */
      const svgWrap = document.createElement('div');
      svgWrap.style.cssText =
        'position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:400';
      el.appendChild(svgWrap);

      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.cssText = 'width:100%;height:100%;';
      svgWrap.appendChild(svg);

      /* ── SVG path factory ─────────────────────────── */
      const makeSvgPath = (stroke: string) => {
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        p.setAttribute('fill',             'none');
        p.setAttribute('stroke',           stroke);
        p.setAttribute('stroke-width',     '2.5');
        p.setAttribute('stroke-dasharray', '10 6');
        p.setAttribute('stroke-linecap',   'round');
        p.style.opacity = '0.9';
        svg.appendChild(p);
        return p;
      };

      const routePath1 = makeSvgPath('#155DFC');  // blue
      const routePath2 = makeSvgPath('#0EA875');  // teal
      const routePath3 = makeSvgPath('#F59E0B');  // amber

      /* ── Build SVG d-string from coords ───────────── */
      const toSvgStr = (coords: [number, number][]) => {
        const pts = coords.map(([lat, lng]) => {
          const p = map.latLngToContainerPoint(L.latLng(lat, lng));
          return `${p.x},${p.y}`;
        });
        return `M ${pts.join(' L ')}`;
      };

      const updateAllPaths = () => {
        routePath1.setAttribute('d', toSvgStr(ROUTE_1_COORDS));
        routePath2.setAttribute('d', toSvgStr(ROUTE_2_COORDS));
        routePath3.setAttribute('d', toSvgStr(ROUTE_3_COORDS));
      };

      /* ── Sensor markers ───────────────────────────── */
      const makeMarkers = (coords: [number, number][], indices: readonly number[]) => {
        const elems: (HTMLElement | null)[] = [];
        const ms: import('leaflet').Marker[] = [];
        for (const idx of indices) {
          const m = L.marker(coords[idx], { icon: makeIcon() }).addTo(map);
          ms.push(m);
          elems.push((m.getElement()?.querySelector('.sensor-marker') as HTMLElement | null) ?? null);
        }
        return { elems, ms };
      };

      const { elems: sElems1, ms: markers1 } = makeMarkers(ROUTE_1_COORDS, [0, 3, 7]);
      const { elems: sElems2 }               = makeMarkers(ROUTE_2_COORDS, [0, 2, 4]);
      const { elems: sElems3, ms: markers3 } = makeMarkers(ROUTE_3_COORDS, [0, 3, 6]);

      /* ── Tooltips ─────────────────────────────────── */
      markers1[1].bindTooltip(TOOLTIP_PM25_HTML, {
        permanent: true, direction: 'right', offset: [16, -10], className: 'sensor-popup',
      });
      markers1[1].openTooltip();
      const tooltipPM25El = markers1[1].getTooltip()?.getElement() ?? null;
      if (tooltipPM25El) gsap.set(tooltipPM25El, { opacity: 0 });

      markers3[2].bindTooltip(TOOLTIP_NO2_HTML, {
        permanent: true, direction: 'right', offset: [16, -10], className: 'sensor-popup',
      });
      markers3[2].openTooltip();
      const tooltipNO2El = markers3[2].getTooltip()?.getElement() ?? null;
      if (tooltipNO2El) gsap.set(tooltipNO2El, { opacity: 0 });

      /* ── Wait for first tiles ─────────────────────── */
      await new Promise<void>(resolve => {
        map.once('load', () => resolve());
        setTimeout(resolve, 1200);
      });
      if (destroyed) return;

      updateAllPaths();
      map.on('resize', updateAllPaths);

      /* ── Pixel segment lengths for timing ─────────── */
      const toPx = (coords: [number, number][]) =>
        coords.map(([lat, lng]) => map.latLngToContainerPoint(L.latLng(lat, lng)));

      const cumDist = (px: { x: number; y: number }[], upTo: number) => {
        let d = 0;
        for (let i = 0; i < upTo; i++)
          d += Math.hypot(px[i + 1].x - px[i].x, px[i + 1].y - px[i].y);
        return d;
      };

      const totalLen1 = routePath1.getTotalLength();
      const totalLen2 = routePath2.getTotalLength();
      const totalLen3 = routePath3.getTotalLength();

      const drawDur1 = totalLen1 / DRAW_SPEED;
      const drawDur2 = totalLen2 / DRAW_SPEED;
      const drawDur3 = totalLen3 / DRAW_SPEED;

      const px1 = toPx(ROUTE_1_COORDS);
      const px2 = toPx(ROUTE_2_COORDS);
      const px3 = toPx(ROUTE_3_COORDS);

      // Route 1: sensors at coord indices 0, 3, 7
      const tR1_B = 0.6 + cumDist(px1, 3) / DRAW_SPEED;
      const tR1_C = 0.6 + cumDist(px1, 7) / DRAW_SPEED;

      // Route 2: sensors at coord indices 0, 2, 4 — starts 0.5s after route 1
      const R2 = 0.5;
      const tR2_mid = R2 + 0.6 + cumDist(px2, 2) / DRAW_SPEED;
      const tR2_end = R2 + 0.6 + cumDist(px2, 4) / DRAW_SPEED;

      // Route 3: sensors at coord indices 0, 3, 6 — starts 1.0s after route 1
      const R3 = 1.0;
      const tR3_mid = R3 + 0.6 + cumDist(px3, 3) / DRAW_SPEED;
      const tR3_end = R3 + 0.6 + cumDist(px3, 6) / DRAW_SPEED;

      const allSensorEls = [...sElems1, ...sElems2, ...sElems3];

      /* ── Reset all state before each loop iteration ── */
      function resetState() {
        pulseTweens.forEach(t => t.kill());
        pulseTweens.length = 0;
        fadeTweens.forEach(t => t.kill());
        fadeTweens.length = 0;

        for (const inner of allSensorEls) {
          if (!inner) continue;
          gsap.set(inner, { opacity: 0, scale: 1 });
          const ring = inner.querySelector('.sensor-ring--outer') as HTMLElement | null;
          if (ring) gsap.set(ring, { opacity: 0.7, scale: 1 });
        }

        if (tooltipPM25El) gsap.set(tooltipPM25El, { opacity: 0 });
        if (tooltipNO2El)  gsap.set(tooltipNO2El,  { opacity: 0 });

        for (const [path, len] of [
          [routePath1, totalLen1],
          [routePath2, totalLen2],
          [routePath3, totalLen3],
        ] as [SVGPathElement, number][]) {
          path.style.strokeDasharray  = `${len}`;
          path.style.strokeDashoffset = `${len}`;
        }
      }

      /* ── Per-sensor reveal ────────────────────────── */
      function showSensor(inner: HTMLElement | null, pulse: boolean, tipEl: HTMLElement | null = null) {
        if (!inner) return;
        fadeTweens.push(
          gsap.to(inner, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(2)', transformOrigin: 'center center' }),
        );
        if (pulse) {
          const ring = inner.querySelector('.sensor-ring--outer') as HTMLElement | null;
          if (ring) {
            ring.style.transformOrigin = 'center center';
            pulseTweens.push(
              gsap.fromTo(ring,
                { opacity: 0.7, scale: 1 },
                { opacity: 0, scale: 2.8, duration: 1.5, ease: 'power2.out', repeat: -1, repeatDelay: 0.8 },
              ),
            );
          }
          if (tipEl) {
            fadeTweens.push(
              gsap.to(tipEl, { opacity: 1, duration: 0.35, delay: 0.25, ease: 'power2.out' }),
            );
          }
        }
      }

      /* ── Main loop ────────────────────────────────── */
      function playSequence() {
        if (destroyed) return;
        resetState();

        currentTl = gsap.timeline({
          delay: 0.3,
          onComplete: () => {
            delayedRestart = gsap.delayedCall(LOOP_PAUSE, playSequence);
          },
        });

        // Route 1
        currentTl
          .call(() => showSensor(sElems1[0], false), undefined, 0)
          .to(routePath1, { strokeDashoffset: 0, duration: drawDur1, ease: 'none' }, 0.6)
          .call(() => showSensor(sElems1[1], true, tooltipPM25El), undefined, tR1_B)
          .call(() => showSensor(sElems1[2], false), undefined, tR1_C)

        // Route 2 (staggered +0.5s)
          .call(() => showSensor(sElems2[0], false), undefined, R2)
          .to(routePath2, { strokeDashoffset: 0, duration: drawDur2, ease: 'none' }, R2 + 0.6)
          .call(() => showSensor(sElems2[1], false), undefined, tR2_mid)
          .call(() => showSensor(sElems2[2], false), undefined, tR2_end)

        // Route 3 (staggered +1.0s)
          .call(() => showSensor(sElems3[0], false), undefined, R3)
          .to(routePath3, { strokeDashoffset: 0, duration: drawDur3, ease: 'none' }, R3 + 0.6)
          .call(() => showSensor(sElems3[1], false), undefined, tR3_mid)
          .call(() => showSensor(sElems3[2], true, tooltipNO2El), undefined, tR3_end);
      }

      playSequence();
    })();

    return () => {
      destroyed = true;
      currentTl?.kill();
      pulseTweens.forEach(t => t.kill());
      delayedRestart?.kill();
      fadeTweens.forEach(t => t.kill());
      observer?.disconnect();
      mapInstance?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{ width: '100%', height: '100%' }}
    />
  );
}
