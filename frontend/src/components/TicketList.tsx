import { Ticket, api } from '../api';

interface Props {
  tickets: Ticket[];
  onUpdated: () => void;
}

export function TicketList({ tickets, onUpdated }: Props) {
  const handleClose = async (id: number) => {
    await api.updateStatus(id, 'closed');
    onUpdated();
  };

  if (tickets.length === 0) {
    return <p data-testid="empty-state">Keine Tickets vorhanden.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {tickets.map((t) => (
        <li key={t.id} data-testid="ticket-item"
          style={{ border: '1px solid #ddd', borderRadius: 8, padding: 12, marginBottom: 8 }}>
          <strong data-testid="ticket-title-display">{t.title}</strong>
          <span style={{ marginLeft: 8, fontSize: 12, color: t.status === 'open' ? 'green' : 'gray' }}>
            [{t.status}]
          </span>
          <p style={{ margin: '4px 0', fontSize: 14, color: '#555' }}>{t.description}</p>
          {t.status === 'open' && (
            <button onClick={() => handleClose(t.id)} data-testid="close-ticket">
              Schließen
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
