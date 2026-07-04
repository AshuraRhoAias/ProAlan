import { useState, useEffect, useCallback } from 'react';
import { restaurantApi, ordersApi, createEventSource, type ApiTable, type ApiCustomerType, type ApiOrder } from '../services/api';
import OrderModal from '../components/modals/OrderModal';
import OrderDetail from '../components/modals/OrderDetail';

const CUSTOMER_TYPE_COLORS: Record<string, string> = {
  DIRECT: '#6b7280', DIDI: '#f59e0b', UBER: '#10b981', RAPPI: '#ef4444', 'MOB+': '#8b5cf6',
};

interface Props { restaurantName: string }

export default function Dashboard({ restaurantName }: Props) {
  const [tables, setTables]               = useState<ApiTable[]>([]);
  const [customerTypes, setCustomerTypes] = useState<ApiCustomerType[]>([]);
  const [activeOrders, setActiveOrders]   = useState<ApiOrder[]>([]);
  const [newOrderTable, setNewOrderTable] = useState<ApiTable | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
  const [currentShiftId, setCurrentShiftId] = useState<number | undefined>();

  const load = useCallback(async () => {
    const [tbls, types, orders, shift] = await Promise.all([
      restaurantApi.getTables().catch(() => []),
      restaurantApi.getCustomerTypes().catch(() => []),
      ordersApi.getAll().catch(() => []),
      restaurantApi.getCurrentShift().catch(() => null),
    ]);
    setTables(tbls);
    setCustomerTypes(types);
    setActiveOrders(orders as ApiOrder[]);
    if (shift) setCurrentShiftId((shift as { id: number }).id);
  }, []);

  useEffect(() => { load(); }, [load]);

  // SSE: refresh on any order event
  useEffect(() => {
    const es = createEventSource((type) => {
      if (['order_new', 'order_status'].includes(type)) load();
    });
    return () => es.close();
  }, [load]);

  const getTableOrder = (tableId: number) =>
    activeOrders.find(o => o.table_id === tableId && ['waiting','cooking','ready'].includes(o.status));

  const handleTableClick = (table: ApiTable) => {
    const order = getTableOrder(table.id);
    if (order) {
      setDetailOrderId(order.id);
    } else {
      setNewOrderTable(table);
    }
  };

  const handleOrderCreated = async () => {
    setNewOrderTable(null);
    await load();
  };

  return (
    <div className="page">
      <div className="dashboard-header">
        <h1 className="dashboard-title">{restaurantName}</h1>
        <p className="dashboard-subtitle">ORDER AND TABLE MANAGER</p>
      </div>

      <div className="table-grid">
        {tables.map(table => {
          const order = getTableOrder(table.id);
          return (
            <TableCard
              key={table.id}
              table={table}
              order={order}
              customerTypes={customerTypes}
              onClick={() => handleTableClick(table)}
            />
          );
        })}
      </div>

      {newOrderTable && (
        <OrderModal
          tableName={newOrderTable.name}
          tableId={newOrderTable.id}
          customerTypes={customerTypes}
          shiftId={currentShiftId}
          onConfirm={handleOrderCreated}
          onClose={() => setNewOrderTable(null)}
        />
      )}

      {detailOrderId !== null && (
        <OrderDetail
          orderId={detailOrderId}
          onClose={() => setDetailOrderId(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}

function TableCard({ table, order, customerTypes, onClick }: {
  table: ApiTable;
  order?: ApiOrder;
  customerTypes: ApiCustomerType[];
  onClick: () => void;
}) {
  const isOccupied = !!order;
  const statusLabel = isOccupied
    ? (order!.status === 'waiting' ? 'Esperando' : order!.status === 'cooking' ? 'Cocinando' : 'Lista')
    : 'Disponible';

  return (
    <div className={`table-card${isOccupied ? ' occupied' : ''}`}>
      <div className="table-card-header">
        <span className="table-name">{table.name}</span>
        <span className="table-capacity"><PeopleIcon /> {table.capacity}</span>
      </div>
      <div className="table-status">
        <span className={`status-dot dot-${isOccupied ? 'occupied' : 'available'}`} />
        <span className="status-label">{statusLabel}</span>
      </div>
      {isOccupied && order && (
        <div className="table-order-info">
          <span className="table-order-code">#{order.code}</span>
          <span className="table-order-total">${order.total.toFixed(2)}</span>
        </div>
      )}
      <div className="channel-tags">
        {customerTypes.slice(0, 3).map(ct => (
          <span key={ct.id} className="channel-tag"
            style={{ borderColor: CUSTOMER_TYPE_COLORS[ct.name] ?? ct.color }}>
            {ct.name}
          </span>
        ))}
      </div>
      <button className="btn-primary table-order-btn" onClick={onClick}>
        <CartIcon /> {isOccupied ? 'Ver Orden' : 'Ordenar'}
      </button>
    </div>
  );
}

function PeopleIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="5" cy="4" r="2"/><circle cx="9" cy="4" r="2"/><path d="M1 12c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4"/></svg>;
}
function CartIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M1 1h2l1.5 7h7l1.5-5H4"/><circle cx="6" cy="12" r="1"/><circle cx="11" cy="12" r="1"/></svg>;
}
