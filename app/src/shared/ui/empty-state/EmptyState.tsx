import { Button } from '@shared/ui/button';
import { cn } from '@shared/lib/classnames/cn';

type EmptyStateProps = {
  actionLabel?: string;
  className?: string;
  description: string;
  onAction?: () => void;
  onSecondAction?: () => void;
  secondActionLabel?: string;
  title: string;
};

export function EmptyState({
  actionLabel,
  className,
  description,
  onAction,
  onSecondAction,
  secondActionLabel,
  title,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center',
        className,
      )}
    >
      <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600">{description}</p>
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
