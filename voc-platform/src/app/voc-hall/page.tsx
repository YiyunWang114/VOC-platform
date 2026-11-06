"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Search,
  Filter,
  MessageSquare,
  Trash2,
  Plus,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  X,
  Eye,
  Square,
  CheckSquare,
  Sparkles,
  Copy,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/components/auth/AuthProvider";

interface Feedback {
  id: string;
  rawContent: string;
  coreIssue: string;
  sentiment: string;
  category: string;
  urgency: string;
  source: string;
  churnRisk: number | null;
  brand: string;
  brandName: string;
  createdAt: string;
  productCode: string | null;
  product: { id: string; name: string; code: string } | null;
  tickets: { id: string; status: string }[];
}

const sentimentOptions = [
  { value: "positive", label: "正面", icon: Smile, color: "text-green-500", bg: "bg-green-50" },
  { value: "neutral", label: "中性", icon: Meh, color: "text-yellow-500", bg: "bg-yellow-50" },
  { value: "negative", label: "负面", icon: Frown, color: "text-red-500", bg: "bg-red-50" },
];

const urgencyOptions = [
  { value: "高", label: "高", color: "badge-soft-red" },
  { value: "中", label: "中", color: "badge-soft-amber" },
  { value: "低", label: "低", color: "badge-soft-blue" },
];

export default function VocHallPage() {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    sentiment: "",
    urgency: "",
    source: "",
    brandType: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketForm, setTicketForm] = useState({ title: "", description: "", priority: "P1" });
  const [sources, setSources] = useState<string[]>([]);
  const [expandedContent, setExpandedContent] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [smartReplyModal, setSmartReplyModal] = useState<{
    isOpen: boolean;
    feedbackId: string;
    reply: string;
    loading: boolean;
    tone: string;
  }>({ isOpen: false, feedbackId: "", reply: "", loading: false, tone: "sincere" });

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", pagination.page.toString());
      params.set("pageSize", pagination.pageSize.toString());
      if (filters.sentiment) params.set("sentiment", filters.sentiment);
      if (filters.urgency) params.set("urgency", filters.urgency);
      if (filters.source) params.set("source", filters.source);
      if (filters.brandType !== "all") params.set("brandType", filters.brandType);
      if (searchQuery) params.set("search", searchQuery);

      const response = await fetch(`/api/feedback?${params.toString()}`);
      const data = await response.json();
      setFeedbacks(data.data || []);
      setPagination(data.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 });
    } catch (error) {
      console.error("获取反馈列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSources = async () => {
    try {
      const response = await fetch("/api/feedback?sources=true");
      const data = await response.json();
      setSources(data.data || []);
    } catch (error) {
      console.error("获取来源列表失败:", error);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    fetchSources();
  }, [pagination.page, filters]);

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchFeedbacks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条反馈吗？")) return;
    try {
      const response = await fetch(`/api/feedback?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        fetchFeedbacks();
      }
    } catch (error) {
      console.error("删除反馈失败:", error);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === feedbacks.length && feedbacks.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(feedbacks.map((f) => f.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除选中的 ${selectedIds.size} 条反馈吗？`)) return;
    try {
      const response = await fetch("/api/feedback", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "batch_delete", ids: Array.from(selectedIds) }),
      });
      if (response.ok) {
        setSelectedIds(new Set());
        fetchFeedbacks();
      }
    } catch (error) {
      console.error("批量删除失败:", error);
    }
  };

  const handleGenerateReply = async (feedbackId: string, tone: string = "sincere") => {
    setSmartReplyModal({ isOpen: true, feedbackId, reply: "", loading: true, tone });
    try {
      const response = await fetch("/api/smart-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feedbackId, tone }),
      });
      const data = await response.json();
      if (data.success) {
        setSmartReplyModal((prev) => ({ ...prev, reply: data.reply, loading: false }));
      } else {
        setSmartReplyModal((prev) => ({ ...prev, reply: "生成失败：" + data.error, loading: false }));
      }
    } catch (error) {
      setSmartReplyModal((prev) => ({ ...prev, reply: "生成失败，请重试", loading: false }));
    }
  };

  const canGenerateReply = user?.role === "admin" || user?.role === "customerService";

  const handleCreateTicket = async () => {
    if (!selectedFeedback || !ticketForm.title) return;
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ticketForm.title,
          description: ticketForm.description,
          priority: ticketForm.priority,
          feedbackId: selectedFeedback.id,
        }),
      });
      if (response.ok) {
        setShowTicketModal(false);
        setTicketForm({ title: "", description: "", priority: "P1" });
        setSelectedFeedback(null);
        fetchFeedbacks();
      }
    } catch (error) {
      console.error("创建工单失败:", error);
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    // 兼容多种 sentiment 值格式（中文/英文/拼音）
    const normalizedSentiment =
      sentiment === "正面" || sentiment === "积极" || sentiment === "positive" ? "positive" :
      sentiment === "中性" || sentiment === "neutral" ? "neutral" :
      sentiment === "负面" || sentiment === "消极" || sentiment === "negative" ? "negative" :
      sentiment;

    const option = sentimentOptions.find((s) => s.value === normalizedSentiment);
    if (!option) return <span style={{ color: "var(--text-muted)" }}>-</span>;
    const Icon = option.icon;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${option.bg} ${option.color}`}>
        <Icon className="h-3 w-3" />
        {option.label}
      </span>
    );
  };

  const getUrgencyBadge = (urgency: string) => {
    const option = urgencyOptions.find((u) => u.value === urgency);
    if (!option) return null;
    return (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${option.color}`}>
        {option.label}
      </span>
    );
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-[var(--bg-primary)]">
        {/* Header */}
        <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] border-b border-[var(--border-subtle)]">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  返回首页
                </Link>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[var(--accent-primary)]" />
                  <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                    VoC 数据大厅
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/kanban"
                  className="btn-primary inline-flex items-center rounded-lg px-4 py-2 text-sm font-medium"
                >
                  <Ticket className="mr-2 h-4 w-4" />
                  工单看板
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Search & Filter Bar */}
          <div className="bg-white rounded-2xl shadow-soft p-4 mb-6">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="搜索反馈内容..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                />
              </div>
              <button
                onClick={handleSearch}
                className="btn-primary rounded-xl px-4 py-2.5 text-sm font-medium"
              >
                搜索
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  showFilters
                    ? "border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]"
                    : "border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                <Filter className="h-4 w-4" />
                筛选
              </button>
            </div>

            {showFilters && (
              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <select
                  value={filters.sentiment}
                  onChange={(e) => setFilters((prev) => ({ ...prev, sentiment: e.target.value }))}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                >
                  <option value="">全部情感</option>
                  <option value="positive">正面</option>
                  <option value="neutral">中性</option>
                  <option value="negative">负面</option>
                </select>
                <select
                  value={filters.urgency}
                  onChange={(e) => setFilters((prev) => ({ ...prev, urgency: e.target.value }))}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                >
                  <option value="">全部紧急度</option>
                  <option value="高">高</option>
                  <option value="中">中</option>
                  <option value="低">低</option>
                </select>
                <select
                  value={filters.source}
                  onChange={(e) => setFilters((prev) => ({ ...prev, source: e.target.value }))}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                >
                  <option value="">全部来源</option>
                  {sources.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <select
                  value={filters.brandType}
                  onChange={(e) => setFilters((prev) => ({ ...prev, brandType: e.target.value }))}
                  className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
                >
                  <option value="all">全部品牌</option>
                  <option value="own">本品</option>
                  <option value="competitor">竞品</option>
                </select>
              </div>
            )}
          </div>

          {/* Feedback List */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 text-[var(--accent-primary)] animate-spin" />
              <span className="ml-2 text-[var(--text-muted)]">加载中...</span>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-soft">
              <MessageSquare className="h-12 w-12 text-[var(--border-subtle)] mb-4" />
              <p className="text-[var(--text-muted)]">暂无反馈数据</p>
              <Link
                href="/upload"
                className="mt-2 text-sm text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] transition-colors"
              >
                去上传数据
              </Link>
            </div>
          ) : (
            <>
              {/* 批量操作栏 */}
              {selectedIds.size > 0 && (
                <div className="flex items-center justify-between bg-white rounded-xl shadow-soft px-4 py-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      已选中 {selectedIds.size} 条
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedIds(new Set())}
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm transition-colors hover:bg-gray-50"
                      style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
                    >
                      <X className="h-3.5 w-3.5" />
                      取消选择
                    </button>
                    <button
                      onClick={handleBatchDelete}
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 text-red-600 px-3 py-1.5 text-sm font-medium hover:bg-red-100 transition-colors border border-red-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      批量删除
                    </button>
                  </div>
                </div>
              )}
              {/* 数据表格 */}
              <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="font-medium border-b" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", borderColor: "var(--border-subtle)" }}>
                      <tr>
                        <th className="px-2 py-3 w-[3%] text-center">
                          <button
                            onClick={toggleSelectAll}
                            className="inline-flex items-center justify-center rounded-md p-1 hover:bg-[var(--accent-primary)]/10 transition-colors"
                            title={selectedIds.size === feedbacks.length && feedbacks.length > 0 ? "取消全选" : "全选"}
                          >
                            {selectedIds.size === feedbacks.length && feedbacks.length > 0 ? (
                              <CheckSquare className="h-4 w-4 text-[var(--accent-primary)]" />
                            ) : selectedIds.size > 0 ? (
                              <div className="relative">
                                <Square className="h-4 w-4 text-[var(--accent-primary)]" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-2 h-2 rounded-sm bg-[var(--accent-primary)]" />
                                </div>
                              </div>
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3 whitespace-nowrap" style={{ minWidth: "200px" }}>核心痛点</th>
                        <th className="px-4 py-3 whitespace-nowrap">情感</th>
                        <th className="px-4 py-3 whitespace-nowrap">紧急度</th>
                        <th className="px-4 py-3 whitespace-nowrap">来源</th>
                        <th className="px-4 py-3 whitespace-nowrap">分类</th>
                        <th className="px-4 py-3 whitespace-nowrap">商品ID</th>
                        <th className="px-4 py-3 whitespace-nowrap">商品名称</th>
                        <th className="px-4 py-3 whitespace-nowrap">时间</th>
                        <th className="px-4 py-3 whitespace-nowrap">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                      {feedbacks.map((feedback) => (
                        <tr
                          key={feedback.id}
                          className={`transition-colors ${selectedIds.has(feedback.id) ? 'bg-[var(--accent-primary)]/5' : 'hover:bg-[var(--bg-hover)]'}`}
                        >
                          {/* 复选框 */}
                          <td className="px-2 py-3 text-center">
                            <button
                              onClick={() => toggleSelect(feedback.id)}
                              className="inline-flex items-center justify-center rounded-md p-1 hover:bg-[var(--accent-primary)]/10 transition-colors"
                            >
                              {selectedIds.has(feedback.id) ? (
                                <CheckSquare className="h-4 w-4 text-[var(--accent-primary)]" />
                              ) : (
                                <Square className="h-4 w-4 text-[var(--text-muted)]" />
                              )}
                            </button>
                          </td>
                          {/* 核心痛点 */}
                          <td className="px-4 py-3">
                            <div
                              className="truncate font-medium cursor-default"
                              style={{ color: "var(--text-primary)" }}
                              title={feedback.coreIssue || undefined}
                            >
                              {feedback.coreIssue || "-"}
                            </div>
                          </td>

                          {/* 情感 */}
                          <td className="px-4 py-3 text-center">
                            {getSentimentBadge(feedback.sentiment)}
                          </td>

                          {/* 紧急度 */}
                          <td className="px-4 py-3 text-center">
                            {getUrgencyBadge(feedback.urgency)}
                          </td>

                          {/* 来源 */}
                          <td className="px-4 py-3 text-center">
                            <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs" style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}>
                              {feedback.source}
                            </span>
                          </td>

                          {/* 分类 */}
                          <td className="px-4 py-3 text-center" style={{ color: "var(--text-secondary)" }}>
                            {feedback.category || "-"}
                          </td>

                          {/* 商品ID */}
                          <td className="px-4 py-3">
                            {feedback.productCode ? (
                              <span className="inline-flex rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600 border border-blue-100">
                                {feedback.productCode}
                              </span>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>-</span>
                            )}
                          </td>

                          {/* 商品名称 */}
                          <td className="px-4 py-3">
                            <div className="truncate" style={{ color: "var(--text-secondary)" }}>
                              {feedback.brandName || feedback.product?.name || "-"}
                            </div>
                          </td>

                          {/* 时间 */}
                          <td className="px-4 py-3 text-xs whitespace-nowrap text-center" style={{ color: "var(--text-muted)" }}>
                            {new Date(feedback.createdAt).toLocaleDateString("zh-CN")}
                          </td>

                          {/* 操作 */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {feedback.rawContent && (
                                <button
                                  onClick={() => setExpandedContent(feedback.rawContent)}
                                  className="inline-flex items-center justify-center rounded-md p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                                  title="查看原始内容"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </button>
                              )}
                              {canGenerateReply && (
                                <button
                                  onClick={() => handleGenerateReply(feedback.id)}
                                  className="inline-flex items-center justify-center rounded-md p-1.5 text-[var(--text-muted)] hover:text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 transition-colors"
                                  title="生成回复"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedFeedback(feedback);
                                  setTicketForm({
                                    title: feedback.coreIssue,
                                    description: feedback.rawContent,
                                    priority: feedback.urgency === "高" ? "P0" : feedback.urgency === "中" ? "P1" : "P2",
                                  });
                                  setShowTicketModal(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-2 py-1 text-xs font-medium hover:bg-[var(--accent-primary)]/20 transition-colors"
                                title="派单"
                              >
                                <Plus className="h-3 w-3" />
                                派单
                              </button>
                              <button
                                onClick={() => handleDelete(feedback.id)}
                                className="inline-flex items-center rounded-lg p-1 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="删除"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 分页 */}
                <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                  <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                    共 {pagination.total} 条，第 {pagination.page} / {pagination.totalPages} 页
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page <= 1}
                      className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setPagination((prev) => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="inline-flex items-center rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                      style={{ borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 原始内容展开 Modal */}
              <Modal
                isOpen={!!expandedContent}
                onClose={() => setExpandedContent(null)}
                title="原始反馈内容"
              >
                <div className="max-h-[60vh] overflow-y-auto">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                    {expandedContent}
                  </p>
                </div>
              </Modal>

              {/* 智能回复 Modal */}
              <Modal
                isOpen={smartReplyModal.isOpen}
                onClose={() => setSmartReplyModal({ isOpen: false, feedbackId: "", reply: "", loading: false })}
                title="智能回复生成"
              >
                <div className="space-y-4">
                  {smartReplyModal.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" style={{ color: "var(--accent-primary)" }} />
                      <span style={{ color: "var(--text-secondary)" }}>正在生成回复...</span>
                    </div>
                  ) : (
                    <>
                      {/* 语气选择 */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>回复语气：</span>
                        {[
                          { value: "sincere", label: "真诚" },
                          { value: "professional", label: "专业" },
                          { value: "concise", label: "简洁" },
                        ].map((t) => (
                          <button
                            key={t.value}
                            onClick={() => handleGenerateReply(smartReplyModal.feedbackId, t.value)}
                            disabled={smartReplyModal.loading}
                            className={`px-3 py-1 rounded-lg text-xs transition-colors disabled:opacity-50 ${
                              smartReplyModal.tone === t.value
                                ? "bg-[var(--accent-primary)] text-white"
                                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent-primary)]/10"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 max-h-[50vh] overflow-y-auto">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                          {smartReplyModal.reply}
                        </p>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(smartReplyModal.reply);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-gray-50"
                          style={{ borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}
                        >
                          <Copy className="h-4 w-4" />
                          复制
                        </button>
                        <button
                          onClick={() => handleGenerateReply(smartReplyModal.feedbackId, smartReplyModal.tone)}
                          className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] px-3 py-2 text-sm font-medium hover:bg-[var(--accent-primary)]/20 transition-colors"
                        >
                          <Sparkles className="h-4 w-4" />
                          重新生成
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </Modal>
            </>
          )}
        </div>
      </div>

      {/* Create Ticket Modal */}
      <Modal
        isOpen={showTicketModal}
        onClose={() => {
          setShowTicketModal(false);
          setSelectedFeedback(null);
        }}
        title="创建工单"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              工单标题
            </label>
            <input
              type="text"
              value={ticketForm.title}
              onChange={(e) => setTicketForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              描述
            </label>
            <textarea
              value={ticketForm.description}
              onChange={(e) => setTicketForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
              优先级
            </label>
            <select
              value={ticketForm.priority}
              onChange={(e) => setTicketForm((prev) => ({ ...prev, priority: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/20"
            >
              <option value="P0">P0 - 紧急</option>
              <option value="P1">P1 - 高</option>
              <option value="P2">P2 - 中</option>
              <option value="P3">P3 - 低</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setShowTicketModal(false);
                setSelectedFeedback(null);
              }}
              className="rounded-xl border border-[var(--border-subtle)] bg-white px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleCreateTicket}
              className="btn-primary rounded-xl px-4 py-2 text-sm font-medium"
            >
              创建工单
            </button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
