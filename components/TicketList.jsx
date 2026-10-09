function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function TicketList({ tickets, onOpenTicket, loading }) {
  if (loading) {
    return <div className="empty-state">Loading tickets…</div>;
  }

  if (!tickets.length) {
    return <div className="empty-state">Nothing in this queue.</div>;
  }

  return (
    <div className="ledger">
      {tickets.map((t) => (
        <button
          key={t.id}
          className="ledger__row"
          data-priority={t.priority}
          onClick={() => onOpenTicket(t.id)}
        >
          <span className="ledger__id">#{t.id.slice(0, 8)}</span>
          <span className="ledger__subject">
            {t.subject}
            <small>
              {t.customer?.full_name || t.customer?.email || "unknown requester"}
            </small>
          </span>
          <span className="status-tag" data-status={t.status}>
            {t.status.replaceAll("_", " ")}
          </span>
          <span className="ledger__meta">
            {t.assigned_agent?.full_name || t.assigned_agent?.email || "— unassigned —"}
          </span>
          <span className="ledger__meta">{timeAgo(t.updated_at)}</span>
        </button>
      ))}
    </div>
  );
}
