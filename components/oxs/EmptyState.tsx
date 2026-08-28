type EmptyStateProps = {
  title?: string;
  message?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title = "No results",
  message = "Nothing to display.",
  action,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-white/5 bg-[#13202a] px-4 py-6 text-center">
      <div className="text-sm font-black text-white">{title}</div>
      <div className="mt-1 text-sm text-slate-400">{message}</div>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}
