'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

const PARAMS = [
  'PM2.5', 'PM10', 'PM1', 'PM4', 'CO₂', 'VOC', 'NOx', 'Temp', 'RH%',
];

export function ParamChips() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chips = containerRef.current?.querySelectorAll('.param-chip');
    if (!chips?.length) return;

    gsap.fromTo(
      chips,
      { opacity: 0, y: 8 },
      {
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: 'power2.out',
        stagger: 0.07,
        delay: 0.5,
      },
    );
  }, []);

  return (
    <div ref={containerRef} className="flex flex-wrap gap-2">
      {PARAMS.map((p) => (
        <span
          key={p}
          className="param-chip font-mono text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff',
            opacity: 0,
          }}
        >
          {p}
        </span>
      ))}
    </div>
  );
}
