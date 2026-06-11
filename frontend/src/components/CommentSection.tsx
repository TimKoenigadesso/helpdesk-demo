import { useEffect, useRef, useState } from 'react';
import { api, Comment } from '../api';

interface Props {
  ticketId: number;
  /** Im Admin-Modus wird der Autor auf "IT-Admin" gesetzt und Löschen ist möglich. */
  adminMode?: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function CommentSection({ ticketId, adminMode = false }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = async () => {
    try {
      const data = await api.listComments(ticketId);
      setComments(data);
    } catch {
      /* offline — ignore */
    }
  };

  useEffect(() => {
    if (expanded) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, ticketId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const author = adminMode ? 'IT-Admin' : 'Mitarbeiter';
      await api.createComment(ticketId, body.trim(), author);
      setBody('');
      await load();
    } catch {
      setError('Kommentar konnte nicht gespeichert werden.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    try {
      await api.deleteComment(ticketId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch {
      setError('Kommentar konnte nicht gelöscht werden.');
    }
  };

  return (
    <div className="mt-3" data-testid="comment-section">
      {/* Toggle-Button */}
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        data-testid="comment-toggle"
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600
          transition-colors font-medium"
        aria-expanded={expanded}
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        💬 Kommentare
        {comments.length > 0 && !expanded && (
          <span className="ml-1 px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
            {comments.length}
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-2" data-testid="comment-list">
          {/* Bestehende Kommentare */}
          {comments.length === 0 ? (
            <p className="text-xs text-gray-400 italic" data-testid="no-comments">
              Noch keine Kommentare.
            </p>
          ) : (
            comments.map(c => (
              <div
                key={c.id}
                data-testid="comment-item"
                className={`rounded-lg border px-3 py-2 text-xs ${
                  c.author === 'IT-Admin'
                    ? 'bg-indigo-50 border-indigo-100'
                    : 'bg-gray-50 border-gray-100'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`font-semibold ${
                      c.author === 'IT-Admin' ? 'text-indigo-700' : 'text-gray-700'
                    }`}
                    data-testid="comment-author"
                  >
                    {c.author === 'IT-Admin' ? '🔧 IT-Admin' : '👤 Mitarbeiter'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">{formatDate(c.created_at)}</span>
                    {adminMode && (
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        data-testid="comment-delete"
                        className="text-gray-300 hover:text-red-500 transition-colors"
                        title="Kommentar löschen"
                        aria-label="Kommentar löschen"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 leading-relaxed" data-testid="comment-body">
                  {c.body}
                </p>
              </div>
            ))
          )}

          {/* Neuer Kommentar */}
          <form onSubmit={handleSubmit} className="mt-3" data-testid="comment-form">
            <textarea
              ref={textareaRef}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder={
                adminMode
                  ? 'Admin-Antwort schreiben…'
                  : 'Kommentar hinzufügen…'
              }
              rows={2}
              maxLength={2000}
              data-testid="comment-input"
              className="block w-full px-3 py-2 text-xs rounded-lg border border-gray-200
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                resize-none placeholder-gray-400 bg-white"
            />
            <div className="flex items-center justify-between mt-2 gap-2">
              {error && (
                <p className="text-xs text-red-600" data-testid="comment-error">{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting || !body.trim()}
                data-testid="comment-submit"
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                  font-semibold bg-indigo-600 text-white hover:bg-indigo-700
                  disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Speichern…
                  </>
                ) : (
                  adminMode ? '🔧 Admin-Antwort senden' : '💬 Kommentieren'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
