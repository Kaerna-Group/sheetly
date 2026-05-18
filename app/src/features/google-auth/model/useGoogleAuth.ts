import { useState } from 'react';

import type { GoogleAuthState } from '../types/google-auth-state.type';

export function useGoogleAuth() {
  const [state] = useState<GoogleAuthState>({
    accessToken: null,
    status: 'idle',
  });

  return state;
}
