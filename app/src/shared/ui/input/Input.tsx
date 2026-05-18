import type { InputHTMLAttributes } from 'react';

import { cn } from '@shared/lib/classnames/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ className, id, label, ...props }: InputProps) {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-700" htmlFor={id}>
      {label ? <span>{label}</span> : null}
      <input
        className={cn(
          'h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-brand focus:ring-2 focus:ring-indigo-100',
          className,
        )}
        id={id}
        {...props}
      />
    </label>
  );
}
