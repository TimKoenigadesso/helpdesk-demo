import { Ticket, api } from '../api';
import { PriorityBadge } from './PriorityBadge';
import { CategoryTag } from './CategoryTag';
import { AiPanel } from './AiPanel';
import { CommentSection } from './CommentSection';

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
      {tickets.map((t) => {
        const isCritical = t.priority === 'critical' && t.status === 'open';
        return (
          <li key={t.id} data-testid="ticket-item"
            className={`bg-white rounded-xl border shadow-sm p-4 transition-colors ${
              t.status === 'open'
                ? isCritical
                  ? 'border-red-400 ring-1 ring-red-300 bg-red-50'
                  : 'border-gray-200'
                : 'border-gray-100 opacity-75'
            }`}>

            {/* Kritisch-Banner */}
            {isCritical && (
              <div
                data-testid="critical-banner"
                className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-red-700"
              >
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd" />
                </svg>
                Kritische Priorität — sofortige Bearbeitung erforderlich
              </div>
            )}

            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Priority dot */}
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[t.priority] ?? 'bg-gray-300'}`} />
                  <span data-testid="ticket-title-display"
                    className="font-semibold text-gray-900 text-sm">
                    {t.title}
                  </span>
                  <span
                    data-testid="ticket-status-badge"
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      t.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {t.status === 'open' ? 'Offen' : 'Geschlossen'}
                  </span>
                  <PriorityBadge priority={t.priority} />
                  <CategoryTag category={t.category} />
                  {adminMode && (
                    <span className="text-[10px] text-gray-400">#{t.id}</span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-gray-600 line-clamp-2">{t.description}</p>
                {t.reporter_name && (
                  <p
                    data-testid="reporter-name-display"
                    className="mt-1.5 flex items-center gap-1 text-xs text-gray-500"
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none"
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Gemeldet von: <span className="font-medium text-gray-700">{t.reporter_name}</span></span>
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

            {/* KI-Analyse-Panel (nur für offene Tickets) */}
            {t.status === 'open' && (
              <AiPanel
                ticketId={t.id}
                suggestion={t.ai_suggestion}
                onAnalyzed={onUpdated}
              />
            )}

            {/* Kommentar-Bereich (immer sichtbar) */}
            <CommentSection ticketId={t.id} adminMode={adminMode} />
          </li>
        );
      })}
    </ul>
  );
}
