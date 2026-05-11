'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { PasswordInput } from './PasswordInput';

const STRINGS = {
  es: {
    title:       'Bienvenido de vuelta',
    subtitle:    'Inicia sesión para continuar',
    emailLabel:  'Correo electrónico',
    passLabel:   'Contraseña',
    forgot:      '¿Olvidaste tu contraseña?',
    submit:      'Iniciar sesión',
    submitting:  'Iniciando sesión…',
    noAccount:   '¿No tienes cuenta?',
    register:    'Crear cuenta',
    required:           'Completa todos los campos.',
    invalidCredentials: 'Email o contraseña incorrectos.',
    serverError:        'Ocurrió un error. Intenta de nuevo.',
  },
  en: {
    title:       'Welcome back',
    subtitle:    'Sign in to continue',
    emailLabel:  'Email',
    passLabel:   'Password',
    forgot:      'Forgot password?',
    submit:      'Sign in',
    submitting:  'Signing in…',
    noAccount:   "Don't have an account?",
    register:    'Create account',
    required:           'Please fill in all fields.',
    invalidCredentials: 'Invalid email or password.',
    serverError:        'Something went wrong. Please try again.',
  },
} as const;

interface Props {
  locale: 'en' | 'es';
}

export function LoginForm({ locale }: Props) {
  const s   = STRINGS[locale] ?? STRINGS.es;
  const ref = useRef<HTMLDivElement>(null);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    import('@/lib/api/auth').then(({ me }) =>
      me().then(() => { window.location.replace(`/${locale}/dashboard`); }).catch(() => {})
    );
  }, [locale]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-a]',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.08, ease: 'power3.out', delay: 0.1 },
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError(s.required); return; }
    setLoading(true);
    try {
      await import('@/lib/api/auth').then(({ login }) => login(email.trim(), password));
      window.location.href = `/${locale}/dashboard`;
    } catch (err: any) {
      setError(err?.status === 401 ? s.invalidCredentials : s.serverError);
      setLoading(false);
    }
  }

  return (
    <div ref={ref} className="w-full max-w-[360px]">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Header */}
        <div data-a className="space-y-1 mb-7">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
            {s.title}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{s.subtitle}</p>
        </div>

        {/* Email */}
        <div data-a className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-secondary)]"
          >
            {s.emailLabel}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
              bg-[var(--color-surface)] border-[var(--color-border)]
              text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)]
              focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(21,93,252,0.12)]"
          />
        </div>

        {/* Password */}
        <div data-a className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-secondary)]"
            >
              {s.passLabel}
            </label>
            <Link
              href={`/${locale}/reset-password`}
              className="text-xs text-[var(--color-primary)] hover:underline"
            >
              {s.forgot}
            </Link>
          </div>
          <PasswordInput
            id="password"
            name="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-[var(--color-aqi-critical)]">{error}</p>
        )}

        {/* Submit */}
        <div data-a className="pt-1">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all
              bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]
              active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
              shadow-[0_2px_12px_rgba(21,93,252,0.35)]"
          >
            {loading ? s.submitting : s.submit}
          </button>
        </div>

        {/* Register link */}
        <p data-a className="text-center text-xs text-[var(--color-text-secondary)] pt-1">
          {s.noAccount}{' '}
          <Link
            href={`/${locale}/register`}
            className="text-[var(--color-primary)] hover:underline font-medium"
          >
            {s.register}
          </Link>
        </p>
      </form>
    </div>
  );
}
