import { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { MOCK_MGMT_MONTHLY, MOCK_SHIFTS } from '../../data/mockData';
import type { Shift } from '../../types';

const PERIODS = ['Daily', 'Weekly', 'Monthly', 'Quarter', 'Semester', 'Yearly', 'Custom'];
const PIE_COLORS_PAY = ['#10b981', '#C4872A', '#ef4444'];
const PIE_COLORS_CUST = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#6b7280', '#ec4899'];

interface Props { onClose: () => void }

export default function MgmtDetails({ onClose }: Props) {
  const [period, setPeriod] = useState('Monthly');
  const [view, setView] = useState<'stats' | 'shifts' | 'shiftDetail'>('stats');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const d = MOCK_MGMT_MONTHLY;

  if (view === 'shiftDetail' && selectedShift) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-panel modal-xl" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>📊 MastrFlow — Management Details</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button className="back-btn" onClick={() => setView('shifts')}>← Back</button>
            <button className="btn-primary" onClick={() => setView('stats')}>📊 Back to Stats</button>
          </div>

          <div className="form-body">
            <h3 className="shift-detail-title">{selectedShift.name}</h3>
            <p className="shift-detail-date">⏱ {selectedShift.closedAt} <span className="auto-badge">auto-filed</span></p>

            <div className="shift-stats-grid cols-3">
              <div className="shift-stat green"><div className="stat-value">${selectedShift.revenue.toFixed(2)}</div><div className="stat-label">Total Revenue</div></div>
              <div className="shift-stat tan"><div className="stat-value">{selectedShift.ordersClosed}</div><div className="stat-label">Orders Closed</div></div>
              <div className="shift-stat blue"><div className="stat-value">{selectedShift.tablesServed}</div><div className="stat-label">Tables Served</div></div>
              <div className="shift-stat yellow"><div className="stat-value">${(selectedShift.revenue / Math.max(selectedShift.ordersClosed, 1)).toFixed(2)}</div><div className="stat-label">Avg / Order</div></div>
              <div className="shift-stat red"><div className="stat-value">-${selectedShift.cancelledValue.toFixed(2)}</div><div className="stat-label">Cancelled Value</div></div>
              <div className="shift-stat gray"><div className="stat-value">1</div><div className="stat-label">Unique Items</div></div>
            </div>

            <h4 className="section-title">⊕ ITEMS SOLD BY CATEGORY</h4>
            {selectedShift.topItems.map(item => (
              <div key={item.name} className="cat-item-row">
                <div className="cat-label">{item.category}</div>
                <div className="cat-bar-row">
                  <div className="cat-bar-full"><div className="cat-bar-fill" /></div>
                  <span>{item.name}</span>
                  <span className="item-qty">{item.qty}×</span>
                  <span className="item-rev">${item.revenue.toFixed(2)}</span>
                </div>
              </div>
            ))}

            <h4 className="section-title">⇝ PAYMENT METHODS</h4>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {selectedShift.paymentMethods.map(pm => (
                <span key={pm.method} className="pay-method-tag">{pm.method} {pm.count}</span>
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

  if (view === 'shifts') {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-panel modal-xl" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>📊 MastrFlow — Management Details</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button className="back-btn" onClick={() => setView('stats')}>← Back</button>
              <span style={{ fontWeight: 600 }}>All Shifts History</span>
              <span className="cat-count">{MOCK_SHIFTS.length} shifts</span>
            </div>
            <button className="btn-primary" onClick={() => setView('stats')}>📊 Back to Stats</button>
          </div>

          <input className="field-input" type="date" style={{ marginBottom: 8 }} />
          <p className="modal-hint">Showing last 3 days. Click any shift to see detailed information.</p>

          <div className="shift-list">
            {MOCK_SHIFTS.map(shift => (
              <button key={shift.id} className="shift-row-full" onClick={() => { setSelectedShift(shift); setView('shiftDetail'); }}>
                <div className="shift-row-left">
                  <span className="shift-icon">📋</span>
                  <div>
                    <div className="shift-name">{shift.name} <span className="auto-badge">auto</span></div>
                    <div className="shift-sub">
                      <span>{shift.ordersClosed} Orders</span>
                      <span>{shift.tablesServed} Tables</span>
                      <span className="cancelled">—</span>
                    </div>
                    <div className="shift-tops">Top: {shift.topItems.map(i => `${i.name} (${i.qty}+)`).join(' · ')}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="shift-revenue">${shift.revenue.toFixed(2)}</div>
                </div>
                <span className="shift-arrow">›</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel modal-xl" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📊 MastrFlow — Management Details</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Period selector */}
        <div className="period-toolbar">
          <div style={{ display: 'flex', gap: 4 }}>
            {PERIODS.map(p => (
              <button key={p} className={`period-btn ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
            ))}
          </div>
          <button className="icon-btn-sm" onClick={() => setView('shifts')}>📋 All Orders</button>
        </div>

        <div className="date-range-badge">📅 {d.dateRange}</div>

        <div className="vs-period-bar">
          vs previous period: Revenue: <span className="trend-up">▲ {d.revenueChange}%</span> Orders: <span className="trend-up">▲ {d.ordersChange}</span>
        </div>

        {/* KPI cards */}
        <div className="kpi-grid">
          <KpiCard value={d.orders} label="Orders" delta={`▲ ${d.ordersChange}`} color="orange" />
          <KpiCard value={d.avgWait} label="Avg Wait" />
          <KpiCard value={d.avgCook} label="Avg Cook" />
          <KpiCard value={`$${d.totalRevenue.toLocaleString()}`} label="Total Revenue" delta={`▲ ${d.revenueChange}%`} color="green" />
        </div>

        <div className="mgmt-scroll">
          {/* Revenue over time */}
          <h4 className="chart-title">Revenue Over Time</h4>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={d.revenueOverTime}>
              <XAxis dataKey="x" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="current" stroke="#C4872A" strokeWidth={2} dot={false} name="Current" />
              <Line type="monotone" dataKey="previous" stroke="#aaa" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Previous" />
            </LineChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-line brown" /> Current</span>
            <span className="legend-item"><span className="legend-line dashed" /> Previous</span>
          </div>

          {/* Revenue by shift */}
          <h4 className="chart-title">Revenue &amp; Orders by Shift</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={d.revenueByShift}>
              <XAxis dataKey="shift" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 9 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="revenue" fill="#C4872A" name="Revenue" />
              <Bar yAxisId="left" dataKey="prevRevenue" fill="#e8d5b7" name="Prev Revenue" />
              <Bar yAxisId="right" dataKey="orders" fill="#10b981" name="Orders" />
              <Bar yAxisId="right" dataKey="prevOrders" fill="#a7f3d0" name="Prev Orders" />
            </BarChart>
          </ResponsiveContainer>

          {/* Top items sold */}
          <h4 className="chart-title">Top Items Sold</h4>
          <div className="top-items-list">
            {d.topItems.map(item => (
              <div key={item.name} className="top-item-chart-row">
                <span className="top-item-chart-name">{item.name}</span>
                <div className="top-item-bars">
                  <div className="top-bar-current" style={{ width: `${(item.current / 160) * 100}%` }} />
                  <div className="top-bar-prev" style={{ width: `${(item.previous / 160) * 100}%` }} />
                </div>
                <span className="top-item-chart-val">{item.current}</span>
              </div>
            ))}
          </div>

          {/* Pie charts */}
          <div className="pie-row">
            <div className="pie-col">
              <h4 className="chart-title">Payment Methods</h4>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={d.paymentMethods} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                    {d.paymentMethods.map((_, i) => <Cell key={i} fill={PIE_COLORS_PAY[i % PIE_COLORS_PAY.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="pie-col">
              <h4 className="chart-title">Customer Types</h4>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={d.customerTypes} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value">
                    {d.customerTypes.map((_, i) => <Cell key={i} fill={PIE_COLORS_CUST[i % PIE_COLORS_CUST.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v, n) => [`${v}%`, n]} />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Shopping expenses */}
          <h4 className="chart-title">Shopping Expenses <span className="chart-subtitle">Total: {d.shoppingExpensesTotal}</span></h4>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={d.shoppingExpenses}>
              <XAxis dataKey="x" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="current" fill="#f59e0b" name="Current" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="modal-footer">
          <button className="btn-primary w-full">⬇ Save as PDF</button>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ value, label, delta, color }: { value: string | number; label: string; delta?: string; color?: string }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-value ${color ? `kpi-${color}` : ''}`}>{value}</div>
      {delta && <div className={`kpi-delta ${color ? `kpi-${color}` : ''}`}>{delta}</div>}
      <div className="kpi-label">{label}</div>
    </div>
  );
}
