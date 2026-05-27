import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Coins,
  FileText,
  MessageSquare,
  MessagesSquare,
  RefreshCw,
  ShieldOff,
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
import { StatCard } from "@/components/ui/StatCard";
import { useTenants } from "@/contexts/TenantContext";
import { dashboardApi } from "@/lib/api";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format";

const PAGE_SIZE = 20;

export function UserDetailPage() {
  const { t } = useTranslation(["users", "common"]);
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { activeTenant } = useTenants();
  const tenantId = activeTenant?.tenant_id;

  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [userId, tenantId]);

  const statsQuery = useQuery({
    queryKey: ["user-stats", tenantId, userId],
    queryFn: () => dashboardApi.userStats(userId!, tenantId!),
    enabled: !!tenantId && !!userId,
  });

  const conversationsQuery = useQuery({
    queryKey: ["user-conversations", tenantId, userId, page],
    queryFn: () =>
      dashboardApi.userConversations({
        user_id: userId!,
        tenant_id: tenantId!,
        page,
        page_size: PAGE_SIZE,
      }),
    enabled: !!tenantId && !!userId,
    placeholderData: keepPreviousData,
  });

  const stats = statsQuery.data;
  const rows = conversationsQuery.data?.items ?? [];

  const headerSummary = useMemo(() => {
    const total = conversationsQuery.data?.pagination.total;
    return total === undefined
      ? "—"
      : t("detail.conversations.summary", { count: total });
  }, [conversationsQuery.data, t]);

  // 404 — user does not exist for this tenant.
  if (statsQuery.isError) {
    return (
      <div className="space-y-6">
        <BackLink onClick={() => navigate(-1)} label={t("detail.back")} />
        <Card>
          <EmptyState
            icon={<UserRound className="h-5 w-5" />}
            title={t("detail.notFound.title")}
            description={t("detail.notFound.description")}
            action={
              <Button
                leftIcon={<ArrowLeft className="h-4 w-4" />}
                onClick={() => navigate("/users")}
              >
                {t("detail.back")}
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const displayName =
    stats?.name || stats?.email || t("table.unknownUser");

  return (
    <div className="space-y-6">
      <BackLink onClick={() => navigate(-1)} label={t("detail.back")} />

      <PageHeader
        eyebrow={t("detail.eyebrow")}
        title={
          statsQuery.isLoading ? (
            <Skeleton className="h-7 w-56" />
          ) : (
            <span className="flex items-center gap-3">
              <Avatar name={stats?.name || stats?.email || "?"} size="lg" />
              <span className="flex flex-col">
                <span>{displayName}</span>
                {stats?.email && stats?.name && (
                  <span className="text-sm font-normal text-ink-500 dark:text-ink-400">
                    {stats.email}
                  </span>
                )}
              </span>
            </span>
          )
        }
        actions={
          <div className="flex items-center gap-2">
            {!statsQuery.isLoading && stats && (
              <StatusBadge
                status={stats.status}
                isVerified={stats.is_verified}
                verifiedLabel={t("detail.verified")}
                notVerifiedLabel={t("notVerified")}
              />
            )}
            <Button
              variant="outline"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => {
                statsQuery.refetch();
                conversationsQuery.refetch();
              }}
              loading={statsQuery.isFetching || conversationsQuery.isFetching}
            >
              {t("common:actions.refresh")}
            </Button>
          </div>
        }
      />

      {/* KPI stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("detail.stats.questions")}
          value={formatNumber(stats?.total_questions_asked)}
          icon={<MessageSquare className="h-5 w-5" />}
          loading={statsQuery.isLoading}
          accent="brand"
        />
        <StatCard
          label={t("detail.stats.documents")}
          value={formatNumber(stats?.total_documents_uploaded)}
          icon={<FileText className="h-5 w-5" />}
          loading={statsQuery.isLoading}
          accent="sky"
        />
        <StatCard
          label={t("detail.stats.conversations")}
          value={formatNumber(stats?.total_conversations)}
          icon={<MessagesSquare className="h-5 w-5" />}
          loading={statsQuery.isLoading}
          accent="violet"
        />
        <StatCard
          label={t("detail.stats.tokens")}
          value={formatNumber(stats?.total_tokens_used)}
          icon={<Coins className="h-5 w-5" />}
          loading={statsQuery.isLoading}
          accent="amber"
        />
      </div>

      {/* Profile metadata */}
      <Card>
        <CardHeader
          title={t("detail.profile.title")}
          description={t("detail.profile.description")}
          icon={<UserRound className="h-4 w-4" />}
        />
        {statsQuery.isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-ink-100 dark:divide-ink-800/70">
            <InfoRow label={t("detail.profile.email")} value={stats?.email || "—"} />
            <InfoRow
              label={t("detail.profile.sourceUserId")}
              value={stats?.source_user_id || "—"}
              mono
            />
            <InfoRow label={t("detail.profile.status")} value={stats?.status || "—"} />
            <InfoRow
              label={t("detail.profile.lastActive")}
              value={
                stats?.last_active_at
                  ? `${formatDateTime(stats.last_active_at)} (${formatRelative(stats.last_active_at)})`
                  : "—"
              }
            />
            <InfoRow
              label={t("detail.profile.firstSeen")}
              value={formatDateTime(stats?.created_at)}
            />
            <InfoRow
              label={t("detail.profile.sourceCreated")}
              value={formatDateTime(stats?.source_created_at)}
            />
            <InfoRow
              label={t("detail.profile.sourceUpdated")}
              value={formatDateTime(stats?.source_updated_at)}
            />
          </div>
        )}
      </Card>

      {/* Conversations list */}
      <Card className="p-0">
        <CardHeader
          title={t("detail.conversations.title")}
          description={headerSummary}
          icon={<MessagesSquare className="h-4 w-4" />}
        />

        {conversationsQuery.isLoading && !conversationsQuery.data ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<MessagesSquare className="h-5 w-5" />}
            title={t("detail.conversations.empty.title")}
            description={t("detail.conversations.empty.description")}
          />
        ) : (
          <ul className="divide-y divide-ink-100 dark:divide-ink-800/70">
            {rows.map((c) => (
              <li key={c.chatbot_id}>
                <button
                  type="button"
                  onClick={() => navigate(`/conversations/${c.chatbot_id}`)}
                  className="flex w-full items-start gap-3 px-6 py-4 text-left transition hover:bg-ink-50/70 dark:hover:bg-ink-800/40"
                  title={t("detail.conversations.open")}
                >
                  <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink-900 dark:text-ink-50">
                      {c.chatbot_name || t("detail.conversations.untitled")}
                    </div>
                    {c.context_preview && (
                      <p className="mt-0.5 line-clamp-2 text-sm text-ink-500 dark:text-ink-400">
                        {c.context_preview}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {t("detail.conversations.messages")}:{" "}
                        {formatNumber(c.total_messages)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {t("detail.conversations.tokens")}:{" "}
                        {formatNumber(c.total_tokens)}
                      </span>
                      {c.last_message_at && (
                        <span title={formatDateTime(c.last_message_at)}>
                          {t("detail.conversations.lastMessage")}:{" "}
                          {formatRelative(c.last_message_at)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        <Pagination
          meta={conversationsQuery.data?.pagination}
          onPageChange={setPage}
          disabled={conversationsQuery.isFetching}
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

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <span className="text-xs font-medium uppercase tracking-wider text-ink-500">
        {label}
      </span>
      <span
        className={`truncate text-sm text-ink-900 dark:text-ink-100 ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function StatusBadge({
  status,
  isVerified,
  verifiedLabel,
  notVerifiedLabel,
}: {
  status: string | null;
  isVerified: boolean | null;
  verifiedLabel: string;
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
  const tone = s === "active" ? "success" : "neutral";
  return (
    <Badge tone={tone} dot>
      {isVerified ? <CheckCircle2 className="h-3 w-3" /> : null}
      {status || verifiedLabel}
    </Badge>
  );
}
