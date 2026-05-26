import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DropdownProps {
  trigger: ReactNode;
  children: (close: () => void) => ReactNode;
  align?: "left" | "right";
  className?: string;
  menuClassName?: string;
}

export function Dropdown({
  trigger,
  children,
  align = "right",
  className,
  menuClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen((p) => !p)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={cn(
            "animate-fade-in absolute z-30 mt-2 min-w-[200px] rounded-xl border border-ink-100 bg-white p-1.5 shadow-elevated dark:border-ink-800 dark:bg-ink-900",
            align === "right" ? "right-0" : "left-0",
            menuClassName,
          )}
          role="menu"
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  onClick?: () => void;
  icon?: ReactNode;
  children: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

export function DropdownItem({
  onClick,
  icon,
  children,
  destructive,
  disabled,
}: DropdownItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition disabled:opacity-50",
        destructive
          ? "text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-500/15"
          : "text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800",
      )}
      role="menuitem"
    >
      {icon && <span className="text-ink-400">{icon}</span>}
      <span className="truncate">{children}</span>
    </button>
  );
}
