import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { tenantsApi, activeTenantFlag } from "@/lib/api";
import type { Tenant } from "@/types";

const STORAGE_KEY = "orion.active_tenant";

interface TenantContextValue {
  tenants: Tenant[];
  activeTenant: Tenant | null;
  isLoading: boolean;
  isError: boolean;
  setActiveTenantId: (id: string) => void;
  refetch: () => Promise<unknown>;
}

const TenantContext = createContext<TenantContextValue | null>(null);

export function TenantProvider({ children }: { children: ReactNode }) {
  const tenantsQuery = useQuery({
    queryKey: ["tenants"],
    queryFn: tenantsApi.list,
    staleTime: 30_000,
  });

  const [activeTenantId, setActiveTenantIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(STORAGE_KEY);
  });

  const setActiveTenantId = useCallback((id: string) => {
    setActiveTenantIdState(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const tenants = tenantsQuery.data ?? [];

  // Auto-select a tenant if none chosen yet (prefer active ones).
  useEffect(() => {
    if (!tenants.length) return;
    if (activeTenantId && tenants.some((t) => t.tenant_id === activeTenantId)) return;
    const preferred = tenants.find(activeTenantFlag) ?? tenants[0];
    if (preferred) setActiveTenantId(preferred.tenant_id);
  }, [tenants, activeTenantId, setActiveTenantId]);

  const activeTenant =
    tenants.find((t) => t.tenant_id === activeTenantId) ?? tenants[0] ?? null;

  const value = useMemo<TenantContextValue>(
    () => ({
      tenants,
      activeTenant,
      isLoading: tenantsQuery.isLoading,
      isError: tenantsQuery.isError,
      setActiveTenantId,
      refetch: tenantsQuery.refetch,
    }),
    [tenants, activeTenant, tenantsQuery.isLoading, tenantsQuery.isError, tenantsQuery.refetch, setActiveTenantId],
  );

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenants(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) throw new Error("useTenants must be used inside <TenantProvider>");
  return ctx;
}
