import { useState } from 'react';
import { MOCK_TABLES } from '../data/mockData';
import type { Table, OrderChannel } from '../types';

const CHANNEL_COLORS: Record<OrderChannel, string> = {
  DIRECT: '#6b7280',
  DIDI: '#f59e0b',
  UBER: '#10b981',
  RAPPI: '#ef4444',
  'MOB+': '#8b5cf6',
};

interface Props {
  restaurantName: string;
}

export default function Dashboard({ restaurantName }: Props) {
  const [tables, setTables] = useState<Table[]>(MOCK_TABLES);

  const handleOrder = (tableId: string) => {
    setTables(prev => prev.map(t =>
      t.id === tableId
        ? { ...t, status: t.status === 'available' ? 'occupied' : 'available' }
        : t
    ));
  };

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">{restaurantName}</h1>
        <p className="dashboard-subtitle">ORDER AND TABLE MANAGER</p>
      </div>

      <div className="table-grid">
        {tables.map(table => (
          <TableCard key={table.id} table={table} onOrder={handleOrder} />
        ))}
      </div>
    </div>
  );
}

function TableCard({ table, onOrder }: { table: Table; onOrder: (id: string) => void }) {
  const isOccupied = table.status === 'occupied';

  return (
    <div className={`table-card ${isOccupied ? 'occupied' : ''}`}>
      <div className="table-card-header">
        <span className="table-name">{table.name}</span>
        <span className="table-capacity">
          <PeopleIcon /> {table.capacity}
        </span>
      </div>

      <div className="table-status">
        <span className={`status-dot ${isOccupied ? 'dot-occupied' : 'dot-available'}`} />
        <span className="status-label">{isOccupied ? 'Occupied' : 'Available'}</span>
      </div>

      <div className="channel-tags">
        {table.channels.map(ch => (
          <span key={ch} className="channel-tag" style={{ borderColor: CHANNEL_COLORS[ch] }}>
            {ch}
          </span>
        ))}
      </div>

      <button className="btn-primary table-order-btn" onClick={() => onOrder(table.id)}>
        <CartIcon /> Order
      </button>
    </div>
  );
}

function PeopleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
      <circle cx="5" cy="4" r="2"/>
      <circle cx="9" cy="4" r="2"/>
      <path d="M1 12c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4"/>
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <path d="M1 1h2l1.5 7h7l1.5-5H4"/>
      <circle cx="6" cy="12" r="1"/>
      <circle cx="11" cy="12" r="1"/>
    </svg>
  );
}
