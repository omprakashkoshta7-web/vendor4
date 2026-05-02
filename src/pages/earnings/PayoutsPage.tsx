import { useEffect, useMemo, useState } from "react";
import {
  Download, FileText, RefreshCw, AlertTriangle,
  Clock, DollarSign, TrendingUp, Calendar, CheckCircle,
  XCircle, Percent, ChevronLeft, ChevronRight,
} from "lucide-react";
import LoadingState from "../../components/ui/LoadingState";
import { COLORS } from "../../utils/colors";
import {
  getVendorPayoutsSchedule,
  getVendorPayoutHistory,
  getVendorWalletSummary,
  getVendorFinanceServiceSummary,
  getVendorFinanceServicePayoutHistory,
} from "../../services/vendor.service";
import type {
  VendorPayoutRecord,
  VendorPayoutSchedule,
  VendorWalletSummary,
  VendorFinanceSummaryResponse,
  VendorFinancePayoutRecord,
} from "../../types/vendor";
import VendorMetricCard from "../../components/ui/VendorMetricCard";

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  paid:       { color: COLORS.success, bg: COLORS.successBg, border: COLORS.successBorder },
  processing: { color: COLORS.info,    bg: COLORS.infoBg,    border: COLORS.infoBorder },
  pending:    { color: COLORS.warning, bg: COLORS.warningBg, border: COLORS.warningBorder },
  failed:     { color: COLORS.error,   bg: COLORS.errorBg,   border: COLORS.errorBorder },
};

type HistoryTab = "vendor" | "finance";

export default function PayoutsPage() {
  // API 5: Wallet Summary
  const [wallet, setWallet] = useState<VendorWalletSummary | null>(null);
  // API 1: Finance Service Summary
  const [financeSummary, setFinanceSummary] = useState<VendorFinanceSummaryResponse | null>(null);
  // API 3: Payout Schedule
  const [schedule, setSchedule] = useState<VendorPayoutSchedule | null>(null);
  // API 4: Vendor Service History (last 50, no pagination)
  const [vendorPayouts, setVendorPayouts] = useState<VendorPayoutRecord[]>([]);
  // API 2: Finance Service History (paginated, full fields)
  const [financePayouts, setFinancePayouts] = useState<VendorFinancePayoutRecord[]>([]);
  const [financeMeta, setFinanceMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });
  const [financePageLoading, setFinancePageLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "processing" | "failed">("all");
  const [historyTab, setHistoryTab] = useState<HistoryTab>("vendor");

  // ── Load all data ──────────────────────────────────────────────────────────
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [p1, p2, p3, p4, p5] = await Promise.allSettled([
        getVendorFinanceServiceSummary(),       // API 1
        getVendorFinanceServicePayoutHistory(1, 10), // API 2
        getVendorPayoutsSchedule(),             // API 3
        getVendorPayoutHistory(),               // API 4
        getVendorWalletSummary(),               // API 5
      ]);

      if (p1.status === "fulfilled") setFinanceSummary(p1.value.data);
      if (p2.status === "fulfilled") {
        setFinancePayouts(p2.value.data?.payouts || []);
        setFinanceMeta(p2.value.data?.meta ?? { total: 0, page: 1, limit: 10, totalPages: 1 });
      }
      if (p3.status === "fulfilled") setSchedule(p3.value.data);
      if (p4.status === "fulfilled") setVendorPayouts(p4.value.data?.payouts || []);
      if (p5.status === "fulfilled") setWallet(p5.value.data);

      const allFailed = [p1, p2, p3, p4, p5].every(r => r.status === "rejected");
      if (allFailed) {
        const err = (p3 as PromiseRejectedResult).reason;
        setError(err instanceof Error ? err.message : "Failed to load payouts");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Finance history pagination ─────────────────────────────────────────────
  const loadFinancePage = async (page: number) => {
    try {
      setFinancePageLoading(true);
      const res = await getVendorFinanceServicePayoutHistory(page, financeMeta.limit);
      setFinancePayouts(res.data?.payouts || []);
      setFinanceMeta(res.data?.meta ?? financeMeta);
    } catch (err) {
      console.error("Finance page load error:", err);
    } finally {
      setFinancePageLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  // ── Filtered vendor payouts ────────────────────────────────────────────────
  const filteredVendorPayouts = useMemo(() =>
    filter === "all" ? vendorPayouts : vendorPayouts.filter(p => p.status === filter),
    [filter, vendorPayouts]
  );

  const filteredFinancePayouts = useMemo(() =>
    filter === "all" ? financePayouts : financePayouts.filter(p => p.status === filter),
    [filter, financePayouts]
  );

  // ── Stats — prefer finance summary, fallback to vendor payouts ─────────────
  const stats = useMemo(() => {
    if (financeSummary) {
      return {
        totalPaid: financeSummary.totalPaid,
        pending: financeSummary.pendingPayout,
        totalCount: financeSummary.totalPayouts,
        platformFee: financeSummary.platformFeePercent,
      };
    }
    return {
      totalPaid: vendorPayouts.filter(p => p.status === "paid").reduce((s, p) => s + (p.amount ?? 0), 0),
      pending: vendorPayouts.filter(p => p.status === "pending").reduce((s, p) => s + (p.amount ?? 0), 0),
      totalCount: vendorPayouts.length,
      platformFee: 10,
    };
  }, [financeSummary, vendorPayouts]);

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportHistory = () => {
    const rows = historyTab === "finance"
      ? financePayouts.map(p => [
          p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—",
          p.amount, p.platformFee, p.netAmount, p.status,
          p.transferId || "—",
          p.periodStart ? new Date(p.periodStart).toLocaleDateString() : "—",
          p.periodEnd   ? new Date(p.periodEnd).toLocaleDateString()   : "—",
          `"${p.notes || ""}"`,
          p.failureReason || "—",
        ].join(","))
      : vendorPayouts.map(p => [
          p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—",
          p.grossAmount ?? "", p.platformFee ?? "", p.amount ?? "", p.status,
          p.periodStart ? new Date(p.periodStart).toLocaleDateString() : "—",
          p.periodEnd   ? new Date(p.periodEnd).toLocaleDateString()   : "—",
          `"${p.notes || ""}"`,
        ].join(","));

    const header = historyTab === "finance"
      ? ["Date", "Gross", "Platform Fee", "Net", "Status", "Transfer ID", "Period Start", "Period End", "Notes", "Failure Reason"].join(",")
      : ["Date", "Gross", "Platform Fee", "Net", "Status", "Period Start", "Period End", "Notes"].join(",");

    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payouts-${historyTab}-history.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingState message="Loading payouts" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Payouts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Payout history, schedule and wallet balance</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void loadData()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-900 transition text-sm font-semibold">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={exportHistory}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-900 transition">
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border px-4 py-3 text-sm flex items-center gap-2"
          style={{ backgroundColor: COLORS.errorBg, borderColor: COLORS.errorBorder, color: COLORS.error }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* ── API 1 + 5: Summary Metric Cards ── */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <VendorMetricCard index={0} label="Total Paid Out"
          value={`₹${stats.totalPaid.toLocaleString()}`}
          accent={COLORS.success} accentBg={COLORS.successBg}
          note={`${stats.totalCount} total records`} icon={DollarSign} />
        <VendorMetricCard index={1} label="Pending Payout"
          value={`₹${stats.pending.toLocaleString()}`}
          accent={COLORS.warning} accentBg={COLORS.warningBg}
          note="Awaiting processing" icon={Clock} />
        <VendorMetricCard index={2} label="Available Balance"
          value={`₹${(wallet?.availableForWithdrawal || 0).toLocaleString()}`}
          accent={COLORS.info} accentBg={COLORS.infoBg}
          note="80% of total balance" icon={TrendingUp} />
        <VendorMetricCard index={3} label="Platform Fee"
          value={`${stats.platformFee}%`}
          accent={COLORS.primary} accentBg={`${COLORS.primary}18`}
          note="Per payout deduction" icon={Percent} />
      </div>

      {/* ── API 5: Wallet Balance Card ── */}
      {wallet && (
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Total Balance", val: wallet.balance, color: COLORS.primary, note: "Sum of all delivered orders" },
            { label: "Pending Settlement", val: wallet.pendingSettlement, color: COLORS.warning, note: "20% hold" },
            { label: "Available for Withdrawal", val: wallet.availableForWithdrawal, color: COLORS.success, note: "80% available" },
          ].map(item => (
            <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: item.color }}>{item.label}</p>
              <p className="text-2xl font-black text-gray-900">₹{item.val.toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">{item.note}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── API 3: Next Payout Schedule ── */}
      {schedule && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm"
          style={{ borderColor: COLORS.infoBorder, backgroundColor: COLORS.infoBg }}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: COLORS.info + "20" }}>
              <Calendar size={18} style={{ color: COLORS.info }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: COLORS.info }}>Next Payout Schedule</p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.info }}>
                {schedule.nextPayoutDate
                  ? `Scheduled for ${new Date(schedule.nextPayoutDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
                  : "No upcoming payout scheduled"}
              </p>
              {schedule.status && (
                <span className="inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded-full capitalize"
                  style={{ backgroundColor: COLORS.info + "20", color: COLORS.info }}>
                  {schedule.status}
                </span>
              )}
            </div>
            {schedule.estimatedAmount > 0 && (
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold" style={{ color: COLORS.info }}>Estimated</p>
                <p className="text-2xl font-black" style={{ color: COLORS.info }}>₹{schedule.estimatedAmount.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Payout History — Tab Switch ── */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-bold text-gray-900">Payout History</h3>
            {/* Tab: Vendor vs Finance */}
            <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
              <button onClick={() => setHistoryTab("vendor")}
                className="rounded-lg px-3 py-1.5 text-xs font-bold transition"
                style={historyTab === "vendor" ? { backgroundColor: COLORS.primary, color: "#fff" } : { color: "#6b7280" }}>
                Vendor (Last 50)
              </button>
              <button onClick={() => setHistoryTab("finance")}
                className="rounded-lg px-3 py-1.5 text-xs font-bold transition"
                style={historyTab === "finance" ? { backgroundColor: COLORS.primary, color: "#fff" } : { color: "#6b7280" }}>
                Finance (Full)
              </button>
            </div>
          </div>
          {/* Status filter */}
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
            {(["all", "paid", "pending", "processing", "failed"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition"
                style={filter === f ? { backgroundColor: COLORS.primary, color: "#fff" } : { color: "#6b7280" }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* ── API 4: Vendor Service History ── */}
        {historyTab === "vendor" && (
          filteredVendorPayouts.length > 0 ? (
            <div className="space-y-3">
              {filteredVendorPayouts.map(payout => {
                const sc = STATUS_STYLE[payout.status] || STATUS_STYLE.pending;
                const key = payout.id || Math.random().toString();
                return (
                  <div key={key} className="rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: sc.bg }}>
                          {payout.status === "paid"
                            ? <CheckCircle size={16} style={{ color: sc.color }} />
                            : payout.status === "failed"
                            ? <XCircle size={16} style={{ color: sc.color }} />
                            : <Clock size={16} style={{ color: sc.color }} />}
                        </div>
                        <div>
                          <p className="text-base font-black text-gray-900">₹{(payout.amount ?? 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {payout.createdAt
                              ? new Date(payout.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-full border px-2.5 py-1 text-xs font-bold uppercase flex-shrink-0"
                        style={{ backgroundColor: sc.bg, color: sc.color, borderColor: sc.border }}>
                        {payout.status}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>Gross: <span className="font-semibold text-gray-700">₹{(payout.grossAmount ?? 0).toLocaleString()}</span></span>
                      <span>Fee: <span className="font-semibold text-gray-700">₹{(payout.platformFee ?? 0).toLocaleString()}</span></span>
                      <span>Net: <span className="font-semibold text-gray-700">₹{(payout.amount ?? 0).toLocaleString()}</span></span>
                      {payout.transferredAt && (
                        <span>Transferred: <span className="font-semibold text-gray-700">{new Date(payout.transferredAt).toLocaleDateString("en-IN")}</span></span>
                      )}
                      {payout.periodStart && payout.periodEnd && (
                        <span>Period: <span className="font-semibold text-gray-700">{new Date(payout.periodStart).toLocaleDateString("en-IN")} — {new Date(payout.periodEnd).toLocaleDateString("en-IN")}</span></span>
                      )}
                    </div>
                    {payout.notes && (
                      <div className="mt-2 px-3 py-2 rounded-lg bg-gray-50 text-xs text-gray-600">{payout.notes}</div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState filter={filter} />
          )
        )}

        {/* ── API 2: Finance Service History (paginated, full fields) ── */}
        {historyTab === "finance" && (
          <>
            {financePageLoading && (
              <div className="flex items-center justify-center py-6">
                <RefreshCw size={18} className="animate-spin text-gray-400" />
              </div>
            )}
            {!financePageLoading && (filteredFinancePayouts.length > 0 ? (
              <div className="space-y-3">
                {filteredFinancePayouts.map(payout => {
                  const sc = STATUS_STYLE[payout.status] || STATUS_STYLE.pending;
                  return (
                    <div key={payout._id} className="rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: sc.bg }}>
                            {payout.status === "paid"
                              ? <CheckCircle size={16} style={{ color: sc.color }} />
                              : payout.status === "failed"
                              ? <XCircle size={16} style={{ color: sc.color }} />
                              : <Clock size={16} style={{ color: sc.color }} />}
                          </div>
                          <div>
                            {/* netAmount = vendor ko milta hai */}
                            <p className="text-base font-black text-gray-900">₹{(payout.netAmount ?? 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {payout.createdAt
                                ? new Date(payout.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
                                : "—"}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full border px-2.5 py-1 text-xs font-bold uppercase flex-shrink-0"
                          style={{ backgroundColor: sc.bg, color: sc.color, borderColor: sc.border }}>
                          {payout.status}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>Gross: <span className="font-semibold text-gray-700">₹{(payout.amount ?? 0).toLocaleString()}</span></span>
                        <span>Fee: <span className="font-semibold text-gray-700">₹{(payout.platformFee ?? 0).toLocaleString()}</span></span>
                        <span>Net: <span className="font-semibold text-gray-700">₹{(payout.netAmount ?? 0).toLocaleString()}</span></span>
                        {payout.transferId && (
                          <span>Transfer ID: <span className="font-mono text-gray-700">{payout.transferId}</span></span>
                        )}
                        {payout.transferredAt && (
                          <span>Transferred: <span className="font-semibold text-gray-700">{new Date(payout.transferredAt).toLocaleDateString("en-IN")}</span></span>
                        )}
                        {payout.periodStart && payout.periodEnd && (
                          <span>Period: <span className="font-semibold text-gray-700">{new Date(payout.periodStart).toLocaleDateString("en-IN")} — {new Date(payout.periodEnd).toLocaleDateString("en-IN")}</span></span>
                        )}
                        {payout.orderIds?.length > 0 && (
                          <span>Orders: <span className="font-semibold text-gray-700">{payout.orderIds.length}</span></span>
                        )}
                      </div>
                      {payout.failureReason && (
                        <div className="mt-2 px-3 py-2 rounded-lg text-xs"
                          style={{ backgroundColor: COLORS.errorBg, color: COLORS.error }}>
                          Failure: {payout.failureReason}
                        </div>
                      )}
                      {payout.notes && (
                        <div className="mt-2 px-3 py-2 rounded-lg bg-gray-50 text-xs text-gray-600">{payout.notes}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState filter={filter} />
            ))}

            {/* Pagination */}
            {financeMeta.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Page {financeMeta.page} of {financeMeta.totalPages} ({financeMeta.total} records)
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={financeMeta.page <= 1 || financePageLoading}
                    onClick={() => void loadFinancePage(financeMeta.page - 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold disabled:opacity-40 hover:border-gray-900 transition">
                    <ChevronLeft size={13} /> Prev
                  </button>
                  <button
                    disabled={financeMeta.page >= financeMeta.totalPages || financePageLoading}
                    onClick={() => void loadFinancePage(financeMeta.page + 1)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold disabled:opacity-40 hover:border-gray-900 transition">
                    Next <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EmptyState({ filter }: { filter: string }) {
  return (
    <div className="py-12 text-center">
      <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-gray-100">
        <FileText size={22} className="text-gray-400" />
      </div>
      <p className="text-gray-500 font-semibold">No payout records found</p>
      <p className="text-xs text-gray-400 mt-1">
        {filter !== "all" ? `No ${filter} payouts` : "Payouts will appear here once processed"}
      </p>
    </div>
  );
}
