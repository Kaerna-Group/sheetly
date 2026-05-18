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
    <label className="grid gap-2 text-sm font-medium text-zinc-700" htmlFor={inputId}>
      {label ? <span>{label}</span> : null}
      <input
        aria-describedby={description ? descriptionId : undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          'h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-brand focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500',
          error && 'border-danger focus:border-danger focus:ring-red-100',
          className,
        )}
        id={inputId}
        {...props}
      />
      {description ? (
        <span
          className={cn('text-xs font-normal text-zinc-500', error && 'text-danger')}
          id={descriptionId}
        >
          {description}
        </span>
      ) : null}
    </label>
  );
}
