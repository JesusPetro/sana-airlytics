'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { PasswordInput }   from './PasswordInput';
import { PasswordStrength } from './PasswordStrength';

/* ── Password rules ───────────────────────────────────── */
const RULES = [
  (v: string) => v.length >= 8,
  (v: string) => /[A-Z]/.test(v),
  (v: string) => /[a-z]/.test(v),
  (v: string) => /\d/.test(v),
  (v: string) => /[!@#$%^&*()\-_=+[\]{}|;:'",.<>/?\\`~]/.test(v),
];
const isStrongEnough = (p: string) => RULES.filter(r => r(p)).length >= 4;

/* ── i18n strings ─────────────────────────────────────── */
const STRINGS = {
  es: {
    title:          'Crea tu cuenta',
    subtitle:       'Empieza a monitorear el aire',
    firstName:      'Nombre',
    firstNamePh:    'Juan',
    middleName:     'Segundo nombre',
    middleNamePh:   'Carlos',
    optional:       'opcional',
    lastName:       'Apellido',
    lastNamePh:     'García',
    email:          'Correo electrónico',
    phone:          'Teléfono',
    phonePh:        '+57 300 000 0000',
    address:        'Dirección',
    addressPh:      'Calle 1 # 2-3, Cartagena',
    passLabel:      'Contraseña',
    confirmLabel:   'Confirmar contraseña',
    isOrg:          'Registro de organización',
    orgName:        'Nombre de la organización',
    orgNamePh:      'SANA Lab',
    orgDesc:        'Descripción',
    orgDescPh:      'Breve descripción de la organización',
    orgType:        'Tipo de organización',
    commercial:     'Comercial',
    academic:       'Académica',
    government:     'Gubernamental',
    submit:         'Crear cuenta',
    submitting:     'Creando cuenta…',
    hasAccount:     '¿Ya tienes cuenta?',
    login:          'Iniciar sesión',
    required:       'Completa los campos obligatorios.',
    weakPass:       'La contraseña es demasiado débil.',
    mismatch:       'Las contraseñas no coinciden.',
    orgRequired:    'Completa los datos de la organización.',
    emailTaken:     'Este correo ya está registrado.',
    serverError:    'Ocurrió un error. Intenta de nuevo.',
  },
  en: {
    title:          'Create your account',
    subtitle:       'Start monitoring air quality',
    firstName:      'First name',
    firstNamePh:    'Jane',
    middleName:     'Middle name',
    middleNamePh:   'Marie',
    optional:       'optional',
    lastName:       'Last name',
    lastNamePh:     'Doe',
    email:          'Email',
    phone:          'Phone',
    phonePh:        '+1 555 000 0000',
    address:        'Address',
    addressPh:      '123 Main St, Cartagena',
    passLabel:      'Password',
    confirmLabel:   'Confirm password',
    isOrg:          'Organization account',
    orgName:        'Organization name',
    orgNamePh:      'SANA Lab',
    orgDesc:        'Description',
    orgDescPh:      'Brief description of the organization',
    orgType:        'Organization type',
    commercial:     'Commercial',
    academic:       'Academic',
    government:     'Government',
    submit:         'Create account',
    submitting:     'Creating account…',
    hasAccount:     'Already have an account?',
    login:          'Sign in',
    required:       'Please fill in all required fields.',
    weakPass:       'Password is too weak.',
    mismatch:       'Passwords do not match.',
    orgRequired:    'Please complete the organization details.',
    emailTaken:     'This email is already registered.',
    serverError:    'Something went wrong. Please try again.',
  },
} as const;

/* ── Shared input / label classes ─────────────────────── */
const INPUT_CLS = `
  w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
  bg-[var(--color-surface)] border-[var(--color-border)]
  text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)]
  focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(21,93,252,0.12)]
`.trim();

const LABEL_CLS =
  'block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-secondary)]';

/* ── Component ────────────────────────────────────────── */
interface Props { locale: 'en' | 'es' }

export function SignupForm({ locale }: Props) {
  const s      = STRINGS[locale] ?? STRINGS.es;
  const formRef = useRef<HTMLDivElement>(null);
  const orgRef  = useRef<HTMLDivElement>(null);

  /* user fields */
  const [firstName,  setFirstName]  = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName,   setLastName]   = useState('');
  const [email,      setEmail]      = useState('');
  const [phone,      setPhone]      = useState('');
  const [address,    setAddress]    = useState('');
  const [password,   setPassword]   = useState('');
  const [confirm,    setConfirm]    = useState('');

  /* org fields */
  const [isOrg,    setIsOrg]    = useState(false);
  const [orgName,  setOrgName]  = useState('');
  const [orgDesc,  setOrgDesc]  = useState('');
  const [orgType,  setOrgType]  = useState<'commercial' | 'academic' | 'government'>('commercial');

  /* ui */
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  /* ── Entrance animation ─────────────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-a]',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.55, stagger: 0.06, ease: 'power3.out', delay: 0.1 },
      );
    }, formRef);
    return () => ctx.revert();
  }, []);

  /* ── Org section toggle ─────────────────────────────── */
  function toggleOrg(checked: boolean) {
    setIsOrg(checked);
    const el = orgRef.current;
    if (!el) return;

    if (checked) {
      gsap.fromTo(el,
        { height: 0, opacity: 0 },
        { height: 'auto', opacity: 1, duration: 0.42, ease: 'power2.out' },
      );
    } else {
      gsap.to(el, { height: 0, opacity: 0, duration: 0.3, ease: 'power2.in' });
    }
  }

  /* ── Submit ─────────────────────────────────────────── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirm) {
      setError(s.required);
      return;
    }
    if (!isStrongEnough(password)) { setError(s.weakPass);    return; }
    if (password !== confirm)       { setError(s.mismatch);   return; }
    if (isOrg && !orgName.trim())   { setError(s.orgRequired); return; }

    setLoading(true);
    try {
      await import('@/lib/api/auth').then(({ register }) =>
        register({ email: email.trim(), password, first_name: firstName.trim(), last_name: lastName.trim() })
      );
      // auto-login after register
      await import('@/lib/api/auth').then(({ login }) => login(email.trim(), password));
      window.location.href = `/${locale}/dashboard`;
    } catch (err: any) {
      setError(err?.status === 409 ? s.emailTaken : s.serverError);
      setLoading(false);
    }
  }

  const confirmMismatch = confirm.length > 0 && confirm !== password;

  /* ── Render ─────────────────────────────────────────── */
  return (
    <div ref={formRef} className="w-full max-w-[440px]">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>

        {/* Header */}
        <div data-a className="space-y-1 mb-6">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{s.title}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{s.subtitle}</p>
        </div>

        {/* First name + Last name */}
        <div data-a className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className={LABEL_CLS}>{s.firstName}</label>
            <input
              id="firstName" type="text" autoComplete="given-name"
              placeholder={s.firstNamePh} value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="lastName" className={LABEL_CLS}>{s.lastName}</label>
            <input
              id="lastName" type="text" autoComplete="family-name"
              placeholder={s.lastNamePh} value={lastName}
              onChange={e => setLastName(e.target.value)}
              className={INPUT_CLS}
            />
          </div>
        </div>

        {/* Middle name (optional) */}
        <div data-a className="space-y-1.5">
          <label htmlFor="middleName" className={LABEL_CLS}>
            {s.middleName}
            <span className="ml-1.5 normal-case tracking-normal font-normal opacity-60">
              ({s.optional})
            </span>
          </label>
          <input
            id="middleName" type="text" autoComplete="additional-name"
            placeholder={s.middleNamePh} value={middleName}
            onChange={e => setMiddleName(e.target.value)}
            className={INPUT_CLS}
          />
        </div>

        {/* Email */}
        <div data-a className="space-y-1.5">
          <label htmlFor="email" className={LABEL_CLS}>{s.email}</label>
          <input
            id="email" type="email" autoComplete="email"
            placeholder="you@example.com" value={email}
            onChange={e => setEmail(e.target.value)}
            className={INPUT_CLS}
          />
        </div>

        {/* Phone */}
        <div data-a className="space-y-1.5">
          <label htmlFor="phone" className={LABEL_CLS}>
            {s.phone}
            <span className="ml-1.5 normal-case tracking-normal font-normal opacity-60">
              ({s.optional})
            </span>
          </label>
          <input
            id="phone" type="tel" autoComplete="tel"
            placeholder={s.phonePh} value={phone}
            onChange={e => setPhone(e.target.value)}
            className={INPUT_CLS}
          />
        </div>

        {/* Address */}
        <div data-a className="space-y-1.5">
          <label htmlFor="address" className={LABEL_CLS}>
            {s.address}
            <span className="ml-1.5 normal-case tracking-normal font-normal opacity-60">
              ({s.optional})
            </span>
          </label>
          <input
            id="address" type="text" autoComplete="street-address"
            placeholder={s.addressPh} value={address}
            onChange={e => setAddress(e.target.value)}
            className={INPUT_CLS}
          />
        </div>

        {/* Password + strength */}
        <div data-a className="space-y-1.5">
          <label htmlFor="password" className={LABEL_CLS}>{s.passLabel}</label>
          <PasswordInput
            id="password" name="password" value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />
        </div>

        {/* Confirm password */}
        <div data-a className="space-y-1.5">
          <label htmlFor="confirm" className={LABEL_CLS}>{s.confirmLabel}</label>
          <PasswordInput
            id="confirm" name="confirm" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
          {confirmMismatch && (
            <p className="text-[11px] text-[var(--color-aqi-critical)]">{s.mismatch}</p>
          )}
        </div>

        {/* Organization toggle */}
        <div data-a>
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isOrg}
                onChange={e => toggleOrg(e.target.checked)}
              />
              {/* track */}
              <div className="w-10 h-5 rounded-full border transition-all
                bg-[var(--color-surface-2)] border-[var(--color-border)]
                peer-checked:bg-[var(--color-primary)] peer-checked:border-[var(--color-primary)]" />
              {/* thumb */}
              <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
                peer-checked:translate-x-5" />
            </div>
            <span className="text-sm text-[var(--color-text-primary)] font-medium">
              {s.isOrg}
            </span>
          </label>

          {/* Animated org section */}
          <div
            ref={orgRef}
            style={{ overflow: 'hidden', height: 0, opacity: 0 }}
          >
            <div className="space-y-4 pt-4 border-t border-[var(--color-border-subtle)] mt-4">

              {/* Org name */}
              <div className="space-y-1.5">
                <label htmlFor="orgName" className={LABEL_CLS}>{s.orgName}</label>
                <input
                  id="orgName" type="text"
                  placeholder={s.orgNamePh} value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  className={INPUT_CLS}
                />
              </div>

              {/* Org type */}
              <div className="space-y-1.5">
                <label htmlFor="orgType" className={LABEL_CLS}>{s.orgType}</label>
                <select
                  id="orgType"
                  value={orgType}
                  onChange={e => setOrgType(e.target.value as typeof orgType)}
                  className={INPUT_CLS}
                >
                  <option value="commercial">{s.commercial}</option>
                  <option value="academic">{s.academic}</option>
                  <option value="government">{s.government}</option>
                </select>
              </div>

              {/* Org description */}
              <div className="space-y-1.5">
                <label htmlFor="orgDesc" className={LABEL_CLS}>
                  {s.orgDesc}
                  <span className="ml-1.5 normal-case tracking-normal font-normal opacity-60">
                    ({s.optional})
                  </span>
                </label>
                <textarea
                  id="orgDesc" rows={2}
                  placeholder={s.orgDescPh} value={orgDesc}
                  onChange={e => setOrgDesc(e.target.value)}
                  className={`${INPUT_CLS} resize-none`}
                />
              </div>

            </div>
          </div>
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

        {/* Login link */}
        <p data-a className="text-center text-xs text-[var(--color-text-secondary)] pt-1">
          {s.hasAccount}{' '}
          <Link
            href={`/${locale}/login`}
            className="text-[var(--color-primary)] hover:underline font-medium"
          >
            {s.login}
          </Link>
        </p>

      </form>
    </div>
  );
}
