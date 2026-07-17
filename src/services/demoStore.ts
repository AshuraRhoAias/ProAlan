// Self-contained demo "backend" — no network calls. All state lives in memory
// and is mirrored into cookies so it survives reloads within the same browser.
import { getJSON, setJSON } from '../lib/cookies';
import type {
  ApiUser, ApiMenuItem, ApiCategory, ApiCustomerType, ApiTable, ApiRestaurant,
  ApiOrder, ApiOrderItem, CreateOrderPayload, OrderItemPayload,
} from './api';

const PREFIX = 'mf_demo_';
const COOKIE = {
  restaurant: PREFIX + 'restaurant',
  customerTypes: PREFIX + 'ctypes',
  tables: PREFIX + 'tables',
  categories: PREFIX + 'categories',
  menuItems: PREFIX + 'menu',
  orders: PREFIX + 'orders',
  nextIds: PREFIX + 'ids',
};

// Budget for the *encoded* cookie value (browsers cap a cookie around ~4096
// bytes total including name + attributes), with headroom for those.
const MAX_ORDERS_COOKIE_BYTES = 3600;

interface DemoUser extends ApiUser { pin: string; }

const DEMO_USERS: DemoUser[] = [
  { id: 1, name: 'Admin',   role: 'admin',   pin: '0000' },
  { id: 2, name: 'Manager', role: 'manager', pin: '1234' },
  { id: 3, name: 'Chef',    role: 'kitchen', pin: '5678' },
  { id: 4, name: 'Mesero',  role: 'waiter',  pin: '9999' },
];

const SEED_RESTAURANT: ApiRestaurant = {
  id: 1, name: 'MastrFlow Demo', currency_symbol: '$', tax_rate: 0,
};

const SEED_CUSTOMER_TYPES: ApiCustomerType[] = [
  { id: 1, name: 'DIRECT', color: '#6b7280' },
  { id: 2, name: 'DIDI',   color: '#f59e0b' },
  { id: 3, name: 'UBER',   color: '#10b981' },
  { id: 4, name: 'RAPPI',  color: '#ef4444' },
  { id: 5, name: 'MOB+',   color: '#8b5cf6' },
];

const SEED_TABLES: ApiTable[] = [
  { id: 1, name: 'Mesa 1', capacity: 4, status: 'available' },
  { id: 2, name: 'Mesa 2', capacity: 4, status: 'available' },
  { id: 3, name: 'Mesa 3', capacity: 4, status: 'available' },
  { id: 4, name: 'Mesa 4', capacity: 4, status: 'available' },
  { id: 5, name: 'Mesa 5', capacity: 4, status: 'available' },
  { id: 6, name: 'Mesa 6', capacity: 4, status: 'available' },
  { id: 7, name: 'Mesa 7', capacity: 4, status: 'available' },
  { id: 8, name: 'Mesa 8', capacity: 6, status: 'available' },
  { id: 9, name: 'Barra',  capacity: 8, status: 'available' },
];

const SEED_CATEGORIES: ApiCategory[] = [
  { id: 1, name: 'Burgers', sort_order: 1, active: 1 },
  { id: 2, name: 'Sides',   sort_order: 2, active: 1 },
  { id: 3, name: 'Mains',   sort_order: 3, active: 1 },
  { id: 4, name: 'Drinks',  sort_order: 4, active: 1 },
];

const CATEGORY_NAME: Record<number, string> = Object.fromEntries(
  SEED_CATEGORIES.map(c => [c.id, c.name])
);

interface SeedMenuItem { id: number; category_id: number; name: string; description: string; price: number; allergens: string[]; photo_url: string; }

const SEED_MENU_ITEMS_RAW: SeedMenuItem[] = [
  { id: 1,  category_id: 1, name: 'Classic Burger',      description: 'Res 180g, lechuga, jitomate, pepinillos', price: 120, allergens: ['Gluten', 'Dairy'], photo_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400' },
  { id: 2,  category_id: 1, name: 'Smash Burger',        description: 'Doble smash, queso americano, salsa especial', price: 145, allergens: ['Gluten', 'Dairy'], photo_url: 'https://images.unsplash.com/photo-1586816001966-79b736744398?w=400' },
  { id: 3,  category_id: 1, name: 'BBQ Bacon Burger',    description: 'Res 180g, bacon, cebolla asada, BBQ', price: 155, allergens: ['Gluten', 'Dairy'], photo_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400' },
  { id: 4,  category_id: 1, name: 'Veggie Burger',       description: 'Medallón de frijol negro, aguacate', price: 130, allergens: ['Gluten'], photo_url: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400' },
  { id: 5,  category_id: 2, name: 'Papas a la Francesa', description: 'Papas crujientes con sal de mar', price: 55, allergens: [], photo_url: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?w=400' },
  { id: 6,  category_id: 2, name: 'Aros de Cebolla',     description: 'Aros crujientes con aderezo ranch', price: 65, allergens: ['Gluten', 'Dairy'], photo_url: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400' },
  { id: 7,  category_id: 2, name: 'Nuggets x8',          description: '8 piezas con salsa BBQ o ranch', price: 75, allergens: ['Gluten'], photo_url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400' },
  { id: 8,  category_id: 3, name: 'Hot Dog Clásico',     description: 'Salchicha ahumada, mostaza, ketchup', price: 80, allergens: ['Gluten'], photo_url: 'https://images.unsplash.com/photo-1619740455993-9d622e5f6b68?w=400' },
  { id: 9,  category_id: 3, name: 'Pizza Margarita',     description: 'Salsa de tomate, mozzarella, albahaca', price: 160, allergens: ['Gluten', 'Dairy'], photo_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400' },
  { id: 10, category_id: 3, name: 'Tacos x3',            description: 'Pastor, cebolla, cilantro, salsa verde', price: 90, allergens: [], photo_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400' },
  { id: 11, category_id: 4, name: 'Refresco',            description: 'Coca-Cola, Sprite o Fanta 355ml', price: 35, allergens: [], photo_url: 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400' },
  { id: 12, category_id: 4, name: 'Agua Mineral',        description: 'Con o sin gas 500ml', price: 28, allergens: [], photo_url: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400' },
  { id: 13, category_id: 4, name: 'Malteada',            description: 'Chocolate, vainilla o fresa', price: 85, allergens: ['Dairy'], photo_url: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400' },
  { id: 14, category_id: 4, name: 'Jugo Natural',        description: 'Naranja, mango o zanahoria', price: 50, allergens: [], photo_url: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400' },
];

const SEED_MENU_ITEMS: ApiMenuItem[] = SEED_MENU_ITEMS_RAW.map(m => ({
  id: m.id,
  name: m.name,
  category_name: CATEGORY_NAME[m.category_id],
  price: m.price,
  description: m.description,
  allergens: m.allergens.join('||'),
  available: 1,
  photo_url: m.photo_url,
}));

interface DemoOrderItem {
  id: number; menu_item_id: number; quantity: number; unit_price: number;
  notes: string; status: 'pending' | 'cancelled';
  modifiers: { name: string; type: 'included' | 'removed' | 'extra' }[];
}

interface DemoOrder {
  id: number; code: string; table_id: number; customer_type_id: number;
  shift_id: number | null; status: string; payment_method: string; notes: string;
  total: number; tip: number; cancelled_value: number;
  created_at: string; started_at: string | null; ready_at: string | null; closed_at: string | null;
  items: DemoOrderItem[];
}

interface NextIds { order: number; orderItem: number; }

function loadRestaurant(): ApiRestaurant { return getJSON(COOKIE.restaurant, SEED_RESTAURANT); }
function loadCustomerTypes(): ApiCustomerType[] { return getJSON(COOKIE.customerTypes, SEED_CUSTOMER_TYPES); }
function loadTables(): ApiTable[] { return getJSON(COOKIE.tables, SEED_TABLES); }
function loadCategories(): ApiCategory[] { return getJSON(COOKIE.categories, SEED_CATEGORIES); }
function loadMenuItems(): ApiMenuItem[] { return getJSON(COOKIE.menuItems, SEED_MENU_ITEMS); }
function loadOrders(): DemoOrder[] { return getJSON(COOKIE.orders, [] as DemoOrder[]); }
function loadNextIds(): NextIds { return getJSON(COOKIE.nextIds, { order: 1, orderItem: 1 }); }

function saveTables(tables: ApiTable[]) { setJSON(COOKIE.tables, tables); }
function saveNextIds(ids: NextIds) { setJSON(COOKIE.nextIds, ids); }

// Drop the oldest closed/cancelled orders until the serialized cookie fits the
// per-cookie byte budget. Active orders (waiting/cooking/ready) are never dropped.
function saveOrders(orders: DemoOrder[]) {
  const sorted = [...orders].sort((a, b) => b.created_at.localeCompare(a.created_at));
  while (encodeURIComponent(JSON.stringify(sorted)).length > MAX_ORDERS_COOKIE_BYTES) {
    const idx = [...sorted].reverse().findIndex(o => o.status === 'closed' || o.status === 'cancelled');
    if (idx === -1) break; // nothing left we're allowed to drop
    sorted.splice(sorted.length - 1 - idx, 1);
  }
  setJSON(COOKIE.orders, sorted);
}

function genCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function toApiOrder(o: DemoOrder, tables: ApiTable[], customerTypes: ApiCustomerType[], withItems: boolean): ApiOrder {
  const table = tables.find(t => t.id === o.table_id);
  const ctype = customerTypes.find(c => c.id === o.customer_type_id);
  const base: ApiOrder = {
    id: o.id, code: o.code, table_id: o.table_id, table_name: table?.name ?? '',
    customer_type_id: o.customer_type_id, customer_type_name: ctype?.name ?? '',
    shift_id: o.shift_id ?? 0, status: o.status, payment_method: o.payment_method,
    notes: o.notes, total: o.total, tip: o.tip, cancelled_value: o.cancelled_value,
    created_at: o.created_at, started_at: o.started_at ?? '', ready_at: o.ready_at ?? '', closed_at: o.closed_at ?? '',
  };
  if (withItems) {
    const menuItems = loadMenuItems();
    base.items = o.items.map((i): ApiOrderItem => ({
      id: i.id,
      menu_item_name: menuItems.find(m => m.id === i.menu_item_id)?.name ?? '',
      quantity: i.quantity,
      unit_price: i.unit_price,
      notes: i.notes,
      status: i.status,
      modifiers: i.modifiers.map(m => JSON.stringify(m)).join('||'),
    }));
  }
  return base;
}

type Listener = (type: string, data: unknown) => void;
const listeners = new Set<Listener>();
function emit(type: string, data: unknown) {
  listeners.forEach(l => l(type, data));
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

const delay = (ms = 150) => new Promise(resolve => setTimeout(resolve, ms));

export const demoStore = {
  async login(pin: string): Promise<{ token: string; user: ApiUser }> {
    await delay();
    const user = DEMO_USERS.find(u => u.pin === pin);
    if (!user) throw new Error('PIN inválido');
    return { token: `demo-${user.id}-${Date.now()}`, user: { id: user.id, name: user.name, role: user.role } };
  },

  async getRestaurant(): Promise<ApiRestaurant> { await delay(); return loadRestaurant(); },
  async getCustomerTypes(): Promise<ApiCustomerType[]> { await delay(); return loadCustomerTypes(); },
  async getTables(): Promise<ApiTable[]> { await delay(); return loadTables(); },
  async getCategories(): Promise<ApiCategory[]> { await delay(); return loadCategories(); },
  async getMenuItems(): Promise<ApiMenuItem[]> { await delay(); return loadMenuItems(); },
  async getCurrentShift() { await delay(); return null; },

  async getOrders(status?: string): Promise<ApiOrder[]> {
    await delay();
    const tables = loadTables();
    const customerTypes = loadCustomerTypes();
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return loadOrders()
      .filter(o => new Date(o.created_at).getTime() >= cutoff)
      .filter(o => !status || o.status === status)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map(o => toApiOrder(o, tables, customerTypes, false));
  },

  async getOrderById(id: number): Promise<ApiOrder> {
    await delay();
    const order = loadOrders().find(o => o.id === id);
    if (!order) throw new Error('Orden no encontrada');
    return toApiOrder(order, loadTables(), loadCustomerTypes(), true);
  },

  async searchOrders(q: string): Promise<ApiOrder[]> {
    await delay();
    const tables = loadTables();
    const customerTypes = loadCustomerTypes();
    const menuItems = loadMenuItems();
    const needle = q.toLowerCase();
    return loadOrders()
      .filter(o => {
        const table = tables.find(t => t.id === o.table_id);
        const itemMatch = o.items.some(i => menuItems.find(m => m.id === i.menu_item_id)?.name.toLowerCase().includes(needle));
        return o.code.toLowerCase().includes(needle) || table?.name.toLowerCase().includes(needle) || itemMatch;
      })
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 50)
      .map(o => toApiOrder(o, tables, customerTypes, false));
  },

  async createOrder(payload: CreateOrderPayload): Promise<{ orderId: number; code: string }> {
    await delay();
    const ids = loadNextIds();
    const orderId = ids.order++;
    const total = payload.items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const items: DemoOrderItem[] = payload.items.map((i: OrderItemPayload) => ({
      id: ids.orderItem++,
      menu_item_id: i.menu_item_id,
      quantity: i.quantity,
      unit_price: i.unit_price,
      notes: i.notes ?? '',
      status: 'pending',
      modifiers: i.modifiers ?? [],
    }));
    const order: DemoOrder = {
      id: orderId, code: genCode(), table_id: payload.table_id, customer_type_id: payload.customer_type_id,
      shift_id: payload.shift_id ?? null, status: 'waiting', payment_method: '', notes: payload.notes ?? '',
      total, tip: 0, cancelled_value: 0,
      created_at: new Date().toISOString(), started_at: null, ready_at: null, closed_at: null,
      items,
    };
    saveNextIds(ids);
    saveOrders([...loadOrders(), order]);

    const tables = loadTables().map(t => t.id === payload.table_id ? { ...t, status: 'occupied' } : t);
    saveTables(tables);

    emit('order_new', toApiOrder(order, tables, loadCustomerTypes(), true));
    return { orderId, code: order.code };
  },

  async addItems(orderId: number, items: OrderItemPayload[]): Promise<void> {
    await delay();
    const ids = loadNextIds();
    const addedTotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
    const orders = loadOrders().map(o => {
      if (o.id !== orderId || o.status === 'closed' || o.status === 'cancelled') return o;
      const newItems: DemoOrderItem[] = items.map(i => ({
        id: ids.orderItem++, menu_item_id: i.menu_item_id, quantity: i.quantity, unit_price: i.unit_price,
        notes: i.notes ?? '', status: 'pending', modifiers: i.modifiers ?? [],
      }));
      return { ...o, items: [...o.items, ...newItems], total: o.total + addedTotal, status: 'waiting', started_at: null };
    });
    saveNextIds(ids);
    saveOrders(orders);
    const updated = orders.find(o => o.id === orderId);
    if (updated) emit('order_status', toApiOrder(updated, loadTables(), loadCustomerTypes(), true));
  },

  async updateOrderStatus(id: number, status: string): Promise<void> {
    await delay();
    const timeField: Record<string, 'started_at' | 'ready_at' | 'closed_at'> = {
      cooking: 'started_at', ready: 'ready_at', closed: 'closed_at', cancelled: 'closed_at',
    };
    const orders = loadOrders().map(o => {
      if (o.id !== id) return o;
      const tf = timeField[status];
      return { ...o, status, ...(tf ? { [tf]: new Date().toISOString() } : {}) };
    });
    saveOrders(orders);

    const updated = orders.find(o => o.id === id);
    if (updated && (status === 'closed' || status === 'cancelled')) {
      const tables = loadTables().map(t => t.id === updated.table_id ? { ...t, status: 'available' } : t);
      saveTables(tables);
    }
    if (updated) emit('order_status', toApiOrder(updated, loadTables(), loadCustomerTypes(), true));
  },

  async cancelItem(orderId: number, itemId: number): Promise<void> {
    await delay();
    const orders = loadOrders().map(o => {
      if (o.id !== orderId) return o;
      const item = o.items.find(i => i.id === itemId && i.status === 'pending');
      if (!item) return o;
      const refund = item.quantity * item.unit_price;
      return {
        ...o,
        items: o.items.map(i => i.id === itemId ? { ...i, status: 'cancelled' as const } : i),
        total: Math.max(0, o.total - refund),
      };
    });
    saveOrders(orders);
    const updated = orders.find(o => o.id === orderId);
    if (updated) emit('order_status', toApiOrder(updated, loadTables(), loadCustomerTypes(), true));
  },

  async closeWithTip(id: number, tip: number, paymentMethod: string): Promise<void> {
    await delay();
    const orders = loadOrders().map(o => o.id === id
      ? { ...o, status: 'closed', closed_at: new Date().toISOString(), tip, payment_method: paymentMethod }
      : o);
    saveOrders(orders);
    const updated = orders.find(o => o.id === id);
    if (updated) {
      const tables = loadTables().map(t => t.id === updated.table_id ? { ...t, status: 'available' } : t);
      saveTables(tables);
      emit('order_status', toApiOrder(updated, tables, loadCustomerTypes(), true));
    }
  },

  async cancelOrder(id: number, cancelledValue: number): Promise<void> {
    await delay();
    const orders = loadOrders().map(o => o.id === id
      ? { ...o, status: 'cancelled', cancelled_value: cancelledValue, closed_at: new Date().toISOString() }
      : o);
    saveOrders(orders);
    const updated = orders.find(o => o.id === id);
    if (updated) {
      const tables = loadTables().map(t => t.id === updated.table_id ? { ...t, status: 'available' } : t);
      saveTables(tables);
      emit('order_status', toApiOrder(updated, tables, loadCustomerTypes(), true));
    }
  },
};
