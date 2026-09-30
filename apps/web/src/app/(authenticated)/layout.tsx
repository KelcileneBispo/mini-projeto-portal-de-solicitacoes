import type { ReactNode } from 'react';
import { AuthenticatedShell } from '@/components/auth/authenticated-shell';

type AuthenticatedLayoutProps = {
  children: ReactNode;
};

export default function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
