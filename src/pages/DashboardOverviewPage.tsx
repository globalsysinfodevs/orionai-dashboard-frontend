import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatCard } from "@/components/ui/StatCard";
import { useTenants } from "@/contexts/TenantContext";
import { dashboardApi } from "@/lib/api";
import {
  formatCompact,
  formatDateTime,
  formatNumber,
  formatRelative,
  formatShortDate,
} from "@/lib/format";
import { syncStatusTone, syncStatusLabel } from "@/lib/sync";

export function DashboardOverviewPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  const { activeTenant, tenants, isLoading: tenantsLoading } = useTenants();
  const tenantId = activeTenant?.tenant_id;

  const overview = useQuery({
    queryKey: ["overview", tenantId],
    queryFn: () => dashboardApi.overview(tenantId!),
    enabled: !!tenantId,
  });

  const aggregates = useQuery({
    queryKey: ["aggregates", tenantId, 14],
    queryFn: () => dashboardApi.dailyAggregates(tenantId!, 14),
    enabled: !!tenantId,
  });

  const sync = useQuery({
    queryKey: ["sync-health", tenantId],
    queryFn: () => dashboardApi.syncHealth(tenantId!),
    enabled: !!tenantId,
  });

  const activity = useQuery({
    queryKey: ["activity", tenantId, 8],
    queryFn: () => dashboardApi.recentActivity(tenantId!, 8),
    enabled: !!tenantId,
  });

  const chartData = useMemo(() => {
    const items = aggregates.data ?? [];
    return items
      .slice()
      .sort(
        (a, b) =>
          new Date(a.metric_date).getTime() - new Date(b.metric_date).getTime(),
      )
      .map((row) => ({
        date: row.metric_date,
        label: formatShortDate(row.metric_date),
        messages: row.total_messages ?? 0,
        tokens: row.total_tokens ?? 0,
        activeUsers: row.active_users ?? 0,
      }));
  }, [aggregates.data]);

  const syncRunsTotal = sync.data?.total_runs ?? 0;
  const syncSuccessRate =
    syncRunsTotal === 0
      ? null
      : Math.round(((sync.data?.successful_runs ?? 0) / syncRunsTotal) * 1000) / 10;

  function refreshAll() {
    overview.refetch();
    aggregates.refetch();
    sync.refetch();
    activity.refetch();
  }

  if (!tenantsLoading && tenants.length === 0) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow={t("eyebrow")}
          title={t("welcome.title")}
          description={t("welcome.description")}
        />
        <Card className="p-0">
          <EmptyState
            icon={<Users className="h-5 w-5" />}
            title={t("noTenants.title")}
            description={t("noTenants.description")}
            action={
              <Link to="/tenants">
                <Button variant="primary">{t("noTenants.createTenant")}</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={
          activeTenant
            ? t("console", {
                name:
                  activeTenant.name ||
                  activeTenant.company_name ||
                  activeTenant.slug,
              })
            : t("tenantOverview")
        }
        description={t("snapshotDescription")}
        actions={
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={refreshAll}
            loading={
              overview.isFetching ||
              aggregates.isFetching ||
              sync.isFetching ||
              activity.isFetching
            }
          >
            {t("common:actions.refresh")}
          </Button>
        }
      />

      {/* KPI grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("kpi.activeUsers.label")}
          value={formatNumber(overview.data?.active_users)}
          helper={t("kpi.activeUsers.helper", {
            count: overview.data?.total_users ?? 0,
            total: formatNumber(overview.data?.total_users),
          })}
          loading={overview.isLoading}
          icon={<Users className="h-5 w-5" />}
          accent="brand"
        />
        <StatCard
          label={t("kpi.messages.label")}
          value={formatCompact(overview.data?.total_messages)}
          helper={t("kpi.messages.helper")}
          loading={overview.isLoading}
          icon={<MessageSquare className="h-5 w-5" />}
          accent="sky"
        />
        <StatCard
          label={t("kpi.documents.label")}
          value={formatNumber(overview.data?.total_documents)}
          helper={t("kpi.documents.helper", {
            count: overview.data?.total_chatbots ?? 0,
            total: formatNumber(overview.data?.total_chatbots),
          })}
          loading={overview.isLoading}
          icon={<FileText className="h-5 w-5" />}
          accent="violet"
        />
        <StatCard
          label={t("kpi.tokens.label")}
          value={formatCompact(overview.data?.total_tokens)}
          helper={t("kpi.tokens.helper")}
          loading={overview.isLoading}
          icon={<Coins className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      {/* Chart + sync */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title={t("activityTrend.title")}
            description={t("activityTrend.description")}
            icon={<TrendingUp className="h-4 w-4" />}
            actions={
              <Link to="/analytics">
                <Button size="sm" variant="ghost">
                  {t("activityTrend.explore")}
                </Button>
              </Link>
            }
          />
          <div className="px-2 pb-4 pt-4">
            {aggregates.isLoading ? (
              <Skeleton className="h-72 w-full" />
            ) : chartData.length === 0 ? (
              <EmptyState
                icon={<TrendingUp className="h-5 w-5" />}
                title={t("activityTrend.empty.title")}
                description={t("activityTrend.empty.description")}
              />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 12, right: 24, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gMsg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3366ff" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#3366ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 6"
                    stroke="currentColor"
                    className="text-ink-200 dark:text-ink-800"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-ink-500"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-ink-500"
                    width={40}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.06)",
                      fontSize: 12,
                      boxShadow:
                        "0 8px 24px -8px rgba(17,21,31,0.16), 0 4px 8px -4px rgba(17,21,31,0.10)",
                    }}
                    formatter={(v: number, n) => [formatNumber(v), n as string]}
                  />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    stroke="#3366ff"
                    strokeWidth={2}
                    fill="url(#gMsg)"
                    name={t("series.messages")}
                  />
                  <Area
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#gUsers)"
                    name={t("series.activeUsers")}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title={t("syncHealth.title")}
            description={t("syncHealth.description")}
            icon={<Wifi className="h-4 w-4" />}
            actions={
              <Badge tone={overview.data?.sync_health === "healthy" ? "success" : "warning"} dot>
                {overview.data?.sync_health
                  ? t(`common:status.${overview.data.sync_health}`, {
                      defaultValue: overview.data.sync_health,
                    })
                  : "—"}
              </Badge>
            }
          />
          <div className="space-y-5 p-6">
            <div className="grid grid-cols-2 gap-4">
              <Metric label={t("syncHealth.totalRuns")} value={formatNumber(sync.data?.total_runs)} />
              <Metric
                label={t("syncHealth.successRate")}
                value={syncSuccessRate === null ? "—" : `${syncSuccessRate}%`}
                trend={
                  syncSuccessRate === null
                    ? null
                    : syncSuccessRate >= 95
                      ? "positive"
                      : "negative"
                }
              />
              <Metric
                label={t("syncHealth.successful")}
                value={formatNumber(sync.data?.successful_runs)}
                trend="positive"
              />
              <Metric
                label={t("syncHealth.failed")}
                value={formatNumber(sync.data?.failed_runs)}
                trend={(sync.data?.failed_runs ?? 0) > 0 ? "negative" : undefined}
              />
            </div>
            <div className="rounded-xl border border-ink-100 bg-ink-50/50 px-4 py-3 dark:border-ink-800 dark:bg-ink-900/40">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                {t("syncHealth.lastSync")}
              </p>
              <p className="mt-1 text-sm font-medium text-ink-900 dark:text-ink-50">
                {formatDateTime(sync.data?.last_sync_at ?? overview.data?.last_sync_at)}
              </p>
              <p className="text-xs text-ink-500 dark:text-ink-400">
                {formatRelative(sync.data?.last_sync_at ?? overview.data?.last_sync_at)}
                {sync.data?.last_sync_status && (
                  <>
                    {" · "}
                    <span className="font-medium">
                      {syncStatusLabel(sync.data.last_sync_status)}
                    </span>
                  </>
                )}
              </p>
            </div>
            <Link to="/analytics" className="block">
              <Button variant="subtle" size="sm" className="w-full">
                {t("syncHealth.viewPipeline")}
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardHeader
          title={t("recentActivity.title")}
          description={t("recentActivity.description")}
          icon={<Activity className="h-4 w-4" />}
          actions={
            <Link to="/activity">
              <Button size="sm" variant="ghost">
                {t("common:actions.viewAll")}
              </Button>
            </Link>
          }
        />
        <div className="divide-y divide-ink-100 dark:divide-ink-800/70">
          {activity.isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (activity.data?.items ?? []).length === 0 ? (
            <EmptyState
              icon={<Activity className="h-5 w-5" />}
              title={t("recentActivity.empty.title")}
              description={t("recentActivity.empty.description")}
            />
          ) : (
            (activity.data?.items ?? []).map((item, i) => (
              <div
                key={`${item.event_type}-${item.received_at}-${i}`}
                className="flex items-center justify-between gap-4 px-6 py-3.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <EventIcon type={item.event_type} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">
                      {prettyEventType(item.event_type)}
                    </div>
                    <div className="truncate text-xs text-ink-500 dark:text-ink-400">
                      {formatDateTime(item.received_at)}
                      {item.details && (item.details as { batch_id?: string }).batch_id && (
                        <>
                          {" · "}
                          <span className="font-mono">
                            {t("recentActivity.batch")}{" "}
                            {String((item.details as { batch_id?: string }).batch_id).slice(0, 8)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <Badge tone={eventTone(item.event_type)} dot>
                  {item.event_type.replace(/_/g, " ")}
                </Badge>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function Metric({
  label,
  value,
  trend,
}: {
  label: string;
  value: React.ReactNode;
  trend?: "positive" | "negative" | null;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wider text-ink-500">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold tracking-tight ${
          trend === "positive"
            ? "text-emerald-600 dark:text-emerald-300"
            : trend === "negative"
              ? "text-rose-600 dark:text-rose-300"
              : "text-ink-900 dark:text-ink-50"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EventIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  const className =
    "flex h-9 w-9 flex-none items-center justify-center rounded-xl ring-1 ring-inset";
  if (t.includes("sync_completed") || t.includes("success"))
    return (
      <div
        className={`${className} bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/60`}
      >
        <CheckCircle2 className="h-4 w-4" />
      </div>
    );
  if (t.includes("fail") || t.includes("error"))
    return (
      <div
        className={`${className} bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800/60`}
      >
        <AlertTriangle className="h-4 w-4" />
      </div>
    );
  if (t.includes("heartbeat") || t.includes("ping"))
    return (
      <div
        className={`${className} bg-sky-50 text-sky-600 ring-sky-100 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800/60`}
      >
        <Wifi className="h-4 w-4" />
      </div>
    );
  if (t.includes("offline"))
    return (
      <div
        className={`${className} bg-ink-100 text-ink-500 ring-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-700`}
      >
        <WifiOff className="h-4 w-4" />
      </div>
    );
  if (t.includes("message") || t.includes("chat"))
    return (
      <div
        className={`${className} bg-brand-50 text-brand-600 ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-800/60`}
      >
        <MessageSquare className="h-4 w-4" />
      </div>
    );
  if (t.includes("doc"))
    return (
      <div
        className={`${className} bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-800/60`}
      >
        <FileText className="h-4 w-4" />
      </div>
    );
  if (t.includes("bot"))
    return (
      <div
        className={`${className} bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/60`}
      >
        <Bot className="h-4 w-4" />
      </div>
    );
  return (
    <div
      className={`${className} bg-ink-100 text-ink-500 ring-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-700`}
    >
      <Clock className="h-4 w-4" />
    </div>
  );
}

function prettyEventType(t: string): string {
  return t
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function eventTone(t: string) {
  const lower = t.toLowerCase();
  if (lower.includes("fail") || lower.includes("error")) return "danger" as const;
  if (lower.includes("success") || lower.includes("complete")) return "success" as const;
  if (lower.includes("heartbeat")) return "info" as const;
  return "neutral" as const;
}
