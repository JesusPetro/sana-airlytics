'use client';

const RULES = [
  { label: 'Al menos 8 caracteres',        test: (v: string) => v.length >= 8 },
  { label: 'Letra mayúscula',               test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Letra minúscula',               test: (v: string) => /[a-z]/.test(v) },
  { label: 'Número',                        test: (v: string) => /\d/.test(v) },
  { label: 'Carácter especial (!@#$%…)',    test: (v: string) => /[!@#$%^&*()\-_=+[\]{}|;:'",.<>/?\\`~]/.test(v) },
] as const;

const LEVELS = [
  { label: 'Muy débil',  color: '#EF4444' },
  { label: 'Débil',      color: '#F59E0B' },
  { label: 'Regular',    color: '#EAB308' },
  { label: 'Fuerte',     color: '#10B981' },
  { label: 'Muy fuerte', color: '#155DFC' },
] as const;

interface Props {
  password: string;
}

export function PasswordStrength({ password }: Props) {
  if (!password) return null;

  const passed = RULES.filter(r => r.test(password)).length;
  const level  = LEVELS[Math.max(0, passed - 1)];

  return (
    <div className="mt-2.5 space-y-2">
      {/* Segmented bar */}
      <div className="flex gap-1">
        {RULES.map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i < passed ? level.color : 'var(--color-surface-2)' }}
          />
        ))}
      </div>

      {/* Level label */}
      <p
        className="text-[11px] font-mono font-medium transition-colors duration-300"
        style={{ color: level.color }}
      >
        {level.label}
      </p>

      {/* Rule checklist */}
      <ul className="space-y-1">
        {RULES.map((rule, i) => {
          const ok = rule.test(password);
          return (
            <li
              key={i}
              className="flex items-center gap-1.5 text-[11px] transition-colors duration-200"
              style={{ color: ok ? '#10B981' : 'var(--color-text-disabled)' }}
            >
              <span className="w-3 text-center leading-none" aria-hidden>
                {ok ? '✓' : '○'}
              </span>
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
