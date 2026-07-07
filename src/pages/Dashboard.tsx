import { useState, useEffect, useCallback } from 'react';
import { restaurantApi, ordersApi, createEventSource, type ApiTable, type ApiCustomerType, type ApiOrder } from '../services/api';
import OrderModal from '../components/modals/OrderModal';
import OrderDetail from '../components/modals/OrderDetail';

const CUSTOMER_TYPE_COLORS: Record<string, string> = {
  DIRECT: '#6b7280', DIDI: '#f59e0b', UBER: '#10b981', RAPPI: '#ef4444', 'MOB+': '#8b5cf6',
};

const ACTIVE_STATUSES = ['waiting', 'cooking', 'ready'];

interface Props { restaurantName: string }

export default function Dashboard({ restaurantName }: Props) {
  const [tables, setTables]               = useState<ApiTable[]>([]);
  const [customerTypes, setCustomerTypes] = useState<ApiCustomerType[]>([]);
  const [activeOrders, setActiveOrders]   = useState<ApiOrder[]>([]);
  const [newOrderTable, setNewOrderTable] = useState<ApiTable | null>(null);
  const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
  const [detailInitTab, setDetailInitTab] = useState<'items' | 'add' | 'pay'>('items');
  const [currentShiftId, setCurrentShiftId] = useState<number | undefined>();

  const load = useCallback(async () => {
    const [tbls, types, orders, shift] = await Promise.all([
      restaurantApi.getTables().catch(() => [] as ApiTable[]),
      restaurantApi.getCustomerTypes().catch(() => [] as ApiCustomerType[]),
      ordersApi.getAll().catch(() => [] as ApiOrder[]),
      restaurantApi.getCurrentShift().catch(() => null),
    ]);
    setTables(tbls as ApiTable[]);
    setCustomerTypes(types as ApiCustomerType[]);
    // Filtramos solo órdenes activas y normalizamos table_id a número
    const active = (orders as ApiOrder[]).filter(
      o => ACTIVE_STATUSES.includes(o.status)
    );
    setActiveOrders(active);
    if (shift) setCurrentShiftId((shift as { id: number }).id);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const es = createEventSource((type) => {
      if (['order_new', 'order_status'].includes(type)) load();
    });
    return () => es.close();
  }, [load]);

  // Busca la orden activa de una mesa (normaliza IDs a número)
  const getTableOrder = (tableId: number): ApiOrder | undefined =>
    activeOrders.find(o => Number(o.table_id) === Number(tableId));

  // Mesa ocupada: tiene orden activa O su status DB es 'occupied'
  const isTableOccupied = (table: ApiTable): boolean =>
    !!getTableOrder(table.id) || table.status === 'occupied';

  const openDetail = async (table: ApiTable, initTab: 'items' | 'add' | 'pay') => {
    let order = getTableOrder(table.id);
    if (!order) {
      // Refresco directo si no está en caché (p.ej. recién creada)
      const fresh = await ordersApi.getAll().catch(() => [] as ApiOrder[]);
      const active = (fresh as ApiOrder[]).filter(o => ACTIVE_STATUSES.includes(o.status));
      setActiveOrders(active);
      order = active.find(o => Number(o.table_id) === Number(table.id));
    }
    if (order) {
      setDetailInitTab(initTab);
      setDetailOrderId(order.id);
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
          const occupied = isTableOccupied(table);
          return (
            <TableCard
              key={table.id}
              table={table}
              order={order}
              occupied={occupied}
              customerTypes={customerTypes}
              onNew={() => setNewOrderTable(table)}
              onAdd={() => openDetail(table, 'add')}
              onPay={() => openDetail(table, 'pay')}
              onView={() => openDetail(table, 'items')}
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
          initialTab={detailInitTab}
          onClose={() => { setDetailOrderId(null); load(); }}
          onUpdated={load}
        />
      )}
    </div>
  );
}

function TableCard({ table, order, occupied, customerTypes, onNew, onAdd, onPay, onView }: {
  table: ApiTable;
  order?: ApiOrder;
  occupied: boolean;
  customerTypes: ApiCustomerType[];
  onNew: () => void;
  onAdd: () => void;
  onPay: () => void;
  onView: () => void;
}) {
  const statusLabel = occupied
    ? (order?.status === 'waiting' ? 'Esperando' : order?.status === 'cooking' ? 'Cocinando' : order?.status === 'ready' ? 'Lista' : 'Ocupada')
    : 'Disponible';

  return (
    <div className={`table-card${occupied ? ' occupied' : ''}`} onClick={occupied ? onView : undefined}>
      <div className="table-card-header">
        <span className="table-name">{table.name}</span>
        <span className="table-capacity"><PeopleIcon /> {table.capacity}</span>
      </div>
      <div className="table-status">
        <span className={`status-dot dot-${occupied ? 'occupied' : 'available'}`} />
        <span className="status-label">{statusLabel}</span>
      </div>
      {occupied && order && (
        <div className="table-order-info">
          <span className="table-order-code">#{order.code}</span>
          <span className="table-order-total">${Number(order.total).toFixed(2)}</span>
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

      {occupied ? (
        <div className="table-action-btns">
          <button
            className="btn-secondary table-action-btn"
            onClick={e => { e.stopPropagation(); onAdd(); }}
          >
            <PlusIcon /> Agregar
          </button>
          <button
            className="btn-primary table-action-btn"
            onClick={e => { e.stopPropagation(); onPay(); }}
          >
            <PayIcon /> Cobrar
          </button>
        </div>
      ) : (
        <button className="btn-primary table-order-btn" onClick={onNew}>
          <CartIcon /> Ordenar
        </button>
      )}
    </div>
  );
}

function PeopleIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><circle cx="5" cy="4" r="2"/><circle cx="9" cy="4" r="2"/><path d="M1 12c0-2.2 1.8-4 4-4h4c2.2 0 4 1.8 4 4"/></svg>;
}
function CartIcon() {
  return <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M1 1h2l1.5 7h7l1.5-5H4"/><circle cx="6" cy="12" r="1"/><circle cx="11" cy="12" r="1"/></svg>;
}
function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10"/></svg>;
}
function PayIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="3" width="12" height="8" rx="1.5"/><path d="M1 6h12"/></svg>;
}
