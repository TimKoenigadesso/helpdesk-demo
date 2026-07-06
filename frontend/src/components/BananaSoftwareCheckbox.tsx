import { useState, KeyboardEvent } from 'react';
import { api } from '../api';

interface Props {
  ticketId: number;
  initialValue: boolean;
  onUpdated: () => void;
}

/**
 * Checkbox zur Kennzeichnung von Bananen-Software im REWE-Design.
 *
 * REWE Brand Guidelines:
 * - Primärfarbe: REWE-Rot (#cc0000)
 * - Akzent: Bananen-Gelb (#FFD700) für das Bananen-Icon
 * - Schrift: serifenlos, klar, ausreichend Kontrast (WCAG 2.1 AA)
 * - Abstände: konsistent mit 4px-Raster
 *
 * Persistenz: Zustand wird serverseitig gespeichert (PATCH /tickets/:id/banana).
 * Barrierefreiheit: role="checkbox", aria-checked, aria-label, Tastatursteuerung.
 */
export function BananaSoftwareCheckbox({ ticketId, initialValue, onUpdated }: Props) {
  const [checked, setChecked] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (loading) return;
    const newValue = !checked;
    setChecked(newValue);
    setLoading(true);
    try {
      await api.setBananaSoftware(ticketId, newValue);
      onUpdated();
    } catch {
      // Rollback bei Fehler
      setChecked(!newValue);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      void handleToggle();
    }
  };

  return (
    <div
      className="flex items-center gap-2 mt-2"
      data-testid="banana-software-container"
    >
      {/* REWE-Design Checkbox */}
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-label="Als Bananen-Software kennzeichnen"
        data-testid="banana-software-checkbox"
        disabled={loading}
        onClick={() => void handleToggle()}
        onKeyDown={handleKeyDown}
        className={`
          relative flex items-center justify-center
          w-5 h-5 rounded
          border-2 transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-offset-1
          disabled:opacity-60 disabled:cursor-not-allowed
          flex-shrink-0
          ${checked
            ? 'bg-[#cc0000] border-[#cc0000] focus:ring-[#cc0000]'
            : 'bg-white border-gray-400 hover:border-[#cc0000] focus:ring-[#cc0000]'
          }
        `}
      >
        {/* Checkmark-Icon */}
        {checked && (
          <svg
            className="w-3 h-3 text-white"
            viewBox="0 0 12 12"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M2 6l3 3 5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {/* Lade-Indikator */}
        {loading && !checked && (
          <svg
            className="w-3 h-3 text-gray-400 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        )}
      </button>

      {/* Label im REWE-Stil */}
      <label
        onClick={() => void handleToggle()}
        className={`
          flex items-center gap-1.5 text-xs font-semibold cursor-pointer select-none
          transition-colors duration-150
          ${checked ? 'text-[#cc0000]' : 'text-gray-500 hover:text-[#cc0000]'}
        `}
        data-testid="banana-software-label"
      >
        {/* Bananen-Icon */}
        <span
          className="text-sm leading-none"
          aria-hidden="true"
          title="Bananen-Software"
        >
          🍌
        </span>
        <span>Bananen-Software</span>
        {checked && (
          <span
            className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-[10px]
              font-bold bg-[#cc0000] text-white tracking-wide"
            data-testid="banana-software-badge"
          >
            MARKIERT
          </span>
        )}
      </label>
    </div>
  );
}
