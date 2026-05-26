import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { es, enUS } from "date-fns/locale";
import type { Locale } from "date-fns";
import i18n from "@/i18n";

// ── Locale resolution ─────────────────────────────────────────────────────────
// Everything reads the *current* i18next language at call time, so values
// re-render in the active language as soon as the user switches.

function isSpanish(): boolean {
  return (i18n.language || "es-MX").toLowerCase().startsWith("es");
}

function dateFnsLocale(): Locale {
  return isSpanish() ? es : enUS;
}

function intlLocale(): string {
  return isSpanish() ? "es-MX" : "en-US";
}

// Date patterns differ by language so month/day order reads naturally
// (e.g. "26 may 2026" in es-MX vs "May 26, 2026" in en).
function datePattern(): string {
  return isSpanish() ? "d MMM yyyy" : "MMM d, yyyy";
}
function dateTimePattern(): string {
  return isSpanish() ? "d MMM yyyy · HH:mm" : "MMM d, yyyy · HH:mm";
}
function shortDatePattern(): string {
  return isSpanish() ? "d MMM" : "MMM d";
}

export function safeParseDate(value?: string | Date | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  try {
    const parsed = parseISO(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function formatDateTime(value?: string | Date | null, fallback = "—"): string {
  const d = safeParseDate(value);
  return d ? format(d, dateTimePattern(), { locale: dateFnsLocale() }) : fallback;
}

export function formatDate(value?: string | Date | null, fallback = "—"): string {
  const d = safeParseDate(value);
  return d ? format(d, datePattern(), { locale: dateFnsLocale() }) : fallback;
}

export function formatShortDate(value?: string | Date | null, fallback = "—"): string {
  const d = safeParseDate(value);
  return d ? format(d, shortDatePattern(), { locale: dateFnsLocale() }) : fallback;
}

export function formatRelative(value?: string | Date | null, fallback = "—"): string {
  const d = safeParseDate(value);
  if (!d) return fallback;
  try {
    // addSuffix yields "5 minutes ago" / "hace 5 minutos" via the locale.
    return formatDistanceToNowStrict(d, { addSuffix: true, locale: dateFnsLocale() });
  } catch {
    return fallback;
  }
}

export function formatNumber(value?: number | null, fallback = "—"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat(intlLocale()).format(value);
}

export function formatCompact(value?: number | null, fallback = "—"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return new Intl.NumberFormat(intlLocale(), {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercent(value?: number | null, digits = 1, fallback = "—"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  return `${new Intl.NumberFormat(intlLocale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)} %`;
}

export function formatMs(value?: number | null, fallback = "—"): string {
  if (value === null || value === undefined || Number.isNaN(value)) return fallback;
  const nf = new Intl.NumberFormat(intlLocale(), { maximumFractionDigits: 2 });
  if (value < 1000) return `${nf.format(Math.round(value))} ms`;
  return `${nf.format(value / 1000)} s`;
}
