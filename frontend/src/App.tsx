import { useEffect, useState } from 'react';
import { api, Ticket } from './api';
import { TicketForm } from './components/TicketForm';
import { TicketList } from './components/TicketList';
import { AdminStats } from './components/AdminStats';
import { AdminFilter, FilterState } from './components/AdminFilter';
import { ExtensionSuggestions } from './components/ExtensionSuggestions';

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

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          {/* Logo */}
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 leading-tight">Helpdesk Demo</h1>
            <p className="text-[10px] text-gray-400 leading-tight">Powered by Claude AI</p>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setView('user')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'user' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              👤 Mitarbeiter
            </button>
            <button
              onClick={() => setView('admin')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'admin' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🔧 IT-Admin
            </button>
          </div>

          {/* Reset */}
          <button
            onClick={handleReset}
            disabled={resetting}
            title="Demo auf Ausgangszustand zurücksetzen"
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors
              disabled:opacity-50 flex-shrink-0 ${
                resetDone
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
              }`}
          >
            <svg className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">
              {resetDone ? '✓ Daten + Code Reset (läuft ~2 Min)' : 'Demo zurücksetzen'}
            </span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">

        {/* ── USER PORTAL ── */}
        {view === 'user' && (
          <>
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-6 mb-6 text-white">
              <h2 className="text-xl font-bold mb-1">Wie können wir helfen?</h2>
              <p className="text-indigo-200 text-sm">
                Störung melden, Zugang anfragen, Frage stellen — wir kümmern uns.
                Unsere KI analysiert dein Ticket sofort.
              </p>
              {userOpenTickets.length > 0 && (
                <div className="mt-3 inline-flex items-center gap-2 bg-white/15 rounded-lg px-3 py-1.5">
                  <span className="w-2 h-2 rounded-full bg-orange-300 animate-pulse" />
                  <span className="text-xs font-medium">
                    {userOpenTickets.length} offene{userOpenTickets.length === 1 ? 's Ticket' : ' Tickets'}
                  </span>
                </div>
              )}
            </div>

            <TicketForm onCreated={load} />

            {/* Open tickets for user */}
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
              <span className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700
                border border-indigo-200 px-2.5 py-1 rounded-full font-medium">
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
    </div>
  );
}
