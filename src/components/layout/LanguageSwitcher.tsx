import { Check, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { SUPPORTED_LANGUAGES } from "@/i18n";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation("layout");
  const current =
    SUPPORTED_LANGUAGES.find((l) => i18n.language?.toLowerCase().startsWith(l.code.toLowerCase())) ??
    SUPPORTED_LANGUAGES[0];

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2 text-ink-600 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
          aria-label={t("language.label")}
          title={t("language.label")}
        >
          <Languages className="h-4 w-4" />
          <span className="text-xs font-semibold">{current.short}</span>
        </button>
      }
    >
      {(close) => (
        <>
          <div className="border-b border-ink-100 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-ink-500 dark:border-ink-800">
            {t("language.label")}
          </div>
          <div className="mt-1 space-y-0.5">
            {SUPPORTED_LANGUAGES.map((lng) => {
              const active = lng.code === current.code;
              return (
                <DropdownItem
                  key={lng.code}
                  icon={
                    active ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <span className="inline-block h-4 w-4" />
                    )
                  }
                  onClick={() => {
                    void i18n.changeLanguage(lng.code);
                    close();
                  }}
                >
                  {lng.label}
                </DropdownItem>
              );
            })}
          </div>
        </>
      )}
    </Dropdown>
  );
}
