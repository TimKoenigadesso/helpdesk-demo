import { useEffect, useState } from 'react';
import { api, Ticket } from './api';
import { TicketForm } from './components/TicketForm';
import { TicketList } from './components/TicketList';
import { AdminStats } from './components/AdminStats';
import { AdminFilter, FilterState } from './components/AdminFilter';
import { ExtensionSuggestions } from './components/ExtensionSuggestions';
import { ReweHeader } from './components/ReweHeader';
import { ReweHeroBanner } from './components/ReweHeroBanner';
import { ReweCategoryGrid } from './components/ReweCategoryGrid';

const BASE_URL =
  import.meta.env.VITE_API_URL ??
  'https://helpdesk-demo-backend-781137566329.europe-west3.run.app';

type View = 'user' | 'admin';

function applyFilter(tickets: Ticket[], f: FilterState): Ticket[] {
  return tickets.filter(t => {
    if (f.status === 'open' && t.status !== 'open') return false;
    if (f.status === 'closed' && t.status === 'open') return false;
    if (f.priority && t.priority !== f.priority) return false;
    if (f.category && t.category !== f.category) return false;
    return true;
  });
}

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [view, setView] = useState<View>('user');
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [filter, setFilter] = useState<FilterState>({ status: 'all', priority: '', category: '' });

  const load = async () => {
    try { setTickets(await api.listTickets()); } catch { /* offline */ }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch(`${BASE_URL}/reset`, { method: 'POST' });
      const data = await res.json() as { ok?: boolean; pipeline?: string };
      setResetDone(true);
      // Pipeline läuft asynchron (~2 Min) — längere Bestätigung
      const duration = data.pipeline ? 8000 : 2500;
      setTimeout(() => setResetDone(false), duration);
      await load();
    } catch { /* ignore */ } finally { setResetting(false); }
  };

  const handleAnalyzeAll = async () => {
    setAnalyzing(true);
    const unanalyzed = tickets.filter(t => t.status === 'open' && !t.ai_suggestion);
    for (const t of unanalyzed) {
      try { await api.analyzeTicket(t.id); } catch { /* skip */ }
    }
    await load();
    setAnalyzing(false);
  };

  useEffect(() => { load(); }, []);

  const filteredTickets = applyFilter(tickets, filter);
  const userOpenTickets = tickets.filter(t => t.status === 'open');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* REWE Header — rote Navigationsleiste + weißer Header-Balken */}
      <ReweHeader
        view={view}
        onViewChange={setView}
        onReset={handleReset}
        resetting={resetting}
        resetDone={resetDone}
      />

      <main className="max-w-screen-xl mx-auto px-4 py-6">

        {/* ── USER PORTAL ── */}
        {view === 'user' && (
          <>
            {/* REWE Hero-Banner — gelber Hintergrund, Vorteils-Badges */}
            <ReweHeroBanner openTicketCount={userOpenTickets.length} />

            {/* REWE Kategoriekacheln — 4-spaltig, quadratisch */}
            <ReweCategoryGrid />

            {/* Grauer Trennstrich */}
            <hr className="border-gray-200 mb-6" />

            {/* Ticket-Formular */}
            <div className="mb-6">
              <h2
                data-testid="rewe-helpdesk-section-title"
                className="text-lg font-bold text-gray-800 mb-4"
              >
                IT-Helpdesk — Störung melden
              </h2>
              <TicketForm onCreated={load} />
            </div>

            {/* Offene Tickets */}
            {tickets.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Aktuelle Tickets
                </h3>
                <TicketList tickets={tickets} onUpdated={load} adminMode={false} />
              </div>
            )}

            <ExtensionSuggestions />
          </>
        )}

        {/* ── ADMIN BACKEND ── */}
        {view === 'admin' && (
          <>
            {/* Admin header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900">IT-Admin Dashboard</h2>
                <p className="text-xs text-gray-500">Alle Tickets verwalten · KI-Analyse · Prioritäten</p>
              </div>
              <span
                style={{ borderColor: '#CC071E', color: '#CC071E' }}
                className="flex items-center gap-1.5 text-xs bg-red-50
                  border px-2.5 py-1 rounded-full font-medium"
              >
                🔧 Admin-Ansicht
              </span>
            </div>

            <AdminStats
              tickets={tickets}
              onAnalyzeAll={handleAnalyzeAll}
              analyzing={analyzing}
            />

            <AdminFilter
              filter={filter}
              onChange={setFilter}
              total={tickets.length}
              filtered={filteredTickets.length}
            />

            {filteredTickets.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">Keine Tickets für diesen Filter.</p>
              </div>
            ) : (
              <TicketList tickets={filteredTickets} onUpdated={load} adminMode={true} />
            )}
          </>
        )}
      </main>

      {/* Footer — grauer Trennstrich */}
      <footer
        data-testid="rewe-footer"
        className="border-t border-gray-200 bg-white mt-12"
      >
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div
              style={{ backgroundColor: '#CC071E' }}
              className="w-6 h-6 rounded-full flex items-center justify-center"
            >
              <span className="text-white font-black text-[8px]">R</span>
            </div>
            <span className="text-xs text-gray-500">
              © 2024 REWE Digital GmbH · Demo-Anwendung
            </span>
          </div>
          <span className="text-[10px] text-gray-400">
            Powered by Claude AI · adesso Agentic SDLC
          </span>
        </div>
      </footer>
    </div>
  );
}
