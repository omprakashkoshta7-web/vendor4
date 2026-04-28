import { useEffect, useState } from "react";
import { Store, Briefcase, Wallet, TrendingUp, Users } from "lucide-react";
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
    // DEBUG: Log current user session
    const session = JSON.parse(localStorage.getItem('vendor_session') || '{}');
    console.log('🔍 VENDOR DEBUG - Current Session:', session);
    console.log('🔍 VENDOR DEBUG - User ID:', session.userId);
    console.log('🔍 VENDOR DEBUG - Vendor Org ID:', session.vendorOrgId);
    
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [financeResponse, staffResponse, scoreResponse] = await Promise.all([
          getVendorFinanceSummary().catch((err) => {
            console.log('💰 Finance API Error:', err);
            return { data: { balance: 0, pendingSettlement: 0, availableForWithdrawal: 0 } };
          }),
          getVendorStaff().catch((err) => {
            console.log('👥 Staff API Error:', err);
            return { data: [] };
          }),
          getVendorScore().catch((err) => {
            console.log('🎯 Score API Error:', err);
            return { data: { acceptanceRate: 0, completionRate: 0, overallScore: 0 } };
          }),
        ]);

        console.log('💰 Finance Response:', financeResponse);
        console.log('👥 Staff Response:', staffResponse);
        console.log('🎯 Score Response:', scoreResponse);

        const activeStaffCount = Array.isArray(staffResponse.data) 
          ? staffResponse.data.filter((s: { isActive: boolean }) => s.isActive).length 
          : 0;

        const financeData = financeResponse.data || { balance: 0, pendingSettlement: 0, availableForWithdrawal: 0 };
        
        setMetrics({
          jobsClosed: 0, // Not available in current API
          netPayout: financeData.balance || 0,
          slaScore: scoreResponse.data?.completionRate || 0,
          activeStaff: activeStaffCount,
        });
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
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

      {/* Info Message */}
      <section className="vendor-surface vendor-glow overflow-hidden rounded-[30px] border border-white/70 p-8 text-center">
        <div className="mx-auto max-w-md">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-violet-100 p-4">
              <Store size={32} className="text-violet-600" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Dashboard Overview</h3>
          <p className="text-sm text-gray-600">
            View your key metrics above. Navigate to specific sections for detailed analytics and management.
          </p>
        </div>
      </section>
    </div>
  );
};

export default VendorDashboardPage;
