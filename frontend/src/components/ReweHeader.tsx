import { useState } from 'react';

interface Props {
  view: 'user' | 'admin';
  onViewChange: (v: 'user' | 'admin') => void;
  onReset: () => void;
  resetting: boolean;
  resetDone: boolean;
}

export function ReweHeader({ view, onViewChange, onReset, resetting, resetDone }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <header data-testid="rewe-header" className="sticky top-0 z-20">
      {/* Top navigation bar — REWE Rot #CC071E */}
      <nav
        data-testid="rewe-nav"
        style={{ backgroundColor: '#CC071E' }}
        className="w-full"
      >
        <div className="max-w-screen-xl mx-auto px-4 flex items-center justify-between h-10">
          {/* Nav links */}
          <div className="flex items-center gap-0" data-testid="rewe-nav-links">
            <a
              href="#"
              data-testid="nav-maerkte"
              className="text-white text-xs font-medium px-4 py-2 hover:bg-red-800 transition-colors whitespace-nowrap"
              onClick={(e) => e.preventDefault()}
            >
              Märkte &amp; Angebote
            </a>
            <a
              href="#"
              data-testid="nav-online-bestellen"
              style={{ backgroundColor: '#a50016' }}
              className="text-white text-xs font-bold px-4 py-2 hover:bg-red-900 transition-colors whitespace-nowrap border-b-2 border-white"
              onClick={(e) => e.preventDefault()}
            >
              Online bestellen
            </a>
            <a
              href="#"
              data-testid="nav-rezepte"
              className="text-white text-xs font-medium px-4 py-2 hover:bg-red-800 transition-colors whitespace-nowrap"
              onClick={(e) => e.preventDefault()}
            >
              Rezepte &amp; Ernährung
            </a>
          </div>

          {/* Right side — view toggle + reset */}
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex rounded border border-red-400 overflow-hidden">
              <button
                onClick={() => onViewChange('user')}
                data-testid="nav-view-user"
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  view === 'user'
                    ? 'bg-white text-red-700 font-bold'
                    : 'text-white hover:bg-red-800'
                }`}
              >
                👤 Mitarbeiter
              </button>
              <button
                onClick={() => onViewChange('admin')}
                data-testid="nav-view-admin"
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  view === 'admin'
                    ? 'bg-white text-red-700 font-bold'
                    : 'text-white hover:bg-red-800'
                }`}
              >
                🔧 IT-Admin
              </button>
            </div>

            {/* Reset */}
            <button
              onClick={onReset}
              disabled={resetting}
              title="Demo auf Ausgangszustand zurücksetzen"
              data-testid="nav-reset-button"
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded border transition-colors disabled:opacity-50 ${
                resetDone
                  ? 'border-green-300 bg-green-700 text-white'
                  : 'border-red-400 text-white hover:bg-red-800'
              }`}
            >
              <svg
                className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="hidden sm:inline">
                {resetDone ? '✓ Reset läuft' : 'Reset'}
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Secondary header — white bar with logo, search, icons */}
      <div
        data-testid="rewe-header-bar"
        className="bg-white border-b border-gray-200 shadow-sm"
      >
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-4">
          {/* REWE Logo */}
          <div
            data-testid="rewe-logo"
            className="flex-shrink-0 flex items-center gap-2"
          >
            <div
              style={{ backgroundColor: '#CC071E' }}
              className="w-10 h-10 rounded-full flex items-center justify-center"
            >
              <span className="text-white font-black text-sm tracking-tight">REWE</span>
            </div>
            <div className="hidden sm:block">
              <span
                style={{ color: '#CC071E' }}
                className="font-black text-lg leading-none tracking-tight"
              >
                REWE
              </span>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">Paketservice</p>
            </div>
          </div>

          {/* Search bar */}
          <div
            data-testid="rewe-search"
            className="flex-1 max-w-xl relative"
          >
            <input
              type="text"
              placeholder="Produkte suchen…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="rewe-search-input"
              className="w-full pl-4 pr-10 py-2 rounded-full border border-gray-300 text-sm
                focus:outline-none focus:ring-2 focus:border-transparent placeholder-gray-400"
              style={{ '--tw-ring-color': '#CC071E' } as never}
            />
            <button
              data-testid="rewe-search-button"
              style={{ backgroundColor: '#CC071E' }}
              className="absolute right-0 top-0 bottom-0 px-4 rounded-r-full text-white
                hover:opacity-90 transition-opacity"
              aria-label="Suche"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>

          {/* Icon area: Standort, Favoriten, Warenkorb, Anmelden */}
          <div
            data-testid="rewe-header-icons"
            className="flex items-center gap-3 flex-shrink-0"
          >
            {/* Standort */}
            <button
              data-testid="rewe-location-button"
              className="hidden md:flex flex-col items-center text-gray-600 hover:text-red-700 transition-colors group"
              title="Standort"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <span className="text-[10px] mt-0.5">Standort</span>
            </button>

            {/* Favoriten */}
            <button
              data-testid="rewe-favorites-button"
              className="hidden md:flex flex-col items-center text-gray-600 hover:text-red-700 transition-colors"
              title="Favoriten"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <span className="text-[10px] mt-0.5">Favoriten</span>
            </button>

            {/* Warenkorb */}
            <button
              data-testid="rewe-cart-button"
              style={{ backgroundColor: '#CC071E' }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-white
                hover:opacity-90 transition-opacity"
              title="Warenkorb"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span className="text-xs font-semibold hidden sm:inline">Warenkorb</span>
            </button>

            {/* Anmelden */}
            <button
              data-testid="rewe-login-button"
              className="hidden sm:flex flex-col items-center text-gray-600 hover:text-red-700 transition-colors"
              title="Anmelden"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span className="text-[10px] mt-0.5">Anmelden</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
