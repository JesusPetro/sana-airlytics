'use client';

import type React from 'react';
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useZones, useCreateZone, useDeleteZone } from '@/hooks/useZones';
import { isEditorOrAbove } from '@/lib/roles';
import { ZoneCard } from './ZoneCard';
import { CreateZoneForm } from './CreateZoneForm';
import { ZoneMap } from './ZoneMap';
import type { ZoneResponse } from '@/types/analytics';

type PanelMode = 'list' | 'creating';

export function ZonesPage() {
  const t       = useTranslations('zones');
  const tCommon = useTranslations('common');
  const { activeWorkspace, isLoading: wsLoading } = useWorkspace();
  const wsId = activeWorkspace?.workspace_id;

  const { data: zones = [], isLoading } = useZones(wsId);
  const createMutation = useCreateZone(wsId ?? '');
  const deleteMutation = useDeleteZone(wsId ?? '');

  const canEdit = isEditorOrAbove(activeWorkspace);

  const [panelMode, setPanelMode]           = useState<PanelMode>('list');
  const [drawMode, setDrawMode]             = useState(false);
  const [pendingCenter, setPendingCenter]   = useState<[number, number] | null>(null);
  const [pendingRadius, setPendingRadius]   = useState(500);
  const [selectedZone, setSelectedZone]     = useState<ZoneResponse | null>(null);

  function startDraw() {
    setPanelMode('list');
    setDrawMode(true);
    setPendingCenter(null);
    setSelectedZone(null);
  }

  function cancelDraw() {
    setDrawMode(false);
    setPendingCenter(null);
    setPanelMode('list');
  }

  function handleMapPick(lat: number, lng: number) {
    setDrawMode(false);
    setPendingCenter([lat, lng]);
    setPanelMode('creating');
  }

  async function handleCreateConfirm(name: string, radius: number) {
    if (!wsId || !pendingCenter) return;
    await createMutation.mutateAsync({
      name,
      center_lat: pendingCenter[0],
      center_lon: pendingCenter[1],
      radius_m:   radius,
    });
    setPendingCenter(null);
    setPanelMode('list');
  }

  function cancelCreate() {
    setPendingCenter(null);
    setPanelMode('list');
  }

  async function handleDelete(zone: ZoneResponse) {
    if (!wsId) return;
    await deleteMutation.mutateAsync(zone.zone_id);
    if (selectedZone?.zone_id === zone.zone_id) setSelectedZone(null);
  }

  if (wsLoading) return null;

  const pageStyle: React.CSSProperties = {
    display:  'flex',
    height:   '100%',
    overflow: 'hidden',
  };

  const panelStyle: React.CSSProperties = {
    width:       '300px',
    flexShrink:  0,
    borderLeft:  '1px solid var(--color-border)',
    display:     'flex',
    flexDirection: 'column',
    background:  'var(--color-bg)',
    overflow:    'hidden',
  };

  const panelHeaderStyle: React.CSSProperties = {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '16px',
    borderBottom:   '1px solid var(--color-border)',
    flexShrink:     0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize:   '14px',
    fontWeight: 700,
    color:      'var(--color-text-primary)',
  };

  const cancelBtnStyle: React.CSSProperties = {
    display:      'flex',
    alignItems:   'center',
    gap:          '4px',
    padding:      '5px 10px',
    borderRadius: '6px',
    border:       '1px solid var(--color-border)',
    background:   'transparent',
    color:        'var(--color-text-secondary)',
    fontSize:     '12px',
    cursor:       'pointer',
  };

  const listStyle: React.CSSProperties = {
    flex:       1,
    overflowY:  'auto',
    padding:    '12px',
    display:    'flex',
    flexDirection: 'column',
    gap:        '8px',
  };

  const emptyStyle: React.CSSProperties = {
    flex:           1,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '8px',
    padding:        '32px 16px',
    textAlign:      'center',
  };

  return (
    <div style={pageStyle}>
      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ZoneMap
          zones={zones}
          selectedZone={selectedZone}
          drawMode={drawMode}
          drawModeHint={t('drawModeHint')}
          pendingCenter={pendingCenter}
          pendingRadius={pendingRadius}
          onPick={handleMapPick}
        />
      </div>

      {/* Right panel */}
      <div style={panelStyle}>
        <div style={panelHeaderStyle}>
          <span style={titleStyle}>{t('title')}</span>
          {canEdit && panelMode === 'list' && !drawMode && (
            <button
              onClick={startDraw}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '5px 10px', borderRadius: '6px', border: 'none',
                background: 'var(--color-accent)', color: '#fff',
                fontSize: '12px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Plus size={13} />
              {t('newZone')}
            </button>
          )}
          {(drawMode || panelMode === 'creating') && (
            <button style={cancelBtnStyle} onClick={cancelDraw}>
              <X size={13} />
              {t('drawModeCancel')}
            </button>
          )}
        </div>

        {panelMode === 'creating' && pendingCenter ? (
          <CreateZoneForm
            lat={pendingCenter[0]}
            lon={pendingCenter[1]}
            onRadiusChange={setPendingRadius}
            onConfirm={handleCreateConfirm}
            onCancel={cancelCreate}
            isLoading={createMutation.isPending}
          />
        ) : (
          <>
            {drawMode && (
              <div style={{
                padding:    '10px 16px',
                fontSize:   '12px',
                color:      'var(--color-accent)',
                background: 'var(--color-surface-subtle)',
                borderBottom: '1px solid var(--color-border-subtle)',
              }}>
                {t('drawModeHint')}
              </div>
            )}

            {isLoading ? (
              <div style={{ ...emptyStyle }}>
                <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                  {tCommon('loading')}
                </span>
              </div>
            ) : zones.length === 0 ? (
              <div style={emptyStyle}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  {t('noZones')}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                  {t('noZonesHint')}
                </span>
              </div>
            ) : (
              <div style={listStyle}>
                {zones.map((zone) => (
                  <ZoneCard
                    key={zone.zone_id}
                    zone={zone}
                    selected={selectedZone?.zone_id === zone.zone_id}
                    canEdit={canEdit}
                    onSelect={() => setSelectedZone(zone)}
                    onDelete={() => handleDelete(zone)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
