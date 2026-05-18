import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { GoogleAuthProvider } from '@features/google-auth';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <GoogleAuthProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>{children}</BrowserRouter>
    </GoogleAuthProvider>
  );
}
