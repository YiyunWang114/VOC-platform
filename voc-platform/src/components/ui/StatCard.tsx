import { ReactNode } from 'react';
import { FloatingCard } from './FloatingCard';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  accent?: 'purple' | 'green' | 'yellow' | 'orange' | 'red';
  className?: string;
}

const ACCENT_MAP = {
  purple: { bg: 'var(--accent-muted)', icon: 'var(--accent)' },
  green: { bg: 'var(--accent-green-muted)', icon: 'var(--accent-green)' },
  yellow: { bg: 'var(--accent-yellow-muted)', icon: 'var(--accent-yellow)' },
  orange: { bg: 'var(--accent-orange-muted)', icon: 'var(--accent-orange)' },
  red: { bg: 'var(--accent-red-muted)', icon: 'var(--accent-red)' },
};

export function StatCard({ title, value, icon: Icon, trend, accent = 'purple', className = '' }: StatCardProps) {
  const colors = ACCENT_MAP[accent];

  return (
    <FloatingCard padding="md" hover={true} className={className}>
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: colors.bg }}
        >
          <Icon className="w-6 h-6" style={{ color: colors.icon }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-bold font-mono-data tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {value}
          </p>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {title}
          </p>
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span
            className="badge-soft text-xs"
            style={{
              background: trend.isPositive ? 'var(--accent-green-muted)' : 'var(--accent-red-muted)',
              color: trend.isPositive ? 'var(--accent-green)' : 'var(--accent-red)',
            }}
          >
            {trend.isPositive ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>较上周</span>
        </div>
      )}
    </FloatingCard>
  );
}
