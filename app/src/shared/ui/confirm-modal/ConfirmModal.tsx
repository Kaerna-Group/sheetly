import { Button } from '@shared/ui/button';
import { Modal } from '@shared/ui/modal';

type ConfirmModalProps = {
  confirmLabel?: string;
  description: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
};

export function ConfirmModal({
  confirmLabel = 'Confirm',
  description,
  isOpen,
  onClose,
  onConfirm,
  title,
}: ConfirmModalProps) {
  return (
    <Modal description={description} isOpen={isOpen} onClose={onClose} title={title}>
      <div className="flex justify-end gap-2">
        <Button onClick={onClose} variant="ghost">
          Cancel
        </Button>
        <Button
          onClick={() => {
            void onConfirm();
          }}
          variant="danger"
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
