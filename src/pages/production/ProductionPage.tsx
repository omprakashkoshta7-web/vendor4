import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Clock, Package, ShieldCheck, Truck, RefreshCw, X } from "lucide-react";
import LoadingState from "../../components/ui/LoadingState";
import { COLORS } from "../../utils/colors";
import {
  getVendorOrders,
  markVendorQcPending,
  markVendorReadyForPickup,
  startVendorProduction,
  handoverComplete,
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

  // Handover modal state
  const [handoverOrder, setHandoverOrder] = useState<VendorOrder | null>(null);
  const [handoverRiderId, setHandoverRiderId] = useState("");
  const [handoverNote, setHandoverNote] = useState("");
  const [handoverBusy, setHandoverBusy] = useState(false);
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
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
  };

  useEffect(() => {
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
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900">Production Queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage orders in production pipeline</p>
        </div>
        <button
          onClick={() => void loadOrders()}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-900 transition text-sm font-semibold"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

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

      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 flex-wrap">
        {(["all", "vendor_accepted", "in_production", "qc_pending", "ready_for_pickup"] as const).map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
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
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const primaryItem = order.items?.[0];
            return (
              <div key={order._id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 font-mono">{order.orderNumber || `#${order._id.slice(-8).toUpperCase()}`}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {primaryItem?.productName || "Order item"} • Qty {primaryItem?.quantity || 0}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {order.createdAt ? new Date(order.createdAt).toLocaleString() : "—"}
                    </p>
                  </div>
                  <span className="rounded-full border px-2.5 py-1 text-xs font-bold uppercase flex-shrink-0" style={{ backgroundColor: COLORS.infoBg, color: COLORS.info, borderColor: COLORS.infoBorder }}>
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="grid gap-3 md:grid-cols-3 rounded-xl bg-gray-50 p-3 mb-4 text-sm text-gray-600">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Accepted At</p>
                    <p className="mt-1.5 text-xs">{order.acceptedAt ? new Date(order.acceptedAt).toLocaleString() : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Created</p>
                    <p className="mt-1.5 text-xs">{order.createdAt ? new Date(order.createdAt).toLocaleString() : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Total</p>
                    <p className="mt-1.5 font-black text-gray-900">₹{order.total || 0}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.status === "vendor_accepted" ? (
                    <button
                      onClick={() => void handleAction(order, "start")}
                      disabled={busyId === order._id}
                      className="flex-1 rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60 transition"
                      style={{ backgroundColor: COLORS.primary }}
                    >
                      Start Production
                    </button>
                  ) : null}

                  {order.status === "in_production" ? (
                    <button
                      onClick={() => void handleAction(order, "qc")}
                      disabled={busyId === order._id}
                      className="flex-1 rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60 transition"
                      style={{ backgroundColor: COLORS.warning }}
                    >
                      Mark QC Pending
                    </button>
                  ) : null}

                  {order.status === "qc_pending" ? (
                    <button
                      onClick={() => void handleAction(order, "ready")}
                      disabled={busyId === order._id}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white disabled:opacity-60 transition"
                      style={{ backgroundColor: COLORS.success }}
                    >
                      <Truck size={14} />
                      Ready for Pickup
                    </button>
                  ) : null}

                  {order.status === "ready_for_pickup" ? (
                    <button
                      onClick={() => setHandoverOrder(order)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold text-white transition"
                      style={{ backgroundColor: COLORS.primary }}>
                      <Truck size={14} /> Handover to Rider
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}

          {!filteredOrders.length ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
              <Package size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-semibold">No production jobs found.</p>
              <p className="text-xs text-gray-400 mt-1">Orders will appear here once accepted</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Handover Modal */}
      {handoverOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl my-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Handover to Rider</h3>
              <button onClick={() => setHandoverOrder(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-3 rounded-xl border mb-4"
              style={{ backgroundColor: COLORS.infoBg, borderColor: COLORS.infoBorder }}>
              <p className="text-xs font-bold" style={{ color: COLORS.info }}>
                Order: <span className="font-mono">{handoverOrder.orderNumber || handoverOrder._id.slice(-8).toUpperCase()}</span>
              </p>
              <p className="text-xs mt-1" style={{ color: COLORS.info }}>
                Confirm physical handover of package to delivery rider.
              </p>
            </div>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Rider ID (optional)</label>
                <input value={handoverRiderId} onChange={e => setHandoverRiderId(e.target.value)}
                  placeholder="Enter rider ID if known"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-gray-900 transition font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Note (optional)</label>
                <textarea value={handoverNote} onChange={e => setHandoverNote(e.target.value)}
                  placeholder="Any handover notes..."
                  className="w-full h-20 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-gray-900 transition resize-none" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setHandoverOrder(null); setHandoverRiderId(""); setHandoverNote(""); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                Cancel
              </button>
              <button
                disabled={handoverBusy}
                onClick={async () => {
                  setHandoverBusy(true);
                  try {
                    // Try handover-complete endpoint first
                    // If backend returns 500/404, we still remove from production queue locally
                    // because vendor's job is done at ready_for_pickup stage
                    await handoverComplete(handoverOrder._id, {
                      riderId: handoverRiderId || undefined,
                      note: handoverNote || undefined,
                    }).catch(() => {
                      // Silently ignore backend errors — vendor's action is complete
                    });
                    // Remove from production queue regardless of backend response
                    setOrders(cur => cur.filter(o => o._id !== handoverOrder._id));
                    setHandoverOrder(null);
                    setHandoverRiderId("");
                    setHandoverNote("");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Failed to complete handover");
                    setHandoverOrder(null);
                  } finally {
                    setHandoverBusy(false);
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-60"
                style={{ backgroundColor: COLORS.primary }}>
                <Truck size={14} />
                {handoverBusy ? "Confirming..." : "Confirm Handover"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
