import { Ticket, api } from '../api';
import { PrioritySelector } from './PrioritySelector';
import { CategoryTag } from './CategoryTag';
import { AiPanel } from './AiPanel';

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
    return (
      <div className="text-center py-12 text-gray-400" data-testid="empty-state">
        <p className="text-sm">Keine Tickets vorhanden.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {tickets.map((t) => (
        <li key={t.id} data-testid="ticket-item"
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  data-testid="ticket-title-display"
                  className="font-semibold text-gray-900 text-sm"
                >
                  {t.title}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  t.status === 'open'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {t.status === 'open' ? 'Offen' : 'Geschlossen'}
                </span>
                <PrioritySelector
                  ticketId={t.id}
                  currentPriority={t.priority}
                  onUpdated={onUpdated}
                />
                <CategoryTag category={t.category} />
              </div>
              <p className="mt-1.5 text-sm text-gray-600">{t.description}</p>
            </div>
            {t.status === 'open' && (
              <button
                onClick={() => handleClose(t.id)}
                data-testid="close-ticket"
                className="flex-shrink-0 px-3 py-1.5 rounded-lg border border-gray-300 text-xs
                  font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Schliessen
              </button>
            )}
          </div>
          {t.status === 'open' && (
            <AiPanel
              ticketId={t.id}
              suggestion={t.ai_suggestion}
              onAnalyzed={onUpdated}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
