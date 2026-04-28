import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Bell,
  Building2,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  CreditCard,
  HeadphonesIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Printer,
  Search,
  Shield,
  Star,
  Store,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { clearAuthToken } from "../../services/api";
import { clearVendorSession, getVendorSession } from "../../services/session";
import { logoutFirebase, syncVendorAuthSession } from "../../services/firebase-auth";
import type { VendorSession } from "../../types/vendor";
import { notificationService, type PortalNotification } from "../../services/notification.service";

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", permissions: ["view_all"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/orders", icon: ClipboardList, label: "Job Queue", permissions: ["view_all", "view_assigned"] },
      { to: "/production", icon: Printer, label: "Production", permissions: ["view_all", "edit_production"] },
    ],
  },
  {
    label: "Network",
    items: [
      { to: "/stores", icon: Store, label: "Stores", permissions: ["view_all", "store_management"] },
      { to: "/staff", icon: Users, label: "Staff", permissions: ["user_management", "staff_management"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/earnings", icon: Wallet, label: "Earnings", permissions: ["financial_access"] },
      { to: "/closure", icon: CalendarCheck, label: "Closure", permissions: ["financial_access"] },
      { to: "/payouts", icon: CreditCard, label: "Payouts", permissions: ["financial_access"] },
    ],
  },
  {
    label: "Control",
    items: [
      { to: "/score", icon: Star, label: "Vendor Score", permissions: ["view_all"] },
      { to: "/org", icon: Building2, label: "Org Profile", permissions: ["org_settings", "view_all"] },
      { to: "/support", icon: HeadphonesIcon, label: "Support", permissions: ["view_all"] },
    ],
  },
];

const routeMeta = [
  { match: "/dashboard", title: "Dashboard", caption: "Vendor performance overview and key metrics." },
  { match: "/orders", title: "Job Queue", caption: "Live vendor queue backed by backend order data." },
  { match: "/production", title: "Production", caption: "Move accepted jobs through production states." },
  { match: "/stores", title: "Stores", caption: "Store availability and capacity synced with backend." },
  { match: "/staff", title: "Staff", caption: "Manage vendor team and activation status." },
  { match: "/earnings", title: "Earnings", caption: "Finance pages remain UI-only until finance APIs are wired." },
  { match: "/closure", title: "Closure", caption: "Closure view remains UI-only for now." },
  { match: "/payouts", title: "Payouts", caption: "Payout view remains UI-only for now." },
  { match: "/score", title: "Vendor Score", caption: "Score page remains UI-only for now." },
  { match: "/org", title: "Org Profile", caption: "Vendor organization profile now uses backend data." },
  { match: "/support", title: "Support", caption: "Support page remains UI-only for now." },
];

export default function VendorLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState<VendorSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const currentSession = getVendorSession();
    if (!currentSession) {
      navigate("/login", { replace: true });
      return;
    }

    // Use a microtask to avoid calling setState synchronously inside the effect body
    const timer = setTimeout(() => setSession(currentSession), 0);

    const unsubscribe = syncVendorAuthSession(() => {
      setSession(null);
      navigate("/login", { replace: true });
    });

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    let active = true;

    const loadNotifications = async () => {
      try {
        const [summary, recent] = await Promise.all([
          notificationService.getSummary(),
          notificationService.getRecent(),
        ]);

        if (!active) return;
        setUnreadCount(summary.data.unread_count || 0);
        setNotifications(recent.data.notifications || []);
      } catch {
        if (!active) return;
        setUnreadCount(0);
        setNotifications([]);
      }
    };

    void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(), 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  async function handleLogout() {
    await logoutFirebase().catch(() => {
      clearAuthToken();
      clearVendorSession();
    });
    navigate("/login", { replace: true });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/orders?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  const formatTimestamp = (value?: string) =>
    value
      ? new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
      : "";

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6fa]">
        <div className="text-center">
          <Shield size={40} className="mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-500">Loading vendor session...</p>
        </div>
      </div>
    );
  }

  const filteredNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.permissions.some((permission) => session.permissions.includes(permission))
      ),
    }))
    .filter((group) => group.items.length > 0);

  const page = routeMeta.find((item) => location.pathname.startsWith(item.match)) ?? routeMeta[0];

  return (
    <div className="admin-app-shell min-h-screen p-2 sm:p-3 md:p-4">
      <div className="admin-frame flex min-h-[calc(100vh-1rem)] overflow-hidden rounded-[24px] sm:min-h-[calc(100vh-1.5rem)] sm:rounded-[34px]">
        {/* Desktop Sidebar */}
        <aside className="admin-sidebar hidden w-[236px] flex-shrink-0 lg:flex lg:flex-col">
          <div className="px-5 pb-6 pt-8">
            <div className="flex items-center gap-2">
              <h1 className="text-[2.2rem] font-black lowercase leading-none tracking-tight text-white">
                SpeedCopy
              </h1>
            </div>
            <p className="mt-2 pl-1 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#a99f93]">
              Vendor portal
            </p>
          </div>

          <div className="mx-5 h-px bg-violet-200/30" />

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-5">
              {filteredNavGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map(({ to, icon: Icon, label }) => (
                      <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                            isActive ? "admin-nav-active" : "admin-nav-idle hover:bg-white/5 hover:text-white"
                          }`
                        }
                      >
                        <Icon size={15} />
                        <span>{label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="px-4 pb-5">
            <button 
              onClick={handleLogout} 
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/72 hover:bg-white/5 hover:text-white transition-all"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {showMobileSidebar && (
          <div 
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside className={`admin-sidebar-mobile fixed left-0 top-0 z-50 h-full w-[236px] flex-shrink-0 flex-col overflow-y-auto bg-gradient-to-b from-[#1e2535] to-[#171f2e] transition-transform duration-300 lg:hidden ${
          showMobileSidebar ? "translate-x-0" : "-translate-x-full"
        }`}>
          <div className="px-5 pb-6 pt-8">
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-[2.2rem] font-black lowercase leading-none tracking-tight text-white">
                SpeedCopy
              </h1>
              <button 
                onClick={() => setShowMobileSidebar(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
            <p className="mt-2 pl-1 text-[11px] font-semibold uppercase tracking-[0.34em] text-[#a99f93]">
              Vendor portal
            </p>
          </div>

          <div className="mx-5 h-px bg-violet-200/30" />

          <nav className="flex-1 overflow-y-auto px-4 py-6">
            <div className="space-y-5">
              {filteredNavGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-4 pb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/35">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map(({ to, icon: Icon, label }) => (
                      <NavLink
                        key={to}
                        to={to}
                        onClick={() => setShowMobileSidebar(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                            isActive ? "admin-nav-active" : "admin-nav-idle hover:bg-white/5 hover:text-white"
                          }`
                        }
                      >
                        <Icon size={15} />
                        <span>{label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className="px-4 pb-5">
            <button 
              onClick={() => {
                setShowMobileSidebar(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-white/72 hover:bg-white/5 hover:text-white transition-all"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </aside>

        <div className="admin-content-shell flex min-w-0 flex-1 flex-col overflow-hidden">
          <header className="admin-topbar flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition"
                title="Toggle menu"
              >
                <Menu size={20} className="text-slate-900" />
              </button>
              <h1 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">
                {page.title}
              </h1>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <form onSubmit={handleSearch} className="relative hidden sm:block">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  className="w-48 sm:w-64 rounded-full border border-gray-200 py-2 pl-10 pr-4 text-sm outline-none focus:border-gray-400" 
                  placeholder="Search orders..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              <div className="relative">
                <button 
                  className="relative flex h-9 w-9 items-center justify-center rounded-xl shadow-lg hover:shadow-xl transition-all overflow-hidden" 
                  style={{ 
                    background: 'radial-gradient(circle at top, rgba(255, 255, 255, 0.04), transparent 24%), linear-gradient(180deg, #1e2535 0%, #171f2e 100%)'
                  }}
                  title="Notifications"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell size={16} className="text-white" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-red-500 px-1 text-[10px] font-bold leading-[18px] text-white border border-white text-center">
                      {Math.min(unreadCount, 99)}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white shadow-xl border border-slate-200 z-50">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="p-1 hover:bg-slate-100 rounded-lg transition"
                      >
                        <X size={16} className="text-slate-500" />
                      </button>
                    </div>
                    {notifications.length ? (
                      <div className="max-h-96 overflow-y-auto p-2">
                        {notifications.map((notification) => (
                          <div key={notification._id} className="rounded-xl px-3 py-3 hover:bg-slate-50 transition">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-600">{notification.message}</p>
                                <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                  {notification.category} • {formatTimestamp(notification.createdAt)}
                                </p>
                              </div>
                              {!notification.isRead && <span className="mt-1 h-2.5 w-2.5 rounded-full bg-red-500" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="mx-auto w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center mb-3">
                          <Bell size={24} className="text-purple-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-700">No notifications yet</p>
                        <p className="text-xs text-gray-500 mt-1">Assigned jobs and status updates will appear here.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)} 
                  className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold text-white transition overflow-hidden"
                  style={{ background: 'radial-gradient(circle at top, rgba(255, 255, 255, 0.04), transparent 24%), linear-gradient(180deg, #1e2535 0%, #171f2e 100%)' }}
                >
                  <span>{session.role}</span>
                  <ChevronDown size={14} />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white shadow-xl border border-slate-200 z-50">
                    <div className="p-4 border-b border-slate-100">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-sm text-slate-900">{session.role}</p>
                          <p className="text-xs text-slate-500 mt-1">{session.email}</p>
                        </div>
                        <button 
                          onClick={() => setShowUserMenu(false)}
                          className="p-1 hover:bg-slate-100 rounded-lg transition"
                        >
                          <X size={16} className="text-slate-500" />
                        </button>
                      </div>
                    </div>
                    <div className="p-2">
                      <button 
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/org');
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                      >
                        <Building2 size={14} />
                        Organization Profile
                      </button>
                      <button 
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/score');
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                      >
                        <Star size={14} />
                        Vendor Score
                      </button>
                      <button 
                        onClick={() => {
                          setShowUserMenu(false);
                          navigate('/support');
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 rounded-lg transition"
                      >
                        <HeadphonesIcon size={14} />
                        Support
                      </button>
                    </div>
                    <div className="p-2 border-t border-slate-100">
                      <button 
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <LogOut size={14} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          <main className="admin-main flex-1 overflow-y-auto px-3 pb-4 pt-4 sm:px-4 sm:pb-5 sm:pt-5 md:px-6 md:pb-7 md:pt-6 lg:px-8">
            <div className="mx-auto w-full max-w-[980px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
