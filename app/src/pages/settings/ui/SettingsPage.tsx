import { type ChangeEvent, useRef, useState } from 'react';

import { ConnectSpreadsheetModal } from '@features/connect-spreadsheet';
import { GoogleConnectButton, GoogleConnectionStatus, useGoogleAuth } from '@features/google-auth';
import { ManageContainersModal } from '@features/manage-containers';
import {
  offlineTransactionsStorage,
  useOfflineSyncStatus,
  useTransactions,
} from '@features/manage-transactions';
import { SetupSpreadsheetButton } from '@features/setup-spreadsheet';
import { AppLayout } from '@widgets/app-layout';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { ConfirmModal } from '@shared/ui/confirm-modal';
import { Input } from '@shared/ui/input';
import { localStorageService } from '@shared/lib/storage/local-storage.service';
import { PageHeader } from '@shared/ui/page-header';
import { Select } from '@shared/ui/select';
import { Toast } from '@shared/ui/toast';

export function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isContainersOpen, setIsContainersOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [containersEnabled, setContainersEnabled] = useState(
    localStorageService.get('containersEnabled') === 'true',
  );
  const [currency, setCurrency] = useState(localStorageService.get('currency') ?? 'UAH');
  const [language, setLanguage] = useState(localStorageService.get('language') ?? 'en');
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [theme, setTheme] = useState(localStorageService.get('theme') ?? 'system');
  const spreadsheetId = localStorageService.get('spreadsheetId');
  const googleAuth = useGoogleAuth();
  const { refresh: refreshSyncStatus, status: syncStatus } = useOfflineSyncStatus();
  const { isSyncing, retrySync } = useTransactions();

  function toggleContainers(enabled: boolean) {
    setContainersEnabled(enabled);
    localStorageService.set('containersEnabled', String(enabled));
  }

  function updatePreference(key: 'currency' | 'language' | 'theme', value: string) {
    localStorageService.set(key, value);
    setSettingsMessage('Preferences saved locally.');

    if (key === 'currency') {
      setCurrency(value);
    }

    if (key === 'language') {
      setLanguage(value);
    }

    if (key === 'theme') {
      setTheme(value);
    }
  }

  function exportSettings() {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings: localStorageService.exportKnownKeys(),
      version: 1,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `sheetly-settings-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setSettingsMessage('Settings export created.');
  }

  async function importSettings(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const payload = JSON.parse(await file.text()) as {
        settings?: ReturnType<typeof localStorageService.exportKnownKeys>;
      };

      if (!payload.settings) {
        throw new Error('Invalid settings file.');
      }

      localStorageService.importKnownKeys(payload.settings);
      setContainersEnabled(localStorageService.get('containersEnabled') === 'true');
      setCurrency(localStorageService.get('currency') ?? 'UAH');
      setLanguage(localStorageService.get('language') ?? 'en');
      setTheme(localStorageService.get('theme') ?? 'system');
      setSettingsMessage('Settings imported. Reload the page if connection state looks stale.');
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : 'Could not import settings.');
    } finally {
      event.target.value = '';
    }
  }

  async function resetOfflineCache() {
    await offlineTransactionsStorage.resetOfflineData();
    await refreshSyncStatus();
    setIsResetOpen(false);
    setSettingsMessage('Offline cache and sync queues were reset.');
  }

  async function retryQueuedChanges() {
    await retrySync();
    await refreshSyncStatus();
  }

  async function clearFailedQueue() {
    await offlineTransactionsStorage.clearFailedQueue();
    await refreshSyncStatus();
    setSettingsMessage('Failed sync queue was cleared.');
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
      {settingsMessage ? <Toast message={settingsMessage} variant="info" /> : null}
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
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <Input
            hint="Used as the fallback currency in forms."
            id="default-currency"
            label="Default currency"
            maxLength={3}
            onChange={(event) => updatePreference('currency', event.target.value.toUpperCase())}
            value={currency}
          />
          <Select
            hint="Stored locally for upcoming localization polish."
            id="language"
            label="Language"
            onChange={(event) => updatePreference('language', event.target.value)}
            value={language}
          >
            <option value="en">English</option>
            <option value="ru">Russian</option>
            <option value="uk">Ukrainian</option>
          </Select>
          <Select
            hint="Theme wiring is prepared for the next UI polish pass."
            id="theme"
            label="Theme"
            onChange={(event) => updatePreference('theme', event.target.value)}
            value={theme}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </Select>
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Local data</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Export or import local Sheetly preferences, and reset only this browser cache when
              diagnostics look stale.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportSettings} variant="secondary">
              Export settings
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="secondary">
              Import settings
            </Button>
            <Button onClick={() => setIsResetOpen(true)} variant="danger">
              Reset cache
            </Button>
            <input
              accept="application/json"
              className="hidden"
              onChange={(event) => void importSettings(event)}
              ref={fileInputRef}
              type="file"
            />
          </div>
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-zinc-950">Diagnostics</h2>
            <div className="mt-3 grid gap-2 text-sm text-zinc-600">
              <p>Spreadsheet: {spreadsheetId ?? 'not connected'}</p>
              <p>Google: {googleAuth.status}</p>
              <p>Network: {syncStatus.isOnline ? 'online' : 'offline'}</p>
              <p>Cached transactions: {syncStatus.cachedTransactions}</p>
              <p>
                Queue: {syncStatus.pending} pending, {syncStatus.failed} failed
              </p>
              <p>Last sync: {syncStatus.lastSuccessfulSyncAt ?? 'never'}</p>
              {syncStatus.lastError ? (
                <p className="text-danger">Last sync error: {syncStatus.lastError}</p>
              ) : null}
            </div>
            <div className="mt-5 rounded-md border border-zinc-200">
              <div className="flex flex-col gap-3 border-b border-zinc-200 px-3 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-950">Queue inspector</h3>
                  <p className="text-sm text-zinc-500">
                    Pending and failed local changes waiting for Google Sheets sync.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={!syncStatus.totalQueued || isSyncing}
                    isLoading={isSyncing}
                    onClick={() => void retryQueuedChanges()}
                    size="sm"
                    variant="secondary"
                  >
                    Retry all
                  </Button>
                  <Button onClick={() => void refreshSyncStatus()} size="sm" variant="ghost">
                    Refresh queue
                  </Button>
                  <Button
                    disabled={!syncStatus.failed}
                    onClick={() => void clearFailedQueue()}
                    size="sm"
                    variant="danger"
                  >
                    Clear failed
                  </Button>
                </div>
              </div>
              <div className="divide-y divide-zinc-100">
                {syncStatus.queueItems.length ? (
                  syncStatus.queueItems.map((item) => (
                    <div className="grid gap-1 px-3 py-3 text-sm text-zinc-600" key={item.id}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={item.lastError ? 'danger' : 'warning'}>
                          {item.operation}
                        </Badge>
                        <span className="font-medium text-zinc-950">
                          {item.transaction?.categoryName ?? item.transactionId}
                        </span>
                        {item.transaction?.comment ? <span>{item.transaction.comment}</span> : null}
                      </div>
                      <p>
                        Attempts: {item.attempts} · Created: {item.createdAt}
                      </p>
                      {item.lastError ? (
                        <p className="text-danger">Last error: {item.lastError}</p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-4 text-sm text-zinc-500">Queue is empty.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
      <ConnectSpreadsheetModal isOpen={isConnectOpen} onClose={() => setIsConnectOpen(false)} />
      <ManageContainersModal isOpen={isContainersOpen} onClose={() => setIsContainersOpen(false)} />
      <ConfirmModal
        confirmLabel="Reset cache"
        description="This clears cached transactions and sync queues from this browser. Google Sheets data stays untouched."
        isOpen={isResetOpen}
        onClose={() => setIsResetOpen(false)}
        onConfirm={() => void resetOfflineCache()}
        title="Reset offline cache?"
      />
    </AppLayout>
  );
}
