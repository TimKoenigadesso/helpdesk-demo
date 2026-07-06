/**
 * MmcTicketForm – Meldeformular im Corporate Design von my-music-company.com
 *
 * Design-Tokens (extrahiert aus https://www.my-music-company.com):
 *   Primärfarbe:  #C8102E  (Corporate Red)
 *   Sekundär:     #1A1A1A  (Deep Black)
 *   Akzent:       #E8B800  (Gold)
 *   Hintergrund:  #F5F5F5  (Light Gray)
 *   Schrift:      Inter / system-ui (serifenlos)
 */
import { useState } from 'react';
import { api } from '../api';

const PRIORITY_OPTIONS = [
  { value: 'low',      label: 'Niedrig'  },
  { value: 'medium',   label: 'Mittel'   },
  { value: 'high',     label: 'Hoch'     },
  { value: 'critical', label: 'Kritisch' },
];

interface Props { onCreated: () => void; }

export function MmcTicketForm({ onCreated }: Props) {
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority]     = useState('medium');
  const [firstName, setFirstName]   = useState('');
  const [lastName, setLastName]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [done, setDone]             = useState(false);
  const [nameError, setNameError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    // Clientseitige Validierung: Mindestens Vor- oder Nachname angeben
    if (!firstName.trim() && !lastName.trim()) {
      setNameError('Bitte geben Sie Ihren Namen an (Vor- und/oder Nachname).');
      return;
    }
    setNameError('');

    setLoading(true);
    try {
      await api.createTicket({
        title,
        description,
        priority,
        first_name: firstName,
        last_name:  lastName,
      });
      setTitle('');
      setDescription('');
      setPriority('medium');
      setFirstName('');
      setLastName('');
      setDone(true);
      setTimeout(() => setDone(false), 5000);
      onCreated();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      data-testid="mmc-ticket-form"
      className="rounded-2xl overflow-hidden shadow-lg border border-gray-200"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* ── MMC Header ───────────────────────────────────────────────────────── */}
      <div
        className="px-6 py-5 flex items-center gap-4"
        style={{ backgroundColor: '#C8102E' }}
        data-testid="mmc-form-header"
      >
        {/* Logo-Bereich */}
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#FFFFFF20' }}
            data-testid="mmc-logo"
          >
            {/* Musiknoten-Icon als SVG (My-Music-Company Brand Symbol) */}
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-base leading-tight tracking-wide">
              my-music-company
            </p>
            <p className="text-white/70 text-xs leading-tight">
              Supportanfrage einreichen
            </p>
          </div>
        </div>
        {/* Goldener Akzent-Streifen */}
        <div
          className="w-1 h-10 rounded-full opacity-80"
          style={{ backgroundColor: '#E8B800' }}
        />
      </div>

      {/* ── Formular ─────────────────────────────────────────────────────────── */}
      <div className="bg-white px-6 pb-6 pt-5">
        {/* Intro */}
        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
          Schildern Sie uns Ihr Anliegen. Wir bearbeiten Ihre Anfrage
          so schnell wie möglich.
        </p>

        <form onSubmit={handleSubmit} noValidate>

          {/* Titel */}
          <div className="mb-4">
            <label
              htmlFor="mmc-title"
              className="block text-xs font-semibold mb-1.5"
              style={{ color: '#1A1A1A' }}
            >
              Betreff <span style={{ color: '#C8102E' }}>*</span>
            </label>
            <input
              id="mmc-title"
              type="text"
              placeholder="Kurze Beschreibung Ihres Problems"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              data-testid="ticket-title"
              className="block w-full px-4 py-2.5 rounded-xl border text-sm
                placeholder-gray-400 focus:outline-none transition-colors"
              style={{
                borderColor: title.trim() ? '#C8102E40' : '#D1D5DB',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#C8102E')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = title.trim() ? '#C8102E40' : '#D1D5DB')}
            />
          </div>

          {/* Beschreibung */}
          <div className="mb-4">
            <label
              htmlFor="mmc-description"
              className="block text-xs font-semibold mb-1.5"
              style={{ color: '#1A1A1A' }}
            >
              Beschreibung <span style={{ color: '#C8102E' }}>*</span>
            </label>
            <textarea
              id="mmc-description"
              placeholder="Was genau ist passiert? Fehlermeldung, Gerät, seit wann?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              data-testid="ticket-description"
              className="block w-full px-4 py-2.5 rounded-xl border text-sm
                placeholder-gray-400 focus:outline-none resize-none transition-colors"
              style={{ borderColor: '#D1D5DB' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#C8102E')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = '#D1D5DB')}
            />
          </div>

          {/* Name-Felder (Pflicht im MMC-Kontext) */}
          <div className="mb-4">
            <p className="text-xs font-semibold mb-1.5" style={{ color: '#1A1A1A' }}>
              Ihr Name <span style={{ color: '#C8102E' }}>*</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="mmc-first-name"
                  className="block text-[11px] text-gray-500 mb-1"
                >
                  Vorname
                </label>
                <input
                  id="mmc-first-name"
                  type="text"
                  placeholder="Vorname"
                  value={firstName}
                  onChange={(e) => { setFirstName(e.target.value); setNameError(''); }}
                  data-testid="ticket-first-name"
                  className="block w-full px-4 py-2.5 rounded-xl border text-sm
                    placeholder-gray-400 focus:outline-none transition-colors"
                  style={{ borderColor: nameError ? '#C8102E' : '#D1D5DB' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#C8102E')}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = nameError ? '#C8102E' : '#D1D5DB')}
                />
              </div>
              <div>
                <label
                  htmlFor="mmc-last-name"
                  className="block text-[11px] text-gray-500 mb-1"
                >
                  Nachname
                </label>
                <input
                  id="mmc-last-name"
                  type="text"
                  placeholder="Nachname"
                  value={lastName}
                  onChange={(e) => { setLastName(e.target.value); setNameError(''); }}
                  data-testid="ticket-last-name"
                  className="block w-full px-4 py-2.5 rounded-xl border text-sm
                    placeholder-gray-400 focus:outline-none transition-colors"
                  style={{ borderColor: nameError ? '#C8102E' : '#D1D5DB' }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = '#C8102E')}
                  onBlur={(e)  => (e.currentTarget.style.borderColor = nameError ? '#C8102E' : '#D1D5DB')}
                />
              </div>
            </div>
            {/* Validierungsfehler-Anzeige */}
            {nameError && (
              <p
                className="mt-1.5 text-xs font-medium"
                style={{ color: '#C8102E' }}
                data-testid="mmc-name-error"
                role="alert"
              >
                {nameError}
              </p>
            )}
          </div>

          {/* Priorität */}
          <div className="mb-5">
            <label
              htmlFor="mmc-priority"
              className="block text-xs font-semibold mb-1.5"
              style={{ color: '#1A1A1A' }}
            >
              Priorität
            </label>
            <select
              id="mmc-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              data-testid="ticket-priority"
              className="block w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm
                focus:outline-none bg-white text-gray-700 transition-colors"
              onFocus={(e) => (e.currentTarget.style.borderColor = '#C8102E')}
              onBlur={(e)  => (e.currentTarget.style.borderColor = '#E5E7EB')}
            >
              {PRIORITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Submit-Bereich */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="submit"
              disabled={loading}
              data-testid="ticket-submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white
                text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-sm hover:shadow-md"
              style={{ backgroundColor: loading ? '#9B0D22' : '#C8102E' }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#9B0D22'; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#C8102E'; }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Wird gesendet…
                </>
              ) : (
                'Anfrage absenden'
              )}
            </button>

            <p className="text-[10px] text-gray-400 ml-auto hidden sm:block">
              * Pflichtfelder
            </p>
          </div>
        </form>
      </div>

      {/* ── MMC Bestätigungsmeldung ───────────────────────────────────────────── */}
      {done && (
        <div
          data-testid="mmc-success-message"
          className="px-6 py-4 flex items-start gap-3 border-t"
          style={{ backgroundColor: '#F9E5E8', borderColor: '#C8102E30' }}
          role="status"
          aria-live="polite"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ backgroundColor: '#C8102E' }}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24"
              stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#1A1A1A' }}>
              Ihre Anfrage wurde erfolgreich übermittelt!
            </p>
            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
              Vielen Dank. Das Team von my-music-company wird sich schnellstmöglich
              bei Ihnen melden.
            </p>
          </div>
        </div>
      )}

      {/* ── MMC Footer ───────────────────────────────────────────────────────── */}
      <div
        className="px-6 py-3 flex items-center gap-2 border-t"
        style={{ backgroundColor: '#1A1A1A', borderColor: '#1A1A1A' }}
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: '#E8B800' }}
        />
        <p className="text-[10px]" style={{ color: '#9CA3AF' }}>
          © my-music-company.com · Alle Anfragen werden vertraulich behandelt
        </p>
      </div>
    </div>
  );
}
