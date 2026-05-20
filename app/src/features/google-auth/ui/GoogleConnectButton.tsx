import { Button } from '@shared/ui/button';

import { useGoogleAuth } from '../model/useGoogleAuth';

export function GoogleConnectButton() {
  const googleAuth = useGoogleAuth();

  return (
    <Button
      disabled={!googleAuth.isConfigured}
      isLoading={googleAuth.status === 'loading' || googleAuth.status === 'restoring'}
      onClick={() => {
        void googleAuth.requestAccessToken({ mode: 'interactive' });
      }}
      title={
        googleAuth.isConfigured
          ? 'Connect Google'
          : 'Set VITE_GOOGLE_CLIENT_ID to enable Google authorization.'
      }
      variant="secondary"
    >
      {googleAuth.status === 'restoring'
        ? 'Restoring Google'
        : googleAuth.status === 'connected'
          ? 'Reconnect Google'
          : 'Connect Google'}
    </Button>
  );
}
