import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '@shared/lib/classnames/cn';

export type SelectOption = {
  label: string;
  value: string;
};

type SelectProps = {
  disabled?: boolean;
  error?: string;
  hint?: string;
  id?: string;
  isLoading?: boolean;
  label?: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  value: string;
};

export function Select({
  disabled,
  error,
  hint,
  id,
  isLoading,
  label,
  onChange,
  options,
  value,
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const description = error ?? hint;

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative grid gap-2 text-sm font-medium text-text-muted" ref={containerRef}>
      {label ? <span id={`${selectId}-label`}>{label}</span> : null}

      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-invalid={Boolean(error)}
        aria-labelledby={label ? `${selectId}-label` : undefined}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-left text-sm text-text outline-none transition hover:border-border-strong focus:border-brand focus:ring-2 focus:ring-brand-ring',
          disabled && 'cursor-not-allowed bg-surface-muted text-text-soft hover:border-border',
          error && 'border-danger focus:border-danger focus:ring-danger-soft',
        )}
        disabled={disabled}
        onClick={() => setIsOpen((o) => !o)}
        type="button"
      >
        <span className="truncate">{selectedOption?.label ?? 'Select...'}</span>
        {isLoading ? (
          <SpinnerIcon className="size-4 shrink-0 animate-spin text-text-soft" />
        ) : (
          <ChevronDownIcon
            className={cn(
              'size-4 shrink-0 text-text-soft transition-transform duration-150',
              isOpen && 'rotate-180',
            )}
          />
        )}
      </button>

      {description ? (
        <span className={cn('text-xs font-normal text-text-soft', error && 'text-danger')}>
          {description}
        </span>
      ) : null}

      {isOpen && !disabled ? (
        <div
          className="absolute top-full z-50 mt-1.5 max-h-64 w-full min-w-max overflow-auto rounded-xl border border-border bg-surface p-1 shadow-xl"
          role="listbox"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                aria-selected={isSelected}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition',
                  isSelected
                    ? 'bg-brand-soft font-medium text-brand'
                    : 'text-text-muted hover:bg-surface-hover hover:text-text',
                )}
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                role="option"
                type="button"
              >
                <CheckIcon
                  className={cn('size-3.5 shrink-0', isSelected ? 'text-brand' : 'invisible')}
                />
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      viewBox="0 0 24 24"
    >
      <path d="m4.5 12.75 6 6 9-13.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12" strokeLinecap="round" />
    </svg>
  );
}
