import type { HTMLAttributes } from 'react';

import { cn } from '@shared/lib/classnames/cn';

const base = 'transition-[transform,box-shadow,border-color] duration-200';

const variants = {
  default: 'rounded-2xl border border-border bg-surface p-5 shadow-sm',
  elevated: 'rounded-2xl border border-border bg-surface p-6 shadow-xl shadow-black/5',
  metric:
    'rounded-2xl border border-border bg-gradient-to-br from-surface to-surface-muted p-5 shadow-sm',
  glass: 'rounded-2xl border border-border/20 bg-surface/80 p-5 shadow-xl backdrop-blur-md',
  danger: 'rounded-2xl border border-danger/30 bg-danger-soft p-5 shadow-sm',
} as const;

type CardVariant = keyof typeof variants;

type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
};

export function Card({ className, variant = 'default', ...props }: CardProps) {
  return <div className={cn(base, variants[variant], className)} {...props} />;
}
