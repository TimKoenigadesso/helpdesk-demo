const SUGGESTIONS = [
  {
    icon: '📧',
    title: 'E-Mail-Benachrichtigungen',
    description:
      'Automatische Status-Updates per E-Mail: Ticket erstellt → bearbeitet → gelöst. ' +
      'Melder weiß immer, wo ihr Ticket steht — ohne Nachfragen.',
    effort: 'Klein',
    effortColor: 'bg-green-100 text-green-700',
    impact: 'Hoch',
  },
  {
    icon: '⏱️',
    title: 'SLA-Tracking & Eskalation',
    description:
      'Reaktionszeit-Ziele pro Priorität (Critical: 1h, High: 4h, Medium: 24h). ' +
      'Automatische Eskalation mit Farbindikator wenn das SLA-Fenster schließt.',
    effort: 'Mittel',
    effortColor: 'bg-yellow-100 text-yellow-700',
    impact: 'Hoch',
  },
  {
    icon: '📚',
    title: 'Knowledge Base & Lösungsvorschläge',
    description:
      'Claude vergleicht neue Tickets mit gelösten und schlägt direkt passende ' +
      'Lösungsschritte vor — aus der eigenen Ticket-Historie. Bekannte Probleme werden ' +
      'sofort erkannt.',
    effort: 'Mittel',
    effortColor: 'bg-yellow-100 text-yellow-700',
    impact: 'Sehr hoch',
  },
];

export function ExtensionSuggestions() {
  return (
    <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">💡</span>
        <h3 className="text-sm font-semibold text-gray-700">
          Nächste Ausbaustufen — was wäre sinnvoll?
        </h3>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {SUGGESTIONS.map((s) => (
          <div key={s.title}
            className="bg-white rounded-xl border border-gray-200 p-4 flex gap-3">
            <span className="text-xl flex-shrink-0 mt-0.5">{s.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm font-semibold text-gray-800">{s.title}</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${s.effortColor}`}>
                  Aufwand: {s.effort}
                </span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">{s.description}</p>
              <p className="text-[10px] text-gray-400 mt-1">Wirkung: {s.impact}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-gray-400 mt-3 text-center">
        Alle Erweiterungen würden durch die Agentic-SDLC-Pipeline automatisch implementiert — eine Anforderung reicht.
      </p>
    </div>
  );
}
