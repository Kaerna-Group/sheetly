import { useState } from 'react';

import { ConnectSpreadsheetModal } from '@features/connect-spreadsheet';
import { GoogleConnectButton, GoogleConnectionStatus, useGoogleAuth } from '@features/google-auth';
import { ManageContainersModal } from '@features/manage-containers';
import { SetupSpreadsheetButton } from '@features/setup-spreadsheet';
import { AppLayout } from '@widgets/app-layout';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { localStorageService } from '@shared/lib/storage/local-storage.service';
import { PageHeader } from '@shared/ui/page-header';

export function SettingsPage() {
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isContainersOpen, setIsContainersOpen] = useState(false);
  const [containersEnabled, setContainersEnabled] = useState(
    localStorageService.get('containersEnabled') === 'true',
  );
  const spreadsheetId = localStorageService.get('spreadsheetId');
  const googleAuth = useGoogleAuth();

  function toggleContainers(enabled: boolean) {
    setContainersEnabled(enabled);
    localStorageService.set('containersEnabled', String(enabled));
  }

  return (
    <AppLayout
      actions={
        <>
          <GoogleConnectionStatus status={googleAuth.status} />
          <GoogleConnectButton />
        </>
      }
    >
      <PageHeader
        description="Manage Sheetly preferences and connections without leaving the main app shell."
        title="Settings"
      />
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-950">Spreadsheet connection</h2>
              <Badge variant={spreadsheetId ? 'success' : 'warning'}>
                {spreadsheetId ? 'Connected' : 'Not connected'}
              </Badge>
            </div>
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Google authorization</h2>
            <p className="mt-1 text-sm text-zinc-600">
              {googleAuth.isConfigured
                ? 'Google OAuth client id is configured. Access tokens are kept in memory only.'
                : 'Set VITE_GOOGLE_CLIENT_ID before using Google authorization.'}
            </p>
            {googleAuth.error ? (
              <p className="mt-2 text-sm text-danger">{googleAuth.error}</p>
            ) : null}
          </div>
          <GoogleConnectButton />
        </div>
      </Card>
      <Card>
        <SetupSpreadsheetButton />
      </Card>
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-zinc-950">Containers</h2>
              <Badge variant={containersEnabled ? 'success' : 'neutral'}>
                {containersEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              Containers are separate money stores used by transactions. When enabled, every new
              transaction requires one.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <input
                checked={containersEnabled}
                className="h-4 w-4 accent-brand"
                onChange={(event) => toggleContainers(event.target.checked)}
                type="checkbox"
              />
              Enable containers
            </label>
            <Button onClick={() => setIsContainersOpen(true)} variant="secondary">
              Manage containers
            </Button>
          </div>
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-semibold text-zinc-950">Preferences</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Theme, currency and language settings are reserved for the UX Polish milestone.
        </p>
      </Card>
      <ConnectSpreadsheetModal isOpen={isConnectOpen} onClose={() => setIsConnectOpen(false)} />
      <ManageContainersModal isOpen={isContainersOpen} onClose={() => setIsContainersOpen(false)} />
    </AppLayout>
  );
}
