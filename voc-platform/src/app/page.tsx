"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { AppShell } from "@/components/layout/AppShell";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { StatCard } from "@/components/ui/StatCard";
import {
  MessageSquare,
  Ticket,
  AlertTriangle,
  TrendingUp,
  Brain,
  Activity,
  ChevronRight,
  Clock,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

const COLORS = {
  sentiment: ["#7DD3A8", "#9B96B0", "#F0A0A0"],
  source: ["#8C7CF0", "#7DD3A8"],
  trend: { positive: "#7DD3A8", neutral: "#9B96B0", negative: "#F0A0A0" },
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface DashboardData {
  sentimentDistribution: Array<{ name: string; value: number }>;
  sourceDistribution: Array<{ name: string; value: number }>;
  dailyTrend: Array<{ date: string; positive: number; neutral: number; negative: number }>;
  totalFeedbacks: number;
  pendingTickets: number;
  highRiskCount: number;
  todayNew: number;
  recentTickets: Array<{ id: string; title: string; status: string; createdAt: string }>;
  recentActivities: Array<{ id: string; action: string; time: string }>;
}

export default function HomeDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // 未登录 → 重定向到介绍页
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/landing');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(result => {
        // 构造仪表盘数据
        const totalFeedbacks = (result.sentimentDistribution || []).reduce((a: number, b: any) => a + (b?.value || 0), 0);
        const highRisk = (result.urgencyDistribution || []).find((u: any) => u?.name === "高")?.value || 0;
        const todayCount = (result.dailyTrend || []).length > 0
          ? Object.values(result.dailyTrend[result.dailyTrend.length - 1] || {}).reduce(
              (a: number, b: any) => a + (typeof b === 'number' ? b : 0), 0
            )
          : 0;

        setData({
          sentimentDistribution: result.sentimentDistribution || [],
          sourceDistribution: result.sourceDistribution || [],
          dailyTrend: result.dailyTrend || [],
          totalFeedbacks,
          pendingTickets: 0,
          highRiskCount: highRisk,
          todayNew: todayCount,
          recentTickets: [],
          recentActivities: [],
        });
      })
      .catch(() => {
        setData({
          sentimentDistribution: [],
          sourceDistribution: [],
          dailyTrend: [],
          totalFeedbacks: 0,
          pendingTickets: 0,
          highRiskCount: 0,
          todayNew: 0,
          recentTickets: [],
          recentActivities: [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <AppShell>
      <div className="min-h-screen p-6" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-7xl mx-auto">
          {authLoading || !user ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <Activity className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                仪表盘
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {today} · 欢迎回来，{user?.name}
              </p>
            </div>
            <Link href="/dashboard" className="btn-primary inline-flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              查看大屏
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="总反馈数"
              value={data?.totalFeedbacks || 0}
              icon={MessageSquare}
              accent="purple"
              trend={{ value: 12, isPositive: true }}
            />
            <StatCard
              title="待处理工单"
              value={data?.pendingTickets || 0}
              icon={Ticket}
              accent="yellow"
            />
            <StatCard
              title="高风险反馈"
              value={data?.highRiskCount || 0}
              icon={AlertTriangle}
              accent="red"
            />
            <StatCard
              title="今日新增"
              value={data?.todayNew || 0}
              icon={TrendingUp}
              accent="green"
              trend={{ value: 8, isPositive: true }}
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 情绪分布 */}
            <FloatingCard padding="md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  情绪分布
                </h3>
                <Link href="/dashboard" className="text-sm flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  详情 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              {loading ? (
                <div className="flex items-center justify-center h-[250px]" style={{ color: 'var(--text-muted)' }}>
                  <Activity className="w-6 h-6 animate-spin mr-2" />
                  加载中...
                </div>
              ) : (data?.sentimentDistribution || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={data?.sentimentDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      dataKey="value"
                    >
                      {(data?.sentimentDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.sentiment[index % COLORS.sentiment.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px]" style={{ color: 'var(--text-muted)' }}>
                  暂无数据
                </div>
              )}
            </FloatingCard>

            {/* 渠道声量 */}
            <FloatingCard padding="md">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  渠道声量对比
                </h3>
                <Link href="/dashboard" className="text-sm flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  详情 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              {loading ? (
                <div className="flex items-center justify-center h-[250px]" style={{ color: 'var(--text-muted)' }}>
                  <Activity className="w-6 h-6 animate-spin mr-2" />
                  加载中...
                </div>
              ) : (data?.sourceDistribution || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={data?.sourceDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {(data?.sourceDistribution || []).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS.source[index % COLORS.source.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[250px]" style={{ color: 'var(--text-muted)' }}>
                  暂无数据
                </div>
              )}
            </FloatingCard>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 情绪趋势 */}
            <FloatingCard padding="md" className="lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                  近7天情绪趋势
                </h3>
                <Link href="/dashboard" className="text-sm flex items-center gap-1" style={{ color: 'var(--accent)' }}>
                  详情 <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              {loading ? (
                <div className="flex items-center justify-center h-[200px]" style={{ color: 'var(--text-muted)' }}>
                  <Activity className="w-6 h-6 animate-spin mr-2" />
                  加载中...
                </div>
              ) : (data?.dailyTrend || []).length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data?.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                    <Line type="monotone" dataKey="positive" stroke={COLORS.trend.positive} strokeWidth={2} dot={{ r: 3 }} name="积极" />
                    <Line type="monotone" dataKey="neutral" stroke={COLORS.trend.neutral} strokeWidth={2} dot={{ r: 3 }} name="中性" />
                    <Line type="monotone" dataKey="negative" stroke={COLORS.trend.negative} strokeWidth={2} dot={{ r: 3 }} name="消极" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[200px]" style={{ color: 'var(--text-muted)' }}>
                  暂无数据
                </div>
              )}
            </FloatingCard>

            {/* 快捷操作 */}
            <FloatingCard padding="md">
              <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                快捷操作
              </h3>
              <div className="space-y-2">
                {[
                  { label: '上传反馈数据', href: '/upload', icon: MessageSquare },
                  { label: '查看数据大厅', href: '/voc-hall', icon: Brain },
                  { label: '管理工单看板', href: '/kanban', icon: Ticket },
                  { label: '生成智能报告', href: '/reports', icon: Activity },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = 'var(--bg-tertiary)';
                      e.currentTarget.style.color = 'var(--accent)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Link>
                ))}
              </div>
            </FloatingCard>
          </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
