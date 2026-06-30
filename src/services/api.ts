const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

function getToken() { return localStorage.getItem('mastrflow_token') ?? ''; }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Error del servidor');
  }
  return res.json();
}

const get  = <T>(path: string)                  => request<T>(path, { method: 'GET' });
const post = <T>(path: string, body: unknown)   => request<T>(path, { method: 'POST',  body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown)  => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) });

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login:  (name: string, pin: string) => post<{ token: string; user: ApiUser }>('/api/auth/login', { name, pin }),
  me:     ()                          => get<ApiUser>('/api/auth/me'),
};

// ── Menu ──────────────────────────────────────────────────────────────────────
export const menuApi = {
  getItems:       () => get<ApiMenuItem[]>('/api/menu'),
  getCategories:  () => get<ApiCategory[]>('/api/menu/categories'),
};

// ── Restaurant ────────────────────────────────────────────────────────────────
export const restaurantApi = {
  get:              ()                  => get<ApiRestaurant>('/api/restaurant'),
  getCustomerTypes: ()                  => get<ApiCustomerType[]>('/api/restaurant/customer-types'),
  getTables:        ()                  => get<ApiTable[]>('/api/restaurant/tables'),
  getShifts:        ()                  => get<ApiShift[]>('/api/shifts'),
  getCurrentShift:  ()                  => get<ApiShift | null>('/api/shifts/current'),
};

// ── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll:   (status?: string) => get<ApiOrder[]>(`/api/orders${status ? `?status=${status}` : ''}`),
  getById:  (id: number)      => get<ApiOrder>(`/api/orders/${id}`),
  create:   (data: CreateOrderPayload) => post<{ orderId: number; code: string }>('/api/orders', data),
  addItems: (id: number, items: OrderItemPayload[]) => post<{ ok: boolean }>(`/api/orders/${id}/items`, { items }),
  updateStatus: (id: number, status: string) => patch<{ ok: boolean }>(`/api/orders/${id}/status`, { status }),
  closeWithTip: (id: number, tip: number, payment_method: string) =>
    patch<{ ok: boolean }>(`/api/orders/${id}/close`, { tip, payment_method }),
  cancel:   (id: number, cancelled_value: number) =>
    patch<{ ok: boolean }>(`/api/orders/${id}/cancel`, { cancelled_value }),
  search:   (q: string) => get<ApiOrder[]>(`/api/orders/search?q=${encodeURIComponent(q)}`),
};

// ── SSE helper ────────────────────────────────────────────────────────────────
export function createEventSource(onMessage: (type: string, data: unknown) => void): EventSource {
  const es = new EventSource(`${BASE}/api/events`, {
    // EventSource does not support custom headers; pass token via cookie or query param
  });
  es.onmessage = (e) => { try { onMessage('message', JSON.parse(e.data)); } catch (_) {} };
  ['order_new','order_status','shift_open','shift_close'].forEach(t => {
    es.addEventListener(t, (e: MessageEvent) => {
      try { onMessage(t, JSON.parse(e.data)); } catch (_) {}
    });
  });
  return es;
}

// ── Types ──────────────────────────────────────────────────────────────────────
export interface ApiUser        { id: number; name: string; role: string; }
export interface ApiMenuItem    { id: number; name: string; category_name: string; price: number; description: string; allergens: string; available: number; }
export interface ApiCategory    { id: number; name: string; sort_order: number; active: number; }
export interface ApiCustomerType{ id: number; name: string; color: string; }
export interface ApiTable       { id: number; name: string; capacity: number; status: string; }
export interface ApiRestaurant  { id: number; name: string; currency_symbol: string; tax_rate: number; }
export interface ApiShift       { id: number; name: string; date: string; status: string; opened_at: string; closed_at: string; }
export interface ApiOrder {
  id: number; code: string; table_id: number; table_name: string;
  customer_type_id: number; customer_type_name: string;
  shift_id: number; status: string; payment_method: string;
  notes: string; total: number; tip: number; cancelled_value: number;
  created_at: string; started_at: string; ready_at: string; closed_at: string;
  items?: ApiOrderItem[];
}
export interface ApiOrderItem   { id: number; menu_item_name: string; quantity: number; unit_price: number; notes: string; status: string; modifiers: string; }
export interface CreateOrderPayload {
  table_id: number; customer_type_id: number; shift_id?: number; notes?: string;
  items: OrderItemPayload[];
}
export interface OrderItemPayload {
  menu_item_id: number; quantity: number; unit_price: number; notes?: string;
  modifiers?: { name: string; type: 'included' | 'removed' | 'extra' }[];
}
