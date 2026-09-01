import { type ReactNode } from 'react';

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
}

export function Field({ label, children }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 12.5, fontWeight: 600, color: '#3f3f46' }}>{label}</label>
      {children}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  height: 40, borderRadius: 10, border: '1px solid #e4e4e7',
  padding: '0 12px', fontSize: 13.5, fontFamily: "'Manrope', system-ui, sans-serif",
  background: '#fafafa', color: '#18181b', width: '100%',
};

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputBase, ...props.style }} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} style={{ ...inputBase, ...props.style }} />;
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

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', loading }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} width={400}>
      <ModalTitle>{title}</ModalTitle>
      {message && (
        <div style={{ fontSize: 13.5, color: '#52525b', marginBottom: 4 }}>{message}</div>
      )}
      <ModalActions>
        <BtnSecondary onClick={onClose}>Cancel</BtnSecondary>
        <BtnPrimary onClick={onConfirm} disabled={loading} style={{ background: loading ? '#a1a1aa' : '#dc2626' }}>
          {loading ? 'Deleting…' : confirmLabel}
        </BtnPrimary>
      </ModalActions>
    </Modal>
  );
}
