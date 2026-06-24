import type { ReactNode } from 'react';
import { useEffect, useId } from 'react';

import { Button } from '@shared/ui/button';

type ModalProps = {
  children: ReactNode;
  description?: string;
  footer?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function Modal({ children, description, footer, isOpen, onClose, title }: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-end bg-zinc-950/40 p-0 sm:place-items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        aria-describedby={description ? descriptionId : undefined}
        aria-labelledby={titleId}
        aria-modal="true"
        className="max-h-[92vh] w-full overflow-y-auto rounded-t-lg bg-white shadow-xl sm:max-w-lg sm:rounded-lg"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-3 border-b border-zinc-200 p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950" id={titleId}>
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-zinc-600" id={descriptionId}>
                {description}
              </p>
            ) : null}
          </div>
          <Button aria-label="Close modal" onClick={onClose} size="sm" variant="ghost">
            X
          </Button>
        </header>
        <div className="p-4 sm:p-5">{children}</div>
        {footer ? <footer className="border-t border-zinc-200 p-4 sm:p-5">{footer}</footer> : null}
      </section>
    </div>
  );
}
