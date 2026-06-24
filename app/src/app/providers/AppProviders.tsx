import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { GoogleAuthProvider } from '@features/google-auth';
import { ThemeProvider } from './theme-provider';

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <GoogleAuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>{children}</BrowserRouter>
      </GoogleAuthProvider>
    </ThemeProvider>
  );
}
