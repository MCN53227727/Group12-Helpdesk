import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const STATUS_OPTIONS = ["open", "in_progress", "waiting_on_customer", "resolved", "closed"];
const PRIORITY_OPTIONS = ["low", "medium", "high", "urgent"];

export default function TicketDetail({ ticketId, onBack }) {
  const { role, profile } = useAuth();
  const isStaff = role === "agent" || role === "admin";

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentBody, setCommentBody] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [error, setError] = useState(null);

  const loadTicket = useCallback(async () => {
    setLoading(true);
    const { data: ticketData, error: ticketErr } = await supabase
      .from("tickets")
      .select(
        "*, customer:customer_id(id, full_name, email), assigned_agent:assigned_agent_id(id, full_name, email)"
      )
      .eq("id", ticketId)
      .single();

    const { data: commentData, error: commentErr } = await supabase
      .from("ticket_comments")
      .select("*, author:author_id(id, full_name, email)")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (ticketErr) setError(ticketErr.message);
    else setTicket(ticketData);

    if (commentErr) setError((prev) => prev ?? commentErr.message);
    else setComments(commentData ?? []);

    setLoading(false);
  }, [ticketId]);

  useEffect(() => {
    loadTicket();

    if (isStaff) {
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("role", ["agent", "admin"])
        .then(({ data }) => setAgents(data ?? []));
    }

    // Live updates: new comments or status changes from the other party
    // show up without a manual refresh.
    const channel = supabase
      .channel(`ticket-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ticket_comments", filter: `ticket_id=eq.${ticketId}` },
        () => loadTicket()
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tickets", filter: `id=eq.${ticketId}` },
        () => loadTicket()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [ticketId, isStaff, loadTicket]);

  const updateTicket = async (patch) => {
    const { error } = await supabase.from("tickets").update(patch).eq("id", ticketId);
    if (error) setError(error.message);
    else loadTicket();
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    const { error } = await supabase.from("ticket_comments").insert({
      ticket_id: ticketId,
      author_id: profile.id,
      body: commentBody,
      is_internal: isStaff ? isInternal : false,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setCommentBody("");
    setIsInternal(false);
    loadTicket();
  };

  if (loading) return <div className="empty-state">Loading case file…</div>;
  if (!ticket) return <div className="empty-state">Ticket not found, or you don't have access to it.</div>;

  return (
    <div>
      <button className="btn btn--ghost" onClick={onBack} style={{ marginBottom: 20 }}>
        ← Back to queue
      </button>

      <h2 style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 24, margin: "0 0 6px" }}>
        {ticket.subject}
      </h2>

      <div className="case-file__meta">
        <span>#{ticket.id.slice(0, 8)}</span>
        <span>opened by {ticket.customer?.full_name || ticket.customer?.email}</span>
        <span>{new Date(ticket.created_at).toLocaleString()}</span>
      </div>

      <div className="case-file__description">{ticket.description}</div>

      {error && <div className="form-error">{error}</div>}

      <div className="controls-row">
        <div className="field-inline">
          <label>Status</label>
          {isStaff ? (
            <select value={ticket.status} onChange={(e) => updateTicket({ status: e.target.value })}>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          ) : (
            <span className="status-tag" data-status={ticket.status}>
              {ticket.status.replaceAll("_", " ")}
            </span>
          )}
        </div>

        <div className="field-inline">
          <label>Priority</label>
          {isStaff ? (
            <select value={ticket.priority} onChange={(e) => updateTicket({ priority: e.target.value })}>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : (
            <span>{ticket.priority}</span>
          )}
        </div>

        {isStaff && (
          <div className="field-inline">
            <label>Assigned to</label>
            <select
              value={ticket.assigned_agent_id ?? ""}
              onChange={(e) => updateTicket({ assigned_agent_id: e.target.value || null })}
            >
              <option value="">— unassigned —</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.full_name || a.email}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="thread">
        {comments.map((c) => (
          <div key={c.id} className="thread__item" data-internal={c.is_internal}>
            <div className="thread__head">
              <span>
                {c.author?.full_name || c.author?.email}
                {c.is_internal && <span className="thread__internal-flag"> · internal note</span>}
              </span>
              <span>{new Date(c.created_at).toLocaleString()}</span>
            </div>
            <div>{c.body}</div>
          </div>
        ))}
      </div>

      <form className="comment-form" onSubmit={submitComment}>
        <textarea
          placeholder={isStaff ? "Reply to the customer, or add an internal note…" : "Add a reply…"}
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
        />
        <div className="comment-form__actions">
          {isStaff ? (
            <label className="checkbox-line">
              <input
                type="checkbox"
                checked={isInternal}
                onChange={(e) => setIsInternal(e.target.checked)}
              />
              Internal note (hidden from customer)
            </label>
          ) : (
            <span />
          )}
          <button className="btn" type="submit">
            Post
          </button>
        </div>
      </form>
    </div>
  );
}
