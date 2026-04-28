import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, AlertTriangle, Briefcase, CheckCircle, DollarSign, TrendingUp } from "lucide-react";
import LoadingState from "../../components/ui/LoadingState";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLORS } from "../../utils/colors";
import {
  getVendorClosureDaily,
  getVendorClosureWeekly,
  getVendorClosureMonthly,
  getVendorStores,
} from "../../services/vendor.service";
import VendorMetricCard from "../../components/ui/VendorMetricCard";

type Period = "daily" | "weekly" | "monthly";

export default function ClosurePage() {
  const [period, setPeriod] = useState<Period>("daily");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [closure, setClosure] = useState<any>(null);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getVendorStores().then(r => setStores(r.data || [])).catch(() => {});
  }, []);

  // API 4: GET /finance/closure/daily
  // API 5: GET /finance/closure/weekly
  // API 6: GET /finance/closure/monthly
  const loadClosure = async () => {
    try {
      setLoading(true);
      setError("");
      let res;
      if (period === "weekly") res = await getVendorClosureWeekly(selectedDate);
      else if (period === "monthly") res = await getVendorClosureMonthly(selectedDate);
      else res = await getVendorClosureDaily(selectedDate);

      const d = res.data || { period, earnings: 0, count: 0 };
      // Backend returns: { period, earnings, count }
      // Normalize to display format
      setClosure({
        period: d.period || period,
        earnings: d.earnings || 0,
        count: d.count || 0,
        avgOrderValue: d.count > 0 ? Math.round(d.earnings / d.count) : 0,
        chartData: [],
        storeBreakdown: [],
        jobs: [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load closure");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadClosure(); }, [period, selectedDate]);

  const storeNameMap = useMemo(() =>
    new Map(stores.map(s => [s._id, s.name])), [stores]);

  const exportReport = () => {
    if (!closure) return;
    const csv = [
      ["Period", "Earnings", "Orders", "Avg Order Value"].join(","),
      [closure.period, closure.earnings, closure.count, closure.avgOrderValue].join(","),
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
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <VendorMetricCard index={0} label="Total Orders" value={String(closure.count)} accent={COLORS.warning} accentBg={COLORS.warningBg} note={`${period} period`} icon={Briefcase} />
            <VendorMetricCard index={1} label="Total Earnings" value={`₹${closure.earnings.toLocaleString()}`} accent={COLORS.success} accentBg={COLORS.successBg} note="Net earnings" icon={DollarSign} />
            <VendorMetricCard index={2} label="Avg Order Value" value={`₹${closure.avgOrderValue.toLocaleString()}`} accent={COLORS.info} accentBg={COLORS.infoBg} note="Per order" icon={TrendingUp} />
            <VendorMetricCard index={3} label="Period" value={closure.period} accent={COLORS.primary} accentBg={`${COLORS.primary}18`} note={selectedDate} icon={CheckCircle} />
          </div>

          {/* Summary Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 mb-4">
              {period.charAt(0).toUpperCase() + period.slice(1)} Closure Summary
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                <p className="text-xs text-gray-500 mb-1">Orders Closed</p>
                <p className="text-2xl font-black text-gray-900">{closure.count}</p>
              </div>
              <div className="p-4 rounded-xl text-center" style={{ backgroundColor: COLORS.successBg, border: `1px solid ${COLORS.successBorder}` }}>
                <p className="text-xs font-semibold mb-1" style={{ color: COLORS.success }}>Total Earnings</p>
                <p className="text-2xl font-black" style={{ color: COLORS.success }}>₹{closure.earnings.toLocaleString()}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center">
                <p className="text-xs text-gray-500 mb-1">Avg per Order</p>
                <p className="text-2xl font-black text-gray-900">₹{closure.avgOrderValue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Chart (if chartData available) */}
          {closure.chartData && closure.chartData.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">Earnings Trend</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={closure.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, "Earnings"]} />
                  <Bar dataKey="earnings" fill={COLORS.primary} radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Store Breakdown + Jobs */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">Store Breakdown</h3>
              {closure.storeBreakdown.length > 0 ? (
                <div className="space-y-3">
                  {closure.storeBreakdown.map((item: any) => (
                    <div key={item.storeId} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{storeNameMap.get(item.storeId) || item.storeId}</p>
                        <p className="text-xs text-gray-500">{item.jobs} jobs • {item.percentage}%</p>
                      </div>
                      <p className="text-sm font-black text-gray-900">₹{item.earnings.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">No store breakdown available</p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">Closed Jobs</h3>
              {closure.jobs.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {closure.jobs.map((job: any) => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                      <div>
                        <p className="text-xs font-bold text-gray-900 font-mono">{job.id}</p>
                        <p className="text-xs text-gray-500">{storeNameMap.get(job.storeId) || job.storeId}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">₹{job.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{job.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-6">No closed jobs in this period</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
