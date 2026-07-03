interface Props {
  openTicketCount: number;
}

const ADVANTAGE_BADGES = [
  {
    icon: '🛒',
    label: 'Riesiges Sortiment',
    sublabel: 'Über 10.000 Artikel',
  },
  {
    icon: '🚫',
    label: 'Kein Mindestbestellwert',
    sublabel: 'Jederzeit bestellen',
  },
  {
    icon: '↩️',
    label: 'Kostenlose Rücksendung',
    sublabel: 'Bequem & gratis',
  },
  {
    icon: '🏷️',
    label: 'REWE Eigenmarken',
    sublabel: 'Beste Qualität',
  },
];

export function ReweHeroBanner({ openTicketCount }: Props) {
  return (
    <div
      data-testid="rewe-hero-banner"
      style={{ backgroundColor: '#FFE033' }}
      className="w-full rounded-2xl overflow-hidden mb-6"
    >
      <div className="max-w-screen-xl mx-auto px-6 py-8 flex flex-col lg:flex-row items-center gap-6">
        {/* Text content */}
        <div className="flex-1 min-w-0">
          <h1
            data-testid="rewe-hero-title"
            style={{ color: '#CC071E' }}
            className="text-2xl lg:text-3xl font-black leading-tight mb-2"
          >
            Willkommen beim REWE Paketservice
          </h1>
          <p
            data-testid="rewe-hero-subtitle"
            className="text-gray-800 text-sm lg:text-base mb-4 font-medium"
          >
            Frische Lebensmittel und mehr — bequem nach Hause geliefert.
          </p>

          {/* Open tickets indicator */}
          {openTicketCount > 0 && (
            <div
              data-testid="rewe-hero-ticket-indicator"
              className="inline-flex items-center gap-2 bg-white/60 rounded-xl px-3 py-1.5 mb-4"
            >
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse flex-shrink-0" />
              <span className="text-xs font-semibold text-gray-800">
                {openTicketCount} offene{openTicketCount === 1 ? 's Ticket' : ' Tickets'}
              </span>
            </div>
          )}

          {/* Advantage badges */}
          <div
            data-testid="rewe-hero-badges"
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2"
          >
            {ADVANTAGE_BADGES.map((badge) => (
              <div
                key={badge.label}
                data-testid="rewe-advantage-badge"
                className="flex flex-col items-center bg-white/70 rounded-xl p-3 text-center
                  border border-yellow-200 hover:bg-white/90 transition-colors"
              >
                <span className="text-2xl mb-1" role="img" aria-label={badge.label}>
                  {badge.icon}
                </span>
                <span className="text-xs font-bold text-gray-800 leading-tight">
                  {badge.label}
                </span>
                <span className="text-[10px] text-gray-500 leading-tight mt-0.5">
                  {badge.sublabel}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Product image placeholder */}
        <div
          data-testid="rewe-hero-product-image"
          className="hidden lg:flex flex-shrink-0 w-56 h-48 items-center justify-center
            bg-white/50 rounded-2xl border-2 border-yellow-300"
        >
          <div className="text-center">
            <div className="text-6xl mb-2">🛍️</div>
            <span className="text-xs text-gray-600 font-medium">REWE Paketservice</span>
          </div>
        </div>
      </div>
    </div>
  );
}
