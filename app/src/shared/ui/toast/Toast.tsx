import { cn } from '@shared/lib/classnames/cn';

export type ToastVariant = 'info' | 'success' | 'error';

type ToastProps = {
  message: string;
  title?: string;
  variant?: ToastVariant;
};

const variantClasses: Record<ToastVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-900',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-950',
  success: 'border-green-200 bg-green-50 text-green-900',
};

export function Toast({ message, title, variant = 'info' }: ToastProps) {
  return (
    <div className={cn('rounded-lg border p-4 text-sm shadow-sm', variantClasses[variant])}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <p className="opacity-80">{message}</p>
    </div>
  );
}
