import { cn } from '@shared/lib/classnames/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-indigo-500 focus-visible:outline-brand',
  secondary: 'bg-zinc-900 text-white hover:bg-zinc-700 focus-visible:outline-zinc-900',
  ghost: 'bg-transparent text-zinc-700 hover:bg-zinc-100 focus-visible:outline-zinc-400',
  danger: 'bg-danger text-white hover:bg-red-500 focus-visible:outline-danger',
};

export function getButtonClasses(variant: ButtonVariant, className?: string) {
  return cn(
    'inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
    variantClasses[variant],
    className,
  );
}
