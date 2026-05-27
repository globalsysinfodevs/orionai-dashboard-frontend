import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// ── English resources ─────────────────────────────────────────────────────────
import enCommon from "./locales/en/common.json";
import enLayout from "./locales/en/layout.json";
import enAuth from "./locales/en/auth.json";
import enDashboard from "./locales/en/dashboard.json";
import enAnalytics from "./locales/en/analytics.json";
import enUsers from "./locales/en/users.json";
import enConversations from "./locales/en/conversations.json";
import enActivity from "./locales/en/activity.json";
import enTenants from "./locales/en/tenants.json";
import enTenantDetail from "./locales/en/tenantDetail.json";
import enApiKeys from "./locales/en/apiKeys.json";
import enSettings from "./locales/en/settings.json";

// ── Mexican Spanish resources ───────────────────────────────────────────────
import esCommon from "./locales/es-MX/common.json";
import esLayout from "./locales/es-MX/layout.json";
import esAuth from "./locales/es-MX/auth.json";
import esDashboard from "./locales/es-MX/dashboard.json";
import esAnalytics from "./locales/es-MX/analytics.json";
import esUsers from "./locales/es-MX/users.json";
import esConversations from "./locales/es-MX/conversations.json";
import esActivity from "./locales/es-MX/activity.json";
import esTenants from "./locales/es-MX/tenants.json";
import esTenantDetail from "./locales/es-MX/tenantDetail.json";
import esApiKeys from "./locales/es-MX/apiKeys.json";
import esSettings from "./locales/es-MX/settings.json";

export const NAMESPACES = [
  "common",
  "layout",
  "auth",
  "dashboard",
  "analytics",
  "users",
  "conversations",
  "activity",
  "tenants",
  "tenantDetail",
  "apiKeys",
  "settings",
] as const;

export const SUPPORTED_LANGUAGES = [
  { code: "es-MX", label: "Español (México)", short: "ES" },
  { code: "en", label: "English", short: "EN" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];

export const LANGUAGE_STORAGE_KEY = "orion.lang";

const resources = {
  en: {
    common: enCommon,
    layout: enLayout,
    auth: enAuth,
    dashboard: enDashboard,
    analytics: enAnalytics,
    users: enUsers,
    conversations: enConversations,
    activity: enActivity,
    tenants: enTenants,
    tenantDetail: enTenantDetail,
    apiKeys: enApiKeys,
    settings: enSettings,
  },
  "es-MX": {
    common: esCommon,
    layout: esLayout,
    auth: esAuth,
    dashboard: esDashboard,
    analytics: esAnalytics,
    users: esUsers,
    conversations: esConversations,
    activity: esActivity,
    tenants: esTenants,
    tenantDetail: esTenantDetail,
    apiKeys: esApiKeys,
    settings: esSettings,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Mexican client: default to es-MX; English is the opt-in alternate.
    fallbackLng: "es-MX",
    supportedLngs: ["es-MX", "en"],
    ns: [...NAMESPACES],
    defaultNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
  });

// Keep <html lang> in sync for accessibility and date pickers.
i18n.on("languageChanged", (lng) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = lng;
  }
});
if (typeof document !== "undefined") {
  document.documentElement.lang = i18n.language || "es-MX";
}

export default i18n;
