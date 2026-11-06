import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/competitor/feedback
 * 获取竞品反馈列表（仅 brand != 'own' 的数据）
 * 支持筛选：sentiment, urgency, source, brand(具体竞品品牌code), search
 * 返回对标本品信息（通过 productId 外键关联）
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const sentiment = searchParams.get('sentiment');
    const urgency = searchParams.get('urgency');
    const source = searchParams.get('source');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');

    const where: any = { brand: { not: 'own' } };

    if (sentiment) where.sentiment = sentiment;
    if (urgency) where.urgency = urgency;
    if (source) where.source = source;
    if (brand) where.brand = brand;
    if (search) {
      where.OR = [
        { rawContent: { contains: search } },
        { coreIssue: { contains: search } },
      ];
    }

    const [feedbacks, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
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
    console.error('获取竞品反馈失败:', error);
    return NextResponse.json({ error: '获取失败' }, { status: 500 });
  }
}
