import { useState } from 'react';
import { api } from '../api';

const QUICK_TEMPLATES = [
  { label: '🔐 Zugang', title: 'Zugang / Passwort zurücksetzen', description: '' },
  { label: '🖨️ Drucker', title: 'Drucker nicht erreichbar', description: '' },
  { label: '🌐 Netzwerk', title: 'VPN / Netzwerkproblem', description: '' },
  { label: '💻 Software', title: 'Software-Fehler oder Absturz', description: '' },
];

const PRIORITY_OPTIONS = [
  { value: 'low',      label: 'Niedrig' },
  { value: 'medium',   label: 'Mittel' },
  { value: 'high',     label: 'Hoch' },
  { value: 'critical', label: 'Kritisch' },
];

/* ── REWE Design Tokens (inline, da Tailwind die Farbe nicht kennt) ── */
const REWE_RED   = '#CC071E';
const REWE_DARK  = '#a3051a';
const REWE_LIGHT = '#f9e6e9';

interface Props { onCreated: () => void; }

export function TicketForm({ onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    try {
      await api.createTicket({
        title,
        description,
        priority,
        first_name: firstName,
        last_name: lastName,
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setFirstName('');
      setLastName('');
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      onCreated();
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'block w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm ' +
    'focus:outline-none focus:border-transparent placeholder-gray-400';

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Card-Header mit REWE-Akzentlinie */}
      <div
        className="px-6 pt-5 pb-4 border-b border-gray-100"
        style={{ borderTop: `3px solid ${REWE_RED}` }}
      >
        <h2
          className="text-base font-bold"
          style={{ color: '#333333', fontFamily: "'Thesis', 'TheSans', Arial, Helvetica, sans-serif" }}
        >
          Störung melden
        </h2>
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
              className="text-xs border border-gray-200 px-2.5 py-1 rounded-lg transition-colors"
              style={{ backgroundColor: '#f5f5f5', color: '#555555' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = REWE_LIGHT;
                (e.currentTarget as HTMLButtonElement).style.color = REWE_RED;
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#f0b8c0';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#f5f5f5';
                (e.currentTarget as HTMLButtonElement).style.color = '#555555';
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e7eb';
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pb-6">
        {/* Titel */}
        <input
          placeholder="Kurze Beschreibung des Problems *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          data-testid="ticket-title"
          className={`${inputClass} mb-3`}
          style={{ fontFamily: "'Thesis', 'TheSans', Arial, Helvetica, sans-serif" }}
          onFocus={e => (e.currentTarget.style.boxShadow = `0 0 0 2px ${REWE_RED}`)}
          onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
        />

        {/* Beschreibung */}
        <textarea
          placeholder="Was genau passiert? Fehlermeldung, Gerät, seit wann? *"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          data-testid="ticket-description"
          className={`${inputClass} mb-3 resize-none`}
          style={{ fontFamily: "'Thesis', 'TheSans', Arial, Helvetica, sans-serif" }}
          onFocus={e => (e.currentTarget.style.boxShadow = `0 0 0 2px ${REWE_RED}`)}
          onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
        />

        {/* Vorname / Nachname */}
        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="ticket-first-name"
              className="block text-xs font-semibold mb-1.5"
              style={{ color: '#555555' }}
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
              className={inputClass}
              onFocus={e => (e.currentTarget.style.boxShadow = `0 0 0 2px ${REWE_RED}`)}
              onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
            />
          </div>
          <div>
            <label
              htmlFor="ticket-last-name"
              className="block text-xs font-semibold mb-1.5"
              style={{ color: '#555555' }}
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
              className={inputClass}
              onFocus={e => (e.currentTarget.style.boxShadow = `0 0 0 2px ${REWE_RED}`)}
              onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
            />
          </div>
        </div>

        {/* Prioritäts-Auswahl */}
        <div className="mb-4">
          <label
            htmlFor="ticket-priority"
            className="block text-xs font-semibold mb-1.5"
            style={{ color: '#555555' }}
          >
            Priorität
          </label>
          <select
            id="ticket-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            data-testid="ticket-priority"
            className="block w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
              focus:outline-none bg-white"
            style={{ color: '#333333', fontFamily: "'Thesis', 'TheSans', Arial, Helvetica, sans-serif" }}
            onFocus={e => (e.currentTarget.style.boxShadow = `0 0 0 2px ${REWE_RED}`)}
            onBlur={e => (e.currentTarget.style.boxShadow = 'none')}
          >
            {PRIORITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="submit"
            disabled={loading}
            data-testid="ticket-submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white
              text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            style={{
              backgroundColor: loading ? REWE_DARK : REWE_RED,
              fontFamily: "'Thesis', 'TheSans', Arial, Helvetica, sans-serif",
            }}
            onMouseEnter={e => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = REWE_DARK;
            }}
            onMouseLeave={e => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = REWE_RED;
            }}
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
            <span className="text-sm font-medium" style={{ color: '#16a34a' }}>
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
