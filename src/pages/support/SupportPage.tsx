import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle, CheckCircle, Clock, MessageSquare,
  Plus, Search, Send, X, RefreshCw, AlertTriangle,
  ChevronRight, User, Headphones
} from "lucide-react";
import { COLORS } from "../../utils/colors";
import {
  createSupportTicket,
  getSupportSummary,
  getSupportTickets,
  getSupportTicket,
  replySupportTicket,
} from "../../services/vendor.service";
import LoadingState from "../../components/ui/LoadingState";
import type { SupportTicket } from "../../types/vendor";
import VendorMetricCard from "../../components/ui/VendorMetricCard";

const CATEGORIES = ["order_issue", "payment_issue", "delivery_issue", "product_issue", "account_issue", "other"] as const;
const PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  open:        { color: COLORS.info,    bg: COLORS.infoBg,    border: COLORS.infoBorder },
  in_progress: { color: COLORS.warning, bg: COLORS.warningBg, border: COLORS.warningBorder },
  resolved:    { color: COLORS.success, bg: COLORS.successBg, border: COLORS.successBorder },
  closed:      { color: "#6b7280",      bg: "#f9fafb",        border: "#e5e7eb" },
};

const PRIORITY_STYLE: Record<string, { color: string; bg: string }> = {
  low:    { color: "#6b7280", bg: "#f9fafb" },
  medium: { color: COLORS.info, bg: COLORS.infoBg },
  high:   { color: COLORS.warning, bg: COLORS.warningBg },
  urgent: { color: COLORS.error, bg: COLORS.errorBg },
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    category: "other" as typeof CATEGORIES[number],
    priority: "medium" as typeof PRIORITIES[number],
    description: "",
    orderId: "",
  });

  // API 1: GET /support/tickets
  // API 3: GET /support/tickets/summary
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [ticketsRes, summaryRes] = await Promise.all([
        getSupportTickets(),
        getSupportSummary(),
      ]);
      setTickets(ticketsRes.data.tickets || []);
      setCounts(summaryRes.data.status_counts || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchFilter = filter === "all" || t.status === filter;
      const matchSearch = !searchTerm.trim() ||
        t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t._id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchFilter && matchSearch;
    });
  }, [filter, searchTerm, tickets]);

  // API 4: GET /support/tickets/:id
  const openTicket = async (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setDetailLoading(true);
    try {
      const res = await getSupportTicket(ticket._id);
      setActiveTicket(res.data);
    } catch { /* use list data */ }
    finally { setDetailLoading(false); }
  };

  // API 2: POST /support/tickets
  const handleCreate = async () => {
    if (!form.subject.trim() || !form.description.trim()) return;
    setCreating(true);
    try {
      const res = await createSupportTicket(form);
      setTickets(cur => [res.data, ...cur]);
      setCounts(cur => ({ ...cur, open: (cur.open || 0) + 1 }));
      setShowNew(false);
      setForm({ subject: "", category: "other", priority: "medium", description: "", orderId: "" });
      setActiveTicket(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    } finally {
      setCreating(false);
    }
  };

  // API 5: POST /support/tickets/:id/reply
  const handleReply = async () => {
    if (!activeTicket || !newMessage.trim()) return;
    setSending(true);
    try {
      const res = await replySupportTicket(activeTicket._id, newMessage.trim());
      setActiveTicket(res.data);
      setTickets(cur => cur.map(t => t._id === activeTicket._id ? res.data : t));
      setNewMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Support</h1>
          <p className="text-sm text-gray-500 mt-0.5">Get help from our support team</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void loadData()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-900 transition text-sm font-semibold">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition"
            style={{ backgroundColor: COLORS.primary }}>
            <Plus size={16} /> Raise Ticket
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border px-4 py-3 text-sm flex items-center gap-2"
          style={{ backgroundColor: COLORS.errorBg, borderColor: COLORS.errorBorder, color: COLORS.error }}>
          <AlertTriangle size={14} /> {error}
          <button onClick={() => setError("")} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* API 3: Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <VendorMetricCard index={0} label="Total Tickets" value={String(tickets.length)} accent={COLORS.primary} accentBg={`${COLORS.primary}18`} icon={MessageSquare} />
        <VendorMetricCard index={1} label="Open" value={String(counts.open || 0)} accent={COLORS.info} accentBg={COLORS.infoBg} icon={AlertCircle} />
        <VendorMetricCard index={2} label="In Progress" value={String(counts.in_progress || 0)} accent={COLORS.warning} accentBg={COLORS.warningBg} icon={Clock} />
        <VendorMetricCard index={3} label="Resolved" value={String(counts.resolved || 0)} accent={COLORS.success} accentBg={COLORS.successBg} icon={CheckCircle} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
          {(["all", "open", "in_progress", "resolved"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition"
              style={filter === f ? { backgroundColor: COLORS.primary, color: "#fff" } : { color: "#6b7280" }}>
              {f.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-gray-900 transition" />
        </div>
        <span className="text-xs text-gray-500 font-semibold">{filteredTickets.length} tickets</span>
      </div>

      {loading ? <LoadingState message="Loading support tickets" /> : (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Subject</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Category</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Priority</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Replies</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Created</th>
                  <th className="px-5 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTickets.length > 0 ? (
                  filteredTickets.map(ticket => {
                    const sc = STATUS_STYLE[ticket.status] || STATUS_STYLE.open;
                    const pc = PRIORITY_STYLE[ticket.priority] || PRIORITY_STYLE.medium;
                    return (
                      <tr key={ticket._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-gray-900 line-clamp-1 max-w-[220px]">{ticket.subject}</p>
                          <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 max-w-[220px]">{ticket.description}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 capitalize font-medium">
                            {ticket.category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold capitalize"
                            style={{ backgroundColor: pc.bg, color: pc.color }}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="rounded-full border px-2.5 py-1 text-xs font-bold uppercase"
                            style={{ backgroundColor: sc.bg, color: sc.color, borderColor: sc.border }}>
                            {ticket.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-500 text-xs font-medium">
                          {ticket.replies.length}
                        </td>
                        <td className="px-5 py-4 text-gray-400 text-xs whitespace-nowrap">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : "—"}
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => void openTicket(ticket)}
                            className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition hover:shadow-sm"
                            style={{ color: COLORS.primary, borderColor: `${COLORS.primary}40`, backgroundColor: `${COLORS.primary}08` }}>
                            View <ChevronRight size={12} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-gray-100">
                          <MessageSquare size={24} className="text-gray-400" />
                        </div>
                        <p className="text-sm font-semibold text-gray-600">
                          {tickets.length === 0 ? "No tickets yet" : "No tickets match your filter"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {tickets.length === 0 ? "Raise your first support ticket using the button above" : "Try changing the filter or search term"}
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Detail Drawer — API 4 + API 5 */}
      {activeTicket && (
        <div className="fixed inset-0 bg-black/40 z-40 flex justify-end" onClick={() => setActiveTicket(null)}>
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Drawer Header */}
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3 flex-shrink-0">
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-gray-900 line-clamp-1">{activeTicket.subject}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase"
                    style={{
                      backgroundColor: (STATUS_STYLE[activeTicket.status] || STATUS_STYLE.open).bg,
                      color: (STATUS_STYLE[activeTicket.status] || STATUS_STYLE.open).color,
                      borderColor: (STATUS_STYLE[activeTicket.status] || STATUS_STYLE.open).border,
                    }}>
                    {activeTicket.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize"
                    style={{ backgroundColor: (PRIORITY_STYLE[activeTicket.priority] || PRIORITY_STYLE.medium).bg, color: (PRIORITY_STYLE[activeTicket.priority] || PRIORITY_STYLE.medium).color }}>
                    {activeTicket.priority}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                    {activeTicket.category.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
              <button onClick={() => setActiveTicket(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition flex-shrink-0">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            {/* Description */}
            <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
              <p className="text-xs text-gray-500">{activeTicket.description}</p>
              <p className="text-xs text-gray-400 mt-1">
                Created: {activeTicket.createdAt ? new Date(activeTicket.createdAt).toLocaleString() : "—"}
              </p>
            </div>

            {/* Replies */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {detailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw size={20} className="animate-spin text-gray-400" />
                </div>
              ) : activeTicket.replies.length > 0 ? (
                activeTicket.replies.map((reply, i) => {
                  const isVendor = reply.authorRole === "vendor";
                  return (
                    <div key={i} className={`flex gap-3 ${isVendor ? "flex-row-reverse" : ""}`}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: isVendor ? `${COLORS.primary}18` : COLORS.successBg }}>
                        {isVendor
                          ? <User size={14} style={{ color: COLORS.primary }} />
                          : <Headphones size={14} style={{ color: COLORS.success }} />
                        }
                      </div>
                      <div className={`flex-1 max-w-[80%] ${isVendor ? "items-end" : "items-start"} flex flex-col`}>
                        <div className="px-4 py-3"
                          style={{
                            backgroundColor: isVendor ? `${COLORS.primary}12` : COLORS.successBg,
                            borderRadius: isVendor ? "18px 4px 18px 18px" : "4px 18px 18px 18px",
                          }}>
                          <p className="text-sm text-gray-800">{reply.message}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 px-1">
                          {isVendor ? "You" : "Support"} • {reply.createdAt ? new Date(reply.createdAt).toLocaleString() : "—"}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <MessageSquare size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">No replies yet. Send a message to support.</p>
                </div>
              )}
            </div>

            {/* Reply Input */}
            {activeTicket.status !== "resolved" && activeTicket.status !== "closed" ? (
              <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <div className="flex gap-2">
                  <input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleReply(); } }}
                    placeholder="Type your reply..."
                    className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-900 transition" />
                  <button onClick={() => void handleReply()}
                    disabled={!newMessage.trim() || sending}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50"
                    style={{ backgroundColor: COLORS.primary }}>
                    <Send size={14} />
                    {sending ? "..." : "Send"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2 p-3 rounded-xl"
                  style={{ backgroundColor: COLORS.successBg }}>
                  <CheckCircle size={14} style={{ color: COLORS.success }} />
                  <p className="text-xs font-semibold" style={{ color: COLORS.success }}>
                    This ticket has been {activeTicket.status}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Ticket Modal — API 2 */}
      {showNew && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Raise Support Ticket</h3>
              <button onClick={() => setShowNew(false)}><X size={18} className="text-gray-400" /></button>
            </div>

            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Subject *</label>
                <input value={form.subject} onChange={e => setForm(c => ({ ...c, subject: e.target.value }))}
                  placeholder="Brief description of the issue"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-900 transition" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Category</label>
                  <select value={form.category} onChange={e => setForm(c => ({ ...c, category: e.target.value as any }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-900 transition appearance-none">
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Priority</label>
                  <select value={form.priority} onChange={e => setForm(c => ({ ...c, priority: e.target.value as any }))}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-900 transition appearance-none">
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Order ID (optional)</label>
                <input value={form.orderId} onChange={e => setForm(c => ({ ...c, orderId: e.target.value }))}
                  placeholder="Related order ID if applicable"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-900 transition font-mono" />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Description *</label>
                <textarea value={form.description} onChange={e => setForm(c => ({ ...c, description: e.target.value }))}
                  placeholder="Describe the issue in detail..."
                  className="w-full h-28 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition resize-none" />
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setShowNew(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button onClick={() => void handleCreate()}
                disabled={!form.subject.trim() || !form.description.trim() || creating}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
                style={{ backgroundColor: COLORS.primary }}>
                {creating ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
