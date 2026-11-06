'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Home } from 'lucide-react';
import { GradientBlob } from '@/components/ui/GradientBlob';
import { FloatingCard } from '@/components/ui/FloatingCard';

export default function ForbiddenPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Gradient Blobs */}
      <GradientBlob color="purple" size={300} className="top-20 -left-20" opacity={0.4} slow />
      <GradientBlob color="pink" size={250} className="bottom-20 -right-10" opacity={0.3} />

      <div className="text-center max-w-md relative z-10">
        <p className="text-8xl font-semibold tracking-tight mb-4 gradient-text">
          403
        </p>

        <FloatingCard padding="lg" hover={false} className="mt-8">
          <h2 className="text-2xl font-semibold tracking-tight mb-3" style={{ color: 'var(--text-primary)' }}>
            访问被拒绝
          </h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
            抱歉，您没有权限访问此页面。如需访问，请联系管理员调整您的角色权限。
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.back()}
              className="btn-ghost inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              返回上一页
            </button>
            <button
              onClick={() => router.push('/')}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              返回首页
            </button>
          </div>
        </FloatingCard>
      </div>
    </div>
  );
}
