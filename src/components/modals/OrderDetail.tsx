import { useState, useEffect } from 'react';
import { ordersApi, menuApi, type ApiOrder, type ApiMenuItem, type ApiOrderItem } from '../../services/api';

interface Props {
  orderId: number;
  currencySymbol?: string;
  onClose: () => void;
  onUpdated: () => void;
}

type PayMethod = 'cash' | 'card' | 'transfer' | 'app';

export default function OrderDetail({ orderId, currencySymbol = '$', onClose, onUpdated }: Props) {
  const [order, setOrder]         = useState<ApiOrder | null>(null);
  const [menuItems, setMenuItems] = useState<ApiMenuItem[]>([]);
  const [tab, setTab]             = useState<'items' | 'add' | 'pay'>('items');
  const [tip, setTip]             = useState(0);
  const [payMethod, setPayMethod] = useState<PayMethod>('cash');
  const [addQty, setAddQty]       = useState<Record<number, number>>({});
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState('');

  useEffect(() => {
    ordersApi.getById(orderId).then(setOrder).catch(() => setMsg('Error cargando orden'));
    menuApi.getItems().then(setMenuItems).catch(() => {});
  }, [orderId]);

  const subtotal = order?.total ?? 0;
  const total    = subtotal + tip;

  const handleAddItems = async () => {
    const items = Object.entries(addQty)
      .filter(([, q]) => q > 0)
      .map(([id, quantity]) => {
        const mi = menuItems.find(m => m.id === Number(id));
        return { menu_item_id: Number(id), quantity, unit_price: mi?.price ?? 0 };
      });
    if (!items.length) return;
    setLoading(true);
    try {
      await ordersApi.addItems(orderId, items);
      const updated = await ordersApi.getById(orderId);
      setOrder(updated);
      setAddQty({});
      setTab('items');
      setMsg('✔ Productos añadidos');
      onUpdated();
    } catch { setMsg('Error al añadir productos'); }
    finally { setLoading(false); }
  };

  const handleClose = async () => {
    setLoading(true);
    try {
      await ordersApi.closeWithTip(orderId, tip, payMethod);
      setMsg('✔ Orden cerrada');
      onUpdated();
      setTimeout(onClose, 800);
    } catch { setMsg('Error al cerrar la orden'); }
    finally { setLoading(false); }
  };

  const handleCancel = async () => {
    if (!confirm('¿Cancelar esta orden?')) return;
    setLoading(true);
    try {
      await ordersApi.cancel(orderId, subtotal);
      onUpdated();
      onClose();
    } catch { setMsg('Error al cancelar'); }
    finally { setLoading(false); }
  };

  if (!order) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <p style={{ padding: '2rem', textAlign: 'center' }}>Cargando…</p>
      </div>
    </div>
  );

  const isClosed = order.status === 'closed' || order.status === 'cancelled';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box order-detail-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="od-header">
          <div>
            <h2 className="od-title">Orden #{order.code}</h2>
            <span className="od-meta">{order.table_name} · {order.customer_type_name} · <StatusBadge s={order.status} /></span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        {!isClosed && (
          <div className="od-tabs">
            {(['items','add','pay'] as const).map(t => (
              <button key={t} className={`od-tab${tab === t ? ' od-tab-active' : ''}`} onClick={() => setTab(t)}>
                {t === 'items' ? '📋 Orden' : t === 'add' ? '➕ Añadir' : '💳 Cobrar'}
              </button>
            ))}
          </div>
        )}

        {/* Tab: items */}
        {tab === 'items' && (
          <div className="od-items">
            {(order.items ?? []).map((item: ApiOrderItem) => (
              <div key={item.id} className="od-item-row">
                <span className="od-item-qty">{item.quantity}×</span>
                <span className="od-item-name">{item.menu_item_name}</span>
                <span className="od-item-price">{currencySymbol}{(item.quantity * item.unit_price).toFixed(2)}</span>
              </div>
            ))}
            <div className="od-total-row">
              <span>Subtotal</span>
              <span>{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            {order.tip > 0 && (
              <div className="od-total-row od-tip-row">
                <span>Propina</span>
                <span>{currencySymbol}{order.tip.toFixed(2)}</span>
              </div>
            )}
            {isClosed && (
              <div className="od-total-row od-grand">
                <span>Total cobrado</span>
                <span>{currencySymbol}{(subtotal + order.tip).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        {/* Tab: add items */}
        {tab === 'add' && !isClosed && (
          <div className="od-add">
            <div className="od-menu-list">
              {menuItems.filter(m => m.available).map(m => (
                <div key={m.id} className="od-menu-row">
                  <div className="od-menu-info">
                    <span>{m.name}</span>
                    <small>{m.category_name} · {currencySymbol}{m.price}</small>
                  </div>
                  <div className="od-qty-ctrl">
                    <button onClick={() => setAddQty(p => ({ ...p, [m.id]: Math.max(0, (p[m.id]??0)-1) }))}>−</button>
                    <span>{addQty[m.id] ?? 0}</span>
                    <button onClick={() => setAddQty(p => ({ ...p, [m.id]: (p[m.id]??0)+1 }))}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn-primary od-add-btn" onClick={handleAddItems} disabled={loading || !Object.values(addQty).some(q => q > 0)}>
              {loading ? 'Añadiendo…' : 'Añadir a la orden'}
            </button>
          </div>
        )}

        {/* Tab: pay */}
        {tab === 'pay' && !isClosed && (
          <div className="od-pay">
            <div className="od-pay-summary">
              <div className="od-total-row"><span>Subtotal</span><span>{currencySymbol}{subtotal.toFixed(2)}</span></div>
              <div className="od-total-row">
                <span>Propina</span>
                <div className="tip-btns">
                  {[0, 10, 15, 20].map(pct => (
                    <button key={pct}
                      className={`tip-btn${tip === Math.round(subtotal * pct / 100) ? ' tip-btn-active' : ''}`}
                      onClick={() => setTip(Math.round(subtotal * pct / 100))}>
                      {pct === 0 ? 'Sin propina' : `${pct}%`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="od-total-row">
                <span>Propina manual</span>
                <input className="tip-input" type="number" min={0} value={tip}
                  onChange={e => setTip(Number(e.target.value))} />
              </div>
              <div className="od-total-row od-grand">
                <span>Total a cobrar</span><span>{currencySymbol}{total.toFixed(2)}</span>
              </div>
            </div>

            <div className="pay-methods">
              {(['cash','card','transfer','app'] as PayMethod[]).map(m => (
                <button key={m} className={`pay-method-btn${payMethod === m ? ' pay-method-active' : ''}`}
                  onClick={() => setPayMethod(m)}>
                  {m === 'cash' ? '💵 Efectivo' : m === 'card' ? '💳 Tarjeta' : m === 'transfer' ? '📲 Transferencia' : '📱 App'}
                </button>
              ))}
            </div>

            <button className="btn-primary od-pay-btn" onClick={handleClose} disabled={loading}>
              {loading ? 'Procesando…' : `Cobrar ${currencySymbol}${total.toFixed(2)}`}
            </button>
          </div>
        )}

        {msg && <p className="od-msg">{msg}</p>}

        {/* Cancel button */}
        {!isClosed && (
          <button className="od-cancel-link" onClick={handleCancel} disabled={loading}>
            Cancelar orden
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ s }: { s: string }) {
  const map: Record<string, string> = {
    waiting: '⏱ Esperando', cooking: '🔥 Cocinando',
    ready: '✅ Lista', closed: '✔ Cerrada', cancelled: '❌ Cancelada',
  };
  return <span className={`status-badge status-${s}`}>{map[s] ?? s}</span>;
}
