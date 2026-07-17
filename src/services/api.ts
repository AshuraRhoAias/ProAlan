// Demo-mode API surface. This app runs standalone in the browser — there is no
// backend. All calls are served by `demoStore`, which keeps state in memory and
// persists it to cookies so a demo session survives page reloads.
import { demoStore, subscribe } from './demoStore';

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (_name: string, pin: string) => demoStore.login(pin),
  me:    () => { throw new Error('No implementado en modo demo'); },
};

// ── Menu ──────────────────────────────────────────────────────
export const menuApi = {
  getItems:      () => demoStore.getMenuItems(),
  getCategories: () => demoStore.getCategories(),
};

// ── Restaurant ────────────────────────────────────────────────
export const restaurantApi = {
  get:              () => demoStore.getRestaurant(),
  getCustomerTypes: () => demoStore.getCustomerTypes(),
  getTables:        () => demoStore.getTables(),
  getShifts:        () => Promise.resolve<ApiShift[]>([]),
  getCurrentShift:  () => demoStore.getCurrentShift(),
};

// ── Orders ────────────────────────────────────────────────────
export const ordersApi = {
  getAll:      (status?: string) => demoStore.getOrders(status),
  getById:     (id: number)      => demoStore.getOrderById(id),
  create:      (data: CreateOrderPayload) => demoStore.createOrder(data),
  addItems:    (id: number, items: OrderItemPayload[]) => demoStore.addItems(id, items).then(() => ({ ok: true })),
  updateStatus:(id: number, status: string) => demoStore.updateOrderStatus(id, status).then(() => ({ ok: true })),
  closeWithTip:(id: number, tip: number, payment_method: string) =>
    demoStore.closeWithTip(id, tip, payment_method).then(() => ({ ok: true })),
  cancelItem:  (id: number, itemId: number) =>
    demoStore.cancelItem(id, itemId).then(() => ({ ok: true })),
  cancel:      (id: number, cancelled_value: number) =>
    demoStore.cancelOrder(id, cancelled_value).then(() => ({ ok: true })),
  search:      (q: string) => demoStore.searchOrders(q),
};

// ── Live updates (in-process pub/sub — stands in for SSE) ───────
export function createEventSource(onMessage: (type: string, data: unknown) => void): { close: () => void } {
  return { close: subscribe(onMessage) };
}

// ── Types ─────────────────────────────────────────────────────
export interface ApiUser         { id: number; name: string; role: string; }
export interface ApiMenuItem     { id: number; name: string; category_name: string; price: number; description: string; allergens: string; available: number; photo_url: string; }
export interface ApiCategory     { id: number; name: string; sort_order: number; active: number; }
export interface ApiCustomerType { id: number; name: string; color: string; }
export interface ApiTable        { id: number; name: string; capacity: number; status: string; }
export interface ApiRestaurant   { id: number; name: string; currency_symbol: string; tax_rate: number; }
export interface ApiShift        { id: number; name: string; date: string; status: string; opened_at: string; closed_at: string; }
export interface ApiOrder {
  id: number; code: string; table_id: number; table_name: string;
  customer_type_id: number; customer_type_name: string;
  shift_id: number; status: string; payment_method: string;
  notes: string; total: number; tip: number; cancelled_value: number;
  created_at: string; started_at: string; ready_at: string; closed_at: string;
  items?: ApiOrderItem[];
}
export interface ApiOrderItem    { id: number; menu_item_name: string; quantity: number; unit_price: number; notes: string; status: string; modifiers: string; }
export interface CreateOrderPayload {
  table_id: number; customer_type_id: number; shift_id?: number; notes?: string;
  items: OrderItemPayload[];
}
export interface OrderItemPayload {
  menu_item_id: number; quantity: number; unit_price: number; notes?: string;
  modifiers?: { name: string; type: 'included' | 'removed' | 'extra' }[];
}
