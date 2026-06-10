const API_BASE = import.meta.env['VITE_API_URL'] ?? 'http://localhost:8000';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  type: string;
  category: string;
  priority: string;
  ai_suggestion: string | null;
  created_at: string;
  updated_at: string;
}

export const api = {
  async listTickets(): Promise<Ticket[]> {
    const r = await fetch(`${API_BASE}/tickets`);
    if (!r.ok) throw new Error('Failed to fetch tickets');
    return r.json() as Promise<Ticket[]>;
  },
  async createTicket(data: {
    title: string;
    description: string;
    type: string;
    priority: string;
  }): Promise<Ticket> {
    const r = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({ detail: 'Unbekannter Fehler' }));
      throw new Error(
        typeof err.detail === 'string'
          ? err.detail
          : JSON.stringify(err.detail)
      );
    }
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
};
