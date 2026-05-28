import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ChevronRight,
  Coins,
  FileText,
  Gauge,
  MessageSquare,
  RefreshCw,
  Users,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
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
  formatPercent,
  formatRelative,
} from "@/lib/format";

const ACTIVE_WINDOW_DAYS = 5;

export function DashboardOverviewPage() {
  const { t } = useTranslation(["dashboard", "common"]);
  const { activeTenant, tenants, isLoading: tenantsLoading } = useTenants();
  const tenantId = activeTenant?.tenant_id;

  const overview = useQuery({
    queryKey: ["overview", tenantId],
    queryFn: () => dashboardApi.overview(tenantId!),
    enabled: !!tenantId,
  });

  const recentUsers = useQuery({
    queryKey: ["recent-active-users", tenantId],
    queryFn: () =>
      dashboardApi.users({ tenant_id: tenantId!, page: 1, page_size: 100 }),
    enabled: !!tenantId,
  });

  // Token quota usage for the homepage KPI.
  const kpi = useQuery({
    queryKey: ["kpi", tenantId],
    queryFn: () => dashboardApi.kpi(tenantId!),
    enabled: !!tenantId,
  });

  const tokenUsage = kpi.data?.kpi_summary.token_usage;

  // Users who actually used the assistants within the last 5 days, most recent first.
  const activeUsers = useMemo(() => {
    const cutoff = Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    return (recentUsers.data?.items ?? [])
      .filter(
        (u) =>
          u.questions_asked > 0 &&
          u.last_active_at != null &&
          new Date(u.last_active_at).getTime() >= cutoff,
      )
      .sort(
        (a, b) =>
          new Date(b.last_active_at!).getTime() -
          new Date(a.last_active_at!).getTime(),
      );
  }, [recentUsers.data]);

  function refreshAll() {
    overview.refetch();
    recentUsers.refetch();
    kpi.refetch();
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
              overview.isFetching || recentUsers.isFetching || kpi.isFetching
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

      {/* Token quota usage */}
      <TokenUsageCard usage={tokenUsage} loading={kpi.isLoading} />

      {/* Users active in the last 5 days */}
      <Card>
        <CardHeader
          title={t("recentUsers.title")}
          description={t("recentUsers.description")}
          icon={<Users className="h-4 w-4" />}
          actions={
            <Link to="/users">
              <Button size="sm" variant="ghost">
                {t("common:actions.viewAll")}
              </Button>
            </Link>
          }
        />
        <div className="divide-y divide-ink-100 dark:divide-ink-800/70">
          {recentUsers.isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : activeUsers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-5 w-5" />}
              title={t("recentUsers.empty.title")}
              description={t("recentUsers.empty.description")}
            />
          ) : (
            activeUsers.map((u) => (
              <Link
                key={u.user_id}
                to={`/users/${u.user_id}`}
                className="flex items-center justify-between gap-4 px-6 py-3.5 transition hover:bg-ink-50/70 dark:hover:bg-ink-800/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={u.name || u.email || "?"} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">
                      {u.name || u.email || t("recentUsers.unknownUser")}
                    </div>
                    <div className="truncate text-xs text-ink-500 dark:text-ink-400">
                      {t("recentUsers.lastActive", {
                        when: formatRelative(u.last_active_at),
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <Badge tone="neutral" dot>
                    <MessageSquare className="h-3 w-3" />
                    {t("recentUsers.questions", { count: u.questions_asked })}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-ink-300 dark:text-ink-600" />
                </div>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function TokenUsageCard({
  usage,
  loading,
}: {
  usage?: import("@/types").TokenUsage;
  loading: boolean;
}) {
  const { t } = useTranslation(["dashboard", "common"]);

  const pct = usage?.usage_percentage ?? null;
  const clampedPct = pct === null ? 0 : Math.min(100, Math.max(0, pct));
  const barTone =
    clampedPct >= 90
      ? "bg-rose-500"
      : clampedPct >= 75
        ? "bg-amber-500"
        : "bg-brand-500";

  return (
    <Card>
      <CardHeader
        title={t("tokenUsage.title")}
        description={t("tokenUsage.description")}
        icon={<Gauge className="h-4 w-4" />}
        actions={
          usage?.subscription_status ? (
            <Badge
              tone={
                usage.subscription_status.toLowerCase() === "active"
                  ? "success"
                  : "neutral"
              }
              dot
            >
              {usage.subscription_status}
            </Badge>
          ) : null
        }
      />
      <div className="space-y-4 p-6">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : !usage || usage.allowed_tokens_per_month == null ? (
          <EmptyState
            icon={<Coins className="h-5 w-5" />}
            title={t("tokenUsage.empty.title")}
            description={t("tokenUsage.empty.description")}
          />
        ) : (
          <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">
                  {formatPercent(pct)}
                </p>
                <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                  {t("tokenUsage.consumedOfQuota", {
                    used: formatCompact(usage.tokens_used),
                    allowed: formatCompact(usage.allowed_tokens_per_month),
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-ink-900 dark:text-ink-50">
                  {formatNumber(usage.tokens_remaining)}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-ink-400">
                  {t("tokenUsage.remaining")}
                </p>
              </div>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100 dark:bg-ink-800">
              <div
                className={`h-full rounded-full transition-all ${barTone}`}
                style={{ width: `${clampedPct}%` }}
              />
            </div>
            {usage.last_token_reset_at && (
              <p className="text-xs text-ink-500 dark:text-ink-400">
                {t("tokenUsage.lastReset", {
                  when: formatDateTime(usage.last_token_reset_at),
                })}
              </p>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

