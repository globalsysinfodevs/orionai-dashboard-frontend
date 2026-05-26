import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  Activity as ActivityIcon,
  AlertTriangle,
  CheckCircle2,
  FileText,
  MessageSquare,
  RefreshCw,
  Search,
  Wifi,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTenants } from "@/contexts/TenantContext";
import { dashboardApi } from "@/lib/api";
import { formatDateTime, formatRelative } from "@/lib/format";
import type { ActivityItem } from "@/types";

const LIMIT_OPTIONS = [25, 50, 100, 200];

export function ActivityPage() {
  const { t } = useTranslation(["activity", "common"]);
  const { activeTenant } = useTenants();
  const tenantId = activeTenant?.tenant_id;
  const [limit, setLimit] = useState(50);
  const [filter, setFilter] = useState("");

  const activity = useQuery({
    queryKey: ["activity", tenantId, limit],
    queryFn: () => dashboardApi.recentActivity(tenantId!, limit),
    enabled: !!tenantId,
  });

  const items: ActivityItem[] = useMemo(() => {
    const raw = activity.data?.items ?? [];
    if (!filter.trim()) return raw;
    const q = filter.toLowerCase();
    return raw.filter((it) => {
      const s = `${it.event_type} ${JSON.stringify(it.details ?? {})}`.toLowerCase();
      return s.includes(q);
    });
  }, [activity.data, filter]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        actions={
          <Button
            variant="outline"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={() => activity.refetch()}
            loading={activity.isFetching}
          >
            {t("common:actions.refresh")}
          </Button>
        }
      />

      <Card>
        <CardHeader
          title={t("recentEvents.title")}
          description={
            activity.data
              ? t("eventsShown", { count: activity.data.total })
              : "—"
          }
          icon={<ActivityIcon className="h-4 w-4" />}
          actions={
            <div className="flex items-center gap-2">
              <Input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t("filterPlaceholder")}
                leftIcon={<Search className="h-4 w-4" />}
                className="!h-9 !w-56 !py-1.5 text-xs"
              />
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                className="h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-xs text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
              >
                {LIMIT_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {t("limitOption", { count: n })}
                  </option>
                ))}
              </select>
            </div>
          }
        />

        {activity.isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<ActivityIcon className="h-5 w-5" />}
            title={filter ? t("empty.filtered.title") : t("empty.none.title")}
            description={
              filter
                ? t("empty.filtered.description")
                : t("empty.none.description")
            }
          />
        ) : (
          <ol className="relative px-6 py-6">
            <span
              aria-hidden="true"
              className="absolute left-[34px] top-6 bottom-6 w-px bg-ink-100 dark:bg-ink-800"
            />
            {items.map((item, i) => (
              <li key={`${item.event_type}-${item.received_at}-${i}`} className="relative pb-6 last:pb-0">
                <div className="flex gap-4">
                  <span className="relative z-10">
                    <EventIcon type={item.event_type} />
                  </span>
                  <div className="flex-1 rounded-xl border border-ink-100 bg-white px-4 py-3 dark:border-ink-800/70 dark:bg-ink-900/40">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink-900 dark:text-ink-50">
                          {prettyType(item.event_type)}
                        </span>
                        <Badge tone={eventTone(item.event_type)} dot>
                          {item.event_type}
                        </Badge>
                      </div>
                      <span className="text-xs text-ink-500" title={formatDateTime(item.received_at)}>
                        {formatRelative(item.received_at)}
                      </span>
                    </div>
                    {item.details && Object.keys(item.details).length > 0 && (
                      <pre className="mt-2 max-w-full overflow-x-auto rounded-md bg-ink-50/70 px-3 py-2 font-mono text-[11px] leading-relaxed text-ink-700 dark:bg-ink-950/60 dark:text-ink-200">
                        {JSON.stringify(item.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}

function EventIcon({ type }: { type: string }) {
  const t = type.toLowerCase();
  const cls =
    "flex h-9 w-9 flex-none items-center justify-center rounded-xl ring-1 ring-inset";
  if (t.includes("success") || t.includes("complete"))
    return (
      <div
        className={`${cls} bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/60`}
      >
        <CheckCircle2 className="h-4 w-4" />
      </div>
    );
  if (t.includes("fail") || t.includes("error"))
    return (
      <div
        className={`${cls} bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-900/30 dark:text-rose-300 dark:ring-rose-800/60`}
      >
        <AlertTriangle className="h-4 w-4" />
      </div>
    );
  if (t.includes("heartbeat"))
    return (
      <div
        className={`${cls} bg-sky-50 text-sky-600 ring-sky-100 dark:bg-sky-900/30 dark:text-sky-300 dark:ring-sky-800/60`}
      >
        <Wifi className="h-4 w-4" />
      </div>
    );
  if (t.includes("message"))
    return (
      <div
        className={`${cls} bg-brand-50 text-brand-600 ring-brand-100 dark:bg-brand-900/30 dark:text-brand-300 dark:ring-brand-800/60`}
      >
        <MessageSquare className="h-4 w-4" />
      </div>
    );
  if (t.includes("doc"))
    return (
      <div
        className={`${cls} bg-violet-50 text-violet-600 ring-violet-100 dark:bg-violet-900/30 dark:text-violet-300 dark:ring-violet-800/60`}
      >
        <FileText className="h-4 w-4" />
      </div>
    );
  return (
    <div
      className={`${cls} bg-ink-100 text-ink-500 ring-ink-200 dark:bg-ink-800 dark:text-ink-300 dark:ring-ink-700`}
    >
      <ActivityIcon className="h-4 w-4" />
    </div>
  );
}

function prettyType(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function eventTone(t: string) {
  const lower = t.toLowerCase();
  if (lower.includes("fail") || lower.includes("error")) return "danger" as const;
  if (lower.includes("success") || lower.includes("complete")) return "success" as const;
  if (lower.includes("heartbeat")) return "info" as const;
  return "neutral" as const;
}
