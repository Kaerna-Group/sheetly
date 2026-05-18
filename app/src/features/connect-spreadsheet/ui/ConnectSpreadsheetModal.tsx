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
    <Modal isOpen={isOpen} onClose={onClose} title="Connect spreadsheet">
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          connect(spreadsheetUrl);
        }}
      >
        <Input
          id="spreadsheet-url"
          label="Google Sheets URL"
          onChange={(event) => setSpreadsheetUrl(event.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value={spreadsheetUrl}
        />
        {error ? <p className="text-sm text-danger">{error}</p> : null}
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
