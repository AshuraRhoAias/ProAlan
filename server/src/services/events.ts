import type { Response } from 'express';

type EventType = 'order_new' | 'order_status' | 'shift_open' | 'shift_close';

interface SSEClient {
  id: string;
  res: Response;
}

const clients: SSEClient[] = [];

export function addClient(id: string, res: Response) {
  clients.push({ id, res });
  res.on('close', () => removeClient(id));
}

function removeClient(id: string) {
  const idx = clients.findIndex(c => c.id === id);
  if (idx >= 0) clients.splice(idx, 1);
}

export function emit(type: EventType, data: unknown) {
  const payload = `event: ${type}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try { client.res.write(payload); } catch (_) { removeClient(client.id); }
  }
}
