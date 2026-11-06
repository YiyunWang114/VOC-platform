'use client';

import Link from 'next/link';
import { GradientBlob } from '@/components/ui/GradientBlob';
import { FloatingCard } from '@/components/ui/FloatingCard';
import {
  Upload,
  Brain,
  BarChart3,
  Ticket,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Shield,
  Zap,
  Target,
  MessageSquare,
  Layers,
  RefreshCcw,
  ChevronDown,
} from 'lucide-react';
import { useState, useEffect } from 'react';

const FEATURES = [
  {
    icon: Upload,
    title: '数据采集',
    description: '批量导入 CSV/Excel，支持公域/私域多渠道数据汇聚',
    accent: 'purple' as const,
    illustration: 'feature-upload',
    tag: '多源接入',
  },
  {
    icon: Brain,
    title: 'AI 智能分析',
    description: 'DeepSeek 深度语义拆解，情绪识别与痛点自动提取',
    accent: 'green' as const,
    illustration: 'feature-ai',
    tag: '语义引擎',
  },
  {
    icon: BarChart3,
    title: '洞察发现',
    description: '可视化数据大厅，实时监控情绪分布与渠道声量',
    accent: 'yellow' as const,
    illustration: 'feature-insight',
    tag: '实时监控',
  },
  {
    icon: Ticket,
    title: '工单交付',
    description: '敏捷看板驱动迭代，从洞察到研发的全流程闭环',
    accent: 'orange' as const,
    illustration: 'feature-ticket',
    tag: '闭环管理',
  },
];

const HIGHLIGHTS = [
  {
    icon: Brain,
    title: 'AI 深度语义分析',
    description: '基于 DeepSeek 大模型，自动识别用户情绪、提取核心痛点、评估流失风险，让每一条反馈都转化为可行动的产品洞察。',
    color: '#8C7CF0',
    bg: 'var(--accent-muted)',
  },
  {
    icon: Layers,
    title: '全渠道数据汇聚',
    description: '批量导入 CSV/Excel 文件，支持电商评论、社交媒体、客服工单等多源数据统一管理，告别数据孤岛。',
    color: '#7DD3A8',
    bg: 'var(--accent-green-muted)',
  },
  {
    icon: RefreshCcw,
    title: '闭环驱动迭代',
    description: '从数据洞察到智能工单到敏捷看板，数据驱动产品决策全流程自动化，让用户声音真正落地为产品改进。',
    color: '#F5D78E',
    bg: 'var(--accent-yellow-muted)',
  },
];

const WORKFLOW = [
  { step: '01', title: '数据发现', desc: '批量上传用户反馈文件', color: '#8C7CF0', icon: Upload },
  { step: '02', title: '智能分析', desc: 'AI 自动识别情绪与痛点', color: '#7DD3A8', icon: Brain },
  { step: '03', title: '洞察预警', desc: '实时监控流失风险与趋势', color: '#F5D78E', icon: BarChart3 },
  { step: '04', title: '工单交付', desc: '看板驱动敏捷迭代闭环', color: '#F0B787', icon: Ticket },
];

function LogoSVG({ size = 'w-6 h-6' }: { size?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={size} fill="none">
      <path d="M8 12C8 9.79 9.79 8 12 8H28C30.21 8 32 9.79 32 12V24C32 26.21 30.21 28 28 28H18L14 32V28H12C9.79 28 8 26.21 8 24V12Z" fill="white" opacity="0.95"/>
      <path d="M16 15V21" stroke="#8C7CF0" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M20 13V23" stroke="#A78BFA" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 15V21" stroke="#C6B9FF" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      {/* ===== 固定导航栏 ===== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? 'py-2' : 'py-3'
        }`}
        style={{
          background: 'transparent',
          backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border-subtle)' : '1px solid transparent',
        }}
      >
        <div className="mx-auto px-6 flex items-center justify-between" style={{ maxWidth: '1120px' }}>
          <div className="flex items-center" style={{ gap: '17px' }}>
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--gradient-hero)' }}
            >
              <LogoSVG size="w-5 h-5" />
            </div>
            <span className="font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              VoC 平台
            </span>
          </div>
          <div className="flex items-center">
            <div className="flex items-center" style={{ gap: '32px' }}>
              <a
                href="#highlights"
                className="text-sm transition-colors hover:opacity-70 hidden sm:block"
                style={{ color: 'var(--text-secondary)' }}
              >
                核心亮点
              </a>
              <a
                href="#features"
                className="text-sm transition-colors hover:opacity-70 hidden sm:block"
                style={{ color: 'var(--text-secondary)' }}
              >
                功能模块
              </a>
              <a
                href="#workflow"
                className="text-sm transition-colors hover:opacity-70 hidden sm:block"
                style={{ color: 'var(--text-secondary)' }}
              >
                工作流程
              </a>
            </div>
            <div style={{ width: '32px' }} className="hidden sm:block" />
            <Link href="/login" className="btn-primary py-2 px-5 text-sm">
              立即体验
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="relative min-h-screen flex items-center justify-center px-6 pt-14 overflow-hidden">
        {/* 主渐变光斑 */}
        <GradientBlob color="purple" size={500} className="-top-40 -left-40" opacity={0.5} slow />
        <GradientBlob color="green" size={400} className="top-1/3 -right-40" opacity={0.4} />
        <GradientBlob color="yellow" size={300} className="-bottom-20 left-1/3" opacity={0.3} slow />

        {/* 黄色装饰光球 */}
        <div className="absolute top-[15%] right-[8%] w-64 h-64 rounded-full" style={{ background: 'radial-gradient(circle, rgba(250,210,120,0.35) 0%, rgba(250,210,120,0) 70%)' }} />

        {/* 网格点阵装饰 */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--text-primary) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in-up" style={{ background: 'var(--accent-muted)' }}>
            <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
              基于 DeepSeek AI 的智能分析引擎
            </span>
          </div>

          {/* Title */}
          <h1 className="text-5xl sm:text-7xl font-semibold tracking-tight leading-tight animate-fade-in-up" style={{ animationDelay: '0.1s', color: 'var(--text-primary)' }}>
            企业级全渠道
            <br />
            <span className="gradient-text">VoC 智能分析中台</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto max-w-2xl mt-8 text-lg leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s', color: 'var(--text-secondary)' }}>
            深度集成生成式 AI，对海量用户反馈进行语义拆解、情绪分析、痛点提取，
            驱动产品团队实现数据发现到研发交付的全自动化闭环。
          </p>

          {/* CTA Buttons */}
          <div className="flex justify-center gap-4 mt-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link href="/login" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
              立即体验
              <ChevronRight className="w-5 h-5" />
            </Link>
            <a href="#highlights" className="btn-secondary inline-flex items-center gap-2 text-base px-8 py-3">
              了解更多
              <ChevronDown className="w-5 h-5" />
            </a>
          </div>

          {/* Gradient line */}
          <div className="flex justify-center mt-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="w-24 h-1 rounded-full" style={{ background: 'var(--gradient-hero)' }} />
          </div>
        </div>
      </section>

      {/* ===== 核心亮点 SECTION ===== */}
      <section id="highlights" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              为什么选择 VoC 平台
            </h2>
            <p className="mt-4 text-base" style={{ color: 'var(--text-secondary)' }}>
              三大核心能力，让用户声音真正驱动产品增长
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HIGHLIGHTS.map((item, index) => (
              <div
                key={item.title}
                className="group relative p-8 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: item.bg }}
                >
                  <item.icon className="w-6 h-6" style={{ color: item.color }} />
                </div>
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {item.description}
                </p>
                {/* 顶部彩色装饰线 */}
                <div
                  className="absolute top-0 left-8 right-8 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: item.color }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES SECTION ===== */}
      <section id="features" className="py-24 px-6" style={{ background: 'var(--bg-secondary)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              核心功能模块
            </h2>
            <p className="mt-4 text-base" style={{ color: 'var(--text-secondary)' }}>
              覆盖从数据采集到研发交付的全生命周期管理
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FEATURES.map((feature) => (
              <FloatingCard
                key={feature.title}
                padding="md"
                accent={feature.accent}
                accentPosition="top"
                className="transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start gap-5">
                  <div
                    className="w-20 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{
                      background:
                        feature.accent === 'purple'
                          ? 'var(--accent-muted)'
                          : feature.accent === 'green'
                          ? 'var(--accent-green-muted)'
                          : feature.accent === 'yellow'
                          ? 'var(--accent-yellow-muted)'
                          : 'var(--accent-orange-muted)',
                    }}
                  >
                    <img
                      src={`/illustrations/${feature.illustration}.jpg`}
                      alt={feature.title}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {feature.title}
                      </h3>
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background:
                            feature.accent === 'purple'
                              ? 'var(--accent-muted)'
                              : feature.accent === 'green'
                              ? 'var(--accent-green-muted)'
                              : feature.accent === 'yellow'
                              ? 'var(--accent-yellow-muted)'
                              : 'var(--accent-orange-muted)',
                          color:
                            feature.accent === 'purple'
                              ? 'var(--accent)'
                              : feature.accent === 'green'
                              ? 'var(--accent-green)'
                              : feature.accent === 'yellow'
                              ? 'var(--accent-yellow)'
                              : 'var(--accent-orange)',
                        }}
                      >
                        {feature.tag}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </FloatingCard>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WORKFLOW SECTION ===== */}
      <section id="workflow" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              业务流转全景
            </h2>
            <p className="mt-4 text-base" style={{ color: 'var(--text-secondary)' }}>
              四步完成从用户反馈到产品迭代的完整闭环
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {WORKFLOW.map((item, index) => (
              <div key={item.step} className="relative">
                <div
                  className="p-6 rounded-2xl text-center h-full transition-all duration-300 hover:-translate-y-1"
                  style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}
                >
                  {/* 步骤编号 */}
                  <p className="text-3xl font-bold tracking-tight mb-3" style={{ color: item.color, opacity: 0.25 }}>
                    {item.step}
                  </p>
                  {/* 图标 */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-3"
                    style={{ background: `${item.color}15` }}
                  >
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {item.desc}
                  </p>
                </div>
                {/* 连接箭头（非最后一个） */}
                {index < 3 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ChevronRight className="w-5 h-5" style={{ color: 'var(--border-light)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA FOOTER ===== */}
      <section className="py-24 px-6 relative">
        <GradientBlob color="purple" size={400} className="top-0 left-1/2 -translate-x-1/2" opacity={0.3} slow />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            开始您的 VoC 之旅
          </h2>
          <p className="mt-4 text-base" style={{ color: 'var(--text-secondary)' }}>
            立即登录，体验 AI 驱动的用户反馈智能分析平台
          </p>
          <div className="flex justify-center gap-4 mt-10">
            <Link href="/login" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
              免费体验
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-8 px-6" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--gradient-hero)' }}
            >
              <LogoSVG size="w-5 h-5" />
            </div>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>VoC Platform</span>
          </div>
          <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
