"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  MessageSquare,
  Ticket,
  AlertTriangle,
  Activity,
  BarChart3,
  Smile,
  Frown,
  Meh,
  Radio,
  Zap,
} from "lucide-react";
import { FloatingCard } from "@/components/ui/FloatingCard";
import { AppShell } from "@/components/layout/AppShell";
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

interface DashboardData {
  sentimentDistribution: Array<{ name: string; value: number }>;
  categoryDistribution: Array<{ name: string; value: number }>;
  sourceDistribution: Array<{ name: string; value: number }>;
  urgencyDistribution: Array<{ name: string; value: number }>;
  ticketDistribution: Array<{ name: string; value: number }>;
  productDistribution: Array<{ name: string; value: number }>;
  dailyTrend: Array<{ date: string; positive: number; neutral: number; negative: number }>;
  products: Array<{ id: string; name: string }>;
  selectedProductId: string | null;
  selectedProductName: string | null;
}

const COLORS = {
  sentiment: ["#7DD3A8", "#9B96B0", "#F0A0A0"],
  category: ["#8C7CF0", "#A78BFA", "#F5D78E", "#7DD3A8", "#F0A0A0", "#C6B9FF", "#F0B787", "#9B96B0", "#7DD3A8", "#F0A0A0"],
  source: ["#8C7CF0", "#7DD3A8", "#F5D78E", "#F0A0A0", "#A78BFA"],
  urgency: ["#F0A0A0", "#F5D78E", "#7DD3A8"],
  product: ["#8C7CF0", "#A78BFA", "#7DD3A8", "#F5D78E", "#F0A0A0", "#C6B9FF", "#7DD3A8", "#F0B787", "#F0A0A0", "#8C7CF0"],
  trend: { positive: "#7DD3A8", neutral: "#9B96B0", negative: "#F0A0A0" },
};

const STAT_ICONS = [
  { color: "var(--accent-muted)", iconColor: "var(--accent)" },
  { color: "var(--accent-yellow-muted)", iconColor: "var(--accent-yellow)" },
  { color: "var(--accent-red-muted)", iconColor: "var(--accent-red)" },
  { color: "var(--accent-green-muted)", iconColor: "var(--accent-green)" },
];

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

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>("");

  const fetchDashboardData = async (productId?: string) => {
    setLoading(true);
    try {
      const url = productId ? `/api/dashboard?productId=${productId}` : "/api/dashboard";
      const response = await fetch(url);
      const result = await response.json();
      setData(result);
      if (result.selectedProductId) {
        setSelectedProductId(result.selectedProductId);
      }
    } catch (error) {
      console.error("获取仪表盘数据失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    setSelectedProductId(productId);
    fetchDashboardData(productId || undefined);
  };

  const stats = data
    ? [
        {
          label: "总反馈数",
          value: (data.sentimentDistribution || []).reduce((a, b) => a + (b?.value || 0), 0),
          icon: MessageSquare,
        },
        {
          label: "工单总数",
          value: (data.ticketDistribution || []).reduce((a, b) => a + (b?.value || 0), 0),
          icon: Ticket,
        },
        {
          label: "高风险反馈",
          value:
            (data.urgencyDistribution || []).find((u) => u?.name === "高")?.value || 0,
          icon: AlertTriangle,
        },
        {
          label: "今日新增",
          value: (data.dailyTrend || []).length > 0
            ? Object.values(data.dailyTrend[data.dailyTrend.length - 1] || {}).reduce(
                (a: number, b: number) => a + (typeof b === 'number' ? b : 0),
                0
              )
            : 0,
          icon: TrendingUp,
        },
      ]
    : [];

  return (
    <AppShell showRightPanel={false}>
      <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        {/* Header */}
        <div className="px-6 py-4" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  返回首页
                </Link>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--accent-muted)' }}
                  >
                    <BarChart3 className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                  </div>
                  <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    BI洞察大屏
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* 产品选择器 */}
                {data?.products && data.products.length > 0 && (
                  <select
                    value={selectedProductId}
                    onChange={handleProductChange}
                    className="input-soft py-2 px-3 text-sm"
                    style={{ width: 'auto', minWidth: '140px' }}
                  >
                    <option value="">全部产品</option>
                    {data.products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  onClick={() => fetchDashboardData(selectedProductId || undefined)}
                  className="btn-primary inline-flex items-center gap-2 py-2 px-4"
                >
                  <Activity className="h-4 w-4" />
                  刷新数据
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--accent)' }} />
              <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>加载中...</span>
            </div>
          ) : !data ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--accent-muted)' }}
              >
                <BarChart3 className="h-8 w-8" style={{ color: 'var(--accent)' }} />
              </div>
              <p style={{ color: 'var(--text-secondary)' }}>暂无数据</p>
            </div>
          ) : (
            <>
              {/* 统计卡片 */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                {stats.map((stat, index) => {
                  const colors = STAT_ICONS[index % STAT_ICONS.length];
                  return (
                    <FloatingCard key={stat.label} padding="md" hover={true}>
                      <div className="flex items-center gap-4">
                        <div
                          className="rounded-2xl p-3"
                          style={{ background: colors.color }}
                        >
                          <stat.icon className="h-6 w-6" style={{ color: colors.iconColor }} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold font-mono-data" style={{ color: 'var(--text-primary)' }}>
                            {stat.value}
                          </p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
                        </div>
                      </div>
                    </FloatingCard>
                  );
                })}
              </div>

              {/* 图表区域 - 第一行 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* 情绪分布 - 饼图 */}
                <FloatingCard padding="md">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
                      <Smile className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                    </div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      情绪分布
                    </h2>
                  </div>
                  {(data.sentimentDistribution || []).length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={data.sentimentDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          dataKey="value"
                        >
                          {(data.sentimentDistribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.sentiment[index % COLORS.sentiment.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ color: 'var(--text-secondary)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px]" style={{ color: 'var(--text-muted)' }}>
                      暂无数据
                    </div>
                  )}
                </FloatingCard>

                {/* 痛点分类 - 柱状图 */}
                <FloatingCard padding="md">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-red-muted)' }}>
                      <Frown className="h-4 w-4" style={{ color: 'var(--accent-red)' }} />
                    </div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      痛点分类 (Top 10)
                    </h2>
                  </div>
                  {(data.categoryDistribution || []).length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={data.categoryDistribution.slice(0, 10)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis type="number" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                        <YAxis dataKey="name" type="category" width={100} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {(data.categoryDistribution || []).slice(0, 10).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.category[index % COLORS.category.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[280px]" style={{ color: 'var(--text-muted)' }}>
                      暂无数据
                    </div>
                  )}
                </FloatingCard>
              </div>

              {/* 图表区域 - 第二行 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* 渠道来源 - 柱状图 */}
                <FloatingCard padding="md">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-muted)' }}>
                      <Radio className="h-4 w-4" style={{ color: 'var(--accent)' }} />
                    </div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      渠道来源统计
                    </h2>
                  </div>
                  {(data.sourceDistribution || []).length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={data.sourceDistribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                        <XAxis dataKey="name" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                        <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {(data.sourceDistribution || []).map((entry, index) => (
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

                {/* 紧急程度 - 饼图 */}
                <FloatingCard padding="md">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-yellow-muted)' }}>
                      <Zap className="h-4 w-4" style={{ color: 'var(--accent-yellow)' }} />
                    </div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      紧急程度分布
                    </h2>
                  </div>
                  {(data.urgencyDistribution || []).length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={data.urgencyDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={90}
                          dataKey="value"
                        >
                          {(data.urgencyDistribution || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS.urgency[index % COLORS.urgency.length]} />
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
              </div>

              {/* 情绪趋势 - 折线图 */}
              <FloatingCard padding="md" className="mb-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-green-muted)' }}>
                    <TrendingUp className="h-4 w-4" style={{ color: 'var(--accent-green)' }} />
                  </div>
                  <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    近7天情绪趋势
                  </h2>
                </div>
                {(data.dailyTrend || []).length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={data.dailyTrend}>
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
                  <div className="flex items-center justify-center h-[280px]" style={{ color: 'var(--text-muted)' }}>
                    暂无数据
                  </div>
                )}
              </FloatingCard>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
