import { Badge } from '@shared/ui/badge';
import { Button } from '@shared/ui/button';

import { useSetupSpreadsheet } from '../model/useSetupSpreadsheet';

export function SetupSpreadsheetButton() {
  const { error, runSetup, status } = useSetupSpreadsheet();
  const isBusy = status === 'checking' || status === 'setting-up';

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold text-zinc-950">Spreadsheet template</h2>
          <Badge
            variant={status === 'ready' ? 'success' : status === 'error' ? 'danger' : 'neutral'}
          >
            {status === 'ready' ? 'Ready' : status === 'error' ? 'Needs attention' : 'Not checked'}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-zinc-600">
          Create required sheets, headers, default categories and template version.
        </p>
        {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
      </div>
      <Button isLoading={isBusy} onClick={() => void runSetup()} variant="secondary">
        Setup spreadsheet template
      </Button>
    </div>
  );
}
