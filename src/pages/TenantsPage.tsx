import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Mail,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { TenantFormModal } from "@/components/tenants/TenantFormModal";
import { useAuth } from "@/contexts/AuthContext";
import { useTenants } from "@/contexts/TenantContext";
import { activeTenantFlag, dashboardApi, getTenantDisplayName, tenantsApi } from "@/lib/api";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";
import type { Tenant } from "@/types";

export function TenantsPage() {
  const { t } = useTranslation(["tenants", "common"]);
  const { user } = useAuth();
  const { setActiveTenantId } = useTenants();
  const navigate = useNavigate();

  const tenantsQuery = useQuery({
    queryKey: ["tenants"],
    queryFn: tenantsApi.list,
  });

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);

  const filtered = useMemo(() => {
    const list = tenantsQuery.data ?? [];
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((t) =>
      [t.name, t.company_name, t.slug, t.tenant_id, t.contact_email]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .some((v) => v.includes(q)),
    );
  }, [tenantsQuery.data, search]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
        actions={
          <>
            <Button
              variant="outline"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => tenantsQuery.refetch()}
              loading={tenantsQuery.isFetching}
            >
              {t("common:actions.refresh")}
            </Button>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
              disabled={!user?.is_superuser}
              title={user?.is_superuser ? undefined : t("onlySuperusersCreate")}
            >
              {t("newTenant")}
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader
          title={t("registeredTenants")}
          description={t("totalCount", { count: tenantsQuery.data?.length ?? 0 })}
          icon={<Building2 className="h-4 w-4" />}
          actions={
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              leftIcon={<Search className="h-4 w-4" />}
              className="!h-9 !w-64 !py-1.5 text-xs"
            />
          }
        />

        {tenantsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Building2 className="h-5 w-5" />}
            title={search ? t("empty.searchTitle") : t("empty.title")}
            description={
              search ? t("empty.searchDescription") : t("empty.description")
            }
            action={
              !search && (
                <Button
                  leftIcon={<Plus className="h-4 w-4" />}
                  onClick={() => setCreateOpen(true)}
                  disabled={!user?.is_superuser}
                >
                  {t("newTenant")}
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((tenant) => (
              <TenantCard
                key={tenant.tenant_id}
                tenant={tenant}
                onEdit={() => setEditing(tenant)}
                onOpen={() => {
                  setActiveTenantId(tenant.tenant_id);
                  navigate(`/tenants/${tenant.tenant_id}`);
                }}
              />
            ))}
          </div>
        )}
      </Card>

      <TenantFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <TenantFormModal
        open={!!editing}
        tenant={editing}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}

function TenantCard({
  tenant,
  onEdit,
  onOpen,
}: {
  tenant: Tenant;
  onEdit: () => void;
  onOpen: () => void;
}) {
  const { t } = useTranslation(["tenants", "common"]);
  const overview = useQuery({
    queryKey: ["overview", tenant.tenant_id],
    queryFn: () => dashboardApi.overview(tenant.tenant_id),
    staleTime: 60_000,
    retry: false,
  });

  const active = activeTenantFlag(tenant);

  return (
    <div className="group card flex flex-col gap-4 p-5 transition hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-sm">
            {(getTenantDisplayName(tenant)[0] || "?").toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-ink-900 dark:text-ink-50">
              {getTenantDisplayName(tenant)}
            </h3>
            <p className="truncate font-mono text-[11px] text-ink-400">
              {tenant.slug} · {tenant.tenant_id.slice(0, 8)}…
            </p>
          </div>
        </div>
        <Badge tone={active ? "success" : "neutral"} dot>
          {active ? t("common:status.active") : t("common:status.disabled")}
        </Badge>
      </div>

      <div className="flex items-center gap-2 text-xs text-ink-500 dark:text-ink-400">
        <Mail className="h-3.5 w-3.5" />
        <span className="truncate">{tenant.contact_email || t("noContactEmail")}</span>
      </div>

      <div className="grid grid-cols-3 gap-2 rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2.5 dark:border-ink-800 dark:bg-ink-900/40">
        <Metric
          label={t("metric.users")}
          value={overview.isLoading ? "—" : formatNumber(overview.data?.total_users)}
        />
        <Metric
          label={t("metric.messages")}
          value={overview.isLoading ? "—" : formatNumber(overview.data?.total_messages)}
        />
        <Metric
          label={t("metric.lastSync")}
          value={
            overview.isLoading
              ? "—"
              : overview.data?.last_sync_at
                ? formatRelative(overview.data.last_sync_at)
                : "—"
          }
        />
      </div>

      <p className="text-xs text-ink-400">
        {t("createdOn", { date: formatDate(tenant.created_at) })}
      </p>

      <div className="mt-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<PencilLine className="h-3.5 w-3.5" />}
          onClick={onEdit}
        >
          {t("common:actions.edit")}
        </Button>
        <Button
          size="sm"
          rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
          className="ml-auto"
          onClick={onOpen}
        >
          {t("openDashboard")}
        </Button>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-ink-500 dark:text-ink-400">
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold text-ink-900 dark:text-ink-50">
        {value}
      </p>
    </div>
  );
}
