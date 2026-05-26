import { Check, ChevronsUpDown, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dropdown } from "@/components/ui/Dropdown";
import { useTenants } from "@/contexts/TenantContext";
import { activeTenantFlag } from "@/lib/api";
import { cn } from "@/lib/utils";

export function TenantSwitcher() {
  const { tenants, activeTenant, setActiveTenantId, isLoading } = useTenants();
  const [query, setQuery] = useState("");
  const { t } = useTranslation(["layout", "common"]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter((t) => {
      const haystack = [t.name, t.company_name, t.slug, t.tenant_id]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase())
        .join(" ");
      return haystack.includes(q);
    });
  }, [tenants, query]);

  return (
    <Dropdown
      align="left"
      menuClassName="w-[320px]"
      trigger={
        <button
          type="button"
          className="inline-flex h-10 max-w-[300px] items-center gap-2.5 rounded-lg border border-ink-200 bg-white px-3 text-sm transition hover:border-ink-300 hover:bg-ink-50 disabled:opacity-60 dark:border-ink-700 dark:bg-ink-900 dark:hover:bg-ink-800"
          disabled={isLoading || tenants.length === 0}
        >
          <div className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-brand-700 text-[10px] font-bold text-white">
            {(activeTenant?.name || activeTenant?.company_name || activeTenant?.slug || "?")
              .slice(0, 1)
              .toUpperCase()}
          </div>
          <div className="min-w-0 text-left">
            <div className="truncate text-xs font-semibold text-ink-900 dark:text-ink-50">
              {activeTenant?.name ||
                activeTenant?.company_name ||
                activeTenant?.slug ||
                (isLoading ? t("common:labels.loading") : t("tenantSwitcher.noTenants"))}
            </div>
            <div className="truncate text-[10px] text-ink-400">
              {activeTenant?.tenant_id ?? t("tenantSwitcher.selectTenant")}
            </div>
          </div>
          <ChevronsUpDown className="ml-auto h-4 w-4 flex-none text-ink-400" />
        </button>
      }
    >
      {(close) => (
        <div className="max-h-[420px] w-full">
          <div className="relative mb-1.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("tenantSwitcher.searchPlaceholder")}
              className="w-full rounded-lg border border-transparent bg-ink-100/60 py-2 pl-9 pr-3 text-xs text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:bg-ink-800/70 dark:text-ink-100"
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto pr-0.5">
            {filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-ink-500">
                {t("tenantSwitcher.noMatch", { query })}
              </div>
            ) : (
              filtered.map((tenant) => {
                const isActive = activeTenant?.tenant_id === tenant.tenant_id;
                const isOnline = activeTenantFlag(tenant);
                return (
                  <button
                    key={tenant.tenant_id}
                    type="button"
                    onClick={() => {
                      setActiveTenantId(tenant.tenant_id);
                      close();
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition",
                      isActive
                        ? "bg-brand-50 dark:bg-brand-900/30"
                        : "hover:bg-ink-100 dark:hover:bg-ink-800",
                    )}
                  >
                    <div className="flex h-7 w-7 flex-none items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-brand-700 text-[10px] font-bold text-white">
                      {(tenant.name || tenant.company_name || tenant.slug).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-ink-900 dark:text-ink-50">
                        {tenant.name || tenant.company_name || tenant.slug}
                      </div>
                      <div className="truncate text-[10px] text-ink-400">
                        {tenant.slug} · {tenant.tenant_id}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "h-1.5 w-1.5 flex-none rounded-full",
                        isOnline ? "bg-emerald-500" : "bg-ink-300",
                      )}
                      aria-label={isOnline ? t("common:status.active") : t("tenantSwitcher.inactive")}
                    />
                    {isActive && (
                      <Check className="h-3.5 w-3.5 flex-none text-brand-600 dark:text-brand-300" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </Dropdown>
  );
}
