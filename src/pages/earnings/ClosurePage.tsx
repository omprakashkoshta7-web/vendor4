import { useEffect, useState } from "react";
import { Download, RefreshCw, AlertTriangle, Briefcase, DollarSign, TrendingUp, ShoppingCart } from "lucide-react";
import LoadingState from "../../components/ui/LoadingState";
import { COLORS } from "../../utils/colors";
import {
  getVendorClosureDaily,
  getVendorClosureWeekly,
  getVendorClosureMonthly,
} from "../../services/vendor.service";
import type { VendorClosure } from "../../types/vendor";
import VendorMetricCard from "../../components/ui/VendorMetricCard";

type Period = "daily" | "weekly" | "monthly";

export default function ClosurePage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [closure, setClosure] = useState<VendorClosure | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // API 4: GET /vendor/finance/closure/daily
  // API 5: GET /vendor/finance/closure/weekly
  // API 6: GET /vendor/finance/closure/monthly
  const loadClosure = async () => {
    try {
      setLoading(true);
      setError("");
      let res;
      if (period === "weekly")       res = await getVendorClosureWeekly(selectedDate);
      else if (period === "monthly") res = await getVendorClosureMonthly(selectedDate);
      else                           res = await getVendorClosureDaily(selectedDate);
      setClosure(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load closure");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadClosure(); }, [period, selectedDate]);

  const avgOrderValue = closure && closure.count > 0
    ? Math.round(closure.earnings / closure.count)
    : 0;

  const exportReport = () => {
    if (!closure) return;
    const csv = [
      ["Period", "From", "To", "Earnings", "Orders", "Gross Sales", "Discount", "Avg Order Value"].join(","),
      [
        closure.period,
        closure.from ? new Date(closure.from).toLocaleDateString() : "",
        closure.to   ? new Date(closure.to).toLocaleDateString()   : "",
        closure.earnings,
        closure.count,
        closure.grossSales ?? "",
        closure.discount ?? "",
        avgOrderValue,
      ].join(","),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `closure-${period}-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Closure Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Daily, weekly, and monthly closures</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold bg-white focus:outline-none focus:border-gray-900 transition" />
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1">
            {(["daily", "weekly", "monthly"] as Period[]).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className="rounded-lg px-4 py-2 text-sm font-semibold capitalize transition"
                style={period === p ? { backgroundColor: COLORS.primary, color: "#fff" } : { color: "#6b7280" }}>
                {p}
              </button>
            ))}
          </div>
          <button onClick={() => void loadClosure()}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-900 transition text-sm font-semibold">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <button onClick={exportReport}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-gray-900 transition">
          <Download size={15} /> Export
        </button>
      </div>

      {error && (
        <div className="rounded-xl border px-4 py-3 text-sm flex items-center gap-2"
          style={{ backgroundColor: COLORS.errorBg, borderColor: COLORS.errorBorder, color: COLORS.error }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {loading || !closure ? <LoadingState message="Loading closure data" /> : (
        <>
          {/* Stats — exact backend fields */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <VendorMetricCard index={0} label="Total Orders"    value={String(closure.count)}                        accent={COLORS.warning} accentBg={COLORS.warningBg} note={`${period} period`} icon={Briefcase} />
            <VendorMetricCard index={1} label="Net Earnings"    value={`₹${closure.earnings.toLocaleString()}`}      accent={COLORS.success} accentBg={COLORS.successBg} note="vendorPayout sum"   icon={DollarSign} />
            <VendorMetricCard index={2} label="Gross Sales"     value={`₹${(closure.grossSales ?? 0).toLocaleString()}`} accent={COLORS.info} accentBg={COLORS.infoBg} note="order.total sum"   icon={ShoppingCart} />
            <VendorMetricCard index={3} label="Avg Order Value" value={`₹${avgOrderValue.toLocaleString()}`}         accent={COLORS.primary} accentBg={`${COLORS.primary}18`} note="Per order"   icon={TrendingUp} />
          </div>

          {/* Summary Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-1">
              {period.charAt(0).toUpperCase() + period.slice(1)} Closure Summary
            </h3>
            {/* Period range */}
            {closure.from && closure.to && (
              <p className="text-xs text-gray-400 mb-4">
                {new Date(closure.from).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                {" — "}
                {new Date(closure.to).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                <p className="text-xs text-gray-500 mb-1">Orders Closed</p>
                <p className="text-2xl font-black text-gray-900">{closure.count}</p>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.successBg, border: `1px solid ${COLORS.successBorder}` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: COLORS.success }}>Net Earnings</p>
                <p className="text-2xl font-black" style={{ color: COLORS.success }}>₹{closure.earnings.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                <p className="text-xs text-gray-500 mb-1">Gross Sales</p>
                <p className="text-2xl font-black text-gray-900">₹{(closure.grossSales ?? 0).toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                <p className="text-xs text-gray-500 mb-1">Discount</p>
                <p className="text-2xl font-black text-gray-900">₹{(closure.discount ?? 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
