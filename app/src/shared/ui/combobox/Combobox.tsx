import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { cn } from '@shared/lib/classnames/cn';

import {
  buildComboboxOptions,
  type ComboboxItem,
  type ComboboxOption,
} from './build-combobox-options';

type ComboboxProps<TItem extends ComboboxItem> = {
  disabled?: boolean;
  emptyLabel?: string;
  error?: string;
  getCreateLabel?: (value: string) => string;
  hint?: string;
  items: TItem[];
  label: string;
  onCreate?: (value: string) => void | Promise<void>;
  onSelect: (item: TItem) => void;
  placeholder?: string;
  value?: TItem | null;
};

export function Combobox<TItem extends ComboboxItem>({
  disabled = false,
  emptyLabel = 'No options',
  error,
  getCreateLabel,
  hint,
  items,
  label,
  onCreate,
  onSelect,
  placeholder,
  value,
}: ComboboxProps<TItem>) {
  const generatedId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState(value?.label ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const options = useMemo(
    () => buildComboboxOptions({ getCreateLabel, inputValue, items }),
    [getCreateLabel, inputValue, items],
  );
  const description = error ?? hint;
  const descriptionId = `${generatedId}-description`;
  const listboxId = `${generatedId}-listbox`;

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  async function chooseOption(option: ComboboxOption | undefined) {
    if (!option) {
      return;
    }

    if (option.kind === 'item') {
      onSelect(option.item as TItem);
      setInputValue(option.item.label);
      setIsOpen(false);
      return;
    }

    if (onCreate) {
      await onCreate(option.inputValue);
      setInputValue(option.inputValue);
      setIsOpen(false);
    }
  }

  return (
    <div className="relative grid gap-2 text-sm font-medium text-zinc-700" ref={rootRef}>
      <label htmlFor={generatedId}>{label}</label>
      <input
        aria-activedescendant={
          isOpen && options[activeIndex] ? `${generatedId}-option-${activeIndex}` : undefined
        }
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-describedby={description ? descriptionId : undefined}
        aria-expanded={isOpen}
        aria-invalid={Boolean(error)}
        className={cn(
          'h-10 rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-brand focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500',
          error && 'border-danger focus:border-danger focus:ring-red-100',
        )}
        disabled={disabled}
        id={generatedId}
        onChange={(event) => {
          setInputValue(event.target.value);
          setActiveIndex(0);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setIsOpen(true);
            setActiveIndex((currentIndex) =>
              options.length ? Math.min(currentIndex + 1, options.length - 1) : 0,
            );
          }

          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((currentIndex) => Math.max(currentIndex - 1, 0));
          }

          if (event.key === 'Enter') {
            event.preventDefault();
            void chooseOption(options[activeIndex]);
          }

          if (event.key === 'Escape') {
            setIsOpen(false);
          }
        }}
        placeholder={placeholder}
        role="combobox"
        value={inputValue}
      />
      {description ? (
        <span
          className={cn('text-xs font-normal text-zinc-500', error && 'text-danger')}
          id={descriptionId}
        >
          {description}
        </span>
      ) : null}
      {isOpen ? (
        <div
          className="absolute top-full z-40 mt-1 max-h-60 w-full overflow-auto rounded-md border border-zinc-200 bg-white p-1 shadow-lg"
          id={listboxId}
          role="listbox"
        >
          {options.length ? (
            options.map((option, index) => (
              <button
                className={cn(
                  'flex w-full items-center rounded px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100',
                  index === activeIndex && 'bg-zinc-100',
                  option.kind === 'create' && 'font-medium text-brand',
                )}
                id={`${generatedId}-option-${index}`}
                key={option.kind === 'item' ? option.item.id : option.id}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  void chooseOption(option);
                }}
                role="option"
                type="button"
              >
                {option.kind === 'item' ? option.item.label : option.label}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-zinc-500">{emptyLabel}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
