'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import { PasswordInput }   from './PasswordInput';
import { PasswordStrength } from './PasswordStrength';
import { Select } from '@/components/ui/Select';

/* ── Password rules (deben cumplirse TODAS, igual que el backend) ─ */
const RULES = [
  (v: string) => v.length >= 8,
  (v: string) => /[A-Z]/.test(v),
  (v: string) => /[a-z]/.test(v),
  (v: string) => /\d/.test(v),
  (v: string) => /[!@#$%^&*(),.?":{}|<>]/.test(v),
];
const isStrongEnough = (p: string) => RULES.every(r => r(p));
const isValidEmail   = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

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
    invalidEmail:   'El correo electrónico no es válido.',
    weakPass:       'La contraseña necesita mayúscula, minúscula, número y símbolo (!@#$%^&*(),.?":{}|<>).',
    mismatch:       'Las contraseñas no coinciden.',
    orgRequired:    'Completa los datos de la organización.',
    emailTaken:     'Este correo ya está registrado. ¿Querés iniciar sesión?',
    tooManyTries:   'Demasiados intentos seguidos. Esperá un momento y volvé a intentarlo.',
    validationErr:  'Algunos datos no son válidos. Revisá el correo y la contraseña.',
    serverError:    'No pudimos crear tu cuenta. Intenta de nuevo en unos segundos.',
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
    invalidEmail:   'Please enter a valid email address.',
    weakPass:       'Password needs an uppercase letter, lowercase, number and symbol (!@#$%^&*(),.?":{}|<>).',
    mismatch:       'Passwords do not match.',
    orgRequired:    'Please complete the organization details.',
    emailTaken:     'This email is already registered. Want to sign in instead?',
    tooManyTries:   'Too many attempts. Please wait a moment and try again.',
    validationErr:  'Some fields are invalid. Check your email and password.',
    serverError:    'We couldn\'t create your account. Please try again in a few seconds.',
  },
} as const;

type Strings = { [K in keyof (typeof STRINGS)['es']]: string };

/* ── Shared input / label classes ─────────────────────── */
const INPUT_CLS = `
  w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all
  bg-[var(--color-surface)] border-[var(--color-border)]
  text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)]
  focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(21,93,252,0.12)]
`.trim();

const LABEL_CLS =
  'block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-secondary)]';

/* ── OrgSection sub-component ────────────────────────── */
type OrgFields = { isOrg: boolean; orgName: string; orgDesc: string; orgType: 'commercial' | 'academic' | 'government' };
type SetOrg = React.Dispatch<React.SetStateAction<OrgFields>>;

function OrgSection({ orgRef, org, setOrg, s }: {
  orgRef: React.RefObject<HTMLDivElement | null>;
  org: OrgFields;
  setOrg: SetOrg;
  s: Strings;
}) {
  return (
    <div data-a>
      <label className="flex items-center gap-3 cursor-pointer select-none group">
        <div className="relative flex-shrink-0">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={org.isOrg}
            onChange={(e) => {
              const checked = e.target.checked;
              setOrg(prev => ({ ...prev, isOrg: checked }));
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
            }}
          />
          <div className="w-10 h-5 rounded-full border transition-all
            bg-[var(--color-surface-2)] border-[var(--color-border)]
            peer-checked:bg-[var(--color-primary)] peer-checked:border-[var(--color-primary)]" />
          <div className="absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform
            peer-checked:translate-x-5" />
        </div>
        <span className="text-sm text-[var(--color-text-primary)] font-medium">{s.isOrg}</span>
      </label>

      <div ref={orgRef} style={{ overflow: 'hidden', height: 0, opacity: 0 }}>
        <div className="space-y-4 pt-4 border-t border-[var(--color-border-subtle)] mt-4">
          <div className="space-y-1.5">
            <label htmlFor="orgName" className={LABEL_CLS}>{s.orgName}</label>
            <input
              id="orgName" type="text"
              placeholder={s.orgNamePh} value={org.orgName}
              onChange={(e) => setOrg(prev => ({ ...prev, orgName: e.target.value }))}
              className={INPUT_CLS}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="orgType" className={LABEL_CLS}>{s.orgType}</label>
            <Select
              value={org.orgType}
              onChange={(v) => setOrg(prev => ({ ...prev, orgType: v as OrgFields['orgType'] }))}
              options={[
                { value: 'commercial', label: s.commercial },
                { value: 'academic',   label: s.academic },
                { value: 'government', label: s.government },
              ]}
              style={{ padding: '12px 16px', fontSize: '14px', borderRadius: '12px' }}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="orgDesc" className={LABEL_CLS}>
              {s.orgDesc}
              <span className="ml-1.5 normal-case tracking-normal font-normal opacity-60">
                ({s.optional})
              </span>
            </label>
            <textarea
              id="orgDesc" rows={2}
              placeholder={s.orgDescPh} value={org.orgDesc}
              onChange={(e) => setOrg(prev => ({ ...prev, orgDesc: e.target.value }))}
              className={`${INPUT_CLS} resize-none`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── SignupForm ───────────────────────────────────────── */
interface Props { locale: 'en' | 'es' }

export function SignupForm({ locale }: Props) {
  const s      = STRINGS[locale] ?? STRINGS.es;
  const formRef = useRef<HTMLDivElement>(null);
  const orgRef  = useRef<HTMLDivElement>(null);

  const [userFields, setUser] = useState({
    firstName: '', middleName: '', lastName: '',
    email: '', phone: '', address: '',
    password: '', confirm: '',
  });
  const [org, setOrg] = useState<OrgFields>({
    isOrg: false, orgName: '', orgDesc: '', orgType: 'commercial',
  });
  const [ui, setUi] = useState({ error: '', loading: false });

  const { firstName, middleName, lastName, email, phone, address, password, confirm } = userFields;

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUi(prev => ({ ...prev, error: '' }));

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirm) {
      setUi(prev => ({ ...prev, error: s.required }));
      return;
    }
    if (!isValidEmail(email.trim())) {
      setUi(prev => ({ ...prev, error: s.invalidEmail }));
      return;
    }
    if (!isStrongEnough(password)) {
      setUi(prev => ({ ...prev, error: s.weakPass }));
      return;
    }
    if (password !== confirm) {
      setUi(prev => ({ ...prev, error: s.mismatch }));
      return;
    }
    if (org.isOrg && !org.orgName.trim()) {
      setUi(prev => ({ ...prev, error: s.orgRequired }));
      return;
    }

    setUi(prev => ({ ...prev, loading: true }));
    try {
      await import('@/lib/api/auth').then(({ register }) =>
        register({
          email:       email.trim(),
          password,
          first_name:  firstName.trim(),
          last_name:   lastName.trim(),
          middle_name: middleName.trim() || undefined,
          phone:       phone.trim()      || undefined,
          address:     address.trim()    || undefined,
        })
      );
      await import('@/lib/api/auth').then(({ login }) => login(email.trim(), password));
      window.location.href = `/${locale}/dashboard`;
    } catch (err: any) {
      const status = err?.status;
      let error: string = s.serverError;
      if (status === 409) error = s.emailTaken;
      else if (status === 429) error = s.tooManyTries;
      else if (status === 422) error = s.validationErr;
      setUi({ error, loading: false });
    }
  }

  const confirmMismatch = confirm.length > 0 && confirm !== password;

  return (
    <div ref={formRef} className="w-full max-w-[440px]">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>

        <div data-a className="space-y-1 mb-6">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{s.title}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{s.subtitle}</p>
        </div>

        <div data-a className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className={LABEL_CLS}>{s.firstName}</label>
            <input
              id="firstName" type="text" autoComplete="given-name"
              placeholder={s.firstNamePh} value={firstName}
              onChange={(e) => setUser(prev => ({ ...prev, firstName: e.target.value }))}
              className={INPUT_CLS}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="lastName" className={LABEL_CLS}>{s.lastName}</label>
            <input
              id="lastName" type="text" autoComplete="family-name"
              placeholder={s.lastNamePh} value={lastName}
              onChange={(e) => setUser(prev => ({ ...prev, lastName: e.target.value }))}
              className={INPUT_CLS}
            />
          </div>
        </div>

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
            onChange={(e) => setUser(prev => ({ ...prev, middleName: e.target.value }))}
            className={INPUT_CLS}
          />
        </div>

        <div data-a className="space-y-1.5">
          <label htmlFor="email" className={LABEL_CLS}>{s.email}</label>
          <input
            id="email" type="email" autoComplete="email"
            placeholder="you@example.com" value={email}
            onChange={(e) => setUser(prev => ({ ...prev, email: e.target.value }))}
            className={INPUT_CLS}
          />
        </div>

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
            onChange={(e) => setUser(prev => ({ ...prev, phone: e.target.value }))}
            className={INPUT_CLS}
          />
        </div>

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
            onChange={(e) => setUser(prev => ({ ...prev, address: e.target.value }))}
            className={INPUT_CLS}
          />
        </div>

        <div data-a className="space-y-1.5">
          <label htmlFor="password" className={LABEL_CLS}>{s.passLabel}</label>
          <PasswordInput
            id="password" name="password" value={password}
            onChange={(e) => setUser(prev => ({ ...prev, password: e.target.value }))}
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />
        </div>

        <div data-a className="space-y-1.5">
          <label htmlFor="confirm" className={LABEL_CLS}>{s.confirmLabel}</label>
          <PasswordInput
            id="confirm" name="confirm" value={confirm}
            onChange={(e) => setUser(prev => ({ ...prev, confirm: e.target.value }))}
            autoComplete="new-password"
          />
          {confirmMismatch && (
            <p className="text-[11px] text-[var(--color-aqi-critical)]">{s.mismatch}</p>
          )}
        </div>

        <OrgSection orgRef={orgRef} org={org} setOrg={setOrg} s={s} />

        {ui.error && (
          <p className="text-xs text-[var(--color-aqi-critical)]">{ui.error}</p>
        )}

        <div data-a className="pt-1">
          <button
            type="submit"
            disabled={ui.loading}
            className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all
              bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)]
              active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed
              shadow-[0_2px_12px_rgba(21,93,252,0.35)]"
          >
            {ui.loading ? s.submitting : s.submit}
          </button>
        </div>

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
