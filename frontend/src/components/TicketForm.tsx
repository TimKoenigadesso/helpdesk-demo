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

/** P0-P4 Prioritätsstufen gemäß AGSDLC-38 */
const P_LEVEL_OPTIONS = [
  {
    value: '',
    label: '— Keine P-Stufe —',
    tooltip: 'Optional: Klassifizierung nach interner P-Skala',
  },
  {
    value: 'P0',
    label: 'P0 – Notfall',
    tooltip: 'P0: Kritischer Systemausfall – sofortige Eskalation, Reaktionszeit < 15 Min.',
  },
  {
    value: 'P1',
    label: 'P1 – Dringend',
    tooltip: 'P1: Schwerwiegende Störung – Reaktionszeit < 1 Stunde.',
  },
  {
    value: 'P2',
    label: 'P2 – Hoch',
    tooltip: 'P2: Erhebliche Beeinträchtigung – Reaktionszeit < 4 Stunden.',
  },
  {
    value: 'P3',
    label: 'P3 – Mittel',
    tooltip: 'P3: Teilweise Beeinträchtigung – Reaktionszeit < 1 Werktag.',
  },
  {
    value: 'P4',
    label: 'P4 – Niedrig',
    tooltip: 'P4: Geringfügige Störung oder Anfrage – Reaktionszeit < 5 Werktage.',
  },
];

interface Props { onCreated: () => void; }

export function TicketForm({ onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [pLevel, setPLevel] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [hoveredPLevel, setHoveredPLevel] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setLoading(true);
    try {
      await api.createTicket({
        title,
        description,
        priority,
        p_level: pLevel || undefined,
        first_name: firstName,
        last_name: lastName,
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setPLevel('');
      setFirstName('');
      setLastName('');
      setDone(true);
      setTimeout(() => setDone(false), 3000);
      onCreated();
    } finally {
      setLoading(false);
    }
  };

  const activePLevelOption = P_LEVEL_OPTIONS.find(o => o.value === (hoveredPLevel ?? pLevel));

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

        {/* Prioritäts-Auswahl (low/medium/high/critical) */}
        <div className="mb-3">
          <label
            htmlFor="ticket-priority"
            className="block text-xs font-semibold text-gray-500 mb-1.5"
          >
            Priorität
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

        {/* P0-P4 Klassifizierung (AGSDLC-38) */}
        <div className="mb-4">
          <label
            htmlFor="ticket-p-level"
            className="block text-xs font-semibold text-gray-500 mb-1.5"
          >
            P-Level Klassifizierung
            <span className="ml-1.5 font-normal text-gray-400">(optional)</span>
          </label>

          {/* Tooltip-Anzeige */}
          {activePLevelOption && activePLevelOption.value && (
            <div
              data-testid="p-level-tooltip"
              className="mb-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-100
                text-xs text-indigo-800 leading-snug"
            >
              {activePLevelOption.tooltip}
            </div>
          )}

          {/* Radio-Buttons für P0-P4 */}
          <div className="flex flex-wrap gap-2" data-testid="p-level-options">
            {P_LEVEL_OPTIONS.filter(o => o.value !== '').map(opt => {
              const isSelected = pLevel === opt.value;
              const isP0 = opt.value === 'P0';
              return (
                <label
                  key={opt.value}
                  title={opt.tooltip}
                  onMouseEnter={() => setHoveredPLevel(opt.value)}
                  onMouseLeave={() => setHoveredPLevel(null)}
                  className={`cursor-pointer inline-flex items-center px-3 py-1.5 rounded-lg
                    border text-xs font-semibold transition-all select-none
                    ${isSelected
                      ? isP0
                        ? 'bg-red-600 text-white border-red-700 ring-2 ring-red-300'
                        : 'bg-indigo-600 text-white border-indigo-700'
                      : isP0
                        ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                    }`}
                >
                  <input
                    type="radio"
                    name="p_level"
                    value={opt.value}
                    checked={isSelected}
                    onChange={() => setPLevel(opt.value)}
                    className="sr-only"
                    data-testid={`p-level-option-${opt.value}`}
                  />
                  {opt.value}
                </label>
              );
            })}
            {/* Auswahl aufheben */}
            {pLevel && (
              <button
                type="button"
                onClick={() => setPLevel('')}
                data-testid="p-level-clear"
                className="text-xs text-gray-400 hover:text-gray-600 underline px-1"
              >
                Zurücksetzen
              </button>
            )}
          </div>

          {/* Hidden select for accessibility & testability */}
          <select
            id="ticket-p-level"
            value={pLevel}
            onChange={(e) => setPLevel(e.target.value)}
            data-testid="ticket-p-level"
            className="sr-only"
            aria-label="P-Level Klassifizierung"
          >
            {P_LEVEL_OPTIONS.map(opt => (
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
