"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Tag, Plus, Pencil, PackageOpen, Trash2, Search, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

interface Brand {
  id: string;
  name: string;
  code: string;
  color: string;
  description: string | null;
  feedbackCount: number;
  isActive: boolean;
}

interface BrandFormData {
  name: string;
  code: string;
  color: string;
  description: string;
}

const defaultFormData: BrandFormData = {
  name: "",
  code: "",
  color: "#6366f1",
  description: "",
};

export default function CompetitorBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState<BrandFormData>(defaultFormData);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBrands = () => {
    setLoading(true);
    fetch("/api/competitor-brands")
      .then((r) => r.json())
      .then((d) => setBrands(d.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  // 打开新增模态框
  const openCreateModal = () => {
    setEditingBrand(null);
    setFormData(defaultFormData);
    setModalOpen(true);
  };

  // 打开编辑模态框
  const openEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      code: brand.code,
      color: brand.color || "#6366f1",
      description: brand.description || "",
    });
    setModalOpen(true);
  };

  // 关闭模态框
  const closeModal = () => {
    setModalOpen(false);
    setEditingBrand(null);
    setFormData(defaultFormData);
  };

  // 提交表单（新增或编辑）
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) return;

    setSubmitting(true);
    try {
      if (editingBrand) {
        // 编辑
        const res = await fetch(`/api/competitor-brands/${editingBrand.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            color: formData.color,
            description: formData.description || null,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "更新失败");
          return;
        }
      } else {
        // 新增
        const res = await fetch("/api/competitor-brands", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            code: formData.code,
            color: formData.color,
            description: formData.description || null,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "新增失败");
          return;
        }
      }
      closeModal();
      fetchBrands();
    } catch (error) {
      console.error(error);
      alert("操作失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  // 删除品牌
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/competitor-brands/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "删除失败");
        return;
      }
      setDeleteTarget(null);
      fetchBrands();
    } catch (error) {
      console.error(error);
      alert("删除失败，请重试");
    } finally {
      setDeleting(false);
    }
  };

  // 前端过滤
  const filteredBrands = brands.filter(
    (b) => b.name.includes(searchQuery) || b.code.includes(searchQuery)
  );

  return (
    <AppShell>
      <main className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
        {/* Header */}
        <div className="border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
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
                <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                  竞品品牌管理
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索品牌名称或代码..."
                    className="rounded-lg border pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 w-64"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors btn-primary"
                >
                  <Tag className="h-4 w-4" />
                  新增品牌
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* 加载状态 */}
          {loading ? (
            <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl p-12 text-center" style={{ color: "var(--text-muted)" }}>
              加载中...
            </div>
          ) : filteredBrands.length === 0 ? (
            /* 空状态 */
            <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl p-16 text-center">
              <PackageOpen className="h-16 w-16 mx-auto mb-4 opacity-50" style={{ color: "var(--text-muted)" }} />
              <p className="text-lg mb-2" style={{ color: "var(--text-secondary)" }}>暂无竞品品牌</p>
              <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                点击右上角"新增品牌"按钮添加第一个竞品品牌
              </p>
              <button
                onClick={openCreateModal}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors btn-primary"
              >
                <Plus className="h-4 w-4" />
                新增品牌
              </button>
            </div>
          ) : (
            /* 品牌卡片网格 */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBrands.map((brand) => (
                <div
                  key={brand.id}
                  className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl p-5 flex flex-col"
                >
                  {/* 顶部: 颜色标记 + 名称 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: brand.color || "#6366f1" }}
                      />
                      <h3 className="font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                        {brand.name}
                      </h3>
                    </div>
                  </div>

                  {/* 中间: code + 描述 + 反馈数量 */}
                  <div className="flex-1 space-y-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>Code:</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ color: "var(--text-secondary)", background: "var(--bg-secondary)" }}>
                        {brand.code}
                      </span>
                    </div>
                    {brand.description && (
                      <p className="text-sm line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                        {brand.description}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                      <Tag className="h-3 w-3" />
                      <span>关联反馈: </span>
                      <span className="font-mono text-[#06b6d4]">
                        {brand.feedbackCount}
                      </span>
                    </div>
                  </div>

                  {/* 底部: 操作按钮 */}
                  <div className="flex items-center gap-2 border-t pt-4" style={{ borderColor: "var(--border-subtle)" }}>
                    <button
                      onClick={() => openEditModal(brand)}
                      className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-colors"
                      style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                    >
                      <Pencil className="h-3 w-3" />
                      编辑
                    </button>
                    <button
                      onClick={() => setDeleteTarget(brand)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-xs text-red-500 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 新增/编辑模态框 */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 遮罩 */}
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={closeModal}
            />
            {/* 模态框内容 */}
            <div className="relative bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-lg font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
                {editingBrand ? "编辑品牌" : "新增品牌"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 品牌名称 */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    品牌名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="请输入品牌名称"
                    required
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>

                {/* 品牌代码 */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    品牌代码 / Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="请输入品牌代码，如 comp_a"
                    required
                    disabled={!!editingBrand}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                  {editingBrand && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      品牌代码创建后不可修改
                    </p>
                  )}
                </div>

                {/* 颜色 */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    颜色
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="h-9 w-12 rounded-lg border cursor-pointer"
                      style={{ borderColor: "var(--border-subtle)", background: "var(--bg-primary)" }}
                    />
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      placeholder="#6366f1"
                      className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1"
                      style={{ borderColor: "var(--border-subtle)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                    />
                    <span
                      className="inline-block h-9 w-9 rounded-lg border flex-shrink-0"
                      style={{ backgroundColor: formData.color, borderColor: "var(--border-subtle)" }}
                    />
                  </div>
                </div>

                {/* 描述 */}
                <div>
                  <label className="block text-sm mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    描述
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="请输入品牌描述（可选）"
                    rows={3}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 resize-none"
                    style={{ borderColor: "var(--border-subtle)", background: "var(--bg-primary)", color: "var(--text-primary)" }}
                  />
                </div>

                {/* 按钮 */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border px-4 py-2 text-sm transition-colors"
                    style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.name.trim() || !formData.code.trim()}
                    className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed btn-primary"
                  >
                    {submitting
                      ? "提交中..."
                      : editingBrand
                      ? "保存修改"
                      : "确认新增"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 删除确认弹窗 */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)}
            />
            <div className="relative bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  确认删除品牌
                </h2>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  你确定要删除品牌 <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{deleteTarget.name}</span> 吗？
                </p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  该品牌下共有 <span className="font-mono text-[#06b6d4]">{deleteTarget.feedbackCount}</span> 条关联反馈数据。
                </p>
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-500">
                    删除后不可恢复，该品牌下所有竞品反馈数据也将被删除。
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-lg border px-4 py-2 text-sm transition-colors"
                  style={{ background: "var(--bg-tertiary)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? "删除中..." : "确认删除"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
