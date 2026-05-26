import { LogOut, Menu, Moon, Settings, ShieldCheck, Sun } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { TenantSwitcher } from "./TenantSwitcher";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface TopBarProps {
  onOpenSidebar: () => void;
}

export function TopBar({ onOpenSidebar }: TopBarProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation("layout");

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-ink-100 bg-white/85 px-4 backdrop-blur-md sm:px-6 dark:border-ink-800/70 dark:bg-ink-900/85">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 transition hover:bg-ink-100 lg:hidden dark:text-ink-300 dark:hover:bg-ink-800"
        aria-label={t("topbar.openNav")}
      >
        <Menu className="h-5 w-5" />
      </button>

      <TenantSwitcher />

      <div className="ml-auto flex items-center gap-1.5">
        <LanguageSwitcher />
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-600 transition hover:bg-ink-100 dark:text-ink-300 dark:hover:bg-ink-800"
          aria-label={t("topbar.toggleTheme")}
          title={theme === "dark" ? t("topbar.switchToLight") : t("topbar.switchToDark")}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <Dropdown
          trigger={
            <button
              type="button"
              className="ml-1 inline-flex h-9 items-center gap-2 rounded-lg pl-1 pr-2.5 text-sm transition hover:bg-ink-100 dark:hover:bg-ink-800"
            >
              <Avatar name={user?.full_name || user?.email} size="sm" />
              <div className="hidden text-left sm:block">
                <div className="text-xs font-semibold text-ink-900 dark:text-ink-50">
                  {user?.full_name || user?.email || t("topbar.admin")}
                </div>
                <div className="text-[10px] text-ink-500">
                  {user?.is_superuser ? t("topbar.superuser") : t("topbar.administrator")}
                </div>
              </div>
            </button>
          }
        >
          {(close) => (
            <>
              <div className="border-b border-ink-100 px-3 py-2 dark:border-ink-800">
                <p className="text-xs font-semibold text-ink-900 dark:text-ink-50">
                  {user?.full_name || t("topbar.adminUser")}
                </p>
                <p className="truncate text-[11px] text-ink-500">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  <ShieldCheck className="h-3 w-3" />
                  {user?.is_superuser ? t("topbar.superuser") : t("topbar.adminShort")}
                </div>
              </div>
              <div className="mt-1 space-y-0.5">
                <DropdownItem
                  icon={<Settings className="h-4 w-4" />}
                  onClick={() => {
                    close();
                    navigate("/settings");
                  }}
                >
                  {t("topbar.accountSettings")}
                </DropdownItem>
                <DropdownItem
                  icon={<LogOut className="h-4 w-4" />}
                  destructive
                  onClick={() => {
                    close();
                    logout();
                    navigate("/login");
                  }}
                >
                  {t("topbar.signOut")}
                </DropdownItem>
              </div>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
