/**
 * Rossmann-Wappen-Logo als inline SVG.
 * Orientiert am Rossmann Corporate-Design (stilisierter Schriftzug + Wappen).
 */
export function RossmannLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 160 48"
      aria-label="Rossmann"
      role="img"
      className={className}
      fill="none"
    >
      {/* Rotes Schild / Wappen-Hintergrund */}
      <rect x="0" y="0" width="40" height="48" rx="4" fill="#e30613" />
      {/* Weißes stilisiertes "R" im Wappen */}
      <text
        x="8"
        y="36"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontWeight="900"
        fontSize="32"
        fill="white"
        letterSpacing="-1"
      >
        R
      </text>
      {/* ROSSMANN Schriftzug */}
      <text
        x="50"
        y="33"
        fontFamily="'Arial Black', Arial, sans-serif"
        fontWeight="900"
        fontSize="20"
        fill="#e30613"
        letterSpacing="1"
      >
        ROSSMANN
      </text>
    </svg>
  );
}
