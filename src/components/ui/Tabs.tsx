import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: ReactNode;
  badge?: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, value, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 border-b border-ink-100 dark:border-ink-800/70",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative -mb-px inline-flex items-center gap-2 px-4 py-3 text-sm font-medium transition focus-ring",
              active
                ? "text-brand-600 dark:text-brand-300"
                : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100",
            )}
          >
            {tab.label}
            {tab.badge && <span className="text-xs">{tab.badge}</span>}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-600 dark:bg-brand-300" />
            )}
          </button>
        );
      })}
    </div>
  );
}
