'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { GradientBlob } from '@/components/ui/GradientBlob';
import { FloatingCard } from '@/components/ui/FloatingCard';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 检查是否已登录（只执行一次）
  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me')
      .then(res => {
        if (!cancelled && res.ok) {
          window.location.href = redirect;
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '登录失败');
        return;
      }

      window.location.href = redirect;
    } catch {
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 返回按钮 - fixed定位确保始终可见 */}
      <Link
        href="/landing"
        className="fixed top-6 left-6 z-50 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all hover:scale-105"
        style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}
      >
        <ArrowLeft className="w-4 h-4" />
        返回介绍页
      </Link>

      <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      {/* Gradient Blobs */}
      <GradientBlob color="purple" size={400} className="-top-20 -left-20" opacity={0.6} slow />
      <GradientBlob color="green" size={300} className="top-1/3 -right-20" opacity={0.5} />
      <GradientBlob color="yellow" size={250} className="-bottom-10 left-1/4" opacity={0.4} slow />

      <div className="w-full max-w-sm px-6 relative z-10">
        {/* Logo */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--gradient-hero)' }}
            >
              <svg viewBox="0 0 40 40" className="w-8 h-8" fill="none">
                {/* 对话气泡 */}
                <path d="M8 12C8 9.79 9.79 8 12 8H28C30.21 8 32 9.79 32 12V24C32 26.21 30.21 28 28 28H18L14 32V28H12C9.79 28 8 26.21 8 24V12Z" fill="white" opacity="0.95"/>
                {/* 声波纹 - 左 */}
                <path d="M16 15V21" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round"/>
                <path d="M20 13V23" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round"/>
                <path d="M24 15V21" stroke="url(#logoGrad)" strokeWidth="2" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="logoGrad" x1="16" y1="13" x2="24" y2="23" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#8C7CF0"/>
                    <stop offset="1" stopColor="#C6B9FF"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            VoC 平台
          </h1>
          <p className="mt-2 text-base" style={{ color: 'var(--text-secondary)' }}>
            智能分析与产品迭代中台
          </p>
          <div className="flex justify-center mt-4">
            <div className="w-16 h-1 rounded-full" style={{ background: 'var(--gradient-hero)' }} />
          </div>
        </div>

        {/* Login Form */}
        <FloatingCard padding="lg" hover={false}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="input-soft"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-soft pr-12"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="py-3 px-4 rounded-xl text-sm" style={{ background: 'var(--accent-red-muted)', color: '#D67373' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="btn-primary w-full flex items-center justify-center gap-2"
              style={{ opacity: loading || !username || !password ? 0.6 : 1 }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        </FloatingCard>

        {/* Demo Accounts */}
        <div className="mt-8">
          <p className="text-xs text-center mb-4" style={{ color: 'var(--text-muted)' }}>
            测试账号
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { u: 'admin', p: 'admin123' },
              { u: 'pm', p: 'pm123456' },
              { u: 'analyst', p: 'analyst123' },
              { u: 'operator', p: 'op123456' },
              { u: 'cs', p: 'cs123456' },
            ].map(acc => (
              <FloatingCard key={acc.u} padding="sm" hover={false} className="!p-3 !rounded-xl">
                <span className="text-xs" style={{ color: 'var(--accent)', fontWeight: 500 }}>{acc.u}</span>
                <span className="text-xs mx-1" style={{ color: 'var(--text-muted)' }}>/</span>
                <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{acc.p}</span>
              </FloatingCard>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-10" style={{ color: 'var(--text-muted)' }}>
          VoC Platform. All rights reserved.
        </p>
      </div>
    </div>
    </>
  );
}
