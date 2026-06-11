export interface FilterState {
  status: 'all' | 'open' | 'closed';
  priority: string;
  category: string;
}

interface Props {
  filter: FilterState;
  onChange: (f: FilterState) => void;
  total: number;
  filtered: number;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'Alle' },
  { value: 'open', label: 'Offen' },
  { value: 'closed', label: 'Geschlossen' },
];
const PRIORITY_OPTIONS = [
  { value: '', label: 'Alle Prioritäten' },
  { value: 'critical', label: '🔴 Kritisch' },
  { value: 'high', label: '🟠 Hoch' },
  { value: 'medium', label: '🟡 Mittel' },
  { value: 'low', label: '🟢 Niedrig' },
];
const CATEGORY_OPTIONS = [
  { value: '', label: 'Alle Kategorien' },
  { value: 'bug', label: 'Bug' },
  { value: 'access', label: 'Zugang' },
  { value: 'infrastructure', label: 'Infrastruktur' },
  { value: 'feature', label: 'Feature' },
  { value: 'question', label: 'Frage' },
];

export function AdminFilter({ filter, onChange, total, filtered }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Status tabs */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
        {STATUS_OPTIONS.map(o => (
          <button
            key={o.value}
            onClick={() => onChange({ ...filter, status: o.value as FilterState['status'] })}
            className={`px-3 py-1.5 text-xs font-medium transition-colors ${
              filter.status === o.value
                ? 'bg-indigo-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <select
        value={filter.priority}
        onChange={e => onChange({ ...filter, priority: e.target.value })}
        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600
          focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {PRIORITY_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select
        value={filter.category}
        onChange={e => onChange({ ...filter, category: e.target.value })}
        className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-gray-600
          focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {CATEGORY_OPTIONS.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {(filter.priority || filter.category || filter.status !== 'all') && (
        <button
          onClick={() => onChange({ status: 'all', priority: '', category: '' })}
          className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Filter zurücksetzen
        </button>
      )}

      <span className="ml-auto text-xs text-gray-400">
        {filtered === total ? `${total} Tickets` : `${filtered} von ${total}`}
      </span>
    </div>
  );
}
