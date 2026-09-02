import { type ReactNode, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  width?: number;
  children: ReactNode;
}

export function Modal({ open, onClose, width = 460, children }: ModalProps) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(24,24,27,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width, maxWidth: '92vw', maxHeight: '86vh', overflowY: 'auto',
          background: '#ffffff', borderRadius: 18, padding: 26,
          boxShadow: '0 30px 60px -20px rgba(24,24,27,0.3)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 17, fontWeight: 800, color: '#18181b', marginBottom: 18 }}>
      {children}
    </div>
  );
}

export function ModalActions({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
      {children}
    </div>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
  error?: string;
}

export function Field({ label, children, error }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: error ? '#dc2626' : '#3f3f46' }}>{label}</label>
      {children}
      {error && <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: -2 }}>{error}</div>}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  height: 40, borderRadius: 10, border: '1px solid #e4e4e7',
  padding: '0 12px', fontSize: 13.5, fontFamily: "'Manrope', system-ui, sans-serif",
  background: '#fafafa', color: '#18181b', width: '100%',
};

const errorOverride: React.CSSProperties = { border: '1px solid #dc2626', background: '#fff8f8' };

export function Input({ error, style, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return <input {...props} style={{ ...inputBase, ...(error ? errorOverride : {}), ...style }} />;
}

export function Select({ error, style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return <select {...props} style={{ ...inputBase, ...(error ? errorOverride : {}), ...style }} />;
}

export function PasswordInput({ error, style, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { error?: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input
        {...props}
        type={show ? 'text' : 'password'}
        style={{ ...inputBase, ...(error ? errorOverride : {}), paddingRight: 42, ...style }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
        style={{
          position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
          background: 'none', border: 'none', cursor: 'pointer', color: '#a1a1aa',
          padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        {show ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function BtnPrimary({ children, onClick, disabled, style }: { children: ReactNode; onClick?: () => void; disabled?: boolean; style?: React.CSSProperties }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 40, flex: 1, borderRadius: 10, border: 'none',
        background: disabled ? '#a1a1aa' : '#6d28d9', color: '#ffffff',
        fontSize: 13.5, fontWeight: 700, fontFamily: "'Manrope', system-ui, sans-serif",
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 40, flex: 1, borderRadius: 10,
        border: '1px solid #e4e4e7', background: '#ffffff', color: '#3f3f46',
        fontSize: 13.5, fontWeight: 700, fontFamily: "'Manrope', system-ui, sans-serif",
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message?: string;
  confirmLabel?: string;
  loading?: boolean;
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel, loading }: ConfirmModalProps) {
  const { t } = useLanguage();
  const label = confirmLabel ?? t('delete');
  return (
    <Modal open={open} onClose={onClose} width={400}>
      <ModalTitle>{title}</ModalTitle>
      {message && (
        <div style={{ fontSize: 13.5, color: '#52525b', marginBottom: 4 }}>{message}</div>
      )}
      <ModalActions>
        <BtnSecondary onClick={onClose}>{t('cancel')}</BtnSecondary>
        <BtnPrimary onClick={onConfirm} disabled={loading} style={{ background: loading ? '#a1a1aa' : '#dc2626' }}>
          {loading ? t('deleting') : label}
        </BtnPrimary>
      </ModalActions>
    </Modal>
  );
}
