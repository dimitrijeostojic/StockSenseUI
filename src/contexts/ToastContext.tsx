import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';

interface ToastContextValue {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, message });
    timerRef.current = setTimeout(() => setToast({ visible: false, message: '' }), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24,
          background: '#18181b', color: '#ffffff',
          padding: '13px 20px', borderRadius: 12,
          fontSize: 13.5, fontWeight: 600,
          boxShadow: '0 10px 30px -10px rgba(0,0,0,0.4)',
          zIndex: 9999,
          fontFamily: "'Manrope', system-ui, sans-serif",
        }}>
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
