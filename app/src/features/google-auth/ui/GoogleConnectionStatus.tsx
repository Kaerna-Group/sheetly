import { Badge } from '@shared/ui/badge';

import type { GoogleAuthState } from '../types/google-auth-state.type';

type GoogleConnectionStatusProps = {
  status: GoogleAuthState['status'];
};

export function GoogleConnectionStatus({ status }: GoogleConnectionStatusProps) {
  const labelByStatus: Record<GoogleAuthState['status'], string> = {
    connected: 'Google connected',
    error: 'Google error',
    idle: 'Google not connected',
    loading: 'Google connecting',
  };
  const variantByStatus: Record<
    GoogleAuthState['status'],
    'danger' | 'info' | 'neutral' | 'success'
  > = {
    connected: 'success',
    error: 'danger',
    idle: 'neutral',
    loading: 'info',
  };

  return <Badge variant={variantByStatus[status]}>{labelByStatus[status]}</Badge>;
}
