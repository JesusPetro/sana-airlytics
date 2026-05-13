'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useDismiss,
  useInteractions,
} from '@floating-ui/react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react';

gsap.registerPlugin(useGSAP);

/* ─── Types ─────────────────────────────────────────────────────────────── */

export interface DateRangePickerProps {
  from:     string;   // YYYY-MM-DD or ''
  to:       string;   // YYYY-MM-DD or ''
  onChange: (from: string, to: string) => void;
  onClear:  () => void;
  maxDate?: string;   // YYYY-MM-DD, defaults to today
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function parseYMD(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toYMD(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function sameDay(a: Date | null, b: Date | null) {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

function isBetween(d: Date, lo: Date | null, hi: Date | null) {
  if (!lo || !hi) return false;
  const [a, b] = lo <= hi ? [lo, hi] : [hi, lo];
  return d > a && d < b;
}

// Monday-first grid; null = empty cell
function buildGrid(year: number, month: number): (Date | null)[] {
  const first  = new Date(year, month, 1);
  const last   = new Date(year, month + 1, 0);
  let offset   = first.getDay() - 1;
  if (offset < 0) offset = 6;

  const cells: (Date | null)[] = Array(offset).fill(null);
  for (let i = 1; i <= last.getDate(); i++) cells.push(new Date(year, month, i));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export function DateRangePicker({ from, to, onChange, onClear, maxDate }: DateRangePickerProps) {
  const locale = useLocale();
  const t      = useTranslations();

  const today  = new Date();
  const maxYMD = maxDate ?? toYMD(today);
  const maxD   = parseYMD(maxYMD)!;
  const isActive = !!(from || to);

  /* ── calendar state ── */
  const [isOpen,      setIsOpen]      = useState(false);
  const [viewYear,    setViewYear]    = useState(parseYMD(from)?.getFullYear() ?? today.getFullYear());
  const [viewMonth,   setViewMonth]   = useState(parseYMD(from)?.getMonth()    ?? today.getMonth());
  const [hoverDate,   setHoverDate]   = useState<Date | null>(null);
  const [pendingFrom, setPendingFrom] = useState<Date | null>(() => parseYMD(from));
  const [pendingTo,   setPendingTo]   = useState<Date | null>(() => parseYMD(to));

  /* ── refs for GSAP ── */
  const popoverRef = useRef<HTMLDivElement>(null);
  const gridRef    = useRef<HTMLDivElement>(null);
  const monthDir   = useRef(0);

  /* sync pending when props change externally */
  useEffect(() => {
    setPendingFrom(parseYMD(from));
    setPendingTo(parseYMD(to));
  }, [from, to]);

  /* ── @floating-ui setup ── */
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => { if (!open) animateClose(); },
    placement: 'bottom-start',
    middleware: [offset(8), flip({ padding: 12 }), shift({ padding: 12 })],
    whileElementsMounted: autoUpdate,
  });

  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss]);

  /* ── locale-aware labels ── */
  const weekDays = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2024, 0, 1 + i)));
  }, [locale]);

  const monthLabel = useMemo(() =>
    new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
      .format(new Date(viewYear, viewMonth, 1)),
  [locale, viewYear, viewMonth]);

  const triggerLabel = useMemo(() => {
    if (!from && !to) return null;
    const fmt  = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
    const parts = [from && fmt.format(parseYMD(from)!), to && fmt.format(parseYMD(to)!)]
      .filter(Boolean);
    return parts.join(' → ');
  }, [locale, from, to]);

  /* ── open / close ── */
  function animateOpen() {
    if (!popoverRef.current) return;
    gsap.fromTo(
      popoverRef.current,
      { opacity: 0, y: -10, scale: 0.95 },
      { opacity: 1, y: 0,   scale: 1,    duration: 0.22, ease: 'power3.out' },
    );
  }

  function animateClose() {
    if (!popoverRef.current) { setIsOpen(false); return; }
    gsap.to(popoverRef.current, {
      opacity: 0, y: -6, scale: 0.97,
      duration: 0.14, ease: 'power2.in',
      onComplete: () => setIsOpen(false),
    });
  }

  function openPicker() {
    if (parseYMD(from)) {
      setViewYear(parseYMD(from)!.getFullYear());
      setViewMonth(parseYMD(from)!.getMonth());
    }
    setIsOpen(true);
  }

  /* animate in when popover mounts */
  useGSAP(() => {
    if (isOpen) animateOpen();
  }, { dependencies: [isOpen] });

  /* month-change slide */
  useGSAP(() => {
    if (!gridRef.current || monthDir.current === 0) return;
    gsap.from(gridRef.current, {
      opacity: 0, x: monthDir.current * 28,
      duration: 0.2, ease: 'power2.out', overwrite: true,
    });
    monthDir.current = 0;
  }, { dependencies: [viewMonth, viewYear] });

  /* ── month navigation ── */
  function prevMonth() {
    monthDir.current = -1;
    setViewMonth(m => { if (m === 0)  { setViewYear(y => y - 1); return 11; } return m - 1; });
  }
  function nextMonth() {
    monthDir.current = 1;
    setViewMonth(m => { if (m === 11) { setViewYear(y => y + 1); return 0;  } return m + 1; });
  }

  const nextDisabled =
    viewYear  === maxD.getFullYear() &&
    viewMonth >= maxD.getMonth();

  /* ── day click ── */
  function handleDayClick(d: Date) {
    if (d > maxD) return;
    if (!pendingFrom || pendingTo) {
      setPendingFrom(d);
      setPendingTo(null);
    } else {
      if (d < pendingFrom) {
        setPendingFrom(d);
      } else {
        setPendingTo(d);
        onChange(toYMD(pendingFrom), toYMD(d));
        animateClose();
      }
    }
  }

  /* ── render helpers ── */
  const effectiveTo = pendingTo ?? hoverDate;
  const waitingEnd  = !!(pendingFrom && !pendingTo);
  const cells       = buildGrid(viewYear, viewMonth);

  function dayStyle(cell: Date): React.CSSProperties {
    const isEndFrom  = sameDay(cell, pendingFrom);
    const isEndTo    = sameDay(cell, pendingTo);
    const isEnd      = isEndFrom || isEndTo;
    const inRange    = isBetween(cell, pendingFrom, effectiveTo);
    const isDisabled = cell > maxD;
    const isToday    = sameDay(cell, today);

    return {
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      height:         '34px',
      borderRadius:   '8px',
      fontSize:       '12px',
      fontWeight:     isEnd ? 700 : inRange ? 500 : 400,
      cursor:         isDisabled ? 'default' : 'pointer',
      background:     isEnd
        ? 'var(--color-primary)'
        : inRange
          ? 'color-mix(in oklab, var(--color-primary) 13%, transparent)'
          : 'transparent',
      color: isDisabled
        ? 'var(--color-text-disabled)'
        : isEnd
          ? '#fff'
          : inRange
            ? 'var(--color-primary)'
            : isToday
              ? 'var(--color-primary)'
              : 'var(--color-text-primary)',
      opacity:       isDisabled ? 0.3 : 1,
      transition:    'background 100ms, color 100ms',
      outline:       isToday && !isEnd
        ? '1.5px solid color-mix(in oklab, var(--color-primary) 35%, transparent)'
        : 'none',
      outlineOffset: '-1px',
    };
  }

  const NAV_BTN: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'var(--color-text-secondary)', borderRadius: '7px', padding: '5px',
  };

  /* ── Popover ─────────────────────────────────────────────────────────── */
  const popover = isOpen && typeof window !== 'undefined'
    ? createPortal(
        <div
          ref={(el) => { popoverRef.current = el; refs.setFloating(el); }}
          style={{
            ...floatingStyles,
            zIndex:       50,
            background:   'var(--color-surface)',
            border:       '1px solid var(--color-border)',
            borderRadius: '14px',
            boxShadow:    'var(--shadow-lg)',
            padding:      '16px',
            minWidth:     '272px',
            userSelect:   'none',
          }}
          {...getFloatingProps()}
        >
          {/* Month header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }} role="group">
            <button
              onClick={prevMonth}
              style={NAV_BTN}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-subtle)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              <ChevronLeft size={15} />
            </button>
            <span style={{
              fontSize: '13px', fontWeight: 600,
              color: 'var(--color-text-primary)',
              letterSpacing: '-0.01em', textTransform: 'capitalize',
            }}>
              {monthLabel}
            </span>
            <button
              onClick={nextMonth}
              disabled={nextDisabled}
              style={{ ...NAV_BTN, opacity: nextDisabled ? 0.3 : 1, cursor: nextDisabled ? 'default' : 'pointer' }}
              onMouseEnter={e => { if (!nextDisabled) (e.currentTarget as HTMLElement).style.background = 'var(--color-surface-subtle)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none'; }}
            >
              <ChevronRight size={15} />
            </button>
          </div>

          {/* Week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '4px' }}>
            {weekDays.map((d, i) => (
              <div key={i} style={{
                textAlign: 'center', fontSize: '12px', fontWeight: 600,
                color: 'var(--color-text-disabled)', paddingBottom: '6px',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {d.slice(0, 2)}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div
            ref={gridRef}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}
          >
            {cells.map((cell, idx) => {
              if (!cell) return <div key={idx} />;
              return (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  style={dayStyle(cell)}
                  onClick={() => handleDayClick(cell)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleDayClick(cell); } }}
                  onMouseEnter={() => waitingEnd && cell <= maxD && setHoverDate(cell)}
                  onMouseLeave={() => setHoverDate(null)}
                >
                  {cell.getDate()}
                </div>
              );
            })}
          </div>

          {/* Hint */}
          {waitingEnd && (
            <p style={{
              margin: '12px 0 0', fontSize: '12px',
              color: 'var(--color-text-secondary)', textAlign: 'center',
            }}>
              {t('timeSeries.pickEndDate')}
            </p>
          )}
        </div>,
        document.body,
      )
    : null;

  /* ── Trigger ─────────────────────────────────────────────────────────── */
  const triggerStyle: React.CSSProperties = {
    display:      'inline-flex',
    alignItems:   'center',
    gap:          '6px',
    height:       '32px',
    padding:      '0 10px',
    borderRadius: 'var(--radius-full)',
    fontSize:     '0.75rem',
    fontWeight:   isActive ? 600 : 400,
    border:       `1px solid ${isActive ? 'var(--color-primary)' : 'var(--color-border-subtle)'}`,
    background:   isActive
      ? 'color-mix(in oklab, var(--color-primary) 9%, transparent)'
      : 'var(--color-surface-subtle)',
    color:        isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
    cursor:       'pointer',
    whiteSpace:   'nowrap',
    transition:   'background 140ms, border-color 140ms, color 140ms',
    flexShrink:   0,
  };

  const clearBtnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginLeft: '2px', width: '14px', height: '14px',
    borderRadius: '50%',
    background: 'color-mix(in oklab, var(--color-primary) 18%, transparent)',
    color: 'var(--color-primary)', flexShrink: 0,
  };

  return (
    <>
      <button
        ref={refs.setReference}
        onClick={isOpen ? animateClose : openPicker}
        style={triggerStyle}
        {...getReferenceProps()}
      >
        <CalendarDays size={13} style={{ flexShrink: 0 }} />
        <span>{triggerLabel ?? t('timeSeries.customRange')}</span>

        {isActive && (
          <span
            role="button"
            tabIndex={0}
            aria-label={t('common.close')}
            onClick={(e) => { e.stopPropagation(); onClear(); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onClear(); } }}
            style={clearBtnStyle}
          >
            <X size={9} />
          </span>
        )}
      </button>

      {popover}
    </>
  );
}
