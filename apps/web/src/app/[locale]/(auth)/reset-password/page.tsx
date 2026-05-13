'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import Link from 'next/link';
import { PasswordInput } from '@/components/auth/PasswordInput';
import { requestReset, resetPassword } from '@/lib/api/auth';

const STRINGS = {
  es: {
    requestTitle:    'Recuperar contraseña',
    requestSubtitle: 'Te enviaremos un enlace para restablecer tu contraseña.',
    emailLabel:      'Correo electrónico',
    send:            'Enviar enlace',
    sending:         'Enviando…',
    sentTitle:       'Revisa tu correo',
    sentSubtitle:    'Si el correo está registrado, recibirás un enlace en los próximos minutos.',
    backToLogin:     'Volver al inicio de sesión',
    resetTitle:      'Nueva contraseña',
    resetSubtitle:   'Crea una contraseña segura para tu cuenta.',
    newPass:         'Nueva contraseña',
    saving:          'Guardando…',
    save:            'Guardar contraseña',
    resetOk:         '¡Contraseña actualizada! Ya puedes iniciar sesión.',
    errorInvalid:    'El enlace es inválido o ha expirado.',
    errorGeneric:    'Ocurrió un error. Intenta de nuevo.',
    required:        'Completa todos los campos.',
  },
  en: {
    requestTitle:    'Reset your password',
    requestSubtitle: 'We\'ll send you a link to reset your password.',
    emailLabel:      'Email',
    send:            'Send link',
    sending:         'Sending…',
    sentTitle:       'Check your inbox',
    sentSubtitle:    'If the email is registered, you\'ll receive a reset link shortly.',
    backToLogin:     'Back to sign in',
    resetTitle:      'New password',
    resetSubtitle:   'Create a strong password for your account.',
    newPass:         'New password',
    saving:          'Saving…',
    save:            'Save password',
    resetOk:         'Password updated! You can now sign in.',
    errorInvalid:    'This link is invalid or has expired.',
    errorGeneric:    'Something went wrong. Please try again.',
    required:        'Please fill in all fields.',
  },
} as const;

function ResetPasswordInner() {
  const { locale: rawLocale } = useParams<{ locale: string }>();
  const locale       = (rawLocale ?? 'es') as 'en' | 'es';
  const s            = STRINGS[locale] ?? STRINGS.es;
  const searchParams = useSearchParams();
  const token        = searchParams.get('token');

  /* ── Request-reset flow ─────────────────────────────── */
  const [email,     setEmail]     = useState('');
  const [sent,      setSent]      = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  /* ── Confirm-reset flow ─────────────────────────────── */
  const [newPass,   setNewPass]   = useState('');
  const [resetOk,   setResetOk]   = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError(s.required); return; }
    setError(''); setLoading(true);
    try {
      await requestReset(email.trim());
      setSent(true);
    } catch {
      setError(s.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!newPass) { setError(s.required); return; }
    setError(''); setLoading(true);
    try {
      await resetPassword(token!, newPass);
      setResetOk(true);
    } catch (err: any) {
      setError(err?.status === 400 ? s.errorInvalid : s.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  const INPUT_CLS = `
    w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
    bg-[var(--color-surface)] border-[var(--color-border)]
    text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)]
    focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(21,93,252,0.12)]
  `.trim();

  const LABEL_CLS = 'block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-secondary)]';

  /* ── Confirm-reset view ─────────────────────────────── */
  if (token) {
    if (resetOk) return (
      <div className="w-full max-w-[360px] space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{s.resetTitle}</h1>
        </div>
        <p className="text-sm text-[var(--color-aqi-good)]">{s.resetOk}</p>
        <Link href={`/${locale}/login`} className="block w-full py-3 text-center rounded-xl text-sm font-medium text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] transition-all">
          {s.backToLogin}
        </Link>
      </div>
    );

    return (
      <div className="w-full max-w-[360px]">
        <form onSubmit={handleConfirm} className="space-y-5" noValidate>
          <div className="space-y-1 mb-7">
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{s.resetTitle}</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">{s.resetSubtitle}</p>
          </div>
          <div className="space-y-1.5">
            <label className={LABEL_CLS}>{s.newPass}</label>
            <PasswordInput id="newPass" name="newPass" value={newPass} onChange={(e) => setNewPass(e.target.value)} autoComplete="new-password" />
          </div>
          {error && <p className="text-xs text-[var(--color-aqi-critical)]">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_2px_12px_rgba(21,93,252,0.35)]">
            {loading ? s.saving : s.save}
          </button>
        </form>
      </div>
    );
  }

  /* ── Request-reset view ─────────────────────────────── */
  if (sent) return (
    <div className="w-full max-w-[360px] space-y-5">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{s.sentTitle}</h1>
        <p className="text-sm text-[var(--color-text-secondary)]">{s.sentSubtitle}</p>
      </div>
      <Link href={`/${locale}/login`} className="block text-sm text-[var(--color-primary)] hover:underline">
        ← {s.backToLogin}
      </Link>
    </div>
  );

  return (
    <div className="w-full max-w-[360px]">
      <form onSubmit={handleRequest} className="space-y-5" noValidate>
        <div className="space-y-1 mb-7">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{s.requestTitle}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{s.requestSubtitle}</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className={LABEL_CLS}>{s.emailLabel}</label>
          <input
            id="email" type="email" autoComplete="email"
            placeholder="you@example.com"
            value={email} onChange={(e) => setEmail(e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        {error && <p className="text-xs text-[var(--color-aqi-critical)]">{error}</p>}
        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_2px_12px_rgba(21,93,252,0.35)]">
          {loading ? s.sending : s.send}
        </button>
        <Link href={`/${locale}/login`} className="block text-center text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]">
          ← {s.backToLogin}
        </Link>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordInner />
    </Suspense>
  );
}
