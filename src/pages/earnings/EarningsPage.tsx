import { useEffect, useMemo, useState } from "react";
import LoadingState from "../../components/ui/LoadingState";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { COLORS } from "../../utils/colors";
import {
  getVendorWalletSummary,
  getVendorWalletStoreWise,
  getVendorWalletDeductions,
  getVendorStores,
} from "../../services/vendor.service";
import VendorMetricCard from "../../components/ui/VendorMetricCard";
import { Clock, DollarSign, TrendingUp, CreditCard, RefreshCw, Store, AlertTriangle } from "lucide-react";

export default function EarningsPage() {
  const [wallet, setWallet] = useState<any>(null);
  const [storeWise, setStoreWise] = useState<any[]>([]);
  const [deductions, setDeductions] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // API 1: GET /finance/wallet/summary
  // API 2: GET /finance/wallet/store-wise
  // API 3: GET /finance/wallet/deductions
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [walletRes, storeWiseRes, deductionsRes, storesRes] = await Promise.all([
        getVendorWalletSummary(),
        getVendorWalletStoreWise(),
        getVendorWalletDeductions(),
        getVendorStores(),
      ]);
      setWallet(walletRes.data);
      setStoreWise(Array.isArray(storeWiseRes.data) ? storeWiseRes.data : []);
      setDeductions((deductionsRes.data as any)?.deductions || []);
      setStores(storesRes.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load earnings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const storeNameMap = useMemo(() =>
    new Map(stores.map(s => [s._id, s.name])), [stores]);

  // Build chart data from store-wise earnings
  const chartData = useMemo(() =>
    storeWise.map(s => ({
      name: storeNameMap.get(s._id) || s._id?.slice(-6) || "Store",
      earnings: s.earnings || 0,
      orders: s.orderCount || 0,
    })), [storeWise, storeNameMap]);

  const totalEarnings = storeWise.reduce((sum, s) => sum + (s.earnings || 0), 0);
  const totalOrders = storeWise.reduce((sum, s) => sum + (s.orderCount || 0), 0);

  if (loading) return <LoadingState message="Loading earnings" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Earnings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your revenue and store performance</p>
        </div>
        <button onClick={() => void loadData()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-900 transition text-sm font-semibold">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error && (
        <div className="rounded-xl border px-4 py-3 text-sm flex items-center gap-2"
          style={{ backgroundColor: COLORS.errorBg, borderColor: COLORS.errorBorder, color: COLORS.error }}>
          <AlertTriangle size={14} /> {error}
        </div>
      )}

      {/* API 1: Wallet Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <VendorMetricCard 
          index={0} 
          label="Total Balance" 
          value={`₹${(wallet?.balance || 0).toLocaleString()}`} 
          accent={COLORS.primary} 
          accentBg={`${COLORS.primary}18`} 
          note={`Currency: ${wallet?.currency || "INR"}`} 
          icon={DollarSign} 
        />
        <VendorMetricCard 
          index={1} 
          label="Pending Settlement" 
          value={`₹${(wallet?.pendingSettlement || 0).toLocaleString()}`} 
          accent={COLORS.warning} 
          accentBg={COLORS.warningBg} 
          note="Awaiting release" 
          icon={Clock} 
        />
        <VendorMetricCard 
          index={2} 
          label="Available" 
          value={`₹${(wallet?.availableForWithdrawal || 0).toLocaleString()}`} 
          accent={COLORS.success} 
          accentBg={COLORS.successBg} 
          note="Ready to withdraw" 
          icon={TrendingUp} 
        />
        <VendorMetricCard 
          index={3} 
          label="Total Orders" 
          value={String(totalOrders)} 
          accent={COLORS.info} 
          accentBg={COLORS.infoBg} 
          note="Across all stores" 
          icon={Store} 
        />
      </div>

      {/* API 2: Store-wise Earnings Chart */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-gray-900">Store-wise Earnings</h3>
          <p className="text-xs text-gray-500 mt-0.5">Earnings breakdown per store</p>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString()}`, "Earnings"]} />
              <Area type="monotone" dataKey="earnings" stroke={COLORS.primary} fill="url(#earningsGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
            No store earnings data yet
          </div>
        )}
      </div>

      {/* API 2: Store-wise Table + API 3: Deductions */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Store-wise breakdown */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm scroll-card">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex-shrink-0">Store Breakdown</h3>
          <div className="scroll-card-body space-y-3 pr-1">
            {storeWise.length > 0 ? (
              <>
                {storeWise.map(s => {
                  const pct = totalEarnings > 0 ? Math.round((s.earnings / totalEarnings) * 100) : 0;
                  return (
                    <div key={s._id} className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-bold text-gray-900">
                          {storeNameMap.get(s._id) || `Store ${s._id?.slice(-6)}`}
                        </p>
                        <p className="text-sm font-black text-gray-900">₹{(s.earnings || 0).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
                        <span>{s.orderCount || 0} orders</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS.primary }} />
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between p-3 rounded-xl border border-gray-300 bg-gray-100">
                  <p className="text-sm font-bold text-gray-700">Total</p>
                  <p className="text-sm font-black text-gray-900">₹{totalEarnings.toLocaleString()}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No store earnings data</p>
            )}
          </div>
        </div>

        {/* API 3: Deductions */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm scroll-card">
          <h3 className="text-base font-bold text-gray-900 mb-4 flex-shrink-0">Deductions</h3>
          <div className="scroll-card-body pr-1">
            {deductions.length > 0 ? (
              <div className="space-y-3">
                {deductions.map((d: any) => (
                  <div key={d._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{d.description || d.category}</p>
                      <p className="text-xs text-gray-500">
                        {d.referenceType && `${d.referenceType}: ${d.referenceId}`}
                        {d.createdAt && ` • ${new Date(d.createdAt).toLocaleDateString()}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold" style={{ color: COLORS.error }}>-₹{(d.amount || 0).toLocaleString()}</p>
                      {d.metadata?.feePercentage && (
                        <p className="text-xs text-gray-500">{d.metadata.feePercentage}% fee</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CreditCard size={32} className="text-gray-300 mb-2" />
                <p className="text-sm text-gray-400">No deductions recorded</p>
                <p className="text-xs text-gray-400 mt-1">Platform fees and deductions will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
