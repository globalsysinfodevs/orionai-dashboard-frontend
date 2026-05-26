import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import i18n from "@/i18n";
import type {
  ActivityItem,
  AdminUser,
  ApiEnvelope,
  ApiKeyCreated,
  ApiKeyInfo,
  HealthStatus,
  RecentActivityResponse,
  SyncHealthStats,
  Tenant,
  TenantCreateInput,
  TenantOverview,
  TenantUpdateInput,
  TokenPair,
  UsageMetricsDaily,
} from "@/types";

const ACCESS_TOKEN_KEY = "orion.access_token";
const REFRESH_TOKEN_KEY = "orion.refresh_token";

export const tokenStorage = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set: (access: string, refresh: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

const BASE_URL = "https://orionai-dashboard-backend.eastus.cloudapp.azure.com/api/v1";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
});

// ── Auth header injector ─────────────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Token refresh handling ───────────────────────────────────────────────────
type FailedRequest = {
  resolve: (value: string) => void;
  reject: (err: unknown) => void;
};

let isRefreshing = false;
let pendingRequests: FailedRequest[] = [];

function flushQueue(error: unknown, token: string | null) {
  pendingRequests.forEach((p) => {
    if (error || !token) p.reject(error);
    else p.resolve(token);
  });
  pendingRequests = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const status = error.response?.status;

    if (!original || status !== 401) {
      return Promise.reject(error);
    }

    // Don't try to refresh while calling the refresh endpoint itself.
    if (original.url?.includes("/auth/refresh") || original.url?.includes("/auth/token")) {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent("orion:auth:logout"));
      return Promise.reject(error);
    }

    if (original._retry) {
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent("orion:auth:logout"));
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingRequests.push({
          resolve: (token: string) => {
            if (!original.headers) original.headers = {};
            (original.headers as Record<string, string>).Authorization = `Bearer ${token}`;
            original._retry = true;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refresh = tokenStorage.getRefresh();
      if (!refresh) throw new Error("No refresh token available");

      const { data } = await axios.post<ApiEnvelope<TokenPair>>(
        `${BASE_URL}/auth/refresh`,
        { refresh_token: refresh },
        { headers: { "Content-Type": "application/json" } },
      );
      if (!data.success) throw new Error(data.message || "Refresh failed");

      tokenStorage.set(data.data.access_token, data.data.refresh_token);
      flushQueue(null, data.data.access_token);

      if (!original.headers) original.headers = {};
      (original.headers as Record<string, string>).Authorization =
        `Bearer ${data.data.access_token}`;
      return apiClient(original);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      tokenStorage.clear();
      window.dispatchEvent(new CustomEvent("orion:auth:logout"));
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

// ── Envelope unwrapping helpers ──────────────────────────────────────────────
function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) {
    throw new ApiError(envelope.message, envelope);
  }
  return envelope.data;
}

export class ApiError extends Error {
  public readonly envelope?: ApiEnvelope<unknown>;
  public readonly status?: number;
  constructor(message: string, envelope?: ApiEnvelope<unknown>, status?: number) {
    super(message);
    this.name = "ApiError";
    this.envelope = envelope;
    this.status = status;
  }
}

export function readApiError(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiEnvelope<unknown> | undefined;
    if (data && typeof data === "object" && "message" in data && data.message) {
      return String(data.message);
    }
    // FastAPI default error: { detail: "..." }
    const detail = (err.response?.data as { detail?: string } | undefined)?.detail;
    if (detail) return detail;
    if (err.response?.status === 0 || err.code === "ERR_NETWORK") {
      return i18n.t("common:errors.backendUnreachable");
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return i18n.t("common:errors.generic");
}

// ── Concrete API surface ─────────────────────────────────────────────────────
export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiClient.post<ApiEnvelope<TokenPair>>("/auth/token", {
      email,
      password,
    });
    return unwrap(res.data);
  },
  refresh: async (refresh_token: string) => {
    const res = await apiClient.post<ApiEnvelope<TokenPair>>("/auth/refresh", {
      refresh_token,
    });
    return unwrap(res.data);
  },
  me: async () => {
    const res = await apiClient.get<ApiEnvelope<AdminUser>>("/auth/me");
    return unwrap(res.data);
  },
};

export const tenantsApi = {
  list: async (): Promise<Tenant[]> => {
    const res = await apiClient.get<ApiEnvelope<Tenant[]>>("/tenants");
    return unwrap(res.data);
  },
  create: async (input: TenantCreateInput): Promise<Tenant> => {
    // The schema layer alternates between `name` and `company_name`. We send
    // both so the create call works regardless of which version is deployed.
    const body = {
      name: input.name ?? input.company_name,
      company_name: input.company_name ?? input.name,
      slug: input.slug,
      description: input.description,
      contact_email: input.contact_email,
    };
    const res = await apiClient.post<ApiEnvelope<Tenant>>("/tenants", body);
    return unwrap(res.data);
  },
  update: async (tenant_id: string, patch: TenantUpdateInput): Promise<Tenant> => {
    const res = await apiClient.patch<ApiEnvelope<Tenant>>(
      `/tenants/${tenant_id}`,
      patch,
    );
    return unwrap(res.data);
  },
  listApiKeys: async (tenant_id: string): Promise<ApiKeyInfo[]> => {
    const res = await apiClient.get<ApiEnvelope<ApiKeyInfo[]>>(
      `/tenants/${tenant_id}/api-keys`,
    );
    return unwrap(res.data);
  },
  createApiKey: async (
    tenant_id: string,
    input: { label: string; expires_at?: string | null },
  ): Promise<ApiKeyCreated> => {
    const res = await apiClient.post<ApiEnvelope<ApiKeyCreated>>(
      `/tenants/${tenant_id}/api-keys`,
      input,
    );
    return unwrap(res.data);
  },
  revokeApiKey: async (tenant_id: string, key_id: number): Promise<void> => {
    await apiClient.delete(`/tenants/${tenant_id}/api-keys/${key_id}`);
  },
};

export const dashboardApi = {
  overview: async (tenant_id: string): Promise<TenantOverview> => {
    const res = await apiClient.get<ApiEnvelope<TenantOverview>>(
      `/dashboard/tenants/${tenant_id}/overview`,
    );
    return unwrap(res.data);
  },
  syncHealth: async (tenant_id: string): Promise<SyncHealthStats> => {
    const res = await apiClient.get<ApiEnvelope<SyncHealthStats>>(
      `/dashboard/tenants/${tenant_id}/sync-health`,
    );
    return unwrap(res.data);
  },
  dailyAggregates: async (tenant_id: string, days = 30): Promise<UsageMetricsDaily[]> => {
    const res = await apiClient.get<ApiEnvelope<UsageMetricsDaily[]>>(
      `/dashboard/aggregates/daily`,
      { params: { tenant_id, days } },
    );
    return unwrap(res.data);
  },
  recentActivity: async (
    tenant_id: string,
    limit = 50,
  ): Promise<RecentActivityResponse> => {
    const res = await apiClient.get<ApiEnvelope<RecentActivityResponse>>(
      `/dashboard/tenants/${tenant_id}/activity`,
      { params: { limit } },
    );
    return unwrap(res.data);
  },
};

// Health endpoint is mounted at "/health" (no /api/v1 prefix).
export const systemApi = {
  health: async (): Promise<HealthStatus> => {
    const baseHost = BASE_URL.replace(/\/api\/v1\/?$/, "");
    const url = baseHost ? `${baseHost}/health` : "/health";
    const res = await axios.get<ApiEnvelope<HealthStatus>>(url, { timeout: 5_000 });
    return unwrap(res.data);
  },
};

export function getTenantDisplayName(t: Tenant | TenantOverview | undefined | null): string {
  if (!t) return "—";
  const anyT = t as Tenant & TenantOverview;
  return anyT.name || anyT.tenant_name || anyT.company_name || anyT.tenant_id || "—";
}

export function activeTenantFlag(t: Tenant): boolean {
  if (typeof t.is_active === "boolean") return t.is_active;
  if (typeof t.status === "string") return t.status.toLowerCase() === "active";
  return true;
}
