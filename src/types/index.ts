export type OrderChannel = 'DIRECT' | 'DIDI' | 'UBER' | 'RAPPI' | 'MOB+';
export type TableStatus = 'available' | 'occupied' | 'reserved';
export type OrderStatus = 'waiting' | 'cooking' | 'ready' | 'closed' | 'cancelled';
export type KDSTab = 'waiting' | 'cooking' | 'ready';

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  allergens: string[];
  photo?: string;
  available: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  modifiers: string[];
  category: string;
}

export interface Order {
  id: string;
  code: string;
  tableId: string;
  tableName: string;
  channel: OrderChannel;
  status: OrderStatus;
  items: OrderItem[];
  createdAt: Date;
  startedAt?: Date;
  readyAt?: Date;
  closedAt?: Date;
  total: number;
  paymentMethod?: string;
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  currentOrderId?: string;
  channels: OrderChannel[];
}

export interface Shift {
  id: string;
  name: string;
  startHour: number;
  endHour: number;
  date: string;
  closedAt: string;
  revenue: number;
  ordersClosed: number;
  tablesServed: number;
  cancelledValue: number;
  topItems: { name: string; qty: number; revenue: number; category: string }[];
  paymentMethods: { method: string; count: number }[];
  avgWaitTime?: number;
  avgCookTime?: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface KitchenTimer {
  id: string;
  label: string;
  seconds: number;
  running: boolean;
  elapsed: number;
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'manager' | 'waiter' | 'kitchen';
  restaurant: string;
}
