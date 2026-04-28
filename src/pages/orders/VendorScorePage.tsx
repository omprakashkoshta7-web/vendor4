import { useEffect, useState } from "react";
import {
  Award, Target, TrendingUp, TrendingDown,
  RefreshCw, AlertTriangle, CheckCircle, XCircle,
  Info, BarChart2
} from "lucide-react";
import LoadingState from "../../components/ui/LoadingState";
import {
  CartesianGrid, Line, LineChart,
  PolarAngleAxis, PolarGrid, Radar, RadarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { COLORS } from "../../utils/colors";
import {
  getVendorPerformanceScore,
  getVendorRejectionsHistory,
} from "../../services/vendor.service";
import VendorMetricCard from "../../components/ui/VendorMetricCard";

export default function VendorScorePage() {
  const [scoreData, setScoreData] = useState<any>(null);
  const [rejections, setRejections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // API 1: GET /scoring/performance-score
  // API 2: GET /scoring/rejections/history
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [scoreRes, rejectionsRes] = await Promise.all([
        getVendorPerformanceScore(),
        getVendorRejectionsHistory(),
      ]);
      setScoreData(scoreRes.data);
      setRejections(Array.isArray(rejectionsRes.data) ? rejectionsRes.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  if (loading) return <LoadingState message="Loading performance score" />;

  const acceptanceRate = scoreData?.acceptanceRate || 0;
  const completionRate = scoreData?.completionRate || 0;
  const overallScore = scoreData?.overallScore || 0;

  const routingPriority = overallScore >= 80 ? "High" : overallScore >= 60 ? "Medium" : "Low";
  const priorityColor = overallScore >= 80 ? COLORS.success : overallScore >= 60 ? COLORS.warning : COLORS.error;

  const scoreColor = overallScore >= 80 ? COLORS.success : overallScore >= 60 ? COLORS.warning : COLORS.error;
  const scoreBg = overallScore >= 80 ? COLORS.successBg : overallScore >= 60 ? COLORS.warningBg : COLORS.errorBg;

  const radarData = [
    { metric: "Acceptance", score: acceptanceRate, target: 95 },
    { metric: "Completion", score: completionRate, target: 98 },
    { metric: "Overall", score: overallScore, target: 90 },
  ];

  const metrics = [
    {
      label: "Acceptance Rate",
      value: acceptanceRate,
      target: 95,
      desc: "Percentage of assigned orders accepted",
      good: acceptanceRate >= 95,
    },
    {
      label: "Completion Rate",
      value: completionRate,
      target: 98,
      desc: "Percentage of accepted orders completed",
      good: completionRate >= 98,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Vendor Score</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your performance metrics</p>
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

      {/* API 1: Score Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <VendorMetricCard index={0} label="Overall Score" value={`${overallScore}/100`} accent={scoreColor} accentBg={scoreBg} note="Performance score" icon={Award} />
        <VendorMetricCard index={1} label="Routing Priority" value={routingPriority} accent={priorityColor} accentBg={`${priorityColor}18`} note="Order assignment priority" icon={Target} />
        <VendorMetricCard index={2} label="Acceptance Rate" value={`${acceptanceRate}%`} accent={COLORS.info} accentBg={COLORS.infoBg} note="Orders accepted" icon={TrendingUp} />
        <VendorMetricCard index={3} label="Completion Rate" value={`${completionRate}%`} accent={COLORS.primary} accentBg={`${COLORS.primary}18`} note="Orders completed" icon={BarChart2} />
      </div>

      {/* Score Overview Banner */}
      <div className="rounded-2xl border p-5 shadow-sm"
        style={{ backgroundColor: scoreBg, borderColor: scoreColor + "40" }}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl flex-shrink-0"
            style={{ backgroundColor: scoreColor }}>
            {overallScore}
          </div>
          <div className="flex-1">
            <p className="text-base font-black" style={{ color: scoreColor }}>
              {overallScore >= 80 ? "Excellent Performance" : overallScore >= 60 ? "Good Performance" : "Needs Improvement"}
            </p>
            <p className="text-sm mt-0.5" style={{ color: scoreColor }}>
              {overallScore >= 80
                ? "You are a top-rated vendor. Keep maintaining high acceptance and completion rates."
                : overallScore >= 60
                ? "Your performance is good. Focus on improving acceptance rate to reach top tier."
                : "Your score needs improvement. Accept more orders and complete them on time."}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs font-semibold mb-1" style={{ color: scoreColor }}>Routing Priority</p>
            <span className="text-sm font-black px-3 py-1.5 rounded-xl text-white"
              style={{ backgroundColor: priorityColor }}>
              {routingPriority}
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Radar Chart */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-1">Performance Radar</h3>
          <p className="text-xs text-gray-500 mb-4">Score vs target benchmarks</p>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#f1f5f9" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Radar name="Your Score" dataKey="score" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.2} strokeWidth={2.5} />
              <Radar name="Target" dataKey="target" stroke="#d1d5db" fill="transparent" strokeWidth={1.5} strokeDasharray="4 2" />
              <Tooltip formatter={(v: any) => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 justify-center mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.primary }} />
              <span className="text-xs text-gray-500">Your Score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-gray-300" />
              <span className="text-xs text-gray-500">Target</span>
            </div>
          </div>
        </div>

        {/* Score Trend (static from computed data) */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-900 mb-1">Score Breakdown</h3>
          <p className="text-xs text-gray-500 mb-4">Acceptance vs Completion vs Overall</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={[
              { name: "Acceptance", value: acceptanceRate },
              { name: "Completion", value: completionRate },
              { name: "Overall", value: overallScore },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: any) => [`${v}%`, "Score"]} />
              <Line type="monotone" dataKey="value" stroke={COLORS.primary} strokeWidth={3} dot={{ fill: COLORS.primary, r: 5 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {metrics.map(m => (
          <div key={m.label} className="rounded-2xl border-2 bg-white p-5 shadow-sm"
            style={{ borderColor: m.good ? COLORS.successBorder : COLORS.warningBorder }}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-bold text-gray-900">{m.label}</h3>
              <span className="rounded-full border px-2.5 py-1 text-xs font-bold uppercase"
                style={{
                  backgroundColor: m.good ? COLORS.successBg : COLORS.warningBg,
                  color: m.good ? COLORS.success : COLORS.warning,
                  borderColor: m.good ? COLORS.successBorder : COLORS.warningBorder,
                }}>
                {m.good ? "On Track" : "Needs Attention"}
              </span>
            </div>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-3xl font-black text-gray-900">{m.value}%</span>
              <span className="text-sm text-gray-500 mb-1">Target: {m.target}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3">
              <div className="h-2.5 rounded-full transition-all"
                style={{ width: `${m.value}%`, backgroundColor: m.good ? COLORS.success : COLORS.warning }} />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">{m.desc}</p>
              {m.good
                ? <CheckCircle size={16} style={{ color: COLORS.success }} />
                : <AlertTriangle size={16} style={{ color: COLORS.warning }} />
              }
            </div>
          </div>
        ))}
      </div>

      {/* API 2: Rejection History */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${COLORS.error}18` }}>
            <TrendingDown size={17} style={{ color: COLORS.error }} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-gray-900">Rejection History</h3>
            <p className="text-xs text-gray-500">Orders rejected by your team — affects acceptance rate</p>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Info size={12} /> Permanently logged
          </div>
        </div>

        {rejections.length > 0 ? (
          <div className="space-y-3">
            {rejections.map((order: any, i: number) => {
              const rejectionNote = order.timeline?.find((t: any) =>
                /rejected by vendor/i.test(t.note || "")
              );
              return (
                <div key={order._id || i} className="rounded-xl border p-4"
                  style={{ backgroundColor: COLORS.errorBg, borderColor: COLORS.errorBorder }}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold font-mono" style={{ color: COLORS.error }}>
                        {order.orderNumber || `#${String(order._id).slice(-8).toUpperCase()}`}
                      </p>
                      <p className="text-xs mt-1" style={{ color: COLORS.error }}>
                        {rejectionNote?.note || "Rejected by vendor"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs" style={{ color: COLORS.error }}>
                        {order.updatedAt ? new Date(order.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </p>
                      <div className="flex items-center gap-1 mt-1 justify-end">
                        <XCircle size={12} style={{ color: COLORS.error }} />
                        <span className="text-xs font-bold" style={{ color: COLORS.error }}>Rejected</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <CheckCircle size={36} className="mx-auto mb-3" style={{ color: COLORS.success }} />
            <p className="text-sm font-semibold text-gray-600">No rejections recorded</p>
            <p className="text-xs text-gray-400 mt-1">Keep it up! Zero rejections means maximum routing priority.</p>
          </div>
        )}
      </div>
    </div>
  );
}
