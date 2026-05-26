import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className, id, ...props }, ref) => {
    const tId = id || props.name || undefined;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={tId} className="label-base">
            {label}
          </label>
        )}
        <textarea
          id={tId}
          ref={ref}
          className={cn(
            "input-base min-h-[88px] resize-y leading-relaxed",
            error && "border-danger-500 focus:border-danger-500 focus:ring-danger-500/15",
            className,
          )}
          aria-invalid={!!error || undefined}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-xs font-medium text-danger-600">{error}</p>
        ) : helperText ? (
          <p className="helper-text">{helperText}</p>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
