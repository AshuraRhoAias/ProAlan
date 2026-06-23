import { useState } from 'react';
import type { ShoppingItem } from '../../types';

interface Props { onClose: () => void }

export default function ShoppingList({ onClose }: Props) {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [input, setInput] = useState('');
  const [totalSpent, setTotalSpent] = useState('0.00');
  const [hasReceipt, setHasReceipt] = useState(false);

  const addItem = () => {
    if (!input.trim()) return;
    setItems(prev => [...prev, { id: `si${Date.now()}`, name: input.trim(), checked: false }]);
    setInput('');
  };

  const toggleItem = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const deleteItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🛒 Shopping List</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="shopping-live-badge">
          <span className="live-dot" /> Live &amp; shared — all staff see the same list
        </div>

        <div className="form-body">
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="field-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Add an item..."
              onKeyDown={e => e.key === 'Enter' && addItem()}
            />
            <button className="icon-btn" onClick={addItem}>+</button>
          </div>

          <div className="shopping-items">
            {items.length === 0 ? (
              <p className="empty-hint">No items yet</p>
            ) : items.map(item => (
              <div key={item.id} className="shopping-item">
                <button
                  className={`shopping-check ${item.checked ? 'checked' : ''}`}
                  onClick={() => toggleItem(item.id)}
                >
                  {item.checked ? '✓' : ''}
                </button>
                <span className={`shopping-item-name ${item.checked ? 'checked-text' : ''}`}>{item.name}</span>
                <button className="icon-btn-sm text-red" onClick={() => deleteItem(item.id)}>×</button>
              </div>
            ))}
          </div>

          <div className="field-group">
            <label className="field-label">Total Spent (at closure)</label>
            <input
              className="field-input"
              type="number"
              value={totalSpent}
              onChange={e => setTotalSpent(e.target.value)}
              step="0.01"
            />
          </div>

          <div className="field-group">
            <label className="field-label">Receipt / Ticket Photo</label>
            <button className="upload-btn" onClick={() => setHasReceipt(true)}>
              {hasReceipt ? '✓ Photo attached' : '📷 Tap to add photo'}
            </button>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary w-full" onClick={onClose}>
            🚀 Close &amp; Send to Manager
          </button>
        </div>
      </div>
    </div>
  );
}
