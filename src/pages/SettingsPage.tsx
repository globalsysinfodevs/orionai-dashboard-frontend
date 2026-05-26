import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  Cpu,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  TimerReset,
  XCircle,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { systemApi } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

export function SettingsPage() {
  const { t } = useTranslation(["settings", "common"]);
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const health = useQuery({
    queryKey: ["system-health"],
    queryFn: systemApi.health,
    refetchInterval: 30_000,
    retry: false,
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={t("profile.title")}
            description={t("profile.description")}
            icon={<ShieldCheck className="h-4 w-4" />}
          />
          <div className="flex items-center gap-4 p-6">
            <Avatar name={user?.full_name || user?.email} size="lg" />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink-900 dark:text-ink-50">
                {user?.full_name || "—"}
              </p>
              <p className="flex items-center gap-1.5 truncate text-sm text-ink-500">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone={user?.is_superuser ? "brand" : "neutral"} dot>
                  {user?.is_superuser ? t("profile.superuser") : t("profile.administrator")}
                </Badge>
                <Badge tone={user?.is_active ? "success" : "danger"} dot>
                  {user?.is_active ? t("common:status.active") : t("common:status.disabled")}
                </Badge>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-ink-100 px-6 py-5 dark:border-ink-800/70">
            <Field label={t("profile.memberSince")} value={user ? formatDateTime(user.created_at) : "—"} />
            <Field
              label={t("profile.lastSignIn")}
              value={user?.last_login_at ? formatDateTime(user.last_login_at) : "—"}
            />
          </div>
        </Card>

        <Card>
          <CardHeader
            title={t("appearance.title")}
            description={t("appearance.description")}
            icon={theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          />
          <div className="grid grid-cols-2 gap-3 p-6">
            <ThemeCard
              label={t("appearance.light")}
              active={theme === "light"}
              onClick={() => setTheme("light")}
              preview="light"
            />
            <ThemeCard
              label={t("appearance.dark")}
              active={theme === "dark"}
              onClick={() => setTheme("dark")}
              preview="dark"
            />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t("status.title")}
          description={t("status.description")}
          icon={<Cpu className="h-4 w-4" />}
          actions={
            health.data ? (
              <Badge
                tone={health.data.status === "healthy" ? "success" : "danger"}
                dot
              >
                {health.data.status === "healthy" ? t("status.operational") : t("status.issue")}
              </Badge>
            ) : null
          }
        />
        {health.isLoading ? (
          <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : health.isError ? (
          <div className="flex items-center gap-3 px-6 py-5 text-sm text-danger-600">
            <XCircle className="h-4 w-4" />
            {t("status.unreachable")}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
            <HealthTile
              label={t("common:labels.status")}
              value={health.data?.status}
              icon={
                health.data?.status === "healthy" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-500" />
                )
              }
            />
            <HealthTile label={t("status.version")} value={health.data?.version} />
            <HealthTile label={t("status.environment")} value={health.data?.environment} />
            <HealthTile
              label={t("status.uptime")}
              value={
                health.data ? formatUptime(health.data.uptime_seconds) : "—"
              }
              icon={<TimerReset className="h-4 w-4 text-brand-500" />}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-ink-800 dark:text-ink-100">{value}</p>
    </div>
  );
}

function ThemeCard({
  label,
  active,
  onClick,
  preview,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  preview: "light" | "dark";
}) {
  const { t } = useTranslation("common");
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-xl border-2 p-3 text-left transition ${
        active
          ? "border-brand-500 ring-4 ring-brand-500/15"
          : "border-ink-200 hover:border-ink-300 dark:border-ink-700 dark:hover:border-ink-600"
      }`}
    >
      <div
        className={`mb-3 h-24 rounded-lg shadow-inner ${
          preview === "light"
            ? "bg-gradient-to-br from-white via-ink-50 to-brand-50"
            : "bg-gradient-to-br from-ink-900 via-ink-950 to-brand-950"
        }`}
      >
        <div className="flex items-center gap-1 px-3 pt-2">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink-900 dark:text-ink-50">{label}</span>
        {active && (
          <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-medium text-white">
            {t("status.active")}
          </span>
        )}
      </div>
    </button>
  );
}

function HealthTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-ink-50/50 px-4 py-3 dark:border-ink-800 dark:bg-ink-900/40">
      <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-semibold capitalize text-ink-900 dark:text-ink-50">
        {value ?? "—"}
      </p>
    </div>
  );
}

function formatUptime(seconds: number): string {
  if (!seconds || seconds < 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.round(seconds)}s`;
}
