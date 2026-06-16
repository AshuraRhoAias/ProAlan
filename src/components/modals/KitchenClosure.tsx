import { useState } from 'react';
import { MOCK_SHIFTS } from '../../data/mockData';
import type { Shift } from '../../types';

interface Props { onClose: () => void }

const fmtTime = (secs?: number) => {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
};

export default function KitchenClosure({ onClose }: Props) {
  const [selected, setSelected] = useState<Shift | null>(null);

  if (selected) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-panel" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>🧑‍🍳 Kitchen Closure — History</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <button className="back-btn" onClick={() => setSelected(null)}>← Back to shifts</button>

          <div className="form-body">
            <h3 className="shift-detail-title">{selected.name}</h3>
            <p className="shift-detail-date">{selected.closedAt}</p>

            <div className="kitchen-stats-grid">
              <div className="kitchen-stat blue">
                <div className="stat-value-lg">{fmtTime(selected.avgWaitTime)}</div>
                <div className="stat-label">Avg. Wait Time</div>
              </div>
              <div className="kitchen-stat amber">
                <div className="stat-value-lg">{fmtTime(selected.avgCookTime)}</div>
                <div className="stat-label">Avg. Cook Time</div>
              </div>
            </div>

            <div className="kitchen-stat-full">
              <div className="stat-value-lg orange">{selected.ordersClosed}</div>
              <div className="stat-label">Orders This Shift</div>
            </div>

            <div className="items-prepared-section">
              <h4 className="section-title">ITEMS PREPARED</h4>
              {selected.topItems.map(item => (
                <div key={item.name} className="prepared-row">
                  <span className="prepared-name">{item.name}</span>
                  <span className="prepared-cat">{item.category}</span>
                  <span className="prepared-qty">{item.qty}×</span>
                </div>
              ))}
            </div>
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
          <h2>🧑‍🍳 Kitchen Closure — History</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="modal-hint">Kitchen closures are filed automatically at shift end. Click a shift to view details.</p>

        <div className="shift-list">
          {MOCK_SHIFTS.map(shift => (
            <button key={shift.id} className="shift-row" onClick={() => setSelected(shift)}>
              <div>
                <div className="shift-name">{shift.name}</div>
                <div className="shift-date">{shift.closedAt}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="shift-orders orange">{shift.ordersClosed} orders</div>
                <div className="shift-avg">avg {fmtTime(shift.avgCookTime)}</div>
              </div>
              <span className="shift-arrow">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
