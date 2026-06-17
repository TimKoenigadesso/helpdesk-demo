import { Ticket, api } from '../api';
import { PriorityBadge } from './PriorityBadge';
import { CategoryTag } from './CategoryTag';
import { AiPanel } from './AiPanel';

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-400',
  medium: 'bg-yellow-400', low: 'bg-green-400',
};

interface Props {
  tickets: Ticket[];
  onUpdated: () => void;
  adminMode?: boolean;
}

export function TicketList({ tickets, onUpdated, adminMode = false }: Props) {
  const handleClose = async (id: number) => {
    await api.updateStatus(id, 'closed');
    onUpdated();
  };
  const handleReopen = async (id: number) => {
    await api.updateStatus(id, 'open');
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
          className={`bg-white rounded-xl border shadow-sm p-4 transition-colors ${
            t.status === 'open'
              ? t.priority === 'critical'
                ? 'border-red-200'
                : 'border-gray-200'
              : 'border-gray-100 opacity-75'
          }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Priority dot */}
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[t.priority] ?? 'bg-gray-300'}`} />
                <span data-testid="ticket-title-display"
                  className="font-semibold text-gray-900 text-sm">
                  {t.title}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  t.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {t.status === 'open' ? 'Offen' : 'Geschlossen'}
                </span>
                <PriorityBadge priority={t.priority} />
                <CategoryTag category={t.category} />
                {adminMode && (
                  <span className="text-[10px] text-gray-400">#{t.id}</span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">{t.description}</p>

              {/* Melder-Name: immer anzeigen falls vorhanden, in Admin-Ansicht besonders hervorgehoben */}
              {t.reporter_name && (
                <p
                  data-testid="reporter-name-display"
                  className={`mt-1.5 flex items-center gap-1 text-xs ${
                    adminMode
                      ? 'text-indigo-700 font-medium'
                      : 'text-gray-500'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24"
                    stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>
                    {adminMode ? 'Melder: ' : 'Von: '}
                    <span data-testid="reporter-name-value">{t.reporter_name}</span>
                  </span>
                </p>
              )}

              {adminMode && (
                <p className="mt-1 text-[10px] text-gray-400">
                  Erstellt: {new Date(t.created_at).toLocaleString('de-DE', {
                    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              {t.status === 'open' && (
                <button
                  onClick={() => handleClose(t.id)}
                  data-testid="close-ticket"
                  className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs
                    font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Schliessen
                </button>
              )}
              {adminMode && t.status !== 'open' && (
                <button
                  onClick={() => handleReopen(t.id)}
                  className="px-3 py-1.5 rounded-lg border border-indigo-200 text-xs
                    font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  Wieder öffnen
                </button>
              )}
            </div>
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
