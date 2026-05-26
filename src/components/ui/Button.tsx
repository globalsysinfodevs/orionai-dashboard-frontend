import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-600/60",
  secondary:
    "bg-ink-900 text-white shadow-sm hover:bg-ink-800 active:bg-ink-700 disabled:bg-ink-900/60 dark:bg-ink-100 dark:text-ink-900 dark:hover:bg-white",
  outline:
    "border border-ink-200 bg-white text-ink-800 hover:border-ink-300 hover:bg-ink-50 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100 dark:hover:bg-ink-800",
  ghost:
    "text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800",
  subtle:
    "bg-brand-50 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-200 dark:hover:bg-brand-900/50",
  danger:
    "bg-danger-600 text-white shadow-sm hover:bg-danger-600/90 active:bg-danger-600/80",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-10 px-4 text-sm gap-2 rounded-lg",
  lg: "h-12 px-5 text-base gap-2 rounded-xl",
  icon: "h-10 w-10 text-sm rounded-lg justify-center",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          "inline-flex items-center justify-center font-medium transition focus-ring disabled:cursor-not-allowed disabled:opacity-70 select-none",
          variantClass[variant],
          sizeClass[size],
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : leftIcon}
        {size !== "icon" ? <span className="truncate">{children}</span> : children}
        {rightIcon}
      </button>
    );
  },
);
Button.displayName = "Button";
