import { Navigate, Route, Routes } from 'react-router-dom';

import { DashboardPage } from '@pages/dashboard';
import { SettingsPage } from '@pages/settings';
import { SetupPage } from '@pages/setup';
import { localStorageService } from '@shared/lib/storage/local-storage.service';

import { routePaths } from './route-paths';

function HomeRoute() {
  const spreadsheetId = localStorageService.get('spreadsheetId');

  if (!spreadsheetId) {
    return <Navigate to={routePaths.setup} replace />;
  }

  return <DashboardPage />;
}

export function AppRouter() {
  return (
    <Routes>
      <Route path={routePaths.home} element={<HomeRoute />} />
      <Route path={routePaths.setup} element={<SetupPage />} />
      <Route path={routePaths.settings} element={<SettingsPage />} />
      <Route path="*" element={<Navigate to={routePaths.home} replace />} />
    </Routes>
  );
}
