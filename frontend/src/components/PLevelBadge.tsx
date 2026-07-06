/** Zeigt die P0-P4-Prioritätsstufe eines Tickets als Badge an. */

const P_LEVEL_STYLES: Record<string, string> = {
  P0: 'bg-red-600 text-white ring-1 ring-red-700',
  P1: 'bg-red-100 text-red-800',
  P2: 'bg-orange-100 text-orange-800',
  P3: 'bg-yellow-100 text-yellow-800',
  P4: 'bg-gray-100 text-gray-700',
};

interface Props {
  pLevel: string;
}

export function PLevelBadge({ pLevel }: Props) {
  const style = P_LEVEL_STYLES[pLevel] ?? 'bg-gray-100 text-gray-700';
  return (
    <span
      data-testid="p-level-badge"
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${style}`}
    >
      {pLevel}
    </span>
  );
}
