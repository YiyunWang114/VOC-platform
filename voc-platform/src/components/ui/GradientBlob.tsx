'use client';

interface GradientBlobProps {
  color?: 'purple' | 'green' | 'yellow' | 'orange' | 'pink';
  size?: number;
  className?: string;
  animate?: boolean;
  slow?: boolean;
  opacity?: number;
}

const colorMap = {
  purple: 'gradient-blob-purple',
  green: 'gradient-blob-green',
  yellow: 'gradient-blob-yellow',
  orange: 'gradient-blob-orange',
  pink: 'gradient-blob-pink',
};

export function GradientBlob({
  color = 'purple',
  size = 300,
  className = '',
  animate = true,
  slow = false,
  opacity = 1,
}: GradientBlobProps) {
  return (
    <div
      className={`gradient-blob ${colorMap[color]} ${animate ? (slow ? 'animate-float-slow' : 'animate-float') : ''} ${className}`}
      style={{
        width: size,
        height: size,
        opacity,
      }}
    />
  );
}
