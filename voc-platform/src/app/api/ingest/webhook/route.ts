import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { analyzeFeedback } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedbacks, source = 'webhook', brand = 'own', brandName = '本品', platform = '未知' } = body;

    if (!Array.isArray(feedbacks) || feedbacks.length === 0) {
      return NextResponse.json({ error: 'feedbacks must be a non-empty array' }, { status: 400 });
    }

    const results = [];
    for (const item of feedbacks) {
      const content = item.rawContent || item.content || item.text || '';
      if (!content) continue;

      const analysis = await analyzeFeedback(content);
      
      const feedback = await prisma.feedback.create({
        data: {
          productId: item.productId || '未指定',
          rawContent: content,
          sentiment: analysis.sentiment,
          category: analysis.category,
          coreIssue: analysis.coreIssue,
          userDemand: analysis.userDemand,
          urgency: analysis.urgency,
          churnRisk: analysis.churnRisk,
          analysisSource: analysis.usedMock ? 'mock' : 'ai',
          source: item.source || source,
          channel: item.channel || 'webhook',
          brand,
          brandName,
          platform: item.platform || platform,
          externalId: item.externalId || null,
          rating: item.rating ? parseInt(item.rating) : null,
          dataSource: 'webhook',
          status: 'completed',
        },
      });
      results.push(feedback);
    }

    return NextResponse.json({
      success: true,
      message: `成功处理 ${results.length} 条反馈`,
      count: results.length,
    });
  } catch (error) {
    console.error('Webhook处理失败:', error);
    return NextResponse.json({ error: '处理失败' }, { status: 500 });
  }
}
