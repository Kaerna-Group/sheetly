import type { HTMLAttributes } from 'react';

import { cn } from '@shared/lib/classnames/cn';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-zinc-200', className)}
      {...props}
    />
  );
}
