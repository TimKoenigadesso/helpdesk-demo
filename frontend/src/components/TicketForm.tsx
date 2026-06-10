import { useState, useRef } from 'react';
import { api } from '../api';

interface Props {
  onCreated: () => void;
}

const TICKET_TYPES = [
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'story', label: 'Story' },
];

const PRIORITIES = [
  { value: 'low', label: 'Niedrig' },
  { value: 'medium', label: 'Mittel' },
  { value: 'high', label: 'Hoch' },
  { value: 'critical', label: 'Kritisch' },
];

interface FormErrors {
  title?: string;
  description?: string;
  type?: string;
  priority?: string;
}

export function TicketForm({ onCreated }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('task');
  const [priority, setPriority] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Prüft ob das Formular dirty (verändert) ist */
  const isDirty = () =>
    title.trim() !== '' ||
    description.trim() !== '' ||
    type !== 'task' ||
    priority !== 'medium';

  /** Client-seitige Validierung aller Pflichtfelder */
  const validate = (): FormErrors => {
    const errs: FormErrors = {};
    if (!title.trim()) errs.title = 'Titel ist ein Pflichtfeld';
    if (!description.trim()) errs.description = 'Beschreibung ist ein Pflichtfeld';
    if (!type) errs.type = 'Typ ist ein Pflichtfeld';
    if (!priority) errs.priority = 'Priorität ist ein Pflichtfeld';
    return errs;
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('task');
    setPriority('medium');
    setErrors({});
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setServerError(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);
    try {
      const created = await api.createTicket({ title: title.trim(), description, type, priority });
      resetForm();
      setSuccessMessage(`Ticket #${created.id} wurde erfolgreich erstellt!`);
      // Erfolgsmeldung nach 5 Sekunden automatisch ausblenden
      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => setSuccessMessage(null), 5000);
      onCreated();
    } catch (err: unknown) {
      setServerError(
        err instanceof Error ? err.message : 'Fehler beim Erstellen des Tickets'
      );
    } finally {
      setLoading(false);
    }
  };

  /** Verwerfen-Dialog: nur wenn Formular dirty ist */
  const handleDiscard = () => {
    if (!isDirty()) return;
    const confirmed = window.confirm(
      'Möchten Sie die Eingaben verwerfen? Alle nicht gespeicherten Änderungen gehen verloren.'
    );
    if (confirmed) {
      resetForm();
      setSuccessMessage(null);
    }
  };

  const inputBase =
    'block w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
  const inputNormal = `${inputBase} border-gray-300`;
  const inputError = `${inputBase} border-red-400 bg-red-50`;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      data-testid="ticket-form"
      className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6"
    >
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Neues Ticket erstellen</h2>

      {/* Erfolgsmeldung */}
      {successMessage && (
        <div
          role="alert"
          data-testid="ticket-success"
          className="mb-4 flex items-start gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800"
        >
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>{successMessage}</span>
        </div>
      )}

      {/* Server-Fehlermeldung */}
      {serverError && (
        <div
          role="alert"
          data-testid="ticket-server-error"
          className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800"
        >
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>{serverError}</span>
        </div>
      )}

      {/* Titel (Pflichtfeld) */}
      <div className="mb-3">
        <label htmlFor="ticket-title-input" className="block text-xs font-medium text-gray-700 mb-1">
          Titel <span className="text-red-500">*</span>
        </label>
        <input
          id="ticket-title-input"
          placeholder="Kurze, prägnante Zusammenfassung"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          data-testid="ticket-title"
          className={errors.title ? inputError : inputNormal}
          aria-invalid={!!errors.title}
          aria-describedby={errors.title ? 'error-title' : undefined}
        />
        {errors.title && (
          <p id="error-title" role="alert" data-testid="error-title" className="mt-1 text-xs text-red-600">
            {errors.title}
          </p>
        )}
      </div>

      {/* Beschreibung (Pflichtfeld) */}
      <div className="mb-3">
        <label htmlFor="ticket-description-input" className="block text-xs font-medium text-gray-700 mb-1">
          Beschreibung <span className="text-red-500">*</span>
        </label>
        <textarea
          id="ticket-description-input"
          placeholder="Detaillierte Beschreibung des Problems oder der Anforderung"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
          }}
          rows={3}
          data-testid="ticket-description"
          className={`${errors.description ? inputError : inputNormal} resize-none`}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'error-description' : undefined}
        />
        {errors.description && (
          <p id="error-description" role="alert" data-testid="error-description" className="mt-1 text-xs text-red-600">
            {errors.description}
          </p>
        )}
      </div>

      {/* Typ & Priorität nebeneinander */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Typ (Pflichtfeld) */}
        <div>
          <label htmlFor="ticket-type-input" className="block text-xs font-medium text-gray-700 mb-1">
            Typ <span className="text-red-500">*</span>
          </label>
          <select
            id="ticket-type-input"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              if (errors.type) setErrors((prev) => ({ ...prev, type: undefined }));
            }}
            data-testid="ticket-type"
            className={`${errors.type ? inputError : inputNormal} bg-white`}
            aria-invalid={!!errors.type}
            aria-describedby={errors.type ? 'error-type' : undefined}
          >
            {TICKET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          {errors.type && (
            <p id="error-type" role="alert" data-testid="error-type" className="mt-1 text-xs text-red-600">
              {errors.type}
            </p>
          )}
        </div>

        {/* Priorität (Pflichtfeld) */}
        <div>
          <label htmlFor="ticket-priority-input" className="block text-xs font-medium text-gray-700 mb-1">
            Priorität <span className="text-red-500">*</span>
          </label>
          <select
            id="ticket-priority-input"
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              if (errors.priority) setErrors((prev) => ({ ...prev, priority: undefined }));
            }}
            data-testid="ticket-priority"
            className={`${errors.priority ? inputError : inputNormal} bg-white`}
            aria-invalid={!!errors.priority}
            aria-describedby={errors.priority ? 'error-priority' : undefined}
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {errors.priority && (
            <p id="error-priority" role="alert" data-testid="error-priority" className="mt-1 text-xs text-red-600">
              {errors.priority}
            </p>
          )}
        </div>
      </div>

      {/* Aktions-Buttons */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          data-testid="ticket-submit"
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium
            hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Wird erstellt…' : 'Ticket erstellen'}
        </button>
        <button
          type="button"
          onClick={handleDiscard}
          disabled={!isDirty() || loading}
          data-testid="ticket-discard"
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium
            hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Verwerfen
        </button>
      </div>
    </form>
  );
}
