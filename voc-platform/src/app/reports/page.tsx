"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import mermaid from "mermaid";
import {
  ArrowLeft,
  FileText,
  Download,
  Printer,
  Sparkles,
  Loader2,
  BarChart3,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { FloatingCard } from "@/components/ui/FloatingCard";

let mermaidInitialized = false;

// Mermaid 图表渲染组件
function MermaidChart({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const renderChart = async () => {
      try {
        // 清理 chart 中的潜在问题字符
        let sanitized = chart
          .replace(/[\u201c\u201d]/g, '"')  // 中文引号 → 英文引号
          .replace(/[\u2018\u2019]/g, "'"); // 中文单引号 → 英文单引号
        const id = `m-${Math.random().toString(36).substring(2, 9)}`;
        try {
          const { svg: renderedSvg } = await mermaid.render(id, sanitized);
          if (!cancelled) {
            setSvg(renderedSvg);
            setError("");
          }
        } catch (err) {
          // xychart-beta 在 mermaid v11 中不稳定，降级为 pie
          if (sanitized.includes('xychart-beta') || sanitized.includes('xychart')) {
            console.log('xychart 渲染失败，降级为 pie 图');
            // 提取数据转换为 pie
            const titleMatch = sanitized.match(/title\s+"([^"]+)"/);
            const title = titleMatch ? titleMatch[1] : '数据分布';
            const xAxisMatch = sanitized.match(/x-axis\s+\[([^\]]+)\]/);
            const barMatch = sanitized.match(/bar\s+\[([^\]]+)\]/);
            if (xAxisMatch && barMatch) {
              const labels = xAxisMatch[1].split(/\s+/).map(s => s.replace(/"/g, '').trim()).filter(Boolean);
              const values = barMatch[1].split(/\s+/).map(s => parseInt(s.trim())).filter(n => !isNaN(n));
              let pieCode = `pie title ${title}\n`;
              labels.forEach((label, i) => {
                if (values[i] !== undefined) {
                  pieCode += `  "${label}" : ${values[i]}\n`;
                }
              });
              const pieId = `m-pie-${Math.random().toString(36).substring(2, 9)}`;
              const { svg: pieSvg } = await mermaid.render(pieId, pieCode);
              if (!cancelled) {
                setSvg(pieSvg);
                setError("");
              }
              return;
            }
          }
          // AI 错误地生成独立的 bar 类型（Mermaid 不存在独立 bar 图），降级为 pie
          if (sanitized.trim().startsWith('bar')) {
            console.log('bar 类型不存在，降级为 pie 图');
            const titleMatch = sanitized.match(/title\s+"([^"]+)"/);
            const title = titleMatch ? titleMatch[1] : '数据分布';
            // 提取 "标签" : 数值 格式的数据
            const barRegex = /"([^"]+)"\s*:\s*(\d+)/g;
            const barData: { label: string; value: number }[] = [];
            let barMatch;
            while ((barMatch = barRegex.exec(sanitized)) !== null) {
              barData.push({ label: barMatch[1], value: parseInt(barMatch[2]) });
            }
            if (barData.length > 0) {
              let pieCode = `pie title ${title}\n`;
              barData.forEach(d => {
                pieCode += `  "${d.label}" : ${d.value}\n`;
              });
              const pieId = `m-pie-${Math.random().toString(36).substring(2, 9)}`;
              const { svg: pieSvg } = await mermaid.render(pieId, pieCode);
              if (!cancelled) {
                setSvg(pieSvg);
                setError("");
              }
              return;
            }
          }
          // sankey 桑基图渲染失败，降级为 flowchart
          if (sanitized.includes('sankey')) {
            console.log('sankey 渲染失败，降级为 flowchart');
            const titleMatch = sanitized.match(/title\s+"([^"]+)"/);
            const title = titleMatch ? titleMatch[1] : '流转路径';
            // 提取 CSV 格式的 sankey 数据："源","目标",数值
            const linkRegex = /"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(\d+)/g;
            const links: { source: string; target: string; value: number }[] = [];
            let match;
            while ((match = linkRegex.exec(sanitized)) !== null) {
              links.push({ source: match[1], target: match[2], value: parseInt(match[3]) });
            }
            if (links.length > 0) {
              // 收集所有节点
              const nodeSet = new Set<string>();
              links.forEach(l => { nodeSet.add(l.source); nodeSet.add(l.target); });
              const nodes = Array.from(nodeSet);
              const nodeIdMap = new Map<string, string>();
              nodes.forEach((n, i) => nodeIdMap.set(n, `n${i}`));
              // 构建 flowchart LR
              let flowCode = `flowchart LR\n`;
              flowCode += `  subgraph ${title}\n`;
              links.forEach(l => {
                flowCode += `    ${nodeIdMap.get(l.source)}["${l.source}"] -->|${l.value}| ${nodeIdMap.get(l.target)}["${l.target}"]\n`;
              });
              flowCode += `  end\n`;
              const flowId = `m-flow-${Math.random().toString(36).substring(2, 9)}`;
              const { svg: flowSvg } = await mermaid.render(flowId, flowCode);
              if (!cancelled) {
                setSvg(flowSvg);
                setError("");
              }
              return;
            }
          }
          // quadrantChart 象限图渲染失败，降级为 flowchart（用节点位置表示象限）
          if (sanitized.includes('quadrantChart')) {
            console.log('quadrantChart 渲染失败，降级为 flowchart');
            const titleMatch = sanitized.match(/title\s+"([^"]+)"/);
            const title = titleMatch ? titleMatch[1] : '优先级矩阵';
            // 提取象限数据："标签" : [x, y]
            const pointRegex = /"([^"]+)"\s*:\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/g;
            const points: { label: string; x: number; y: number }[] = [];
            let ptMatch;
            while ((ptMatch = pointRegex.exec(sanitized)) !== null) {
              points.push({ label: ptMatch[1], x: parseFloat(ptMatch[2]), y: parseFloat(ptMatch[3]) });
            }
            if (points.length > 0) {
              // 构建 flowchart，用子图表示四个象限
              let flowCode = `flowchart TB\n`;
              flowCode += `  subgraph ${title}\n`;
              // 按象限分组
              const q1 = points.filter(p => p.x >= 0.5 && p.y >= 0.5); // 高影响高紧急
              const q2 = points.filter(p => p.x < 0.5 && p.y >= 0.5);  // 低影响高紧急
              const q3 = points.filter(p => p.x >= 0.5 && p.y < 0.5);  // 高影响低紧急
              const q4 = points.filter(p => p.x < 0.5 && p.y < 0.5);   // 低影响低紧急
              if (q1.length > 0) flowCode += `    direction LR\n    subgraph 立即处理\n      ${q1.map((p, i) => `q1${i}["${p.label}"]`).join(' ')}\n    end\n`;
              if (q2.length > 0) flowCode += `    subgraph 重点关注\n      ${q2.map((p, i) => `q2${i}["${p.label}"]`).join(' ')}\n    end\n`;
              if (q3.length > 0) flowCode += `    subgraph 持续观察\n      ${q3.map((p, i) => `q3${i}["${p.label}"]`).join(' ')}\n    end\n`;
              if (q4.length > 0) flowCode += `    subgraph 暂不处理\n      ${q4.map((p, i) => `q4${i}["${p.label}"]`).join(' ')}\n    end\n`;
              flowCode += `  end\n`;
              const flowId = `m-quad-${Math.random().toString(36).substring(2, 9)}`;
              const { svg: flowSvg } = await mermaid.render(flowId, flowCode);
              if (!cancelled) {
                setSvg(flowSvg);
                setError("");
              }
              return;
            }
          }
          throw err;
        }
      } catch (err) {
        console.error("Mermaid 渲染失败:", err);
        if (!cancelled) setError("图表渲染失败");
      }
    };
    renderChart();
    return () => { cancelled = true; };
  }, [chart]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 my-6 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-subtle)]">
        <BarChart3 className="h-8 w-8 text-[var(--text-muted)] mb-2" />
        <span className="text-sm text-[var(--text-muted)]">图表暂无法显示</span>
        <span className="text-xs text-[var(--text-muted)] mt-1">数据已包含在报告文本中</span>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  return (
    <div className="flex justify-center my-6">
      <div
        ref={containerRef}
        className="bg-white rounded-[20px] shadow-[0_8px_32px_rgba(140,124,240,0.08)] p-6 max-w-2xl w-full [&>svg]:max-w-full [&>svg]:h-auto"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  );
}

// 自定义 Markdown 代码渲染
function CodeBlock({
  className,
  children,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "";
  const code = String(children).replace(/\n$/, "");

  // Mermaid 图表
  if (language === "mermaid") {
    return <MermaidChart chart={code} />;
  }

  // 行内代码：无 className 且不含换行符
  if (!className && !code.includes("\n")) {
    return (
      <code
        className="rounded bg-[var(--bg-tertiary)] px-1.5 py-0.5 text-sm text-[var(--accent)] font-mono"
        {...props}
      >
        {children}
      </code>
    );
  }

  // 普通代码块
  return (
    <pre className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-subtle)] p-4 my-4 overflow-x-auto text-sm">
      <code className={className || ""} {...props}>
        {children}
      </code>
    </pre>
  );
}

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"diagnostic" | "competitor" | "product">("diagnostic");
  const [productId, setProductId] = useState("");
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([]);
  const [report, setReport] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(data.data || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!mermaidInitialized) {
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          // 基础颜色 - Soft-Neo 紫色主题
          primaryColor: "#C6B9FF",
          primaryTextColor: "#1a1a2e",
          primaryBorderColor: "#8C7CF0",
          lineColor: "#94a3b8",
          secondaryColor: "#f5f5f7",
          tertiaryColor: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "14px",

          // Pie 图配色
          pieOuterStrokeWidth: "2px",
          pieStrokeColor: "#ffffff",
          pieSectionTextSize: "14px",
          pieTitleTextSize: "16px",
          pie1: "#8C7CF0",
          pie2: "#C6B9FF",
          pie3: "#E8E4FF",
          pie4: "#A5B4FC",
          pie5: "#7DD3A8",
          pie6: "#F5D78E",
          pie7: "#F0A0A0",
          pie8: "#94A3B8",
          pieTitleTextColor: "#1a1a2e",
          pieSectionTextColor: "#1a1a2e",

          // Flowchart 配色
          nodeBorder: "#8C7CF0",
          nodeTextColor: "#1a1a2e",
          clusterBkg: "#f8f8fb",
          clusterBorder: "#e2e8f0",
          defaultLinkColor: "#94a3b8",
          titleColor: "#1a1a2e",
          edgeLabelBackground: "#ffffff",

          // 背景色 - 强制浅色
          background: "#ffffff",
          mainBkg: "#C6B9FF",
          secondBkg: "#E8E4FF",
          tertiaryBkg: "#f5f5f7",
          // 饼图专用背景
          cScale0: "#8C7CF0",
          cScale1: "#C6B9FF",
          cScale2: "#E8E4FF",
          cScale3: "#A5B4FC",
          cScale4: "#7DD3A8",
          cScale5: "#F5D78E",
          cScale6: "#F0A0A0",
          cScale7: "#94A3B8",

          // xychart 配色
          xychartBackground: "#ffffff",
          xychartPlotBackground: "#f8f8fb",
          xychartTitleColor: "#1a1a2e",
          xychartAxisTextColor: "#64748b",
          xychartGridColor: "#e2e8f0",
        },
        pie: {
          textPosition: 0.75,
        },
        flowchart: {
          htmlLabels: true,
          curve: "basis",
        },
        securityLevel: "loose",
      });
      mermaidInitialized = true;
    }
  }, []);

  const generateReport = async () => {
    setLoading(true);
    setError("");
    setReport("");

    try {
      const body: any = { reportType };
      if ((reportType === "product" || reportType === "competitor") && productId) {
        body.productId = productId;
      }

      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "生成失败");

      setReport(data.report);
      setTitle(data.title);
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setLoading(false);
    }
  };

  const downloadMarkdown = () => {
    const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "报告"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const [exporting, setExporting] = useState(false);

  const downloadDocx = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/reports/export-docx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: report, title }),
      });
      if (!response.ok) throw new Error("导出失败");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title || "报告"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Word 导出失败");
    } finally {
      setExporting(false);
    }
  };

  return (
    <AppShell>
      <main className="min-h-screen bg-[var(--bg-primary)]">
        {/* Header */}
        <div className="border-b border-[var(--border-subtle)]">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <Link href="/" className="inline-flex items-center text-sm text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                <ArrowLeft className="mr-1 h-4 w-4" />
                返回首页
              </Link>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">智能报告中心</h1>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* 控制面板 */}
          <FloatingCard className="p-6 mb-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">报告类型</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="diagnostic">本品诊断报告</option>
                  <option value="competitor">竞品对比分析报告</option>
                  <option value="product">产品深度分析报告</option>
                </select>
              </div>

              {(reportType === "product" || reportType === "competitor") && (
                <div className="flex-1 w-full">
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                    {reportType === "competitor" ? "选择对标产品（可选）" : "选择产品"}
                  </label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="w-full rounded-lg border border-[var(--border-subtle)] bg-white px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    <option value="">{reportType === "competitor" ? "全部产品（不选则对比全部）" : "请选择产品"}</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={generateReport}
                disabled={loading || (reportType === "product" && !productId)}
                className="btn-primary inline-flex items-center px-6 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />生成中...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" />生成图文报告</>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#f43f5e]/30 bg-[#f43f5e]/10 px-4 py-3 text-sm text-[#f43f5e]">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
          </FloatingCard>

          {/* 报告内容区 - Word 文档风格 */}
          {report && (
            <FloatingCard className="overflow-hidden">
              {/* 工具栏 */}
              <div className="flex justify-end gap-3 px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]/50">
                <button onClick={downloadMarkdown} className="inline-flex items-center rounded-lg bg-white border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">
                  <Download className="mr-1.5 h-4 w-4" />下载 Markdown
                </button>
                <button onClick={downloadDocx} disabled={exporting} className="inline-flex items-center rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30 px-3 py-1.5 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/20 transition-colors disabled:opacity-50">
                  <FileText className="mr-1.5 h-4 w-4" />{exporting ? "导出中..." : "下载 Word"}
                </button>
                <button onClick={() => window.print()} className="inline-flex items-center rounded-lg bg-white border border-[var(--border-subtle)] px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">
                  <Printer className="mr-1.5 h-4 w-4" />打印 / 导出 PDF
                </button>
              </div>

              {/* 报告正文 - 类 Word 白纸风格 */}
              <div className="bg-white text-gray-900 p-8 sm:p-12 lg:p-16 min-h-[600px] shadow-inner">
                <div className="max-w-3xl mx-auto
                  prose prose-base
                  prose-headings:font-serif prose-headings:text-gray-900
                  prose-h1:text-2xl prose-h1:font-bold prose-h1:border-b prose-h1:border-gray-200 prose-h1:pb-3 prose-h1:mb-6
                  prose-h2:text-xl prose-h2:font-semibold prose-h2:text-gray-800 prose-h2:mt-10 prose-h2:mb-4
                  prose-h3:text-lg prose-h3:font-semibold prose-h3:text-gray-700 prose-h3:mt-6 prose-h3:mb-3
                  prose-p:text-gray-700 prose-p:leading-7 prose-p:mb-4
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-li:text-gray-700 prose-li:leading-7
                  prose-ul:my-4 prose-ol:my-4
                  prose-blockquote:border-l-4 prose-blockquote:border-[var(--accent)] prose-blockquote:bg-[#f0fdfa] prose-blockquote:py-3 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:text-gray-600 prose-blockquote:italic
                  prose-table:w-full prose-table:border-collapse prose-table:my-6
                  prose-th:bg-gray-100 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:text-xs prose-th:font-semibold prose-th:text-gray-500 prose-th:uppercase prose-th:border-b prose-th:border-gray-200
                  prose-td:px-4 prose-td:py-2 prose-td:text-sm prose-td:border-b prose-td:border-gray-100
                  prose-tr:hover:bg-gray-50
                  prose-hr:border-gray-200 prose-hr:my-8
                  prose-a:text-[var(--accent)] prose-a:no-underline hover:prose-a:underline
                  prose-code:rounded prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono prose-code:text-[var(--accent)]
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:shadow-lg
                ">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: CodeBlock as any,
                    }}
                  >
                    {report}
                  </ReactMarkdown>
                </div>
              </div>
            </FloatingCard>
          )}

          {/* 空状态 */}
          {!report && !loading && (
            <FloatingCard className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-[var(--text-muted)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-muted)] mb-2">选择报告类型并点击生成</h3>
              <p className="text-sm text-[var(--text-secondary)]">系统将调用 AI 分析数据并生成结构化报告，包含可视化图表</p>
            </FloatingCard>
          )}
        </div>
      </main>
    </AppShell>
  );
}
