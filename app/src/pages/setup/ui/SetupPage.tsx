import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { routePaths } from '@app/routes/route-paths';
import { ConnectSpreadsheetModal } from '@features/connect-spreadsheet';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { cn } from '@shared/lib/classnames/cn';

const features = [
  'Your data stays in your own spreadsheet',
  'Works offline, syncs when online',
  'No subscription, no lock-in',
];

const mockTransactions = [
  { amount: '−850 UAH', cat: 'F', income: false, label: 'Food' },
  { amount: '+41 000 UAH', cat: 'S', income: true, label: 'Salary' },
  { amount: '−120 UAH', cat: 'T', income: false, label: 'Transport' },
];

export function SetupPage() {
  const navigate = useNavigate();
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  return (
    <main className="min-h-screen bg-app-bg lg:grid lg:grid-cols-2">
      {/* Left — branding */}
      <div className="relative flex flex-col justify-center overflow-hidden px-8 py-16 sm:px-12 lg:px-16">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-soft blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-success-soft blur-3xl opacity-50" />

        <div className="relative max-w-md">
          <div className="mb-10 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-text-inverted">
              S
            </div>
            <span className="text-base font-semibold text-text">Sheetly</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-text sm:text-4xl">
            Your clean finance tracker,{' '}
            <span className="text-brand">powered by Google&nbsp;Sheets.</span>
          </h1>

          <ul className="mt-8 space-y-3">
            {features.map((feature) => (
              <li className="flex items-center gap-3 text-sm text-text-muted" key={feature}>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success-soft text-xs text-success">
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>

          {/* Decorative dashboard preview */}
          <div className="mt-10 max-w-xs rounded-2xl border border-border bg-surface/90 p-4 shadow-xl backdrop-blur-sm">
            <div className="mb-3 rounded-xl border border-border bg-surface-muted/60 px-4 py-3">
              <p className="text-xs text-text-soft">Balance</p>
              <p className="mt-1 text-xl font-bold text-text">24 500 UAH</p>
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs text-success">
                ↑ Synced
              </span>
            </div>
            <div className="space-y-1">
              {mockTransactions.map((t) => (
                <div className="flex items-center gap-2.5 rounded-lg px-2 py-1.5" key={t.label}>
                  <div
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      t.income ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
                    )}
                  >
                    {t.cat}
                  </div>
                  <span className="flex-1 text-xs font-medium text-text">{t.label}</span>
                  <span
                    className={cn(
                      'text-xs font-semibold tabular-nums',
                      t.income ? 'text-success' : 'text-danger',
                    )}
                  >
                    {t.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right — connect card */}
      <div className="flex items-center justify-center bg-surface-muted/30 px-8 py-16 sm:px-12">
        <Card className="w-full max-w-md" variant="elevated">
          <h2 className="text-xl font-semibold text-text">Connect your spreadsheet</h2>
          <p className="mt-2 text-sm text-text-muted">
            Sheetly stores finance data in your own Google Sheet. Paste a spreadsheet link to create
            the local connection.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button className="w-full" onClick={() => setIsConnectOpen(true)}>
              Connect spreadsheet
            </Button>
            <Button
              className="w-full"
              onClick={() => navigate(routePaths.settings)}
              variant="ghost"
            >
              Open settings
            </Button>
          </div>
        </Card>
      </div>

      <ConnectSpreadsheetModal
        isOpen={isConnectOpen}
        onClose={() => {
          setIsConnectOpen(false);
          navigate(routePaths.home);
        }}
      />
    </main>
  );
}
