import { useEffect, useState } from 'react';
import { api, Ticket } from './api';
import { TicketForm } from './components/TicketForm';
import { TicketList } from './components/TicketList';
import { AdminStats } from './components/AdminStats';
import { AdminFilter, FilterState } from './components/AdminFilter';
import { ExtensionSuggestions } from './components/ExtensionSuggestions';
import { ReweLogo } from './components/ReweLogo';

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
    /* ── Hintergrundfarbe: REWE Hellgrau/Weiß ── */
    <div className="min-h-screen" style={{ backgroundColor: '#f5f5f5', fontFamily: "'Thesis', 'TheSans', Arial, Helvetica, sans-serif" }}>

      {/* ── REWE Corporate Header ── */}
      <header
        data-testid="rewe-header"
        className="sticky top-0 z-10 shadow-md"
        style={{ backgroundColor: '#CC071E' }}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">

          {/* REWE Logo */}
          <ReweLogo width={52} className="flex-shrink-0" />

          {/* Titel */}
          <div className="flex-1 min-w-0">
            <h1
              data-testid="rewe-brand-title"
              className="text-sm font-bold leading-tight"
              style={{ color: '#FFFFFF', fontFamily: "'Thesis', 'TheSans', Arial, Helvetica, sans-serif" }}
            >
              Helpdesk Demo
            </h1>
            <p className="text-[10px] leading-tight" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Powered by Claude AI
            </p>
          </div>

          {/* View Toggle – REWE-konform (Weiß/Dunkelrot) */}
          <div
            className="flex rounded-lg overflow-hidden border"
            style={{ borderColor: 'rgba(255,255,255,0.4)' }}
          >
            <button
              onClick={() => setView('user')}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                view === 'user'
                  ? { backgroundColor: '#FFFFFF', color: '#CC071E' }
                  : { backgroundColor: 'transparent', color: '#FFFFFF' }
              }
            >
              👤 Mitarbeiter
            </button>
            <button
              onClick={() => setView('admin')}
              className="px-3 py-1.5 text-xs font-medium transition-colors"
              style={
                view === 'admin'
                  ? { backgroundColor: '#FFFFFF', color: '#CC071E' }
                  : { backgroundColor: 'transparent', color: '#FFFFFF' }
              }
            >
              🔧 IT-Admin
            </button>
          </div>

          {/* Reset-Button */}
          <button
            onClick={handleReset}
            disabled={resetting}
            title="Demo auf Ausgangszustand zurücksetzen"
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border
              transition-colors disabled:opacity-50 flex-shrink-0"
            style={
              resetDone
                ? { backgroundColor: 'rgba(255,255,255,0.25)', borderColor: 'rgba(255,255,255,0.6)', color: '#FFFFFF' }
                : { backgroundColor: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.4)', color: '#FFFFFF' }
            }
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
            {/* Welcome Banner – REWE Rot */}
            <div
              data-testid="rewe-welcome-banner"
              className="rounded-2xl p-6 mb-6 text-white"
              style={{ background: 'linear-gradient(135deg, #CC071E 0%, #a3051a 100%)' }}
            >
              <h2
                className="text-xl font-bold mb-1"
                style={{ fontFamily: "'Thesis', 'TheSans', Arial, Helvetica, sans-serif" }}
              >
                Wie können wir helfen?
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Störung melden, Zugang anfragen, Frage stellen — wir kümmern uns.
                Unsere KI analysiert dein Ticket sofort.
              </p>
              {userOpenTickets.length > 0 && (
                <div
                  className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5"
                  style={{ backgroundColor: 'rgba(255,255,255,0.18)' }}
                >
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
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
                <h3
                  className="text-sm font-semibold mb-3"
                  style={{ color: '#333333' }}
                >
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
                <h2
                  className="text-lg font-bold"
                  style={{ color: '#333333', fontFamily: "'Thesis', 'TheSans', Arial, Helvetica, sans-serif" }}
                >
                  IT-Admin Dashboard
                </h2>
                <p className="text-xs" style={{ color: '#888888' }}>
                  Alle Tickets verwalten · KI-Analyse · Prioritäten
                </p>
              </div>
              <span
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border"
                style={{ backgroundColor: '#f9e6e9', color: '#CC071E', borderColor: '#f0b8c0' }}
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
              <div className="text-center py-12" style={{ color: '#888888' }}>
                <p className="text-sm">Keine Tickets für diesen Filter.</p>
              </div>
            ) : (
              <TicketList tickets={filteredTickets} onUpdated={load} adminMode={true} />
            )}
          </>
        )}
      </main>

      {/* ── REWE Footer ── */}
      <footer
        data-testid="rewe-footer"
        className="mt-12 py-4 text-center text-xs"
        style={{ backgroundColor: '#333333', color: 'rgba(255,255,255,0.6)' }}
      >
        <span style={{ color: 'rgba(255,255,255,0.4)' }}>© REWE Digital · Helpdesk Demo</span>
      </footer>
    </div>
  );
}
