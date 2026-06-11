import { Ticket } from '../api';

interface Props {
  tickets: Ticket[];
  onAnalyzeAll: () => void;
  analyzing: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  bug: 'Bug', feature: 'Feature', question: 'Frage',
  access: 'Zugang', infrastructure: 'Infrastruktur', uncategorized: 'Sonstig',
};

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-400',
  medium: 'bg-yellow-400', low: 'bg-green-400',
};

export function AdminStats({ tickets, onAnalyzeAll, analyzing }: Props) {
  const open = tickets.filter(t => t.status === 'open');
  const closed = tickets.filter(t => t.status !== 'open');
  const critical = open.filter(t => t.priority === 'critical');
  const unanalyzed = open.filter(t => !t.ai_suggestion);

  const byCat = Object.entries(
    open.reduce<Record<string, number>>((acc, t) => {
      acc[t.category] = (acc[t.category] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-5">
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Gesamt', value: tickets.length, color: 'text-gray-800' },
          { label: 'Offen', value: open.length, color: 'text-orange-600' },
          { label: 'Kritisch', value: critical.length, color: 'text-red-600' },
          { label: 'Geschlossen', value: closed.length, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="text-center bg-gray-50 rounded-xl py-3 px-2">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Category breakdown + AI batch */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {byCat.map(([cat, count]) => (
            <span key={cat} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              {CATEGORY_LABELS[cat] ?? cat}: {count}
            </span>
          ))}
        </div>
        {unanalyzed.length > 0 && (
          <button
            onClick={onAnalyzeAll}
            disabled={analyzing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {analyzing ? (
              <>
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Analysiert…
              </>
            ) : (
              <>✨ Alle {unanalyzed.length} analysieren</>
            )}
          </button>
        )}
      </div>

      {/* Priority bar */}
      {open.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] text-gray-400 mb-1.5">Prioritäts-Verteilung (offen)</p>
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            {(['critical', 'high', 'medium', 'low'] as const).map(p => {
              const count = open.filter(t => t.priority === p).length;
              if (!count) return null;
              return (
                <div
                  key={p}
                  className={`${PRIORITY_COLORS[p]} transition-all`}
                  style={{ flex: count }}
                  title={`${p}: ${count}`}
                />
              );
            })}
          </div>
          <div className="flex gap-3 mt-1.5">
            {(['critical', 'high', 'medium', 'low'] as const).map(p => {
              const count = open.filter(t => t.priority === p).length;
              if (!count) return null;
              return (
                <span key={p} className="flex items-center gap-1 text-[10px] text-gray-400">
                  <span className={`w-2 h-2 rounded-full ${PRIORITY_COLORS[p]}`} />
                  {p} ({count})
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
