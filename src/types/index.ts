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

// ── Pagination ───────────────────────────────────────────────────────────────
export interface PaginationMeta {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ApiPaginatedEnvelope<T> {
  success: true;
  message: string;
  data: T[];
  pagination: PaginationMeta;
  request_id?: string | null;
}

export type ApiPaginatedResponse<T> = ApiPaginatedEnvelope<T> | ApiErrorEnvelope;

/** Result of a paginated endpoint after unwrapping the envelope. */
export interface Paginated<T> {
  items: T[];
  pagination: PaginationMeta;
}

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

// ── Dashboard homepage (new endpoints) ───────────────────────────────────────
export interface AdminProfile {
  id: number;
  email: string;
  full_name: string | null;
  role: string; // "superuser" | "admin"
  last_login_at: string | null;
}

export interface IngestionHealth {
  last_sync_at: string | null;
  last_sync_status: string | null;
  sync_health_label: string; // "healthy" | "warning" | "error" | "never"
  total_sync_runs: number;
  successful_runs: number;
  failed_runs: number;
  failed_batches_count: number;
  avg_sync_duration_seconds: number | null;
}

/** GET /dashboard/overview — lightweight homepage bootstrap. */
export interface DashboardOverview {
  admin_profile: AdminProfile;
  ingestion_health: IngestionHealth;
}

export interface TenantSelector {
  tenant_id: string;
  company_name: string;
  slug: string;
  status: string;
}

export interface TokenUsage {
  allowed_tokens_per_month: number | null;
  tokens_remaining: number | null;
  tokens_used: number | null;
  usage_percentage: number | null; // 0.0 – 100.0
  subscription_status: string | null;
  last_token_reset_at: string | null;
}

export interface KpiSummary {
  total_documents: number;
  total_users: number;
  total_messages: number;
  total_chatbots: number;
  token_usage: TokenUsage;
}

/** GET /dashboard/kpi — tenant info + KPI summary cards. */
export interface KpiResponse {
  tenant: TenantSelector;
  kpi_summary: KpiSummary;
}

/** Row from GET /dashboard/users (paginated). */
export interface UserListItem {
  user_id: string;
  email: string | null;
  name: string | null;
  status: string | null;
  is_verified: boolean | null;
  questions_asked: number;
  documents_uploaded: number;
  last_active_at: string | null;
  source_created_at: string | null;
  source_updated_at: string | null;
  created_at: string | null;
}

/** Row from GET /dashboard/conversations (paginated). */
export interface ConversationListItem {
  message_id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  source_chatbot_id: string | null;
  role: string | null;
  content_preview: string | null;
  token_count: number | null;
  sequence_index: number | null;
  message_timestamp: string | null;
}

export interface HealthStatus {
  status: string;
  version: string;
  environment: string;
  database: boolean;
  uptime_seconds: number;
}
