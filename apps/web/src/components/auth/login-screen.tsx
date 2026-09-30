'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LoginForm } from './login-form';
import { SessionStatus } from './session-status';
import { useAuth } from './auth-provider';

export function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) {
    return <SessionStatus label="Verificando sessão..." />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-8">
        <p className="text-sm font-medium text-slate-500">Portal interno</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Portal de Solicitações Internas
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Entre com seu usuário para acessar o portal.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
