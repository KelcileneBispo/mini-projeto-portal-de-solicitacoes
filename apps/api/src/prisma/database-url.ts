export function readDatabaseUrl(): string {
  const rawUrl = process.env.DATABASE_URL?.trim() ?? '';

  if (!rawUrl) {
    throw new Error(
      'DATABASE_URL não está definida. Defina a variável de ambiente antes de iniciar a API.',
    );
  }

  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(
      'DATABASE_URL é inválida. Corrija a variável de ambiente antes de iniciar a API.',
    );
  }

  url.searchParams.delete('schema');
  return url.toString();
}
