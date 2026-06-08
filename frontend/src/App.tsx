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
    <div style={{ maxWidth: 700, margin: '40px auto', padding: '0 20px' }}>
      <h1>Helpdesk Demo</h1>
      <TicketForm onCreated={load} />
      <TicketList tickets={tickets} onUpdated={load} />
    </div>
  );
}

export default App;
