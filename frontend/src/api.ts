const API_BASE =
  import.meta.env['VITE_API_URL'] ??
  'https://helpdesk-demo-backend-781137566329.europe-west3.run.app';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  category: string;
  priority: string;
  ai_suggestion: string | null;
  reporter_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  ticket_id: number;
  author: string;
  body: string;
  created_at: string;
}

export const api = {
  async listTickets(): Promise<Ticket[]> {
    const r = await fetch(`${API_BASE}/tickets`);
    if (!r.ok) throw new Error('Failed to fetch tickets');
    return r.json() as Promise<Ticket[]>;
  },
  async createTicket(data: { title: string; description: string; priority?: string; reporter_name?: string }): Promise<Ticket> {
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

  // ── Kommentar-API ──────────────────────────────────────────────────────────
  async listComments(ticketId: number): Promise<Comment[]> {
    const r = await fetch(`${API_BASE}/tickets/${ticketId}/comments`);
    if (!r.ok) throw new Error('Failed to fetch comments');
    return r.json() as Promise<Comment[]>;
  },
  async createComment(ticketId: number, body: string, author: string = 'Mitarbeiter'): Promise<Comment> {
    const r = await fetch(`${API_BASE}/tickets/${ticketId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body, author }),
    });
    if (!r.ok) throw new Error('Failed to create comment');
    return r.json() as Promise<Comment>;
  },
  async deleteComment(ticketId: number, commentId: number): Promise<void> {
    const r = await fetch(`${API_BASE}/tickets/${ticketId}/comments/${commentId}`, {
      method: 'DELETE',
    });
    if (!r.ok) throw new Error('Failed to delete comment');
  },
};
