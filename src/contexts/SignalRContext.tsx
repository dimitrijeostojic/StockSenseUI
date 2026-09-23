import { createContext, useEffect, useRef, type ReactNode } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { BASE_URL } from '../api/client';

createContext<null>(null);

interface LowStockPayload {
  productName: string;
  currentStock: number;
}

export function SignalRProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      connectionRef.current?.stop();
      connectionRef.current = null;
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}/notifications`, {
        accessTokenFactory: () => localStorage.getItem('accessToken') ?? '',
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on('LowStockAlert', ({ productName, currentStock }: LowStockPayload) => {
      showToast(`Low stock alert: ${productName} (${currentStock} remaining)`);
    });

    connection.start().catch(err => console.error('SignalR connection failed:', err));
    connectionRef.current = connection;

    return () => {
      connection.stop();
      connectionRef.current = null;
    };
  }, [isAuthenticated, showToast]);

  return <>{children}</>;
}
