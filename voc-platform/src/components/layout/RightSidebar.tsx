'use client';

import { useAuth } from '@/components/auth/AuthProvider';
import { ROLE_LABELS } from '@/lib/permissions';
import { FloatingCard } from '@/components/ui/FloatingCard';
import {
  User,
  Zap,
  Shield,
  Clock,
} from 'lucide-react';

export function RightSidebar() {
  const { user } = useAuth();

  if (!user) return null;

  const roleLabel = ROLE_LABELS[user.role as keyof typeof ROLE_LABELS] || user.role;

  return (
    <aside className="fixed right-0 top-0 h-screen w-80 z-30 hidden xl:block right-sidebar overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* User Card */}
        <FloatingCard padding="md" hover={false}>
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-semibold text-lg"
              style={{ background: 'var(--gradient-hero)' }}
            >
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                {user.name}
              </p>
              <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>
                {user.username}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <span className="badge-soft badge-soft-purple">
              {roleLabel}
            </span>
          </div>
        </FloatingCard>

        {/* Quick Stats */}
        <FloatingCard padding="sm" hover={false}>
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            系统状态
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--accent-green-muted)' }}
              >
                <Zap className="w-4 h-4" style={{ color: 'var(--accent-green)' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>AI 引擎</p>
                <p className="text-sm font-medium" style={{ color: 'var(--accent-green)' }}>运行中</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--accent-muted)' }}
              >
                <Shield className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>安全状态</p>
                <p className="text-sm font-medium" style={{ color: 'var(--accent)' }}>正常</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--accent-yellow-muted)' }}
              >
                <Clock className="w-4 h-4" style={{ color: 'var(--accent-yellow)' }} />
              </div>
              <div className="flex-1">
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>数据同步</p>
                <p className="text-sm font-medium" style={{ color: 'var(--accent-yellow)' }}>刚刚</p>
              </div>
            </div>
          </div>
        </FloatingCard>

        {/* Tips */}
        <FloatingCard padding="sm" accent="purple" accentPosition="left">
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--accent-muted)' }}
            >
              <User className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                使用提示
              </p>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                点击左侧导航图标快速切换功能模块。数据大厅支持多维度筛选和AI智能分析。
              </p>
            </div>
          </div>
        </FloatingCard>
      </div>
    </aside>
  );
}
