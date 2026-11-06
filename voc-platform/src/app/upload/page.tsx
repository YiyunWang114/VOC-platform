"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Brain,
  CloudUpload,
  Zap,
  Clock,
  Target,
  Plus,
  X,
  Package,
  Tag,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

interface ProgressState {
  batchId: string;
  progress: number;
  processedCount: number;
  totalCount: number;
  status: string;
}

interface ProductItem {
  id: string;
  name: string;
  code: string;
  category?: string;
}

interface BrandItem {
  id: string;
  name: string;
  code: string;
  color: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    totalCount?: number;
    processedCount?: number;
    failedCount?: number;
  } | null>(null);
  const [source, setSource] = useState("私域");
  const [channel, setChannel] = useState("客服系统");

  // 数据类型: own=本品, competitor=竞品
  const [dataType, setDataType] = useState<"own" | "competitor">("own");

  // 竞品配置
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedBrandCode, setSelectedBrandCode] = useState<string>("");
  const [selectedBrandName, setSelectedBrandName] = useState<string>("");

  // 数据列表
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);

  // 新增品牌弹窗
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandCode, setNewBrandCode] = useState("");
  const [isCreatingBrand, setIsCreatingBrand] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProgressRef = useRef<number>(0);
  const stagnationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 加载产品列表和竞品品牌列表
  useEffect(() => {
    fetch("/api/products?isActive=true")
      .then((r) => r.json())
      .then((res) => setProducts(Array.isArray(res?.data) ? res.data : []))
      .catch(console.error);

    fetch("/api/competitor-brands")
      .then((r) => r.json())
      .then((res) => setBrands(Array.isArray(res?.data) ? res.data : []))
      .catch(console.error);
  }, []);

  // 清理轮询
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (stagnationTimerRef.current) {
      clearTimeout(stagnationTimerRef.current);
      stagnationTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  // 轮询进度
  const pollProgress = useCallback(
    (batchId: string, totalCount: number) => {
      lastProgressRef.current = 0;

      stagnationTimerRef.current = setTimeout(() => {
        console.warn("进度停滞超过60秒，停止轮询");
        stopPolling();
        setProgress((prev) =>
          prev ? { ...prev, status: "timeout" } : null
        );
        setUploadResult({
          success: false,
          message: "处理超时（进度长时间无变化），请稍后在数据大厅查看结果",
        });
        setIsUploading(false);
      }, 60000);

      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await fetch(
            `/api/upload/status?batchId=${batchId}`
          );
          const data = await res.json();

          if (!res.ok) {
            console.error("轮询状态失败:", data.error);
            return;
          }

          setProgress({
            batchId: data.id,
            progress: data.progress,
            processedCount: data.processedCount,
            totalCount: data.totalCount,
            status: data.status,
          });

          if (data.processedCount !== lastProgressRef.current) {
            lastProgressRef.current = data.processedCount;
            if (stagnationTimerRef.current) {
              clearTimeout(stagnationTimerRef.current);
              stagnationTimerRef.current = setTimeout(() => {
                console.warn("进度停滞超过60秒，停止轮询");
                stopPolling();
                setUploadResult({
                  success: false,
                  message: "处理超时（进度长时间无变化），请稍后在数据大厅查看结果",
                });
                setIsUploading(false);
              }, 60000);
            }
          }

          if (data.status === "completed") {
            stopPolling();
            setIsUploading(false);
            setUploadResult({
              success: true,
              message: `成功分析 ${data.processedCount} 条数据`,
              totalCount: data.totalCount,
              processedCount: data.processedCount,
              failedCount: data.totalCount - data.processedCount,
            });
          }

          if (data.status === "failed") {
            stopPolling();
            setIsUploading(false);
            setUploadResult({
              success: false,
              message: "后台处理失败，请检查服务端日志",
            });
          }
        } catch (err) {
          console.error("轮询异常:", err);
        }
      }, 1500);
    },
    [stopPolling]
  );

  // 新增竞品品牌
  const handleCreateBrand = async () => {
    if (!newBrandName.trim() || !newBrandCode.trim()) return;
    setIsCreatingBrand(true);
    try {
      const res = await fetch("/api/competitor-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBrandName.trim(), code: newBrandCode.trim() }),
      });
      if (res.ok) {
        const result = await res.json();
        const brand = result.data;
        setBrands((prev) => [...prev, brand]);
        setSelectedBrandCode(brand.code);
        setSelectedBrandName(brand.name);
        setShowBrandModal(false);
        setNewBrandName("");
        setNewBrandCode("");
      } else {
        const data = await res.json();
        alert(data.error || "创建失败");
      }
    } catch (err) {
      console.error("创建品牌失败:", err);
    } finally {
      setIsCreatingBrand(false);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataType, selectedProductId, selectedBrandCode, selectedBrandName, source, channel]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileUpload(files[0]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataType, selectedProductId, selectedBrandCode, selectedBrandName, source, channel]
  );

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
      setUploadResult({
        success: false,
        message: "请上传 .csv 或 .xlsx 格式的文件",
      });
      return;
    }

    // 竞品数据校验
    if (dataType === "competitor") {
      if (!selectedProductId) {
        setUploadResult({ success: false, message: "请选择对标产品" });
        return;
      }
      if (!selectedBrandCode) {
        setUploadResult({ success: false, message: "请选择竞品品牌" });
        return;
      }
    }

    setIsUploading(true);
    setUploadResult(null);
    setProgress(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("source", source);
      formData.append("channel", channel);

      if (dataType === "competitor") {
        formData.append("brand", selectedBrandCode);
        formData.append("brandName", selectedBrandName);
        formData.append("productId", selectedProductId);
      }

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.batchId) {
        setProgress({
          batchId: data.batchId,
          progress: 0,
          processedCount: 0,
          totalCount: data.totalCount,
          status: "processing",
        });
        pollProgress(data.batchId, data.totalCount);
      } else {
        setIsUploading(false);
        setUploadResult({
          success: false,
          message: data.error || "上传失败",
        });
      }
    } catch (error) {
      setIsUploading(false);
      setUploadResult({
        success: false,
        message: "网络错误，请稍后重试",
      });
    }
  };

  const getProgressColor = () => {
    if (!progress) return "bg-[#06b6d4]";
    if (progress.status === "failed" || progress.status === "timeout")
      return "bg-[#f43f5e]";
    if (progress.progress >= 100) return "bg-[#10b981]";
    return dataType === "competitor" ? "bg-[#f43f5e]" : "bg-[#06b6d4]";
  };

  return (
    <AppShell>
      <main className="min-h-screen">
        {/* Header */}
        <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] border-b border-[var(--border-subtle)]">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <ArrowLeft className="mr-1 h-4 w-4" />
                返回首页
              </Link>
              <div className="flex items-center gap-2">
                <CloudUpload className="h-5 w-5 text-[#06b6d4]" />
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                  数据上传中心
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
          {/* 数据类型选择 */}
          <div className="mb-6 bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-[#8b5cf6]" />
              数据类型
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDataType("own")}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  dataType === "own"
                    ? "border-[#06b6d4] bg-[#06b6d4]/10"
                    : "border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 hover:border-[#0ea5e9]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      dataType === "own" ? "bg-[#06b6d4]" : "bg-[var(--text-muted)]"
                    }`}
                  />
                  <span className="font-medium text-[var(--text-primary)]">本品数据</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  上传自有产品的用户反馈
                </p>
              </button>
              <button
                onClick={() => setDataType("competitor")}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  dataType === "competitor"
                    ? "border-[var(--accent-red)] bg-[var(--accent-red)]/10"
                    : "border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 hover:border-[#0ea5e9]"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      dataType === "competitor" ? "bg-[var(--accent-red)]" : "bg-[var(--text-muted)]"
                    }`}
                  />
                  <span className="font-medium text-[var(--text-primary)]">竞品数据</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  上传竞品用户反馈用于对比分析
                </p>
              </button>
            </div>
          </div>

          {/* 竞品配置面板（仅竞品模式显示） */}
          {dataType === "competitor" && (
            <div className="mb-6 bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl p-6 border-l-4 border-l-[var(--accent-red)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-[var(--accent-red)]" />
                竞品配置
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* 对标产品选择 */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    <Package className="inline h-3.5 w-3.5 mr-1" />
                    对标产品 <span className="text-[var(--accent-red)]">*</span>
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#06b6d4] focus:outline-none focus:ring-1 focus:ring-[#06b6d4]"
                  >
                    <option value="">请选择对标产品</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    选择竞品数据对应的本品产品
                  </p>
                </div>

                {/* 竞品品牌选择 */}
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    <Tag className="inline h-3.5 w-3.5 mr-1" />
                    竞品品牌 <span className="text-[var(--accent-red)]">*</span>
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedBrandCode}
                      onChange={(e) => {
                        setSelectedBrandCode(e.target.value);
                        const brand = brands.find(
                          (b) => b.code === e.target.value
                        );
                        setSelectedBrandName(brand?.name || "");
                      }}
                      className="flex-1 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#06b6d4] focus:outline-none focus:ring-1 focus:ring-[#06b6d4]"
                    >
                      <option value="">请选择竞品品牌</option>
                      {brands.map((b) => (
                        <option key={b.code} value={b.code}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => setShowBrandModal(true)}
                      className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[#334155] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
                      title="新增品牌"
                    >
                      <Plus className="h-4 w-4" />
                      新增
                    </button>
                  </div>
                </div>
              </div>

              {products.length === 0 && (
                <div className="mt-3 p-3 rounded-lg bg-[#f59e0b]/10 border border-[#f59e0b]/20">
                  <p className="text-xs text-[#f59e0b]">
                    还没有产品，请先前往{" "}
                    <Link
                      href="/products"
                      className="underline hover:text-[#fbbf24]"
                    >
                      产品管理
                    </Link>{" "}
                    创建产品
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 数据源配置 */}
          <div className="mb-8 bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl p-6">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#f59e0b]" />
              数据源配置
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  数据来源
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#06b6d4] focus:outline-none focus:ring-1 focus:ring-[#06b6d4]"
                >
                  <option value="私域">私域</option>
                  <option value="公域">公域</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                  渠道类型
                </label>
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#06b6d4] focus:outline-none focus:ring-1 focus:ring-[#06b6d4]"
                >
                  <option value="客服系统">客服系统</option>
                  <option value="淘宝">淘宝</option>
                  <option value="豆瓣">豆瓣</option>
                  <option value="其他">其他</option>
                </select>
              </div>
            </div>
          </div>

          {/* 上传区域 */}
          <div
            className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-all ${
              isDragging
                ? dataType === "competitor"
                  ? "border-[var(--accent-red)] bg-[var(--accent-red)]/5 shadow-lg shadow-[var(--accent-red)]/10"
                  : "border-[#06b6d4] bg-[#06b6d4]/5 shadow-lg shadow-[#06b6d4]/10"
                : "border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50 hover:border-[#0ea5e9]"
            } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileInput}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />

            {isUploading ? (
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Loader2
                    className={`h-12 w-12 animate-spin ${
                      dataType === "competitor" ? "text-[var(--accent-red)]" : "text-[#06b6d4]"
                    }`}
                  />
                  <Brain
                    className={`h-5 w-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
                      dataType === "competitor" ? "text-[var(--accent-red)]" : "text-[#06b6d4]"
                    }`}
                  />
                </div>
                <p className="text-lg font-medium text-[var(--text-primary)]">
                  {dataType === "competitor"
                    ? `正在分析 ${selectedBrandName} 竞品数据...`
                    : "AI 正在智能分析中..."}
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  请耐心等待，分析完成后将自动显示结果
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div
                  className={`rounded-full p-4 mb-4 border ${
                    dataType === "competitor"
                      ? "bg-[var(--accent-red)]/10 border-[var(--accent-red)]/20"
                      : "bg-[#06b6d4]/10 border-[#06b6d4]/20"
                  }`}
                >
                  <Upload
                    className={`h-8 w-8 ${
                      dataType === "competitor" ? "text-[var(--accent-red)]" : "text-[#06b6d4]"
                    }`}
                  />
                </div>
                <p className="text-lg font-medium text-[var(--text-primary)] mb-2">
                  点击或拖拽文件到此处上传
                </p>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  支持 .csv 和 .xlsx 格式，第一列为商品ID，第二列为反馈内容
                </p>
                <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>最大支持 10MB</span>
                </div>
              </div>
            )}
          </div>

          {/* 进度条面板 */}
          {progress && progress.status === "processing" && (
            <div className="mt-6 bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Loader2
                    className={`h-4 w-4 animate-spin ${
                      dataType === "competitor" ? "text-[var(--accent-red)]" : "text-[#06b6d4]"
                    }`}
                  />
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {dataType === "competitor"
                      ? `竞品数据 (${selectedBrandName}) AI分析中`
                      : "AI 智能分析中"}
                  </span>
                </div>
                <span
                  className={`text-sm font-mono ${
                    dataType === "competitor" ? "text-[var(--accent-red)]" : "text-[#06b6d4]"
                  }`}
                >
                  {progress.progress}%
                </span>
              </div>

              <div className="w-full h-3 bg-[var(--bg-tertiary)] rounded-full overflow-hidden border border-[var(--border-subtle)]/50">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor()} shadow-lg ${
                    dataType === "competitor"
                      ? "shadow-[var(--accent-red)]/30"
                      : "shadow-[#06b6d4]/30"
                  }`}
                  style={{ width: `${Math.max(progress.progress, 2)}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-[var(--text-muted)]">
                  已处理 {progress.processedCount} / {progress.totalCount} 条
                </span>
                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  DeepSeek AI 分析
                </span>
              </div>
            </div>
          )}

          {/* 处理结果面板 */}
          {uploadResult && uploadResult.success && (
            <div className="mt-6 bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="rounded-lg bg-[#10b981]/10 p-2 border border-[#10b981]/20">
                  <CheckCircle className="h-5 w-5 text-[#10b981]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[var(--text-primary)]">
                    分析处理完成
                    {dataType === "competitor" && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-[var(--accent-red)]/10 text-[var(--accent-red)] border border-[var(--accent-red)]/20">
                        {selectedBrandName}
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    {uploadResult.message}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[var(--border-subtle)]/50">
                <div className="text-center">
                  <p className="text-lg font-bold font-mono-data text-[var(--text-primary)]">
                    {uploadResult.totalCount || 0}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">总数据量</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-mono-data text-[#10b981]">
                    {uploadResult.processedCount || 0}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">成功分析</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold font-mono-data text-[var(--accent-red)]">
                    {uploadResult.failedCount || 0}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">处理失败</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]/50 flex gap-3">
                <button
                  onClick={() => {
                    setUploadResult(null);
                    setProgress(null);
                    router.push("/voc-hall");
                  }}
                  className="flex-1 inline-flex items-center justify-center rounded-lg bg-[#10b981] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#059669] transition-colors shadow-lg shadow-[#10b981]/25"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  查看数据大厅
                </button>
                {dataType === "competitor" && (
                  <button
                    onClick={() => {
                      setUploadResult(null);
                      setProgress(null);
                      router.push("/competitor-insight/comparison");
                    }}
                    className="flex-1 inline-flex items-center justify-center rounded-lg bg-[var(--accent-red)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e11d48] transition-colors shadow-lg shadow-[var(--accent-red)]/25"
                  >
                    查看竞品对比
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 上传失败提示 */}
          {uploadResult && !uploadResult.success && (
            <div className="mt-6 rounded-xl p-4 bg-[var(--accent-red)]/10 border border-[var(--accent-red)]/20">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-[var(--accent-red)] mt-0.5" />
                <div>
                  <p className="font-medium text-[var(--accent-red)]">处理失败</p>
                  <p className="text-sm mt-1 text-[var(--accent-red)]/80">
                    {uploadResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 说明 */}
          <div className="mt-8 bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl p-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
              文件格式说明
            </h3>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="rounded-full bg-[#06b6d4]/10 text-[#06b6d4] px-2 py-0.5 text-xs font-medium mt-0.5 border border-[#06b6d4]/20">
                  1
                </span>
                文件第一行为表头，第一列为商品ID，第二列为反馈内容
              </li>
              <li className="flex items-start gap-2">
                <span className="rounded-full bg-[#06b6d4]/10 text-[#06b6d4] px-2 py-0.5 text-xs font-medium mt-0.5 border border-[#06b6d4]/20">
                  2
                </span>
                支持 .csv (UTF-8编码) 和 .xlsx 格式
              </li>
              <li className="flex items-start gap-2">
                <span className="rounded-full bg-[#06b6d4]/10 text-[#06b6d4] px-2 py-0.5 text-xs font-medium mt-0.5 border border-[#06b6d4]/20">
                  3
                </span>
                上传后AI将自动进行情绪、分类、痛点、诉求、紧急程度分析
              </li>
              <li className="flex items-start gap-2">
                <span className="rounded-full bg-[#06b6d4]/10 text-[#06b6d4] px-2 py-0.5 text-xs font-medium mt-0.5 border border-[#06b6d4]/20">
                  4
                </span>
                {dataType === "competitor"
                  ? "竞品数据将与本品数据关联，支持在竞品洞察中心进行对比分析"
                  : "上传后请等待分析完成，处理时间取决于数据量"}
              </li>
            </ul>
          </div>
        </div>

        {/* 新增品牌弹窗 */}
        {showBrandModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] rounded-xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  新增竞品品牌
                </h3>
                <button
                  onClick={() => setShowBrandModal(false)}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    品牌名称 <span className="text-[var(--accent-red)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#06b6d4] focus:outline-none focus:ring-1 focus:ring-[#06b6d4]"
                    placeholder="如：完美日记"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                    品牌代码 <span className="text-[var(--accent-red)]">*</span>
                  </label>
                  <input
                    type="text"
                    value={newBrandCode}
                    onChange={(e) => setNewBrandCode(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#06b6d4] focus:outline-none focus:ring-1 focus:ring-[#06b6d4]"
                    placeholder="如：perfect_diary（英文/拼音）"
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    用于系统内部标识，创建后不可修改
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowBrandModal(false)}
                  className="flex-1 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[#334155]"
                >
                  取消
                </button>
                <button
                  onClick={handleCreateBrand}
                  disabled={
                    !newBrandName.trim() ||
                    !newBrandCode.trim() ||
                    isCreatingBrand
                  }
                  className="flex-1 rounded-lg btn-primary px-4 py-2 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingBrand ? "创建中..." : "创建"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
