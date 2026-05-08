'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  id: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
}

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  placeholder = '••••••••',
  autoComplete = 'current-password',
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 pr-11 rounded-xl border text-sm outline-none transition-all
          bg-[var(--color-surface)] border-[var(--color-border)]
          text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)]
          focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(21,93,252,0.12)]"
      />
      <button
        type="button"
        onClick={() => setVisible(v => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Hide password' : 'Show password'}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded
          text-[var(--color-text-disabled)] hover:text-[var(--color-text-secondary)]
          transition-colors cursor-pointer"
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}
