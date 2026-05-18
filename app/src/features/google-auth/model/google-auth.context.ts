import { createContext } from 'react';

import type { GoogleAuthState } from '../types/google-auth-state.type';

export const GoogleAuthContext = createContext<GoogleAuthState | null>(null);
