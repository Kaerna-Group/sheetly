import { Button } from '@shared/ui/button';

import { useGoogleAuth } from '../model/useGoogleAuth';

export function GoogleConnectButton() {
  const googleAuth = useGoogleAuth();

  return (
    <Button
      disabled={!googleAuth.isConfigured}
      isLoading={googleAuth.status === 'loading'}
      onClick={() => {
        void googleAuth.requestAccessToken();
      }}
      title={
        googleAuth.isConfigured
          ? 'Connect Google'
          : 'Set VITE_GOOGLE_CLIENT_ID to enable Google authorization.'
      }
      variant="secondary"
    >
      {googleAuth.status === 'connected' ? 'Reconnect Google' : 'Connect Google'}
    </Button>
  );
}
