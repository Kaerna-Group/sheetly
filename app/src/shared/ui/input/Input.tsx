import type { InputHTMLAttributes } from 'react';
import { useId } from 'react';

import { cn } from '@shared/lib/classnames/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  hint?: string;
  label?: string;
};

export function Input({ className, error, hint, id, label, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;
  const description = error ?? hint;

  return (
    <label className="grid gap-2 text-sm font-medium text-text-muted" htmlFor={inputId}>
      {label ? <span>{label}</span> : null}
      <input
        aria-describedby={description ? descriptionId : undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          'h-10 rounded-md border border-border bg-surface px-3 text-sm text-text outline-none transition placeholder:text-text-soft focus:border-brand focus:ring-2 focus:ring-brand-ring disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-soft',
          error && 'border-danger focus:border-danger focus:ring-danger-soft',
          className,
        )}
        id={inputId}
        {...props}
      />
      {description ? (
        <span
          className={cn('text-xs font-normal text-text-soft', error && 'text-danger')}
          id={descriptionId}
        >
          {description}
        </span>
      ) : null}
    </label>
  );
}
