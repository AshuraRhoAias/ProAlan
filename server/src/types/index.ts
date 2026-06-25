import type { Request } from 'express';

export interface AuthRequest extends Request {
  user?: { id: number; name: string; role: string };
}

export type UserRole = 'admin' | 'manager' | 'kitchen' | 'waiter';

export interface JwtPayload {
  id: number;
  name: string;
  role: UserRole;
}

export type OrderStatus = 'waiting' | 'cooking' | 'ready' | 'closed' | 'cancelled';
export type TableStatus = 'available' | 'occupied' | 'reserved';
export type ModifierType = 'included' | 'removed' | 'extra';
