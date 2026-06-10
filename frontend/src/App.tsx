import { useEffect, useState } from 'react';
import { api, Ticket } from './api';
import { TicketForm } from './components/TicketForm';
import { TicketList } from './components/TicketList';
import { WorkflowGuide } from './components/WorkflowGuide';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const load = async () => {
    try {
      setTickets(await api.listTickets());
    } catch {
      // Backend not available in development
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      await fetch(`${BASE_URL}/reset`, { method: 'POST' });
      setResetDone(true);
      setTimeout(() => setResetDone(false), 2500);
      await load();
    } catch {
      // ignore
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">Helpdesk Demo</h1>
            <p className="text-xs text-gray-500">Powered by Claude AI</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={handleReset}
              disabled={resetting}
              title="Demo auf Ausgangszustand zurücksetzen"
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50
                ${resetDone
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              <svg className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {resetDone ? 'Zurückgesetzt ✓' : resetting ? 'Wird zurückgesetzt…' : 'Demo zurücksetzen'}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <WorkflowGuide />
        <TicketForm onCreated={load} />
        <TicketList tickets={tickets} onUpdated={load} />
      </main>
    </div>
  );
}

export default App;
