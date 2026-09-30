import type { Metadata } from 'next';
import { AuthProvider } from '@/components/auth/auth-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Portal de Solicitações Internas',
  description: 'Aplicação web do portal interno.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-100 font-sans text-slate-900 antialiased">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
