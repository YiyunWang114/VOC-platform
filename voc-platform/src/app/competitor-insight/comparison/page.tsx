"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  Radar,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Package,
  Target,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as ReRadar,
} from "recharts";

const SOFT_NEO_COLORS = ["#7DD3A8", "#9B96B0", "#F0A0A0", "#8C7CF0", "#A78BFA", "#F5D78E"];

export default function ComparisonPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProduct, setSelectedProduct] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedProduct) {
      setLoading(false);
      return;
    }
    const url = `/api/competitor/comparison?productId=${selectedProduct}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(console.error);
  }, [refreshKey, selectedProduct]);

  if (loading) {
    return (
      <AppShell>
        <main className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
          <div style={{ color: "var(--text-muted)" }}>加载对比数据中...</div>
        </main>
      </AppShell>
    );
  }

  // 未选择产品时显示提示
  if (!selectedProduct) {
    return (
      <AppShell>
        <main className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
          <div className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-4">
                <Link
                  href="/competitor-insight"
                  className="inline-flex items-center text-sm transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  返回
                </Link>
                <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  本品vs竞品对比分析
                </h1>
                <div className="flex-1"></div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                  <select
                    value={selectedProduct}
                    onChange={(e) => { setSelectedProduct(e.target.value); setLoading(true); }}
                    className="rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-1"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  >
                    <option value="" disabled>请选择产品</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-12 text-center">
              <Package className="h-16 w-16 mx-auto mb-6" style={{ color: "var(--text-muted)" }} />
              <h3 className="text-xl font-semibold mb-3" style={{ color: "var(--text-primary)" }}>请先选择产品</h3>
              <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
                竞品对比分析需要基于具体产品展开。请在上方选择产品，查看本品与竞品的情绪分布、多维度能力对比及关键差距分析。
              </p>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  const own = data?.ownProduct;
  const competitors = data?.competitors || [];

  // 情绪分布柱状图数据：本品 + 竞品
  const sentimentData = own ? [
    {
      name: own.name,
      积极: own.sentimentPercent.positive,
      中性: own.sentimentPercent.neutral,
      消极: own.sentimentPercent.negative,
    },
    ...competitors.map((c: any) => ({
      name: c.name,
      积极: c.sentimentPercent.positive,
      中性: c.sentimentPercent.neutral,
      消极: c.sentimentPercent.negative,
    })),
  ] : [];

  // 雷达图数据：按固定维度组装
  const radarData = own?.dimensionScores?.map((dim: any) => {
    const row: any = {
      subject: dim.category,
      [own.name]: dim.score,
    };
    competitors.forEach((c: any) => {
      const compDim = c.dimensionScores.find((d: any) => d.category === dim.category);
      row[c.name] = compDim?.score || 50;
    });
    return row;
  }) || [];

  return (
    <AppShell>
      <main className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        <div className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Link
                href="/competitor-insight"
                className="inline-flex items-center text-sm transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                返回
              </Link>
              <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                本品vs竞品对比分析
              </h1>
              <div className="flex-1"></div>
              {/* 产品筛选 */}
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                <select
                  value={selectedProduct}
                  onChange={(e) => { setSelectedProduct(e.target.value); setLoading(true); }}
                  className="rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-1"
                  style={{ borderColor: "var(--border-subtle)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                >
                  <option value="" disabled>请选择产品</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => setRefreshKey(k => k + 1)} className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm transition-colors" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
                <RefreshCw className="mr-1.5 h-4 w-4" /> 刷新数据
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* 情绪分布对比 */}
          <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <BarChart3 className="h-5 w-5 text-[#8C7CF0]" />
              情绪分布对比
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    color: "#1f2937",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(140,124,240,0.08)",
                  }}
                />
                <Legend />
                <Bar dataKey="积极" fill="#7DD3A8" />
                <Bar dataKey="中性" fill="#9B96B0" />
                <Bar dataKey="消极" fill="#F0A0A0" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 雷达图对比 */}
          <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Radar className="h-5 w-5 text-[#A78BFA]" />
              多维度能力对比
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" stroke="#9ca3af" />
                <PolarRadiusAxis stroke="#9ca3af" />
                {/* 本品系列：第一个渲染 */}
                {own && (
                  <ReRadar
                    name={own.name}
                    dataKey={own.name}
                    stroke={SOFT_NEO_COLORS[0]}
                    fill={SOFT_NEO_COLORS[0]}
                    fillOpacity={0.3}
                  />
                )}
                {/* 竞品系列 */}
                {competitors.map((brand: any, index: number) => (
                  <ReRadar
                    key={brand.code}
                    name={brand.name}
                    dataKey={brand.name}
                    stroke={SOFT_NEO_COLORS[(index + 1) % SOFT_NEO_COLORS.length]}
                    fill={SOFT_NEO_COLORS[(index + 1) % SOFT_NEO_COLORS.length]}
                    fillOpacity={0.15}
                  />
                ))}
                <Legend />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    color: "#1f2937",
                    borderRadius: "12px",
                    boxShadow: "0 8px 32px rgba(140,124,240,0.08)",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* 本品对标产品概况 */}
          {own && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Target className="h-5 w-5 text-[#8C7CF0]" />
                本品概况 — {own.name}
              </h2>
              {/* KPI 卡片 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-4">
                  <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>总反馈数</div>
                  <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{own.totalFeedback}</div>
                </div>
                <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-4">
                  <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>积极占比</div>
                  <div className="text-2xl font-bold text-[#7DD3A8]">{own.sentimentPercent.positive}%</div>
                </div>
                <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-4">
                  <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>消极占比</div>
                  <div className="text-2xl font-bold text-[#F0A0A0]">{own.sentimentPercent.negative}%</div>
                </div>
                <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-4">
                  <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>分类数</div>
                  <div className="text-2xl font-bold text-[#8C7CF0]">{own.categoryBreakdown.length}</div>
                </div>
              </div>

              {/* 分类明细表格 */}
              <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                  <MessageSquare className="h-4 w-4 text-[#F5D78E]" />
                  {own.name} — 反馈分类明细
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
                        <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--text-muted)" }}>分类</th>
                        <th className="text-right py-2 px-3 font-medium" style={{ color: "var(--text-muted)" }}>数量</th>
                        <th className="text-right py-2 px-3 font-medium" style={{ color: "var(--text-muted)" }}>占比</th>
                        <th className="text-right py-2 px-3 font-medium" style={{ color: "var(--text-muted)" }}>好评率</th>
                        <th className="text-right py-2 px-3 font-medium" style={{ color: "var(--text-muted)" }}>差评率</th>
                        <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--text-muted)" }}>趋势</th>
                      </tr>
                    </thead>
                    <tbody>
                      {own.categoryBreakdown.map((cat: any) => (
                        <tr key={cat.category} className="border-b hover:bg-gray-50" style={{ borderColor: "var(--border-subtle)" }}>
                          <td className="py-2.5 px-3" style={{ color: "var(--text-primary)" }}>{cat.category}</td>
                          <td className="py-2.5 px-3 text-right font-mono" style={{ color: "var(--text-primary)" }}>{cat.total}</td>
                          <td className="py-2.5 px-3 text-right" style={{ color: "var(--text-secondary)" }}>
                            {own.totalFeedback > 0 ? Math.round((cat.total / own.totalFeedback) * 100) : 0}%
                          </td>
                          <td className="py-2.5 px-3 text-right text-[#7DD3A8]">{cat.positiveRate}%</td>
                          <td className="py-2.5 px-3 text-right text-[#F0A0A0]">{cat.negativeRate}%</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${cat.positiveRate}%`, background: "linear-gradient(to right, #F0A0A0, #F5D78E, #7DD3A8)" }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 紧急度分布 */}
              {own.urgencyDistribution?.length > 0 && (
                <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-6 mt-4">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                    <AlertTriangle className="h-4 w-4 text-[#F0A0A0]" />
                    紧急度分布
                  </h3>
                  <div className="flex gap-4">
                    {own.urgencyDistribution.map((u: any) => {
                      const colorMap: Record<string, string> = { '高': '#F0A0A0', '中': '#F5D78E', '低': '#7DD3A8' };
                      const color = colorMap[u.level] || '#9B96B0';
                      return (
                        <div key={u.level} className="flex-1 text-center">
                          <div className="text-2xl font-bold" style={{ color }}>{u.count}</div>
                          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{u.level}紧急</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 差距分析 */}
          {data?.gaps?.length > 0 && (
            <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <TrendingDown className="h-5 w-5 text-[#F0A0A0]" />
                关键差距
              </h2>
              <div className="space-y-3">
                {data.gaps.map((gap: any, i: number) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    style={{ background: "var(--bg-secondary)", borderColor: "var(--border-subtle)" }}
                  >
                    <div>
                      <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                        {gap.dimension}
                      </span>
                      <div className="flex gap-4 mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span>本品: {gap.ownScore}</span>
                        <span>竞品均值: {gap.competitorScore}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {gap.gap > 0 ? (
                        <TrendingUp className="h-4 w-4 text-[#7DD3A8]" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-[#F0A0A0]" />
                      )}
                      <span
                        className={`font-mono-data font-bold ${
                          gap.gap > 0 ? "text-[#7DD3A8]" : "text-[#F0A0A0]"
                        }`}
                      >
                        {gap.gap > 0 ? "+" : ""}
                        {gap.gap}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </AppShell>
  );
}
