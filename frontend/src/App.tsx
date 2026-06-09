import { useEffect, useState } from 'react';
import { api, Ticket } from './api';
import { TicketForm } from './components/TicketForm';
import { TicketList } from './components/TicketList';

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const load = async () => {
    try {
      setTickets(await api.listTickets());
    } catch {
      // Backend not available in development
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
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <TicketForm onCreated={load} />
        <TicketList tickets={tickets} onUpdated={load} />
      </main>
    </div>
  );
}

export default App;
