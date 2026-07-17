import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { createEventSource, type ApiOrder } from '../services/api';
import { getStoredToken } from '../lib/authStorage';

interface Notification {
  id: string;
  type: 'order_new' | 'order_status' | 'info';
  title: string;
  body: string;
  ts: number;
}

interface Ctx {
  notifications: Notification[];
  dismiss: (id: string) => void;
}

const NotifCtx = createContext<Ctx>({ notifications: [], dismiss: () => {} });
export const useNotifications = () => useContext(NotifCtx);

let _uid = 0;
const uid = () => String(++_uid);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes]   = useState<Notification[]>([]);
  const esRef               = useRef<{ close: () => void } | null>(null);
  const token               = getStoredToken();

  const add = useCallback((n: Omit<Notification, 'id' | 'ts'>) => {
    const note = { ...n, id: uid(), ts: Date.now() };
    setNotes(prev => [note, ...prev].slice(0, 20));
    // auto-dismiss after 6s
    setTimeout(() => setNotes(p => p.filter(x => x.id !== note.id)), 6000);
  }, []);

  useEffect(() => {
    if (!token) return;
    if (esRef.current) esRef.current.close();

    const handler = (type: string, data: unknown) => {
      const o = data as ApiOrder;
      if (type === 'order_new') {
        add({ type: 'order_new', title: '🔔 Nueva orden', body: `Mesa ${o.table_name} · Código ${o.code}` });
      } else if (type === 'order_status') {
        const labels: Record<string, string> = { cooking: '👨‍🍳 En cocina', ready: '✅ Lista', closed: '✔ Cerrada', cancelled: '❌ Cancelada' };
        if (labels[o.status]) {
          add({ type: 'order_status', title: labels[o.status], body: `Mesa ${o.table_name} · ${o.code}` });
        }
      }
    };

    esRef.current = createEventSource(handler);
    return () => { esRef.current?.close(); };
  }, [token, add]);

  return (
    <NotifCtx.Provider value={{ notifications: notes, dismiss: id => setNotes(p => p.filter(x => x.id !== id)) }}>
      {children}
      <ToastStack notes={notes} dismiss={id => setNotes(p => p.filter(x => x.id !== id))} />
    </NotifCtx.Provider>
  );
}

function ToastStack({ notes, dismiss }: { notes: Notification[]; dismiss: (id: string) => void }) {
  if (!notes.length) return null;
  return (
    <div className="toast-stack">
      {notes.slice(0, 4).map(n => (
        <div key={n.id} className={`toast toast-${n.type}`} onClick={() => dismiss(n.id)}>
          <strong>{n.title}</strong>
          <span>{n.body}</span>
        </div>
      ))}
    </div>
  );
}
