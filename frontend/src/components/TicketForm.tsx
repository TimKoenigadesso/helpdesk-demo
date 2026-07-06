import { useState } from 'react';
import { api } from '../api';

const QUICK_TEMPLATES = [
  { label: '🔐 Zugang', title: 'Zugang / Passwort zurücksetzen', description: '' },
  { label: '🖨️ Drucker', title: 'Drucker nicht erreichbar', description: '' },
  { label: '🌐 Netzwerk', title: 'VPN / Netzwerkproblem', description: '' },
  { label: '💻 Software', title: 'Software-Fehler oder Absturz', description: '' },
];

const PRIORITY_OPTIONS = [
  { value: 'low',      label: 'Niedrig',  style: 'text-blue-700' },
  { value: 'medium',   label: 'Mittel',   style: 'text-yellow-700' },
  { value: 'high',     label: 'Hoch',     style: 'text-orange-700' },
  { value: 'critical', label: 'Kritisch', style: 'text-red-700' },
];

// P0–P4 Prioritätsstufen (AGSDLC-36)
const TICKET_PRIORITY_OPTIONS = [
  {
    value: '',
    label: '— Bitte wählen —',
    description: '',
  },
  {
    value: 'P0',
    label: 'P0 – Kritisch',
    description: 'Produktionsausfall / systemkritischer Fehler, sofortiger Handlungsbedarf',
  },
  {
    value: 'P1',
    label: 'P1 – Hoch',
    description: 'Schwere Beeinträchtigung des Betriebs, keine Umgehungslösung vorhanden',
  },
  {
    value: 'P2',
    label: 'P2 – Mittel',
    description: 'Eingeschränkte Funktionalität, Umgehungslösung möglich',
  },
  {
    value: 'P3',
    label: 'P3 – Niedrig',
    description: 'Geringer Einfluss auf den Betrieb, Bearbeitung kann warten',
  },
  {
    value: 'P4',
    label: 'P4 – Minimal',
    description: 'Kosmetische Probleme oder Verbesserungsvorschläge ohne Dringlichkeit',
  },
];

interface Props { onCreated: () => void; }

export function TicketForm({ onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [ticketPriority, setTicketPriority] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [priorityError, setPriorityError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setPriorityError(false);
    setLoading(true);
    try {
      await api.createTicket({
        title,
        description,
        priority,
        first_name: firstName,
        last_name: lastName,
        ticket_priority: ticketPriority || undefined,
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setTicketPriority('');
      setFirstName('');
      setLastName('');
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
          className="block w-full mb-3 px-4 py-2.5 rounded-xl border border-gray-200 text-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            resize-none placeholder-gray-400"
        />

        {/* Vorname / Nachname */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="ticket-first-name"
              className="block text-xs font-semibold text-gray-500 mb-1.5"
            >
              Vorname
            </label>
            <input
              id="ticket-first-name"
              type="text"
              placeholder="Vorname"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              data-testid="ticket-first-name"
              className="block w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                placeholder-gray-400"
            />
          </div>
          <div>
            <label
              htmlFor="ticket-last-name"
              className="block text-xs font-semibold text-gray-500 mb-1.5"
            >
              Nachname
            </label>
            <input
              id="ticket-last-name"
              type="text"
              placeholder="Nachname"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              data-testid="ticket-last-name"
              className="block w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                placeholder-gray-400"
            />
          </div>
        </div>

        {/* P0–P4 Priorität (AGSDLC-36) */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1.5">
            <label
              htmlFor="ticket-priority-level"
              className="block text-xs font-semibold text-gray-500"
            >
              Priorität (P0–P4) <span className="text-red-500">*</span>
            </label>
            {/* Tooltip-Trigger */}
            <div className="relative">
              <button
                type="button"
                data-testid="priority-tooltip-trigger"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                onFocus={() => setShowTooltip(true)}
                onBlur={() => setShowTooltip(false)}
                className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold
                  flex items-center justify-center hover:bg-indigo-100 hover:text-indigo-600
                  transition-colors cursor-help focus:outline-none focus:ring-2 focus:ring-indigo-400"
                aria-label="Prioritätsstufen Erklärung"
              >
                ?
              </button>
              {showTooltip && (
                <div
                  data-testid="priority-tooltip"
                  className="absolute left-6 top-0 z-20 w-72 bg-gray-900 text-white text-xs
                    rounded-xl shadow-xl p-3 space-y-1.5"
                  role="tooltip"
                >
                  <p className="font-semibold text-gray-100 mb-1">Prioritätsstufen:</p>
                  {TICKET_PRIORITY_OPTIONS.filter(o => o.value).map(opt => (
                    <div key={opt.value} className="flex gap-2">
                      <span className={`font-bold flex-shrink-0 ${
                        opt.value === 'P0' ? 'text-red-400' :
                        opt.value === 'P1' ? 'text-orange-400' :
                        opt.value === 'P2' ? 'text-yellow-400' :
                        opt.value === 'P3' ? 'text-blue-400' : 'text-gray-400'
                      }`}>
                        {opt.value}
                      </span>
                      <span className="text-gray-300">{opt.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <select
            id="ticket-priority-level"
            value={ticketPriority}
            onChange={(e) => {
              setTicketPriority(e.target.value);
              if (e.target.value) setPriorityError(false);
            }}
            data-testid="ticket-priority-level"
            className={`block w-full px-4 py-2.5 rounded-xl border text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              bg-white ${
                priorityError
                  ? 'border-red-400 ring-1 ring-red-300'
                  : 'border-gray-200 text-gray-700'
              }`}
          >
            {TICKET_PRIORITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value} disabled={opt.value === '' ? false : false}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Fehlermeldung wenn kein Wert ausgewählt */}
          {priorityError && (
            <p
              data-testid="priority-error"
              className="mt-1 text-xs text-red-600 font-medium"
            >
              Bitte wähle eine Priorität aus (P0–P4).
            </p>
          )}

          {/* Legende unterhalb des Dropdowns */}
          <div
            data-testid="priority-legend"
            className="mt-2 flex flex-wrap gap-1.5"
          >
            {TICKET_PRIORITY_OPTIONS.filter(o => o.value).map(opt => (
              <span
                key={opt.value}
                title={opt.description}
                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold cursor-help ${
                  opt.value === 'P0' ? 'bg-red-100 text-red-700' :
                  opt.value === 'P1' ? 'bg-orange-100 text-orange-700' :
                  opt.value === 'P2' ? 'bg-yellow-100 text-yellow-700' :
                  opt.value === 'P3' ? 'bg-blue-100 text-blue-700' :
                                       'bg-gray-100 text-gray-600'
                }`}
              >
                {opt.value}
              </span>
            ))}
          </div>
        </div>

        {/* Bestehende Prioritäts-Auswahl (low/medium/high/critical) */}
        <div className="mb-4">
          <label
            htmlFor="ticket-priority"
            className="block text-xs font-semibold text-gray-500 mb-1.5"
          >
            Dringlichkeit
          </label>
          <select
            id="ticket-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            data-testid="ticket-priority"
            className="block w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              bg-white text-gray-700"
          >
            {PRIORITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
