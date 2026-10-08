import { useAuth } from "../lib/AuthContext";

const CUSTOMER_QUEUES = [
  { key: "mine_open", label: "My open tickets" },
  { key: "mine_all", label: "All my tickets" },
];

const AGENT_QUEUES = [
  { key: "unassigned", label: "Unassigned" },
  { key: "assigned_to_me", label: "Assigned to me" },
  { key: "all_open", label: "All open" },
  { key: "resolved", label: "Resolved / closed" },
];

export default function Rail({ activeQueue, onSelectQueue, counts, onNewTicket }) {
  const { profile, role, signOut } = useAuth();
  const queues = role === "customer" ? CUSTOMER_QUEUES : AGENT_QUEUES;

  return (
    <nav className="rail">
      <div>
        <div className="rail__brand">
          NWU Helpdesk Ticketing System
          <small>{role === "customer" ? "customer portal" : `${role} console`}</small>
        </div>
      </div>

      <div>
        <div className="rail__section-title">Queues</div>
        <ul className="rail__queues">
          {queues.map((q) => (
            <li key={q.key}>
              <button
                className="rail__queue-btn"
                data-active={activeQueue === q.key}
                onClick={() => onSelectQueue(q.key)}
              >
                <span>{q.label}</span>
                <span className="rail__queue-count">{counts?.[q.key] ?? ""}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {role === "customer" && (
        <button className="btn btn--ghost" onClick={onNewTicket}>
          + New ticket
        </button>
      )}

      <div className="rail__footer">
        <div>{profile?.full_name || profile?.email}</div>
        <button className="rail__signout" onClick={signOut}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
