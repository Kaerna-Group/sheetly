import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { routePaths } from '@app/routes/route-paths';
import { ConnectSpreadsheetModal } from '@features/connect-spreadsheet';
import { Button } from '@shared/ui/button';
import { Card } from '@shared/ui/card';
import { PageHeader } from '@shared/ui/page-header';

export function SetupPage() {
  const navigate = useNavigate();
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-4">
      <Card className="w-full max-w-xl">
        <PageHeader
          description="Sheetly stores finance data in your own Google Sheet. Paste a spreadsheet link to create the local connection; Google authorization comes in the next milestone."
          title="Connect your spreadsheet"
        />
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
