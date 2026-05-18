import type { SelectHTMLAttributes } from 'react';
import { useId } from 'react';

import { cn } from '@shared/lib/classnames/cn';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string;
  hint?: string;
  label?: string;
};

export function Select({ children, className, error, hint, id, label, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const descriptionId = `${selectId}-description`;
  const description = error ?? hint;

  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-700" htmlFor={selectId}>
      {label ? <span>{label}</span> : null}
      <select
        aria-describedby={description ? descriptionId : undefined}
        aria-invalid={Boolean(error)}
        className={cn(
          'h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500',
          error && 'border-danger focus:border-danger focus:ring-red-100',
          className,
        )}
        id={selectId}
        {...props}
      >
        {children}
      </select>
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
