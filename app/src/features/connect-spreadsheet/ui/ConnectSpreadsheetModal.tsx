import { useState } from 'react';

import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Modal } from '@shared/ui/modal';

import { useConnectSpreadsheet } from '../model/useConnectSpreadsheet';

type ConnectSpreadsheetModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ConnectSpreadsheetModal({ isOpen, onClose }: ConnectSpreadsheetModalProps) {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const { connect, error } = useConnectSpreadsheet(onClose);

  return (
    <Modal
      description="Paste a Google Sheets URL or raw spreadsheet id. Sheetly stores only the id locally."
      isOpen={isOpen}
      onClose={onClose}
      title="Connect spreadsheet"
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          connect(spreadsheetUrl);
        }}
      >
        <Input
          error={error ?? undefined}
          hint="Google OAuth will be connected in the next milestone."
          id="spreadsheet-url"
          label="Google Sheets URL"
          onChange={(event) => setSpreadsheetUrl(event.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value={spreadsheetUrl}
        />
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button type="submit">Save connection</Button>
        </div>
      </form>
    </Modal>
  );
}
