type LoaderProps = {
  label?: string;
};

export function Loader({ label = 'Loading' }: LoaderProps) {
  return (
    <div className="flex items-center gap-3 text-sm text-text-muted">
      <span className="size-4 animate-spin rounded-full border-2 border-border border-t-brand" />
      <span>{label}</span>
    </div>
  );
}
