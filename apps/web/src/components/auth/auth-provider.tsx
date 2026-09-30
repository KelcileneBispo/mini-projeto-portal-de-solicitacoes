'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { apiGet, setUnauthorizedHandler } from '@/lib/api/client';
import { endSession, startSession } from '@/lib/auth/session';
import { getToken } from '@/lib/auth/token-storage';
import type { LoginRequest, User } from '@/types/api';

const CURRENT_USER_QUERY = ['auth', 'me'] as const;

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSessionError: boolean;
  login: (input: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  retrySession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isClient = useIsClient();
  const [, refreshSession] = useState(0);
  const token = isClient ? getToken() : null;
  const currentUser = useQuery({
    queryKey: CURRENT_USER_QUERY,
    queryFn: () => apiGet<User>('/auth/me'),
    enabled: Boolean(token),
    retry: false,
  });

  useEffect(() => {
    setUnauthorizedHandler(() => {
      queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY });
      refreshSession((version) => version + 1);
      router.replace('/login');
    });

    return () => setUnauthorizedHandler(null);
  }, [queryClient, router]);

  const user = token ? (currentUser.data ?? null) : null;
  const isLoading = !isClient || (Boolean(token) && currentUser.isPending);
  const hasSessionError = Boolean(token) && currentUser.isError;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      hasSessionError,
      login: async (input) => {
        const authenticatedUser = await startSession(input);
        queryClient.setQueryData(CURRENT_USER_QUERY, authenticatedUser);
        refreshSession((version) => version + 1);
        router.replace('/');
      },
      logout: async () => {
        await endSession();
        queryClient.removeQueries({ queryKey: CURRENT_USER_QUERY });
        refreshSession((version) => version + 1);
        router.replace('/login');
      },
      retrySession: async () => {
        await currentUser.refetch();
      },
    }),
    [currentUser, hasSessionError, isLoading, queryClient, router, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}

function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
