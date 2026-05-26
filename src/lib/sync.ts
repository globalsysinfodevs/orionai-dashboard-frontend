import i18n from "@/i18n";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const KNOWN_SYNC_STATUSES = [
  "completed",
  "failed",
  "processing",
  "running",
  "pending",
  "partial",
  "never",
  "ok",
  "success",
  "error",
  "unknown",
] as const;

export function syncStatusTone(status?: string | null): Tone {
  if (!status) return "neutral";
  const s = status.toLowerCase();
  if (s.includes("success") || s === "ok" || s === "completed") return "success";
  if (s.includes("fail") || s.includes("error")) return "danger";
  if (s.includes("partial") || s.includes("warn")) return "warning";
  if (s.includes("running") || s.includes("progress") || s.includes("pending"))
    return "info";
  return "neutral";
}

export function syncStatusLabel(status?: string | null): string {
  if (!status) return i18n.t("dashboard:syncStatus.unknown");
  const key = status.toLowerCase();
  if ((KNOWN_SYNC_STATUSES as readonly string[]).includes(key)) {
    return i18n.t(`dashboard:syncStatus.${key}`);
  }
  // Fallback: prettify unknown statuses coming from the backend.
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
