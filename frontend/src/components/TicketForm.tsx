import { useState } from 'react';
import { api } from '../api';

interface Props { onCreated: () => void; }

export function TicketForm({ onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    try {
      await api.createTicket({ title, description });
      setTitle('');
      setDescription('');
      onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24, padding: 16, border: '1px solid #ddd', borderRadius: 8 }}>
      <h2 style={{ marginBottom: 12 }}>Neues Ticket erstellen</h2>
      <input
        placeholder="Titel"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        data-testid="ticket-title"
        style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8, boxSizing: 'border-box' }}
      />
      <textarea
        placeholder="Beschreibung"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        rows={3}
        data-testid="ticket-description"
        style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8, boxSizing: 'border-box' }}
      />
      <button type="submit" disabled={loading} data-testid="ticket-submit">
        {loading ? 'Wird erstellt...' : 'Ticket erstellen'}
      </button>
    </form>
  );
}
