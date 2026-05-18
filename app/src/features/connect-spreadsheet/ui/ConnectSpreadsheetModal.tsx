import { useState } from 'react';

import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Modal } from '@shared/ui/modal';
import { Toast } from '@shared/ui/toast';

import { useConnectSpreadsheet } from '../model/useConnectSpreadsheet';

type ConnectSpreadsheetModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function ConnectSpreadsheetModal({ isOpen, onClose }: ConnectSpreadsheetModalProps) {
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const { connect, connection, error, isChecking } = useConnectSpreadsheet(onClose);
  const isNeedsAuth = connection.status === 'needs-auth';

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
          hint="Connect Google first to verify access immediately."
          id="spreadsheet-url"
          label="Google Sheets URL"
          onChange={(event) => setSpreadsheetUrl(event.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          value={spreadsheetUrl}
        />
        {isNeedsAuth ? (
          <Toast
            message="Spreadsheet id was saved locally. Connect Google to verify access and read data."
            title="Google authorization needed"
            variant="info"
          />
        ) : null}
        {connection.status === 'checking' ? <Badge variant="info">Checking access</Badge> : null}
        <div className="flex justify-end gap-2">
          <Button onClick={onClose} variant="ghost">
            Cancel
          </Button>
          <Button isLoading={isChecking} type="submit">
            Save connection
          </Button>
        </div>
      </form>
    </Modal>
  );
}
