'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { getProfile, updateProfile, deleteAccount, type UserProfileResponse } from '@/lib/api/profile';
import { logout as apiLogout } from '@/lib/api/auth';

// Clases de input reutilizadas del sistema de diseno existente
const INPUT_CLS = [
  'w-full px-3 py-2 rounded-lg border text-sm outline-none transition-all',
  'bg-[var(--color-surface-subtle)] border-[var(--color-border)]',
  'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)]',
  'focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(21,93,252,0.12)]',
].join(' ');

const LABEL_CLS = 'block text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-secondary)] mb-1';

function initials(email: string): string {
  const parts = email.split('@')[0].split(/[._-]/);
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('');
}

interface ProfileSheetProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function ProfileSheet({ isOpen, onClose, locale }: ProfileSheetProps) {
  const t = useTranslations('profile');
  const router = useRouter();

  // Estado del perfil
  const [profile, setProfile]     = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estado del formulario
  const [firstName,  setFirstName]  = useState('');
  const [lastName,   setLastName]   = useState('');
  const [middleName, setMiddleName] = useState('');
  const [phone,      setPhone]      = useState('');
  const [address,    setAddress]    = useState('');

  // Estado de guardado
  const [isSaving,     setIsSaving]     = useState(false);
  const [saveMessage,  setSaveMessage]  = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estado de eliminacion
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting,    setIsDeleting]    = useState(false);
  const [deleteError,   setDeleteError]   = useState<string | null>(null);

  // Fetcha el perfil completo al abrir el panel
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    setSaveMessage(null);
    setConfirmDelete(false);
    setDeleteError(null);
    getProfile()
      .then((data) => {
        setProfile(data);
        setFirstName(data.first_name);
        setLastName(data.last_name);
        setMiddleName(data.middle_name ?? '');
        setPhone(data.phone ?? '');
        setAddress(data.address ?? '');
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  // Cierra con Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  async function handleSave() {
    if (isSaving) return;
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await updateProfile({
        first_name:  firstName.trim()  || null,
        last_name:   lastName.trim()   || null,
        middle_name: middleName.trim() || null,
        phone:       phone.trim()      || null,
        address:     address.trim()    || null,
      });
      setSaveMessage({ type: 'success', text: t('saveSuccess') });
    } catch {
      setSaveMessage({ type: 'error', text: t('saveError') });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteAccount();
      // El backend hace soft delete pero no limpia cookies.
      // Se debe llamar logout para limpiar las cookies de sesion.
      try { await apiLogout(); } catch {}
      router.push(`/${locale}/login`);
    } catch {
      setDeleteError(t('deleteError'));
      setIsDeleting(false);
    }
  }

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 400,
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0, right: 0,
          height: '100vh',
          width: '400px',
          maxWidth: 'calc(100vw - 32px)',
          zIndex: 401,
          background: 'var(--color-surface)',
          borderLeft: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 20px 14px',
          borderBottom: '1px solid var(--color-border-subtle)',
          flexShrink: 0,
        }}>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--color-text-primary)' }}>
            {t('title')}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-text-secondary)', display: 'flex',
              padding: '4px', borderRadius: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            <X size={18} />
          </button>
        </div>

        {isLoading || !profile ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--color-text-secondary)', fontSize: '13px' }}>...</span>
          </div>
        ) : (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Info del usuario */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span style={{
                flexShrink: 0,
                width: '44px', height: '44px',
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '15px', fontWeight: 700,
              }}>
                {initials(profile.email) || '?'}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text-primary)' }}>
                  {profile.first_name} {profile.last_name}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                  {profile.email}
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div>
                <label className={LABEL_CLS}>{t('firstName')}</label>
                <input
                  className={INPUT_CLS}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={t('firstName')}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>{t('lastName')}</label>
                <input
                  className={INPUT_CLS}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={t('lastName')}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>
                  {t('middleName')}{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '10px' }}>
                    ({t('optional')})
                  </span>
                </label>
                <input
                  className={INPUT_CLS}
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder={t('middleName')}
                />
              </div>

              <div>
                <label className={LABEL_CLS}>
                  {t('phone')}{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '10px' }}>
                    ({t('optional')})
                  </span>
                </label>
                <input
                  className={INPUT_CLS}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+57 300 000 0000"
                />
              </div>

              <div>
                <label className={LABEL_CLS}>
                  {t('address')}{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', fontSize: '10px' }}>
                    ({t('optional')})
                  </span>
                </label>
                <input
                  className={INPUT_CLS}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Calle 1 # 2-3, Cartagena"
                />
              </div>

              {/* Mensaje de guardado */}
              {saveMessage && (
                <div style={{
                  fontSize: '12px', padding: '8px 12px', borderRadius: '8px',
                  background: saveMessage.type === 'success'
                    ? 'var(--color-success-surface, #f0fdf4)'
                    : 'var(--color-error-surface, #fef2f2)',
                  color: saveMessage.type === 'success'
                    ? 'var(--color-success, #16a34a)'
                    : 'var(--color-error, #dc2626)',
                }}>
                  {saveMessage.text}
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{
                  width: '100%', padding: '10px', fontSize: '13px', fontWeight: 600,
                  background: 'var(--color-primary)', color: '#fff',
                  border: 'none', borderRadius: '10px',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  opacity: isSaving ? 0.7 : 1,
                  transition: 'opacity 150ms',
                }}
              >
                {isSaving ? t('saving') : t('saveChanges')}
              </button>
            </div>

            {/* Zona de peligro */}
            <div style={{
              borderTop: '1px solid var(--color-border-subtle)',
              paddingTop: '20px',
              display: 'flex', flexDirection: 'column', gap: '12px',
            }}>
              <span style={{
                fontSize: '11px', fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                color: 'var(--color-text-secondary)',
              }}>
                {t('dangerZone')}
              </span>

              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    width: '100%', padding: '9px', fontSize: '13px', fontWeight: 600,
                    background: 'transparent',
                    color: 'var(--color-error, #dc2626)',
                    border: '1px solid var(--color-error, #dc2626)',
                    borderRadius: '10px', cursor: 'pointer',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(220,38,38,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {t('deleteAccount')}
                </button>
              ) : (
                <div style={{
                  padding: '14px', borderRadius: '10px',
                  border: '1px solid var(--color-error, #dc2626)',
                  display: 'flex', flexDirection: 'column', gap: '12px',
                }}>
                  <p style={{ fontSize: '13px', color: 'var(--color-text-primary)', margin: 0 }}>
                    {t('deleteConfirmText')}
                  </p>

                  {deleteError && (
                    <div style={{
                      fontSize: '12px', padding: '8px 12px', borderRadius: '8px',
                      background: 'var(--color-error-surface, #fef2f2)',
                      color: 'var(--color-error, #dc2626)',
                    }}>
                      {deleteError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => { setConfirmDelete(false); setDeleteError(null); }}
                      disabled={isDeleting}
                      style={{
                        flex: 1, padding: '8px', fontSize: '13px', fontWeight: 500,
                        background: 'var(--color-surface-subtle)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px', cursor: 'pointer',
                      }}
                    >
                      {t('deleteCancel')}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      style={{
                        flex: 1, padding: '8px', fontSize: '13px', fontWeight: 600,
                        background: 'var(--color-error, #dc2626)', color: '#fff',
                        border: 'none', borderRadius: '8px',
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                        opacity: isDeleting ? 0.7 : 1,
                      }}
                    >
                      {isDeleting ? t('deleting') : t('deleteConfirm')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}
