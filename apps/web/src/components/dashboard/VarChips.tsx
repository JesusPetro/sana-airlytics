'use client';

import { useTranslations } from 'next-intl';
import type { TSVar } from '@/lib/constants';

interface Props {
  vars: TSVar[];
  selected: string[];
  onChange: (codes: string[]) => void;
  max?: number;
}

export function VarChips({ vars, selected, onChange, max = 3 }: Props) {
  const t = useTranslations();

  function toggle(code: string) {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
    } else if (selected.length < max) {
      onChange([...selected, code]);
    }
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
      {vars.map((v) => {
        const active = selected.includes(v.code);
        const disabled = !active && selected.length >= max;
        return (
          <button
            key={v.code}
            onClick={() => toggle(v.code)}
            disabled={disabled}
            style={{
              padding:       '4px 10px',
              borderRadius:  '999px',
              fontSize:      '12px',
              fontWeight:    500,
              cursor:        disabled ? 'not-allowed' : 'pointer',
              border:        `1.5px solid ${active ? v.color : 'var(--color-border)'}`,
              background:    active ? v.color + '22' : 'transparent',
              color:         active ? v.color : 'var(--color-text-secondary)',
              opacity:       disabled ? 0.4 : 1,
              transition:    'all 150ms ease',
            }}
          >
            {t(v.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
