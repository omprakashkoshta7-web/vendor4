import { useEffect, useMemo, useState } from "react";
import {
  Download, FileText, RefreshCw, AlertTriangle,
  Clock, DollarSign, TrendingUp, Calendar, CheckCircle
} from "lucide-react";
import LoadingState from "../../components/ui/LoadingState";
import { COLORS } from "../../utils/colors";
import {
  getVendorPayoutsSchedule,
  getVendorPayoutHistory,
} from "../../services/vendor.service";
import type { VendorPayout } from "../../types/vendor";
import VendorMetricCard from "../../components/ui/VendorMetricCard";

const STATUS_STYLE: Record<string, { color: string; bg: string; border: string }> = {
  paid:       { color: COLORS.success, bg: COLORS.successBg, border: COLORS.successBorder },
  processing: { color: COLORS.info,    bg: COLORS.infoBg,    border: COLORS.infoBorder },
  pending:    { color: COLORS.warning, bg: COLORS.warningBg, border: COLORS.warningBorder },
  failed:     { color: COLORS.error,   bg: COLORS.errorBg,   border: COLORS.errorBorder },
};

export default function PayoutsPage() {
  const [schedule, setSchedule] = useState<any>(null);
  const [payouts, setPayouts] = useState<VendorPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "pending" | "processing" | "failed">("all");

  // API 7: GET /finance/payouts/schedule
  // API 8: GET /finance/payouts/history
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [scheduleRes, historyRes] = await Promise.all([
        getVendorPayoutsSchedule(),
        getVendorPayoutHistory(),
      ]);
      setSchedule(scheduleRes.data);
      setPayouts((historyRes.data as any)?.payouts || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const filteredPayouts = useMemo(() =>
    filter === "all" ? payouts : payouts.filter(p => p.status === filter),
    [filter, payouts]
  );

  const stats = useMemo(() => ({
    totalPaid: payouts.filter(p => p.status === "paid").reduce((s, p) => s + p.netAmount, 0),
    pending: payouts.filter(p => p.status === "pending").reduce((s, p) => s + p.netAmount, 0),
    totalCount: payouts.length,
    avgPayout: payouts.length ? Math.round(payouts.reduce((s, p) => s + p.netAmount, 0) / payouts.length) : 0,
  }), [payouts]);

  const exportHistory = () => {
    const csv = [
      ["Date", "Gross", "Fee", "Net", "Status", "Transfer ID"].join(","),
      ...payouts.map(p => [
        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—",
        p.amount, p.platformFee, p.netAmount, p.status, p.transferId || "—"
      ].join(","))
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payouts-history.csv`;
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
          <p className="text-sm text-gray-500 mt-0.5">View payout history and schedule</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void loadData()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-900 transition text-sm font-semibold">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={exportHistory}
            className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-900 transition">
            <Download size={15} /> Export History
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border px-4 py-3 text-sm flex items-center gap-2"
          style={{ backgroundColor: COLORS.errorBg, borderColor: COLORS.errorBorder, color: COLORS.error }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <VendorMetricCard index={0} label="Total Paid Out" value={`₹${stats.totalPaid.toLocaleString()}`} accent={COLORS.success} accentBg={COLORS.successBg} note="Settled payouts" icon={DollarSign} />
        <VendorMetricCard index={1} label="Pending Amount" value={`₹${stats.pending.toLocaleString()}`} accent={COLORS.warning} accentBg={COLORS.warningBg} note="Awaiting processing" icon={Clock} />
        <VendorMetricCard index={2} label="Avg Payout" value={`₹${stats.avgPayout.toLocaleString()}`} accent={COLORS.info} accentBg={COLORS.infoBg} note={`${stats.totalCount} total records`} icon={TrendingUp} />
        <VendorMetricCard index={3} label="Next Payout" value={schedule?.nextPayoutDate ? new Date(schedule.nextPayoutDate).toLocaleDateString() : "Not scheduled"} accent={COLORS.primary} accentBg={`${COLORS.primary}18`} note={schedule?.estimatedAmount ? `₹${schedule.estimatedAmount.toLocaleString()} est.` : "No estimate"} icon={Calendar} />
      </div>

      {/* API 7: Next Payout Schedule Card */}
      {schedule && (
        <div className="rounded-2xl border bg-white p-5 shadow-sm"
          style={{ borderColor: COLORS.infoBorder, backgroundColor: COLORS.infoBg }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: COLORS.info + "20" }}>
              <Calendar size={18} style={{ color: COLORS.info }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: COLORS.info }}>Next Payout Schedule</p>
              <p className="text-xs mt-0.5" style={{ color: COLORS.info }}>
                {schedule.nextPayoutDate
                  ? `Scheduled for ${new Date(schedule.nextPayoutDate).toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
                  : "No upcoming payout scheduled"}
              </p>
            </div>
            {schedule.estimatedAmount > 0 && (
              <div className="text-right">
                <p className="text-xs font-semibold" style={{ color: COLORS.info }}>Estimated</p>
                <p className="text-lg font-black" style={{ color: COLORS.info }}>₹{schedule.estimatedAmount.toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* API 8: Payout History */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-base font-bold text-gray-900">Payout History</h3>
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

        {filteredPayouts.length > 0 ? (
          <div className="space-y-3">
            {filteredPayouts.map(payout => {
              const sc = STATUS_STYLE[payout.status] || STATUS_STYLE.pending;
              return (
                <div key={payout._id} className="rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: sc.bg }}>
                        {payout.status === "paid"
                          ? <CheckCircle size={16} style={{ color: sc.color }} />
                          : <Clock size={16} style={{ color: sc.color }} />
                        }
                      </div>
                      <div>
                        <p className="text-base font-black text-gray-900">₹{payout.netAmount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {payout.createdAt ? new Date(payout.createdAt).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                        </p>
                      </div>
                    </div>
                    <span className="rounded-full border px-2.5 py-1 text-xs font-bold uppercase flex-shrink-0"
                      style={{ backgroundColor: sc.bg, color: sc.color, borderColor: sc.border }}>
                      {payout.status}
                    </span>
                  </div>

                  {/* Details row */}
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span>Gross: <span className="font-semibold text-gray-700">₹{payout.amount.toLocaleString()}</span></span>
                    <span>Platform Fee: <span className="font-semibold text-gray-700">₹{payout.platformFee.toLocaleString()}</span></span>
                    {payout.orderIds && payout.orderIds.length > 0 && (
                      <span>{payout.orderIds.length} orders included</span>
                    )}
                    {payout.transferId && (
                      <span>Transfer: <span className="font-mono text-gray-700">{payout.transferId}</span></span>
                    )}
                    {payout.periodStart && payout.periodEnd && (
                      <span>
                        Period: {new Date(payout.periodStart).toLocaleDateString()} — {new Date(payout.periodEnd).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Failure reason */}
                  {payout.failureReason && (
                    <div className="mt-2 p-2 rounded-lg text-xs font-semibold"
                      style={{ backgroundColor: COLORS.errorBg, color: COLORS.error }}>
                      ⚠ {payout.failureReason}
                    </div>
                  )}

                  {/* Notes */}
                  {payout.notes && (
                    <p className="mt-2 text-xs text-gray-400 italic">{payout.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-semibold">No payout records found</p>
            <p className="text-xs text-gray-400 mt-1">
              {filter !== "all" ? `No ${filter} payouts` : "Payouts will appear here once processed"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
