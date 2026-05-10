'use client';

import { useEffect, useRef } from 'react';
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, X } from 'lucide-react';
import type { AlertEventResponse } from '@/types/analytics';
import { getAlertEvents } from '@/lib/api/analytics';

const toastWrapStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  zIndex: 9999,
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
  padding: '14px 16px',
  maxWidth: '380px',
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: '8px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
  color: 'var(--color-text-primary)',
  fontSize: '14px',
  lineHeight: '1.4',
};

const dismissBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '0',
  color: 'inherit',
  flexShrink: 0,
  lineHeight: 1,
};

function AlertToast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const truncated = message.length > 120 ? `${message.slice(0, 120)}…` : message;
  return React.createElement(
    'div',
    { style: toastWrapStyle },
    React.createElement(AlertTriangle, {
      size: 18,
      style: { flexShrink: 0, marginTop: '1px', color: 'var(--color-warning, #f59e0b)' },
    }),
    React.createElement('span', { style: { flex: 1 } }, truncated),
    React.createElement(
      'button',
      { onClick: onDismiss, 'aria-label': 'Cerrar', style: dismissBtnStyle },
      React.createElement(X, { size: 16 }),
    ),
  );
}

export function useAlertNotifier(workspaceId: string | undefined): void {
  const lastEventIdRef = useRef<string | null>(null);
  const rootRef = useRef<Root | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const div = document.createElement('div');
    document.body.appendChild(div);
    containerRef.current = div;
    rootRef.current = createRoot(div);
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      const root      = rootRef.current;
      const container = containerRef.current;
      // Defer unmount to avoid "synchronous unmount during render" warning
      setTimeout(() => {
        root?.unmount();
        if (container && document.body.contains(container))
          document.body.removeChild(container);
      }, 0);
    };
  }, []);

  const { data } = useQuery<AlertEventResponse[]>({
    queryKey: ['alert-events', workspaceId],
    queryFn: () => getAlertEvents(workspaceId!),
    enabled: !!workspaceId,
    refetchInterval: 120_000,
    staleTime: 0,
  });

  useEffect(() => {
    if (!data?.length || !rootRef.current) return;
    const newest = data[0];

    // Primera carga: inicializar ref sin mostrar toast
    if (lastEventIdRef.current === null) {
      lastEventIdRef.current = newest.event_id;
      return;
    }

    if (newest.event_id === lastEventIdRef.current) return;
    lastEventIdRef.current = newest.event_id;

    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);

    const dismiss = () => {
      rootRef.current?.render(React.createElement(React.Fragment, null));
    };

    rootRef.current.render(
      React.createElement(AlertToast, { message: newest.message, onDismiss: dismiss }),
    );

    dismissTimerRef.current = setTimeout(dismiss, 8_000);
  }, [data]);
}
