import type { GoogleAuthState } from '../types/google-auth-state.type';

type GoogleConnectionStatusProps = {
  status: GoogleAuthState['status'];
};

export function GoogleConnectionStatus({ status }: GoogleConnectionStatusProps) {
  const label = status === 'connected' ? 'Google connected' : 'Google not connected';

  return <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700">{label}</span>;
}
