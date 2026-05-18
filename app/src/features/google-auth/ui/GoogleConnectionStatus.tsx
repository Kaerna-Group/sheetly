import { Badge } from '@shared/ui/badge';

import type { GoogleAuthState } from '../types/google-auth-state.type';

type GoogleConnectionStatusProps = {
  status: GoogleAuthState['status'];
};

export function GoogleConnectionStatus({ status }: GoogleConnectionStatusProps) {
  const label = status === 'connected' ? 'Google connected' : 'Google not connected';
  const variant = status === 'connected' ? 'success' : 'neutral';

  return <Badge variant={variant}>{label}</Badge>;
}
