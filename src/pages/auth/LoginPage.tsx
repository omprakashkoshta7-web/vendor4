import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Lock, Mail, Shield } from "lucide-react";
import { COLORS } from "../../utils/colors";
import { setVendorSession } from "../../services/session";
import { loginWithFirebase } from "../../services/firebase-auth";
import { OWNER_PERMISSIONS, getVendorProfile } from "../../services/vendor.service";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("vendor@speedcopy.com");
  const [password, setPassword] = useState("vendor123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const authResponse = await loginWithFirebase(email, password);
      const { user, token } = authResponse;

      if (user.role !== "vendor") {
        throw new Error("Vendor account required");
      }

      const profileResponse = await getVendorProfile().catch(() => null);
      const profile = profileResponse?.data;

      setVendorSession({
        userId: user._id,
        email: user.email,
        role: "Owner",
        vendorOrgId: profile?._id || profile?.userId || user._id,
        storeScope: [],
        permissions: [...OWNER_PERMISSIONS],
        token,
      });

      navigate("/orders", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: COLORS.background }}
    >
      <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style={{ backgroundColor: COLORS.primary }}
          >
            <Shield size={24} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Vendor Portal</h1>
        <p className="mt-2 text-sm text-gray-500">
            Firebase-secured vendor sign in
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleLogin}>
          {error && (
            <div
              className="flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm"
              style={{
                backgroundColor: COLORS.errorBg,
                borderColor: COLORS.errorBorder,
                color: COLORS.error,
              }}
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Email
            </span>
            <div className="relative">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-gray-900 focus:bg-white"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="vendor@speedcopy.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
              Password
            </span>
            <div className="relative">
              <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-gray-900 focus:bg-white"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl py-3 text-sm font-bold text-white transition disabled:opacity-60"
            style={{ backgroundColor: COLORS.primary }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-gray-400">
          Uses Firebase email/password and `/api/auth/verify` for vendor access
        </p>
      </div>
    </div>
  );
}
