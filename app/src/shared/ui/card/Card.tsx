import type { HTMLAttributes } from 'react';

import { cn } from '@shared/lib/classnames/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-lg border border-zinc-200 bg-white p-5 shadow-sm', className)}
      {...props}
    />
  );
}
