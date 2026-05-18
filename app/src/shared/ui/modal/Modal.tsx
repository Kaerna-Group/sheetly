import type { ReactNode } from 'react';

import { Button } from '@shared/ui/button';

type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function Modal({ children, isOpen, onClose, title }: ModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/40 p-4">
      <section
        aria-modal="true"
        className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl"
        role="dialog"
      >
        <header className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-zinc-950">{title}</h2>
          <Button aria-label="Close modal" className="h-9 px-3" onClick={onClose} variant="ghost">
            x
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}
