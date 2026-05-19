import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { appConfig } from '@app/config/app-config';
import { routePaths } from '@app/routes/route-paths';
import { useOfflineSyncStatus } from '@features/manage-transactions';
import { Badge } from '@shared/ui/badge';

type AppLayoutProps = {
  actions?: ReactNode;
  children: ReactNode;
};

export function AppLayout({ actions, children }: AppLayoutProps) {
  const { status } = useOfflineSyncStatus();
  const syncBadge = status.isOnline
    ? status.failed
      ? { label: `${status.failed} failed`, variant: 'danger' as const }
      : status.pending
        ? { label: `${status.pending} pending`, variant: 'warning' as const }
        : { label: 'Synced', variant: 'success' as const }
    : { label: 'Offline', variant: 'warning' as const };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              {appConfig.name}
            </p>
            <p className="text-sm text-zinc-600">{appConfig.description}</p>
          </div>
          <nav className="flex items-center gap-2 text-sm">
            <Badge variant={syncBadge.variant}>{syncBadge.label}</Badge>
            <NavLink
              className="rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100"
              to={routePaths.home}
            >
              Dashboard
            </NavLink>
            <NavLink
              className="rounded-md px-3 py-2 text-zinc-700 hover:bg-zinc-100"
              to={routePaths.settings}
            >
              Settings
            </NavLink>
            {actions}
          </nav>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6">{children}</main>
    </div>
  );
}
