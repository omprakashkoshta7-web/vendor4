import { useEffect, useState } from "react";
import { Briefcase, Wallet, TrendingUp, Users } from "lucide-react";
import VendorMetricCard from "../../components/ui/VendorMetricCard";
import LoadingState from "../../components/ui/LoadingState";
import { getVendorFinanceSummary, getVendorStaff, getVendorScore } from "../../services/vendor.service";
import { COLORS } from "../../utils/colors";

const VendorDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    jobsClosed: 0,
    netPayout: 0,
    slaScore: 0,
    activeStaff: 0,
  });

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [financeResponse, staffResponse, scoreResponse] = await Promise.all([
          getVendorFinanceSummary().catch(() => ({ data: { balance: 0, pendingSettlement: 0, availableForWithdrawal: 0 } })),
          getVendorStaff().catch(() => ({ data: [] })),
          getVendorScore().catch(() => ({ data: { acceptanceRate: 0, completionRate: 0, overallScore: 0 } })),
        ]);

        const activeStaffCount = Array.isArray(staffResponse.data)
          ? staffResponse.data.filter((s: { isActive: boolean }) => s.isActive).length
          : 0;

        const financeData = financeResponse.data || { balance: 0, pendingSettlement: 0, availableForWithdrawal: 0 };

        setMetrics({
          jobsClosed: 0,
          netPayout: financeData.balance || 0,
          slaScore: scoreResponse.data?.completionRate || 0,
          activeStaff: activeStaffCount,
        });
      } catch {
        // silently fail — metrics stay at 0
      } finally {
        setLoading(false);
      }
    }

    void loadDashboardData();
  }, []);

  if (loading) {
    return <LoadingState message="Loading dashboard" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your vendor operations</p>
      </div>

      {/* Metrics Grid */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <VendorMetricCard
          index={0}
          label="Jobs Closed"
          value={String(metrics.jobsClosed)}
          accent={COLORS.success}
          note="Total payouts"
          icon={Briefcase}
        />
        <VendorMetricCard
          index={1}
          label="Net Payout"
          value={`₹${metrics.netPayout.toLocaleString()}`}
          accent={COLORS.error}
          note="After deductions"
          icon={Wallet}
        />
        <VendorMetricCard
          index={2}
          label="SLA Score"
          value={`${metrics.slaScore}%`}
          accent={COLORS.success}
          note="Compliance rate"
          icon={TrendingUp}
        />
        <VendorMetricCard
          index={3}
          label="Active Staff"
          value={String(metrics.activeStaff)}
          accent={COLORS.info}
          note="On current roster"
          icon={Users}
        />
      </section>
    </div>
  );
};

export default VendorDashboardPage;
