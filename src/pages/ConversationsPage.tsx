import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  Bot,
  Coins,
  MessagesSquare,
  RefreshCw,
  Search,
  User as UserIcon,
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
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format";

const PAGE_SIZE = 20;
const ROLE_OPTIONS = ["all", "user", "assistant"] as const;

export function ConversationsPage() {
  const { t } = useTranslation(["conversations", "common"]);
  const { activeTenant } = useTenants();
  const tenantId = activeTenant?.tenant_id;

  const [page, setPage] = useState(1);
  const [role, setRole] = useState<(typeof ROLE_OPTIONS)[number]>("all");
  const [searchInput, setSearchInput] = useState("");
  const [userSearch, setUserSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setUserSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [role, userSearch, tenantId]);

  const query = useQuery({
    queryKey: ["dashboard-conversations", tenantId, page, role, userSearch],
    queryFn: () =>
      dashboardApi.conversations({
        tenant_id: tenantId!,
        page,
        page_size: PAGE_SIZE,
        role: role === "all" ? undefined : role,
        user_search: userSearch || undefined,
      }),
    enabled: !!tenantId,
    placeholderData: keepPreviousData,
  });

  const rows = query.data?.items ?? [];
  const isInitialLoading = query.isLoading && !query.data;

  const headerSummary = useMemo(() => {
    const total = query.data?.pagination.total;
    return total === undefined ? "—" : t("summary", { count: total });
  }, [query.data, t]);

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
            onClick={() => query.refetch()}
            loading={query.isFetching}
          >
            {t("common:actions.refresh")}
          </Button>
        }
      />

      <Card className="p-0">
        <CardHeader
          title={t("list.title")}
          description={headerSummary}
          icon={<MessagesSquare className="h-4 w-4" />}
          actions={
            <div className="flex items-center gap-2">
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t("searchPlaceholder")}
                leftIcon={<Search className="h-4 w-4" />}
                className="!h-9 !w-56 !py-1.5 text-xs"
              />
              <div className="inline-flex rounded-lg border border-ink-200 bg-white p-1 dark:border-ink-700 dark:bg-ink-900">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                      role === r
                        ? "bg-brand-600 text-white shadow-sm"
                        : "text-ink-600 hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
                    }`}
                  >
                    {t(`roleFilter.${r}`)}
                  </button>
                ))}
              </div>
            </div>
          }
        />

        {isInitialLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare className="h-5 w-5" />}
            title={
              userSearch || role !== "all"
                ? t("empty.filtered.title")
                : t("empty.none.title")
            }
            description={
              userSearch || role !== "all"
                ? t("empty.filtered.description")
                : t("empty.none.description")
            }
          />
        ) : (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800/70">
            {rows.map((m) => {
              const isAssistant = (m.role || "").toLowerCase() === "assistant";
              return (
                <li key={m.message_id} className="px-6 py-4">
                  <div className="flex gap-3">
                    {isAssistant ? (
                      <div className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-2 ring-white dark:bg-brand-900/40 dark:text-brand-300 dark:ring-ink-900">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                    ) : (
                      <Avatar
                        name={m.user_name || m.user_email || "?"}
                        size="sm"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-ink-900 dark:text-ink-50">
                          {isAssistant
                            ? t("assistant")
                            : m.user_name ||
                              m.user_email ||
                              t("anonymousUser")}
                        </span>
                        <Badge tone={isAssistant ? "brand" : "info"} dot>
                          {isAssistant ? (
                            <Bot className="h-3 w-3" />
                          ) : (
                            <UserIcon className="h-3 w-3" />
                          )}
                          {t(`role.${isAssistant ? "assistant" : "user"}`)}
                        </Badge>
                        {m.source_chatbot_id && (
                          <span
                            className="font-mono text-[11px] text-ink-400"
                            title={m.source_chatbot_id}
                          >
                            {t("chatbot")}: {m.source_chatbot_id.slice(0, 8)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-ink-600 dark:text-ink-300">
                        {m.content_preview || (
                          <span className="italic text-ink-400">
                            {t("noContent")}
                          </span>
                        )}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                        <span title={formatDateTime(m.message_timestamp)}>
                          {formatRelative(m.message_timestamp)}
                        </span>
                        {m.token_count != null && (
                          <span className="inline-flex items-center gap-1">
                            <Coins className="h-3 w-3" />
                            {t("tokens", { count: m.token_count, value: formatNumber(m.token_count) })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <Pagination
          meta={query.data?.pagination}
          onPageChange={setPage}
          disabled={query.isFetching}
        />
      </Card>
    </div>
  );
}
