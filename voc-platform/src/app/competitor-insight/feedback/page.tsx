"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Tag,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

interface CompetitorProduct {
  name: string;
  code: string;
}

interface CompetitorFeedback {
  id: string;
  brandName: string;
  productCode: string;
  product: CompetitorProduct | null;
  sentiment: string;
  category: string;
  coreIssue: string;
  urgency: string;
  source: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface CompetitorBrand {
  id: string;
  name: string;
  code: string;
}

export default function CompetitorFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<CompetitorFeedback[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    sentiment: "",
    urgency: "",
    source: "",
    brand: "",
  });
  const [brands, setBrands] = useState<CompetitorBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  // 加载品牌列表
  const fetchBrands = async () => {
    setBrandsLoading(true);
    try {
      const response = await fetch("/api/competitor-brands");
      const data = await response.json();
      setBrands(data.data || []);
    } catch (error) {
      console.error("获取品牌列表失败:", error);
    } finally {
      setBrandsLoading(false);
    }
  };

  // 加载反馈数据
  const fetchFeedbacks = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("pageSize", "20");
      if (search) params.append("search", search);
      if (filters.sentiment) params.append("sentiment", filters.sentiment);
      if (filters.urgency) params.append("urgency", filters.urgency);
      if (filters.source) params.append("source", filters.source);
      if (filters.brand) params.append("brand", filters.brand);

      const response = await fetch(`/api/competitor/feedback?${params}`);
      const data = await response.json();
      setFeedbacks(data.data || []);
      setPagination(data.pagination || null);
    } catch (error) {
      console.error("获取竞品反馈失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
    fetchFeedbacks();
  }, []);

  const handleSearch = () => {
    fetchFeedbacks(1);
  };

  const getSentimentDisplay = (sentiment: string) => {
    switch (sentiment) {
      case "积极":
        return {
          class: "bg-green-50 text-green-600 border border-green-200",
          icon: TrendingUp,
          label: "积极",
        };
      case "中性":
        return {
          class: "bg-gray-50 text-gray-500 border border-gray-200",
          icon: Minus,
          label: "中性",
        };
      case "消极":
        return {
          class: "bg-red-50 text-red-500 border border-red-200",
          icon: TrendingDown,
          label: "消极",
        };
      default:
        return {
          class: "bg-gray-50 text-gray-500 border border-gray-200",
          icon: Minus,
          label: sentiment,
        };
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "高":
        return "text-red-500";
      case "中":
        return "text-amber-500";
      case "低":
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AppShell>
      <main className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        {/* Header */}
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
                返回竞品洞察中心
              </Link>
              <div className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-[#F0A0A0]" />
                <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>竞品反馈</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* 筛选区 */}
          <div className="mb-6 bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl p-4">
            <div className="flex flex-wrap gap-4">
              {/* 搜索框 */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    placeholder="搜索核心痛点或反馈内容..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="w-full rounded-lg border pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 transition-colors"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>

              {/* 情绪筛选 */}
              <select
                value={filters.sentiment}
                onChange={(e) =>
                  setFilters({ ...filters, sentiment: e.target.value })
                }
                className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ borderColor: "var(--border-subtle)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
              >
                <option value="">全部情绪</option>
                <option value="积极">积极</option>
                <option value="中性">中性</option>
                <option value="消极">消极</option>
              </select>

              {/* 紧急度筛选 */}
              <select
                value={filters.urgency}
                onChange={(e) =>
                  setFilters({ ...filters, urgency: e.target.value })
                }
                className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ borderColor: "var(--border-subtle)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
              >
                <option value="">全部紧急度</option>
                <option value="高">高</option>
                <option value="中">中</option>
                <option value="低">低</option>
              </select>

              {/* 来源筛选 */}
              <select
                value={filters.source}
                onChange={(e) =>
                  setFilters({ ...filters, source: e.target.value })
                }
                className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                style={{ borderColor: "var(--border-subtle)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
              >
                <option value="">全部来源</option>
                <option value="公域">公域</option>
                <option value="私域">私域</option>
              </select>

              {/* 品牌筛选 */}
              <select
                value={filters.brand}
                onChange={(e) =>
                  setFilters({ ...filters, brand: e.target.value })
                }
                disabled={brandsLoading}
                className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 disabled:opacity-50"
                style={{ borderColor: "var(--border-subtle)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
              >
                <option value="">全部品牌</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.code}>
                    {brand.name}
                  </option>
                ))}
              </select>

              {/* 筛选按钮 */}
              <button
                onClick={handleSearch}
                className="inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors btn-primary"
              >
                <Filter className="mr-2 h-4 w-4" />
                筛选
              </button>
            </div>
          </div>

          {/* 数据表格 */}
          <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 text-[#8C7CF0] animate-spin" />
                <span className="ml-2" style={{ color: "var(--text-muted)" }}>加载中...</span>
              </div>
            ) : feedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <MessageSquare className="h-12 w-12 mb-4" style={{ color: "var(--border-subtle)" }} />
                <p style={{ color: "var(--text-muted)" }}>暂无竞品反馈数据</p>
                <Link
                  href="/upload"
                  className="mt-2 text-sm transition-colors"
                  style={{ color: "var(--primary)" }}
                >
                  去上传数据
                </Link>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="font-medium border-b" style={{ background: "var(--bg-secondary)", color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}>
                      <tr>
                        <th className="px-4 py-3">品牌</th>
                        <th className="px-4 py-3">商品ID</th>
                        <th className="px-4 py-3">对标本品</th>
                        <th className="px-4 py-3">情绪</th>
                        <th className="px-4 py-3">分类</th>
                        <th className="px-4 py-3">核心痛点</th>
                        <th className="px-4 py-3">紧急度</th>
                        <th className="px-4 py-3">来源</th>
                        <th className="px-4 py-3">时间</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                      {feedbacks.map((feedback) => {
                        const sd = getSentimentDisplay(feedback.sentiment);
                        const SentimentIcon = sd.icon;
                        return (
                          <tr
                            key={feedback.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            {/* 品牌 */}
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-500 border border-red-200">
                                {feedback.brandName}
                              </span>
                            </td>

                            {/* 商品ID */}
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-500 border border-purple-200">
                                {feedback.productCode || "-"}
                              </span>
                            </td>

                            {/* 对标本品 */}
                            <td className="px-4 py-3">
                              {feedback.product ? (
                                <span
                                  className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-500 border border-blue-200 cursor-default"
                                  title={feedback.product.name}
                                >
                                  {feedback.product.code}
                                </span>
                              ) : (
                                <span style={{ color: "var(--text-muted)" }}>-</span>
                              )}
                            </td>

                            {/* 情绪 */}
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${sd.class}`}
                              >
                                <SentimentIcon className="h-3 w-3" />
                                {sd.label}
                              </span>
                            </td>

                            {/* 分类 */}
                            <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                              {feedback.category || "-"}
                            </td>

                            {/* 核心痛点 */}
                            <td className="px-4 py-3 relative group">
                              <div className="max-w-[160px] truncate" style={{ color: "var(--text-primary)" }}>
                                {feedback.coreIssue || "-"}
                              </div>
                              {/* Hover tooltip - 完整痛点 */}
                              {feedback.coreIssue && (
                                <div className="absolute left-2 top-full z-30 hidden group-hover:block w-64 p-3 rounded-lg bg-white border shadow-xl mt-1" style={{ borderColor: "var(--border-subtle)" }}>
                                  <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                                    完整痛点
                                  </p>
                                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-primary)" }}>
                                    {feedback.coreIssue}
                                  </p>
                                </div>
                              )}
                            </td>

                            {/* 紧急度 */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                {feedback.urgency === "高" && (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                                <span
                                  className={`font-medium ${getUrgencyColor(
                                    feedback.urgency
                                  )}`}
                                >
                                  {feedback.urgency}
                                </span>
                              </div>
                            </td>

                            {/* 来源 */}
                            <td className="px-4 py-3">
                              <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                                {feedback.source}
                              </span>
                            </td>

                            {/* 时间 */}
                            <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                              {formatDate(feedback.createdAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 分页 */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                    <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                      共 {pagination.total} 条，第 {pagination.page} /{" "}
                      {pagination.totalPages} 页
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchFeedbacks(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                        className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => fetchFeedbacks(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                        className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                        style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </AppShell>
  );
}
