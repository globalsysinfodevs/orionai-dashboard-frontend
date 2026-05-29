import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronRight,
  FileText,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldOff,
  Users as UsersIcon,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTenants } from "@/contexts/TenantContext";
import { dashboardApi } from "@/lib/api";
import { formatNumber, formatRelative, formatDateTime } from "@/lib/format";

const PAGE_SIZE = 20;
const STATUS_OPTIONS = ["all", "active", "inactive"] as const;
// "all" => no window filter; numeric values map to the `last_active_days` query param.
const DAYS_OPTIONS = ["all", "7", "14", "30", "90"] as const;

export function UsersPage() {
  const { t } = useTranslation(["users", "common"]);
  const navigate = useNavigate();
  const { activeTenant } = useTenants();
  const tenantId = activeTenant?.tenant_id;

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [days, setDays] = useState<(typeof DAYS_OPTIONS)[number]>("all");

  // Resolve the active-window filter to the numeric `last_active_days` param.
  const lastActiveDays = days === "all" ? undefined : Number(days);

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Any filter change resets to the first page.
  useEffect(() => {
    setPage(1);
  }, [search, status, days, tenantId]);

  const usersQuery = useQuery({
    queryKey: ["dashboard-users", tenantId, page, search, status, days],
    queryFn: () =>
      dashboardApi.users({
        tenant_id: tenantId!,
        page,
        page_size: PAGE_SIZE,
        search: search || undefined,
        status: status === "all" ? undefined : status,
        last_active_days: lastActiveDays,
      }),
    enabled: !!tenantId,
    placeholderData: keepPreviousData,
  });

  const rows = usersQuery.data?.items ?? [];
  const isInitialLoading = usersQuery.isLoading && !usersQuery.data;

  const headerSummary = useMemo(() => {
    const total = usersQuery.data?.pagination.total;
    const summary = total === undefined ? "—" : t("summary", { count: total });
    if (lastActiveDays === undefined) return summary;
    return `${summary} · ${t("activeWindowHint", { count: lastActiveDays })}`;
  }, [usersQuery.data, t, lastActiveDays]);

  const hasActiveFilters = !!search || status !== "all" || days !== "all";

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
            onClick={() => usersQuery.refetch()}
            loading={usersQuery.isFetching}
          >
            {t("common:actions.refresh")}
          </Button>
        }
      />

      <Card className="p-0">
        <CardHeader
          title={t("table.title")}
          description={headerSummary}
          icon={<UsersIcon className="h-4 w-4" />}
          actions={
            <div className="flex items-center gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("searchPlaceholder")}
                leftIcon={<Search className="h-4 w-4" />}
                className="!h-9 !w-56 !py-1.5 text-xs"
              />
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as (typeof STATUS_OPTIONS)[number])
                }
                className="h-9 rounded-lg border border-ink-200 bg-white px-2.5 text-xs text-ink-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-200"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {t(`statusFilter.${s}`)}
                  </option>
                ))}
              </select>
              <div
                className="inline-flex rounded-lg border border-ink-200 bg-white p-1 dark:border-ink-700 dark:bg-ink-900"
                role="group"
                aria-label={t("daysFilter.label")}
              >
                {DAYS_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDays(d)}
                    aria-pressed={days === d}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      days === d
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                    }`}
                  >
                    {t(`daysFilter.${d}`)}
                  </button>
                ))}
              </div>
            </div>
          }
        />

        {isInitialLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<UsersIcon className="h-5 w-5" />}
            title={
              hasActiveFilters
                ? t("empty.filtered.title")
                : t("empty.none.title")
            }
            description={
              hasActiveFilters
                ? t("empty.filtered.description")
                : t("empty.none.description")
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{t("table.user")}</th>
                  <th>{t("common:labels.status")}</th>
                  <th className="text-right">{t("table.questions")}</th>
                  <th className="text-right">{t("table.documents")}</th>
                  <th>{t("table.lastActive")}</th>
                  <th className="w-8" aria-label={t("viewProfile")} />
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr
                    key={u.user_id}
                    onClick={() => navigate(`/users/${u.user_id}`)}
                    className="cursor-pointer transition hover:bg-ink-50/70 dark:hover:bg-ink-800/40"
                    title={t("viewProfile")}
                  >
                    <td>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={u.name || u.email || "?"} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">
                            {u.name || u.email || t("table.unknownUser")}
                          </div>
                          {u.email && u.name && (
                            <div className="truncate text-xs text-ink-500 dark:text-ink-400">
                              {u.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <StatusBadge
                        status={u.status}
                        isVerified={u.is_verified}
                        notVerifiedLabel={t("notVerified")}
                      />
                    </td>
                    <td className="text-right tabular-nums">
                      <span className="inline-flex items-center justify-end gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5 text-ink-400" />
                        {formatNumber(u.questions_asked)}
                      </span>
                    </td>
                    <td className="text-right tabular-nums">
                      <span className="inline-flex items-center justify-end gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-ink-400" />
                        {formatNumber(u.documents_uploaded)}
                      </span>
                    </td>
                    <td>
                      <span
                        className="text-sm text-ink-600 dark:text-ink-300"
                        title={formatDateTime(u.last_active_at)}
                      >
                        {formatRelative(u.last_active_at)}
                      </span>
                    </td>
                    <td className="text-right">
                      <ChevronRight className="h-4 w-4 text-ink-300 dark:text-ink-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          meta={usersQuery.data?.pagination}
          onPageChange={setPage}
          disabled={usersQuery.isFetching}
        />
      </Card>
    </div>
  );
}

function StatusBadge({
  status,
  isVerified,
  notVerifiedLabel,
}: {
  status: string | null;
  isVerified: boolean | null;
  notVerifiedLabel: string;
}) {
  if (isVerified === false) {
    return (
      <Badge tone="warning" dot>
        <ShieldOff className="h-3 w-3" />
        {notVerifiedLabel}
      </Badge>
    );
  }
  const s = (status || "").toLowerCase();
  const tone =
    s === "active" ? "success" : s === "inactive" || s === "deleted" ? "neutral" : "neutral";
  return (
    <Badge tone={tone} dot>
      {s === "active" && <CheckCircle2 className="h-3 w-3" />}
      {status || "—"}
    </Badge>
  );
}
