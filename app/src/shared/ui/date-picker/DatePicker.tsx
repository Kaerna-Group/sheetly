import { useEffect, useId, useRef, useState } from 'react';

import { cn } from '@shared/lib/classnames/cn';

type DatePickerProps = {
  error?: string;
  hint?: string;
  id?: string;
  label?: string;
  onChange: (value: string) => void;
  value: string;
};

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplay(value: string): string {
  if (!value) return '';
  const [year, month, day] = value.split('-');
  return `${day}.${month}.${year}`;
}

export function DatePicker({ error, hint, id, label, onChange, value }: DatePickerProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const description = error ?? hint;

  const [isOpen, setIsOpen] = useState(false);

  const today = new Date();
  const initialDate = value ? new Date(`${value}T00:00:00`) : today;
  const [viewDate, setViewDate] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1),
  );

  const containerRef = useRef<HTMLDivElement>(null);

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

  function moveMonth(direction: -1 | 1) {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + direction, 1));
  }

  const firstWeekday = (viewDate.getDay() + 6) % 7;
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const todayStr = toDateString(today);

  return (
    <div className="relative grid gap-2 text-sm font-medium text-text-muted" ref={containerRef}>
      {label ? <span id={`${inputId}-label`}>{label}</span> : null}

      <button
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        aria-labelledby={label ? `${inputId}-label` : undefined}
        className={cn(
          'flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 text-left text-sm outline-none transition hover:border-border-strong focus:border-brand focus:ring-2 focus:ring-brand-ring',
          value ? 'text-text' : 'text-text-soft',
          error && 'border-danger focus:border-danger focus:ring-danger-soft',
        )}
        id={inputId}
        onClick={() => setIsOpen((o) => !o)}
        type="button"
      >
        <span>{value ? formatDisplay(value) : 'dd.mm.yyyy'}</span>
        <CalendarIcon />
      </button>

      {description ? (
        <span className={cn('text-xs font-normal text-text-soft', error && 'text-danger')}>
          {description}
        </span>
      ) : null}

      {isOpen ? (
        <div
          className="absolute left-0 top-full z-50 mt-1.5 w-[min(18rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
          role="dialog"
        >
          <div className="flex items-center justify-between px-3 py-2.5">
            <button
              className="flex size-7 items-center justify-center rounded-md text-text-soft transition hover:bg-surface-hover hover:text-text-muted"
              onClick={() => moveMonth(-1)}
              type="button"
            >
              <ChevronLeftIcon />
            </button>
            <span className="text-sm font-semibold text-text">
              {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              className="flex size-7 items-center justify-center rounded-md text-text-soft transition hover:bg-surface-hover hover:text-text-muted"
              onClick={() => moveMonth(1)}
              type="button"
            >
              <ChevronRightIcon />
            </button>
          </div>

          <div className="px-3 pb-2">
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((day) => (
                <div className="py-1 text-center text-xs font-medium text-text-soft" key={day}>
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstWeekday }, (_, i) => (
                <span key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = toDateString(
                  new Date(viewDate.getFullYear(), viewDate.getMonth(), day),
                );
                const isSelected = dateStr === value;
                const isToday = dateStr === todayStr;

                return (
                  <button
                    className={cn(
                      'flex h-8 w-full items-center justify-center rounded-lg text-sm transition',
                      isSelected
                        ? 'bg-brand font-semibold text-text-inverted'
                        : isToday
                          ? 'border border-brand font-semibold text-brand hover:bg-brand-soft'
                          : 'text-text-muted hover:bg-surface-hover hover:text-text',
                    )}
                    key={day}
                    onClick={() => {
                      onChange(dateStr);
                      setIsOpen(false);
                    }}
                    type="button"
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-2.5">
            <button
              className="text-xs font-medium text-text-soft transition hover:text-danger"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              type="button"
            >
              Clear
            </button>
            <button
              className="text-xs font-medium text-brand transition hover:text-brand-hover"
              onClick={() => {
                const t = new Date();
                setViewDate(new Date(t.getFullYear(), t.getMonth(), 1));
                onChange(toDateString(t));
                setIsOpen(false);
              }}
              type="button"
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0 text-text-soft"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      viewBox="0 0 24 24"
    >
      <path
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="M15.75 19.5 8.25 12l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path d="m8.25 4.5 7.5 7.5-7.5 7.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
