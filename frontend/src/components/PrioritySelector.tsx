import { useState, useEffect, useRef } from 'react';
import { api, PRIORITIES } from '../api';

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Niedrig',
  medium: 'Mittel',
  high: 'Hoch',
  critical: 'Kritisch',
};

// In einer echten Anwendung kaeame die Rolle aus dem Auth-Context.
// Hier lesen wir sie aus localStorage (Demo-Zwecke) oder setzen 'viewer' als Default.
function getUserRole(): string {
  return (typeof window !== 'undefined' && localStorage.getItem('userRole')) || 'manager';
}

interface Props {
  ticketId: number;
  currentPriority: string;
  onUpdated: () => void;
}

export function PrioritySelector({ ticketId, currentPriority, onUpdated }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState(currentPriority);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const originalPriorityRef = useRef(currentPriority);
  const hasUnsavedChanges = selectedPriority !== originalPriorityRef.current;

  // Wenn sich currentPriority von aussen aendert, synchronisieren
  useEffect(() => {
    if (!isEditing) {
      setSelectedPriority(currentPriority);
      originalPriorityRef.current = currentPriority;
    }
  }, [currentPriority, isEditing]);

  const role = getUserRole();
  const canEdit = role === 'admin' || role === 'manager' || role === 'projectmanager';

  const handleEditClick = () => {
    if (!canEdit) {
      setPermissionDenied(true);
      return;
    }
    setPermissionDenied(false);
    setError(null);
    originalPriorityRef.current = currentPriority;
    setSelectedPriority(currentPriority);
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (selectedPriority === originalPriorityRef.current) {
      setIsEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updatePriority(ticketId, selectedPriority, role, 'Projektmanager');
      originalPriorityRef.current = selectedPriority;
      setIsEditing(false);
      onUpdated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
      if (msg.startsWith('403:')) {
        setError(msg.slice(4));
      } else {
        setError('Prioritaet konnte nicht gespeichert werden.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Sie haben ungespeicherte Aenderungen. Moechten Sie die Aenderung wirklich verwerfen?'
      );
      if (!confirmed) return;
    }
    setSelectedPriority(originalPriorityRef.current);
    setIsEditing(false);
    setError(null);
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPriority(e.target.value);
  };

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-1.5" data-testid="priority-editor">
        <select
          value={selectedPriority}
          onChange={handleDropdownChange}
          disabled={saving}
          data-testid="priority-select"
          className="text-xs rounded border border-gray-300 px-1.5 py-0.5
            focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
            disabled:opacity-50 bg-white"
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
        <button
          onClick={handleSave}
          disabled={saving}
          data-testid="priority-save"
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
            bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50
            disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Speichern...' : 'Speichern'}
        </button>
        <button
          onClick={handleCancel}
          disabled={saving}
          data-testid="priority-cancel"
          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
            border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50
            disabled:cursor-not-allowed transition-colors"
        >
          Abbrechen
        </button>
        {error && (
          <span className="text-xs text-red-600 ml-1" data-testid="priority-error">
            {error}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-col gap-0.5" data-testid="priority-display-wrapper">
      <span className="inline-flex items-center gap-1">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
            ${PRIORITY_STYLES[currentPriority] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}
          data-testid="priority-badge"
        >
          {PRIORITY_LABELS[currentPriority] ?? currentPriority}
        </span>
        {canEdit ? (
          <button
            onClick={handleEditClick}
            data-testid="priority-edit-btn"
            title="Prioritaet bearbeiten"
            className="inline-flex items-center justify-center w-5 h-5 rounded
              text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            {/* Bleistift-Icon */}
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleEditClick}
            data-testid="priority-readonly-btn"
            title="Keine Berechtigung zur Prioritaetsaenderung"
            className="inline-flex items-center justify-center w-5 h-5 rounded
              text-gray-300 cursor-not-allowed"
          >
            {/* Schloss-Icon */}
            <svg className="w-3 h-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </span>
      {permissionDenied && (
        <span
          className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded"
          data-testid="priority-permission-denied"
        >
          Keine Berechtigung zur Prioritaetsaenderung.
        </span>
      )}
    </span>
  );
}
