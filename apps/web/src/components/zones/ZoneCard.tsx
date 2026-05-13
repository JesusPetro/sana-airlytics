'use client';

import type React from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ZoneResponse } from '@/types/analytics';

interface ZoneCardProps {
  zone: ZoneResponse;
  selected: boolean;
  canEdit: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export function ZoneCard({ zone, selected, canEdit, onSelect, onDelete }: ZoneCardProps) {
  const t = useTranslations('zones');

  const cardStyle: React.CSSProperties = {
    borderRadius: '8px',
    border: `1px solid ${selected ? 'var(--color-accent)' : 'var(--color-border)'}`,
    background: selected ? 'var(--color-surface-hover)' : 'var(--color-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    gap: '8px',
    cursor: 'pointer',
    transition: 'border-color 150ms ease, background 150ms ease',
  };

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete();
  }

  return (
    <div style={cardStyle} onClick={onSelect}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px', fontWeight: 600,
          color: 'var(--color-text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {zone.name}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>
          {zone.radius_m} m
        </div>
      </div>

      {canEdit && (
        <button
          onClick={handleDelete}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--color-text-secondary)', padding: '2px',
            display: 'flex', flexShrink: 0,
          }}
          title={t('deleteConfirm')}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
