type LoadErrorProps = {
  message: string;
  onRetry: () => void;
};

export function LoadError({ message, onRetry }: LoadErrorProps) {
  return (
    <div
      className="rounded-xl border border-red-200 bg-white px-4 py-5"
      role="alert"
    >
      <p className="text-sm text-red-800">{message}</p>
      <button
        type="button"
        className="mt-4 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white outline-none hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        onClick={onRetry}
      >
        Tentar novamente
      </button>
    </div>
  );
}
