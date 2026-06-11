import { useState } from 'react';
import { api } from '../api';

const QUICK_TEMPLATES = [
  { label: '🔐 Zugang', title: 'Zugang / Passwort zurücksetzen', description: '' },
  { label: '🖨️ Drucker', title: 'Drucker nicht erreichbar', description: '' },
  { label: '🌐 Netzwerk', title: 'VPN / Netzwerkproblem', description: '' },
  { label: '💻 Software', title: 'Software-Fehler oder Absturz', description: '' },
];

const PRIORITIES = [
  { value: 'low', label: '🟢 Niedrig', description: 'Kein zeitkritischer Handlungsbedarf' },
  { value: 'medium', label: '🟡 Mittel', description: 'Normaler Bearbeitungsfluss' },
  { value: 'high', label: '🟠 Hoch', description: 'Dringend, baldige Bearbeitung erforderlich' },
  { value: 'critical', label: '🔴 Kritisch', description: 'Sofortiger Handlungsbedarf' },
];

interface Props { onCreated: () => void; }

export function TicketForm({ onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [priorityError, setPriorityError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    // Priorität validieren (Pflichtfeld mit Standardwert, sollte immer gesetzt sein)
    if (!priority) {
      setPriorityError('Bitte wähle eine Priorität aus.');
      return;
    }
    setPriorityError('');

    setLoading(true);
    try {
      await api.createTicket({ title, description, priority });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900">Störung melden</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Beschreibe dein Problem — unsere KI kategorisiert und priorisiert es automatisch.
        </p>
      </div>

      {/* Quick templates */}
      <div className="px-6 pt-4">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Häufige Anfragen
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_TEMPLATES.map(t => (
            <button
              key={t.title}
              type="button"
              onClick={() => { setTitle(t.title); setDescription(t.description); }}
              className="text-xs bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700
                border border-gray-200 hover:border-indigo-200 text-gray-600
                px-2.5 py-1 rounded-lg transition-colors"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pb-6">
        <input
          placeholder="Kurze Beschreibung des Problems *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          data-testid="ticket-title"
          className="block w-full mb-3 px-4 py-2.5 rounded-xl border border-gray-200 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            placeholder-gray-400"
        />
        <textarea
          placeholder="Was genau passiert? Fehlermeldung, Gerät, seit wann? *"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          data-testid="ticket-description"
          className="block w-full mb-4 px-4 py-2.5 rounded-xl border border-gray-200 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            resize-none placeholder-gray-400"
        />

        {/* Prioritäts-Dropdown */}
        <div className="mb-4">
          <label
            htmlFor="ticket-priority"
            className="block text-xs font-semibold text-gray-600 mb-1.5"
          >
            Priorität <span className="text-gray-400 font-normal">(Standard: Mittel)</span>
          </label>
          <select
            id="ticket-priority"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPriorityError('');
            }}
            required
            data-testid="ticket-priority"
            className={`block w-full px-4 py-2.5 rounded-xl border text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              bg-white appearance-none cursor-pointer
              ${priorityError ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
          >
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>
                {p.label} — {p.description}
              </option>
            ))}
          </select>
          {priorityError && (
            <p
              data-testid="priority-error"
              className="mt-1 text-xs text-red-600 font-medium"
            >
              {priorityError}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={loading}
            data-testid="ticket-submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white
              text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50
              disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Wird erstellt…
              </>
            ) : 'Ticket einreichen'}
          </button>
          {done && (
            <span className="text-sm text-green-600 font-medium">
              ✓ Ticket erstellt — KI analysiert automatisch
            </span>
          )}
          <p className="ml-auto text-[10px] text-gray-400 hidden sm:block">
            Antwortzeit: &lt;4h normal · &lt;1h kritisch
          </p>
        </div>
      </form>
    </div>
  );
}
