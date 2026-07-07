import { useState, useEffect, useCallback } from 'react';
import { ordersApi, menuApi, type ApiOrder, type ApiMenuItem, type ApiOrderItem } from '../../services/api';

interface Props {
  orderId: number;
  currencySymbol?: string;
  onClose: () => void;
  onUpdated: () => void;
}

type PayMethod = 'cash' | 'card' | 'transfer' | 'app';
type Tab = 'items' | 'add' | 'pay';

const STATUS_LABEL: Record<string, string> = {
  waiting: 'Esperando', cooking: 'Cocinando', ready: 'Lista',
  closed: 'Cerrada', cancelled: 'Cancelada',
};
const STATUS_COLOR: Record<string, string> = {
  waiting: '#f59e0b', cooking: '#ef4444', ready: '#10b981',
  closed: '#6b7280', cancelled: '#9ca3af',
};
const PAY_LABEL: Record<PayMethod, string> = {
  cash: '💵 Efectivo', card: '💳 Tarjeta', transfer: '📲 Transferencia', app: '📱 App',
};

export default function OrderDetail({ orderId, currencySymbol = '$', onClose, onUpdated }: Props) {
  const [order,     setOrder]     = useState<ApiOrder | null>(null);
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [tab,       setTab]       = useState<Tab>('items');
  const [tip,       setTip]       = useState(0);
  const [payMethod, setPayMethod] = useState<PayMethod>('cash');
  const [addQty,    setAddQty]    = useState<Record<number, number>>({});
  const [loading,   setLoading]   = useState(false);
  const [msg,       setMsg]       = useState('');

  const refreshOrder = useCallback(() =>
    ordersApi.getById(orderId).then(setOrder).catch(() => setMsg('Error cargando orden')),
  [orderId]);

  useEffect(() => {
    refreshOrder();
    menuApi.getItems().then(setMenuItems).catch(() => {});
  }, [refreshOrder]);

  const subtotal = Number(order?.total ?? 0);
  const grandTotal = subtotal + tip;

  /* ── Actions ───────────────────────────────────────────────── */

  const sendToKitchen = async () => {
    setLoading(true);
    try {
      await ordersApi.updateStatus(orderId, 'cooking');
      await refreshOrder();
      onUpdated();
      setMsg('✔ Enviado a cocina');
    } catch { setMsg('Error al enviar a cocina'); }
    finally { setLoading(false); }
  };

  const handleAddItems = async () => {
    const items = Object.entries(addQty)
      .filter(([, q]) => q > 0)
      .map(([id, quantity]) => {
        const mi = menuItems.find(m => m.id === Number(id));
        return { menu_item_id: Number(id), quantity, unit_price: Number(mi?.price ?? 0) };
      });
    if (!items.length) return;
    setLoading(true);
    try {
      await ordersApi.addItems(orderId, items);
      await refreshOrder();
      setAddQty({});
      setTab('items');
      setMsg('✔ Productos añadidos');
      onUpdated();
    } catch { setMsg('Error al añadir productos'); }
    finally { setLoading(false); }
  };

  const handleCancelItem = async (item: ApiOrderItem) => {
    if (!confirm(`¿Quitar "${item.menu_item_name}" de la orden?`)) return;
    setLoading(true);
    try {
      await ordersApi.cancelItem(orderId, item.id);
      await refreshOrder();
      onUpdated();
    } catch { setMsg('Error al quitar producto'); }
    finally { setLoading(false); }
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      await ordersApi.closeWithTip(orderId, tip, payMethod);
      await refreshOrder();   // muestra orden como "Cerrada" dentro del modal
      setMsg('✔ Orden cobrada — puedes cerrar');
      onUpdated();            // refresca el dashboard (mesa queda libre)
    } catch { setMsg('Error al cobrar la orden'); }
    finally { setLoading(false); }
  };

  const handleCancelOrder = async () => {
    if (!confirm('¿Cancelar TODA la orden?')) return;
    setLoading(true);
    try {
      await ordersApi.cancel(orderId, subtotal);
      await refreshOrder();
      setMsg('✔ Orden cancelada');
      onUpdated();
    } catch { setMsg('Error al cancelar'); }
    finally { setLoading(false); }
  };

  /* ── Render ─────────────────────────────────────────────────── */

  if (!order) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando…</div>
      </div>
    </div>
  );

  const isClosed  = order.status === 'closed' || order.status === 'cancelled';
  const isWaiting = order.status === 'waiting';
  const activeItems  = (order.items ?? []).filter(i => i.status !== 'cancelled');
  const removedItems = (order.items ?? []).filter(i => i.status === 'cancelled');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box order-detail-box" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="od-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="od-title">#{order.code}</h2>
              <span className="od-status-pill" style={{ background: STATUS_COLOR[order.status] + '22', color: STATUS_COLOR[order.status] }}>
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <div className="od-meta">{order.table_name} · {order.customer_type_name}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Send to kitchen banner (only when waiting) ── */}
        {isWaiting && (
          <div className="od-kitchen-banner">
            <span>La orden aún no fue enviada a cocina</span>
            <button className="btn-primary od-kitchen-btn" onClick={sendToKitchen} disabled={loading}>
              {loading ? '…' : '🔥 Enviar a cocina'}
            </button>
          </div>
        )}

        {/* ── Tabs (hidden when closed) ── */}
        {!isClosed && (
          <div className="od-tabs">
            {(['items', 'add', 'pay'] as Tab[]).map(t => (
              <button key={t} className={`od-tab${tab === t ? ' od-tab-active' : ''}`} onClick={() => setTab(t)}>
                {t === 'items' ? '📋 Orden' : t === 'add' ? '➕ Agregar' : '💳 Cobrar'}
              </button>
            ))}
          </div>
        )}

        {/* ══ Tab: ITEMS ══ */}
        {(tab === 'items' || isClosed) && (
          <div className="od-items">
            {activeItems.length === 0 && (
              <p style={{ color: 'var(--text-muted)', padding: '1rem 0', textAlign: 'center' }}>Sin productos activos</p>
            )}
            {activeItems.map(item => (
              <div key={item.id} className="od-item-row">
                <span className="od-item-qty">{item.quantity}×</span>
                <div className="od-item-info">
                  <span className="od-item-name">{item.menu_item_name}</span>
                  {item.modifiers && (
                    <div className="od-item-mods">
                      {item.modifiers.split('||').map((m, i) => {
                        try {
                          const obj = JSON.parse(m);
                          if (obj.type === 'removed')
                            return <span key={i} className="mod-removed">−{obj.name}</span>;
                          return null;
                        } catch { return null; }
                      })}
                    </div>
                  )}
                </div>
                <span className="od-item-price">{currencySymbol}{(item.quantity * Number(item.unit_price)).toFixed(2)}</span>
                {!isClosed && (
                  <button className="od-item-remove" onClick={() => handleCancelItem(item)} disabled={loading} title="Quitar">✕</button>
                )}
              </div>
            ))}

            {removedItems.length > 0 && (
              <div className="od-removed-section">
                {removedItems.map(item => (
                  <div key={item.id} className="od-item-row od-item-cancelled">
                    <span className="od-item-qty">{item.quantity}×</span>
                    <span className="od-item-name">{item.menu_item_name}</span>
                    <span className="od-item-price" style={{ textDecoration: 'line-through', opacity: 0.4 }}>
                      {currencySymbol}{(item.quantity * Number(item.unit_price)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="od-divider" />
            <div className="od-total-row">
              <span>Subtotal</span>
              <span>{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            {order.tip > 0 && (
              <div className="od-total-row">
                <span>Propina</span>
                <span>{currencySymbol}{Number(order.tip).toFixed(2)}</span>
              </div>
            )}
            {isClosed && (
              <div className="od-total-row od-grand">
                <span>Total cobrado</span>
                <span>{currencySymbol}{(subtotal + Number(order.tip)).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* ══ Tab: ADD ITEMS ══ */}
        {tab === 'add' && !isClosed && (
          <div className="od-add">
            <div className="od-menu-list">
              {menuItems.filter(m => m.available).map(m => (
                <div key={m.id} className="od-menu-row">
                  <div className="od-menu-info">
                    <span className="od-menu-name">{m.name}</span>
                    <small className="od-menu-cat">{m.category_name} · {currencySymbol}{Number(m.price).toFixed(2)}</small>
                  </div>
                  <div className="od-qty-ctrl">
                    <button onClick={() => setAddQty(p => ({ ...p, [m.id]: Math.max(0, (p[m.id] ?? 0) - 1) }))}>−</button>
                    <span>{addQty[m.id] ?? 0}</span>
                    <button onClick={() => setAddQty(p => ({ ...p, [m.id]: (p[m.id] ?? 0) + 1 }))}>+</button>
                  </div>
                </div>
              ))}
            </div>
            {Object.values(addQty).some(q => q > 0) && (
              <div className="od-add-summary">
                {currencySymbol}{Object.entries(addQty)
                  .filter(([, q]) => q > 0)
                  .reduce((s, [id, q]) => {
                    const mi = menuItems.find(m => m.id === Number(id));
                    return s + (mi?.price ?? 0) * q;
                  }, 0).toFixed(2)}
              </div>
            )}
            <button
              className="btn-primary od-add-btn"
              onClick={handleAddItems}
              disabled={loading || !Object.values(addQty).some(q => q > 0)}
            >
              {loading ? 'Añadiendo…' : 'Agregar a la orden'}
            </button>
          </div>
        )}

        {/* ══ Tab: PAY ══ */}
        {tab === 'pay' && !isClosed && (
          <div className="od-pay">
            <div className="od-pay-summary">
              <div className="od-total-row">
                <span>Subtotal</span>
                <span>{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>

              <div className="od-tip-section">
                <span className="od-tip-label">Propina</span>
                <div className="tip-btns">
                  {[0, 10, 15, 20].map(pct => {
                    const tipAmt = Math.round(subtotal * pct / 100);
                    return (
                      <button
                        key={pct}
                        className={`tip-btn${tip === tipAmt ? ' tip-btn-active' : ''}`}
                        onClick={() => setTip(tipAmt)}
                      >
                        {pct === 0 ? 'Sin propina' : `${pct}%`}
                      </button>
                    );
                  })}
                </div>
                <input
                  className="tip-input"
                  type="number" min={0} placeholder="Manual…"
                  value={tip || ''}
                  onChange={e => setTip(Number(e.target.value) || 0)}
                />
              </div>

              <div className="od-total-row od-grand">
                <span>Total a cobrar</span>
                <span>{currencySymbol}{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="pay-methods">
              {(['cash', 'card', 'transfer', 'app'] as PayMethod[]).map(m => (
                <button
                  key={m}
                  className={`pay-method-btn${payMethod === m ? ' pay-method-active' : ''}`}
                  onClick={() => setPayMethod(m)}
                >
                  {PAY_LABEL[m]}
                </button>
              ))}
            </div>

            <button className="btn-primary od-pay-btn" onClick={handlePay} disabled={loading}>
              {loading ? 'Procesando…' : `Cobrar ${currencySymbol}${grandTotal.toFixed(2)}`}
            </button>
          </div>
        )}

        {/* ── Message ── */}
        {msg && (
          <div className={`od-msg${msg.startsWith('✔') ? ' od-msg-ok' : ' od-msg-err'}`}>
            {msg}
          </div>
        )}

        {/* ── Footer actions ── */}
        {isClosed ? (
          <button className="btn-primary od-close-btn" onClick={onClose}>
            Cerrar
          </button>
        ) : (
          <button className="od-cancel-link" onClick={handleCancelOrder} disabled={loading}>
            Cancelar orden completa
          </button>
        )}
      </div>
    </div>
  );
}
