'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { ROLE_LABELS } from '@/lib/permissions';
import {
  LogOut,
  Settings,
  ChevronDown,
  Users,
} from 'lucide-react';

export function UserNav() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role;

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 py-1.5 px-2 rounded-2xl transition-colors"
        style={{ color: 'var(--text-primary)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-medium text-white"
          style={{ background: 'var(--gradient-hero)' }}
        >
          {user.name.charAt(0)}
        </div>
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium leading-tight">{user.name}</p>
          <p className="text-xs leading-tight" style={{ color: 'var(--text-tertiary)' }}>{roleLabel}</p>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} style={{ color: 'var(--text-muted)' }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-56 rounded-2xl overflow-hidden z-50"
            style={{
              background: 'var(--bg-secondary)',
              boxShadow: 'var(--shadow-medium)',
            }}
          >
            {/* User Info */}
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{user.username}</p>
              <span className="badge-soft badge-soft-purple inline-block mt-2">
                {roleLabel}
              </span>
            </div>

            {/* Menu Items */}
            <div className="py-1">
              {user.role === 'admin' && (
                <button
                  onClick={() => {
                    setOpen(false);
                    router.push('/users');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <Users className="w-4 h-4" />
                  用户管理
                </button>
              )}

              <button
                onClick={() => {
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                style={{ color: 'var(--text-secondary)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Settings className="w-4 h-4" />
                个人设置
              </button>

              <div className="my-1" style={{ borderTop: '1px solid var(--border-subtle)' }} />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors"
                style={{ color: '#D67373' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-red-muted)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
