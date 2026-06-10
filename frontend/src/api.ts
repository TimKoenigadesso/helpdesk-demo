const API_BASE = import.meta.env['VITE_API_URL'] ?? 'http://localhost:8000';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  category: string;
  priority: string;
  ai_suggestion: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChangeLogEntry {
  id: number;
  ticket_id: number;
  field: string;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_at: string;
}

export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Priority = typeof PRIORITIES[number];

export const api = {
  async listTickets(): Promise<Ticket[]> {
    const r = await fetch(`${API_BASE}/tickets`);
    if (!r.ok) throw new Error('Failed to fetch tickets');
    return r.json() as Promise<Ticket[]>;
  },
  async createTicket(data: { title: string; description: string }): Promise<Ticket> {
    const r = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) throw new Error('Failed to create ticket');
    return r.json() as Promise<Ticket>;
  },
  async updateStatus(id: number, status: string): Promise<Ticket> {
    const r = await fetch(`${API_BASE}/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!r.ok) throw new Error('Failed to update ticket');
    return r.json() as Promise<Ticket>;
  },
  async analyzeTicket(id: number): Promise<Ticket> {
    const r = await fetch(`${API_BASE}/tickets/${id}/analyze`, { method: 'POST' });
    if (!r.ok) throw new Error('Failed to analyze ticket');
    return r.json() as Promise<Ticket>;
  },
  async updatePriority(
    id: number,
    priority: string,
    role: string = 'manager',
    changedBy: string = 'Projektmanager',
  ): Promise<Ticket> {
    const r = await fetch(`${API_BASE}/tickets/${id}/priority`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': role,
      },
      body: JSON.stringify({ priority, changed_by: changedBy }),
    });
    if (r.status === 403) {
      const err = await r.json() as { detail: string };
      throw new Error(`403:${err.detail}`);
    }
    if (!r.ok) throw new Error('Failed to update priority');
    return r.json() as Promise<Ticket>;
  },
  async getChangeLog(id: number): Promise<ChangeLogEntry[]> {
    const r = await fetch(`${API_BASE}/tickets/${id}/change-log`);
    if (!r.ok) throw new Error('Failed to fetch change log');
    return r.json() as Promise<ChangeLogEntry[]>;
  },
};
