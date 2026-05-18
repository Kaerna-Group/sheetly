import { useState } from 'react';

import { ConnectSpreadsheetModal } from '@features/connect-spreadsheet';
import { AppLayout } from '@widgets/app-layout';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { localStorageService } from '@shared/lib/storage/local-storage.service';

export function SettingsPage() {
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const spreadsheetId = localStorageService.get('spreadsheetId');

  return (
    <AppLayout title="Settings">
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Spreadsheet connection</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {spreadsheetId
                ? `Current spreadsheet id: ${spreadsheetId}`
                : 'No spreadsheet is connected yet.'}
            </p>
          </div>
          <Button onClick={() => setIsConnectOpen(true)} variant="secondary">
            Change connection
          </Button>
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-zinc-950">Preferences</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Theme, currency and language settings are reserved for the UX Polish milestone.
        </p>
      </Card>
      <ConnectSpreadsheetModal isOpen={isConnectOpen} onClose={() => setIsConnectOpen(false)} />
    </AppLayout>
  );
}
