import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = 'https://api.deepseek.com/v1';

interface ReportData {
  reportType: 'diagnostic' | 'competitor' | 'product';
  productId?: string;
}

// 调用 DeepSeek API 生成报告
async function generateReportWithAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API 错误: ${error}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// 聚合诊断报告数据
async function getDiagnosticData() {
  const [sentimentStats, categoryStats, topIssues, urgencyStats] = await Promise.all([
    prisma.feedback.groupBy({
      by: ['sentiment'],
      where: { brand: 'own' },
      _count: { sentiment: true },
    }),
    prisma.feedback.groupBy({
      by: ['category'],
      where: { brand: 'own' },
      _count: { category: true },
    }),
    prisma.feedback.groupBy({
      by: ['coreIssue'],
      where: { brand: 'own', sentiment: '消极' },
      _count: { coreIssue: true },
      orderBy: { _count: { coreIssue: 'desc' } },
      take: 10,
    }),
    prisma.feedback.groupBy({
      by: ['urgency'],
      where: { brand: 'own' },
      _count: { urgency: true },
    }),
  ]);

  return {
    sentimentStats,
    categoryStats,
    topIssues,
    urgencyStats,
    totalFeedback: await prisma.feedback.count({ where: { brand: 'own' } }),
  };
}

// 聚合竞品报告数据
async function getCompetitorData(productId?: string) {
  const where: any = {};
  if (productId) where.productId = productId;

  const [brandStats, categoryByBrand, sentimentByBrand, productInfo] = await Promise.all([
    prisma.feedback.groupBy({
      by: ['brand', 'brandName'],
      where,
      _count: { id: true },
    }),
    prisma.feedback.groupBy({
      by: ['brand', 'category'],
      where,
      _count: { category: true },
    }),
    prisma.feedback.groupBy({
      by: ['brand', 'sentiment'],
      where,
      _count: { sentiment: true },
    }),
    productId ? prisma.product.findUnique({ where: { id: productId }, select: { name: true, code: true } }) : null,
  ]);

  return { brandStats, categoryByBrand, sentimentByBrand, productInfo };
}

// 聚合产品报告数据
async function getProductData(productId: string) {
  const [sentimentStats, categoryStats, topIssues, feedbacks] = await Promise.all([
    prisma.feedback.groupBy({
      by: ['sentiment'],
      where: { productId },
      _count: { sentiment: true },
    }),
    prisma.feedback.groupBy({
      by: ['category'],
      where: { productId },
      _count: { category: true },
    }),
    prisma.feedback.groupBy({
      by: ['coreIssue'],
      where: { productId, sentiment: '消极' },
      _count: { coreIssue: true },
      orderBy: { _count: { coreIssue: 'desc' } },
      take: 10,
    }),
    prisma.feedback.findMany({
      where: { productId },
      select: { rawContent: true, sentiment: true, category: true, coreIssue: true, rating: true },
      take: 50,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { sentimentStats, categoryStats, topIssues, feedbacks, totalFeedback: feedbacks.length };
}

export async function POST(request: NextRequest) {
  try {
    const body: ReportData = await request.json();
    const { reportType, productId } = body;

    let data: any;
    let reportTitle = '';

    switch (reportType) {
      case 'diagnostic':
        data = await getDiagnosticData();
        reportTitle = '本品诊断报告';
        break;
      case 'competitor':
        data = await getCompetitorData(productId);
        reportTitle = productId ? `竞品对比分析报告 - ${data.productInfo?.name || '指定产品'}` : '竞品对比分析报告';
        break;
      case 'product':
        if (!productId) {
          return NextResponse.json({ error: '产品报告需要提供 productId' }, { status: 400 });
        }
        data = await getProductData(productId);
        reportTitle = '产品深度分析报告';
        break;
      default:
        return NextResponse.json({ error: '不支持的报告类型' }, { status: 400 });
    }

    const systemPrompt = `你是一个资深商业分析师。请根据输入的数据 JSON，撰写一份结构化的业务报告。
【强制结构与内容要求】：
1. 核心摘要 (Executive Summary)：用一句话定性整体情况。
2. 数据大盘与可视化 (Data Overview)：
   - 必须使用 Mermaid 语法生成图表，展示情感分布或 Top 标签数据。
   - Mermaid 代码必须被包在 \`\`\`mermaid 和 \`\`\` 之间。
   - 【Mermaid 语法严格规范】：
     a. 可用图表类型（严格使用以下关键字开头，不要使用其他类型）：
        - pie 饼图：情感分布、占比分析。语法：pie title 标题 "标签" : 数值
        - flowchart 流程图：用户决策路径、处理流程。语法：flowchart LR 节点 --> 节点
     【重要】为最大化兼容性，请优先使用 pie 和 flowchart 两种图表类型。
     b. 饼图语法示例（严格遵守此格式）：
        \`\`\`mermaid
        pie title 情感分布
          "积极" : 40
          "消极" : 30
          "中性" : 30
        \`\`\`
     c. 流程图语法示例（严格遵守此格式）：
        \`\`\`mermaid
        flowchart LR
          A[用户反馈] --> B[情感分析]
          B --> C[问题分类]
          C --> D[生成工单]
        \`\`\`
     d. 【关键约束】节点标签只使用中文、英文和数字，绝对不要使用括号、引号、冒号、百分号、斜杠等特殊符号。
     e. 【关键约束】数值只使用纯数字，不要带单位或百分号。
     f. 每个图表的 title 使用简短的中文标题。
     g. 报告中使用 1-2 个图表即可，优先使用 pie 饼图。
3. 核心痛点与深度洞察 (Key Insights)：拆解排名前列的具体问题，分析根因。
4. 落地行动指令 (Action Items)：按优先级 (P0/P1) 给出针对性的解决方案。
【格式要求】：严格使用 Markdown 语法，重点内容加粗。`;

    const userPrompt = `请基于以下数据生成「${reportTitle}」：

\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`

要求：
1. 报告标题使用 # 一级标题
2. 数据可视化部分必须使用 Mermaid 语法生成图表
3. 分析要具体、有数据支撑
4. 行动指令要可执行、有明确负责人建议`;

    const report = await generateReportWithAI(systemPrompt, userPrompt);

    return NextResponse.json({ report, title: reportTitle });
  } catch (error) {
    console.error('报告生成失败:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '报告生成失败' },
      { status: 500 }
    );
  }
}
