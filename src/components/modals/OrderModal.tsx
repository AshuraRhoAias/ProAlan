import { useState, useMemo } from 'react';
import { MOCK_MENU_ITEMS } from '../../data/mockData';
import type { MenuItem, OrderChannel } from '../../types';

const CHANNEL_COLORS: Record<string, string> = {
  DIRECT: '#6b7280', DIDI: '#f59e0b', UBER: '#10b981', RAPPI: '#ef4444', 'MOB+': '#8b5cf6',
};

// Default modifiers per category — in a real app these come from the menu item
const DEFAULT_MODIFIERS: Record<string, string[]> = {
  Burgers: ['LECHUGA', 'JITOMATE', 'MAYONESA', 'PEPINILLOS ARTESANALES', 'CEBOLLA ASADA', 'MOSTAZA', 'KETCHUP', 'SALSA ESPECIAL', 'QUESO EXTRA', 'BACON EXTRA'],
  Sides: ['SAL', 'SALSA RANCH', 'SALSA BBQ', 'KETCHUP'],
  Mains: ['SIN SAL', 'TÉRMINO 3/4', 'BIEN COCIDO', 'TÉRMINO MEDIO'],
  Drinks: ['SIN HIELO', 'CON LIMÓN', 'EXTRA AZÚCAR'],
};

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  modifiers: string[];       // included
  removedModifiers: string[]; // removed from default
  notes: string;
}

interface Props {
  tableName: string;
  customerTypes: OrderChannel[];
  onConfirm: (channel: OrderChannel, items: CartItem[]) => void;
  onClose: () => void;
}

type Step = 'type' | 'menu';

export default function OrderModal({ tableName, customerTypes, onConfirm, onClose }: Props) {
  const [step, setStep] = useState<Step>('type');
  const [channel, setChannel] = useState<OrderChannel | null>(null);
  const [catFilter, setCatFilter] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customizing, setCustomizing] = useState<MenuItem | null>(null);
  const [showCart, setShowCart] = useState(false);

  const categories = useMemo(() => {
    const cats = [...new Set(MOCK_MENU_ITEMS.map(i => i.category))];
    return ['All', ...cats];
  }, []);

  const filtered = catFilter === 'All'
    ? MOCK_MENU_ITEMS.filter(i => i.available)
    : MOCK_MENU_ITEMS.filter(i => i.category === catFilter && i.available);

  const cartTotal = cart.reduce((sum, ci) => sum + ci.menuItem.price * ci.quantity, 0);
  const cartCount = cart.reduce((sum, ci) => sum + ci.quantity, 0);

  const addToCart = (item: MenuItem, mods: string[], removed: string[], notes: string) => {
    setCart(prev => {
      const existIdx = prev.findIndex(
        ci => ci.menuItem.id === item.id &&
          JSON.stringify(ci.modifiers) === JSON.stringify(mods) &&
          JSON.stringify(ci.removedModifiers) === JSON.stringify(removed)
      );
      if (existIdx >= 0) {
        const next = [...prev];
        next[existIdx] = { ...next[existIdx], quantity: next[existIdx].quantity + 1 };
        return next;
      }
      return [...prev, { menuItem: item, quantity: 1, modifiers: mods, removedModifiers: removed, notes }];
    });
    setCustomizing(null);
  };

  const removeFromCart = (idx: number) => {
    setCart(prev => {
      const next = [...prev];
      if (next[idx].quantity > 1) {
        next[idx] = { ...next[idx], quantity: next[idx].quantity - 1 };
      } else {
        next.splice(idx, 1);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    if (channel && cart.length > 0) onConfirm(channel, cart);
  };

  // ── Step 1: choose customer type ──
  if (step === 'type') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-panel" style={{ maxWidth: 340 }} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>New Order — {tableName}</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="form-body">
            <label className="field-label">Select Customer Type</label>
            <div className="ctype-select-grid">
              {customerTypes.map(ch => (
                <button
                  key={ch}
                  className={`ctype-select-btn ${channel === ch ? 'ctype-selected' : ''}`}
                  style={{ borderColor: channel === ch ? 'var(--amber)' : 'var(--border)' }}
                  onClick={() => setChannel(ch)}
                >
                  <span className="ctype-dot" style={{ background: CHANNEL_COLORS[ch] }} />
                  {ch}
                  {channel === ch && <span style={{ marginLeft: 'auto', color: 'var(--amber)' }}>✓</span>}
                </button>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-ghost" onClick={onClose}>Cancel</button>
              <button
                className="btn-primary"
                style={{ flex: 1, opacity: channel ? 1 : 0.45 }}
                disabled={!channel}
                onClick={() => channel && setStep('menu')}
              >
                Continue →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: menu selection ──
  return (
    <>
      <div className="modal-overlay order-full-overlay" onClick={onClose}>
        <div className="order-modal" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="order-modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="back-btn" style={{ padding: 0 }} onClick={() => setStep('type')}>←</button>
              <div>
                <h2 style={{ margin: 0, fontSize: 16 }}>{tableName}</h2>
                <span className="channel-tag" style={{ borderColor: CHANNEL_COLORS[channel!], fontSize: 11 }}>{channel}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className="cart-fab-sm" onClick={() => setShowCart(v => !v)}>
                🛒 {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                {cartTotal > 0 && <span style={{ marginLeft: 4 }}>${cartTotal.toFixed(2)}</span>}
              </button>
              <button className="modal-close" onClick={onClose}>×</button>
            </div>
          </div>

          {/* Category tabs */}
          <div className="order-cat-bar">
            {categories.map(c => (
              <button
                key={c}
                className={`cat-btn ${catFilter === c ? 'active' : ''}`}
                onClick={() => setCatFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Menu grid */}
          <div className="order-menu-grid">
            {filtered.map(item => {
              const inCart = cart.filter(ci => ci.menuItem.id === item.id).reduce((s, ci) => s + ci.quantity, 0);
              return (
                <div
                  key={item.id}
                  className={`menu-product-card ${inCart > 0 ? 'in-cart' : ''}`}
                  onClick={() => setCustomizing(item)}
                >
                  <div className="menu-product-img">
                    <span style={{ fontSize: 28 }}>🍔</span>
                  </div>
                  <div className="menu-product-body">
                    <div className="menu-product-name">{item.name}</div>
                    {item.description && (
                      <div className="menu-product-desc">{item.description}</div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                      <span className="menu-product-price">${item.price}</span>
                      {inCart > 0 && (
                        <span className="in-cart-badge">{inCart} in order</span>
                      )}
                    </div>
                    {item.allergens.length > 0 && (
                      <div className="allergen-mini">
                        {item.allergens.map(a => <span key={a} className="allergen-mini-tag">{a}</span>)}
                      </div>
                    )}
                  </div>
                  <button
                    className="add-item-btn"
                    onClick={e => { e.stopPropagation(); setCustomizing(item); }}
                  >
                    +
                  </button>
                </div>
              );
            })}
          </div>

          {/* Bottom confirm bar */}
          {cart.length > 0 && (
            <div className="order-bottom-bar">
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {cartCount} item{cartCount !== 1 ? 's' : ''} · ${cartTotal.toFixed(2)}
              </div>
              <button className="btn-primary" onClick={handleConfirm} style={{ minWidth: 140 }}>
                Send to Kitchen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cart drawer */}
      {showCart && (
        <CartDrawer
          cart={cart}
          total={cartTotal}
          onRemove={removeFromCart}
          onClose={() => setShowCart(false)}
          onConfirm={handleConfirm}
        />
      )}

      {/* Item customization modal */}
      {customizing && (
        <ItemCustomizer
          item={customizing}
          defaultMods={DEFAULT_MODIFIERS[customizing.category] || []}
          onAdd={addToCart}
          onClose={() => setCustomizing(null)}
        />
      )}
    </>
  );
}

/* ── Item Customizer ── */
function ItemCustomizer({ item, defaultMods, onAdd, onClose }: {
  item: MenuItem;
  defaultMods: string[];
  onAdd: (item: MenuItem, mods: string[], removed: string[], notes: string) => void;
  onClose: () => void;
}) {
  // All default mods start as included
  const [included, setIncluded] = useState<Record<string, boolean>>(
    Object.fromEntries(defaultMods.map(m => [m, true]))
  );
  const [extras, setExtras] = useState<string[]>([]);
  const [extraInput, setExtraInput] = useState('');
  const [notes, setNotes] = useState('');
  const [qty, setQty] = useState(1);

  const toggleMod = (m: string) => setIncluded(prev => ({ ...prev, [m]: !prev[m] }));

  const addExtra = () => {
    const t = extraInput.trim().toUpperCase();
    if (t && !extras.includes(t) && !defaultMods.includes(t)) {
      setExtras(prev => [...prev, t]);
    }
    setExtraInput('');
  };

  const handleAdd = () => {
    const activeMods = [
      ...defaultMods.filter(m => included[m]),
      ...extras,
    ];
    const removedMods = defaultMods.filter(m => !included[m]);
    // Add qty times
    for (let i = 0; i < qty; i++) {
      onAdd(item, activeMods, removedMods, notes);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 300 }} onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: 16 }}>{item.name}</h2>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.category} · ${item.price}</div>
          </div>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {item.description && (
          <p style={{ padding: '6px 20px', fontSize: 12, color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
            {item.description}
          </p>
        )}

        <div className="form-body">
          {/* Default ingredients */}
          {defaultMods.length > 0 && (
            <div className="field-group">
              <label className="field-label">Ingredients</label>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                Tap to remove an ingredient from this item
              </p>
              <div className="modifier-toggle-grid">
                {defaultMods.map(m => (
                  <button
                    key={m}
                    className={`mod-toggle-btn ${!included[m] ? 'mod-removed' : ''}`}
                    onClick={() => toggleMod(m)}
                  >
                    {!included[m] ? <s>{m}</s> : m}
                    {!included[m] && <span className="mod-no-badge">NO</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Extra ingredients */}
          <div className="field-group">
            <label className="field-label">Add Extra</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                className="field-input"
                value={extraInput}
                onChange={e => setExtraInput(e.target.value)}
                placeholder="e.g. EXTRA QUESO"
                onKeyDown={e => e.key === 'Enter' && addExtra()}
              />
              <button className="icon-btn" onClick={addExtra}>+</button>
            </div>
            {extras.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {extras.map(e => (
                  <span
                    key={e}
                    className="allergen-tag"
                    style={{ background: '#d1fae5', borderColor: '#6ee7b7', color: '#065f46' }}
                    onClick={() => setExtras(prev => prev.filter(x => x !== e))}
                  >
                    + {e} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="field-group">
            <label className="field-label">Special Instructions</label>
            <input
              className="field-input"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. well done, no salt…"
            />
          </div>

          {/* Quantity */}
          <div className="field-group">
            <label className="field-label">Quantity</label>
            <div className="qty-control">
              <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q - 1))}>−</button>
              <span className="qty-display">{qty}</span>
              <button className="qty-btn" onClick={() => setQty(q => q + 1)}>+</button>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary w-full" onClick={handleAdd}>
            Add {qty > 1 ? `${qty}× ` : ''}to Order · ${(item.price * qty).toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Cart Drawer ── */
function CartDrawer({ cart, total, onRemove, onClose, onConfirm }: {
  cart: CartItem[];
  total: number;
  onRemove: (idx: number) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="modal-overlay" style={{ zIndex: 250 }} onClick={onClose}>
      <div className="cart-drawer" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🛒 Order Summary</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="form-body" style={{ flex: 1, overflowY: 'auto' }}>
          {cart.map((ci, i) => (
            <div key={i} className="cart-item-row">
              <div className="cart-item-main">
                <div className="cart-item-qty">{ci.quantity}×</div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{ci.menuItem.name}</div>
                  {ci.removedModifiers.length > 0 && (
                    <div className="cart-item-removed">
                      {ci.removedModifiers.map(m => <span key={m}>NO {m}</span>)}
                    </div>
                  )}
                  {ci.modifiers.filter(m => !['LECHUGA','JITOMATE','MAYONESA','PEPINILLOS ARTESANALES','CEBOLLA ASADA','MOSTAZA','KETCHUP','SALSA ESPECIAL'].includes(m)).map(m => (
                    <div key={m} className="cart-item-extra">+ {m}</div>
                  ))}
                  {ci.notes && <div className="cart-item-notes">📝 {ci.notes}</div>}
                </div>
                <div className="cart-item-price">${(ci.menuItem.price * ci.quantity).toFixed(2)}</div>
              </div>
              <button className="icon-btn-sm text-red" onClick={() => onRemove(i)}>−</button>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <div className="cart-total-row">
            <span>Total</span>
            <span className="cart-total-val">${total.toFixed(2)}</span>
          </div>
          <button className="btn-primary w-full" style={{ marginTop: 10 }} onClick={onConfirm}>
            Send to Kitchen
          </button>
        </div>
      </div>
    </div>
  );
}
