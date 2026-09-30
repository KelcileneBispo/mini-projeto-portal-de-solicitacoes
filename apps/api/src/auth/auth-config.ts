const DURATION_SECONDS: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3_600,
  d: 86_400,
};

export type JwtConfig = {
  secret: string;
  expiresInSeconds: number;
};

export function readJwtConfig(): JwtConfig {
  const secret = process.env.JWT_SECRET?.trim() ?? '';
  const expiresIn = process.env.JWT_EXPIRES_IN?.trim() ?? '';

  if (!secret) {
    throw new Error(
      'JWT_SECRET não está definida. Defina a variável de ambiente antes de iniciar a API.',
    );
  }

  if (!expiresIn) {
    throw new Error(
      'JWT_EXPIRES_IN não está definida. Defina a variável de ambiente antes de iniciar a API.',
    );
  }

  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  const amount = match ? Number(match[1]) : Number.NaN;
  const factor = match?.[2] ? DURATION_SECONDS[match[2]] : undefined;

  if (!factor || !Number.isSafeInteger(amount) || amount < 1) {
    throw new Error(
      'JWT_EXPIRES_IN é inválida. Use uma duração como 8h. A API não assume um prazo padrão.',
    );
  }

  return {
    secret,
    expiresInSeconds: amount * factor,
  };
}
