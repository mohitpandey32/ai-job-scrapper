import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly error?: string;
  readonly action?: ReactNode;
}

export function Field({ label, error, action, className, ...props }: FieldProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-stone-800">
      <span className="flex items-center justify-between gap-3">
        {label}
        {action}
      </span>
      <input
        className={cn(
          "focus-ring h-11 rounded-md border border-stone-300 bg-white px-3 text-base text-stone-950 shadow-sm transition placeholder:text-stone-400",
          error && "border-red-500",
          className,
        )}
        {...props}
      />
      {error ? <span className="text-sm font-normal text-red-700">{error}</span> : null}
    </label>
  );
}

