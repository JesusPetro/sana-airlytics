import type { ReactNode } from 'react';
import { Topbar } from '@/components/layout/Topbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { AppProviders } from '@/components/layout/AppProviders';
import { EmptyWorkspaceGate } from '@/components/workspace/EmptyWorkspaceGate';
import { UserFab } from '@/components/layout/UserFab';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function AppLayout({ children, params }: Props) {
  const { locale } = await params;

  return (
    <AppProviders>
      <Topbar locale={locale} />
      <Sidebar locale={locale} />
      {/*
        padding-left uses --sidebar-current-w which is set by Sidebar via JS.
        The fallback var(--sidebar-w-expanded) matches the default expanded state,
        preventing layout shift on first paint for users who haven't collapsed it.
      */}
      <main
        style={{
          paddingTop: 'var(--topbar-h)',
          paddingLeft: 'var(--sidebar-current-w, var(--sidebar-w-expanded))',
          minHeight: '100vh',
          background: 'var(--color-bg)',
          transition: 'padding-left 200ms ease',
        }}
      >
        <EmptyWorkspaceGate>
          {children}
        </EmptyWorkspaceGate>
        <UserFab />
      </main>
    </AppProviders>
  );
}
