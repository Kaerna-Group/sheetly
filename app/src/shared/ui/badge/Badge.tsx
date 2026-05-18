import type { HTMLAttributes } from 'react';

import { cn } from '@shared/lib/classnames/cn';

export type BadgeVariant = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  danger: 'bg-red-50 text-red-700 ring-red-200',
  info: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  neutral: 'bg-zinc-100 text-zinc-700 ring-zinc-200',
  success: 'bg-green-50 text-green-700 ring-green-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
};

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
