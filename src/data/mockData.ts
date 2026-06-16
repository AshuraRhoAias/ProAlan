import type { Table, MenuItem, Order, Shift, KitchenTimer } from '../types';

export const MOCK_TABLES: Table[] = [
  { id: 't1', name: 'Table 1', capacity: 4, status: 'occupied', currentOrderId: 'o1', channels: ['DIRECT', 'DIDI', 'UBER', 'RAPPI', 'MOB+'] },
  { id: 't2', name: 'Table 2', capacity: 4, status: 'available', channels: ['DIRECT', 'DIDI', 'UBER', 'RAPPI', 'MOB+'] },
  { id: 't3', name: 'Table 3', capacity: 4, status: 'available', channels: ['DIRECT', 'DIDI', 'UBER', 'RAPPI', 'MOB+'] },
  { id: 't4', name: 'Table 4', capacity: 4, status: 'available', channels: ['DIRECT', 'DIDI', 'UBER', 'RAPPI', 'MOB+'] },
  { id: 't5', name: 'Table 5', capacity: 4, status: 'available', channels: ['DIRECT', 'DIDI', 'UBER', 'RAPPI', 'MOB+'] },
  { id: 't6', name: 'Table 6', capacity: 4, status: 'available', channels: ['DIRECT', 'DIDI', 'UBER', 'RAPPI', 'MOB+'] },
];

export const MOCK_MENU_ITEMS: MenuItem[] = [
  { id: 'm1', name: 'TID', category: 'Burgers', price: 115, description: '', allergens: ['Gluten', 'Dairy'], available: true },
  { id: 'm2', name: 'MR FANCYPANTS', category: 'Burgers', price: 156, description: 'El distribuidor de la esquina. 120g de Mafia Blend', allergens: ['Gluten'], available: true },
  { id: 'm3', name: 'LA MADRINA', category: 'Burgers', price: 132, description: '', allergens: ['Gluten', 'Dairy'], available: true },
  { id: 'm4', name: 'SIR FANCYPANTS', category: 'Burgers', price: 119, description: '', allergens: ['Gluten'], available: true },
  { id: 'm5', name: 'QUESO GOUDA', category: 'Burgers', price: 134, description: '', allergens: ['Gluten', 'Dairy'], available: true },
  { id: 'm6', name: 'BACONBITS', category: 'Burgers', price: 113, description: '', allergens: ['Gluten'], available: true },
  { id: 'm7', name: 'La Costrilla', category: 'Burgers', price: 150, description: '', allergens: ['Gluten'], available: true },
  { id: 'm8', name: 'Triple Dino', category: 'Burgers', price: 193, description: '', allergens: ['Gluten'], available: true },
  { id: 'm9', name: 'PAPAS CALIBRE 9000', category: 'Sides', price: 65, description: '', allergens: [], available: true },
  { id: 'm10', name: 'DOBLE O NADA', category: 'Burgers', price: 145, description: '', allergens: ['Gluten'], available: true },
  { id: 'm11', name: 'KELLY N', category: 'Burgers', price: 138, description: '', allergens: ['Gluten'], available: true },
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    code: 'F83A64',
    tableId: 't1',
    tableName: 'Table 1',
    channel: 'DIRECT',
    status: 'waiting',
    items: [
      { menuItemId: 'm3', name: 'LA MADRINA', quantity: 1, category: 'Burgers', modifiers: ['LECHUGA', 'JITOMATE', 'MAYONESA', 'PEPINILLOS ARTESANALES', 'CEBOLLA ASADA'] },
    ],
    createdAt: new Date(Date.now() - 4 * 60000),
    total: 0,
    paymentMethod: 'CASH',
  },
];

export const SHIFT_NAMES = ['Breakfast (06–13h)', 'Lunch (13–18h)', 'Supper (18–23h)', 'Late Night (23–06h)'];

export const MOCK_SHIFTS: Shift[] = [
  {
    id: 's1', name: 'Breakfast (06–13h)', startHour: 6, endHour: 13,
    date: '2026-06-14', closedAt: '2026-06-14 — 12:00',
    revenue: 156, ordersClosed: 1, tablesServed: 1, cancelledValue: 0,
    topItems: [{ name: 'MR FANCYPANTS', qty: 1, revenue: 156, category: 'BURGERS' }],
    paymentMethods: [{ method: 'CASH', count: 1 }],
    avgWaitTime: undefined, avgCookTime: undefined,
  },
  {
    id: 's2', name: 'Late Night (23–06h)', startHour: 23, endHour: 6,
    date: '2026-06-14', closedAt: '2026-06-14 — 05:00',
    revenue: 1427, ordersClosed: 6, tablesServed: 2, cancelledValue: 0,
    topItems: [{ name: 'KELLY N', qty: 5, revenue: 780, category: 'BURGERS' }, { name: 'PAPAS CALIBRE 9000', qty: 4, revenue: 260, category: 'SIDES' }],
    paymentMethods: [{ method: 'APPTX', count: 4 }, { method: 'CASH', count: 2 }],
    avgWaitTime: 180, avgCookTime: 420,
  },
  {
    id: 's3', name: 'Supper (18–23h)', startHour: 18, endHour: 23,
    date: '2026-06-13', closedAt: '2026-06-13 — 22:00',
    revenue: 710, ordersClosed: 3, tablesServed: 2, cancelledValue: 0,
    topItems: [{ name: 'DOBLE O NADA', qty: 2, revenue: 290, category: 'BURGERS' }],
    paymentMethods: [{ method: 'BKTX', count: 2 }, { method: 'CASH', count: 1 }],
    avgWaitTime: 210, avgCookTime: 390,
  },
  {
    id: 's4', name: 'Lunch (13–18h)', startHour: 13, endHour: 18,
    date: '2026-06-13', closedAt: '2026-06-13 — 17:00',
    revenue: 232, ordersClosed: 1, tablesServed: 1, cancelledValue: 0,
    topItems: [{ name: 'KELLY N', qty: 2, revenue: 232, category: 'BURGERS' }],
    paymentMethods: [{ method: 'APPTX', count: 1 }],
    avgWaitTime: undefined, avgCookTime: undefined,
  },
  {
    id: 's5', name: 'Breakfast (06–13h)', startHour: 6, endHour: 13,
    date: '2026-06-13', closedAt: '2026-06-13 — 12:01',
    revenue: 312, ordersClosed: 2, tablesServed: 1, cancelledValue: 0,
    topItems: [{ name: 'MR FANCYPANTS', qty: 2, revenue: 312, category: 'BURGERS' }],
    paymentMethods: [{ method: 'CASH', count: 2 }],
    avgWaitTime: undefined, avgCookTime: 810,
  },
];

export const MOCK_MGMT_MONTHLY = {
  period: 'Monthly',
  dateRange: '01/06/2026 → 30/06/2026',
  orders: 181,
  avgWait: '3m 38s',
  avgCook: '6m 44s',
  totalRevenue: 37993,
  revenueChange: 16.8,
  ordersChange: 61,
  revenueOverTime: [
    { x: 1, current: 1200, previous: 800 },
    { x: 2, current: 2400, previous: 1600 },
    { x: 3, current: 7800, previous: 3200 },
    { x: 4, current: 4200, previous: 2800 },
    { x: 5, current: 3100, previous: 2100 },
    { x: 6, current: 2800, previous: 1800 },
    { x: 7, current: 6200, previous: 4200 },
    { x: 8, current: 7100, previous: 4800 },
    { x: 9, current: 5400, previous: 3600 },
    { x: 10, current: 6800, previous: 4100 },
    { x: 11, current: 7200, previous: 4400 },
    { x: 12, current: 6100, previous: 3900 },
    { x: 13, current: 3800, previous: 2200 },
    { x: 14, current: 1800, previous: 900 },
  ],
  revenueByShift: [
    { shift: 'Morning', revenue: 1200, prevRevenue: 900, orders: 8, prevOrders: 6 },
    { shift: 'Brunch', revenue: 4200, prevRevenue: 2800, orders: 18, prevOrders: 14 },
    { shift: 'Supper', revenue: 8100, prevRevenue: 6200, orders: 32, prevOrders: 28 },
    { shift: 'Late Night', revenue: 16800, prevRevenue: 14200, orders: 72, prevOrders: 58 },
    { shift: 'breakfast', revenue: 2400, prevRevenue: 1800, orders: 14, prevOrders: 11 },
    { shift: 'lunch', revenue: 5800, prevRevenue: 3600, orders: 37, prevOrders: 24 },
  ],
  topItems: [
    { name: 'PAPAS CALIBRE 9000', current: 152, previous: 98 },
    { name: 'MR', current: 112, previous: 88 },
    { name: 'FANCYPANTS', current: 98, previous: 72 },
    { name: 'QUESO', current: 76, previous: 54 },
    { name: 'GOUDA', current: 68, previous: 48 },
    { name: 'BACONBITS', current: 52, previous: 38 },
  ],
  paymentMethods: [
    { name: 'APPTX', value: 74 },
    { name: 'BKTX', value: 9 },
    { name: 'CASH', value: 17 },
  ],
  customerTypes: [
    { name: 'UBER', value: 40 },
    { name: 'DIDI', value: 42 },
    { name: 'RAPPI', value: 7 },
    { name: 'MOB+', value: 6 },
    { name: 'DIRECT', value: 4 },
    { name: 'DIDI (prev)', value: 1 },
  ],
  shoppingExpenses: [
    { x: 1, current: 1800, previous: 0 },
    { x: 2, current: 400, previous: 0 },
    { x: 3, current: 3200, previous: 0 },
  ],
  shoppingExpensesTotal: 6620.51,
};

export const MOCK_KITCHEN_TIMERS: KitchenTimer[] = [
  { id: 'kt1', label: 'Starters', seconds: 600, running: false, elapsed: 0 },
  { id: 'kt2', label: 'Mains', seconds: 1200, running: false, elapsed: 0 },
  { id: 'kt3', label: 'Desserts', seconds: 480, running: false, elapsed: 0 },
  { id: 'kt4', label: 'Grill', seconds: 900, running: false, elapsed: 0 },
  { id: 'kt5', label: 'Fryer', seconds: 300, running: false, elapsed: 0 },
];
