import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    // 构建反馈查询条件
    const feedbackWhere = productId ? { productId } : {};

    // 情绪分布统计
    const sentimentStats = await prisma.feedback.groupBy({
      by: ['sentiment'],
      where: feedbackWhere,
      _count: { sentiment: true },
    });

    // 业务分类统计（Top 5）
    const categoryStats = await prisma.feedback.groupBy({
      by: ['category'],
      where: feedbackWhere,
      _count: { category: true },
      orderBy: { _count: { category: 'desc' } },
      take: 5,
    });

    // 渠道声量对比
    const sourceStats = await prisma.feedback.groupBy({
      by: ['source'],
      where: feedbackWhere,
      _count: { source: true },
    });

    // 紧急程度分布
    const urgencyStats = await prisma.feedback.groupBy({
      by: ['urgency'],
      where: feedbackWhere,
      _count: { urgency: true },
    });

    // 工单状态统计（关联到筛选的反馈）
    let ticketWhere = {};
    if (productId) {
      const feedbackIds = await prisma.feedback.findMany({
        where: { productId },
        select: { id: true },
      });
      ticketWhere = { feedbackId: { in: feedbackIds.map(f => f.id) } };
    }
    const ticketStats = await prisma.ticket.groupBy({
      by: ['status'],
      where: ticketWhere,
      _count: { status: true },
    });

    // 商品维度统计（Top 10）- 如果已筛选产品则只显示该产品
    let productStats;
    if (productId) {
      // 已筛选特定产品，显示该产品的各品类分布
      const productCategoryStats = await prisma.feedback.groupBy({
        by: ['category'],
        where: { productId },
        _count: { category: true },
        orderBy: { _count: { category: 'desc' } },
        take: 10,
      });
      // 获取产品名称
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { name: true },
      });
      productStats = productCategoryStats.map(c => ({
        name: c.category,
        value: c._count.category,
      }));
      // 添加产品名称到结果中供前端使用
      (productStats as any).productName = product?.name || '未知产品';
    } else {
      // 全局统计，按产品聚合
      const rawProductStats = await prisma.feedback.groupBy({
        by: ['productId'],
        _count: { productId: true },
        orderBy: { _count: { productId: 'desc' } },
        take: 10,
      });
      // 获取产品名称映射
      const productIds = rawProductStats.map(p => p.productId).filter(Boolean) as string[];
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true },
      });
      const productNameMap = new Map(products.map(p => [p.id, p.name]));
      productStats = rawProductStats.map(p => ({
        name: productNameMap.get(p.productId!) || p.productId || '未关联产品',
        value: p._count.productId,
      }));
    }

    // 最近7天趋势
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentFeedbacks = await prisma.feedback.findMany({
      where: {
        ...feedbackWhere,
        createdAt: { gte: sevenDaysAgo },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 按天聚合
    const dailyStats: Record<string, { positive: number; neutral: number; negative: number }> = {};
    recentFeedbacks.forEach(feedback => {
      const date = feedback.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { positive: 0, neutral: 0, negative: 0 };
      }
      if (feedback.sentiment === '积极') dailyStats[date].positive++;
      else if (feedback.sentiment === '中性') dailyStats[date].neutral++;
      else dailyStats[date].negative++;
    });

    // 获取所有产品列表（供前端选择器使用）
    const allProducts = await prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      sentimentDistribution: sentimentStats.map(s => ({
        name: s.sentiment,
        value: s._count.sentiment,
      })),
      categoryDistribution: categoryStats.map(c => ({
        name: c.category,
        value: c._count.category,
      })),
      sourceDistribution: sourceStats.map(s => ({
        name: s.source,
        value: s._count.source,
      })),
      urgencyDistribution: urgencyStats.map(u => ({
        name: u.urgency,
        value: u._count.urgency,
      })),
      ticketDistribution: ticketStats.map(t => ({
        name: t.status,
        value: t._count.status,
      })),
      productDistribution: productStats,
      dailyTrend: Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        ...stats,
      })),
      products: allProducts,
      selectedProductId: productId,
      selectedProductName: (productStats as any).productName || null,
    });
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
