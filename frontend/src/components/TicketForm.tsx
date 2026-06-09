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
    <form onSubmit={handleSubmit} className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Neues Ticket erstellen</h2>
      <input
        placeholder="Titel"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        data-testid="ticket-title"
        className="block w-full mb-3 px-3 py-2 rounded-lg border border-gray-300 text-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />
      <textarea
        placeholder="Beschreibung"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        rows={3}
        data-testid="ticket-description"
        className="block w-full mb-4 px-3 py-2 rounded-lg border border-gray-300 text-sm
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
      />
      <button
        type="submit"
        disabled={loading}
        data-testid="ticket-submit"
        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium
          hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Wird erstellt...' : 'Ticket erstellen'}
      </button>
    </form>
  );
}
