import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateSmartReply } from '@/lib/gemini';

// 生成智能安抚话术
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { feedbackId, tone = 'sincere' } = body;

    if (!feedbackId) {
      return NextResponse.json({ error: '缺少feedbackId' }, { status: 400 });
    }

    // 验证tone参数
    const validTones = ['sincere', 'professional', 'concise'];
    const safeTone = validTones.includes(tone) ? tone as 'sincere' | 'professional' | 'concise' : 'sincere';

    // 获取反馈详情
    console.log('[智能回复API] 查找反馈:', feedbackId);
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    console.log('[智能回复API] 查找结果:', feedback ? '找到' : '未找到', feedback ? `content=${feedback.rawContent.substring(0, 20)}` : '');

    if (!feedback) {
      return NextResponse.json({ error: '反馈不存在', feedbackId }, { status: 404 });
    }

    // 生成智能回复（传入语气参数）
    const { reply, usedMock, error: replyError } = await generateSmartReply({
      rawContent: feedback.rawContent,
      category: feedback.category,
      coreIssue: feedback.coreIssue,
      userDemand: feedback.userDemand,
      sentiment: feedback.sentiment,
      churnRisk: feedback.churnRisk,
    }, safeTone);

    // 保存到数据库
    await prisma.feedback.update({
      where: { id: feedbackId },
      data: { smartReply: reply },
    });

    return NextResponse.json({
      success: true,
      reply,
      tone: safeTone,
      feedbackId,
      usedMock,
      ...(replyError ? { warning: '当前使用离线模式生成回复', error: replyError } : {}),
    });
  } catch (error) {
    console.error('生成智能回复失败:', error);
    return NextResponse.json({ error: '生成失败' }, { status: 500 });
  }
}
