'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRightIcon } from '@/components/icons';
import { SessionStatus } from './session-status';
import { useAuth } from './auth-provider';

type AuthenticatedShellProps = {
  children: ReactNode;
};

export function AuthenticatedShell({ children }: AuthenticatedShellProps) {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    hasSessionError,
    logout,
    retrySession,
  } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoading && !hasSessionError && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hasSessionError, isAuthenticated, isLoading, router]);

  if (isLoading || (!hasSessionError && (!isAuthenticated || !user))) {
    return <SessionStatus label="Verificando sessão..." />;
  }

  if (hasSessionError || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md text-center">
          <p className="text-sm text-slate-700" role="alert">
            Não foi possível verificar a sessão.
          </p>
          <button
            type="button"
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white outline-none hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            onClick={() => {
              void retrySession();
            }}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Portal interno</p>
            <p className="text-lg font-semibold text-slate-900">
              Portal de Solicitações Internas
            </p>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <div className="min-w-0 text-sm">
              <p className="truncate font-medium text-slate-900">{user.name}</p>
              <p className="truncate text-slate-500">{user.username}</p>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={isLoggingOut}
              onClick={() => {
                setIsLoggingOut(true);
                void logout().finally(() => setIsLoggingOut(false));
              }}
            >
              {isLoggingOut ? 'Saindo...' : 'Sair'}
              <ArrowRightIcon />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
