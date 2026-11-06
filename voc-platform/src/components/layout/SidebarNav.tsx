'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { getHomeModules } from '@/lib/permissions';
import {
  Upload,
  MessageSquare,
  Ticket,
  BarChart3,
  Target,
  FileText,
  Settings,
  LogOut,
  Home,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Upload,
  MessageSquare,
  Kanban: Ticket,
  BarChart3,
  Target,
  FileText,
};

export function SidebarNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [expanded, setExpanded] = useState(false);

  const modules = user ? getHomeModules(user.role) : [];

  const navItems = [
    { id: 'home', href: '/', icon: Home, label: '首页' },
    ...modules.map((m) => ({
      id: m.id,
      href: m.href,
      icon: ICON_MAP[m.icon] || LayoutDashboard,
      label: m.title,
    })),
  ];

  return (
    <nav
      className="fixed left-0 top-0 h-screen z-40 hidden md:flex flex-col py-6 sidebar-nav transition-all duration-300 ease-out"
      style={{ width: expanded ? 200 : 80 }}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-3 px-4 mb-8"
      >
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'var(--gradient-hero)' }}
        >
          <svg viewBox="0 0 40 40" className="w-6 h-6" fill="none">
            <path d="M8 12C8 9.79 9.79 8 12 8H28C30.21 8 32 9.79 32 12V24C32 26.21 30.21 28 28 28H18L14 32V28H12C9.79 28 8 26.21 8 24V12Z" fill="white" opacity="0.95"/>
            <path d="M16 15V21" stroke="#8C7CF0" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M20 13V23" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M24 15V21" stroke="#C6B9FF" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        {expanded && (
          <span className="text-lg font-semibold tracking-tight whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
            VoC
          </span>
        )}
      </Link>

      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-3 top-24 w-6 h-6 rounded-full flex items-center justify-center shadow-md"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
      >
        {expanded ? (
          <ChevronLeft className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
        ) : (
          <ChevronRight className="w-3 h-3" style={{ color: 'var(--text-muted)' }} />
        )}
      </button>

      {/* Nav Items */}
      <div className="flex-1 flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--accent)]'
              }`}
              style={{
                background: isActive ? 'var(--bg-tertiary)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
              }}
              title={item.label}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {expanded && (
                <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col gap-1 px-3">
        <button
          className="flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          title="设置"
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {expanded && <span className="text-sm font-medium whitespace-nowrap">设置</span>}
        </button>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-200"
          style={{ color: 'var(--accent-red)' }}
          title="退出登录"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {expanded && <span className="text-sm font-medium whitespace-nowrap">退出登录</span>}
        </button>
      </div>
    </nav>
  );
}
