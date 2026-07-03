import { useState } from 'react';
import { api } from '../api';

/* ── REWE Design Tokens ── */
const REWE_RED   = '#CC071E';
const REWE_DARK  = '#a3051a';
const REWE_LIGHT = '#f9e6e9';

interface Props {
  ticketId: number;
  suggestion: string | null;
  onAnalyzed: () => void;
}

export function AiPanel({ ticketId, suggestion, onAnalyzed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.analyzeTicket(ticketId);
      onAnalyzed();
    } catch {
      setError('Analyse fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {suggestion ? (
        <div
          className="rounded-lg p-3"
          style={{ backgroundColor: REWE_LIGHT, border: `1px solid #f0b8c0` }}
        >
          <p
            className="text-xs font-semibold mb-1"
            style={{ color: REWE_RED, fontFamily: "'Thesis', 'TheSans', Arial, Helvetica, sans-serif" }}
          >
            KI-Antwortvorschlag
          </p>
          <p className="text-sm" style={{ color: '#333333' }} data-testid="ai-suggestion">
            {suggestion}
          </p>
        </div>
      ) : (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          data-testid="analyze-button"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
            text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          style={{ backgroundColor: loading ? REWE_DARK : REWE_RED }}
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
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Analysiert...
            </>
          ) : (
            'KI analysieren'
          )}
        </button>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
