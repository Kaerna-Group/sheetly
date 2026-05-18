type ToastProps = {
  message: string;
  title?: string;
};

export function Toast({ message, title }: ToastProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 text-sm shadow-sm">
      {title ? <p className="font-semibold text-zinc-950">{title}</p> : null}
      <p className="text-zinc-600">{message}</p>
    </div>
  );
}
