import { cn } from '@shared/lib/classnames/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-indigo-500 focus-visible:outline-brand',
  secondary: 'bg-zinc-900 text-white hover:bg-zinc-700 focus-visible:outline-zinc-900',
  ghost: 'bg-transparent text-zinc-700 hover:bg-zinc-100 focus-visible:outline-zinc-400',
  danger: 'bg-danger text-white hover:bg-red-500 focus-visible:outline-danger',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
};

export function getButtonClasses(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    variantClasses[variant],
    sizeClasses[size],
    className,
  );
}
