'use client';

import { ReactNode } from 'react';
import { SidebarNav } from './SidebarNav';
import { RightSidebar } from './RightSidebar';

interface AppShellProps {
  children: ReactNode;
  showRightPanel?: boolean;
}

export function AppShell({ children, showRightPanel = true }: AppShellProps) {
  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* Left Sidebar - md+ 显示 */}
      <SidebarNav />

      {/* Main Content */}
      <main
        className="flex-1 w-full md:ml-20 lg:ml-24"
        style={{ marginRight: showRightPanel ? undefined : 0 }}
      >
        <div className={showRightPanel ? 'xl:mr-80' : ''}>
          {children}
        </div>
      </main>

      {/* Right Sidebar - xl+ 显示 */}
      {showRightPanel && <RightSidebar />}
    </div>
  );
}
