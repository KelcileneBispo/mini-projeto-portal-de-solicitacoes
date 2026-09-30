import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { NextConfig } from 'next';

loadApiUrl();

const nextConfig: NextConfig = {};

export default nextConfig;

function loadApiUrl(): void {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return;
  }

  for (const path of [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), '../../.env'),
  ]) {
    if (!existsSync(path)) {
      continue;
    }

    const line = readFileSync(path, 'utf8')
      .split('\n')
      .find((item) => item.startsWith('NEXT_PUBLIC_API_URL='));

    if (!line) {
      continue;
    }

    process.env.NEXT_PUBLIC_API_URL = line
      .slice('NEXT_PUBLIC_API_URL='.length)
      .trim()
      .replace(/^['"]|['"]$/g, '');
    return;
  }
}
