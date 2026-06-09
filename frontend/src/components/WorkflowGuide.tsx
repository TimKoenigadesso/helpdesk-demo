import { useState } from 'react';

const JIRA_URL = import.meta.env['VITE_JIRA_URL'] as string | undefined;
const GITLAB_URL = import.meta.env['VITE_GITLAB_URL'] as string | undefined;
const CONFLUENCE_URL = import.meta.env['VITE_CONFLUENCE_URL'] as string | undefined;
const GITLAB_PROJECT_PATH = import.meta.env['VITE_GITLAB_PROJECT_PATH'] as string | undefined;

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs
        bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
      title="Kopieren"
    >
      {copied ? (
        <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
}

function ExternalLink({ href, children }: { href: string | undefined; children: React.ReactNode }) {
  if (!href) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-400 italic">
        {children} (URL nicht konfiguriert)
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600
        hover:text-indigo-800 hover:underline transition-colors"
    >
      {children}
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}

function CodeRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-xs">
      <span className="text-gray-400 w-40 flex-shrink-0">{label}</span>
      <span className="text-indigo-700 font-medium">=</span>
      <span className="text-gray-700">{value}</span>
      <CopyButton value={value} />
    </div>
  );
}

const STEPS = [
  {
    number: '1',
    title: 'Anforderung formulieren',
    subtitle: 'Claude Desktop · Skill "agentic-demo"',
    color: 'bg-indigo-600',
    content: (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Schreib deine Anforderung in natuerlicher Sprache in Claude Desktop.
          Der Skill formuliert daraus automatisch eine vollstaendige Jira User Story
          mit INVEST-Kriterien und Akzeptanzkriterien.
        </p>
        <div className="flex flex-wrap gap-3">
          <ExternalLink href={JIRA_URL ? `${JIRA_URL}/jira/software/projects` : undefined}>
            Jira Board oeffnen
          </ExternalLink>
          {CONFLUENCE_URL && (
            <ExternalLink href={`${CONFLUENCE_URL}/wiki`}>
              Confluence Doku
            </ExternalLink>
          )}
        </div>
      </div>
    ),
  },
  {
    number: '2',
    title: 'Pipeline starten',
    subtitle: 'GitLab · CI/CD → Pipelines → Run Pipeline',
    color: 'bg-indigo-600',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          Starte die Pipeline manuell mit den zwei Pflicht-Variablen:
        </p>
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 space-y-1.5">
          <CodeRow label="PIPELINE_TYPE" value="agentic-feature" />
          <CodeRow label="JIRA_TICKET_ID" value="DEMO-??" />
        </div>
        <ExternalLink
          href={
            GITLAB_URL && GITLAB_PROJECT_PATH
              ? `${GITLAB_URL}/${GITLAB_PROJECT_PATH}/-/pipelines/new`
              : GITLAB_URL
          }
        >
          GitLab Pipeline starten
        </ExternalLink>
      </div>
    ),
  },
  {
    number: '3',
    title: 'Claude Code implementiert',
    subtitle: 'Automatisch · ~5–10 min',
    color: 'bg-indigo-600',
    content: (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Ein Claude Code Container startet in GitLab. Er liest das Jira-Ticket,
          holt Architektur-Kontext aus Confluence, liest den bestehenden Code
          und implementiert das Feature — inklusive Unit- und E2E-Tests.
        </p>
        <ExternalLink
          href={
            GITLAB_URL && GITLAB_PROJECT_PATH
              ? `${GITLAB_URL}/${GITLAB_PROJECT_PATH}/-/pipelines`
              : GITLAB_URL
          }
        >
          Pipeline-Logs anzeigen
        </ExternalLink>
      </div>
    ),
  },
  {
    number: '4',
    title: 'Tests laufen automatisch',
    subtitle: 'pytest · Playwright · max. 3 Fix-Iterationen',
    color: 'bg-indigo-600',
    content: (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          Unit-Tests (pytest) und E2E-Tests (Playwright) laufen in separaten
          Containern. Bei Fehlern iteriert Claude Code bis zu dreimal selbst —
          nur Produktionscode, keine Aenderungen an den Tests.
        </p>
      </div>
    ),
  },
  {
    number: '5',
    title: 'Merge Request & Review',
    subtitle: 'GitLab MR · Jira "Ready for Review"',
    color: 'bg-green-600',
    content: (
      <div className="space-y-2">
        <p className="text-sm text-gray-600">
          GitLab Merge Request wird automatisch erstellt, Feature-Dokumentation
          committet und das Jira-Ticket auf "Ready for Review" gesetzt.
          Ab hier uebernimmt ein Mensch: Code reviewen, Anmerkungen machen, mergen.
        </p>
        <div className="flex flex-wrap gap-3">
          <ExternalLink
            href={
              GITLAB_URL && GITLAB_PROJECT_PATH
                ? `${GITLAB_URL}/${GITLAB_PROJECT_PATH}/-/merge_requests`
                : GITLAB_URL
            }
          >
            Merge Requests anzeigen
          </ExternalLink>
          <ExternalLink href={JIRA_URL ? `${JIRA_URL}/jira/software/projects` : undefined}>
            Jira Board anzeigen
          </ExternalLink>
        </div>
      </div>
    ),
  },
];

export function WorkflowGuide() {
  const [open, setOpen] = useState(true);

  return (
    <div className="mb-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4
          hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Agentischer Entwicklungs-Workflow</h2>
            <p className="text-xs text-gray-500">Von der Anforderung zum Merge Request — vollautomatisch</p>
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {/* Steps */}
          <div className="mt-5 space-y-0">
            {STEPS.map((step, i) => (
              <div key={step.number} className="flex gap-4">
                {/* Linie + Kreis */}
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center
                    text-white text-xs font-bold flex-shrink-0 ${step.color}`}>
                    {step.number}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 my-1" />
                  )}
                </div>
                {/* Inhalt */}
                <div className={`pb-5 flex-1 min-w-0 ${i === STEPS.length - 1 ? '' : ''}`}>
                  <div className="mb-1.5">
                    <span className="text-sm font-semibold text-gray-900">{step.title}</span>
                    <span className="ml-2 text-xs text-gray-400">{step.subtitle}</span>
                  </div>
                  {step.content}
                </div>
              </div>
            ))}
          </div>

          {/* Demo-Reset */}
          <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start gap-3">
              <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div className="flex-1">
                <p className="text-xs font-semibold text-amber-800 mb-2">Demo zuruecksetzen</p>
                <p className="text-xs text-amber-700 mb-2">
                  Startet eine Pipeline die Feature-Branches loescht, offene Merge Requests schliesst
                  und die Datenbank auf den Seed-Stand zuruecksetzt.
                </p>
                <div className="bg-white rounded border border-amber-200 p-2 space-y-1">
                  <CodeRow label="PIPELINE_TYPE" value="reset-demo" />
                </div>
                {(GITLAB_URL || GITLAB_PROJECT_PATH) && (
                  <div className="mt-2">
                    <ExternalLink
                      href={
                        GITLAB_URL && GITLAB_PROJECT_PATH
                          ? `${GITLAB_URL}/${GITLAB_PROJECT_PATH}/-/pipelines/new`
                          : GITLAB_URL
                      }
                    >
                      Reset-Pipeline starten
                    </ExternalLink>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
