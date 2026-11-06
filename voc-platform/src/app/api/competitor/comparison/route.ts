import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 固定对比维度
const FIXED_DIMENSIONS = ['产品质量', '价格', '包装'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const productId = searchParams.get('productId');

    const since = new Date();
    since.setDate(since.getDate() - days);

    // 获取产品信息（code 用于查本品，id 用于查竞品）
    let productCode: string | null = null;
    let productName = '未知产品';
    if (productId) {
      const productInfo = await prisma.product.findUnique({
        where: { id: productId },
        select: { code: true, name: true },
      });
      productCode = productInfo?.code || null;
      productName = productInfo?.name || '未知产品';
    }

    // ========== 查询本品数据 ==========
    // 策略1：尝试查找 brand='own' 且 productCode 匹配的本品数据
    const ownWhere: any = {
      createdAt: { gte: since },
      brand: 'own',
    };
    if (productCode) ownWhere.productCode = productCode;

    let ownFeedbacks = await prisma.feedback.findMany({ where: ownWhere });

    // 策略2：如果没有找到本品数据，将该产品下所有反馈聚合作为"本品"
    // （因为当前数据集中所有反馈都是关于该产品的VoC数据）
    let isSyntheticOwn = false;
    if (ownFeedbacks.length === 0 && productId) {
      const allProductWhere = { createdAt: { gte: since }, productId };
      ownFeedbacks = await prisma.feedback.findMany({ where: allProductWhere });
      isSyntheticOwn = true;
    }

    const ownTotal = ownFeedbacks.length;
    const ownPositive = ownFeedbacks.filter(f => f.sentiment === '积极').length;
    const ownNeutral = ownFeedbacks.filter(f => f.sentiment === '中性').length;
    const ownNegative = ownFeedbacks.filter(f => f.sentiment === '消极').length;

    // 本品分类统计
    const ownCategoryStats = await prisma.feedback.groupBy({
      by: ['category', 'sentiment'],
      where: isSyntheticOwn && productId
        ? { createdAt: { gte: since }, productId }
        : ownWhere,
      _count: { category: true },
    });
    const ownCategoryMap: Record<string, { total: number; positive: number; negative: number; neutral: number }> = {};
    ownCategoryStats.forEach(c => {
      if (!ownCategoryMap[c.category]) ownCategoryMap[c.category] = { total: 0, positive: 0, negative: 0, neutral: 0 };
      ownCategoryMap[c.category].total += c._count.category;
      if (c.sentiment === '积极') ownCategoryMap[c.category].positive += c._count.category;
      if (c.sentiment === '消极') ownCategoryMap[c.category].negative += c._count.category;
      if (c.sentiment === '中性') ownCategoryMap[c.category].neutral += c._count.category;
    });

    // 本品维度得分（固定维度）
    const ownDimensionScores = FIXED_DIMENSIONS.map(category => {
      const stats = ownCategoryMap[category] || { total: 0, positive: 0, negative: 0 };
      const score = stats.total > 0
        ? Math.round(((stats.positive - stats.negative) / stats.total) * 50 + 50)
        : 50;
      return {
        category,
        score,
        positiveRate: stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0,
        negativeRate: stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0,
      };
    });

    // 本品紧急度
    const ownUrgency = await prisma.feedback.groupBy({
      by: ['urgency'],
      where: isSyntheticOwn && productId
        ? { createdAt: { gte: since }, productId }
        : ownWhere,
      _count: { urgency: true },
    });

    // ========== 查询竞品数据 ==========
    // 竞品：brand != 'own' 且 productId 匹配
    const compWhere: any = {
      createdAt: { gte: since },
      brand: { not: 'own' },
    };
    if (productId) compWhere.productId = productId;

    // 获取竞品品牌列表
    const compBrandList = await prisma.feedback.groupBy({
      by: ['brand', 'brandName'],
      where: compWhere,
      _count: { brand: true },
    });

    // 逐个查询竞品数据
    const competitors = await Promise.all(
      compBrandList.map(async (b) => {
        const brandWhere = { ...compWhere, brand: b.brand };

        const stats = await prisma.feedback.groupBy({
          by: ['sentiment'],
          where: brandWhere,
          _count: { sentiment: true },
          _avg: { rating: true },
        });

        const catStats = await prisma.feedback.groupBy({
          by: ['category', 'sentiment'],
          where: brandWhere,
          _count: { category: true },
        });
        const catMap: Record<string, { total: number; positive: number; negative: number }> = {};
        catStats.forEach(c => {
          if (!catMap[c.category]) catMap[c.category] = { total: 0, positive: 0, negative: 0 };
          catMap[c.category].total += c._count.category;
          if (c.sentiment === '积极') catMap[c.category].positive += c._count.category;
          if (c.sentiment === '消极') catMap[c.category].negative += c._count.category;
        });

        const total = stats.reduce((s, i) => s + i._count.sentiment, 0);
        const positive = stats.find(s => s.sentiment === '积极')?._count.sentiment || 0;
        const neutral = stats.find(s => s.sentiment === '中性')?._count.sentiment || 0;
        const negative = stats.find(s => s.sentiment === '消极')?._count.sentiment || 0;

        // 竞品维度得分（固定维度）
        const dimensionScores = FIXED_DIMENSIONS.map(category => {
          const s = catMap[category] || { total: 0, positive: 0, negative: 0 };
          const score = s.total > 0
            ? Math.round(((s.positive - s.negative) / s.total) * 50 + 50)
            : 50;
          return { category, score };
        });

        return {
          code: b.brand,
          name: b.brandName || b.brand,
          totalFeedback: total,
          avgRating: stats[0]?._avg.rating ? Number(stats[0]._avg.rating).toFixed(1) : '-',
          sentimentPercent: {
            positive: total > 0 ? Math.round((positive / total) * 100) : 0,
            neutral: total > 0 ? Math.round((neutral / total) * 100) : 0,
            negative: total > 0 ? Math.round((negative / total) * 100) : 0,
          },
          dimensionScores,
        };
      })
    );

    // ========== 组装本品数据 ==========
    const ownProduct = {
      name: productName,
      totalFeedback: ownTotal,
      sentimentPercent: {
        positive: ownTotal > 0 ? Math.round((ownPositive / ownTotal) * 100) : 0,
        neutral: ownTotal > 0 ? Math.round((ownNeutral / ownTotal) * 100) : 0,
        negative: ownTotal > 0 ? Math.round((ownNegative / ownTotal) * 100) : 0,
      },
      dimensionScores: ownDimensionScores,
      categoryBreakdown: Object.entries(ownCategoryMap).map(([category, stats]) => ({
        category,
        ...stats,
        positiveRate: stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0,
        negativeRate: stats.total > 0 ? Math.round((stats.negative / stats.total) * 100) : 0,
      })).sort((a, b) => b.total - a.total),
      urgencyDistribution: ownUrgency.map(u => ({
        level: u.urgency,
        count: u._count.urgency,
      })),
    };

    // ========== 计算差距分析 ==========
    const gaps = [];
    if (competitors.length > 0) {
      const compNegAvg = competitors.reduce((sum, c) => sum + c.sentimentPercent.negative, 0) / competitors.length;
      const compPosAvg = competitors.reduce((sum, c) => sum + c.sentimentPercent.positive, 0) / competitors.length;

      if (Math.abs(ownProduct.sentimentPercent.negative - compNegAvg) > 5) {
        gaps.push({
          dimension: '负面情绪占比',
          ownScore: ownProduct.sentimentPercent.negative,
          competitorScore: Math.round(compNegAvg),
          gap: Math.round(ownProduct.sentimentPercent.negative - compNegAvg),
          severity: Math.abs(ownProduct.sentimentPercent.negative - compNegAvg) > 15 ? 'high' : 'medium',
        });
      }

      if (Math.abs(ownProduct.sentimentPercent.positive - compPosAvg) > 5) {
        gaps.push({
          dimension: '积极情绪占比',
          ownScore: ownProduct.sentimentPercent.positive,
          competitorScore: Math.round(compPosAvg),
          gap: Math.round(ownProduct.sentimentPercent.positive - compPosAvg),
          severity: Math.abs(ownProduct.sentimentPercent.positive - compPosAvg) > 15 ? 'high' : 'medium',
        });
      }

      // 各固定维度差距
      FIXED_DIMENSIONS.forEach(dim => {
        const ownDim = ownProduct.dimensionScores.find(d => d.category === dim);
        const compScores = competitors.map(c => c.dimensionScores.find(d => d.category === dim)?.score || 50);
        const compAvg = compScores.reduce((a, b) => a + b, 0) / compScores.length;
        const ownScore = ownDim?.score || 50;
        if (Math.abs(ownScore - compAvg) > 5) {
          gaps.push({
            dimension: dim,
            ownScore,
            competitorScore: Math.round(compAvg),
            gap: Math.round(ownScore - compAvg),
            severity: Math.abs(ownScore - compAvg) > 15 ? 'high' : 'medium',
          });
        }
      });

      gaps.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap));
    }

    return NextResponse.json({ ownProduct, competitors, gaps });
  } catch (error) {
    console.error('竞品对比分析失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
