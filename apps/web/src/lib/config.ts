export function apiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!url) {
    throw new Error('NEXT_PUBLIC_API_URL não configurada.');
  }

  return url.replace(/\/$/, '');
}
