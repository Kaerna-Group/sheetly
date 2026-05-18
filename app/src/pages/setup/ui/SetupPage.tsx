import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { routePaths } from '@app/routes/route-paths';
import { ConnectSpreadsheetModal } from '@features/connect-spreadsheet';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';

export function SetupPage() {
  const navigate = useNavigate();
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand">Sheetly setup</p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-950">Connect your spreadsheet</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Sheetly stores finance data in your own Google Sheet. Paste a spreadsheet link to create
          the local connection; Google authorization comes in the next milestone.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={() => setIsConnectOpen(true)}>Connect spreadsheet</Button>
          <Button onClick={() => navigate(routePaths.settings)} variant="ghost">
            Open settings
          </Button>
        </div>
      </Card>
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
