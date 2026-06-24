import type { ReactElement } from 'react';

import { Button } from '@shared/ui/button';
import { cn } from '@shared/lib/classnames/cn';

export type IllustrationKind = 'chart' | 'receipt' | 'spreadsheet' | 'sync' | 'wallet';

const illustrations: Record<IllustrationKind, ReactElement> = {
  chart: (
    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect height="14" rx="2" stroke="currentColor" strokeWidth="1.5" width="8" x="6" y="26" />
      <rect height="24" rx="2" stroke="currentColor" strokeWidth="1.5" width="8" x="20" y="16" />
      <rect height="20" rx="2" stroke="currentColor" strokeWidth="1.5" width="8" x="34" y="20" />
      <path d="M4 40h40" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  ),
  receipt: (
    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10 4h28a2 2 0 0 1 2 2v34l-5-3.5-5 3.5-5-3.5-5 3.5-5-3.5-5 3.5V6a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path d="M16 16h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M16 24h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M16 32h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  ),
  spreadsheet: (
    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect height="36" rx="4" stroke="currentColor" strokeWidth="1.5" width="36" x="6" y="6" />
      <path d="M6 18h36" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 30h36" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 18v24" stroke="currentColor" strokeWidth="1.5" />
      <path d="M30 18v24" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  sync: (
    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M24 8a16 16 0 0 1 13.9 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M38 7l1.5 10-9.5 1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M24 40a16 16 0 0 1-13.9-8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <path
        d="M10 41l-1.5-10 9.5-1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  ),
  wallet: (
    <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <rect height="28" rx="4" stroke="currentColor" strokeWidth="1.5" width="38" x="5" y="14" />
      <path d="M5 22h38" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 18V11a4 4 0 0 1 4-4h26"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
      <circle cx="35" cy="33" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
};

type EmptyStateProps = {
  actionLabel?: string;
  className?: string;
  description: string;
  illustration?: IllustrationKind;
  onAction?: () => void;
  onSecondAction?: () => void;
  secondActionLabel?: string;
  title: string;
};

export function EmptyState({
  actionLabel,
  className,
  description,
  illustration,
  onAction,
  onSecondAction,
  secondActionLabel,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-dashed border-border-strong bg-surface p-8 text-center',
        className,
      )}
    >
      {illustration ? (
        <div className="mb-4 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted p-3 text-text-soft">
            {illustrations[illustration]}
          </div>
        </div>
      ) : null}
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-5 flex justify-center gap-2">
          <Button onClick={onAction}>{actionLabel}</Button>
          {secondActionLabel && onSecondAction ? (
            <Button onClick={onSecondAction} variant="secondary">
              {secondActionLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
