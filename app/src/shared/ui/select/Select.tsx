import type { SelectHTMLAttributes } from 'react';

import { cn } from '@shared/lib/classnames/cn';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export function Select({ children, className, id, label, ...props }: SelectProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-700" htmlFor={id}>
      {label ? <span>{label}</span> : null}
      <select
        className={cn(
          'h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-indigo-100',
          className,
        )}
        id={id}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}
