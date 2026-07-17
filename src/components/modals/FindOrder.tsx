import { useState } from 'react';
import { MOCK_ORDERS } from '../../data/mockData';

interface Props { onClose: () => void }

export default function FindOrder({ onClose }: Props) {
  const [query, setQuery] = useState('');

  const filtered = MOCK_ORDERS.filter(o =>
    !query ||
    o.code.toLowerCase().includes(query.toLowerCase()) ||
    o.tableName.toLowerCase().includes(query.toLowerCase()) ||
    o.items.some(i => i.name.toLowerCase().includes(query.toLowerCase()))
  );

  const statusColor = (s: string) => {
    if (s === 'waiting') return '#f59e0b';
    if (s === 'cooking') return '#ef4444';
    if (s === 'ready') return '#10b981';
    if (s === 'closed') return '#6b7280';
    return '#C4872A';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔍 Find Order</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="form-body">
          <input
            className="field-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by code, table number, or item name..."
            autoFocus
          />
          <p className="modal-hint">Showing orders from the last 24 hours ({filtered.length} total)</p>

          <div className="order-results">
            {filtered.length === 0 ? (
              <p className="empty-hint">No orders found</p>
            ) : filtered.map(order => (
              <div key={order.id} className="order-result-row">
                <div className="order-result-left">
                  <span className="order-code-badge">{order.code}</span>
                  <div>
                    <div className="order-result-table">{order.tableName}</div>
                    <div className="order-result-time">
                      📅 {order.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} — Jun {order.createdAt.getDate()}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span className="order-status-badge" style={{ backgroundColor: statusColor(order.status) }}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <span className="order-total">${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
