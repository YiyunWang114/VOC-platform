import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // 获取来源列表
    if (searchParams.get('sources') === 'true') {
      const sources = await prisma.feedback.findMany({
        select: { source: true },
        distinct: ['source'],
      });
      return NextResponse.json({
        data: sources.map((s) => s.source).filter(Boolean),
      });
    }

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const sentiment = searchParams.get('sentiment');
    const category = searchParams.get('category');
    const urgency = searchParams.get('urgency');
    const source = searchParams.get('source');
    const productId = searchParams.get('productId');
    const search = searchParams.get('search');
    const churnRiskMin = searchParams.get('churnRiskMin');
    const churnRiskMax = searchParams.get('churnRiskMax');
    const brandType = searchParams.get('brandType'); // 'own' | 'competitor' | 'all'

    const where: any = {};

    // 本品/竞品筛选
    if (brandType === 'own') {
      where.brand = 'own';
    } else if (brandType === 'competitor') {
      where.brand = { not: 'own' };
    }
    // brandType === 'all' 或不存在时，不添加 brand 过滤

    if (sentiment) where.sentiment = sentiment;
    if (category) where.category = category;
    if (urgency) where.urgency = urgency;
    if (source) where.source = source;
    if (productId) where.productCode = productId;
    const linkedProductCode = searchParams.get('linkedProductCode');
    if (linkedProductCode) {
      where.product = { code: linkedProductCode };
    }
    if (search) {
      where.OR = [
        { rawContent: { contains: search } },
        { coreIssue: { contains: search } },
      ];
    }
    if (churnRiskMin || churnRiskMax) {
      where.churnRisk = {};
      if (churnRiskMin) where.churnRisk.gte = parseInt(churnRiskMin);
      if (churnRiskMax) where.churnRisk.lte = parseInt(churnRiskMax);
    }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          tickets: true,
          product: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    return NextResponse.json({
      data: feedbacks,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('获取反馈列表失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}

// 单条删除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少id参数' }, { status: 400 });
    }

    // 先删除关联的工单
    await prisma.ticket.deleteMany({ where: { feedbackId: id } });
    // 再删除反馈
    await prisma.feedback.delete({ where: { id } });

    return NextResponse.json({ success: true, message: '删除成功' });
  } catch (error) {
    console.error('删除反馈失败:', error);
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}

// 批量删除
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ids } = body;

    if (action === 'batch_delete') {
      if (!Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ error: 'ids不能为空' }, { status: 400 });
      }

      // 先删除关联的工单
      await prisma.ticket.deleteMany({ where: { feedbackId: { in: ids } } });
      // 再批量删除反馈
      const result = await prisma.feedback.deleteMany({ where: { id: { in: ids } } });

      return NextResponse.json({
        success: true,
        message: `成功删除 ${result.count} 条反馈`,
        count: result.count,
      });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('批量操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}

// 修复本品反馈的 productId 关联
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'fix-product-links') {
      // 查找所有本品数据中 productCode 有值但 productId 为空的反馈
      const unlinkedFeedbacks = await prisma.feedback.findMany({
        where: {
          brand: 'own',
          productCode: { not: null },
          productId: null,
        },
      });

      let fixedCount = 0;
      for (const fb of unlinkedFeedbacks) {
        const product = await prisma.product.findUnique({
          where: { code: fb.productCode! },
        });
        if (product) {
          await prisma.feedback.update({
            where: { id: fb.id },
            data: { productId: product.id },
          });
          fixedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `修复完成：共 ${unlinkedFeedbacks.length} 条未关联，成功关联 ${fixedCount} 条`,
        total: unlinkedFeedbacks.length,
        fixed: fixedCount,
      });
    }

    return NextResponse.json({ error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('修复操作失败:', error);
    return NextResponse.json({ error: '操作失败' }, { status: 500 });
  }
}
