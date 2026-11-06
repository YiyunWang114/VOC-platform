import { ReactNode } from 'react';

interface FloatingCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  accent?: 'purple' | 'green' | 'yellow' | 'orange' | 'none';
  accentPosition?: 'top' | 'left';
}

const paddingMap = {
  sm: 'p-5',
  md: 'p-8',
  lg: 'p-10',
};

const accentColorMap = {
  purple: '#8C7CF0',
  green: '#7DD3A8',
  yellow: '#F5D78E',
  orange: '#F0B787',
  none: 'transparent',
};

export function FloatingCard({
  children,
  className = '',
  hover = true,
  padding = 'md',
  accent = 'none',
  accentPosition = 'top',
}: FloatingCardProps) {
  const baseClasses = 'bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] border-none';
  const hoverClasses = hover
    ? 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(140,124,240,0.12)]'
    : '';

  const accentStyle = accent !== 'none'
    ? accentPosition === 'top'
      ? { borderTop: `3px solid ${accentColorMap[accent]}` }
      : { borderLeft: `3px solid ${accentColorMap[accent]}` }
    : {};

  return (
    <div
      className={`${baseClasses} ${hoverClasses} ${paddingMap[padding]} ${className}`}
      style={accentStyle}
    >
      {children}
    </div>
  );
}
