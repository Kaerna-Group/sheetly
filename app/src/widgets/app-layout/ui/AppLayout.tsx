import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { appConfig } from '@app/config/app-config';
import { routePaths } from '@app/routes/route-paths';

type AppLayoutProps = {
  actions?: ReactNode;
  children: ReactNode;
  title: string;
};

export function AppLayout({ actions, children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">
              {appConfig.name}
            </p>
            <h1 className="text-xl font-semibold text-zinc-950">{title}</h1>
          </div>
          <nav className="flex items-center gap-2 text-sm">
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
