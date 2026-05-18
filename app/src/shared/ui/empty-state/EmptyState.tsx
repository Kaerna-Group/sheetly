import { Button } from '@shared/ui/button';
import { cn } from '@shared/lib/classnames/cn';

type EmptyStateProps = {
  actionLabel?: string;
  className?: string;
  description: string;
  onAction?: () => void;
  title: string;
};

export function EmptyState({
  actionLabel,
  className,
  description,
  onAction,
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
        <Button className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
