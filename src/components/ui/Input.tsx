import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, leftIcon, rightSlot, className, id, ...props }, ref) => {
    const inputId = id || props.name || undefined;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label-base">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-400">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "input-base",
              leftIcon && "pl-10",
              rightSlot && "pr-10",
              error && "border-danger-500 focus:border-danger-500 focus:ring-danger-500/15",
              className,
            )}
            aria-invalid={!!error || undefined}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            {...props}
          />
          {rightSlot && (
            <span className="absolute inset-y-0 right-2 flex items-center">{rightSlot}</span>
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs font-medium text-danger-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="helper-text">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
