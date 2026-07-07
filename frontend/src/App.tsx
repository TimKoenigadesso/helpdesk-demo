import { useCallback, useEffect, useState } from 'react';
import { api, Ticket } from './api';
import { TicketForm } from './components/TicketForm';
import { TicketList } from './components/TicketList';
import { AdminStats } from './components/AdminStats';
import { AdminFilter, FilterState } from './components/AdminFilter';
import { ExtensionSuggestions } from './components/ExtensionSuggestions';
import { EmojiRain } from './components/EmojiRain';
import { RossmannLogo } from './components/RossmannLogo';

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
  const [emojiRainActive, setEmojiRainActive] = useState(false);

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

  /** Wird vom TicketForm aufgerufen, wenn ein Ticket erfolgreich erstellt wurde */
  const handleTicketCreated = useCallback(async () => {
    await load();
    setEmojiRainActive(true);
  }, []);

  const handleEmojiRainDone = useCallback(() => {
    setEmojiRainActive(false);
  }, []);

  useEffect(() => { load(); }, []);

  const filteredTickets = applyFilter(tickets, filter);
  const userOpenTickets = tickets.filter(t => t.status === 'open');

  return (
    // Vollbreite: w-full statt max-w-3xl auf oberster Ebene
    <div className="min-h-screen bg-gray-50 w-full">

      {/* Emoji-Regen-Overlay */}
      <EmojiRain active={emojiRainActive} onDone={handleEmojiRainDone} />

      {/* ── Rossmann Header (Bauchbinden-Stil) ────────────────────────────── */}
      <header
        data-testid="rossmann-header"
        className="bg-white shadow-md sticky top-0 z-10 w-full"
      >
        {/* Gradient-Akzentlinie oben (Rossmann Motion-ID) */}
        <div className="rossmann-gradient-bar w-full" data-testid="rossmann-gradient-bar" />

        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
          {/* Rossmann-Logo */}
          <div data-testid="rossmann-logo" className="flex-shrink-0">
            <RossmannLogo className="h-10 w-auto" />
          </div>

          {/* Titel-Bereich (Bauchbinden-Stil: weißer Container mit abgerundeten Ecken) */}
          <div className="flex-1 min-w-0 bg-gray-50 rounded-xl px-4 py-2 border border-gray-100">
            <h1 className="text-sm font-bold text-gray-900 leading-tight">
              Helpdesk Demo
            </h1>
            <p className="text-[10px] text-gray-400 leading-tight">Powered by Claude AI</p>
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
            <button
              onClick={() => setView('user')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'user'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              👤 Mitarbeiter
            </button>
            <button
              onClick={() => setView('admin')}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                view === 'admin'
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🔧 IT-Admin
            </button>
          </div>

          {/* Reset-Button */}
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

        {/* Gradient-Akzentlinie unten */}
        <div className="rossmann-gradient-bar w-full" />
      </header>

      {/* ── Haupt-Inhalt: Vollbreite mit zentriertem Content-Bereich ───────── */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-6 max-w-screen-xl mx-auto">

        {/* ── USER PORTAL ── */}
        {view === 'user' && (
          <>
            {/* Welcome Banner im Rossmann-Stil: weißer Container, Rot-Gradient-Akzent */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
              {/* Farbverlauf-Akzentlinie oben */}
              <div className="h-1 w-full bg-gradient-to-r from-red-600 via-orange-500 to-purple-600" />
              <div className="p-6">
                <h2 className="text-xl font-bold mb-1 text-gray-900">Wie können wir helfen?</h2>
                <p className="text-gray-500 text-sm">
                  Störung melden, Zugang anfragen, Frage stellen — wir kümmern uns.
                  Unsere KI analysiert dein Ticket sofort.
                </p>
                {userOpenTickets.length > 0 && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-medium text-red-700">
                      {userOpenTickets.length} offene{userOpenTickets.length === 1 ? 's Ticket' : ' Tickets'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <TicketForm onCreated={handleTicketCreated} />

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
              <span className="flex items-center gap-1.5 text-xs bg-red-50 text-red-700
                border border-red-200 px-2.5 py-1 rounded-full font-medium">
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

      {/* ── Footer im Rossmann Bauchbinden-Stil ──────────────────────────── */}
      <footer className="w-full mt-8 bg-white border-t border-gray-200">
        <div className="rossmann-gradient-bar w-full" />
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between max-w-screen-xl mx-auto">
          <RossmannLogo className="h-7 w-auto opacity-70" />
          <p className="text-[10px] text-gray-400">
            Helpdesk Demo · adesso Agentic SDLC
          </p>
        </div>
      </footer>
    </div>
  );
}
