import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Clock, Package, ShieldCheck, Truck } from "lucide-react";
import LoadingState from "../../components/ui/LoadingState";
import { COLORS } from "../../utils/colors";
import {
  getVendorOrders,
  markVendorQcPending,
  markVendorReadyForPickup,
  startVendorProduction,
} from "../../services/vendor.service";
import type { VendorOrder } from "../../types/vendor";
import VendorMetricCard from "../../components/ui/VendorMetricCard";

type ProductionFilter = "all" | "vendor_accepted" | "in_production" | "qc_pending" | "ready_for_pickup";

export default function ProductionPage() {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<ProductionFilter>("all");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);
        const response = await getVendorOrders();
        setOrders(
          (response.data.orders || []).filter((order) =>
            ["vendor_accepted", "in_production", "qc_pending", "ready_for_pickup"].includes(order.status)
          )
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load production queue");
      } finally {
        setLoading(false);
      }
    }

    void loadOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return filter === "all" ? orders : orders.filter((order) => order.status === filter);
  }, [filter, orders]);

  const stats = useMemo(
    () => ({
      accepted: orders.filter((order) => order.status === "vendor_accepted").length,
      production: orders.filter((order) => order.status === "in_production").length,
      qc: orders.filter((order) => order.status === "qc_pending").length,
      ready: orders.filter((order) => order.status === "ready_for_pickup").length,
    }),
    [orders]
  );

  async function handleAction(order: VendorOrder, action: "start" | "qc" | "ready") {
    try {
      setBusyId(order._id);
      const response =
        action === "start"
          ? await startVendorProduction(order._id)
          : action === "qc"
            ? await markVendorQcPending(order._id)
            : await markVendorReadyForPickup(order._id);

      setOrders((current) => current.map((item) => (item._id === order._id ? response.data : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update production status");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Removed page title and subtitle */}

      {error ? (
        <div className="rounded-2xl border px-4 py-3 text-sm" style={{ backgroundColor: COLORS.errorBg, borderColor: COLORS.errorBorder, color: COLORS.error }}>
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <VendorMetricCard
          label="Accepted"
          value={stats.accepted.toString()}
          accent={COLORS.info}
          accentBg={`${COLORS.info}18`}
          index={0}
          icon={CheckCircle}
        />
        <VendorMetricCard
          label="In Production"
          value={stats.production.toString()}
          accent={COLORS.warning}
          accentBg={`${COLORS.warning}18`}
          index={1}
          icon={Clock}
        />
        <VendorMetricCard
          label="QC Pending"
          value={stats.qc.toString()}
          accent={COLORS.accent}
          accentBg={`${COLORS.accent}18`}
          index={2}
          icon={ShieldCheck}
        />
        <VendorMetricCard
          label="Ready"
          value={stats.ready.toString()}
          accent={COLORS.success}
          accentBg={`${COLORS.success}18`}
          index={3}
          icon={Package}
        />
      </div>

      <div className="flex gap-2 rounded-2xl bg-gray-100 p-1 flex-wrap">
        {(["all", "vendor_accepted", "in_production", "qc_pending", "ready_for_pickup"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              filter === value ? "text-white" : "text-gray-600"
            }`}
            style={filter === value ? { backgroundColor: COLORS.primary } : undefined}
          >
            {value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingState message="Loading production queue" />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const primaryItem = order.items?.[0];
            return (
              <div key={order._id} className="vendor-card vendor-card-primary rounded-[28px] border border-gray-100 bg-white p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{order.orderNumber || order._id}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {primaryItem?.productName || "Order item"} • Qty {primaryItem?.quantity || 0}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">Current status: {order.status}</p>
                  </div>
                  <span className="rounded-full border px-3 py-1 text-xs font-bold uppercase" style={{ backgroundColor: COLORS.infoBg, color: COLORS.info, borderColor: COLORS.infoBorder }}>
                    {order.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3 rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Accepted At</p>
                    <p className="mt-2">{order.acceptedAt ? new Date(order.acceptedAt).toLocaleString() : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Created</p>
                    <p className="mt-2">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-500">Total</p>
                    <p className="mt-2">Rs {order.total || 0}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {order.status === "vendor_accepted" ? (
                    <button
                      onClick={() => void handleAction(order, "start")}
                      disabled={busyId === order._id}
                      className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      Start Production
                    </button>
                  ) : null}

                  {order.status === "in_production" ? (
                    <button
                      onClick={() => void handleAction(order, "qc")}
                      disabled={busyId === order._id}
                      className="rounded-2xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                      style={{ backgroundColor: COLORS.warning }}
                    >
                      Mark QC Pending
                    </button>
                  ) : null}

                  {order.status === "qc_pending" ? (
                    <button
                      onClick={() => void handleAction(order, "ready")}
                      disabled={busyId === order._id}
                      className="flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
                      style={{ backgroundColor: COLORS.success }}
                    >
                      <Truck size={16} />
                      Ready for Pickup
                    </button>
                  ) : null}

                  {order.status === "ready_for_pickup" ? (
                    <div className="rounded-2xl border px-4 py-2.5 text-sm font-semibold" style={{ backgroundColor: COLORS.successBg, borderColor: COLORS.successBorder, color: COLORS.success }}>
                      Awaiting delivery or pickup
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          {!filteredOrders.length ? (
            <div className="rounded-[24px] border border-gray-100 bg-white p-8 text-sm text-gray-500">
              No production jobs found.
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
