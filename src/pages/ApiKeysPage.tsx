import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { KeyRound, Plus, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { CreateApiKeyModal } from "@/components/tenants/CreateApiKeyModal";
import { useAuth } from "@/contexts/AuthContext";
import { useTenants } from "@/contexts/TenantContext";
import { readApiError, tenantsApi } from "@/lib/api";
import { formatDate, formatRelative } from "@/lib/format";

export function ApiKeysPage() {
  const { t } = useTranslation(["apiKeys", "common"]);
  const { user } = useAuth();
  const { activeTenant } = useTenants();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const tenantId = activeTenant?.tenant_id;

  const keys = useQuery({
    queryKey: ["api-keys", tenantId],
    queryFn: () => tenantsApi.listApiKeys(tenantId!),
    enabled: !!tenantId,
  });

  const revoke = useMutation({
    mutationFn: (keyId: number) => tenantsApi.revokeApiKey(tenantId!, keyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", tenantId] });
      toast.success(t("toast.revoked"));
    },
    onError: (err) => toast.error(readApiError(err)),
  });

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
              onClick={() => keys.refetch()}
              loading={keys.isFetching}
            >
              {t("common:actions.refresh")}
            </Button>
            <Button
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setCreateOpen(true)}
              disabled={!user?.is_superuser || !tenantId}
              title={user?.is_superuser ? undefined : t("onlySuperusersCreate")}
            >
              {t("generate")}
            </Button>
          </>
        }
      />

      <div className="flex items-start gap-3 rounded-xl border border-amber-200/70 bg-amber-50/70 px-4 py-3 dark:border-amber-500/30 dark:bg-amber-900/15">
        <ShieldAlert className="mt-0.5 h-4 w-4 flex-none text-amber-600 dark:text-amber-300" />
        <p className="text-xs text-amber-800 dark:text-amber-200">
          {t("securityNotice")}
        </p>
      </div>

      <Card>
        <CardHeader
          title={
            activeTenant
              ? t("keysFor", {
                  name:
                    activeTenant.name || activeTenant.company_name || activeTenant.slug,
                })
              : t("keys")
          }
          description={t("cardDescription")}
          icon={<KeyRound className="h-4 w-4" />}
        />
        {!tenantId ? (
          <EmptyState
            icon={<KeyRound className="h-5 w-5" />}
            title={t("selectTenant.title")}
            description={t("selectTenant.description")}
          />
        ) : keys.isLoading ? (
          <div className="space-y-3 p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (keys.data ?? []).length === 0 ? (
          <EmptyState
            icon={<KeyRound className="h-5 w-5" />}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={
              <Button
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setCreateOpen(true)}
                disabled={!user?.is_superuser}
              >
                {t("generate")}
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
                {(keys.data ?? []).map((k) => (
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
                      {k.is_active && (
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                          onClick={() => {
                            if (
                              window.confirm(t("revokeConfirm", { label: k.label }))
                            ) {
                              revoke.mutate(k.id);
                            }
                          }}
                          disabled={!user?.is_superuser}
                        >
                          {t("common:actions.revoke")}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {tenantId && (
        <CreateApiKeyModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          tenantId={tenantId}
        />
      )}
    </div>
  );
}
