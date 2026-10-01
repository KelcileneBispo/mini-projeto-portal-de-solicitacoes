type FeedbackBannerProps = {
  message: string;
};

export function FeedbackBanner({ message }: FeedbackBannerProps) {
  return (
    <p
      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
      role="status"
    >
      {message}
    </p>
  );
}

export function ActionError({ message }: FeedbackBannerProps) {
  return (
    <p
      className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
      role="alert"
    >
      {message}
    </p>
  );
}
