import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Coins,
  Download,
  FileText,
  GaugeCircle,
  MessageSquare,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
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
import { useTenants } from "@/contexts/TenantContext";
import { dashboardApi } from "@/lib/api";
import {
  formatCompact,
  formatDateTime,
  formatMs,
  formatNumber,
  formatShortDate,
} from "@/lib/format";
import { downloadAsFile } from "@/lib/utils";
import { syncStatusLabel, syncStatusTone } from "@/lib/sync";

const RANGE_OPTIONS = [7, 14, 30, 90] as const;

export function AnalyticsPage() {
  const { t } = useTranslation(["analytics", "common"]);
  const { activeTenant } = useTenants();
  const tenantId = activeTenant?.tenant_id;
  const [days, setDays] = useState<(typeof RANGE_OPTIONS)[number]>(30);

  const aggregates = useQuery({
    queryKey: ["aggregates", tenantId, days],
    queryFn: () => dashboardApi.dailyAggregates(tenantId!, days),
    enabled: !!tenantId,
  });

  const sync = useQuery({
    queryKey: ["sync-health", tenantId],
    queryFn: () => dashboardApi.syncHealth(tenantId!),
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
        ...row,
        date: row.metric_date,
        label: formatShortDate(row.metric_date),
      }));
  }, [aggregates.data]);

  const totals = useMemo(() => {
    return (aggregates.data ?? []).reduce(
      (acc, row) => {
        acc.messages += row.total_messages ?? 0;
        acc.tokens += row.total_tokens ?? 0;
        acc.docs += row.uploaded_documents ?? 0;
        acc.activeUsers = Math.max(acc.activeUsers, row.active_users ?? 0);
        if (row.avg_response_time_ms) {
          acc.respCount += 1;
          acc.respSum += row.avg_response_time_ms;
        }
        return acc;
      },
      { messages: 0, tokens: 0, docs: 0, activeUsers: 0, respSum: 0, respCount: 0 },
    );
  }, [aggregates.data]);

  function handleExport() {
    const rows = aggregates.data ?? [];
    if (!rows.length) return;
    const header = Object.keys(rows[0]).join(",");
    const body = rows
      .map((r) =>
        Object.values(r)
          .map((v) => (v === null || v === undefined ? "" : String(v)))
          .join(","),
      )
      .join("\n");
    downloadAsFile(
      `analytics-${tenantId}-${days}d-${new Date().toISOString().slice(0, 10)}.csv`,
      `${header}\n${body}`,
      "text/csv",
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        actions={
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-ink-200 bg-white p-1 dark:border-ink-700 dark:bg-ink-900">
              {RANGE_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                    days === d
                      ? "bg-brand-600 text-white shadow-sm"
                      : "text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              leftIcon={<Download className="h-4 w-4" />}
              onClick={handleExport}
              disabled={!aggregates.data?.length}
            >
              {t("common:actions.exportCsv")}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-5">
        <SummaryStat
          label={t("summary.messages")}
          value={formatCompact(totals.messages)}
          accent="brand"
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <SummaryStat
          label={t("summary.tokens")}
          value={formatCompact(totals.tokens)}
          accent="amber"
          icon={<Coins className="h-4 w-4" />}
        />
        <SummaryStat
          label={t("summary.documentsUploaded")}
          value={formatNumber(totals.docs)}
          accent="violet"
          icon={<FileText className="h-4 w-4" />}
        />
        <SummaryStat
          label={t("summary.peakActiveUsers")}
          value={formatNumber(totals.activeUsers)}
          accent="emerald"
          icon={<Users className="h-4 w-4" />}
        />
        <SummaryStat
          label={t("summary.avgResponseTime")}
          value={
            totals.respCount > 0
              ? formatMs(totals.respSum / totals.respCount)
              : "—"
          }
          accent="sky"
          icon={<GaugeCircle className="h-4 w-4" />}
        />
      </div>

      <Card>
        <CardHeader
          title={t("messagesChart.title")}
          description={t("messagesChart.description")}
          icon={<MessageSquare className="h-4 w-4" />}
        />
        <div className="px-2 pb-6 pt-4">
          {aggregates.isLoading ? (
            <Skeleton className="h-72 w-full" />
          ) : chartData.length === 0 ? (
            <EmptyState
              icon={<BarChart3 className="h-5 w-5" />}
              title={t("messagesChart.empty.title")}
              description={t("messagesChart.empty.description")}
            />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 12, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 6"
                  vertical={false}
                  stroke="currentColor"
                  className="text-ink-200 dark:text-ink-800"
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
                    boxShadow: "0 10px 30px -10px rgba(17,21,31,0.20)",
                  }}
                  formatter={(v: number, name) => [formatNumber(v), name as string]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                  iconType="circle"
                />
                <Bar
                  dataKey="user_messages"
                  stackId="msg"
                  fill="#3366ff"
                  radius={[6, 6, 0, 0]}
                  name={t("series.user")}
                />
                <Bar
                  dataKey="assistant_messages"
                  stackId="msg"
                  fill="#598dff"
                  radius={[6, 6, 0, 0]}
                  name={t("series.assistant")}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader
            title={t("tokensChart.title")}
            description={t("tokensChart.description")}
            icon={<Coins className="h-4 w-4" />}
          />
          <div className="px-2 pb-6 pt-4">
            {aggregates.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : chartData.length === 0 ? (
              <EmptyState
                icon={<Coins className="h-5 w-5" />}
                title={t("tokensChart.empty.title")}
                description={t("tokensChart.empty.description")}
              />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                    tickFormatter={(v) => formatCompact(v as number)}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.06)",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [formatNumber(v), t("series.tokens")]}
                  />
                  <Line
                    type="monotone"
                    dataKey="total_tokens"
                    stroke="#f59e0b"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4 }}
                    name={t("series.tokens")}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title={t("syncChart.title")}
            description={t("syncChart.description")}
            icon={<GaugeCircle className="h-4 w-4" />}
          />
          <div className="px-2 pb-6 pt-4">
            {aggregates.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : chartData.length === 0 ? (
              <EmptyState
                icon={<GaugeCircle className="h-5 w-5" />}
                title={t("syncChart.empty.title")}
                description={t("syncChart.empty.description")}
              />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "currentColor" }}
                    className="text-ink-500"
                    width={32}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.06)",
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
                  <Bar
                    dataKey="total_sync_runs"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    name={t("series.totalRuns")}
                  />
                  <Bar
                    dataKey="failed_sync_runs"
                    fill="#ef4444"
                    radius={[6, 6, 0, 0]}
                    name={t("series.failed")}
                  >
                    {chartData.map((_, i) => (
                      <Cell key={i} fill="#ef4444" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t("recentRuns.title")}
          description={t("recentRuns.description")}
          icon={<GaugeCircle className="h-4 w-4" />}
        />
        <div className="overflow-x-auto">
          {sync.isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (sync.data?.recent_runs ?? []).length === 0 ? (
            <EmptyState
              icon={<GaugeCircle className="h-5 w-5" />}
              title={t("recentRuns.empty.title")}
              description={t("recentRuns.empty.description")}
            />
          ) : (
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t("recentRuns.columns.syncRun")}</th>
                  <th>{t("recentRuns.columns.started")}</th>
                  <th>{t("recentRuns.columns.completed")}</th>
                  <th>{t("common:labels.status")}</th>
                  <th className="text-right">{t("recentRuns.columns.batches")}</th>
                  <th className="text-right">{t("recentRuns.columns.records")}</th>
                </tr>
              </thead>
              <tbody>
                {(sync.data?.recent_runs ?? []).map((run) => (
                  <tr key={run.sync_run_id}>
                    <td className="font-mono text-xs">
                      {run.sync_run_id.slice(0, 8)}…
                    </td>
                    <td>{formatDateTime(run.started_at)}</td>
                    <td>{formatDateTime(run.completed_at)}</td>
                    <td>
                      <Badge tone={syncStatusTone(run.status)} dot>
                        {syncStatusLabel(run.status)}
                      </Badge>
                    </td>
                    <td className="text-right tabular-nums">
                      {formatNumber(run.successful_batches)}/{formatNumber(run.total_batches)}
                    </td>
                    <td className="text-right tabular-nums">
                      {formatNumber(run.records_processed)}
                      {run.records_failed ? (
                        <span className="ml-1 text-xs text-rose-600">
                          (-{formatNumber(run.records_failed)})
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  icon,
  accent = "brand",
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  accent?: "brand" | "amber" | "emerald" | "violet" | "sky";
}) {
  const accentBg: Record<string, string> = {
    brand: "text-brand-600 dark:text-brand-300",
    amber: "text-amber-600 dark:text-amber-300",
    emerald: "text-emerald-600 dark:text-emerald-300",
    violet: "text-violet-600 dark:text-violet-300",
    sky: "text-sky-600 dark:text-sky-300",
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500 dark:text-ink-400">
          {label}
        </p>
        <span className={accentBg[accent]}>{icon}</span>
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-ink-900 dark:text-ink-50">
        {value}
      </p>
    </Card>
  );
}
