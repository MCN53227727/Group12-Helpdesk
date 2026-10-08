import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import { useAuth } from "./lib/AuthContext";
import AuthScreen from "./components/AuthScreen";
import Rail from "./components/Rail";
import TicketList from "./components/TicketList";
import TicketDetail from "./components/TicketDetail";
import NewTicketForm from "./components/NewTicketForm";

const TICKET_SELECT =
  "*, customer:customer_id(id, full_name, email), assigned_agent:assigned_agent_id(id, full_name, email)";

export default function App() {
  const { session, role, loading: authLoading, user } = useAuth();
  const [activeQueue, setActiveQueue] = useState(null);
  const [view, setView] = useState("list"); // 'list' | 'detail' | 'new'
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  useEffect(() => {
    if (role && !activeQueue) {
      setActiveQueue(role === "customer" ? "mine_open" : "unassigned");
    }
  }, [role, activeQueue]);

  const buildQuery = useCallback(
    (queue) => {
      let q = supabase.from("tickets").select(TICKET_SELECT);
      switch (queue) {
        case "mine_open":
          return q.eq("customer_id", user.id).not("status", "in", "(resolved,closed)");
        case "mine_all":
          return q.eq("customer_id", user.id);
        case "unassigned":
          return q.is("assigned_agent_id", null).not("status", "in", "(resolved,closed)");
        case "assigned_to_me":
          return q.eq("assigned_agent_id", user.id).not("status", "in", "(resolved,closed)");
        case "all_open":
          return q.not("status", "in", "(resolved,closed)");
        case "resolved":
          return q.in("status", ["resolved", "closed"]);
        default:
          return q;
      }
    },
    [user]
  );

  const loadTickets = useCallback(async () => {
    if (!activeQueue || !user) return;
    setTicketsLoading(true);
    const { data, error } = await buildQuery(activeQueue).order("updated_at", { ascending: false });
    if (error) console.error(error.message);
    setTickets(data ?? []);
    setTicketsLoading(false);
  }, [activeQueue, user, buildQuery]);

  useEffect(() => {
    loadTickets();

    const channel = supabase
      .channel("tickets-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "tickets" }, () => loadTickets())
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [loadTickets]);

  const counts = useMemo(() => ({ [activeQueue]: tickets.length }), [activeQueue, tickets]);

  if (authLoading) {
    return <div className="empty-state">Loading…</div>;
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (!role) {
    // Profile row hasn't been created/loaded yet (rare race right after signup).
    return <div className="empty-state">Setting up your account…</div>;
  }

  const queueLabel = {
    mine_open: "My open tickets",
    mine_all: "All my tickets",
    unassigned: "Unassigned",
    assigned_to_me: "Assigned to me",
    all_open: "All open tickets",
    resolved: "Resolved & closed",
  }[activeQueue];

  return (
    <div className="shell">
      <Rail
        activeQueue={activeQueue}
        onSelectQueue={(q) => {
          setActiveQueue(q);
          setView("list");
        }}
        counts={counts}
        onNewTicket={() => setView("new")}
      />

      <main className="main">
        {view === "list" && (
          <>
            <div className="main__header">
              <h1>{queueLabel}</h1>
            </div>
            <TicketList
              tickets={tickets}
              loading={ticketsLoading}
              onOpenTicket={(id) => {
                setSelectedTicketId(id);
                setView("detail");
              }}
            />
          </>
        )}

        {view === "new" && (
          <>
            <div className="main__header">
              <h1>New ticket</h1>
            </div>
            <NewTicketForm
              onCreated={(t) => {
                setSelectedTicketId(t.id);
                setView("detail");
                loadTickets();
              }}
              onCancel={() => setView("list")}
            />
          </>
        )}

        {view === "detail" && (
          <TicketDetail ticketId={selectedTicketId} onBack={() => setView("list")} />
        )}
      </main>
    </div>
  );
}
