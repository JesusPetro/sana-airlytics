'use client';

import { CSSProperties, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  placeholder?: string;
  style?: CSSProperties;
  variant?: 'default' | 'chip';
}

export function Select({
  value,
  onChange,
  options,
  disabled = false,
  placeholder,
  style,
  variant = 'default',
}: SelectProps) {
  const [open, setOpen]               = useState(false);
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
  const triggerRef  = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isMounted   = useRef(true);
  const isChip = variant === 'chip';
  const selected = options.find(o => o.value === value);

  useEffect(() => () => { isMounted.current = false; }, []);

  // Animate panel + options in when open becomes true
  useGSAP(() => {
    if (!open || !dropdownRef.current) return;
    gsap.fromTo(
      dropdownRef.current,
      { opacity: 0, scaleY: 0.82, y: -8 },
      { opacity: 1, scaleY: 1, y: 0, duration: 0.22, ease: 'power3.out', transformOrigin: 'top center' },
    );
    gsap.from(
      dropdownRef.current.querySelectorAll('button'),
      { opacity: 0, y: -4, stagger: 0.04, duration: 0.16, ease: 'power2.out', delay: 0.08 },
    );
  }, { dependencies: [open] });

  function close() {
    if (!dropdownRef.current) {
      if (isMounted.current) setOpen(false);
      return;
    }
    gsap.to(dropdownRef.current, {
      opacity: 0,
      scaleY: 0.88,
      y: -5,
      duration: 0.14,
      ease: 'power2.in',
      transformOrigin: 'top center',
      onComplete: () => { if (isMounted.current) setOpen(false); },
    });
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (
        !triggerRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      ) close();
    };
    document.addEventListener('mousedown', onDown);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  function toggle() {
    if (disabled) return;
    if (open) {
      // Kill any in-progress animation and close instantly so it's ready to reopen immediately
      if (dropdownRef.current) gsap.killTweensOf(dropdownRef.current);
      setOpen(false);
    } else {
      setTriggerRect(triggerRef.current?.getBoundingClientRect() ?? null);
      setOpen(true);
    }
  }

  const triggerBase: CSSProperties = isChip
    ? {
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        padding: '3px 8px', fontSize: '11px', fontWeight: 600,
        borderRadius: '6px', border: '1px solid var(--color-border)',
        background: 'var(--color-surface-subtle)', color: 'var(--color-text-secondary)',
      }
    : {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
        width: '100%', padding: '8px 10px', fontSize: '13px', textAlign: 'left',
        borderRadius: '8px', border: '1px solid var(--color-border)',
        background: 'var(--color-surface-subtle)', color: 'var(--color-text-primary)',
      };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={toggle}
        style={{
          ...triggerBase,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          userSelect: 'none',
          ...style,
        }}
        className="focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      >
        <span style={{ flex: isChip ? undefined : 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
          {selected?.label ?? placeholder ?? ''}
        </span>
        <ChevronDown
          size={isChip ? 11 : 14}
          style={{
            flexShrink: 0,
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </button>

      {open && triggerRect && typeof window !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: triggerRect.bottom + 4,
            left: triggerRect.left,
            minWidth: isChip ? 130 : triggerRect.width,
            width: isChip ? undefined : triggerRect.width,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: '10px',
            boxShadow: 'var(--shadow-md)',
            zIndex: 40,
            padding: '4px',
            overflow: 'hidden',
          }}
        >
          {options.map((opt) => {
            const active = opt.value === value;
            const optStyle: CSSProperties = {
              display: 'block', width: '100%', textAlign: 'left',
              padding: isChip ? '5px 10px' : '7px 10px',
              fontSize: isChip ? '12px' : '13px',
              fontWeight: active ? 600 : 400,
              background: active ? 'var(--color-primary-surface)' : 'transparent',
              color: active ? 'var(--color-primary)' : 'var(--color-text-primary)',
              border: 'none', borderRadius: '7px', cursor: 'pointer',
              whiteSpace: 'nowrap',
            };
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); close(); }}
                style={optStyle}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = 'var(--color-surface-subtle)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = active
                    ? 'var(--color-primary-surface)'
                    : 'transparent';
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}
