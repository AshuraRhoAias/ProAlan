import { useState, useEffect, useCallback } from 'react';
import { MOCK_KITCHEN_TIMERS } from '../data/mockData';
import { ordersApi, createEventSource, type ApiOrder } from '../services/api';
import type { KDSTab, KitchenTimer } from '../types';

// Map server order shape to a simple local shape for KDS
type KDSOrder = {
  id: number; code: string; tableName: string; status: string;
  createdAt: string;
  items: { id: number; name: string; qty: number; notes: string }[];
};

function toKDS(o: ApiOrder): KDSOrder {
  return {
    id: o.id, code: o.code, tableName: o.table_name, status: o.status,
    createdAt: o.created_at,
    items: (o.items ?? []).map(i => ({ id: i.id, name: i.menu_item_name, qty: i.quantity, notes: i.notes })),
  };
}

export default function Kitchen() {
  const [tab, setTab]           = useState<KDSTab>('waiting');
  const [orders, setOrders]     = useState<KDSOrder[]>([]);
  const [showTimers, setShowTimers] = useState(false);
  const [timers, setTimers]     = useState<KitchenTimer[]>(MOCK_KITCHEN_TIMERS);

  const load = useCallback(async () => {
    const active = await ordersApi.getAll().catch(() => [] as ApiOrder[]);
    const detailed = await Promise.all(
      active
        .filter(o => ['waiting','cooking','ready'].includes(o.status))
        .map(o => ordersApi.getById(o.id).catch(() => o as ApiOrder))
    );
    setOrders(detailed.map(toKDS));
  }, []);

  useEffect(() => {
    load();
    const es = createEventSource((type) => {
      if (type === 'order_new' || type === 'order_status') load();
    });
    return () => es.close();
  }, [load]);

  const waiting = orders.filter(o => o.status === 'waiting');
  const cooking = orders.filter(o => o.status === 'cooking');
  const ready   = orders.filter(o => o.status === 'ready');

  const moveToNext = async (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    const next = order.status === 'waiting' ? 'cooking' : order.status === 'cooking' ? 'ready' : 'closed';
    await ordersApi.updateStatus(orderId, next).catch(() => {});
    if (next === 'closed') {
      setOrders(p => p.filter(o => o.id !== orderId));
    } else {
      setOrders(p => p.map(o => o.id === orderId ? { ...o, status: next } : o));
    }
  };

  const currentOrders = tab === 'waiting' ? waiting : tab === 'cooking' ? cooking : ready;

  return (
    <div className="kitchen-page">
      <div className="kds-header">
        <div className="kds-tabs-left">
          <ChefBadge />
          <button
            className={`kds-tab-btn ${tab === 'waiting' ? 'kds-tab-amber' : ''}`}
            onClick={() => setTab('waiting')}
          >
            {tab === 'waiting' && <span>⏱</span>} Waiting
          </button>
          <span className="kds-divider">— {currentOrders.length} order{currentOrders.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="kds-status-right">
          <span className="live-dot" /> Live
        </div>
      </div>

      <div className="kds-body">
        <SideArrow side="left" count={waiting.length} onClick={() => setTab('waiting')} />

        <div className="kds-cards">
          {tab === 'waiting' && waiting.map(o => (
            <OrderCard key={o.id} order={o} actionLabel="Start Cooking" onAction={moveToNext} />
          ))}
          {tab === 'cooking' && cooking.map(o => (
            <OrderCard key={o.id} order={o} actionLabel="Mark Ready" onAction={moveToNext} variant="cooking" showCheckboxes />
          ))}
          {tab === 'ready' && ready.map(o => (
            <OrderCard key={o.id} order={o} actionLabel="Close Order" onAction={moveToNext} variant="ready" />
          ))}
          {currentOrders.length === 0 && (
            <div className="kds-empty">No orders in this state</div>
          )}
        </div>

        <SideArrow side="right" count={ready.length} onClick={() => setTab('ready')} />
      </div>

      <div className="kds-bottom-bar">
        <button className={`kds-pill ${tab === 'waiting' ? 'kds-pill-active' : ''}`} onClick={() => setTab('waiting')}>
          Waiting {waiting.length}
        </button>
        <button className={`kds-pill ${tab === 'cooking' ? 'kds-pill-active' : ''}`} onClick={() => setTab('cooking')}>
          Cooking {cooking.length}
        </button>
        <button className={`kds-pill ${tab === 'ready' ? 'kds-pill-active' : ''}`} onClick={() => setTab('ready')}>
          Ready {ready.length}
        </button>
      </div>

      <button className="timers-fab" onClick={() => setShowTimers(v => !v)} title="Kitchen Timers">
        <TimerIcon />
      </button>
      {showTimers && (
        <KitchenTimersPanel timers={timers} setTimers={setTimers} onClose={() => setShowTimers(false)} />
      )}
    </div>
  );
}

function OrderCard({ order, actionLabel, onAction, variant, showCheckboxes }: {
  order: KDSOrder;
  actionLabel: string;
  onAction: (id: number) => void;
  variant?: 'cooking' | 'ready';
  showCheckboxes?: boolean;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  const allChecked = showCheckboxes
    ? order.items.every((_, i) => checked[i])
    : true;

  const toggleCheck = (i: number) => setChecked(prev => ({ ...prev, [i]: !prev[i] }));

  return (
    <div className={`order-card ${variant || ''}`}>
      <div className="order-card-header">
        <span className="order-table">{order.tableName} <small>#{order.code}</small></span>
        <span className="order-timer">⏱ {pad(mins)}:{pad(secs)}</span>
      </div>

      {order.items.map((item, i) => (
        <div key={item.id} className="order-item-block">
          {showCheckboxes ? (
            <label className="checkbox-item" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                className="kitchen-checkbox"
                checked={!!checked[i]}
                onChange={() => toggleCheck(i)}
              />
              <span className="order-item-name">{item.qty}× {item.name}</span>
            </label>
          ) : (
            <div className="order-item-name">{item.qty}× {item.name}</div>
          )}
          {item.notes && <div className="order-item-notes">📝 {item.notes}</div>}
        </div>
      ))}

      <button
        className={`order-action-btn ${variant === 'cooking' ? 'btn-cooking' : variant === 'ready' ? 'btn-primary' : 'btn-primary'}`}
        onClick={() => allChecked && onAction(order.id)}
        disabled={!allChecked}
        style={{ opacity: allChecked ? 1 : 0.45, cursor: allChecked ? 'pointer' : 'not-allowed', width: '100%' }}
      >
        {showCheckboxes && !allChecked
          ? `Mark Ready (${Object.values(checked).filter(Boolean).length}/${order.items.length})`
          : actionLabel}
      </button>
    </div>
  );
}

function KitchenTimersPanel({ timers, setTimers, onClose }: {
  timers: KitchenTimer[];
  setTimers: React.Dispatch<React.SetStateAction<KitchenTimer[]>>;
  onClose: () => void;
}) {
  useEffect(() => {
    const id = setInterval(() => {
      setTimers(prev => prev.map(t =>
        t.running && t.elapsed < t.seconds
          ? { ...t, elapsed: t.elapsed + 1 }
          : t.running && t.elapsed >= t.seconds
          ? { ...t, running: false }
          : t
      ));
    }, 1000);
    return () => clearInterval(id);
  }, [setTimers]);

  const toggle = (id: string) => setTimers(prev => prev.map(t => t.id === id ? { ...t, running: !t.running } : t));
  const reset = (id: string) => setTimers(prev => prev.map(t => t.id === id ? { ...t, elapsed: 0, running: false } : t));

  const fmt = (t: KitchenTimer) => {
    const rem = t.seconds - t.elapsed;
    const m = Math.floor(Math.abs(rem) / 60);
    const s = Math.abs(rem) % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const pct = (t: KitchenTimer) => Math.min((t.elapsed / t.seconds) * 100, 100);

  return (
    <div className="timers-panel">
      <div className="timers-panel-header">
        <span>🔥 Kitchen Timers</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="icon-btn-sm">+</button>
          <button className="icon-btn-sm" onClick={onClose}>×</button>
        </div>
      </div>
      <div className="timers-grid">
        {timers.map(t => (
          <div key={t.id} className="timer-item">
            <div className="timer-ring-wrapper">
              <svg width="52" height="52" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="22" fill="none" stroke="#e5e0d8" strokeWidth="4"/>
                <circle cx="26" cy="26" r="22" fill="none"
                  stroke={t.elapsed >= t.seconds ? '#ef4444' : 'var(--amber)'}
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct(t) / 100)}`}
                  strokeLinecap="round"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                />
              </svg>
              <span className="timer-display">{fmt(t)}</span>
            </div>
            <span className="timer-label">{t.label}</span>
            <div className="timer-controls">
              <button className="icon-btn-sm" onClick={() => toggle(t.id)}>{t.running ? '⏸' : '▶'}</button>
              <button className="icon-btn-sm" onClick={() => reset(t.id)}>↺</button>
              <button className="icon-btn-sm">✎</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChefBadge() {
  return (
    <div className="chef-badge">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--amber)" strokeWidth="1.4">
        <circle cx="9" cy="6" r="4"/>
        <path d="M5 10h8l-1 6H6l-1-6z"/>
        <path d="M6 13h6" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function SideArrow({ side, count, onClick }: { side: 'left' | 'right'; count: number; onClick: () => void }) {
  return (
    <button className={`kds-side-arrow ${side}`} onClick={onClick}>
      <span className="side-arrow-icon">{side === 'left' ? '‹' : '›'}</span>
      {count > 0 && <span className="side-arrow-badge">{count}</span>}
    </button>
  );
}

function TimerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="10" cy="11" r="7"/>
      <path d="M10 7v4l2.5 2.5"/>
      <path d="M8 2h4"/>
    </svg>
  );
}
