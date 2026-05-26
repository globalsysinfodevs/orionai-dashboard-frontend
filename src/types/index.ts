// ── Shared API response envelope ─────────────────────────────────────────────
export interface ApiSuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
  request_id?: string | null;
}

export interface ApiErrorEnvelope {
  success: false;
  message: string;
  error_code?: string | null;
  details?: unknown;
  request_id?: string | null;
}

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AdminUser {
  id: number;
  email: string;
  full_name: string | null;
  is_active: boolean;
  is_superuser: boolean;
  last_login_at: string | null;
  created_at: string;
}

// ── Tenants ──────────────────────────────────────────────────────────────────
export interface Tenant {
  id: string;
  tenant_id: string;
  // Backend exposes either `name` or `company_name` across schema versions.
  name?: string;
  company_name?: string;
  slug: string;
  description?: string | null;
  contact_email?: string | null;
  status?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TenantCreateInput {
  name?: string;
  company_name?: string;
  slug: string;
  description?: string;
  contact_email?: string;
}

export interface TenantUpdateInput {
  name?: string;
  company_name?: string;
  description?: string;
  contact_email?: string;
  status?: string;
  is_active?: boolean;
}

// ── API Keys ─────────────────────────────────────────────────────────────────
export interface ApiKeyInfo {
  id: number;
  tenant_id: string;
  key_prefix: string;
  label: string;
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

export interface ApiKeyCreated {
  id: number;
  tenant_id: string;
  key_prefix: string;
  raw_key: string;
  label: string;
  expires_at: string | null;
  created_at: string;
}

// ── Dashboard ────────────────────────────────────────────────────────────────
export interface TenantOverview {
  tenant_id: string;
  tenant_name?: string;
  company_name?: string;
  total_users: number;
  active_users: number;
  total_documents: number;
  total_chatbots: number;
  total_messages: number;
  total_tokens: number;
  last_sync_at: string | null;
  sync_health: string;
}

export interface SyncRunInfo {
  sync_run_id: string;
  started_at: string | null;
  completed_at: string | null;
  status: string | null;
  total_batches: number | null;
  successful_batches: number | null;
  failed_batches: number | null;
  records_processed: number | null;
  records_failed: number | null;
}

export interface SyncHealthStats {
  last_sync_at: string | null;
  last_sync_status: string | null;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  recent_runs: SyncRunInfo[];
}

export interface UsageMetricsDaily {
  metric_date: string; // ISO date (yyyy-mm-dd)
  total_users: number | null;
  active_users: number | null;
  total_documents: number | null;
  uploaded_documents: number | null;
  total_messages: number | null;
  user_messages: number | null;
  assistant_messages: number | null;
  total_tokens: number | null;
  total_sync_runs: number | null;
  failed_sync_runs: number | null;
  avg_response_time_ms: number | null;
}

export interface ActivityItem {
  event_type: string;
  received_at: string;
  details?: Record<string, unknown> | null;
}

export interface RecentActivityResponse {
  tenant_id: string;
  items: ActivityItem[];
  total: number;
}

export interface HealthStatus {
  status: string;
  version: string;
  environment: string;
  database: boolean;
  uptime_seconds: number;
}
