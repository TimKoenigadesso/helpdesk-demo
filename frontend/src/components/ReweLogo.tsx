/**
 * REWE Logo – SVG-Darstellung gemäß REWE Corporate Design Guidelines.
 * Verwendet REWE Primärfarbe #CC071E (Rot) und Weiß als Schriftfarbe.
 */
interface Props {
  /** Breite des Logos in Pixeln (Höhe wird proportional berechnet) */
  width?: number;
  className?: string;
}

export function ReweLogo({ width = 56, className = '' }: Props) {
  const height = Math.round(width * 0.6);
  return (
    <svg
      data-testid="rewe-logo"
      role="img"
      aria-label="REWE Logo"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 60"
      width={width}
      height={height}
      className={className}
    >
      {/* Roter Hintergrund */}
      <rect width="100" height="60" rx="4" ry="4" fill="#CC071E" />
      {/* Weißer REWE-Schriftzug */}
      <text
        x="50"
        y="42"
        textAnchor="middle"
        fontFamily="'Thesis', 'TheSans', Arial, Helvetica, sans-serif"
        fontWeight="bold"
        fontSize="28"
        letterSpacing="2"
        fill="#FFFFFF"
      >
        REWE
      </text>
    </svg>
  );
}
