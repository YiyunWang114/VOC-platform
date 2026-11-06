import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/competitor/opportunities
 * 从真实 Feedback 数据计算机会洞察
 * - 本品优势：本品积极反馈中高频分类
 * - 本品劣势：本品消极反馈中高频分类
 * - 竞品机会：竞品消极反馈中本品未覆盖的痛点
 * - AI 总结：基于数据生成
 *
 * 逻辑：将品牌数量最多的视为"本品"，其余视为"竞品"
 */
export async function GET(request: NextRequest) {
  try {
    // 找出数据量最大的品牌作为"本品"
    const brandCounts = await prisma.feedback.groupBy({
      by: ['brandName'],
      _count: { brandName: true },
    });

    const ownBrandName = brandCounts.sort((a, b) => b._count.brandName - a._count.brandName)[0]?.brandName || '本品';

    // 获取本品积极反馈的分类统计
    const ownPositive = await prisma.feedback.groupBy({
      by: ['category'],
      where: { brandName: ownBrandName, sentiment: '积极' },
      _count: { category: true },
    });

    // 获取本品消极反馈的分类统计
    const ownNegative = await prisma.feedback.groupBy({
      by: ['category'],
      where: { brandName: ownBrandName, sentiment: '消极' },
      _count: { category: true },
    });

    // 获取竞品消极反馈的分类统计
    const compNegative = await prisma.feedback.groupBy({
      by: ['category', 'brandName'],
      where: { brandName: { not: ownBrandName }, sentiment: '消极' },
      _count: { category: true },
    });

    // 获取本品已有的分类集合
    const ownCategories = new Set(ownNegative.map((x) => x.category));

    // 构建优势列表（本品积极反馈Top分类）
    const advantages = ownPositive
      .sort((a, b) => b._count.category - a._count.category)
      .slice(0, 3)
      .map((item) => ({
        title: `${item.category}获好评`,
        description: `本品在${item.category}维度的正面反馈共${item._count.category}条，用户认可度较高`,
        impact: item._count.category >= 10 ? 'high' : 'medium',
      }));

    // 构建劣势列表（本品消极反馈Top分类）
    const disadvantages = ownNegative
      .sort((a, b) => b._count.category - a._count.category)
      .slice(0, 3)
      .map((item) => ({
        title: `${item.category}待改进`,
        description: `本品在${item.category}维度的负面反馈共${item._count.category}条，建议重点关注`,
        impact: item._count.category >= 10 ? 'high' : 'medium',
      }));

    // 构建机会列表（竞品消极反馈中本品未覆盖的分类）
    const opportunities = compNegative
      .filter((item) => !ownCategories.has(item.category))
      .sort((a, b) => b._count.category - a._count.category)
      .slice(0, 3)
      .map((item) => ({
        title: `${item.brandName || '竞品'}${item.category}问题`,
        description: `${item.brandName || '竞品'}在${item.category}维度有${item._count.category}条负面反馈，本品目前未涉及该痛点`,
        action: `评估本品${item.category}能力，针对性营销`,
      }));

    // 生成总结
    const advNames = advantages.map((a) => a.title.replace('获好评', '')).join('、');
    const disNames = disadvantages.map((d) => d.title.replace('待改进', '')).join('、');
    const oppNames = opportunities.map((o) => o.title).join('、');

    const aiSummary = [
      advNames && `本品在${advNames}方面具有竞争优势`,
      disNames && `但在${disNames}方面存在改进空间`,
      oppNames && `当前市场机会在于${oppNames}，建议针对性布局`,
    ]
      .filter(Boolean)
      .join('，') + '。';

    return NextResponse.json({
      advantages,
      disadvantages,
      opportunities,
      aiSummary: aiSummary || '暂无足够数据生成洞察，请上传更多反馈数据。',
    });
  } catch (error) {
    console.error('获取机会洞察失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
