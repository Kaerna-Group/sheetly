import { useContext } from 'react';

import { GoogleAuthContext } from './google-auth.context';

export function useGoogleAuth() {
  const state = useContext(GoogleAuthContext);

  if (!state) {
    throw new Error('useGoogleAuth must be used inside GoogleAuthProvider.');
  }

  return state;
}
