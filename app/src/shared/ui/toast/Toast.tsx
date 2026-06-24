import { cn } from '@shared/lib/classnames/cn';

export type ToastVariant = 'info' | 'success' | 'error';

type ToastProps = {
  message: string;
  title?: string;
  variant?: ToastVariant;
};

const variantClasses: Record<ToastVariant, string> = {
  error: 'border-danger/20 bg-danger-soft text-danger',
  info: 'border-info/20 bg-info-soft text-info',
  success: 'border-success/20 bg-success-soft text-success',
};

export function Toast({ message, title, variant = 'info' }: ToastProps) {
  return (
    <div className={cn('rounded-lg border p-4 text-sm shadow-sm', variantClasses[variant])}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <p className="opacity-80">{message}</p>
    </div>
  );
}
