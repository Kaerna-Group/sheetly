import { cn } from '@shared/lib/classnames/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-text-inverted hover:bg-brand-hover focus-visible:outline-brand',
  secondary:
    'bg-surface-strong text-text-inverted hover:bg-surface-strong/80 focus-visible:outline-surface-strong',
  ghost:
    'bg-transparent text-text-muted hover:bg-surface-hover focus-visible:outline-border-strong',
  danger: 'bg-danger text-text-inverted hover:bg-danger-hover focus-visible:outline-danger',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

export function getButtonClasses(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}
