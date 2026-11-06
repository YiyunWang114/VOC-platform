"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  AlertTriangle,
  X,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

interface Product {
  id: string;
  name: string;
  code: string;
  category?: string;
  description?: string;
  feedbackCount: number;
  isActive: boolean;
}

interface ProductFormData {
  name: string;
  code: string;
  category: string;
  description: string;
}

const emptyForm: ProductFormData = {
  name: "",
  code: "",
  category: "",
  description: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/products");
      const data = await response.json();
      setProducts(data.data || data || []);
    } catch (error) {
      console.error("获取产品列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormData(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      code: product.code,
      category: product.category || "",
      description: product.description || "",
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setFormData(emptyForm);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) return;

    setSubmitting(true);
    try {
      if (editingProduct) {
        // 更新产品
        const response = await fetch(`/api/products/${editingProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            category: formData.category || undefined,
            description: formData.description || undefined,
            isActive: editingProduct.isActive,
          }),
        });
        if (response.ok) {
          closeModal();
          fetchProducts();
        }
      } else {
        // 创建产品
        const response = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            code: formData.code,
            category: formData.category || undefined,
            description: formData.description || undefined,
          }),
        });
        if (response.ok) {
          closeModal();
          fetchProducts();
        }
      }
    } catch (error) {
      console.error("操作失败:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const response = await fetch(`/api/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setDeleteTarget(null);
        fetchProducts();
      }
    } catch (error) {
      console.error("删除产品失败:", error);
    }
  };

  return (
    <AppShell>
      <main className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)" }}>
        {/* Header */}
        <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] border-b" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="inline-flex items-center text-sm transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  返回首页
                </Link>
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" style={{ color: "var(--accent-primary)" }} />
                  <h1 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
                    产品管理
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* 操作栏 */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索产品名称或编码..."
                  className="input-soft pl-9 pr-3 py-2 text-sm w-64"
                />
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                共 <span className="font-medium" style={{ color: "var(--text-primary)" }}>{products.length}</span> 个产品
              </p>
            </div>
            <button
              onClick={openCreateModal}
              className="btn-primary inline-flex items-center px-4 py-2 text-sm font-medium"
            >
              <Plus className="mr-2 h-4 w-4" />
              新增产品
            </button>
          </div>

          {/* 产品列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent-primary)" }} />
              <span className="ml-2" style={{ color: "var(--text-muted)" }}>加载中...</span>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl flex flex-col items-center justify-center py-20">
              <Package className="h-12 w-12 mb-4" style={{ color: "var(--border-subtle)" }} />
              <p className="mb-2" style={{ color: "var(--text-muted)" }}>暂无产品数据</p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                点击上方「新增产品」按钮创建第一个产品
              </p>
            </div>
          ) : (
            (() => {
              const filteredProducts = products.filter(
                (p) =>
                  p.name.includes(searchQuery) || p.code.includes(searchQuery)
              );
              return filteredProducts.length === 0 ? (
                <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl flex flex-col items-center justify-center py-20">
                  <Search className="h-12 w-12 mb-4" style={{ color: "var(--border-subtle)" }} />
                  <p className="mb-2" style={{ color: "var(--text-muted)" }}>未找到匹配的产品</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    尝试调整搜索关键词
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-subtle)" }}>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                            产品名称
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                            产品编码
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                            类别
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                            描述
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                            反馈数量
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>
                            操作
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                        {filteredProducts.map((product) => (
                          <tr
                            key={product.id}
                            className="bg-white transition-colors hover:bg-[var(--bg-hover)]"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4" style={{ color: "var(--accent-primary)" }} />
                                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                  {product.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm font-mono" style={{ color: "var(--text-secondary)" }}>
                                {product.code}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                                {product.category || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm line-clamp-1 max-w-[200px]" style={{ color: "var(--text-muted)" }}>
                                {product.description || "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border" style={{ backgroundColor: "var(--accent-primary)", color: "#fff", borderColor: "var(--accent-primary)" }}>
                                {product.feedbackCount}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => openEditModal(product)}
                                  className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs transition-colors"
                                  style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                                  title="编辑"
                                >
                                  <Pencil className="h-3.5 w-3.5 mr-1" />
                                  编辑
                                </button>
                                <button
                                  onClick={() => setDeleteTarget(product)}
                                  className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
                                  style={{ backgroundColor: "rgba(244,63,94,0.1)", borderColor: "rgba(244,63,94,0.2)", color: "#f43f5e" }}
                                  title="删除"
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  删除
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()
          )}
        </div>

        {/* 删除确认弹窗 */}
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setDeleteTarget(null)}
            />
            <div className="relative bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl w-full max-w-md mx-4 p-6 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center rounded-full p-2" style={{ backgroundColor: "rgba(244,63,94,0.1)" }}>
                  <AlertTriangle className="h-5 w-5" style={{ color: "#f43f5e" }} />
                </div>
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  确认删除产品
                </h2>
              </div>
              <div className="space-y-3 mb-6">
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  确定要删除产品{" "}
                  <span className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {deleteTarget.name}
                  </span>{" "}
                  吗？
                </p>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  该产品关联了{" "}
                  <span className="font-medium" style={{ color: "var(--accent-primary)" }}>
                    {deleteTarget.feedbackCount}
                  </span>{" "}
                  条反馈数据。
                </p>
                <div className="rounded-lg border px-3 py-2" style={{ backgroundColor: "rgba(244,63,94,0.05)", borderColor: "rgba(244,63,94,0.2)" }}>
                  <p className="text-xs" style={{ color: "#f43f5e" }}>
                    删除后不可恢复，请谨慎操作。
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-lg border px-4 py-2 text-sm transition-colors"
                  style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                >
                  取消
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: "#f43f5e" }}
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 新增/编辑模态框 */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* 遮罩层 */}
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={closeModal}
            />
            {/* 模态框内容 */}
            <div className="relative bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl w-full max-w-lg mx-4 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
                  {editingProduct ? "编辑产品" : "新增产品"}
                </h2>
                <button
                  onClick={closeModal}
                  className="inline-flex items-center justify-center rounded-lg transition-colors p-1"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text-primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 产品名称 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    产品名称 <span style={{ color: "#f43f5e" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="请输入产品名称"
                    className="input-soft w-full"
                  />
                </div>

                {/* 产品编码 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    产品编码 (Code) <span style={{ color: "#f43f5e" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder="请输入产品编码"
                    disabled={!!editingProduct}
                    className="input-soft w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                {/* 类别 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    类别 <span style={{ color: "var(--text-muted)" }}>(可选)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="请输入产品类别"
                    className="input-soft w-full"
                  />
                </div>

                {/* 描述 */}
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    描述 <span style={{ color: "var(--text-muted)" }}>(可选)</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="请输入产品描述"
                    rows={3}
                    className="input-soft w-full resize-none"
                  />
                </div>
              </div>

              {/* 按钮区域 */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t" style={{ borderColor: "var(--border-subtle)" }}>
                <button
                  onClick={closeModal}
                  className="rounded-lg border px-4 py-2 text-sm transition-colors"
                  style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-subtle)", color: "var(--text-primary)" }}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={
                    submitting ||
                    !formData.name.trim() ||
                    !formData.code.trim()
                  }
                  className="btn-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="inline h-4 w-4 mr-1.5 animate-spin" />
                      提交中...
                    </>
                  ) : editingProduct ? (
                    "确认修改"
                  ) : (
                    "确认创建"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
