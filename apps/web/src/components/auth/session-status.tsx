type SessionStatusProps = {
  label: string;
};

export function SessionStatus({ label }: SessionStatusProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      role="status"
    >
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
}
