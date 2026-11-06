import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeFeedback } from '@/lib/gemini';

// 智能粘贴解析：从各种格式中提取结构化数据
function parsePastedContent(text: string): Array<{ productId: string; content: string; rating?: number; platform?: string }> {
  const results = [];
  const lines = text.split('\n').filter(l => l.trim());
  
  // 尝试识别表格格式（逗号/制表符分隔）
  for (const line of lines) {
    const parts = line.split(/[\t,，]/).map(p => p.trim()).filter(p => p);
    if (parts.length >= 2) {
      // 假设第一列是商品ID，第二列是内容
      const productId = parts[0];
      const content = parts[1];
      const rating = parts[2] ? parseInt(parts[2]) : undefined;
      results.push({ productId, content, rating, platform: '粘贴导入' });
    } else if (parts.length === 1 && parts[0].length > 5) {
      // 纯文本行，尝试提取商品ID
      const match = parts[0].match(/(\d{6,})/);
      const productId = match ? match[1] : '未指定';
      results.push({ productId, content: parts[0], platform: '粘贴导入' });
    }
  }
  
  return results;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, brand = 'own', brandName = '本品', platform = '未知' } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    const parsedItems = parsePastedContent(text);
    if (parsedItems.length === 0) {
      return NextResponse.json({ error: '无法解析粘贴内容' }, { status: 400 });
    }

    const results = [];
    for (const item of parsedItems) {
      const analysis = await analyzeFeedback(item.content);
      
      const feedback = await prisma.feedback.create({
        data: {
          productId: item.productId,
          rawContent: item.content,
          sentiment: analysis.sentiment,
          category: analysis.category,
          coreIssue: analysis.coreIssue,
          userDemand: analysis.userDemand,
          urgency: analysis.urgency,
          churnRisk: analysis.churnRisk,
          analysisSource: analysis.usedMock ? 'mock' : 'ai',
          source: '私域',
          channel: '粘贴采集',
          brand,
          brandName,
          platform: item.platform || platform,
          rating: item.rating || null,
          dataSource: 'paste',
          status: 'completed',
        },
      });
      results.push(feedback);
    }

    return NextResponse.json({
      success: true,
      message: `成功解析并处理 ${results.length} 条反馈`,
      count: results.length,
    });
  } catch (error) {
    console.error('粘贴处理失败:', error);
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}
