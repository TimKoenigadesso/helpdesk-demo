const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Gering',
  medium: 'Mittel',
  high: 'Erhöht',
  critical: 'Dringend',
};

// P0–P4 Styles (AGSDLC-36)
const TICKET_PRIORITY_STYLES: Record<string, string> = {
  P0: 'bg-red-600 text-white font-bold ring-2 ring-red-400',
  P1: 'bg-orange-100 text-orange-800',
  P2: 'bg-yellow-100 text-yellow-800',
  P3: 'bg-blue-100 text-blue-800',
  P4: 'bg-gray-100 text-gray-600',
};

interface Props {
  priority: string;
}

export function PriorityBadge({ priority }: Props) {
  const style = PRIORITY_STYLES[priority] ?? 'bg-gray-100 text-gray-700';
  const label = PRIORITY_LABELS[priority] ?? priority;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style}`}>
      {label}
    </span>
  );
}

/** Badge für P0–P4 Ticketpriorität (AGSDLC-36) */
export function TicketPriorityBadge({ ticketPriority }: { ticketPriority: string | null | undefined }) {
  if (!ticketPriority) return null;
  const style = TICKET_PRIORITY_STYLES[ticketPriority] ?? 'bg-gray-100 text-gray-600';
  return (
    <span
      data-testid="ticket-priority-badge"
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${style}`}
    >
      {ticketPriority}
    </span>
  );
}
