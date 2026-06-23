import { useState } from 'react';
import { MOCK_SHIFTS } from '../../data/mockData';
import type { Shift } from '../../types';

interface Props { onClose: () => void }

export default function TablesZ({ onClose }: Props) {
  const [selected, setSelected] = useState<Shift | null>(null);

  if (selected) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-panel" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Table's Z — Shift History</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <button className="back-btn" onClick={() => setSelected(null)}>← Back to shifts</button>

          <div className="form-body">
            <h3 className="shift-detail-title">{selected.name}</h3>
            <p className="shift-detail-date">{selected.closedAt}</p>

            <div className="shift-stats-grid">
              <div className="shift-stat green">
                <div className="stat-value">${selected.revenue.toFixed(2)}</div>
                <div className="stat-label">Total Revenue</div>
              </div>
              <div className="shift-stat tan">
                <div className="stat-value">{selected.ordersClosed}</div>
                <div className="stat-label">Orders Closed</div>
              </div>
              <div className="shift-stat blue">
                <div className="stat-value">{selected.tablesServed}</div>
                <div className="stat-label">Tables Served</div>
              </div>
            </div>

            {selected.topItems.map(item => (
              <div key={item.name} className="top-item-row">
                <div>
                  <div className="cat-label">{item.category}</div>
                  <div className="top-item-bar-wrap">
                    <div className="top-item-bar" style={{ width: '80%' }} />
                    <span className="top-item-name">{item.name}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className="top-item-qty">{item.qty}×</span>
                  <span className="top-item-rev">${item.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button className="btn-primary w-full">⬇ Save as PDF</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Table's Z — Shift History</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="modal-hint">Shifts are filed automatically at end of shift or when all orders are paid. Click a shift to view details.</p>

        <div className="shift-list">
          {MOCK_SHIFTS.map(shift => (
            <button key={shift.id} className="shift-row" onClick={() => setSelected(shift)}>
              <div>
                <div className="shift-name">{shift.name}</div>
                <div className="shift-date">{shift.closedAt}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="shift-revenue">${shift.revenue.toFixed(2)}</div>
                <div className="shift-orders">{shift.ordersClosed} orders</div>
              </div>
              <span className="shift-arrow">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
