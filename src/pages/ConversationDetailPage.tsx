import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bot,
  CalendarClock,
  Coins,
  MessageSquare,
  MessagesSquare,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTenants } from "@/contexts/TenantContext";
import { dashboardApi } from "@/lib/api";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format";

const PAGE_SIZE = 50;

export function ConversationDetailPage() {
  const { t } = useTranslation(["conversations", "common"]);
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const navigate = useNavigate();
  const { activeTenant } = useTenants();
  const tenantId = activeTenant?.tenant_id;

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [chatbotId, tenantId]);

  const query = useQuery({
    queryKey: ["conversation-messages", tenantId, chatbotId, page],
    queryFn: () =>
      dashboardApi.conversationMessages({
        chatbot_id: chatbotId!,
        tenant_id: tenantId!,
        page,
        page_size: PAGE_SIZE,
      }),
    enabled: !!tenantId && !!chatbotId,
    placeholderData: keepPreviousData,
  });

  const detail = query.data?.conversation;
  const messages = query.data?.messages ?? [];

  if (query.isError) {
    return (
      <div className="space-y-6">
        <BackLink onClick={() => navigate(-1)} label={t("detail.back")} />
        <Card>
          <EmptyState
            icon={<MessagesSquare className="h-5 w-5" />}
            title={t("detail.notFound.title")}
            description={t("detail.notFound.description")}
            action={
              <Button
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => navigate(-1)}
              >
                {t("detail.back")}
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink onClick={() => navigate(-1)} label={t("detail.back")} />

      <PageHeader
        eyebrow={t("detail.eyebrow")}
        title={
          query.isLoading ? (
            <Skeleton className="h-7 w-64" />
          ) : (
            detail?.chatbot_name || t("detail.untitled")
          )
        }
        description={detail?.user_name || detail?.user_email || undefined}
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

      {/* Conversation metadata */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetaTile icon={<MessageSquare className="h-4 w-4" />} label={t("detail.header.messages")}>
          {query.isLoading ? "…" : formatNumber(detail?.total_messages)}
        </MetaTile>
        <MetaTile icon={<Coins className="h-4 w-4" />} label={t("detail.header.tokens")}>
          {query.isLoading ? "…" : formatNumber(detail?.total_tokens)}
        </MetaTile>
        <MetaTile icon={<UserRound className="h-4 w-4" />} label={t("detail.header.user")}>
          {detail?.user_name || detail?.user_email || "—"}
        </MetaTile>
        <MetaTile icon={<CalendarClock className="h-4 w-4" />} label={t("detail.header.lastActivity")}>
          {detail?.last_message_at ? formatRelative(detail.last_message_at) : "—"}
        </MetaTile>
      </div>

      {/* Messages thread */}
      <Card className="p-0">
        <CardHeader
          title={t("detail.eyebrow")}
          icon={<MessagesSquare className="h-4 w-4" />}
        />

        {query.isLoading && !query.data ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare className="h-5 w-5" />}
            title={t("detail.empty.title")}
            description={t("detail.empty.description")}
          />
        ) : (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800/70">
            {messages.map((m) => {
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
                        name={detail?.user_name || detail?.user_email || "?"}
                        size="sm"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-ink-900 dark:text-ink-50">
                          {isAssistant
                            ? t("assistant")
                            : detail?.user_name ||
                              detail?.user_email ||
                              t("anonymousUser")}
                        </span>
                        <Badge tone={isAssistant ? "brand" : "info"} dot>
                          {t(`role.${isAssistant ? "assistant" : "user"}`)}
                        </Badge>
                      </div>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-200">
                        {m.content || (
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
                            {t("tokens", {
                              count: m.token_count,
                              value: formatNumber(m.token_count),
                            })}
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

function BackLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition hover:text-ink-800 dark:hover:text-ink-100"
    >
      <ArrowLeft className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

function MetaTile({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-ink-500 dark:text-ink-400">
        <span className="text-ink-400">{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
        {children}
      </div>
    </Card>
  );
}
