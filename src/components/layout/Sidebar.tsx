import { NavLink, Link } from "react-router-dom";
import {
  Activity,
  Building2,
  KeyRound,
  LayoutDashboard,
  MessagesSquare,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useTenants } from "@/contexts/TenantContext";

const navItems = [
  { to: "/dashboard", labelKey: "nav.overview", icon: LayoutDashboard, end: true },
  { to: "/analytics", labelKey: "nav.analytics", icon: Sparkles, end: false },
  { to: "/users", labelKey: "nav.users", icon: Users, end: false },
  { to: "/conversations", labelKey: "nav.conversations", icon: MessagesSquare, end: false },
  { to: "/activity", labelKey: "nav.activity", icon: Activity, end: false },
  { to: "/tenants", labelKey: "nav.tenants", icon: Building2, end: false },
  { to: "/api-keys", labelKey: "nav.apiKeys", icon: KeyRound, end: false },
  { to: "/settings", labelKey: "nav.settings", icon: Settings, end: false },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { activeTenant } = useTenants();
  const { t } = useTranslation("layout");

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-30 bg-ink-950/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-ink-100 bg-white transition-transform lg:static lg:translate-x-0 dark:border-ink-800/70 dark:bg-ink-900",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 border-b border-ink-100 px-5 py-5 dark:border-ink-800/70"
          onClick={onClose}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-sm">
            <span className="text-base font-bold text-white">O</span>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-ink-900 dark:text-ink-50">
              OrionAI
            </div>
            <div className="text-[11px] uppercase tracking-wider text-ink-400">
              {t("sidebar.console")}
            </div>
          </div>
        </Link>

        {activeTenant && (
          <div className="border-b border-ink-100 px-5 py-4 dark:border-ink-800/70">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
              {t("sidebar.activeTenant")}
            </p>
            <p className="mt-1 truncate text-sm font-medium text-ink-800 dark:text-ink-100">
              {activeTenant.name || activeTenant.company_name || activeTenant.slug}
            </p>
            <p className="truncate font-mono text-[10px] text-ink-400">
              {activeTenant.tenant_id}
            </p>
          </div>
        )}

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {navItems.map(({ to, labelKey, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-100 dark:bg-brand-900/30 dark:text-brand-200 dark:ring-brand-800/60"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-ink-800 dark:hover:text-ink-50",
                )
              }
            >
              <Icon className="h-4 w-4 flex-none" />
              <span className="truncate">{t(labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-100 p-3 dark:border-ink-800/70">
          <div className="rounded-xl bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-transparent p-4">
            <p className="text-xs font-medium text-ink-700 dark:text-ink-200">
              {t("sidebar.helpTitle")}
            </p>
            <p className="mt-1 text-[11px] text-ink-500 dark:text-ink-400">
              {t("sidebar.helpBody")}
            </p>
            <a
              href="/api/docs"
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center text-xs font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              {t("sidebar.helpLink")}
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
