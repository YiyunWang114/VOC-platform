"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  Target,
  Package,
  Tag,
  MessageSquare,
  RefreshCw,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export default function CompetitorInsightPage() {
  return (
    <AppShell>
      <main className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        {/* Header */}
        <div className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center text-sm transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                返回首页
              </Link>
              <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                竞品洞察中心
              </h1>
              <span className="status-dot active ml-2"></span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* 导航卡片 */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/competitor-insight/comparison">
              <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-6 hover:shadow-[0_12px_40px_rgba(140,124,240,0.12)] transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-[#06b6d4]/10 p-2">
                    <BarChart3 className="h-5 w-5 text-[#06b6d4]" />
                  </div>
                  <h3 className="font-semibold group-hover:text-[#06b6d4] transition-colors" style={{ color: "var(--text-primary)" }}>
                    对比分析
                  </h3>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  本品vs竞品多维度对比
                </p>
              </div>
            </Link>

            <Link href="/competitor-insight/alerts">
              <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-6 hover:shadow-[0_12px_40px_rgba(140,124,240,0.12)] transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-[#f43f5e]/10 p-2">
                    <AlertTriangle className="h-5 w-5 text-[#f43f5e]" />
                  </div>
                  <h3 className="font-semibold group-hover:text-[#f43f5e] transition-colors" style={{ color: "var(--text-primary)" }}>
                    动态告警
                  </h3>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  竞品动态实时监控
                </p>
              </div>
            </Link>

            <Link href="/upload">
              <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-6 hover:shadow-[0_12px_40px_rgba(140,124,240,0.12)] transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-[#8b5cf6]/10 p-2">
                    <Target className="h-5 w-5 text-[#8b5cf6]" />
                  </div>
                  <h3 className="font-semibold group-hover:text-[#8b5cf6] transition-colors" style={{ color: "var(--text-primary)" }}>
                    数据导入
                  </h3>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  导入本品/竞品数据
                </p>
              </div>
            </Link>

            <Link href="/products">
              <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-6 hover:shadow-[0_12px_40px_rgba(140,124,240,0.12)] transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-[#10b981]/10 p-2">
                    <Package className="h-5 w-5 text-[#10b981]" />
                  </div>
                  <h3 className="font-semibold group-hover:text-[#10b981] transition-colors" style={{ color: "var(--text-primary)" }}>
                    产品管理
                  </h3>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  管理产品列表，关联竞品对标
                </p>
              </div>
            </Link>

            <Link href="/competitor-insight/brands">
              <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-6 hover:shadow-[0_12px_40px_rgba(140,124,240,0.12)] transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-[#ec4899]/10 p-2">
                    <Tag className="h-5 w-5 text-[#ec4899]" />
                  </div>
                  <h3 className="font-semibold group-hover:text-[#ec4899] transition-colors" style={{ color: "var(--text-primary)" }}>
                    品牌管理
                  </h3>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  管理竞品品牌列表
                </p>
              </div>
            </Link>

            <Link href="/competitor-insight/feedback">
              <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-6 hover:shadow-[0_12px_40px_rgba(140,124,240,0.12)] transition-all cursor-pointer group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="rounded-lg bg-[#f43f5e]/10 p-2">
                    <MessageSquare className="h-5 w-5 text-[#f43f5e]" />
                  </div>
                  <h3 className="font-semibold group-hover:text-[#f43f5e] transition-colors" style={{ color: "var(--text-primary)" }}>
                    竞品反馈
                  </h3>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  查看竞品用户反馈数据
                </p>
              </div>
            </Link>
          </div>

          {/* 概览统计 */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
              监控概览
            </h2>
            <CompetitorOverview />
          </div>
        </div>
      </main>
    </AppShell>
  );
}

function CompetitorOverview() {
  const [stats, setStats] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetch("/api/competitor/comparison")
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, [refreshKey]);

  if (!stats) {
    return (
      <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-8 text-center" style={{ color: "var(--text-muted)" }}>
        加载中...
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setRefreshKey(k => k + 1)} className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm transition-colors" style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
          <RefreshCw className="mr-1.5 h-4 w-4" /> 刷新数据
        </button>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {stats.brands?.map((brand: any) => (
        <div key={brand.code} className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>{brand.name}</h3>
            <span
              className={`text-xs px-2 py-1 rounded ${
                brand.code === "own"
                  ? "bg-[#06b6d4]/20 text-[#06b6d4]"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {brand.code === "own" ? "本品" : "竞品"}
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>反馈总数</span>
              <span className="font-mono-data" style={{ color: "var(--text-primary)" }}>
                {brand.totalFeedback}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>平均评分</span>
              <span className="font-mono-data" style={{ color: "var(--text-primary)" }}>
                {brand.avgRating}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>负面情绪</span>
              <span
                className={`font-mono-data ${
                  brand.sentimentPercent.negative > 30
                    ? "text-[#f43f5e]"
                    : ""
                }`}
                style={brand.sentimentPercent.negative <= 30 ? { color: "var(--text-primary)" } : undefined}
              >
                {brand.sentimentPercent.negative}%
              </span>
            </div>
          </div>
        </div>
      ))}
      </div>

      {/* 差距分析 */}
      {stats.gaps?.length > 0 && (
        <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-lg p-6 lg:col-span-3">
          <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <TrendingUp className="h-5 w-5 text-[#f59e0b]" />
            本品vs竞品差距
          </h3>
          <div className="space-y-2">
            {stats.gaps.map((gap: any, i: number) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded ${
                  gap.severity === "high"
                    ? "bg-red-50 border border-red-200"
                    : "bg-amber-50 border border-amber-200"
                }`}
              >
                <span className="text-sm" style={{ color: "var(--text-primary)" }}>{gap.dimension}</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    本品: {gap.ownScore}
                  </span>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    竞品: {gap.competitorScore}
                  </span>
                  <span
                    className={`text-sm font-mono-data ${
                      gap.gap > 0 ? "text-[#f43f5e]" : "text-[#10b981]"
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
  );
}
