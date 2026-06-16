import { useState, useEffect } from 'react';
import { MOCK_ORDERS, MOCK_KITCHEN_TIMERS } from '../data/mockData';
import type { Order, KDSTab, KitchenTimer } from '../types';

export default function Kitchen() {
  const [tab, setTab] = useState<KDSTab>('waiting');
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [showTimers, setShowTimers] = useState(false);
  const [timers, setTimers] = useState<KitchenTimer[]>(MOCK_KITCHEN_TIMERS);

  const waiting = orders.filter(o => o.status === 'waiting');
  const cooking = orders.filter(o => o.status === 'cooking');
  const ready = orders.filter(o => o.status === 'ready');

  const current = tab === 'waiting' ? waiting : tab === 'cooking' ? cooking : ready;

  const moveToNext = (orderId: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id !== orderId) return o;
      if (o.status === 'waiting') return { ...o, status: 'cooking', startedAt: new Date() };
      if (o.status === 'cooking') return { ...o, status: 'ready', readyAt: new Date() };
      return o;
    }));
  };

  return (
    <div className="kitchen-page">
      <div className="kds-header">
        <div className="kds-tabs-left">
          <ChefBadge />
          <TabBtn active={tab === 'waiting'} onClick={() => setTab('waiting')} color="amber" label="Waiting" count={waiting.length} />
          <span className="kds-divider">— {current.length} order{current.length !== 1 ? 's' : ''}</span>
        </div>
        <div className="kds-status-right">
          <span className="live-dot" /> Live
        </div>
      </div>

      {/* Side tab switchers */}
      <div className="kds-body">
        <SideArrow side="left" count={waiting.length} active={tab === 'waiting'} onClick={() => setTab('waiting')} />

        <div className="kds-cards">
          {tab === 'waiting' && waiting.map(o => (
            <OrderCard key={o.id} order={o} actionLabel="Start Cooking" onAction={moveToNext} />
          ))}
          {tab === 'cooking' && cooking.map(o => (
            <OrderCard key={o.id} order={o} actionLabel={`Mark Ready (0/0)`} onAction={moveToNext} variant="cooking" />
          ))}
          {tab === 'ready' && ready.map(o => (
            <OrderCard key={o.id} order={o} actionLabel="Close Order" onAction={moveToNext} variant="ready" />
          ))}
          {current.length === 0 && (
            <div className="kds-empty">No orders in this state</div>
          )}
        </div>

        <SideArrow side="right" count={ready.length} active={tab === 'ready'} onClick={() => setTab('ready')} />
      </div>

      {/* Bottom status bar */}
      <div className="kds-bottom-bar">
        <TabPill label="Waiting" count={waiting.length} active={tab === 'waiting'} onClick={() => setTab('waiting')} />
        <TabPill label="Cooking" count={cooking.length} active={tab === 'cooking'} onClick={() => setTab('cooking')} />
        <TabPill label="Ready" count={ready.length} active={tab === 'ready'} onClick={() => setTab('ready')} />
      </div>

      {/* Kitchen timers floating panel */}
      <button className="timers-fab" onClick={() => setShowTimers(v => !v)} title="Kitchen Timers">
        <TimerIcon />
      </button>
      {showTimers && (
        <KitchenTimersPanel timers={timers} setTimers={setTimers} onClose={() => setShowTimers(false)} />
      )}
    </div>
  );
}

function OrderCard({ order, actionLabel, onAction, variant }: {
  order: Order;
  actionLabel: string;
  onAction: (id: string) => void;
  variant?: 'cooking' | 'ready';
}) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, '0');
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;

  return (
    <div className={`order-card ${variant || ''}`}>
      <div className="order-card-header">
        <span className="order-table">{order.tableName}</span>
        <span className="order-timer">⏱ {pad(mins)}:{pad(secs)}</span>
      </div>
      {order.items.map((item, i) => (
        <div key={i} className="order-item-block">
          <div className="order-item-category">{item.category}</div>
          <div className="order-item-name">{item.quantity}× {item.name}</div>
          {item.modifiers.length > 0 && (
            <div className="order-modifiers">
              {item.modifiers.map(m => (
                <span key={m} className="modifier-tag">✓ {m}</span>
              ))}
            </div>
          )}
        </div>
      ))}
      <button
        className={`order-action-btn ${variant === 'cooking' ? 'btn-cooking' : variant === 'ready' ? 'btn-ready' : 'btn-primary'}`}
        onClick={() => onAction(order.id)}
      >
        {actionLabel}
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
        <div style={{ display: 'flex', gap: '4px' }}>
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
                <circle
                  cx="26" cy="26" r="22" fill="none"
                  stroke={t.elapsed >= t.seconds ? '#ef4444' : '#C4872A'}
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
      <input type="range" className="timers-scroll" style={{ width: '100%', marginTop: 4 }} />
    </div>
  );
}

function ChefBadge() {
  return (
    <div className="chef-badge">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#C4872A" strokeWidth="1.4">
        <circle cx="9" cy="6" r="4"/>
        <path d="M5 10h8l-1 6H6l-1-6z"/>
        <path d="M6 13h6" strokeLinecap="round"/>
      </svg>
    </div>
  );
}

function TabBtn({ active, onClick, color, label }: { active: boolean; onClick: () => void; color: string; label: string; count: number }) {
  return (
    <button
      className={`kds-tab-btn ${active ? `kds-tab-${color}` : ''}`}
      onClick={onClick}
    >
      {active && <span className="tab-spinner">⏱</span>}
      {label}
    </button>
  );
}

function TabPill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button className={`kds-pill ${active ? 'kds-pill-active' : ''}`} onClick={onClick}>
      {label} {count}
    </button>
  );
}

function SideArrow({ side, count, onClick }: { side: 'left' | 'right'; count: number; active: boolean; onClick: () => void }) {
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
