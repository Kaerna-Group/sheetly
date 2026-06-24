import { type ChangeEvent, useRef, useState } from 'react';

import { useTheme, type ThemeValue } from '@app/providers/theme-provider';
import { ConnectSpreadsheetModal } from '@features/connect-spreadsheet';
import { GoogleConnectButton, GoogleConnectionStatus, useGoogleAuth } from '@features/google-auth';
import { ManageContainersModal } from '@features/manage-containers';
import {
  createOfflineTransactionsStorage,
  useOfflineSyncStatus,
  useTransactions,
} from '@features/manage-transactions';
import { SetupSpreadsheetButton } from '@features/setup-spreadsheet';
import { AppLayout } from '@widgets/app-layout';
import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { cn } from '@shared/lib/classnames/cn';
import { ConfirmModal } from '@shared/ui/confirm-modal';
import { Input } from '@shared/ui/input';
import { localStorageService } from '@shared/lib/storage/local-storage.service';
import { PageHeader } from '@shared/ui/page-header';
import { Select } from '@shared/ui/select';
import { Toast } from '@shared/ui/toast';

// ---------- theme mini-previews (hardcoded colors — always show fixed appearance) ----------

function ThemeMiniPreview({ variant }: { variant: ThemeValue }) {
  if (variant === 'system') {
    return (
      <div
        style={{
          border: '1px solid #e4e4e7',
          borderRadius: 6,
          display: 'flex',
          height: 72,
          overflow: 'hidden',
        }}
      >
        <div style={{ backgroundColor: '#ffffff', flex: 1, padding: 8 }}>
          <div
            style={{
              backgroundColor: '#18181b',
              borderRadius: 2,
              height: 4,
              marginBottom: 4,
              width: '100%',
            }}
          />
          <div
            style={{
              backgroundColor: '#a1a1aa',
              borderRadius: 2,
              height: 3,
              marginBottom: 6,
              width: '65%',
            }}
          />
          <div style={{ backgroundColor: '#6366f1', borderRadius: 3, height: 9, width: 28 }} />
        </div>
        <div style={{ backgroundColor: '#e4e4e7', width: 1 }} />
        <div style={{ backgroundColor: '#111827', flex: 1, padding: 8 }}>
          <div
            style={{
              backgroundColor: '#f1f5f9',
              borderRadius: 2,
              height: 4,
              marginBottom: 4,
              width: '100%',
            }}
          />
          <div
            style={{
              backgroundColor: '#64748b',
              borderRadius: 2,
              height: 3,
              marginBottom: 6,
              width: '65%',
            }}
          />
          <div style={{ backgroundColor: '#818cf8', borderRadius: 3, height: 9, width: 28 }} />
        </div>
      </div>
    );
  }

  const isLight = variant === 'light';
  const c = {
    bg: isLight ? '#ffffff' : '#111827',
    border: isLight ? '#e4e4e7' : '#1e293b',
    brand: isLight ? '#6366f1' : '#818cf8',
    navBg: isLight ? '#f8fafc' : '#1f2937',
    navDot: isLight ? '#a1a1aa' : '#334155',
    text: isLight ? '#18181b' : '#f1f5f9',
    textMuted: isLight ? '#a1a1aa' : '#64748b',
  };

  return (
    <div
      style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 6,
        height: 72,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          backgroundColor: c.navBg,
          borderBottom: `1px solid ${c.border}`,
          display: 'flex',
          gap: 4,
          padding: '5px 8px',
        }}
      >
        <div style={{ backgroundColor: c.navDot, borderRadius: 2, height: 3, width: 20 }} />
        <div style={{ backgroundColor: c.navDot, borderRadius: 2, height: 3, width: 12 }} />
        <div style={{ backgroundColor: c.navDot, borderRadius: 2, height: 3, width: 12 }} />
      </div>
      <div style={{ padding: '6px 8px' }}>
        <div
          style={{
            backgroundColor: c.text,
            borderRadius: 2,
            height: 4,
            marginBottom: 4,
            width: '70%',
          }}
        />
        <div
          style={{
            backgroundColor: c.textMuted,
            borderRadius: 2,
            height: 3,
            marginBottom: 6,
            width: '50%',
          }}
        />
        <div style={{ backgroundColor: c.brand, borderRadius: 3, height: 9, width: 32 }} />
      </div>
    </div>
  );
}

type ThemeCardProps = {
  description: string;
  isActive: boolean;
  label: string;
  onClick: () => void;
  variant: ThemeValue;
};

function ThemeCard({ description, isActive, label, onClick, variant }: ThemeCardProps) {
  return (
    <button
      className={cn(
        'rounded-lg border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-brand',
        isActive
          ? 'border-brand bg-brand-soft ring-1 ring-brand'
          : 'border-border bg-surface hover:border-border-strong hover:bg-surface-hover',
      )}
      onClick={onClick}
      type="button"
    >
      <ThemeMiniPreview variant={variant} />
      <p className="mt-2 text-sm font-semibold text-text">{label}</p>
      <p className="mt-0.5 text-xs text-text-soft">{description}</p>
    </button>
  );
}

// ---------- page ----------

export function SettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setTheme, theme } = useTheme();
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [isContainersOpen, setIsContainersOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [containersEnabled, setContainersEnabled] = useState(
    localStorageService.get('containersEnabled') === 'true',
  );
  const [currency, setCurrency] = useState(localStorageService.get('currency') ?? 'UAH');
  const [language, setLanguage] = useState(localStorageService.get('language') ?? 'en');
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const spreadsheetId = localStorageService.get('spreadsheetId');
  const googleAuth = useGoogleAuth();
  const { refresh: refreshSyncStatus, status: syncStatus } = useOfflineSyncStatus(spreadsheetId);
  const { isSyncing, retrySync } = useTransactions();

  function toggleContainers(enabled: boolean) {
    setContainersEnabled(enabled);
    localStorageService.set('containersEnabled', String(enabled));
  }

  function updatePreference(key: 'currency' | 'language', value: string) {
    localStorageService.set(key, value);
    setSettingsMessage('Preferences saved locally.');
    if (key === 'currency') setCurrency(value);
    if (key === 'language') setLanguage(value);
  }

  function exportSettings() {
    const payload = {
      exportedAt: new Date().toISOString(),
      settings: localStorageService.exportKnownKeys(),
      version: 1,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
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

    if (!file) return;

    try {
      const payload = JSON.parse(await file.text()) as {
        settings?: ReturnType<typeof localStorageService.exportKnownKeys>;
      };

      if (!payload.settings) throw new Error('Invalid settings file.');

      localStorageService.importKnownKeys(payload.settings);
      setContainersEnabled(localStorageService.get('containersEnabled') === 'true');
      setCurrency(localStorageService.get('currency') ?? 'UAH');
      setLanguage(localStorageService.get('language') ?? 'en');
      setSettingsMessage('Settings imported. Reload the page if connection state looks stale.');
    } catch (error) {
      setSettingsMessage(error instanceof Error ? error.message : 'Could not import settings.');
    } finally {
      event.target.value = '';
    }
  }

  async function resetOfflineCache() {
    await createOfflineTransactionsStorage(spreadsheetId ?? '__unscoped__').resetOfflineData();
    await refreshSyncStatus();
    setIsResetOpen(false);
    setSettingsMessage('Offline cache and sync queues were reset.');
  }

  async function retryQueuedChanges() {
    await retrySync();
    await refreshSyncStatus();
  }

  async function clearFailedQueue() {
    await createOfflineTransactionsStorage(spreadsheetId ?? '__unscoped__').clearFailedQueue();
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
      <PageHeader description="Manage Sheetly preferences and connections." title="Settings" />
      {settingsMessage ? <Toast message={settingsMessage} variant="info" /> : null}

      {/* Appearance */}
      <Card>
        <h2 className="text-lg font-semibold text-text">Appearance</h2>
        <p className="mt-1 text-sm text-text-muted">Choose how Sheetly looks on this device.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ThemeCard
            description="White background, clean borders."
            isActive={theme === 'light'}
            label="Light"
            onClick={() => setTheme('light')}
            variant="light"
          />
          <ThemeCard
            description="Dark navy, reduced eye strain."
            isActive={theme === 'dark'}
            label="Dark"
            onClick={() => setTheme('dark')}
            variant="dark"
          />
          <ThemeCard
            description="Follows your OS preference."
            isActive={theme === 'system'}
            label="System"
            onClick={() => setTheme('system')}
            variant="system"
          />
        </div>
      </Card>

      {/* General */}
      <Card>
        <h2 className="text-lg font-semibold text-text">General</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Input
            hint="Fallback currency used in forms."
            id="default-currency"
            label="Default currency"
            maxLength={3}
            onChange={(event) => updatePreference('currency', event.target.value.toUpperCase())}
            value={currency}
          />
          <Select
            hint="Stored locally for upcoming localization."
            id="language"
            label="Language"
            onChange={(value) => updatePreference('language', value)}
            options={[
              { label: 'English', value: 'en' },
              { label: 'Russian', value: 'ru' },
              { label: 'Ukrainian', value: 'uk' },
            ]}
            value={language}
          />
        </div>
      </Card>

      {/* Spreadsheet */}
      <Card>
        <h2 className="text-lg font-semibold text-text">Spreadsheet</h2>
        <div className="mt-4 divide-y divide-border">
          <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-text">Connection</p>
                <Badge variant={spreadsheetId ? 'success' : 'warning'}>
                  {spreadsheetId ? 'Connected' : 'Not connected'}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {spreadsheetId
                  ? `Spreadsheet ID: ${spreadsheetId}`
                  : 'No spreadsheet connected yet.'}
              </p>
            </div>
            <Button onClick={() => setIsConnectOpen(true)} variant="secondary">
              Change
            </Button>
          </div>
          <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-text">Google authorization</p>
              <p className="mt-1 text-sm text-text-muted">
                {googleAuth.isConfigured
                  ? 'OAuth client ID configured. Tokens are kept in memory only.'
                  : 'Set VITE_GOOGLE_CLIENT_ID to enable Google authorization.'}
              </p>
              {googleAuth.error ? (
                <p className="mt-1 text-sm text-danger">{googleAuth.error}</p>
              ) : null}
            </div>
            <GoogleConnectButton />
          </div>
          <div className="pt-4">
            <SetupSpreadsheetButton />
          </div>
        </div>
      </Card>

      {/* Containers */}
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-text">Containers</h2>
              <Badge variant={containersEnabled ? 'success' : 'neutral'}>
                {containersEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-text-muted">
              Separate money stores for transactions. When enabled, every transaction requires one.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-text-muted">
              <input
                checked={containersEnabled}
                className="h-4 w-4 accent-brand"
                onChange={(event) => toggleContainers(event.target.checked)}
                type="checkbox"
              />
              Enable
            </label>
            <Button onClick={() => setIsContainersOpen(true)} variant="secondary">
              Manage containers
            </Button>
          </div>
        </div>
      </Card>

      {/* Data & Sync */}
      <Card>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text">Data &amp; Sync</h2>
            <p className="mt-1 text-sm text-text-muted">
              Export or import local preferences, and reset the browser cache when needed.
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

      {/* Advanced diagnostics — collapsible with mini sync summary when closed */}
      <div>
        <div className="overflow-hidden rounded-lg border border-border bg-surface">
          <button
            className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface-hover"
            onClick={() => setIsAdvancedOpen((prev) => !prev)}
            type="button"
          >
            <p className="text-sm font-semibold text-text">Advanced diagnostics</p>
            <span className="shrink-0 text-xs font-medium text-text-soft">
              {isAdvancedOpen ? 'Hide ↑' : 'Show ↓'}
            </span>
          </button>
          {!isAdvancedOpen ? (
            <div className="border-t border-border px-4 pb-4 pt-3">
              <div className="grid gap-1.5 text-sm">
                <div className="flex gap-2">
                  <span className="text-text-soft">Sync status:</span>
                  <span
                    className={cn(
                      syncStatus.failed > 0
                        ? 'text-danger'
                        : syncStatus.pending > 0
                          ? 'text-warning'
                          : 'text-success',
                    )}
                  >
                    {syncStatus.failed > 0
                      ? `${syncStatus.failed} failed`
                      : syncStatus.pending > 0
                        ? `${syncStatus.pending} pending`
                        : syncStatus.isOnline
                          ? 'Up to date'
                          : 'Offline'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-text-soft">Cached transactions:</span>
                  <span className="text-text">{syncStatus.cachedTransactions}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-text-soft">Pending changes:</span>
                  <span className="text-text">{syncStatus.totalQueued}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        {isAdvancedOpen ? (
          <Card className="mt-2">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-semibold text-text">Diagnostics</h3>
                <div className="mt-3 grid gap-2 text-sm text-text-muted">
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
              </div>
              <div className="rounded-md border border-border">
                <div className="flex flex-col gap-3 border-b border-border px-3 py-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-text">Queue inspector</h3>
                    <p className="text-sm text-text-soft">
                      Pending and failed changes waiting for Google Sheets sync.
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
                <div className="divide-y divide-border">
                  {syncStatus.queueItems.length ? (
                    syncStatus.queueItems.map((item) => (
                      <div className="grid gap-1 px-3 py-3 text-sm text-text-muted" key={item.id}>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={item.lastError ? 'danger' : 'warning'}>
                            {item.operation}
                          </Badge>
                          <span className="font-medium text-text">
                            {item.transaction?.categoryName ?? item.transactionId}
                          </span>
                          {item.transaction?.comment ? (
                            <span>{item.transaction.comment}</span>
                          ) : null}
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
                    <div className="px-3 py-4 text-sm text-text-soft">Queue is empty.</div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ) : null}
      </div>

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
