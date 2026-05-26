import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card", className)} {...rest} />;
}

interface CardHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "title"> {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  icon?: ReactNode;
}

export function CardHeader({
  title,
  description,
  actions,
  icon,
  className,
  children,
  ...rest
}: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-ink-100 px-6 py-5 dark:border-ink-800/70",
        className,
      )}
      {...rest}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-300">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {title && (
            <h3 className="truncate text-base font-semibold text-ink-900 dark:text-ink-50">
              {title}
            </h3>
          )}
          {description && (
            <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">{description}</p>
          )}
          {children}
        </div>
      </div>
      {actions && <div className="flex flex-none items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/40 px-6 py-4 dark:border-ink-800/70 dark:bg-ink-900/50",
        className,
      )}
      {...rest}
    />
  );
}
