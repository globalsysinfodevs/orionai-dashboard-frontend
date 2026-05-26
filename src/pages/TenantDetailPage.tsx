import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  Copy,
  KeyRound,
  Mail,
  PencilLine,
  Plus,
  Power,
  PowerOff,
  Slash,
  Trash2,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Tabs } from "@/components/ui/Tabs";
import { TenantFormModal } from "@/components/tenants/TenantFormModal";
import { CreateApiKeyModal } from "@/components/tenants/CreateApiKeyModal";
import { useAuth } from "@/contexts/AuthContext";
import { useTenants } from "@/contexts/TenantContext";
import {
  activeTenantFlag,
  dashboardApi,
  getTenantDisplayName,
  readApiError,
  tenantsApi,
} from "@/lib/api";
import { formatDate, formatDateTime, formatNumber, formatRelative } from "@/lib/format";
import { copyToClipboard } from "@/lib/utils";

export function TenantDetailPage() {
  const { t } = useTranslation(["tenantDetail", "common"]);
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setActiveTenantId } = useTenants();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [createKeyOpen, setCreateKeyOpen] = useState(false);

  useEffect(() => {
    if (tenantId) setActiveTenantId(tenantId);
  }, [tenantId, setActiveTenantId]);

  const tenantsQuery = useQuery({ queryKey: ["tenants"], queryFn: tenantsApi.list });
  const tenant = useMemo(
    () => tenantsQuery.data?.find((t) => t.tenant_id === tenantId) ?? null,
    [tenantsQuery.data, tenantId],
  );

  const overview = useQuery({
    queryKey: ["overview", tenantId],
    queryFn: () => dashboardApi.overview(tenantId!),
    enabled: !!tenantId,
  });

  const keys = useQuery({
    queryKey: ["api-keys", tenantId],
    queryFn: () => tenantsApi.listApiKeys(tenantId!),
    enabled: !!tenantId,
  });

  const updateMutation = useMutation({
    mutationFn: (patch: Parameters<typeof tenantsApi.update>[1]) =>
      tenantsApi.update(tenantId!, patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      toast.success(t("toast.tenantUpdated"));
    },
    onError: (err) => toast.error(readApiError(err)),
  });

  const revokeKey = useMutation({
    mutationFn: (keyId: number) => tenantsApi.revokeApiKey(tenantId!, keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", tenantId] });
      toast.success(t("toast.keyRevoked"));
    },
    onError: (err) => toast.error(readApiError(err)),
  });

  if (tenantsQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <Card>
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title={t("notFound.title")}
          description={t("notFound.description")}
          action={
            <Link to="/tenants">
              <Button leftIcon={<ArrowLeft className="h-4 w-4" />}>{t("notFound.back")}</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const active = activeTenantFlag(tenant);
  const apiKeys = keys.data ?? [];

  function toggleActive() {
    updateMutation.mutate({
      is_active: !active,
      status: !active ? "active" : "disabled",
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <button
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 transition hover:text-ink-800 dark:hover:text-ink-100"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> {t("common:actions.back")}
        </button>
        <PageHeader
          eyebrow={t("eyebrow")}
          title={
            <span className="flex items-center gap-3">
              {getTenantDisplayName(tenant)}
              <Badge tone={active ? "success" : "neutral"} dot>
                {active ? t("common:status.active") : t("common:status.disabled")}
              </Badge>
            </span>
          }
          description={tenant.description || t("noDescription")}
          actions={
            <>
              <Button
                variant="outline"
                leftIcon={<PencilLine className="h-4 w-4" />}
                onClick={() => setEditOpen(true)}
              >
                {t("common:actions.edit")}
              </Button>
              <Button
                variant={active ? "outline" : "primary"}
                leftIcon={
                  active ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />
                }
                onClick={toggleActive}
                loading={updateMutation.isPending}
              >
                {active ? t("disable") : t("enable")}
              </Button>
            </>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoTile icon={<Mail className="h-4 w-4" />} label={t("tile.contact")}>
          {tenant.contact_email || "—"}
        </InfoTile>
        <InfoTile icon={<CalendarClock className="h-4 w-4" />} label={t("common:labels.created")}>
          {formatDate(tenant.created_at)}
        </InfoTile>
        <InfoTile icon={<Users className="h-4 w-4" />} label={t("tile.totalUsers")}>
          {overview.isLoading ? "…" : formatNumber(overview.data?.total_users)}
        </InfoTile>
        <InfoTile icon={<CheckCircle2 className="h-4 w-4" />} label={t("tile.syncHealth")}>
          <span className="capitalize">
            {overview.isLoading ? "…" : overview.data?.sync_health || "—"}
          </span>
        </InfoTile>
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: t("tabs.overview") },
          {
            id: "keys",
            label: t("tabs.apiKeys"),
            badge: <Badge tone="neutral">{apiKeys.length}</Badge>,
          },
        ]}
      />

      {tab === "overview" && (
        <Card>
          <CardHeader
            title={t("identity.title")}
            description={t("identity.description")}
            icon={<Building2 className="h-4 w-4" />}
          />
          <div className="divide-y divide-ink-100 dark:divide-ink-800/70">
            <IdentityRow label={t("identity.tenantId")} value={tenant.tenant_id} mono copyable />
            <IdentityRow label={t("common:labels.slug")} value={tenant.slug} mono copyable />
            <IdentityRow label={t("common:labels.status")} value={tenant.status ?? (active ? "active" : "disabled")} />
            <IdentityRow label={t("identity.lastUpdated")} value={formatDateTime(tenant.updated_at)} />
            <IdentityRow
              label={t("identity.lastSync")}
              value={
                overview.data?.last_sync_at
                  ? `${formatDateTime(overview.data.last_sync_at)} (${formatRelative(overview.data.last_sync_at)})`
                  : "—"
              }
            />
          </div>
        </Card>
      )}

      {tab === "keys" && (
        <Card>
          <CardHeader
            title={t("keys.title")}
            description={t("keys.description")}
            icon={<KeyRound className="h-4 w-4" />}
            actions={
              <Button
                size="sm"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setCreateKeyOpen(true)}
                disabled={!user?.is_superuser}
                title={
                  user?.is_superuser ? undefined : t("keys.onlySuperusersCreate")
                }
              >
                {t("keys.generate")}
              </Button>
            }
          />
          {keys.isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <EmptyState
              icon={<KeyRound className="h-5 w-5" />}
              title={t("keys.emptyTitle")}
              description={t("keys.emptyDescription")}
              action={
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setCreateKeyOpen(true)}
                  disabled={!user?.is_superuser}
                >
                  {t("keys.generate")}
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>{t("common:labels.label")}</th>
                    <th>{t("common:labels.prefix")}</th>
                    <th>{t("common:labels.status")}</th>
                    <th>{t("common:labels.lastUsed")}</th>
                    <th>{t("common:labels.expires")}</th>
                    <th>{t("common:labels.created")}</th>
                    <th className="text-right">{t("common:labels.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {apiKeys.map((k) => (
                    <tr key={k.id}>
                      <td className="font-medium">{k.label}</td>
                      <td className="font-mono text-xs">{k.key_prefix}</td>
                      <td>
                        <Badge tone={k.is_active ? "success" : "neutral"} dot>
                          {k.is_active ? t("common:status.active") : t("common:status.revoked")}
                        </Badge>
                      </td>
                      <td>{k.last_used_at ? formatRelative(k.last_used_at) : t("common:status.never")}</td>
                      <td>{k.expires_at ? formatDate(k.expires_at) : t("common:status.never")}</td>
                      <td>{formatDate(k.created_at)}</td>
                      <td className="text-right">
                        {k.is_active ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                            onClick={() => {
                              if (
                                window.confirm(t("keys.revokeConfirm", { label: k.label }))
                              ) {
                                revokeKey.mutate(k.id);
                              }
                            }}
                            disabled={!user?.is_superuser}
                          >
                            {t("common:actions.revoke")}
                          </Button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-ink-400">
                            <Slash className="h-3 w-3" />
                            {t("common:status.revoked")}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <TenantFormModal open={editOpen} onClose={() => setEditOpen(false)} tenant={tenant} />
      <CreateApiKeyModal
        open={createKeyOpen}
        onClose={() => setCreateKeyOpen(false)}
        tenantId={tenant.tenant_id}
      />
    </div>
  );
}

function InfoTile({
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
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
        {children}
      </div>
    </Card>
  );
}

function IdentityRow({
  label,
  value,
  mono,
  copyable,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  const { t } = useTranslation(["tenantDetail", "common"]);
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <span className="text-xs font-medium uppercase tracking-wider text-ink-500">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`truncate text-sm text-ink-900 dark:text-ink-100 ${
            mono ? "font-mono text-xs" : ""
          }`}
        >
          {value || "—"}
        </span>
        {copyable && value && (
          <button
            type="button"
            onClick={async () => {
              if (await copyToClipboard(value)) toast.success(t("common:toast.copied"));
            }}
            className="rounded-md p-1.5 text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-100"
            title={t("common:actions.copy")}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
